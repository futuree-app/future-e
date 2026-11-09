// Captures du prototype V4.1 de Work (HTML autonome), pour le comparatif V4 / V4.1 Claude / V4.1 Work / V5.
// Ouvert en file:// ; toute requête réseau est bloquée (la page n'en fait aucune : CSP connect-src 'none').
const path = require("path");
const { chromium } = require("/Users/quentinbrache/Desktop/Futur·e/node_modules/playwright-core");
const FICHIER = "file://" + path.join(__dirname, "..", "prototype-v41-work", "index.html");
const OUT = path.join(__dirname, "..", "captures-v41-work");
(async () => {
  const b = await chromium.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" });
  const res = [];
  for (const [largeur, theme] of [[1440, "dark"], [390, "light"]]) {
    const ctx = await b.newContext({ viewport: { width: largeur, height: largeur > 900 ? 900 : 780 } });
    await ctx.route((u) => !u.href.startsWith("file://"), (r) => r.abort());
    const p = await ctx.newPage();
    const err = []; p.on("pageerror", (e) => err.push(e.message));
    const vue = async (nom, s, geste) => {
      await p.goto(`${FICHIER}?s=${s}`); await p.evaluate((t) => { document.documentElement.dataset.theme = t; }, theme);
      if (geste) await geste();
      await p.waitForTimeout(200);
      const f = `${nom}-${largeur}-${theme === "dark" ? "sombre" : "clair"}.png`;
      await p.screenshot({ path: path.join(OUT, f), fullPage: true });
      res.push({ f, debord: await p.evaluate(() => document.documentElement.scrollWidth - innerWidth), err: [...err] }); err.length = 0;
    };
    await vue("01-accueil-mixte", "mixte");
    await vue("02-comparer-communes", "mixte", () => p.locator("[data-action=compare]").first().click());
    await vue("03-comparer-logements", "compare");
    await vue("04-accueil-vide", "vide");
    await vue("05-fiche-logement", "mixte", () => p.locator("[data-home=n2]").first().click());
    await vue("06-accueil-dix", "dix");
    await ctx.close();
  }
  await b.close();
  console.log(JSON.stringify(res));
})();
