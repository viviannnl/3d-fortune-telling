import { expect, test, type Page } from "@playwright/test";
import { collectErrors } from "./helpers";

test.describe.configure({ timeout: 90_000 });
test.use({ locale: "en-US" });

/** Counts AudioContexts so we can prove sound only starts by choice. */
async function countAudio(page: Page) {
  await page.addInitScript(() => {
    const w = window as unknown as { __audioContexts: number; AudioContext: typeof AudioContext };
    w.__audioContexts = 0;
    const Original = window.AudioContext;
    w.AudioContext = class extends Original {
      constructor(options?: AudioContextOptions) {
        super(options);
        w.__audioContexts += 1;
      }
    };
  });
}
const audioContexts = (page: Page) =>
  page.evaluate(() => (window as unknown as { __audioContexts: number }).__audioContexts);

const main = (page: Page) => page.locator("main");

test("a first visit meets the moon gate, enters quietly, and lands in the sanctuary with a greeting", async ({
  page,
}) => {
  const errors = collectErrors(page);
  await countAudio(page);
  await page.goto("/");
  const gate = page.getByTestId("intro-gate");
  await expect(gate).toBeVisible();
  await expect(page.getByTestId("enter-with-sound")).toBeFocused();
  // The interface waits behind the gate and cannot be reached.
  await expect(main(page)).toHaveAttribute("data-intro", "gate");
  const tarot = page.getByRole("button", { name: /Tarot Garden/ });
  expect(await tarot.evaluate((el) => el.closest("[inert]") !== null)).toBe(true);
  for (let i = 0; i < 8; i++) {
    await page.keyboard.press("Tab");
    await expect(tarot).not.toBeFocused();
  }

  await page.getByTestId("enter-quietly").click();
  await expect(main(page)).toHaveAttribute("data-intro", /waiting|playing/);
  // Under software WebGL, shader compilation can hold the main thread for a while.
  await expect(gate).toHaveCount(0, { timeout: 30_000 });
  await expect(main(page)).toHaveAttribute("data-intro", "done", { timeout: 40_000 });
  expect(await audioContexts(page)).toBe(0);
  await expect(page.getByRole("button", { name: "Sound", exact: true })).toHaveAttribute("aria-pressed", "false");

  const greeting = page.getByTestId("intro-greeting");
  await expect(greeting).toContainText("Welcome to the Moonlit Sanctuary");
  await expect(greeting).toContainText("Tonight:");
  await page.getByRole("button", { name: /Tarot Garden/ }).click();
  await expect(main(page)).toHaveAttribute("data-view", "tarot");
  expect(errors).toEqual([]);
});

test("entering with sound starts the music from that click", async ({ page }) => {
  await countAudio(page);
  await page.goto("/");
  await page.getByTestId("enter-with-sound").click();
  await expect(page.getByRole("button", { name: "Sound", exact: true })).toHaveAttribute("aria-pressed", "true");
  expect(await audioContexts(page)).toBe(1);
});

test("a click or key hurries the descent, and a reload this session skips the gate", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("[data-world-ready=true] canvas")).toBeVisible({ timeout: 30_000 });
  await page.getByTestId("enter-quietly").click();
  await expect(main(page)).toHaveAttribute("data-intro", "playing");
  await page.keyboard.press("Space");
  // The full descent is 6.5 s; skipping finishes it within about a second.
  await expect(main(page)).toHaveAttribute("data-intro", "done", { timeout: 3_000 });

  await page.reload();
  await expect(page.getByTestId("intro-gate")).toHaveCount(0);
  await expect(main(page)).toHaveAttribute("data-intro", "done", { timeout: 40_000 });
  // The interface is usable straight away, and returning visitors are not re-greeted mid-session.
  await expect(page.getByTestId("intro-greeting")).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Tarot Garden/ })).toBeVisible();
});

test("a returning visitor is welcomed back and told their lanterns are still there", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("mts-visited", "1");
    localStorage.setItem(
      "mts-wishes",
      JSON.stringify({
        state: {
          wishes: [
            { id: "a", text: "steady hands", createdAt: 1 },
            { id: "b", text: "a kind year", createdAt: 2 },
          ],
        },
        version: 1,
      }),
    );
  });
  await page.goto("/");
  await expect(page.locator("[data-world-ready=true] canvas")).toBeVisible({ timeout: 30_000 });
  await page.getByTestId("enter-quietly").click();
  await page.keyboard.press("Space");
  const greeting = page.getByTestId("intro-greeting");
  await expect(greeting).toContainText("Welcome back", { timeout: 5_000 });
  await expect(greeting).toContainText("Your 2 lanterns are still on the water.");
});

test.describe("reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("the gate still offers the choice, then the world appears without a descent", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("[data-world-ready=true] canvas")).toBeVisible({ timeout: 30_000 });
    await page.getByTestId("enter-quietly").click();
    await expect(main(page)).toHaveAttribute("data-intro", "done", { timeout: 1_500 });
    await expect(page.getByTestId("intro-gate")).toHaveCount(0);
  });
});

test.describe("Chinese", () => {
  test.use({ locale: "zh-CN" });

  test("the gate and greeting speak the visitor's language", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("enter-quietly")).toHaveText("静静进入");
    await expect(page.getByTestId("enter-with-sound")).toHaveText("带着声音进入");
    await expect(page.locator("[data-world-ready=true] canvas")).toBeVisible({ timeout: 30_000 });
    await page.getByTestId("enter-quietly").click();
    await page.keyboard.press("Space");
    await expect(page.getByTestId("intro-greeting")).toContainText("欢迎来到月影圣所", { timeout: 5_000 });
    await expect(page.getByTestId("intro-greeting")).toContainText("今夜");
  });
});
