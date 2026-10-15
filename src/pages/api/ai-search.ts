import type { APIRoute } from "astro";
import { categories } from "../../data/categories";
import { links } from "../../data/links";

type Provider = "gemini" | "deepseek" | "qwen";

const providers: Provider[] = ["gemini", "deepseek", "qwen"];

/** Cada intento corta a los 15s; la búsqueda completa no pasa de 35s. */
const ATTEMPT_TIMEOUT_MS = 15_000;
const TOTAL_BUDGET_MS = 35_000;

/** La cuota gratis de Gemini son ~20 peticiones al día por modelo: repetir
 *  una misma búsqueda no debe volver a gastar presupuesto. */
const CACHE_TTL_MS = 15 * 60 * 1000;
const CACHE_MAX = 200;
const resultCache = new Map<string, { ids: string[]; at: number }>();

const DEFAULT_GEMINI_MODELS = [
    "gemini-3.8-flash",
    "gemini-flash-latest",
    "gemini-3.5-flash-lite",
    "gemini-3.1-flash-lite",
];

function providerOrder(): Provider[] {
    const configured = (import.meta.env.AI_PROVIDER_ORDER || "")
        .split(",")
        .map((name: string) => name.trim().toLowerCase())
        .filter((name: string): name is Provider => providers.includes(name as Provider));
    return [...new Set([...configured, ...providers])];
}

/** La cuota es por modelo: si el modelo principal se queda sin presupuesto
 *  (o devuelve 503), se baja a la siguiente alternativa disponible. */
function geminiModels(): string[] {
    const fromEnv = (import.meta.env.GEMINI_MODELS || "")
        .split(",")
        .map((name: string) => name.trim())
        .filter(Boolean);
    const primary = (import.meta.env.GEMINI_MODEL || "").trim();
    const base = fromEnv.length ? fromEnv : DEFAULT_GEMINI_MODELS;
    return [...new Set([primary, ...base].filter(Boolean))];
}

function cacheKey(locale: "es" | "en", query: string) {
    return `${locale}|${query.toLowerCase().replace(/\s+/g, " ").trim()}`;
}

function readCache(key: string): string[] | null {
    const hit = resultCache.get(key);
    if (!hit) return null;
    if (Date.now() - hit.at > CACHE_TTL_MS) {
        resultCache.delete(key);
        return null;
    }
    return hit.ids;
}

function writeCache(key: string, ids: string[]) {
    if (resultCache.size >= CACHE_MAX) {
        const oldest = resultCache.keys().next().value;
        if (oldest !== undefined) resultCache.delete(oldest);
    }
    resultCache.set(key, { ids, at: Date.now() });
}

/** Catálogo en líneas compactas (`id | nombre | categoría | tags | descripción`):
 *  baja mucho el prompt frente a JSON con claves largas. */
function catalogForPrompt(locale: "es" | "en") {
    const clean = (value: string) => value.replace(/\s+/g, " ").replace(/[|~]/g, "/").trim();
    return links
        .map((link) => {
            const category =
                categories.find((category) => category.id === link.category)?.name[locale] ||
                link.category;
            return [
                link.id,
                clean(link.name),
                clean(category),
                clean(link.tags.join(", ")),
                clean(link.desc[locale] || "").slice(0, 120),
            ].join(" | ");
        })
        .join("\n");
}

function promptFor(query: string, locale: "es" | "en") {
    return `Rank the resources of a curated directory for the user request below. Understand intent, synonyms and natural language.

Reply with ONLY this JSON object and nothing else: {"ids":["id-1","id-2"]}
Rules: ids from the catalog only, ordered best to worst, maximum 10, no prose, no code fences, no explanations.

User request: ${query}

Catalog (id | name | category | tags | description):
${catalogForPrompt(locale)}`;
}

/** Tolerante a vallas de código, prosa alrededor y JSON mal formateado. */
function extractIds(text: string): string[] {
    if (!text) return [];
    const unfenced = text.replace(/```[a-z]*/gi, " ");

    const start = unfenced.indexOf("{");
    if (start >= 0) {
        let depth = 0;
        for (let i = start; i < unfenced.length; i += 1) {
            if (unfenced[i] === "{") depth += 1;
            else if (unfenced[i] === "}") {
                depth -= 1;
                if (depth === 0) {
                    const parsed = parseIds(unfenced.slice(start, i + 1));
                    if (parsed.length) return parsed;
                    break;
                }
            }
        }
    }

    const fallback = parseIds(unfenced);
    if (fallback.length) return fallback;

    const idsMatch = unfenced.match(/"ids"\s*:\s*\[([\s\S]*?)\]/);
    if (!idsMatch) return [];
    return idsMatch[1]
        .split(",")
        .map((entry) => entry.trim().replace(/^["']|["']$/g, ""))
        .filter(Boolean);
}

function parseIds(candidate: string): string[] {
    try {
        const parsed = JSON.parse(candidate.trim()) as { ids?: unknown };
        return Array.isArray(parsed.ids)
            ? parsed.ids.filter((id): id is string => typeof id === "string")
            : [];
    } catch {
        return [];
    }
}

async function callWithTimeout(url: string, init: RequestInit, timeoutMs: number) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
        return await fetch(url, { ...init, signal: controller.signal });
    } finally {
        clearTimeout(timer);
    }
}

async function askGemini(model: string, prompt: string, timeoutMs: number): Promise<string> {
    const key = import.meta.env.GEMINI_API_KEY;
    if (!key) throw new Error("GEMINI_API_KEY is missing");
    const response = await callWithTimeout(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature: 0.1,
                    responseMimeType: "application/json",
                    maxOutputTokens: 512,
                },
            }),
        },
        timeoutMs,
    );
    if (!response.ok) throw new Error(`${model} returned ${response.status}`);
    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
}

async function askOpenAICompatible(
    provider: Exclude<Provider, "gemini">,
    prompt: string,
    timeoutMs: number,
): Promise<string> {
    const key =
        provider === "deepseek" ? import.meta.env.DEEPSEEK_API_KEY : import.meta.env.QWEN_API_KEY;
    if (!key) throw new Error(`${provider.toUpperCase()}_API_KEY is missing`);
    const baseUrl =
        provider === "deepseek"
            ? "https://api.deepseek.com/v1"
            : import.meta.env.QWEN_BASE_URL || "https://dashscope-intl.aliyuncs.com/compatible-mode/v1";
    const model =
        provider === "deepseek"
            ? import.meta.env.DEEPSEEK_MODEL || "deepseek-chat"
            : import.meta.env.QWEN_MODEL || "qwen-plus";
    const response = await callWithTimeout(
        `${baseUrl}/chat/completions`,
        {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
            body: JSON.stringify({
                model,
                temperature: 0.1,
                max_tokens: 512,
                messages: [
                    { role: "system", content: "Return only the JSON object requested by the user." },
                    { role: "user", content: prompt },
                ],
            }),
        },
        timeoutMs,
    );
    if (!response.ok) throw new Error(`${provider} returned ${response.status}`);
    const data = await response.json();
    return data.choices?.[0]?.message?.content || "";
}

function ok(ids: string[], extra: Record<string, unknown> = {}) {
    return new Response(JSON.stringify({ ids, ...extra }), {
        status: 200,
        headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    });
}

export const POST: APIRoute = async ({ request }) => {
    try {
        const body = await request.json();
        const query = typeof body.query === "string" ? body.query.trim().slice(0, 500) : "";
        const locale = body.locale === "en" ? "en" : "es";
        if (query.length < 2) return ok([]);

        const key = cacheKey(locale, query);
        const cached = readCache(key);
        if (cached) return ok(cached, { cached: true });

        const prompt = promptFor(query, locale);
        const validIds = new Set(links.map((link) => link.id));
        const deadline = Date.now() + TOTAL_BUDGET_MS;

        const attempts: { provider: Provider; model: string }[] = [];
        for (const provider of providerOrder()) {
            if (provider === "gemini") {
                geminiModels().forEach((model) => attempts.push({ provider, model }));
            } else if (provider === "deepseek") {
                attempts.push({ provider, model: import.meta.env.DEEPSEEK_MODEL || "deepseek-chat" });
            } else {
                attempts.push({ provider, model: import.meta.env.QWEN_MODEL || "qwen-plus" });
            }
        }

        for (const attempt of attempts) {
            const remaining = deadline - Date.now();
            if (remaining <= 0) break;
            try {
                const timeoutMs = Math.min(ATTEMPT_TIMEOUT_MS, remaining);
                const output =
                    attempt.provider === "gemini"
                        ? await askGemini(attempt.model, prompt, timeoutMs)
                        : await askOpenAICompatible(attempt.provider, prompt, timeoutMs);
                const ids = extractIds(output);
                const ranked = [...new Set(ids)].filter((id) => validIds.has(id)).slice(0, 10);
                if (ranked.length) {
                    writeCache(key, ranked);
                    return ok(ranked, attempt);
                }
            } catch {
                // Modelo sin cuota, caído o lento: se prueba el siguiente.
            }
        }

        // Sin proveedor usable (cuota agotada/503): 200 con aviso para que la
        // UI muestre resultados locales en vez de un error en pantalla.
        return ok([], { degraded: true, error: "No AI provider available" });
    } catch {
        return new Response(JSON.stringify({ ids: [], error: "Invalid request" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
        });
    }
};
