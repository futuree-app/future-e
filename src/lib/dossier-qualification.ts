// ════════════════════════════════════════════════════════════════════════════
// La décision de vente d'un dossier d'adresse, séparée de tout accès réseau.
// Pas de `server-only` : testée sous `node --test`.
//
// LE REFUS PORTE SUR L'IDENTIFICATION DU BIEN, JAMAIS SUR LA MATIÈRE DISPONIBLE. Sous une feature
// `street` ou `locality`, le point désigne le centre d'une voie ou d'un lieu-dit : les distances
// d'Autour se calculeraient depuis le mauvais endroit, Géorisques au point porterait sur un autre
// emplacement, et la parcelle trouvée pourrait être celle d'un tiers. Le défaut ne serait pas un
// dossier incomplet, ce serait un dossier PRÉCIS SUR LE MAUVAIS OBJET.
//
// L'absence de diagnostic ne refuse rien, et c'est le cas MAJORITAIRE : 75 % d'absence en urbain
// dense, 86 % en rural, sur le chemin que ce produit emprunte, l'identifiant BAN exact (800
// adresses tirées uniformément dans la BAN, 31/07/2026). Le « 35 à 53 % » cité avant incluait un
// repli à 50 m qui ramènerait le diagnostic du VOISIN, vérifié 57 fois sur 57 ; ce repli tombe
// d'ailleurs à 3,5 % d'absence en ville, où il mesure la présence de voisins, pas la couverture.
// l'absence de parcelle non plus : le rapport garde neuf sources au point sans elle.
// ════════════════════════════════════════════════════════════════════════════

export const MAX_CANDIDATES = 5;

// Périmètre de PROPOSITION pour un lieu-dit, jamais un seuil de qualité. Convention nommée et
// versionnée, sur le patron de CARTOFRICHES_RAYON_RECHERCHE_M. Mesuré le 30/07/2026 sur six
// hameaux (Aubrac, Doubs, Queyras, Lozère, Var) : le premier numéro est entre 3 et 59 m. Au-delà
// de ce périmètre, un numéro n'a plus de rapport crédible avec le lieu-dit saisi, et un refus
// honnête vaut mieux qu'un candidat lointain. À réviser si les refus abondent.
export const LOCALITY_RADIUS_M = 150;

// Un candidat porte SES coordonnées. Sans elles, sélectionner « 1986 le Cros » relancerait la
// qualification avec l'identifiant du numéro et le POINT DE LA VOIE : le cadastre serait sondé au
// centroïde, et l'écran annoncerait une parcelle (ou son absence) sur le mauvais endroit. C'est
// très exactement le faux ancrage que la doctrine du refus existe pour empêcher.
export type ReverseHit = {
  banId: string;
  label: string;
  citycode: string | null;
  city: string | null;
  postcode: string | null;
  latitude: number;
  longitude: number;
  distanceM: number;
};

export type NearbyHouseNumber = {
  banId: string;
  label: string;
  city: string | null;
  postcode: string | null;
  latitude: number;
  longitude: number;
  distanceM: number;
};

export function isSellableAnchor(type: string | null): boolean {
  return type === "housenumber";
}

// L'identifiant BAN d'un numéro est `citycode_idvoie_numero`. La compatibilité de voie est donc un
// test de PRÉFIXE, exact et sans heuristique sur les libellés : « le Vallon » (83077_rbzfxz_00850)
// tombe mécaniquement face à « le Cros » (83077_i1no3t). Le séparateur final est obligatoire, sinon
// `83077_i1no3` matcherait `83077_i1no3t_01986`.
//
// AUCUN SEUIL DE DISTANCE SUR UNE VOIE. « 451 le Cros » est à 58 m sur la bonne voie : tout
// MAX_DISTANCE de 50 m aurait écarté un numéro légitime, et aucune valeur ne serait défendable.
// La distance sert au TRI et à l'AFFICHAGE.
export function admissibleCandidates(
  selected: { banId: string; citycode: string; type: string | null },
  hits: ReverseHit[],
): NearbyHouseNumber[] {
  // Une commune saisie seule ne se précise pas par une liste : le geste attendu est de saisir une
  // adresse. Proposer les numéros du centre-bourg serait arbitraire.
  if (selected.type !== "street" && selected.type !== "locality") return [];

  const sameStreet = selected.type === "street";
  const prefix = `${selected.banId}_`;

  return hits
    .filter((h) => h.citycode === selected.citycode)
    .filter((h) =>
      sameStreet ? h.banId.startsWith(prefix) : h.distanceM <= LOCALITY_RADIUS_M,
    )
    .sort((a, b) => a.distanceM - b.distanceM)
    .slice(0, MAX_CANDIDATES)
    .map(({ banId, label, city, postcode, latitude, longitude, distanceM }) => ({
      banId,
      label,
      city,
      postcode,
      latitude,
      longitude,
      distanceM,
    }));
}
