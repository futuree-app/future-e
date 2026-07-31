import test from "node:test";
import assert from "node:assert/strict";
import { buildAutourConclusion, distanceFr, SEUIL_A_PIED_M } from "./autour-conclusion.ts";
import type { Face3Cat, Face3Snapshot } from "../logement-autour-types.ts";

function cat(c: Face3Cat, m: number | null, typeLabel: string | null = null, cap = 3000) {
  return { category: c, nearest: m == null ? null : { distanceMeters: m, typeLabel }, searchCapMeters: cap };
}

function snap(categories: ReturnType<typeof cat>[], bpe: "complete" | "failed" = "complete"): Face3Snapshot {
  return {
    center: { lng: 0, lat: 0 },
    bpe: { categories },
    osm: { potentiallyNoisyInfrastructure: [], nearestMappedGreenSpace: null, bboxRadiusMeters: 1000 },
    sourceStatus: { bpe, osmInfrastructure: "complete", osmGreenSpaces: "complete" },
    sources: { bpeVersion: "BPE24", osmFetchedAt: null, osmQueryVersion: "v1" },
    sourcesVersion: "v1",
    computedAt: "2026-07-31T00:00:00.000Z",
  } as Face3Snapshot;
}

// Le cas réel relevé au Capitole le 31/07/2026.
const CAPITOLE = [
  cat("sante", 68, "Pharmacie"),
  cat("alimentation", 120, "Boulangerie"),
  cat("education", 287, "École maternelle"),
  cat("transports", 1200, "Gare"),
  cat("services", 28, "Banque"),
];

// ── Ne rien conclure quand on n'a pas pu regarder ───────────────────────────────────────────

test("source BPE en échec : AUCUNE conclusion", () => {
  // « Rien à proximité » et « on n'a pas pu regarder » sont deux affirmations différentes, et la
  // seconde ne se déduit jamais de la première. Même règle que la couverture du Logement.
  assert.equal(buildAutourConclusion(snap(CAPITOLE, "failed")), null);
});

test("aucune catégorie examinée : aucune conclusion", () => {
  assert.equal(buildAutourConclusion(snap([])), null);
});

// ── Le cas ordinaire ───────────────────────────────────────────────────────────────────────

test("le lead compte ce qui est à portée de pas et NOMME la convention", () => {
  const c = buildAutourConclusion(snap(CAPITOLE))!;
  assert.ok(c.lead.includes("Sur les 5 repères"), c.lead);
  assert.ok(c.lead.includes("4 sont"), c.lead);
  assert.ok(c.lead.includes(`${SEUIL_A_PIED_M} m`), "le seuil est dit, jamais caché");
  assert.ok(c.lead.includes("vol d'oiseau"), "la nature de la mesure est dite");
});

test("les repères proches sont nommés du plus proche au plus éloigné", () => {
  const c = buildAutourConclusion(snap(CAPITOLE))!;
  const i = (s: string) => c.lead.indexOf(s);
  assert.ok(i("une banque") < i("une pharmacie"), "28 m avant 68 m");
  assert.ok(i("une pharmacie") < i("une boulangerie"), "68 m avant 120 m");
  assert.ok(i("une boulangerie") < i("une école maternelle"), "120 m avant 287 m");
});

test("le plus ÉLOIGNÉ est nommé : c'est lui qui décidera d'un déplacement", () => {
  const c = buildAutourConclusion(snap(CAPITOLE))!;
  assert.ok(c.lead.includes("Le plus éloigné est une gare, à 1,2 km"), c.lead);
});

test("quand TOUT est à portée de pas, aucune phrase sur un éloignement", () => {
  const c = buildAutourConclusion(snap([
    cat("sante", 68, "Pharmacie"), cat("alimentation", 120, "Boulangerie"),
    cat("services", 28, "Banque"),
  ]))!;
  assert.equal(c.lead.includes("Le plus éloigné"), false, c.lead);
  assert.ok(c.lead.includes("Sur les 3 repères du quotidien examinés, 3 sont"), c.lead);
});

// ── Le cas rural ───────────────────────────────────────────────────────────────────────────

test("rien à 500 m : le plus proche fixe l'échelle, pour ne pas laisser imaginer le désert", () => {
  const c = buildAutourConclusion(snap([
    cat("sante", 2400, "Pharmacie"), cat("alimentation", 850, "Épicerie"),
    cat("education", null), cat("transports", null), cat("services", 3000, "Bureau de poste"),
  ]))!;
  assert.ok(c.lead.startsWith("Aucun des 5 repères"), c.lead);
  assert.ok(c.lead.includes("Le plus proche est une épicerie, à 850 m"), c.lead);
});

test("les absences sont dites séparément, avec le périmètre cherché", () => {
  const c = buildAutourConclusion(snap([
    cat("sante", 300, "Pharmacie"),
    cat("education", null, null, 3000),
    cat("transports", null, null, 3000),
  ]))!;
  assert.equal(c.absences.length, 2);
  assert.ok(c.absences[0].includes("Aucune école"), c.absences[0]);
  assert.ok(c.absences[0].includes("3,0 km analysés"), c.absences[0]);
});

test("aucun repère nulle part : le lead porte sur l'absence, sans inventer un plus proche", () => {
  const c = buildAutourConclusion(snap([
    cat("sante", null), cat("alimentation", null), cat("education", null),
  ]))!;
  assert.ok(c.lead.includes("Aucun des 3 repères"), c.lead);
  assert.equal(c.lead.includes("Le plus proche"), false, "il n'y en a pas");
  assert.equal(c.absences.length, 3);
});

// ── Ce que la conclusion ne fait jamais ────────────────────────────────────────────────────

test("AUCUN jugement, AUCUNE note : l'ADR-0001 interdit la note composite", () => {
  // Un adjectif de qualité serait une note déguisée. On décrit une configuration, le lecteur juge.
  const interdits = /bien desservi|mal desservi|excellent|médiocre|idéal|attractif|de qualité|score|note/i;
  for (const jeu of [
    CAPITOLE,
    [cat("sante", 2400, "Pharmacie"), cat("education", null)],
    [cat("sante", null), cat("alimentation", null)],
  ]) {
    const c = buildAutourConclusion(snap(jeu))!;
    const tout = [c.lead, ...c.absences, c.limite].join(" ");
    assert.equal(interdits.test(tout), false, tout);
  }
});

test("la limite est TOUJOURS dite : présence n'est pas qualité", () => {
  const c = buildAutourConclusion(snap(CAPITOLE))!;
  assert.ok(c.limite.includes("jamais la qualité"), c.limite);
  assert.ok(c.limite.includes("vol d'oiseau"), c.limite);
});

// ── Formatage ──────────────────────────────────────────────────────────────────────────────

test("les distances se lisent : mètres sous le kilomètre, virgule décimale au-delà", () => {
  assert.equal(distanceFr(68), "68 m");
  assert.equal(distanceFr(999), "999 m");
  assert.equal(distanceFr(1000), "1,0 km");
  assert.equal(distanceFr(1200), "1,2 km");
  assert.equal(distanceFr(3000), "3,0 km");
  assert.equal(distanceFr(1200).includes("."), false, "jamais de point décimal");
});

test("un type inconnu de la nomenclature ne casse pas la phrase", () => {
  const c = buildAutourConclusion(snap([cat("services", 100, "Déchèterie intercommunale")]))!;
  assert.ok(c.lead.includes("un déchèterie intercommunale") || c.lead.includes("une déchèterie intercommunale"), c.lead);
});

test("sans type précis, la famille prend le relais", () => {
  const c = buildAutourConclusion(snap([cat("education", 200, null)]))!;
  assert.ok(c.lead.includes("une école"), c.lead);
});
