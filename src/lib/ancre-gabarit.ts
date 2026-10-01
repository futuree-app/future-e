// LE GABARIT DE TAILLE D'UNE COMMUNE-ANCRE (« une ville comme Brest »). Lib PURE.
//
// Il vivait dans comparateur-vie.ts, module server-only. Il en sort (FUT-7, 01/10/2026) parce que deux
// lecteurs doivent appliquer EXACTEMENT le même calcul :
//   - la dérivation de l'ancre, au parse, qui écrit cette fourchette dans `hardConstraints.communeSize` ;
//   - le dossier, qui doit RECONNAÎTRE cette fourchette pour ne pas la prêter au lecteur comme une
//     limite qu'il aurait posée. La reconnaissance est une égalité exacte : un calcul recopié qui
//     divergerait d'un arrondi la rendrait silencieusement impossible.
export const ANCRE_SIZE_BAND = 2.5; // gabarit : [pop/2.5, pop*2.5] autour de la taille d'agglo

export function gabaritTailleAncre(pop: number): { min: number; max: number } {
  return { min: Math.round(pop / ANCRE_SIZE_BAND), max: Math.round(pop * ANCRE_SIZE_BAND) };
}
