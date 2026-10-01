// FUT-8, étape 5 : le parseur garde ce qui est dit ; les dérivés d'ancre vivent dans la Recherche.
import test from "node:test";
import assert from "node:assert/strict";
import { assainirParsed } from "./parse-assainir.ts";
import { derivesDAncrePourRecherche } from "./ancre-recherche.ts";
import { gabaritTailleAncre } from "./ancre-gabarit.ts";
import type { ParsedProject } from "./comparateur-vie.ts";

const base = (over: Partial<ParsedProject>): ParsedProject => ({ reformulation: "x", hardConstraints: {}, preferences: [], ...over } as ParsedProject);

test("« une petite ville » : aucune borne inventée, le mot est gardé, la préférence classe", () => {
  const p = assainirParsed(base({
    hardConstraints: { communeSize: { min: 5000, max: 25000 } },
    preferences: [{ key: "eviter_grandes_villes", weight: 2 }],
    sizeWord: "petite",
  }), "je cherche une petite ville en Bretagne");
  assert.equal(p.hardConstraints.communeSize, null);
  assert.equal(p.sizeWord, "petite");
  assert.deepEqual(p.preferences, [{ key: "eviter_grandes_villes", weight: 2, source: "parse" }]);
});

test("« une commune de moins de 20 000 habitants » : le chiffre dit reste, avec son unité", () => {
  const p = assainirParsed(base({ hardConstraints: { communeSize: { min: null, max: 20000, unit: "commune" } } }), "une commune de moins de 20 000 habitants");
  assert.deepEqual(p.hardConstraints.communeSize, { min: null, max: 20000, unit: "commune" });
  const sans = assainirParsed(base({ hardConstraints: { communeSize: { max: 20000 } } }), "moins de 20 000 habitants");
  assert.equal(sans.hardConstraints.communeSize?.unit, null);
});

test("métrique, périmètre, mot dit : gardés seulement s'ils sont valides ; rien n'est deviné", () => {
  const p = assainirParsed(base({
    hardConstraints: {
      nearPlace: { label: "Nantes", maxKm: 20, metric: "vol_oiseau" },
      excludePlace: [{ label: "Lyon", scope: "commune" }, { label: "Bordeaux", scope: "quartier" as never }],
      excludeZones: ["idf"],
      excludeZonesDits: [{ token: "idf", said: "la région parisienne" }, { token: "nord", said: "le Nord" }],
      excludeZonesPerimetres: { idf: "paris" },
    },
  }), "à 20 km à vol d'oiseau de Nantes, quitter Lyon, éviter Bordeaux, loin de la région parisienne");
  const hc = p.hardConstraints;
  assert.equal(hc.nearPlace?.metric, "vol_oiseau");
  assert.deepEqual(hc.excludePlace, [{ label: "Lyon", scope: "commune" }, { label: "Bordeaux", scope: null }]);
  assert.deepEqual(hc.excludeZonesDits, [{ token: "idf", said: "la région parisienne" }]);
  assert.equal(hc.excludeZonesPerimetres, undefined, "un périmètre ne s'écrit que par un geste du lecteur");
  const minutes = assainirParsed(base({ hardConstraints: { nearPlace: { label: "Nantes", maxMinutes: 30, metric: "route" } } }), "30 minutes de Nantes");
  assert.equal(minutes.hardConstraints.nearPlace?.metric, null, "une métrique ne qualifie que des km");
});

test("cas 21 : « absolument quitter Lyon, éviter Bordeaux » suggère une condition sur Lyon seulement", () => {
  const p = assainirParsed(base({
    hardConstraints: { excludePlace: [{ label: "Lyon" }, { label: "Bordeaux" }] },
    forceMarkers: [
      { criterion: { kind: "hard", key: "excludePlace", instance: "Lyon" }, quote: "absolument" },
      { criterion: { kind: "hard", key: "excludePlace", instance: "Marseille" }, quote: "surtout pas" },
      { criterion: { kind: "hard", key: "montagne", instance: null }, quote: "impérativement" },
    ],
  }), "Je dois absolument quitter Lyon, et j'aimerais éviter Bordeaux");
  assert.deepEqual(p.forceMarkers, [{ criterion: { kind: "hard", key: "excludePlace", instance: "lyon" }, quote: "absolument" }]);
});

test("Recherche : l'ancre est exclue et la fourchette ÷/× 2,5 appliquée, sans jamais toucher au texte du lecteur", () => {
  const brest = { nom: "Brest" };
  const taille = gabaritTailleAncre(202_000);
  const p = base({ communeAncre: [{ label: "Brest" }], preferences: [{ key: "vie_locale", weight: 2, source: "ancre" }] });
  const r = derivesDAncrePourRecherche(p, [brest], taille);
  assert.deepEqual(r.hardConstraints.excludePlace, [{ label: "Brest" }]);
  assert.deepEqual(r.hardConstraints.communeSize, taille);
  assert.deepEqual(p.hardConstraints, {}, "le parsed d'origine n'est pas muté");
  // L'explicite écrase le dérivé.
  const dite = derivesDAncrePourRecherche(base({ preferences: [{ key: "eviter_grandes_villes", weight: 2, source: "parse" }] }), [brest], taille);
  assert.equal(dite.hardConstraints.communeSize, undefined);
  // Une préférence de taille DÉRIVÉE de l'ancre n'est pas une taille dite.
  const derivee = derivesDAncrePourRecherche(base({ preferences: [{ key: "eviter_grandes_villes", weight: 2, source: "ancre" }] }), [brest], taille);
  assert.deepEqual(derivee.hardConstraints.communeSize, taille);
  // Puce de taille retirée par le lecteur.
  assert.equal(derivesDAncrePourRecherche(base({ ancreSansTaille: true }), [brest], taille).hardConstraints.communeSize, undefined);
});

test("parité : un parsed ancien (dérivés déjà écrits) donne exactement les mêmes contraintes", () => {
  const taille = gabaritTailleAncre(202_000);
  const ancien = base({ hardConstraints: { excludePlace: [{ label: "Brest" }], communeSize: taille }, communeAncre: [{ label: "Brest" }] });
  const nouveau = base({ communeAncre: [{ label: "Brest" }] });
  assert.deepEqual(derivesDAncrePourRecherche(ancien, [{ nom: "Brest" }], taille).hardConstraints, derivesDAncrePourRecherche(nouveau, [{ nom: "Brest" }], taille).hardConstraints);
});
