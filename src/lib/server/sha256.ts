// L'IDENTITÉ d'un artefact narratif. SHA-256, et pas le fnv1a du cache logement : une collision
// servirait au lecteur le texte d'un AUTRE plan.
//
// SERVEUR UNIQUEMENT (d'où l'emplacement sous src/lib/server/), mais SANS `import "server-only"` :
// ce module n'est pas résolvable par Node (Next l'aliase au build), et le piège maison est connu
// (comparateur-vie.ts). Un test qui value-importe ce fichier casserait donc en `node --test`. La
// garantie est ici conventionnelle ; un import client accidentel échouerait de toute façon au build,
// `node:crypto` n'existant pas dans un bundle navigateur.
import { createHash } from "node:crypto";

export function sha256Hex(input: string): string {
  return createHash("sha256").update(input, "utf8").digest("hex");
}
