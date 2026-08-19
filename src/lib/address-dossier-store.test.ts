import test from "node:test";
import assert from "node:assert/strict";
import {
  pickSoleDossier,
  needsRecompute,
  SOURCES_VERSION,
  buildDpeSelectionFields,
  type AddressDossierRow,
} from "./address-dossier-store.ts";
import type { Face3Snapshot } from "./logement-autour-types.ts";
import type { DpeRecord } from "./dpe-attribution.ts";

function row(id: string, updatedAt: string): AddressDossierRow {
  return {
    id,
    user_id: "u1",
    ban_id: "b1",
    insee: "44109",
    address_label: "1 rue X",
    city: "Nantes",
    postcode: "44000",
    latitude: 47.2,
    longitude: -1.5,
    parcel_code: null,
    posture: "residence",
    snapshot: null,
    dpe_selection_status: "pending",
    selected_dpe_id: null,
    selected_dpe_snapshot: null,
    selected_dpe_at: null,
    created_at: "2026-07-18T08:00:00Z",
    updated_at: updatedAt,
    synthesis_text: null,
    synthesis_fact_hash: null,
    synthesis_generated_at: null,
    stripe_payment_intent_id: null,
    amount_paid_cents: null,
    purchased_at: null,
    access_revoked_at: null,
  };
}

test("aucun dossier : pas de repli", () => {
  assert.equal(pickSoleDossier([]), null);
});

test("un seul dossier : il est le repli", () => {
  const only = row("d1", "2026-07-29T10:00:00Z");
  assert.equal(pickSoleDossier([only])?.id, "d1");
});

test("PLUSIEURS dossiers : AUCUN repli, la question est posée au lecteur", () => {
  // updated_at bouge à chaque écriture technique (synthèse, posture, rehydratation) : le dossier
  // le plus récemment MODIFIÉ n'est pas celui qu'on voulait rouvrir. Ouvrir le 2e étage quand le
  // lecteur visait le 4e est exactement le défaut que l'identité en uuid corrige.
  const rows = [row("d1", "2026-07-29T12:00:00Z"), row("d2", "2026-07-29T09:00:00Z")];
  assert.equal(pickSoleDossier(rows), null);
});

// ── Repris de logement-store.test.ts (le fichier a été renommé, pas ces règles) ──

const center = { lat: 48.85, lon: 2.35 };
const okSnap = {
  center,
  bpe: { categories: [] },
  osm: { potentiallyNoisyInfrastructure: [], nearestMappedGreenSpace: null, bboxRadiusMeters: 1500 },
  sourceStatus: { bpe: "complete", osmInfrastructure: "complete", osmGreenSpaces: "complete" },
  sources: { bpeVersion: "x", osmFetchedAt: null, osmQueryVersion: "y" },
  sourcesVersion: SOURCES_VERSION,
  computedAt: "2026-07-03T00:00:00.000Z",
} satisfies Face3Snapshot;

test("pas de snapshot -> recompute", () => {
  assert.equal(needsRecompute(null, center, SOURCES_VERSION), true);
});
test("snapshot d'une autre position -> recompute", () => {
  assert.equal(needsRecompute({ snapshot: okSnap }, { lat: 43.6, lon: 1.44 }, SOURCES_VERSION), true);
});
test("version antérieure -> recompute", () => {
  assert.equal(needsRecompute({ snapshot: okSnap }, center, "v999"), true);
});
test("même position + même version -> pas de recompute", () => {
  assert.equal(needsRecompute({ snapshot: okSnap }, center, SOURCES_VERSION), false);
});

// ── Le snapshot INCOMPLET, constaté en production le 29/07/2026 ─────────────
// Overpass n'avait pas répondu sous le timeout de 3,5 s, donc le snapshot a été écrit avec
// osmInfrastructure et osmGreenSpaces à `pending`. La tuile est arrivée en cache UNE SECONDE plus
// tard, complète. Mais `needsRecompute` ne regardait que la version et la position : le snapshot
// incomplet passait pour valide, la route le renvoyait figé, et l'écran répétait « environnement en
// cours de récupération » indéfiniment, alors que la donnée attendue était disponible à côté.
const pendingSnap = {
  ...okSnap,
  sourceStatus: { bpe: "complete", osmInfrastructure: "pending", osmGreenSpaces: "pending" },
} satisfies Face3Snapshot;

test("un snapshot dont OSM est PENDING doit être recalculé, même version et même position", () => {
  assert.equal(needsRecompute({ snapshot: pendingSnap }, center, SOURCES_VERSION), true);
});

test("un seul des deux volets OSM en attente suffit à recalculer", () => {
  const half = {
    ...okSnap,
    sourceStatus: { bpe: "complete", osmInfrastructure: "complete", osmGreenSpaces: "pending" },
  } satisfies Face3Snapshot;
  assert.equal(needsRecompute({ snapshot: half }, center, SOURCES_VERSION), true);
});

test("un OSM en ÉCHEC ne relance pas : `failed` est un résultat, `pending` est une absence", () => {
  // Distinction volontaire. `pending` dit « pas encore », donc on redemande. `failed` dit
  // « Overpass a répondu une erreur » : le relancer à chaque ouverture martèlerait une source en
  // panne, alors que l'écran sait déjà dire honnêtement que la donnée est indisponible.
  const failed = {
    ...okSnap,
    sourceStatus: { bpe: "complete", osmInfrastructure: "failed", osmGreenSpaces: "failed" },
  } satisfies Face3Snapshot;
  assert.equal(needsRecompute({ snapshot: failed }, center, SOURCES_VERSION), false);
});

const dpe = { id_dpe: "d1", etiquette_dpe: "D" } as unknown as DpeRecord;

test("buildDpeSelectionFields: user_confirmed fige id + snapshot + date", () => {
  const out = buildDpeSelectionFields("user_confirmed", dpe, "2026-07-03T10:00:00.000Z");
  assert.equal(out.dpe_selection_status, "user_confirmed");
  assert.equal(out.selected_dpe_id, "d1");
  assert.equal(out.selected_dpe_at, "2026-07-03T10:00:00.000Z");
  assert.ok(out.selected_dpe_snapshot);
});

test("buildDpeSelectionFields: not_in_list -> aucun DPE figé", () => {
  const out = buildDpeSelectionFields("not_in_list", null, "2026-07-03T10:00:00.000Z");
  assert.equal(out.selected_dpe_id, null);
  assert.equal(out.selected_dpe_snapshot, null);
  assert.equal(out.selected_dpe_at, null);
});

// ── LA DATE DU CHANGEMENT SURVIT AU RETRAIT ──────────────────────────────────────────────────
// `selected_dpe_at` date le diagnostic FIGÉ : il s'efface avec lui, et c'est juste. Mais c'est
// cette colonne que lisait la péremption des artefacts, si bien que retirer un mauvais diagnostic
// remettait la date à null et laissait servir une conclusion écrite AVEC lui. Un retrait est un
// changement matériel de la matière lue ; il se date comme les autres.
test("buildDpeSelectionFields: tout changement de sélection est daté, retrait compris", () => {
  const t = "2026-07-03T10:00:00.000Z";
  assert.equal(buildDpeSelectionFields("user_confirmed", dpe, t).dpe_selection_at, t);
  assert.equal(buildDpeSelectionFields("auto_confirmed", dpe, t).dpe_selection_at, t);
  assert.equal(buildDpeSelectionFields("not_in_list", null, t).dpe_selection_at, t);
  assert.equal(buildDpeSelectionFields("not_found", null, t).dpe_selection_at, t);
  // Le retour à l'état non attribué EST le cas qui manquait : plus aucun diagnostic figé, et
  // pourtant l'artefact généré avec l'ancien doit se périmer.
  const retrait = buildDpeSelectionFields("pending", null, t);
  assert.equal(retrait.selected_dpe_snapshot, null);
  assert.equal(retrait.selected_dpe_at, null);
  assert.equal(retrait.dpe_selection_at, t);
});
