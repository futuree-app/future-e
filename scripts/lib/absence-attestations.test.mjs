import test from "node:test";
import assert from "node:assert/strict";
import { buildAbsenceAttestations, radiusFor, tailleVilleFrom } from "./absence-attestations.mjs";

function fixture() {
  const communes = [
    { insee: "1", nom: "A", uu: "u1", population: 600000, lat: 48.85, lon: 2.35 }, // agglo -> rayon 5
    { insee: "2", nom: "B", population: 800, lat: 46.16, lon: -1.15 },              // rural -> rayon 25
  ];
  const networkRecords = { "1": { acces: 80, tram: true, metro: false, arret_km: 0.3 }, "2": null };
  const bpeRecords = { "1": { etudes_acces: { score: 90, count: 12 } }, "2": { etudes_acces: { score: 40, count: 0 } } };
  return { communes, networkRecords, bpeRecords };
}

test("pose le marqueur frère sans déformer reseauLocal, weightedAccess brut, rayon adaptatif", () => {
  const { communes, networkRecords, bpeRecords } = fixture();
  buildAbsenceAttestations({ communes, networkRecords, bpeRecords });
  assert.equal(communes[0].reseauLocalMeasured, true);
  assert.deepEqual(communes[0].reseauLocal, { acces: 80, tram: true, metro: false, arret_km: 0.3 }); // inchangé
  assert.equal(communes[1].reseauLocalMeasured, true);
  assert.equal(communes[1].reseauLocal, null); // sous plancher, inchangé
  assert.deepEqual(communes[0].etudesSup, { measured: true, weightedAccess: 12, radiusKm: 5 });
  assert.deepEqual(communes[1].etudesSup, { measured: true, weightedAccess: 0, radiusKm: 25 });
});

test("REFUSE si un INSEE de l'index manque dans un record", () => {
  const { communes, networkRecords, bpeRecords } = fixture();
  delete networkRecords["2"];
  assert.throws(() => buildAbsenceAttestations({ communes, networkRecords, bpeRecords }), /INSEE/);
});
test("REFUSE un weightedAccess négatif ou non fini", () => {
  const { communes, networkRecords, bpeRecords } = fixture();
  bpeRecords["2"].etudes_acces.count = -1;
  assert.throws(() => buildAbsenceAttestations({ communes, networkRecords, bpeRecords }), /weightedAccess|count/);
});

// PARITÉ RAYON : une fonction en escalier est fixée par ses seuils. On les teste tous, + null/sans-uu.
test("radiusFor reproduit la table Python aux points de rupture", () => {
  assert.equal(radiusFor(500000), 5); assert.equal(radiusFor(499999), 10);
  assert.equal(radiusFor(100000), 10); assert.equal(radiusFor(99999), 15);
  assert.equal(radiusFor(30000), 15);  assert.equal(radiusFor(29999), 25);
  assert.equal(radiusFor(0), 25);      assert.equal(radiusFor(null), 25);
});
test("tailleVilleFrom : uuPop si uu connu, sinon population (réplique Python)", () => {
  const uuPop = new Map([["u1", 600000]]);
  assert.equal(tailleVilleFrom("u1", 5000, uuPop), 600000);
  assert.equal(tailleVilleFrom("uX", 5000, uuPop), 5000); // uu inconnu -> pop
  assert.equal(tailleVilleFrom(null, 5000, uuPop), 5000);
  assert.equal(tailleVilleFrom(null, null, uuPop), null);
});

// ── L'ATTESTATION SUPPOSE QU'ON AIT PU TENTER LA MESURE ─────────────────────────────────────
test("REFUSE d'attester une commune SANS COORDONNÉES", () => {
  // `measured: true` affirme qu'on a cherché et qu'on n'a rien trouvé. Sans coordonnées, la
  // recherche n'a pas pu partir : l'attestation dirait une absence qui n'a jamais été établie.
  // Le producteur jette déjà quand une commune manque d'un record ; il lui manquait ce cas.
  for (const champManquant of ["lat", "lon"]) {
    const { communes, networkRecords, bpeRecords } = fixture();
    delete communes[1][champManquant];
    assert.throws(
      () => buildAbsenceAttestations({ communes, networkRecords, bpeRecords }),
      /coordonn/i,
      `un ${champManquant} absent doit être refusé`,
    );
  }
});

test("REFUSE une coordonnée présente mais NON FINIE", () => {
  // Le cas le plus traître : `lat: null` passe un test d'existence naïf et ne permet aucune mesure.
  for (const valeur of [null, NaN, "46.16"]) {
    const { communes, networkRecords, bpeRecords } = fixture();
    communes[0].lat = valeur;
    assert.throws(
      () => buildAbsenceAttestations({ communes, networkRecords, bpeRecords }),
      /coordonn/i,
      `lat = ${String(valeur)} doit être refusé`,
    );
  }
});
