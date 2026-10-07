import raw from "./categories.json";

export interface Category {
  id: string;
  slug: string;
  order: number;
  name: { es: string; en: string };
  short: { es: string; en: string };
  desc: { es: string; en: string };
}

export const categories = raw as Category[];

export const categoryById = new Map(categories.map((c) => [c.id, c]));

export function getCategory(slug: string) {
  return categories.find((c) => c.slug === slug);
}
