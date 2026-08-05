// Augmentation Logement streamée (Server Component async). Suspense gère le "pending" (fallback) ;
// ce catch TYPÉ gère le "unavailable" (un bug d'adaptateur/règle/assembleur remonte). Faits communs
// reçus en prop (mêmes que le fallback, pas de reload).
//
// L'ASSEMBLAGE A QUITTÉ CE FICHIER le 05/08/2026, pour `server/assemble-address-dossier.ts` : le
// webhook Stripe doit produire le même dossier hors de toute page, et un pipeline qui n'existe que
// dans le corps d'un composant ne se rejoue pas. Ce composant ne fait plus que demander et rendre.
import { assembleAddressDossier } from "@/lib/server/assemble-address-dossier";
import { readLatestArtifact } from "@/lib/server/decision-artifact-store";
import { dossierAServir } from "@/lib/decision/decision-artifact";
import { createClient } from "@/lib/supabase/server";
import type { ResolvedAddress } from "@/lib/server/logement-decision-data";
import { DossierDecisionSection } from "@/components/report/DossierDecisionSection";
import { ControlesDuDossier } from "@/components/report/ControlesDuDossier";
import type { Dossier, ModuleFacts } from "@/lib/decision/decision-fact";
import type { EvaluationContext } from "@/lib/hard-constraints";
import type { DpeRecord } from "@/lib/dpe";
import type { UserProject } from "@/lib/user-project";

export async function DossierAvecLogement({
  project, address, savedDpe, communeFacts, communeDossier, logementLink, insee, scopeKey, hard,
  userId,
}: {
  project: UserProject;
  address: ResolvedAddress;
  savedDpe: DpeRecord | null;
  communeFacts: ModuleFacts;
  communeDossier: Dossier;
  logementLink: { href: string; label: string } | null;
  // Slice 2 : identité de l'artefact narratif de CE dossier (augmenté de l'adresse).
  insee: string;
  scopeKey: string;
  // Les contraintes dures déjà hydratées au grain de la commune (références résolues une seule fois,
  // au-dessus des deux moteurs). On n'en change que le POINT.
  hard: EvaluationContext;
  /** Le compte qui lit, pour retrouver son artefact. */
  userId: string;
}) {
  // L'ARTEFACT PASSE AVANT L'ASSEMBLAGE (05/08/2026).
  // ══════════════════════════════════════════════════════════════════════════════════════════
  // Ce qui a été vendu est la lecture du jour de l'achat, pas celle du moteur d'aujourd'hui. Quand
  // l'artefact existe, on ne rejoue RIEN : ni les huit lectures externes, ni les règles. C'est ce
  // qui rend la relecture reproductible, et accessoirement instantanée.
  //
  // Son absence n'est pas une panne : les dossiers achetés avant ce lot n'en ont pas, et une
  // génération peut avoir échoué. On assemble alors comme avant, et la date ne s'affiche pas,
  // puisqu'une lecture recalculée à l'instant n'a pas d'âge.
  const sb = await createClient();
  const stocke = await readLatestArtifact(sb, userId, insee, scopeKey).catch(() => null);

  // L'ASSEMBLAGE N'EST DEMANDÉ QUE S'IL SERVIRA. Un artefact prêt évite les huit lectures externes
  // et le moteur entier : c'est ce qui rend la relecture reproductible, et accessoirement immédiate.
  const assemble = stocke?.artifact
    ? null
    : await assembleAddressDossier({
        project, address, savedDpe, communeFacts, communeDossier, hard, scopeKey,
      });
  const servi = dossierAServir(stocke, assemble?.dossier ?? communeDossier);
  const vue = {
    dossier: servi.dossier,
    status: servi.source === "artefact" ? ("done" as const) : (assemble?.status ?? "unavailable"),
    scope: servi.source === "artefact" ? scopeKey : (assemble?.scope ?? "commune"),
  };

  // LE RENDU EST HORS DE TOUT `try`, et ce n'est pas une préférence de style : React ne rend pas un
  // composant au moment où son JSX est construit, donc une erreur de rendu ne serait PAS attrapée
  // par un catch posé ici, qui promettrait pourtant de la traiter. Le rattrapage vit dans
  // `assembleAddressDossier` et ne couvre que ce qu'il peut vraiment couvrir : le chargement et
  // l'assemblage.
  return (
    <>
      <DossierDecisionSection
        dossier={vue.dossier} logement={logementLink} logementStatus={vue.status}
        insee={insee} scopeKey={vue.scope} generatedAt={servi.generatedAt}
      />
      {/* La liste complète des contrôles est rendue par le MÊME dossier que la minute : une liste
          construite ailleurs, sur le dossier communal, contredirait le compte que le verdict vient
          d'annoncer. */}
      <ControlesDuDossier dossier={vue.dossier} />
    </>
  );
}
