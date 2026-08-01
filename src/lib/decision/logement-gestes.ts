// LES GESTES DU MODULE LOGEMENT — SOURCE UNIQUE. Lib PURE (aucune I/O, aucun `node:`) : elle est lue
// par les règles du moteur de décision (`logement-rules.ts`), qui alimentent aussi bien le dossier
// que la liste « à vérifier » du module (`logement-verifications.ts`).
//
// POURQUOI ELLE EXISTE. Le module portait sa propre table de textes pour LES MÊMES faits : six
// gestes sur sept étaient écrits deux fois. Ce n'était pas seulement redondant — les deux copies
// avaient DIVERGÉ. Celle de la checklist est restée à la première génération et commençait par
// « Vérifier », que le moteur a explicitement rejeté depuis : « cinq libellés sur sept commençaient
// par Vérifiez ; empilés sur une colonne de cartes, ils se lisaient comme un formulaire, et ils
// contredisaient le lexique que le dossier applique dix lignes plus haut ». Le lecteur recevait donc
// deux formulations du même geste selon l'endroit où il regardait.
//
// LES TEXTES ONT ÉTÉ UNIFIÉS ICI LE 29/07/2026 ; L'ACTIVATION L'A ÉTÉ LE 01/08. Entre les deux, il
// restait deux moteurs pour décider QUELS gestes apparaissent, sur les mêmes faits.
//
// LE VERBE NOMME LE GESTE RÉEL : Regardez / Demandez / Consultez / Signalez / Suivez / Faites
// chiffrer. Chacun dit ce que la personne va effectivement faire.
//
// TROIS PRÉCAUTIONS TENUES DANS TOUTE LA TABLE :
//   - aucun `detail` n'affirme un droit ni un délai (« le diagnostic vaut dix ans ») : ce sont des
//     affirmations juridiques non sourcées dans le produit (invariant 3). On décrit la PRATIQUE ;
//   - aucun `detail` ne promet un résultat (« un diagnostic lève le doute ») : invariant 5 ;
//   - aucune posture n'est culpabilisée. La variante `reside` ne dit jamais « vous auriez dû », elle
//     documente ce qu'il reste à faire.
//
// FORME : le `label` est la ligne de FACE, bornée à 70 caractères, SANS point final ; le `detail`
// descend dans le dépliable, sous « À vérifier ».

/** La posture du projet. `neutre` = avant toute déclaration : on ne suppose rien. */
export type Bucket = "neutre" | "achat" | "reside" | "location";

/**
 * LA POSTURE DÉRIVÉE DU PROJET. Vivait dans `logement-rules.ts` ; remontée ici le 29/07/2026 parce
 * qu'une règle de TERRITOIRE peut proposer un geste à faire DANS le logement — le radon en est le
 * premier cas. L'échelle du constat et celle de l'action ne coïncident pas toujours.
 */
export function bucketDuProjet(p: { intent?: string | null; posture?: string | null }): Bucket {
  if (p.intent === "achat") return "achat";
  if (p.intent === "location") return "location";
  if (p.posture === "habitant") return "reside";
  return "neutre";
}

export type ActionCopy = { label: string; detail: string };

/** Les gestes que le module Logement sait proposer. Un par famille de constat. */
export type GesteKey =
  | "energie" | "confort" | "bati" | "reglementaire" | "cavite" | "patrimoine" | "sinistralite"
  | "radon" | "diagnostic_adresse";

export const GESTES: Record<GesteKey, Record<Bucket, ActionCopy>> = {
  // DIAGNOSTIC NON ATTRIBUÉ (31/07/2026). Se déclenche quand l'adresse porte des diagnostics mais
  // qu'aucun n'a pu être rattaché au logement examiné — le cas ordinaire d'un immeuble, où la base
  // en contient parfois plus de vingt. Sans ce geste, AUCUN geste énergie ne se proposait dans ce
  // cas, puisque la règle `energie` exige une étiquette : le lecteur repartait avec une incertitude
  // et rien à en faire.
  //
  // Le numéro à treize caractères est la seule question qui la lève, et c'est une question que le
  // vendeur ou le bailleur peut répondre sans effort : il figure sur le document qu'il détient.
  diagnostic_adresse: {
    achat: { label: "Demandez le numéro du diagnostic de ce logement", detail: "Treize caractères, sur le document remis avec le dossier de diagnostic technique. Il désigne un logement précis, là où l'adresse seule en désigne plusieurs." },
    location: { label: "Demandez au bailleur le diagnostic de ce logement", detail: "Son numéro à treize caractères distingue ce logement des autres diagnostics de l'immeuble." },
    reside: { label: "Retrouvez le numéro du diagnostic de votre logement", detail: "Il figure sur le document remis à l'achat ou à l'entrée dans les lieux, et il vaut pour ce logement seul." },
    neutre: { label: "Demandez le numéro du diagnostic de ce logement", detail: "Treize caractères qui désignent un logement précis, là où l'adresse seule en désigne plusieurs." },
  },
  energie: {
    achat: { label: "Faites chiffrer les travaux d'amélioration", detail: "Demandez des devis avant de vous engager : isolation, chauffage, ventilation." },
    location: { label: "Demandez la date du diagnostic et les factures réelles", detail: "L'étiquette date d'un diagnostic ; les factures des derniers hivers disent ce que ça coûte vraiment." },
    reside: { label: "Gardez la trace des travaux déjà engagés", detail: "Devis et factures d'isolation ou de chauffage documentent l'écart avec l'étiquette affichée." },
    neutre: { label: "Regardez le détail du diagnostic et sa date", detail: "L'étiquette résume ; le détail dit d'où viennent les pertes." },
  },
  // CONFORT D'ÉTÉ : le geste existait dans la checklist sans jamais entrer dans le moteur. Il y entre
  // le 29/07/2026, et sa formulation est refaite au standard ci-dessus (l'ancienne disait
  // « Se renseigner sur le confort du logement en période de forte chaleur »).
  confort: {
    achat: { label: "Demandez comment le logement se comporte en forte chaleur", detail: "Orientation, ventilation, protections solaires : ce que l'étiquette ne détaille pas se constate sur place." },
    location: { label: "Demandez au bailleur les protections contre la chaleur", detail: "Volets, stores, ventilation : ce qui existe déjà, et ce qui ne dépendra pas de vous." },
    reside: { label: "Notez les pièces les plus exposées en été", detail: "D'un épisode de chaleur à l'autre, les mêmes pièces reviennent : c'est là que les travaux comptent." },
    neutre: { label: "Regardez comment le logement tient la chaleur", detail: "Inertie, protections solaires, ventilation traversante : trois leviers qui se constatent sur place." },
  },
  bati: {
    achat: { label: "Demandez l'historique des fissures et des sinistres", detail: "Faites contrôler les fondations si un doute subsiste." },
    location: { label: "Signalez les fissures apparentes au bailleur", detail: "Photographiez ce qui est visible et signalez-le par écrit." },
    reside: { label: "Suivez les fissures dans le temps", detail: "Photographiez-les avec une date, et comparez d'une saison à l'autre." },
    neutre: { label: "Regardez les signes visibles sur le bâti", detail: "Fissures en escalier sur les façades, portes ou fenêtres qui coincent, sol qui se déforme." },
  },
  reglementaire: {
    achat: { label: "Consultez le règlement de la zone en mairie", detail: "Il fixe ce qui est autorisé en cas de travaux ou d'extension, et ce qu'il impose au bâti existant." },
    location: { label: "Demandez au bailleur les prescriptions qui s'appliquent", detail: "L'état des risques remis à la signature indique le zonage et ce qu'il impose au logement." },
    reside: { label: "Lisez le règlement avant une extension", detail: "Une rénovation lourde peut être conditionnée par le zonage." },
    neutre: { label: "Lisez le règlement de la zone en mairie", detail: "Il dit ce que le zonage autorise, interdit ou impose à cette adresse." },
  },
  cavite: {
    achat: { label: "Faites examiner la stabilité du sol avant de vous engager", detail: "Le recensement porte sur des ouvrages connus alentour, pas sous ce logement : seul un avis technique tranche." },
    location: { label: "Signalez tout affaissement au bailleur", detail: "Un affaissement du terrain ou une fissure nouvelle se signale par écrit." },
    reside: { label: "Surveillez les signes d'affaissement", detail: "Affaissement du terrain, fissures nouvelles, portes qui se bloquent : notez la date." },
    neutre: { label: "Renseignez-vous sur les cavités recensées", detail: "La mairie et Géorisques indiquent les cavités connues et le suivi dont elles font l'objet." },
  },
  // `location` est exclue par la règle ET par la checklist (un locataire ne fait pas ces travaux) :
  // la chaîne vide n'est jamais lue. Elle reste là pour que le type couvre les quatre postures.
  patrimoine: {
    achat: { label: "Demandez en mairie ce que le périmètre autorise", detail: "Façade, menuiseries, toiture : les travaux visibles peuvent demander un accord, avec l'avis de l'Architecte des Bâtiments de France." },
    location: { label: "", detail: "" },
    // « Vérifiez » était un RESTE de la première génération : le commentaire en tête dit que cinq
    // libellés sur sept commençaient ainsi et ont été refaits — celui-ci avait survécu, dans la
    // table même qui énonce la règle. Repéré le 29/07/2026 par le test qui interdit ce verbe.
    reside: { label: "Consultez la mairie avant des travaux extérieurs", detail: "Le périmètre encadre ce qui se voit depuis l'espace public." },
    neutre: { label: "Renseignez-vous sur ce que le périmètre autorise", detail: "Il encadre les travaux visibles depuis l'espace public : façade, menuiseries, toiture." },
  },
  // RADON : le seul geste dont le CONSTAT est communal et l'ACTION dans le logement. Aucun libellé ne
  // promet de résultat ni ne donne de délai : une mesure se fait sur plusieurs semaines, en période
  // de chauffe, et c'est une pratique, pas un droit.
  radon: {
    achat: { label: "Demandez si une mesure du radon a été faite dans le logement", detail: "À défaut, une mesure peut être posée avant de s'engager : elle se fait sur plusieurs semaines, en période de chauffe." },
    location: { label: "Demandez au bailleur si une mesure du radon a été faite", detail: "Le résultat, s'il existe, porte sur ce logement — pas le classement de la commune." },
    reside: { label: "Faites mesurer le radon pendant la saison de chauffe", detail: "Un dosimètre posé plusieurs semaines dans les pièces de vie donne la concentration réelle." },
    neutre: { label: "Renseignez-vous sur la mesure du radon dans ce logement", detail: "C'est la seule façon de savoir : le classement du sol ne dit rien d'un bâtiment en particulier." },
  },
  sinistralite: {
    achat: { label: "Demandez l'état des risques et les sinistres indemnisés", detail: "Le vendeur indique les sinistres indemnisés au titre d'une catastrophe naturelle pendant qu'il occupait le bien." },
    location: { label: "Demandez au bailleur l'état des risques", detail: "Il est remis à la signature. Signalez sans tarder tout sinistre survenu pendant le bail." },
    reside: { label: "Renseignez-vous sur les indemnisations déjà versées", detail: "Les arrêtés de catastrophe naturelle pris sur la commune disent quels épisodes ont donné lieu à indemnisation." },
    neutre: { label: "Consultez l'état des risques de la commune", detail: "Il récapitule les arrêtés de catastrophe naturelle et les zonages qui s'appliquent." },
  },
};

/**
 * LE GESTE EN UNE PHRASE, pour la liste du module — qui rend une ligne, là où la carte du dossier
 * dispose d'une face et d'un dépliable. Le label reprend son point final, le détail suit.
 *
 * C'est la SEULE différence de forme autorisée entre les deux chemins : le texte, lui, est le même.
 * Elle prend l'ACTION D'UN FAIT plutôt qu'une clé de geste : depuis l'unification du 01/08/2026, la
 * liste vient des règles, et une règle peut porter une action que cette table ne connaît pas (le
 * radon, dont le constat est communal, en est le premier cas).
 */
export function gesteEnPhrase(action: { label: string; detail?: string }): string {
  if (!action.label) return "";
  return action.detail ? `${action.label}. ${action.detail}` : `${action.label}.`;
}
