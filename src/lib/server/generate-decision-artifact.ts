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
import type { Face3Snapshot, PermisSnapshot } from "@/lib/logement-autour-types";

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

/**
 * LE RATTRAPAGE DES DOSSIERS ANTÉRIEURS AU LOT (05/08/2026).
 *
 * Un dossier acheté avant ce lot n'a pas d'artefact, et n'en aurait JAMAIS eu : la génération se
 * fait au webhook, et son paiement est passé. Il aurait donc continué de se réécrire indéfiniment,
 * exactement comme avant, sans que rien ne le distingue d'un dossier figé. Le lot aurait été
 * complet pour les ventes futures et sans effet sur les ventes faites.
 *
 * ── LA DATE EST CELLE D'AUJOURD'HUI, ET C'EST LE SEUL CHOIX HONNÊTE ──────────────────────────
 * On ne peut pas reconstituer ce que le moteur disait le jour de l'achat : ce moteur n'existe plus.
 * Antidater l'artefact ferait passer une lecture d'aujourd'hui pour une lecture d'alors, ce qui est
 * précisément le mensonge que ce lot supprime. Le dossier est donc figé À PARTIR DE MAINTENANT, et
 * il le dit.
 *
 * ── IL NE PEUT PAS DOUBLER LE WEBHOOK ────────────────────────────────────────────────────────
 * Sur un achat récent, le webhook a déjà réservé la place ; `claimArtifactSlot` rend alors `false`
 * et ce rattrapage s'arrête sans rien produire. L'idempotence de la table couvre les deux chemins.
 *
 * Sans effet de bord visible : appelé depuis `after()`, il ne retarde aucun rendu, et son échec
 * laisse le dossier s'afficher comme avant.
 */
/**
 * Le registre tel qu'il a été gelé dans le snapshot du dossier, ou `null` s'il n'y en a pas encore
 * (dossier tout juste acheté, page « Autour » jamais ouverte) ou si la lecture échoue.
 */
async function lirePermisGele(
  sb: SupabaseClient, dossierId: string,
): Promise<PermisSnapshot | null> {
  const { data } = await sb
    .from("address_dossiers")
    .select("snapshot")
    .eq("id", dossierId)
    .maybeSingle();
  return (data?.snapshot as Face3Snapshot | null)?.permis ?? null;
}

/**
 * `version` : la place à réserver. Elle vaut 1 pour un premier figement (webhook, rattrapage d'un
 * dossier antérieur). Elle vaut la suivante quand une version PRÊTE existe et qu'une pièce apportée
 * par le lecteur l'a périmée : la précédente reste en base, et `readLatestArtifact` sert la plus
 * haute. Une version prête ne se réécrit jamais, c'est la promesse de la migration 28.
 */
export async function generateDecisionArtifact(
  sb: SupabaseClient, userId: string, project: UserProject, cible: Cible, version = 1,
): Promise<GenerationOutcome> {
  const scopeKey = artifactScopeKey(cible.kind === "adresse" ? cible.dossierId : null);
  try {
    // LA PLACE SE RÉSERVE AVANT DE TRAVAILLER. Deux webhooks concurrents, ou un rejeu Stripe,
    // constateraient sinon tous deux qu'aucun artefact n'existe et généreraient deux fois. Le perdant
    // s'arrête ici, sur la contrainte unique de la table.
    const reserve = await claimArtifactSlot(sb, userId, cible.insee, scopeKey, version);
    if (!reserve) return { status: "skipped", reason: "artefact déjà réservé pour cette version" };

    const commune = await buildCommuneDossier(cible.insee, project, {
      hasAddress: cible.kind === "adresse",
      citycode: cible.kind === "adresse" ? cible.address.citycode : null,
    });
    if (!commune) {
      await failArtifact(sb, userId, cible.insee, scopeKey, version);
      return { status: "failed", reason: `commune ${cible.insee} introuvable` };
    }

    if (cible.kind === "commune") {
      const artefact = buildDecisionArtifact(
        commune.dossier, project, new Date().toISOString(), PRODUCT_CONVENTIONS_VERSION,
      );
      await completeArtifact(sb, userId, cible.insee, scopeKey, artefact, version);
      return { status: "ready" };
    }

    // LE REGISTRE DES AUTORISATIONS SE LIT ICI, ET NON DEPUIS L'APPELANT.
    // ══════════════════════════════════════════════════════════════════════════════════════════
    // Il est gelé dans le snapshot du dossier, écrit par la page « Autour ». S'il ne remontait pas
    // jusqu'ici, l'écran et l'artefact ne diraient pas la même chose : la page assemblée montre le
    // contrôle des permis, l'artefact figé dans la foulée l'aurait perdu, et le rechargement
    // suivant, servi par l'artefact, ferait disparaître une carte que le lecteur venait de voir.
    //
    // Le lire en base plutôt que le recevoir en paramètre évite qu'un appelant futur l'oublie. Une
    // lecture qui échoue vaut « non consulté » : la règle rend `uncertain`, jamais une absence
    // d'autorisation qu'on n'a pas établie.
    const permis = await lirePermisGele(sb, cible.dossierId);

    const vue = await assembleAddressDossier({
      project,
      address: cible.address,
      savedDpe: cible.savedDpe,
      communeFacts: commune.moduleFacts,
      communeDossier: commune.dossier,
      hard: commune.hard,
      scopeKey,
      permis,
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
      await failArtifact(sb, userId, cible.insee, scopeKey, version);
      return { status: "failed", reason: "lecture Logement indisponible, repli communal non figé" };
    }

    const artefact = buildDecisionArtifact(
      vue.dossier, project, new Date().toISOString(), PRODUCT_CONVENTIONS_VERSION,
    );
    await completeArtifact(sb, userId, cible.insee, scopeKey, artefact, version);
    return { status: "ready" };
  } catch (error) {
    // Le marquage lui-même peut échouer (base injoignable) : on ne laisse pas cette seconde panne
    // remonter, sinon elle masquerait la première et ferait tomber le webhook.
    await failArtifact(sb, userId, cible.insee, scopeKey, version).catch(() => {});
    return { status: "failed", reason: error instanceof Error ? error.message : String(error) };
  }
}
