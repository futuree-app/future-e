// LES CONTRATS DE DONNÉES EXTERNES.
//
// Pourquoi ce fichier existe : `flags.wildfire` a cherché « feux de foret » AU PLURIEL pendant des mois,
// quand GASPAR écrit « Feu de forêt » au SINGULIER. Le drapeau valait donc `false` pour toutes les
// communes de France, et le dossier de décision en concluait qu'une priorité « à l'abri des incendies »
// était satisfaite — sur une commune qui brûlait. Aucun des ~800 tests ne pouvait le voir : ils
// éprouvaient notre logique contre nos propres chaînes, jamais contre celles des sources.
//
// CE QUE CE FICHIER EST. Un corpus de valeurs RÉELLES, relevées sur les API et recopiées telles quelles
// — accents, casse, nombre, ponctuation comprises. C'est une frontière de compatibilité entre les
// fournisseurs et notre modèle : si une valeur change chez eux, un test tombe chez nous.
//
// CE QU'IL N'EST PAS. Un jeu de données de test « représentatif » qu'on écrirait de mémoire. Toute
// valeur ajoutée ici doit avoir été OBSERVÉE, avec sa date et sa commune. Une valeur inventée réintroduit
// exactement le défaut qu'on ferme.
//
// COMMENT L'ÉTENDRE. Quand un bug de parsing apparaît, la valeur qui l'a causé entre ici AVANT le
// correctif. Le corpus grandit alors par les seules formes qui nous ont réellement échappé.

// ── GÉORISQUES / GASPAR — les risques recensés par commune ──────────────────────
// Relevé le 25/07/2026 sur /api/v1/gaspar/risques (12 communes : Lège-Cap-Ferret, Aix-en-Provence,
// Toulouse, Lille, Antibes, Briançon, Nantes, Strasbourg, Rennes, Rouen, Montpellier, Clermont-Ferrand).
export const GASPAR_RISQUES_LABELS = [
  "Inondation",
  "Par une crue à débordement lent de cours d'eau",
  "Par submersion marine",
  "Mouvement de terrain",
  "Avancée dunaire",
  "Feu de forêt", // SINGULIER — la forme qui a causé le bug du 25/07/2026
  "Transport de marchandises dangereuses",
  "Séisme Zone 3",
  "Rupture de barrage",
  "Industriel",
] as const;

// ── GÉORISQUES / GASPAR — les arrêtés de catastrophe naturelle ──────────────────
// Relevé le 25/07/2026 sur /api/v1/gaspar/catnat (12 communes, dont la Corse et La Réunion), champ
// `libelle_risque_jo`. Les dix formes distinctes observées, avec leur fréquence relative en commentaire.
export const GASPAR_CATNAT_LABELS = [
  "Inondations et/ou Coulées de Boue",          // de loin la plus fréquente
  "Sécheresse",
  "Chocs Mécaniques liés à l'action des Vagues",
  "Mouvement de Terrain",
  "Tempête",
  "Glissement de Terrain",
  "Vents Cycloniques",
  "Inondations Remontée Nappe",
  "Grêle",
  "Eboulement et/ou Chute de Blocs",
] as const;

// LES FAMILLES QUE LE PRODUIT AFFICHE. Un libellé qui n'y tombe pas est rendu TEL QUEL au lecteur,
// c'est-à-dire en jargon administratif — le repli de `simplifyCatnatRisk`. C'est acceptable pour une
// forme rare et inconnue, jamais pour une forme courante : d'où le test de couverture.
export const CATNAT_FAMILLES_ATTENDUES = [
  "Inondations", "Sécheresse des sols", "Érosion et impact des vagues", "Mouvements de terrain",
  "Tempête", "Cyclone", "Grêle", "Séisme", "Avalanche", "Neige", "Submersion marine",
] as const;

// ── ADEME / DPE — le type de bâtiment et la classe ──────────────────────────────
// Relevé le 25/07/2026 sur /datasets/dpe03existant/values/type_batiment et /values/etiquette_dpe.
// L'énumération est CLOSE côté source : trois valeurs, en minuscules, sans accent.
export const ADEME_TYPES_BATIMENT = ["appartement", "immeuble", "maison"] as const;
export const ADEME_CLASSES_DPE = ["A", "B", "C", "D", "E", "F", "G"] as const;

// ── BAN (Base Adresse Nationale) — la précision du géocodage ────────────────────
// Relevé le 25/07/2026 sur api-adresse.data.gouv.fr. `housenumber` est la SEULE précision qui autorise
// l'attribution automatique d'un DPE : au-dessus, on ne sait pas de quel bâtiment on parle.
export const BAN_TYPES = ["housenumber", "street", "municipality", "locality"] as const;

// ── EAUFRANCE / ONDE — l'observation des écoulements ────────────────────────────
// Relevé le 25/07/2026 sur /v1/ecoulement/observations (300 observations), champ `libelle_ecoulement`.
// SANS ACCENT sur le E initial — le commentaire du code listait des formes accentuées écrites de
// mémoire, et omettait « Ecoulement visible » tout court, qui existe bel et bien.
//
// Le champ lui-même était faux dans le code (`libelle_observation`, qui n'existe pas) : `isDry` valait
// donc toujours false, et un cours d'eau à sec n'a jamais pu être signalé.
export const ONDE_ECOULEMENTS = [
  "Assec",                          // le plus fréquent de l'échantillon
  "Ecoulement visible faible",
  "Ecoulement visible acceptable",
  "Ecoulement non visible",
  "Ecoulement visible",             // absent du commentaire d'origine
  "Observation impossible",
] as const;

// Les deux seules formes qui signalent un cours d'eau effectivement à sec.
export const ONDE_FORMES_SECHES = ["Assec", "Ecoulement non visible"] as const;

// ── CARTOFRICHES (ADEME) — l'état de pollution du sol d'une friche ──────────────
// Relevé le 29/07/2026 sur /values/sol_pollution_existe (28 373 friches). SEPT valeurs, pas un
// booléen : le champ décrit un ÉTAT DE CONNAISSANCE, exactement comme la doctrine des quatre états.
//
// LA FORME QUI A CAUSÉ LE BUG : toutes. `toFriche` testait `=== true || === "true" || === "1"`, donc
// `sol_pollue` valait `false` pour LES 28 373 FRICHES DE FRANCE, y compris les 485 en pollution
// avérée. Même signature que « feux de foret » au pluriel et `libelle_observation` : une valeur d'API
// jamais confrontée à la source.
//
// ET LE PIÈGE PROPRE À CE CHAMP : « inconnu » (86,6 % des friches) n'est PAS « pollution
// inexistante » (1,9 %). Les réduire tous deux à `false` détruit précisément la distinction qui fait
// la valeur du produit — « ne pas figurer dans une base ≠ sol sain ».
export const CARTOFRICHES_SOL_POLLUTION = [
  "inconnu",                // 24 576 friches — 86,6 %
  "pollution supposée",     //  1 641 — 5,8 %
  "pollution peu probable", //    843 — 3,0 %
  "pollution inexistante",  //    528 — 1,9 %
  "pollution avérée",       //    485 — 1,7 %
  "pollution traitée",      //      8
  "pollution probable",     //      2
] as const;

// La seule forme qui ÉTABLIT une pollution non traitée. « pollution traitée » a son propre état :
// un site dépollué n'appelle pas le même geste qu'un site pollué, et les confondre refaisait en plus
// petit l'erreur du booléen.
export const CARTOFRICHES_POLLUTION_ETABLIE = ["pollution avérée"] as const;

// ── GÉORISQUES / RADON — le potentiel du sol, par commune ───────────────────────
// Relevé le 29/07/2026 sur /api/v1/radon?code_insee= (endpoint public, sans jeton).
//
// LA SOURCE NE DONNE QU'UN CHIFFRE. La réponse est `{ classe_potentiel, code_insee, libelle_commune }`,
// où `classe_potentiel` est la CHAÎNE "1", "2" ou "3" — jamais un nombre, jamais un libellé. Il
// n'existe donc AUCUNE formulation officielle à reprendre : le texte affiché est le nôtre, et à ce
// titre il doit être nommé et versionné comme toute convention de produit.
//
// (L'autre endpoint, `resultats_rapport_risque?latlon=`, dit « Risque Existant - important » : le mot
// « risque » y remplace « potentiel », ce que la source elle-même ne fait pas. On ne le reprend pas.)
export const RADON_CLASSES = ["1", "2", "3"] as const;

// `libelle_commune` vaut `null` sur les codes d'ARRONDISSEMENT (75104, 69389…) alors qu'il porte le
// nom sur les communes ordinaires. Ne jamais s'en servir pour nommer un lieu.
export const RADON_LIBELLE_COMMUNE_NULLABLE = true;
