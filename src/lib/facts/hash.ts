// L'EMPREINTE d'un FactsSnapshot. Serveur uniquement : `node:crypto` (cf. src/lib/server/sha256.ts,
// même convention, sans `server-only` pour rester testable sous node --test).
import { sha256Hex } from "../server/sha256.ts";
import { stableStringify } from "../stable-stringify.ts";
import { hashableContent, type FactsSnapshot, type HashedSnapshot } from "./contract.ts";

// L'ALLER-RETOUR JSON d'abord : le snapshot est PERSISTÉ en JSON, et c'est cette forme que la route
// relit. Un champ `undefined` venu d'une source disparaît au stockage ; il doit disparaître aussi du
// hachage, sinon la même photo aurait deux empreintes (et `stableStringify` refuse `undefined`).
export function snapshotHash(s: FactsSnapshot): string {
  return sha256Hex(stableStringify(JSON.parse(JSON.stringify(hashableContent(s)))));
}

export function withHash(s: FactsSnapshot): HashedSnapshot {
  return { ...s, hash: snapshotHash(s) };
}
