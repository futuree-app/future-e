// FUT-50 · La typographie française à l'affichage de l'accueil. Module pur, sans dépendance.

/**
 * TYPOGRAPHIE FRANÇAISE À L'AFFICHAGE. Les phrases du moteur portent des espaces ordinaires avant « : »,
 * « ? », « ; » et dans les guillemets : sur un écran étroit, le signe se retrouvait seul en début de ligne.
 * L'espace devient insécable, le texte ne change pas (cf. `bindOrphans`, OuVivreClient.tsx).
 */
export function fr(texte: string): string {
  return texte
    .replace(/ ([:;?»])/g, "\u00a0$1")
    .replace(/« /g, "«\u00a0")
    .replace(/ (\d+) (par|nuits|jours|habitants|%)/g, " $1\u00a0$2")
    .replace(/(\d) °C/g, "$1\u00a0°C")
    .replace(/(\d{4})-(\d{4})/g, "$1\u2011$2")
    .replace(/au-dessus/g, "au\u2011dessus")
    .replace(/(?<=^|[\s«(\u00a0])(le|la|les|l'|de|des|du|d'|à|au|aux|et|un|une|en|ce|sa|son|ses|sur|par|pas|ni|y) /giu, "$1\u00a0");
}
