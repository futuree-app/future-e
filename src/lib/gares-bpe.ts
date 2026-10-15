// FUT-97 · LES GARES DE VOYAGEURS DE LA BPE, pour dire la gare de la commune et la plus proche.
//
// `data/gares-bpe.json` est dérivé des points BPE versionnés (scripts/extraire-gares-bpe.mjs) : les
// seules gares (E107, E108, E109), 273 Ko, lu une fois par instance.
//
// ── ILLISIBLE N'EST PAS VIDE ─────────────────────────────────────────────────────────────────
// Toute lecture impossible (fichier absent de la fonction déployée, illisible, JSON invalide, liste
// vide) rend `null` : « on ne sait pas », et le signal ne nomme alors aucune gare. Jamais un tableau
// vide, qui se lirait « aucune gare recensée ». Seule une lecture réussie est gardée en mémoire : un
// échec passager se retente à la question suivante.
import fs from "node:fs/promises";
import path from "node:path";
import type { BpePoint } from "./logement-autour-types.ts";

export const FICHIER_GARES_BPE = path.join(process.cwd(), "data", "gares-bpe.json");

export type GaresBpe = { millesime: string; gares: BpePoint[] };

const cache = new Map<string, GaresBpe>();

/** Le contenu d'un fichier de gares, s'il est entier ; sinon `null`. */
export function lireGaresBpe(brut: string): GaresBpe | null {
  let j: unknown;
  try { j = JSON.parse(brut); } catch { return null; }
  if (!j || typeof j !== "object") return null;
  const { millesime, gares } = j as { millesime?: unknown; gares?: unknown };
  if (typeof millesime !== "string" || !Array.isArray(gares) || gares.length === 0) return null;
  const valides = gares.filter((g): g is { t: string; lat: number; lon: number; n?: string; a?: string } =>
    !!g && typeof g === "object" && typeof (g as BpePoint).t === "string"
    && Number.isFinite((g as BpePoint).lat) && Number.isFinite((g as BpePoint).lon));
  // Une liste partiellement corrompue n'est pas une liste fiable : on ne sait plus quelles gares manquent.
  if (valides.length !== gares.length) return null;
  return { millesime, gares: valides.map((g) => ({ c: "transports", t: g.t, lat: g.lat, lon: g.lon, ...(g.n ? { n: g.n } : {}), ...(g.a ? { a: g.a } : {}) })) };
}

export async function chargerGaresBpe(fichier: string = FICHIER_GARES_BPE): Promise<GaresBpe | null> {
  const enCache = cache.get(fichier);
  if (enCache) return enCache;
  let brut: string;
  try { brut = await fs.readFile(fichier, "utf8"); } catch { return null; }
  const lu = lireGaresBpe(brut);
  if (lu) cache.set(fichier, lu);
  return lu;
}
