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

      <div className="mt-8 flex items-center justify-center gap-2.5 text-[13px] leading-none text-muted">
        <span className="text-[16px] font-semibold tabular-nums text-ink">
          <CountUp to={links.length} duration={1.6} />
        </span>
        <span>{t("stat.links")}</span>
        <span aria-hidden="true" className="h-1 w-1 rounded-full bg-accent" />
        <span className="text-[16px] font-semibold tabular-nums text-ink">
          <CountUp to={categories.length} duration={1.6} delay={0.2} />
        </span>
        <span>{t("stat.categories")}</span>
      </div>
    </section>
  );
};

export default Hero;
