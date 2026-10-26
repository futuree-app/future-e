// ════════════════════════════════════════════════════════════════════════════════════════════
// L'ATTRIBUTION AUTOMATIQUE D'UN DIAGNOSTIC, DE LA PROPOSITION À L'ENREGISTREMENT (FUT-74).
//
// POURQUOI CE MODULE EXISTE. `LogementModule` posait `auto_confirmed` et le diagnostic AVANT
// d'appeler le serveur, puis ignorait sa réponse (`void persistDpe(...)`). Depuis que la route
// refuse un diagnostic qui ne porte pas sur un logement (`422 DPE_NON_ATTRIBUABLE`), un refus
// laissait à l'écran un choix « retenu automatiquement » que la base n'avait jamais reçu ; une panne
// réseau faisait de même. Relevé par la revue indépendante du 24/10/2026.
//
// LA RÈGLE : une attribution automatique est une PROPOSITION tant que le serveur ne l'a pas
// enregistrée. L'écran ne la montre confirmée qu'après sa réponse positive, et une réponse qui
// arrive après un geste du lecteur (choisir, refuser, retirer) ne l'écrase jamais.
//
// Pur et testé sous `node --test` : le composant ne fait que brancher l'état React sur ces issues.
// ════════════════════════════════════════════════════════════════════════════════════════════

import { dpeAttributionStatus, type DpeRecord } from "./dpe-attribution.ts";
import { vetoBatiment, type IdentiteBatiment, type VetoBatiment } from "./batiment-rnb.ts";

export type DepartDpe =
  /** Le dossier porte déjà un statut (choix, refus, retrait daté) : il se restaure tel quel. */
  | { kind: "restaurer" }
  /** Aucun diagnostic à l'adresse. */
  | { kind: "aucun" }
  /** Des diagnostics, aucun qui converge seul : le lecteur choisit. */
  | { kind: "a_choisir" }
  /** Une convergence forte : à enregistrer avant d'être montrée comme retenue. */
  | { kind: "proposer_auto"; dpe: DpeRecord };

/**
 * LE DOSSIER N'A ENCORE CONNU AUCUN GESTE. C'est le seul état d'où une attribution automatique peut
 * partir, et la condition que l'écriture automatique impose À LA BASE (cf. `CONDITION_ECRITURE_AUTO`) :
 * un refus, un retrait ou un choix datent la ligne, et plus aucune proposition ne peut l'écrire ensuite.
 */
export function estVierge(row: { dpe_selection_status: string; dpe_selection_at: string | null }): boolean {
  return row.dpe_selection_status === "pending" && row.dpe_selection_at == null;
}

/**
 * La précondition de l'UPDATE automatique, appliquée PAR LA BASE dans la même instruction que l'écriture
 * (`UPDATE … WHERE dpe_selection_status = 'pending' AND dpe_selection_at IS NULL`). Une vérification
 * préalable suivie d'une écriture inconditionnelle laisserait passer un refus arrivé entre les deux.
 */
export const CONDITION_ECRITURE_AUTO = {
  egal: { dpe_selection_status: "pending" },
  nul: ["dpe_selection_at"],
} as const;

/**
 * D'où part la section Énergie à l'ouverture d'un dossier.
 *
 * « NEUF » SE LIT SUR `dpe_selection_at`, JAMAIS SUR LE SEUL STATUT `pending` (19/08/2026). Le retour
 * arrière ramène la ligne à `pending` ; sans la date du geste, quelqu'un qui vient de dire « ce n'est
 * pas le bon diagnostic » se verrait réattribuer le même au rechargement suivant.
 */
export function departDpe(
  row: { dpe_selection_status: string; dpe_selection_at: string | null },
  candidates: DpeRecord[],
  banFeatureType: string | null,
  listeComplete: boolean,
  identite?: IdentiteBatiment | null,
): DepartDpe {
  if (!estVierge(row)) return { kind: "restaurer" };
  // FUT-65 : une liste incomplète (base ADEME en panne partielle, ou tronquée) n'attribue jamais seule.
  // FUT-80 : une adresse dont le bâtiment est ambigu, inconnu faute de réponse, ou qui contredit le
  // diagnostic, non plus (`vetoBatiment`).
  const a = dpeAttributionStatus(candidates, banFeatureType, listeComplete, identite);
  if (a.status === "not_found") return { kind: "aucun" };
  if (a.status === "auto_confirmed") return { kind: "proposer_auto", dpe: a.dpe };
  return { kind: "a_choisir" };
}

/**
 * LE SERVEUR REFAIT LA DÉCISION, IL NE LA REÇOIT PAS (revue indépendante du 26/10/2026).
 *
 * `auto_confirmed` était accepté sur parole : la route vérifiait l'appartenance du diagnostic à la liste
 * de l'adresse et son grain, puis enregistrait. Le cas de Monchaux-sur-Écaillon, que l'écran refusait,
 * passait en appelant la route directement (HTTP 200, aucun appel au référentiel).
 *
 * Cette fonction applique la MÊME règle que l'écran (`departDpe`), sur ce que le serveur vient de relire
 * lui-même : la liste ADEME de l'adresse (complète et non tronquée), le type d'adresse que la version du
 * rapport a enregistré, et l'identité du bâtiment relue au référentiel. Le diagnostic désigné doit être
 * exactement celui que la règle retiendrait. Pur : la route fait les lectures, ceci décide.
 */
export type RefusAuto =
  | "DEJA_DECIDE"
  | "LISTE_INCOMPLETE"
  | "ADRESSE_IMPRECISE"
  | "NE_CONVERGE_PAS"
  | "AUTRE_DIAGNOSTIC";

export function controlerAttributionAuto(entree: {
  dpeId: string;
  row: { dpe_selection_status: string; dpe_selection_at: string | null };
  candidates: DpeRecord[];
  listeComplete: boolean;
  banFeatureType: string | null;
  identite: IdentiteBatiment;
}): { ok: true; dpe: DpeRecord } | { ok: false; refus: RefusAuto; veto?: VetoBatiment } {
  if (!estVierge(entree.row)) return { ok: false, refus: "DEJA_DECIDE" };
  if (!entree.listeComplete) return { ok: false, refus: "LISTE_INCOMPLETE" };
  if (entree.banFeatureType !== "housenumber") return { ok: false, refus: "ADRESSE_IMPRECISE" };
  const depart = departDpe(entree.row, entree.candidates, entree.banFeatureType, entree.listeComplete, entree.identite);
  if (depart.kind !== "proposer_auto") {
    const veto = entree.candidates.length === 1 ? vetoBatiment(entree.candidates[0], entree.identite) : null;
    return { ok: false, refus: "NE_CONVERGE_PAS", ...(veto ? { veto } : {}) };
  }
  if (depart.dpe.id_dpe !== entree.dpeId) return { ok: false, refus: "AUTRE_DIAGNOSTIC" };
  return { ok: true, dpe: depart.dpe };
}

export type IssueAuto = "confirme" | "refuse" | "perime";

/**
 * Enregistre la proposition, et dit ce que l'écran peut en montrer.
 *
 * - `confirme` : le serveur l'a enregistrée ; elle se montre retenue.
 * - `refuse`   : refus HTTP (dont `422 DPE_NON_ATTRIBUABLE`) ou échec réseau ; rien n'est retenu.
 * - `perime`   : le lecteur a fait un geste entre-temps ; cette réponse ne touche plus à l'écran.
 *
 * `toujoursCourant` est lu APRÈS la réponse : c'est elle qui pourrait écraser un geste plus récent.
 */
export async function confirmerAutomatiquement(
  dpe: DpeRecord,
  persister: (d: DpeRecord) => Promise<boolean>,
  toujoursCourant: () => boolean,
): Promise<IssueAuto> {
  let ok = false;
  try {
    ok = await persister(dpe);
  } catch {
    ok = false;
  }
  if (!toujoursCourant()) return "perime";
  return ok ? "confirme" : "refuse";
}

/** Ce que lit le lecteur quand la proposition n'a pas pu être enregistrée. La liste reste ouverte. */
export const MESSAGE_AUTO_NON_ENREGISTRE =
  "Le diagnostic de cette adresse n'a pas pu être retenu automatiquement. S'il est celui de ce logement, vous pouvez le désigner ci-dessous.";
