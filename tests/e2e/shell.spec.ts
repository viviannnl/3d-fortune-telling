import { expect, test } from "@playwright/test";
import { collectErrors } from "./helpers";

test.describe("application shell", () => {
  test.use({ locale: "en-US" });

  test("renders the shell and a live WebGL canvas without errors", async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto("/");

    await expect(page.getByRole("heading", { level: 1 })).toHaveText(/Where the moon keeps its counsel/);
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.locator("[data-world-ready=true] canvas")).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText("The sky is gathering")).toHaveCount(0);

    await page.screenshot({ path: "test-results/shell-desktop.png" });
    expect(errors).toEqual([]);
  });

  test("language toggle switches copy, html lang, and persists across reload", async ({ page }) => {
    await page.goto("/");
    const zh = page.getByRole("button", { name: "中文" });
    await zh.click();

    await expect(zh).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(/月光守候着它的箴言/);
    await expect(page.locator("html")).toHaveAttribute("lang", "zh-Hans");

    await page.reload();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(/月光守候着它的箴言/);

    await page.getByRole("button", { name: "English" }).click();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(/Where the moon keeps its counsel/);
  });

  test("language toggle is keyboard operable", async ({ page }) => {
    await page.goto("/");
    const zh = page.getByRole("button", { name: "中文" });
    for (let i = 0; i < 6 && !(await zh.evaluate((el) => el === document.activeElement)); i++) {
      await page.keyboard.press("Tab");
    }
    await expect(zh).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page.locator("html")).toHaveAttribute("lang", "zh-Hans");
  });
});

test.describe("browser language detection", () => {
  test.use({ locale: "zh-CN" });

  test("defaults to Chinese when the browser prefers it", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(/月光守候着它的箴言/);
  });
});

test.describe("WebGL unavailable", () => {
  test("shows the static sky and an explanatory message", async ({ page }) => {
    await page.addInitScript(() => {
      const original = HTMLCanvasElement.prototype.getContext;
      Object.defineProperty(HTMLCanvasElement.prototype, "getContext", {
        value: function (this: HTMLCanvasElement, type: string, ...rest: unknown[]) {
          if (type.startsWith("webgl")) return null;
          return Reflect.apply(original, this, [type, ...rest]);
        },
      });
    });
    await page.goto("/");
    await expect(page.getByText(/needs WebGL/)).toBeVisible();
    await expect(page.locator("canvas")).toHaveCount(0);
    await expect(page.getByRole("heading", { level: 1 })).toBeAttached();
    await expect(page.getByRole("button", { name: /Tarot Garden/ })).toBeVisible();
  });
});

test.describe("3D scene crash", () => {
  test("falls back to the static sky without a stuck loading message", async ({ page }) => {
    await page.addInitScript(() => {
      // WebGL detection succeeds, but the renderer fails once the stage has mounted.
      const original = WebGL2RenderingContext.prototype.getParameter;
      Object.defineProperty(WebGL2RenderingContext.prototype, "getParameter", {
        value: function (this: WebGL2RenderingContext, ...args: [number]) {
          if (document.querySelector("[data-world-ready]")) throw new Error("simulated GPU failure");
          return Reflect.apply(original, this, args);
        },
      });
    });
    const errors = collectErrors(page);
    await page.goto("/");
    await expect(page.getByText(/needs WebGL/)).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText("The sky is gathering")).toHaveCount(0);
    expect(errors.some((e) => e.includes("[world] 3D scene failed"))).toBe(true);
    await expect(page.getByRole("button", { name: "中文" })).toBeEnabled();
  });
});
