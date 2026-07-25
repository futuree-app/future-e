import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

// CONTRAT DE DONNÉES — DRIAS (projections climatiques).
//
// Ici, la source n'envoie pas des libellés mais des COLONNES ANONYMES (`column04` … `column33`), qu'un
// mapping traduit en indicateurs métier (drias-json.ts). Le risque n'est donc pas la faute de frappe sur
// une chaîne, comme pour GASPAR ou ONDE : c'est le DÉCALAGE — une colonne qui glisse d'un rang et le
// produit annonce des nuits tropicales là où il y a des jours de pluie, sans que rien ne le signale.
//
// On ne peut pas vérifier un mapping numérique par égalité. On le vérifie par des INVARIANTS PHYSIQUES :
// des relations qui doivent tenir quelle que soit la commune, et qu'un décalage briserait aussitôt.
// Vérifiés le 25/07/2026 sur les 35 006 communes et les trois scénarios : zéro violation.
//
// Ces tests lisent le fichier de production. Ils sont lents (~100 Mo) mais ils éprouvent la donnée
// RÉELLE, ce qu'aucune fixture ne peut faire pour un jeu de cette taille.

type Ligne = Record<string, string | number | null> & { insee_code: string | number; scenario: string };

let cache: Ligne[] | null = null;
function lignes(): Ligne[] {
  cache ??= JSON.parse(readFileSync("public/data_climat.json", "utf8")) as Ligne[];
  return cache;
}
const num = (r: Ligne | undefined, col: string): number | null => {
  const v = r?.[col];
  return v === null || v === undefined || v === "" ? null : Number(v);
};

// Les colonnes que le produit consomme réellement (cf. COLUMN_MAP dans drias-json.ts).
const UTILISEES: Record<string, string> = {
  NORTMm_yr: "column04", NORTMm_seas_JJA: "column05", NORTMm_seas_DJF: "column06",
  NORTXm_seas_JJA: "column07", NORTX35D_yr: "column08", NORTX30D_yr: "column09",
  NORTR_yr: "column10", NORRR_yr: "column11", NORRRq99_yr: "column14", NORRx1d_yr: "column15",
  NORIFM40_yr: "column17", NORSWI04_yr: "column18",
  ATX35D_yr: "column23", ATR_yr: "column25", AIFM40_yr: "column27", ARRx1d_yr: "column33",
};

test("CONTRAT — les trois scénarios existent, pour toutes les communes", () => {
  const parCommune = new Map<string, Set<string>>();
  for (const r of lignes()) {
    const k = String(r.insee_code).padStart(5, "0");
    if (!parCommune.has(k)) parCommune.set(k, new Set());
    parCommune.get(k)!.add(r.scenario);
  }
  const incomplets = [...parCommune].filter(([, s]) => s.size !== 3);
  assert.deepEqual(incomplets.map(([k]) => k).slice(0, 5), [],
    `${incomplets.length} communes n'ont pas les trois horizons`);
});

test("CONTRAT — aucune colonne consommée n'est vide", () => {
  // Une colonne systématiquement vide signalerait un renommage côté source : le produit afficherait
  // alors « donnée indisponible » partout, silencieusement.
  const g20 = lignes().filter((r) => r.scenario === "gwl20");
  for (const [nom, col] of Object.entries(UTILISEES)) {
    const remplies = g20.filter((r) => num(r, col) !== null).length;
    assert.ok(remplies > g20.length * 0.99, `${nom} (${col}) : ${remplies}/${g20.length} valeurs`);
  }
});

test("INVARIANT — les jours au-dessus de 35 °C sont toujours moins nombreux que ceux au-dessus de 30 °C", () => {
  // L'invariant le plus discriminant : il casse dès que column08 et column09 se croisent.
  const viole = lignes().filter((r) => {
    const a = num(r, "column08"), b = num(r, "column09");
    return a !== null && b !== null && a > b;
  });
  assert.equal(viole.length, 0, `${viole.length} lignes où les jours >35 °C dépassent les jours >30 °C`);
});

test("INVARIANT — l'hiver est plus froid que l'été, et le maximum d'été dépasse sa moyenne", () => {
  const viole = lignes().filter((r) => {
    const djf = num(r, "column06"), jja = num(r, "column05"), tx = num(r, "column07");
    return (djf !== null && jja !== null && djf >= jja) || (tx !== null && jja !== null && tx < jja);
  });
  assert.equal(viole.length, 0, `${viole.length} lignes aux saisons incohérentes`);
});

test("INVARIANT — la chaleur croît avec le réchauffement (gwl15 <= gwl20 <= gwl30)", () => {
  // Les trois horizons décrivent le MÊME lieu à des niveaux de réchauffement croissants : une inversion
  // signalerait des scénarios mélangés, et le produit annoncerait une amélioration qui n'existe pas.
  const par = new Map<string, Record<string, Ligne>>();
  for (const r of lignes()) {
    const k = String(r.insee_code).padStart(5, "0");
    par.set(k, { ...(par.get(k) ?? {}), [r.scenario]: r });
  }
  let viole = 0;
  for (const s of par.values()) {
    for (const col of ["column08", "column10"]) {
      const a = num(s.gwl15, col), b = num(s.gwl20, col), c = num(s.gwl30, col);
      if (a !== null && b !== null && c !== null && !(a <= b && b <= c)) viole++;
    }
  }
  assert.equal(viole, 0, `${viole} trajectoires non monotones`);
});

test("INVARIANT — les plages sont physiquement plausibles", () => {
  // Un décalage de colonne produit presque toujours une valeur hors plage : des « jours par an » à 800,
  // une température à 200. Les bornes sont larges à dessein — elles attrapent l'absurde, pas le rare.
  const bornes: Record<string, [number, number]> = {
    column04: [-15, 30], column05: [0, 35], column06: [-20, 20], column07: [0, 45],
    column08: [0, 365], column09: [0, 365], column10: [0, 365], column11: [0, 5000],
    column15: [0, 500], column17: [0, 365], column18: [0, 366],
  };
  for (const r of lignes()) {
    for (const [col, [lo, hi]] of Object.entries(bornes)) {
      const v = num(r, col);
      if (v === null) continue;
      assert.ok(v >= lo && v <= hi, `${col} = ${v} hors [${lo}, ${hi}] (INSEE ${r.insee_code}, ${r.scenario})`);
    }
  }
});

test("CONTRAT — l'anomalie de pluie est RELATIVE, les autres sont ABSOLUES", () => {
  // `ARRx1d_yr` est une fraction (≈ 0 à 0,2), pas un nombre de mm : le code le sait
  // (`anomalyKind: "relative"`) et reconstruit la référence en DIVISANT. Si la source passait un jour
  // en absolu, la trajectoire des pluies deviendrait fausse sans qu'aucun test ne le voie.
  const g20 = lignes().filter((r) => r.scenario === "gwl20");
  const rel = g20.map((r) => num(r, "column33")).filter((v): v is number => v !== null);
  assert.ok(Math.max(...rel) < 2, `anomalie de pluie max = ${Math.max(...rel)} : ce n'est plus une fraction`);
  // Les anomalies de jours, elles, se comptent en jours et dépassent largement 1.
  const abs = g20.map((r) => num(r, "column25")).filter((v): v is number => v !== null);
  assert.ok(Math.max(...abs) > 5, "l'anomalie de nuits tropicales devrait être un nombre de nuits");
});
