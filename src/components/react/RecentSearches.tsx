import React, { useEffect, useState } from "react";
import type { Locale } from "../../i18n/ui";
import { createT } from "../../i18n/ui";
import { ExternalLink, Eye, History, Search, X } from "lucide-react";

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
  const [modalQuery, setModalQuery] = useState<string | null>(null);

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

  const clear = () => {
    localStorage.removeItem(STORAGE_KEY);
    setSearches([]);
    setModalQuery(null);
  };

  const openSearch = (query: string) => {
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

  const modalSearch = searches.find((search) => search.query === modalQuery);
  const modalResults = modalSearch?.ids
    .map((id) => items.find((item) => item.id === id))
    .filter((item): item is SearchResult => Boolean(item));

  if (!searches.length) return null;

  return (
    <section
      className="mb-7 border-y border-line py-4"
      aria-labelledby="recent-searches-title"
    >
      <div className="flex items-center gap-2">
        <History size={14} className="text-muted" aria-hidden="true" />
        <h2
          id="recent-searches-title"
          className="text-[12px] font-medium uppercase tracking-[0.12em] text-muted"
        >
          {t("search.recent")}
        </h2>
        <button
          type="button"
          onClick={clear}
          className="ml-auto inline-flex items-center gap-1 text-[11px] text-muted transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          <X size={13} aria-hidden="true" />
          {t("search.clearRecent")}
        </button>
      </div>
      <div className="mt-3 space-y-2">
        {searches.map(({ query, ids }) => (
          <div
            key={query}
            className="flex min-w-0 items-center gap-2 rounded-lg border border-line px-2 py-1.5"
          >
            <span
              className="min-w-0 flex-1 truncate px-1 text-[12px] text-ink"
              title={query}
            >
              {query}
            </span>
            <button
              type="button"
              onClick={() => openSearch(query)}
              aria-label={`${t("search.searchAgain")}: ${query}`}
              title={t("search.searchAgain")}
              className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-muted transition-colors hover:bg-surface-2 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              <Search size={14} aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => setModalQuery(query)}
              disabled={!ids.length}
              aria-label={`${t("search.showResults")}: ${query}`}
              title={
                ids.length
                  ? t("search.showResults")
                  : t("search.noSavedResults")
              }
              className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-muted transition-colors hover:bg-surface-2 hover:text-ink disabled:cursor-not-allowed disabled:opacity-30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
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
      {modalResults?.length && modalSearch ? (
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
                <p className="text-[11px] text-muted">
                  {t("search.resultsFor")}
                </p>
                <p className="truncate text-[14px] text-ink">
                  “{modalSearch.query}”
                </p>
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
      ) : null}
    </section>
  );
};

export default RecentSearches;
