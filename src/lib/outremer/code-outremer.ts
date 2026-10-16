// FUT-104 · LE SEUL TEST « CE CODE EST-IL ULTRAMARIN ? », sans dépendance, pour que les modules du climat
// métropolitain puissent refuser un code d'outre-mer sans charger les données ultramarines.
//
// Les codes du COG commençant par 97 (DROM, Saint-Pierre-et-Miquelon, Saint-Barthélemy, Saint-Martin) ou 98 (TAAF,
// Wallis-et-Futuna, Polynésie française, Nouvelle-Calédonie, Clipperton). Le climat métropolitain (DRIAS-TRACC,
// modèles EURO-CORDEX) ne couvre aucun d'eux : le fichier DRIAS leur attribuait des valeurs de points de grille
// métropolitains (Le Conquet pour les Antilles, Bonifacio pour La Réunion), retirées depuis. Cf.
// docs/audits/2026-10-15-fut104-climat-outremer.md, 2026-10-16-hotfix-fut104-donnees-outremer.md et
// 2026-10-16-fut104-consolidation.md.
export function estCodeOutremer(code: string): boolean {
  return /^9[78]\d{3}$/.test(String(code).trim());
}
