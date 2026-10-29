import "server-only";
import fs from "node:fs/promises";
import path from "node:path";
import { indexValide, irepAutour, type IndexIrep, type IrepAutour } from "@/lib/data/irep-registre";

// LE REGISTRE IREP, lu une fois par instance depuis `data/irep-registre.json` (FUT-152, construit par
// `scripts/fut152/construire-irep.mts`). 1,4 Mo, aucun appel réseau par recherche. Inclus dans la trace des
// routes qui le lisent (`next.config.ts`, `outputFileTracingIncludes`).
//
// Remplace l'extrait ADEME `data_risk_IREP` de 2019 (environ 1 500 établissements, 0 dans 10 km de Metz),
// retiré de la page par FUT-145. Un fichier illisible rend `indisponible`, JAMAIS une liste vide.

let index: Promise<IndexIrep | null> | null = null;

function charger(): Promise<IndexIrep | null> {
  index ??= fs.readFile(path.join(process.cwd(), "data", "irep-registre.json"), "utf8")
    .then((t) => {
      const j: unknown = JSON.parse(t);
      if (!indexValide(j)) throw new Error("convention inattendue");
      return j;
    })
    .catch((e) => {
      console.error("[irep] index illisible", String(e).slice(0, 160));
      index = null; // un échec n'est pas mémorisé : la prochaine lecture retente
      return null;
    });
  return index;
}

/** Les établissements du registre autour d'un point. Ne lève jamais. */
export async function getIrepAutour(lat: number, lon: number, rayonM: number): Promise<IrepAutour> {
  return irepAutour(await charger(), lat, lon, rayonM);
}
