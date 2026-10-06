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
import { Search } from "lucide";

export interface SearchItem {
  id: string;
  url: string;
  name: string;
  category: string;
  desc: string;
  tags: string[];
}

interface Props {
  items: SearchItem[];
  locale: Locale;
}

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

  if (name === q) return 100;
  if (name.startsWith(q)) return 80;
  if (name.includes(q)) return 60;
  if (tags.includes(q)) return 45;
  if (desc.includes(q)) return 30;
  if (cat.includes(q)) return 20;
  return 0;
}

const SearchPalette: React.FC<Props> = ({ items, locale }) => {
  const t = createT(locale);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const results = useMemo(() => {
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

  const open_ = useCallback(() => {
    setOpen(true);
    setQuery("");
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
    const onCustom = () => open_();
    window.addEventListener("keydown", onKey);
    window.addEventListener("toolsbuild:search", onCustom as EventListener);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("toolsbuild:search", onCustom as EventListener);
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
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const item = results[active];
      if (item) window.open(item.url, "_blank", "noopener,noreferrer");
    }
  };

  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(`[data-idx="${active}"]`);
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

      <div className="relative w-full max-w-xl overflow-hidden rounded-xl border border-line bg-surface shadow-2xl">
        <div className="flex items-center gap-3 border-b border-line px-4">
          <MorphIcon
            icon={Search}
            size={15}
            strokeWidth={2}
            className="shrink-0 text-muted"
          />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onInputKey}
            placeholder={t("search.placeholder")}
            className="h-12 w-full bg-transparent text-[14px] text-ink outline-none placeholder:text-muted"
            autoComplete="off"
            spellCheck={false}
          />
          <kbd className="hidden shrink-0 rounded border border-line px-1.5 py-0.5 text-[10px] tracking-wider text-muted sm:block">
            ESC
          </kbd>
        </div>

        <div ref={listRef} className="max-h-[52vh] overflow-y-auto p-2">
          {results.length === 0 ? (
            <p className="px-3 py-10 text-center text-[13px] text-muted">
              {t("search.empty")}{" "}
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
                onClick={close}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors ${
                  idx === active ? "bg-surface-2" : ""
                }`}
              >
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md border border-line bg-surface">
                  <img
                    src={faviconUrl(item.url)}
                    alt=""
                    width="14"
                    height="14"
                    loading="lazy"
                    className="h-[14px] w-[14px] object-contain"
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
        </div>

        <div className="flex items-center justify-between border-t border-line px-4 py-2.5 text-[10.5px] uppercase tracking-wider text-muted">
          <span>
            {results.length} {t("search.results")}
          </span>
          <span className="flex items-center gap-3">
            <span>↑↓ {t("search.hintNav")}</span>
            <span>↵ {t("search.hintOpen")}</span>
            <span>esc {t("search.hintClose")}</span>
          </span>
        </div>
      </div>
    </div>
  );
};

export default SearchPalette;
