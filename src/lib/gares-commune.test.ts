import test from "node:test";
import assert from "node:assert/strict";
import { gunzipSync } from "node:zlib";
import { mkdtempSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import {
  communeDeLAdresse, eloignementEnMots, gareDansLaCommune, garesDeLaCommune, nomDeGareLisible,
  normaliserNomCommune, signalTrain, RAYON_GARES_KM,
} from "./gares-commune.ts";
import { chargerGaresBpe, lireGaresBpe } from "./gares-bpe.ts";

const lire = (p: string) => readFileSync(p, "utf8");

type Commune = { insee: string; nom: string; dept: string; lat: number; lon: number; transport: { desserte: number; gare_nom: string | null; gare_km: number | null } | null };
let index: Commune[] | null = null;
function commune(insee: string): Commune {
  index ??= JSON.parse(gunzipSync(readFileSync("data/comparateur-index.json.gz")).toString()).communes as Commune[];
  const c = index.find((x) => x.insee === insee);
  assert.ok(c, `commune ${insee} absente de l'index`);
  return c;
}
async function cas(insee: string) {
  const c = commune(insee);
  const bpe = await chargerGaresBpe();
  assert.ok(bpe, "data/gares-bpe.json doit être lisible");
  const gares = garesDeLaCommune(c, bpe.gares);
  return { c, gares, signal: signalTrain(gares, c.transport!.desserte) };
}

// ── Les règles ───────────────────────────────────────────────────────────────────────────────

test("FUT-97 : la commune d'une adresse BPE, sous ses trois formes", () => {
  assert.deepEqual(communeDeLAdresse("1 RUE JULIA ET MAURICE MARCOU, 17700 SURGÈRES"), { cp: "17700", nom: "SURGÈRES" });
  assert.deepEqual(communeDeLAdresse("64 BOULEVARD PIERRE SEMARD, TOULOUSE"), { cp: null, nom: "TOULOUSE" });
  assert.deepEqual(communeDeLAdresse("17430 TONNAY-CHARENTE"), { cp: "17430", nom: "TONNAY-CHARENTE" });
  assert.deepEqual(communeDeLAdresse("BORDEAUX"), { cp: null, nom: "BORDEAUX" });
  assert.equal(communeDeLAdresse(undefined), null);
  assert.equal(communeDeLAdresse(""), null);
  assert.equal(normaliserNomCommune("Saint-Laurent-de-la-Prée"), normaliserNomCommune("SAINT-LAURENT-DE-LA-PRÉE"));
  assert.equal(normaliserNomCommune("Paris 10e Arrondissement"), normaliserNomCommune("PARIS 10E ARRONDISSEMENT"));
});

test("FUT-97 : une gare est dans la commune par son NOM, jamais par son code postal", () => {
  // La BPE place la gare de Rochefort au 17300, qui est le code INSEE de La Rochelle.
  const gareDeRochefort = { a: "PLACE FRANCOIS DORLEAC, 17300 ROCHEFORT" };
  assert.equal(gareDansLaCommune(gareDeRochefort, { nom: "Rochefort", dept: "17" }), true);
  assert.equal(gareDansLaCommune(gareDeRochefort, { nom: "La Rochelle", dept: "17" }), false);
  // L'homonyme de Savoie n'hérite pas de la gare charentaise.
  assert.equal(gareDansLaCommune(gareDeRochefort, { nom: "Rochefort", dept: "73" }), false);
  // Sans code postal, le nom suffit.
  assert.equal(gareDansLaCommune({ a: "64 BOULEVARD PIERRE SEMARD, TOULOUSE" }, { nom: "Toulouse", dept: "31" }), true);
  assert.equal(gareDansLaCommune({ a: "20000 AJACCIO" }, { nom: "Ajaccio", dept: "2A" }), true);
  assert.equal(gareDansLaCommune({}, { nom: "Rochefort", dept: "17" }), false);
});

test("FUT-97 : la distance se dit sans chiffre, et le nom de gare se lit", () => {
  assert.equal(eloignementEnMots(0.9), "à moins de deux kilomètres");
  assert.equal(eloignementEnMots(3.4), "à quelques kilomètres");
  assert.equal(eloignementEnMots(RAYON_GARES_KM), "entre cinq et dix kilomètres");
  for (const km of [0.1, 1.9, 2, 4.9, 5, 9.9]) assert.doesNotMatch(eloignementEnMots(km), /\d/);
  assert.equal(nomDeGareLisible("LA ROCHELLE PORTE DAUPHINE"), "La Rochelle Porte Dauphine");
  assert.equal(nomDeGareLisible("SAINT-LAURENT FOURAS"), "Saint-Laurent Fouras");
  assert.equal(nomDeGareLisible("AIGREFEUILLE-LE-THOU"), "Aigrefeuille-le-Thou");
});

test("FUT-97 : le niveau d'accès se dit sans comparatif", () => {
  const sansBpe = garesDeLaCommune({ nom: "X", dept: "17", lat: 46, lon: -1, transport: null }, null);
  assert.equal(signalTrain(sansBpe, 75).acces_au_train, "bien relié par le train");
  assert.equal(signalTrain(sansBpe, 44).acces_au_train, "accès au train modéré");
  assert.equal(signalTrain(sansBpe, 12).acces_au_train, "accès au train limité");
  for (const d of [0, 29, 30, 59, 60, 100]) assert.doesNotMatch(String(signalTrain(sansBpe, d).acces_au_train), /plus |moins |que /);
});

test("FUT-97 : sans la BPE, le signal ne nomme AUCUNE gare, pas même celle de référence", () => {
  const gares = garesDeLaCommune({ nom: "Rochefort", dept: "17", lat: 45.9455, lon: -0.9745, transport: { gare_nom: "La Rochelle", gare_km: 26.5 } }, null);
  assert.equal(gares.reference?.nom, "La Rochelle", "la référence reste connue du calcul");
  const s = signalTrain(gares, 44);
  assert.deepEqual(Object.keys(s).sort(), ["acces_au_train", "ce_que_mesure_cet_acces"]);
  assert.doesNotMatch(JSON.stringify(s), /Rochelle|gare_de_reference|"gare"/);
});

// ── Illisible n'est pas vide (revue du 15/10/2026) ─────────────────────────────────────────

test("FUT-97 : des gares illisibles ne deviennent JAMAIS « aucune gare recensée »", async () => {
  const dossier = mkdtempSync(path.join(tmpdir(), "fut97-"));
  const absent = path.join(dossier, "absent.json");
  const casIllisibles: [string, string | null][] = [
    ["fichier absent de la fonction déployée", null],
    ["JSON invalide", "{ pas du json"],
    ["liste vide", JSON.stringify({ millesime: "2025", gares: [] })],
    ["millésime manquant", JSON.stringify({ gares: [{ t: "E108", lat: 45.9, lon: -0.9 }] })],
    ["liste partiellement corrompue", JSON.stringify({ millesime: "2025", gares: [{ t: "E108", lat: 45.9, lon: -0.9 }, { t: "E108", lat: "x" }] })],
  ];
  const rochefort = { nom: "Rochefort", dept: "17", lat: 45.9455, lon: -0.9745, transport: { gare_nom: "La Rochelle", gare_km: 26.5 } };
  for (const [motif, contenu] of casIllisibles) {
    const fichier = contenu === null ? absent : path.join(dossier, `${motif.replace(/\W+/g, "-")}.json`);
    if (contenu !== null) writeFileSync(fichier, contenu);
    const lu = await chargerGaresBpe(fichier);
    assert.equal(lu, null, `${motif} : lu comme une liste`);
    const signal = JSON.stringify(signalTrain(garesDeLaCommune(rochefort, lu?.gares ?? null), 44));
    assert.doesNotMatch(signal, /aucune gare|gare_dans_la_commune|gare_la_plus_proche|Rochelle/, motif);
  }
  // Une liste vide passée directement n'est pas une absence de gares non plus.
  const vide = garesDeLaCommune(rochefort, []);
  assert.equal(vide.bpeLue, false);
  assert.equal(vide.dansLaCommune, null);
  // Un échec ne reste pas en mémoire : le fichier réparé est relu.
  writeFileSync(absent, JSON.stringify({ millesime: "2025", gares: [{ t: "E108", lat: 45.9455, lon: -0.9745, n: "ROCHEFORT", a: "17300 ROCHEFORT" }] }));
  assert.equal((await chargerGaresBpe(absent))?.gares.length, 1);
  assert.equal(lireGaresBpe("null"), null);
});

test("FUT-97 : data/gares-bpe.json reprend fidèlement les gares des points BPE versionnés", () => {
  const derive = JSON.parse(readFileSync("data/gares-bpe.json", "utf8")) as { millesime: string; gares: { t: string; lat: number; lon: number; n?: string; a?: string }[] };
  const millesimes = new Set<string>();
  const attendues: string[] = [];
  for (const f of readdirSync("data/bpe-points").filter((f) => f.endsWith(".json"))) {
    const j = JSON.parse(readFileSync(path.join("data/bpe-points", f), "utf8")) as { millesime?: string; points: { t: string; lat: number; lon: number; n?: string; a?: string }[] };
    if (j.millesime) millesimes.add(j.millesime);
    for (const p of j.points) if (["E107", "E108", "E109"].includes(p.t)) attendues.push(`${p.t}|${p.lat}|${p.lon}|${p.n ?? ""}|${p.a ?? ""}`);
  }
  assert.deepEqual([...millesimes], [derive.millesime], "un seul millésime, celui des points BPE");
  const obtenues = derive.gares.map((g) => `${g.t}|${g.lat}|${g.lon}|${g.n ?? ""}|${g.a ?? ""}`);
  assert.deepEqual(obtenues.sort(), attendues.sort(), "régénérer : node scripts/extraire-gares-bpe.mjs");
});

// ── Les cas de l'étude, sur les données versionnées ─────────────────────────────────────────

test("FUT-97 : Rochefort a sa gare, et La Rochelle n'est plus transmise comme telle", async () => {
  const { c, gares, signal } = await cas("17299");
  assert.equal(c.transport?.gare_nom, "La Rochelle", "l'indicateur garde sa gare de référence");
  assert.equal(gares.dansLaCommune, true);
  assert.equal(gares.plusProche?.nom, "Rochefort");
  assert.equal(gares.plusProche?.dansLaCommune, true);
  assert.ok(gares.plusProche!.km < 2);
  const texte = JSON.stringify(signal);
  assert.doesNotMatch(texte, /Rochelle/, "la gare de référence ne doit pas atteindre /qna");
  assert.match(texte, /"gare_dans_la_commune":"oui"/);
  assert.match(texte, /"nom":"Rochefort","dans_la_commune":true/);
  assert.match(texte, /à vol d'oiseau depuis le point de référence de la commune/);
});

test("FUT-97 : Surgères a sa gare, et La Rochelle n'est plus transmise comme telle", async () => {
  const { c, gares, signal } = await cas("17434");
  assert.equal(c.transport?.gare_nom, "La Rochelle");
  assert.equal(gares.dansLaCommune, true);
  assert.equal(gares.plusProche?.nom, "Surgères");
  assert.doesNotMatch(JSON.stringify(signal), /Rochelle/);
  assert.match(JSON.stringify(signal), /"nom":"Surgères","dans_la_commune":true/);
});

test("FUT-97 : à Niort, gare de référence, gare de la commune et gare la plus proche coïncident", async () => {
  const { c, gares, signal } = await cas("79191");
  assert.equal(c.transport?.gare_nom, "Niort");
  assert.equal(gares.dansLaCommune, true);
  assert.equal(gares.plusProche?.nom, "Niort");
  assert.match(JSON.stringify(signal), /"nom":"Niort","dans_la_commune":true/);
});

test("FUT-97 : un homonyme sans gare ne reçoit ni la gare de référence ni celle de son homonyme", async () => {
  // Rochefort (Savoie) : référence « Lyon Part Dieu » à 69 km, aucune gare dans la commune.
  const { c, gares, signal } = await cas("73214");
  assert.equal(c.transport?.gare_nom, "Lyon Part Dieu");
  assert.equal(gares.dansLaCommune, false);
  assert.equal(gares.plusProche?.dansLaCommune, false);
  const texte = JSON.stringify(signal);
  assert.doesNotMatch(texte, /Lyon/);
  assert.match(texte, /aucune gare de voyageurs recensée dans la commune/);
});

// ── Le câblage ───────────────────────────────────────────────────────────────────────────────

test("câblage FUT-97 : /qna reçoit les gares de la BPE, jamais `gare_nom`", () => {
  const vie = lire("src/lib/comparateur-vie.ts");
  const signaux = vie.slice(vie.indexOf("export function buildTerritorySignals"), vie.indexOf("// ── Bassins d'emploi"));
  assert.match(signaux, /s\.train = signalTrain\(gares \?\? garesDeLaCommune\(c, null\), c\.transport\.desserte\);/);
  const code = signaux.split("\n").filter((l) => !l.trim().startsWith("//")).join("\n");
  assert.doesNotMatch(code, /gare_nom|gare_km/, "la gare de référence ne doit plus entrer dans les signaux");
  const route = lire("src/app/qna/route.ts");
  assert.match(route, /buildTerritorySignals\(entry, garesDeLaCommune\(entry, garesBpe\)\)/);
  assert.match(route, /const garesBpe = entry \? \(await chargerGaresBpe\(\)\)\?\.gares \?\? null : null;/);
  // Les gares seules (273 Ko), pas les cellules BPE complètes (39 Mo) : sans elles dans la fonction
  // déployée, la route ne nommerait aucune gare en production.
  const config = lire("next.config.ts");
  assert.match(config, /"\/qna": \[\s*"\.\/data\/comparateur-index\.json\.gz",\s*"\.\/data\/gares-bpe\.json",\s*\]/);
  assert.doesNotMatch(config.slice(config.indexOf('"/qna"'), config.indexOf('"/api/logement-autour"')), /bpe-points/);
  assert.match(lire("src/lib/accueil/qna.ts"), /Never present any other station as the commune's station, its nearest station or its usual station/);
});

test("câblage FUT-97 : le classement garde l'indicateur d'accès au train", () => {
  // Le texte change, pas le classement : `desserte` reste la clé du critère.
  assert.match(lire("src/lib/comparateur-scores.ts"), /return c\.transport\?\.desserte \?\? null;/);
  assert.match(lire("src/lib/comparateur-vie.ts"), /return c\.transport\?\.desserte \?\? null;/);
});
