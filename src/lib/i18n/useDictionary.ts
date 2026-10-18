"use client";

import { usePreferences } from "@/stores/preferences";
import { DICTIONARIES, type Dictionary } from "./dictionaries";

export function useDictionary(): Dictionary {
  const locale = usePreferences((s) => s.locale);
  return DICTIONARIES[locale];
}
