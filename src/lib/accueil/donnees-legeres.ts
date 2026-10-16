// FUT-50 · LES DONNÉES LÉGÈRES DE L'ACCUEIL, À LA LECTURE.
//
// Deux fichiers compacts, importés comme modules (empaquetés avec la fonction, aucun chemin à tracer) :
//   - `src/data/accueil-communes.json` (2,7 Mo) : identité et intrants « Petite ville » / « Hivers doux », dérivés
//     de l'index par `scripts/accueil/donnees-accueil.mjs` ;
//   - `src/data/apercu-climat-communes.json` (4,6 Mo) : l'extrait DRIAS partagé avec l'aperçu du paywall (FUT-30),
//     dérivé de `data_climat.json` par `scripts/build-apercu-climat.mjs`.
// Ils remplacent, POUR L'ACCUEIL SEULEMENT, l'index du comparateur (67 Mo décompressés) et `data_climat.json`
// (63 Mo). Le dossier payant lit toujours les sources complètes. Le build refuse des fichiers périmés (prebuild).
//
// L'outre-mer n'y figure jamais : il a son propre référentiel (`@/lib/outremer`, COG et SocleOM).
import "server-only";
import communesBrutes from "@/data/accueil-communes.json";
import extraitBrut from "@/data/apercu-climat-communes.json";
import { DRIAS_CITY_FALLBACK } from "../communes.ts";
import { scenariosDepuisExtrait, type ExtraitClimat } from "../apercu-territoire.ts";
import type { GwlScenarios } from "../decision/climat-facts.ts";

export type CommuneLegere = {
  insee: string;
  nom: string;
  dept: string;
  lat: number;
  lon: number;
  uu: string | null;
  population: number | null;
  /** Taille résolue par `tailleVilleResolvedOf` : population de l'unité urbaine, ou de la commune hors UU. */
  tailleVille: number | null;
  tailleVilleSource: "urban_unit" | "commune" | null;
  /** Bande de rang « douceur des hivers », en points de base 0..10000, telle que l'index la porte. */
  douceurRang: [number, number] | null;
};

type FichierCommunes = { schema: number; champs: string[]; communes: Record<string, unknown[]> };
const fichier = communesBrutes as unknown as FichierCommunes;
const extrait = extraitBrut as unknown as ExtraitClimat;
if (fichier.schema !== 1) throw new Error(`src/data/accueil-communes.json : schéma ${fichier.schema}, attendu 1`);
const I = Object.fromEntries(fichier.champs.map((c, i) => [c, i])) as Record<string, number>;

/** La commune de l'index (Hexagone et Corse, arrondissements compris), ou `null` : code inconnu de l'index. */
export function communeLegere(insee: string): CommuneLegere | null {
  if (/^9[78]/.test(insee)) return null;
  const l = fichier.communes[insee];
  if (!l) return null;
  return {
    insee,
    nom: l[I.nom!] as string,
    dept: l[I.dept!] as string,
    lat: l[I.lat!] as number,
    lon: l[I.lon!] as number,
    uu: (l[I.uu!] as string | null) ?? null,
    population: (l[I.population!] as number | null) ?? null,
    tailleVille: (l[I.tailleVille!] as number | null) ?? null,
    tailleVilleSource: (l[I.tailleVilleSource!] as CommuneLegere["tailleVilleSource"]) ?? null,
    douceurRang: (l[I.douceurRang!] as [number, number] | null) ?? null,
  };
}

/**
 * Les scénarios DRIAS de la commune dans la forme de `getClimatDataCommune(insee).commune.s`, avec le même repli
 * Paris/Lyon/Marseille (sur le 1er arrondissement, `DRIAS_CITY_FALLBACK`). `null` : aucune donnée, jamais des
 * zéros. `scenariosDepuisExtrait` refuse d'elle-même tout code ultramarin (FUT-104).
 */
export function scenariosLegers(insee: string): GwlScenarios | null {
  if (/^9[78]/.test(insee)) return null;
  return scenariosDepuisExtrait(extrait, DRIAS_CITY_FALLBACK[insee] ?? insee);
}
