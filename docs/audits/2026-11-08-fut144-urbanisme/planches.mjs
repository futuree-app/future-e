import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
const img = (f) => "data:image/png;base64," + readFileSync(f).toString("base64");
const require = createRequire("/Users/quentinbrache/Desktop/Futur·e/.claude/worktrees/fut144/package.json");
const { chromium } = require("playwright-core");
const S = process.argv[2];
const b = await chromium.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" });
const p = await b.newPage({ deviceScaleFactor: 1 });
const planches = [
  ["390-besancon", 390], ["390-sucy", 390], ["390-merignac", 390], ["360-six-fours", 360], ["360-vigueur", 360], ["360-incertaine", 360],
  ["390-sans-preuve", 390], ["390-vauquois", 390], ["bureau-merignac", 1280], ["bureau-besancon-deplie", 1280],
];
for (const [nom, w] of planches) {
  const colonne = w > 600 ? "column" : "row";
  await p.setContent(`<body style="margin:0;background:#0b0d12;font:600 15px system-ui;color:#ddd"><div style="display:flex;flex-direction:${colonne};gap:24px;padding:16px;align-items:flex-start">
    <div><div style="margin:0 0 8px">AVANT (main) · ${nom}</div><img src="${img(`${S}/avant/${nom}.png`)}" style="width:${w}px"></div>
    <div><div style="margin:0 0 8px">APRÈS (FUT-144) · ${nom}</div><img src="${img(`${S}/apres/${nom}.png`)}" style="width:${w}px"></div></div></body>`);
  await p.waitForLoadState("load");
  await p.screenshot({ path: `${S}/planches/${nom}.jpg`, fullPage: true, type: "jpeg", quality: 78 });
}
await b.close();
console.log("ok");
