import { readFile } from "node:fs/promises";
import zlib from "node:zlib";
import { memoizePromise } from "./memoize-promise.ts";
import { communesFromPayload } from "./comparateur-index-payload.ts";
import type { IndexCommune } from "./comparateur-vie.ts";

// Assemble le chargement de l'index gzip : lecture + gunzip + validation racine,
// dédupliqué/mémoïsé (une seule lecture disque, rejet persistant). `afterLoad`
// permet à l'appelant de peupler ses caches dérivés (buildUuPop) une seule fois.
export function createCompressedIndexLoader(
  gzPath: string,
  afterLoad: (communes: IndexCommune[]) => void = () => {},
): () => Promise<IndexCommune[]> {
  return memoizePromise(async () => {
    const compressed = await readFile(gzPath);
    const communes = communesFromPayload(zlib.gunzipSync(compressed).toString("utf8"));
    afterLoad(communes);
    return communes;
  });
}
