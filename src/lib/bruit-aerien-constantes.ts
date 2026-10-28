// LES CONVENTIONS DE LECTURE DU BRUIT AÉRIEN (FUT-146), sans aucune dépendance.
//
// Séparées de `bruit-aerien.ts` pour que l'écran (rendu côté client) puisse les lire sans embarquer le calcul
// géométrique (Clipper), qui ne s'exécute que côté serveur. `bruit-aerien.ts` les réexporte.

/**
 * Convention de lecture, portée par chaque lecture : un dossier dit sous quelles règles il a été lu.
 * `fut146-1` (27/10/2026) : zone la plus exposée retenue ; seuils des zones de FUT-81 (2 % ; liseré dit à
 * partir de 25 m²) ; limite proche à `LIMITE_PROCHE_M` ; plan dit « hors zone » à `RAYON_VOISINAGE_M`.
 * Les deux distances ont été arbitrées par le porteur le 27/10/2026.
 */
export const BRUIT_AERIEN_CONVENTION = "fut146-1";

/**
 * EN DEÇÀ DE CETTE DISTANCE DU POINT À UNE LIMITE DE ZONE, LA LECTURE AU POINT EST « EN LIMITE ».
 * Convention, pas un seuil réglementaire. Mesuré pendant FUT-82 : le géocodage se trompe couramment de
 * 10 à 30 m, et la zone change à 50 m dans 3 directions sur 8 à Villeneuve-le-Roi.
 */
export const LIMITE_PROCHE_M = 50;

/**
 * UN PLAN N'EST NOMMÉ « HORS ZONE » QUE S'IL A UNE ZONE À MOINS DE CETTE DISTANCE. Au-delà, rien n'est dit :
 * « hors de tout plan de bruit » pour une adresse à 80 km d'un aérodrome n'apprend rien à personne.
 * Convention, pas un seuil réglementaire.
 */
export const RAYON_VOISINAGE_M = 5000;

