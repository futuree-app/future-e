// FUT-33, phase 2A : la vérité littorale est dans l'index, à côté de l'ancien champ, et rien ne la lit encore.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { gunzipSync } from "node:zlib";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
// @ts-expect-error module JavaScript du prototype, sans déclaration de types
import { construireIndex, distanceAuRivage } from "../../scripts/mer/adresse-node.mjs";

const racine = new URL("../../", import.meta.url);
const index = JSON.parse(gunzipSync(readFileSync(new URL("data/comparateur-index.json.gz", racine))).toString("utf8")) as {
  meta: { mer?: { version: string; attribution: string; champs: string[] } };
  communes: Record<string, unknown>[];
};
const par = new Map(index.communes.map((c) => [c.insee as string, c]));
const c = (insee: string) => par.get(insee) as Record<string, any>;

test("métadonnées : version, champs, attribution Shom-IGN", () => {
  assert.equal(index.meta.mer?.version, "mer-v2");
  assert.deepEqual(index.meta.mer?.champs, ["mer_centre_km", "mer_territoire_km", "loi_littoral", "loi_effective", "loi_source_commune", "mer_facade"]);
  assert.match(index.meta.mer!.attribution, /© Shom-IGN, 2021, http:\/\/dx\.doi\.org\/10\.17183\/LIMTM/);
});

test("toutes les communes portent la vérité littorale ; l'ancien distance_cote_km est retiré (2B.2 D)", () => {
  for (const x of index.communes) {
    assert.equal(typeof x.mer_centre_km, "number", String(x.insee));
    assert.ok(x.mer_territoire_km === null || typeof x.mer_territoire_km === "number");
    assert.equal("distance_cote_km" in x, false, String(x.insee));
  }
});

test("façade officielle : valeur source, communes classées « Mer » seulement", () => {
  const facades = new Set(index.communes.map((x) => x.mer_facade ?? null));
  assert.deepEqual([...facades].sort(), ["MED", "MEMN", "NAMO", "SA", null].sort());
  for (const x of index.communes) {
    if (x.mer_facade != null) assert.ok(((x.loi_effective as string[] | null) ?? []).includes("Mer"), String(x.insee));
  }
  const attendu: [string, string | null][] = [["29019", "NAMO"], ["17300", "SA"], ["59183", "MEMN"], ["13207", "MED"], ["2A004", "MED"], ["14118", null], ["74010", null]];
  for (const [insee, f] of attendu) assert.equal(c(insee).mer_facade ?? null, f, insee);
  assert.match(JSON.stringify((index.meta.mer as Record<string, unknown>).facade), /DGAMPA-Shom, 2026/);
});

test("valeurs : Châtelaillon et Lannion au bord de la mer, Bordeaux et Rouen intérieures", () => {
  assert.equal(c("17094").mer_territoire_km, 0);
  assert.ok(c("17094").mer_centre_km < 3 && c("22113").mer_centre_km < 3);
  assert.ok(c("33063").mer_centre_km > 30 && c("76540").mer_centre_km > 30);
});

test("classement juridique : héritage PLM visible, Lac et Estuaire jamais Mer", () => {
  assert.equal(c("13207").loi_littoral, null);
  assert.deepEqual(c("13207").loi_effective, ["Mer"]);
  assert.equal(c("13207").loi_source_commune, "13055");
  assert.deepEqual(c("74010").loi_effective, ["Lac"]);
  assert.deepEqual(c("17299").loi_effective, ["Estuaire"]);
  assert.equal(c("33063").loi_effective, null);
});

test("rivage 5 m embarqué : la distance à l'adresse retrouve la distance du centre à quelques mètres près", () => {
  const brut = gunzipSync(readFileSync(new URL("data/mer/rivage-5m.f32.gz", racine)));
  const idx = construireIndex(new Float32Array(brut.buffer, brut.byteOffset, brut.byteLength / 4));
  for (const insee of ["17094", "22113", "29151", "33063", "14118", "13207", "34172"]) {
    const x = c(insee);
    const d = distanceAuRivage(idx, x.lon, x.lat) / 1000;
    assert.ok(Math.abs(d - x.mer_centre_km) < 0.02, `${x.nom} : ${d} contre ${x.mer_centre_km}`);
  }
});

test("phase 2B.2 D : la liste fermée des fichiers qui lisent les champs mer_* / loi_* de l'index", () => {
  const fichiers: string[] = [];
  const parcourir = (dossier: string) => {
    for (const n of readdirSync(dossier)) {
      const p = join(dossier, n);
      if (statSync(p).isDirectory()) parcourir(p);
      else if (/\.(ts|tsx)$/.test(n) && !/\.test\.ts$/.test(n)) fichiers.push(p);
    }
  };
  parcourir(fileURLToPath(new URL("src", racine)));
  const lecteurs = fichiers.filter((f) => /mer_centre_km|mer_territoire_km|loi_effective|loi_source_commune/.test(readFileSync(f, "utf8")));
  // commune-attributes (merDeLaCommune) sert la recherche ET le dossier ; mer-recherche porte les règles et la
  // traduction des façades ; comparateur-vie l'éditorial du comparateur ; territoire (faits, snapshot) le passeport.
  // hard-constraints et territory-facts ne les nomment qu'en commentaire ; hard-corpus est une fixture.
  assert.deepEqual(lecteurs.map((f) => f.split("/src/")[1]).sort(), [
    "lib/__fixtures__/hard-corpus.ts", "lib/commune-attributes.ts", "lib/comparateur-vie.ts",
    "lib/decision/territory-facts.ts", "lib/hard-constraints.ts", "lib/mer-recherche.ts",
    "lib/server/territoire-snapshot.ts", "lib/territoire/facts.ts",
  ]);
});
