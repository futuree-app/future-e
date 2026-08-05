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
  // TEXTE OU NOMBRE, ET LE TYPE LE DIT. L'ADEME rend `numero_etage_appartement` en nombre, et le
  // complément d'adresse est du texte libre sans garantie de type. Des snapshots figés en base
  // portent déjà des valeurs numériques : les déclarer `string` faisait tomber le sélecteur de
  // DPE en `.trim is not a function`. Toute lecture passe par `asText` (dpe-candidate-match).
  etage: string | number | null;
  complement: string | number | null;
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

// (Il exista ici `AddressDpeContext` et `deriveAddressDpeContext`, qui rendaient un compte et
//  deux bornes de classes. Plus rien ne les lisait depuis le 31/07/2026 : le contexte d'adresse
//  vit dans `dpe-address-context.ts`, plus riche et écrit pour être affiché. Deux notions du même
//  concept auraient divergé.)
