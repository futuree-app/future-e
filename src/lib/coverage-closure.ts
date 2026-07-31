// ════════════════════════════════════════════════════════════════════════════════════════════
// LE VERROU DE LA CLÔTURE : une absence de mesure ne se lit pas comme une absence de problème.
//
// CE QUI S'EST PASSÉ. Le 30/07/2026, la lecture d'une adresse rurale sans diagnostic se terminait
// par « L'adresse ne porte pas d'enjeu structurant identifié », après quatre sections disant qu'on
// ne savait pas. La cause était une consigne du prompt, corrigée le jour même, et la couverture
// des dimensions est depuis un fait du payload.
//
// POURQUOI UN VERROU EN PLUS. Une consigne de prompt est une prière, pas une garantie. Cette route
// produit de la prose libre, sans plan ni schéma, contrairement à la conclusion du dossier qui
// passe par `validateGeneratedBlocks`. Un changement de modèle, une reformulation du système, et
// la règle se reperd sans que rien ne le signale. Ce module la rend VÉRIFIABLE.
//
// LA RÈGLE, ET POURQUOI ELLE EST POSITIVE. On ne cherche pas à interdire des tournures : la langue
// en invente toujours une de plus, et « rien de structurant ne ressort de ce qui a pu être lu » est
// une bonne phrase que n'importe quel filtre sur « rien de structurant » rejetterait. On exige
// l'inverse : quand une dimension n'a pas pu être lue, le texte doit la NOMMER. Un texte qui nomme
// son inconnue ne peut pas la faire passer pour une absence de problème.
//
// S'y ajoute une liste NOIRE minuscule, réservée aux formulations effectivement observées en
// production. Elle ne remplace pas la règle positive, elle attrape le cas connu plus tôt.
//
// Pur, testé sous `node --test`.
// ════════════════════════════════════════════════════════════════════════════════════════════

/** Les dimensions que la couverture sait décrire, et les mots par lesquels un texte les nomme. */
const MOTS_PAR_DIMENSION: Record<string, string[]> = {
  "la performance énergétique de ce logement": ["energetique", "energie", "diagnostic"],
  // PAS de « ete » seul : après normalisation des accents, il matcherait « a été lu », donc
  // n'importe quel texte français, et le verrou ne verrouillerait plus rien.
  "son comportement en été": ["en ete", "d'ete", "chaleur", "chaudes", "canicul"],
  "ce à quoi son adresse est exposée": ["expos", "aleas", "risque"],
  "les sinistres indemnisés dans la commune": ["sinistr", "assur", "indemnis"],
};

/**
 * Formulations observées en production qui affirment le calme À L'ÉCHELLE DE L'ADRESSE, donc
 * au-delà de ce qui a été lu. Volontairement peu nombreuses et littérales : une liste noire large
 * rejetterait des phrases justes.
 */
const FORMULATIONS_INTERDITES = [
  "ne porte pas d'enjeu structurant identifie",
  "ne porte aucun enjeu",
  "aucun enjeu structurant identifie",
];

function fold(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // diacritiques combinants, en échappements
    .replace(/[\u2019\u2018]/g, "'") // apostrophes typographiques
    .toLowerCase();
}

export type ClosureVerdict =
  | { ok: true }
  | { ok: false; raison: "dimension_non_nommee" | "calme_global"; detail: string };

/**
 * Le texte respecte-t-il la couverture ?
 *
 * `nonLues` est la liste des dimensions qui n'ont pas pu être lues, telle que
 * `buildCoverage` la produit. Vide, il n'y a rien à vérifier : le texte a le droit de conclure
 * sur l'ensemble.
 */
export function validateCoverageClosure(text: string, nonLues: string[]): ClosureVerdict {
  if (nonLues.length === 0) return { ok: true };

  const t = fold(text);

  for (const interdite of FORMULATIONS_INTERDITES) {
    if (t.includes(interdite)) {
      return {
        ok: false,
        raison: "calme_global",
        detail: `Le texte affirme le calme de l'adresse entière (« ${interdite} ») alors que ${nonLues.length} dimension(s) n'ont pas pu être lues.`,
      };
    }
  }

  // La règle positive : au moins une dimension non lue doit être nommée. Elle est volontairement
  // au « au moins une » plutôt qu'au « toutes » : le prompt demande une seule phrase, et exiger
  // quatre mentions rejetterait un texte correct. Ce qu'on empêche, c'est le SILENCE complet sur
  // les inconnues, qui est le défaut observé.
  const nommee = nonLues.some((dim) => {
    const mots = MOTS_PAR_DIMENSION[dim];
    if (!mots) return true; // dimension inconnue de la table : on ne bloque pas sur une lacune à nous
    return mots.some((m) => t.includes(m));
  });

  if (!nommee) {
    return {
      ok: false,
      raison: "dimension_non_nommee",
      detail: `Aucune des dimensions non lues n'est nommée dans le texte : ${nonLues.join(", ")}.`,
    };
  }

  return { ok: true };
}

/**
 * La consigne ajoutée au second essai, quand le premier a échoué. Elle nomme le défaut constaté
 * plutôt que de répéter la règle générale : un modèle qui vient de l'enfreindre a besoin qu'on
 * lui dise ce qu'il a fait, pas qu'on lui relise le règlement.
 */
export function correctionPourClosure(verdict: Extract<ClosureVerdict, { ok: false }>, nonLues: string[]): string {
  return [
    "Votre texte précédent a été refusé.",
    verdict.detail,
    "",
    "Reprenez-le en tenant la règle : le calme ne peut être affirmé que sur ce qui a pu être lu,",
    "et la clôture doit nommer ce qui ne l'a pas été, en une phrase, sans dramatiser et sans",
    "prescrire de geste. Les dimensions à nommer, telles quelles :",
    nonLues.map((d) => `- ${d}`).join("\n"),
  ].join("\n");
}
