import test from "node:test";
import assert from "node:assert/strict";
import { expectedCoverage } from "./dossier-couverture-attendue.ts";

// ── Le cas majoritaire, celui qui a motivé ce module ───────────────────────────────────────

test("aucun diagnostic : le manque est NOMMÉ avant paiement", () => {
  // 75 à 86 % des adresses selon la densité (mesure du 31/07/2026). C'est la première source de
  // déception possible, et la taire jusqu'après l'achat serait la fabriquer.
  const c = expectedCoverage({ dpe: "none", parcel: "found" });
  assert.equal(c.profile, "sans_diagnostic");
  assert.ok(c.manque?.includes("performance énergétique"), c.manque ?? "");
  assert.ok(c.manque?.includes("comportement en été"), "les deux faces tombent ensemble");
});

test("aucun diagnostic : le manque dit que c'est ORDINAIRE", () => {
  // Sans ça, le lecteur croit que SON adresse est mal servie, alors que c'est le cas courant.
  const c = expectedCoverage({ dpe: "none", parcel: "found" });
  assert.ok(c.manque?.includes("la plupart des adresses"), c.manque ?? "");
});

test("ce qui RESTE est dit dans tous les cas : c'est ce qu'on achète", () => {
  for (const m of [
    { dpe: "none", parcel: "found" }, { dpe: "found", parcel: "found" },
    { dpe: "unavailable", parcel: "found" }, { dpe: "none", parcel: "none" },
  ] as const) {
    const c = expectedCoverage(m);
    assert.ok(c.reste.includes("trajectoire climatique"), JSON.stringify(m));
    assert.ok(c.reste.includes("exposée"), JSON.stringify(m));
    assert.ok(c.reste.includes("portée de pas"), JSON.stringify(m));
  }
});

// ── Une panne n'est pas une absence ────────────────────────────────────────────────────────

test("source muette : elle PRIME, et on ne dit jamais « aucun »", () => {
  // Annoncer « aucun diagnostic » pendant une panne ADEME ferait renoncer quelqu'un sur un
  // incident. C'est l'invariant central de la qualification, tenu ici aussi.
  const c = expectedCoverage({ dpe: "unavailable", parcel: "found" });
  assert.equal(c.profile, "a_reverifier");
  assert.ok(c.manque?.includes("n'a pas répondu"), c.manque ?? "");
  assert.equal(/aucun diagnostic/i.test(c.manque ?? ""), false);
});

test("source muette sur la parcelle : même traitement", () => {
  assert.equal(expectedCoverage({ dpe: "found", parcel: "unavailable" }).profile, "a_reverifier");
});

test("une panne PRIME sur une absence avérée", () => {
  // Les deux coexistent : on annonce ce qui se rejoue, pas ce qu'on croit manquer.
  const c = expectedCoverage({ dpe: "none", parcel: "unavailable" });
  assert.equal(c.profile, "a_reverifier");
});

// ── Le cas complet ─────────────────────────────────────────────────────────────────────────

test("tout disponible : aucun manque annoncé, et le diagnostic s'ajoute au reste", () => {
  const c = expectedCoverage({ dpe: "found", parcel: "found" });
  assert.equal(c.profile, "complete");
  assert.equal(c.manque, null);
  assert.ok(c.reste.includes("diagnostic énergétique"), c.reste);
});

// ── Ce que ce module ne dit JAMAIS ─────────────────────────────────────────────────────────

test("AUCUN verdict sur l'enjeu : ça demanderait le fan-out, que la route publique refuse", () => {
  const interdits = /exposé[e]? à un risque|sans risque|rien de particulier|aucun enjeu|adresse sûre|à surveiller/i;
  for (const m of [
    { dpe: "none", parcel: "found" }, { dpe: "found", parcel: "found" },
    { dpe: "unavailable", parcel: "unavailable" },
  ] as const) {
    const c = expectedCoverage(m);
    const tout = `${c.manque ?? ""} ${c.reste}`;
    assert.equal(interdits.test(tout), false, tout);
  }
});

test("AUCUNE valeur : ni classe, ni numéro de parcelle", () => {
  // Sinon la qualification devient le produit gratuit qui rend le payant inutile.
  for (const m of [{ dpe: "found", parcel: "found" }, { dpe: "none", parcel: "found" }] as const) {
    const c = expectedCoverage(m);
    const tout = `${c.manque ?? ""} ${c.reste}`;
    // Une classe énergétique s'écrit isolée (« étiquette D », « classe F », ou « D » entre deux
    // espaces). Chercher une simple majuscule A-G attraperait « C'est », ce qui a fait échouer la
    // première version de ce test sur un texte pourtant irréprochable.
    assert.equal(/(classe|étiquette)\s+[A-G]\b/i.test(tout), false, "aucune classe nommée");
    assert.equal(/\s[A-G]\s/.test(tout), false, "aucune classe isolée");
    assert.equal(/\d{3,}/.test(tout), false, "aucun identifiant ni numéro");
  }
});

test("le manque se lit AVANT ce qui reste : l'ordre inverse minimiserait le manque", () => {
  // Contrainte de forme, vérifiée par l'appelant qui rend `manque` puis `reste`. Ici on vérifie
  // seulement que les deux existent séparément, donc qu'un rendu ne peut pas les fondre.
  const c = expectedCoverage({ dpe: "none", parcel: "found" });
  assert.ok(c.manque && c.reste);
  assert.notEqual(c.manque, c.reste);
});
