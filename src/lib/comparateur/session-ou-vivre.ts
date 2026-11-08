// LA SESSION « OÙ VIVRE » : UN SEUL FORMAT, UN SEUL LECTEUR (FUT-139, FUT-27). Lib PURE.
//
// La dernière recherche d'un navigateur vit dans `localStorage` sous une clé unique. Trois endroits la
// touchent : « Où vivre » l'écrit et la restaure (retour de paywall), la reprise de /rapport la propose
// comme projet (FUT-8), et le script de retour arrière de /ou-vivre teste sa présence. Ils lisent tous ICI :
// la clé, la version, le délai et la validité ne se recopient plus.
//
// Pourquoi (FUT-27) : la reprise avait recopié la version 3. Dès le passage d'« Où vivre » à la version 4
// (FUT-36, 06/10/2026), /rapport ne reconnaissait plus aucune recherche, sans erreur ni test rouge : les
// tests de la reprise fabriquaient une session v3 au lieu de lire celle qu'« Où vivre » écrit.

export const SESSION_OUVIVRE_KEY = "futuree:ouvivre:session";

// Changer la version fait tomber TOUTES les sessions antérieures, pour la restauration comme pour la reprise.
// On la monte quand une session ancienne raconterait ce que futur•e ne dit plus.
//   v2 : premier format (09/06/2026).
//   v3 : la vue « compare » quitte la session (10/06/2026).
//   v4 (FUT-36) : une v3 peut porter « qui attire » (identité, synthèse), causalité retirée.
//   v5 (FUT-129) : une v4 peut porter l'ancienne lecture de l'inondation (« peu de reconnaissances CatNat
//       inondation », palier « Risque d'inondation faible »).
// Le `parsed` n'a changé de forme dans aucune de ces versions ; le serveur le nettoie de toute façon avant de
// l'écrire dans un projet (`parsedPourLeProjet`).
export const SESSION_OUVIVRE_VERSION = 5;
// 2 h : on restaure un retour de paywall, on ne ressuscite pas une session d'il y a deux jours.
export const SESSION_OUVIVRE_TTL_MS = 2 * 60 * 60 * 1000;

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

/** Ce qu'« Où vivre » dépose : le contenu, estampillé de la version et de l'heure. */
export function serialiserSessionOuVivre<T extends object>(contenu: T, maintenant: number): string {
  return JSON.stringify({ ...contenu, v: SESSION_OUVIVRE_VERSION, savedAt: maintenant });
}

/**
 * La session telle qu'« Où vivre » la restaurerait, ou `null` : illisible, d'une autre version, expirée, ou
 * impossible à reconstituer. La reprise de /rapport passe par la MÊME porte : une recherche qu'« Où vivre »
 * refuserait de réafficher n'est pas proposée comme projet.
 */
export function lireSessionOuVivre(raw: string | null, maintenant: number): Record<string, unknown> | null {
  if (!raw) return null;
  let s: Brut;
  try {
    s = objet(JSON.parse(raw));
  } catch {
    return null;
  }
  if (!s || s.v !== SESSION_OUVIVRE_VERSION) return null;
  if (typeof s.savedAt !== "number" || !Number.isFinite(s.savedAt)) return null;
  // Une heure à venir (horloge reculée, valeur forgée) ne prolonge pas la session.
  if (s.savedAt > maintenant || maintenant - s.savedAt > SESSION_OUVIVRE_TTL_MS) return null;
  if (typeof s.submittedText !== "string") return null;
  if (!sessionReconstituable(s)) return null;
  return s;
}

/** Le script de retour arrière de /ou-vivre (exécuté avant React) : il ne teste que la présence de la clé. */
export const SCRIPT_RETOUR_ARRIERE_OUVIVRE =
  `(function(){try{var n=performance.getEntriesByType('navigation')[0];if(n&&n.type==='back_forward'&&localStorage.getItem(${JSON.stringify(SESSION_OUVIVRE_KEY)})){location.reload();}}catch(e){}})();`;
