// QA helper: screenshots + console errors for a running server.
// Usage: node scripts/qa/shoot.mjs <baseUrl> <outDir> [scenario...]
import { chromium } from "playwright";
import fs from "node:fs";

const [base = "http://localhost:3000", out = "/tmp/shots", ...names] = process.argv.slice(2);
fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });

const scenarios = {
  "desktop-en": { viewport: { width: 1440, height: 900 }, locale: "en-US" },
  "desktop-zh": { viewport: { width: 1440, height: 900 }, locale: "zh-CN" },
  "mobile-en": { viewport: { width: 390, height: 844 }, locale: "en-US", deviceScaleFactor: 2 },
};

for (const name of names.length ? names : Object.keys(scenarios)) {
  const [preset, ...steps] = name.split(":");
  const ctx = await browser.newContext(scenarios[preset]);
  const page = await ctx.newPage();
  const errors = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(base);
  await page.waitForSelector("[data-world-ready=true] canvas", { timeout: 30000 });
  await page.waitForTimeout(2500);
  for (const step of steps) {
    if (step.startsWith("hover-")) await page.mouse.move(...step.slice(6).split("x").map(Number));
    else if (step.startsWith("click-")) await page.getByRole("button", { name: step.slice(6).replaceAll("_", " ") }).first().click();
    else if (step.startsWith("wait-")) await page.waitForTimeout(Number(step.slice(5)));
  }
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `${out}/${name.replaceAll(":", "_")}.png` });
  console.log(name, errors.length ? errors : "no errors");
  await ctx.close();
}
await browser.close();
