import test from "node:test";
import assert from "node:assert/strict";
import {
  deriveLogementCoverage, expositionArgileNotable, type LogementCoverageInputs,
} from "./logement-coverage.ts";

const plan = (nom: string, rang: number) =>
  ({ gasparId: null, plan: nom, hazardModel: null, zoneRegExists: true, updatedAt: null, zones: [], topRegimeRank: rang });

const MUET: LogementCoverageInputs = {
  georisquesAddress: null,
  georisquesParcel: null,
  cavites: null,
  heritage: { items: [], sourceStatus: "unavailable" },
  sinistralite: null,
};
const REPOND: LogementCoverageInputs = {
  georisquesAddress: { regulatoryPlans: [], rga: { label: null } },
  georisquesParcel: null,
  cavites: [],
  heritage: { items: [], sourceStatus: "ok" },
  sinistralite: { secheresse: { kind: "aucun" }, inondation: { kind: "aucun" } },
};

// ── Le cœur : « rien trouvé » n'est pas « pas de réponse » ─────────────────────────────────

test("toutes les sources muettes : unavailable partout, jamais none", () => {
  const c = deriveLogementCoverage(MUET);
  for (const f of ["rga", "pprn", "cavites", "patrimoine", "sinistralite"] as const) {
    assert.equal(c[f].coverage, "unavailable", f);
  }
});

test("toutes les sources répondent sans rien signaler : none partout", () => {
  const c = deriveLogementCoverage(REPOND);
  for (const f of ["rga", "pprn", "cavites", "patrimoine", "sinistralite"] as const) {
    assert.equal(c[f].coverage, "none", f);
  }
});

// ── Adresse et parcelle sont une seule source, lue champ par champ ─────────────────────────

test("la parcelle prime sur l'adresse, champ par champ", () => {
  const c = deriveLogementCoverage({
    ...REPOND,
    georisquesAddress: { regulatoryPlans: [plan("PPRI adresse", 2)], rga: { label: "Aléa faible" } },
    georisquesParcel: { regulatoryPlans: [plan("PPRI parcelle", 1)], rga: { label: "Aléa fort" } },
  });
  assert.equal(c.rga.label, "Aléa fort");
  assert.equal(c.pprn.label, "PPRI parcelle");
});

test("un seul des deux résumés suffit à conclure « rien trouvé »", () => {
  // Pas de parcelle résolue n'est pas une panne de Géorisques : le point a répondu.
  const c = deriveLogementCoverage({ ...REPOND, georisquesParcel: null });
  assert.equal(c.rga.coverage, "none");
  assert.equal(c.pprn.coverage, "none");
});

test("le plan retenu est le plus contraignant, pas le premier de la liste", () => {
  const c = deriveLogementCoverage({
    ...REPOND,
    georisquesAddress: { regulatoryPlans: [plan("Second", 5), plan("Le plus contraignant", 1)], rga: null },
  });
  assert.equal(c.pprn.label, "Le plus contraignant");
  assert.equal(c.pprn.count, 2);
});

// ── Les cavités : une liste vide est une réponse ───────────────────────────────────────────

test("cavités : [] est « rien trouvé », null est « pas de réponse »", () => {
  assert.equal(deriveLogementCoverage({ ...REPOND, cavites: [] }).cavites.coverage, "none");
  assert.equal(deriveLogementCoverage({ ...REPOND, cavites: null }).cavites.coverage, "unavailable");
  assert.equal(deriveLogementCoverage({ ...REPOND, cavites: [{}, {}] }).cavites.count, 2);
});

// ── La sinistralité : deux périls, quatre états ────────────────────────────────────────────

test("sinistralité : les deux périls indisponibles valent une panne", () => {
  const c = deriveLogementCoverage({
    ...REPOND,
    sinistralite: { secheresse: { kind: "indispo" }, inondation: { kind: "indispo" } },
  });
  assert.equal(c.sinistralite.coverage, "unavailable");
});

test("sinistralité : une faible représentativité reste une indemnisation lisible", () => {
  const c = deriveLogementCoverage({
    ...REPOND,
    sinistralite: { secheresse: { kind: "faible_repr", representativite: "faible" }, inondation: { kind: "aucun" } },
  });
  assert.equal(c.sinistralite.coverage, "present");
  assert.equal(c.sinistralite.active, true);
});

test("sinistralité : un péril indisponible et l'autre sans sinistre n'est pas une panne", () => {
  const c = deriveLogementCoverage({
    ...REPOND,
    sinistralite: { secheresse: { kind: "indispo" }, inondation: { kind: "aucun" } },
  });
  assert.equal(c.sinistralite.coverage, "none");
});

// ── L'argile : un seul test d'égalité pour tout le produit ─────────────────────────────────

test("l'exposition argile notable gate sur moyen ou fort", () => {
  assert.equal(expositionArgileNotable("Aléa moyen"), true);
  assert.equal(expositionArgileNotable("Aléa fort"), true);
  assert.equal(expositionArgileNotable("Exposition élevée"), true);
  assert.equal(expositionArgileNotable("Aléa faible"), false);
  assert.equal(expositionArgileNotable(null), false);
  assert.equal(expositionArgileNotable(""), false);
});
