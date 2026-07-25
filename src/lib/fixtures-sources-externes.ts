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
