export type Locale = "es" | "en";

export const ui = {
  es: {
    "site.name": "Toolsbuild",
    "site.tagline":
      "Colección curada de herramientas, componentes, IA e inspiración para builders.",
    "site.description":
      "Un directorio cuidado a mano con herramientas de diseño, componentes, iconos, movimiento e IA que destacan. Cada enlace se lo gana.",

    "nav.all": "Todos los recursos",
    "nav.menu": "Abrir menú",
    "nav.close": "Cerrar",
    "nav.categories": "Explora por categoría",
    "nav.search": "Buscar",
    "nav.shortcut": "Ctrl K",

    "theme.toggle": "Cambiar tema",
    "theme.light": "Claro",
    "theme.dark": "Oscuro",
    "lang.switch": "Switch to English",
    "lang.label": "Idioma",

    "tooltip.search": "Buscar",
    "tooltip.themeToLight": "Usar tema claro",
    "tooltip.themeToDark": "Usar tema oscuro",
    "tooltip.viewToList": "Vista de lista",
    "tooltip.viewToGrid": "Vista de cuadrícula",

    "view.label": "Vista",
    "view.grid": "Cambiar a vista de cuadrícula",
    "view.list": "Cambiar a vista de lista",

    "hero.title1": "Los recursos que",
    "hero.title2": "realmente importan.",
    "hero.subtitle":
      "Un catálogo reunido a mano con recursos, herramientas y componentes que de verdad ayudan a developers, makers y equipos pequeños.",

    "stat.links": "recursos",
    "stat.categories": "categorías",

    "filter.all": "Todos",
    "filter.label": "Filtrar por categoría",

    "search.title": "Buscar recursos",
    "search.placeholder": "Buscar…",
    "search.empty": "Sin resultados para",

    "card.visit": "Visitar",
    "card.newTab": "(se abre en una pestaña nueva)",

    "footer.note": "Curado con esmero. Los recursos pertenecen a sus autores.",
    "footer.projectBy": "Un proyecto de",
    "footer.links": "Enlaces de DylanZM",

    "notfound.title": "404",
    "notfound.text": "Esta página no existe.",
    "notfound.back": "Volver al inicio",
  },
  en: {
    "site.name": "Toolsbuild",
    "site.tagline":
      "A curated collection of tools, components, AI and inspiration for builders.",
    "site.description":
      "A hand-curated directory of standout design tools, components, icons, motion and AI resources. Every link earns its place.",

    "nav.all": "All resources",
    "nav.menu": "Open menu",
    "nav.close": "Close",
    "nav.categories": "Browse by Category",
    "nav.search": "Search",
    "nav.shortcut": "Ctrl K",

    "theme.toggle": "Toggle theme",
    "theme.light": "Light",
    "theme.dark": "Dark",
    "lang.switch": "Cambiar a español",
    "lang.label": "Language",

    "tooltip.search": "Search",
    "tooltip.themeToLight": "Use light theme",
    "tooltip.themeToDark": "Use dark theme",
    "tooltip.viewToList": "List view",
    "tooltip.viewToGrid": "Grid view",

    "view.label": "View",
    "view.grid": "Switch to grid view",
    "view.list": "Switch to list view",

    "hero.title1": "The resources that",
    "hero.title2": "actually matter.",
    "hero.subtitle":
      "A hand-assembled catalog of resources, tools and components that actually help developers, makers and small teams.",

    "stat.links": "resources",
    "stat.categories": "categories",

    "filter.all": "All",
    "filter.label": "Filter by category",

    "search.title": "Search resources",
    "search.placeholder": "Search...",
    "search.empty": "No results for",

    "card.visit": "Visit",
    "card.newTab": "(opens in a new tab)",

    "footer.note": "Curated with care. Resources belong to their authors.",
    "footer.projectBy": "A project by",
    "footer.links": "DylanZM links",

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
