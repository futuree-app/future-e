// Logique PURE d'attribution du DPE au logement. Aucun accès réseau, aucun `server-only` :
// ces fonctions sont appelées AUSSI côté client (LogementModule décide l'état du DPE en direct).
// La partie IO (fetch ADEME) vit dans `dpe.ts`, qui ré-exporte ces symboles pour le serveur.

export type DpeLabel = "A" | "B" | "C" | "D" | "E" | "F" | "G";

export type DpeRecord = {
  id_dpe: string;
  date_dpe: string | null;
  id_ban: string | null;
  adresse: string | null;
  etiquette_dpe: DpeLabel | null;
  etiquette_ges: DpeLabel | null;
  conso_ep_m2: number | null;
  emission_ges_m2: number | null;
  surface_m2: number | null;
  annee_construction: number | null;
  type_batiment: string | null;
  etage: string | null;
  complement: string | null;
  // Bloc confort d'été + enveloppe + méthode (lecture thermique, Face 1). Normalisés à la
  // lecture (toRecord) : booléens pour les champs 0/1, chaînes brutes ADEME sinon.
  confort_ete: "bon" | "moyen" | "insuffisant" | null;
  traversant: boolean | null;
  protection_solaire: boolean | null;
  ventilation: string | null;
  inertie: string | null;
  isolation_toiture: string | null;
  brasseur_air: boolean | null;
  isolation_murs: string | null;
  isolation_menuiseries: string | null;
  methode_dpe: string | null;
};

export const LABEL_ORDER: DpeLabel[] = ["A", "B", "C", "D", "E", "F", "G"];

// Dédup par numéro de DPE, puis collapse CONSERVATEUR : deux diagnostics qui décrivent
// manifestement la même unité (même étage + même complément + même surface, tous renseignés)
// sont fusionnés en gardant le plus récent. Au moindre doute (un champ d'identification
// manquant), on garde les deux : mieux vaut un sélecteur qu'une fusion fausse.
export function dedupeAndCollapseDpe(records: DpeRecord[]): DpeRecord[] {
  const byId = new Map<string, DpeRecord>();
  for (const r of records) if (!byId.has(r.id_dpe)) byId.set(r.id_dpe, r);
  const unique = [...byId.values()];

  const sameUnitKey = (r: DpeRecord): string | null =>
    r.etage != null && r.complement != null && r.surface_m2 != null
      ? `${r.etage}|${r.complement}|${r.surface_m2}`
      : null; // identification incomplète -> jamais fusionné

  const kept = new Map<string, DpeRecord>();
  const passthrough: DpeRecord[] = [];
  for (const r of unique) {
    const key = sameUnitKey(r);
    if (key == null) { passthrough.push(r); continue; }
    const prev = kept.get(key);
    if (!prev || (r.date_dpe ?? "") > (prev.date_dpe ?? "")) kept.set(key, r);
  }
  return [...kept.values(), ...passthrough];
}

export type DpeAttribution =
  | { status: "not_found" }
  | { status: "auto_confirmed"; dpe: DpeRecord }
  | { status: "selection_required"; candidates: DpeRecord[] };

const isMaison = (t: string | null): boolean => (t ?? "").toLowerCase().includes("maison");

// Convergence forte = SEUL cas d'attribution automatique : 1 candidat, maison individuelle,
// adresse BAN précise (housenumber), classe présente. Tout le reste demande confirmation,
// y compris un candidat unique en collectif.
export function dpeAttributionStatus(
  candidates: DpeRecord[],
  banFeatureType: string | null,
): DpeAttribution {
  if (candidates.length === 0) return { status: "not_found" };
  const one = candidates[0];
  const strongConvergence =
    candidates.length === 1 &&
    isMaison(one.type_batiment) &&
    banFeatureType === "housenumber" &&
    one.etiquette_dpe != null;
  return strongConvergence
    ? { status: "auto_confirmed", dpe: one }
    : { status: "selection_required", candidates };
}

export type AddressDpeContext = { count: number; minLabel: DpeLabel; maxLabel: DpeLabel };

// « Diagnostics retrouvés à cette adresse » : n'affiche une fourchette QUE si au moins 3
// diagnostics résidentiels portent une classe. Sinon null (trop peu ou trop hétérogène pour
// constituer un repère honnête). Ne qualifie jamais le logement.
export function deriveAddressDpeContext(candidates: DpeRecord[]): AddressDpeContext | null {
  const labels = candidates
    .filter((c) => (c.type_batiment ?? "").toLowerCase() !== "tertiaire")
    .map((c) => c.etiquette_dpe)
    .filter((l): l is DpeLabel => l != null);
  if (labels.length < 3) return null;
  const idx = labels.map((l) => LABEL_ORDER.indexOf(l)).filter((i) => i >= 0);
  return {
    count: labels.length,
    minLabel: LABEL_ORDER[Math.min(...idx)],
    maxLabel: LABEL_ORDER[Math.max(...idx)],
  };
}
