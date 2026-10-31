import "server-only";
import fs from "node:fs/promises";
import path from "node:path";
import { lireIndexSeveso, sevesoAutour, type IndexSeveso, type IndexSevesoDisque, type SiteProche } from "@/lib/data/installations-seveso";

// LES SITES SEVESO, lus une fois par instance depuis `data/installations-seveso.json` (FUT-167, construit par
// `scripts/fut167/construire-seveso.mjs`). Quelques centaines de kilooctets, aucun appel réseau par recherche.
// Inclus dans la trace des routes qui le lisent (`next.config.ts`, `outputFileTracingIncludes`).
// Un fichier illisible rend `indisponible`, JAMAIS une liste vide : l'absence d'un site ne se conclut que d'un
// index réellement lu.

let index: Promise<IndexSeveso | null> | null = null;

function valide(j: unknown): j is IndexSevesoDisque {
  const d = j as IndexSevesoDisque;
  return !!d && typeof d.extraitLe === "string" && Array.isArray(d.sites) && Array.isArray(d.exclus) && d.sites.length > 500;
}

function charger(): Promise<IndexSeveso | null> {
  index ??= fs.readFile(path.join(process.cwd(), "data", "installations-seveso.json"), "utf8")
    .then((t) => {
      const j: unknown = JSON.parse(t);
      if (!valide(j)) throw new Error("index inattendu");
      return lireIndexSeveso(j);
    })
    .catch((e) => {
      console.error("[seveso] index illisible", String(e).slice(0, 160));
      index = null; // un échec n'est pas mémorisé : la prochaine lecture retente
      return null;
    });
  return index;
}

export type SevesoAutour =
  | { etat: "indisponible" }
  | { etat: "lu"; extraitLe: string; rayonKm: number; sites: SiteProche[] };

/** Les sites Seveso autour d'un point. Ne lève jamais. */
export async function getSevesoAutour(lat: number, lon: number, rayonKm: number): Promise<SevesoAutour> {
  const i = await charger();
  if (!i) return { etat: "indisponible" };
  return { etat: "lu", extraitLe: i.extraitLe, rayonKm, sites: sevesoAutour(i, lat, lon, rayonKm) };
}

/** La date d'extraction de l'index, dite au lecteur ; `null` si l'index est illisible. */
export async function getSevesoExtraitLe(): Promise<string | null> {
  return (await charger())?.extraitLe ?? null;
}
