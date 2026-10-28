import "server-only";
import fs from "node:fs/promises";
import path from "node:path";
import { BDIFF_CONVENTION, memoireIncendiesDeLaCommune, type MemoireIncendies, type TableIncendies } from "./data/bdiff-incendies.ts";

// LA MÉMOIRE DES INCENDIES ENREGISTRÉS D'UNE COMMUNE (FUT-147), lue dans la table construite par
// `scripts/bdiff/construire.mts`. Chargée une fois par process.
//
// UN FICHIER ABSENT OU ILLISIBLE REND l'état `indisponible`, JAMAIS UNE TABLE VIDE : une table vide
// dirait « aucun départ de feu recensé » partout. Le fichier est inclus dans la trace des routes qui
// l'affichent (`next.config.ts`). Une table d'une autre convention vaut un fichier illisible. Seule une
// lecture réussie est gardée : un échec se retente à l'appel suivant.
let table: Promise<TableIncendies | null> | null = null;

const estTable = (t: unknown): t is TableIncendies => {
  const x = t as Partial<TableIncendies> | null;
  return x?.meta?.convention === BDIFF_CONVENTION && typeof x.communes === "object" && x.communes !== null;
};

export function chargerTableIncendies(): Promise<TableIncendies | null> {
  table ??= fs.readFile(path.join(process.cwd(), "data", "bdiff-incendies.json"), "utf8")
    .then((raw) => {
      const t: unknown = JSON.parse(raw);
      if (!estTable(t)) throw new Error("bdiff-incendies.json : convention inattendue");
      return t;
    })
    .catch(() => {
      table = null;
      return null;
    });
  return table;
}

export async function getMemoireIncendies(insee: string): Promise<MemoireIncendies> {
  return memoireIncendiesDeLaCommune(await chargerTableIncendies(), insee);
}
