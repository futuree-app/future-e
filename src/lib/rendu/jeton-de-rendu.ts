// FUT-93 · UN JETON PROPRE À CHAQUE RENDU SERVEUR, POUR LA FRONTIÈRE DE LA CONCLUSION RÉDIGÉE.
//
// Mesuré le 12/10/2026 (banc `/dev/fut93`, build de production, Next 16.2.4, React 19.2.4) : une
// relecture du routeur (`router.refresh()`) dont la charge contient la frontière `Suspense` de
// `ConclusionRedigee`, déjà révélée et de MÊME identité, suivie d'une partie de la page, est rendue par
// React mais, selon une course de l'ordonnancement, jamais validée : l'écran garde l'ancien état. Une
// frontière dont la clé change à chaque rendu est NEUVE pour React : la relecture se valide, et le
// contenu de la frontière aussi (12 sur 12 contre 1 sur 4). Voir
// `docs/audits/2026-10-12-fut93-relectures-rapport.md`.
//
// Le prix : à chaque relecture, la conclusion peut montrer un instant son repli déterministe avant la
// version rédigée (lue depuis le cache, sans nouvelle génération).
export function jetonDeRendu(): string {
  return globalThis.crypto.randomUUID();
}
