// ════════════════════════════════════════════════════════════════════════════════════════════
// « À VÉRIFIER AVANT DE DÉCIDER » : UNE SEULE TABLE D'ACTIVATION.
//
// Le module Logement portait sa propre liste de gestes (`logement-checklist.ts`) : une table de
// huit règles, un test d'activation par famille, une gestion des postures — le tout en parallèle
// des `LOGEMENT_RULES` du moteur de décision, sur les mêmes faits. Les TEXTES avaient déjà été
// unifiés le 29/07/2026 (`logement-gestes.ts`), après avoir divergé ; il restait deux moteurs
// pour décider QUELS gestes apparaissent, et rien n'aurait dit lequel avait raison.
//
// Cette lib supprime le second. Elle évalue les règles du dossier et rend leurs gestes, en une
// ligne chacun. Ajouter un geste, c'est désormais ajouter une règle : le module et le dossier
// l'obtiennent ensemble, ou ni l'un ni l'autre.
//
// ── CE QUI RESTE PROPRE AU MODULE, ET POURQUOI ────────────────────────────────────────────────
// L'ORDRE. Il est déclaré ici et ne suit PAS l'ordre du tableau `LOGEMENT_RULES` : celui-ci est
// un ordre d'enregistrement, qu'un ajout futur déplacerait sans que personne le décide. La liste
// suit l'ordre des preuves du module, du document à réclamer jusqu'au périmètre patrimonial.
//
// LA FORME. Une ligne « label. détail », là où le dossier dispose d'une face et d'un dépliable.
// C'est la seule différence autorisée entre les deux chemins, et le texte reste le même.
//
// LES INCONNUES NE SONT PAS RENDUES ICI. Une source muette produit un fait `unknown` dans le
// moteur, et le dossier lui consacre sa propre section (« ces données n'ont pas encore pu être
// lues ici »). Le module, lui, liste des GESTES : une donnée illisible n'en fournit aucun.
//
// Pure, testée sous `node --test`.
// ════════════════════════════════════════════════════════════════════════════════════════════

import { LOGEMENT_RULES } from "./logement-rules.ts";
import { gesteEnPhrase, bucketDuProjet } from "./logement-gestes.ts";
import type { HardEvaluation, LogementFacts, ModuleFacts, VerificationFact } from "./decision-fact.ts";
import type { UserProject } from "../user-project.ts";

/**
 * L'ORDRE DES PREUVES, par identifiant de règle. Une règle absente de cette liste s'affiche
 * après les autres, dans l'ordre du moteur : un geste nouveau apparaît, il ne disparaît pas.
 */
const ORDRE: string[] = [
  "logement.diagnostic-non-attribue",
  "logement.dpe-faible",
  "logement.confort-ete",
  "logement.exposition-bati",
  "logement.zone-reglementee",
  "logement.sinistralite",
  "logement.cavite",
  "logement.patrimoine",
];

export type PointAVerifier = { id: string; text: string };

/** Voir l'usage plus bas : les règles Logement ne lisent jamais les contraintes dures. */
const SANS_CONTRAINTES_DURES = {} as HardEvaluation;

/**
 * Les faits minimaux que les règles Logement lisent : `logement` et `nom`. Les autres champs de
 * `ModuleFacts` décrivent la commune et ne sont touchés par AUCUNE de ces règles — vérifié en les
 * lisant, et verrouillé par un test qui évalue la table complète sur cet objet-ci.
 *
 * Le module n'a pas les faits communaux : les demander pour lister des gestes d'adresse
 * coûterait un chargement entier pour des champs que personne ne lit.
 */
function faitsMinimaux(logement: LogementFacts): ModuleFacts {
  return { nom: logement.addressLabel, hasAddress: true, logement } as ModuleFacts;
}

/**
 * Les points à vérifier pour ce logement, dans cette posture.
 *
 * LE PROJET VIENT DU COMPTE, PLUS D'UNE SONDE LOCALE (12/08/2026). `projetDepuisLaSonde`
 * reconstruisait un `UserProject` depuis la réponse d'une sonde qui ne persistait rien et se
 * reposait à chaque visite. Le compte porte déjà l'objectif et l'intention : on les lit. La
 * dérivation de posture reste celle de `bucketDuProjet`, appelée par les règles, et ce module n'en
 * écrit aucune seconde.
 *
 * Un geste vide (le patrimoine pour un locataire, qui ne fait pas ces travaux) ne produit pas de
 * ligne : la règle l'écarte déjà, et ce filtre garde la garantie même si une table de gestes
 * laisse un libellé vide.
 */
export function pointsAVerifier(
  logement: LogementFacts, project: UserProject | null,
): PointAVerifier[] {
  const facts = faitsMinimaux(logement);
  // Sans projet, rien n'est deviné : `bucketDuProjet` rend `neutre` et les règles servent leur
  // version neutre. Une posture par défaut orienterait une checklist d'achat vers un résident.
  // `posture: null` n'est pas une valeur du type persisté (`UserProject` exige une posture) : c'est
  // exactement le sens de « rien n'a été déclaré », que le cast rend explicite. `bucketDuProjet`
  // rend alors `neutre`, ce que les règles savent servir.
  const projet = project ?? ({
    posture: null, intent: null, rawText: null, parsed: null, updatedAt: null,
  } as unknown as UserProject);

  const lignes = LOGEMENT_RULES.flatMap((regle, index) => {
    // Le troisième paramètre porte les CONTRAINTES DURES, qu'aucune règle Logement ne lit : la
    // signature les déclare pour tout le registre, et ces règles-ci les ignorent (elles n'émettent
    // jamais d'incompatibilité, par arbitrage de la slice 1.5). L'objet vide n'est donc jamais
    // déréférencé, et le test qui évalue la table entière le vérifie.
    const evaluation = regle.evaluate(facts, projet, SANS_CONTRAINTES_DURES);
    if (evaluation.outcome !== "verification") return [];
    return evaluation.facts
      .filter((f): f is VerificationFact => f.role === "verification")
      .map((f) => {
        const rang = ORDRE.indexOf(regle.id);
        return {
          id: regle.id,
          rang: rang === -1 ? ORDRE.length + index : rang,
          text: gesteEnPhrase(f.action),
        };
      });
  });

  return lignes
    .filter((l) => l.text.length > 1)
    .sort((a, b) => a.rang - b.rang)
    .map(({ id, text }) => ({ id, text }));
}

/** L'intro de la liste. Elle change avec la posture, jamais avec le nombre de points. */
export function introPointsAVerifier(project: UserProject | null): string {
  // `neutre` est le seul cas où l'on ne sait rien : on le dit, sans deviner une posture.
  return bucketDuProjet(project ?? {}) !== "neutre"
    ? "Voici les points que la lecture de ce logement fait remonter, à documenter selon votre projet."
    : "Ces points viennent de la lecture du logement. Votre projet permettra de les rendre plus précis.";
}
