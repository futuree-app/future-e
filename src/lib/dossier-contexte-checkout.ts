// ════════════════════════════════════════════════════════════════════════════════════════════
// LE CONTEXTE DÉCLARÉ AU CHECKOUT D'UN DOSSIER D'ADRESSE (FUT-10). Lib PURE : lue par la route de
// paiement, le webhook et les tests, sans base ni réseau.
//
// TROIS INFORMATIONS, TROIS PLACES (contrat : docs/audits/2026-10-11-fut10-projet-relation-checkout.md) :
//   - la RELATION au bien (j'y habite / j'étudie ce logement)  → `address_dossiers.place_relation` ;
//   - l'OBJECTIF de cette analyse (acheter, louer, …)          → `address_dossiers.place_objective` ;
//   - le PROJET durable                                         → `user_profiles.user_project`, seul.
//
// LE CHEMIN : le navigateur envoie ses réponses à la création du PaymentIntent ; le serveur les valide,
// les range dans `dossier_intents` (jamais dans les métadonnées Stripe) avec le projet RELU EN BASE ; le
// webhook les recopie dans l'upsert qui crée le dossier ; l'artefact est généré ensuite.
// ════════════════════════════════════════════════════════════════════════════════════════════
import {
  isAddressObjective, isAddressRelation, type AddressObjective, type AddressRelation,
} from "./relation-au-lieu.ts";
import { normalizeUserProject, type UserProject } from "./user-project.ts";

/**
 * Le projet que l'écran a MONTRÉ au lecteur avant qu'il continue : s'il en existait un, et sa version
 * (`updatedAt`). C'est ce qui permet au serveur de refuser de figer un projet que le lecteur n'a pas vu.
 */
export type ProjetVu = { existe: boolean; updatedAt: string | null };

export type ContexteCheckout = {
  relation: AddressRelation | null;
  objectif: AddressObjective | null;
  /**
   * `null` : le navigateur n'a rien dit du projet (client antérieur à FUT-10, encore en cache pendant un
   * déploiement). On ne vérifie alors rien et on ne fige rien : la génération relit le projet canonique,
   * exactement comme avant.
   */
  projetVu: ProjetVu | null;
};

const SANS_CONTEXTE: ContexteCheckout = { relation: null, objectif: null, projetVu: null };

/**
 * LA VALIDATION, STRICTE. Une valeur hors liste est REFUSÉE (400), jamais ramenée à `null` : la
 * convertir en silence ferait payer quelqu'un dont la réponse aurait disparu sans qu'il le sache.
 * L'absence du bloc entier, elle, est permise (client ancien) : aucune réponse, rien d'inventé.
 */
export function lireContexteCheckout(raw: unknown): { ok: true; value: ContexteCheckout } | { ok: false } {
  if (raw === undefined || raw === null) return { ok: true, value: SANS_CONTEXTE };
  if (typeof raw !== "object" || Array.isArray(raw)) return { ok: false };
  const r = raw as Record<string, unknown>;

  let relation: AddressRelation | null = null;
  if (r.relation != null) {
    if (!isAddressRelation(r.relation)) return { ok: false };
    relation = r.relation;
  }
  let objectif: AddressObjective | null = null;
  if (r.objectif != null) {
    if (!isAddressObjective(r.objectif)) return { ok: false };
    objectif = r.objectif;
  }

  let projetVu: ProjetVu | null = null;
  if (r.projetVu != null) {
    if (typeof r.projetVu !== "object" || Array.isArray(r.projetVu)) return { ok: false };
    const p = r.projetVu as Record<string, unknown>;
    if (typeof p.existe !== "boolean") return { ok: false };
    const u = p.updatedAt;
    if (u != null && (typeof u !== "string" || u.length > 40 || Number.isNaN(Date.parse(u)))) return { ok: false };
    // Un projet « absent » n'a pas de version.
    projetVu = { existe: p.existe, updatedAt: p.existe && typeof u === "string" ? u : null };
  }
  return { ok: true, value: { relation, objectif, projetVu } };
}

/**
 * LE PROJET MONTRÉ EST-IL ENCORE CELUI DU COMPTE ? Comparé sur l'existence ET la version : un projet
 * ancien sans `updatedAt` (legacy) ne se confond pas avec l'absence de projet.
 *
 * `true` quand le navigateur n'a rien dit (client ancien) : il n'y a rien à vérifier.
 */
export function projetVuEstACour(vu: ProjetVu | null, canonique: UserProject | null): boolean {
  if (!vu) return true;
  if (!vu.existe) return canonique == null;
  return canonique != null && (canonique.updatedAt ?? null) === vu.updatedAt;
}

/**
 * LES COLONNES ÉCRITES DANS `dossier_intents`, en plus de l'adresse.
 *
 * - La date de déclaration est l'horloge du SERVEUR, au moment où les réponses sont enregistrées.
 *   `null` quand rien n'est déclaré : aucune date sans déclaration.
 * - Le projet figé est celui RELU EN BASE (jamais reçu du navigateur), et seulement quand le lecteur
 *   l'a vu : un client ancien ne fige rien.
 *
 * Toutes les clés sont TOUJOURS présentes, même nulles : une base sans la migration 37 doit faire
 * échouer l'écriture (donc refuser le paiement), plutôt que d'ouvrir un achat dont le contexte se perdrait.
 */
/**
 * CE QUE LE LECTEUR A CONFIRMÉ DU PROJET au paiement (correction du 11/10/2026, revue FUT-10) :
 *   - `confirmed` : un projet lui a été montré, il est figé ;
 *   - `absent`    : aucun projet n'existait, il a continué sans ;
 *   - `null`      : le navigateur n'a rien dit (client antérieur) : compatibilité historique.
 *
 * Sans cet état, `project_snapshot = null` voulait dire deux choses : « ancien checkout » et « le
 * lecteur a continué sans projet ». Le webhook relisait alors le compte dans les deux cas, et un projet
 * créé dans un autre onglet entre le paiement et la génération entrait dans un dossier vendu comme
 * factuel. L'état rend les trois cas distincts en base, contrainte SQL comprise (migration 37).
 */
export type EtatProjetCheckout = "confirmed" | "absent";

export function colonnesIntention(
  ctx: ContexteCheckout, projetCanonique: UserProject | null, now: Date,
): {
  place_relation: AddressRelation | null;
  place_objective: AddressObjective | null;
  place_context_declared_at: string | null;
  project_snapshot: UserProject | null;
  project_state: EtatProjetCheckout | null;
} {
  const declare = ctx.relation != null || ctx.objectif != null;
  // `projetVuEstACour` a déjà refusé le cas « montré mais disparu » : un projet confirmé existe ici.
  const etat: EtatProjetCheckout | null = ctx.projetVu == null
    ? null
    : ctx.projetVu.existe && projetCanonique ? "confirmed" : "absent";
  return {
    place_relation: ctx.relation,
    place_objective: ctx.objectif,
    place_context_declared_at: declare ? now.toISOString() : null,
    project_snapshot: etat === "confirmed" ? projetCanonique : null,
    project_state: etat,
  };
}

/**
 * LES COLONNES RECOPIÉES DANS `address_dossiers`, dans l'upsert QUI CRÉE le dossier.
 *
 * Seules les valeurs déclarées sont écrites, avec la date de LEUR déclaration (celle de l'intention) :
 * une intention antérieure à FUT-10 produit exactement l'upsert d'avant. Comme l'upsert ignore les
 * doublons, un webhook rejoué n'écrase jamais une relation modifiée depuis par le lecteur.
 */
export function colonnesDossierDepuisIntention(intent: Record<string, unknown>): {
  place_relation?: AddressRelation;
  place_relation_set_at?: string | null;
  place_objective?: AddressObjective;
  place_objective_set_at?: string | null;
} {
  // Une chaîne par PostgREST, un `Date` par un pilote Postgres direct : les deux disent la même date.
  // Une valeur illisible vaut `null`, jamais une date fabriquée.
  const brut = intent.place_context_declared_at;
  const date = brut instanceof Date ? brut : typeof brut === "string" ? new Date(brut) : null;
  const quand = date && !Number.isNaN(date.getTime()) ? date.toISOString() : null;
  return {
    ...(isAddressRelation(intent.place_relation)
      ? { place_relation: intent.place_relation, place_relation_set_at: quand } : {}),
    ...(isAddressObjective(intent.place_objective)
      ? { place_objective: intent.place_objective, place_objective_set_at: quand } : {}),
  };
}

/**
 * LE PROJET DU DOSSIER LIVRÉ, tel que le paiement l'a fixé.
 *
 *   - `confirme`   : générer avec CE projet, jamais avec celui du compte ;
 *   - `absent`     : le lecteur a payé sans projet ; aucun projet n'est lu, même si le compte en a reçu
 *                    un depuis (le dossier vendu est factuel, et c'est ce qu'il a confirmé) ;
 *   - `historique` : intention antérieure à FUT-10 : relecture du projet du compte, comme avant.
 *
 * Un projet `confirmed` illisible (corrompu, ou effacé par la purge) vaut `absent`, JAMAIS une relecture
 * du compte : un contexte non confirmé ne doit pas pouvoir entrer dans une analyse payée.
 */
export type ProjetLivraison =
  | { etat: "confirme"; projet: UserProject }
  | { etat: "absent" }
  | { etat: "historique" };

export function projetPourLivraison(intent: Record<string, unknown> | null | undefined): ProjetLivraison {
  const etat = intent?.project_state;
  if (etat === "confirmed") {
    const projet = normalizeUserProject(intent?.project_snapshot ?? null);
    return projet ? { etat: "confirme", projet } : { etat: "absent" };
  }
  // Seule l'ABSENCE de colonne ou de valeur dit « intention historique ». Toute autre valeur, même
  // inattendue, est traitée comme une absence confirmée : on ne relit jamais le compte par défaut.
  if (etat === undefined || etat === null) return { etat: "historique" };
  return { etat: "absent" };
}
