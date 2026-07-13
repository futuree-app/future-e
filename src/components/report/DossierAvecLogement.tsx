// Augmentation Logement streamée (Server Component async). Suspense gère le "pending" (fallback) ;
// ce catch TYPÉ gère le "unavailable" (un bug d'adaptateur/règle/assembleur remonte). Faits communs
// reçus en prop (mêmes que le fallback, pas de reload).
import { fetchLogementDecisionDataWithTimeout, LogementDataUnavailableError, type ResolvedAddress } from "@/lib/server/logement-decision-data";
import { buildLogementFacts } from "@/lib/decision/logement-facts";
import { runRules } from "@/lib/decision/materiality-rules";
import { assembleDossier } from "@/lib/decision/decision-assembler";
import { DossierDecisionSection } from "@/components/report/DossierDecisionSection";
import type { Dossier, ModuleFacts } from "@/lib/decision/decision-fact";
import type { DpeRecord } from "@/lib/dpe";
import type { UserProject } from "@/lib/user-project";

export async function DossierAvecLogement({
  project, address, savedDpe, communeFacts, communeDossier, logementLink, insee, scopeKey,
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
}) {
  try {
    const data = await fetchLogementDecisionDataWithTimeout(address);
    const logement = buildLogementFacts(data, savedDpe, address.label);
    const facts: ModuleFacts = { ...communeFacts, hasAddress: true, logement };
    const dossier = assembleDossier(runRules(facts, project), project, "commune+adresse");
    return (
      <DossierDecisionSection
        dossier={dossier} logement={logementLink} logementStatus="done"
        insee={insee} scopeKey={scopeKey}
      />
    );
  } catch (error) {
    if (error instanceof LogementDataUnavailableError) {
      // Le dossier COMMUNE devient le dossier final : sa conclusion peut être rédigée, au scope commune.
      return (
        <DossierDecisionSection
          dossier={communeDossier} logement={logementLink} logementStatus="unavailable"
          insee={insee} scopeKey="commune"
        />
      );
    }
    throw error; // bug de code : reste visible (frontière d'erreur / observabilité)
  }
}
