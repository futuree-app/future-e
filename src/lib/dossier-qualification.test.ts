import test from "node:test";
import assert from "node:assert/strict";
import {
  isSellableAnchor,
  admissibleCandidates,
  type ReverseHit,
} from "./dossier-qualification.ts";

test("seul un numéro d'adresse est un ancrage vendable", () => {
  assert.equal(isSellableAnchor("housenumber"), true);
  assert.equal(isSellableAnchor("street"), false);
  assert.equal(isSellableAnchor("locality"), false);
  assert.equal(isSellableAnchor("municipality"), false);
  assert.equal(isSellableAnchor(null), false);
});

// L'identifiant BAN d'un numéro est `citycode_idvoie_numero`. Vérifié le 30/07/2026 :
// la voie « le Cros » est 83077_i1no3t, « 1986 le Cros » est 83077_i1no3t_01986.
const hit = (
  banId: string,
  label: string,
  distanceM: number,
  over: Partial<ReverseHit> = {},
): ReverseHit => ({
  banId,
  label,
  distanceM,
  citycode: "83077",
  city: "Méounes-lès-Montrieux",
  postcode: "83136",
  latitude: 43.2819,
  longitude: 5.978,
  ...over,
});

const hits: ReverseHit[] = [
  hit("83077_i1no3t_01986", "1986 le Cros", 9),
  hit("83077_rbzfxz_00850", "850 le Vallon", 44),
  hit("83077_rbzfxz_00771", "771 le Vallon", 44),
  hit("83077_i1no3t_00451", "451 le Cros", 58),
];

test("sur une voie, seuls les numéros de CETTE voie sont admissibles", () => {
  const out = admissibleCandidates(
    { banId: "83077_i1no3t", citycode: "83077", type: "street" },
    hits,
  );
  assert.deepEqual(
    out.map((c) => c.banId),
    ["83077_i1no3t_01986", "83077_i1no3t_00451"],
  );
});

test("aucun seuil de distance : un numéro de la bonne voie à 58 m reste admissible", () => {
  // C'est la raison pour laquelle un MAX_DISTANCE de 50 m est refusé : il aurait écarté
  // « 451 le Cros », qui est légitime.
  const out = admissibleCandidates(
    { banId: "83077_i1no3t", citycode: "83077", type: "street" },
    hits,
  );
  assert.ok(out.some((c) => c.distanceM === 58));
});

test("un candidat porte SON point, jamais celui de la feature grossière", () => {
  // Sans ses coordonnées, sélectionner ce candidat sonderait le cadastre au centroïde de la
  // voie tout en affichant l'adresse d'un numéro précis.
  const out = admissibleCandidates(
    { banId: "83077_i1no3t", citycode: "83077", type: "street" },
    [hit("83077_i1no3t_01986", "1986 le Cros", 9, { latitude: 43.2822, longitude: 5.9783 })],
  );
  assert.equal(out[0].latitude, 43.2822);
  assert.equal(out[0].longitude, 5.9783);
});

test("sur un lieu-dit, le filtre se réduit à la commune, dans un périmètre borné", () => {
  const out = admissibleCandidates(
    { banId: "83077_xyz", citycode: "83077", type: "locality" },
    hits,
  );
  assert.equal(out.length, 4);
  assert.deepEqual(
    out.map((c) => c.distanceM),
    [9, 44, 44, 58],
  );
});

test("sur un lieu-dit, un numéro hors du périmètre n'est jamais proposé", () => {
  // Sans borne, le reverse rendrait le numéro le plus proche même à des kilomètres, et
  // l'écran proposerait une adresse sans rapport avec le bien cherché. Le préfixe de voie
  // protège la branche `street` ; le lieu-dit n'a pas de voie pour le faire.
  const out = admissibleCandidates(
    { banId: "83077_xyz", citycode: "83077", type: "locality" },
    [hit("83077_zzz_00001", "1 Très Loin", 900)],
  );
  assert.deepEqual(out, []);
});

test("une commune saisie seule ne propose AUCUN candidat", () => {
  // « Kerlaz Locronan » rend une feature `municipality` dont le reverse voisin est
  // « 13 Rue Moal » à 0 m, au centre du bourg. Proposer cinq numéros du centre à qui n'a
  // saisi qu'un nom de commune n'aurait aucun sens : le geste attendu est de saisir une
  // adresse, pas de choisir dans une liste arbitraire.
  const out = admissibleCandidates(
    { banId: "29136", citycode: "29136", type: "municipality" },
    [hit("29136_aaa_00013", "13 Rue Moal", 0, { citycode: "29136" })],
  );
  assert.deepEqual(out, []);
});

test("un candidat d'une autre commune n'est jamais proposé", () => {
  const out = admissibleCandidates(
    { banId: "83077_xyz", citycode: "83077", type: "locality" },
    [...hits, hit("83999_aaa_00001", "1 rue Ailleurs", 2, { citycode: "83999" })],
  );
  assert.ok(!out.some((c) => c.banId.startsWith("83999")));
});

test("cinq candidats au plus, les plus proches", () => {
  const many: ReverseHit[] = Array.from({ length: 9 }, (_, i) =>
    hit(`83077_i1no3t_0000${i}`, `${i} le Cros`, 100 - i),
  );
  const out = admissibleCandidates(
    { banId: "83077_i1no3t", citycode: "83077", type: "street" },
    many,
  );
  assert.equal(out.length, 5);
  assert.deepEqual(
    out.map((c) => c.distanceM),
    [92, 93, 94, 95, 96],
  );
});

test("la voie ne matche jamais par préfixe partiel", () => {
  // 83077_i1no3 est un préfixe textuel de 83077_i1no3t : sans le séparateur, un numéro
  // d'une autre voie passerait pour un numéro de celle-ci.
  const out = admissibleCandidates(
    { banId: "83077_i1no3", citycode: "83077", type: "street" },
    hits,
  );
  assert.deepEqual(out, []);
});

test("aucun candidat admissible rend une liste vide, jamais null", () => {
  const out = admissibleCandidates(
    { banId: "83077_i1no3t", citycode: "83077", type: "street" },
    [],
  );
  assert.deepEqual(out, []);
});
