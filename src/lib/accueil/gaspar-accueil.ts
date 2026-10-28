// FUT-50 · GASPAR POUR L'ACCUEIL : les risques avec leur code, en 3 s au plus. PUR (aucune donnée embarquée),
// donc testable sans réseau contre un faux serveur (`gaspar-accueil.test.ts`).
//
// `getGeorisquesSummary` (dossiers payants) n'est pas modifiée : elle ne garde que les libellés. Ici, `panne`
// distingue une indisponibilité TEMPORAIRE (délai, HTTP 4xx/5xx, réseau, réponse illisible ou incomplète) d'une
// réponse valide : seule une réponse valide peut être mise en cache (`cache-accueil.ts`). Une panne ne devient
// jamais « aucun risque » : la lecture dit « Donnée indisponible ».
import { codeGaspar } from "../georisques-flags.ts";
import { EN_TETES_GEORISQUES } from "../georisques-http.ts";
import { interpreterReponseGaspar, type RisqueGaspar } from "./pastilles.ts";

/** Le délai accordé à GASPAR avant de dire la donnée indisponible (FUT-50 : 8 s → 3 s ; mesures dans le compte rendu). */
export const DELAI_GASPAR_MS = 3000;

export type ReponseGaspar = { risques: RisqueGaspar[] | null; panne: boolean; ms: number };

export async function risquesGaspar(insee: string, opts: { delaiMs?: number; base?: string; fetchImpl?: typeof fetch } = {}): Promise<ReponseGaspar> {
  const debut = Date.now();
  const controle = new AbortController();
  const delai = setTimeout(() => controle.abort(), opts.delaiMs ?? DELAI_GASPAR_MS);
  try {
    const r = await (opts.fetchImpl ?? fetch)(`${opts.base ?? "https://georisques.gouv.fr"}/api/v1/gaspar/risques?code_insee=${encodeURIComponent(codeGaspar(insee))}`, {
      headers: EN_TETES_GEORISQUES, signal: controle.signal, cache: "no-store",
    });
    if (!r.ok) return { risques: null, panne: true, ms: Date.now() - debut };
    const risques = interpreterReponseGaspar(await r.json());
    return { risques, panne: risques == null, ms: Date.now() - debut };
  } catch {
    return { risques: null, panne: true, ms: Date.now() - debut };
  } finally {
    clearTimeout(delai);
  }
}
