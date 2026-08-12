import "server-only";
import { after } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";

// ════════════════════════════════════════════════════════════════════════════════════════════
// LE BIEN ACTIF SUIT CE QUE LE LECTEUR OUVRE VRAIMENT.
//
// ── LE CONTRAT, TRANCHÉ LE 11/08/2026 ────────────────────────────────────────────────────────
// « Dernier bien effectivement ouvert », et non « dernier sélectionné dans la liste ». C'est ce que
// le nom `active_dossier_id` promet, c'est ce qu'un lecteur attend, et c'est le seul contrat qui
// survive aux liens directs : ouvrir `/rapport/logement?dossierId=…` en revenant d'un e-mail, d'un
// signet ou d'un lien du hub laissait sinon le hub sur un autre bien.
//
// Vérifié en revue navigateur : ouverture directe de l'Evescot, retour au hub, Saint-Dominique
// restait actif. Le produit affichait une identité qu'il ne transportait pas.
//
// ── POURQUOI `after()` ───────────────────────────────────────────────────────────────────────
// C'est une écriture sur une lecture. Elle ne doit ni retarder le rendu, ni le faire échouer : le
// lecteur a le droit de voir son bien même si la préférence ne s'enregistre pas. L'échec se
// journalise, il ne remonte pas.
//
// ── CE QUE CETTE VALEUR N'EST PAS ────────────────────────────────────────────────────────────
// Ni un droit, ni une autorisation. L'appelant a DÉJÀ vérifié que le dossier appartient au lecteur
// (`getDossier` filtre par `user_id` et par la RLS) : cette fonction ne fait que retenir, elle
// n'autorise rien. `choisirDossierActif` l'ignore d'ailleurs dès qu'elle désigne une autre commune.
// ════════════════════════════════════════════════════════════════════════════════════════════

export function marquerDossierActif(sb: SupabaseClient, userId: string, dossierId: string): void {
  after(async () => {
    const { error } = await sb
      .from("user_profiles")
      .update({ active_dossier_id: dossierId })
      .eq("user_id", userId);
    if (error) {
      // Journalisé, jamais tu : le symptôme visible serait un hub qui rouvre un autre bien, soit
      // exactement le défaut que cette colonne corrige. Sans cette ligne, il serait indétectable.
      console.error("[dossier-actif] écriture échouée", { userId, dossierId, error });
    }
  });
}
