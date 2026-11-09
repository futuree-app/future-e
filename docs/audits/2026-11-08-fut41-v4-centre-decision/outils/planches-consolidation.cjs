// Planches avant / après de la consolidation V5 (revue Work du 09/11) : V5 initiale à gauche, consolidée à droite.
// Usage : node planches-consolidation.cjs <dossier-avant> <dossier-après> <sortie>
const { chromium } = require("/Users/quentinbrache/Desktop/Futur·e/node_modules/playwright-core");
const fs = require("fs"); const path = require("path");
const [AV, AP, OUT] = process.argv.slice(2);
const P = [
  ["1-accueil", "01-accueil-reference-1440-clair.png", "Accueil : lignes titrées ; Rennes datée ; la gare dite pour qui elle est connue"],
  ["2-comparer-logements", "04-comparer-logements-reference-1440-clair.png", "Comparer : « aucun, parmi ce qui est lu » ; conditions lues par colonne ; médecin à vérifier"],
  ["3-ancien-projet", "07-logement-ancien-projet-1440-clair.png", "Saint-Félix : l'issue ancienne devient « à revoir », la mesure n'est plus colorée comme un dépassement"],
  ["4-meme-commune", "05-comparer-meme-commune-1440-clair.png", "Même commune : la gare tenue, à revoir, à mesurer ; « Et si » près de la comparaison"],
  ["5-communes", "03-comparer-communes-1440-clair.png", "Nantes contre Rennes : la gare se mesure depuis une adresse ; Rennes à revoir"],
];
(async () => {
  const b = await chromium.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" });
  for (const [nom, f, titre] of P) {
    const img = (d) => "data:image/png;base64," + fs.readFileSync(path.join(d, f)).toString("base64");
    const html = `<html><body style="margin:0;background:#f4f1ea;font-family:system-ui;color:#1b1f2a"><div style="padding:14px 20px;font-size:18px;font-weight:600">${titre}</div><div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;padding:0 20px 20px">${[["V5 initiale", img(AV)], ["V5 consolidée", img(AP)]].map(([t, s]) => `<div><div style="font:600 13px monospace;color:#555;margin-bottom:6px">${t}</div><div style="height:1090px;overflow:hidden;border:1px solid #ccc"><img src="${s}" style="width:100%;display:block"></div></div>`).join("")}</div></body></html>`;
    const p = await b.newPage({ viewport: { width: 1600, height: 1180 } });
    await p.setContent(html, { waitUntil: "load" });
    await p.screenshot({ path: path.join(OUT, `${nom}.png`) });
    await p.close();
  }
  await b.close();
})();
