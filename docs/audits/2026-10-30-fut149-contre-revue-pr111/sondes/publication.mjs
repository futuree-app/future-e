import { register } from "node:module";
import { pathToFileURL } from "node:url";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { gzipSync } from "node:zlib";
import { createHash } from "node:crypto";
const W = process.cwd();
const racine = pathToFileURL(`${W}/`).href;
register(`data:text/javascript,${encodeURIComponent(`export async function resolve(s, c, n) {
  if (s === "server-only") return { url: "data:text/javascript,export{}", shortCircuit: true };
  if (s.startsWith("@/")) return n(${JSON.stringify(racine)} + "src/" + s.slice(2) + ".ts", c);
  return n(s, c);
}`)}`);
const { client, envoyer, basculer } = await import(`${W}/scripts/debroussaillement/publier.mjs`);
const lecteur = await import(`${W}/src/lib/server/debroussaillement-tuiles.ts`);
const B = "debroussaillement";
// Storage simulé « fidèle » : duplicate → 400 avec corps 409 (forme historique de Supabase), absent → 400 ; latence aléatoire ;
// option : la première réponse d'un POST est un 503 alors que l'écriture a eu lieu.
function storage({ latence = 0, faux503 = new Set() } = {}) {
  const objets = new Map(); const ecritures = [];
  const dort = () => new Promise((r) => setTimeout(r, Math.random() * latence));
  const f = async (url, init = {}) => {
    await dort();
    const u = new URL(url); const m = init.method ?? "GET";
    if (u.pathname === `/storage/v1/object/list/${B}`) {
      const { prefix } = JSON.parse(init.body); const noms = new Set();
      for (const k of objets.keys()) if (k.startsWith(prefix)) noms.add(k.slice(prefix.length).split("/")[0]);
      return Response.json([...noms].map((name) => ({ name, metadata: objets.has(prefix + name) ? { size: objets.get(prefix + name).length } : null })));
    }
    const ch = decodeURIComponent(u.pathname.replace(`/storage/v1/object/${B}/`, ""));
    if (m === "GET") return objets.has(ch) ? new Response(new Uint8Array(objets.get(ch))) : new Response('{"statusCode":"404","error":"not_found"}', { status: 400 });
    if (m === "DELETE") { for (const p of JSON.parse(init.body).prefixes) objets.delete(p); return Response.json([]); }
    if (m === "POST") {
      const up = init.headers?.["x-upsert"] === "true";
      if (objets.has(ch) && !up) return new Response('{"statusCode":"409","error":"Duplicate","message":"The resource already exists"}', { status: 400 });
      objets.set(ch, Buffer.from(init.body)); ecritures.push(ch);
      if (faux503.has(ch)) { faux503.delete(ch); return new Response("upstream", { status: 503 }); }
      return Response.json({ Key: ch });
    }
  };
  return { objets, ecritures, f };
}
const E = 1e7;
const rect = (a, b, c, d) => { const [x0, y0, x1, y1] = [a, b, c, d].map((v) => Math.round(v * E)); return [x0, y0, x1 - x0, 0, 0, y1 - y0, x0 - x1, 0]; };
// Une édition à N tuiles ; `largeur` change le contenu de la tuile 50_434 (la zone sous le point).
function edition(ed, largeur, n = 24) {
  const dir = mkdtempSync(path.join(tmpdir(), "fut149-cr-")); mkdirSync(path.join(dir, "t")); const tuiles = {};
  for (let i = 0; i < n; i++) {
    const ix = 50 + (i % 6), iy = 434 + Math.floor(i / 6);
    const lon0 = ix / 10 + 0.02, lat0 = iy / 10 + 0.02;
    const r = ix === 50 && iy === 434 ? rect(5.02, 43.42, 5.0 + largeur, 43.46) : rect(lon0, lat0, lon0 + 0.02 + largeur / 100, lat0 + 0.02);
    const o = gzipSync(Buffer.from(JSON.stringify({ format: "debroussaillement-1", edition: ed, ix, iy, morceaux: [{ p: 0, o: `Z${i}`, r: [r] }] })));
    writeFileSync(path.join(dir, "t", `${ix}_${iy}.json.gz`), o);
    tuiles[`${ix}_${iy}`] = { octets: o.length, sha256: createHash("sha256").update(o).digest("hex") };
  }
  writeFileSync(path.join(dir, "manifest.json"), JSON.stringify({ format: "debroussaillement-1", edition: ed, construitLe: "x", producteur: "IGN", diffuseur: "IGN", licence: "LO",
    source: { url: "u" }, couverture: ["13"], profils: [{ departement: "13", source: "Zonage local", origine: null, millesime: "2008", arrete: null, arreteBrut: null, url: null, integration: null, integrationBrut: null }], tuiles }));
  return dir;
}
const env = { DEBROUSSAILLEMENT_BUCKET: B, NEXT_PUBLIC_SUPABASE_URL: "https://simule.supabase.co", SUPABASE_SERVICE_ROLE_KEY: "k" };
const ICI = { point: [5.075, 43.44], geocodage: null, insee: "13092", parcelle: null };
const tais = async (f) => { const l = console.log, e = console.error; console.log = () => {}; console.error = () => {}; try { return await f(); } finally { console.log = l; console.error = e; } };
const lire = async (s, oublier = true) => { if (oublier) lecteur.oublierDebroussaillement(); return tais(() => lecteur.lireDebroussaillementAdresse(ICI, env, s.f)); };
const out = (t, v) => console.log(`${t} : ${typeof v === "string" ? v : JSON.stringify(v)}`);

// A. Deux envois concurrents, contenus différents, MÊME identifiant neuf (aucune édition active).
for (let essai = 0; essai < 20; essai++) {
  const s = storage({ latence: 4 }); const c = client(env.NEXT_PUBLIC_SUPABASE_URL, "k", s.f);
  const [r1, r2] = await tais(() => Promise.allSettled([envoyer(c, edition("2026-03-01", 0.08)), envoyer(c, edition("2026-03-01", 0.05))]));
  await new Promise((r) => setTimeout(r, 300)); // laisser finir les travailleurs orphelins
  const man = s.objets.get("2026-03-01/manifest.json");
  let bascule = "non tentée";
  if (man) { try { await tais(() => basculer(c, "2026-03-01")); bascule = "faite"; } catch (e) { bascule = "refusée : " + String(e.message).slice(0, 60); } }
  const l = await lire(s);
  if (essai < 3 || (bascule === "faite" && l.statut !== "lu")) out(`A${essai}`, { envoi1: r1.status, envoi2: r2.status, manifeste: !!man, bascule, lecteur: l.statut + "/" + l.etat });
  if (bascule === "faite" && l.statut === "lu") {
    // la lecture doit correspondre EXACTEMENT au manifeste en ligne : toutes les tuiles vérifiées par empreinte
    const m = JSON.parse(man.toString()); let mixte = 0;
    for (const [k, t] of Object.entries(m.tuiles)) { const b = s.objets.get(`2026-03-01/t/${k}.json.gz`); if (!b || createHash("sha256").update(b).digest("hex") !== t.sha256) mixte++; }
    if (mixte) out(`A${essai} MÉLANGE`, mixte);
  }
}
// B. Purge puis réutilisation du même identifiant avec un autre contenu : la mémoire de l'instance garde-t-elle l'ancienne tuile ?
{
  const s = storage(); const c = client(env.NEXT_PUBLIC_SUPABASE_URL, "k", s.f);
  await tais(() => envoyer(c, edition("2026-03-01", 0.08))); await tais(() => basculer(c, "2026-03-01"));
  const l1 = await lire(s); // tuile 50_434 mise en mémoire
  for (const k of [...s.objets.keys()]) if (k.startsWith("2026-03-01/")) s.objets.delete(k); // purge (édition non courante après bascule ailleurs, ou effacement manuel)
  await tais(() => envoyer(c, edition("2026-03-01", 0.05))); await tais(() => basculer(c, "2026-03-01"));
  const vrai = await lire(s, true);
  // instance chaude : le pointeur expire (10 min) mais les tuiles restent en mémoire
  lecteur.oublierDebroussaillement(); await lire(s, false); // repart propre
  const s2 = storage(); const c2 = client(env.NEXT_PUBLIC_SUPABASE_URL, "k", s2.f);
  await tais(() => envoyer(c2, edition("2026-03-01", 0.08))); await tais(() => basculer(c2, "2026-03-01"));
  lecteur.oublierDebroussaillement(); const chaud1 = await lire(s2, false);
  for (const k of [...s2.objets.keys()]) if (k.startsWith("2026-03-01/")) s2.objets.delete(k);
  await tais(() => envoyer(c2, edition("2026-03-01", 0.05))); await tais(() => basculer(c2, "2026-03-01"));
  const now = Date.now; Date.now = () => now() + 11 * 60_000; // le pointeur gardé 10 min expire
  const chaud2 = await lire(s2, false); Date.now = now;
  out("B lecture initiale (zone large)", l1.etat);
  out("B même identifiant, nouveau contenu, instance froide", vrai.etat);
  out("B même identifiant, nouveau contenu, instance chaude après 11 min", `${chaud1.etat} → ${chaud2.etat} (attendu ${vrai.etat})`);
}
// C. 503 renvoyé alors que l'écriture a eu lieu (proxy) : l'envoi échoue-t-il proprement, et la reprise aboutit-elle ?
{
  const s = storage({ faux503: new Set(["2026-03-01/t/52_434.json.gz"]) }); const c = client(env.NEXT_PUBLIC_SUPABASE_URL, "k", s.f);
  const d = edition("2026-03-01", 0.08);
  let r1; try { await tais(() => envoyer(c, d)); r1 = "réussi"; } catch (e) { r1 = "échec : " + String(e.message).slice(0, 90); }
  let r2; try { const x = await tais(() => envoyer(c, d)); r2 = `réussi (${x.envoyes} envoyées, ${x.deja} déjà)`; } catch (e) { r2 = "échec : " + e.message.slice(0, 80); }
  out("C premier envoi", r1); out("C reprise", r2);
}
// D. Retour arrière : combien de temps une instance chaude continue-t-elle de servir l'édition retirée ?
{
  const s = storage(); const c = client(env.NEXT_PUBLIC_SUPABASE_URL, "k", s.f);
  await tais(() => envoyer(c, edition("2026-03-01", 0.08))); await tais(() => envoyer(c, edition("2026-03-01.2", 0.05)));
  await tais(() => basculer(c, "2026-03-01.2")); lecteur.oublierDebroussaillement(); const a = await lire(s, false);
  await tais(() => basculer(c, "2026-03-01")); const b = await lire(s, false);
  const now = Date.now; Date.now = () => now() + 11 * 60_000; const d = await lire(s, false); Date.now = now;
  out("D retour arrière", `avant ${a.source.edition}/${a.etat} ; juste après ${b.source.edition}/${b.etat} ; +11 min ${d.source.edition}/${d.etat}`);
  // purge de l'édition retirée pendant que l'instance la sert encore
  await tais(() => basculer(c, "2026-03-01.2")); lecteur.oublierDebroussaillement(); await lire(s, false);
  await tais(() => basculer(c, "2026-03-01"));
  for (const k of [...s.objets.keys()]) if (k.startsWith("2026-03-01.2/")) s.objets.delete(k);
  const ICI2 = { ...ICI, point: [5.42, 43.44] }; // une autre tuile, pas encore en mémoire
  const e = await tais(() => lecteur.lireDebroussaillementAdresse(ICI2, env, s.f));
  out("D purge pendant que l'instance sert l'édition retirée (autre tuile)", `${e.statut} (${e.source?.edition})`);
}
// E. Bucket activé (variable posée) mais pointeur jamais écrit
{ const s = storage(); out("E variable posée avant la première bascule", (await lire(s)).statut); }
// F. Purge : tri des révisions
out("F tri lexicographique des éditions", ["2026-03-01.2", "2026-03-01.10", "2026-03-01"].sort());
