import test from "node:test";
import assert from "node:assert/strict";
import { projetAChangeMateriellement, signatureDecisionnelle } from "./projet-materiel.ts";
import type { UserProject } from "../user-project.ts";

const projet = (over: Record<string, unknown> = {}): UserProject => ({
  posture: "recherche",
  intent: "achat",
  rawText: "je cherche au calme, près de la mer",
  parsed: {
    reformulation: "Un lieu calme, proche de la mer.",
    // `active` N'EST PAS DÉCORATIF : sans lui, l'hydratation traite `nearSea` comme absent, et la
    // fixture décrirait une contrainte que le moteur n'applique pas.
    hardConstraints: { nearSea: { active: true, maxKm: 20 } },
    preferences: [{ key: "cadre_calme", weight: 3 }, { key: "proximite_mer", weight: 2 }],
  },
  updatedAt: "2026-08-05T09:00:00.000Z",
  ...over,
} as unknown as UserProject);

test("un projet inchangé ne périme rien", () => {
  assert.equal(projetAChangeMateriellement(projet(), projet()), false);
});

test("ce que le moteur LIT périme l'analyse", () => {
  // Les quatre entrées du moteur : la posture gouverne les gestes et la voix, l'intention change
  // ce qu'on propose, les contraintes dures peuvent rendre un lieu incompatible, et les préférences
  // décident quelles règles s'expriment.
  assert.equal(projetAChangeMateriellement(projet(), projet({ posture: "habitant" })), true);
  assert.equal(projetAChangeMateriellement(projet(), projet({ intent: "location" })), true);
  assert.equal(
    projetAChangeMateriellement(projet(), projet({
      parsed: { ...projet().parsed, hardConstraints: { nearSea: { active: true, maxKm: 5 } } },
    })),
    true,
  );
  assert.equal(
    projetAChangeMateriellement(projet(), projet({
      parsed: { ...projet().parsed, preferences: [{ key: "cadre_calme", weight: 3 }] },
    })),
    true,
  );
});

test("le POIDS d'une préférence compte autant que sa présence", () => {
  // Il gouverne la matérialité : un poids 1 est silencieux, un poids 3 structure le verdict.
  const alourdi = projet({
    parsed: { ...projet().parsed, preferences: [{ key: "cadre_calme", weight: 1 }, { key: "proximite_mer", weight: 2 }] },
  });
  assert.equal(projetAChangeMateriellement(projet(), alourdi), true);
});

test("le TEXTE du lecteur ne périme rien : aucune règle ne le lit", () => {
  // Corriger une faute de frappe, ou voir sa reformulation régénérée, ne change pas une décision.
  // Le contraire périmerait des dossiers vendus pour une virgule.
  assert.equal(
    projetAChangeMateriellement(projet(), projet({ rawText: "je cherche au calme, pres de la mer" })),
    false,
  );
  assert.equal(
    projetAChangeMateriellement(projet(), projet({
      parsed: { ...projet().parsed, reformulation: "Autre formulation, même sens." },
    })),
    false,
  );
  assert.equal(
    projetAChangeMateriellement(projet(), projet({ updatedAt: "2026-08-12T18:00:00.000Z" })),
    false,
  );
});

test("l'ORDRE des préférences n'est pas une différence", () => {
  // Un aller-retour JSON ne garantit pas l'ordre des clés : sans normalisation, le lecteur verrait
  // « votre projet a changé » sans avoir rien touché.
  const inverse = projet({
    parsed: {
      ...projet().parsed,
      preferences: [{ key: "proximite_mer", weight: 2 }, { key: "cadre_calme", weight: 3 }],
    },
  });
  assert.equal(projetAChangeMateriellement(projet(), inverse), false);
  assert.equal(signatureDecisionnelle(projet()), signatureDecisionnelle(inverse));
});

// ── L'ORDRE *DANS* LES CONTRAINTES DURES (revue du 12/08/2026) ───────────────────────────────
// Le test ci-dessus s'intitulait « préférences ET contraintes » et ne changeait en réalité que
// l'ordre des préférences : il mentait sur sa couverture, et la signature ne triait que les clés de
// PREMIER niveau. Les deux cas ci-dessous échouaient.

test("les clés IMBRIQUÉES d'une contrainte ne sont pas une différence", () => {
  const avec = (hc: Record<string, unknown>) =>
    projet({ parsed: { ...projet().parsed, hardConstraints: hc } });
  const a = avec({ nearPlace: { label: "Toulouse", maxKm: 30, mode: "car" } });
  const b = avec({ nearPlace: { mode: "car", maxKm: 30, label: "Toulouse" } });
  assert.equal(signatureDecisionnelle(a), signatureDecisionnelle(b));
  assert.equal(projetAChangeMateriellement(a, b), false);
});

test("les listes de contraintes sont des ENSEMBLES, pas des séquences", () => {
  // `departements`, `zones`, `excludeZones`, `excludePlace` : le moteur les intersecte ou les
  // exclut. Aucun de ces tableaux n'a d'ordre signifiant, et le LLM de /parse n'en garantit aucun.
  const avec = (hc: Record<string, unknown>) =>
    projet({ parsed: { ...projet().parsed, hardConstraints: hc } });
  const a = avec({ departements: ["31", "33", "64"], excludePlace: [{ label: "Lyon" }, { label: "Paris" }] });
  const b = avec({ departements: ["64", "31", "33"], excludePlace: [{ label: "Paris" }, { label: "Lyon" }] });
  assert.equal(signatureDecisionnelle(a), signatureDecisionnelle(b));
  assert.equal(projetAChangeMateriellement(a, b), false);
  // Un département EN PLUS reste un vrai changement : la normalisation ne doit pas tout aplatir.
  assert.equal(projetAChangeMateriellement(a, avec({ departements: ["31", "33"], excludePlace: [{ label: "Lyon" }, { label: "Paris" }] })), true);
});

test("une contrainte NULLE et une contrainte absente sont la même absence", () => {
  // `montagne: null` est la forme que le parseur émet pour « pas de montagne », et un aller-retour
  // JSON supprime les `undefined`. Distinguer les deux ferait dépendre la signature du chemin
  // d'écriture, donc périmer une analyse au gré d'une relecture.
  const avec = (hc: Record<string, unknown>) =>
    projet({ parsed: { ...projet().parsed, hardConstraints: hc } });
  assert.equal(
    signatureDecisionnelle(avec({ departements: ["31"], montagne: null })),
    signatureDecisionnelle(avec({ departements: ["31"] })),
  );
  // Mais une contrainte POSÉE reste une différence.
  assert.equal(
    projetAChangeMateriellement(
      avec({ departements: ["31"] }),
      avec({ departements: ["31"], montagne: { strength: "hard" } }),
    ),
    true,
  );
});

test("une CLÉ EN DOUBLE se lit comme le moteur la lit : la première gagne", () => {
  // Reproduit par la revue du 12/08/2026 : les deux ordres signaient pareil (les couples clé:poids
  // sont triés) alors que `preferenceWeight`, qui lit par `find`, applique 1 dans un cas et 3 dans
  // l'autre. Un vrai changement de décision était invisible.
  //
  // `normalizeUserProject` canonise désormais à l'entrée ; ce test protège les projets FIGÉS avant
  // elle, dans les artefacts déjà vendus, qu'aucune normalisation ne repassera.
  const avec = (prefs: unknown[]) => projet({ parsed: { ...projet().parsed, preferences: prefs } });
  const dabord1 = avec([{ key: "faible_chaleur", weight: 1 }, { key: "faible_chaleur", weight: 3 }]);
  const dabord3 = avec([{ key: "faible_chaleur", weight: 3 }, { key: "faible_chaleur", weight: 1 }]);
  assert.notEqual(signatureDecisionnelle(dabord1), signatureDecisionnelle(dabord3));
  assert.equal(projetAChangeMateriellement(dabord1, dabord3), true);
  // Et le doublon n'est PAS un changement en soi : ce que le moteur ignore ne périme rien.
  assert.equal(projetAChangeMateriellement(dabord1, avec([{ key: "faible_chaleur", weight: 1 }])), false);
});

test("PASSER D'UN PROJET LIBRE À UN PROJET STRUCTURÉ périme l'analyse", () => {
  // `conclusionState` commence par `isStructured` : un projet en texte libre conclut « projet non
  // structuré », un projet structuré sans contrainte conclut « aucune contrainte déclarée ». Les
  // deux avaient la même signature, `hard` et `prefs` étant vides de part et d'autre, et le dossier
  // n'était pas déclaré périmé alors que sa conclusion changeait.
  const libre = projet({ parsed: null });
  const structureVide = projet({ parsed: { reformulation: "Vous cherchez un lieu.", hardConstraints: {}, preferences: [] } });
  assert.notEqual(signatureDecisionnelle(libre), signatureDecisionnelle(structureVide));
  assert.equal(projetAChangeMateriellement(libre, structureVide), true);
  assert.equal(projetAChangeMateriellement(structureVide, libre), true);
});

test("une contrainte INACTIVE ne périme rien : le moteur la traite comme absente", () => {
  // `{ excludeSea: false }` et `{ nearSea: { active: false } }` sont écartés par l'hydratation
  // exactement comme des clés absentes. Les compter faisait annoncer un changement de projet suivi
  // d'une version n+1 concluant mot pour mot comme la précédente.
  const avec = (hc: Record<string, unknown>) =>
    projet({ parsed: { ...projet().parsed, hardConstraints: hc } });
  const rien = avec({});
  assert.equal(projetAChangeMateriellement(rien, avec({ excludeSea: false })), false);
  assert.equal(projetAChangeMateriellement(rien, avec({ nearSea: { active: false } })), false);
  assert.equal(projetAChangeMateriellement(rien, avec({ departements: [] })), false);
  assert.equal(projetAChangeMateriellement(rien, avec({ montagne: { strength: "preferred" } })), false);
  // ACTIVER la même contrainte, elle, périme : c'est le filtre qui change.
  assert.equal(projetAChangeMateriellement(rien, avec({ excludeSea: true })), true);
  assert.equal(projetAChangeMateriellement(rien, avec({ nearSea: { active: true, maxKm: 20 } })), true);
  // Et le SEUIL d'une contrainte active compte, la valeur étant comparée en entier.
  assert.equal(
    projetAChangeMateriellement(
      avec({ nearSea: { active: true, maxKm: 20 } }),
      avec({ nearSea: { active: true, maxKm: 5 } }),
    ),
    true,
  );
});

test("une ANCRE SOUPLE à côté d'une ancre dure ne périme rien", () => {
  // L'hydratation ne garde que les ancres `hard` : une ancre `preferred` ou `inspiration` vaut bonus
  // de score dans le comparateur, et ne restreint aucun territoire dans le dossier. `zones` était
  // comparée en entier, si bien qu'ajouter une inspiration périmait une analyse vendue.
  const avec = (hc: Record<string, unknown>) =>
    projet({ parsed: { ...projet().parsed, hardConstraints: hc } });
  const dure = avec({ zones: [{ zone: "bretagne", strength: "hard" }] });
  const dureEtSouple = avec({
    zones: [{ zone: "bretagne", strength: "hard" }, { zone: "sud_ouest", strength: "preferred" }],
  });
  assert.equal(projetAChangeMateriellement(dure, dureEtSouple), false);
  // Une ancre DURE de plus reste un vrai changement : elle s'intersecte avec la première.
  assert.equal(
    projetAChangeMateriellement(dure, avec({
      zones: [{ zone: "bretagne", strength: "hard" }, { zone: "sud_ouest", strength: "hard" }],
    })),
    true,
  );
});

test("QUAND LE TEMPS PRIME, le kilométrage ne périme rien", () => {
  // `nearPlaceThreshold` : « à 30 minutes, disons 20 km » est un lecteur qui se paraphrase, et le
  // temps est ce qu'il a en tête. Le `maxKm` n'est alors jamais lu par le moteur.
  const avec = (np: Record<string, unknown>) =>
    projet({ parsed: { ...projet().parsed, hardConstraints: { nearPlace: np } } });
  const base = { label: "Toulouse", maxMinutes: 30, mode: "car" };
  assert.equal(projetAChangeMateriellement(avec({ ...base, maxKm: 20 }), avec({ ...base, maxKm: 5 })), false);
  // Le TEMPS, lui, périme. Et le kilométrage redevient décisif dès qu'aucun temps n'est déclaré.
  assert.equal(projetAChangeMateriellement(avec({ ...base, maxKm: 20 }), avec({ ...base, maxMinutes: 45, maxKm: 20 })), true);
  assert.equal(
    projetAChangeMateriellement(avec({ label: "Toulouse", maxKm: 20 }), avec({ label: "Toulouse", maxKm: 5 })),
    true,
  );
});

test("un ENSEMBLE est trié ET dédupliqué", () => {
  // Le commentaire promettait un ensemble, le code n'ôtait que l'ordre : `["31","31"]` périmait le
  // dossier de quelqu'un dont le parse avait répété un département.
  const avec = (hc: Record<string, unknown>) =>
    projet({ parsed: { ...projet().parsed, hardConstraints: hc } });
  assert.equal(
    projetAChangeMateriellement(avec({ departements: ["31", "33"] }), avec({ departements: ["33", "31", "31"] })),
    false,
  );
});

test("sans point de comparaison, on n'affirme RIEN", () => {
  // Les artefacts d'avant le 05/08/2026 ne portent pas de snapshot de projet. Annoncer une
  // obsolescence non établie serait le défaut symétrique de celui qu'on corrige.
  assert.equal(projetAChangeMateriellement(null, projet()), false);
  assert.equal(projetAChangeMateriellement(projet(), null), false);
  assert.equal(projetAChangeMateriellement(undefined, undefined), false);
});
