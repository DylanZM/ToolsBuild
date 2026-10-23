export const FAVORITES_KEY = "toolsbuild:favorites";
export const MAX_FAVORITES = 24;

export interface FavoriteItem {
  id: string;
  url: string;
  name: string;
  desc?: string;
  category?: string;
}

export function readFavorites(): FavoriteItem[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const parsed = JSON.parse(localStorage.getItem(FAVORITES_KEY) || "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (item): item is FavoriteItem =>
          item &&
          typeof item.id === "string" &&
          typeof item.url === "string" &&
          typeof item.name === "string",
      )
      .slice(0, MAX_FAVORITES);
  } catch {
    return [];
  }
}

export function writeFavorites(list: FavoriteItem[]) {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(
      FAVORITES_KEY,
      JSON.stringify(list.slice(0, MAX_FAVORITES)),
    );
  } catch {}
}

export function toggleFavorite(item: FavoriteItem): FavoriteItem[] {
  const current = readFavorites();
  const exists = current.some((entry) => entry.id === item.id);
  const next = exists
    ? current.filter((entry) => entry.id !== item.id)
    : [item, ...current].slice(0, MAX_FAVORITES);
  writeFavorites(next);
  return next;
}
