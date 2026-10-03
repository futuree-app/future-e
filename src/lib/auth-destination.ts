// OÙ ENVOYER UN UTILISATEUR APRÈS CONNEXION, OU DÉJÀ CONNECTÉ (FUT-40). Module PUR.
//
// La règle vivait en trois copies : `getSafeNextPath` dans les actions d'auth, `getSafeNext` dans
// /connexion et dans /inscription. Elle est la même partout : un chemin relatif au site, qui commence
// par « / » sans être « // » (une URL protocolaire qui ferait sortir du site). À défaut, l'espace du
// compte, destination canonique après connexion.
export const DESTINATION_APRES_CONNEXION = "/compte";

/** Le chemin demandé s'il est sûr, sinon `undefined`. */
export function cheminSur(value?: string | null): string | undefined {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return undefined;
  return value;
}

/** La destination après connexion : le chemin demandé s'il est sûr, sinon le compte. */
export function destinationApresConnexion(value?: string | null): string {
  return cheminSur(value) ?? DESTINATION_APRES_CONNEXION;
}

/**
 * /connexion et /inscription n'ont rien à proposer à quelqu'un qui est déjà connecté : avant FUT-40,
 * ils lui affichaient leur formulaire, et le site lui redemandait ses identifiants alors que sa session
 * était valide. Renvoie la destination si l'utilisateur est connecté, `null` sinon (formulaire normal).
 */
export function redirectionSiDejaConnecte(user: unknown, next?: string | null): string | null {
  return user ? destinationApresConnexion(next) : null;
}
