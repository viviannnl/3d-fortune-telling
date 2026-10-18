import type { LocalizedText } from "@/lib/i18n/types";

export const ELEMENTS = ["wood", "fire", "earth", "metal", "water"] as const;
export type ElementId = (typeof ELEMENTS)[number];

export const ELEMENT_CHAR: Record<ElementId, string> = {
  wood: "木",
  fire: "火",
  earth: "土",
  metal: "金",
  water: "水",
};

export type Polarity = "yang" | "yin";

export interface StemInfo {
  char: string;
  pinyin: string;
  element: ElementId;
  polarity: Polarity;
}

export interface BranchInfo {
  char: string;
  pinyin: string;
  element: ElementId;
  polarity: Polarity;
  animal: LocalizedText;
}

/** The ten Heavenly Stems (天干), in cycle order. */
export const STEMS: readonly StemInfo[] = [
  { char: "甲", pinyin: "jiǎ", element: "wood", polarity: "yang" },
  { char: "乙", pinyin: "yǐ", element: "wood", polarity: "yin" },
  { char: "丙", pinyin: "bǐng", element: "fire", polarity: "yang" },
  { char: "丁", pinyin: "dīng", element: "fire", polarity: "yin" },
  { char: "戊", pinyin: "wù", element: "earth", polarity: "yang" },
  { char: "己", pinyin: "jǐ", element: "earth", polarity: "yin" },
  { char: "庚", pinyin: "gēng", element: "metal", polarity: "yang" },
  { char: "辛", pinyin: "xīn", element: "metal", polarity: "yin" },
  { char: "壬", pinyin: "rén", element: "water", polarity: "yang" },
  { char: "癸", pinyin: "guǐ", element: "water", polarity: "yin" },
];

/** The twelve Earthly Branches (地支), in cycle order, with each branch's principal element. */
export const BRANCHES: readonly BranchInfo[] = [
  { char: "子", pinyin: "zǐ", element: "water", polarity: "yang", animal: { en: "Rat", zh: "鼠" } },
  { char: "丑", pinyin: "chǒu", element: "earth", polarity: "yin", animal: { en: "Ox", zh: "牛" } },
  { char: "寅", pinyin: "yín", element: "wood", polarity: "yang", animal: { en: "Tiger", zh: "虎" } },
  { char: "卯", pinyin: "mǎo", element: "wood", polarity: "yin", animal: { en: "Rabbit", zh: "兔" } },
  { char: "辰", pinyin: "chén", element: "earth", polarity: "yang", animal: { en: "Dragon", zh: "龙" } },
  { char: "巳", pinyin: "sì", element: "fire", polarity: "yin", animal: { en: "Snake", zh: "蛇" } },
  { char: "午", pinyin: "wǔ", element: "fire", polarity: "yang", animal: { en: "Horse", zh: "马" } },
  { char: "未", pinyin: "wèi", element: "earth", polarity: "yin", animal: { en: "Goat", zh: "羊" } },
  { char: "申", pinyin: "shēn", element: "metal", polarity: "yang", animal: { en: "Monkey", zh: "猴" } },
  { char: "酉", pinyin: "yǒu", element: "metal", polarity: "yin", animal: { en: "Rooster", zh: "鸡" } },
  { char: "戌", pinyin: "xū", element: "earth", polarity: "yang", animal: { en: "Dog", zh: "狗" } },
  { char: "亥", pinyin: "hài", element: "water", polarity: "yin", animal: { en: "Pig", zh: "猪" } },
];

export const TEN_GODS = ["比肩", "劫财", "食神", "伤官", "偏财", "正财", "七杀", "正官", "偏印", "正印"] as const;
export type TenGod = (typeof TEN_GODS)[number];

export function stemByChar(char: string): StemInfo | undefined {
  return STEMS.find((s) => s.char === char);
}

export function branchByChar(char: string): BranchInfo | undefined {
  return BRANCHES.find((b) => b.char === char);
}
