// QUEL REGISTRE DU DOSSIER UNE CARTE DU MODULE FONDE-T-ELLE ?
//
// Le filet coloré en tête des cartes du module Territoire disait le THÈME du groupe (décor, climat,
// risques). Toutes les cartes d'un groupe portaient donc la même teinte, répétée sous un surtitre qui
// la disait déjà : la couleur ne distinguait plus rien, et un filet automatique sur chaque carte est
// l'un des signes les plus reconnaissables d'une interface générée (DESIGN.md § 6.2).
//
// La couleur redevient une affirmation vérifiable en disant autre chose : **cette donnée participe à
// telle conclusion de VOTRE dossier**. Elle ne juge pas le fait (trente jours de chaleur ne sont ni
// bons ni mauvais dans l'absolu, et l'ADR-0001 interdit le verdict synthétique) ; elle dit sa
// relation au projet déclaré.
//
// Le lien existe déjà dans les deux sens : une carte déclare les phénomènes qu'elle démontre
// (`targets`), une preuve du dossier déclare le phénomène qu'elle établit (`EvidenceRef.targetKey`).
// Ce module ne fait que refermer la boucle.
//
// QUATRE RÈGLES, et elles se suffisent :
//   1. Sans projet, donc sans dossier, aucune carte n'a de filet. La couleur exprime une relation au
//      projet : sans projet il n'y a rien à exprimer.
//   2. Une carte dont aucun phénomène n'est cité par le dossier n'a pas de filet.
//   3. Une carte dont tous les phénomènes cités convergent vers UN registre porte sa teinte.
//   4. Une carte citée par PLUSIEURS registres différents n'a pas de filet, pour ne pas choisir une
//      priorité arbitraire — SAUF si l'un d'eux est l'incompatibilité, qui l'emporte toujours.
//
// L'exception de la règle 4 n'est pas une commodité. Une incompatibilité BLOQUE le dossier, et le
// code lui donne déjà ce statut à part : `dossier-view.ts` lui fait absorber les autres sections.
// L'effacer parce qu'un alignement coexiste sur la même carte perdrait l'information la plus grave de
// l'écran.
//
// Le système s'auto-régule : la couleur devient rare parce qu'une carte doit réellement participer à
// la décision pour en porter une.

import type { Dossier, DossierCard } from "./decision-fact.ts";
import type { EvidenceTargetKey } from "./evidence-targets.ts";

export type RegisterKey = Dossier["sections"][number]["key"];

/** La table `phénomène -> registres qui le citent`, construite depuis un dossier déjà assemblé. */
export function registersByTarget(dossier: Dossier | null): Map<EvidenceTargetKey, Set<RegisterKey>> {
  const table = new Map<EvidenceTargetKey, Set<RegisterKey>>();
  if (!dossier) return table;

  for (const section of dossier.sections) {
    for (const card of section.cards) {
      for (const key of targetsOfCard(card)) {
        const set = table.get(key) ?? new Set<RegisterKey>();
        set.add(section.key);
        table.set(key, set);
      }
    }
  }
  return table;
}

/**
 * Les phénomènes qu'une carte du dossier établit, quelle que soit sa forme.
 *
 * PARCOURS RÉCURSIF, et c'est un choix. Six formes de fait et quatre de composition ne rangent pas
 * leurs `EvidenceRef` au même endroit : un compromis les met dans ses deux `sides`, un tradeoff dans
 * `favorableSide` et `unfavorableSide`, une vérification groupée dans ses `items`, une preuve
 * partagée dans `sharedEvidence` et dans chaque `consequence`. Une extraction écrite forme par forme
 * serait juste aujourd'hui et fausse au premier patron ajouté, **en silence**.
 *
 * Le parcours ne cherche qu'une chose, `targetKey`, dont le type est fermé. Le pire cas d'un objet
 * inattendu est zéro clé trouvée, donc une carte sans filet : jamais un filet qui ment.
 */
function targetsOfCard(card: DossierCard): EvidenceTargetKey[] {
  const keys: EvidenceTargetKey[] = [];
  const seen = new Set<unknown>();

  const walk = (node: unknown): void => {
    if (node === null || typeof node !== "object") return;
    if (seen.has(node)) return;
    seen.add(node);

    if (Array.isArray(node)) {
      for (const item of node) walk(item);
      return;
    }
    for (const [key, value] of Object.entries(node)) {
      if (key === "targetKey" && typeof value === "string") {
        keys.push(value as EvidenceTargetKey);
        continue;
      }
      walk(value);
    }
  };

  walk(card);
  return keys;
}

/**
 * Le registre qu'une carte de module doit porter, ou `null` pour aucun filet.
 * `targets` sont les phénomènes que la carte démontre.
 */
export function registerForCard(
  targets: readonly EvidenceTargetKey[] | undefined,
  table: Map<EvidenceTargetKey, Set<RegisterKey>>,
): RegisterKey | null {
  if (!targets || targets.length === 0) return null;

  const found = new Set<RegisterKey>();
  for (const target of targets) {
    for (const register of table.get(target) ?? []) found.add(register);
  }

  if (found.size === 0) return null;
  // L'incompatibilité l'emporte, y compris sur une convergence multiple : elle bloque.
  if (found.has("incompatibilities")) return "incompatibilities";
  if (found.size === 1) return [...found][0];
  return null;
}
