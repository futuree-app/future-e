// FUT-129 · Captures de la VRAIE page « Où vivre », sans appel au modèle : le résultat est calculé par la
// route `/api/comparateur-vie/match` (déterministe, aucun LLM), puis déposé comme session enregistrée
// (la page le restaure sans rejouer l'analyse, la recherche ni la synthèse). La synthèse affichée est un
// texte de remplacement explicite. Serveur local uniquement.
//
// Usage : node scripts/fut129/capturer-recherche.mjs http://localhost:3129 [largeurs=1440,390,360]
import { chromium } from "playwright-core";
import { mkdirSync } from "node:fs";

const [base, largeursBrutes = "1440,390,360"] = process.argv.slice(2);
if (!base?.startsWith("http://localhost")) throw new Error("Captures locales seulement.");
const dossier = "docs/audits/2026-10-23-fut129-captures";
mkdirSync(dossier, { recursive: true });

const SCENARIOS = [
  { nom: "recherche-inondation-soins-17", texte: "Un faible risque d'inondation et un bon accès aux soins, en Charente-Maritime",
    parsed: { hardConstraints: { departements: ["17"] }, preferences: [{ key: "faible_risque_inondation", weight: 3 }, { key: "acces_soins", weight: 2 }] } },
  { nom: "exploration-inondation-seule-17", texte: "Un faible risque d'inondation, en Charente-Maritime",
    parsed: { hardConstraints: { departements: ["17"] }, preferences: [{ key: "faible_risque_inondation", weight: 3 }] } },
  { nom: "exploration-inondation-seule-france", texte: "Un faible risque d'inondation",
    parsed: { hardConstraints: {}, preferences: [{ key: "faible_risque_inondation", weight: 3 }] } },
  { nom: "temoin-sans-inondation-17", texte: "Un bon accès aux soins et de la nature, en Charente-Maritime",
    parsed: { hardConstraints: { departements: ["17"] }, preferences: [{ key: "acces_soins", weight: 2 }, { key: "nature", weight: 2 }] } },
];

const navigateur = await chromium.launch({ executablePath: process.env.CHROME ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: true });
for (const sc of SCENARIOS) {
  const parsed = { reformulation: sc.texte, ...sc.parsed };
  const res = await fetch(`${base}/api/comparateur-vie/match`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ parsed }) });
  const outcome = await res.json();
  const session = {
    v: 5, savedAt: Date.now(), submittedText: sc.texte, parsed, outcome,
    synthesis: "[Capture FUT-129 : la synthèse rédigée n'est pas générée pour cette capture, aucun appel au modèle.]",
    askMessages: [], askRemaining: 2, askLimit: false,
  };
  for (const largeur of largeursBrutes.split(",").map(Number)) {
    const page = await navigateur.newPage({ viewport: { width: largeur, height: largeur <= 480 ? 844 : 900 }, deviceScaleFactor: largeur <= 480 ? 2 : 1, colorScheme: "dark" });
    await page.addInitScript((s) => {
      try { localStorage.setItem("futuree-consent", "denied"); localStorage.setItem("futuree:ouvivre:session", JSON.stringify(s)); } catch {}
    }, session);
    await page.goto(`${base}/ou-vivre`, { waitUntil: "networkidle", timeout: 180000 }).catch(() => {});
    await page.waitForTimeout(1500);
    await page.addStyleTag({ content: "nextjs-portal { display: none !important; }" }).catch(() => {});
    const debord = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    const haut = await page.getByText("Territoires à explorer", { exact: true }).first().boundingBox();
    const bas = await page.getByText("Ce que votre recherche révèle", { exact: true }).first().boundingBox();
    if (!haut || !bas) { console.log(`${sc.nom}-${largeur} : zone introuvable`); await page.close(); continue; }
    const defile = await page.evaluate(() => window.scrollY);
    const y = Math.max(0, haut.y + defile - 16);
    const h = Math.min(bas.y + defile + 160 - y, 6000);
    const fichier = `${dossier}/${sc.nom}-${largeur}.png`;
    await page.screenshot({ path: fichier, clip: { x: 0, y, width: largeur, height: h }, fullPage: true });
    console.log(`${fichier}\tdébordement=${debord}px\ttrio=${outcome.results.slice(0, 3).map((r) => r.nom).join(", ")}\texploration=${outcome.inondation?.exploration ?? "-"}`);
    await page.close();
  }
}
await navigateur.close();
