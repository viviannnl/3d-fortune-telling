"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PreferencesBootstrap } from "@/components/ui/PreferencesBootstrap";
import { LanguageToggle } from "@/components/ui/LanguageToggle";
import { useDictionary } from "@/lib/i18n/useDictionary";

/** Plain, readable documentation of methods, data handling, and limitations. */
export function AboutContent() {
  const t = useDictionary();
  const a = t.about;

  return (
    <div className="h-dvh overflow-y-auto bg-surface">
      <PreferencesBootstrap />
      <div className="mx-auto max-w-[68ch] px-6 py-10 md:py-16">
        <div className="flex items-center justify-between gap-4">
          <Link
            href="/"
            className="control-surface flex h-9 items-center gap-2 rounded-pill px-3 text-xs font-medium text-text-muted transition-colors duration-150 hover:text-text"
          >
            <ArrowLeft aria-hidden className="size-4" />
            {t.nav.back}
          </Link>
          <LanguageToggle />
        </div>

        <h1 className="mt-10 font-serif text-4xl text-text md:text-5xl">{a.title}</h1>
        <p className="mt-4 text-base leading-relaxed text-text-muted">{a.intro}</p>

        {a.sections.map((section) => (
          <section key={section.anchor} id={section.anchor} className="mt-10 scroll-mt-8">
            <h2 className="font-serif text-2xl text-text">{section.heading}</h2>
            {section.body.map((para, j) => (
              <p key={j} className="mt-3 text-[0.95rem] leading-relaxed text-text-muted">
                {para}
              </p>
            ))}
            {section.anchor === "bazi" && (
              <>
                <h3 className="mt-6 font-serif text-xl text-text">{a.rulesHeading}</h3>
                <ol className="mt-3 list-decimal space-y-2 pl-5 text-[0.95rem] leading-relaxed text-text-muted marker:text-accent">
                  {a.rules.map((rule) => (
                    <li key={rule}>{rule}</li>
                  ))}
                </ol>
              </>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}
