// FUT-137 · Les artefacts versionnés : la table des successeurs du COG, le bilan des associations du RNA, et la vie
// locale de l'index qui en dérive. La règle elle-même est testée sur un COG fictif (scripts/lib/successeurs-cog.test.mjs).
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import zlib from "node:zlib";
import { COG_MVT } from "../lib/logement-index.mjs";
import { COG_COMMUNES } from "./construire-successeurs.mjs";

const table = JSON.parse(readFileSync("data/successeurs-cog2026.json", "utf8"));
const bilan = JSON.parse(readFileSync("data/vie-locale-rattachements-rna.json", "utf8"));
const fut109 = JSON.parse(readFileSync("data/population-referentiel-cog2025.json", "utf8")).communes;
const index = JSON.parse(zlib.gunzipSync(readFileSync("data/comparateur-index.json.gz")).toString("utf8"));
const parCode = new Map(index.communes.map((c) => [c.insee, c]));
const python = existsSync(".venv-bpe/bin/python") ? ".venv-bpe/bin/python" : "python3";

test("populate-vie-locale : selftest (fusion, chaîne, changement de code, rétablissement, conservation, refus)", () => {
  const out = execFileSync(python, ["scripts/populate-vie-locale.py", "--selftest"], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  assert.equal(out, "");
});

test("table des successeurs : sources épinglées, chaque code disparu a une seule issue, toujours dans l'index", () => {
  assert.equal(table.sources.mouvements.sha256, COG_MVT.sha256);
  assert.equal(table.sources.communes.sha256, COG_COMMUNES.sha256);
  for (const [ancien, actuel] of Object.entries(table.rattaches)) {
    assert.ok(!parCode.has(ancien), `${ancien} est une commune de l'index`);
    assert.ok(parCode.has(actuel), `${ancien} -> ${actuel} hors de l'index`);
    assert.ok(!(ancien in table.abstentions), `${ancien} à la fois rattaché et en abstention`);
  }
  for (const code of Object.keys(table.abstentions)) assert.ok(!parCode.has(code), code);
  assert.equal(Object.keys(table.rattaches).length + Object.keys(table.abstentions).length, table.comptes.codesDisparus);
  for (const code of table.parRattachementOfficiel) assert.ok(code in table.rattaches, code);
});

test("table des successeurs : les codes repris de FUT-109 vont à la même commune", () => {
  for (const [k, c] of Object.entries(fut109)) for (const ancien of c.codesRepris) assert.equal(table.rattaches[ancien], k, ancien);
});

test("table des successeurs : territoires réels (fusions, chaîne, changement de code, rétablissement)", () => {
  const r = table.rattaches;
  assert.deepEqual(["01221", "01414", "01442"].map((c) => r[c]), ["01036", "01036", "01036"]); // Valromey-sur-Séran
  assert.equal(r["14363"], "14654"); // Lieury : quatre mouvements (1973, 1990, 2014, 2017) jusqu'à Saint-Pierre-en-Auge
  assert.equal(r["12076"], "12218"); // Conques -> Conques-en-Rouergue : changement de code seul
  assert.equal(r["49144"], "44180"); // Freigné : changement de département, puis Vallons-de-l'Erdre
  // Les Hauts-Talican découpée en 2024 : La Neuville-Garnier n'est pas dans 60054, qui n'a gardé que le code.
  assert.equal(r["60455"], "60694");
  assert.ok(table.parRattachementOfficiel.includes("60455"));
  // Cussac entre dans Bourdeilles en 1960, découpée en 1989, sans commune de rattachement officielle : abstention.
  assert.deepEqual(table.abstentions["24149"], { motif: "retablissement_posterieur", commune: "24068", arrivee: "1960-08-13", decoupage: ["1989-02-15"] });
});

test("table des successeurs : reconstruite à l'identique depuis les fichiers Insee épinglés", { skip: !existsSync("data/cache-logement/cog/v_commune_2026.csv") && "COG 2026 absent du cache local" }, () => {
  const out = execFileSync(process.execPath, ["--no-warnings", "scripts/fut137/construire-successeurs.mjs", "--verifier"], { encoding: "utf8" });
  assert.match(out, /reproduit à l'identique/);
});

test("bilan RNA : chaque association active est comptée une fois, dans une commune ou sous un motif", () => {
  const nonRattachees = Object.values(bilan.nonRattachees).reduce((s, v) => s + v, 0);
  assert.equal(bilan.direct + bilan.rattachees + nonRattachees, bilan.total);
  const parCodes = Object.values(bilan.parCodeDisparu).reduce((s, v) => s + v.associations, 0);
  assert.equal(parCodes, bilan.rattachees);
  for (const [motif, codes] of Object.entries(bilan.parMotif)) {
    assert.equal(Object.values(codes).reduce((s, v) => s + v, 0), bilan.nonRattachees[motif], motif);
  }
  // Un code n'a qu'un destin : jamais à la fois rattaché et non rattaché, jamais une commune de l'index.
  const nonRattaches = new Set(Object.values(bilan.parMotif).flatMap((codes) => Object.keys(codes)));
  for (const code of Object.keys(bilan.parCodeDisparu)) {
    assert.ok(!nonRattaches.has(code), code);
    assert.ok(!parCode.has(code), code);
  }
});

test("bilan RNA : il applique exactement la table versionnée, et aucun code ambigu n'est rattaché", () => {
  assert.equal(bilan.sources.successeurs.sha256, createHash("sha256").update(readFileSync("data/successeurs-cog2026.json")).digest("hex"));
  for (const [code, { commune }] of Object.entries(bilan.parCodeDisparu)) assert.equal(commune, table.rattaches[code], code);
  for (const code of Object.keys(bilan.parMotif.retablissement_posterieur ?? {})) assert.equal(table.abstentions[code]?.motif, "retablissement_posterieur", code);
  for (const [code, a] of Object.entries(table.abstentions)) assert.ok(!(code in bilan.parCodeDisparu), `${code} (${a.motif}) rattaché`);
});

test("bilan RNA : Valromey-sur-Séran reçoit les 17 associations de ses anciennes communes", () => {
  const recues = Object.entries(bilan.parCodeDisparu).filter(([, v]) => v.commune === "01036").map(([c, v]) => [c, v.associations]);
  assert.deepEqual(recues, [["01221", 5], ["01414", 6], ["01442", 6]]);
});

test("index : la vie locale suit les données corrigées, sans toucher aux abstentions de FUT-109", () => {
  assert.deepEqual(parCode.get("01036").vieLocale, { score: 86, lieux_pct: 87, assos_pct: 83 }); // 79 / 59 avant FUT-137
  // Une commune rétablie, ou sa commune d'origine, reste non notée : ses associations ne sont pas réparties.
  for (const [k, c] of Object.entries(fut109)) if (c.retablissement) assert.equal(parCode.get(k).vieLocale, null, k);
});

test("index : une note de vie locale a un rang, un rang a une note, et le rang suit l'ordre des notes", () => {
  const notees = index.communes.filter((c) => c.vieLocale != null);
  for (const c of index.communes) assert.equal(c.vieLocale != null, c.rankBands?.vie_locale != null, c.insee);
  // Même note, même bande ; note plus haute, bande jamais plus basse.
  const parNote = new Map();
  for (const c of notees) {
    const b = JSON.stringify(c.rankBands.vie_locale);
    if (parNote.has(c.vieLocale.score)) assert.equal(parNote.get(c.vieLocale.score), b, c.insee);
    else parNote.set(c.vieLocale.score, b);
  }
  const bandes = [...parNote].sort(([a], [b]) => a - b).map(([, b]) => JSON.parse(b));
  for (let i = 1; i < bandes.length; i++) assert.ok(bandes[i][0] >= bandes[i - 1][1], `bande ${i}`);
});
