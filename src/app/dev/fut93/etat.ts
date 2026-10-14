// FUT-93 · L'ÉTAT DU BANC, côté serveur. DEV UNIQUEMENT.
//
// Une seule « base » en mémoire, partagée par la page et la route (même processus, `globalThis` : la
// page et la route ne partagent pas toujours leurs modules). Elle reproduit ce que fait la vraie
// route : une version N+1 devient servie quand la génération aboutit. `retard` simule un rendu qui
// sert encore l'ancienne version pendant les N lectures qui suivent (contenu RSC périmé).
// `critere` et `lien` : ce que les gestes des critères du projet et du lien avec le bien ont écrit (banc
// des six autres relectures). Le dossier servi, lui, reste figé : seul le bandeau change.
type Etat = { version: number; retard: number; lectures: number; critere: "inspire" | "adopte"; lien: boolean };
const g = globalThis as unknown as { __fut93?: Etat };

export function etatBanc(): Etat {
  g.__fut93 ??= { version: 1, retard: 0, lectures: 0, critere: "inspire", lien: false };
  return g.__fut93;
}

export function reinitialiser(): void {
  g.__fut93 = { version: 1, retard: 0, lectures: 0, critere: "inspire", lien: false };
}

/** La version que CE rendu sert. Pendant `retard` lectures après une génération, l'ancienne. */
export function versionServie(): number {
  const e = etatBanc();
  e.lectures++;
  if (e.retard > 0) { e.retard--; return e.version - 1; }
  return e.version;
}
