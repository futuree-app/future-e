// LE NOYAU DES CONTRAINTES DURES. Lib PURE : ni server-only, ni réseau, ni index chargé.
//
// Une contrainte dure est évaluée UNE fois, ici, et le résultat est consommé par DEUX moteurs qui en
// tirent deux conduites différentes :
//   - le comparateur FILTRE  : dans le doute (donnée absente), il n'a pas le droit de proposer ;
//   - le dossier EXPLIQUE    : dans le doute, il n'a pas le droit de conclure à une incompatibilité.
// C'est la même observation, et deux politiques. Un booléen ne savait pas porter cette différence :
// passesHard rendait `false` aussi bien pour « la commune est à 200 km de la mer que vous exigez » que
// pour « nous ne connaissons pas son altitude ». Le dossier ne pouvait donc rien en faire, et le
// comparateur, lui, sautait en silence les contraintes qu'il n'avait pas su résoudre.
//
// Ce noyau ne connaît PAS la présentation : ni EvidenceRef, ni materialityTier, ni factId. Il expose des
// clés de provenance (evidenceKeys), que chaque moteur habille à sa façon. Et il ne dépend PAS du moteur
// qu'il remplace : le schéma des contraintes vit dans un module neutre (hard-constraint-schema.ts).
import type {
  ResolvedPlaceReference, ResolvedUrbanAreaReference, ResolvedSizeReference,
} from "./hard-constraints-resolve.ts";

export type HardConstraintKey =
  | "departements" | "zones" | "excludeZones" | "montagne" | "reliefProche"
  | "nearSea" | "excludeSea" | "nearPlace" | "communeSize" | "excludePlace" | "sizeRelativeTo";

export const HARD_CONSTRAINT_KEYS: HardConstraintKey[] = [
  "departements", "zones", "excludeZones", "montagne", "reliefProche",
  "nearSea", "excludeSea", "nearPlace", "communeSize", "excludePlace", "sizeRelativeTo",
];

// ── Les conventions du PRODUIT ───────────────────────────────────────────────
// Elles ne mesurent pas une exigence du lecteur : elles définissent le SENS D'UN MOT (« la montagne »,
// « pas au bord de la mer »). Elles sont donc légitimes, à trois conditions : centralisées, versionnées,
// et NOMMÉES dans le texte qui les applique. Un seuil qu'on n'ose pas dire est un seuil qu'on invente.
export const PRODUCT_CONVENTIONS_VERSION = "hc-conv-1";
export const PRODUCT_CONVENTIONS = {
  excludeSeaMinKm: 15, // « pas le littoral » = au moins 15 km de la côte
  montagneMinScore: 50, // « à la montagne » = montagnosité >= 50, soit environ 600 m
  reliefProcheMinScore: 50, // « proche d'une montagne » = un massif à portée
} as const;

// Le seuil de montagne, exprimé en MÈTRES pour le lecteur : la montagnosité est un score interne, et
// « votre exigence de montagne n'est pas respectée, montagnosité 12/100 » ne veut rien dire pour lui.
const MONTAGNE_MIN_M = 600;

// ── Les attributs de la commune ──────────────────────────────────────────────
// TOUT est nullable, et aucun évaluateur n'emploie de test de vérité implicite : une altitude de 0, un
// relief de 0, une distance à la côte de 0 sont des OBSERVATIONS. Le `(c.relief_proximite ?? 0)` de
// passesHard traitait une donnée absente comme un relief nul, donc comme une exclusion.
export type CommuneAttributes = {
  insee: string;
  nom: string;
  dept: string | null;
  lat: number | null;
  lon: number | null;
  population: number | null; // population COMMUNALE
  tailleVille: number | null; // taille d'AGGLOMÉRATION (UU si la commune en a une, sinon sa population)
  uu: string | null;
  altitude: number | null;
  reliefProximite: number | null;
  distanceCoteKm: number | null;
};

// ── Les valeurs, structurées ─────────────────────────────────────────────────
// Le noyau porte la DONNÉE, pas seulement une phrase prérédigée : c'est ce qui rend le constat
// testable, comparable, et exportable demain.
export type ConstraintValue =
  | { kind: "distance_km"; value: number }
  | { kind: "travel_time_min"; value: number; mode: "car" | "walk" | "bike" }
  | { kind: "population"; value: number; unit: "urban_unit" | "commune" }
  | { kind: "population_range"; min: number | null; max: number | null; unit: "urban_unit" | "commune" }
  | { kind: "department"; value: string }
  | { kind: "departments"; value: string[] }
  | { kind: "altitude_m"; value: number }
  | { kind: "score"; value: number }
  | { kind: "boolean"; value: boolean };

// ── L'évaluation ─────────────────────────────────────────────────────────────
export type UnexaminedReason =
  | "missing_data" // la donnée de CETTE commune manque
  | "unresolved_reference" // le lieu nommé n'a pas pu être identifié
  | "ambiguous_reference" // plusieurs lieux correspondent au nom
  | "missing_parameter" // le lieu est identifié, un PARAMÈTRE manque (le mode, la distance)
  | "unsupported_metric" // la métrique n'est pas calculable honnêtement aujourd'hui
  | "insufficient_precision" // le point tombe dans la bande de tolérance d'une géométrie simplifiée
  | "routing_unavailable"; // échec TECHNIQUE, temporaire. Jamais persisté comme un refus.

export type HardConstraintAssessment<K extends HardConstraintKey = HardConstraintKey> =
  // HORS SUJET : le lecteur ne l'a pas posée. À ne JAMAIS confondre avec unexamined (« nous n'avons pas
  // su l'examiner ») : l'un est un silence légitime, l'autre est un trou de couverture.
  | { key: K; status: "not_declared" }
  | {
      key: K; status: "satisfied";
      observedValue: ConstraintValue; expectedValue: ConstraintValue;
      observedLabel: string; expectedLabel: string; evidenceKeys: string[];
    }
  | {
      key: K; status: "incompatible";
      observedValue: ConstraintValue; expectedValue: ConstraintValue;
      observedLabel: string; expectedLabel: string; evidenceKeys: string[];
      statement: string; // LA DOCTRINE de la contrainte, identique dans les deux moteurs
      topic: string; // le SUJET, 3 à 6 mots (cf. assertFactValid)
    }
  | { key: K; status: "unexamined"; reason: UnexaminedReason; detail?: string };

// ── Le seuil, et sa provenance ───────────────────────────────────────────────
// Un seuil OPPOSABLE vient du lecteur, et de lui seul. Il n'existe pas de `legacy_default` ici : les
// rayons que le produit s'est inventés (50 km autour d'un lieu, 30 km de la mer) vivent dans
// SearchExplorationHint, hors du contrat dur, et ne peuvent qu'explorer.
export type PlaceThreshold =
  | { metric: "distance"; maxKm: number; source: "user" }
  | {
      metric: "travel_time"; maxMinutes: number; mode: "car" | "walk" | "bike" | null;
      direction: "to_reference"; source: "user";
    };

export type SearchExplorationHint = {
  kind: "near_place_radius" | "near_sea_radius";
  valueKm: number;
  source: "legacy_default";
  confirmedByUser: false;
};

// ── Le point réellement testé ────────────────────────────────────────────────
// Il entre dans le CONTEXTE, pour qu'aucun évaluateur ne puisse l'oublier et aller chercher lat/lon en
// douce. « Le point de référence de la commune est à moins de 30 km » ne dit PAS « toute la commune ».
export type EvaluationPoint = {
  lat: number;
  lon: number;
  grain: "commune_reference" | "address";
  source: "commune_centroid" | "address_geocoder";
  label: string;
};

// L'état HYDRATÉ des contraintes : ce que le lecteur a déclaré, plus ce que la résolution a trouvé.
// `null` (ou `false`, ou `[]`) = NON DÉCLARÉE.
//
// LES CONTRAINTES COMPOSITES GARDENT LEURS ABSENCES (`unresolvedLabels`). Sans ce champ, un libellé que
// la résolution ne reconnaît pas DISPARAÎT de l'état hydraté, et la contrainte devient soit « non
// déclarée », soit « satisfaite », alors que la moitié n'en a jamais été testée. C'est le mensonge le
// plus discret de tout ce chantier : rien, à l'écran, ne le trahirait.
export type NormalizedHardConstraints = {
  departements: string[] | null;
  zones: { hardDepartements: Set<string>; labels: string[]; unresolvedLabels: string[] } | null;
  excludeZones: { departements: Set<string>; labels: string[]; unresolvedLabels: string[] } | null;
  montagne: boolean; // seulement strength === "hard"
  reliefProche: boolean; // seulement strength === "hard"
  nearSea: { threshold: PlaceThreshold | null } | null;
  excludeSea: boolean;
  communeSize: { min: number | null; max: number | null } | null;
  nearPlace: { label: string; threshold: PlaceThreshold | null; reference: ResolvedPlaceReference } | null;
  excludePlace: { label: string; reference: ResolvedUrbanAreaReference }[];
  sizeRelativeTo: { label: string; direction: "smaller" | "larger"; reference: ResolvedSizeReference } | null;
};

export type EvaluationContext = {
  constraints: NormalizedHardConstraints;
  // NULLABLE. Une commune sans coordonnées n'est pas une commune à (0, 0) : ce point est dans le golfe de
  // Guinée, et nearPlace en tirerait une incompatibilité ÉTABLIE sur une donnée inventée. Sans point, les
  // contraintes qui en dépendent rendent unexamined(missing_data).
  point: EvaluationPoint | null;
  conventionsVersion: string;
};

// ── Outillage de texte ───────────────────────────────────────────────────────

// « a, b et c » : une énumération française, pas une liste de virgules jusqu'au bout.
function joinFr(items: string[]): string {
  if (items.length <= 1) return items[0] ?? "";
  return `${items.slice(0, -1).join(", ")} et ${items[items.length - 1]}`;
}

// Formatage déterministe des milliers (espace ASCII, jamais toLocaleString qui varie selon l'hôte).
function fmt(n: number): string {
  return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

// LE TOPIC A UNE LIMITE DURE : assertFactValid JETTE au-delà de 70 caractères. Un topic qui compose le
// nom de la commune ET celui d'un lieu de référence la franchit sans prévenir :
//   « la taille de Saint-Rémy-en-Bouzemont-Saint-Genest-et-Isson face à Bordeaux » = 72 caractères.
// Le dossier tomberait EN PRODUCTION, sur ce lecteur-là, et sur aucun autre. On donne donc au noyau une
// forme courte de repli : le sujet reste juste, il perd seulement le nom qu'on peut se permettre de
// perdre (la commune est déjà nommée partout ailleurs dans le dossier).
const TOPIC_MAX = 70;
function topicFit(long: string, short: string): string {
  return long.length <= TOPIC_MAX ? long : short;
}

// La courbe de montagnosité, IDENTIQUE à celle du comparateur. Elle vit ici parce que c'est la DOCTRINE
// du mot « montagne » ; le comparateur la réimporte, il ne la redéfinit pas.
const MONTAGNE_ANCHORS: [number, number][] = [[300, 0], [600, 50], [1000, 85], [1400, 100]];
export function montagnosite(alt: number | null | undefined): number | null {
  if (alt == null) return null;
  const a = MONTAGNE_ANCHORS;
  if (alt <= a[0]![0]) return a[0]![1];
  if (alt >= a[a.length - 1]![0]) return a[a.length - 1]![1];
  for (let i = 0; i < a.length - 1; i++) {
    const [x0, y0] = a[i]!;
    const [x1, y1] = a[i + 1]!;
    if (alt <= x1) return y0 + ((alt - x0) / (x1 - x0)) * (y1 - y0);
  }
  return a[a.length - 1]![1];
}

// Haversine, identique à celui du comparateur. Il vit ici parce que c'est la MESURE de la contrainte.
export function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

// ── Les évaluateurs ──────────────────────────────────────────────────────────

export function evaluateDepartements(
  ctx: EvaluationContext,
  c: CommuneAttributes,
): HardConstraintAssessment<"departements"> {
  const wanted = ctx.constraints.departements;
  if (wanted == null || wanted.length === 0) return { key: "departements", status: "not_declared" };
  if (c.dept == null) return { key: "departements", status: "unexamined", reason: "missing_data" };

  const observedValue: ConstraintValue = { kind: "department", value: c.dept };
  const expectedValue: ConstraintValue = { kind: "departments", value: wanted };
  const observedLabel = `département ${c.dept}`;
  const expectedLabel =
    wanted.length === 1 ? `le département ${wanted[0]}` : `les départements ${wanted.join(", ")}`;
  const evidenceKeys = ["commune.dept", "project.hardConstraints.departements"];

  if (wanted.includes(c.dept)) {
    return { key: "departements", status: "satisfied", observedValue, expectedValue, observedLabel, expectedLabel, evidenceKeys };
  }
  return {
    key: "departements", status: "incompatible", observedValue, expectedValue, observedLabel, expectedLabel, evidenceKeys,
    topic: topicFit(`le département de ${c.nom}`, "le département de cette commune"),
    statement: `Cette commune est dans le département ${c.dept}, hors de ceux que vous avez posés comme condition (${wanted.join(", ")}).`,
  };
}

// LA DOCTRINE DES CONTRAINTES COMPOSITES, appliquée aux zones d'INCLUSION.
//
// Les ancres dures s'INTERSECTENT (« le Sud-Ouest ET la montagne »). Une ancre que la table ne reconnaît
// pas ne peut que RÉTRÉCIR le périmètre : le périmètre résolu est donc TROP LARGE.
//   - la commune est DEHORS du périmètre résolu -> incompatible, et c'est SÛR (rétrécir ne la fera pas
//     rentrer) ;
//   - la commune est DEDANS, mais une ancre manque -> on ne peut RIEN affirmer : unexamined.
// Rendre `satisfied` ici serait affirmer une appartenance à un périmètre qu'on n'a pas fini de calculer.
export function evaluateZones(
  ctx: EvaluationContext,
  c: CommuneAttributes,
): HardConstraintAssessment<"zones"> {
  const z = ctx.constraints.zones;
  if (z == null) return { key: "zones", status: "not_declared" };
  if (c.dept == null) return { key: "zones", status: "unexamined", reason: "missing_data" };

  const dedans = z.hardDepartements.size > 0 && z.hardDepartements.has(c.dept);
  if (!dedans && z.hardDepartements.size > 0) {
    const perimetre = joinFr(z.labels);
    return {
      key: "zones", status: "incompatible",
      observedValue: { kind: "department", value: c.dept },
      expectedValue: { kind: "departments", value: [...z.hardDepartements] },
      observedLabel: `département ${c.dept}`,
      expectedLabel: perimetre,
      evidenceKeys: ["commune.dept", "project.hardConstraints.zones"],
      topic: topicFit(`la situation géographique de ${c.nom}`, "la situation géographique"),
      statement: `Cette commune est hors de ${perimetre}, le périmètre que vous avez posé comme condition.`,
    };
  }
  if (z.unresolvedLabels.length > 0) {
    return { key: "zones", status: "unexamined", reason: "unresolved_reference", detail: z.unresolvedLabels.join(", ") };
  }
  return {
    key: "zones", status: "satisfied",
    observedValue: { kind: "department", value: c.dept },
    expectedValue: { kind: "departments", value: [...z.hardDepartements] },
    observedLabel: `département ${c.dept}`,
    expectedLabel: joinFr(z.labels),
    evidenceKeys: ["commune.dept", "project.hardConstraints.zones"],
  };
}

// Zones d'EXCLUSION : une UNION. Une exclusion non reconnue ne peut qu'AJOUTER des départements exclus.
//   - la commune est DANS une exclusion résolue -> incompatible, et c'est SÛR ;
//   - elle est dehors, mais une exclusion manque -> unexamined (celle qui manque pourrait la viser).
export function evaluateExcludeZones(
  ctx: EvaluationContext,
  c: CommuneAttributes,
): HardConstraintAssessment<"excludeZones"> {
  const z = ctx.constraints.excludeZones;
  if (z == null) return { key: "excludeZones", status: "not_declared" };
  if (c.dept == null) return { key: "excludeZones", status: "unexamined", reason: "missing_data" };

  const evidenceKeys = ["commune.dept", "project.hardConstraints.excludeZones"];
  const observedValue: ConstraintValue = { kind: "department", value: c.dept };
  const expectedValue: ConstraintValue = { kind: "departments", value: [...z.departements] };
  const observedLabel = `département ${c.dept}`;

  if (z.departements.has(c.dept)) {
    const zonesLabel = joinFr(z.labels);
    return {
      key: "excludeZones", status: "incompatible", observedValue, expectedValue, observedLabel,
      expectedLabel: `hors de ${zonesLabel}`, evidenceKeys,
      topic: topicFit(`la zone où se situe ${c.nom}`, "la zone où se situe cette commune"),
      statement: `Cette commune se trouve dans ${zonesLabel}, que vous avez écarté de votre recherche.`,
    };
  }
  if (z.unresolvedLabels.length > 0) {
    return { key: "excludeZones", status: "unexamined", reason: "unresolved_reference", detail: z.unresolvedLabels.join(", ") };
  }
  return {
    key: "excludeZones", status: "satisfied", observedValue, expectedValue, observedLabel,
    expectedLabel: `hors de ${joinFr(z.labels)}`, evidenceKeys,
  };
}

export function evaluateMontagne(
  ctx: EvaluationContext,
  c: CommuneAttributes,
): HardConstraintAssessment<"montagne"> {
  if (!ctx.constraints.montagne) return { key: "montagne", status: "not_declared" };
  if (c.altitude == null) return { key: "montagne", status: "unexamined", reason: "missing_data" };

  const m = montagnosite(c.altitude);
  const observedValue: ConstraintValue = { kind: "altitude_m", value: c.altitude };
  const expectedValue: ConstraintValue = { kind: "altitude_m", value: MONTAGNE_MIN_M };
  const observedLabel = `${Math.round(c.altitude)} m`;
  const expectedLabel = `au moins ${MONTAGNE_MIN_M} m`;
  const evidenceKeys = ["commune.altitude", "project.hardConstraints.montagne"];

  if (m != null && m >= PRODUCT_CONVENTIONS.montagneMinScore) {
    return { key: "montagne", status: "satisfied", observedValue, expectedValue, observedLabel, expectedLabel, evidenceKeys };
  }
  return {
    key: "montagne", status: "incompatible", observedValue, expectedValue, observedLabel, expectedLabel, evidenceKeys,
    topic: topicFit(`l'altitude de ${c.nom}`, "l'altitude de cette commune"),
    statement: `Cette commune se situe à ${Math.round(c.altitude)} m d'altitude. Votre exigence de montagne est ici entendue comme une altitude d'au moins ${MONTAGNE_MIN_M} m.`,
  };
}

export function evaluateReliefProche(
  ctx: EvaluationContext,
  c: CommuneAttributes,
): HardConstraintAssessment<"reliefProche"> {
  if (!ctx.constraints.reliefProche) return { key: "reliefProche", status: "not_declared" };
  // LE BUG CORRIGÉ : passesHard écrit `(c.relief_proximite ?? 0) < 50`, donc une donnée ABSENTE devient
  // un relief NUL, donc une exclusion. Pour un filtre, c'est une prudence. Pour un dossier, ce serait
  // affirmer au lecteur que sa montagne n'est pas là alors qu'on ne l'a pas regardée.
  if (c.reliefProximite == null) return { key: "reliefProche", status: "unexamined", reason: "missing_data" };

  const observedValue: ConstraintValue = { kind: "score", value: c.reliefProximite };
  const expectedValue: ConstraintValue = { kind: "score", value: PRODUCT_CONVENTIONS.reliefProcheMinScore };
  const observedLabel = `${Math.round(c.reliefProximite)}/100`;
  const expectedLabel = `au moins ${PRODUCT_CONVENTIONS.reliefProcheMinScore}/100`;
  const evidenceKeys = ["commune.reliefProximite", "project.hardConstraints.reliefProche"];

  if (c.reliefProximite >= PRODUCT_CONVENTIONS.reliefProcheMinScore) {
    return { key: "reliefProche", status: "satisfied", observedValue, expectedValue, observedLabel, expectedLabel, evidenceKeys };
  }
  return {
    key: "reliefProche", status: "incompatible", observedValue, expectedValue, observedLabel, expectedLabel, evidenceKeys,
    topic: topicFit(`le relief autour de ${c.nom}`, "le relief autour de cette commune"),
    // « Aucun massif n'est à portée » est plus catégorique que la donnée : à 49/100, c'est faux. On dit
    // ce qu'on mesure, et le seuil retenu. Moins séduisant, opposable.
    statement: `Autour de cette commune, le relief reste sous le seuil retenu pour considérer qu'un massif est à portée (${Math.round(c.reliefProximite)}/100, seuil ${PRODUCT_CONVENTIONS.reliefProcheMinScore}).`,
  };
}

export function evaluateNearSea(
  ctx: EvaluationContext,
  c: CommuneAttributes,
): HardConstraintAssessment<"nearSea"> {
  const ns = ctx.constraints.nearSea;
  if (ns == null) return { key: "nearSea", status: "not_declared" };

  // LE SEUIL INVENTÉ, RETIRÉ. passesHard écrivait `?? 30` : un lecteur qui disait « il nous faut la mer »
  // sans préciser voyait le moteur filtrer à 30 km, un chiffre que le produit avait choisi pour lui, et
  // que rien n'affichait nulle part. On ne le remplace pas, on le DEMANDE (lot 2 : une ambiguïté au parse).
  if (ns.threshold == null) return { key: "nearSea", status: "unexamined", reason: "missing_parameter" };
  if (ns.threshold.metric !== "distance") return { key: "nearSea", status: "unexamined", reason: "unsupported_metric" };
  if (c.distanceCoteKm == null) return { key: "nearSea", status: "unexamined", reason: "missing_data" };

  const max = ns.threshold.maxKm;
  const km = Math.round(c.distanceCoteKm);
  const observedValue: ConstraintValue = { kind: "distance_km", value: c.distanceCoteKm };
  const expectedValue: ConstraintValue = { kind: "distance_km", value: max };
  const observedLabel = `${km} km`;
  // « moins de 30 km » alors que le moteur accepte `<= 30` : à exactement 30 km, la commune passe et la
  // phrase dit le contraire. On écrit l'opérateur qu'on applique.
  const expectedLabel = `au plus ${max} km`;
  const evidenceKeys = ["commune.distanceCoteKm", "project.hardConstraints.nearSea"];

  if (c.distanceCoteKm <= max) {
    return { key: "nearSea", status: "satisfied", observedValue, expectedValue, observedLabel, expectedLabel, evidenceKeys };
  }
  return {
    key: "nearSea", status: "incompatible", observedValue, expectedValue, observedLabel, expectedLabel, evidenceKeys,
    topic: topicFit(`la distance de ${c.nom} au littoral`, "la distance au littoral"),
    statement: `Cette commune est à ${km} km du littoral, au-delà de la limite de ${max} km que vous avez posée.`,
  };
}

export function evaluateExcludeSea(
  ctx: EvaluationContext,
  c: CommuneAttributes,
): HardConstraintAssessment<"excludeSea"> {
  if (!ctx.constraints.excludeSea) return { key: "excludeSea", status: "not_declared" };
  if (c.distanceCoteKm == null) return { key: "excludeSea", status: "unexamined", reason: "missing_data" };

  const min = PRODUCT_CONVENTIONS.excludeSeaMinKm;
  const km = Math.round(c.distanceCoteKm);
  const observedValue: ConstraintValue = { kind: "distance_km", value: c.distanceCoteKm };
  const expectedValue: ConstraintValue = { kind: "distance_km", value: min };
  const observedLabel = `${km} km`;
  const expectedLabel = `au moins ${min} km`;
  const evidenceKeys = ["commune.distanceCoteKm", "project.hardConstraints.excludeSea"];

  if (c.distanceCoteKm >= min) {
    return { key: "excludeSea", status: "satisfied", observedValue, expectedValue, observedLabel, expectedLabel, evidenceKeys };
  }
  return {
    key: "excludeSea", status: "incompatible", observedValue, expectedValue, observedLabel, expectedLabel, evidenceKeys,
    topic: topicFit(`la proximité de ${c.nom} au littoral`, "la proximité du littoral"),
    statement: `Cette commune est à ${km} km de la côte. Votre souhait de ne pas habiter près du littoral est ici entendu comme une distance d'au moins ${min} km.`,
  };
}

export function evaluateCommuneSize(
  ctx: EvaluationContext,
  c: CommuneAttributes,
): HardConstraintAssessment<"communeSize"> {
  const cs = ctx.constraints.communeSize;
  if (cs == null || (cs.min == null && cs.max == null)) return { key: "communeSize", status: "not_declared" };
  // LA TAILLE SE LIT SUR L'AGGLOMÉRATION (doctrine du chantier C), et le comparateur le faisait déjà.
  // Le dossier lisait la population COMMUNALE : une commune de 8 000 habitants dans l'unité urbaine de
  // Lyon était exclue par l'un et déclarée conforme par l'autre.
  if (c.tailleVille == null) return { key: "communeSize", status: "unexamined", reason: "missing_data" };

  const t = c.tailleVille;
  const unit = c.uu ? "urban_unit" : "commune";
  const observedValue: ConstraintValue = { kind: "population", value: t, unit };
  const expectedValue: ConstraintValue = { kind: "population_range", min: cs.min, max: cs.max, unit: "urban_unit" };
  const observedLabel = `${fmt(t)} hab.`;
  // Bornes INCLUSIVES dans le moteur (`t <= max`, `t >= min`) : « moins de 25 000 habitants » ment à
  // exactement 25 000. On écrit l'opérateur qu'on applique.
  const expectedLabel =
    cs.min != null && cs.max != null
      ? `entre ${fmt(cs.min)} et ${fmt(cs.max)} habitants`
      : cs.max != null
        ? `au plus ${fmt(cs.max)} habitants`
        : `au moins ${fmt(cs.min!)} habitants`;
  const evidenceKeys = ["commune.tailleVille", "project.hardConstraints.communeSize"];

  const over = cs.max != null && t > cs.max;
  const under = cs.min != null && t < cs.min;
  if (!over && !under) {
    return { key: "communeSize", status: "satisfied", observedValue, expectedValue, observedLabel, expectedLabel, evidenceKeys };
  }

  // Le SUJET de la phrase suit la donnée réellement lue : l'agglomération quand la commune en a une, la
  // commune quand elle est son propre bassin. Juger sur une donnée et en montrer une autre serait pire
  // que la divergence elle-même.
  const sujet = c.uu ? `L'agglomération à laquelle appartient ${c.nom} compte` : "Cette commune compte";
  const seuil = over ? `au-dessus de ${fmt(cs.max!)}` : `en dessous de ${fmt(cs.min!)}`;
  return {
    key: "communeSize", status: "incompatible", observedValue, expectedValue, observedLabel, expectedLabel, evidenceKeys,
    topic: c.uu
      ? topicFit(`la taille de l'agglomération de ${c.nom}`, "la taille de l'agglomération")
      : topicFit(`la taille de ${c.nom}`, "la taille de la commune"),
    statement: `${sujet} ${fmt(t)} habitants, ${seuil} de la taille que vous avez posée.`,
  };
}

export function evaluateNearPlace(
  ctx: EvaluationContext,
  c: CommuneAttributes,
): HardConstraintAssessment<"nearPlace"> {
  const np = ctx.constraints.nearPlace;
  if (np == null) return { key: "nearPlace", status: "not_declared" };

  // LE DÉFAUT D'ORIGINE. matchProjects résolvait le label contre l'index des NOMS DE COMMUNES : « la gare
  // Matabiau » ne résolvait pas, placePoint restait null, et passesHard SAUTAIT le test. La condition non
  // négociable du lecteur n'était appliquée nulle part, et rien ne le lui disait.
  if (np.reference.status !== "resolved") {
    return {
      key: "nearPlace", status: "unexamined",
      reason: np.reference.status === "ambiguous" ? "ambiguous_reference" : "unresolved_reference",
      detail: np.label,
    };
  }
  if (np.threshold == null) {
    return { key: "nearPlace", status: "unexamined", reason: "missing_parameter", detail: np.label };
  }
  if (np.threshold.metric === "travel_time") {
    // Une distance à vol d'oiseau n'établit PAS un temps de trajet. Le mode manquant est un paramètre, pas
    // une ambiguïté du lieu : la gare est parfaitement identifiée.
    return {
      key: "nearPlace", status: "unexamined",
      reason: np.threshold.mode == null ? "missing_parameter" : "unsupported_metric",
      detail: np.label,
    };
  }
  // SANS POINT, PAS DE MESURE. Se replier sur (0, 0) placerait la commune dans le golfe de Guinée, et
  // produirait une incompatibilité ÉTABLIE, avec sa carte et sa preuve, à partir d'une donnée inventée.
  if (ctx.point == null) return { key: "nearPlace", status: "unexamined", reason: "missing_data" };

  const ref = np.reference;
  const km = haversineKm(ctx.point.lat, ctx.point.lon, ref.lat, ref.lon);
  const max = np.threshold.maxKm;
  const observedValue: ConstraintValue = { kind: "distance_km", value: km };
  const expectedValue: ConstraintValue = { kind: "distance_km", value: max };
  const observedLabel = `${Math.round(km)} km`;
  const expectedLabel = `au plus ${max} km`; // le moteur applique `<=` : la phrase l'écrit
  const evidenceKeys = ["commune.lat", "commune.lon", "project.hardConstraints.nearPlace"];

  if (km <= max) {
    return { key: "nearPlace", status: "satisfied", observedValue, expectedValue, observedLabel, expectedLabel, evidenceKeys };
  }
  // LE GRAIN EST DIT. Une distance mesurée depuis le point de référence de la commune ne dit pas que TOUTE
  // la commune y est : la phrase le porte, elle ne le cache pas.
  return {
    key: "nearPlace", status: "incompatible", observedValue, expectedValue, observedLabel, expectedLabel, evidenceKeys,
    topic: topicFit(`la distance de ${c.nom} à ${ref.canonicalLabel}`, `la distance à ${ref.canonicalLabel}`),
    statement: `${ctx.point.grain === "address" ? "Cette adresse" : `Le point de référence de ${c.nom}`} est à ${Math.round(km)} km de ${ref.canonicalLabel}, au-delà de la limite de ${max} km que vous avez posée.`,
  };
}

// LA DOCTRINE DES CONTRAINTES COMPOSITES, appliquée aux villes à quitter.
//
// « Quitter Lyon ET Saint-Jean-de-Machin », dont seul Lyon se résout, sur une commune hors de Lyon :
// rendre `satisfied` affirmerait une condition dont la MOITIÉ n'a jamais été testée. Une ville résolue
// qui matche décide (c'est SÛR) ; sinon, une ville non résolue bloque ; sinon seulement, satisfied.
export function evaluateExcludePlace(
  ctx: EvaluationContext,
  c: CommuneAttributes,
): HardConstraintAssessment<"excludePlace"> {
  const list = ctx.constraints.excludePlace;
  if (list.length === 0) return { key: "excludePlace", status: "not_declared" };

  const territoire = c.uu ? `uu:${c.uu}` : `insee:${c.insee}`;
  const evidenceKeys = ["commune.uu", "commune.insee", "project.hardConstraints.excludePlace"];
  const expectedValue: ConstraintValue = { kind: "boolean", value: false };
  const tousLabels = joinFr(list.map((e) => e.label));

  const hit = list.find(
    (e) => e.reference.status === "resolved" && e.reference.normalizedTerritoryCode === territoire,
  );
  if (hit) {
    const label = hit.reference.status === "resolved" ? hit.reference.canonicalLabel : hit.label;
    return {
      key: "excludePlace", status: "incompatible",
      observedValue: { kind: "boolean", value: true }, expectedValue,
      observedLabel: `dans l'agglomération de ${label}`,
      expectedLabel: `hors de ${tousLabels}`,
      evidenceKeys,
      topic: topicFit(`l'agglomération de ${label}`, "l'agglomération à quitter"),
      statement: `Cette commune fait partie de l'agglomération de ${label}, que vous avez posé comme condition de quitter.`,
    };
  }

  const unresolved = list.filter((e) => e.reference.status !== "resolved");
  if (unresolved.length > 0) {
    return {
      key: "excludePlace", status: "unexamined", reason: "unresolved_reference",
      detail: unresolved.map((e) => e.label).join(", "),
    };
  }
  return {
    key: "excludePlace", status: "satisfied",
    observedValue: { kind: "boolean", value: false }, expectedValue,
    observedLabel: `hors de ${tousLabels}`,
    expectedLabel: `hors de ${tousLabels}`,
    evidenceKeys,
  };
}

export function evaluateSizeRelativeTo(
  ctx: EvaluationContext,
  c: CommuneAttributes,
): HardConstraintAssessment<"sizeRelativeTo"> {
  const s = ctx.constraints.sizeRelativeTo;
  if (s == null) return { key: "sizeRelativeTo", status: "not_declared" };
  if (s.reference.status !== "resolved") {
    return { key: "sizeRelativeTo", status: "unexamined", reason: "unresolved_reference", detail: s.label };
  }
  if (c.tailleVille == null) return { key: "sizeRelativeTo", status: "unexamined", reason: "missing_data" };

  const ref = s.reference;
  const t = c.tailleVille;
  // Bornes STRICTEMENT exclusives, comme dans le comparateur : « plus petit que Lyon » exclut
  // l'agglomération lyonnaise elle-même, pas seulement ce qui la dépasse.
  const ok = s.direction === "smaller" ? t < ref.comparisonPopulation : t > ref.comparisonPopulation;
  const observedValue: ConstraintValue = { kind: "population", value: t, unit: c.uu ? "urban_unit" : "commune" };
  const expectedValue: ConstraintValue = {
    kind: "population", value: ref.comparisonPopulation,
    unit: ref.populationKind === "urban_unit" ? "urban_unit" : "commune",
  };
  const observedLabel = `${fmt(t)} hab.`;
  const expectedLabel = `${s.direction === "smaller" ? "moins" : "plus"} que ${ref.canonicalLabel} (${fmt(ref.comparisonPopulation)} hab.)`;
  const evidenceKeys = ["commune.tailleVille", "project.hardConstraints.sizeRelativeTo"];

  if (ok) {
    return { key: "sizeRelativeTo", status: "satisfied", observedValue, expectedValue, observedLabel, expectedLabel, evidenceKeys };
  }
  // Le SUJET suit la donnée : une commune hors unité urbaine n'est pas « une agglomération ».
  const sujet = c.uu ? "Cette agglomération compte" : "Cette commune compte";
  return {
    key: "sizeRelativeTo", status: "incompatible", observedValue, expectedValue, observedLabel, expectedLabel, evidenceKeys,
    topic: topicFit(`la taille de ${c.nom} face à ${ref.canonicalLabel}`, `la taille face à ${ref.canonicalLabel}`),
    statement: `${sujet} ${fmt(t)} habitants, ${s.direction === "smaller" ? "plus" : "moins"} que ${ref.canonicalLabel} (${fmt(ref.comparisonPopulation)} habitants en ${ref.populationYear}), alors que vous cherchez ${s.direction === "smaller" ? "plus petit" : "plus grand"}.`,
  };
}

// ── Le registre EXHAUSTIF ────────────────────────────────────────────────────
// Ajouter une HardConstraintKey sans écrire son évaluateur CASSE LE TYPECHECK. Et un évaluateur
// enregistré sous `nearSea` ne peut pas rendre `key: "excludeSea"` : le générique le lui interdit.
// C'est le trou de couverture silencieux, rendu impossible par le type plutôt que par un test.
export const HARD_CONSTRAINT_EVALUATORS: {
  [K in HardConstraintKey]: (ctx: EvaluationContext, c: CommuneAttributes) => HardConstraintAssessment<K>;
} = {
  departements: evaluateDepartements,
  zones: evaluateZones,
  excludeZones: evaluateExcludeZones,
  montagne: evaluateMontagne,
  reliefProche: evaluateReliefProche,
  nearSea: evaluateNearSea,
  excludeSea: evaluateExcludeSea,
  nearPlace: evaluateNearPlace,
  communeSize: evaluateCommuneSize,
  excludePlace: evaluateExcludePlace,
  sizeRelativeTo: evaluateSizeRelativeTo,
};

export function assessHardConstraints(
  ctx: EvaluationContext,
  c: CommuneAttributes,
): HardConstraintAssessment[] {
  return HARD_CONSTRAINT_KEYS.map((k) => HARD_CONSTRAINT_EVALUATORS[k](ctx, c) as HardConstraintAssessment);
}
