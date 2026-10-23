import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { Locale } from "../../i18n/ui";
import { createT } from "../../i18n/ui";
import { ExternalLink, History, Search, Trash2, X } from "lucide-react";

const STORAGE_KEY = "toolsbuild:recent-searches";
const MAX_SEARCHES = 8;

interface Props {
  locale: Locale;
  items: SearchResult[];
}

interface SearchResult {
  id: string;
  url: string;
  name: string;
  desc: string;
}

interface RecentSearch {
  query: string;
  ids: string[];
}

interface SearchHistoryEvent extends CustomEvent {
  detail: { query?: string; ids?: string[] };
}

function faviconUrl(url: string): string {
  try {
    const domain = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
  } catch {
    return "/favicon.svg";
  }
}

const RecentSearches: React.FC<Props> = ({ locale, items }) => {
  const t = createT(locale);
  const [searches, setSearches] = useState<RecentSearch[]>([]);
  const [open, setOpen] = useState(false);
  const [modalQuery, setModalQuery] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      if (Array.isArray(stored)) {
        setSearches(
          stored
            .map((search): RecentSearch | null => {
              if (typeof search === "string") return { query: search, ids: [] };
              if (
                search &&
                typeof search.query === "string" &&
                Array.isArray(search.ids)
              ) {
                return {
                  query: search.query,
                  ids: search.ids.filter(
                    (id: unknown): id is string => typeof id === "string",
                  ),
                };
              }
              return null;
            })
            .filter((search): search is RecentSearch => Boolean(search))
            .slice(0, MAX_SEARCHES),
        );
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }

    const onHistory = (event: SearchHistoryEvent) => {
      const query = event.detail?.query?.trim();
      if (!query) return;
      const ids = event.detail?.ids || [];
      setSearches((current) => {
        const next = [
          { query, ids },
          ...current.filter(
            (item) => item.query.toLowerCase() !== query.toLowerCase(),
          ),
        ].slice(0, MAX_SEARCHES);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        return next;
      });
    };
    window.addEventListener(
      "toolsbuild:search-history",
      onHistory as EventListener,
    );
    return () =>
      window.removeEventListener(
        "toolsbuild:search-history",
        onHistory as EventListener,
      );
  }, []);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => {
      const target = event.target as Node;
      if (
        buttonRef.current?.contains(target) ||
        popoverRef.current?.contains(target)
      ) {
        return;
      }
      setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const clear = () => {
    localStorage.removeItem(STORAGE_KEY);
    setSearches([]);
    setModalQuery(null);
    setOpen(false);
  };

  const openSearch = (query: string) => {
    setOpen(false);
    setModalQuery(null);
    window.dispatchEvent(
      new CustomEvent("toolsbuild:search", { detail: { query } }),
    );
  };

  const removeSearch = (query: string) => {
    setSearches((current) => {
      const next = current.filter((item) => item.query !== query);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
    setModalQuery((current) => (current === query ? null : current));
  };

  if (!searches.length) return null;

  const modalSearch = searches.find((search) => search.query === modalQuery);
  const modalResults = modalSearch?.ids
    .map((id) => items.find((item) => item.id === id))
    .filter((item): item is SearchResult => Boolean(item));

  const modal =
    modalSearch && modalResults?.length ? (
      <div
        className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 px-4 pt-[14vh] backdrop-blur-sm animate-fade-in"
        role="dialog"
        aria-modal="true"
        aria-label={t("search.resultsFor")}
        onClick={() => setModalQuery(null)}
      >
        <div
          className="w-full max-w-xl overflow-hidden rounded-2xl border border-line bg-surface shadow-[0_60px_120px_-80px_rgba(0,0,0,0.9)]"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex items-center gap-3 border-b border-line px-5 py-3.5">
            <div className="min-w-0 flex-1">
              <p className="font-sans text-[10px] uppercase tracking-[0.16em] text-muted">
                {t("search.resultsFor")}
              </p>
              <p className="mt-1 truncate font-sans text-[14px] tracking-tight text-ink">
                “{modalSearch.query}”
              </p>
            </div>
            <button
              type="button"
              onClick={() => setModalQuery(null)}
              aria-label={t("search.closeResults")}
              className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-muted transition-colors hover:bg-surface-2 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              <X size={15} strokeWidth={1.8} aria-hidden="true" />
            </button>
          </div>
          <div className="max-h-[56vh] space-y-1 overflow-y-auto p-2">
            {modalResults.map((item) => (
              <a
                key={item.id}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex min-w-0 items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-surface-2">
                  <img
                    src={faviconUrl(item.url)}
                    alt=""
                    width="16"
                    height="16"
                    loading="lazy"
                    className="h-4 w-4 object-contain"
                  />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-sans text-[13px] tracking-tight text-ink">
                    {item.name}
                  </span>
                  <span className="mt-0.5 block truncate font-sans text-[11.5px] text-muted">
                    {item.desc}
                  </span>
                </span>
                <ExternalLink
                  size={14}
                  className="shrink-0 text-muted transition-colors group-hover:text-ink"
                  aria-hidden="true"
                />
              </a>
            ))}
          </div>
        </div>
      </div>
    ) : null;

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label={t("search.history")}
        aria-haspopup="menu"
        aria-expanded={open}
        data-tooltip={t("search.history")}
        data-tooltip-align="end"
        className="hdr-hover grid h-8 w-8 place-items-center rounded-md text-muted transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        <History size={14} strokeWidth={2} aria-hidden="true" />
      </button>

      {open && (
        <div
          ref={popoverRef}
          role="menu"
          aria-label={t("search.recent")}
          className="absolute right-5 top-[calc(100%+8px)] z-50 w-[min(92vw,22rem)] overflow-hidden rounded-2xl border border-line bg-surface shadow-[0_40px_90px_-60px_rgba(0,0,0,0.9)] sm:right-8"
        >
          <div className="flex items-center gap-2 border-b border-line px-4 py-2.5">
            <History size={13} className="text-muted" aria-hidden="true" />
            <span className="font-sans text-[10px] uppercase tracking-[0.16em] text-muted">
              {t("search.recent")}
            </span>
            <button
              type="button"
              onClick={clear}
              className="ml-auto inline-flex items-center gap-1.5 rounded-md px-1.5 py-1 font-sans text-[11px] text-muted transition-colors hover:bg-surface-2 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              <Trash2 size={12} strokeWidth={1.8} aria-hidden="true" />
              {t("search.clearRecent")}
            </button>
          </div>

          <div className="max-h-[62vh] space-y-0.5 overflow-y-auto p-1.5">
            {searches.map(({ query, ids }) => (
              <div
                key={query}
                className="group/item flex min-w-0 items-center gap-1 rounded-xl px-1 transition-colors hover:bg-surface-2"
              >
                <button
                  type="button"
                  onClick={() => openSearch(query)}
                  aria-label={`${t("search.searchAgain")}: ${query}`}
                  className="flex min-w-0 flex-1 items-center gap-2 rounded-lg px-2 py-2 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                >
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-surface-2">
                    <Search size={12} className="text-muted" aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1 truncate font-sans text-[12.5px] tracking-tight text-ink">
                    {query}
                  </span>
                </button>
                {ids.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setModalQuery(query)}
                    aria-label={`${t("search.showResults")}: ${query}`}
                    title={t("search.showResults")}
                    className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-muted opacity-0 transition-all hover:bg-surface hover:text-ink group-hover/item:opacity-100 focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                  >
                    <ExternalLink size={13} strokeWidth={1.8} aria-hidden="true" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => removeSearch(query)}
                  aria-label={`${t("search.deleteRecent")}: ${query}`}
                  title={t("search.deleteRecent")}
                  className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-muted opacity-0 transition-all hover:bg-red-500/10 hover:text-red-500 group-hover/item:opacity-100 focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                >
                  <X size={13} strokeWidth={1.8} aria-hidden="true" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {mounted ? createPortal(modal, document.body) : null}
    </>
  );
};

export default RecentSearches;
