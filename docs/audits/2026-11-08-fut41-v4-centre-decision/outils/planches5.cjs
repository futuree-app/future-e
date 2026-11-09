// Planches du comparatif : V4, V4.1 Claude, V4.1 Work, V5, recadrées au même haut de page.
const { chromium } = require("/Users/quentinbrache/Desktop/Futur·e/node_modules/playwright-core");
const fs = require("fs"); const path = require("path");
const R = path.join(__dirname, "..");
const D = { V4: "captures", "V4.1 Claude": "captures-v41", "V4.1 Work": "captures-v41-work", V5: "captures-v5" };
const P = [
  ["1-accueil", "Le premier écran : où en suis-je, que faire, mes possibilités", ["01-decision-complet-1440-sombre.png", "01-accueil-reference-1440-sombre.png", "01-accueil-mixte-1440-sombre.png", "01-accueil-reference-1440-sombre.png"]],
  ["2-recherche-vide", "Commencer : par une commune ou par une adresse", ["02-decision-vide-1440-sombre.png", "03-accueil-vide-1440-sombre.png", "04-accueil-vide-1440-sombre.png", "10-accueil-vide-1440-sombre.png"]],
  ["3-comparer-communes", "Nantes contre Rennes, sans adresse", [null, "04-comparer-communes-1440-sombre.png", "02-comparer-communes-1440-sombre.png", "03-comparer-communes-1440-sombre.png"]],
  ["4-comparer-logements", "Comparer des logements de deux communes", ["06-s3-trois-communes-ensemble-1440-sombre.png", "05-comparer-trois-annonces-1440-sombre.png", "03-comparer-logements-1440-sombre.png", "04-comparer-logements-reference-1440-sombre.png"]],
  ["5-logement-non-analyse", "Un logement dont seule la commune est lue (S7)", ["10-s7-donnees-non-comparables-1440-sombre.png", "06-logement-non-analyse-1440-sombre.png", "05-fiche-logement-1440-sombre.png", "06-logement-non-analyse-1440-sombre.png"]],
  ["6-mobile-comparer", "Comparer sur téléphone", ["06-s3-trois-communes-ensemble-390-clair.png", "05-comparer-trois-annonces-390-clair.png", "03-comparer-logements-390-clair.png", "05-comparer-meme-commune-390-clair.png"]],
];
(async () => {
  const b = await chromium.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" });
  for (const [nom, titre, fichiers] of P) {
    const mobile = fichiers.some((f) => f && f.includes("-390-"));
    const w = mobile ? 1500 : 2200, h = mobile ? 1300 : 1250;
    const cols = Object.entries(D).map(([t, dir], i) => {
      const f = fichiers[i];
      const src = f && fs.existsSync(path.join(R, dir, f)) ? "data:image/png;base64," + fs.readFileSync(path.join(R, dir, f)).toString("base64") : null;
      return `<div><div style="font:600 14px monospace;color:#9ba3b4;margin-bottom:6px">${t}</div><div style="height:${h - 90}px;overflow:hidden;border:1px solid #2a3142;display:grid;place-items:${src ? "start" : "center"}">${src ? `<img src="${src}" style="width:100%;display:block">` : `<span style="font:13px monospace;color:#6b7385;padding:20px;text-align:center">Pas d'équivalent : la V4 ne gardait pas de commune seule</span>`}</div></div>`;
    }).join("");
    const html = `<html><body style="margin:0;background:#0b0f1a;font-family:system-ui;color:#e9ecf2"><div style="padding:14px 20px;font-size:19px;font-weight:600">${titre}</div><div style="display:grid;grid-template-columns:repeat(4,1fr);gap:14px;padding:0 20px 20px">${cols}</div></body></html>`;
    const p = await b.newPage({ viewport: { width: w, height: h } });
    await p.setContent(html, { waitUntil: "load" });
    await p.screenshot({ path: path.join(R, "comparatif-v5", `${nom}.png`) });
    await p.close();
  }
  await b.close();
})();
