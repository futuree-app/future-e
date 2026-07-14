// LE LIMITEUR D'APPELS À LA NAVIGATION IGN. Toute la mobilité (isochrones, itinéraires) passe par ici.
//
// LA FILE EST GLOBALE AU PROCESS, jamais par requête : un `Promise.all` plafonné dans une recherche ne
// protège de rien quand deux lecteurs cherchent en même temps. Mesuré contre l'API le 2026-07-14, sur
// 12 appels et des points distincts :
//
//     concurrence  3  ->  1,6 s,  ZÉRO erreur
//     concurrence  6  ->  1,3 s,  un 429
//     concurrence 12  ->  0,1 s,  DOUZE 429 (tout)
//
// L'API renvoie un en-tête Retry-After (1 à 5 s) : on l'écoute, plutôt que de deviner un backoff. Un seul
// retry, borné : insister sur un service qui nous demande d'attendre, c'est aggraver son rate-limit et
// suspendre la recherche du lecteur. Au-delà, on rend `rate_limited`, que l'appelant traduit en
// routing_unavailable (une panne, retentable, jamais un verdict).
export const IGN_MAX_CONCURRENCY = 3;
const DEFAULT_TIMEOUT_MS = 10_000;
const MAX_RETRY_WAIT_MS = 6_000; // un Retry-After absurde ne fait pas patienter le lecteur indéfiniment

export type IgnResponse = { ok: true; json: unknown } | { ok: false; reason: "rate_limited" | "error" };

let enCours = 0;
const fileDAttente: (() => void)[] = [];

async function acquerir(): Promise<void> {
  if (enCours < IGN_MAX_CONCURRENCY) {
    enCours++;
    return;
  }
  await new Promise<void>((resolve) => fileDAttente.push(resolve));
  enCours++;
}

function relacher(): void {
  enCours--;
  const suivant = fileDAttente.shift();
  if (suivant) suivant();
}

function retryAfterMs(res: Response): number {
  const h = res.headers.get("retry-after");
  const s = h ? Number(h) : NaN;
  if (!Number.isFinite(s) || s < 0) return 1000;
  return Math.min(s * 1000, MAX_RETRY_WAIT_MS);
}

async function unAppel(url: string, timeoutMs: number): Promise<Response | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { headers: { accept: "application/json" }, signal: controller.signal });
  } catch {
    return null; // réseau coupé, timeout : une panne, pas un résultat
  } finally {
    clearTimeout(timeout);
  }
}

export async function ignFetch(url: string, timeoutMs: number = DEFAULT_TIMEOUT_MS): Promise<IgnResponse> {
  await acquerir();
  try {
    let res = await unAppel(url, timeoutMs);

    // LE SEUL RETRY, et il attend ce que le serveur demande. On garde le jeton de concurrence pendant
    // l'attente : sinon trois appels relâchés en même temps repartiraient tous ensemble dans la seconde qui
    // suit, et le 429 recommencerait.
    if (res?.status === 429) {
      await new Promise((r) => setTimeout(r, retryAfterMs(res!)));
      res = await unAppel(url, timeoutMs);
      if (res?.status === 429) return { ok: false, reason: "rate_limited" };
    }

    if (!res || !res.ok) return { ok: false, reason: "error" };
    try {
      return { ok: true, json: await res.json() };
    } catch {
      return { ok: false, reason: "error" }; // une réponse illisible n'est pas une réponse
    }
  } finally {
    relacher();
  }
}
