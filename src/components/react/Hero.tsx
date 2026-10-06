import React from "react";
import type { Locale } from "../../i18n/ui";
import { createT } from "../../i18n/ui";
import { localePath } from "../../i18n/path";
import { categories } from "../../data/categories";
import CountUp from "./CountUp";
import ShinyText from "./ShinyText";
import StarBorder from "./StarBorder";
import SpotlightCard from "./SpotlightCard";

interface Props {
  locale: Locale;
  total: number;
}

const Hero: React.FC<Props> = ({ locale, total }) => {
  const t = createT(locale);

  const stats: Array<{ value: number; label: string }> = [
    { value: total, label: t("stat.links") },
    { value: categories.length, label: t("stat.categories") },
    { value: 2, label: t("stat.locales") },
  ];

  return (
    <section className="pb-16 pt-14 sm:pb-24 sm:pt-20">
      <h1 className="max-w-4xl text-balance text-4xl font-semibold leading-[1.05] tracking-[-0.035em] text-ink sm:text-6xl lg:text-7xl">
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

      <p className="mt-6 max-w-[68ch] text-[14px] leading-relaxed text-muted">
        {t("hero.subtitle")}
      </p>

      <div className="mt-9 flex flex-wrap items-center gap-3">
        <StarBorder
          as="a"
          href="#categories"
          className="focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          {t("hero.cta")} →
        </StarBorder>
        <a
          href={localePath(locale, "/components")}
          className="inline-flex h-10 items-center gap-2 rounded-md border border-line px-5 text-[12.5px] tracking-tight text-ink transition-colors hover:border-accent/60 hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          {t("hero.ctaSecondary")}
        </a>
      </div>

      <div className="mt-14 grid max-w-2xl grid-cols-3 gap-3">
        {stats.map((stat) => (
          <SpotlightCard
            key={stat.label}
            className="px-4 py-5 sm:px-6"
            spotlightColor="rgba(217, 164, 65, 0.18)"
          >
            <p className="text-[10px] uppercase tracking-widest text-muted">
              {stat.label}
            </p>
            <p className="mt-1.5 text-2xl font-semibold tracking-tight text-ink tabular-nums sm:text-3xl">
              <CountUp to={stat.value} duration={2} separator="," />
            </p>
          </SpotlightCard>
        ))}
      </div>
    </section>
  );
};

export default Hero;
