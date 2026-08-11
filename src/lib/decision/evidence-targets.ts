// LA CLÉ SÉMANTIQUE D'UN PHÉNOMÈNE, partagée par le moteur de décision et les modules du rapport.
//
// Le problème qu'elle résout : une chip « Preuve · PM2,5 12,3 µg/m³ » du dossier renvoyait vers
// `/rapport/quartier` — le HAUT du module, devant le hero. Le lecteur devait retrouver lui-même la
// carte qui démontre ce qu'il vient de lire. Le dossier RÉSUME la preuve ; le module la DÉMONTRE ; il
// manquait le fil entre les deux.
//
// POURQUOI PAS UNE TABLE `ruleId -> composant` : elle coupleraient les règles du moteur à
// l'organisation actuelle des cartes. Une carte fusionnée ou déplacée laisserait un lien techniquement
// valide et sémantiquement faux — le pire des cas, puisque rien ne le signale.
//
// POURQUOI PAS `factId` NI `ruleId` COMME ANCRE : ils reflètent une source, une convention de calcul,
// une version de règle. L'ancre est une URL — partagée, remise en signet, rechargée : elle doit
// survivre à un changement de fournisseur de données ou au renommage d'une règle.
//
// LA CLÉ NOMME DONC LE PHÉNOMÈNE, ni la règle ni la carte. Une carte peut en porter plusieurs (la
// carte climatique présente la chaleur ET les nuits tropicales), et plusieurs règles peuvent viser la
// même : ce sont deux mondes qui se rejoignent sur un vocabulaire, pas deux structures couplées.
export type EvidenceTargetKey =
  // climat
  | "climate.extreme_heat"
  | "climate.tropical_nights"
  | "climate.mean_temperature"
  | "climate.heavy_rain"
  // risques
  | "risk.flooding"
  | "risk.catnat"
  | "risk.wildfire"
  // Le catalogue ne contient QUE des phénomènes reliés des deux côtés : une preuve qui les vise, et une
  // carte qui les démontre. Submersion marine, feu de forêt, sécheresse des sols et taux de boisement ont
  // leur carte dans le module Territoire mais aucune règle ne les cite encore : les inscrire ici ferait
  // croire, à la lecture, que le lien existe. Ils reviendront avec la preuve qui les portera (le feu, par
  // exemple, avec le lot « feu en mismatch »).
  // cadre
  | "nature.green_spaces"
  | "nature.forest_cover"
  // logement (grain adresse)
  | "housing.energy_label"
  | "housing.clay_shrink_swell"
  | "housing.regulated_zone";

// LE MODULE QUI DÉMONTRE CHAQUE PHÉNOMÈNE. Sert à construire le lien, et surtout à VÉRIFIER : une clé
// déclarée « territoire » dont aucune carte du module Territoire ne se réclame est un lien orphelin.
// Le test de couverture (evidence-targets.test.ts) le fait échouer avant qu'il n'atteigne un lecteur.
export const EVIDENCE_TARGET_MODULE: Record<EvidenceTargetKey, "territoire" | "logement"> = {
  "climate.extreme_heat": "territoire",
  "climate.tropical_nights": "territoire",
  "climate.mean_temperature": "territoire",
  "climate.heavy_rain": "territoire",
  "risk.flooding": "territoire",
  // Les arrêtés de catastrophe naturelle ont leur propre carte (« Mémoire des catastrophes ») :
  // la preuve qui les compte doit y mener, et non à la carte du zonage inondation, qui n'en dit rien.
  "risk.catnat": "territoire",
  "risk.wildfire": "territoire",
  "nature.green_spaces": "territoire",
  "nature.forest_cover": "territoire",
  "housing.energy_label": "logement",
  "housing.clay_shrink_swell": "logement",
  "housing.regulated_zone": "logement",
};

const MODULE_PATH: Record<"territoire" | "logement", string> = {
  territoire: "/rapport/quartier",
  logement: "/rapport/logement",
};

// L'ANCRE DOM, côté module. Un fragment NATIF (« #evidence-climate-extreme-heat ») plutôt qu'un
// paramètre à interpréter (« #evidence=climate.extreme_heat ») : le navigateur fait le saut lui-même,
// donc le lien fonctionne sans JavaScript. Le script n'ajoute que le confort — centrage, focus, halo.
export function evidenceAnchorId(key: EvidenceTargetKey): string {
  // Le point ET le tiret bas : « climate.extreme_heat » donne « evidence-climate-extreme-heat ». Un
  // fragment se lit et se partage à la main ; les tirets bas y font des mots collés à l'affichage
  // (soulignement de lien) et se retapent mal.
  return `evidence-${key.replace(/[._]/g, "-")}`;
}

// LE LIEN vers la démonstration. Sans clé, on retombe sur le module seul : c'est le FALLBACK assumé —
// le lecteur arrive en haut d'un module qui parle bien du sujet, plutôt que nulle part. Le libellé de
// la chip ne promet donc jamais une mesure précise, seulement « le détail dans ce module ».
export function evidenceHref(
  key: EvidenceTargetKey | undefined, fallback: string, provenance?: string,
): string {
  if (!key) return fallback;
  // ── LE LIEN DIT DE QUEL DOSSIER IL VIENT (revue du 11/08/2026) ────────────────────────────────
  // La commune ne suffit pas à identifier une preuve. Un lecteur qui possède plusieurs artefacts sur
  // la même commune (le dossier communal et un ou plusieurs biens) cliquait depuis le bien A et
  // pouvait voir la preuve figée du bien B, ou celle d'un artefact communal plus récent : le module
  // d'arrivée prenait simplement le dernier snapshot de la commune.
  //
  // `preuve` porte donc le `scopeKey` de l'artefact d'où le lien est émis, la même identité que
  // `artifactScopeKey`. Il est indicatif au sens de la sécurité : la lecture reste filtrée par
  // `user_id`, un identifiant fabriqué ne désigne rien d'autre que les artefacts du lecteur.
  const cible = `${MODULE_PATH[EVIDENCE_TARGET_MODULE[key]]}#${evidenceAnchorId(key)}`;
  if (!provenance) return cible;
  return `${MODULE_PATH[EVIDENCE_TARGET_MODULE[key]]}?preuve=${encodeURIComponent(provenance)}#${evidenceAnchorId(key)}`;
}
