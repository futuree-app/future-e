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

   LA GÉOMÉTRIE A DÉMÉNAGÉ dans `lib/brand-mark.ts` le 04/08/2026 : la facture PDF en a besoin, et
   pdfkit ne sait pas lire un composant React. Ce fichier ne porte plus que le RENDU React et sa
   politique de couleur. Ne pas retoucher un nombre là-bas non plus : le master est audité
   (extrema sur ancres, jonctions G1 à 0,000°, fûts à 35,000) et toute correction repart du pack. */

import { MOT, COMPACT, POINT, MOT_MINIMUM } from '@/lib/brand-mark';

type LogoProps = {
  /** `mot` = le mot-symbole complet, à privilégier. `compact` = le signe `r•`, réservé aux
   *  emplacements où le nom n'a matériellement pas la place (favicon, avatar, icône). */
  variant?: 'mot' | 'compact';
  /** Hauteur de rendu en px. Le minimum de la charte pour le mot-symbole à l'écran vit dans
   *  `MOT_MINIMUM.screenPx` (22 px depuis le 04/08/2026). */
  height?: number;
  /** Rend le point dans la couleur du lettrage au lieu de l'orange (variantes monochromes). */
  mono?: boolean;
  /** Titre accessible. `null` rend le logo décoratif (`aria-hidden`), à utiliser quand un texte
   *  adjacent porte déjà le nom — sinon un lecteur d'écran annonce la marque deux fois. */
  title?: string | null;
  className?: string;
  style?: React.CSSProperties;
};


export function Logo({
  variant = 'mot',
  height = MOT_MINIMUM.screenPx,
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
