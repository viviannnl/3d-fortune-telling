import { expect, test, type Page } from "@playwright/test";
import { collectErrors, gotoReady } from "./helpers";

test.use({ locale: "en-US" });
test.describe.configure({ timeout: 90_000 });

const controls = (page: Page) => page.getByTestId("destiny-controls");

async function enterPalace(page: Page) {
  await gotoReady(page);
  await page.getByRole("button", { name: /Destiny Palace/ }).click();
  await expect(controls(page)).toHaveAttribute("data-state", "form");
}

async function fill(page: Page, v: { date: string; time?: string; place: string }) {
  await page.getByLabel("Birth date", { exact: true }).fill(v.date);
  if (v.time) await page.getByLabel("Birth time", { exact: true }).fill(v.time);
  await page.getByLabel("Birthplace").selectOption(v.place);
}

const pillars = (page: Page) =>
  page
    .locator("[data-testid=destiny-chart] [data-pillar]")
    .evaluateAll((els) => els.map((el) => el.getAttribute("data-name")));

test.describe("destiny palace", () => {
  test("validates required fields with useful messages and no chart", async ({ page }) => {
    await enterPalace(page);
    await page.getByRole("button", { name: "Calculate chart" }).click();
    await expect(page.getByText("Enter your birth date.")).toBeVisible();
    await expect(page.getByText(/Enter your birth time, or choose/)).toBeVisible();
    await expect(page.getByText(/Choose your birthplace/)).toBeVisible();
    await expect(page.getByLabel("Birth date", { exact: true })).toHaveAttribute("aria-invalid", "true");
    await expect(page.getByLabel("Birth date", { exact: true })).toBeFocused();
    await expect(page.getByTestId("destiny-chart")).toHaveCount(0);

    await fill(page, { date: "2099-01-01", time: "10:00", place: "beijing" });
    await page.getByRole("button", { name: "Calculate chart" }).click();
    await expect(page.getByText("The birth date can't be in the future.")).toBeVisible();
    await expect(page.getByTestId("destiny-chart")).toHaveCount(0);
  });

  test("calculates a reference chart, explores it, and recalculation updates the sphere", async ({ page }) => {
    const errors = collectErrors(page);
    await enterPalace(page);
    await fill(page, { date: "2000-01-01", time: "12:00", place: "beijing" });
    await page.getByRole("button", { name: "Calculate chart" }).click();
    await expect(controls(page)).toHaveAttribute("data-state", "chart");
    expect(await pillars(page)).toEqual(["己卯", "丙子", "戊午", "戊午"]);
    await expect(page.getByTestId("destiny-chart")).toHaveAttribute("data-day-master", "戊");
    // 己卯 丙子 戊午 戊午 → wood 1, fire 3, earth 3, metal 0, water 1
    const counts = await page
      .locator("[data-element]")
      .evaluateAll((els) => els.map((el) => [el.getAttribute("data-element"), el.getAttribute("data-count")]));
    expect(counts).toEqual([
      ["wood", "1"],
      ["fire", "3"],
      ["earth", "3"],
      ["metal", "0"],
      ["water", "1"],
    ]);

    await page.getByRole("button", { name: /^Fire/ }).click();
    await expect(page.getByRole("heading", { level: 4, name: /Fire · 3/ })).toBeVisible();
    await page.locator("[data-pillar=day]").click();
    await expect(page.getByRole("heading", { level: 4, name: /Day Pillar · 戊午/ })).toBeVisible();
    await page.waitForTimeout(2500); // staged reveal
    await page.screenshot({ path: "test-results/destiny-chart.png" });

    await page.getByRole("button", { name: "Edit birth details" }).click();
    await page.getByLabel("Birth date", { exact: true }).fill("1949-10-01");
    await page.getByLabel("Birth time", { exact: true }).fill("15:00");
    await page.getByRole("button", { name: "Calculate chart" }).click();
    await expect(controls(page)).toHaveAttribute("data-state", "chart");
    const second = await pillars(page);
    expect(second[2]).toBe("甲子");
    await expect(page.getByTestId("destiny-chart")).toHaveAttribute("data-day-master", "甲");
    expect(errors).toEqual([]);
  });

  test("unknown birth time is handled honestly", async ({ page }) => {
    await enterPalace(page);
    await page.getByLabel("Birth date", { exact: true }).fill("2024-02-04");
    await page.getByLabel("I don't know my birth time").check();
    await expect(page.getByLabel("Birth time", { exact: true })).toBeDisabled();
    await page.getByLabel("Birthplace").selectOption("shanghai");
    await page.getByRole("button", { name: "Calculate chart" }).click();
    const names = await pillars(page);
    expect(names[3]).toBe("");
    await expect(page.locator("[data-pillar=hour]")).toContainText("Unknown");
    await expect(page.getByText(/6 visible characters counted/)).toBeVisible();
    await expect(page.locator("[data-ambiguity=year]")).toContainText("癸卯 / 甲辰");
    await expect(page.locator("[data-ambiguity=month]")).toContainText("乙丑 / 丙寅");
  });

  test("daylight-saving gaps and overlaps never produce a misleading chart", async ({ page }) => {
    await enterPalace(page);
    await fill(page, { date: "2023-03-12", time: "02:30", place: "newyork" });
    await page.getByRole("button", { name: "Calculate chart" }).click();
    await expect(controls(page).getByRole("alert")).toContainText("didn't exist at the birthplace");
    await expect(page.getByTestId("destiny-chart")).toHaveCount(0);

    await page.getByLabel("Birth date", { exact: true }).fill("2023-11-05");
    await page.getByLabel("Birth time", { exact: true }).fill("01:30");
    await page.getByRole("button", { name: "Calculate chart" }).click();
    await expect(controls(page).getByRole("alert")).toContainText("Choose which occurrence");
    await page.getByLabel("The second time (standard time)").check();
    await page.getByRole("button", { name: "Calculate chart" }).click();
    await expect(controls(page)).toHaveAttribute("data-state", "chart");
    expect((await pillars(page))[3]).toMatch(/丑$/);
  });

  test("a time zone outside the city list works, with a validated zone", async ({ page }) => {
    await enterPalace(page);
    await page.getByLabel("Birth date", { exact: true }).fill("1995-08-20");
    await page.getByLabel("Birth time", { exact: true }).fill("09:15");
    await page.getByLabel("Birthplace").selectOption("other");
    await page.getByLabel("Time zone").fill("Not/AZone");
    await page.getByRole("button", { name: "Calculate chart" }).click();
    await expect(page.getByText(/Choose a time zone from the list/)).toBeVisible();
    await page.getByLabel("Time zone").fill("Europe/Lisbon");
    await page.getByRole("button", { name: "Calculate chart" }).click();
    await expect(controls(page)).toHaveAttribute("data-state", "chart");
  });

  test("chart content switches language without recalculating", async ({ page }) => {
    await enterPalace(page);
    await fill(page, { date: "2000-01-01", time: "12:00", place: "beijing" });
    await page.getByRole("button", { name: "Calculate chart" }).click();
    const before = await pillars(page);
    await page.getByRole("button", { name: "中文" }).click();
    await expect(page.getByRole("heading", { name: "你的四柱" })).toBeVisible();
    expect(await pillars(page)).toEqual(before);
  });

  test("names the solar term the chart was born under", async ({ page }) => {
    await enterPalace(page);
    await fill(page, { date: "2024-02-20", time: "12:00", place: "shanghai" });
    await page.getByRole("button", { name: "Calculate chart" }).click();
    expect((await pillars(page))[1]).toBe("丙寅");
    await expect(page.getByTestId("birth-term")).toContainText("立春");
    await page.waitForTimeout(2000);
    await page.screenshot({ path: "test-results/destiny-term-mark.png" });
  });
});
