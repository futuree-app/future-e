// LES RÉCITS DE L'ACCUEIL, EXTRAITS DU COMPOSANT (FUT-37, étape 1 : extraction à l'identique).
//
// Ces fonctions vivaient dans FutureELanding.tsx, un composant client de 3 700 lignes sous
// `@ts-nocheck` : aucune n'était testable. Elles sont déplacées ici SANS changer un mot, pour que les
// tests de caractérisation figent ce qu'elles disent avant qu'on les corrige.
//
// Module PUR : aucune I/O, aucun JSX, imports relatifs (testable sous `node --test`).
import { deCommune } from "../typography.ts";

export type Horizon = "today" | "2030" | "2050" | "2100";

type Indicators = Record<string, Record<string, { value_numeric?: number | null } | undefined> | undefined>;
type Georisques = { flags?: Record<string, boolean | undefined> | null } | null | undefined;
type Gissol = { cadmium?: { label?: string | null; score?: number | null } | null } | null | undefined;

export type PreviewCard = { label: string; val: string; note?: string | null; col: string; src: string };

const C = {
  orange: "var(--orange)",
  red: "var(--red)",
  violet: "var(--violet)",
  green: "var(--green)",
  blue: "var(--blue)",
};
export const LANDING_DRIAS_SCENARIO = {
  id: 'gwl30',
  horizon: '2050',
  shortLabel: '+4°C',
  longLabel: 'niveau de réchauffement +4°C',
};

export const HORIZON_TO_GWL: Record<Horizon, string | null> = {
  today: null,
  '2030': 'gwl15',
  '2050': 'gwl20',
  '2100': 'gwl30',
};

// Tensions pour lesquelles on peut afficher une valeur DRIAS par horizon
export const DRIAS_TENSION_CONFIG: Record<string, {
  indicator: string;
  getSub: (value: number, name: string) => string;
}> = {
  canicule_vivable: {
    indicator: 'NORTX30D_yr',
    getSub: (v, name) => `${Math.round(v)} jours > 30°C par an à ${name}`,
  },
  acheter_canicule: {
    indicator: 'NORTX30D_yr',
    getSub: (v, name) => `${Math.round(v)} jours > 30°C par an à ${name}`,
  },
  enfants_chaleur: {
    indicator: 'NORTX30D_yr',
    getSub: (v, name) => `${Math.round(v)} jours > 30°C par an à ${name}`,
  },
  feux: {
    indicator: 'NORIFM40_yr',
    getSub: (v, _name) => `${Math.round(v)} jours de risque incendie élevé par an`,
  },
  randonner_ici: {
    indicator: 'NORIFM40_yr',
    getSub: (v, _name) => `${Math.round(v)} jours de risque incendie élevé par an`,
  },
  eau_potable: {
    indicator: 'NORSWI04_yr',
    getSub: (v, name) => `${Math.round(v)} jours de sol sec par an à ${name}`,
  },
  metier_agricole: {
    indicator: 'NORRR_seas_JJA',
    getSub: (v, name) => `${Math.round(v)} mm de pluie en été à ${name}`,
  },
  vignobles: {
    indicator: 'NORTMm_seas_JJA',
    getSub: (v, name) => `${v.toFixed(1)} °C en été à ${name}`,
  },
};

function formatIndicatorValue(value: number | null | undefined, digits = 0) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return null;
  }

  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
}

function getLandingIndicatorValue(indicators: Indicators, indicatorCode: string, gwlId: string = LANDING_DRIAS_SCENARIO.id): number | null {
  return indicators?.[gwlId]?.[indicatorCode]?.value_numeric ?? null;
}

export function getDriaSub(
  tensionId: string,
  horizon: Horizon,
  indicators: Indicators,
  communeName: string,
  staticSub: string,
): { sub: string; isDriasProjectable: boolean } {
  const config = DRIAS_TENSION_CONFIG[tensionId];
  if (!config) return { sub: staticSub, isDriasProjectable: false };

  if (horizon === 'today') return { sub: staticSub, isDriasProjectable: true };

  const gwlId = HORIZON_TO_GWL[horizon];
  if (!gwlId) return { sub: staticSub, isDriasProjectable: true };

  const value = indicators?.[gwlId]?.[config.indicator]?.value_numeric;
  if (value == null || Number.isNaN(Number(value))) return { sub: staticSub, isDriasProjectable: true };

  return { sub: config.getSub(Number(value), communeName), isDriasProjectable: true };
}

export function buildDriasContext(communeName: string, indicators: Indicators) {
  const hotDays = getLandingIndicatorValue(indicators, 'NORTX30D_yr');
  const tropicalNights = getLandingIndicatorValue(indicators, 'NORTR_yr');
  const summerTemp = getLandingIndicatorValue(indicators, 'NORTMm_seas_JJA');

  if (hotDays !== null && hotDays !== undefined) {
    return {
      commune: communeName,
      primary_signal: 'heat_days_over_30c',
      summary: `${LANDING_DRIAS_SCENARIO.shortLabel} : ${formatIndicatorValue(hotDays, 0)} jours > 30°C/an`,
      scenarios: [{
        id: LANDING_DRIAS_SCENARIO.id,
        horizon: LANDING_DRIAS_SCENARIO.horizon,
        shortLabel: LANDING_DRIAS_SCENARIO.shortLabel,
        longLabel: LANDING_DRIAS_SCENARIO.longLabel,
        value: hotDays,
        unit: 'jours/an',
      }],
    };
  }

  if (tropicalNights !== null && tropicalNights !== undefined) {
    return {
      commune: communeName,
      primary_signal: 'tropical_nights',
      summary: `${LANDING_DRIAS_SCENARIO.shortLabel} : ${formatIndicatorValue(tropicalNights, 0)} nuits tropicales/an`,
      scenarios: [{
        id: LANDING_DRIAS_SCENARIO.id,
        horizon: LANDING_DRIAS_SCENARIO.horizon,
        shortLabel: LANDING_DRIAS_SCENARIO.shortLabel,
        longLabel: LANDING_DRIAS_SCENARIO.longLabel,
        value: tropicalNights,
        unit: 'nuits/an',
      }],
    };
  }

  if (summerTemp !== null && summerTemp !== undefined) {
    return {
      commune: communeName,
      primary_signal: 'summer_mean_temperature',
      summary: `${LANDING_DRIAS_SCENARIO.shortLabel} : ${formatIndicatorValue(summerTemp, 1)} °C en été`,
      scenarios: [{
        id: LANDING_DRIAS_SCENARIO.id,
        horizon: LANDING_DRIAS_SCENARIO.horizon,
        shortLabel: LANDING_DRIAS_SCENARIO.shortLabel,
        longLabel: LANDING_DRIAS_SCENARIO.longLabel,
        value: summerTemp,
        unit: '°C',
      }],
    };
  }

  return null;
}

// Narratives canicule sévère (NORTX35D_yr = jours > 35°C)
function caniiculeNarrative(days: number, name: string, horizon: Horizon): { val: string; note: string | null } {
  const note = (horizon !== 'today') ? `≈ ${Math.round(days)} jours > 35°C/an` : null;
  if (horizon === 'today') return { val: `Les épisodes de chaleur extrême restent ponctuels à ${name}.`, note };
  if (horizon === '2030') return { val: `Les journées au-dessus de 35°C deviennent plus fréquentes l'été.`, note };
  if (horizon === '2050') return { val: `Les épisodes de chaleur extrême pourraient devenir courants à ${name}.`, note };
  return { val: `Les chaleurs extrêmes pourraient durer plusieurs semaines par an.`, note };
}

// Narratives nuits tropicales (NORTR_yr = nuits > 20°C)
function nightsNarrative(nights: number, name: string, horizon: Horizon): { val: string; note: string | null } {
  const note = (horizon !== 'today') ? `≈ ${Math.round(nights)} nuits tropicales/an` : null;
  if (horizon === 'today') return { val: `Les nuits très chaudes restent relativement rares à ${name}.`, note };
  if (horizon === '2030') return { val: `Les nuits sans fraîcheur deviennent plus fréquentes.`, note };
  if (horizon === '2050') return { val: `Les nuits où l'on récupère difficilement pourraient devenir courantes.`, note };
  return { val: `Les nuits tropicales pourraient transformer durablement les étés à ${name}.`, note };
}

// Narratives température estivale par horizon
function summerTempNarrative(temp: number, name: string, horizon: Horizon): { val: string; note: string | null } {
  const t = Number(temp).toFixed(1);
  const note = (horizon !== 'today') ? `≈ ${t} °C en moyenne l'été` : null;

  if (horizon === 'today') {
    if (temp >= 26) return { val: `Les étés chauds sont déjà la norme à ${name}.`, note };
    return { val: `Les étés à ${name} se réchauffent progressivement.`, note };
  }

  if (horizon === '2030') {
    if (temp >= 26) return { val: `Les étés à ${name} pourraient encore se réchauffer sensiblement d'ici 2030.`, note };
    return { val: `Les températures estivales à ${name} devraient augmenter.`, note };
  }

  if (horizon === '2050') {
    if (temp >= 26) return { val: `Les étés à ${name} tels que vous les connaissez vont changer de nature.`, note };
    return { val: `Les étés à ${name} pourraient devenir nettement plus chauds d'ici 2050.`, note };
  }

  // 2100
  if (temp >= 28) return { val: `${name} pourrait connaître des étés comparables aux zones les plus chaudes d'Europe.`, note };
  return { val: `Les températures estivales à ${name} pourraient dépasser largement ce qui est normal aujourd'hui.`, note };
}

// Narratives feux de forêt (NORIFM40_yr = jours à risque incendie)
function feuxNarrative(firedays: number, name: string, horizon: Horizon): { val: string; note: string | null } {
  const note = (horizon !== 'today') ? `≈ ${Math.round(firedays)} jours/an à risque incendie` : null;
  if (horizon === 'today') return { val: `Les périodes à risque restent concentrées sur les étés secs.`, note };
  if (horizon === '2030') return { val: `Les conditions favorables aux incendies deviennent plus fréquentes.`, note };
  if (horizon === '2050') return { val: `Le risque d'incendie pourrait fortement progresser autour ${deCommune(name)}.`, note };
  return { val: `Les périodes à risque élevé pourraient durer une grande partie de l'été.`, note };
}

// Narratives stress hydrique (NORSWI04_yr = jours sols secs SWI < 0.4)
function eauNarrative(drydays: number, name: string, horizon: Horizon): { val: string; note: string | null } {
  const note = (horizon !== 'today') ? `≈ ${Math.round(drydays)} jours/an avec sols secs` : null;
  if (horizon === 'today') return { val: `Les périodes sèches restent occasionnelles à ${name}.`, note };
  if (horizon === '2030') return { val: `Les épisodes de sécheresse deviennent plus fréquents.`, note };
  if (horizon === '2050') return { val: `L'accès à l'eau pourrait devenir plus tendu pendant les étés.`, note };
  return { val: `Les sécheresses estivales pourraient transformer durablement le territoire.`, note };
}

// Narratives précipitations extrêmes (NORRRq99_yr = percentile 99 précipitations)
function pluiesNarrative(mm: number, name: string, horizon: Horizon): { val: string; note: string | null } {
  const note = (horizon !== 'today') ? `≈ ${Math.round(mm)} mm lors des épisodes extrêmes` : null;
  if (horizon === 'today') return { val: `Certaines pluies intenses provoquent déjà des tensions localement.`, note };
  if (horizon === '2030') return { val: `Les épisodes de pluie intense pourraient devenir plus fréquents.`, note };
  if (horizon === '2050') return { val: `Les pluies extrêmes pourraient accentuer les risques de crue.`, note };
  return { val: `Les épisodes de pluie intense pourraient devenir beaucoup plus violents.`, note };
}

// Narratives viticulture (NORTMm_seas_JJA = température moyenne été)
function vigneNarrative(summerTemp: number, name: string, horizon: Horizon): { val: string; note: string | null } {
  const t = Number(summerTemp).toFixed(1);
  const note = (horizon !== 'today') ? `≈ ${t} °C en moyenne l'été` : null;

  if (horizon === 'today') {
    if (summerTemp >= 24) return { val: `Les vignes autour ${deCommune(name)} sont déjà soumises à des étés chauds.`, note };
    return { val: `La chaleur pourrait modifier les équilibres viticoles autour ${deCommune(name)}.`, note };
  }

  if (horizon === '2030') {
    if (summerTemp >= 24) return { val: `Les vignes autour ${deCommune(name)} pourraient voir leurs conditions d'été changer d'ici 2030.`, note };
    return { val: `La maturité des raisins autour ${deCommune(name)} pourrait s'avancer progressivement.`, note };
  }

  if (horizon === '2050') {
    if (summerTemp >= 26) return { val: `Les cépages traditionnels autour ${deCommune(name)} pourraient ne plus être adaptés aux étés de 2050.`, note };
    if (summerTemp >= 24) return { val: `Le réchauffement des étés autour ${deCommune(name)} pourrait transformer les vins du territoire.`, note };
    return { val: `Les parcelles viticoles autour ${deCommune(name)} pourraient nécessiter une adaptation profonde d'ici 2050.`, note };
  }

  // 2100
  if (summerTemp >= 28) return { val: `La viticulture autour ${deCommune(name)} pourrait migrer vers des altitudes ou des cépages très différents.`, note };
  return { val: `Les vignes autour ${deCommune(name)} pourraient connaître des étés sans précédent historique d'ici 2100.`, note };
}

// Narratives neige / montagne (NORTMm_seas_DJF = température moyenne hiver)
function neigeNarrative(winterTemp: number, name: string, horizon: Horizon): { val: string; note: string | null } {
  const t = Number(winterTemp).toFixed(1);
  const note = (horizon !== 'today') ? `≈ ${t} °C en moyenne l'hiver` : null;

  if (horizon === 'today') {
    if (winterTemp >= 2) return { val: `Les hivers enneigés à ${name} sont déjà moins réguliers qu'autrefois.`, note };
    return { val: `Les hivers enneigés pourraient devenir plus rares à ${name}.`, note };
  }

  if (horizon === '2030') {
    if (winterTemp >= 2) return { val: `L'enneigement à ${name} pourrait devenir moins fiable d'ici 2030.`, note };
    return { val: `Les hivers à ${name} pourraient se réchauffer progressivement.`, note };
  }

  if (horizon === '2050') {
    if (winterTemp >= 4) return { val: `La neige pourrait devenir rare et imprévisible à ${name} d'ici 2050.`, note };
    if (winterTemp >= 2) return { val: `Le manteau neigeux à ${name} pourrait se réduire significativement d'ici 2050.`, note };
    return { val: `Les hivers à ${name} pourraient se transformer profondément avant la moitié du siècle.`, note };
  }

  // 2100
  if (winterTemp >= 6) return { val: `${name} pourrait connaître des hivers sans neige fiable en fin de siècle.`, note };
  if (winterTemp >= 3) return { val: `L'économie montagnarde autour ${deCommune(name)} pourrait être fragilisée par des hivers trop doux.`, note };
  return { val: `Les hivers à ${name} pourraient être méconnaissables d'ici la fin du siècle.`, note };
}

// Narratives submersion marine (horizon-aware, basées sur projections SLR)
function submersionNarrative(name: string, horizon: Horizon): { val: string } {
  if (horizon === 'today') return { val: `${name} figure parmi les communes exposées au risque de submersion marine.` };
  if (horizon === '2030') return { val: `La montée des eaux pourrait aggraver le risque de submersion marine à ${name} d'ici 2030.` };
  if (horizon === '2050') return { val: `La submersion marine à ${name} pourrait s'étendre à de nouvelles zones d'ici 2050.` };
  return { val: `En fin de siècle, des quartiers ${deCommune(name)} pourraient être régulièrement submergés par la mer.` };
}

// Narratives inondation fluviale (horizon-aware)
function inondationNarrative(name: string, horizon: Horizon): { val: string } {
  if (horizon === 'today') return { val: `Certaines zones ${deCommune(name)} sont exposées aux inondations.` };
  if (horizon === '2030') return { val: `Les épisodes de crues à ${name} pourraient devenir plus fréquents d'ici 2030.` };
  if (horizon === '2050') return { val: `Le risque d'inondation à ${name} pourrait s'intensifier avec des pluies plus violentes.` };
  return { val: `Les inondations à ${name} pourraient toucher des zones aujourd'hui épargnées d'ici 2100.` };
}

// Narratives argiles/sécheresse géotechnique (horizon-aware)
function argilesNarrative(name: string, horizon: Horizon): { val: string } {
  if (horizon === 'today') return { val: `Les sols argileux ${deCommune(name)} peuvent provoquer des fissures dans les bâtiments lors des sécheresses.` };
  if (horizon === '2030') return { val: `Les sécheresses plus fréquentes à ${name} pourraient aggraver le retrait-gonflement des argiles.` };
  if (horizon === '2050') return { val: `Le risque de fissuration lié aux argiles à ${name} pourrait s'accroître avec l'allongement des sécheresses.` };
  return { val: `Les épisodes de retrait-gonflement des argiles à ${name} pourraient devenir nettement plus fréquents d'ici 2100.` };
}

// Narratives valeur immobilière (horizon-aware)
function immobilierNarrative(name: string, horizon: Horizon): { val: string } {
  if (horizon === 'today') return { val: `À ${name}, les risques climatiques et les normes énergétiques vont peser sur les prix.` };
  if (horizon === '2030') return { val: `D'ici 2030, les biens en zone à risque à ${name} pourraient connaître une première décote.` };
  if (horizon === '2050') return { val: `Les biens exposés aux risques climatiques à ${name} pourraient perdre significativement de leur valeur d'ici 2050.` };
  return { val: `Certains biens immobiliers à ${name} pourraient devenir difficiles à assurer ou à revendre d'ici 2100.` };
}

function getDriasCard(communeName: string, indicators: Indicators, horizon: Horizon = "today"): PreviewCard | null {
  const gwlId = HORIZON_TO_GWL[horizon] ?? 'gwl15';
  const days35 = getLandingIndicatorValue(indicators, 'NORTX35D_yr', gwlId);

  if (days35 !== null && days35 !== undefined) {
    const { val, note } = caniiculeNarrative(days35, communeName, horizon);
    return { label: `Canicule à ${communeName}`, val, note, col: C.red, src: 'DRIAS / Météo-France' };
  }

  // Fallback sur température estivale si NORTX35D_yr absent
  const summerTemp = getLandingIndicatorValue(indicators, 'NORTMm_seas_JJA', gwlId);
  if (summerTemp !== null && summerTemp !== undefined) {
    const { val, note } = summerTempNarrative(summerTemp, communeName, horizon);
    return { label: `Été à ${communeName}`, val, note, col: C.red, src: 'DRIAS / Météo-France' };
  }

  return null;
}

function getGeorisquesCard(communeName: string, georisques: Georisques, horizon: Horizon = "today"): PreviewCard | null {
  if (!georisques) return null;

  if (georisques.flags?.marineSubmersion) {
    return {
      label: `Submersion à ${communeName}`,
      val: submersionNarrative(communeName, horizon).val,
      col: C.blue,
      src: 'Géorisques / BRGM',
    };
  }

  if (georisques.flags?.flood) {
    return {
      label: `Inondation à ${communeName}`,
      val: inondationNarrative(communeName, horizon).val,
      col: C.blue,
      src: 'Géorisques / BRGM',
    };
  }

  if (georisques.flags?.clay) {
    return {
      label: `Argiles à ${communeName}`,
      val: argilesNarrative(communeName, horizon).val,
      col: C.orange,
      src: 'Géorisques / BRGM',
    };
  }

  if (georisques.flags?.landslide) {
    return {
      label: `Terrain à ${communeName}`,
      val: `Le territoire ${deCommune(communeName)} présente une sensibilité aux mouvements de terrain.`,
      col: C.orange,
      src: 'Géorisques / BRGM',
    };
  }

  return null;
}

// Hash déterministe d'un nom de commune → varie le mix de cartes d'une commune
// à l'autre sans flicker (pas de Math.random, stable au re-render et au SSR).
function hashName(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h * 31 + str.charCodeAt(i)) >>> 0;
  }
  return h;
}

export function getPreviewCards(communeName: string, categories: string[] | null | undefined, indicators: Indicators, georisques: Georisques, gissol: Gissol, horizon: Horizon = "today"): PreviewCard[] {
  const name = communeName || 'votre commune';
  const safeCategories =
    categories && categories.length > 0 ? categories : ['all'];

  const hasCategory = (category: string) => safeCategories.includes(category);
  const hasAny = (...cats: string[]) => cats.some((category) => safeCategories.includes(category));

  const gwlId = HORIZON_TO_GWL[horizon] ?? 'gwl15';

  // ── Cartes CLIMAT (par ordre de priorité) ─────────────────────────
  // La canicule sévère reste l'accroche : toujours en position 1.
  const climate: PreviewCard[] = [];
  const driasCard = getDriasCard(name, indicators, horizon);
  if (driasCard) {
    climate.push(driasCard);
  }

  if (hasCategory('mediterranee') || hasCategory('rural_forestier')) {
    const firedays = getLandingIndicatorValue(indicators, 'NORIFM40_yr', gwlId);
    if (firedays !== null && firedays !== undefined) {
      const { val, note } = feuxNarrative(firedays, name, horizon);
      climate.push({ label: `Feux autour ${deCommune(name)}`, val, note, col: C.red, src: 'DRIAS / Météo-France' });
    }
  }

  if (hasCategory('rural_agricole') || hasCategory('tension_hydrique_connue')) {
    const drydays = getLandingIndicatorValue(indicators, 'NORSWI04_yr', gwlId);
    if (drydays !== null && drydays !== undefined) {
      const { val, note } = eauNarrative(drydays, name, horizon);
      climate.push({ label: `Eau à ${name}`, val, note, col: C.blue, src: 'DRIAS / Météo-France' });
    }
  }

  if (hasCategory('rural_viticole')) {
    const summerTemp = getLandingIndicatorValue(indicators, 'NORTMm_seas_JJA', gwlId);
    if (summerTemp !== null && summerTemp !== undefined) {
      const { val, note } = vigneNarrative(summerTemp, name, horizon);
      climate.push({ label: `Vigne à ${name}`, val, note, col: C.green, src: 'DRIAS / Météo-France' });
    }
  }

  if (hasCategory('montagne')) {
    const winterTemp = getLandingIndicatorValue(indicators, 'NORTMm_seas_DJF', gwlId);
    if (winterTemp !== null && winterTemp !== undefined) {
      const { val, note } = neigeNarrative(winterTemp, name, horizon);
      climate.push({ label: `Neige à ${name}`, val, note, col: C.blue, src: 'DRIAS / Météo-France' });
    }
  }

  const tropicalNights = getLandingIndicatorValue(indicators, 'NORTR_yr', gwlId);
  if (tropicalNights !== null && tropicalNights !== undefined) {
    const { val, note } = nightsNarrative(tropicalNights, name, horizon);
    climate.push({ label: `Nuits à ${name}`, val, note, col: C.red, src: 'DRIAS / Météo-France' });
  }

  const extremeRain = getLandingIndicatorValue(indicators, 'NORRRq99_yr', gwlId);
  if (extremeRain !== null && extremeRain !== undefined) {
    const { val, note } = pluiesNarrative(extremeRain, name, horizon);
    climate.push({ label: `Pluies à ${name}`, val, note, col: C.blue, src: 'DRIAS / Météo-France' });
  }

  const georisquesCard = getGeorisquesCard(name, georisques, horizon);
  if (georisquesCard) {
    climate.push(georisquesCard);
  } else if (hasCategory('littoral') || hasCategory('littoral_atlantique')) {
    climate.push({ label: `Submersion à ${name}`, val: submersionNarrative(name, horizon).val, col: C.blue, src: 'Géorisques / BRGM' });
  }

  if (hasCategory('vallee_industrielle')) {
    climate.push({ label: `Air à ${name}`, val: `La qualité de l'air à ${name} se dégrade lors des pics de chaleur, avec une hausse de l'ozone.`, col: C.red, src: 'ATMO / Santé publique France' });
  }

  // ── Cartes PROFONDEUR (cadre de vie / nature / mobilité) ──────────
  // Qualitatives, ancrées sur le profil de la commune : elles montrent
  // l'étendue du produit au-delà du climat, sans entrer dans la donnée.
  const depth: PreviewCard[] = [];
  // Mobilité (violet) — toujours présente, formulation selon le profil
  const carDependent = hasAny(
    'periurbain_dependance_auto', 'rural_peri_urbain', 'rural_agricole',
    'rural_forestier', 'rural_viticole', 'montagne',
  );
  depth.push({
    label: `Mobilité à ${name}`,
    val: carDependent
      ? `À ${name}, le quotidien dépend largement de la voiture pour se déplacer.`
      : `À ${name}, transports et courtes distances pèsent dans les trajets du quotidien.`,
    col: C.violet,
    src: 'INSEE MOBPRO',
  });
  // Nature ou vie locale (vert) — selon le profil
  if (hasAny('littoral', 'littoral_atlantique')) {
    depth.push({ label: `Nature à ${name}`, val: `À ${name}, le littoral et les espaces ouverts façonnent le cadre de vie.`, col: C.green, src: 'OSM / IGN' });
  } else if (hasCategory('montagne')) {
    depth.push({ label: `Nature à ${name}`, val: `À ${name}, le relief et le plein air façonnent le cadre de vie.`, col: C.green, src: 'OSM / IGN' });
  } else if (hasAny('rural_forestier', 'rural_agricole', 'rural_viticole')) {
    depth.push({ label: `Nature à ${name}`, val: `Autour ${deCommune(name)}, espaces agricoles et nature rythment le quotidien.`, col: C.green, src: 'OSM / IGN' });
  } else if (hasCategory('tourisme_urbain')) {
    depth.push({ label: `Vie locale à ${name}`, val: `À ${name}, commerces, services et vie culturelle animent le quotidien.`, col: C.green, src: 'INSEE BPE / RNA' });
  } else {
    depth.push({ label: `Vie locale à ${name}`, val: `À ${name}, commerces, services et vie associative font le quotidien.`, col: C.green, src: 'INSEE BPE / RNA' });
  }

  // ── Cartes de repli (non-climat, hors « profondeur ») ─────────────
  const fillers: PreviewCard[] = [];
  fillers.push({ label: `Valeur immobilière à ${name}`, val: immobilierNarrative(name, horizon).val, col: C.orange, src: 'DVF / ADEME' });
  if (gissol?.cadmium?.label) {
    const cdScore = gissol.cadmium.score ?? 0;
    const cdCol = cdScore >= 65 ? C.red : cdScore >= 45 ? C.orange : C.green;
    const cdLevel = cdScore >= 65
      ? `Les données disponibles montrent une vigilance élevée sur les sols ${deCommune(name)}.`
      : cdScore >= 45
        ? `Un niveau de vigilance modéré a été relevé dans les sols autour ${deCommune(name)}.`
        : `Les données disponibles montrent un niveau de vigilance faible pour les sols ${deCommune(name)}.`;
    fillers.push({ label: `Qualité des sols à ${name}`, val: cdLevel, col: cdCol, src: 'GisSol / RMQS' });
  }

  // ── Assemblage : viser 2 climat + 2 profondeur, accroche climat en
  //    position 1, entrelacement varié d'une commune à l'autre (seed =
  //    hash du nom, donc stable par commune, insensible à l'horizon). ──
  const result: PreviewCard[] = [];
  const pushUnique = (card: PreviewCard | undefined) => {
    if (card && !result.some((c) => c.label === card!.label)) result.push(card);
  };

  const hook = climate.shift(); // canicule (ou 1er climat disponible)
  pushUnique(hook);

  const restClimate = climate.slice(0, 1); // un climat de plus
  const restDepth = depth.slice(0, 2);
  const c = [...restClimate];
  const d = [...restDepth];
  const order = [['c', 'd', 'd'], ['d', 'c', 'd'], ['d', 'd', 'c']][hashName(name) % 3];
  for (const slot of order) {
    if (slot === 'c' && c.length) pushUnique(c.shift());
    else if (slot === 'd' && d.length) pushUnique(d.shift());
  }
  [...c, ...d].forEach(pushUnique);

  // Compléter à 4 si besoin : climat restant → profondeur → repli
  for (const card of [...climate, ...depth, ...fillers]) {
    if (result.length >= 4) break;
    pushUnique(card);
  }

  return result.slice(0, 4);
}

export function getHeroCopy(communeName: string, categories: string[] | null | undefined, usedFallback: boolean | undefined): string {
  const name = communeName || 'votre commune';
  const safeCategories =
    categories && categories.length > 0 ? categories : ['all'];

  const hasCategory = (category: string) => safeCategories.includes(category);

  if (usedFallback) {
    return `futur•e décode les données publiques pour lire ce que le changement climatique change déjà dans votre quotidien. Accédez à une première lecture personnalisée de l'évolution ${deCommune(name)} à travers le prisme du climat, de la santé et de l'immobilier.`;
  }

  if (hasCategory('littoral')) {
    return `futur•e lit ${name} à travers ses tensions côtières : submersion, érosion, chaleur estivale, assurance, eau et qualité de vie. Pas une carte générale du climat, mais ce que ce territoire change concrètement pour vos décisions.`;
  }

  if (hasCategory('montagne')) {
    return `futur•e lit ${name} à travers ses équilibres de montagne : enneigement, saisons touristiques, accès, chaleur estivale et mutation économique locale. L'objectif n'est pas d'alimenter l'angoisse, mais d'éclairer vos choix avec des signaux crédibles.`;
  }

  if (hasCategory('urbain_dense_sud') || hasCategory('mediterranee')) {
    return `futur•e croise chaleur, qualité de l'air, eau, mobilité et immobilier pour lire ce que devenir à ${name} veut vraiment dire dans un territoire déjà exposé aux étés plus durs.`;
  }

  if (hasCategory('rural_peri_urbain') || hasCategory('periurbain_dependance_auto')) {
    return `futur•e lit ${name} à partir de vos contraintes réelles : dépendance à la voiture, chaleur, ressource en eau, valeur du logement et capacité d'adaptation du territoire.`;
  }

  return `futur•e décode les données publiques pour projeter l'impact du changement climatique sur votre quotidien. Accédez à une première lecture personnalisée de l'évolution ${deCommune(name)} à travers le prisme du climat, de la santé et de l'immobilier.`;
}

export function getQuestionIntro(communeName: string, categories: string[] | null | undefined, usedFallback: boolean | undefined): string {
  const safeCategories =
    categories && categories.length > 0 ? categories : ['all'];
  const hasCategory = (category: string) => safeCategories.includes(category);
  const name = communeName || 'votre commune';

  if (usedFallback) {
    return `À ${name}, le futur se joue déjà entre chaleur, logement, eau et qualité de vie.`;
  }

  if (hasCategory('littoral') || hasCategory('littoral_atlantique')) {
    return `À ${name}, le futur se joue déjà entre chaleur, submersion, accès à l'eau et pression sur le littoral.`;
  }

  if (hasCategory('littoral_mediterranee')) {
    return `À ${name}, le futur se joue entre canicule, submersion marine, feux et fragilité du littoral.`;
  }

  if (hasCategory('montagne')) {
    return `À ${name}, le futur se joue entre enneigement, chaleur estivale, eau et transformation du territoire de montagne.`;
  }

  if (hasCategory('mediterranee')) {
    return `À ${name}, le futur se joue déjà entre canicule, nuits tropicales, feux de forêt et tension sur l'eau.`;
  }

  if (hasCategory('rural_viticole')) {
    return `À ${name}, le futur se joue entre chaleur estivale, stress hydrique, viticulture et transformation des sols.`;
  }

  if (hasCategory('rural_agricole') || hasCategory('tension_hydrique_connue')) {
    return `À ${name}, le futur se joue entre sécheresse, ressource en eau, agriculture et résilience du territoire.`;
  }

  if (hasCategory('periurbain_dependance_auto') || hasCategory('rural_peri_urbain')) {
    return `À ${name}, le futur se joue entre dépendance à la voiture, coût de l'énergie, chaleur et accès aux services.`;
  }

  if (hasCategory('urbain_dense_sud') || hasCategory('urbain_dense_nord')) {
    return `À ${name}, le futur se joue entre canicule urbaine, qualité de l'air, logement et pression sur les services.`;
  }

  return `À ${name}, le futur se joue déjà entre chaleur, eau, logement et qualité de vie.`;
}

export function getEmptyStateCopy(categories: string[] | null | undefined): string {
  const safeCategories =
    categories && categories.length > 0 ? categories : ['all'];

  if (safeCategories.includes('littoral')) {
    return 'Les questions porteront ici sur le littoral, la chaleur, le logement et les projets de vie.';
  }

  if (safeCategories.includes('montagne')) {
    return "Les questions porteront ici sur la montagne, l'enneigement, le tourisme et l'habitabilité.";
  }

  if (
    safeCategories.includes('periurbain_dependance_auto') ||
    safeCategories.includes('rural_peri_urbain')
  ) {
    return "Les questions porteront ici sur les déplacements, l'eau, le logement et l'adaptation du territoire.";
  }

  return 'Quatre questions sélectionnées pour votre territoire apparaîtront ici.';
}
