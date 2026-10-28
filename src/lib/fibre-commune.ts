import "server-only";
import fs from "node:fs/promises";
import path from "node:path";
import { fibreDeLaCommune, type LectureFibre, type TableFibre } from "./data/arcep-fibre.ts";

// LA PART DES LOCAUX RACCORDABLES À LA FIBRE D'UNE COMMUNE, lue dans la table extraite des fichiers de
// l'Arcep (`scripts/arcep/construire.mts`, FUT-148). Chargée une fois par process (900 Ko).
//
// UN FICHIER ABSENT OU ILLISIBLE REND `null`, JAMAIS UNE TABLE VIDE : une table vide lirait « absente »
// pour toutes les communes, et `null` dit la vérité, « donnée indisponible ». Aucune lecture ne devient
// 0 %. Le fichier est inclus dans la trace des routes qui le lisent (`next.config.ts`).
//
// HORS DU SNAPSHOT TERRITOIRE, volontairement : la carte fibre ne passe pas par l'empreinte qui indexe
// les synthèses rédigées (`synthesisCacheKey`). L'ajouter les aurait toutes invalidées, pour une donnée
// que la synthèse ne cite pas.
let table: Promise<TableFibre | null> | null = null;

function charger(): Promise<TableFibre | null> {
  table ??= fs.readFile(path.join(process.cwd(), "data", "arcep-fibre.json"), "utf8")
    .then((raw) => JSON.parse(raw) as TableFibre)
    .catch(() => null);
  return table;
}

export async function getFibreCommune(insee: string): Promise<LectureFibre | null> {
  return fibreDeLaCommune(await charger(), insee);
}

/** Plusieurs communes, une seule lecture de la table (le comparateur en propose trois). */
export async function getFibreCommunes(codes: string[]): Promise<Record<string, LectureFibre | null>> {
  const t = await charger();
  return Object.fromEntries(codes.map((c) => [c, fibreDeLaCommune(t, c)]));
}
