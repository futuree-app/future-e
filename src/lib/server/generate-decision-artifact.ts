import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { buildCommuneDossier } from "@/lib/decision/territory-facts";
import { assembleAddressDossier } from "@/lib/server/assemble-address-dossier";
import { buildDecisionArtifact, artifactScopeKey } from "@/lib/decision/decision-artifact";
import {
  claimArtifactSlot, completeArtifact, failArtifact,
} from "@/lib/server/decision-artifact-store";
import { PRODUCT_CONVENTIONS_VERSION } from "@/lib/hard-constraints";
import type { ResolvedAddress } from "@/lib/server/logement-decision-data";
import type { DpeRecord } from "@/lib/dpe";
import type { UserProject } from "@/lib/user-project";

// ════════════════════════════════════════════════════════════════════════════════════════════
// LA GÉNÉRATION DE L'ARTEFACT DE DÉCISION, À LA DÉLIVRANCE.
//
// POURQUOI À L'ACHAT ET NON À LA PREMIÈRE OUVERTURE. La première ouverture semble plus simple, et
// elle rate le sujet : quelqu'un qui achète le 5 août et ne revient que le 20 septembre recevrait
// le moteur de septembre comme si c'était le dossier qu'il a payé. C'est exactement le défaut que
// ce lot corrige.
//
// CE MODULE NE LÈVE JAMAIS. Il est appelé depuis le webhook Stripe, après la pose des droits :
// une génération ratée ne doit ni faire échouer le webhook, ni provoquer un rejeu Stripe, ni
// refuser au client l'accès qu'il a payé. L'échec se marque en base et se rattrape.
// ════════════════════════════════════════════════════════════════════════════════════════════

type Cible =
  | { kind: "commune"; insee: string }
  | {
      kind: "adresse";
      insee: string;
      dossierId: string;
      address: ResolvedAddress;
      savedDpe: DpeRecord | null;
    };

export type GenerationOutcome =
  | { status: "ready" }
  | { status: "skipped"; reason: string }
  | { status: "failed"; reason: string };

export async function generateDecisionArtifact(
  sb: SupabaseClient, userId: string, project: UserProject, cible: Cible,
): Promise<GenerationOutcome> {
  const scopeKey = artifactScopeKey(cible.kind === "adresse" ? cible.dossierId : null);
  try {
    // LA PLACE SE RÉSERVE AVANT DE TRAVAILLER. Deux webhooks concurrents, ou un rejeu Stripe,
    // constateraient sinon tous deux qu'aucun artefact n'existe et généreraient deux fois. Le perdant
    // s'arrête ici, sur la contrainte unique de la table.
    const reserve = await claimArtifactSlot(sb, userId, cible.insee, scopeKey);
    if (!reserve) return { status: "skipped", reason: "artefact déjà réservé pour cette version" };

    const commune = await buildCommuneDossier(cible.insee, project, {
      hasAddress: cible.kind === "adresse",
      citycode: cible.kind === "adresse" ? cible.address.citycode : null,
    });
    if (!commune) {
      await failArtifact(sb, userId, cible.insee, scopeKey);
      return { status: "failed", reason: `commune ${cible.insee} introuvable` };
    }

    if (cible.kind === "commune") {
      const artefact = buildDecisionArtifact(
        commune.dossier, project, new Date().toISOString(), PRODUCT_CONVENTIONS_VERSION,
      );
      await completeArtifact(sb, userId, cible.insee, scopeKey, artefact);
      return { status: "ready" };
    }

    const vue = await assembleAddressDossier({
      project,
      address: cible.address,
      savedDpe: cible.savedDpe,
      communeFacts: commune.moduleFacts,
      communeDossier: commune.dossier,
      hard: commune.hard,
      scopeKey,
    });

    // ON N'ENREGISTRE JAMAIS UN REPLI COMME LA VERSION VENDUE.
    // ══════════════════════════════════════════════════════════════════════════════════════════
    // Quand la lecture Logement n'aboutit pas, `assembleAddressDossier` rend le dossier COMMUNAL,
    // et c'est le bon comportement À L'ÉCRAN : mieux vaut un dossier partiel qu'une page en erreur.
    // Figé comme l'artefact d'un dossier d'ADRESSE payé 39 €, ce même repli priverait
    // définitivement l'acheteur de ce qu'il a acheté, et personne ne s'en apercevrait puisque la
    // page afficherait un dossier d'apparence normale.
    //
    // L'échec est donc marqué, la place reste prise, et la génération se rejoue.
    if (vue.status !== "done") {
      await failArtifact(sb, userId, cible.insee, scopeKey);
      return { status: "failed", reason: "lecture Logement indisponible, repli communal non figé" };
    }

    const artefact = buildDecisionArtifact(
      vue.dossier, project, new Date().toISOString(), PRODUCT_CONVENTIONS_VERSION,
    );
    await completeArtifact(sb, userId, cible.insee, scopeKey, artefact);
    return { status: "ready" };
  } catch (error) {
    // Le marquage lui-même peut échouer (base injoignable) : on ne laisse pas cette seconde panne
    // remonter, sinon elle masquerait la première et ferait tomber le webhook.
    await failArtifact(sb, userId, cible.insee, scopeKey).catch(() => {});
    return { status: "failed", reason: error instanceof Error ? error.message : String(error) };
  }
}
