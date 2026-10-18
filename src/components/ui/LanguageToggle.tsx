"use client";

import { HTML_LANG, LOCALES } from "@/lib/i18n/dictionaries";
import { useDictionary } from "@/lib/i18n/useDictionary";
import { usePreferences } from "@/stores/preferences";

export function LanguageToggle() {
  const t = useDictionary();
  const locale = usePreferences((s) => s.locale);
  const setLocale = usePreferences((s) => s.setLocale);

  return (
    <div role="group" aria-label={t.language.label} className="control-surface flex h-9 items-center rounded-pill p-1">
      {LOCALES.map((code) => {
        const selected = code === locale;
        return (
          <button
            key={code}
            type="button"
            lang={HTML_LANG[code]}
            aria-pressed={selected}
            onClick={() => setLocale(code)}
            className={[
              "h-7 min-w-16 cursor-pointer rounded-pill px-3 text-xs font-medium tracking-wide",
              "transition-[background-color,color,transform] duration-150 ease-out active:scale-[0.97]",
              selected ? "bg-surface-raised text-text" : "text-text-muted hover:bg-surface-raised/60 hover:text-text",
            ].join(" ")}
          >
            {t.language[code]}
          </button>
        );
      })}
    </div>
  );
}
