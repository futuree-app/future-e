import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { communeParent } from "@/lib/plm";

// ════════════════════════════════════════════════════════════════════════════════════════════
// LE CONTEXTE DE LECTURE, POSÉ D'UN SEUL GESTE.
//
// ── LE CONTRAT, TRANCHÉ LE 11/08/2026 ────────────────────────────────────────────────────────
// « Dernier bien effectivement ouvert », et non « dernier sélectionné dans une liste ». C'est ce
// que `active_dossier_id` promet, et le seul contrat qui survive aux liens directs : ouvrir
// `/rapport/logement?dossierId=…` depuis un e-mail ou un signet laissait sinon le hub sur un autre
// bien.
//
// ── UN TRIPLET, JAMAIS UN CHAMP SEUL (revue du 11/08/2026) ───────────────────────────────────
// Une première version n'écrivait que le dossier. Vérifié au navigateur : contexte sur La Rochelle,
// ouverture directe du logement nantais, la page montrait bien Nantes et AskFuture proposait
// « Une question sur La Rochelle ? ». Le bien actif et le territoire actif se contredisaient.
//
// Les trois colonnes disent UNE seule chose, « ce que le lecteur consulte », et se posent ensemble.
// Le territoire reste au grain COMMUNE : `dossier.insee` est le code local, donc l'arrondissement
// pour PLM, et poser 75101 ferait lire « Paris 1er » à tous les écrans de commune.
//
// ── CE QUE CE MODULE N'EST PAS ───────────────────────────────────────────────────────────────
// Ni un droit, ni une autorisation. L'appelant a déjà vérifié la propriété du dossier ; on ne fait
// que retenir. `choisirDossierActif` ignore d'ailleurs le bien dès qu'il désigne une autre commune.
// ════════════════════════════════════════════════════════════════════════════════════════════

export type ContexteDeLecture = { id: string; insee: string; city: string | null };

export async function marquerDossierActif(
  sb: SupabaseClient, userId: string, dossier: ContexteDeLecture,
): Promise<boolean> {
  const { error } = await sb
    .from("user_profiles")
    .update({
      active_dossier_id: dossier.id,
      active_insee_code: communeParent(dossier.insee),
      active_commune: dossier.city,
    })
    .eq("user_id", userId);
  if (error) {
    // Journalisé ET RENDU (revue du 11/08/2026). L'échec ne se voyait nulle part : la route
    // répondait `{ ok: true }` sur une écriture qui n'avait pas eu lieu, et le symptôme, un hub qui
    // rouvre un autre bien, arrivait plus tard, ailleurs, sans lien apparent avec cette panne.
    console.error("[dossier-actif] écriture échouée", { userId, dossierId: dossier.id, error });
    return false;
  }
  return true;
}
