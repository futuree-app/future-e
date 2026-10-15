// FUT-104 · LE SEUL TEST « CE CODE EST-IL ULTRAMARIN ? », sans dépendance, pour que les modules du climat
// métropolitain puissent refuser un code d'outre-mer sans charger les données ultramarines.
//
// Les codes du COG commençant par 97 (DROM, Saint-Pierre-et-Miquelon, Saint-Barthélemy, Saint-Martin) ou 98 (TAAF,
// Wallis-et-Futuna, Polynésie française, Nouvelle-Calédonie, Clipperton). Le climat métropolitain (DRIAS-TRACC,
// modèles EURO-CORDEX) ne couvre aucun d'eux : `data/data_climat.json` leur attribue des valeurs de points de grille
// métropolitains (Le Conquet pour les Antilles, Bonifacio pour La Réunion), cf. docs/audits/2026-10-16-hotfix-fut104-donnees-outremer.md.
export function estCodeOutremer(code: string): boolean {
  return /^9[78]\d{3}$/.test(String(code).trim());
}
