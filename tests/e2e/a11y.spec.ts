import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { gotoReady } from "./helpers";

test.use({ locale: "en-US" });
test.describe.configure({ timeout: 120_000 });

async function scan(page: Page, label: string) {
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  const serious = results.violations
    .filter((v) => v.impact === "serious" || v.impact === "critical")
    .map(
      (v) =>
        `${label}: ${v.id} — ${v.help} (${v.nodes
          .map((n) => n.target.join(" "))
          .slice(0, 3)
          .join(", ")})`,
    );
  expect(serious).toEqual([]);
}

test("no serious accessibility violations across the main screens", async ({ page }) => {
  await gotoReady(page);
  await scan(page, "sanctuary");

  await page.getByRole("button", { name: /Tarot Garden/ }).click();
  await scan(page, "tarot-choose");
  await page.getByRole("button", { name: /^Love/ }).click();
  for (let i = 0; i < 3; i++) await page.getByRole("button", { name: "Draw a card for me" }).click();
  for (const pos of ["Past", "Present", "Future"])
    await page.getByRole("button", { name: `Turn the ${pos} card` }).click();
  await page.getByRole("button", { name: "Read the interpretation" }).click();
  await page.getByRole("button", { name: "Generate reflection" }).click();
  await expect(page.getByTestId("interpretation")).toBeVisible();
  await scan(page, "tarot-reading");
  await page.keyboard.press("Escape");
  await page.keyboard.press("Escape");

  await page.getByRole("button", { name: /Destiny Palace/ }).click();
  await page.getByRole("button", { name: "Calculate chart" }).click();
  await scan(page, "destiny-form-errors");
  await page.getByLabel("Birth date", { exact: true }).fill("2000-01-01");
  await page.getByLabel("Birth time", { exact: true }).fill("12:00");
  await page.getByLabel("Birthplace").selectOption("beijing");
  await page.getByRole("button", { name: "Calculate chart" }).click();
  await page.locator("[data-pillar=day]").click();
  await scan(page, "destiny-chart");

  await page.goto("/about");
  await scan(page, "about");
});

test("keyboard-only: every step of a tarot reading is reachable and operable", async ({ page }) => {
  await gotoReady(page);
  const pressUntilFocused = async (name: RegExp | string) => {
    const target = page.getByRole("button", { name });
    for (let i = 0; i < 25; i++) {
      if (await target.evaluate((el) => el === document.activeElement).catch(() => false)) return;
      await page.keyboard.press("Tab");
    }
    await expect(target).toBeFocused();
  };
  await pressUntilFocused(/Tarot Garden/);
  await page.keyboard.press("Enter");
  await pressUntilFocused(/^Self-Discovery/);
  await page.keyboard.press("Enter");
  for (let i = 0; i < 3; i++) {
    await pressUntilFocused("Draw a card for me");
    await page.keyboard.press("Enter");
  }
  for (const pos of ["Past", "Present", "Future"]) {
    await pressUntilFocused(`Turn the ${pos} card`);
    await expect(page.getByRole("button", { name: `Turn the ${pos} card` })).toBeEnabled();
    await page.keyboard.press("Enter");
  }
  await pressUntilFocused("Read the interpretation");
  await page.keyboard.press("Enter");
  await expect(page.getByRole("heading", { name: "Your reading" })).toBeFocused();
  // Focus is visibly indicated.
  await page.keyboard.press("Tab");
  const outline = await page.evaluate(() => getComputedStyle(document.activeElement as Element).outlineStyle);
  expect(outline).not.toBe("none");
});
