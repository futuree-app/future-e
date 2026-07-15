// Mémoïse une fonction async sans argument : déduplique les appels concurrents
// (une seule exécution) et CONSERVE une promesse rejetée (pas de retry). Pour un
// artefact canonique corrompu, l'échec doit être fatal : réparer puis redémarrer.
// Ne pas transformer ceci en retry silencieux.
export function memoizePromise<T>(fn: () => Promise<T>): () => Promise<T> {
  let promise: Promise<T> | null = null;
  return () => (promise ??= fn());
}
