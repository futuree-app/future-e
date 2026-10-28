// LES EN-TÊTES DE TOUT APPEL À L'API GÉORISQUES (FUT-158, 28/10/2026). Un seul endroit, parce qu'un appel
// qui les oublie tombe en silence.
//
// L'INCIDENT. Géorisques coupe la connexion (ECONNRESET, « fetch failed ») sur une partie des requêtes envoyées
// par `fetch` côté Node, selon la combinaison d'en-têtes, et pas sur toutes les routes de la même façon. Mesuré
// le 28/10/2026, un processus Node neuf par appel, 9 routes du dossier × 2 domaines :
//   - en-têtes d'avant (`Accept: application/json`, compression par défaut de `fetch`) : 18 échecs sur 18 ;
//   - sans `Accept` : `gaspar/risques` et `zonage_sismique` v1 échouent encore, avec ou sans User-Agent ;
//   - avec `Accept-Encoding: identity` : 54 réussites sur 54 (3 répétitions), `Accept` JSON compris.
// curl reproduit la coupure avec `-H "Accept: application/json"` seul, et la lève en ajoutant
// `Accept-Encoding: identity`. En production le même jour, `/georisques?insee=57463` (GASPAR et zonage v1)
// répondait 500 « fetch failed » pendant que la sonde (cavités v1, argile v2) restait verte, et deux dossiers
// du 24/10 ont été enregistrés sans Géorisques à la commune ni au point.
//
// La règle du fournisseur n'est pas documentée : c'est un filtrage côté serveur, que la réponse non compressée
// traverse. Les réponses utiles font quelques kilo-octets ; renoncer à la compression ne coûte rien de mesurable.
// Ne pas retirer cet en-tête sans refaire la matrice (`docs/audits/2026-10-28-fut158-incident-georisques.md`).
export const EN_TETES_GEORISQUES: Readonly<Record<string, string>> = {
  accept: "application/json",
  "accept-encoding": "identity",
};

/**
 * La trace d'un appel Géorisques qui n'a pas abouti : une ligne JSON, sans jeton ni paramètre (les
 * coordonnées d'une adresse sont celles d'un client). Lisible dans les journaux Vercel par `georisques_echec`.
 */
export function tracerEchecGeorisques(url: string, detail: { statut?: number; erreur?: unknown }): void {
  let chemin = url;
  try { chemin = new URL(url).pathname; } catch { /* une URL illisible se trace telle quelle */ }
  const cause = detail.erreur as { name?: string; cause?: { code?: string } } | undefined;
  console.error(JSON.stringify({
    evenement: "georisques_echec",
    chemin,
    statut: detail.statut ?? null,
    erreur: cause ? (cause.cause?.code ?? cause.name ?? "inconnue") : null,
  }));
}
