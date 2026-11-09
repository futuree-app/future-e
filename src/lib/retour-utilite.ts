// ════════════════════════════════════════════════════════════════════════════════════════════
// LE RETOUR D'UTILITÉ EN FIN DE DOSSIER (FUT-94).
//
// « Cette analyse vous a-t-elle appris quelque chose d'utile pour votre recherche ? » Trois réponses,
// un commentaire facultatif. On mesure la valeur du dossier lu, pas la satisfaction générale.
//
// CE MODULE EST PUR : la route branche le vrai stockage (`lib/server/retour-utilite-store.ts`), les
// tests un stockage simulé. Il décide trois choses, et seulement elles :
//   1. ce qui est une réponse valide (et ce qui ne l'est pas : rien n'est tronqué ni deviné) ;
//   2. À QUEL DOSSIER le retour se rattache, sans croire le client : un dossier d'adresse doit être
//      lisible par ce compte, une commune doit lui être ouverte ;
//   3. ce qu'un nouvel envoi remplace. UNE réponse par compte et par dossier : la suivante la remplace.
//      Un envoi SANS clé `comment` garde le commentaire déjà enregistré ; `comment: null` l'efface.
//      « Pas encore lu » l'efface toujours, avec sa date (il ne peut pas décrire une lecture non faite).
//
// CE QUI N'EST JAMAIS ÉCRIT : l'adresse, le projet, le texte du dossier. Le commentaire est privé et
// ne part jamais vers PostHog (l'événement de l'écran ne porte que la réponse et « a un commentaire »).
// ════════════════════════════════════════════════════════════════════════════════════════════

import { communeParent } from "./plm.ts";

export const REPONSES_UTILITE = ["oui", "pas_vraiment", "pas_encore_lu"] as const;
export type ReponseUtilite = (typeof REPONSES_UTILITE)[number];

/** Les libellés exacts de l'écran, dans l'ordre où il les montre. */
export const LIBELLE_REPONSE: Record<ReponseUtilite, string> = {
  oui: "Oui",
  pas_vraiment: "Pas vraiment",
  pas_encore_lu: "Pas encore lu",
};

export const QUESTION_UTILITE = "Cette analyse vous a-t-elle appris quelque chose d'utile pour votre recherche ?";
export const QUESTION_COMMENTAIRE = "Quoi, ou qu'est-ce qui vous a manqué ?";

/** La borne du commentaire, partagée par l'écran, la route et la base (`char_length` ≤ 2000). */
export const MAX_COMMENTAIRE = 2000;

/** Ce que l'écran sait d'un retour déjà enregistré. */
export type RetourEnregistre = { answer: ReponseUtilite; comment: string | null };

export type PresentationRetour = "classique" | "releve";

/** La ligne écrite. Type FERMÉ : ni adresse, ni projet, ni e-mail ne peuvent y entrer. */
export type LigneRetourUtilite = {
  user_id: string;
  insee_code: string;
  scope_key: string;
  address_dossier_id: string | null;
  answer: ReponseUtilite;
  artifact_version: number | null;
  presentation: PresentationRetour | null;
  updated_at: string;
  /** Absents tous deux : le commentaire enregistré est gardé tel quel. */
  comment?: string | null;
  commented_at?: string | null;
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const INSEE = /^[0-9][0-9AB][0-9]{3}$/;

export function estReponseUtilite(v: unknown): v is ReponseUtilite {
  return typeof v === "string" && (REPONSES_UTILITE as readonly string[]).includes(v);
}

/** La longueur comme le lecteur la voit, et comme Postgres la compte (`char_length`) : un emoji vaut un. */
export function longueurCommentaire(texte: string): number {
  return [...texte.trim()].length;
}

/**
 * Le commentaire tel qu'il sera enregistré : bords retirés, vide ⇒ null. Au-delà de la borne,
 * `trop_long` : on refuse plutôt que de couper, couper ferait dire au lecteur ce qu'il n'a pas écrit.
 */
export function normaliserCommentaire(v: unknown): { ok: true; valeur: string | null } | { ok: false; raison: "invalide" | "trop_long" } {
  if (v === null) return { ok: true, valeur: null };
  if (typeof v !== "string") return { ok: false, raison: "invalide" };
  const t = v.trim();
  if (t.length === 0) return { ok: true, valeur: null };
  if (longueurCommentaire(t) > MAX_COMMENTAIRE) return { ok: false, raison: "trop_long" };
  return { ok: true, valeur: t };
}

/** La clé de portée, la même que `decision_artifact` : le retour vise exactement le dossier lu. */
export function cleDePortee(dossierId: string | null): string {
  return dossierId ? `logement:${dossierId}` : "commune";
}

export type DepsRetourUtilite = {
  now: Date;
  userId: string;
  /** Le dossier d'adresse, lu sous l'identité du lecteur (RLS, accès non révoqué). `null` : refus. */
  lireDossier: (dossierId: string) => Promise<{ id: string; insee: string } | null>;
  /** La commune est-elle ouverte à ce compte (droit communal ou dossier d'adresse) ? */
  communeOuverte: (insee: string) => Promise<boolean>;
  /** La version figée servie pour cette portée, ou `null` (assemblage vivant). Informative. */
  versionServie: (insee: string, scopeKey: string) => Promise<number | null>;
  /** Upsert sur (user_id, insee_code, scope_key). Rend la ligne en vigueur, ou `null` en échec. */
  ecrire: (ligne: LigneRetourUtilite) => Promise<RetourEnregistre | null>;
};

export type IssueRetourUtilite =
  | { status: 200; body: { ok: true; retour: RetourEnregistre } }
  | { status: 400 | 403 | 503; body: { error: string; code: string } };

/**
 * Enregistre (ou remplace) le retour du lecteur sur un dossier. Corps attendu :
 *   { insee, dossierId?: uuid | null, answer, comment?: string | null, presentation?: "classique" | "releve" }
 *
 * LA PRÉSENTATION VIENT DE L'ÉCRAN, validée sur ses deux valeurs (toute autre vaut `null`). Elle est
 * résolue une seule fois par requête, par `/rapport` (invariant A2 de `decision-releve.test.ts`) ; la
 * route ne la recalcule pas : ce qui compte est la présentation que le lecteur a VUE. Un compte qui
 * mentirait ne fausserait que sa propre ligne, sans aucun effet sur un droit.
 */
export async function enregistrerRetourUtilite(body: unknown, deps: DepsRetourUtilite): Promise<IssueRetourUtilite> {
  const b = (body && typeof body === "object" ? body : {}) as Record<string, unknown>;
  const refus = (status: 400 | 403 | 503, code: string, error: string): IssueRetourUtilite => ({ status, body: { error, code } });

  if (!estReponseUtilite(b.answer)) return refus(400, "reponse_invalide", "Réponse invalide.");
  if (typeof b.insee !== "string" || !INSEE.test(b.insee)) return refus(400, "commune_invalide", "Commune invalide.");
  const dossierId = b.dossierId == null ? null : b.dossierId;
  if (dossierId !== null && (typeof dossierId !== "string" || !UUID.test(dossierId))) {
    return refus(400, "dossier_invalide", "Dossier invalide.");
  }
  const aCommentaire = Object.prototype.hasOwnProperty.call(b, "comment");
  const commentaire = aCommentaire ? normaliserCommentaire(b.comment) : null;
  if (commentaire && !commentaire.ok) {
    return commentaire.raison === "trop_long"
      ? refus(400, "commentaire_trop_long", `Le commentaire dépasse ${MAX_COMMENTAIRE} caractères.`)
      : refus(400, "commentaire_invalide", "Commentaire invalide.");
  }

  // LE RATTACHEMENT NE CROIT PAS LE CLIENT. La commune est remontée au grain de l'artefact (un
  // arrondissement de Paris s'enregistre sous 75056, comme le dossier qu'il lit).
  const insee = communeParent(b.insee);
  if (!(await deps.communeOuverte(insee))) return refus(403, "dossier_inaccessible", "Ce dossier ne vous est pas ouvert.");
  let addressDossierId: string | null = null;
  if (dossierId) {
    const d = await deps.lireDossier(dossierId);
    // Un dossier d'un autre compte, révoqué, ou d'une autre commune que celle déclarée : refus.
    if (!d || communeParent(d.insee) !== insee) return refus(403, "dossier_inaccessible", "Ce dossier ne vous est pas ouvert.");
    addressDossierId = d.id;
  }
  const scopeKey = cleDePortee(addressDossierId);
  const version = await deps.versionServie(insee, scopeKey).catch(() => null);
  const quand = deps.now.toISOString();

  const ligne: LigneRetourUtilite = {
    user_id: deps.userId,
    insee_code: insee,
    scope_key: scopeKey,
    address_dossier_id: addressDossierId,
    answer: b.answer,
    artifact_version: typeof version === "number" && Number.isInteger(version) && version >= 1 ? version : null,
    presentation: b.presentation === "classique" || b.presentation === "releve" ? b.presentation : null,
    updated_at: quand,
  };
  if (b.answer === "pas_encore_lu") {
    // UN DOSSIER PAS ENCORE LU N'A PAS DE COMMENTAIRE. Celui d'une réponse précédente (« ce qui m'a
    // manqué ») décrirait une lecture que la réponse en vigueur dit ne pas avoir eu lieu : il est
    // effacé avec sa date, quel que soit le corps. La base le garantit aussi (contrainte
    // `dossier_utility_feedback_non_lu_ck`). Entre « Oui » et « Pas vraiment », il est gardé.
    ligne.comment = null;
    ligne.commented_at = null;
  } else if (commentaire && commentaire.ok) {
    ligne.comment = commentaire.valeur;
    ligne.commented_at = commentaire.valeur === null ? null : quand;
  }

  const ecrit = await deps.ecrire(ligne).catch(() => null);
  if (!ecrit) return refus(503, "enregistrement_impossible", "Enregistrement impossible pour le moment.");
  return { status: 200, body: { ok: true, retour: ecrit } };
}

/** Une ligne lue de la base, validée : une valeur inconnue n'est pas une réponse. */
export function lireLigneRetour(l: unknown): RetourEnregistre | null {
  if (!l || typeof l !== "object") return null;
  const r = l as { answer?: unknown; comment?: unknown };
  if (!estReponseUtilite(r.answer)) return null;
  return { answer: r.answer, comment: typeof r.comment === "string" && r.comment.length > 0 ? r.comment : null };
}
