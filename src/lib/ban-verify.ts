// LE NAVIGATEUR DÉSIGNE UNE ADRESSE ; LE SERVEUR DÉCIDE DE L'ADRESSE RÉELLEMENT ACHETÉE.
//
// `type` décide de l'éligibilité et vient du client. Un client qui affirme `housenumber` sur une
// voie obtiendrait le droit de payer, et le dossier créé porterait un `ban_id` de voie : tout se
// calculerait au centroïde. La revalidation a lieu au CHECKOUT, pas à la qualification : celle-ci
// est un capteur à haut volume sans conséquence financière, celui-là est rare et c'est là que
// l'argent bouge.
//
// Pas de `server-only` : pure, testée sous `node --test`.

// Jamais de repli sur le premier résultat : c'est la porte par laquelle une adresse voisine
// entrerait dans un dossier payé.
export function pickFeatureById<T extends { id: string }>(
  features: T[],
  banId: string,
): T | null {
  return features.find((f) => f.id === banId) ?? null;
}
