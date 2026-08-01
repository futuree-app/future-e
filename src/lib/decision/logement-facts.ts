// Adaptateur PUR : données de décision (statut par famille) + DPE sauvegardé -> LogementFacts. Sans
// project (faits intrinsèques ; la doctrine projet-relative vit dans les règles). Value-import
// energyState (decision/logement-coverage.ts, pur) ; type-only le reste -> node-testable.
import { energyState } from "./logement-coverage.ts";
import { deriveThermalEvidence } from "../thermal-evidence.ts";
import type { LogementDecisionData } from "../server/logement-decision-data.ts";
import type { DpeRecord } from "../dpe.ts";
import type { LogementFacts } from "./decision-fact.ts";

export function buildLogementFacts(data: LogementDecisionData, savedDpe: DpeRecord | null, addressLabel = "cette adresse"): LogementFacts {
  const rgaNotable = data.rga.coverage === "present" && !!data.rga.label && /moyen|fort|élev/i.test(data.rga.label);
  // LA MÉTHODE PRIME, et c'est le garde-fou : `deriveThermalEvidence` rend `indicator: null` dès que
  // le DPE a été généré à l'immeuble. On ne conclut donc au confort d'été que sur un diagnostic qui
  // décrit ce logement-là.
  const thermal = deriveThermalEvidence(savedDpe);
  return {
    dpe: energyState(savedDpe?.etiquette_dpe ?? null),
    confortEteInsuffisant: thermal.indicator === "insuffisant",
    dpeLabel: savedDpe?.etiquette_dpe ?? null,
    rga: data.rga.coverage, expositionBati: rgaNotable,
    pprn: data.pprn.coverage, zoneReglementee: data.pprn.coverage === "present" && data.pprn.count > 0, pprnLabel: data.pprn.label,
    cavites: data.cavites.coverage, caviteProche: data.cavites.coverage === "present" && data.cavites.count > 0,
    patrimoine: data.patrimoine.coverage, perimetrePatrimonial: data.patrimoine.coverage === "present" && data.patrimoine.count > 0,
    sinistralite: data.sinistralite.coverage, sinistraliteActive: data.sinistralite.coverage === "present" && data.sinistralite.active,
    addressLabel,
  };
}
