// LES TROIS HORIZONS DRIAS-TRACC, ET LEUR ÉQUIVALENCE FRANCE.
//
// Pourquoi ce fichier existe : la table « quel scénario correspond à quelle année » vivait dans
// trois composants à la fois (HorizonBar, HorizonSwitch, HORIZON_META de QuartierClimatData), tous
// d'accord entre eux, et les pages publiques gratuites n'en consultaient AUCUN. Elles lisaient
// `gwl30` en titrant « projections 2050 » : le niveau de réchauffement de 2100 sous la date de
// 2050. Sur la surface la plus indexée du site, et en contradiction avec la convention que le
// produit payant applique correctement depuis toujours.
//
// La règle TRACC, à porter partout où un réchauffement est cité (un chiffre mondial seul ne dit
// rien à un lecteur français, la France se réchauffe environ 1,4 fois plus vite que la moyenne du
// globe) : +1,5 °C dans le monde vaut +2 °C en France, +2 °C vaut +2,7 °C, +3 °C vaut +4 °C.
//
// Ce module est PUR : aucune I/O, aucun `node:`, aucun `server-only`. Il est lisible par le client
// comme par le serveur, et testable sous `node --test`.

export type HorizonKey = "gwl15" | "gwl20" | "gwl30";

export type Horizon = {
  key: HorizonKey;
  /** L'année d'atteinte du palier, telle que le produit l'affiche depuis toujours. */
  annee: "2030" | "2050" | "2100";
  /** Le palier de réchauffement mondial qui NOMME le scénario DRIAS. */
  mondial: string;
  /** Ce que ce palier vaut en France (TRACC). C'est ce chiffre qui parle au lecteur. */
  france: string;
};

export const HORIZONS: readonly Horizon[] = [
  { key: "gwl15", annee: "2030", mondial: "+1,5 °C", france: "+2 °C" },
  { key: "gwl20", annee: "2050", mondial: "+2 °C", france: "+2,7 °C" },
  { key: "gwl30", annee: "2100", mondial: "+3 °C", france: "+4 °C" },
] as const;

export const HORIZON: Record<HorizonKey, Horizon> = Object.fromEntries(
  HORIZONS.map((h) => [h.key, h]),
) as Record<HorizonKey, Horizon>;

/**
 * La mention à afficher sous une valeur projetée. Elle porte les TROIS choses sans lesquelles le
 * chiffre ne veut rien dire : l'année, le palier mondial qui nomme le scénario, et son équivalent
 * français.
 */
export function mentionHorizon(key: HorizonKey): string {
  const h = HORIZON[key];
  return `horizon ${h.annee} · ${h.mondial} dans le monde, soit ${h.france} en France`;
}
