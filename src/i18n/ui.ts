export type Locale = "es" | "en";

export const ui = {
  es: {
    "site.name": "Toolsbuild",
    "site.tagline":
      "Colección curada de herramientas, componentes, IA e inspiración para builders.",
    "site.description":
      "Directorio curado de herramientas de diseño, componentes, iconos, animaciones, IA y recursos de inspiración.",

    "nav.all": "Todos los recursos",
    "nav.menu": "Abrir menú",
    "nav.hideSidebar": "Ocultar barra lateral",
    "nav.showSidebar": "Mostrar barra lateral",
    "nav.close": "Cerrar",
    "nav.categories": "Categorías",
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
      "Una colección seleccionada a mano de webs, librerías, componentes, iconos y herramientas de IA. Sin ruido, solo lo bueno.",

    "stat.links": "recursos",
    "stat.categories": "categorías",

    "filter.all": "Todos",
    "filter.label": "Filtrar por categoría",

    "search.title": "Buscar recursos",
    "search.placeholder": "Buscar…",
    "search.empty": "Sin resultados para",

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

    "nav.all": "All resources",
    "nav.menu": "Open menu",
    "nav.hideSidebar": "Hide sidebar",
    "nav.showSidebar": "Show sidebar",
    "nav.close": "Close",
    "nav.categories": "Categories",
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
      "A hand-picked collection of websites, libraries, components, icons and AI tools. No noise, just the good stuff.",

    "stat.links": "resources",
    "stat.categories": "categories",

    "filter.all": "All",
    "filter.label": "Filter by category",

    "search.title": "Search resources",
    "search.placeholder": "Search...",
    "search.empty": "No results for",

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
