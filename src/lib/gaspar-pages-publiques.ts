// LES PHRASES GASPAR DES PAGES PUBLIQUES /inondation/[insee_code] ET /chaleur/[insee_code].
//
// Pur, sans réseau : les deux pages en tirent leurs phrases, et les tests les vérifient telles qu'elles
// s'affichent.

/**
 * FUT-161 · « a déjà été reconnue 17 fois ». La phrase était écrite en JSX, le nombre en expression suivi
 * du texte : le rendu compilé perdait l'espace (« 17fois », en production le 28/10/2026). Elle est donc
 * composée ici, en une seule chaîne, avec une espace insécable : le nombre ne se sépare jamais de « fois »,
 * même en fin de ligne sur mobile.
 */
export function phraseReconnaissancesCatnat(n: number, communeName: string, villeCatnat: string | null): string {
  const sujet = villeCatnat
    ? `À l'échelle de ${villeCatnat} (GASPAR ne publie pas les arrondissements), la ville`
    : communeName;
  return `${sujet} a déjà été reconnue ${n}\u00a0fois en état de catastrophe naturelle`;
}
