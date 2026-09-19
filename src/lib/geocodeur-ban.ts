// ════════════════════════════════════════════════════════════════════════════════════════════
// L'ADRESSE DU GÉOCODEUR, ÉCRITE UNE SEULE FOIS.
//
// ── POURQUOI CE MODULE (19/09/2026) ──────────────────────────────────────────────────────────
// `https://api-adresse.data.gouv.fr` était écrit en dur à huit endroits : le socle BAN
// (`ban.ts`, recherche ET inverse), la recherche de lieu nommé (`geocode-place.ts`), quatre
// composants d'autocomplétion de commune, et un script d'administration. Ce point d'entrée est
// déprécié au profit du géocodeur Géoplateforme, et la moitié du produit l'utilisait encore, y
// compris le parcours d'achat : le jour où il ferme, plus personne ne peut acheter.
//
// Réparer le seul checkout aurait laissé sept autres appels prêts à tomber le même jour. C'est
// l'ADRESSE qui devait cesser d'être dispersée, pas un écran qui devait être réparé.
//
// ── LE FORMAT EST LE MÊME, ET C'EST VÉRIFIÉ ──────────────────────────────────────────────────
// Relevé le 19/09/2026 sur les deux services, pour une recherche de commune, une recherche
// d'adresse et un appel inverse : mêmes `properties` (label, citycode, postcode, city, type,
// municipality, depcode, population, context, score, x, y, banId, id), même géométrie, et surtout
// MÊMES IDENTIFIANTS (`44109`, `75102_6998_00001`). La Géoplateforme sert la même base.
//
// Conséquence : la migration ne convertit rien. Aucun appelant n'a eu à changer son mapping, ce
// qui est précisément ce qui la rend sûre. Le paramètre `index=address` est accepté et facultatif
// (testé sans, résultat identique) : on ne le pose pas, pour rester au plus près de l'appel qui
// fonctionnait.
//
// ── CE QUE CE MODULE NE FAIT PAS ─────────────────────────────────────────────────────────────
// Il ne normalise aucune réponse. Chaque appelant garde le sien : la recherche de commune du
// comparateur n'attend pas la même forme que le socle d'adresse, et unifier leurs types aurait
// réécrit quatre comportements qui marchent pour résoudre un problème qui n'est pas le leur.
//
// Pas de `server-only` : ces URL sont construites côté client aussi (autocomplétion), et le
// service est public avec CORS ouvert.
// ════════════════════════════════════════════════════════════════════════════════════════════

/**
 * Le géocodeur officiel. Une seule occurrence dans tout le produit, et un test structurel
 * (`geocodeur-ban.test.ts`) refuse qu'une seconde apparaisse ailleurs.
 */
export const GEOCODEUR_BAN = "https://data.geopf.fr/geocodage";

/** Recherche plein texte. `type`, `limit`, `autocomplete`… passent tels quels au service. */
export function urlRechercheBan(params: Record<string, string | number>): string {
  const url = new URL(`${GEOCODEUR_BAN}/search`);
  for (const [cle, valeur] of Object.entries(params)) url.searchParams.set(cle, String(valeur));
  return url.toString();
}

/**
 * Le cas des quatre autocomplétions de commune, qui posaient toutes la même requête à une
 * limite près. Nommer ce cas évite quatre copies de `type: "municipality"`, dont l'oubli
 * ramènerait des rues dans une liste de communes.
 */
export function urlRechercheCommunes(query: string, limit: number): string {
  return urlRechercheBan({ q: query, limit, type: "municipality" });
}

/** Géocodage inverse : les adresses autour d'un point. */
export function urlReverseBan(params: Record<string, string | number>): string {
  const url = new URL(`${GEOCODEUR_BAN}/reverse`);
  for (const [cle, valeur] of Object.entries(params)) url.searchParams.set(cle, String(valeur));
  return url.toString();
}
