import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { Locale } from "../../i18n/ui";
import { createT } from "../../i18n/ui";
import { ExternalLink, Eye, History, X } from "lucide-react";

const STORAGE_KEY = "toolsbuild:recent-searches";
const MAX_SEARCHES = 6;

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
      if (buttonRef.current?.contains(target) || popoverRef.current?.contains(target)) {
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
  };

  const openSearch = (query: string) => {
    setOpen(false);
    setModalQuery(null);
    window.dispatchEvent(new CustomEvent("toolsbuild:search", { detail: { query } }));
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
        className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 px-4 pt-[12vh] backdrop-blur-sm"
        role="dialog"
        aria-modal="true"
        aria-label={t("search.resultsFor")}
        onClick={() => setModalQuery(null)}
      >
        <div
          className="w-full max-w-xl overflow-hidden rounded-xl bg-surface shadow-2xl"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex items-center gap-3 border-b border-line px-4 py-3">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] text-muted">{t("search.resultsFor")}</p>
              <p className="truncate text-[14px] text-ink">“{modalSearch.query}”</p>
            </div>
            <button
              type="button"
              onClick={() => setModalQuery(null)}
              aria-label={t("search.closeResults")}
              title={t("search.closeResults")}
              className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-muted transition-colors hover:bg-surface-2 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              <X size={16} aria-hidden="true" />
            </button>
          </div>
          <div className="max-h-[55vh] space-y-2 overflow-y-auto p-3">
            {modalResults.map((item) => (
              <a
                key={item.id}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex min-w-0 items-center gap-3 rounded-lg border border-line px-3 py-3 transition-colors hover:border-accent hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] text-ink">
                    {item.name}
                  </span>
                  <span className="mt-0.5 block truncate text-[11.5px] text-muted">
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
          className="absolute right-5 top-[calc(100%+8px)] z-50 w-[min(92vw,21rem)] overflow-hidden rounded-xl border border-line bg-surface shadow-2xl sm:right-8"
        >
          <div className="flex items-center gap-2 border-b border-line px-3 py-2">
            <History size={13} className="text-muted" aria-hidden="true" />
            <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted">
              {t("search.recent")}
            </span>
            <button
              type="button"
              onClick={clear}
              className="ml-auto inline-flex items-center gap-1 text-[11px] text-muted transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              <X size={13} aria-hidden="true" />
              {t("search.clearRecent")}
            </button>
          </div>

          <div className="max-h-[60vh] space-y-1 overflow-y-auto p-2">
            {searches.map(({ query, ids }) => (
              <div
                key={query}
                className="flex min-w-0 items-center gap-1 rounded-lg px-1 py-0.5 transition-colors hover:bg-surface-2"
              >
                <button
                  type="button"
                  onClick={() => openSearch(query)}
                  aria-label={`${t("search.searchAgain")}: ${query}`}
                  title={t("search.searchAgain")}
                  className="min-w-0 flex-1 truncate rounded-md px-2 py-1.5 text-left text-[12.5px] text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                >
                  {query}
                </button>
                <button
                  type="button"
                  onClick={() => setModalQuery(query)}
                  disabled={!ids.length}
                  aria-label={`${t("search.showResults")}: ${query}`}
                  title={
                    ids.length ? t("search.showResults") : t("search.noSavedResults")
                  }
                  className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-muted transition-colors hover:bg-surface hover:text-ink disabled:cursor-not-allowed disabled:opacity-30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                >
                  <Eye size={14} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => removeSearch(query)}
                  aria-label={`${t("search.deleteRecent")}: ${query}`}
                  title={t("search.deleteRecent")}
                  className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-muted transition-colors hover:bg-red-500/10 hover:text-red-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                >
                  <X size={14} aria-hidden="true" />
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
