// Capture rapide d'une vue : node apercu.cjs <url-relative> <largeur> <theme> <sortie.png>
const { chromium } = require("/Users/quentinbrache/Desktop/Futur·e/node_modules/playwright-core");
(async () => {
  const [chemin, largeur = "1440", theme = "dark", sortie = "apercu.png"] = process.argv.slice(2);
  const b = await chromium.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" });
  const p = await b.newPage({ viewport: { width: Number(largeur), height: 900 }, deviceScaleFactor: 1 });
  const erreurs = [];
  p.on("pageerror", (e) => erreurs.push(e.message));
  p.on("console", (m) => { if (m.type() === "error") erreurs.push(m.text()); });
  await p.goto(`http://localhost:3041${chemin}`, { waitUntil: "networkidle" });
  await p.evaluate((t) => { document.documentElement.dataset.theme = t; }, theme);
  await p.waitForTimeout(400);
  await p.screenshot({ path: sortie, fullPage: true });
  const debord = await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  console.log(JSON.stringify({ debord, erreurs }));
  await b.close();
})();
