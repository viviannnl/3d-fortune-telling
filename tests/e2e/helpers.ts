import { expect, type Page } from "@playwright/test";

export function collectErrors(page: Page) {
  const errors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  page.on("pageerror", (err) => errors.push(err.message));
  page.on("requestfailed", (req) => errors.push(`request failed: ${req.url()}`));
  return errors;
}

/** Marks the entrance gate as already passed this session, for tests about other things. */
export async function skipGate(page: Page) {
  await page.addInitScript(() => sessionStorage.setItem("mts-intro", "seen"));
}

/**
 * Loads the page as a visitor who already passed the entrance gate this
 * session, and waits for the world plus the short descent to finish.
 */
export async function gotoReady(page: Page, path = "/") {
  await skipGate(page);
  await page.goto(path);
  await expect(page.locator("[data-world-ready=true] canvas")).toBeVisible({ timeout: 30_000 });
  if (path === "/") await expect(page.locator("main")).toHaveAttribute("data-intro", "done", { timeout: 15_000 });
}

/** Screen point on a destination's 3D object, derived from its projected name tag. */
export async function destinationPoint(page: Page, name: string) {
  const label = page.locator("[aria-hidden] > span", { hasText: name }).first();
  await expect(label).toBeVisible();
  // Let the camera settle so the projection is stable.
  await page.waitForTimeout(600);
  const box = await label.boundingBox();
  if (!box) throw new Error(`no label box for ${name}`);
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 + 140 };
}
