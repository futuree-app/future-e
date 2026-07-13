// Sérialisation canonique : clés triées récursivement. Deux valeurs égales -> même chaîne, quel que
// soit l'ordre d'insertion. L'ordre d'un TABLEAU est signifiant et donc conservé.
//
// UNIVERSEL (client + serveur) : logement-synthesis-cache l'importe et son buildFactHash tourne dans
// le navigateur (gate en session). Aucun import Node ici, jamais. Le SHA-256 vit à part, dans
// src/lib/server/sha256.ts.
//
// `undefined` JETTE : JSON.stringify(undefined) vaut undefined, et un `?? "null"` ferait
// silencieusement partager une identité à { a: undefined } et { a: null }. Pour une fonction
// d'IDENTITÉ, révéler une entrée mal formée vaut mieux que fabriquer une collision.
export function stableStringify(value: unknown): string {
  if (value === undefined) throw new TypeError("stableStringify : undefined n'a pas d'identité");
  if (value === null) return "null";
  if (typeof value === "function" || typeof value === "symbol") {
    throw new TypeError(`stableStringify : valeur non sérialisable (${typeof value})`);
  }
  if (typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return "[" + value.map(stableStringify).join(",") + "]";
  const obj = value as Record<string, unknown>;
  return "{" + Object.keys(obj).sort()
    .map((k) => JSON.stringify(k) + ":" + stableStringify(obj[k])).join(",") + "}";
}
