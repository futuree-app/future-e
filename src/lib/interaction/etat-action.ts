// FUT-75 · L'ÉTAT D'UNE ACTION ENGAGÉE (« Mettre à jour l'analyse »), EN LOGIQUE PURE. Testé.
//
// Le composant `BoutonAction` ne fait aucun appel : il AFFICHE un état. Cet état ne peut avancer que par
// une issue réelle, traduite ici depuis la réponse de `/api/dossier/actualiser` (même contrat sur main et
// sur FUT-10) :
//   200 { statut: "abouti", version }   une version est livrée : seul cas de succès ;
//   200 { statut: "en_cours" }           une génération tourne déjà : ni succès ni échec ;
//   409 PROJECT_MISSING · 503 PURCHASE_CONTEXT_UNAVAILABLE · 502 GENERATION_FAILED · autres : échec.
// Une opération ENGAGÉE n'est jamais une version LIVRÉE : sans `abouti` et sans numéro, pas de succès.
//
// FUT-93 : une version LIVRÉE n'est pas encore une version AFFICHÉE. Après `succes` (le serveur a
// annoncé la version N), trois états disent l'affichage : `affichage` (la page lit la version prête),
// `affichee` (la page sert une version >= N, constaté sur la version servie, pas supposé), et
// `non_affichee` (la version est prête mais la page n'a pas pu l'afficher).

export type EtatAction = "repos" | "attente" | "succes" | "affichage" | "affichee" | "non_affichee" | "echec" | "ailleurs";
export type MotifEchec = "projet_manquant" | "contexte_indisponible" | "generation" | "reseau" | "autre";
export type IssueAction =
  | { type: "livree"; version: number }
  | { type: "en_cours" }
  | { type: "echec"; motif: MotifEchec };
export type EvenementAction =
  | { type: "appui" } | { type: "issue"; issue: IssueAction } | { type: "fin_confirmation" }
  | { type: "lecture" } | { type: "version_affichee" } | { type: "affichage_echoue" };

export function suivantAction(etat: EtatAction, ev: EvenementAction): EtatAction {
  switch (ev.type) {
    // Un second appui pendant l'attente ne relance rien : une seule opération à la fois.
    case "appui": return "attente";
    case "issue":
      if (etat !== "attente") return etat; // une réponse orpheline ne confirme rien
      return ev.issue.type === "livree" ? "succes" : ev.issue.type === "en_cours" ? "ailleurs" : "echec";
    case "fin_confirmation": return etat === "succes" ? "repos" : etat;
    // L'affichage ne commence qu'après une livraison confirmée, et ne se dit qu'à la version servie.
    case "lecture": return etat === "succes" ? "affichage" : etat;
    case "version_affichee": return etat === "succes" || etat === "affichage" || etat === "non_affichee" ? "affichee" : etat;
    case "affichage_echoue": return etat === "affichage" ? "non_affichee" : etat;
  }
}

/** L'appui est-il accepté ? Non pendant l'attente : le double clic ne lance pas deux opérations. */
export const appuiAccepte = (etat: EtatAction) => etat !== "attente";

/** La réponse HTTP de `actualiser`, traduite en issue. `corps` peut être illisible : alors, échec. */
export function issueDepuisReponse(r: { ok: boolean; status: number; corps: unknown }): IssueAction {
  const c = (r.corps ?? {}) as { statut?: unknown; version?: unknown; error?: unknown };
  if (r.ok && c.statut === "abouti" && typeof c.version === "number" && Number.isFinite(c.version)) return { type: "livree", version: c.version };
  if (r.ok && c.statut === "en_cours") return { type: "en_cours" };
  if (c.error === "PROJECT_MISSING") return { type: "echec", motif: "projet_manquant" };
  if (c.error === "PURCHASE_CONTEXT_UNAVAILABLE") return { type: "echec", motif: "contexte_indisponible" };
  if (c.error === "GENERATION_FAILED") return { type: "echec", motif: "generation" };
  return { type: "echec", motif: "autre" };
}

/** Ce que la ligne de compte rendu dit de chaque échec : sans alarme, avec ce qui reste vrai. */
export const PHRASE_ECHEC: Record<MotifEchec, string> = {
  projet_manquant: "La mise à jour a besoin de votre projet : décrivez-le, puis relancez-la.",
  contexte_indisponible: "Le contexte de votre achat n'a pas pu être relu. Réessayez dans un instant.",
  generation: "La mise à jour n'a pas abouti.",
  reseau: "La connexion a été interrompue avant la réponse.",
  autre: "La mise à jour n'a pas abouti.",
};

// ── RACCORDEMENT À « METTRE À JOUR L'ANALYSE » (FUT-93) ─────────────────────────────────────────

/**
 * Ce que fait un appui, selon l'état. Pendant l'attente, la confirmation et l'affichage, rien. Quand une
 * mise à jour tourne déjà ailleurs, l'appui RELIT la page au lieu de renvoyer une demande : une seconde
 * demande, une fois la première finie, lancerait une génération de plus, payante, que personne n'a
 * voulue. Quand la version est prête mais pas affichée, l'appui RECHARGE la page : jamais de POST.
 */
export type GesteAppui = "envoyer" | "relire" | "recharger" | "ignorer";
export function gesteAppui(etat: EtatAction): GesteAppui {
  if (etat === "attente" || etat === "succes" || etat === "affichage" || etat === "affichee") return "ignorer";
  if (etat === "non_affichee") return "recharger";
  return etat === "ailleurs" ? "relire" : "envoyer";
}

/** Le délai pendant lequel la confirmation « Nouvelle analyse prête » se lit avant l'affichage. */
export const LECTURE_CONFIRMATION_MS = 900;

/**
 * Combien de temps une relecture peut rester en cours avant d'être tenue pour bloquée. La relecture de
 * `/rapport` a pris 7 à 8 s en production (test réel du 12/10/2026) : la borne laisse passer une page
 * lente (12 s) sans déclencher la récupération, et reste courte devant une page qui ne s'affiche pas.
 */
export const DELAI_RELECTURE_MS = 20_000;

/** La page sert-elle la version annoncée (ou une plus récente) ? Seul constat d'un affichage réussi. */
export function versionAtteinte(attendue: number, servie: number | null | undefined): boolean {
  return typeof servie === "number" && Number.isFinite(servie) && servie >= attendue;
}

/**
 * LA RÉCUPÉRATION, BORNÉE ET SANS NOUVEAU CALCUL. La version N est prête ; la page doit la servir.
 *   1. une relecture de la page (le routeur relit le rendu serveur, sans recharger) ;
 *   2. si elle se TERMINE sans servir N (contenu encore ancien), une seconde relecture, une seule ;
 *   3. si une relecture reste BLOQUÉE au-delà de `DELAI_RELECTURE_MS`, ou si la seconde échoue aussi :
 *      un rechargement complet de la même adresse, une seule fois (mémorisé, voir `MemoireAffichage`) ;
 *   4. après ce rechargement, si N n'est toujours pas servie : on renonce et on le dit.
 * Aucune de ces étapes n'envoie de requête à `/api/dossier/actualiser` : rien n'est recalculé.
 */
export type SuiviAffichage = { attendue: number; tentatives: number; rechargee: boolean };
export type EtapeAffichage = "affichee" | "relire" | "recharger" | "renoncer" | "attendre";
export function etapeAffichage(
  s: SuiviAffichage, o: { servie: number | null | undefined; relectureEnCours: boolean; delaiDepasse: boolean },
): EtapeAffichage {
  if (versionAtteinte(s.attendue, o.servie)) return "affichee";
  if (s.tentatives === 0) return s.rechargee ? "renoncer" : "relire";
  if (o.delaiDepasse) return s.rechargee ? "renoncer" : "recharger";
  if (o.relectureEnCours) return "attendre";
  if (s.tentatives === 1) return "relire";
  return s.rechargee ? "renoncer" : "recharger";
}

/**
 * CE QUI SURVIT AU RECHARGEMENT COMPLET : la version attendue, pour CE dossier et CETTE portée, et le
 * fait que la page a déjà été rechargée (jamais deux fois). Sans elle, la page rechargée ne saurait
 * pas qu'une version N est prête, et reproposerait la mise à jour comme si de rien n'était.
 */
export type MemoireAffichage = { cle: string; attendue: number; rechargee: boolean; le: number };
export const DUREE_MEMOIRE_AFFICHAGE_MS = 10 * 60_000;
export const cleMemoireAffichage = (cle: string) => `futuree:maj-affichage:${cle}`;
/** Sans `maintenant`, la péremption n'est pas vérifiée (elle l'a été à la lecture du stockage). */
export function lireMemoireAffichage(brut: string | null, cle: string, maintenant?: number): MemoireAffichage | null {
  if (!brut) return null;
  let m: unknown;
  try { m = JSON.parse(brut); } catch { return null; }
  const o = m as Partial<MemoireAffichage> | null;
  if (!o || o.cle !== cle || typeof o.attendue !== "number" || !Number.isFinite(o.attendue)
      || typeof o.le !== "number" || typeof o.rechargee !== "boolean") return null;
  if (maintenant !== undefined && (maintenant - o.le > DUREE_MEMOIRE_AFFICHAGE_MS || o.le > maintenant + 60_000)) return null;
  return { cle, attendue: o.attendue, rechargee: o.rechargee, le: o.le };
}

/** La phrase sous le bouton (annoncée aux lecteurs d'écran). L'analyse affichée ne change jamais d'ici là. */
export function compteRenduAction(etat: EtatAction, issue: IssueAction | null): string {
  switch (etat) {
    case "attente": return "La nouvelle version se prépare. L'analyse ci-dessous reste lisible en attendant.";
    case "succes": return issue?.type === "livree" ? "La nouvelle analyse est prête." : "";
    case "affichage": return issue?.type === "livree" ? "La nouvelle analyse est prête et s'affiche. L'analyse ci-dessous reste lisible en attendant." : "";
    case "affichee": return "La nouvelle analyse est affichée.";
    case "non_affichee": return "La nouvelle analyse est prête, mais la page n'a pas pu l'afficher. Le bouton recharge la page, sans relancer de calcul.";
    case "echec": return issue?.type === "echec" ? `${PHRASE_ECHEC[issue.motif]} L'analyse ci-dessous reste inchangée.` : "";
    case "ailleurs": return "Une mise à jour de ce dossier est déjà en cours. Relisez la page dans un instant.";
    case "repos": return "";
  }
}
