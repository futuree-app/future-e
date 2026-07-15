// Garde optionnelle pour les scripts d'enrichissement : remplace un ENOENT brut
// par un message métier. Câblée au fil de l'eau (une ligne). Couverture best-effort
// assumée (cf. spec §4.6).
import { existsSync } from "node:fs";
import { INDEX_JSON_PATH } from "./index-io.mjs";

export function assertIndexWorktree(jsonPath = INDEX_JSON_PATH) {
  if (!existsSync(jsonPath)) {
    throw new Error("La copie de travail de l'index n'existe pas. Lancez `npm run index:unpack`.");
  }
}
