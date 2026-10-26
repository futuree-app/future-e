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
  batimentsAdresse: readonly string[] = [],
): DepartDpe {
  if (row.dpe_selection_status !== "pending" || row.dpe_selection_at != null) return { kind: "restaurer" };
  // FUT-65 : une liste incomplète (base ADEME en panne partielle) n'attribue jamais seule.
  // FUT-80 : un diagnostic rattaché à un autre bâtiment que ceux de l'adresse non plus.
  const a = dpeAttributionStatus(candidates, banFeatureType, listeComplete, batimentsAdresse);
  if (a.status === "not_found") return { kind: "aucun" };
  if (a.status === "auto_confirmed") return { kind: "proposer_auto", dpe: a.dpe };
  return { kind: "a_choisir" };
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
