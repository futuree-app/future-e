/* LE LOGO EST UN DESSIN, PLUS UNE POLICE. Jusqu'à la charte v1.7, la marque était composée en
   Instrument Serif italique et réécrite à la main dans 18 fichiers (`futur<span>•</span>e`), chacun
   avec ses propres `fontSize` et `letterSpacing`. Le mot-symbole de la charte n'est pas cette
   lettre : c'est un tracé vectoriel dont la coupe du `r`, les fûts de 35 unités et la position du
   point sont des valeurs décidées. Aucune police ne peut le produire, donc il est inliné ici.

   UNE SEULE SOURCE POUR LES HUIT VARIANTES DU PACK. Le pack livre 8 SVG qui ne diffèrent que par
   leurs deux `fill`. Les importer tels quels figerait la couleur dans le fichier et forcerait à
   choisir la bonne variante à chaque appel — donc à se tromper au premier changement de thème. Ici
   le lettrage prend `currentColor` (il hérite de la couleur du texte parent, donc du thème) et le
   point prend `--accent`. Les variantes « principal / inverse / monochrome » du pack se rejouent
   avec `color` et la prop `mono`.

   Géométrie strictement celle de `CHARTE/futur-e-logo-v1-7-final/svg/` : ne pas retoucher un
   nombre ici. Le master est audité (extrema sur ancres, jonctions G1 à 0,000°, fûts à 35,000) et
   toute correction doit repartir du pack, pas de ce fichier. */

type LogoProps = {
  /** `mot` = le mot-symbole complet, à privilégier. `compact` = le signe `r•`, réservé aux
   *  emplacements où le nom n'a matériellement pas la place (favicon, avatar, icône). */
  variant?: 'mot' | 'compact';
  /** Hauteur de rendu en px. La charte fixe 28 px comme minimum pour le mot-symbole à l'écran. */
  height?: number;
  /** Rend le point dans la couleur du lettrage au lieu de l'orange (variantes monochromes). */
  mono?: boolean;
  /** Titre accessible. `null` rend le logo décoratif (`aria-hidden`), à utiliser quand un texte
   *  adjacent porte déjà le nom — sinon un lecteur d'écran annonce la marque deux fois. */
  title?: string | null;
  className?: string;
  style?: React.CSSProperties;
};

const MOT = {
  viewBox: '404 308 968 240',
  ratio: 968 / 240,
  paths: [
    'M 488 313 L 523 313 L 523 343 L 490 343 C 479.5 343 471.5 351 471.5 363 L 471.5 384 L 523 384 L 523 412 L 471.5 412 L 471.5 539 L 436.5 539 L 436.5 412 L 411 412 L 411 384 L 436.5 384 L 436.5 357 C 437 332.5 458.8 313 488 313 Z',
    'M 550 384 L 585 384 L 585 488 C 585 504 598 514 619 514 C 642 514 657 497 657 472 L 657 384 L 692 384 L 692 539 L 659 539 L 657 522 C 646 535 631 542 614 542 C 576 542 550 522 550 491 L 550 384 Z',
    'M 747 337 L 782 337 L 782 384 L 830 384 L 830 412 L 782 412 L 782 490 C 782 503.5 789 511 802 511 L 830 511 L 830 539 L 791 539 C 763 539 747 523 747 497 L 747 412 L 717 412 L 717 384 L 747 384 L 747 337 Z',
    'M 860 384 L 895 384 L 895 488 C 895 504 908 514 929 514 C 952 514 967 497 967 472 L 967 384 L 1002 384 L 1002 539 L 969 539 L 967 522 C 956 535 941 542 924 542 C 886 542 860 522 860 491 L 860 384 Z',
    'M 1119 380 C 1125 380 1130 381 1133 382 L 1133 414 C 1113 414 1099 417 1090 427 C 1081 437 1076 445 1076 453 L 1076 517 L 1045 538 C 1044 539 1042 539 1041 539 L 1041 384 L 1076 384 L 1076 404 C 1086 391 1101 380 1119 380 Z',
  ],
  /** Le `e` porte `fill-rule="evenodd"` : sa contre-forme est un second sous-chemin, pas un trou
   *  implicite. Sans cette règle la boucle se remplit et la lettre devient un pâté. */
  pathEvenOdd:
    'M 1282 380 C 1331 380 1367 417 1367 462 C 1367 466 1367 469 1366 472 L 1245 472 C 1247 498 1267 516 1293 516 C 1310 516 1323 508 1330 494 L 1363 494 C 1360 523 1328 542 1293 542 C 1246 542 1210 508 1210 462 C 1210 416 1243 380 1282 380 Z M 1289 407 C 1311 407 1328 422 1332 446 L 1246 446 C 1250 423 1266 407 1289 407 Z',
} as const;

const COMPACT = {
  viewBox: '1024 369 180 180',
  ratio: 1,
  paths: [
    'M 1119 380 C 1125 380 1130 381 1133 382 L 1133 414 C 1113 414 1099 417 1090 427 C 1081 437 1076 445 1076 453 L 1076 517 L 1045 538 C 1044 539 1042 539 1041 539 L 1041 384 L 1076 384 L 1076 404 C 1086 391 1101 380 1119 380 Z',
  ],
  pathEvenOdd: null,
} as const;

/** Le point : `cx`, `cy` et `r` sont des valeurs décidées de la charte (centre à 461,5 = milieu
 *  exact de la hauteur d'x, diamètre 50), pas des mesures relevées. */
const POINT = { cx: 1162.54, cy: 461.5, r: 25 } as const;

export function Logo({
  variant = 'mot',
  height = 28,
  mono = false,
  title = 'futur•e',
  className,
  style,
}: LogoProps) {
  const g = variant === 'compact' ? COMPACT : MOT;
  const decorative = title === null;

  return (
    <svg
      viewBox={g.viewBox}
      height={height}
      width={height * g.ratio}
      role={decorative ? undefined : 'img'}
      aria-hidden={decorative || undefined}
      aria-label={decorative ? undefined : title}
      className={className}
      /* `display:block` évite l'espace fantôme sous une SVG inline (elle est `inline` par défaut et
         s'assoit sur la ligne de base, ce qui décale un header centré de quelques pixels). */
      style={{ display: 'block', flexShrink: 0, ...style }}
      shapeRendering="geometricPrecision"
    >
      {g.paths.map((d, i) => (
        <path key={i} d={d} fill="currentColor" />
      ))}
      {g.pathEvenOdd && <path d={g.pathEvenOdd} fill="currentColor" fillRule="evenodd" />}
      <circle
        cx={POINT.cx}
        cy={POINT.cy}
        r={POINT.r}
        fill={mono ? 'currentColor' : 'var(--accent)'}
      />
    </svg>
  );
}

export default Logo;
