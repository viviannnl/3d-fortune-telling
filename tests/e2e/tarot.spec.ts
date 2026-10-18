import { expect, test, type Page } from "@playwright/test";
import { collectErrors, gotoReady } from "./helpers";

test.use({ locale: "en-US" });

const controls = (page: Page) => page.getByTestId("tarot-controls");

async function enterGarden(page: Page) {
  await gotoReady(page);
  await page.getByRole("button", { name: /Tarot Garden/ }).click();
  await expect(controls(page)).toHaveAttribute("data-phase", "choosing");
}

async function revealAll(page: Page) {
  const start = Number(await controls(page).getAttribute("data-revealed"));
  for (let n = start; n < 3; n++) {
    const pos = ["Past", "Present", "Future"][n];
    // Playwright waits for the button to re-enable after the pacing interval.
    await page.getByRole("button", { name: `Turn the ${pos} card` }).click();
    await expect(controls(page)).toHaveAttribute("data-revealed", String(n + 1));
  }
  await expect(controls(page)).toHaveAttribute("data-phase", "complete");
}

async function readPanel(page: Page) {
  await page.getByRole("button", { name: "Read the interpretation" }).click();
  const items = page.getByRole("complementary").locator("li[data-card-id]");
  await expect(items).toHaveCount(3);
  return items.evaluateAll((els) =>
    els.map((el) => ({
      id: el.getAttribute("data-card-id"),
      orientation: el.getAttribute("data-orientation"),
      position: el.getAttribute("data-position"),
      name: el.querySelector("h4")?.textContent,
    })),
  );
}

test.describe("tarot reading", () => {
  test.describe.configure({ timeout: 120_000 }); // software WebGL is slow; readings involve many animations
  test("complete reading by clicking cards in the 3D fan", async ({ page }) => {
    const errors = collectErrors(page);
    await enterGarden(page);
    await expect(page.getByText("Major Arcana · 22 of 78 cards")).toBeVisible();
    await page.getByRole("button", { name: /^Love/ }).click();
    await expect(controls(page)).toHaveAttribute("data-phase", "drawing");
    await page.waitForTimeout(2500); // camera + fan settle

    // The fan spans the table's back half; click across it until three distinct cards are chosen.
    const xs = [560, 880, 720, 500, 940, 620, 820, 680, 760, 600, 840];
    for (const x of xs) {
      if ((await controls(page).getAttribute("data-phase")) !== "drawing") break;
      await page.mouse.move(x, 430, { steps: 4 });
      await page.mouse.click(x, 430);
      await page.waitForTimeout(700);
    }
    await expect(controls(page)).toHaveAttribute("data-picks", "3");
    await expect(controls(page)).toHaveAttribute("data-phase", "revealing");

    // Further clicks on the table can't add a fourth card.
    await page.mouse.click(720, 430);
    await expect(controls(page)).toHaveAttribute("data-picks", "3");

    await revealAll(page);
    const spread = await readPanel(page);
    expect(spread.map((s) => s.position)).toEqual(["past", "present", "future"]);
    expect(new Set(spread.map((s) => s.id)).size).toBe(3);
    for (const s of spread) {
      expect(s.id).toMatch(/^major-\d{2}-/);
      expect(["upright", "reversed"]).toContain(s.orientation);
      expect(s.name?.trim().length).toBeGreaterThan(0);
    }
    await page.screenshot({ path: "test-results/tarot-panel.png" });
    expect(errors).toEqual([]);
  });

  test("rapid input cannot corrupt the spread", async ({ page }) => {
    await enterGarden(page);
    await page.getByRole("button", { name: /^Career/ }).click();
    const draw = page.getByRole("button", { name: "Draw a card for me" });
    // Hammer the draw button: exactly three picks, never more.
    await Promise.all(Array.from({ length: 6 }, () => draw.click({ force: true }).catch(() => undefined)));
    await expect(controls(page)).toHaveAttribute("data-picks", "3");
    await expect(draw).toHaveCount(0);
    // A click carried over from hammering "draw" must not flip a card.
    await expect(controls(page)).toHaveAttribute("data-revealed", "0");

    // Rapid double-clicks on "turn" reveal one card per pacing interval.
    const turn = page.getByTestId("tarot-turn");
    await turn.dblclick();
    await expect(controls(page)).toHaveAttribute("data-revealed", "1");
    await expect(turn).toBeDisabled();
    await expect(turn).toHaveText("Turn the Present card");
    await revealAll(page);
    await expect(controls(page)).toHaveAttribute("data-revealed", "3");
  });

  test("restart produces a fresh valid spread and clears the reveal", async ({ page }) => {
    await enterGarden(page);
    const seen: string[][] = [];
    for (let round = 0; round < 3; round++) {
      await page.getByRole("button", { name: /^Self-Discovery/ }).click();
      for (let i = 0; i < 3; i++) await page.getByRole("button", { name: "Draw a card for me" }).click();
      await revealAll(page);
      const spread = await readPanel(page);
      expect(new Set(spread.map((s) => s.id)).size).toBe(3);
      seen.push(spread.map((s) => `${s.id}:${s.orientation}`));
      await page.getByRole("button", { name: "Close reading" }).click();
      await page.getByRole("button", { name: "New reading" }).click();
      await expect(controls(page)).toHaveAttribute("data-phase", "choosing");
      await expect(controls(page)).toHaveAttribute("data-revealed", "0");
      await expect(page.getByRole("complementary")).toHaveCount(0);
    }
    // Three independent shuffles of 22 cards almost surely differ.
    expect(new Set(seen.map((s) => s.join("|"))).size).toBeGreaterThan(1);
  });

  test("Escape closes the reading panel first, then leaves the garden; the reading survives the trip", async ({
    page,
  }) => {
    await enterGarden(page);
    await page.getByRole("button", { name: /^Love/ }).click();
    for (let i = 0; i < 3; i++) await page.getByRole("button", { name: "Draw a card for me" }).click();
    await revealAll(page);
    const before = await readPanel(page);
    await page.keyboard.press("Escape");
    await expect(page.getByRole("complementary")).toHaveCount(0);
    await expect(page.locator("main")).toHaveAttribute("data-view", "tarot");
    await page.keyboard.press("Escape");
    await expect(page.locator("main")).toHaveAttribute("data-view", "sanctuary");
    await page.getByRole("button", { name: /Tarot Garden/ }).click();
    await expect(controls(page)).toHaveAttribute("data-phase", "complete");
    expect(await readPanel(page)).toEqual(before);
  });

  test("missing card artwork still yields a legible, complete reading", async ({ page }) => {
    const errors = collectErrors(page);
    await page.route(/\/cards\/major-.*\.svg$/, (route) => route.fulfill({ status: 404, body: "missing" }));
    await enterGarden(page);
    await page.getByRole("button", { name: /^Love/ }).click();
    for (let i = 0; i < 3; i++) await page.getByRole("button", { name: "Draw a card for me" }).click();
    await revealAll(page);
    const spread = await readPanel(page);
    expect(spread).toHaveLength(3);
    await page.screenshot({ path: "test-results/tarot-missing-art.png" });
    // Only the expected 404s; no crashes.
    expect(errors.filter((e) => !/404|Failed to load resource/.test(e))).toEqual([]);
  });
});
