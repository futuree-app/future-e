// Capture rapide d'une vue : node apercu.cjs <url-relative> <largeur> <theme> <sortie.png>
const { chromium } = require("/Users/quentinbrache/Desktop/Futur·e/node_modules/playwright-core");
(async () => {
  const [chemin, largeur = "1440", theme = "dark", sortie = "apercu.png"] = process.argv.slice(2);
  const b = await chromium.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" });
  const ctx = await b.newContext({ viewport: { width: Number(largeur), height: 900 }, deviceScaleFactor: 1 });
  // Aucune requête hors de localhost (mesure d'audience du layout racine).
  await ctx.route((u) => !/^https?:\/\/localhost(:\d+)?\//.test(u.href), (r) => r.abort());
  const p = await ctx.newPage();
  const erreurs = [];
  p.on("pageerror", (e) => erreurs.push(e.message));
  p.on("console", (m) => { if (m.type() === "error" && !/net::|ERR_FAILED/.test(m.text())) erreurs.push(m.text().slice(0, 300)); });
  await p.goto(`http://localhost:3041${chemin}`, { waitUntil: "networkidle" });
  await p.evaluate((t) => { document.documentElement.dataset.theme = t; }, theme);
  const refuser = p.getByRole("button", { name: /^refuser$/i });
  if (await refuser.count()) await refuser.first().click().catch(() => {});
  await p.waitForTimeout(400);
  await p.screenshot({ path: sortie, fullPage: true });
  const debord = await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  console.log(JSON.stringify({ debord, erreurs }));
  await b.close();
})();
