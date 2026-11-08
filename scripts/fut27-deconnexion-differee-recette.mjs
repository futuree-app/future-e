// FUT-27 · Recette locale de la déconnexion envoyée AVANT l'hydratation (ou sans JavaScript).
//
// Sans compte (aucune écriture Supabase) : /compte n'est pas atteignable, mais ce qui compte est le POST natif
// qu'un formulaire non hydraté envoie. L'onglet soumet donc, hors de React, le même formulaire vers la Server
// Action `signOutAction` (identifiant lu dans le build), avec le champ resté à « serveur ». Le navigateur suit
// ensuite la vraie redirection vers « / », reçoit le vrai cookie, et la page d'arrivée doit purger avant de lire.
// Usage : ACTION_ID=<id de signOutAction> node scripts/fut27-deconnexion-differee-recette.mjs
import { chromium } from "playwright-core";
import { readFileSync } from "node:fs";

const BASE = process.env.BASE ?? "http://localhost:3127";
const ACTION_ID = process.env.ACTION_ID ?? Object.entries(JSON.parse(readFileSync(".next/server/server-reference-manifest.json", "utf8")).node)
  .find(([, v]) => v.exportedName === "signOutAction")[0];
const CLES = ["futuree:ouvivre:session", "futuree:projet:parsed", "futuree:projet:label", "futuree:projet:labels"];
const browser = await chromium.launch({ executablePath: process.env.CHROME ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: true });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
await ctx.addInitScript(() => { try { localStorage.setItem("futuree-consent", "denied"); } catch {} });
const r = {};
const appels = [];
ctx.on("request", (q) => { if (q.url().includes("/api/")) appels.push(`${q.method()} ${new URL(q.url()).pathname}`); });

const texte = (p) => p.locator("textarea").first().inputValue();
const etat = (p) => p.evaluate((cles) => ({
  local: Object.fromEntries(cles.map((k) => [k, localStorage.getItem(k) ? "présente" : null])),
  onglet: { questionnaire: sessionStorage.getItem("futur-e:wizard"), communeAccueil: sessionStorage.getItem("futuree:landing-commune") },
  purge: localStorage.getItem("futuree:recherche:purgee"),
  jetonVu: localStorage.getItem("futuree:recherche:purge-differee-vue"),
  consentement: localStorage.getItem("futuree-consent"),
}), CLES);
const cookiePurge = async () => (await ctx.cookies()).find((c) => c.name === "futuree-purge-recherche")?.value ?? null;

async function chercher(p, t) {
  await p.goto(`${BASE}/ou-vivre`, { waitUntil: "networkidle" });
  const affiner = p.getByRole("button", { name: /Affiner/ });
  if (await affiner.count()) await affiner.first().click();
  await p.locator("textarea").first().fill(t);
  await p.getByRole("button", { name: "Explorer mes possibilités" }).click();
  await p.getByText("Territoires à explorer").waitFor({ timeout: 120_000 });
  await p.waitForTimeout(1500);
}

// ── Avant : compte « A » avec Bordeaux, un second onglet ouvert dessus ──────────────────────────────
const onglet1 = await ctx.newPage();
await chercher(onglet1, "Une ville à moins de 30 km de Bordeaux, avec une gare et au calme");
await onglet1.evaluate(() => {
  sessionStorage.setItem("futur-e:wizard", JSON.stringify({ answers: { projets: "achat" } }));
  sessionStorage.setItem("futuree:landing-commune", JSON.stringify({ name: "Bordeaux", citycode: "33063" }));
});
const onglet2 = await ctx.newPage();
await onglet2.goto(`${BASE}/ou-vivre`, { waitUntil: "networkidle" });
await onglet2.getByText("Territoires à explorer").waitFor({ timeout: 15_000 });
r.avant = { onglet1: await etat(onglet1), onglet2: await texte(onglet2) };

// ── La déconnexion part en POST natif, sans le gestionnaire React ────────────────────────────────────
await onglet1.goto(`${BASE}/connexion`, { waitUntil: "load" });
await Promise.all([
  onglet1.waitForURL(`${BASE}/`, { timeout: 30_000 }),
  onglet1.evaluate((id) => {
    const f = document.createElement("form");
    f.method = "POST";
    f.enctype = "multipart/form-data";
    f.action = "/connexion";
    for (const [n, v] of [[`$ACTION_ID_${id}`, ""], ["purge-recherche", "serveur"]]) {
      const i = document.createElement("input");
      i.type = "hidden"; i.name = n; i.value = v;
      f.appendChild(i);
    }
    document.body.appendChild(f);
    HTMLFormElement.prototype.submit.call(f); // envoi natif : aucun onSubmit, comme avant l'hydratation
  }, ACTION_ID),
]);
await onglet1.waitForLoadState("networkidle");
await onglet1.waitForTimeout(1000);
r.apres = {
  page: new URL(onglet1.url()).pathname,
  cookieRestant: await cookiePurge(),
  onglet1: await etat(onglet1),
  onglet2: { texte: await texte(onglet2), resultats: await onglet2.getByText("Territoires à explorer").count() },
  communeAccueilAffichee: await onglet1.getByText("Bordeaux").count(),
};
await onglet1.screenshot({ path: "../fut27-recette/fut27-deconnexion-differee-accueil.png" });

// ── Nouvelle recherche anonyme, et un cookie qui n'aurait pas pu être effacé ─────────────────────────
await chercher(onglet1, "Une ville à moins de 30 km de Rennes, avec une gare et au calme");
const jetonVu = (await etat(onglet1)).jetonVu;
await ctx.addCookies([{ name: "futuree-purge-recherche", value: jetonVu, url: BASE }]);
const onglet3 = await ctx.newPage();
await onglet3.goto(`${BASE}/ou-vivre`, { waitUntil: "networkidle" });
await onglet3.getByText("Territoires à explorer").waitFor({ timeout: 15_000 }).catch(() => {});
r.rennes = { restauree: await texte(onglet3), memeJetonRepurge: (await etat(onglet3)).local["futuree:ouvivre:session"] === null };
await onglet3.goto(`${BASE}/connexion`, { waitUntil: "load" });
r.rennes.apresPageConnexion = (await etat(onglet3)).local["futuree:ouvivre:session"];
r.appelsProjet = appels.filter((a) => /\/api\/(profile|project)/.test(a));
console.log(JSON.stringify(r, null, 2));
await browser.close();
