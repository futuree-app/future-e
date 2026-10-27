import "server-only";
import fs from "node:fs/promises";
import path from "node:path";
import { jeuValide, lireBruitAerien, bruitAerienIndisponible, type EntreeBruitAerien, type JeuBruitAerien, type LectureBruitAerien } from "@/lib/bruit-aerien";

// LE JEU DES PLANS DE BRUIT AÉRIEN (FUT-146), lu une fois par instance. Copie versionnée de la publication
// DGAC (`scripts/build-bruit-aerien.mjs`), 11,8 Mo : aucun appel réseau par dossier. Inclus dans la trace
// des routes qui le lisent (`next.config.ts`, `outputFileTracingIncludes`).
//
// Un fichier illisible n'est JAMAIS une absence de zone : la lecture rend `indisponible`, l'écran le dit, et
// une actualisation du dossier pendant cette panne est refusée (`sourcesAbsentes`).

let jeu: Promise<JeuBruitAerien | null> | null = null;

function charger(): Promise<JeuBruitAerien | null> {
  jeu ??= fs.readFile(path.join(process.cwd(), "data", "bruit-aerien.json"), "utf8")
    .then((t) => { const j: unknown = JSON.parse(t); return jeuValide(j) ? j : null; })
    .catch((e) => {
      console.error("[bruit-aerien] jeu illisible", String(e).slice(0, 160));
      jeu = null; // un échec n'est pas mémorisé : la prochaine lecture retente
      return null;
    });
  return jeu;
}

/** La lecture d'une adresse. Ne lève jamais. */
export async function lireBruitAerienAdresse(e: EntreeBruitAerien): Promise<LectureBruitAerien> {
  try {
    return lireBruitAerien(await charger(), e);
  } catch (err) {
    console.error("[bruit-aerien] lecture échouée", String(err).slice(0, 160));
    return bruitAerienIndisponible(e.geocodage);
  }
}
