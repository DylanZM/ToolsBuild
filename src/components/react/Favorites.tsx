import React, { useEffect, useState } from "react";
import { Bookmark, X } from "lucide-react";
import type { Locale } from "../../i18n/ui";
import { createT } from "../../i18n/ui";
import {
  MAX_FAVORITES,
  readFavorites,
  writeFavorites,
  type FavoriteItem,
} from "../../lib/favorites";

interface Props {
  locale: Locale;
  items: FavoriteItem[];
}

function faviconUrl(url: string): string {
  try {
    const domain = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
  } catch {
    return "/favicon.svg";
  }
}

const Favorites: React.FC<Props> = ({ locale }) => {
  const t = createT(locale);
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setFavorites(readFavorites());
  }, []);

  useEffect(() => {
    const onSync = () => setFavorites(readFavorites());
    window.addEventListener("toolsbuild:favorites-sync", onSync);
    window.addEventListener("storage", onSync);
    return () => {
      window.removeEventListener("toolsbuild:favorites-sync", onSync);
      window.removeEventListener("storage", onSync);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const remove = (id: string) => {
    setFavorites((current) => {
      const next = current.filter((x) => x.id !== id);
      writeFavorites(next);
      window.dispatchEvent(new CustomEvent("toolsbuild:favorites-sync"));
      return next;
    });
  };

  const count = favorites.length;
  if (!count) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={locale === "en" ? "Favorites" : "Favoritos"}
        aria-haspopup="dialog"
        aria-expanded={open}
        data-tooltip={locale === "en" ? "Favorites" : "Favoritos"}
        data-tooltip-align="end"
        className="hdr-hover relative grid h-8 w-8 place-items-center rounded-md text-muted transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        <Bookmark size={14} strokeWidth={2} aria-hidden="true" />
        <span className="absolute -right-0.5 -top-0.5 grid h-3.5 min-w-[0.875rem] place-items-center rounded-full bg-accent px-0.5 text-[9px] font-medium text-accent-contrast">
          {count}
        </span>
      </button>

      {open && mounted && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-[14vh] animate-fade-in"
          role="dialog"
          aria-modal="true"
          aria-label={locale === "en" ? "Favorite websites" : "Sitios web favoritos"}
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-xl overflow-hidden rounded-2xl border border-line bg-surface shadow-[0_40px_100px_-60px_rgba(0,0,0,0.8)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 border-b border-line px-5 py-3.5">
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-surface-2">
                <Bookmark size={14} className="text-accent" aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-sans text-[12px] font-medium tracking-tight text-ink">
                  {locale === "en" ? "Favorites" : "Favoritos"}
                </p>
                <p className="font-sans text-[11px] text-muted">
                  {locale === "en" ? `${count} saved` : `${count} guardados`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label={locale === "en" ? "Close" : "Cerrar"}
                className="grid h-8 w-8 place-items-center rounded-lg text-muted transition-colors hover:bg-surface-2 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                <X size={15} strokeWidth={1.8} aria-hidden="true" />
              </button>
            </div>
            <div className="max-h-[58vh] space-y-1 overflow-y-auto p-2">
              {favorites.map((item) => (
                <div
                  key={item.id}
                  className="group flex min-w-0 items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-surface-2"
                >
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex min-w-0 flex-1 items-center gap-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                    onClick={() => setOpen(false)}
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
                      {item.desc && (
                        <span className="mt-0.5 block truncate font-sans text-[11.5px] text-muted">
                          {item.desc}
                        </span>
                      )}
                    </span>
                  </a>
                  <button
                    type="button"
                    onClick={() => remove(item.id)}
                    aria-label={locale === "en" ? "Remove from favorites" : "Quitar de favoritos"}
                    className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-muted opacity-0 transition-all hover:bg-red-500/10 hover:text-red-500 group-hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                  >
                    <X size={13} strokeWidth={1.8} aria-hidden="true" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Favorites;
