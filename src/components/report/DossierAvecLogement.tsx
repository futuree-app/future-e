// Augmentation Logement streamée (Server Component async). Suspense gère le "pending" (fallback) ;
// ce catch TYPÉ gère le "unavailable" (un bug d'adaptateur/règle/assembleur remonte). Faits communs
// reçus en prop (mêmes que le fallback, pas de reload).
import { fetchLogementDecisionDataWithTimeout, LogementDataUnavailableError, type ResolvedAddress } from "@/lib/server/logement-decision-data";
import { buildLogementFacts } from "@/lib/decision/logement-facts";
import { runRules } from "@/lib/decision/materiality-rules";
import { assembleDossier } from "@/lib/decision/decision-assembler";
import { composeFacts } from "@/lib/decision/fact-compositions";
import { withEvaluationPoint } from "@/lib/decision/territory-facts";
import { DossierDecisionSection } from "@/components/report/DossierDecisionSection";
import type { Dossier, ModuleFacts } from "@/lib/decision/decision-fact";
import type { EvaluationContext } from "@/lib/hard-constraints";
import type { DpeRecord } from "@/lib/dpe";
import type { UserProject } from "@/lib/user-project";

export async function DossierAvecLogement({
  project, address, savedDpe, communeFacts, communeDossier, logementLink, insee, scopeKey, hard,
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
}) {
  try {
    const data = await fetchLogementDecisionDataWithTimeout(address);
    const logement = buildLogementFacts(data, savedDpe, address.label);
    const facts: ModuleFacts = { ...communeFacts, hasAddress: true, logement };
    // LE GRAIN CHANGE. Une commune peut passer sur son point de référence et échouer pour une adresse
    // située à son extrémité : ce n'est pas une divergence de moteur, c'est une lecture plus fine, et la
    // phrase le dit (« Cette adresse est à 42 km de… », au lieu de « Le point de référence de X… »).
    //
    // ET LA DEMANDE CHANGE AVEC LUI : le temps de trajet est RECALCULÉ depuis l'adresse. Traîner celui de
    // la commune trancherait le sort de l'adresse avec la durée d'un autre lieu (le noyau le refuserait,
    // mais on ne s'en remet pas à ce filet : on mesure ce qu'on évalue).
    const hardAtAddress: EvaluationContext = await withEvaluationPoint(hard, {
      lat: address.latitude, lon: address.longitude,
      grain: "address", source: "address_geocoder", label: address.label,
    });
    const run = runRules(facts, project, hardAtAddress);
    const dossier = assembleDossier(run, project, "commune+adresse", facts.nom, composeFacts(run, facts, project));
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
