import raw from "./links.json";

export interface Link {
  id: string;
  url: string;
  name: string;
  category: string;
  tags: string[];
  desc: { es: string; en: string };
  featured?: boolean;
  addedAt?: string;
}

export const links = raw as Link[];

export const linksByCategory = (category: string) =>
  links.filter((l) => l.category === category);
