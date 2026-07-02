// Sinistralité assurantielle passée (ONRN/CCR via Géorisques), millésime 2025,
// période 1995-2021. Deux périls : sécheresse (RGA) et inondation (tous types).
// Classes catégorielles verbatim, gatées par la représentativité communale.
// Doctrine : docs/vault/modules/logement.md + data-curator 2026-07-02.

import fs from "node:fs/promises";
import path from "node:path";

export type OnrnRaw = { c: string; f: string; r: string };

export type PerilState =
  | { kind: "lecture"; cout: string; frequence: string; representativite: string }
  | { kind: "aucun" }
  | { kind: "faible_repr"; representativite: string }
  | { kind: "indispo" };

export type OnrnSinistralite = { secheresse: PerilState; inondation: PerilState };

// Gate doctrine : ne raconter le coût/fréquence que si la représentativité ≥ "Entre 30 et 50%".
const GATE_REPR = new Set(["Entre 30 et 50%", "> 50%"]);
const NO_SINISTRE = "Pas de sinistre répertorié à CCR";

export function classify(raw: OnrnRaw | undefined): PerilState {
  if (!raw) return { kind: "indispo" };
  if (raw.r === NO_SINISTRE) return { kind: "aucun" };
  if (GATE_REPR.has(raw.r)) {
    return { kind: "lecture", cout: raw.c, frequence: raw.f, representativite: raw.r };
  }
  return { kind: "faible_repr", representativite: raw.r };
}

type Dataset = Record<string, OnrnRaw>;
let cacheSech: Dataset | null = null;
let cacheInon: Dataset | null = null;

async function loadOne(file: string, current: Dataset | null): Promise<Dataset> {
  if (current) return current;
  try {
    const raw = await fs.readFile(path.join(process.cwd(), "data", file), "utf8");
    return JSON.parse(raw) as Dataset;
  } catch {
    return {}; // fichier absent (build sans la donnée) : tout tombe en indispo.
  }
}

export async function getOnrnSinistralite(
  insee: string | null | undefined,
): Promise<OnrnSinistralite> {
  if (!insee) return { secheresse: { kind: "indispo" }, inondation: { kind: "indispo" } };
  cacheSech = await loadOne("onrn-secheresse.json", cacheSech);
  cacheInon = await loadOne("onrn-inondation.json", cacheInon);
  return {
    secheresse: classify(cacheSech[insee]),
    inondation: classify(cacheInon[insee]),
  };
}
