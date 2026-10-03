// L'ÉTAT DE SESSION DE LA NAVBAR (FUT-40). Module PUR : ce qu'elle affiche, jamais ce qui est autorisé.
//
// Avant FUT-40, la Navbar ignorait la session : sur toute page publique, un utilisateur connecté lisait
// « Se connecter » et « Commencer », et ce bouton le menait à un formulaire de connexion. L'état vient ici
// du client Supabase du navigateur. C'est une décision de PRÉSENTATION : l'autorisation des pages et des
// données reste serveur (`requireCurrentUser`), et rien ici ne doit servir à en décider.
export type EtatSession = "unknown" | "authenticated" | "anonymous";

export type NavCta = { href: string; label: string };
export type NavCtas = { primary?: NavCta; secondary?: NavCta };

/** Les boutons à rendre. `masques` : place réservée, contenu invisible (état pas encore résolu). */
export type BoutonsNavbar = { secondary: NavCta; primary: NavCta; masques: boolean };

const ANONYME = { secondary: { href: "/connexion", label: "Se connecter" }, primary: { href: "/inscription", label: "Commencer" } };
// Le vocabulaire et les destinations de l'espace, tels que les pages du compte les passent déjà.
const CONNECTE = { secondary: { href: "/compte", label: "Mon compte" }, primary: { href: "/rapport", label: "Mon rapport" } };

export function etatDepuisSession(session: unknown): EtatSession {
  return session ? "authenticated" : "anonymous";
}

export function etatApresEvenement(evenement: string, session: unknown): EtatSession {
  if (evenement === "SIGNED_OUT") return "anonymous";
  return etatDepuisSession(session);
}

/**
 * Les boutons de la Navbar. Une page qui fournit ses propres boutons (les pages du compte) les garde.
 * Sinon : l'espace pour un utilisateur connecté, la connexion pour un anonyme, et, tant que l'état n'est
 * pas résolu, une place réservée invisible plutôt qu'un « Se connecter » qui clignoterait.
 */
export function boutonsNavbar(etat: EtatSession, ctas?: NavCtas): BoutonsNavbar {
  if (ctas) {
    return {
      secondary: ctas.secondary ?? ANONYME.secondary,
      primary: ctas.primary ?? ANONYME.primary,
      masques: false,
    };
  }
  if (etat === "authenticated") return { ...CONNECTE, masques: false };
  if (etat === "anonymous") return { ...ANONYME, masques: false };
  return { ...ANONYME, masques: true };
}

/** Ce dont la Navbar a besoin du client Supabase navigateur (`supabase.auth`), et rien de plus. */
export type AuthNavigateur = {
  getSession(): Promise<{ data: { session: unknown } }>;
  onAuthStateChange(cb: (evenement: string, session: unknown) => void): {
    data: { subscription: { unsubscribe(): void } };
  };
};

/**
 * Résout l'état au montage, puis le tient à jour (connexion, inscription, déconnexion). Renvoie la
 * fonction de désabonnement à appeler au démontage. Un événement arrivé avant la première lecture
 * l'emporte sur elle (pas de retour à un état périmé).
 */
export function abonnerEtatSession(auth: AuthNavigateur, onEtat: (etat: EtatSession) => void): () => void {
  let actif = true;
  let evenementRecu = false;
  const { data } = auth.onAuthStateChange((evenement, session) => {
    evenementRecu = true;
    if (actif) onEtat(etatApresEvenement(evenement, session));
  });
  auth
    .getSession()
    .then(({ data: d }) => {
      if (actif && !evenementRecu) onEtat(etatDepuisSession(d.session));
    })
    .catch(() => {
      if (actif && !evenementRecu) onEtat("anonymous");
    });
  return () => {
    actif = false;
    data.subscription.unsubscribe();
  };
}
