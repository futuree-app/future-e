// FUT-109 · Captures de la VRAIE page « Où vivre » pour les quatre couvertures des priorités, sans appel au
// modèle : le résultat vient de la route `/api/comparateur-vie/match` (déterministe, aucun LLM), puis il est
// déposé comme session enregistrée (la page le restaure sans rejouer l'analyse ni la synthèse). La synthèse
// affichée est un texte de remplacement explicite. Même patron que scripts/fut129/capturer-recherche.mjs.
// Relève aussi, dans le DOM, la phrase générale et le palier de chaque carte.
//
// Usage : node scripts/fut109/capturer-couverture.mjs http://localhost:3109 [largeurs=1440,390]
import { chromium } from "playwright-core";
import { mkdirSync, writeFileSync } from "node:fs";

const [base, largeursBrutes = "1440,390"] = process.argv.slice(2);
if (!base?.startsWith("http://localhost")) throw new Error("Captures locales seulement.");
const dossier = "docs/audits/2026-10-24-fut109-captures";
mkdirSync(dossier, { recursive: true });

const SCENARIOS = [
  { nom: "complete-17-soins-nature", texte: "Un bon accès aux soins et de la nature, en Charente-Maritime",
    parsed: { hardConstraints: { departements: ["17"] }, preferences: [{ key: "acces_soins", weight: 2 }, { key: "nature", weight: 3 }] } },
  { nom: "partielle-75-calme-culture", texte: "Un cadre calme et de la culture, à Paris",
    parsed: { hardConstraints: { departements: ["75"] }, preferences: [{ key: "cadre_calme", weight: 3 }, { key: "acces_culture", weight: 2 }] } },
  { nom: "aucune-75-calme", texte: "Un cadre calme, à Paris",
    parsed: { hardConstraints: { departements: ["75"] }, preferences: [{ key: "cadre_calme", weight: 3 }] } },
  { nom: "sans-priorite-17", texte: "Vivre en Charente-Maritime",
    parsed: { hardConstraints: { departements: ["17"] }, preferences: [] } },
];

const releves = [];
const navigateur = await chromium.launch({ executablePath: process.env.CHROME ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: true });
for (const sc of SCENARIOS) {
  const parsed = { reformulation: sc.texte, ...sc.parsed };
  const res = await fetch(`${base}/api/comparateur-vie/match`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ parsed }) });
  const outcome = await res.json();
  const session = {
    v: 5, savedAt: Date.now(), submittedText: sc.texte, parsed, outcome,
    synthesis: "[Capture FUT-109 : la synthèse rédigée n'est pas générée pour cette capture, aucun appel au modèle.]",
    askMessages: [], askRemaining: 2, askLimit: false,
  };
  for (const largeur of largeursBrutes.split(",").map(Number)) {
    const page = await navigateur.newPage({ viewport: { width: largeur, height: largeur <= 480 ? 844 : 900 }, deviceScaleFactor: largeur <= 480 ? 2 : 1, colorScheme: "dark" });
    await page.addInitScript((s) => {
      try { localStorage.setItem("futuree-consent", "denied"); localStorage.setItem("futuree:ouvivre:session", JSON.stringify(s)); } catch {}
    }, session);
    // Le serveur de développement garde une connexion ouverte : on attend les cartes, pas le réseau.
    await page.goto(`${base}/ou-vivre`, { waitUntil: "load", timeout: 300000 });
    await page.waitForSelector("article.card-answer", { timeout: 180000 });
    await page.waitForTimeout(1500);
    await page.addStyleTag({ content: "nextjs-portal { display: none !important; }" }).catch(() => {});
    const haut = await page.getByText("Territoires à explorer", { exact: true }).first().boundingBox();
    if (!haut) { console.log(`${sc.nom}-${largeur} : zone introuvable`); await page.close(); continue; }
    const texte = await page.evaluate(() => {
      const h2 = [...document.querySelectorAll("h2")].find((h) => h.textContent?.includes("Les territoires à regarder"));
      const phrase = h2?.nextElementSibling?.textContent?.trim() ?? null;
      const cartes = [...document.querySelectorAll("article.card-answer")].slice(0, 3).map((a) => ({
        nom: a.querySelector("h3")?.textContent?.trim(),
        palier: [...a.querySelectorAll("p")].find((p) => /correspondance|explorer|mesurées/i.test(p.textContent ?? "") && p.className.includes("uppercase"))?.textContent?.trim() ?? null,
        nonMesure: [...a.querySelectorAll("p")].find((p) => (p.textContent ?? "").startsWith("Non mesuré ici"))?.textContent?.trim() ?? null,
      }));
      return { phrase, cartes, debordement: document.documentElement.scrollWidth - window.innerWidth };
    });
    const defile = await page.evaluate(() => window.scrollY);
    const y = Math.max(0, haut.y + defile - 16);
    const fichier = `${dossier}/${sc.nom}-${largeur}.png`;
    await page.screenshot({ path: fichier, clip: { x: 0, y, width: largeur, height: largeur <= 480 ? 2200 : 1100 }, fullPage: true });
    releves.push({ scenario: sc.nom, largeur, couverture: outcome.couverture, message: outcome.message, ...texte });
    console.log(`${fichier}\t${outcome.couverture}\t${JSON.stringify(texte)}`);
    await page.close();
  }
}
await navigateur.close();
writeFileSync(`${dossier}/releves.json`, `${JSON.stringify(releves, null, 1)}\n`);
