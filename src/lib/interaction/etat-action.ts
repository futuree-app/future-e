// FUT-75 · L'ÉTAT D'UNE ACTION ENGAGÉE (« Mettre à jour l'analyse »), EN LOGIQUE PURE. Testé.
//
// Le composant `BoutonAction` ne fait aucun appel : il AFFICHE un état. Cet état ne peut avancer que par
// une issue réelle, traduite ici depuis la réponse de `/api/dossier/actualiser` (même contrat sur main et
// sur FUT-10) :
//   200 { statut: "abouti", version }   une version est livrée : seul cas de succès ;
//   200 { statut: "en_cours" }           une génération tourne déjà : ni succès ni échec ;
//   409 PROJECT_MISSING · 503 PURCHASE_CONTEXT_UNAVAILABLE · 502 GENERATION_FAILED · autres : échec.
// Une opération ENGAGÉE n'est jamais une version LIVRÉE : sans `abouti` et sans numéro, pas de succès.

export type EtatAction = "repos" | "attente" | "succes" | "echec" | "ailleurs";
export type MotifEchec = "projet_manquant" | "contexte_indisponible" | "generation" | "reseau" | "autre";
export type IssueAction =
  | { type: "livree"; version: number }
  | { type: "en_cours" }
  | { type: "echec"; motif: MotifEchec };
export type EvenementAction = { type: "appui" } | { type: "issue"; issue: IssueAction } | { type: "fin_confirmation" };

export function suivantAction(etat: EtatAction, ev: EvenementAction): EtatAction {
  switch (ev.type) {
    // Un second appui pendant l'attente ne relance rien : une seule opération à la fois.
    case "appui": return "attente";
    case "issue":
      if (etat !== "attente") return etat; // une réponse orpheline ne confirme rien
      return ev.issue.type === "livree" ? "succes" : ev.issue.type === "en_cours" ? "ailleurs" : "echec";
    case "fin_confirmation": return etat === "succes" ? "repos" : etat;
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
 * Ce que fait un appui, selon l'état. Pendant l'attente, et pendant la confirmation qui précède le
 * rechargement, rien. Quand une mise à jour tourne déjà ailleurs, l'appui RELIT la page au lieu de
 * renvoyer une demande : une seconde demande, une fois la première finie, lancerait une génération
 * de plus, payante, que personne n'a voulue.
 */
export type GesteAppui = "envoyer" | "relire" | "ignorer";
export function gesteAppui(etat: EtatAction): GesteAppui {
  if (etat === "attente" || etat === "succes") return "ignorer";
  return etat === "ailleurs" ? "relire" : "envoyer";
}

/** Le délai pendant lequel la confirmation se lit avant que la page ne serve la nouvelle version. */
export const LECTURE_CONFIRMATION_MS = 900;

/** La phrase sous le bouton (annoncée aux lecteurs d'écran). L'analyse affichée ne change jamais d'ici là. */
export function compteRenduAction(etat: EtatAction, issue: IssueAction | null): string {
  switch (etat) {
    case "attente": return "La nouvelle version se prépare. L'analyse ci-dessous reste lisible en attendant.";
    case "succes": return issue?.type === "livree" ? "La nouvelle version est prête. La page l'affiche dans un instant." : "";
    case "echec": return issue?.type === "echec" ? `${PHRASE_ECHEC[issue.motif]} L'analyse ci-dessous reste inchangée.` : "";
    case "ailleurs": return "Une mise à jour de ce dossier est déjà en cours. Relisez la page dans un instant.";
    case "repos": return "";
  }
}
