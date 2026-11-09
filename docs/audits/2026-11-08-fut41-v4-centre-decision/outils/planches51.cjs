// Planches avant / après de la V5.1 : V5 (ea96f6de) à gauche, V5.1 à droite, mêmes situations, mêmes largeurs.
// Usage : node planches51.cjs <captures-v5> <captures-v51> <sortie>
const { chromium } = require("/Users/quentinbrache/Desktop/Futur·e/node_modules/playwright-core");
const fs = require("fs"); const path = require("path");
const [AV, AP, OUT] = process.argv.slice(2);
const ECRANS = [
  ["1-ma-decision", "01-accueil-reference", "Ma décision · deux communes, trois logements"],
  ["2-comparer-arbitrage", "14-comparer-arbitrage", "Comparer · deux adresses analysées (arbitrage établi)"],
  ["3-comparer-inegal", "04-comparer-logements-reference", "Comparer · un logement analysé, un non analysé, un sans adresse"],
  ["4-fiche-non-analysee", "06-logement-non-analyse", "Fiche logement · adresse connue, pas encore analysée"],
  ["5-fiche-apres-visite", "08-logement-apres-visite", "Fiche logement · après une visite"],
];
const FORMATS = [["1440", "clair"], ["1440", "sombre"], ["390", "clair"], ["390", "sombre"]];
const taille = (f) => { const b = fs.readFileSync(f); return { l: b.readUInt32BE(16), h: b.readUInt32BE(20) }; };
(async () => {
  const b = await chromium.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" });
  for (const [nom, base, titre] of ECRANS) for (const [larg, theme] of FORMATS) {
    const f = `${base}-${larg}-${theme}.png`;
    const av = path.join(AV, f), ap = path.join(AP, f);
    if (!fs.existsSync(av) || !fs.existsSync(ap)) { console.log("absent", f); continue; }
    const img = (p) => "data:image/png;base64," + fs.readFileSync(p).toString("base64");
    const mobile = larg === "390";
    const col = mobile ? 390 : 760;
    const fen = mobile ? 2400 : 1500;
    const cartes = [["V5", av], ["V5.1", ap]].map(([t, p]) => `<div><div style="font:600 14px system-ui;color:#444;margin-bottom:6px">${t} · page de ${taille(p).h} px</div><div style="width:${col}px;height:${fen}px;overflow:hidden;border:1px solid #bbb"><img src="${img(p)}" style="width:${col}px;display:block"></div></div>`).join("");
    const html = `<html><body style="margin:0;background:#efece5;font-family:system-ui;color:#1b1f2a"><div style="padding:14px 20px 10px;font-size:18px;font-weight:600">${titre} · ${larg} px · thème ${theme}</div><div style="display:flex;gap:24px;padding:0 20px 20px">${cartes}</div></body></html>`;
    const p = await b.newPage({ viewport: { width: col * 2 + 64, height: fen + 90 } });
    await p.setContent(html, { waitUntil: "load" });
    await p.screenshot({ path: path.join(OUT, `${nom}-${larg}-${theme}.png`) });
    await p.close();
  }
  await b.close();
})();
