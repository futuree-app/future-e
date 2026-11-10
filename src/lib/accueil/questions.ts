// LE CHOIX DES QUATRE QUESTIONS DE L'ACCUEIL. Module PUR, imports relatifs.
//
// Déplacé tel quel depuis src/components/FutureELanding.tsx (FUT-185) pour que les tests et l'audit national
// exécutent la vraie sélection, et non une copie. Aucune règle n'a changé : priorités du catalogue Supabase
// `tensions_catalog`, dédoublonnage par préfixe, place réservée à une question « vie / territoire », compléments.

/** Une question du catalogue telle que l'accueil la charge (champs utilisés par la sélection). */
export type QuestionCatalogue = {
  id: string;
  categories: string[];
  priority: number;
  is_active: boolean;
} & Record<string, unknown>;

const FALLBACK_TENSION_IDS = [
  'enfants_sante',
  'metier_general',
  'valeur_immo',
  'retraite_ici',
];

// Famille « vie / territoire » : les questions en tension qui ne sont ni climat ni
// risque (calme, transports, croissance, vie locale, départ de la ville). Sans
// règle de diversité, les questions climat (prioritaires et nombreuses) saturent
// les 4 slots et celles-ci ne surfacent jamais. On leur RÉSERVE un slot.
export const TERRITORY_TENSION_IDS: ReadonlySet<string> = new Set([
  'calme_infra',
  'tc_sansvoiture',
  'croissance_transformation',
  'vielocale_reelle',
  'quitter_ville',
]);

// Dédup par préfixe d'id (avant le premier « _ ») : évite 5 variantes « Acheter à X ? ».
function dedupeByPrefix<T extends QuestionCatalogue>(tensions: T[]): T[] {
  const seen = new Set<string>();
  const result: T[] = [];
  for (const tension of tensions) {
    const key = tension.id.split('_')[0];
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(tension);
  }
  return result;
}

const MAX_TENSIONS = 4;

export function buildTensions<T extends QuestionCatalogue>(catalog: T[], categories: readonly string[] | null | undefined): T[] {
  const safeCategories =
    categories && categories.length > 0 ? categories : ['all'];

  const matching = catalog
    .filter(
      (tension) =>
        tension.is_active &&
        (tension.categories.includes('all') ||
          tension.categories.some((category) =>
            safeCategories.includes(category),
          )),
    )
    .sort((a, b) => a.priority - b.priority);

  const deduped = dedupeByPrefix(matching);
  const isTerritory = (t: T) => TERRITORY_TENSION_IDS.has(t.id);
  const bestTerritory = deduped.find(isTerritory) ?? null;

  // Règle de diversité : le climat reste dominant (3 slots), mais si une question
  // « vie / territoire » s'applique, on lui garantit le dernier slot plutôt que
  // de laisser une 4e question climat le prendre.
  const result: T[] = [];
  for (const tension of deduped) {
    if (result.length >= MAX_TENSIONS) break;
    const reserveLastForTerritory =
      result.length === MAX_TENSIONS - 1 &&
      bestTerritory &&
      !result.some(isTerritory) &&
      !isTerritory(tension);
    if (reserveLastForTerritory) continue; // on saute cette question climat pour réserver le slot
    result.push(tension);
  }
  if (
    result.length < MAX_TENSIONS &&
    bestTerritory &&
    !result.some(isTerritory)
  ) {
    result.push(bestTerritory);
  }

  // Complément si moins de 4 questions ont matché.
  for (const t of deduped) {
    if (result.length >= MAX_TENSIONS) break;
    if (!result.includes(t)) result.push(t);
  }
  for (const id of FALLBACK_TENSION_IDS) {
    if (result.length >= MAX_TENSIONS) break;
    const fallback = catalog.find((item) => item.id === id && item.is_active);
    if (fallback && !result.find((item) => item.id === fallback.id)) {
      result.push(fallback);
    }
  }

  return result.slice(0, MAX_TENSIONS);
}
