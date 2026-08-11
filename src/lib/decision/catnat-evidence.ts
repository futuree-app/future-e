// ════════════════════════════════════════════════════════════════════════════════════════════
// LE COMPTE D'ARRÊTÉS INONDATION, DIT UNE SEULE FOIS.
//
// ── LE DÉFAUT QUE CE MODULE FERME ────────────────────────────────────────────────────────────
// Le dossier affichait « Preuve · 7 arrêtés inondation depuis 1982 » et son lien menait à la carte
// « Mémoire des catastrophes » du module Territoire, qui annonce le total TOUS RISQUES relevé en
// direct sur GASPAR : le lecteur cliquait sur 7 et lisait 23. Les deux nombres venaient de la même
// matière (les arrêtés CatNat de GASPAR) par deux chemins différents, avec deux périmètres, deux
// dates et deux classifieurs. « Même source » ne garantit pas « même preuve ».
//
// ── CE QUE CE MODULE GARANTIT ────────────────────────────────────────────────────────────────
// Une seule fabrique, un seul libellé. La règle de décision et la carte du module Territoire
// construisent leur texte ICI, à partir du MÊME objet. Elles ne peuvent plus diverger sans qu'un
// test le voie, parce qu'il n'existe plus deux endroits où écrire la phrase.
//
// ── POURQUOI L'INDEX, ET PAS L'APPEL DIRECT ──────────────────────────────────────────────────
// Le moteur de décision est déterministe et sans réseau : il lit l'index (`comparateur-index.json`,
// alimenté par `scripts/populate-inondation.py`, submersion marine exclue). La carte, elle, a
// l'appel direct sous la main. Faire descendre l'index jusqu'à la carte est le seul sens qui
// marche : l'inverse demanderait au moteur un appel réseau, qu'il refuse par construction.
//
// Le total tous risques de la carte reste ce qu'il est, une information de contexte, relevée en
// direct. Il n'entre pas dans cet objet et ne prétend pas le démontrer.
// ════════════════════════════════════════════════════════════════════════════════════════════

/**
 * L'origine du régime français de catastrophe naturelle (loi du 13 juillet 1982). Le comptage
 * commence là, pour toutes les communes : ce n'est pas la date du premier arrêté de CELLE-CI.
 */
export const CATNAT_DEPUIS = 1982;

/**
 * Version de cet objet de preuve. À relever quand la MATIÈRE change (périmètre du comptage,
 * source, borne temporelle), jamais pour une reformulation. Elle voyage dans le libellé de source
 * afin qu'un dossier figé puisse dire sous quelle convention il a été écrit.
 */
export const CATNAT_EVIDENCE_VERSION = "catnat-1";

export type CatnatInondation = {
  /** Arrêtés de catastrophe naturelle INONDATION (fluviale et pluviale, submersion marine exclue). */
  count: number;
  /** Année d'origine du comptage, commune à toutes les communes. */
  depuis: number;
  /** D'où vient ce compte. Une seule valeur aujourd'hui, et c'est le point : il n'y a qu'un chemin. */
  origine: "index_local";
  version: string;
};

/** L'entrée d'index, réduite à ce dont ce module a besoin. */
type EntreeIndex = { inondation?: { catnat: number } | null } | null | undefined;

/**
 * L'objet, depuis l'index. `null` quand la commune n'a pas de comptage : une absence de donnée
 * n'est pas un zéro, et rien ne doit s'afficher dans ce cas.
 */
export function catnatInondationDepuisIndex(entry: EntreeIndex): CatnatInondation | null {
  const count = entry?.inondation?.catnat;
  if (typeof count !== "number" || !Number.isFinite(count)) return null;
  return { count, depuis: CATNAT_DEPUIS, origine: "index_local", version: CATNAT_EVIDENCE_VERSION };
}

/** Le même objet, depuis le moteur, qui n'a que le nombre sous la main (`ModuleFacts`). */
export function catnatInondationDepuisCompte(count: number | null | undefined): CatnatInondation | null {
  if (typeof count !== "number" || !Number.isFinite(count)) return null;
  return { count, depuis: CATNAT_DEPUIS, origine: "index_local", version: CATNAT_EVIDENCE_VERSION };
}

/**
 * LA PHRASE, ÉCRITE UNE SEULE FOIS.
 *
 * C'est elle que porte la pastille du dossier, et c'est elle que la carte du module affiche sous
 * son total. Deux formulations voisines suffiraient à rouvrir le défaut : le lecteur qui compare
 * ne compare pas des données, il compare des phrases.
 *
 * « arrêtés inondation », jamais « arrêtés CatNat » : le jargon masquait justement ce que le
 * compte recouvre, et le lecteur doit savoir que la submersion marine n'y est pas.
 */
export function libelleCatnatInondation(o: CatnatInondation): string {
  const pluriel = o.count > 1 ? "s" : "";
  return `${o.count} arrêté${pluriel} inondation depuis ${o.depuis}`;
}

/**
 * LA PHRASE DU CONSTAT, plus explicite que celle de la pastille, et c'est délibéré.
 *
 * Le constat est une phrase de prose : il peut nommer le régime en entier (« catastrophe
 * naturelle »), que la pastille abrège faute de place. Les deux formes vivent ICI, côte à côte,
 * parce que la tentation est justement de les écrire chacune de son côté et de les laisser dériver.
 *
 * Ce qui doit être IDENTIQUE, c'est ce que le lecteur compare : la pastille et la carte qu'elle
 * vise. Le constat, lui, est lu au même endroit que la pastille, jamais en regard d'elle.
 */
export function phraseConstatCatnatInondation(o: CatnatInondation): string {
  const pluriel = o.count > 1 ? "s" : "";
  return `${o.count} arrêté${pluriel} de catastrophe naturelle inondation depuis ${o.depuis}`;
}

/**
 * Le libellé de SOURCE, pour « Données et limites ». Il porte la version de la convention : un
 * dossier figé doit pouvoir dire sous quelle règle son compte a été établi.
 */
export function sourceCatnatInondation(o: CatnatInondation): string {
  return `Arrêtés CatNat inondation (GASPAR), submersion marine exclue · ${o.version}`;
}
