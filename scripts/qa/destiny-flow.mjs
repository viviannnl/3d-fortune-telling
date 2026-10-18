// QA helper: fills the birth form, calculates, explores; screenshots each step.
// Usage: node scripts/qa/destiny-flow.mjs <baseUrl> <outDir> [locale]
import { chromium } from "playwright";
import fs from "node:fs";

const [base = "http://localhost:3000", out = "/tmp/destiny", locale = "en-US"] = process.argv.slice(2);
fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, locale });
const errors = [];
page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
page.on("pageerror", (e) => errors.push(e.message));
const shot = (n) => page.screenshot({ path: `${out}/${n}.png` });

await page.goto(base);
await page.waitForSelector("[data-world-ready=true] canvas", { timeout: 30000 });
await page.getByRole("navigation").getByRole("button").nth(1).click();
await page.waitForTimeout(3000);
await page.locator("form button[type=submit]").click();
await page.waitForTimeout(400);
await shot("1-errors");
await page.locator("#birth-date").fill("1990-05-17");
await page.locator("#birth-time").fill("08:45");
await page.locator("#birth-place").selectOption("shanghai");
await page.locator("form button[type=submit]").click();
await page.waitForTimeout(3500);
await shot("2-chart");
await page.locator("[data-element=fire]").click();
await page.waitForTimeout(800);
await shot("3-element");
await page.locator("[data-pillar=day]").click();
await page.waitForTimeout(800);
await shot("4-pillar");
console.log(errors.length ? errors : "no errors");
await browser.close();
