import test from "node:test";
import assert from "node:assert/strict";
import { buildPermisLecture, dateFr } from "./autour-permis.ts";
import type { Face3Snapshot, PermisSnapshot } from "../logement-autour-types.ts";
import type { PermisRetenu } from "../sitadel-selection.ts";

function snap(permis?: Partial<PermisSnapshot> & { permis: PermisRetenu[] }): Face3Snapshot {
  return {
    center: { lng: 0, lat: 0 },
    bpe: { categories: [] },
    osm: { potentiallyNoisyInfrastructure: [], nearestMappedGreenSpace: null, bboxRadiusMeters: 1500 },
    permis: permis
      ? {
          rayonMeters: 50,
          ancienneteMaxAns: 3,
          anneeReference: 2026,
          consulteLe: "2026-08-01T09:30:00.000Z",
          ...permis,
        }
      : undefined,
    sourceStatus: { bpe: "complete", osmInfrastructure: "complete", osmGreenSpaces: "complete" },
    sources: { bpeVersion: "BPE24", osmFetchedAt: null, osmQueryVersion: "v1" },
    sourcesVersion: "v1",
    computedAt: "2026-08-01T00:00:00.000Z",
  } as Face3Snapshot;
}

// ── Non consulté n'est pas « aucun » ───────────────────────────────────────────────────────

test("registre non consulté : AUCUN bloc", () => {
  // Snapshot d'avant le 01/08/2026, ou API muette pendant l'analyse. Afficher « aucune
  // autorisation » sur la foi d'une panne serait affirmer un fait jamais établi.
  assert.equal(buildPermisLecture(snap()), null);
});

test("consulté et rien trouvé : le bloc EXISTE et dit l'absence", () => {
  const r = buildPermisLecture(snap({ permis: [] }))!;
  assert.ok(r);
  assert.deepEqual(r.lignes, []);
  assert.ok(r.lead.startsWith("Aucune autorisation"), r.lead);
  assert.ok(r.lead.includes("2023"), "la fenêtre est datée : depuis 2023");
});

// ── L'objet du registre, toujours dit ──────────────────────────────────────────────────────

test("présence comme absence, la phrase porte « créant des logements »", () => {
  // Le jeu SDES ne recense que les autorisations créant des logements. « Aucune autorisation »
  // tout court promettrait un quartier immobile : un entrepôt ou un commerce n'y figure pas.
  for (const p of [[], [{ annee: 2025, etat: "acheve" as const }]]) {
    const r = buildPermisLecture(snap({ permis: p }))!;
    assert.ok(r.lead.includes("créant des logements"), r.lead);
  }
});

// ── Le périmètre gelé gouverne le texte ────────────────────────────────────────────────────

test("le rayon affiché est celui du snapshot, pas celui de la constante du jour", () => {
  const r = buildPermisLecture(snap({ permis: [], rayonMeters: 80, ancienneteMaxAns: 5 }))!;
  assert.ok(r.lead.includes("80 m"), r.lead);
  assert.ok(r.lead.includes("2021"), "la fenêtre suit l'ancienneté gelée");
  assert.ok(r.limite.includes("80 m") && r.limite.includes("5 ans"), r.limite);
  assert.equal(r.limite.includes("50 m"), false);
});

// ── Le compte et l'accord ──────────────────────────────────────────────────────────────────

test("une seule autorisation s'écrit au singulier", () => {
  const r = buildPermisLecture(snap({ permis: [{ annee: 2025, etat: "chantier_ouvert" }] }))!;
  assert.ok(r.lead.startsWith("Une autorisation d'urbanisme créant des logements porte sur"), r.lead);
});

test("plusieurs autorisations : le nombre en toutes lettres et l'accord au pluriel", () => {
  const r = buildPermisLecture(snap({
    permis: [
      { annee: 2025, etat: "chantier_ouvert" },
      { annee: 2024, etat: "acheve" },
      { annee: 2024, etat: "acheve" },
    ],
  }))!;
  assert.ok(r.lead.startsWith("Trois autorisations"), r.lead);
  assert.ok(r.lead.includes("portent sur"), r.lead);
});

// ── Le regroupement et l'ordre ─────────────────────────────────────────────────────────────

test("deux dossiers de même année et même état tiennent sur une ligne, avec leur nombre", () => {
  const r = buildPermisLecture(snap({
    permis: [{ annee: 2024, etat: "acheve" }, { annee: 2024, etat: "acheve" }],
  }))!;
  assert.equal(r.lignes.length, 1);
  assert.equal(r.lignes[0].label, "2 dossiers · travaux déclarés achevés");
  assert.equal(r.lignes[0].nombre, 2);
});

test("l'année récente d'abord, et dans l'année, ce qui reste à venir avant ce qui est fait", () => {
  const r = buildPermisLecture(snap({
    permis: [
      { annee: 2024, etat: "chantier_ouvert" },
      { annee: 2025, etat: "acheve" },
      { annee: 2025, etat: "autorise_non_commence" },
      { annee: 2025, etat: "chantier_ouvert" },
    ],
  }))!;
  assert.deepEqual(r.lignes.map((l) => `${l.annee} ${l.label}`), [
    "2025 Autorisé, sans ouverture de chantier déclarée dans le registre consulté",
    "2025 Chantier déclaré ouvert",
    "2025 Travaux déclarés achevés",
    "2024 Chantier déclaré ouvert",
  ]);
});

// ── La date de consultation ────────────────────────────────────────────────────────────────

test("la date de consultation est dite, en français", () => {
  const r = buildPermisLecture(snap({ permis: [], consulteLe: "2026-08-01T09:30:00.000Z" }))!;
  assert.equal(r.consultation, "Registre national des autorisations d'urbanisme, consulté le 1er août 2026");
});

test("une date illisible ne fabrique pas de fausse date", () => {
  const r = buildPermisLecture(snap({ permis: [], consulteLe: "" }))!;
  assert.equal(r.consultation, null);
  assert.equal(dateFr("2026-12-24"), "24 décembre 2026");
});

// ── Le vocabulaire ─────────────────────────────────────────────────────────────────────────

test("aucune projection : ni « sera », ni « futur », ni une date de livraison", () => {
  const r = buildPermisLecture(snap({
    permis: [{ annee: 2025, etat: "autorise_non_commence" }, { annee: 2026, etat: "chantier_ouvert" }],
  }))!;
  const tout = [r.lead, r.limite, ...r.lignes.map((l) => l.label)].join(" ");
  assert.equal(/sera |seront |futur|à venir|livraison|d'ici \d{4}|en construction/i.test(tout), false, tout);
});
