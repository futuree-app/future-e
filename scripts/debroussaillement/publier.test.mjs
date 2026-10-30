// FUT-149 · CONTRE-ÉPREUVE DE LA PUBLICATION (revue indépendante du 29/10/2026) : une édition publiée est immuable.
//
// Un Supabase Storage simulé en mémoire (mêmes routes, `x-upsert: false` refusé sur un objet existant, comme
// l'API réelle) reçoit des éditions construites à la main. On vérifie, avec le VRAI publieur et le VRAI lecteur
// serveur de l'application :
//  - qu'une republication différente sous une édition active est refusée, sans aucune écriture, et que les
//    lecteurs voient exactement les anciennes données ;
//  - qu'une reprise identique est idempotente (aucun dépôt) ;
//  - qu'un envoi interrompu ne change rien pour les lecteurs, et que sa reprise aboutit ;
//  - que la bascule vérifie toutes les empreintes avant d'écrire le pointeur, seul objet remplacé.
import { test, before } from "node:test";
import assert from "node:assert/strict";
import { register } from "node:module";
import { pathToFileURL } from "node:url";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { gzipSync } from "node:zlib";
import { createHash } from "node:crypto";
import { client, envoyer, basculer, purger, etat, comparerEditions, RefusPublication } from "./publier.mjs";

// `server-only` et l'alias `@/` sont résolus par Next ; ici, par un crochet de chargement.
const racine = pathToFileURL(`${process.cwd()}/`).href;
register(`data:text/javascript,${encodeURIComponent(`export async function resolve(s, c, n) {
  if (s === "server-only") return { url: "data:text/javascript,export{}", shortCircuit: true };
  if (s.startsWith("@/")) return n(${JSON.stringify(racine)} + "src/" + s.slice(2) + ".ts", c);
  return n(s, c);
}`)}`);
let lecteur;
before(async () => { lecteur = await import("../../src/lib/server/debroussaillement-tuiles.ts"); });

const BUCKET = "debroussaillement";
/** Le Storage simulé : objets en mémoire ; journal des écritures ; panne injectable après N dépôts. */
function storage() {
  const objets = new Map();
  const ecritures = [];
  let pannesApres = Infinity;
  const f = async (url, init = {}) => {
    const u = new URL(url);
    const methode = init.method ?? "GET";
    const corps = init.body;
    const liste = u.pathname.match(new RegExp(`^/storage/v1/object/list/${BUCKET}$`));
    if (liste && methode === "POST") {
      const { prefix } = JSON.parse(corps);
      const noms = new Set();
      for (const k of objets.keys()) if (k.startsWith(prefix)) noms.add(k.slice(prefix.length).split("/")[0]);
      return Response.json([...noms].map((name) => ({ name, metadata: objets.has(prefix + name) ? { size: objets.get(prefix + name).length } : null })));
    }
    const chemin = decodeURIComponent(u.pathname.replace(new RegExp(`^/storage/v1/object/${BUCKET}/`), ""));
    if (methode === "GET") return objets.has(chemin) ? new Response(new Uint8Array(objets.get(chemin))) : new Response("absent", { status: 400 });
    if (methode === "POST") {
      if (ecritures.length >= pannesApres) throw new Error("coupure réseau simulée");
      const upsert = init.headers?.["x-upsert"] === "true";
      if (objets.has(chemin) && !upsert) return new Response("Duplicate", { status: 409 });
      objets.set(chemin, Buffer.from(corps));
      ecritures.push(chemin);
      return Response.json({ Key: chemin });
    }
    if (methode === "DELETE") {
      for (const k of JSON.parse(corps).prefixes) objets.delete(k);
      return Response.json([]);
    }
    return new Response("non géré", { status: 405 });
  };
  return { objets, ecritures, f, coupureApres: (n) => { pannesApres = ecritures.length + n; }, retablir: () => { pannesApres = Infinity; } };
}

const E = 1e7;
const rect = (lon0, lat0, lon1, lat1) => { const [x0, y0, x1, y1] = [lon0, lat0, lon1, lat1].map((v) => Math.round(v * E)); return [x0, y0, x1 - x0, 0, 0, y1 - y0, x0 - x1, 0]; };
/** Une édition construite à la main : `largeur` décide du contenu (la zone A s'étend jusqu'à 5,0 + largeur). */
function edition(edition, largeur) {
  const dossier = mkdtempSync(path.join(tmpdir(), "fut149-pub-"));
  mkdirSync(path.join(dossier, "t"));
  const tuiles = {};
  for (const [ix, iy, morceaux] of [[50, 434, [{ p: 0, o: "A", r: [rect(5.02, 43.42, 5.0 + largeur, 43.46)] }]], [51, 434, [{ p: 0, o: "B", r: [rect(5.12, 43.42, 5.14, 43.46)] }]]]) {
    const o = gzipSync(Buffer.from(JSON.stringify({ format: "debroussaillement-1", edition, ix, iy, morceaux })));
    writeFileSync(path.join(dossier, "t", `${ix}_${iy}.json.gz`), o);
    tuiles[`${ix}_${iy}`] = { octets: o.length, sha256: createHash("sha256").update(o).digest("hex") };
  }
  const manifeste = {
    format: "debroussaillement-1", edition, construitLe: "2026-10-29", producteur: "IGN", diffuseur: "IGN", licence: "Licence Ouverte 2.0",
    source: { url: "https://data.geopf.fr/telechargement/resource/DEBROUSSAILLEMENT" }, couverture: ["13"],
    profils: [{ departement: "13", source: "Zonage local", origine: null, millesime: "2008", arrete: null, arreteBrut: null, url: null, integration: null, integrationBrut: null }],
    tuiles,
  };
  writeFileSync(path.join(dossier, "manifest.json"), JSON.stringify(manifeste));
  return dossier;
}
const env = { DEBROUSSAILLEMENT_BUCKET: BUCKET, NEXT_PUBLIC_SUPABASE_URL: "https://simule.supabase.co", SUPABASE_SERVICE_ROLE_KEY: "cle" };
// Le point (5,075 ; 43,44) est dans la zone A large (jusqu à 5,08), et à 2 km de la zone A étroite (jusqu à 5,05) : hors zone.
const ICI = { point: [5.075, 43.44], geocodage: null, insee: "13092", parcelle: null };
async function lire(s) { lecteur.oublierDebroussaillement(); return lecteur.lireDebroussaillementAdresse(ICI, env, s.f); }
/** La lecture d'une instance déjà chaude (rien n'est oublié), `minutes` plus tard. */
async function lireChaud(s, minutes) {
  const vrai = Date.now;
  Date.now = () => vrai() + minutes * 60_000;
  try { return await lecteur.lireDebroussaillementAdresse(ICI, env, s.f); } finally { Date.now = vrai; }
}
const silencieux = async (f) => { const log = console.log; console.log = () => {}; try { return await f(); } finally { console.log = log; } };

test("publication, puis bascule : le lecteur voit l'édition publiée", async () => {
  const s = storage();
  const c = client(env.NEXT_PUBLIC_SUPABASE_URL, "cle", s.f);
  await silencieux(() => envoyer(c, edition("2026-03-01", 0.08)));
  assert.equal((await lire(s)).statut, "indisponible", "avant la bascule, aucun pointeur : rien n'est lu");
  await silencieux(() => basculer(c, "2026-03-01"));
  const l = await lire(s);
  assert.equal(l.statut, "lu");
  assert.equal(l.etat, "en_zone");
  assert.equal(l.source.edition, "2026-03-01");
});

test("une republication DIFFÉRENTE sous l'édition active est refusée, sans aucune écriture ; les lecteurs voient les anciennes données", async () => {
  const s = storage();
  const c = client(env.NEXT_PUBLIC_SUPABASE_URL, "cle", s.f);
  await silencieux(() => envoyer(c, edition("2026-03-01", 0.08)));
  await silencieux(() => basculer(c, "2026-03-01"));
  const avant = new Map([...s.objets].map(([k, v]) => [k, Buffer.from(v)]));
  const lectureAvant = await lire(s);
  const n = s.ecritures.length;
  // Contenu différent (zone A plus étroite : le point serait hors zone), même identifiant d'édition.
  await assert.rejects(silencieux(() => envoyer(c, edition("2026-03-01", 0.05))), (e) => e instanceof RefusPublication && /édition ACTIVE/.test(e.message));
  assert.equal(s.ecritures.length, n, "aucun objet écrit");
  assert.deepEqual([...s.objets.keys()].sort(), [...avant.keys()].sort());
  for (const [k, v] of avant) assert.ok(s.objets.get(k).equals(v), `${k} inchangé`);
  assert.deepEqual(await lire(s), lectureAvant, "le lecteur lit exactement les mêmes données");
  assert.equal(lectureAvant.etat, "en_zone");
});

test("un MANIFESTE seul modifié (tuiles identiques) sous l'édition active est refusé ; le manifeste en ligne reste celui des lecteurs", async () => {
  const s = storage();
  const c = client(env.NEXT_PUBLIC_SUPABASE_URL, "cle", s.f);
  const d = edition("2026-03-01", 0.08);
  await silencieux(() => envoyer(c, d));
  await silencieux(() => basculer(c, "2026-03-01"));
  const avant = Buffer.from(s.objets.get("2026-03-01/manifest.json"));
  const lectureAvant = await lire(s);
  // Même tuiles, manifeste modifié (un département de plus dans la couverture) : l'ancienne version le remplaçait.
  const m = JSON.parse(avant.toString("utf8"));
  writeFileSync(path.join(d, "manifest.json"), JSON.stringify({ ...m, couverture: ["13", "84"] }));
  await assert.rejects(silencieux(() => envoyer(c, d)), (e) => e instanceof RefusPublication && /édition ACTIVE/.test(e.message));
  assert.ok(s.objets.get("2026-03-01/manifest.json").equals(avant), "manifeste en ligne inchangé");
  assert.deepEqual(await lire(s), lectureAvant);
});

test("une tuile déjà en ligne avec un autre contenu (manifeste absent : envoi inachevé) est refusée avant tout dépôt", async () => {
  const s = storage();
  const c = client(env.NEXT_PUBLIC_SUPABASE_URL, "cle", s.f);
  const ancienne = edition("2026-03-01", 0.08);
  await silencieux(() => envoyer(c, ancienne));
  s.objets.delete("2026-03-01/manifest.json"); // comme un envoi coupé juste avant le manifeste
  const n = s.ecritures.length;
  await assert.rejects(silencieux(() => envoyer(c, edition("2026-03-01", 0.05))), (e) => e instanceof RefusPublication && /50_434.*autre contenu/.test(e.message));
  assert.equal(s.ecritures.length, n, "aucun dépôt");
});

test("une reprise identique est idempotente : aucun dépôt, tout est relu", async () => {
  const s = storage();
  const c = client(env.NEXT_PUBLIC_SUPABASE_URL, "cle", s.f);
  const d = edition("2026-03-01", 0.08);
  await silencieux(() => envoyer(c, d));
  const n = s.ecritures.length;
  const r = await silencieux(() => envoyer(c, d));
  assert.equal(r.envoyes, 0);
  assert.equal(s.ecritures.length, n);
});

test("un contenu nouveau se publie sous une révision (préfixe neuf) ; la bascule est la seule écriture que voit le lecteur, et le retour arrière marche", async () => {
  const s = storage();
  const c = client(env.NEXT_PUBLIC_SUPABASE_URL, "cle", s.f);
  await silencieux(() => envoyer(c, edition("2026-03-01", 0.08)));
  await silencieux(() => basculer(c, "2026-03-01"));
  await silencieux(() => envoyer(c, edition("2026-03-01.2", 0.05)));
  assert.equal((await lire(s)).source.edition, "2026-03-01", "envoyée, la révision n'est pas encore vue");
  assert.equal((await lire(s)).etat, "en_zone");
  await silencieux(() => basculer(c, "2026-03-01.2"));
  const apres = await lire(s);
  assert.equal(apres.source.edition, "2026-03-01.2");
  assert.equal(apres.etat, "hors_zone");
  await silencieux(() => basculer(c, "2026-03-01"));
  assert.equal((await lire(s)).etat, "en_zone", "retour arrière : l'ancienne édition, intacte");
  assert.deepEqual(s.ecritures.filter((k) => !k.startsWith("2026-03-01/") && !k.startsWith("2026-03-01.2/")), ["courant.json", "courant.json", "courant.json"], "seul le pointeur est réécrit");
});

test("un envoi interrompu ne change rien pour les lecteurs ; sa reprise aboutit ; la bascule exige toutes les empreintes", async () => {
  const s = storage();
  const c = client(env.NEXT_PUBLIC_SUPABASE_URL, "cle", s.f);
  await silencieux(() => envoyer(c, edition("2026-03-01", 0.08)));
  await silencieux(() => basculer(c, "2026-03-01"));
  const d2 = edition("2026-03-01.2", 0.05);
  s.coupureApres(1); // une tuile déposée, puis coupure
  await assert.rejects(silencieux(() => envoyer(c, d2)), /coupure réseau simulée/);
  s.retablir();
  assert.ok(!s.objets.has("2026-03-01.2/manifest.json"), "pas de manifeste : l'édition interrompue est incomplète");
  await assert.rejects(silencieux(() => basculer(c, "2026-03-01.2")), /aucun manifeste/);
  assert.equal((await lire(s)).source.edition, "2026-03-01", "les lecteurs voient toujours l'édition active");
  const r = await silencieux(() => envoyer(c, d2));
  assert.equal(r.deja, 1, "la reprise garde la tuile déjà déposée");
  assert.equal(r.envoyes, 1);
  // Une tuile corrompue en ligne : la bascule refuse, le pointeur ne bouge pas.
  s.objets.set("2026-03-01.2/t/51_434.json.gz", gzipSync(Buffer.from("{}")));
  await assert.rejects(silencieux(() => basculer(c, "2026-03-01.2")), /intégrité/);
  assert.equal((await lire(s)).source.edition, "2026-03-01");
});

test("le client refuse d'écraser autre chose que le pointeur", async () => {
  const s = storage();
  const c = client(env.NEXT_PUBLIC_SUPABASE_URL, "cle", s.f);
  await assert.rejects(c.deposer("2026-03-01/manifest.json", Buffer.from("{}"), "application/json", true), /seul courant\.json/);
});

test("le pointeur porte l'empreinte du manifeste vérifié par la bascule", async () => {
  const s = storage();
  const c = client(env.NEXT_PUBLIC_SUPABASE_URL, "cle", s.f);
  await silencieux(() => envoyer(c, edition("2026-03-01", 0.08)));
  await silencieux(() => basculer(c, "2026-03-01"));
  const p = JSON.parse(s.objets.get("courant.json").toString("utf8"));
  assert.equal(p.edition, "2026-03-01");
  assert.equal(p.manifeste, createHash("sha256").update(s.objets.get("2026-03-01/manifest.json")).digest("hex"));
});

test("R7 (contre-revue du 30/10/2026) : les éditions se classent par date puis par révision, pas par ordre alphabétique", () => {
  const l = ["2026-03-01.10", "2025-09-01", "2026-03-01.2", "2026-03-01", "2026-03-01.9"];
  assert.deepEqual([...l].sort(comparerEditions), ["2025-09-01", "2026-03-01", "2026-03-01.2", "2026-03-01.9", "2026-03-01.10"]);
  assert.deepEqual([...l].sort(), ["2025-09-01", "2026-03-01", "2026-03-01.10", "2026-03-01.2", "2026-03-01.9"], "le tri alphabétique, que la purge employait");
});

test("R7 : après un retour arrière sur la révision 2, la purge garde la révision 10, plus récente, et efface la plus ancienne", async () => {
  const s = storage();
  const c = client(env.NEXT_PUBLIC_SUPABASE_URL, "cle", s.f);
  for (const [v, l] of [["2026-03-01", 0.08], ["2026-03-01.2", 0.05], ["2026-03-01.10", 0.06]]) await silencieux(() => envoyer(c, edition(v, l)));
  await silencieux(() => basculer(c, "2026-03-01.10"));
  await silencieux(() => basculer(c, "2026-03-01.2")); // retour arrière
  assert.deepEqual((await silencieux(() => etat(c))).editions, ["2026-03-01", "2026-03-01.2", "2026-03-01.10"]);
  await silencieux(() => purger(c, 1));
  const restent = [...new Set([...s.objets.keys()].map((k) => k.split("/")[0]))].sort();
  // Avec le tri alphabétique, la dernière était « 2026-03-01.2 » (la courante) : la révision 10 était effacée.
  assert.deepEqual(restent, ["2026-03-01.10", "2026-03-01.2", "courant.json"]);
  assert.equal((await lire(s)).source.edition, "2026-03-01.2", "l'édition courante reste lisible");
  await assert.rejects(silencieux(() => purger(c, 0)), /au moins 1/);
});

test("R4 : purgée puis republiée SOUS LE MÊME NOM avec un autre contenu (hors protocole), une instance chaude relit tout, sans mélange", async () => {
  const s = storage();
  const c = client(env.NEXT_PUBLIC_SUPABASE_URL, "cle", s.f);
  await silencieux(() => envoyer(c, edition("2026-03-01", 0.08)));
  await silencieux(() => basculer(c, "2026-03-01"));
  lecteur.oublierDebroussaillement();
  assert.equal((await lireChaud(s, 0)).etat, "en_zone", "l'instance garde l'ancienne tuile en mémoire");
  for (const k of [...s.objets.keys()]) if (k.startsWith("2026-03-01/")) s.objets.delete(k); // purge à la main
  await silencieux(() => envoyer(c, edition("2026-03-01", 0.05)));
  await silencieux(() => basculer(c, "2026-03-01"));
  // Avant le 30/10, la tuile gardée (clé « édition/cellule ») servait le nouveau manifeste : « en zone ».
  const apres = await lireChaud(s, 11);
  assert.equal(apres.statut, "lu");
  assert.equal(apres.etat, "hors_zone");
  assert.deepEqual(apres, await lire(s), "identique à la lecture d'une instance neuve");
});
