#!/usr/bin/env node
// Sanity checks for generated card SVGs (no dependencies).
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const DIR = join(resolve(dirname(fileURLToPath(import.meta.url)), "..", ".."), "public", "cards");
const expected = [
  "major-00-fool", "major-01-magician", "major-02-high-priestess", "major-03-empress", "major-04-emperor",
  "major-05-hierophant", "major-06-lovers", "major-07-chariot", "major-08-strength", "major-09-hermit",
  "major-10-wheel-of-fortune", "major-11-justice", "major-12-hanged-man", "major-13-death", "major-14-temperance",
  "major-15-devil", "major-16-tower", "major-17-star", "major-18-moon", "major-19-sun", "major-20-judgement",
  "major-21-world", "card-back",
].map((n) => `${n}.svg`);

const problems = [];
const present = new Set(readdirSync(DIR));
for (const name of expected) {
  if (!present.has(name)) { problems.push(`${name}: missing`); continue; }
  const s = readFileSync(join(DIR, name), "utf8");
  if (!s.startsWith("<svg")) problems.push(`${name}: does not start with <svg`);
  if (!s.includes('width="600" height="1000"')) problems.push(`${name}: missing width/height`);
  if (!s.includes('viewBox="0 0 600 1000"')) problems.push(`${name}: missing viewBox`);
  if (/href="http/i.test(s) || /@import|foreignObject|@font-face|url\(\s*['"]?http/i.test(s))
    problems.push(`${name}: external reference / forbidden construct`);
  if (/NaN|undefined/.test(s)) problems.push(`${name}: contains NaN/undefined`);
  // naive tag balance check
  const opens = (s.match(/<([a-zA-Z]+)(\s[^>]*)?(?<!\/)>/g) || []).length;
  const closes = (s.match(/<\/[a-zA-Z]+>/g) || []).length;
  if (opens !== closes) problems.push(`${name}: unbalanced tags (${opens} open, ${closes} close)`);
}
if (problems.length) { console.error(problems.join("\n")); process.exit(1); }
console.log(`OK: ${expected.length} SVGs verified in ${DIR}`);
