// Augmentation Logement streamée (Server Component async). Suspense gère le "pending" (fallback) ;
// ce catch TYPÉ gère le "unavailable" (un bug d'adaptateur/règle/assembleur remonte). Faits communs
// reçus en prop (mêmes que le fallback, pas de reload).
import { fetchLogementDecisionDataWithTimeout, LogementDataUnavailableError, type ResolvedAddress } from "@/lib/server/logement-decision-data";
import { buildLogementFacts } from "@/lib/decision/logement-facts";
import { buildSecteurFacts } from "@/lib/decision/secteur-facts";
import { getCarOwnershipAtPoint } from "@/lib/server/iris-logement-store";
import { runRules } from "@/lib/decision/materiality-rules";
import { assembleDossier } from "@/lib/decision/decision-assembler";
import { composeFacts } from "@/lib/decision/fact-compositions";
import { withEvaluationPoint } from "@/lib/decision/territory-facts";
import { DossierDecisionSection } from "@/components/report/DossierDecisionSection";
import { ControlesDuDossier } from "@/components/report/ControlesDuDossier";
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
  // Ce que la page rendra : le dossier augmenté de l'adresse, ou le dossier communal si la lecture
  // du logement n'a pas abouti.
  let vue: { dossier: Dossier; status: "done" | "unavailable"; scope: string };
  try {
    const data = await fetchLogementDecisionDataWithTimeout(address);
    const logement = buildLogementFacts(data, savedDpe, address.label);
    // LE SECTEUR ENTRE DANS LE MOTEUR. Lecture locale (artefact INSEE + résolution IRIS au point) :
    // en panne, elle rend `unknown` et la règle se tait — jamais d'erreur qui coûterait le dossier.
    const car = await getCarOwnershipAtPoint(address.latitude, address.longitude, address.citycode)
      .catch(() => null);
    const facts: ModuleFacts = {
      ...communeFacts, hasAddress: true, logement, secteur: buildSecteurFacts(car),
    };
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
    vue = {
      dossier: assembleDossier(run, project, "commune+adresse", facts.nom, composeFacts(run, facts, project)),
      status: "done",
      scope: scopeKey,
    };
  } catch (error) {
    if (!(error instanceof LogementDataUnavailableError)) {
      throw error; // bug de code : reste visible (frontière d'erreur / observabilité)
    }
    // Le dossier COMMUNE devient le dossier final : sa conclusion peut être rédigée, au scope commune.
    vue = { dossier: communeDossier, status: "unavailable", scope: "commune" };
  }

  // LE RENDU EST HORS DU `try`, et ce n'est pas une préférence de style : React ne rend pas un
  // composant au moment où son JSX est construit, donc une erreur de rendu ne serait PAS attrapée
  // par ce catch, qui promettrait pourtant de la traiter. Le try ne couvre que ce qu'il peut
  // vraiment couvrir : le chargement et l'assemblage.
  return (
    <>
      <DossierDecisionSection
        dossier={vue.dossier} logement={logementLink} logementStatus={vue.status}
        insee={insee} scopeKey={vue.scope}
      />
      {/* La liste complète des contrôles est rendue par le MÊME dossier que la minute : une liste
          construite ailleurs, sur le dossier communal, contredirait le compte que le verdict vient
          d'annoncer. */}
      <ControlesDuDossier dossier={vue.dossier} />
    </>
  );
}
