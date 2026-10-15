import type { APIRoute } from "astro";
import { categories } from "../../data/categories";
import { links } from "../../data/links";

type Provider = "gemini" | "deepseek" | "qwen";

const providers: Provider[] = ["gemini", "deepseek", "qwen"];

function providerOrder(): Provider[] {
    const configured = (import.meta.env.AI_PROVIDER_ORDER || "")
        .split(",")
        .map((name: string) => name.trim().toLowerCase())
        .filter((name: string): name is Provider => providers.includes(name as Provider));
    return [...new Set([...configured, ...providers])];
}

function catalogForPrompt(locale: "es" | "en") {
    return links.map((link) => ({
        id: link.id,
        name: link.name,
        category:
            categories.find((category) => category.id === link.category)?.name[locale] ||
            link.category,
        description: link.desc[locale],
        tags: link.tags,
    }));
}

function promptFor(query: string, locale: "es" | "en") {
    const language = locale === "es" ? "Spanish" : "English";
    return `You rank resources from a curated directory. Understand the user's intent, including synonyms and natural language. Return only valid JSON: {"ids":["id-1","id-2"]}. Order ids from best to worst, maximum 10, and use only ids from the catalog. Do not explain anything. Answer in ${language}.

User request: ${query}

Catalog:
${JSON.stringify(catalogForPrompt(locale))}`;
}

function extractIds(text: string): string[] {
    const cleaned = text.replace(/^```(?:json)?\s*|\s*```$/g, "").trim();
    try {
        const parsed = JSON.parse(cleaned) as { ids?: unknown };
        return Array.isArray(parsed.ids)
            ? parsed.ids.filter((id): id is string => typeof id === "string")
            : [];
    } catch {
        return [];
    }
}

async function askProvider(provider: Provider, prompt: string): Promise<string> {
    if (provider === "gemini") {
        const key = import.meta.env.GEMINI_API_KEY;
        if (!key) throw new Error("GEMINI_API_KEY is missing");
        const model = import.meta.env.GEMINI_MODEL || "gemini-3.8-flash";
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: { temperature: 0.1, responseMimeType: "application/json" },
                }),
            },
        );
        if (!response.ok) throw new Error(`Gemini returned ${response.status}`);
        const data = await response.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    }

    const key = provider === "deepseek" ? import.meta.env.DEEPSEEK_API_KEY : import.meta.env.QWEN_API_KEY;
    if (!key) throw new Error(`${provider.toUpperCase()}_API_KEY is missing`);
    const baseUrl = provider === "deepseek"
        ? "https://api.deepseek.com/v1"
        : import.meta.env.QWEN_BASE_URL || "https://dashscope-intl.aliyuncs.com/compatible-mode/v1";
    const model = provider === "deepseek"
        ? import.meta.env.DEEPSEEK_MODEL || "deepseek-chat"
        : import.meta.env.QWEN_MODEL || "qwen-plus";
    const response = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
        body: JSON.stringify({
            model,
            temperature: 0.1,
            messages: [
                { role: "system", content: "Return only the JSON object requested by the user." },
                { role: "user", content: prompt },
            ],
        }),
    });
    if (!response.ok) throw new Error(`${provider} returned ${response.status}`);
    const data = await response.json();
    return data.choices?.[0]?.message?.content || "";
}

export const POST: APIRoute = async ({ request }) => {
    try {
        const body = await request.json();
        const query = typeof body.query === "string" ? body.query.trim().slice(0, 500) : "";
        const locale = body.locale === "en" ? "en" : "es";
        if (query.length < 2) return new Response(JSON.stringify({ ids: [] }), { status: 200 });

        const prompt = promptFor(query, locale);
        for (const provider of providerOrder()) {
            try {
                const ids = extractIds(await askProvider(provider, prompt));
                const validIds = new Set(links.map((link) => link.id));
                const ranked = [...new Set(ids)].filter((id) => validIds.has(id)).slice(0, 10);
                if (ranked.length) {
                    return new Response(JSON.stringify({ ids: ranked, provider }), {
                        status: 200,
                        headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
                    });
                }
            } catch {
                // Try the next configured provider when a key is missing or a quota is exhausted.
            }
        }
        return new Response(JSON.stringify({ ids: [], error: "No AI provider available" }), { status: 503 });
    } catch {
        return new Response(JSON.stringify({ ids: [], error: "Invalid request" }), { status: 400 });
    }
};