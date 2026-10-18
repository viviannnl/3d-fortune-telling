/** True while a native modal <dialog> is open; page-level Escape handlers should defer to it. */
export function isModalOpen(): boolean {
  return typeof document !== "undefined" && document.querySelector("dialog[open]") !== null;
}
