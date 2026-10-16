// FUT-50 · LE CAS RÉEL DES PROTOTYPES D'ACCUEIL : SÈTE (34301). DEV UNIQUEMENT.
//
// Rien ici n'est écrit pour la maquette. Chaque phrase est la sortie du moteur de production
// (`buildCommuneDossier`, règles, conditions, compositions, plan de conclusion) pour la commune de Sète
// et un même Projet, relevée le 12/10/2026, mot pour mot. Trois lectures :
//
//   avecChaleur   le Projet complet : près de la mer, sans voiture, des étés supportables, une ville à taille humaine
//   sansChaleur   le même Projet sans « des étés supportables »
//   merConfirmee  le Projet complet, où la proximité de la mer devient une condition sans compromis
//   merConfirmeeSansChaleur  les deux changements à la fois
//
// Deux contrôles empêchent la fixture de mentir en silence :
//   - `cas-sete.test.ts` (hors ligne) : les valeurs DRIAS figées sont celles de `public/data_climat.json`,
//     et les chiffres écrits dans les phrases sont ceux qui s'en déduisent ;
//   - `scripts/fut50/verifier-cas-sete.mjs` (réseau, Géorisques n'accepte que les IP françaises) : rejoue
//     la chaîne complète et compare chaque phrase. À relancer avant toute mise en production d'un accueil
//     qui citerait ce cas.
//
// Ce qui n'est PAS du moteur est marqué `pedagogique` : la phrase du Projet (écrite pour l'exemple, le
// moteur part de préférences pondérées) et la description de l'issue « examiné, sans signal net ».

export const CAS_SETE = {
  insee: "34301",
  commune: "Sète",
  releveLe: "12 octobre 2026",
  /** Le Projet tel qu'une personne pourrait l'écrire. Pédagogique : le moteur lit les préférences ci-dessous. */
  projet: {
    phrase: "Une ville à taille humaine, près de la mer, où l'on peut vivre sans voiture, avec des étés supportables.",
    pedagogique: true,
    // Clé moteur, poids, et le libellé du registre des critères (`criteria.registry[].label`).
    priorites: [
      { cle: "proximite_mer", poids: 3, libelle: "la proximité de la mer" },
      { cle: "faible_dependance_auto", poids: 3, libelle: "une faible dépendance à la voiture" },
      { cle: "faible_chaleur", poids: 3, libelle: "des étés plus frais" },
      { cle: "eviter_grandes_villes", poids: 2, libelle: "une ville à taille humaine" },
    ],
  },

  /** Les intitulés de section du dossier réel (`Dossier.sections[].title`). */
  sections: {
    alignments: "Ce qui correspond à votre projet",
    mismatches: "Ce qui correspond moins bien",
    verifications: "À contrôler",
    conditions: "Vos conditions sans compromis",
  },

  faits: {
    voiture: {
      sujet: "la possibilité de se déplacer sans voiture",
      constat: "Pour la possibilité de se déplacer sans voiture, Sète se situe parmi les 5 % de communes où elle est la plus favorable en France.",
      preuve: { libelle: "Territoire · Sète", source: "INSEE · trajets domicile-travail, recensement 2022", grain: "commune" as const },
    },
    nuits: {
      // Le même constat dans les deux lectures : seule sa place change.
      constat: "Les nuits tropicales passeraient de 42 par an sur la période de référence 1976-2005 à 80 à l'horizon 2050 : des nuits où la température ne redescend pas sous 20 °C, et où le corps peine à récupérer.",
      titreSiPriorite: "Des étés plus difficiles à concilier avec votre projet",
      sujetSiPriorite: "des étés supportables",
      conventionHorsPriorite: "futur•e signale cette exposition à partir de 39 nuits tropicales par an, hors priorité déclarée.",
      limite: "Cette trajectoire est lue à l'échelle de la commune, pas de l'adresse ni du logement.",
      geste: "Renseignez votre adresse pour descendre au niveau du logement",
      preuve: { libelle: "Climat · Sète", valeur: "80 nuits à l'horizon 2050", source: "DRIAS · Météo-France", grain: "commune" as const },
      // Valeurs DRIAS brutes (nuits/an), `public/data_climat.json` : NORTR_yr (valeur projetée) et ATR_yr (écart
      // à la référence). La référence se déduit : 79,8 − 37,1 = 42,7, que le moteur écrit « 42 ».
      drias: {
        gwl15: { NORTR_yr: 66.6, ATR_yr: 25.4 },
        gwl20: { NORTR_yr: 79.8, ATR_yr: 37.1 },
        gwl30: { NORTR_yr: 101.6, ATR_yr: 59.7 },
      },
    },
    feu: {
      constat: "À Sète, le risque de feu de forêt est officiellement recensé par l'État (Géorisques).",
      statut: "Risque recensé",
      limite: "Ce recensement vaut pour la commune : il n'établit ni l'intensité du risque, ni la proximité d'un massif, ni l'exposition d'un logement en particulier.",
      geste: "Renseignez votre adresse pour descendre au niveau du terrain",
      preuve: { libelle: "Géorisques · Sète", valeur: "risque de feu de forêt recensé", grain: "commune" as const },
    },
    mer: {
      // Lecture `merConfirmee` : la carte « Condition ouverte ».
      sujet: "la proximité de la mer",
      statut: "Condition ouverte",
      constat: "Le point de référence de Sète est à moins de 100 m du rivage marin.",
      pourquoi: "Cette distance est mesurée à vol d'oiseau depuis le point de référence de la commune jusqu'au rivage marin. Elle ne correspond pas nécessairement à la mesure que vous visez pour cette condition.",
      consequence: "Elle reste ouverte : à vérifier avant de décider.",
      preuve: { libelle: "Distance au rivage marin · Sète", valeur: "point de référence à moins de 100 m du rivage marin", grain: "commune" as const },
    },
    taille: {
      // Issue du registre : `eviter_grandes_villes` examiné, `indeterminate`. Le dossier n'en fait pas de carte ;
      // la phrase ci-dessous décrit cette issue pour l'accueil, elle n'est pas un texte du produit.
      sujet: "une ville à taille humaine",
      description: "Examinée : rien ne penche nettement dans un sens ou dans l'autre, et le dossier n'en fait pas une carte.",
      pedagogique: true,
      population: 44712,
    },
  },

  lectures: {
    avecChaleur: {
      verdict: "Arbitrage",
      titre: "Sète répond moins bien à une de vos priorités : des étés supportables.",
      detail: "La possibilité de se déplacer sans voiture répond en revanche à votre projet. La décision se joue entre cette correspondance et l'écart relevé. Un constat reste par ailleurs à contrôler.",
    },
    sansChaleur: {
      verdict: "Correspondance favorable",
      titre: "Sète répond à l'une de vos priorités : la possibilité de se déplacer sans voiture.",
      detail: "Une partie de vos priorités va dans ce sens.",
    },
    merConfirmee: {
      verdict: "Condition ouverte",
      titre: "Une condition sans compromis reste ouverte à Sète : la proximité de la mer.",
      detail: "Les données disponibles ne permettent pas encore de conclure sur la proximité de la mer. Par ailleurs, Sète répond moins bien à une de vos priorités.",
    },
    merConfirmeeSansChaleur: {
      verdict: "Condition ouverte",
      titre: "Une condition sans compromis reste ouverte à Sète : la proximité de la mer.",
      detail: "Les données disponibles ne permettent pas encore de conclure sur la proximité de la mer.",
    },
  },
} as const;

/** Les horizons de la règle du temps : la référence et les trois paliers DRIAS, en réchauffement France (TRACC). */
export const NUITS_SETE_JALONS = [
  { annee: 1976, jusqua: 2005, libelle: "référence", valeur: "42" },
  { annee: 2030, libelle: "+2 °C", valeur: "67" },
  { annee: 2050, libelle: "+2,7 °C", valeur: "80" },
  { annee: 2100, libelle: "+4 °C", valeur: "102" },
] as const;
