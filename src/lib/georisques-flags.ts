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


// Couche de traduction utilisateur — point UNIQUE de conversion des libellés
// administratifs GASPAR/Géorisques en familles compréhensibles sans jargon.
// Réutilisable partout (carte, drawer, synthèse, AskFuture passent par byRisk).
export function simplifyCatnatRisk(raw: string): string {
  const n = normalizeLabel(raw);
  if (n.includes("submersion")) return "Submersion marine";
  if (n.includes("vague") || n.includes("chocs mecaniques")) return "Érosion et impact des vagues";
  if (
    n.includes("inondation") ||
    n.includes("coulee") ||
    n.includes("nappe") ||
    n.includes("crue") ||
    n.includes("torrentiel")
  )
    return "Inondations";
  if (n.includes("secheresse") || n.includes("retrait") || n.includes("argile"))
    return "Sécheresse des sols";
  if (
    n.includes("mouvement de terrain") ||
    n.includes("glissement") ||
    n.includes("eboulement") ||
    n.includes("affaissement")
  )
    return "Mouvements de terrain";
  if (n.includes("cyclo") || n.includes("ouragan")) return "Cyclone";
  if (n.includes("tempete") || n.includes("grains")) return "Tempête";
  if (n.includes("seisme") || n.includes("sismi")) return "Séisme";
  if (n.includes("avalanche")) return "Avalanche";
  if (n.includes("grele")) return "Grêle";
  if (n.includes("neige")) return "Neige";
  return raw.trim();
}
