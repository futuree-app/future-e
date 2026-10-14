// FUT-93 · L'ÉTAT DU BANC, côté serveur. DEV UNIQUEMENT.
//
// Une seule « base » en mémoire, partagée par la page et la route (même processus, `globalThis` : la
// page et la route ne partagent pas toujours leurs modules). Elle reproduit ce que fait la vraie
// route : une version N+1 devient servie quand la génération aboutit. `retard` simule un rendu qui
// sert encore l'ancienne version pendant les N lectures qui suivent (contenu RSC périmé).
type Etat = { version: number; retard: number; lectures: number };
const g = globalThis as unknown as { __fut93?: Etat };

export function etatBanc(): Etat {
  g.__fut93 ??= { version: 1, retard: 0, lectures: 0 };
  return g.__fut93;
}

export function reinitialiser(): void {
  g.__fut93 = { version: 1, retard: 0, lectures: 0 };
}

/** La version que CE rendu sert. Pendant `retard` lectures après une génération, l'ancienne. */
export function versionServie(): number {
  const e = etatBanc();
  e.lectures++;
  if (e.retard > 0) { e.retard--; return e.version - 1; }
  return e.version;
}
