import test from "node:test";
import assert from "node:assert/strict";
import {
  meaningfulFloor, candidateIdentifier, isUnidentifiable, matchesQuery, sortCandidates,
} from "./dpe-candidate-match.ts";
import type { DpeRecord } from "./dpe-attribution.ts";

// Les fixtures reprennent des valeurs RÉELLES, relevées le 31/07/2026 au 1 rue Saint-Dominique
// à La Rochelle et au 1 Place du Capitole à Toulouse. Le texte libre du complément d'adresse est
// exactement ce que la base contient, virgules et abréviations comprises.
function dpe(over: Partial<DpeRecord> = {}): DpeRecord {
  return {
    id_dpe: "2117E0354638P", date_dpe: "2023-07-03", id_ban: null, adresse: null,
    etiquette_dpe: "C", etiquette_ges: null, conso_ep_m2: null, emission_ges_m2: null,
    surface_m2: 27.3, annee_construction: null, type_batiment: "appartement",
    etage: "0", complement: "C04",
    confort_ete: null, traversant: null, protection_solaire: null, ventilation: null,
    inertie: null, isolation_toiture: null, brasseur_air: null,
    isolation_murs: null, isolation_menuiseries: null, methode_dpe: null,
    ...over,
  } as DpeRecord;
}

// ── L'étage, ce faux ami ───────────────────────────────────────────────────────────────────

test("l'étage « 0 » est REJETÉ : c'est un défaut de saisie, pas un rez-de-chaussée", () => {
  // Mesuré : « 0 » sur 96 % des lignes du Capitole. L'afficher faisait passer une absence de
  // renseignement pour une information, sur presque toutes les lignes.
  assert.equal(meaningfulFloor("0"), null);
  assert.equal(meaningfulFloor(""), null);
  assert.equal(meaningfulFloor("   "), null);
  assert.equal(meaningfulFloor(null), null);
  assert.equal(meaningfulFloor(undefined), null);
});

test("un étage réel passe", () => {
  assert.equal(meaningfulFloor("2"), "2");
  assert.equal(meaningfulFloor(" 4 "), "4");
});

// L'API ADEME rend `numero_etage_appartement` en NOMBRE, alors que le type le déclarait en texte,
// et des snapshots de DPE figés en base portent déjà cette valeur numérique. Le sélecteur tombait
// dessus en `(raw ?? "").trim is not a function`, et le module Logement entier devenait illisible
// pour l'adresse concernée. Le zéro numérique se rejette comme le zéro textuel : c'est le même
// défaut de saisie, il ne devient pas un rez-de-chaussée en changeant de type.
test("L'ÉTAGE PEUT ARRIVER EN NOMBRE, et ne fait pas tomber la page", () => {
  assert.equal(meaningfulFloor(4), "4");
  assert.equal(meaningfulFloor(0), null);
});

test("un complément d'adresse numérique ne fait pas tomber la page non plus", () => {
  // Même API, même champ de texte libre, aucune garantie de type : « 12 » saisi seul revient en
  // nombre. Non observé, mais du même défaut que l'étage, et le sélecteur le lit pareil.
  assert.equal(candidateIdentifier(dpe({ complement: 12 as unknown as string })), "12");
});

// ── L'identifiant de logement ──────────────────────────────────────────────────────────────

test("l'identifiant est le complément d'adresse, espaces normalisés", () => {
  assert.equal(candidateIdentifier(dpe({ complement: "  Esc. A ;  Etage 2 ; Porte C02 " })),
    "Esc. A ; Etage 2 ; Porte C02");
});

test("un complément vide ne fabrique pas un identifiant", () => {
  assert.equal(candidateIdentifier(dpe({ complement: null })), null);
  assert.equal(candidateIdentifier(dpe({ complement: "   " })), null);
});

test("sans identifiant NI étage, la ligne ne pourra jamais être reconnue", () => {
  // 8 lignes sur 19 rue Saint-Dominique. Le dire évite au lecteur de chercher ce qui n'y est pas.
  assert.equal(isUnidentifiable(dpe({ complement: null, etage: "0" })), true);
  assert.equal(isUnidentifiable(dpe({ complement: null, etage: "2" })), false);
  assert.equal(isUnidentifiable(dpe({ complement: "A13", etage: "0" })), false);
});

// ── La recherche ───────────────────────────────────────────────────────────────────────────

test("une requête vide ne filtre rien", () => {
  assert.equal(matchesQuery(dpe(), ""), true);
  assert.equal(matchesQuery(dpe(), "   "), true);
});

test("l'identifiant de porte se trouve, quelle que soit la casse", () => {
  const c = dpe({ complement: "Escalier D -1er étage Appartement B09" });
  assert.equal(matchesQuery(c, "B09"), true);
  assert.equal(matchesQuery(c, "b09"), true);
  assert.equal(matchesQuery(c, "escalier d"), true);
});

test("les accents ne font pas échouer la recherche", () => {
  // « 2ème étage » se cherche en « 2eme etage » : personne ne tape les accents dans un filtre.
  const c = dpe({ complement: "Bat. B et E ; Étage RDC" });
  assert.equal(matchesQuery(c, "etage rdc"), true);
  assert.equal(matchesQuery(c, "Étage"), true);
});

test("la surface se cherche, avec point ou avec virgule", () => {
  const c = dpe({ surface_m2: 43.2 });
  assert.equal(matchesQuery(c, "43"), true);
  assert.equal(matchesQuery(c, "43.2"), true);
  assert.equal(matchesQuery(c, "43,2"), true);
});

test("LE NUMÉRO À TREIZE CARACTÈRES réduit la liste à sa ligne", () => {
  // C'est le geste que la checklist demande de faire auprès du vendeur : il faut qu'il serve.
  const mien = dpe({ id_dpe: "2117E0354638P" });
  const autre = dpe({ id_dpe: "2317E0999999X", complement: "A13" });
  assert.equal(matchesQuery(mien, "2117E0354638P"), true);
  assert.equal(matchesQuery(mien, "2117e0354638p"), true, "insensible à la casse");
  assert.equal(matchesQuery(autre, "2117E0354638P"), false);
});

test("l'année du diagnostic se cherche", () => {
  assert.equal(matchesQuery(dpe({ date_dpe: "2026-02-04" }), "2026"), true);
  assert.equal(matchesQuery(dpe({ date_dpe: "2021-09-20" }), "2026"), false);
});

test("une recherche sans correspondance ne rend rien, plutôt que tout", () => {
  // Le piège classique d'un filtre trop permissif : « B04 » qui rendrait les 24 lignes ferait
  // croire au lecteur qu'il a trouvé, alors qu'il n'a rien trouvé.
  const c = dpe({ complement: "C04", surface_m2: 27.3, id_dpe: "2117E0354638P" });
  assert.equal(matchesQuery(c, "B04"), false);
});

test("l'étage à 0 n'entre pas dans la recherche, il n'est pas une information", () => {
  // La date est mise à null À DESSEIN : toute année du siècle contient un zéro (« 2022 »), donc
  // une fixture datée matcherait « 0 » par l'année et ne prouverait rien sur l'étage. Première
  // version de ce test écrite avec une date, et elle échouait pour cette raison.
  const c = dpe({ complement: "A13", etage: "0", surface_m2: 56, date_dpe: null, id_dpe: "AAAA" });
  assert.equal(matchesQuery(c, "0"), false);

  // Contrôle : un étage RÉEL, lui, se cherche.
  const reel = dpe({ complement: "A13", etage: "4", surface_m2: 56, date_dpe: null, id_dpe: "AAAA" });
  assert.equal(matchesQuery(reel, "4"), true);
});

// ── L'ordre de lecture ─────────────────────────────────────────────────────────────────────

test("les lignes identifiables passent devant les lignes muettes", () => {
  const muette = dpe({ complement: null, etage: "0", surface_m2: 10 });
  const nommee = dpe({ complement: "C10", surface_m2: 90 });
  const [a, b] = sortCandidates([muette, nommee]);
  assert.equal(candidateIdentifier(a), "C10");
  assert.equal(candidateIdentifier(b), null);
});

test("à identifiabilité égale, la surface croissante", () => {
  const r = sortCandidates([
    dpe({ complement: "A", surface_m2: 88 }),
    dpe({ complement: "B", surface_m2: 22 }),
    dpe({ complement: "C", surface_m2: 45 }),
  ]);
  assert.deepEqual(r.map((c) => c.surface_m2), [22, 45, 88]);
});

test("une surface absente ne remonte pas en tête par accident", () => {
  const r = sortCandidates([
    dpe({ complement: "A", surface_m2: null }),
    dpe({ complement: "B", surface_m2: 30 }),
  ]);
  assert.equal(r[0].surface_m2, 30);
});

test("le tri ne mute pas le tableau d'origine", () => {
  const src = [dpe({ complement: "A", surface_m2: 90 }), dpe({ complement: "B", surface_m2: 10 })];
  const avant = src.map((c) => c.surface_m2);
  sortCandidates(src);
  assert.deepEqual(src.map((c) => c.surface_m2), avant);
});
