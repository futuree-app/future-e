// FUT-181 · RECETTE RÉSEAU DU CONSENTEMENT POSTHOG, SUR LE SITE (serveur de dev local).
//
// Méthode reprise de FUT-94 (consentement.cjs), étendue au site : TOUTES les requêtes vers `/ingest/**`
// (le proxy PostHog) et vers `*.posthog.com` sont interceptées dans le navigateur et décodées. Rien ne
// sort. On distingue :
//   · les ÉVÉNEMENTS (POST d'envoi : /e, /i/v0/e, /batch, /s, /engage…), décodés un par un ;
//   · le TRAFIC TECHNIQUE du SDK (configuration distante, drapeaux, scripts), compté à part.
// Sans consentement, l'attendu est ZÉRO pour les deux : le SDK n'est pas initialisé.
//
// La session Supabase est simulée côté navigateur (cookie `sb-127-auth-token` + réponse de
// `/auth/v1/user` interceptée) : aucun compte réel, aucune base.
//
// Lancement : serveur `next dev -p 3181` avec NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN=phc_fut181_test et
// NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54399, puis `node docs/audits/…/recette.cjs`.
// Code de sortie 1 si un attendu échoue (sert à la contre-épreuve).
const { chromium } = require(process.cwd() + "/node_modules/playwright-core");
const zlib = require("zlib");
const fs = require("fs");

const BASE = process.env.FUT181_BASE ?? "http://localhost:3181";
const OUT = process.cwd() + "/docs/audits/2026-11-09-fut181-consentement-posthog";
const SUPABASE = "http://127.0.0.1:54399";
const USER = { id: "0197f3a2-1b2c-7000-8000-fut181000001", email: "lecteur.fut181@example.org" };
const USER2 = { id: "0197f3a2-1b2c-7000-8000-fut181000002", email: "autre.fut181@example.org" };
const ADRESSE = "12 Rue des Temoins 17000 La Rochelle";
const SECRET = "Projet-temoin-FUT181 pres de la rocade";
const ONLY = process.env.FUT181_SCENARIOS ? new Set(process.env.FUT181_SCENARIOS.split(",")) : null;

function decoder(buf, url) {
  if (!buf || !buf.length) return [];
  let txt;
  try { txt = zlib.gunzipSync(buf).toString("utf8"); } catch { txt = buf.toString("utf8"); }
  if (txt.startsWith("data=")) {
    const v = decodeURIComponent(txt.slice(5).split("&")[0]);
    try { txt = Buffer.from(v, "base64").toString("utf8"); } catch { txt = v; }
  }
  try {
    const j = JSON.parse(txt);
    const lot = Array.isArray(j) ? j : j.batch ?? [j];
    return lot.map((e) => ({ event: e.event, props: e.properties ?? {}, brut: JSON.stringify(e), url }));
  } catch { return [{ event: "(illisible)", props: {}, brut: txt, url }]; }
}

function sessionCookie(user) {
  const now = Math.floor(Date.now() / 1000);
  const session = {
    access_token: "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ4In0.sig", token_type: "bearer", expires_in: 3600, expires_at: now + 3600,
    refresh_token: "fut181-refresh", user: { id: user.id, email: user.email, aud: "authenticated", role: "authenticated", app_metadata: {}, user_metadata: {}, created_at: "2026-01-01T00:00:00Z" },
  };
  return { name: "sb-127-auth-token", value: "base64-" + Buffer.from(JSON.stringify(session)).toString("base64url"), url: BASE };
}

async function contexte(browser, { consentement = null, user = null, stockageBloque = false } = {}) {
  const ctx = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    // posthog-js écarte les robots (« HeadlessChrome », navigator.webdriver) : on se présente en Chrome ordinaire.
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36",
  });
  await ctx.addInitScript(() => Object.defineProperty(Navigator.prototype, "webdriver", { get: () => false }));
  if (consentement) await ctx.addInitScript((v) => { try { if (!sessionStorage.getItem("fut181-init")) { localStorage.setItem("futuree-consent", v); sessionStorage.setItem("fut181-init", "1"); } } catch {} }, consentement);
  if (stockageBloque) await ctx.addInitScript(() => {
    const bloque = { getItem() { throw new DOMException("bloqué", "SecurityError"); }, setItem() { throw new DOMException("bloqué", "SecurityError"); }, removeItem() { throw new DOMException("bloqué", "SecurityError"); }, key() { return null; }, get length() { return 0; }, clear() {} };
    Object.defineProperty(window, "localStorage", { get: () => bloque });
  });
  const etat = { utilisateur: user };
  if (user) await ctx.addCookies([sessionCookie(user)]);
  const evenements = [];
  const technique = [];
  const fuites = [];
  const surRequete = async (route) => {
    const req = route.request();
    const u = req.url();
    const corps = req.postDataBuffer();
    const brut = corps ? corps.toString("latin1") : "";
    if (brut.includes(USER.email) || brut.includes(USER2.email) || decodeURIComponent(u).includes(USER.email)) fuites.push(u);
    const envoi = req.method() === "POST" && !/\/flags\/|\/decide\//.test(u);
    if (envoi) evenements.push(...decoder(corps, u));
    else technique.push(`${req.method()} ${u.replace(/^https?:\/\/[^/]+/, "")}`);
    if (/\.js(\?|$)/.test(u)) return route.fulfill({ status: 200, contentType: "application/javascript", body: "" });
    if (/\/flags\//.test(u)) return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ flags: {}, featureFlags: {}, featureFlagPayloads: {}, errorsWhileComputingFlags: false, requestId: "x" }) });
    if (/\/config/.test(u)) return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ token: "phc_fut181_test", supportedCompression: [], sessionRecording: { endpoint: "/s/" }, heatmaps: true, autocaptureExceptions: true }) });
    return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ status: 1 }) });
  };
  // GOOGLE (contre-revue) : les scripts GTM/gtag se chargent comme pour un visiteur ; toute requête de
  // MESURE vers Google (collect, pings Consent Mode, régies) est relevée puis bloquée, jamais transmise,
  // pour ne pas polluer la propriété GA4 réelle. `gcs` porte l'état de consentement envoyé (G1<pub><mesure>).
  const google = [];
  await ctx.route(/google-analytics\.com|analytics\.google\.com|googletagmanager\.com\/(?:a|g\/collect)|doubleclick\.net|googleadservices\.com|google\.[a-z.]+\/(?:ccm|pagead|ads)\//, (route) => {
    const u = new URL(route.request().url());
    const corps = route.request().postData() ?? "";
    const champ = (k) => u.searchParams.get(k) ?? corps.match(new RegExp(`(?:^|[&\\n])${k}=([^&\\n]+)`))?.[1] ?? null;
    let onglet = "?";
    try { onglet = new URL(route.request().frame().url()).pathname; } catch {}
    google.push({ url: u.origin + u.pathname, gcs: champ("gcs"), en: champ("en"), dl: champ("dl"), onglet, t: Date.now() });
    return route.fulfill({ status: 204, body: "" });
  });
  await ctx.route("**/ingest/**", surRequete);
  await ctx.route(/posthog\.com/, surRequete);
  await ctx.route(`${SUPABASE}/**`, (route) => {
    const u = route.request().url();
    if (/\/auth\/v1\/user/.test(u) && etat.utilisateur) {
      const x = etat.utilisateur;
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ id: x.id, email: x.email, aud: "authenticated", role: "authenticated", app_metadata: {}, user_metadata: {} }) });
    }
    if (/\/auth\/v1\//.test(u)) return route.fulfill({ status: 401, contentType: "application/json", body: JSON.stringify({ message: "no session" }) });
    return route.fulfill({ status: 200, contentType: "application/json", body: "[]" });
  });
  return { ctx, evenements, technique, fuites, etat, google };
}

const pause = (p, ms) => p.waitForTimeout(ms);
// posthog-js vide sa file toutes les 3 s : on laisse 4 s avant chaque relevé.
const vider = (p) => pause(p, 4000);

async function aller(page, chemin) {
  await page.goto(BASE + chemin, { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
}
async function cliquerUnBouton(page) {
  // Un bouton visible hors bannière, pour provoquer une autocapture si elle était active.
  const ok = await page.evaluate(() => {
    const b = [...document.querySelectorAll("button, a[href]")].find((x) => x.offsetParent !== null && !x.closest("[data-consent]") && !/Accepter|Refuser|Google/.test(x.textContent || "") && (x.tagName === "BUTTON" || (x.getAttribute("href") || "").startsWith("#")));
    if (b) { b.setAttribute("data-temoin181", "1"); return true; }
    return false;
  });
  if (ok) await page.locator("[data-temoin181]").first().click({ timeout: 3000 }).catch(() => {});
  // Un clic qui quitte le site (connexion externe) fausserait la lecture du stockage : on revient.
  if (!page.url().startsWith(BASE)) await page.goBack().catch(() => {});
}
async function tracesPostHog(page) {
  return page.evaluate(() => {
    const t = [];
    try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (/^(ph_|__ph_opt_in_out_)/.test(k)) t.push("local:" + k); } } catch {}
    try { for (let i = 0; i < sessionStorage.length; i++) { const k = sessionStorage.key(i); if (/^(ph_|__ph_opt_in_out_)/.test(k)) t.push("session:" + k); } } catch {}
    for (const c of document.cookie.split(";")) { const n = c.split("=")[0].trim(); if (/^(ph_|__ph_opt_in_out_)/.test(n)) t.push("cookie:" + n); }
    return t;
  });
}
// Les commandes de consentement Google réellement poussées dans la page (`gtag("consent", …)` → dataLayer).
async function consentementsGoogle(page) {
  return page.evaluate(() => (window.dataLayer || [])
    .filter((a) => a && a[0] === "consent")
    .map((a) => `${a[1]}:${a[2]?.analytics_storage ?? "?"}/${a[2]?.ad_storage ?? "?"}`));
}
const dernier = (l) => l[l.length - 1];
// Une requête de mesure Google qui se dit autorisée (stockage mesure ou pub accordé).
const googleAccorde = (l) => l.filter((r) => r.gcs && /^G1(1.|.1)/.test(r.gcs));
// GA4 garde des événements déjà créés jusqu'à son prochain envoi, et chacun porte l'état de consentement du
// moment où il a été créé. Constaté (09/11/2026) : la `page_view` d'un onglet chargé pendant le consentement
// part jusqu'à 4 s APRÈS le retrait, marquée G111, au premier envoi suivant ; l'événement créé ensuite part
// en G100. Ce code ne peut pas vider cette file. L'attendu porte donc sur les événements CRÉÉS après le
// retrait, reconnus à leur page (`dl`, une adresse ouverte seulement après le retrait) ; ce qui sort de la
// file est relevé à part (INFO).
const VIDANGE_GOOGLE = 1500;
const creesApres = (l, marque) => l.filter((r) => (r.dl ?? "").includes(marque));
const sortisDeLaFile = (l, marque) => googleAccorde(l).filter((r) => !(r.dl ?? "").includes(marque));
const decrire = (l) => l.map((r) => `${r.onglet}:${r.en ?? r.url.split("/")[2]}/${r.gcs}`).join(", ") || "aucun";
const internesGoogle = (p) => p.evaluate(() => JSON.stringify(window.google_tag_data?.ics?.entries?.analytics_storage?.update ?? null));
async function accepter(page) { await page.getByRole("button", { name: "Accepter" }).click(); }
async function refuser(page) { await page.getByRole("button", { name: "Refuser" }).click(); }
async function rouvrirPreferences(page) { await page.evaluate(() => window.dispatchEvent(new Event("futuree:show-consent"))); }

const PARCOURS = ["/", "/ou-vivre", "/comparateur", "/dossier", "/politique-confidentialite", `/checkout/dossier?banId=17300_9999_00012&label=${encodeURIComponent(ADRESSE)}&insee=17300`];

const resultats = [];
let echecs = 0;
// Constat sans attendu : écrit dans le rapport, ne compte ni pour ni contre.
function constater(nom, detail) { resultats.push(`INFO  ${nom}${detail ? ` — ${detail}` : ""}`); }
function attendre(nom, ok, detail) {
  resultats.push(`${ok ? "OK  " : "ÉCHEC"} ${nom}${detail ? ` — ${detail}` : ""}`);
  if (!ok) echecs++;
}
const resume = (ev) => {
  const c = {};
  for (const e of ev) c[e.event] = (c[e.event] ?? 0) + 1;
  return Object.entries(c).map(([k, v]) => `${k}×${v}`).join(", ") || "aucun";
};
const contient = (ev, s) => ev.filter((e) => e.brut.includes(s));

const SCENARIOS = {
  async premiere_visite(browser) {
    const s = await contexte(browser);
    const page = await s.ctx.newPage();
    // Trace d'avant FUT-181 (PostHog démarrait sans condition) : doit être effacée.
    await aller(page, "/");
    await page.evaluate(() => { localStorage.setItem("ph_phc_fut181_test_posthog", '{"distinct_id":"ancien"}'); document.cookie = "ph_phc_fut181_test_posthog=ancien; path=/"; });
    for (const c of PARCOURS) { await aller(page, c); await cliquerUnBouton(page); }
    await vider(page);
    await aller(page, "/");
    const traces = await tracesPostHog(page);
    attendre("1. Première visite, tout le parcours : 0 événement", s.evenements.length === 0, resume(s.evenements));
    attendre("1. Première visite : 0 requête technique PostHog (SDK non initialisé)", s.technique.length === 0, s.technique.slice(0, 4).join(" | "));
    attendre("1. Première visite : identifiant déposé avant FUT-181 effacé, rien de nouveau", traces.length === 0, traces.join(", "));
    await s.ctx.close();
  },
  async refus(browser) {
    const s = await contexte(browser);
    const page = await s.ctx.newPage();
    await aller(page, "/");
    await refuser(page);
    for (const c of PARCOURS) { await aller(page, c); await cliquerUnBouton(page); }
    await page.reload(); await cliquerUnBouton(page);
    await vider(page);
    attendre("2. Refus explicite (puis parcours et rechargement) : 0 événement, 0 requête", s.evenements.length + s.technique.length === 0, `${resume(s.evenements)} / ${s.technique.length} technique(s)`);
    attendre("2. Refus : aucune trace PostHog dans le navigateur", (await tracesPostHog(page)).length === 0);
    await s.ctx.close();
  },
  async acceptation(browser) {
    const s = await contexte(browser);
    const page = await s.ctx.newPage();
    await aller(page, "/");
    await vider(page);
    const avant = s.evenements.length;
    await accepter(page); // sans recharger
    await vider(page);
    await cliquerUnBouton(page);
    await pause(page, 1500);
    await page.mouse.click(640, 450); // clic témoin au centre de la page
    await aller(page, PARCOURS.at(-1)); // sans session : redirigé vers /connexion?next=<URL avec l'adresse>
    await vider(page);
    await aller(page, "/comparateur?communes=17300&dossierId=0b0b&payment_intent_client_secret=pi_1_secret_2");
    await vider(page);
    const vues = s.evenements.filter((e) => e.event === "$pageview");
    attendre("3. Acceptation : rien avant le clic", avant === 0);
    attendre("3. Acceptation : la mesure démarre sans rechargement ($pageview de la page courante)", vues.length >= 1, resume(s.evenements));
    attendre("3. Acceptation : autocapture active", s.evenements.some((e) => e.event === "$autocapture"));
    attendre("3. Acceptation : aucun $opt_in ni événement antérieur rejoué", !s.evenements.some((e) => e.event === "$opt_in"));
    const adresse = contient(s.evenements, "Temoins").concat(contient(s.evenements, "banId"), contient(s.evenements, "17300_9999"));
    attendre("3. Acceptation : l'adresse de l'URL /checkout/dossier ne part pas", adresse.length === 0, adresse.map((e) => e.event).join(", "));
    const urls = vues.map((e) => e.props.$current_url);
    const connexion = urls.find((u) => /connexion/.test(u || ""));
    const comparateur = urls.find((u) => /comparateur/.test(u || ""));
    attendre("3. Acceptation : /connexion?next=<adresse> part sans son paramètre", /\/connexion$/.test(connexion || ""), connexion);
    attendre("3. Acceptation : l'URL garde la commune, perd le dossier et le secret Stripe", /\/comparateur\?communes=17300$/.test(comparateur || "") && contient(s.evenements, "secret").length === 0 && contient(s.evenements, "0b0b").length === 0, comparateur);
    const texte = s.evenements.filter((e) => e.event === "$autocapture" && (e.props.$el_text || /text="/.test(e.props.$elements_chain || "")));
    attendre("3. Acceptation : autocapture sans texte d'élément", texte.length === 0);
    attendre("3. Acceptation : aucun enregistrement de session ($snapshot)", !s.evenements.some((e) => e.event === "$snapshot"));
    resultats.push(`     trafic technique après acceptation : ${[...new Set(s.technique.map((t) => t.split("?")[0]))].join(" | ")}`);
    await s.ctx.close();
  },
  async retrait(browser) {
    const s = await contexte(browser, { consentement: "granted" });
    const page = await s.ctx.newPage();
    await aller(page, "/");
    await cliquerUnBouton(page);
    await vider(page);
    const avant = s.evenements.length;
    const tracesAvant = await tracesPostHog(page);
    await rouvrirPreferences(page);
    await refuser(page);
    await pause(page, 500);
    const tracesApres = await tracesPostHog(page);
    const n0 = s.evenements.length;
    const t0 = s.technique.length;
    await cliquerUnBouton(page);
    for (const c of ["/ou-vivre", "/comparateur"]) { await aller(page, c); await cliquerUnBouton(page); }
    await page.reload();
    await vider(page);
    attendre("4. Acceptation puis refus : des événements avant", avant > 0 && tracesAvant.length > 0, `${avant} événement(s), ${tracesAvant.length} trace(s)`);
    attendre("4. Acceptation puis refus : 0 événement après, navigation et rechargement compris", s.evenements.length === n0, resume(s.evenements.slice(n0)));
    attendre("4. Acceptation puis refus : 0 requête technique après", s.technique.length === t0, s.technique.slice(t0).join(" | "));
    attendre("4. Acceptation puis refus : traces PostHog effacées", tracesApres.length === 0 && (await tracesPostHog(page)).length === 0, tracesApres.join(", "));
    await s.ctx.close();
  },
  async deux_onglets(browser) {
    const s = await contexte(browser, { consentement: "granted" });
    const a = await s.ctx.newPage();
    const b = await s.ctx.newPage();
    await aller(a, "/");
    await aller(b, "/comparateur");
    await cliquerUnBouton(b);
    await vider(b);
    const avant = s.evenements.length;
    await rouvrirPreferences(a);
    await refuser(a);
    await pause(b, 300);
    const n0 = s.evenements.length;
    await b.bringToFront();
    await cliquerUnBouton(b);
    await b.evaluate(() => window.history.pushState({}, "", "/comparateur?communes=17300"));
    await aller(b, "/ou-vivre");
    await vider(b);
    const traces = await tracesPostHog(b);
    attendre("5. Deux onglets : l'onglet B mesurait avant", avant > 0);
    attendre("5. Deux onglets, refus dans A : plus rien ne part de B", s.evenements.length === n0, resume(s.evenements.slice(n0)));
    attendre("5. Deux onglets : traces effacées", traces.length === 0, traces.join(", "));
    await s.ctx.close();
  },
  async connexion_avant_consentement(browser) {
    const s = await contexte(browser, { user: USER });
    const page = await s.ctx.newPage();
    await aller(page, "/");
    const connu = await page.evaluate(async () => (await fetch("/").then(() => true)));
    await aller(page, "/comparateur");
    await vider(page);
    attendre("6. Connecté sans consentement : 0 événement, aucune identification", s.evenements.length === 0 && connu, resume(s.evenements));
    attendre("6. Connecté sans consentement : 0 requête PostHog", s.technique.length === 0);
    await s.ctx.close();
  },
  async connexion_apres_consentement(browser) {
    const s = await contexte(browser, { consentement: "granted", user: USER });
    const page = await s.ctx.newPage();
    await aller(page, "/");
    await vider(page);
    await aller(page, "/comparateur");
    await vider(page);
    const identify = s.evenements.filter((e) => e.event === "$identify");
    attendre("7. Connecté avec consentement : $identify sur l'UUID", identify.length >= 1 && identify.every((e) => e.props.distinct_id === USER.id), resume(s.evenements));
    attendre("7. Connecté avec consentement : l'e-mail n'apparaît dans aucun envoi", s.fuites.length === 0 && contient(s.evenements, USER.email).length === 0);
    attendre("7. Connecté : les événements suivants portent l'UUID", s.evenements.filter((e) => e.event === "$pageview").at(-1)?.props.distinct_id === USER.id);
    // Changement de compte sans déconnexion : pas de fusion des deux personnes.
    s.etat.utilisateur = USER2;
    await s.ctx.addCookies([sessionCookie(USER2)]);
    const n0 = s.evenements.length;
    await aller(page, "/ou-vivre");
    await vider(page);
    const suite = s.evenements.slice(n0);
    const id2 = suite.find((e) => e.event === "$identify");
    attendre("7. Changement de compte : identité neuve, jamais l'ancien compte comme alias", id2 && id2.props.distinct_id === USER2.id && id2.props.$anon_distinct_id !== USER.id, id2 ? `$anon_distinct_id=${id2.props.$anon_distinct_id}` : resume(suite));
    await s.ctx.close();
  },
  async deconnexion(browser) {
    const s = await contexte(browser, { consentement: "granted", user: USER });
    const page = await s.ctx.newPage();
    await aller(page, "/");
    await vider(page);
    // La déconnexion passe par la Server Action, qui efface la session sans prévenir le navigateur :
    // on la simule en retirant la session, puis on charge la page suivante.
    s.etat.utilisateur = null;
    // Tous les cookies de session (supabase-js peut réécrire la session en morceaux `.0`, `.1`…).
    for (const c of await s.ctx.cookies()) if (c.name.startsWith("sb-")) await s.ctx.clearCookies({ name: c.name });
    const n0 = s.evenements.length;
    await aller(page, "/comparateur");
    await vider(page);
    const vues = s.evenements.slice(n0).filter((e) => e.event === "$pageview");
    attendre("8. Déconnexion : l'identité de mesure est réinitialisée (plus l'UUID du compte)", vues.length > 0 && vues.every((e) => e.props.distinct_id !== USER.id && e.props.$user_id !== USER.id), vues.map((e) => e.props.distinct_id).join(", "));
    await s.ctx.close();
  },
  async champ_libre(browser) {
    const s = await contexte(browser, { consentement: "granted" });
    const page = await s.ctx.newPage();
    await aller(page, "/ou-vivre");
    const zone = page.locator("textarea, input[type=text], input:not([type])").first();
    await zone.click({ timeout: 5000 }).catch(() => {});
    await zone.fill(SECRET).catch(() => {});
    await cliquerUnBouton(page);
    await page.keyboard.press("Tab");
    await aller(page, `/checkout/dossier?banId=17300_9999_00012&label=${encodeURIComponent(ADRESSE)}&insee=17300`);
    await page.locator("a, button").first().click({ timeout: 2000 }).catch(() => {});
    await vider(page);
    const fuite = contient(s.evenements, "Projet-temoin").concat(contient(s.evenements, "rocade"), contient(s.evenements, "Temoins"), contient(s.evenements, "Rue%20des"));
    attendre("9. Champ libre et adresse de dossier : aucun contenu personnel dans les envois", fuite.length === 0 && s.evenements.length > 0, `${s.evenements.length} événement(s), ${fuite.length} fuite(s)`);
    await s.ctx.close();
  },
  async rechargement(browser) {
    const s = await contexte(browser);
    const page = await s.ctx.newPage();
    await aller(page, "/");
    await refuser(page);
    for (let i = 0; i < 3; i++) { await page.reload({ waitUntil: "domcontentloaded" }); await pause(page, 300); }
    await vider(page);
    attendre("10. Refus puis rechargements : choix respecté avant toute requête", s.evenements.length + s.technique.length === 0);
    await rouvrirPreferences(page);
    await accepter(page);
    await page.reload();
    await vider(page);
    attendre("10. Acceptation puis rechargement : mesure active dès le chargement", s.evenements.some((e) => e.event === "$pageview"));
    await s.ctx.close();
  },
  async stockage_inaccessible(browser) {
    const s = await contexte(browser, { stockageBloque: true });
    const page = await s.ctx.newPage();
    await aller(page, "/");
    await accepter(page).catch(() => {});
    await cliquerUnBouton(page);
    await aller(page, "/comparateur");
    await vider(page);
    attendre("11. Stockage inaccessible, même après « Accepter » : 0 événement, 0 requête", s.evenements.length + s.technique.length === 0, `${resume(s.evenements)} / ${s.technique.length}`);
    await s.ctx.close();
  },
  async google_reouverture(browser) {
    const s = await contexte(browser);
    const page = await s.ctx.newPage();
    await aller(page, "/");
    const c0 = await consentementsGoogle(page);
    await accepter(page);
    await pause(page, 300);
    const c1 = await consentementsGoogle(page);
    await cliquerUnBouton(page);
    await vider(page);
    const g1 = s.google.length;
    await rouvrirPreferences(page);
    await pause(page, 300);
    const c2 = await consentementsGoogle(page);
    const tRetrait = Date.now();
    await pause(page, VIDANGE_GOOGLE);
    const etat2 = await internesGoogle(page);
    // Choix effacé : les événements créés désormais ne partent plus comme « accordés ».
    const tRouvert = Date.now();
    const vidange = s.google.filter((r) => r.t >= tRetrait - 300 && r.t < tRouvert);
    await page.evaluate(() => window.history.pushState({}, "", "/ou-vivre"));
    await cliquerUnBouton(page);
    await vider(page);
    const apresReouverture = s.google.filter((r) => r.t >= tRouvert);
    await refuser(page);
    await pause(page, 300);
    const c3 = await consentementsGoogle(page);
    await rouvrirPreferences(page);
    await pause(page, 300);
    const c4 = await consentementsGoogle(page);
    await accepter(page);
    await pause(page, 300);
    const c5 = await consentementsGoogle(page);
    attendre("12. Google : refus par défaut avant tout choix", c0[0] === "default:denied/denied" && c0.length === 1, c0.join(" | "));
    attendre("12. Google : acceptation → update accordé", dernier(c1) === "update:granted/granted", dernier(c1));
    attendre("12. Google : réouverture des préférences → update refusé, sans attendre un clic", dernier(c2) === "update:denied/denied" && c2.length === c1.length + 1 && etat2 === "false", `${c2.slice(c1.length).join(" | ")} ; état interne du tag : update=${etat2}`);
    const nouveaux12 = creesApres(apresReouverture, "/ou-vivre");
    attendre("12. Google : après réouverture, les événements nouveaux partent en refus", nouveaux12.length > 0 && googleAccorde(nouveaux12).length === 0, `${decrire(nouveaux12)} (avant : ${g1} requête(s))`);
    constater("12. Google : événements créés AVANT la réouverture et envoyés après (file GA4)", decrire([...vidange.filter((r) => googleAccorde([r]).length), ...sortisDeLaFile(apresReouverture, "/ou-vivre")]));
    attendre("12. Google : refus, puis réouverture, puis nouvelle acceptation suivis dans l'ordre", dernier(c3) === "update:denied/denied" && dernier(c4) === "update:denied/denied" && dernier(c5) === "update:granted/granted", [dernier(c3), dernier(c4), dernier(c5)].join(" → "));
    await s.ctx.close();
  },
  async google_deux_onglets(browser) {
    const s = await contexte(browser, { consentement: "granted" });
    const a = await s.ctx.newPage();
    const b = await s.ctx.newPage();
    await aller(a, "/");
    await aller(b, "/comparateur");
    const b0 = await consentementsGoogle(b);
    const tRetrait = Date.now();
    await rouvrirPreferences(a);
    await pause(b, 500);
    const b1 = await consentementsGoogle(b);
    await pause(b, VIDANGE_GOOGLE);
    const etatB = await internesGoogle(b);
    const tRouvert = Date.now();
    const vidange = s.google.filter((r) => r.t >= tRetrait && r.t < tRouvert);
    await b.bringToFront();
    await cliquerUnBouton(b);
    await b.evaluate(() => window.history.pushState({}, "", "/comparateur?communes=17300"));
    await vider(b);
    const apres = s.google.filter((r) => r.t >= tRouvert);
    await a.bringToFront();
    await refuser(a);
    await pause(b, 500);
    const b2 = await consentementsGoogle(b);
    await rouvrirPreferences(a);
    await accepter(a);
    await pause(b, 500);
    const b3 = await consentementsGoogle(b);
    attendre("13. Google, deux onglets : B applique le choix retenu", dernier(b0) === "update:granted/granted", b0.join(" | "));
    attendre("13. Google, deux onglets : préférences rouvertes dans A → B passe en refus", dernier(b1) === "update:denied/denied" && etatB === "false", `${b1.slice(b0.length).join(" | ") || "aucune commande"} ; état interne du tag dans B : update=${etatB}`);
    const nouveaux13 = creesApres(apres, "communes=17300");
    attendre("13. Google, deux onglets : les événements nouveaux de B partent en refus", nouveaux13.length > 0 && googleAccorde(nouveaux13).length === 0, decrire(nouveaux13));
    constater("13. Google, deux onglets : événements créés AVANT le retrait et envoyés après (file GA4)", decrire([...vidange.filter((r) => googleAccorde([r]).length), ...sortisDeLaFile(apres, "communes=17300")]));
    attendre("13. Google, deux onglets : refus puis nouvelle acceptation dans A suivis par B", dernier(b2) === "update:denied/denied" && dernier(b3) === "update:granted/granted", `${dernier(b2)} → ${dernier(b3)}`);
    await s.ctx.close();
  },
};

(async () => {
  const browser = await chromium.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" });
  for (const [nom, f] of Object.entries(SCENARIOS)) {
    if (ONLY && !ONLY.has(nom)) continue;
    try { await f(browser); } catch (e) { attendre(`${nom} : exécution`, false, String(e).slice(0, 200)); }
  }
  await browser.close();
  const sortie = resultats.join("\n") + `\n\n${echecs === 0 ? "TOUS LES ATTENDUS TENUS" : `${echecs} ATTENDU(S) EN ÉCHEC`}\n`;
  console.log(sortie);
  if (!process.env.FUT181_NE_PAS_ECRIRE) fs.writeFileSync(`${OUT}/recette.txt`, sortie);
  process.exit(echecs === 0 ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(1); });
