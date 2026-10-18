import { expect, test, type Page } from "@playwright/test";
import { collectErrors, gotoReady } from "./helpers";

test.use({ locale: "en-US" });
test.describe.configure({ timeout: 120_000 });

async function completeTarot(page: Page) {
  await gotoReady(page);
  await page.getByRole("button", { name: /Tarot Garden/ }).click();
  await page.getByRole("button", { name: /^Love/ }).click();
  for (let i = 0; i < 3; i++) await page.getByRole("button", { name: "Draw a card for me" }).click();
  for (const pos of ["Past", "Present", "Future"])
    await page.getByRole("button", { name: `Turn the ${pos} card` }).click();
  await page.getByRole("button", { name: "Read the interpretation" }).click();
  return page
    .getByRole("complementary")
    .locator("li[data-card-id]")
    .evaluateAll((els) =>
      els.map((el) => [
        el.getAttribute("data-position"),
        el.getAttribute("data-card-id"),
        el.getAttribute("data-orientation"),
      ]),
    );
}

test.describe("AI interpretation — tarot", () => {
  test("sends exactly the selected spread, shows the reflection, and never re-requests on repeat clicks", async ({
    page,
  }) => {
    const errors = collectErrors(page);
    const bodies: unknown[] = [];
    page.on("request", (r) => {
      if (r.url().includes("/api/interpret/")) bodies.push(r.postDataJSON());
    });
    const spread = await completeTarot(page);
    const generate = page.getByRole("button", { name: "Generate reflection" });
    await generate.dblclick();
    await expect(page.getByTestId("interpretation")).toBeVisible();
    expect(bodies).toHaveLength(1);
    expect(bodies[0]).toEqual({
      locale: "en",
      category: "love",
      selections: spread.map(([position, cardId, orientation]) => ({ cardId, orientation, position })),
    });
    // Items correspond to the exact cards, in order.
    const keys = await page
      .getByTestId("interpretation")
      .locator("li[data-key]")
      .evaluateAll((els) => els.map((e) => e.getAttribute("data-key")));
    expect(keys).toEqual(spread.map(([, id]) => id));
    // Closing and reopening reuses the result.
    await page.getByRole("button", { name: "Close reading" }).click();
    await page.getByRole("button", { name: "Read the interpretation" }).click();
    await expect(page.getByTestId("interpretation")).toBeVisible();
    expect(bodies).toHaveLength(1);
    // No secrets or keys in what the browser received.
    const html = await page.content();
    expect(html).not.toMatch(/sk-ant|ANTHROPIC_API_KEY/);
    expect(errors).toEqual([]);
  });

  test("a provider error shows a clear message and Try again recovers", async ({ page }) => {
    let calls = 0;
    await page.route("**/api/interpret/tarot", async (route) => {
      calls += 1;
      if (calls === 1) return route.fulfill({ status: 502, json: { ok: false, error: "provider_error" } });
      return route.continue();
    });
    await completeTarot(page);
    await page.getByRole("button", { name: "Generate reflection" }).click();
    await expect(page.getByRole("complementary").getByRole("alert")).toContainText("had a problem");
    // The curated reading stays fully readable.
    await expect(page.getByRole("complementary").locator("li[data-card-id]")).toHaveCount(3);
    await page.getByRole("button", { name: "Try again" }).click();
    await expect(page.getByTestId("interpretation")).toBeVisible();
    expect(calls).toBe(2);
  });

  test("missing configuration explains itself and offers no pointless retry", async ({ page }) => {
    await page.route("**/api/interpret/tarot", (route) =>
      route.fulfill({ status: 503, json: { ok: false, error: "not_configured" } }),
    );
    await completeTarot(page);
    await page.getByRole("button", { name: "Generate reflection" }).click();
    await expect(page.getByText(/aren't set up on this server/)).toBeVisible();
    await expect(page.getByRole("button", { name: "Try again" })).toHaveCount(0);
  });

  test("a malformed or mismatched response is never shown", async ({ page }) => {
    let n = 0;
    await page.route("**/api/interpret/tarot", (route) => {
      n += 1;
      return n === 1
        ? route.fulfill({ status: 200, body: "<html>proxy error</html>", contentType: "text/html" })
        : route.fulfill({
            status: 200,
            json: {
              ok: true,
              subject: ["past:major-00-fool:upright"],
              interpretation: {
                overview: "x".repeat(60),
                items: [],
                themes: ["a", "b"],
                reflectionQuestions: ["What now?", "What next?"],
                suggestions: ["Rest well.", "Walk slowly."],
                shareableSummary: "Summary here.",
              },
            },
          });
    });
    await completeTarot(page);
    await page.getByRole("button", { name: "Generate reflection" }).click();
    await expect(page.getByText(/came back incomplete/)).toBeVisible();
    await page.getByRole("button", { name: "Try again" }).click();
    await expect(page.getByText(/didn't match this reading/)).toBeVisible();
    await expect(page.getByTestId("interpretation")).toHaveCount(0);
  });

  test("a hung request times out to a recoverable state on the client", async ({ page }) => {
    await page.clock.install();
    await page.route("**/api/interpret/tarot", () => {
      /* never respond */
    });
    await completeTarot(page);
    await page.getByRole("button", { name: "Generate reflection" }).click();
    await expect(page.getByText("Listening to the stars…")).toBeVisible();
    await page.clock.fastForward(80_000);
    await expect(page.getByText(/took too long/)).toBeVisible();
  });
});

test.describe("AI interpretation — destiny", () => {
  test("sends birth details only to our server, receives the chart-specific reflection", async ({ page }) => {
    const bodies: unknown[] = [];
    page.on("request", (r) => {
      if (r.url().includes("/api/interpret/")) bodies.push(r.postDataJSON());
    });
    await gotoReady(page);
    await page.getByRole("button", { name: /Destiny Palace/ }).click();
    await page.getByLabel("Birth date", { exact: true }).fill("1990-05-17");
    await page.getByLabel("Birth time", { exact: true }).fill("08:45");
    await page.getByLabel("Birthplace").selectOption("shanghai");
    await page.getByRole("button", { name: "Calculate chart" }).click();
    await page.getByRole("button", { name: "Open reflection" }).click();
    await page.getByLabel("Focus").selectOption("career");
    await page.getByRole("button", { name: "Generate reflection" }).click();
    await expect(page.getByTestId("interpretation")).toBeVisible();
    expect(bodies).toEqual([
      {
        locale: "en",
        topic: "career",
        birth: { date: "1990-05-17", time: "08:45", timeZone: "Asia/Shanghai", longitude: 121.47 },
      },
    ]);
    const keys = await page
      .getByTestId("interpretation")
      .locator("li[data-key]")
      .evaluateAll((els) => els.map((e) => e.getAttribute("data-key")));
    expect(keys).toEqual(["year", "month", "day", "hour"]);
    await page.keyboard.press("Escape");
    await expect(page.getByRole("complementary")).toHaveCount(0);
    await expect(page.locator("main")).toHaveAttribute("data-view", "destiny");
  });
});
