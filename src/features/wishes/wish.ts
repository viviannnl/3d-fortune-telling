/**
 * Wishes written on the terrace. They never leave the browser: no request
 * carries them, and nothing else in the app reads the stored text.
 */

export const WISH_MAX_LENGTH = 60;
export const MAX_WISHES = 12;

export interface Wish {
  id: string;
  text: string;
  /** Epoch ms, used only to order the lanterns and to show a date. */
  createdAt: number;
}

/**
 * Trims a typed wish to one tidy line. Returns null when nothing is left,
 * so an empty lantern is never released.
 */
export function normalizeWish(raw: string): string | null {
  const text = raw
    .replace(/[\u0000-\u001f\u007f-\u009f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, WISH_MAX_LENGTH);
  return text.length > 0 ? text : null;
}

/** Keeps the newest wishes, oldest first, within the lantern limit. */
export function addWish(existing: readonly Wish[], text: string, createdAt: number, id: string): Wish[] {
  return [...existing, { id, text, createdAt }].slice(-MAX_WISHES);
}

export function isWish(value: unknown): value is Wish {
  if (typeof value !== "object" || value === null) return false;
  const w = value as Partial<Wish>;
  return (
    typeof w.id === "string" &&
    w.id.length > 0 &&
    typeof w.text === "string" &&
    w.text.length > 0 &&
    w.text.length <= WISH_MAX_LENGTH &&
    typeof w.createdAt === "number" &&
    Number.isFinite(w.createdAt)
  );
}

/** Drops anything that isn't a valid wish, so corrupt storage can't break the scene. */
export function parseWishes(value: unknown): Wish[] {
  if (!Array.isArray(value)) return [];
  return value.filter(isWish).slice(-MAX_WISHES);
}
