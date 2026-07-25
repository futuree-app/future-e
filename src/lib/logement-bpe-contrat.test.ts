import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { TYPEQU_LABEL, FACE3_CATS } from "./logement-autour-types.ts";

// CONTRAT DE DONNÉES — BPE (Base permanente des équipements, INSEE).
//
// La particularité de cette source : elle traverse DEUX tables tenues dans deux langages. Le script
// `scripts/populate-bpe.py` décide de la CATÉGORIE d'un code d'équipement (`FACE3_CATS`) au moment de
// générer les shards ; `logement-autour-types.ts` porte son LIBELLÉ (`TYPEQU_LABEL`) au moment de
// l'afficher. Rien ne les oblige à rester d'accord.
//
// Le jour où le script ajoute un code sans que le TypeScript suive, l'équipement apparaît sans nom —
// ou disparaît. C'est la même famille de défaut que « feux de forêt » : deux bouts d'une chaîne qui
// parlent d'une donnée sans jamais se confronter.
//
// Ces tests lisent les SHARDS RÉELS (2 222 fichiers, ~283 000 points au 25/07/2026), pas une fixture :
// c'est la donnée que le produit sert vraiment.

const DIR = "data/bpe-points";

type Point = { c: string; t: string; lat: number; lon: number };

let cache: Point[] | null = null;
function points(): Point[] {
  if (cache) return cache;
  const out: Point[] = [];
  for (const f of readdirSync(DIR)) {
    if (!f.endsWith(".json")) continue;
    const d = JSON.parse(readFileSync(path.join(DIR, f), "utf8")) as { points?: Point[] };
    out.push(...(d.points ?? []));
  }
  cache = out;
  return out;
}

test("CONTRAT — TOUT code d'équipement présent dans les shards a un libellé affichable", () => {
  // Sans libellé, l'équipement se rend sans nom : le lecteur voit une distance sans savoir vers quoi.
  const codes = new Set(points().map((p) => p.t));
  const sansLibelle = [...codes].filter((c) => !TYPEQU_LABEL[c]);
  assert.deepEqual(
    sansLibelle, [],
    `Codes BPE sans libellé : ${sansLibelle.join(", ")}. Ajouter leur entrée dans TYPEQU_LABEL — le `
    + "script Python les a classés, le TypeScript doit savoir les nommer.",
  );
});

test("CONTRAT — aucun libellé ORPHELIN (déclaré mais absent des données)", () => {
  // L'inverse : un libellé pour un code que la BPE ne fournit plus. Inoffensif à l'écran, mais c'est le
  // signe que les deux tables ont commencé à diverger — et la prochaine divergence sera dans l'autre sens.
  const codes = new Set(points().map((p) => p.t));
  const orphelins = Object.keys(TYPEQU_LABEL).filter((c) => !codes.has(c));
  assert.deepEqual(orphelins, [], `Libellés sans données : ${orphelins.join(", ")}`);
});

test("CONTRAT — les catégories des shards sont EXACTEMENT celles que le produit connaît", () => {
  // `FACE3_CATS` pilote l'affichage par famille. Une catégorie inconnue dans les données serait
  // silencieusement ignorée ; une catégorie déclarée mais vide afficherait une rubrique creuse.
  const observees = new Set(points().map((p) => p.c));
  assert.deepEqual([...observees].sort(), [...FACE3_CATS].sort());
});

test("CONTRAT — un code appartient à UNE seule catégorie", () => {
  // Le script construit `code_to_cat` par inversion : un code présent dans deux familles y perdrait
  // silencieusement l'une des deux. Les shards doivent porter la trace de cette unicité.
  const parCode = new Map<string, Set<string>>();
  for (const p of points()) {
    if (!parCode.has(p.t)) parCode.set(p.t, new Set());
    parCode.get(p.t)!.add(p.c);
  }
  const ambigus = [...parCode].filter(([, cats]) => cats.size > 1);
  assert.deepEqual(ambigus.map(([c]) => c), [], "codes rattachés à plusieurs catégories");
});

test("CONTRAT — les coordonnées sont plausibles (France et outre-mer compris)", () => {
  // Un décalage lat/lon inverserait les distances sans rien casser d'autre. Les bornes couvrent la
  // Réunion (−21) et la Guadeloupe (−61), les outre-mer étant bien présents dans les shards.
  const hors = points().filter((p) =>
    !(p.lat >= -25 && p.lat <= 52) || !(p.lon >= -65 && p.lon <= 56));
  assert.deepEqual(hors.slice(0, 3), [], `${hors.length} points hors des bornes France + outre-mer`);
});

test("CONTRAT — chaque catégorie est réellement peuplée", () => {
  // Une famille vide voudrait dire que le filtre du script ne retient plus rien : la rubrique
  // disparaîtrait de l'écran sans qu'aucune erreur ne soit levée.
  const parCat = new Map<string, number>();
  for (const p of points()) parCat.set(p.c, (parCat.get(p.c) ?? 0) + 1);
  for (const c of FACE3_CATS) {
    assert.ok((parCat.get(c) ?? 0) > 100, `la catégorie « ${c} » ne contient que ${parCat.get(c) ?? 0} points`);
  }
});
