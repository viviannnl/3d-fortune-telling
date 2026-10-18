import { describe, expect, it } from "vitest";
import { DEFAULT_LOCALE, DICTIONARIES, isLocale, LOCALES, resolveLocale } from "@/lib/i18n/dictionaries";

function leafPaths(value: unknown, prefix = ""): string[] {
  if (typeof value !== "object" || value === null) return [prefix];
  return Object.entries(value).flatMap(([k, v]) => leafPaths(v, prefix ? `${prefix}.${k}` : k));
}

describe("resolveLocale", () => {
  it("matches Chinese regional and script variants to zh", () => {
    expect(resolveLocale(["zh-CN"])).toBe("zh");
    expect(resolveLocale(["zh-Hant-TW"])).toBe("zh");
    expect(resolveLocale(["ZH"])).toBe("zh");
  });

  it("uses the first supported locale in preference order", () => {
    expect(resolveLocale(["fr-FR", "en-GB", "zh-CN"])).toBe("en");
    expect(resolveLocale(["ja", "zh-CN", "en"])).toBe("zh");
  });

  it("falls back to the default for unsupported or empty lists", () => {
    expect(resolveLocale([])).toBe(DEFAULT_LOCALE);
    expect(resolveLocale(["de", "ja-JP"])).toBe(DEFAULT_LOCALE);
  });
});

describe("isLocale", () => {
  it("accepts only supported locale codes", () => {
    expect(isLocale("en")).toBe(true);
    expect(isLocale("zh")).toBe(true);
    expect(isLocale("zh-CN")).toBe(false);
    expect(isLocale(undefined)).toBe(false);
    expect(isLocale(42)).toBe(false);
  });
});

describe("dictionaries", () => {
  it("every locale has the same keys and no empty strings", () => {
    const reference = leafPaths(DICTIONARIES.en).sort();
    for (const locale of LOCALES) {
      const dict = DICTIONARIES[locale];
      expect(leafPaths(dict).sort()).toEqual(reference);
      for (const path of reference) {
        const text = path.split(".").reduce<unknown>((node, key) => (node as Record<string, unknown>)[key], dict);
        expect(typeof text === "string" && text.trim().length > 0, `${locale}:${path}`).toBe(true);
      }
    }
  });
});
