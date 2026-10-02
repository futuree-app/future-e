// FUT-33, phase 1.5 : sécurisation de la vérité littorale (donnée seule, rien n'est branché au produit).
// Ces tests lisent les fixtures produites par scripts/mer (audit des fermetures, divergences, cas de référence,
// mesures du prototype Node) et le prototype lui-même pour sa projection.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
// @ts-expect-error module JavaScript du prototype, sans déclaration de types
import { versLambert93, construireIndex, distanceAuRivage } from "../../scripts/mer/adresse-node.mjs";

const lire = (nom: string) => JSON.parse(readFileSync(new URL(`../../scripts/mer/fixtures/${nom}`, import.meta.url), "utf8"));
type Touchee = { nom: string; pop: number | null; avant_km: number; apres_km: number };
type Audit = { classe: "A" | "B" | "C"; lon: number; lat: number; cote_amont_plausible: { cote_km: number; delta_max_km: number; touchees: Touchee[] } | null };
const audit = lire("audit-ltm.json") as Audit[];
const cas = lire("cas-reference.json").cas as Record<string, { nom: string; centre_km: number; territoire_km: number | null; loi: string[] | null; loi_effective: string[] | null; loi_source_commune: string | null }>;
const divergences = lire("divergences.json") as { insee: string; nom: string; contact_m: number }[];
const rapport = readFileSync(new URL("../../docs/audits/2026-10-02-fut33-phase15-securisation.md", import.meta.url), "utf8");

test("54 fermetures incertaines ou non accrochées, toutes auditées et classées", () => {
  assert.equal(audit.length, 54);
  for (const a of audit) assert.ok(["A", "B", "C"].includes(a.classe));
});

test("aucune fermeture incertaine ne peut rendre côtière une ville intérieure : le pire cas est une côte réelle", () => {
  // Le seul écart au-delà de 3 km (baie des Veys) concerne des communes de bord de mer (plages du Débarquement) :
  // le « côté amont » simulé y est la côte elle-même, déjà correctement conservée.
  const fortes = audit.filter((a) => a.classe === "C");
  assert.equal(fortes.length, 1);
  assert.ok(Math.abs(fortes[0]!.lon - -1.148) < 0.01 && Math.abs(fortes[0]!.lat - 49.363) < 0.01);
  assert.ok(fortes[0]!.cote_amont_plausible!.touchees.some((t) => t.nom === "Vierville-sur-Mer"));
  // Aucune commune de plus de 20 000 habitants ne voit sa distance bouger de plus de 2,5 km, quel que soit le côté.
  for (const a of audit) for (const t of a.cote_amont_plausible?.touchees ?? []) {
    if ((t.pop ?? 0) >= 20000) assert.ok(t.apres_km - t.avant_km <= 2.5, `${t.nom}`);
  }
});

test("les divergences géométrie / loi Littoral sont listées nommément, et le rapport les nomme toutes", () => {
  assert.equal(divergences.length, 20);
  for (const d of divergences) assert.ok(rapport.includes(d.nom.replace(/ Arrondissement$/, "")) || d.insee.startsWith("132"), d.nom);
  assert.equal(divergences.filter((d) => d.insee.startsWith("132")).length, 7);
});

test("Marseille : les arrondissements héritent du classement communal, avec son origine ; la distance reste locale", () => {
  for (const i of ["13207", "13216"]) {
    const x = cas[i]!;
    assert.equal(x.loi, null);
    assert.deepEqual(x.loi_effective, ["Mer"]);
    assert.equal(x.loi_source_commune, "13055");
  }
  assert.notEqual(cas["13207"]!.centre_km, cas["13216"]!.centre_km);
  assert.equal(cas["17094"]!.loi_source_commune, null, "une commune ordinaire n'hérite de rien");
});

test("Lac n'est jamais Mer ; Estuaire n'est jamais automatiquement Mer", () => {
  assert.deepEqual(cas["74010"]!.loi_effective, ["Lac"]);
  assert.deepEqual(cas["17299"]!.loi_effective, ["Estuaire"]);
});

test("D2 : le rivage canonique est la LimTM coupée aux LTM, sans morphologie de largeur de passe", () => {
  const src = readFileSync(new URL("../../scripts/mer/build_mer.py", import.meta.url), "utf8");
  assert.doesNotMatch(src, /lagunes_b|buffer\([^)]*-|ouverture morpholog/i);
  assert.equal(cas["56260"]!.territoire_km, 0, "Vannes touche le golfe, qui est du rivage marin");
  assert.equal(cas["34301"]!.territoire_km, 0);
  assert.equal(cas["33009"]!.territoire_km, 0);
});

test("restes orphelins : Hastingues et Quimper ne sont plus collés à un bout d'estuaire", () => {
  // Données de la phase 1.5 : la règle E retire les tronçons non codés isolés dans un estuaire codé.
  assert.ok(!divergences.some((d) => ["Hastingues", "Quimper", "Quimperlé", "Langoat"].includes(d.nom)));
});

test("prototype Node : projection Lambert 93 exacte au point de définition, latence et erreur bornées", () => {
  const [x, y] = versLambert93(3, 46.5);
  assert.ok(Math.abs(x - 700000) < 0.01 && Math.abs(y - 6600000) < 0.01);
  const mesures = lire("adresse-node.json") as { niveaux: { tolerance_m: number; latence_ms: { p95: number; max: number }; erreur_m: { max: number } }[] };
  for (const n of mesures.niveaux) {
    assert.ok(n.latence_ms.p95 < 5, `p95 ${n.latence_ms.p95} ms`);
    assert.ok(n.erreur_m.max <= n.tolerance_m + 0.5, `erreur ${n.erreur_m.max} m pour ${n.tolerance_m} m`);
  }
  // Index et recherche sur un rivage minimal : un segment est-ouest à y = 6 600 000.
  const [ax, ay] = versLambert93(2.9, 46.5);
  const [bx] = versLambert93(3.1, 46.5);
  const index = construireIndex(new Float32Array([ax, ay, bx, ay]));
  const d = distanceAuRivage(index, 3, 46.59); // ~10 km au nord
  assert.ok(d > 9000 && d < 11000, `${d}`);
});
