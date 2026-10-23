// FUT-73 : ESPACE VERT PRÉSENT, ESPACE VERT PROPOSÉ.
//
// La sélection d'espaces verts du module Autour répond à « où puis-je aller » : `parseOverpass`
// écarte les espaces `access=private|no`. Aucune surface du produit ne lit aujourd'hui la végétation
// OSM comme une PRÉSENCE physique (la chaleur vient du CSTB, mesurée, et un espace vert ne la
// compense pas). Le défaut était donc dans le texte : la sélection filtrée se racontait comme un
// recensement. Ces tests vont de l'élément Overpass jusqu'à la phrase rendue.
import test from "node:test";
import assert from "node:assert/strict";
import { parseOverpass, computeOsmProximity } from "./logement-osm.ts";
import { lireChaleurEtVegetal } from "./logement-autour-chaleur.ts";
import { NOTE_ESPACES_VERTS, TEXTE_AUCUN_ESPACE_VERT } from "./logement-autour-types.ts";

const ADRESSE = { lat: 46.15, lon: -1.15 };
const ICU = { iuhi: 4.2, level: "marque" as const };

/** Un carré d'environ 110 m de côté (≈ 1 ha), à `nordM` mètres au nord de l'adresse. */
function carre(nordM: number, tags: Record<string, string>, id: number) {
  const dLat = nordM / 111_000;
  const c = 0.001;
  const s = ADRESSE.lat + dLat;
  const w = ADRESSE.lon - c / 2;
  return {
    type: "way", id, tags,
    geometry: [
      { lat: s, lon: w }, { lat: s + c, lon: w }, { lat: s + c, lon: w + c }, { lat: s, lon: w + c }, { lat: s, lon: w },
    ],
  };
}

const boisPrive = carre(20, { natural: "wood", access: "private" }, 1);
const boisFerme = carre(30, { landuse: "forest", access: "no" }, 2);
const parcSansTag = carre(400, { leisure: "park" }, 3);
const parcPublic = carre(250, { leisure: "park", access: "yes" }, 4);
const voieFerree = {
  type: "way", id: 9, tags: { railway: "rail" },
  geometry: [{ lat: ADRESSE.lat - 0.002, lon: ADRESSE.lon - 0.01 }, { lat: ADRESSE.lat - 0.002, lon: ADRESSE.lon + 0.01 }],
};

test("un espace déclaré privé ou fermé n'est jamais proposé comme le plus proche", () => {
  const prox = computeOsmProximity(ADRESSE, parseOverpass([boisPrive, boisFerme, parcSansTag]), 1500);
  assert.equal(prox.nearestMappedGreenSpace?.kind, "park");
  assert.ok(prox.nearestMappedGreenSpace!.distanceMeters > 350, "le bois privé à 20 m ne doit pas gagner");
});

test("LA PHRASE NE RACONTE PLUS UN RECENSEMENT : la règle de sélection est dite", () => {
  // Un bois privé borde l'adresse à 20 m. Écrire « le premier espace végétalisé est un parc, à
  // 400 m » serait faux sur la végétation présente. La phrase dit ce qu'elle a écarté.
  const prox = computeOsmProximity(ADRESSE, parseOverpass([boisPrive, parcSansTag]), 1500);
  const r = lireChaleurEtVegetal(ICU, prox)!;
  assert.match(r.texte, /Hors espaces déclarés privés ou fermés au public, le premier espace végétalisé cartographié est un parc/);
  assert.doesNotMatch(r.texte, /accès|accessible|ouvert à tous/i);
});

test("tout est privé : « aucun espace » est borné à la sélection, jamais étendu à la végétation", () => {
  const prox = computeOsmProximity(ADRESSE, parseOverpass([boisPrive, boisFerme]), 1500);
  assert.equal(prox.nearestMappedGreenSpace, null);
  const r = lireChaleurEtVegetal(ICU, prox)!;
  assert.match(r.texte, /Hors espaces déclarés privés ou fermés au public, aucun espace correspondant/);
  assert.match(r.limite, /ne permet pas de conclure à l'absence de tout espace végétalisé/);
  assert.match(TEXTE_AUCUN_ESPACE_VERT, /hors espaces déclarés privés ou fermés au public/);
});

test("SANS TAG D'ACCÈS : l'espace est proposé, son accès n'est jamais dit certain", () => {
  const prox = computeOsmProximity(ADRESSE, parseOverpass([parcSansTag]), 1500);
  assert.equal(prox.nearestMappedGreenSpace?.kind, "park");
  const r = lireChaleurEtVegetal(ICU, prox)!;
  assert.doesNotMatch(r.texte, /accessible|ouvert à tous/i);
  assert.match(r.limite, /Son accessibilité.*ne sont pas documentés/);
  assert.match(NOTE_ESPACES_VERTS, /L’accès aux espaces affichés n’est pas vérifié\./);
  assert.doesNotMatch(NOTE_ESPACES_VERTS, /accessibles?|ouvert à tous/);
});

test("ACCÈS DOCUMENTÉ (access=yes) : l'espace reste proposé, et futur•e n'en tire aucune promesse", () => {
  // Décision du porteur du 03/08/2026 : `access` ne sert qu'à écarter. Un `yes` est conservé comme
  // n'importe quel espace non fermé ; il n'ouvre aucune formule positive.
  const prox = computeOsmProximity(ADRESSE, parseOverpass([boisPrive, parcPublic, parcSansTag]), 1500);
  assert.equal(prox.nearestMappedGreenSpace?.kind, "park");
  assert.ok(Math.abs(prox.nearestMappedGreenSpace!.distanceMeters - 250) < 15);
  const r = lireChaleurEtVegetal(ICU, prox)!;
  assert.doesNotMatch(r.texte, /accessible|ouvert à tous/i);
});

test("les distances aux infrastructures ne bougent pas quand un espace privé est présent", () => {
  const sans = computeOsmProximity(ADRESSE, parseOverpass([voieFerree, parcSansTag]), 1500);
  const avec = computeOsmProximity(ADRESSE, parseOverpass([voieFerree, boisPrive, boisFerme, parcSansTag]), 1500);
  assert.deepEqual(avec.potentiallyNoisyInfrastructure, sans.potentiallyNoisyInfrastructure);
  assert.deepEqual(avec.nearestMappedGreenSpace, sans.nearestMappedGreenSpace);
  assert.deepEqual(avec.largerGreenSpaceNearby, sans.largerGreenSpaceNearby);
});

test("la note ne promet rien et ne porte ni tiret cadratin ni antithèse", () => {
  for (const t of [NOTE_ESPACES_VERTS, TEXTE_AUCUN_ESPACE_VERT]) {
    assert.doesNotMatch(t, /—/);
    assert.doesNotMatch(t, /c'est .*, pas /i);
  }
});
