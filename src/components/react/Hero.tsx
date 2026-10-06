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
          href="#inspiration"
          className="focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          {t("hero.cta")} →
        </StarBorder>
      </div>
    </section>
  );
};

export default Hero;
