import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { Locale } from "../../i18n/ui";
import { createT } from "../../i18n/ui";
import { MorphIcon } from "morphicons/react";
import {Search, Send } from "lucide";

export interface SearchItem {
  id: string;
  url: string;
  name: string;
  category: string;
  catName: string;
  desc: string;
  tags: string[];
}

interface Props {
  items: SearchItem[];
  locale: Locale;
}

type AiState = "idle" | "loading" | "ready" | "empty" | "error";

function faviconUrl(url: string): string {
  try {
    const domain = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
  } catch {
    return "/favicon.svg";
  }
}

function score(item: SearchItem, q: string): number {
  const name = item.name.toLowerCase();
  const desc = item.desc.toLowerCase();
  const tags = item.tags.join(" ").toLowerCase();
  const cat = item.category.toLowerCase();
  const catName = item.catName.toLowerCase();

  if (name === q) return 100;
  if (name.startsWith(q)) return 80;
  if (name.includes(q)) return 60;
  if (tags.includes(q)) return 45;
  if (desc.includes(q)) return 30;
  if (cat.includes(q) || catName.includes(q)) return 20;

  const tokens = q.split(/[\s&,·]+/).filter(Boolean);
  if (tokens.length > 1) {
    const inName = tokens.every((tk) => name.includes(tk));
    const inMeta = tokens.every(
      (tk) => tags.includes(tk) || catName.includes(tk) || cat.includes(tk),
    );
    const inAll = tokens.every(
      (tk) =>
        name.includes(tk) ||
        tags.includes(tk) ||
        desc.includes(tk) ||
        cat.includes(tk) ||
        catName.includes(tk),
    );
    if (inName) return 55;
    if (inMeta) return 40;
    if (inAll) return 25;
  }
  return 0;
}

const SearchPalette: React.FC<Props> = ({ items, locale }) => {
  const t = createT(locale);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [aiMode, setAiMode] = useState(false);
  const [aiIds, setAiIds] = useState<string[] | null>(null);
  const [aiState, setAiState] = useState<AiState>("idle");
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const localResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = q
      ? items
          .map((item) => ({ item, s: score(item, q) }))
          .filter((r) => r.s > 0)
          .sort((a, b) => b.s - a.s)
          .map((r) => r.item)
      : items;
    return base.slice(0, 30);
  }, [items, query]);

  const results = useMemo(() => {
    if (!aiIds) return localResults;
    const byId = new Map(items.map((item) => [item.id, item]));
    return aiIds
      .map((id) => byId.get(id))
      .filter((item): item is SearchItem => Boolean(item));
  }, [aiIds, items, localResults]);

  const rememberSearch = useCallback(
    (searchQuery: string, resultItems: SearchItem[]) => {
      window.dispatchEvent(
        new CustomEvent("toolsbuild:search-history", {
          detail: {
            query: searchQuery,
            ids: resultItems.map((item) => item.id),
          },
        }),
      );
    },
    [],
  );

  const submitAISearch = useCallback(async () => {
    const cleanQuery = query.trim();
    if (!aiMode || cleanQuery.length < 2 || aiState === "loading") return;

    setAiIds(null);
    setAiState("loading");
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 45_000);
    const fallbackSearches = localResults;
    try {
      const response = await fetch("/api/ai-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: cleanQuery, locale }),
        signal: controller.signal,
      });
      if (!response.ok) throw new Error("AI search unavailable");
      const data = (await response.json()) as { ids?: string[]; degraded?: boolean };
      const ids = data.degraded ? [] : (data.ids ?? []).slice(0, 10);

      if (!ids.length) {
        // Sin IA (cuota agotada o proveedor caído): se dejan los resultados
        // locales y se avisa, en lugar de dejar la lista vacía.
        setAiIds(null);
        setAiState(data.degraded || data.ids === undefined ? "error" : "empty");
        rememberSearch(cleanQuery, data.degraded ? fallbackSearches : []);
        return;
      }

      const resolved = ids
        .map((id) => items.find((item) => item.id === id))
        .filter((item): item is SearchItem => Boolean(item));
      setAiIds(ids);
      setAiState("ready");
      rememberSearch(cleanQuery, resolved);
    } catch {
      setAiIds(null);
      setAiState("error");
      rememberSearch(cleanQuery, fallbackSearches);
    } finally {
      window.clearTimeout(timer);
    }
  }, [aiMode, aiState, items, locale, localResults, query, rememberSearch]);

  const open_ = useCallback((initialQuery = "") => {
    setOpen(true);
    setQuery(initialQuery);
    setAiMode(false);
    setAiIds(null);
    setAiState("idle");
    setActive(0);
  }, []);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "Escape") setOpen(false);
    };
    const onCustom = (event: Event) => {
      const query = (event as CustomEvent<{ query?: string }>).detail?.query;
      open_(query || "");
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("toolsbuild:search", onCustom as EventListener);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener(
        "toolsbuild:search",
        onCustom as EventListener,
      );
    };
  }, [open_]);

  useEffect(() => {
    if (open) {
      const id = requestAnimationFrame(() => inputRef.current?.focus());
      document.documentElement.style.overflow = "hidden";
      return () => {
        cancelAnimationFrame(id);
        document.documentElement.style.overflow = "";
      };
    }
  }, [open]);

  useEffect(() => setActive(0), [query]);

  const onInputKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && aiMode) {
      e.preventDefault();
      void submitAISearch();
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const item = results[active];
      if (item) {
        const cleanQuery = query.trim();
        if (cleanQuery) {
          rememberSearch(cleanQuery, results);
        }
        window.open(item.url, "_blank", "noopener,noreferrer");
      }
    }
  };

  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(
      `[data-idx="${active}"]`,
    );
    el?.scrollIntoView({ block: "nearest" });
  }, [active]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-[12vh]"
      role="dialog"
      aria-modal="true"
      aria-label={t("search.title")}
    >
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={close}
      />

      <div className="relative w-full max-w-xl overflow-hidden rounded-xl  bg-surface shadow-2xl">
        <div className="flex items-center gap-3 px-4">
          <MorphIcon
            icon={Search}
            size={15}
            strokeWidth={2}
            className="shrink-0 text-muted"
          />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              if (aiMode) {
                setAiIds(null);
                setAiState("idle");
              }
            }}
            onKeyDown={onInputKey}
            placeholder={t("search.placeholder")}
            className="h-12 w-full bg-transparent text-[14px] text-ink outline-none placeholder:text-muted"
            autoComplete="off"
            spellCheck={false}
          />
          {aiMode && (
            <button
              type="button"
              onClick={() => void submitAISearch()}
              disabled={aiState === "loading" || query.trim().length < 2}
              aria-label={t("search.aiSubmit")}
              title={t("search.aiSubmit")}
              className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-muted transition-colors hover:bg-surface-2 hover:text-ink disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              <MorphIcon icon={Send} size={15} strokeWidth={2} />
            </button>
          )}
       
        </div>

        <div ref={listRef} className="max-h-[52vh] overflow-y-auto p-2">
          {aiIds && aiState !== "loading" && (
            <p className="px-3 pb-1 text-[10px] uppercase tracking-[0.12em] text-muted">
              {t("search.ai")}
            </p>
          )}
          {aiState === "loading" ? (
            <div
              className="space-y-2 px-3 py-3"
              aria-live="polite"
              aria-label={t("search.aiLoading")}
            >
              {[0, 1, 2, 3].map((skeleton) => (
                <div
                  key={skeleton}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5"
                >
                  <span className="h-7 w-7 shrink-0 animate-pulse rounded-md bg-surface-2" />
                  <span className="min-w-0 flex-1 space-y-2">
                    <span className="block h-3 w-2/5 animate-pulse rounded bg-surface-2" />
                    <span className="block h-2.5 w-4/5 animate-pulse rounded bg-surface-2" />
                  </span>
                </div>
              ))}
            </div>
          ) : aiMode && aiState === "idle" ? (
            <p className="px-3 py-10 text-center text-[13px] text-muted">
              {t("search.aiPrompt")}
            </p>
          ) : aiState === "empty" ? (
            <p className="px-3 py-10 text-center text-[13px] text-muted">
              {t("search.aiEmpty")} <span className="text-ink">“{query}”</span>
            </p>
          ) : (
            <>
              {aiState === "error" && (
                <p
                  role="status"
                  className="mb-1 rounded-lg border border-line bg-surface-2 px-3 py-2 text-[11.5px] text-muted"
                >
                  {results.length ? t("search.aiFallback") : t("search.aiError")}
                </p>
              )}
              {results.length === 0 ? (
                <p className="px-3 py-10 text-center text-[13px] text-muted">
                  {aiMode && aiState !== "error" ? t("search.aiEmpty") : t("search.empty")}{" "}
                  <span className="text-ink">“{query}”</span>
                </p>
              ) : (
                results.map((item, idx) => (
                  <a
                    key={item.id}
                    data-idx={idx}
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onMouseEnter={() => setActive(idx)}
                    onClick={() => {
                      const cleanQuery = query.trim();
                      if (cleanQuery) {
                        rememberSearch(cleanQuery, results);
                      }
                      close();
                    }}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors ${
                      idx === active ? "bg-surface-2" : ""
                    }`}
                  >
                    <span className="grid h-7 w-7 shrink-0 place-items-center ">
                      <img
                        src={faviconUrl(item.url)}
                        alt=""
                        width="17"
                        height="17"
                        loading="lazy"
                        className="h-5 w-5 object-contain"
                      />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] tracking-tight text-ink">
                        {item.name}
                      </span>
                      <span className="block truncate text-[11.5px] text-muted">
                        {item.desc}
                      </span>
                    </span>
                  </a>
                ))
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchPalette;
