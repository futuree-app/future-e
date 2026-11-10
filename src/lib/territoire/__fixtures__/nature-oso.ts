// FUT-182 : une entrée `nature` de l'index (méthode « secteur habité »), construite pour un test à partir des parts des
// terres. Les postes absents valent 0 ; `eau` est la part de l'eau dans la surface cartographiée. Le secteur habité est
// « classe » à 100 % de couverture française, de valeur `secteur` (30 par défaut).
import type { TerritoireIndexEntry } from "../facts.ts";

export type PartsTest = {
  urb: number; agri: number; foret: number;
  prairies?: number; landes?: number; mineral?: number; serres?: number; eau?: number; secteur?: number;
};

export function natureTest(p: PartsTest): NonNullable<TerritoireIndexEntry["nature"]> {
  const prairies = p.prairies ?? 0, landes = p.landes ?? 0, mineral = p.mineral ?? 0, serres = p.serres ?? 0;
  const v = p.secteur ?? 30;
  return {
    terres: {
      naturel: p.foret + prairies + landes + mineral, foret: p.foret, prairies, landes_pelouses: landes, mineral_dunes: mineral,
      cultures: p.agri, serres, urbanise: p.urb,
    },
    eau_pct: p.eau ?? 0,
    couverture_pct: 100,
    secteur: { statut: "classe", valeur: v, p10: v, p90: v, couvert_fr_pct: 100, hors_fr: { mer: 0, etranger: 0, non_attribue: 0 }, cause: null },
  };
}
