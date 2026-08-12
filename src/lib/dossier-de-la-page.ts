// ════════════════════════════════════════════════════════════════════════════════════════════
// QUEL BIEN L'URL DÉSIGNE.
//
// Extrait de `server/contexte-de-lecture.ts` pour être TESTABLE : ce module décide quelles pages
// portent un bien, et le reste n'est que lecture en base. La revue du 11/08/2026 a relevé, à juste
// titre, que le comportement corrigé n'était couvert par aucun test.
//
// Le contexte de lecture d'une page d'adresse ne peut pas venir du profil : sur une ouverture
// directe, l'écran affichait le logement nantais sous « Une question sur La Rochelle ? », et la
// question partait vers le mauvais territoire.
// ════════════════════════════════════════════════════════════════════════════════════════════

/** Les pages dont l'objet EST un bien. Ailleurs, le territoire du profil fait foi. */
export const PAGES_ADRESSE = ["/rapport/logement", "/rapport/autour"];

/**
 * L'identifiant de dossier porté par l'URL d'une page d'adresse, ou `null`.
 *
 * `null` partout ailleurs, y compris sur une page d'adresse SANS identifiant : cette page se
 * redirige alors d'elle-même vers le bien actif, et il n'y a rien à déduire ici.
 */
export function dossierIdDeLaPage(url: string | null | undefined): string | null {
  if (!url) return null;
  let parsed: URL;
  try {
    // `URL` exige une base : l'en-tête ne porte qu'un chemin, et l'origine n'a aucune importance.
    parsed = new URL(url, "https://futur-e.fr");
  } catch {
    return null;
  }
  const dansUnePageAdresse = PAGES_ADRESSE.some(
    (p) => parsed.pathname === p || parsed.pathname.startsWith(`${p}/`),
  );
  if (!dansUnePageAdresse) return null;
  const id = parsed.searchParams.get("dossierId");
  return id && id.trim() ? id : null;
}
