// FUT-27 · Recette locale de la purge à la déconnexion (anonyme, sans compte : aucune écriture Supabase).
//
// La déconnexion elle-même vit sur /compte, qui exige un compte : le troisième onglet applique donc la purge
// telle que `purgerRecherchesTemporaires` l'écrit (date, puis effacement des quatre clés). Le reste est le
// vrai site : les onglets ouverts, l'écoute, le retour arrière, la nouvelle recherche.
import { chromium } from "playwright-core";

const BASE = process.env.BASE ?? "http://localhost:3127";
const OUT = process.env.OUT ?? ".";
const CLE = "futuree:ouvivre:session";
const CLES = [CLE, "futuree:projet:parsed", "futuree:projet:label", "futuree:projet:labels"];
const browser = await chromium.launch({ executablePath: process.env.CHROME ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: true });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
await ctx.addInitScript(() => {
  try { localStorage.setItem("futuree-consent", "denied"); } catch {}
  // Installés avant le code du site : un onglet « endormi » ne reçoit ni `storage` ni `visibilitychange`
  // tant que `__dormir` est vrai (onglet gelé, en arrière-plan) ; on trace aussi les retours depuis le cache.
  const bloquer = (e) => { if (window.__dormir) e.stopImmediatePropagation(); };
  window.addEventListener("storage", bloquer, true);
  document.addEventListener("visibilitychange", bloquer, true);
  window.addEventListener("pageshow", (e) => { window.__pageshowPersisted = e.persisted; });
});
const r = {};
const appels = [];
ctx.on("request", (q) => { if (q.url().includes("/api/")) appels.push(`${q.method()} ${new URL(q.url()).pathname}`); });

const resultatsVisibles = (p) => p.getByText("Territoires à explorer").count();
const texte = (p) => p.locator("textarea").first().inputValue();
const stockage = (p) => p.evaluate((cles) => Object.fromEntries(cles.map((k) => [k, localStorage.getItem(k)])), [...CLES, "futuree-consent", "futuree:recherche:purgee"]);

async function chercher(p, t) {
  await p.goto(`${BASE}/ou-vivre`, { waitUntil: "networkidle" });
  const affiner = p.getByRole("button", { name: /Affiner/ });
  if (await affiner.count()) await affiner.first().click();
  await p.locator("textarea").first().fill(t);
  await p.getByRole("button", { name: "Explorer mes possibilités" }).click();
  await p.getByText("Territoires à explorer").waitFor({ timeout: 120_000 });
  await p.waitForTimeout(1500);
}
async function ouvrirRestauree(p) {
  await p.goto(`${BASE}/ou-vivre`, { waitUntil: "networkidle" });
  await p.getByText("Territoires à explorer").waitFor({ timeout: 15_000 });
}

// ── Avant : la recherche Bordeaux dans plusieurs onglets ─────────────────────────────────────────────
const onglet1 = await ctx.newPage();
await chercher(onglet1, "Une ville à moins de 30 km de Bordeaux, avec une gare et au calme");
const onglet2 = await ctx.newPage();
await ouvrirRestauree(onglet2);
await onglet2.evaluate(() => sessionStorage.setItem("futur-e:wizard", JSON.stringify({ answers: { projets: "achat" } })));
// Onglet « endormi » : il ne reçoit pas les événements de stockage (capture bloquée avant l'écoute du site).
const endormi = await ctx.newPage();
await ouvrirRestauree(endormi);
await endormi.evaluate(() => { window.__dormir = true; });
// Onglet qui part de /ou-vivre par une navigation complète : /ou-vivre reste dans l'historique.
const onglet5 = await ctx.newPage();
await ouvrirRestauree(onglet5);
await onglet5.evaluate(() => { window.location.href = "/"; });
await onglet5.waitForLoadState("load");
r.avant = { onglet1: await texte(onglet1), onglet2: await texte(onglet2), endormi: await texte(endormi), stockage: await stockage(onglet1) };

// ── Déconnexion depuis un troisième onglet ───────────────────────────────────────────────────────────
const onglet3 = await ctx.newPage();
await onglet3.goto(`${BASE}/`, { waitUntil: "load" });
r.purge = await onglet3.evaluate((cles) => {
  const t = Date.now();
  localStorage.setItem("futuree:recherche:purgee", String(t));
  for (const k of cles) localStorage.removeItem(k);
  for (const k of ["futur-e:wizard", "futuree:landing-commune"]) sessionStorage.removeItem(k);
  return t;
}, CLES);
await onglet1.waitForTimeout(800);

// C : les onglets ouverts oublient Bordeaux ; l'autre onglet perd aussi son questionnaire.
r.apres = {
  onglet1: { texte: await texte(onglet1), resultats: await resultatsVisibles(onglet1) },
  onglet2: { texte: await texte(onglet2), resultats: await resultatsVisibles(onglet2), questionnaire: await onglet2.evaluate(() => sessionStorage.getItem("futur-e:wizard")) },
  stockage: await stockage(onglet3),
};
await onglet1.screenshot({ path: `${OUT}/fut27-deconnexion-onglet1.png` });

// C : l'onglet endormi montre encore Bordeaux ; il tente une écriture (clic « explorer » d'une carte) : refusée.
r.endormi = { texteAvantReveil: await texte(endormi) };
const lien = endormi.locator('a[href*="/debloquer"]').first();
await lien.click({ modifiers: ["Meta"] }).catch(() => {}); // ouvert à côté : la page reste en place
await endormi.waitForTimeout(500);
r.endormi.ecritureApresClic = await endormi.evaluate(() => localStorage.getItem("futuree:projet:labels"));
// Il redevient visible : il relit la purge et oublie.
await endormi.evaluate(() => { window.__dormir = false; document.dispatchEvent(new Event("visibilitychange")); });
await endormi.waitForTimeout(300);
r.endormi.texteApresReveil = await texte(endormi);
r.endormi.resultatsApresReveil = await resultatsVisibles(endormi);

// C : retour arrière vers /ou-vivre après la purge.
await onglet5.goBack({ waitUntil: "load" });
await onglet5.waitForTimeout(1500);
r.retourArriere = {
  url: new URL(onglet5.url()).pathname,
  navigation: await onglet5.evaluate(() => performance.getEntriesByType("navigation")[0]?.type),
  depuisLeCache: await onglet5.evaluate(() => window.__pageshowPersisted ?? null),
  texte: await texte(onglet5),
  resultats: await resultatsVisibles(onglet5),
};

// E : une nouvelle recherche Rennes, après la purge, dans l'onglet 1.
await chercher(onglet1, "Une ville à moins de 30 km de Rennes, avec une gare et au calme");
await onglet1.waitForTimeout(1000);
const s = JSON.parse((await stockage(onglet1))[CLE]);
r.rennes = { texte: s.submittedText, apresPurge: s.savedAt > r.purge };
// Témoin : le même clic, sur une recherche postérieure à la purge, écrit bien (la garde ne bloque que l'avant).
await onglet1.locator('a[href*="/debloquer"]').first().click({ modifiers: ["Meta"] }).catch(() => {});
await onglet1.waitForTimeout(500);
r.rennes.temoinEcritureClic = await onglet1.evaluate(() => localStorage.getItem("futuree:projet:labels"));
// Les anciens onglets ne l'effacent pas ; un nouvel onglet la restaure.
await onglet2.waitForTimeout(500);
r.rennes.toujoursLa = JSON.parse((await stockage(onglet2))[CLE] ?? "{}").submittedText ?? null;
const onglet6 = await ctx.newPage();
await ouvrirRestauree(onglet6);
r.rennes.restauree = await texte(onglet6);
// D : passer par la connexion n'efface rien.
await onglet6.goto(`${BASE}/connexion`, { waitUntil: "load" });
r.rennes.apresPageConnexion = JSON.parse((await stockage(onglet6))[CLE] ?? "{}").submittedText ?? null;
r.consentementIntact = (await stockage(onglet6))["futuree-consent"];
r.appelsProjet = appels.filter((a) => /\/api\/(profile|project)/.test(a));
delete r.avant.stockage[CLE]; // trop long pour le compte rendu ; sa présence suffit
r.avant.sessionPresente = true;
console.log(JSON.stringify(r, null, 2));
await browser.close();
