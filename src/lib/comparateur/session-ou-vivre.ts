// FUT-139 · Restauration de la session « Où vivre » (cf. `loadSession`, OuVivreClient.tsx : clé, version, TTL).

const ETATS_COMMUNE = new Set(["complete", "partielle", "aucune", "sans_priorite"]);

type Brut = Record<string, unknown> | null | undefined;
const objet = (x: unknown): Brut => (x && typeof x === "object" ? (x as Record<string, unknown>) : null);

/**
 * FUT-139 : une session ne se restaure que si elle permet de reconstituer la recherche telle que le moteur
 * l'a rendue. La couverture (agrégée et par commune) et le mode d'exploration gouvernent ce que la page
 * promet (palier, questions comparatives) : s'ils manquent, l'état est rejeté en entier, jamais complété
 * par « complete », et les messages AskFuture qu'il portait ne sont ni réaffichés ni réécrits.
 */
export function sessionReconstituable(s: unknown): boolean {
  const session = objet(s);
  const parsed = objet(session?.parsed);
  const outcome = objet(session?.outcome);
  if (!parsed || !outcome) return false;
  const results = outcome.results;
  if (!Array.isArray(results) || results.length === 0) return false;
  if (typeof outcome.couverture !== "string" || !ETATS_COMMUNE.has(outcome.couverture)) return false;
  for (const r of results) {
    const c = objet(objet(r)?.couverture);
    if (!c || typeof c.etat !== "string" || !ETATS_COMMUNE.has(c.etat) || !Array.isArray(c.nonMesurees)) return false;
  }
  const preferences = Array.isArray(parsed.preferences) ? parsed.preferences : [];
  const inondationDeclaree = preferences.some((p) => objet(p)?.key === "faible_risque_inondation");
  if (inondationDeclaree && typeof objet(outcome.inondation)?.exploration !== "boolean") return false;
  return true;
}
