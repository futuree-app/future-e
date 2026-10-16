// FUT-50 · LA POLITIQUE DE CACHE DES ROUTES PUBLIQUES DE L'ACCUEIL. PURE, testée.
//
// Une lecture d'accueil est déterministe et commune à tous les visiteurs : le CDN de Vercel peut la servir sans
// réveiller une fonction. Mais une PANNE ne doit jamais être servie durablement, même quand le statut HTTP vaut 200
// (« Donnée indisponible » après un délai GASPAR). Et une indisponibilité STRUCTURELLE (territoire hors couverture,
// critère non défini outre-mer) est, elle, une vraie réponse : elle se met en cache comme une donnée.
//
// Les données ne changent qu'avec un nouveau déploiement (fichiers dérivés, empaquetés) ; le cache CDN de Vercel
// est propre à chaque déploiement, une correction scientifique repart donc d'un cache vide. La fenêtre « stale »
// ne couvre qu'une revalidation en arrière-plan À L'INTÉRIEUR d'un même déploiement : à vérifier sur Vercel
// (protocole dans docs/audits/2026-10-16-fut50-route-publique-legere.md).
export const PARAMETRES_LECTURE = new Set(["insee", "cle"]);
export const PARAMETRES_COMMUNE = new Set(["insee"]);

const DURABLE = "public, max-age=0, s-maxage=86400, stale-while-revalidate=86400";
const INCONNUE = "public, max-age=0, s-maxage=3600";
const AUCUN = "no-store";

export type Decision = { cacheControl: string; raison: string };

/** Le `Cache-Control` d'une réponse d'accueil, et sa raison (renvoyée en `X-Accueil-Cache` pour l'observer). */
export function politiqueCache(r: { statut: number; durable?: boolean }, parametres: Iterable<string>, autorises: Set<string>): Decision {
  const superflus = [...parametres].filter((p) => !autorises.has(p));
  if (r.statut === 400) return { cacheControl: AUCUN, raison: "requete_invalide" };
  // Un paramètre en trop fragmenterait le cache (une entrée par variante d'URL) : on répond, sans stocker.
  if (superflus.length) return { cacheControl: AUCUN, raison: `parametres_superflus:${superflus.sort().join(",")}` };
  if (r.statut === 404) return { cacheControl: INCONNUE, raison: "commune_inconnue" };
  if (r.statut !== 200) return { cacheControl: AUCUN, raison: `statut_${r.statut}` };
  return r.durable === false ? { cacheControl: AUCUN, raison: "indisponibilite_temporaire" } : { cacheControl: DURABLE, raison: "durable" };
}
