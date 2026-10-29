// FUT-151 · LA PORTÉE DE « AUCUNE PRIORITÉ FAVORABLE ».
//
// Le moteur marque `sansPrioriteFavorable` quand des priorités déclarées sont mesurées et qu'aucune n'atteint le seuil
// favorable. Il ne dit pas si TOUTES le sont : à couverture partielle, une priorité non mesurée n'est ni favorable ni
// défavorable, et « aucune de vos priorités n'est favorable » transformerait une absence de donnée en défaut. Chaque
// sortie (carte, Pack, /synthesize, /ask) lit donc la portée ici, et nulle part ailleurs.
//
// Les quatre situations, et ce qui les dit :
//   - toutes mesurées, aucune favorable         → « toutes_mesurees »
//   - certaines mesurées, aucune d'elles favorable → « parmi_celles_mesurees »
//   - aucune mesurée                             → null (la couverture le dit : « À explorer »)
//   - certaines favorables, d'autres non mesurées → null (les raisons, et la ligne « Non mesuré ici »)

export type PorteeSansFavorable = "toutes_mesurees" | "parmi_celles_mesurees";

/**
 * `etat` : la couverture de la commune ; `nonMesurees` : ses priorités non mesurées. Un état sans aucune mesure annule
 * le marqueur (rien n'a été comparé au seuil). Un état absent ou inconnu prend la portée prudente : jamais « toutes ».
 */
export function porteeSansFavorable(a: {
  marque: unknown;
  etat?: string | null;
  nonMesurees?: readonly unknown[] | null;
}): PorteeSansFavorable | null {
  if (a.marque !== true) return null;
  if (a.etat === "aucune" || a.etat === "sans_priorite") return null;
  const manque = (a.nonMesurees?.length ?? 0) > 0;
  return a.etat === "complete" && !manque ? "toutes_mesurees" : "parmi_celles_mesurees";
}

/**
 * FUT-155 : les raisons qu'une sortie peut redire. Le moteur ne marque une commune que si aucune priorité mesurée
 * n'y est favorable, et ses raisons sont alors vides. Un corps qui porte les deux se contredit : la réserve gagne.
 */
export function raisonsSousReserve(raisons: unknown, marque: unknown): string[] {
  if (marque === true || !Array.isArray(raisons)) return [];
  return raisons.filter((x): x is string => typeof x === "string");
}

/** Libellé court de la carte (palier). `autres` : l'inondation est déclarée, elle ne contribue jamais favorablement. */
export function libelleCarteSansFavorable(p: PorteeSansFavorable, autres = false): string {
  if (p === "toutes_mesurees") return autres ? "Aucune autre priorité favorable ici" : "Aucune priorité favorable ici";
  return autres ? "Aucune autre priorité favorable parmi celles mesurées ici" : "Aucune priorité favorable parmi celles mesurées ici";
}

/** Phrase complète (Pack, pistes). */
export function phraseSansFavorable(p: PorteeSansFavorable): string {
  return p === "toutes_mesurees"
    ? "Aucune de vos priorités n'est favorable ici."
    : "Aucune priorité favorable parmi celles mesurées ici ; les autres ne sont pas mesurées.";
}
