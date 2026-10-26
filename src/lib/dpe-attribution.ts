// Logique PURE d'attribution du DPE au logement. Aucun accès réseau, aucun `server-only` :
// ces fonctions sont appelées AUSSI côté client (LogementModule décide l'état du DPE en direct).
// La partie IO (fetch ADEME) vit dans `dpe.ts`, qui ré-exporte ces symboles pour le serveur.

import { attribuableAuLogement } from "./dpe-grain.ts";
import { vetoBatiment, type IdentiteBatiment } from "./batiment-rnb.ts";

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
  // FUT-74 : OPTIONNELS, ET ABSENTS DES SNAPSHOTS ANTÉRIEURS. `toRecord` ne les pose que pour les
  // grains qui s'en servent (cf. `champsDeGrain` dans dpe.ts) : un DPE d'appartement individuel ou de
  // maison garde exactement sa forme d'avant, donc l'empreinte des rapports versionnés qui le portent.
  /** Appartement généré à partir de l'immeuble : `true` s'il n'a pas été visité (ADEME, 0/1). */
  appartement_non_visite?: boolean | null;
  /** DPE d'immeuble : surface habitable totale de l'immeuble, en m². */
  surface_immeuble_m2?: number | null;
  /** DPE d'immeuble : nombre d'appartements déclaré. */
  nombre_appartements?: number | null;
  // FUT-80 : OPTIONNELS, posés seulement quand l'ADEME les renseigne (51 % des DPE existants au
  // 26/10/2026, aucun « Reprise RNB » après mi-2025). Un DPE sans identifiant garde sa forme d'avant.
  /** Identifiant du bâtiment au Référentiel national des bâtiments (ID-RNB). */
  id_rnb?: string | null;
  /** « Reprise RNB » : dérivé de l'adresse du DPE ; « Logiciel » : saisi par le diagnostiqueur. */
  provenance_id_rnb?: string | null;
};

export const LABEL_ORDER: DpeLabel[] = ["A", "B", "C", "D", "E", "F", "G"];

// Dédup par numéro de DPE, puis collapse CONSERVATEUR : deux diagnostics qui décrivent
// manifestement la même unité (même adresse BAN + même étage + même complément + même surface, tous
// renseignés) sont fusionnés en gardant le plus récent. Au moindre doute (un champ d'identification
// manquant), on garde les deux : mieux vaut un sélecteur qu'une fusion fausse.
//
// L'ADRESSE ENTRE DANS LA CLÉ (revue indépendante du 26/10/2026). La recherche par bâtiment (FUT-80)
// réunit des diagnostics de PLUSIEURS adresses : deux maisons que le référentiel compte ensemble, au 122 et
// au 124, toutes deux « Maison 1 », rez-de-chaussée, 105,8 m², devenaient un seul candidat, et l'une
// disparaissait sans preuve qu'elles soient le même logement. À une même adresse, rien ne change : la
// liste de l'adresse est cherchée par son identifiant BAN, toutes ses lignes le portent.
export function dedupeAndCollapseDpe(records: DpeRecord[]): DpeRecord[] {
  const byId = new Map<string, DpeRecord>();
  for (const r of records) if (!byId.has(r.id_dpe)) byId.set(r.id_dpe, r);
  const unique = [...byId.values()];

  const sameUnitKey = (r: DpeRecord): string | null =>
    r.id_ban != null && r.etage != null && r.complement != null && r.surface_m2 != null
      ? `${r.id_ban}|${r.etage}|${r.complement}|${r.surface_m2}`
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
//
// « UN SEUL CANDIDAT » SUPPOSE UNE LISTE COMPLÈTE (FUT-65). Quand l'un des deux jeux ADEME n'a pas
// répondu, le candidat unique est seulement le seul qu'on a VU : un autre diagnostic peut exister dans
// le jeu tombé. Sur une liste incomplète, on demande donc toujours confirmation.
//
// « MAISON » NE SUFFIT PAS À DIRE « LOGEMENT » (FUT-74, revue du 24/10/2026). `isMaison` cherche un mot
// dans le type : une fiche typée « maison » à méthode « dpe immeuble collectif », ou un type hors de
// l'énumération ADEME qui contient « maison », passaient. La convergence exige désormais AUSSI que le
// diagnostic porte sur un logement selon la règle canonique (`attribuableAuLogement`) ; les autres
// conditions restent celles d'avant.
//
// LE BÂTIMENT PEUT S'OPPOSER, JAMAIS AJOUTER (FUT-80, revu après la revue indépendante du 26/10/2026).
// La règle recevait une liste d'identifiants : elle voyait un diagnostic désignant un autre bâtiment
// (Monchaux-sur-Écaillon), mais pas une adresse à trois bâtiments (La Rochelle), ni un référentiel muet,
// ni un bâtiment démoli. Elle reçoit désormais l'IDENTITÉ, et `vetoBatiment` dit pourquoi elle s'oppose.
// `identite` absente (rapport antérieur, écran seulement) : règle d'avant ; le serveur relit toujours le
// référentiel avant d'enregistrer une attribution automatique.
export function dpeAttributionStatus(
  candidates: DpeRecord[],
  banFeatureType: string | null,
  listeComplete = true,
  identite?: IdentiteBatiment | null,
): DpeAttribution {
  if (candidates.length === 0) return { status: "not_found" };
  const one = candidates[0];
  const strongConvergence =
    listeComplete &&
    candidates.length === 1 &&
    isMaison(one.type_batiment) &&
    attribuableAuLogement(one) &&
    banFeatureType === "housenumber" &&
    one.etiquette_dpe != null &&
    vetoBatiment(one, identite) === null;
  return strongConvergence
    ? { status: "auto_confirmed", dpe: one }
    : { status: "selection_required", candidates };
}

// (Il exista ici `AddressDpeContext` et `deriveAddressDpeContext`, qui rendaient un compte et
//  deux bornes de classes. Plus rien ne les lisait depuis le 31/07/2026 : le contexte d'adresse
//  vit dans `dpe-address-context.ts`, plus riche et écrit pour être affiché. Deux notions du même
//  concept auraient divergé.)
