// FUT-109 · L'EMPLOI D'UN ARRONDISSEMENT EST CELUI DE SA VILLE. La viabilité du bassin d'emploi est définie à la
// maille zone d'emploi (ZE2020) et héritée par chaque commune (populate-communes-emploi.js) ; la composition
// communale de l'Insee rattache Paris, Lyon et Marseille, pas leurs arrondissements, que l'index porte à leur
// place. Les 45 arrondissements restaient donc sans emploi (null). Ce n'est pas une estimation : un
// arrondissement est dans la zone d'emploi de sa ville, dont toutes les communes ont les mêmes valeurs.
//
// Source : Insee, « Zones d'emploi 2020 », composition communale au 01/01/2026
// (https://www.insee.fr/fr/statistiques/fichier/4652957/ZE2020_au_01-01-2026.zip), lignes CODGEO
// 75056 → 1109 (Paris), 69123 → 8421 (Lyon), 13055 → 9312 (Marseille), relevées le 24/10/2026.
export const ZE_DES_VILLES_PLM = [
  { prefixe: /^751\d\d$/, ville: "75056", ze: "1109" },
  { prefixe: /^6938\d$/, ville: "69123", ze: "8421" },
  { prefixe: /^132\d\d$/, ville: "13055", ze: "9312" },
];

/**
 * L'emploi d'un arrondissement PLM, lu sur une commune de la même zone d'emploi (`emploiMap` :
 * data/communes-emploi.json). `null` hors arrondissement, ou si la zone n'a aucune commune dans le cache ;
 * refuse si les communes de la zone ne portent pas toutes les mêmes valeurs (la maille ne serait plus la ZE).
 */
export function emploiArrondissement(insee, emploiMap) {
  const v = ZE_DES_VILLES_PLM.find((x) => x.prefixe.test(insee));
  if (!v) return null;
  const membres = Object.values(emploiMap).filter((e) => e.ze === v.ze);
  if (!membres.length) return null;
  const valeurs = new Set(membres.map((e) => `${e.taille}/${e.diversite}`));
  if (valeurs.size !== 1) throw new Error(`zone d'emploi ${v.ze} : valeurs non uniformes (${[...valeurs].join(", ")})`);
  return { ze: v.ze, taille: membres[0].taille, diversite: membres[0].diversite };
}
