// Planches avant / après : la capture V4 à gauche, la V4.1 à droite, recadrées au même haut de page.
const { chromium } = require("/Users/quentinbrache/Desktop/Futur·e/node_modules/playwright-core");
const fs = require("fs"); const path = require("path");
const [V4, V41, OUT] = process.argv.slice(2);
const P = [
  ["A-accueil", "01-decision-complet-1440-sombre.png", "01-accueil-reference-1440-sombre.png", "Ma décision : la recherche d'abord, les pistes rangées par commune"],
  ["B-communes-et-logements", "04-s1-location-dont-vente-1440-sombre.png", "06-logement-non-analyse-1440-sombre.png", "Une conclusion communale n'est plus présentée comme celle d'un logement"],
  ["C-comparer", "06-s3-trois-communes-ensemble-1440-sombre.png", "05-comparer-trois-annonces-1440-sombre.png", "Comparer : le sens avant la matrice"],
  ["D-z12", "08-s5-condition-non-tenue-1440-sombre.png", "24-z12-une-seule-fois-1440-sombre.png", "Z12 : ce qui bloque, dit une seule fois"],
  ["E-fiche", "11-s8-fiche-inconnues-1440-sombre.png", "09-logement-apres-visite-1440-sombre.png", "La fiche : ce que futur•e sait, échelle par échelle"],
  ["F-et-si", "25-et-si-gare-40-1440-sombre.png", "23-tache-H-et-si-1440-sombre.png", "Et si : des seaux, et ce qui ne peut pas être déduit"],
  ["G-mobile-accueil", "01-decision-complet-390-clair.png", "01-accueil-reference-390-clair.png", "Mobile : la lecture arrive avant le détail"],
  ["H-mobile-comparer", "06-s3-trois-communes-ensemble-360-sombre.png", "05-comparer-trois-annonces-360-sombre.png", "Mobile : des options qui se font glisser"],
];
(async () => {
  const b = await chromium.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" });
  const mobile = (n) => n.includes("-390-") || n.includes("-360-");
  for (const [nom, a, c, titre] of P) {
    const m = mobile(a);
    const w = m ? 860 : 1600, h = m ? 1500 : 1180;
    const img = (f) => "data:image/png;base64," + fs.readFileSync(f).toString("base64");
    const html = `<html><body style="margin:0;background:#0b0f1a;font-family:system-ui;color:#e9ecf2">
      <div style="padding:14px 20px;font-size:18px;font-weight:600">${titre}</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;padding:0 20px 20px">
        ${[["V4", img(path.join(V4, a))], ["V4.1", img(path.join(V41, c))]].map(([t, s]) => `<div><div style="font:600 13px monospace;color:#9ba3b4;margin-bottom:6px">${t}</div><div style="height:${h - 90}px;overflow:hidden;border:1px solid #2a3142"><img src="${s}" style="width:100%;display:block"></div></div>`).join("")}
      </div></body></html>`;
    const p = await b.newPage({ viewport: { width: w, height: h } });
    await p.setContent(html, { waitUntil: "load" });
    await p.screenshot({ path: path.join(OUT, `${nom}.png`) });
    await p.close();
  }
  await b.close();
})();
