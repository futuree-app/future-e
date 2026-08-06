import "server-only";
import {
  fetchLogementDecisionDataWithTimeout, LogementDataUnavailableError, type ResolvedAddress,
} from "@/lib/server/logement-decision-data";
import { buildLogementFacts } from "@/lib/decision/logement-facts";
import { buildSecteurFacts } from "@/lib/decision/secteur-facts";
import { getCarOwnershipAtPoint } from "@/lib/server/iris-logement-store";
import { runRules } from "@/lib/decision/materiality-rules";
import { assembleDossier } from "@/lib/decision/decision-assembler";
import { composeFacts } from "@/lib/decision/fact-compositions";
import { withEvaluationPoint } from "@/lib/decision/territory-facts";
import type { Dossier, ModuleFacts } from "@/lib/decision/decision-fact";
import type { EvaluationContext } from "@/lib/hard-constraints";
import type { DpeRecord } from "@/lib/dpe";
import type { UserProject } from "@/lib/user-project";
import type { PermisSnapshot } from "@/lib/logement-autour-types";

// ════════════════════════════════════════════════════════════════════════════════════════════
// L'ASSEMBLAGE DU DOSSIER AU GRAIN ADRESSE.
//
// POURQUOI IL A QUITTÉ `DossierAvecLogement` (05/08/2026). Ce pipeline vivait dans le corps d'un
// Server Component, donc il n'existait qu'AU MOMENT DE RENDRE UNE PAGE. La génération de l'artefact
// de décision se fait au webhook Stripe, hors de toute page : sans cette extraction, il aurait
// fallu réécrire le même enchaînement une seconde fois, et les deux auraient divergé au premier
// enrichissement — c'est exactement ce que le commentaire de `autour-response.ts` raconte pour la
// réponse Autour, où trois chemins rendaient trois résultats différents.
//
// Le composant appelle cette fonction, le webhook aussi. Il n'y a plus qu'un seul assemblage.
// ════════════════════════════════════════════════════════════════════════════════════════════

export type AddressDossierResult = {
  dossier: Dossier;
  /** `unavailable` : la lecture Logement n'a pas abouti, le dossier communal fait office. */
  status: "done" | "unavailable";
  scope: string;
};

export async function assembleAddressDossier(input: {
  project: UserProject;
  address: ResolvedAddress;
  savedDpe: DpeRecord | null;
  communeFacts: ModuleFacts;
  /** Le dossier de repli, déjà assemblé au grain commune. */
  communeDossier: Dossier;
  hard: EvaluationContext;
  scopeKey: string;
  /**
   * LE REGISTRE DES AUTORISATIONS, gelé à l'analyse du dossier. `null` (ou absent) veut dire NON
   * CONSULTÉ, et la règle rend alors `uncertain` : jamais une absence d'autorisation qui n'a pas
   * été établie. Aucune I/O ici, la donnée arrive déjà figée dans le snapshot du dossier.
   */
  permis?: PermisSnapshot | null;
}): Promise<AddressDossierResult> {
  const { project, address, savedDpe, communeFacts, communeDossier, hard, scopeKey, permis } = input;
  try {
    const data = await fetchLogementDecisionDataWithTimeout(address);
    const logement = buildLogementFacts(data, savedDpe, address.label);
    // LE SECTEUR ENTRE DANS LE MOTEUR. Lecture locale (artefact INSEE + résolution IRIS au point) :
    // en panne, elle rend `unknown` et la règle se tait — jamais d'erreur qui coûterait le dossier.
    const car = await getCarOwnershipAtPoint(address.latitude, address.longitude, address.citycode)
      .catch(() => null);
    const facts: ModuleFacts = {
      ...communeFacts, hasAddress: true, logement, secteur: buildSecteurFacts(car),
      // LE REGISTRE ENTRE DANS LE MOTEUR. Aucune I/O : la donnée est déjà gelée dans le snapshot du
      // dossier. `undefined` quand elle est absente, pour que la règle distingue « non consulté »
      // de « rien trouvé ».
      ...(permis ? { permis } : {}),
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
    return {
      dossier: assembleDossier(run, project, "commune+adresse", facts.nom, composeFacts(run, facts, project)),
      status: "done",
      scope: scopeKey,
    };
  } catch (error) {
    if (!(error instanceof LogementDataUnavailableError)) {
      throw error; // bug de code : reste visible (frontière d'erreur / observabilité)
    }
    // Le dossier COMMUNE devient le dossier final : sa conclusion peut être rédigée, au scope commune.
    //
    // CE REPLI NE DOIT JAMAIS DEVENIR UN ARTEFACT. À l'écran il vaut mieux qu'une page en erreur ;
    // figé comme la version vendue d'un dossier d'ADRESSE, il priverait définitivement l'acheteur
    // de ce qu'il a payé. Le générateur lit `status` pour cette raison.
    return { dossier: communeDossier, status: "unavailable", scope: "commune" };
  }
}
