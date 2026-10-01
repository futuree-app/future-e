// « REPRENDRE CETTE RECHERCHE POUR DÉFINIR MON PROJET » : CE QUE LE GESTE MONTRE, ET QUAND (FUT-8).
// Lib PURE, utilisable côté navigateur ; RepriseRecherche (composant) ne fait que l'appliquer.
//
// Recherche = session jetable du navigateur ; Projet = serveur. Le passage de l'une à l'autre est un geste
// explicite, et il n'a de sens que s'il change quelque chose : la recherche qui vient de devenir le
// projet n'est plus proposée comme son remplacement.

export const SESSION_RECHERCHE_KEY = "futuree:ouvivre:session"; // même clé que OuVivreClient
export const SESSION_RECHERCHE_VERSION = 3;
export const SESSION_RECHERCHE_TTL_MS = 2 * 60 * 60 * 1000;

export type RechercheAReprendre = { parsed: unknown; rawText: string };

export type ApercuReprise = {
  retenus: string[];
  propresALaRecherche: string[];
  remplace: { texte: string; updatedAt: string | null } | null;
  abandonnes: { conditions: number; precisions: number; adoptions: number } | null;
  // Le projet enregistré EST déjà cette recherche (même texte, même lecture) : rien à reprendre.
  dejaRepris?: boolean;
};

/** La dernière recherche « Où vivre » de ce navigateur, si elle est encore valable (version, délai). */
export function lireRechercheSession(raw: string | null, maintenant: number): RechercheAReprendre | null {
  if (!raw) return null;
  try {
    const s = JSON.parse(raw) as { v?: number; savedAt?: number; parsed?: unknown; submittedText?: string };
    if (s.v !== SESSION_RECHERCHE_VERSION || !s.savedAt || maintenant - s.savedAt > SESSION_RECHERCHE_TTL_MS || !s.parsed) return null;
    return { parsed: s.parsed, rawText: typeof s.submittedText === "string" ? s.submittedText : "" };
  } catch {
    return null;
  }
}

/**
 * Le libellé du geste, ou `null` s'il ne doit pas apparaître : lecteur non connecté (pas d'aperçu), pas de
 * recherche, transfert déjà fait, ou recherche qui est déjà le projet.
 */
export function libelleReprise(
  etat: { connecte: boolean; recherche: RechercheAReprendre | null; apercu: ApercuReprise | null; transfertFait: boolean },
): string | null {
  if (!etat.connecte || !etat.recherche || !etat.apercu || etat.transfertFait || etat.apercu.dejaRepris) return null;
  return etat.apercu.remplace ? "Utiliser cette recherche pour mon projet" : "Reprendre cette recherche pour définir mon projet";
}
