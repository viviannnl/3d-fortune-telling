// QA helper: walks a full tarot reading and screenshots each step.
// Usage: node scripts/qa/tarot-flow.mjs <baseUrl> <outDir> [locale]
import { chromium } from "playwright";
import fs from "node:fs";

const [base = "http://localhost:3000", out = "/tmp/tarot", locale = "en-US"] = process.argv.slice(2);
fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, locale });
const errors = [];
page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
page.on("pageerror", (e) => errors.push(e.message));
const shot = (n) => page.screenshot({ path: `${out}/${n}.png` });

await page.goto(base);
await page.waitForSelector("[data-world-ready=true] canvas", { timeout: 30000 });
await page.getByRole("navigation").getByRole("button").first().click();
await page.waitForTimeout(3000);
await shot("1-choose");
await page.getByRole("button", { name: /^(Love|感情)/ }).click();
await page.waitForTimeout(2200);
await page.mouse.move(720, 470);
await page.waitForTimeout(800);
await shot("2-fan");
for (let i = 0; i < 3; i++) {
  await page.getByRole("button", { name: /Draw a card for me|帮我抽一张/ }).click();
  await page.waitForTimeout(500);
}
await page.waitForTimeout(1500);
await shot("3-spread");
for (let i = 0; i < 3; i++) {
  await page.getByRole("button", { name: /Turn the|翻开/ }).click();
  await page.waitForTimeout(i === 0 ? 1200 : 900);
  if (i === 0) await shot("4-first-reveal");
}
await page.waitForTimeout(1200);
await shot("5-complete");
await page.getByRole("button", { name: /Read the interpretation|查看解读/ }).click();
await page.waitForTimeout(900);
await shot("6-panel");
console.log(errors.length ? errors : "no errors");
await browser.close();
