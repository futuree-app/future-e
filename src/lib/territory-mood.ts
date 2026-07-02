// TerritoryMood — identité visuelle d'un territoire, dérivée de façon
// 100 % déterministe à partir des données déjà disponibles (catégorie
// géographique + territoire ADEME). Aucun appel réseau.
//
// Socle commun : consommé par le passeport territorial (teinte/accent) et par
// les cartes climat (type). L'ex-cover illustrée (TerritoryCover) a été
// remplacée par la ligne des années (TerritoryYearsBand), qui ne dépend pas du mood.

import { deriveCategories } from "@/lib/commune-categories";

export type TerritoryType =
  | "littoral_atlantique"
  | "mediterraneen"
  | "montagne"
  | "plaine";

export type TerritoryMood = {
  title: string;
  inseeCode: string | null;
  type: TerritoryType;
  typeLabel: string;
  /** Libellés humains de la palette (socle éditorial / prompt image V2). */
  palette: string[];
  /** Couleurs hex pour le rendu SVG. */
  colors: {
    skyTop: string;
    skyHorizon: string;
    base: string; // eau (littoral) ou sol
    silhouette: string;
    silhouetteFar: string;
    sun: string;
    accent: string;
  };
  motifs: string[];
  density: "dense" | "intermediaire" | "rural";
  vegetation: "boise" | "mixte" | "minimal";
  atmosphere: string;
};

type TerritoireInput = { densite?: number | null; taux_boisement?: number | null } | null;

const PRESETS: Record<TerritoryType, Omit<TerritoryMood, "title" | "inseeCode" | "density" | "vegetation">> = {
  littoral_atlantique: {
    type: "littoral_atlantique",
    typeLabel: "Littoral atlantique",
    palette: ["bleu océan", "sable", "gris clair lumineux"],
    colors: {
      skyTop: "#1e3344",
      skyHorizon: "#7fa6b8",
      base: "#163642",
      silhouette: "#0c1f2b",
      silhouetteFar: "#16384a",
      sun: "#e6d7b8",
      accent: "#9ec3d4",
    },
    motifs: ["océan", "ville basse", "horizon"],
    atmosphere: "ouverte et lumineuse",
  },
  mediterraneen: {
    type: "mediterraneen",
    typeLabel: "Méditerranéen",
    palette: ["ocre", "terracotta", "bleu profond"],
    colors: {
      skyTop: "#3b2f2a",
      skyHorizon: "#cfa067",
      base: "#5c4a30",
      silhouette: "#3f3320",
      silhouetteFar: "#6b5535",
      sun: "#f0c987",
      accent: "#b98a4e",
    },
    motifs: ["collines", "vignes", "soleil"],
    atmosphere: "minérale et lumineuse",
  },
  montagne: {
    type: "montagne",
    typeLabel: "Montagne",
    palette: ["blanc neige", "gris ardoise", "vert sapin"],
    colors: {
      skyTop: "#233247",
      skyHorizon: "#aac0d2",
      base: "#2c4234",
      silhouette: "#38485c",
      silhouetteFar: "#56697f",
      sun: "#dbe6ef",
      accent: "#e8eef3",
    },
    motifs: ["sommets", "forêt", "altitude"],
    atmosphere: "alpine et claire",
  },
  plaine: {
    type: "plaine",
    typeLabel: "Intérieur",
    palette: ["verts doux", "beige", "gris clair"],
    colors: {
      skyTop: "#232c33",
      skyHorizon: "#9fb1a0",
      base: "#46523c",
      silhouette: "#2f3a2c",
      silhouetteFar: "#4a5742",
      sun: "#d8d3b4",
      accent: "#8aa07e",
    },
    motifs: ["champs", "bocage", "horizon"],
    atmosphere: "calme et ouverte",
  },
};

export function deriveTerritoryType(inseeCode: string | null): TerritoryType {
  if (!inseeCode) return "plaine";
  const cats = deriveCategories(inseeCode);
  if (cats.includes("montagne")) return "montagne";
  if (cats.includes("mediterranee")) return "mediterraneen";
  if (cats.includes("littoral")) return "littoral_atlantique";
  return "plaine";
}

function pickDensity(d: number | null | undefined): TerritoryMood["density"] {
  if (typeof d !== "number") return "intermediaire";
  if (d >= 1500) return "dense";
  if (d >= 150) return "intermediaire";
  return "rural";
}

function pickVegetation(t: number | null | undefined): TerritoryMood["vegetation"] {
  if (typeof t !== "number") return "mixte";
  if (t >= 35) return "boise";
  if (t >= 12) return "mixte";
  return "minimal";
}

export function deriveTerritoryMood(params: {
  communeName: string | null;
  inseeCode: string | null;
  territoire?: TerritoireInput;
}): TerritoryMood {
  const type = deriveTerritoryType(params.inseeCode);
  const preset = PRESETS[type];
  return {
    ...preset,
    title: params.communeName ?? "votre commune",
    inseeCode: params.inseeCode ?? null,
    density: pickDensity(params.territoire?.densite),
    vegetation: pickVegetation(params.territoire?.taux_boisement),
  };
}

// V2 — non utilisé en V1. Produit le prompt d'illustration éditoriale qui sera
// généré puis mis en cache par commune (cf. approche 2 recommandée).
export function buildImagePrompt(m: TerritoryMood): string {
  return [
    `Illustration éditoriale, style carte postale contemporaine / sérigraphie, du territoire de ${m.title}.`,
    `Ambiance ${m.atmosphere}. Palette : ${m.palette.join(", ")}.`,
    `Motifs : ${m.motifs.join(", ")}.`,
    "Ligne d'horizon douce, formes simplifiées en aplats, léger grain, format bandeau horizontal.",
    "Sans texte, sans personnes, sans scène catastrophe, sans météo dramatique. Calme et contemplatif.",
  ].join(" ");
}
