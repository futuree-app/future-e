// Derives editorial categories from INSEE code (department prefix).
// Used as fallback when communes_categorization has no manual entry.
// Categories match the values used in FutureELanding (littoral, montagne, mediteranee, all).

const DEPT_MEDITERRANEE = new Set([
  '04', '06', '11', '13', '30', '34', '66', '83', '84', '2A', '2B',
]);

// Only departments whose main city is genuinely coastal — avoids mislabeling
// Rennes (35), Nantes (44), Bordeaux (33), Rouen (76), Pau (64), Amiens (80), Arras (62).
const DEPT_LITTORAL_ATLANTIQUE = new Set([
  '14', '17', '22', '29', '50', '56', '85',
]);

const DEPT_MONTAGNE = new Set([
  '04', '05', '09', '38', '48', '63', '65', '73', '74',
]);

function deptFromInsee(inseeCode: string): string {
  if (!inseeCode || inseeCode.length < 2) return '';
  // Corsica: 2A / 2B
  if (inseeCode.startsWith('2A') || inseeCode.startsWith('2B')) return inseeCode.slice(0, 2);
  // DOM: 971–976 → 3-char dept
  if (/^97[1-6]/.test(inseeCode)) return inseeCode.slice(0, 3);
  return inseeCode.slice(0, 2);
}

export function deriveCategories(inseeCode: string): string[] {
  const dept = deptFromInsee(inseeCode);
  if (!dept) return ['all'];

  const cats: string[] = [];

  if (DEPT_MONTAGNE.has(dept)) cats.push('montagne');
  if (DEPT_MEDITERRANEE.has(dept)) cats.push('mediteranee');
  else if (DEPT_LITTORAL_ATLANTIQUE.has(dept)) cats.push('littoral');

  return cats.length > 0 ? cats : ['all'];
}
