// CE QU'ON MESURE DU CONTRÔLE PRIORITAIRE, ET RIEN DE PLUS.
//
// La question à laquelle cette instrumentation sert à répondre est qualitative : « après avoir lu
// votre dossier, savez-vous quelle est la première chose que vous allez vérifier ? » Elle se pose en
// entretien. Ce que la mesure peut apporter, c'est le CADRAGE de cette question : sur quels sujets le
// contrôle prioritaire tombe réellement, et si quelqu'un s'en sert pour aller voir la carte.
//
// DEUX RÈGLES DE CONFIDENTIALITÉ, tenues ici plutôt que sur chaque appel :
//   - aucune adresse, aucun libellé rédigé, aucune saisie du lecteur ne part. Le libellé du geste est
//     réduit à un TYPE (demander / regarder / consulter / faire faire), jamais transmis mot pour mot ;
//   - l'identifiant de carte porte parfois le code INSEE en préfixe (« 31555:composition-argiles-ppr »).
//     Il est retiré : le sujet suffit à la question posée, et l'événement n'a pas à situer le lecteur.
//
// Lib PURE, testée : la classification est un choix éditorial, elle ne doit pas vivre dans un onClick.

/**
 * LE SUJET DE LA CARTE VISÉE, SANS LE PRÉFIXE D'IDENTITÉ.
 *
 * ON COUPE AU PREMIER « : », QUELLE QUE SOIT LA FORME DU PRÉFIXE, et c'est délibéré. La première
 * version filtrait `^\d{5}:` — cinq chiffres. Elle laissait donc passer la Corse (« 2A004: »,
 * « 2B033: »), c'est-à-dire exactement les communes où un code identifie le plus étroitement, et
 * elle aurait laissé passer n'importe quel futur préfixe (département, identifiant de dossier).
 *
 * Une règle de forme échoue en laissant fuir ce qu'elle n'avait pas prévu ; une règle de structure
 * échoue en retirant un peu trop. Sur une propriété d'événement dont l'engagement écrit est « rien
 * ne situe le lecteur », c'est la seconde erreur qu'il faut préférer. La convention du moteur est
 * `<identité>:<sujet>` (cf. `dossier-anchors.ts`), et aucun sujet ne porte de « : ».
 */
export function sujetDuControle(anchorId: string): string {
  const i = anchorId.indexOf(":");
  return i === -1 ? anchorId : anchorId.slice(i + 1);
}

/**
 * LE TYPE DE GESTE, DÉRIVÉ DU VERBE. La table des gestes (`logement-gestes.ts`) pose que « le verbe
 * nomme le geste réel » : c'est donc lui, et lui seul, qui porte la nature de l'action. Quatre types,
 * parce que ce sont quatre coûts très différents pour le lecteur : poser une question à quelqu'un,
 * regarder soi-même, aller chercher un document, ou faire intervenir un tiers.
 */
export type TypeDeGeste = "demander" | "regarder" | "consulter" | "faire_faire" | "autre";

export function typeDeGeste(label: string): TypeDeGeste {
  const l = label.trim().toLowerCase();
  if (/^faites?\b/.test(l)) return "faire_faire";
  if (/^demandez\b/.test(l)) return "demander";
  if (/^(regardez|surveillez|suivez|notez|photographiez|repérez)\b/.test(l)) return "regarder";
  if (/^(consultez|lisez|renseignez-vous|retrouvez|gardez)\b/.test(l)) return "consulter";
  return "autre";
}

export type ControlOrdre = "priorite" | "ensuite";

/** Les propriétés de l'événement d'AFFICHAGE : ce que le dossier a proposé de contrôler d'abord. */
export function proprietesAffichage(
  actions: { label: string; anchorId: string }[], ordre: ControlOrdre, cliquables: number,
): Record<string, unknown> {
  return {
    ordre,
    actions_count: actions.length,
    // Combien de démarches mènent réellement à leur carte. Un écart avec `actions_count` veut dire
    // qu'une démarche est restée du texte : c'est le défaut à voir, pas une statistique de confort.
    actions_liees: cliquables,
    sujets: actions.map((a) => sujetDuControle(a.anchorId)),
    types: actions.map((a) => typeDeGeste(a.label)),
  };
}

/** Les propriétés de l'événement d'ACTIVATION : la démarche sur laquelle le lecteur est allé voir. */
export function proprietesActivation(
  action: { label: string; anchorId: string }, position: number, ordre: ControlOrdre,
): Record<string, unknown> {
  return {
    ordre,
    position,
    sujet: sujetDuControle(action.anchorId),
    type: typeDeGeste(action.label),
  };
}
