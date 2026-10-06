import type { Locale } from "./ui";

export const defaultLocale: Locale = "es";
export const locales: Locale[] = ["es", "en"];

/** Builds the correct path for a locale: es → "/", en → "/en" */
export function localePath(locale: Locale, path = "/"): string {
  const clean = path.startsWith("/") ? path : `/${path}`;
  const suffix = clean === "/" ? "" : clean;
  return locale === "es" ? suffix || "/" : `/en${suffix}` || "/en/";
}

/** Returns the "other" locale of the current one */
export function otherLocale(locale: Locale): Locale {
  return locale === "es" ? "en" : "es";
}

/** Given the current URL, compute where the language switch should point */
export function switchLocalePath(currentPathname: string, locale: Locale): string {
  const other = otherLocale(locale);

  if (locale === "es") {
    // /components → /en/components  |  / → /en/
    const target = currentPathname === "/" ? "/" : currentPathname;
    return `/en${target === "/" ? "/" : target}`;
  }

  // /en/components → /components  |  /en/ → /
  const stripped = currentPathname.replace(/^\/en/, "") || "/";
  return stripped === "/" ? "/" : stripped;
}
