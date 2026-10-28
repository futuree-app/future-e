import "server-only";
import fs from "node:fs/promises";
import path from "node:path";
import { memoireIncendiesDeLaCommune, type MemoireIncendies, type TableIncendies } from "./data/bdiff-incendies.ts";

// LA MÉMOIRE DES INCENDIES ENREGISTRÉS D'UNE COMMUNE (FUT-147), lue dans la table construite par
// `scripts/bdiff/construire.mts`. Chargée une fois par process.
//
// UN FICHIER ABSENT OU ILLISIBLE REND l'état `indisponible`, JAMAIS UNE TABLE VIDE : une table vide
// dirait « aucun départ de feu recensé » partout. Le fichier est inclus dans la trace des routes qui
// l'affichent (`next.config.ts`).
let table: Promise<TableIncendies | null> | null = null;

export function chargerTableIncendies(): Promise<TableIncendies | null> {
  table ??= fs.readFile(path.join(process.cwd(), "data", "bdiff-incendies.json"), "utf8")
    .then((raw) => JSON.parse(raw) as TableIncendies)
    .catch(() => null);
  return table;
}

export async function getMemoireIncendies(insee: string): Promise<MemoireIncendies> {
  return memoireIncendiesDeLaCommune(await chargerTableIncendies(), insee);
}
