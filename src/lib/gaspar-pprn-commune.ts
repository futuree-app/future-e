import "server-only";
import fs from "node:fs/promises";
import path from "node:path";
import {
  plansInondationDeLaCommune, type PlansInondationCommune, type TablePlansInondation,
} from "./data/gaspar-pprn-inondation.ts";

// LES PLANS DE PRÉVENTION DES INONDATIONS D'UNE COMMUNE, lus dans la table extraite de l'export GASPAR
// (`scripts/gaspar/extraire-pprn-inondation.mts`). Chargée une fois par process.
//
// UN FICHIER ABSENT OU ILLISIBLE REND `null`, JAMAIS UNE TABLE VIDE : une table vide dirait « aucun
// plan » pour toutes les communes, et la règle en tirerait une lecture qui n'a pas eu lieu. `null`, la
// règle rend `uncertain`. Le fichier est inclus dans la trace des routes qui assemblent un dossier
// (`next.config.ts`).
let table: Promise<TablePlansInondation | null> | null = null;

function charger(): Promise<TablePlansInondation | null> {
  table ??= fs.readFile(path.join(process.cwd(), "data", "gaspar-pprn-inondation.json"), "utf8")
    .then((raw) => JSON.parse(raw) as TablePlansInondation)
    .catch(() => null);
  return table;
}

export async function getPlansInondationCommune(insee: string): Promise<PlansInondationCommune | null> {
  return plansInondationDeLaCommune(await charger(), insee);
}
