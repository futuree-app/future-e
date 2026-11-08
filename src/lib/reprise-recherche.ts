// « REPRENDRE CETTE RECHERCHE POUR DÉFINIR MON PROJET » : CE QUE LE GESTE MONTRE, ET QUAND (FUT-8, FUT-27).
// Lib PURE, utilisable côté navigateur ; RepriseRecherche (composant) ne fait que l'appliquer.
//
// Recherche = session jetable du navigateur ; Projet = serveur. Le passage de l'une à l'autre est un geste
// explicite, et il n'a de sens que s'il change quelque chose : la recherche qui vient de devenir le
// projet n'est plus proposée comme son remplacement.
import { SESSION_OUVIVRE_KEY, lireSessionOuVivre } from "./comparateur/session-ou-vivre.ts";

// La clé, la version et le délai sont ceux d'« Où vivre », lus dans le même module (FUT-27).
export const SESSION_RECHERCHE_KEY = SESSION_OUVIVRE_KEY;

export type RechercheAReprendre = { parsed: unknown; rawText: string };

export type ApercuReprise = {
  retenus: string[];
  nonMesures?: string[];
  propresALaRecherche: string[];
  remplace: { texte: string; updatedAt: string | null } | null;
  intentionConservee?: "achat" | "location" | null;
  abandonnes: { conditions: number; precisions: number; adoptions: number } | null;
  // Le projet enregistré EST déjà cette recherche (même texte, même lecture) : rien à reprendre.
  dejaRepris?: boolean;
};

/**
 * La dernière recherche « Où vivre » de ce navigateur, si « Où vivre » la restaurerait encore (même version,
 * dans le délai, reconstituable). Une session qu'« Où vivre » ne réafficherait pas n'est pas proposée.
 */
export function lireRechercheSession(raw: string | null, maintenant: number): RechercheAReprendre | null {
  const s = lireSessionOuVivre(raw, maintenant);
  if (!s) return null;
  return { parsed: s.parsed, rawText: s.submittedText as string };
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

const compte = (n: number, un: string, plusieurs: string) => (n === 1 ? un : `${n} ${plusieurs}`);

/**
 * Ce que le remplacement abandonne, compté tel quel (FUT-27). L'ancienne phrase annonçait « ses conditions et
 * précisions » dès qu'un seul geste était perdu, y compris quand le projet ne portait qu'un choix sur un
 * critère proposé : elle racontait ce que le projet ne portait pas. `null` : rien n'est abandonné.
 */
export function phraseAbandon(abandonnes: ApercuReprise["abandonnes"]): string | null {
  if (!abandonnes) return null;
  const parties = [
    abandonnes.conditions > 0 ? compte(abandonnes.conditions, "une condition sans compromis", "conditions sans compromis") : null,
    abandonnes.precisions > 0 ? compte(abandonnes.precisions, "une précision", "précisions") : null,
    abandonnes.adoptions > 0 ? compte(abandonnes.adoptions, "un choix sur un critère proposé", "choix sur des critères proposés") : null,
  ].filter((p): p is string => p != null);
  if (parties.length === 0) return null;
  const liste = parties.length === 1 ? parties[0] : `${parties.slice(0, -1).join(", ")} et ${parties[parties.length - 1]}`;
  return `Votre projet actuel porte ${liste}, que le nouveau projet ne reprendra pas.`;
}
