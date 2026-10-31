// FUT-149, 31/10/2026 · § 2 : CONTRE-ÉPREUVE DE LA PUBLICATION AU FORMAT 2, sur des éditions construites par le VRAI
// `construire.py` (`editions_publication.py`), publiées par le VRAI `publier.mjs` et lues par le VRAI lecteur serveur
// (`src/lib/server/debroussaillement-tuiles.ts`), sur un Storage simulé en mémoire. Aucun accès réseau, aucun Supabase.
//
// DÉTECTEUR DE MÉLANGE : un crochet de chargement intercale, entre le lecteur serveur et la lib, une enveloppe de
// `lireDebroussaillement` qui compare, à CHAQUE lecture, le manifeste et chaque tuile reçus aux fichiers locaux de
// l'édition annoncée (égalité profonde). Une lecture qui combinerait deux éditions (manifeste de l'une, tuile de
// l'autre, ou tuile d'un contenu antérieur sous le même nom) est comptée comme MÉLANGE, quel que soit son résultat.
//
//   node publication2.mjs <worktree> <dossier des éditions>
import { register } from "node:module";
import { pathToFileURL } from "node:url";
import { readFileSync, readdirSync, writeFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { gunzipSync, gzipSync } from "node:zlib";
import { isDeepStrictEqual } from "node:util";
import path from "node:path";

const [W, ED] = process.argv.slice(2);
const ICI = path.dirname(new URL(import.meta.url).pathname);
const racine = pathToFileURL(`${W}/`).href;
const fichierEnveloppe = `${mkdtempSync(path.join(tmpdir(), "fut149-pub2-"))}/enveloppe-lib.mjs`;
const enveloppe = pathToFileURL(fichierEnveloppe).href;
writeFileSync(fichierEnveloppe, `
import * as vraie from ${JSON.stringify(`${racine}src/lib/debroussaillement.ts`)};
export * from ${JSON.stringify(`${racine}src/lib/debroussaillement.ts`)};
export function lireDebroussaillement(m, tuiles, e) { globalThis.__observer?.(m, tuiles); return vraie.lireDebroussaillement(m, tuiles, e); }
`);
register(`data:text/javascript,${encodeURIComponent(`export async function resolve(s, c, n) {
  if (s === "server-only") return { url: "data:text/javascript,export{}", shortCircuit: true };
  if (s === "@/lib/debroussaillement") return { url: ${JSON.stringify(enveloppe)}, shortCircuit: true };
  if (s.startsWith("@/")) return n(${JSON.stringify(racine)} + "src/" + s.slice(2) + ".ts", c);
  return n(s, c);
}`)}`);
const { client, envoyer, basculer, purger, etat, RefusPublication } = await import(`${W}/scripts/debroussaillement/publier.mjs`);
const lecteur = await import(`${W}/src/lib/server/debroussaillement-tuiles.ts`);
const lib = await import(`${W}/src/lib/debroussaillement.ts`);

// ── Les éditions locales (la vérité de chaque édition) ──────────────────────────────────────────
const EDITIONS = ["2026-03-01", "2026-03-01.2", "2026-03-01.3"];
const [E1, E2, E3] = EDITIONS;
const locale = Object.fromEntries(EDITIONS.map((e) => {
  const m = JSON.parse(readFileSync(`${ED}/${e}/manifest.json`, "utf8"));
  const t = new Map(readdirSync(`${ED}/${e}/t`).map((f) => [f.replace(".json.gz", ""), JSON.parse(gunzipSync(readFileSync(`${ED}/${e}/t/${f}`)).toString())]));
  return [e, { m, t, dossier: `${ED}/${e}` }];
}));
let lectures = 0, melanges = 0;
/** Les contenus COHÉRENTS admis sous chaque nom : l'édition construite, et (1b) le contenu concurrent entier. */
const variantes = Object.fromEntries(EDITIONS.map((e) => [e, [locale[e]]]));
globalThis.__observer = (m, tuiles) => {
  lectures++;
  // Une lecture est saine si le manifeste ET toutes ses tuiles viennent d'UNE même variante du nom annoncé.
  const ok = (variantes[m.edition] ?? []).some((ref) => isDeepStrictEqual(m, ref.m) && [...tuiles].every(([k, t]) => isDeepStrictEqual(t, ref.t.get(k))));
  if (!ok) { melanges++; console.error(`MÉLANGE : manifeste ${m.edition}, tuiles ${[...tuiles.keys()]}`); }
};

// ── Storage simulé fidèle (doublon : 400 avec corps 409, absent : 400 ; latence ; coupure ; corruption) ──────────
const B = "debroussaillement";
function storage({ latence = 0 } = {}) {
  const objets = new Map(); const ecritures = []; let coupureApres = Infinity;
  const dort = () => (latence ? new Promise((r) => setTimeout(r, Math.random() * latence)) : null);
  const f = async (url, init = {}) => {
    await dort();
    const u = new URL(url); const meth = init.method ?? "GET";
    if (u.pathname === `/storage/v1/object/list/${B}`) {
      const { prefix } = JSON.parse(init.body); const noms = new Set();
      for (const k of objets.keys()) if (k.startsWith(prefix)) noms.add(k.slice(prefix.length).split("/")[0]);
      return Response.json([...noms].map((name) => ({ name, metadata: objets.has(prefix + name) ? { size: objets.get(prefix + name).length } : null })));
    }
    const ch = decodeURIComponent(u.pathname.replace(`/storage/v1/object/${B}/`, ""));
    if (meth === "GET") return objets.has(ch) ? new Response(new Uint8Array(objets.get(ch))) : new Response('{"statusCode":"404","error":"not_found"}', { status: 400 });
    if (meth === "DELETE") { for (const p of JSON.parse(init.body).prefixes) objets.delete(p); return Response.json([]); }
    if (meth === "POST") {
      if (ecritures.length >= coupureApres) throw new Error("coupure réseau simulée");
      const up = init.headers?.["x-upsert"] === "true";
      if (objets.has(ch) && !up) return new Response('{"statusCode":"409","error":"Duplicate","message":"The resource already exists"}', { status: 400 });
      objets.set(ch, Buffer.from(init.body)); ecritures.push(ch);
      return Response.json({ Key: ch });
    }
    return new Response("non géré", { status: 405 });
  };
  return { objets, ecritures, f, couper: (n) => { coupureApres = ecritures.length + n; }, retablir: () => { coupureApres = Infinity; } };
}
const env = { DEBROUSSAILLEMENT_BUCKET: B, NEXT_PUBLIC_SUPABASE_URL: "https://simule.supabase.co", SUPABASE_SERVICE_ROLE_KEY: "k" };
// Silence réentrant (des lectures concurrentes se chevauchent) : la sortie n'est rendue qu'à la dernière.
const vraiLog = console.log, vraiErr = console.error; let silences = 0;
const tais = async (f) => {
  if (silences++ === 0) { console.log = () => {}; console.error = (...a) => { if (String(a[0]).startsWith("MÉLANGE")) vraiErr(...a); }; }
  try { return await f(); } finally { if (--silences === 0) { console.log = vraiLog; console.error = vraiErr; } }
};

// ── Les points lus : un par cellule (dans la zone de E1, hors de celle de E2), et le coin de quatre cellules ──────
const POINTS = [];
for (let ix = 50; ix < 56; ix++) for (let iy = 434; iy < 437; iy++) POINTS.push({ point: [ix / 10 + 0.025, iy / 10 + 0.05], geocodage: null, insee: "13092", parcelle: null });
POINTS.push({ point: [5.2001, 43.5001], geocodage: null, insee: "13092", parcelle: null });
/** La lecture attendue de chaque point, calculée par la lib pure sur les fichiers locaux de l'édition. */
const attendu = Object.fromEntries(EDITIONS.map((e) => [e, POINTS.map((p) => lib.lireDebroussaillement(locale[e].m, locale[e].t, p))]));
const distinctes = POINTS.filter((_, i) => !isDeepStrictEqual(attendu[E1][i], attendu[E2][i])).length;

/** Une lecture d'instance (chaude par défaut), `minutes` après maintenant ; rend l'édition lue, ou « indisponible ». */
// L'horloge de toutes les instances simulées : `decalage` minutes après maintenant (posé une fois, sûr en concurrence).
let decalage = 0;
const horloge = Date.now; Date.now = () => horloge() + decalage * 60_000;
async function lirePoint(s, i, { froid = false } = {}) {
  if (froid) lecteur.oublierDebroussaillement();
  {
    const l = await tais(() => lecteur.lireDebroussaillementAdresse(POINTS[i], env, s.f));
    if (l.statut === "indisponible") return "indisponible";
    const e = l.source.edition;
    if (!(variantes[e] ?? []).some((v) => isDeepStrictEqual(l, lib.lireDebroussaillement(v.m, v.t, POINTS[i])))) { melanges++; return `FAUX(${e})`; }
    return e;
  }
}
const toutLire = async (s, opts) => { const r = {}; for (let i = 0; i < POINTS.length; i++) { const x = await lirePoint(s, i, opts); r[x] = (r[x] ?? 0) + 1; } return r; };
const resultats = [];
const noter = (n, titre, ok, detail) => { resultats.push({ n, titre, ok, detail }); console.log(`${ok ? "OK  " : "ÉCHEC"} ${n}. ${titre} : ${typeof detail === "string" ? detail : JSON.stringify(detail)}`); };
const enLigneConforme = (s, e) => {
  const m = locale[e].m; const brut = readFileSync(`${locale[e].dossier}/manifest.json`);
  if (!s.objets.get(`${e}/manifest.json`)?.equals(brut)) return false;
  return Object.entries(m.tuiles).filter(([, t]) => !("plein" in t)).every(([k]) => s.objets.get(`${e}/t/${k}.json.gz`)?.equals(readFileSync(`${locale[e].dossier}/t/${k}.json.gz`)));
};
const nouveau = (o) => { const s = storage(o); return { s, c: client(env.NEXT_PUBLIC_SUPABASE_URL, "k", s.f) }; };
console.log(`Éditions : ${EDITIONS.map((e) => `${e} (${Object.keys(locale[e].m.tuiles).length} cellules, ${locale[e].t.size} fichiers, format ${locale[e].m.format})`).join(" ; ")}`);
console.log(`Points : ${POINTS.length}, dont ${distinctes} dont la lecture diffère entre E1 et E2\n`);

// 1. Deux publications simultanées.
{ // 1a. même édition, même contenu, deux envois concurrents (20 essais)
  let ok = 0;
  for (let k = 0; k < 20; k++) {
    const { s, c } = nouveau({ latence: 4 });
    const r = await tais(() => Promise.allSettled([envoyer(c, locale[E1].dossier), envoyer(c, locale[E1].dossier)]));
    await new Promise((x) => setTimeout(x, 100));
    const repris = r.some((x) => x.status === "rejected") ? await tais(() => envoyer(c, locale[E1].dossier)).then(() => true, () => false) : true;
    if (repris && enLigneConforme(s, E1)) ok++;
  }
  noter("1a", "deux envois concurrents du même contenu", ok === 20, `${ok}/20 : en ligne identique à l'octet à la construction (au pire après une reprise)`);
}
{ // 1b. contenus différents sous le même identifiant neuf (20 essais) : jamais d'édition hybride basculable
  let hybrides = 0, basculees = 0, refusees = 0;
  for (let k = 0; k < 20; k++) {
    const { s, c } = nouveau({ latence: 4 });
    // Le contenu de E2 sous l'identifiant de E1 : on reconstruit les fichiers de E2 renommés (tuile, manifeste).
    const faux = `${ED}/.faux-${k}`;
    const { mkdirSync, rmSync } = await import("node:fs");
    rmSync(faux, { recursive: true, force: true }); mkdirSync(`${faux}/t`, { recursive: true });
    const m2 = structuredClone(locale[E2].m); m2.edition = E1;
    const { createHash } = await import("node:crypto");
    for (const [cle, t] of locale[E2].t) { const o = gzipSync(Buffer.from(JSON.stringify({ ...t, edition: E1 }))); writeFileSync(`${faux}/t/${cle}.json.gz`, o); m2.tuiles[cle] = { octets: o.length, sha256: createHash("sha256").update(o).digest("hex") }; }
    writeFileSync(`${faux}/manifest.json`, JSON.stringify(m2));
    const tf = new Map([...locale[E2].t].map(([cle, t]) => [cle, { ...t, edition: E1 }]));
    variantes[E1] = [locale[E1], { m: m2, t: tf }];
    await tais(() => Promise.allSettled([envoyer(c, locale[E1].dossier), envoyer(c, faux)]));
    await new Promise((x) => setTimeout(x, 150));
    try { await tais(() => basculer(c, E1)); basculees++; } catch { refusees++; }
    if (s.objets.has("courant.json")) { const r = await toutLire(s, { froid: true }); if (Object.keys(r).some((x) => x.startsWith("FAUX"))) hybrides++; }
    rmSync(faux, { recursive: true, force: true });
    variantes[E1] = [locale[E1]];
  }
  noter("1b", "deux envois concurrents de contenus différents sous le même identifiant", hybrides === 0 && melanges === 0, `${basculees} bascules abouties (sur une édition entière, l'une ou l'autre), ${refusees} refusées (intégrité : tuiles des deux envois sous le même nom), ${hybrides} lectures hybrides`);
}
{ // 1c. deux bascules concurrentes
  const { s, c } = nouveau({ latence: 4 });
  for (const e of [E1, E2]) await tais(() => envoyer(c, locale[e].dossier));
  await tais(() => Promise.all([basculer(c, E1), basculer(c, E2)]));
  const p = JSON.parse(s.objets.get("courant.json")).edition;
  const r = await toutLire(s, { froid: true });
  noter("1c", "deux bascules concurrentes", Object.keys(r).length === 1 && r[p] === POINTS.length, `pointeur final ${p} ; lectures ${JSON.stringify(r)}`);
}

// 2. Publication interrompue, puis reprise ; lecteurs pendant ce temps. Un Storage neuf par niveau de coupure.
{
  const fichiers = locale[E2].t.size;
  const det = []; let ok = true;
  for (const n of [0, 1, Math.floor(fichiers / 2), fichiers - 1, fichiers]) { // fichiers : toutes les tuiles, coupure avant le manifeste
    const { s, c } = nouveau();
    await tais(() => envoyer(c, locale[E1].dossier)); await tais(() => basculer(c, E1));
    s.couper(n);
    const r = await tais(() => envoyer(c, locale[E2].dossier)).then(() => "fini", () => "interrompu");
    await new Promise((x) => setTimeout(x, 50)); // les travailleurs orphelins de l'envoi interrompu
    s.retablir();
    const b = await tais(() => basculer(c, E2)).then(() => "BASCULÉE", (e) => (/aucun manifeste/.test(e.message) ? "refusée (pas de manifeste)" : "refusée"));
    const l = await toutLire(s, { froid: true });
    const reprise = await tais(() => envoyer(c, locale[E2].dossier));
    const b2 = await tais(() => basculer(c, E2)).then(() => true, () => false);
    const l2 = await toutLire(s, { froid: true });
    ok &&= r === "interrompu" && b.startsWith("refusée") && l[E1] === POINTS.length && b2 && l2[E2] === POINTS.length && enLigneConforme(s, E2);
    det.push(`coupure après ${n} dépôt(s) : envoi ${r}, bascule ${b}, lecteurs ${JSON.stringify(l)} ; reprise ${reprise.envoyes} déposées + ${reprise.deja} déjà là, bascule ${b2 ? "faite" : "refusée"}, lecteurs ${JSON.stringify(l2)}`);
  }
  noter("2", "publication interrompue puis reprise", ok, det.join(" | "));
}

// 3. Une tuile corrompue.
{
  const { s, c } = nouveau();
  await tais(() => envoyer(c, locale[E1].dossier)); await tais(() => basculer(c, E1));
  await tais(() => envoyer(c, locale[E2].dossier));
  const cle = "52_435";
  const vraie = s.objets.get(`${E2}/t/${cle}.json.gz`);
  // 3a. avant la bascule : contenu valide d'une AUTRE tuile (même format, JSON correct), puis octets tronqués
  s.objets.set(`${E2}/t/${cle}.json.gz`, s.objets.get(`${E2}/t/52_434.json.gz`));
  const a = await tais(() => basculer(c, E2)).then(() => "BASCULÉE", (e) => e.message.slice(0, 60));
  s.objets.set(`${E2}/t/${cle}.json.gz`, vraie.subarray(0, vraie.length - 7));
  const a2 = await tais(() => basculer(c, E2)).then(() => "BASCULÉE", (e) => e.message.slice(0, 60));
  const pointeur = JSON.parse(s.objets.get("courant.json")).edition;
  // 3b. après la bascule (hors protocole : la tuile est corrompue en ligne une fois l'édition active)
  s.objets.set(`${E2}/t/${cle}.json.gz`, vraie);
  await tais(() => basculer(c, E2));
  s.objets.set(`${E2}/t/${cle}.json.gz`, gzipSync(Buffer.from(JSON.stringify({ ...locale[E1].t.get(cle), edition: E2 }))));
  const l = await toutLire(s, { froid: true });
  const i = POINTS.findIndex((p) => lib.cellulesDeLecture(p).includes(cle));
  noter("3", "tuile corrompue", /intégrité/.test(a) && /intégrité/.test(a2) && pointeur === E1 && l.indisponible >= 1 && !Object.keys(l).some((x) => x.startsWith("FAUX")),
    `avant bascule : « ${a} » / « ${a2} », pointeur resté ${pointeur} ; après bascule, tuile remplacée en ligne : lecteurs ${JSON.stringify(l)} (point ${i} : indisponible, jamais lu)`);
}

// 4 à 7. Bascule, cache chaud pendant la bascule, retour arrière, purge.
{
  const { s, c } = nouveau({ latence: 2 });
  for (const e of [E1, E2]) await tais(() => envoyer(c, locale[e].dossier));
  await tais(() => basculer(c, E1));
  lecteur.oublierDebroussaillement(); decalage = 0;
  const chaud = await toutLire(s); // instance chaude : pointeur, manifeste et tuiles de E1 en mémoire
  // 4 + 7. Bascule E1 → E2 pendant que l'instance chaude lit en continu (lectures concurrentes), de 0 à 12 minutes.
  await tais(() => basculer(c, E2));
  const fil = [];
  for (const minutes of [0, 3, 6, 9, 9.99, 10.01, 12]) {
    decalage = minutes;
    const r = {};
    const lots = await Promise.all(POINTS.map((_, i) => lirePoint(s, i)));
    for (const x of lots) r[x] = (r[x] ?? 0) + 1;
    fil.push(`${minutes} min ${JSON.stringify(r)}`);
  }
  decalage = 0;
  const froide = await toutLire(s, { froid: true });
  noter("4", "bascule E1 → E2 (instance neuve)", froide[E2] === POINTS.length, JSON.stringify(froide));
  noter("7", "cache chaud pendant la bascule (lectures concurrentes)", fil.every((f) => !f.includes("FAUX") && !f.includes("indisponible")) && fil.at(-1).includes(`"${E2}":${POINTS.length}`),
    `avant : ${JSON.stringify(chaud)} ; après la bascule : ${fil.join(" ; ")}`);
  // 5. Retour arrière E2 → E1, instance chaude sur E2.
  lecteur.oublierDebroussaillement(); decalage = 0; await toutLire(s);
  await tais(() => basculer(c, E1));
  const ra = [];
  for (const minutes of [0, 10.01]) { decalage = minutes; ra.push(`${minutes} min ${JSON.stringify(await toutLire(s))}`); }
  decalage = 0;
  noter("5", "retour arrière E2 → E1", ra.at(-1).includes(`"${E1}":${POINTS.length}`) && !ra.join().includes("FAUX"), ra.join(" ; "));
  // 6. Purge : E3 publiée et activée, puis retour arrière sur E2 ; `purger --garder 1` doit garder E2 (courante) et E3 (la plus récente).
  await tais(() => envoyer(c, locale[E3].dossier)); await tais(() => basculer(c, E3)); await tais(() => basculer(c, E2));
  await tais(() => purger(c, 1));
  const restent = (await tais(() => etat(c))).editions;
  const rb = await tais(() => basculer(c, E3)).then(() => "faite", (e) => e.message);
  const l3 = await toutLire(s, { froid: true });
  // purge par défaut (--garder 2) avec E3 courante : E2 (retour arrière possible) et E3 gardées.
  await tais(() => purger(c, 2));
  const restent2 = (await tais(() => etat(c))).editions;
  const rb2 = await tais(() => basculer(c, E2)).then(() => "faite", (e) => e.message);
  const l2 = await toutLire(s, { froid: true });
  noter("6", "purge conservant l'édition du retour arrière",
    isDeepStrictEqual(restent, [E2, E3]) && rb === "faite" && l3[E3] === POINTS.length && isDeepStrictEqual(restent2, [E2, E3]) && rb2 === "faite" && l2[E2] === POINTS.length,
    `courante E2 après retour arrière, purger --garder 1 → restent ${restent} ; retour sur E3 ${rb}, lecteurs ${JSON.stringify(l3)} ; puis purger --garder 2 (E3 courante) → restent ${restent2} ; retour arrière sur E2 ${rb2}, lecteurs ${JSON.stringify(l2)}`);
  // 6b. Une instance chaude encore sur E1 (purgée) pendant ≤ 10 min : jamais de lecture fausse.
}
{
  const { s, c } = nouveau();
  for (const e of [E1, E2, E3]) await tais(() => envoyer(c, locale[e].dossier));
  await tais(() => basculer(c, E1)); lecteur.oublierDebroussaillement(); decalage = 0;
  await lirePoint(s, 0); // instance chaude sur E1, une seule tuile en mémoire
  await tais(() => basculer(c, E2)); await tais(() => basculer(c, E3));
  await tais(() => purger(c, 2)); // E1 effacée, l'instance la croit encore courante (pointeur en mémoire)
  const r = await toutLire(s);
  decalage = 10.01; const r2 = await toutLire(s); decalage = 0;
  noter("6b", "édition purgée encore désignée par une instance chaude", !Object.keys(r).some((x) => x.startsWith("FAUX")) && r2[E3] === POINTS.length,
    `avant expiration du pointeur : ${JSON.stringify(r)} (tuile en mémoire servie, les autres indisponibles) ; après : ${JSON.stringify(r2)}`);
}
console.log(`\nDétecteur : ${lectures} lectures examinées, ${melanges} mélanges.`);
console.log(`BILAN : ${resultats.filter((r) => r.ok).length}/${resultats.length} scénarios conformes.`);
writeFileSync(`${ICI}/publication2.resultat.json`, JSON.stringify({ lectures, melanges, resultats }, null, 1));
process.exit(melanges === 0 && resultats.every((r) => r.ok) ? 0 : 1);
