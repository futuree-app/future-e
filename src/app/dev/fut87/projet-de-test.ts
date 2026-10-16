// FUT-87 · LE PROJET DE TEST DES PROTOTYPES, lu dans l'URL. Même convention que `/dev/dossier` :
// « cle:poids,cle:poids », et `confirmer=cle` pour faire d'une priorité une condition sans compromis.
// Aucune donnée de compte : le dossier est assemblé pour une commune publique et un projet décrit dans
// l'URL.
// La fonction vit dans `src/lib/decision/projet-de-test.ts` (FUT-50) ; ce module garde les cas des prototypes.
export { projetDeTest } from "@/lib/decision/projet-de-test";

export const DEFAUT = {
  insee: "30189",
  prefs: "faible_chaleur:3,vie_locale:2,acces_soins:2,nature:2,faible_risque_inondation:2",
};

/** Les situations difficiles du prototype « Ma décision » (revue V2), toutes sur des communes publiques. */
export const CAS_DECISION: { nom: string; requete: string }[] = [
  { nom: "Cas de référence (arbitrage)", requete: `insee=${DEFAUT.insee}&prefs=${DEFAUT.prefs}` },
  { nom: "Condition sans compromis", requete: "insee=30189&prefs=proximite_mer:3,vie_locale:2,acces_soins:2&confirmer=proximite_mer" },
  { nom: "Nombreuses réserves", requete: "insee=13201&prefs=faible_chaleur:3,faible_risque_inondation:3,calme_sonore:3,air_sain:3,faible_exposition_industrielle:3,nature:2,faible_risque_feu:2" },
  { nom: "Titre long", requete: "insee=33236&prefs=faible_risque_feu:3,vie_locale:2,proximite_mer:3,acces_soins:2,acces_transports:2" },
  { nom: "Correspondance sans réserve", requete: "insee=56260&prefs=proximite_mer:3,faible_chaleur:3" },
  // Un DOSSIER D'ADRESSE réel, sur un bâtiment public (l'hôtel de ville de Nîmes) : le périmètre
  // « commune + adresse » où secteur et logement sont examinés, avec ou sans constat.
  { nom: "Dossier d'adresse (bâtiment public)", requete: `lieu=${encodeURIComponent("1 Place de l'Hôtel de Ville 30000 Nîmes")}&prefs=${DEFAUT.prefs}` },
];
