// LE CORPUS, PARTAGÉ entre la non-régression (ancien contre nouveau) et la parité (filtre contre
// dossier). Partagé exprès : sinon l'un des deux tests pourrait être vert sur un corpus plus facile que
// l'autre, et personne ne le verrait.
//
// Un cas par situation qui a DÉJÀ fait diverger les deux moteurs, ou qui le pourrait.
import type { IndexCommuneLike } from "../commune-attributes.ts";
import type { PlaceDirectory } from "../hard-constraints-resolve.ts";
import type { HardConstraints } from "../hard-constraint-schema.ts";

export const POP_FLOOR = 1500; // doctrine de RECHERCHE du comparateur (anti-hameaux), pas une contrainte

export const CORPUS: IndexCommuneLike[] = [
  { insee: "31555", nom: "Toulouse", dept: "31", lat: 43.6045, lon: 1.4442, population: 493_465, uu: "31701", altitude: 146, relief_proximite: 0, distance_cote_km: 150 },
  { insee: "29019", nom: "Brest", dept: "29", lat: 48.3904, lon: -4.4861, population: 139_456, uu: "29701", altitude: 35, relief_proximite: 5, distance_cote_km: 1 },
  { insee: "05023", nom: "Briançon", dept: "05", lat: 44.899, lon: 6.645, population: 11_000, uu: null, altitude: 1326, relief_proximite: 100, distance_cote_km: 130 },
  // Dans l'unité urbaine de Lyon : le cas qui faisait DIVERGER les deux moteurs (8 000 hab. communaux,
  // 1,6 M dans l'agglomération).
  { insee: "69266", nom: "Villeurbanne", dept: "69", lat: 45.77, lon: 4.88, population: 8_000, uu: "00760", altitude: 168, relief_proximite: 30, distance_cote_km: 250 },
  // Données manquantes : altitude et relief absents. Le filtre exclut, le dossier doit rester uncertain.
  { insee: "99999", nom: "Sans-Donnée", dept: "31", lat: 43.0, lon: 1.0, population: 3_000, uu: null, altitude: null, relief_proximite: null, distance_cote_km: 90 },
  // Sous le plancher anti-hameaux : exclue par la doctrine de RECHERCHE, pas par une contrainte.
  { insee: "09999", nom: "Hameau", dept: "09", lat: 42.9, lon: 1.5, population: 300, uu: null, altitude: 900, relief_proximite: 90, distance_cote_km: 120 },
];

export const UU_POP = new Map<string, number>([
  ["31701", 1_060_000],
  ["29701", 210_000],
  ["00760", 1_600_000],
  ["33701", 1_000_000],
]);

export const DIRECTORY: PlaceDirectory = {
  byName: (label) => {
    const t: Record<string, { insee: string; nom: string; lat: number; lon: number; uu: string | null; tailleVille: number | null }> = {
      brest: { insee: "29019", nom: "Brest", lat: 48.3904, lon: -4.4861, uu: "29701", tailleVille: 210_000 },
      lyon: { insee: "69123", nom: "Lyon", lat: 45.75, lon: 4.85, uu: "00760", tailleVille: 1_600_000 },
      bordeaux: { insee: "33063", nom: "Bordeaux", lat: 44.84, lon: -0.58, uu: "33701", tailleVille: 1_000_000 },
    };
    return t[label] ?? null;
  },
  plmByName: (label) => (label === "lyon" ? { uu: "00760", pop: 522_250 } : null),
};

// LES 11 CLÉS SONT EXERCÉES. Le test disait « les onze » ; il en couvrait six.
export const PROJETS: { nom: string; hc: HardConstraints }[] = [
  { nom: "département", hc: { departements: ["31"] } },
  { nom: "zone dure", hc: { zones: [{ zone: "bretagne", strength: "hard" }] } },
  { nom: "zone exclue", hc: { excludeZones: ["idf"] } },
  { nom: "montagne", hc: { montagne: { strength: "hard" } } },
  { nom: "relief proche", hc: { reliefProche: { strength: "hard" } } },
  { nom: "mer 30 km", hc: { nearSea: { active: true, maxKm: 30 } } },
  { nom: "mer sans distance", hc: { nearSea: { active: true } } },
  { nom: "pas la mer", hc: { excludeSea: true } },
  { nom: "petite agglo", hc: { communeSize: { max: 25_000 } } },
  { nom: "près de Brest", hc: { nearPlace: { label: "Brest", maxKm: 60 } } },
  { nom: "près d'un lieu non résolu", hc: { nearPlace: { label: "Gare Matabiau", maxKm: 30 } } },
  { nom: "près d'un lieu sans distance", hc: { nearPlace: { label: "Brest" } } },
  { nom: "quitter Lyon", hc: { excludePlace: [{ label: "Lyon" }] } },
  { nom: "plus petit que Bordeaux", hc: { sizeRelativeTo: { label: "Bordeaux", direction: "smaller" } } },
  // Le cas composite : une ville résolue, une autre pas. Ne doit JAMAIS rendre satisfied.
  { nom: "quitter Lyon et un inconnu", hc: { excludePlace: [{ label: "Lyon" }, { label: "Saint-Jean-de-Machin" }] } },
];
