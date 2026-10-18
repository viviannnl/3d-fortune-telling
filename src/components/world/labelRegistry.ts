import type { Object3D } from "three";

/**
 * DOM name tags live in the HTML overlay; the canvas projects their 3D anchors
 * each frame and writes transforms directly (no React renders per frame).
 * A label is shown once both its element and its anchor are registered.
 */
interface Entry {
  el?: HTMLElement;
  anchor?: Object3D;
  /** Extra height above the anchor, in world units. */
  lift: number;
}

const entries = new Map<string, Entry>();

function entry(key: string): Entry {
  let e = entries.get(key);
  if (!e) {
    e = { lift: 0 };
    entries.set(key, e);
  }
  return e;
}

export function registerLabel(key: string, el: HTMLElement | null) {
  const e = entry(key);
  e.el = el ?? undefined;
  if (!e.el && !e.anchor) entries.delete(key);
}

export function registerAnchor(key: string, anchor: Object3D | null, lift = 0) {
  const e = entry(key);
  e.anchor = anchor ?? undefined;
  e.lift = lift;
  if (!e.el && !e.anchor) entries.delete(key);
}

export function labelEntries(): IterableIterator<[string, Entry]> {
  return entries.entries();
}
