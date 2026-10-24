// Adaptateur PUR : données de décision (statut par famille) + DPE sauvegardé -> LogementFacts. Sans
// project (faits intrinsèques ; la doctrine projet-relative vit dans les règles). Value-import
// energyState (decision/logement-coverage.ts, pur) ; type-only le reste -> node-testable.
import { energyState } from "./logement-coverage.ts";
import { deriveThermalEvidence } from "../thermal-evidence.ts";
import type { LogementDecisionData } from "../server/logement-decision-data.ts";
import type { DpeRecord } from "../dpe.ts";
import type { LogementFacts, ConfortEteFait, ConfortEteCle } from "./decision-fact.ts";

/**
 * LE CONFORT D'ÉTÉ DOCUMENTÉ, depuis le DPE attribué (FUT-20). Toujours via `deriveThermalEvidence` :
 * la méthode prime (un DPE généré à l'immeuble reste au niveau bâtiment même s'il porte le bloc
 * confort), et c'est la même dérivation que `confortEteInsuffisant` et le module Logement.
 *
 * `protection_solaire: false` vaut « non renseignées » (c'est le libellé de `deriveThermalEvidence`) :
 * la base publie 0 quand le diagnostiqueur n'a rien saisi, et l'on n'affirme pas une absence.
 */
export function confortEteDepuisDpe(savedDpe: DpeRecord | null): ConfortEteFait {
  const ev = deriveThermalEvidence(savedDpe);
  const tous = [...ev.factors, ...ev.drawerFields];
  const caracteristiques = tous.map((f) => ({ cle: f.key as ConfortEteCle, libelle: f.label, sens: f.polarity }));
  const dateDiagnostic = savedDpe?.date_dpe ?? null;
  if (ev.level === "A_EXACT_UNIT") {
    const nonRenseignees: ConfortEteFait["nonRenseignees"] = [];
    if (savedDpe?.traversant == null) nonRenseignees.push("traversant");
    if (savedDpe?.protection_solaire !== true) nonRenseignees.push("protection");
    return {
      niveau: "logement", indicateur: ev.indicator, methode: null,
      // La protection « non renseignée » n'est pas une caractéristique : elle part dans `nonRenseignees`.
      caracteristiques: caracteristiques.filter((c) => !(c.cle === "protection" && savedDpe?.protection_solaire !== true)),
      nonRenseignees, dateDiagnostic,
    };
  }
  if (ev.level === "B1_EXACT_BUILDING") {
    return {
      niveau: "batiment", indicateur: null, methode: ev.methodWording === "immeuble" ? "immeuble" : "sans_bloc",
      caracteristiques, nonRenseignees: ["traversant", "protection"], dateDiagnostic,
    };
  }
  return { niveau: "aucun", indicateur: null, methode: null, caracteristiques: [], nonRenseignees: ["traversant", "protection"], dateDiagnostic: null };
}

export function buildLogementFacts(data: LogementDecisionData, savedDpe: DpeRecord | null, addressLabel = "cette adresse"): LogementFacts {
  const rgaNotable = data.rga.coverage === "present" && !!data.rga.label && /moyen|fort|élev/i.test(data.rga.label);
  // LA MÉTHODE PRIME, et c'est le garde-fou : `deriveThermalEvidence` rend `indicator: null` dès que
  // le DPE a été généré à l'immeuble. On ne conclut donc au confort d'été que sur un diagnostic qui
  // décrit ce logement-là.
  const thermal = deriveThermalEvidence(savedDpe);
  return {
    dpe: energyState(savedDpe?.etiquette_dpe ?? null),
    confortEteInsuffisant: thermal.indicator === "insuffisant",
    confortEte: confortEteDepuisDpe(savedDpe),
    dpeLabel: savedDpe?.etiquette_dpe ?? null,
    rga: data.rga.coverage, expositionBati: rgaNotable,
    pprn: data.pprn.coverage, zoneReglementee: data.pprn.coverage === "present" && data.pprn.count > 0, pprnLabel: data.pprn.label,
    cavites: data.cavites.coverage, caviteProche: data.cavites.coverage === "present" && data.cavites.count > 0,
    patrimoine: data.patrimoine.coverage, perimetrePatrimonial: data.patrimoine.coverage === "present" && data.patrimoine.count > 0,
    sinistralite: data.sinistralite.coverage, sinistraliteActive: data.sinistralite.coverage === "present" && data.sinistralite.active,
    // FUT-127 : absent d'une donnée antérieure (le champ n'existait pas), présent dès qu'elle est dérivée.
    ...(data.zonageInondation ? { zonageInondation: data.zonageInondation } : {}),
    addressLabel,
  };
}
