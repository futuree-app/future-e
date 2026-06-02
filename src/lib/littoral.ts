import "server-only";
import fs from "node:fs/promises";
import path from "node:path";

export type LittoralFacade =
  | "manche"
  | "atlantique"
  | "bretagne"
  | "mediterranee"
  | "outre_mer";

export type LittoralDecret = { numero: string | null; url: string | null; debut: string | null };

export type LittoralSummary = {
  insee: string;
  facade: LittoralFacade;
  // Commune inscrite au titre du recul du trait de côte (loi Climat et Résilience,
  // art. L321-15). concernee est toujours true en V1 (on ne stocke que les inscrites),
  // le champ est conservé pour l'évolution V2.
  traitDeCote: { concernee: boolean; decret: LittoralDecret | null };
};

type LittoralRecord = {
  insee: string;
  nom: string;
  departement: string;
  region: string;
  facade: LittoralFacade;
  concernee: boolean;
  decret: LittoralDecret | null;
};

let indexCache: Map<string, LittoralRecord> | null = null;

async function loadIndex(): Promise<Map<string, LittoralRecord>> {
  if (indexCache) return indexCache;
  const file = path.join(process.cwd(), "data", "littoral-trait-de-cote.json");
  const raw = await fs.readFile(file, "utf8");
  const rows = JSON.parse(raw) as LittoralRecord[];
  const map = new Map<string, LittoralRecord>();
  for (const r of rows) map.set(String(r.insee).padStart(5, "0"), r);
  indexCache = map;
  return map;
}

// Renvoie le résumé littoral d'une commune, ou null si elle n'est pas dans la
// liste officielle (V1 : on ne parle que là où une base officielle existe).
export async function getLittoralSummary(
  inseeCode: string,
): Promise<LittoralSummary | null> {
  const insee = String(inseeCode).padStart(5, "0");
  const index = await loadIndex();
  const rec = index.get(insee);
  if (!rec) return null;
  return {
    insee: rec.insee,
    facade: rec.facade,
    traitDeCote: { concernee: rec.concernee, decret: rec.decret },
  };
}
