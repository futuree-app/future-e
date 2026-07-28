// ACCÈS À L'ARTEFACT `data/iris-logement.json`. Isolé du pur (`../iris-logement.ts`) parce que ce
// dernier est importé par le CLIENT : un `node:fs` qui remonte dans un composant fait échouer le
// build Turbopack (« does not support external modules »). Même séparation que dpe-attribution/dpe.

import fs from "node:fs/promises";
import path from "node:path";
import { resolveIrisByPoint } from "../iris-point.ts";
import { readCarOwnership, type CarOwnership, type IrisLogementRow } from "../iris-logement.ts";

type Artefact = {
  dataYear: number;
  secteurs: Record<string, IrisLogementRow>;
  communes: Record<string, number>;
};

let cache: Artefact | null = null;

async function load(): Promise<Artefact | null> {
  if (cache) return cache;
  try {
    const raw = await fs.readFile(path.join(process.cwd(), "data", "iris-logement.json"), "utf8");
    cache = JSON.parse(raw) as Artefact;
    return cache;
  } catch {
    return null; // artefact non généré : `unknown`, jamais une valeur inventée
  }
}

/**
 * La lecture pour une adresse, à partir de l'IRIS déjà résolu au point (cf. `iris-point.ts`, WFS IGN) et du
 * code commune. Les jointures se font sur les CODES, jamais sur les libellés — cf. le bug des quatre
 * Saint-Denis.
 */
export async function getCarOwnership(irisCode: string | null, insee: string | null): Promise<CarOwnership> {
  const a = await load();
  if (!a) return { kind: "unknown" };
  const communeShare = insee ? a.communes[insee] ?? null : null;
  const row = irisCode ? a.secteurs[irisCode] ?? null : null;
  return readCarOwnership(row, communeShare, irisCode, insee);
}

export async function getIrisLogementDataYear(): Promise<number | null> {
  return (await load())?.dataYear ?? null;
}

/**
 * La lecture pour une adresse géocodée : résout l'IRIS au point (WFS IGN), puis lit l'artefact.
 *
 * NON PERSISTÉE, délibérément. La valeur vient d'un artefact versionné qui sera régénéré à chaque
 * millésime INSEE ; la figer dans un snapshot ferait cohabiter des dossiers qui n'annoncent pas le
 * même millésime sans le dire. La lecture est locale (JSON en cache mémoire) : la recalculer coûte
 * moins cher que de la stocker.
 */
export async function getCarOwnershipAtPoint(
  lat: number,
  lon: number,
  insee: string | null,
): Promise<CarOwnership> {
  const iris = await resolveIrisByPoint(lat, lon);
  return getCarOwnership(iris, insee);
}
