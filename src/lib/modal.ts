/**
 * True while a native modal <dialog> or an open popover is showing; page-level
 * Escape handlers should defer to it, since the browser closes it on Escape.
 */
export function isModalOpen(): boolean {
  if (typeof document === "undefined") return false;
  if (document.querySelector("dialog[open]") !== null) return true;
  try {
    return document.querySelector(":popover-open") !== null;
  } catch {
    // Browsers without the Popover API reject the selector; they have no popovers open either.
    return false;
  }
}
