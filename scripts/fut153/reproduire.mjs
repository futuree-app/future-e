// FUT-153 · Reproduction : séquence d'événements d'un appui tactile réel sur une aide de la matrice.
// Usage : BASE=http://localhost:3153 node scripts/fut153/reproduire.mjs
import { chromium } from "playwright-core";

const BASE = process.env.BASE ?? "http://localhost:3153";
const PAGE = process.env.PAGE ?? "/comparateur?communes=69123,38185,73065";
const nav = await chromium.launch({ channel: "chrome" });
const ctx = await nav.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 3 });
const p = await ctx.newPage();
await p.goto(`${BASE}${PAGE}`, { waitUntil: "networkidle" });
const libelles = await p.locator("[role=tooltip], button.cursor-help").allInnerTexts();
console.log("aides présentes :", libelles.join(" | "));
const cible = p.locator("button.cursor-help").first();
await cible.scrollIntoViewIfNeeded();
await p.evaluate(() => {
  window.__journal = [];
  const b = document.querySelector("button.cursor-help");
  const t0 = performance.now();
  for (const type of ["pointerover", "pointerenter", "pointerdown", "touchstart", "pointerup", "touchend", "mouseover", "mouseenter", "mousemove", "mousedown", "focus", "mouseup", "click"]) {
    b.addEventListener(type, (e) => window.__journal.push(`${Math.round(performance.now() - t0)}ms ${type}${e.pointerType ? `(${e.pointerType})` : ""} → bulle ${document.querySelector("[role=tooltip]:not([hidden])") ? "visible" : "absente"}`), { capture: true });
  }
  new MutationObserver(() => window.__journal.push(`   mutation → bulle ${document.querySelector("[role=tooltip]:not([hidden])") ? "VISIBLE" : "ABSENTE"}`)).observe(b.parentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ["hidden"] });
});
const box = await cible.boundingBox();
await p.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
await p.waitForTimeout(800);
console.log(`appui tactile sur « ${await cible.innerText()} » :`);
for (const l of await p.evaluate(() => window.__journal)) console.log("  " + l);
console.log("bulle visible 800 ms après l'appui :", await p.locator("[role=tooltip]:visible").count() > 0);
await nav.close();
