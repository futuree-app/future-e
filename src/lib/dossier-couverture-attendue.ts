// ════════════════════════════════════════════════════════════════════════════════════════════
// CE QUE CETTE ADRESSE PERMETTRA DE LIRE, DIT AVANT LE PAIEMENT.
//
// POURQUOI MAINTENANT. La mesure du 31/07/2026 établit que 75 à 86 % des adresses n'ont AUCUN
// diagnostic énergétique sur le chemin que le produit emprunte. La face Énergie du dossier est
// donc vide pour quatre acheteurs sur cinq, et c'est la première source de déception possible.
// L'écran de qualification nommait déjà la matière (« diagnostic énergétique : aucun à cette
// adresse ») ; il ne disait pas ce que ça CHANGE au dossier. Entre les deux, il y a la différence
// entre un fait technique et une décision d'achat éclairée.
//
// ── CE QUE CE MODULE NE FAIT PAS, ET NE FERA PAS ICI ─────────────────────────────────────────
// Il ne dit RIEN de l'enjeu. Ni « cette adresse est exposée », ni « rien de particulier ici » :
// établir l'un ou l'autre demande de lancer le fan-out de risques, que la route de qualification
// refuse explicitement parce qu'elle est publique et anonyme, et qu'appeler Géorisques là
// publierait gratuitement le cœur du produit payant. Ce profil-là, s'il se construit un jour, vivra
// APRÈS l'authentification et AVANT le PaymentIntent.
//
// Il ne rend AUCUNE VALEUR : ni classe, ni numéro de parcelle. La qualification annonce ce qui sera
// examiné, jamais ce que ça vaut, sinon elle devient le produit gratuit qui rend le payant inutile.
//
// ── CE QU'IL DIT, ET DANS QUEL ORDRE ─────────────────────────────────────────────────────────
// Ce qui MANQUERA d'abord, parce que c'est la raison d'hésiter ; ce qui RESTERA ensuite, parce que
// c'est ce qu'on achète. L'ordre inverse ferait un argumentaire commercial qui minimise le manque.
//
// Pur, testé sous `node --test`.
// ════════════════════════════════════════════════════════════════════════════════════════════

/** L'état d'un élément de matière, tel que la route de qualification le rend. */
export type MatterState = "found" | "none" | "unavailable";

export type ExpectedCoverage = {
  /**
   * Le genre de lecture que cette adresse permet. Décrit la COUVERTURE, jamais l'enjeu.
   * - `complete` : les trois échelles se lisent, diagnostic compris.
   * - `sans_diagnostic` : le bâti se lit, sa performance énergétique non.
   * - `a_reverifier` : une source n'a pas répondu ; le dossier la réinterrogera.
   */
  profile: "complete" | "sans_diagnostic" | "a_reverifier";
  /** Ce qui manquera, en une phrase. Vide quand rien ne manque. */
  manque: string | null;
  /** Ce qui sera lu quoi qu'il arrive. Toujours présent : c'est ce que le lecteur achète. */
  reste: string;
};

export function expectedCoverage(matter: {
  dpe: MatterState;
  parcel: MatterState;
}): ExpectedCoverage {
  // UNE SOURCE MUETTE N'EST PAS UNE ABSENCE, et elle prime sur tout le reste : annoncer « aucun
  // diagnostic » alors que l'ADEME n'a pas répondu ferait renoncer quelqu'un sur une panne.
  if (matter.dpe === "unavailable" || matter.parcel === "unavailable") {
    return {
      profile: "a_reverifier",
      manque:
        "Une des sources publiques n'a pas répondu à l'instant. Le dossier l'interrogera de " +
        "nouveau à son ouverture, donc ce qui manque ici peut très bien s'y trouver.",
      reste: RESTE_TOUJOURS,
    };
  }

  if (matter.dpe === "none") {
    return {
      profile: "sans_diagnostic",
      manque:
        "Aucun diagnostic de performance énergétique n'est rattaché à cette adresse dans la base " +
        "ouverte. Ce dossier ne pourra donc qualifier ni la performance énergétique de ce " +
        "logement, ni son comportement en été. C'est le cas de la plupart des adresses.",
      reste: RESTE_TOUJOURS,
    };
  }

  return { profile: "complete", manque: null, reste: `${RESTE_TOUJOURS} ${AVEC_DIAGNOSTIC}` };
}

/**
 * CE QUI EST LU QUOI QU'IL ARRIVE. Écrit une seule fois : trois copies de cette liste dériveraient,
 * et c'est la phrase qui porte la valeur du produit quand le diagnostic manque.
 *
 * Aucune promesse de résultat : « ce à quoi cette adresse est exposée » ne promet pas qu'elle le
 * soit, ni qu'elle ne le soit pas.
 */
const RESTE_TOUJOURS =
  "Restent lus : la trajectoire climatique de la commune, ce à quoi cette adresse est exposée " +
  "(zonages, sols, sinistres indemnisés), et ce que le secteur met à portée de pas.";

const AVEC_DIAGNOSTIC =
  "S'y ajoute la lecture du diagnostic énergétique rattaché à cette adresse.";
