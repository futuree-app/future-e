// LES DRAPEAUX DE RISQUE DE GÉORISQUES, DÉRIVÉS DES LIBELLÉS GASPAR. Module PUR, séparé de la couche
// d'accès (georisques.ts est `server-only`) : cette dérivation n'a aucun besoin du serveur, et tant
// qu'elle y vivait, elle était intestable.
//
// Elle a porté pendant des mois une faute qu'aucun test ne pouvait voir : `wildfire` cherchait
// « feux de foret » AU PLURIEL, quand GASPAR écrit « Feu de forêt » au SINGULIER — vérifié sur
// Lège-Cap-Ferret, Aix-en-Provence, Hyères, Antibes. Le drapeau valait donc `false` pour toutes les
// communes de France, et le dossier de décision en concluait qu'une priorité « à l'abri des incendies »
// était satisfaite, y compris là où l'État recense le risque.
//
// Les libellés de référence vivent dans georisques.test.ts, recopiés tels que l'API les renvoie.
export function riskFlagsFromLabels(riskLabels: string[], seismicZone = false) {
  const normalizedLabels = riskLabels.map(normalizeLabel);
  return {
    flood: normalizedLabels.some((label) => label.includes("inondation")),
    marineSubmersion: normalizedLabels.some((label) => label.includes("submersion marine")),
    landslide: normalizedLabels.some((label) => label.includes("mouvement de terrain")),
    clay: normalizedLabels.some(
      (label) => label.includes("tassements differentiels") || label.includes("argile"),
    ),
    storm: normalizedLabels.some((label) => label.includes("tempete")),
    seismic: seismicZone || normalizedLabels.some((label) => label.includes("seisme")),
    // PPRIF ou risque incendie déclaré dans GASPAR. La regex accepte les deux nombres plutôt qu'une
    // seconde chaîne littérale : c'est la même faute qui reviendrait au prochain libellé.
    wildfire: normalizedLabels.some(
      (label) => label.includes("incendie") || /feux? de forets?/.test(label),
    ),
  };
}

export function normalizeLabel(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

