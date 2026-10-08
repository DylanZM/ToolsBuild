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
    "stat.updated": "última actualización",

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

    "admin.title": "Panel de recursos",
    "admin.links": "{n} enlaces",
    "admin.readonly1":
      "Este panel es de solo lectura en producción. Para agregar o editar recursos, corre ",
    "admin.readonly2": " en local.",
    "admin.add": "+ Agregar",
    "admin.addTitle": "Agregar recurso",
    "admin.editing": "Editando: {name}",
    "admin.closePanel": "Cerrar panel",
    "admin.cancel": "Cancelar",
    "admin.save": "Guardar cambios",
    "admin.category": "Categoría",
    "admin.fName": "Nombre",
    "admin.descEs": "Descripción ES",
    "admin.descEn": "Descripción EN",
    "admin.errName": "El nombre es obligatorio.",
    "admin.errUrl": "La URL es obligatoria.",
    "admin.errUrlPrefix": "Debe empezar por http:// o https://",
    "admin.errDescEs": "La descripción en español es obligatoria.",
    "admin.errDescEn": "La descripción en inglés es obligatoria.",
    "admin.errServer": "Error {status} del servidor",
    "admin.errWrite":
      "No se pudo escribir el archivo. ¿Sigue corriendo astro dev?",
    "admin.results": "{n} resultados",
    "admin.showing": "{x} de {y}",
    "admin.all": "Todas",
    "admin.search": "Buscar",
    "admin.emptyTitle": "Sin resultados",
    "admin.emptyNoMatch": "Nada coincide con “{q}”.",
    "admin.emptyCat": "Sin recursos en esta categoría.",
    "admin.thResource": "Recurso",
    "admin.thDesc": "Descripción",
    "admin.thActions": "Acciones",
    "admin.edit": "Editar",
    "admin.delete": "Eliminar",
    "admin.editAria": "Editar {name}",
    "admin.delAria": "Eliminar {name}",
    "admin.delTitle": "¿Eliminar recurso?",
    "admin.delDesc": "Se quitará “{name}” de la lista.",
    "admin.toastUpdated": "✓ \"{name}\" actualizado",
    "admin.toastAdded": "✓ \"{name}\" agregado a {cat}",
    "admin.toastDeleted": "✓ \"{name}\" eliminado",

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
    "stat.updated": "last update",

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

    "admin.title": "Resource panel",
    "admin.links": "{n} links",
    "admin.readonly1":
      "This panel is read-only in production. To add or edit resources, run ",
    "admin.readonly2": " locally.",
    "admin.add": "+ Add",
    "admin.addTitle": "Add resource",
    "admin.editing": "Editing: {name}",
    "admin.closePanel": "Close panel",
    "admin.cancel": "Cancel",
    "admin.save": "Save changes",
    "admin.category": "Category",
    "admin.fName": "Name",
    "admin.descEs": "Spanish description",
    "admin.descEn": "English description",
    "admin.errName": "Name is required.",
    "admin.errUrl": "URL is required.",
    "admin.errUrlPrefix": "Must start with http:// or https://",
    "admin.errDescEs": "Spanish description is required.",
    "admin.errDescEn": "English description is required.",
    "admin.errServer": "Server error {status}",
    "admin.errWrite": "Couldn't write the file. Is astro dev still running?",
    "admin.results": "{n} results",
    "admin.showing": "{x} of {y}",
    "admin.all": "All",
    "admin.search": "Search",
    "admin.emptyTitle": "No results",
    "admin.emptyNoMatch": "Nothing matches “{q}”.",
    "admin.emptyCat": "No resources in this category.",
    "admin.thResource": "Resource",
    "admin.thDesc": "Description",
    "admin.thActions": "Actions",
    "admin.edit": "Edit",
    "admin.delete": "Delete",
    "admin.editAria": "Edit {name}",
    "admin.delAria": "Delete {name}",
    "admin.delTitle": "Delete resource?",
    "admin.delDesc": "“{name}” will be removed from the list.",
    "admin.toastUpdated": "✓ \"{name}\" updated",
    "admin.toastAdded": "✓ \"{name}\" added to {cat}",
    "admin.toastDeleted": "✓ \"{name}\" removed",

    "notfound.title": "404",
    "notfound.text": "This page does not exist.",
    "notfound.back": "Back to home",
  },
} as const;

export type UIKey = keyof (typeof ui)["es"];

export type TParams = Record<string, string | number>;

export function createT(locale: Locale) {
  const dict = ui[locale];
  return (key: UIKey, params?: TParams): string => {
    let s: string = dict[key] ?? ui.es[key] ?? key;
    if (params)
      for (const [k, v] of Object.entries(params))
        s = s.split(`{${k}}`).join(String(v));
    return s;
  };
}
