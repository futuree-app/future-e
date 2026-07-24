// L'ANCRE DOM D'UNE CARTE DU DOSSIER. Une seule fonction, partagée par qui POSE l'ancre (les cartes) et
// par qui la VISE (la ligne « À contrôler en priorité ») : deux constructions parallèles finiraient par
// diverger d'un tiret, et le lien tomberait dans le vide sans que rien ne le dise.
//
// Portée : ce dossier, cette page. Ce n'est PAS une URL publique — un identifiant de fait reflète une
// règle et une convention de calcul, qui peuvent changer. Un lien partageable vers la démonstration
// d'un phénomène (module Territoire / Logement) demande une clé sémantique, qui est un autre sujet.
//
// Les identifiants de composition portent un `:` (« 31555:composition-argiles-ppr »). HTML5 l'accepte
// dans un `id`, mais `querySelector("#31555:…")` le lit comme un pseudo-sélecteur et lève. On normalise
// donc, et on préfixe : un `id` qui commence par un chiffre est invalide comme sélecteur CSS.
export function dossierAnchorId(rawId: string): string {
  return `fait-${rawId.replace(/[^a-zA-Z0-9_-]+/g, "-").replace(/^-+|-+$/g, "")}`;
}
