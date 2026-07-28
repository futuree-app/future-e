import test from "node:test";
import assert from "node:assert/strict";
import { bboxAround, haversineM } from "./geo-distance.ts";

// Quatre latitudes françaises réelles, du sud au nord : l'erreur corrigée croît avec la latitude.
const VILLES = [
  { nom: "Perpignan", lat: 42.70, lon: 2.90 },
  { nom: "La Rochelle", lat: 46.16, lon: -1.15 },
  { nom: "Paris", lat: 48.86, lon: 2.35 },
  { nom: "Lille", lat: 50.63, lon: 3.06 },
];

test("LA FENÊTRE CONTIENT LE DISQUE dans les quatre directions", () => {
  // Le défaut fermé : la fenêtre était trop étroite d'est en ouest, donc un objet dans le rayon
  // demandé pouvait en sortir sans que rien ne le signale.
  for (const v of VILLES) {
    for (const r of [300, 1000, 3000]) {
      const b = bboxAround(v, r);
      const est = haversineM(v, { lat: v.lat, lon: b.maxLon });
      const ouest = haversineM(v, { lat: v.lat, lon: b.minLon });
      const nord = haversineM(v, { lat: b.maxLat, lon: v.lon });
      const sud = haversineM(v, { lat: b.minLat, lon: v.lon });
      for (const [dir, d] of [["est", est], ["ouest", ouest], ["nord", nord], ["sud", sud]] as const) {
        assert.ok(d >= r * 0.99, `${v.nom}, ${r} m vers l'${dir} : la fenêtre ne porte que ${Math.round(d)} m`);
      }
    }
  }
});

test("L'ANCIEN CALCUL aurait échoué : il perdait 27 à 37 % du rayon vers l'est", () => {
  // Reproduit le calcul fautif pour prouver que ce test l'attrape.
  for (const v of VILLES) {
    const degFaux = 1000 / 111_000;
    const porteeEst = haversineM(v, { lat: v.lat, lon: v.lon + degFaux });
    assert.ok(porteeEst < 1000 * 0.8, `${v.nom} : l'ancien calcul portait ${Math.round(porteeEst)} m`);
  }
});

test("LA FENÊTRE RESTE UN MAJORANT SERRÉ : pas de rectangle démesuré", () => {
  // Un majorant trop large ferait remonter des milliers d'objets à filtrer ensuite.
  for (const v of VILLES) {
    const b = bboxAround(v, 1000);
    const est = haversineM(v, { lat: v.lat, lon: b.maxLon });
    assert.ok(est < 1000 * 1.05, `${v.nom} : fenêtre de ${Math.round(est)} m pour 1 000 m demandés`);
  }
});

test("Le coin de la fenêtre est bien HORS du disque : le filtre par distance reste obligatoire", () => {
  const v = VILLES[2]!; // Paris
  const b = bboxAround(v, 1000);
  const coin = haversineM(v, { lat: b.maxLat, lon: b.maxLon });
  assert.ok(coin > 1000, "le rectangle sélectionne, il ne conclut pas");
  assert.ok(coin < 1500, "et il ne déborde pas non plus démesurément");
});

test("Une latitude extrême ne fait pas exploser la fenêtre", () => {
  const b = bboxAround({ lat: 89.9, lon: 0 }, 1000);
  assert.ok(Number.isFinite(b.minLon) && Number.isFinite(b.maxLon));
  assert.ok(b.maxLon - b.minLon < 1, "la borne sur cos(lat) tient");
});

test("Rayon nul : la fenêtre se réduit au point", () => {
  const v = VILLES[1]!;
  const b = bboxAround(v, 0);
  assert.equal(b.minLat, v.lat);
  assert.equal(b.maxLon, v.lon);
});

test("LES COINS DE LA FENÊTRE SONT HORS DU RAYON : le filtre géodésique est obligatoire", () => {
  // Sans filtre par distance réelle, un objet dans un coin serait retenu comme « à moins de 1 km ».
  // Ce test fige la raison d'être de l'étape de filtrage dans `getCartofrichesNearPoint`.
  for (const v of VILLES) {
    const b = bboxAround(v, 1000);
    for (const coin of [
      { lat: b.maxLat, lon: b.maxLon }, { lat: b.maxLat, lon: b.minLon },
      { lat: b.minLat, lon: b.maxLon }, { lat: b.minLat, lon: b.minLon },
    ]) {
      assert.ok(haversineM(v, coin) > 1000, `${v.nom} : un coin tombe dans le rayon, le filtre serait inutile`);
    }
  }
});

test("UN POINT À LA LIMITE EXACTE reste dans la fenêtre, dans les quatre directions", () => {
  // La fenêtre ne doit pas exclure ce que le rayon inclut : c'est le sens du majorant.
  const v = VILLES[1]!; // La Rochelle
  const b = bboxAround(v, 1000);
  const degLat = 1000 / 111_000;
  const degLon = 1000 / (111_000 * Math.cos((v.lat * Math.PI) / 180));
  assert.ok(v.lat + degLat <= b.maxLat + 1e-9 && v.lat - degLat >= b.minLat - 1e-9);
  assert.ok(v.lon + degLon <= b.maxLon + 1e-9 && v.lon - degLon >= b.minLon - 1e-9);
});

test("Une coordonnée aberrante ne produit pas de fenêtre exploitable par erreur", () => {
  // (0, 0) est la valeur de remplissage classique : la fenêtre existe, mais elle est au large de
  // l'Afrique. C'est à l'appelant de rejeter le point, pas à la bbox de deviner.
  const b = bboxAround({ lat: 0, lon: 0 }, 1000);
  assert.ok(Number.isFinite(b.minLat) && Number.isFinite(b.maxLon));
  assert.ok(haversineM({ lat: 0, lon: 0 }, { lat: 46.16, lon: -1.15 }) > 5_000_000);
});
