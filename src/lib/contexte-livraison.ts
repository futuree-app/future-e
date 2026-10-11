// ════════════════════════════════════════════════════════════════════════════════════════════
// LE CONTEXTE D'UNE GÉNÉRATION D'ARTEFACT (FUT-10, dernière revue). Lib PURE, testée.
//
// ── LE PROBLÈME ──────────────────────────────────────────────────────────────────────────────
// Le contexte d'un achat ne doit pas dépendre du moment où l'artefact parvient à être généré. Le
// webhook figeait bien le projet confirmé au paiement ; mais quand cette première génération échouait,
// le rattrapage de la page relisait le projet ET la relation du jour. Un lecteur qui avait payé avec
// le projet A, puis l'avait remplacé par B, recevait comme « version vendue » une lecture de B.
//
// ── LA RÈGLE ─────────────────────────────────────────────────────────────────────────────────
// Trois opérations, trois contextes, et on ne les confond jamais :
//
//   1. PREMIÈRE LIVRAISON (aucune version prête n'existe encore pour ce dossier : webhook, rattrapage,
//      reprise après échec) → le contexte DE L'ACHAT, lu dans `dossier_intents` (verrouillé à la
//      confirmation) : projet confirmé et relation / objectif déclarés à ce moment-là ;
//   2. SUCCESSION AUTOMATIQUE (une pièce apportée par le lecteur périme la version servie : le DPE) →
//      le contexte DE LA VERSION SERVIE (son projet et son contexte du bien figés). Déposer un
//      diagnostic ne fait pas adopter en silence un projet modifié depuis ;
//   3. MISE À JOUR EXPLICITE (« Mettre à jour l'analyse », « Lire ce bien avec mon projet ») → le
//      contexte COURANT. C'est une autre opération, datée de la demande.
//
// L'ACHAT SANS PROJET (`absent`) n'a pas de première version personnalisée : aucune génération
// automatique. Le dossier reste factuel jusqu'à une demande explicite du lecteur (décision du porteur).
//
// L'ACHAT HISTORIQUE (intention antérieure à FUT-10, dossier ouvert par l'administration) : le
// contexte courant, exactement comme avant. Rien n'est inventé pour lui.
// ════════════════════════════════════════════════════════════════════════════════════════════
import type { UserProject } from "./user-project.ts";
import {
  isAddressObjective, isAddressRelation, type ContexteDuBien, type RelationAuLieu,
} from "./relation-au-lieu.ts";
import { projetPourLivraison } from "./dossier-contexte-checkout.ts";

/** Ce que l'achat a fixé, relu dans `dossier_intents`. */
export type ContexteDAchat =
  | { etat: "historique" }
  | { etat: "confirme"; projet: UserProject; relation: RelationAuLieu }
  | { etat: "absent"; relation: RelationAuLieu };

/**
 * L'intention d'un dossier acheté, réduite à ce que la livraison doit reproduire. `project_state`
 * est le discriminant : posé par tout checkout FUT-10, absent des intentions antérieures. Le projet
 * suit `projetPourLivraison` (un snapshot illisible vaut absence, jamais une relecture du compte) ; la
 * relation et l'objectif sont ceux DÉCLARÉS À L'ACHAT, `null` voulant dire « non dit à l'achat ».
 */
export function contexteDAchat(intent: Record<string, unknown> | null | undefined): ContexteDAchat {
  if (!intent || intent.project_state == null) return { etat: "historique" };
  const relation: RelationAuLieu = {
    echelle: "adresse",
    relation: isAddressRelation(intent.place_relation) ? intent.place_relation : null,
    objectif: isAddressObjective(intent.place_objective) ? intent.place_objective : null,
  };
  const projet = projetPourLivraison(intent);
  return projet.etat === "confirme" ? { etat: "confirme", projet: projet.projet, relation } : { etat: "absent", relation };
}

export type OperationDeGeneration = "premiere_livraison" | "succession_automatique" | "mise_a_jour_explicite";

/** L'opération que représente une génération, selon ce qui existe déjà et qui la demande. */
export function operationDeGeneration(input: { versionPrete: boolean; demandeExplicite: boolean }): OperationDeGeneration {
  if (input.demandeExplicite) return input.versionPrete ? "mise_a_jour_explicite" : "premiere_livraison";
  return input.versionPrete ? "succession_automatique" : "premiere_livraison";
}

export type ContexteDeGeneration =
  | { genere: true; projet: UserProject; relation: RelationAuLieu | null; source: "achat" | "version_servie" | "courant" }
  | { genere: false; raison: "achat_sans_projet" | "aucun_projet" };

/**
 * LE CONTEXTE AVEC LEQUEL GÉNÉRER, ou le refus de générer.
 *
 * Une PREMIÈRE LIVRAISON demandée explicitement suit la même règle qu'une automatique, sauf pour un
 * achat sans projet : là, la demande explicite EST la personnalisation que le lecteur réclame, et elle
 * utilise son projet du jour. Un achat confirmé, lui, garde son projet même sur un clic : la première
 * version vendue est toujours fidèle au paiement.
 */
export function contexteDeGeneration(input: {
  operation: OperationDeGeneration;
  /** `true` quand la génération répond à un clic du lecteur (seulement pertinent sans version prête). */
  demandeExplicite?: boolean;
  achat: ContexteDAchat;
  /** La version servie, pour une succession automatique. */
  versionServie?: { projet: UserProject | null; contexteDuBien?: ContexteDuBien | null } | null;
  courant: { projet: UserProject | null; relation: RelationAuLieu | null };
}): ContexteDeGeneration {
  const { operation, achat, courant } = input;

  if (operation === "mise_a_jour_explicite") {
    return courant.projet
      ? { genere: true, projet: courant.projet, relation: courant.relation, source: "courant" }
      : { genere: false, raison: "aucun_projet" };
  }

  if (operation === "succession_automatique") {
    const fige = input.versionServie;
    if (fige?.projet) {
      // Un artefact antérieur à FUT-10 ne porte pas son contexte du bien : la relation du jour, comme avant.
      const relation: RelationAuLieu | null = fige.contexteDuBien
        ? { echelle: "adresse", relation: fige.contexteDuBien.relation, objectif: fige.contexteDuBien.objectif }
        : courant.relation;
      return { genere: true, projet: fige.projet, relation, source: "version_servie" };
    }
    // Sans version lisible, il n'y a rien à faire succéder : on retombe sur la première livraison.
  }

  // PREMIÈRE LIVRAISON
  if (achat.etat === "confirme") return { genere: true, projet: achat.projet, relation: achat.relation, source: "achat" };
  if (achat.etat === "absent") {
    if (!input.demandeExplicite) return { genere: false, raison: "achat_sans_projet" };
    return courant.projet
      ? { genere: true, projet: courant.projet, relation: courant.relation, source: "courant" }
      : { genere: false, raison: "aucun_projet" };
  }
  return courant.projet
    ? { genere: true, projet: courant.projet, relation: courant.relation, source: "courant" }
    : { genere: false, raison: "aucun_projet" };
}
