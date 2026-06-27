// Derives editorial categories from INSEE code (department prefix).
// Used as the REGIONAL layer (genuinely region-wide signals: climate zone,
// arboviral colonisation, coast orientation) and as the ultimate fallback when
// the commune is absent from the comparateur index (Paris/Lyon/Marseille
// municipality codes, which the index only knows per-arrondissement).
//
// The richer, commune-level derivation lives in deriveCategoriesFromEntry
// (comparateur-vie.ts) and reuses the dept sets exported here.

export const DEPT_MEDITERRANEE = new Set([
  '04', '06', '11', '13', '30', '34', '66', '83', '84', '2A', '2B',
]);

// Only departments whose main city is genuinely coastal — avoids mislabeling
// Rennes (35), Nantes (44), Bordeaux (33), Rouen (76), Pau (64), Amiens (80), Arras (62).
export const DEPT_LITTORAL_ATLANTIQUE = new Set([
  '14', '17', '22', '29', '50', '56', '85',
]);

export const DEPT_MONTAGNE = new Set([
  '04', '05', '09', '38', '48', '63', '65', '73', '74',
]);

// Departments in regions with documented autochthonous arboviral transmission (dengue /
// chikungunya via Aedes albopictus). Source: Santé publique France bulletin, May 2026.
// Historical regions (PACA, Occitanie, AuRA, Corse, IDF) + new in 2025 (NAQ, Grand Est, BFC).
export const DEPT_VECTORIEL = new Set([
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

export function deptFromInsee(inseeCode: string): string {
  if (!inseeCode || inseeCode.length < 2) return '';
  if (inseeCode.startsWith('2A') || inseeCode.startsWith('2B')) return inseeCode.slice(0, 2);
  if (/^97[1-6]/.test(inseeCode)) return inseeCode.slice(0, 3);
  return inseeCode.slice(0, 2);
}

// Regional categories derivable from the department alone. These are genuinely
// region-wide (a climate zone, an arboviral front, a coast orientation), so the
// department IS the right granularity — refining them per commune would be false
// precision. Shared by deriveCategories (fallback) and deriveCategoriesFromEntry.
export function deptRegionalCategories(inseeCode: string): string[] {
  const dept = deptFromInsee(inseeCode);
  if (!dept) return [];

  const cats: string[] = [];
  if (DEPT_MEDITERRANEE.has(dept)) cats.push('mediterranee');
  // colonise_albopictus matches the tensions_catalog tag (was wrongly 'vectoriel',
  // which no catalog question carries — the moustique-tigre question stayed dark).
  if (DEPT_VECTORIEL.has(dept)) cats.push('colonise_albopictus');
  return cats;
}

// Fallback when the commune is absent from the index (no commune-level data).
// Department prefix only: regional categories + a coarse montagne/littoral guess.
export function deriveCategories(inseeCode: string): string[] {
  const dept = deptFromInsee(inseeCode);
  if (!dept) return ['all'];

  const cats = deptRegionalCategories(inseeCode);

  if (DEPT_MONTAGNE.has(dept)) cats.push('montagne');
  // littoral (generic) + orientation, so littoral_atlantique / littoral_mediterranee
  // questions (surfer_ici, baignade_ici) can fire even on the dept fallback path.
  if (DEPT_LITTORAL_ATLANTIQUE.has(dept)) {
    cats.push('littoral', 'littoral_atlantique');
  } else if (DEPT_MEDITERRANEE.has(dept)) {
    cats.push('littoral', 'littoral_mediterranee');
  }

  return cats.length > 0 ? cats : ['all'];
}
