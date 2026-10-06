export type Locale = "es" | "en";

export const ui = {
  es: {
    "site.name": "Toolsbuild",
    "site.tagline":
      "Colección curada de herramientas, componentes, IA e inspiración para builders.",
    "site.description":
      "Directorio curado de herramientas de diseño, componentes, iconos, animaciones, IA y recursos de inspiración.",

    "nav.home": "Inicio",
    "nav.menu": "Abrir menú",
    "nav.close": "Cerrar",
    "nav.explore": "Explorar",
    "nav.categories": "Categorías",
    "nav.search": "Buscar",
    "nav.searchHint": "Buscar recursos…",
    "nav.shortcut": "Ctrl K",

    "theme.toggle": "Cambiar tema",
    "theme.light": "Claro",
    "theme.dark": "Oscuro",
    "lang.switch": "Switch to English",
    "lang.label": "Idioma",

    "hero.title1": "Los recursos que",
    "hero.title2": "realmente importan.",
    "hero.subtitle":
      "Una colección seleccionada a mano de webs, librerías, componentes, iconos y herramientas de IA. Sin ruido, solo lo bueno.",
    "hero.cta": "Explorar ahora",
    "hero.ctaSecondary": "Ver componentes",

    "stat.links": "recursos",
    "stat.categories": "categorías",
    "stat.locales": "idiomas",

    "section.items": "recursos",

    "filter.all": "Todos",
    "filter.label": "Filtrar por categoría",

    "search.title": "Buscar recursos",
    "search.placeholder": "Buscar por nombre, descripción o tag…",
    "search.empty": "Sin resultados para",
    "search.hintNav": "navegar",
    "search.hintOpen": "abrir",
    "search.hintClose": "cerrar",
    "search.results": "resultados",
    "search.loading": "Abriendo…",

    "card.visit": "Visitar",
    "card.newTab": "(se abre en una pestaña nueva)",

    "footer.built": "Hecho con Astro, Tailwind, Archivo e Inter.",
    "footer.rights": "Todos los derechos reservados.",
    "footer.navigate": "Navegar",
    "footer.note": "Curado con esmero. Los recursos pertenecen a sus autores.",

    "notfound.title": "404",
    "notfound.text": "Esta página no existe.",
    "notfound.back": "Volver al inicio",
  },
  en: {
    "site.name": "Toolsbuild",
    "site.tagline":
      "A curated collection of tools, components, AI and inspiration for builders.",
    "site.description":
      "Curated directory of design tools, components, icons, animations, AI and inspiration resources.",

    "nav.home": "Home",
    "nav.menu": "Open menu",
    "nav.close": "Close",
    "nav.explore": "Explore",
    "nav.categories": "Categories",
    "nav.search": "Search",
    "nav.searchHint": "Search resources…",
    "nav.shortcut": "Ctrl K",

    "theme.toggle": "Toggle theme",
    "theme.light": "Light",
    "theme.dark": "Dark",
    "lang.switch": "Cambiar a español",
    "lang.label": "Language",

    "hero.title1": "The resources that",
    "hero.title2": "actually matter.",
    "hero.subtitle":
      "A hand-picked collection of websites, libraries, components, icons and AI tools. No noise, just the good stuff.",
    "hero.cta": "Explore now",
    "hero.ctaSecondary": "View components",

    "stat.links": "resources",
    "stat.categories": "categories",
    "stat.locales": "languages",

    "section.items": "resources",

    "filter.all": "All",
    "filter.label": "Filter by category",

    "search.title": "Search resources",
    "search.placeholder": "Search by name, description or tag…",
    "search.empty": "No results for",
    "search.hintNav": "navigate",
    "search.hintOpen": "open",
    "search.hintClose": "close",
    "search.results": "results",
    "search.loading": "Opening…",

    "card.visit": "Visit",
    "card.newTab": "(opens in a new tab)",

    "footer.built": "Built with Astro, Tailwind, Archivo and Inter.",
    "footer.rights": "All rights reserved.",
    "footer.navigate": "Navigate",
    "footer.note": "Curated with care. Resources belong to their authors.",

    "notfound.title": "404",
    "notfound.text": "This page does not exist.",
    "notfound.back": "Back to home",
  },
} as const;

export type UIKey = keyof (typeof ui)["es"];

export function createT(locale: Locale) {
  const dict = ui[locale];
  return (key: UIKey): string => dict[key] ?? ui.es[key] ?? key;
}
