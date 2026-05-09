// Derives editorial categories from INSEE code (department prefix).
// Used as fallback when communes_categorization has no manual entry.

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

// Departments in regions with documented autochthonous arboviral transmission (dengue /
// chikungunya via Aedes albopictus). Source: Santé publique France bulletin, May 2026.
// Historical regions (PACA, Occitanie, AuRA, Corse, IDF) + new in 2025 (NAQ, Grand Est, BFC).
const DEPT_VECTORIEL = new Set([
  // PACA
  '04', '05', '06', '13', '83', '84',
  // Occitanie
  '09', '11', '12', '30', '31', '32', '34', '46', '48', '65', '66', '81', '82',
  // Auvergne-Rhône-Alpes
  '01', '03', '07', '15', '26', '38', '42', '43', '63', '69', '73', '74',
  // Corse
  '2A', '2B',
  // Île-de-France
  '75', '77', '78', '91', '92', '93', '94', '95',
  // Nouvelle-Aquitaine (première transmission locale en 2025)
  '16', '17', '19', '23', '24', '33', '40', '47', '64', '79', '86', '87',
  // Grand Est (première transmission locale en 2025)
  '08', '10', '51', '52', '54', '55', '57', '67', '68', '88',
  // Bourgogne-Franche-Comté (première transmission locale en 2025)
  '21', '25', '39', '58', '70', '71', '89', '90',
]);

function deptFromInsee(inseeCode: string): string {
  if (!inseeCode || inseeCode.length < 2) return '';
  if (inseeCode.startsWith('2A') || inseeCode.startsWith('2B')) return inseeCode.slice(0, 2);
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
  if (DEPT_VECTORIEL.has(dept)) cats.push('vectoriel');

  return cats.length > 0 ? cats : ['all'];
}
