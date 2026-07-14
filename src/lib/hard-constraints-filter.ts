// L'ADAPTATEUR COMPARATEUR. Il traduit l'évaluation canonique en politique de RECHERCHE : dans le doute
// (donnée communale absente), ne pas proposer. Il rend deux choses, là où passesHard n'en rendait qu'une :
//
//   eligible : cette commune peut être proposée
//   complete : TOUTES les contraintes déclarées ont pu être APPLIQUÉES
//
// Le second existe parce que le premier ne suffisait pas à dire la vérité. Une référence non résolue
// (« la gare Matabiau ») laissait la commune éligible, et le comparateur affichait ses résultats comme
// s'ils respectaient toutes les conditions du lecteur. `complete: false` lui interdit cette phrase.
import { lieuEnPhrase } from "./hard-constraints.ts";
import type { HardConstraintAssessment, HardConstraintKey, UnexaminedReason } from "./hard-constraints.ts";

export type HardFilterResult = {
  // La commune peut être PROPOSÉE. Une commune retenue à la frontière l'est aussi : on ne supprime pas une
  // possibilité à cause d'une limite de mesure.
  eligible: boolean;
  // TOUTES les contraintes déclarées ont pu être APPLIQUÉES. Une commune-frontière ne l'est jamais : elle
  // est retenue, elle n'est pas confirmée. La souplesse de l'affichage ne contamine pas la vérité du
  // moteur.
  complete: boolean;
  satisfied: HardConstraintAssessment[];
  incompatible: HardConstraintAssessment[];
  unapplied: HardConstraintAssessment[];
  // RETAINED_BOUNDARY : le noyau n'a pas pu trancher pour CETTE commune (son point tombe dans la bande de
  // tolérance de la géométrie). Le comparateur la garde, et le dit. Il ne la fait pas passer pour
  // conforme, et il ne l'efface pas non plus.
  boundary: HardConstraintAssessment[];
};

// LE PARTAGE N'EST PAS ENTRE LES RAISONS « GRAVES » ET LES AUTRES : il est entre le COMMUNAL et le GLOBAL,
// et, parmi le communal, entre ce qu'on ne saura jamais et ce qu'on ne sait pas trancher.
//
// COMMUNE_LEVEL (la donnée de CETTE commune manque : altitude, relief, population) : on exclut. Dans le
// doute, on ne propose pas, et il n'y a rien à dire au lecteur qu'il puisse lever.
//
// BOUNDARY (le point de CETTE commune tombe dans la bande de tolérance de l'isochrone) : on RETIENT, et on
// marque. L'exclure serait supprimer une possibilité à cause d'une limite de MESURE, et la frontière des
// 30 minutes traverse précisément la couronne où le lecteur cherche : 24 des 31 communes de l'aire
// toulousaine y tombent. La laisser passer sans rien dire serait la faire passer pour conforme.
//
// GLOBAL (le lieu n'est pas résolu, le mode manque, le routeur est tombé) : la raison ne dépend pas de la
// commune testée, elle est vraie pour les 35 000. Exclure exclurait TOUT LE MONDE, et le lecteur recevrait
// zéro résultat sans comprendre pourquoi. On ne filtre pas, et on le DIT (complete: false).
const COMMUNE_LEVEL: UnexaminedReason[] = ["missing_data"];
const BOUNDARY: UnexaminedReason[] = ["insufficient_precision"];

export function hardFilter(assessments: HardConstraintAssessment[]): HardFilterResult {
  const satisfied = assessments.filter((a) => a.status === "satisfied");
  const incompatible = assessments.filter((a) => a.status === "incompatible");
  const unexamined = assessments.filter((a) => a.status === "unexamined");
  const excludedByData = unexamined.filter((a) => a.status === "unexamined" && COMMUNE_LEVEL.includes(a.reason));
  const boundary = unexamined.filter((a) => a.status === "unexamined" && BOUNDARY.includes(a.reason));
  const unapplied = unexamined.filter(
    (a) => a.status === "unexamined" && !COMMUNE_LEVEL.includes(a.reason) && !BOUNDARY.includes(a.reason),
  );

  return {
    eligible: incompatible.length === 0 && excludedByData.length === 0,
    // Une commune-frontière n'est PAS complète : la contrainte n'a pas été appliquée pour elle. C'est ce
    // qui interdit au comparateur d'écrire « ces communes respectent toutes vos conditions », et au dossier
    // de faire monter la couverture.
    complete: unexamined.length === 0,
    satisfied,
    incompatible,
    unapplied,
    boundary,
  };
}

// Le libellé de ce qui n'a PAS pu être appliqué, pour le DIRE au lecteur. Le `detail` porte son mot
// (« Gare Matabiau ») ; sans lui, on retombe sur la catégorie.
const UNAPPLIED_LABELS: Record<HardConstraintKey, (detail?: string) => string> = {
  departements: () => "les départements visés",
  zones: (d) => (d ? `une zone que nous n'avons pas reconnue (${d})` : "les zones géographiques visées"),
  excludeZones: (d) => (d ? `une zone à éviter que nous n'avons pas reconnue (${d})` : "les zones à éviter"),
  montagne: () => "l'exigence de montagne",
  reliefProche: () => "la proximité du relief",
  nearSea: () => "la proximité de la mer",
  excludeSea: () => "l'éloignement de la mer",
  // Le lieu est NOMMÉ comme le lecteur l'a posé : « la proximité de la gare Matabiau », jamais
  // « la proximité de Gare Matabiau, Toulouse » (la forme d'index), ni « la proximité d'un lieu ».
  nearPlace: (d) => (d ? `la proximité de ${lieuEnPhrase(d)}` : "la proximité d'un lieu"),
  communeSize: () => "la taille de la commune",
  excludePlace: (d) => (d ? `le fait de quitter ${lieuEnPhrase(d)}` : "les villes à quitter"),
  sizeRelativeTo: (d) => (d ? `la taille relative à ${lieuEnPhrase(d)}` : "la taille relative à une ville"),
};

export function unappliedLabels(r: HardFilterResult): string[] {
  return r.unapplied.map((a) =>
    UNAPPLIED_LABELS[a.key](a.status === "unexamined" ? a.detail : undefined),
  );
}
