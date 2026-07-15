// Logique PURE d'I/O de l'index comparateur (gzip canonique). Aucune écriture de
// fichier ici : ces fonctions opèrent sur des Buffers, testables sans toucher
// l'index réel de 81 Mo. GÉNÉRIQUE : aucune connaissance métier (pas de rankBands).
// Les scripts index-pack/unpack/verify.mjs orchestrent l'I/O réelle par-dessus.
import zlib from "node:zlib";
import crypto from "node:crypto";
import path from "node:path";

export const INDEX_JSON_PATH = path.join(process.cwd(), "data", "comparateur-index.json");
export const INDEX_GZ_PATH = path.join(process.cwd(), "data", "comparateur-index.json.gz");

export function sha256(buf) {
  return crypto.createHash("sha256").update(buf).digest("hex");
}

// gzip niveau 9, déterministe (MTIME=0 dans l'en-tête Node) : un pack sans
// changement de données ne produit aucun diff git.
export function packJson(jsonBuffer) {
  return zlib.gzipSync(jsonBuffer, { level: 9 });
}

export function unpackGz(gzBuffer) {
  return zlib.gunzipSync(gzBuffer);
}

export function parseCommunes(jsonBuffer) {
  const parsed = JSON.parse(jsonBuffer.toString("utf8"));
  if (typeof parsed !== "object" || parsed === null || !Array.isArray(parsed.communes)) {
    throw new Error("Index comparateur invalide : propriété communes absente ou non tableau.");
  }
  return parsed.communes;
}

// Invariants STRUCTURELS génériques (aucune fonctionnalité métier).
export function assertIndexInvariants(communes, opts = {}) {
  const { minCount = 30000, maxCount = 40000 } = opts;
  if (!Array.isArray(communes)) {
    throw new Error("Index invalide : communes n'est pas un tableau.");
  }
  if (communes.length <= minCount || communes.length >= maxCount) {
    throw new Error(`Index invalide : effectif de communes hors bornes (${communes.length}, attendu ]${minCount}, ${maxCount}[).`);
  }
  const seen = new Set();
  for (const c of communes) {
    if (typeof c.insee !== "string" || c.insee.length === 0) {
      throw new Error("Index invalide : commune sans code INSEE.");
    }
    if (seen.has(c.insee)) {
      throw new Error(`Index invalide : code INSEE dupliqué (${c.insee}).`);
    }
    seen.add(c.insee);
  }
}
