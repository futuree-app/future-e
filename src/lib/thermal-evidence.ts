// Dérivation PURE du niveau de preuve thermique depuis le DPE attribué. Aucun réseau, pas de
// `server-only` (appelée aussi côté client). Règle ordonnée : méthode × attribution × champs,
// la MÉTHODE PRIME (un DPE immeuble-généré est B1 même s'il porte le bloc confort).

import type { DpeRecord } from "./dpe-attribution.ts";

export type ThermalEvidenceLevel =
  | "A_EXACT_UNIT"
  | "B1_EXACT_BUILDING"
  | "B2_NEARBY_UNCONFIRMED" // réservé spec B, jamais produit ici
  | "C_NO_DATA";

export type ThermalFactor = { key: string; label: string; polarity: "favorable" | "defavorable" | "neutre" };

export type ThermalEvidence = {
  level: ThermalEvidenceLevel;
  indicator: "bon" | "moyen" | "insuffisant" | null;
  methodWording: "immeuble" | "individuel_sans_bloc" | null;
  factors: ThermalFactor[];
  drawerFields: ThermalFactor[];
};

const MAX_CHIPS = 4;

function isResidential(t: string | null): boolean {
  const s = (t ?? "").toLowerCase();
  return s.includes("maison") || s.includes("appartement") || s.includes("appart");
}

function classifyMethod(m: string | null): "immeuble" | "individuel" | "autre" {
  const s = (m ?? "").toLowerCase();
  if (s.includes("immeuble")) return "immeuble";
  if (s.includes("individuel")) return "individuel";
  return "autre";
}

// Inertie : classe ADEME -> polarité. Les valeurs vues : "très lourde", "lourde", "moyenne",
// "légère", "très légère". Favorable = capacité à amortir la chaleur.
function inertiePolarity(v: string): ThermalFactor["polarity"] {
  const s = v.toLowerCase();
  if (s.includes("lourde")) return "favorable";
  if (s.includes("légère") || s.includes("legere")) return "defavorable";
  return "neutre";
}

// Ventilation : type_ventilation ADEME -> libellé court lisible (fallback = valeur brute).
function ventilationLabel(v: string): string {
  const s = v.toLowerCase();
  if (s.includes("double flux")) return "VMC double flux";
  if (s.includes("hygro")) return "VMC hygroréglable";
  if (s.includes("vmc")) return "VMC simple flux";
  if (s.includes("ouverture des fenêtres") || s.includes("naturelle")) return "Ventilation naturelle";
  return v;
}

function boolFactor(key: string, val: boolean | null, favLabel: string, defLabel: string): ThermalFactor | null {
  if (val == null) return null;
  return val
    ? { key, label: favLabel, polarity: "favorable" }
    : { key, label: defLabel, polarity: "defavorable" };
}

function cap(factors: ThermalFactor[]): Pick<ThermalEvidence, "factors" | "drawerFields"> {
  return { factors: factors.slice(0, MAX_CHIPS), drawerFields: factors.slice(MAX_CHIPS) };
}

function empty(level: ThermalEvidenceLevel, methodWording: ThermalEvidence["methodWording"]): ThermalEvidence {
  return { level, indicator: null, methodWording, factors: [], drawerFields: [] };
}

// Facteurs du bloc confort (état A) : traversant, protections, inertie, ventilation, brasseur.
function confortFactors(dpe: DpeRecord): ThermalFactor[] {
  const out: (ThermalFactor | null)[] = [
    boolFactor("traversant", dpe.traversant, "Logement traversant", "Logement non traversant"),
    boolFactor("protection", dpe.protection_solaire, "Protections solaires renseignées", "Protections solaires non renseignées"),
    dpe.inertie ? { key: "inertie", label: `Inertie ${dpe.inertie.toLowerCase()}`, polarity: inertiePolarity(dpe.inertie) } : null,
    dpe.ventilation ? { key: "ventilation", label: ventilationLabel(dpe.ventilation), polarity: "neutre" } : null,
    boolFactor("brasseur", dpe.brasseur_air, "Brasseurs d'air", "Sans brasseur d'air"),
  ];
  return out.filter((f): f is ThermalFactor => f != null);
}

// Facteurs d'enveloppe (état B1) : inertie, ventilation, isolation murs, isolation menuiseries.
function envelopeFactors(dpe: DpeRecord): ThermalFactor[] {
  const out: (ThermalFactor | null)[] = [
    dpe.inertie ? { key: "inertie", label: `Inertie ${dpe.inertie.toLowerCase()}`, polarity: inertiePolarity(dpe.inertie) } : null,
    dpe.ventilation ? { key: "ventilation", label: ventilationLabel(dpe.ventilation), polarity: "neutre" } : null,
    dpe.isolation_murs ? { key: "murs", label: `Isolation des murs : ${dpe.isolation_murs.toLowerCase()}`, polarity: "neutre" } : null,
    dpe.isolation_menuiseries ? { key: "menuiseries", label: `Menuiseries : ${dpe.isolation_menuiseries.toLowerCase()}`, polarity: "neutre" } : null,
  ];
  return out.filter((f): f is ThermalFactor => f != null);
}

export function deriveThermalEvidence(dpe: DpeRecord | null): ThermalEvidence {
  // 1. Aucun DPE résidentiel attribué -> C.
  if (dpe == null || !isResidential(dpe.type_batiment)) return empty("C_NO_DATA", null);

  const method = classifyMethod(dpe.methode_dpe);

  // 2. Méthode immeuble-généré -> B1 (prime, même si le bloc confort est présent).
  if (method === "immeuble") {
    return { level: "B1_EXACT_BUILDING", indicator: null, methodWording: "immeuble", ...cap(envelopeFactors(dpe)) };
  }

  // 3. Bloc confort absent (individuel non renseigné, ou méthode "autre") -> B1.
  if (dpe.confort_ete == null || method !== "individuel") {
    return { level: "B1_EXACT_BUILDING", indicator: null, methodWording: "individuel_sans_bloc", ...cap(envelopeFactors(dpe)) };
  }

  // 4. Méthode individuelle + bloc confort présent -> A.
  return { level: "A_EXACT_UNIT", indicator: dpe.confort_ete, methodWording: null, ...cap(confortFactors(dpe)) };
}

// Résumé descriptif pour la synthèse Logement : attribué au DPE, sans verdict ni prédiction.
export function thermalEvidenceSummary(ev: ThermalEvidence): string {
  if (ev.level === "C_NO_DATA") {
    return "Les données publiques retrouvées ne permettent pas de qualifier le confort d'été de ce logement.";
  }
  const factorList = ev.factors.map((f) => f.label).join(", ");
  if (ev.level === "A_EXACT_UNIT") {
    const head =
      ev.indicator === "insuffisant"
        ? "Le DPE classe l'indicateur réglementaire de confort d'été de ce logement comme insuffisant (capacité limitée dans ses conditions conventionnelles d'évaluation)."
        : `Le DPE classe l'indicateur réglementaire de confort d'été de ce logement comme ${ev.indicator}.`;
    return `${head} Caractéristiques renseignées : ${factorList}. Indicateur conventionnel, ne mesure pas la température vécue.`;
  }
  // B1
  const scope =
    ev.methodWording === "immeuble"
      ? "Ce diagnostic reprend principalement des caractéristiques de l'immeuble et ne qualifie pas le confort d'été de ce logement."
      : "Ce diagnostic ne renseigne pas le confort d'été de ce logement.";
  return `${scope} Caractéristiques du bâtiment : ${factorList}.`;
}
