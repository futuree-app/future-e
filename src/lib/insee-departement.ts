// INSEE commune -> code département. Lib PURE.
//
// Extraite de deux copies qui vivaient chacune leur vie (commune-categories.ts, gissol.ts) : la
// troisième aurait fini par diverger. Corse (2A/2B) et DOM (3 chiffres) traités explicitement, parce
// qu'un `slice(0, 2)` naïf rend « 20 » pour la Corse (un département qui n'existe plus depuis 1976) et
// « 97 » pour les DOM (qui n'est pas un département, mais une région).
export function departementFromInsee(insee: string): string | null {
  if (!/^(2[AB]|\d{2})\d{3}$/.test(insee)) return null;
  if (insee.startsWith("2A") || insee.startsWith("2B")) return insee.slice(0, 2);
  if (insee.startsWith("97") || insee.startsWith("98")) return insee.slice(0, 3);
  return insee.slice(0, 2);
}
