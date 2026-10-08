import React from "react";
import type { Locale } from "../../i18n/ui";
import { createT } from "../../i18n/ui";
import ShinyText from "./ShinyText";
import CountUp from "./CountUp";
import { links } from "../../data/links";
import { categories } from "../../data/categories";

interface Props {
  locale: Locale;
}

const Hero: React.FC<Props> = ({ locale }) => {
  const t = createT(locale);

  const latestTs = links.reduce((max, l) => {
    const ts = l.addedAt ? Date.parse(l.addedAt) : NaN;
    return Number.isFinite(ts) && ts > max ? ts : max;
  }, 0);
  const latestLabel = new Intl.DateTimeFormat(
    locale === "en" ? "en-US" : "es-ES",
    { month: "short", year: "numeric" },
  ).format(latestTs > 0 ? new Date(latestTs) : new Date());

  return (
    <section className="pb-16 pt-14 text-center sm:pb-20 sm:pt-20 lg:pb-24 lg:pt-24">
      <div className="relative">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 -top-44 h-72 w-[44rem] max-w-full -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,var(--accent-soft),transparent)]"
        />
        <h1 className="relative mx-auto max-w-4xl text-balance text-4xl font-semibold leading-[1.04] tracking-[-0.04em] text-ink sm:text-6xl lg:text-[5.25rem]">
          <span className="block">{t("hero.title1")}</span>
          <span className="block text-muted">
            <ShinyText
              text={t("hero.title2")}
              speed={4}
              color="var(--muted, #7c7d78)"
              shineColor="var(--accent)"
              spread={90}
              pauseOnHover
            />
          </span>
        </h1>
      </div>

      <p className="mx-auto mt-7 max-w-[54ch] text-[14px] leading-relaxed text-muted">
        {t("hero.subtitle")}
      </p>

      <div
        className="mx-auto mt-10 grid w-[min(100%,660px)] grid-cols-3 overflow-hidden rounded-xl border border-line bg-surface"
        aria-label={
          locale === "en" ? "Directory statistics" : "Estadísticas del directorio"
        }
      >
        <div className="flex min-h-[88px] flex-col items-center justify-center gap-1.5 border-r border-line px-3">
          <strong className="font-display text-[22px] font-semibold tabular-nums tracking-tight text-ink">
            <CountUp to={links.length} duration={1.6} />
          </strong>
          <span className="text-center text-[10px] font-medium uppercase tracking-[0.14em] text-muted">
            {t("stat.links")}
          </span>
        </div>
        <div className="flex min-h-[88px] flex-col items-center justify-center gap-1.5 border-r border-line px-3">
          <strong className="font-display text-[22px] font-semibold tabular-nums tracking-tight text-ink">
            <CountUp to={categories.length} duration={1.6} delay={0.2} />
          </strong>
          <span className="text-center text-[10px] font-medium uppercase tracking-[0.14em] text-muted">
            {t("stat.categories")}
          </span>
        </div>
        <div className="flex min-h-[88px] flex-col items-center justify-center gap-1.5 px-3">
          <strong className="font-display text-[19px] font-semibold tabular-nums tracking-tight text-ink">
            {latestLabel}
          </strong>
          <span className="text-center text-[10px] font-medium uppercase tracking-[0.14em] text-muted">
            {t("stat.updated")}
          </span>
        </div>
      </div>
    </section>
  );
};

export default Hero;
