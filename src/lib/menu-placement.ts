// ════════════════════════════════════════════════════════════════════════════════════════════
// OÙ POSER UN MENU DE SUGGESTIONS, ET SUR QUELLE MESURE.
//
// ── LE DÉFAUT QUE CE MODULE FERME (test réel sur Android, 20/08/2026) ─────────────────────────
// Sur `/dossier`, la porte d'entrée payante, quelqu'un n'a pas pu choisir son adresse depuis son
// téléphone : la liste des suggestions s'ouvrait DERRIÈRE le clavier. La bascule vers le haut
// existait pourtant, écrite exactement pour ce cas. Elle ne se déclenchait jamais.
//
// La cause tient en une mesure. La place disponible se calculait sur `window.innerHeight`, qui
// décrit le viewport de MISE EN PAGE. Selon la façon dont le navigateur mobile traite l'ouverture
// du clavier, cette hauteur ne bouge pas : la page croit disposer de huit cents pixels quand trois
// cent cinquante sont couverts. Le code concluait « il y a la place en bas », et posait la liste
// sous le clavier.
//
// La seule mesure qui dit la vérité est le viewport VISUEL (`window.visualViewport`), qui décrit ce
// que l'œil voit réellement, clavier déduit, et qui porte aussi son décalage quand le navigateur
// fait défiler la page pour dégager le champ.
//
// ── CE QUI N'A PAS CHANGÉ, ET POURQUOI ───────────────────────────────────────────────────────
// La préférence reste le BAS. Un menu qui saute au-dessus du champ dès qu'il y a deux pixels de
// plus en haut déplacerait la liste sous les yeux du lecteur au moindre défilement. On ne bascule
// que si le bas est trop court ET que le haut fait mieux.
//
// Pur, sans DOM, testé sous `node --test`.
// ════════════════════════════════════════════════════════════════════════════════════════════

/** Le champ, en coordonnées client (celles de `getBoundingClientRect`). */
export type RectChamp = { top: number; bottom: number };

/**
 * La zone RÉELLEMENT visible, dans le même repère que le champ. `top` est son décalage par rapport
 * au viewport de mise en page (`visualViewport.offsetTop`), nul tant qu'aucun clavier ne pousse la
 * page.
 */
export type Vue = { top: number; height: number };

export type Placement = { up: boolean; maxH: number };

/** L'air entre le champ et le bord, pour que le menu ne colle ni au champ ni à l'écran. */
const MARGE = 12;
/** En dessous de cette hauteur, le bas est jugé trop court et le haut est examiné. */
const CONFORT = 240;
/** Au-delà, un menu devient une page : on scrolle dedans. */
const MAX = 280;
/**
 * Le plancher. Il valait 120 px, ce qui FORÇAIT une hauteur supérieure à la place réelle quand
 * celle-ci était plus petite : le menu débordait alors de la zone visible, du côté même qu'on
 * venait de choisir pour l'éviter. Il vaut maintenant de quoi montrer une suggestion et amorcer la
 * suivante, ce qui dit au doigt qu'il y a quelque chose à faire défiler.
 */
const MIN = 88;

export function placementDuMenu(champ: RectChamp, vue: Vue): Placement {
  const bas = vue.top + vue.height - champ.bottom - MARGE;
  const haut = champ.top - vue.top - MARGE;
  const up = bas < CONFORT && haut > bas;
  const place = up ? haut : bas;
  return { up, maxH: Math.max(MIN, Math.min(MAX, Math.floor(place))) };
}

/**
 * La zone visible du navigateur courant. `visualViewport` est la mesure juste ; `innerHeight` n'est
 * qu'un repli pour les environnements qui ne la portent pas.
 */
export function vueCourante(w: Window): Vue {
  const vv = w.visualViewport;
  return vv ? { top: vv.offsetTop, height: vv.height } : { top: 0, height: w.innerHeight };
}
