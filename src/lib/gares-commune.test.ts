import test from "node:test";
import assert from "node:assert/strict";
import { gunzipSync } from "node:zlib";
import { readFileSync } from "node:fs";
import {
  communeDeLAdresse, eloignementEnMots, gareDansLaCommune, garesDeLaCommune, nomDeGareLisible,
  normaliserNomCommune, signalTrain, RAYON_GARES_KM,
} from "./gares-commune.ts";
import { loadBpePointsAround } from "./logement-bpe.ts";

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
  const { points } = await loadBpePointsAround({ lat: c.lat, lon: c.lon });
  const gares = garesDeLaCommune(c, points);
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
  assert.match(route, /buildTerritorySignals\(entry, garesDeLaCommune\(entry, pointsBpe\)\)/);
  assert.match(route, /loadBpePointsAround\(\{ lat: entry\.lat, lon: entry\.lon \}\)/);
  // Sans les points BPE dans la fonction déployée, la route ne nommerait aucune gare en production.
  assert.match(lire("next.config.ts"), /"\/qna": \[\s*"\.\/data\/comparateur-index\.json\.gz",\s*"\.\/data\/bpe-points\/\*\*",\s*\]/);
  assert.match(lire("src/lib/accueil/qna.ts"), /Never present any other station as the commune's station, its nearest station or its usual station/);
});

test("câblage FUT-97 : le classement garde l'indicateur d'accès au train", () => {
  // Le texte change, pas le classement : `desserte` reste la clé du critère.
  assert.match(lire("src/lib/comparateur-scores.ts"), /return c\.transport\?\.desserte \?\? null;/);
  assert.match(lire("src/lib/comparateur-vie.ts"), /return c\.transport\?\.desserte \?\? null;/);
});
