// LES CONVENTIONS DE LECTURE DU DÉBROUSSAILLEMENT OBLIGATOIRE (FUT-149), sans aucune dépendance.
//
// Séparées de `debroussaillement.ts` pour que l'écran (rendu côté client) puisse les lire sans embarquer le
// calcul géométrique (Clipper), qui ne s'exécute que côté serveur. `debroussaillement.ts` les réexporte.

/**
 * Convention de lecture, portée par chaque lecture : un dossier dit sous quelles règles il a été lu.
 * `fut149-1` (28/10/2026) : seuils de parcelle de FUT-81, dans les deux sens (parcelle dans le zonage au-delà de
 * 98 %, à cheval entre 2 et 98 %, en bordure en deçà ; contact sans recouvrement en deçà de 0,05 m²) ; limite
 * proche à `LIMITE_PROCHE_M`, au point comme à la parcelle ; données sources dites anciennes à
 * `MILLESIME_ANCIEN_ANS`.
 */
export const DEBROUSSAILLEMENT_CONVENTION = "fut149-1";

/** Le format des tuiles et du manifeste (`scripts/debroussaillement/construire.py`). */
export const FORMAT_TUILES_DEBROUSSAILLEMENT = "debroussaillement-1";

/**
 * EN DEÇÀ DE CETTE DISTANCE D'UNE LIMITE DE ZONE, LA LECTURE EST « EN LIMITE ». Même valeur que la limite proche
 * du bruit aérien, arbitrée par le porteur le 27/10/2026 (FUT-146) : le géocodage se trompe couramment de 10 à
 * 30 m, et le zonage lui-même est tracé à partir de cartes forestières simplifiées puis d'une bande de 200 m.
 * Convention, pas un seuil réglementaire.
 */
export const LIMITE_PROCHE_M = 50;

/**
 * AU-DELÀ DE CET ÂGE, LES DONNÉES FORESTIÈRES D'UN ZONAGE SONT DITES ANCIENNES À L'ÉCRAN. L'édition du 01/03/2026
 * s'appuie, selon le département, sur des cartes de 2005 à 2023 : un bois a pu pousser ou être défriché depuis.
 * Convention, pas un seuil réglementaire.
 */
export const MILLESIME_ANCIEN_ANS = 10;

/** Le zonage officiel, consultable par chacun (carte de l'IGN, reprise par Géorisques). */
export const CARTE_OFFICIELLE_URL = "https://www.georisques.gouv.fr/me-preparer-me-proteger/OLD-obligations-legales-de-debroussaillement";
