import fs from "node:fs";
import { expect, test, type Download, type Page } from "@playwright/test";
import { collectErrors, gotoReady, skipGate } from "./helpers";

test.use({ locale: "en-US" });
test.describe.configure({ timeout: 120_000 });

function pngInfo(path: string) {
  const buf = fs.readFileSync(path);
  const signature = buf.subarray(0, 8).toString("hex");
  return { signature, width: buf.readUInt32BE(16), height: buf.readUInt32BE(20), bytes: buf.length };
}

async function savePng(download: Download, name: string) {
  const path = `test-results/${name}`;
  await download.saveAs(path);
  return { path, ...pngInfo(path) };
}

async function quickTarot(page: Page) {
  await page.getByRole("button", { name: /Tarot Garden/ }).click();
  await page.getByRole("button", { name: /^Career/ }).click();
  for (let i = 0; i < 3; i++) await page.getByRole("button", { name: "Draw a card for me" }).click();
  for (const pos of ["Past", "Present", "Future"])
    await page.getByRole("button", { name: `Turn the ${pos} card` }).click();
  await page.getByRole("button", { name: "Read the interpretation" }).click();
}

test.describe("share cards", () => {
  test("tarot: exports a valid 1080×1350 PNG; Escape closes only the dialog", async ({ page }) => {
    const errors = collectErrors(page);
    await gotoReady(page);
    await quickTarot(page);
    await page.getByRole("button", { name: "Generate reflection" }).click();
    await expect(page.getByTestId("interpretation")).toBeVisible();
    await page.getByRole("button", { name: "Create share card" }).click();
    const dialog = page.getByRole("dialog", { name: "Share card" });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByTestId("share-preview")).toBeVisible();
    await expect(dialog.getByText("Only your cards and question area are included.")).toBeVisible();
    const [download] = await Promise.all([
      page.waitForEvent("download"),
      dialog.getByRole("link", { name: "Download image" }).click(),
    ]);
    expect(download.suggestedFilename()).toBe("moonlit-tarot-reading.png");
    const png = await savePng(download, "share-tarot.png");
    expect(png.signature).toBe("89504e470d0a1a0a");
    expect([png.width, png.height]).toEqual([1080, 1350]);
    expect(png.bytes).toBeGreaterThan(50_000);

    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
    await expect(page.getByRole("complementary")).toBeVisible(); // reading panel still open
    expect(errors).toEqual([]);
  });

  test("destiny: date off by default, export valid, no birth details offered", async ({ page }) => {
    await gotoReady(page);
    await page.getByRole("button", { name: /Destiny Palace/ }).click();
    await page.getByLabel("Birth date", { exact: true }).fill("1990-05-17");
    await page.getByLabel("Birth time", { exact: true }).fill("08:45");
    await page.getByLabel("Birthplace").selectOption("shanghai");
    await page.getByRole("button", { name: "Calculate chart" }).click();
    await page.getByRole("button", { name: "Create share card" }).click();
    const dialog = page.getByRole("dialog", { name: "Share card" });
    await expect(dialog.getByLabel("Include today's date")).not.toBeChecked();
    await expect(dialog.getByText("Your birth date, time, and place are never included.")).toBeVisible();
    await expect(dialog.getByTestId("share-preview")).toBeVisible();
    const [download] = await Promise.all([
      page.waitForEvent("download"),
      dialog.getByRole("link", { name: "Download image" }).click(),
    ]);
    const png = await savePng(download, "share-destiny.png");
    expect(png.signature).toBe("89504e470d0a1a0a");
    expect([png.width, png.height]).toEqual([1080, 1350]);
  });
});

test.describe("reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("the full tarot flow works and idle animation is off", async ({ page }) => {
    const errors = collectErrors(page);
    await gotoReady(page);
    expect(await page.evaluate(() => matchMedia("(prefers-reduced-motion: reduce)").matches)).toBe(true);
    // CSS animations collapse to a single near-instant frame.
    const duration = await page
      .locator(".animate-fade-in")
      .first()
      .evaluate((el) => getComputedStyle(el).animationDuration);
    expect(parseFloat(duration)).toBeLessThan(0.01);
    await quickTarot(page);
    await expect(page.getByRole("complementary").locator("li[data-card-id]")).toHaveCount(3);
    expect(errors).toEqual([]);
  });
});

test.describe("without WebGL", () => {
  test("both experiences remain fully usable through the HTML interface", async ({ page }) => {
    await page.addInitScript(() => {
      const original = HTMLCanvasElement.prototype.getContext;
      Object.defineProperty(HTMLCanvasElement.prototype, "getContext", {
        value: function (this: HTMLCanvasElement, type: string, ...rest: unknown[]) {
          if (type.startsWith("webgl")) return null;
          return Reflect.apply(original, this, [type, ...rest]);
        },
      });
    });
    await skipGate(page);
    await page.goto("/");
    await expect(page.getByText(/needs WebGL/)).toBeVisible();
    await quickTarot(page);
    await expect(page.getByRole("complementary").locator("li[data-card-id]")).toHaveCount(3);
    await page.keyboard.press("Escape");
    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: /Destiny Palace/ }).click();
    await page.getByLabel("Birth date", { exact: true }).fill("2000-01-01");
    await page.getByLabel("Birth time", { exact: true }).fill("12:00");
    await page.getByLabel("Birthplace").selectOption("beijing");
    await page.getByRole("button", { name: "Calculate chart" }).click();
    await expect(page.getByTestId("destiny-chart")).toBeVisible();
  });
});

test.describe("WebGL context loss", () => {
  test("shows a calm notice and restores the 3D view without losing the reading", async ({ page }) => {
    await gotoReady(page);
    await quickTarot(page);
    await page.locator("canvas").evaluate((c: HTMLCanvasElement) => {
      const gl = c.getContext("webgl2") ?? c.getContext("webgl");
      gl?.getExtension("WEBGL_lose_context")?.loseContext();
    });
    await expect(page.getByText(/paused by your browser/)).toBeVisible();
    await expect(page.getByRole("complementary").locator("li[data-card-id]")).toHaveCount(3);
    await page.getByRole("button", { name: "Restore 3D view" }).click();
    await expect(page.locator("[data-world-ready=true] canvas")).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId("tarot-controls")).toHaveAttribute("data-phase", "complete");
  });
});

test.describe("small screens", () => {
  test.use({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });

  test("tarot and destiny flows complete on a phone-sized viewport", async ({ page }) => {
    const errors = collectErrors(page);
    await gotoReady(page);
    await page.screenshot({ path: "test-results/mobile-sanctuary.png" });
    await quickTarot(page);
    const panel = page.getByRole("complementary");
    await expect(panel).toBeInViewport();
    await page.screenshot({ path: "test-results/mobile-tarot-panel.png" });
    await page.getByRole("button", { name: "Close reading" }).click();
    await page.getByRole("button", { name: "Return to the sanctuary" }).click();
    await page.getByRole("button", { name: /Destiny Palace/ }).click();
    await page.getByLabel("Birth date", { exact: true }).fill("2000-01-01");
    await page.getByLabel("Birth time", { exact: true }).fill("12:00");
    await page.getByLabel("Birthplace").selectOption("beijing");
    await page.getByRole("button", { name: "Calculate chart" }).click();
    await expect(page.getByTestId("destiny-chart")).toBeVisible();
    await page.screenshot({ path: "test-results/mobile-destiny.png" });
    // Nothing overflows horizontally.
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    expect(errors).toEqual([]);
  });
});
