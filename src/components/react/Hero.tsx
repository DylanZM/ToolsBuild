import React from "react";
import type { Locale } from "../../i18n/ui";
import { createT } from "../../i18n/ui";
import ShinyText from "./ShinyText";
import StarBorder from "./StarBorder";

interface Props {
  locale: Locale;
}

const Hero: React.FC<Props> = ({ locale }) => {
  const t = createT(locale);

  return (
    <section className="pb-16 pt-14 sm:pb-20 sm:pt-20 lg:pb-24 lg:pt-24">
      <div className="relative">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-40 -top-44 h-72 w-[44rem] max-w-full rounded-full bg-[radial-gradient(closest-side,var(--accent-soft),transparent)]"
        />
        <h1 className="relative max-w-4xl text-balance text-4xl font-semibold leading-[1.04] tracking-[-0.04em] text-ink sm:text-6xl lg:text-[5.25rem]">
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

      <p className="mt-7 max-w-[64ch] text-[14px] leading-relaxed text-muted">
        {t("hero.subtitle")}
      </p>

      <div className="mt-10 flex flex-wrap items-center gap-3">
        <StarBorder
          as="a"
          href="#recursos"
          className="focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          {t("hero.cta")} →
        </StarBorder>
      </div>
    </section>
  );
};

export default Hero;
