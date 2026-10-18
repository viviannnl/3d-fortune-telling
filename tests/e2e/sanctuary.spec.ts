import { expect, test } from "@playwright/test";
import { collectErrors, destinationPoint, gotoReady } from "./helpers";

test.use({ locale: "en-US" });

test.describe("sanctuary", () => {
  test("shows the hint, destinations, and both 3D name tags", async ({ page }) => {
    const errors = collectErrors(page);
    await gotoReady(page);
    await expect(page.getByText("Move to explore · Click to enter")).toBeVisible();
    const nav = page.getByRole("navigation", { name: "Destinations" });
    await expect(nav.getByRole("button", { name: /Tarot Garden/ })).toBeVisible();
    await expect(nav.getByRole("button", { name: /Destiny Palace/ })).toBeVisible();
    expect(errors).toEqual([]);
  });

  for (const [name, view] of [
    ["Tarot Garden", "tarot"],
    ["Destiny Palace", "destiny"],
  ] as const) {
    test(`hovering and clicking the 3D ${name} enters it`, async ({ page }) => {
      const errors = collectErrors(page);
      await gotoReady(page);
      const point = await destinationPoint(page, name);
      const navButton = page.getByRole("navigation").getByRole("button", { name: new RegExp(name) });

      await page.mouse.move(point.x, point.y, { steps: 5 });
      await expect(navButton).toHaveAttribute("data-active", "true");
      await expect.poll(() => page.evaluate(() => document.body.style.cursor)).toBe("pointer");

      await page.mouse.move(5, 450, { steps: 5 });
      await expect(navButton).toHaveAttribute("data-active", "false");

      await page.mouse.move(point.x, point.y, { steps: 5 });
      await page.mouse.click(point.x, point.y);
      await expect(page.locator("main")).toHaveAttribute("data-view", view);
      await expect(page.getByRole("heading", { level: 2, name })).toBeVisible();
      await expect(page.getByRole("button", { name: "Return to the sanctuary" })).toBeVisible();
      expect(await page.evaluate(() => document.body.style.cursor)).toBe("");
      expect(errors).toEqual([]);
    });
  }

  test("keyboard: enter a destination with the nav and leave with Escape", async ({ page }) => {
    await gotoReady(page);
    const tarot = page.getByRole("button", { name: /Tarot Garden/ });
    await tarot.focus();
    await expect(tarot).toHaveAttribute("data-active", "true");
    await page.keyboard.press("Enter");
    await expect(page.locator("main")).toHaveAttribute("data-view", "tarot");
    await page.keyboard.press("Escape");
    await expect(page.locator("main")).toHaveAttribute("data-view", "sanctuary");
    await expect(page.getByRole("button", { name: /Destiny Palace/ })).toBeVisible();
  });

  test("rapid repeated clicks produce one stable transition", async ({ page }) => {
    await gotoReady(page);
    const tarot = page.getByRole("button", { name: /Tarot Garden/ });
    await tarot.click({ clickCount: 3, delay: 10 });
    await expect(page.locator("main")).toHaveAttribute("data-view", "tarot");
    await page.getByRole("button", { name: "Return to the sanctuary" }).click();
    await expect(page.locator("main")).toHaveAttribute("data-view", "sanctuary");
  });
});

test.describe("sound", () => {
  test("never creates audio before opt-in and toggles immediately", async ({ page }) => {
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
    await gotoReady(page);
    const toggle = page.getByRole("button", { name: "Sound", exact: true });
    await expect(toggle).toHaveAttribute("aria-pressed", "false");

    // Interacting with the world must not start audio on its own.
    await page.getByRole("button", { name: /Tarot Garden/ }).click();
    await page.getByRole("button", { name: "Return to the sanctuary" }).click();
    expect(await page.evaluate(() => (window as unknown as { __audioContexts: number }).__audioContexts)).toBe(0);

    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-pressed", "true");
    expect(await page.evaluate(() => (window as unknown as { __audioContexts: number }).__audioContexts)).toBe(1);

    // Stays on across scene transitions, then turns off.
    await page.getByRole("button", { name: /Destiny Palace/ }).click();
    await expect(toggle).toHaveAttribute("aria-pressed", "true");
    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-pressed", "false");
    await page.getByRole("button", { name: "Return to the sanctuary" }).click();
    await expect(toggle).toHaveAttribute("aria-pressed", "false");

    // Not persisted: a reload starts silent again.
    await page.reload();
    await expect(page.getByRole("button", { name: "Sound", exact: true })).toHaveAttribute("aria-pressed", "false");
  });

  test("music and effects volumes are adjustable, remembered, and Escape only closes the panel", async ({ page }) => {
    test.setTimeout(75_000); // two loads, each with the short entrance, plus a few seconds of music
    const errors = collectErrors(page);
    await gotoReady(page);
    // The settings only exist once sound is on.
    await expect(page.getByTestId("sound-settings")).toHaveCount(0);
    await page.getByRole("button", { name: "Sound", exact: true }).click();
    await page.getByRole("button", { name: /Tarot Garden/ }).click();
    await expect(page.locator("main")).toHaveAttribute("data-view", "tarot");

    await page.getByTestId("sound-settings").click();
    const music = page.getByRole("slider", { name: "Music" });
    const effects = page.getByRole("slider", { name: "Effects" });
    await expect(music).toBeVisible();
    await expect(music).toHaveValue("70");
    await music.fill("30");
    await effects.fill("100");
    await expect(music).toHaveAttribute("aria-valuetext", "30%");

    // Escape closes the panel, not the destination.
    await page.keyboard.press("Escape");
    await expect(music).toBeHidden();
    await expect(page.locator("main")).toHaveAttribute("data-view", "tarot");

    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("mts-preferences") ?? "{}"));
    expect(saved.state).toMatchObject({ musicVolume: 0.3, effectsVolume: 1 });

    // Remembered across a reload, while sound itself starts off again.
    await page.reload();
    await page.getByRole("button", { name: "Sound", exact: true }).click();
    await page.getByTestId("sound-settings").click();
    await expect(page.getByRole("slider", { name: "Music" })).toHaveValue("30");
    // Let the score play for a moment so scheduling errors would surface.
    await page.waitForTimeout(4000);
    expect(errors).toEqual([]);
  });
});

test.describe("mount / unmount", () => {
  test("navigating away and back repeatedly leaves one live canvas and no WebGL warnings", async ({ page }) => {
    test.setTimeout(150_000); // each re-mount compiles shaders under software WebGL
    const warnings: string[] = [];
    page.on("console", (msg) => {
      if (/WebGL|context/i.test(msg.text()) && msg.type() !== "debug") warnings.push(`${msg.type()}: ${msg.text()}`);
    });
    const errors = collectErrors(page);
    await gotoReady(page);
    for (let i = 0; i < 6; i++) {
      await page.getByRole("link", { name: "About & methods" }).click();
      await expect(page.getByRole("heading", { level: 1, name: "About & methods" })).toBeVisible();
      await expect(page.locator("canvas")).toHaveCount(0);
      await page.getByRole("link", { name: "Return to the sanctuary" }).click();
      await expect(page.locator("[data-world-ready=true] canvas")).toBeVisible({ timeout: 30_000 });
    }
    await expect(page.locator("canvas")).toHaveCount(1);
    expect(warnings.filter((w) => /too many active|context lost/i.test(w))).toEqual([]);
    expect(errors).toEqual([]);
  });
});

test.describe("hidden charms", () => {
  test("clicking the moon reveals a blessing and counts the find; it never blocks destinations", async ({ page }) => {
    const errors = collectErrors(page);
    await gotoReady(page);
    await expect(page.getByText(/Some lights hide small secrets/)).toBeVisible();
    await expect(page.getByTestId("charm-progress")).toHaveCount(0);
    // The moon sits at the centre of the sanctuary view.
    const box = await page.locator("canvas").boundingBox();
    if (!box) throw new Error("no canvas");
    await page.mouse.click(box.x + box.width / 2, box.y + box.height * 0.44);
    const blessing = page.getByTestId("blessing");
    await expect(blessing).toBeVisible();
    expect((await blessing.innerText()).trim().length).toBeGreaterThan(8);
    await expect(page.getByTestId("charm-progress")).toContainText("1 of 8");
    // A second click on the same charm shows another blessing but doesn't double-count.
    await page.getByRole("button", { name: "Close message" }).click();
    await page.mouse.click(box.x + box.width / 2, box.y + box.height * 0.44);
    await expect(blessing).toBeVisible();
    await expect(page.getByTestId("charm-progress")).toContainText("1 of 8");
    // Destinations still work afterwards.
    await page.getByRole("button", { name: /Tarot Garden/ }).click();
    await expect(page.locator("main")).toHaveAttribute("data-view", "tarot");
    await expect(blessing).toHaveCount(0);
    expect(errors).toEqual([]);
  });
});

test.describe("time, season and small interactions", () => {
  test("shows the real lunar date, solar term and moon phase", async ({ page }) => {
    const errors = collectErrors(page);
    await gotoReady(page);
    const line = page.getByTestId("sky-line");
    await expect(line).toBeVisible();
    // Four facts, separated by middots.
    const text = await line.innerText();
    expect(text.split("·").length).toBeGreaterThanOrEqual(4);
    await expect(line).toHaveAttribute("data-season", /spring|summer|autumn|winter/);
    await expect(line).toHaveAttribute("data-mood", /dusk|night|deepNight|dawn|day/);
    expect(errors).toEqual([]);
  });

  test("the season and hour overrides repaint the sanctuary", async ({ page }) => {
    await gotoReady(page, "/?sky=winter&hour=5");
    const line = page.getByTestId("sky-line");
    await expect(line).toHaveAttribute("data-season", "winter");
    await expect(line).toHaveAttribute("data-mood", "dawn");
    await page.waitForTimeout(2500);
    await page.screenshot({ path: "test-results/sanctuary-winter-dawn.png" });
  });

  test("a wish releases a lantern, stays local, and survives a reload", async ({ page }) => {
    const errors = collectErrors(page);
    const bodies: string[] = [];
    page.on("request", (r) => {
      const data = r.postData();
      if (data) bodies.push(data);
    });
    await gotoReady(page);
    await expect(page.getByTestId("wish-count")).toHaveCount(0);
    await page.getByTestId("wish-open").click();

    // An empty wish is refused.
    await page.getByRole("button", { name: "Set it adrift" }).click();
    await expect(page.getByText("Write something first.")).toBeVisible();

    await page.getByTestId("wish-form").locator("input").fill("  let me be patient  ");
    await page.getByRole("button", { name: "Set it adrift" }).click();
    await expect(page.getByText("Your lantern is drifting out across the water.")).toBeVisible();
    await expect(page.getByTestId("wish-count")).toContainText("1 of your lanterns");

    // The wish never leaves the browser.
    expect(bodies.filter((b) => b.includes("patient"))).toEqual([]);
    expect(await page.evaluate(() => localStorage.getItem("mts-wishes"))).toContain("let me be patient");

    await page.reload();
    await expect(page.locator("[data-world-ready=true] canvas")).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId("wish-count")).toContainText("1 of your lanterns");

    // Clearing forgets it.
    await page.getByTestId("wish-open").click();
    await page.getByRole("button", { name: "Clear my lanterns" }).click();
    await expect(page.getByTestId("wish-count")).toHaveCount(0);
    expect(errors).toEqual([]);
  });

  test("clicking the water ripples without disturbing the page", async ({ page }) => {
    const errors = collectErrors(page);
    await gotoReady(page);
    const box = await page.locator("canvas").boundingBox();
    if (!box) throw new Error("no canvas");
    // Low on the canvas is open water in front of the terrace.
    await page.mouse.click(box.x + box.width * 0.52, box.y + box.height * 0.68);
    await expect(page.locator("main")).toHaveAttribute("data-view", "sanctuary");
    await expect(page.getByTestId("blessing")).toHaveCount(0);
    await page.getByRole("button", { name: /Tarot Garden/ }).click();
    await expect(page.locator("main")).toHaveAttribute("data-view", "tarot");
    expect(errors).toEqual([]);
  });
});
