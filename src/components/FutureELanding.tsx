/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ReportWizard } from '@/components/wizard/ReportWizard';
import { createClient } from '@/lib/supabase/client';
import Navbar from '@/components/Navbar';
import { CookieSettingsLink } from '@/components/CookieSettingsLink';
import { SAVOIR_HUB_ARTICLES } from '@/config/navigation';
import { LandingComparatorInput } from '@/components/LandingComparatorInput';
import { deriveCategories } from '@/lib/commune-categories';
import posthog from 'posthog-js';
import { HorizonSwitch, type Horizon } from '@/components/HorizonSwitch';

const C = {
  bg: 'var(--bg)',
  bgElev: 'var(--bg-elev)',
  border: 'var(--border-1)',
  borderHi: 'var(--border-hi)',
  text: 'var(--fg-1)',
  muted: 'var(--fg-3)',
  dim: 'var(--fg-4)',
  orange: 'var(--orange)',
  red: 'var(--red)',
  violet: 'var(--violet)',
  green: 'var(--green)',
  blue: 'var(--blue)',
};

const PLM_CENTRAL_CODES: Record<string, { city: string; example: string }> = {
  '75056': { city: 'Paris',     example: 'Paris 15e Arrondissement' },
  '69123': { city: 'Lyon',      example: 'Lyon 6e Arrondissement' },
  '13055': { city: 'Marseille', example: 'Marseille 7e Arrondissement' },
};

const SLOT_CITIES = [
  {
    name: 'Lyon',
    cards: [
      { label: 'Canicule à Lyon',      val: 'Les projections placent Lyon parmi les communes les plus exposées aux étés futurs.', col: C.red,    src: 'DRIAS · +4°C' },
      { label: 'Nuits tropicales',      val: 'Les nuits sans fraîcheur, celles où l\'on ne récupère pas, seront plus fréquentes à Lyon.', col: C.red, src: 'DRIAS · +4°C' },
      { label: 'Eau à Lyon',            val: 'L\'approvisionnement en eau de Lyon sera sous pression pendant les étés futurs.',           col: C.blue,   src: 'BRGM / Agences de l\'eau' },
      { label: 'Immobilier à Lyon',     val: 'À Lyon, les risques climatiques et les normes énergétiques vont peser sur les prix.',      col: C.orange, src: 'DVF / ADEME' },
    ],
  },
  {
    name: 'Marseille',
    cards: [
      { label: 'Chaleur à Marseille',   val: 'Les projections placent Marseille parmi les communes les plus exposées aux étés futurs.',  col: C.red,    src: 'DRIAS · +4°C' },
      { label: 'Nuits tropicales',       val: 'Les nuits sans fraîcheur, celles où l\'on ne récupère pas, seront plus fréquentes à Marseille.', col: C.red, src: 'DRIAS · +4°C' },
      { label: 'Submersion à Marseille', val: 'Marseille figure parmi les communes exposées au risque de submersion.',                           col: C.blue,   src: 'Géorisques / BRGM' },
      { label: 'Feux à Marseille',       val: 'Le risque d\'incendie autour de Marseille augmente à chaque été sec.',                            col: C.orange, src: 'Prométhée / DREAL' },
    ],
  },
  {
    name: 'Vannes',
    cards: [
      { label: 'Canicule à Vannes',     val: 'D\'ici 2050, les étés à Vannes seront sensiblement plus chauds qu\'aujourd\'hui.',          col: C.red,    src: 'DRIAS · +4°C' },
      { label: 'Littoral à Vannes',     val: 'Vannes figure parmi les communes exposées au risque de submersion.',                          col: C.blue,   src: 'Géorisques / BRGM' },
      { label: 'Eau potable à Vannes',  val: 'L\'approvisionnement en eau de Vannes sera sous pression pendant les étés futurs.',          col: C.blue,   src: 'BRGM / Agences de l\'eau' },
      { label: 'Immobilier à Vannes',   val: 'À Vannes, les risques climatiques et les normes énergétiques vont peser sur les prix.',      col: C.orange, src: 'DVF / ADEME' },
    ],
  },
  {
    name: 'La Rochelle',
    cards: [
      { label: 'Submersion à La Rochelle', val: 'La Rochelle figure parmi les communes exposées au risque de submersion.',                     col: C.blue,   src: 'Géorisques / BRGM' },
      { label: 'Chaleur à La Rochelle',    val: 'Les fortes chaleurs devraient devenir plus fréquentes à La Rochelle.',                        col: C.red,    src: 'DRIAS · +4°C' },
      { label: 'Qualité des sols',         val: 'Un niveau de vigilance modéré a été relevé dans les sols autour de La Rochelle.',             col: C.orange, src: 'GisSol / RMQS' },
      { label: 'Immobilier à La Rochelle', val: 'À La Rochelle, les risques climatiques et les normes énergétiques vont peser sur les prix.', col: C.orange, src: 'DVF / ADEME' },
    ],
  },
];

const SLOT_SCHEDULE: [number, number][] = [
  [1,  5000], // Marseille
  [2, 10000], // Vannes
  [3, 15000], // La Rochelle — atterrissage final
];

const FALLBACK_TENSION_IDS = [
  'enfants_sante',
  'metier_general',
  'valeur_immo',
  'retraite_ici',
];

const LANDING_QNA_STORAGE_KEY = 'futuree:landing-qna-count';
const LANDING_QNA_LIMIT = 1;

const LANDING_DRIAS_SCENARIO = {
  id: 'gwl30',
  horizon: '2050',
  shortLabel: '+4°C',
  longLabel: 'niveau de réchauffement +4°C',
};

const HORIZON_TO_GWL: Record<Horizon, string | null> = {
  today: null,
  '2030': 'gwl15',
  '2050': 'gwl20',
  '2100': 'gwl30',
};

// Tensions pour lesquelles on peut afficher une valeur DRIAS par horizon
const DRIAS_TENSION_CONFIG: Record<string, {
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

const STATIC_ANSWERS = {
  acheter_littoral: {
    verdict: 'À acheter avec les yeux ouverts.',
    detail:
      "La Rochelle présente un risque de submersion en hausse de +31 % en scénario médian 2050 (DRIAS, Géorisques). Les Minimes et Aytré sont en zone PPRi modérée à élevée. Les coûts d'assurance habitation progressent de 8 à 12 % par an sur le littoral charentais (ACPR 2024). L'achat reste viable à condition de choisir le bon quartier, d'étudier la DPE et l'assurabilité future.",
    cta: 'Voir le rapport complet sur La Rochelle',
  },
  enfants_sante: {
    verdict: 'Trois signaux méritent votre attention.',
    detail:
      "Les sols charentais sont naturellement chargés en cadmium (GisSol/RMQS). L'ANSES a alerté en mars 2026 qu'un Français sur deux est surexposé par son alimentation, dont 36 % des enfants de moins de 3 ans. La saison pollinique s'est allongée de 28 jours en Nouvelle-Aquitaine (RNSA/Copernicus). Les jours de canicule projetés à La Rochelle passent de 5 à 34 par an en 2050 en scénario médian (DRIAS). Rien d'irrémédiable, mais autant le savoir tôt.",
    cta: 'Voir le module Santé de votre rapport',
  },
  mobilite_fragile: {
    verdict: "Bressuire est un territoire où la voiture n'est pas un choix.",
    detail:
      "84 % des actifs résidant dans des communes rurales similaires utilisent la voiture pour aller travailler (INSEE/Ecolab). Les flux domicile-travail sortants dépassent souvent 50 %. L'offre de transport collectif reste limitée et les bornes de recharge publique insuffisantes pour une transition fluide. Cette structure expose directement les budgets des foyers à la volatilité du prix des carburants.",
    cta: 'Voir le module Mobilité de votre rapport',
  },
  metier_general: {
    verdict: "Ça dépend du secteur. Certains gagnent, d'autres perdent.",
    detail:
      "Le secteur associatif et de l'ESS sera relativement peu exposé aux risques physiques directs, mais fortement affecté par l'évolution des financements et des priorités. Les métiers liés à l'adaptation climatique (bilan carbone, transition énergétique) sont en forte croissance. Les secteurs à exposition extérieure (BTP, agriculture) sont les plus vulnérables à la chaleur croissante (INRS).",
    cta: 'Voir le module Métier de votre rapport',
  },
  valeur_immo: {
    verdict: "Moins risqué que ce qu'on raconte, mais pas sans condition.",
    detail:
      'Les zones exposées aux risques documentés (PPRi, RGA, submersion) voient déjà leurs prix stagner ou baisser par rapport à des zones similaires sans risque (DVF 2024). Le DPE devient un facteur de valeur majeur : un logement F ou G se négocie en moyenne 6 à 15 % moins cher que son équivalent C (ADEME). À l\'horizon 2030, les obligations de rénovation énergétique rendront certains biens quasi invendables sans travaux.',
    cta: 'Voir le module Logement de votre rapport',
  },
  default: {
    verdict: 'Les données pour cette commune pointent plusieurs signaux.',
    detail:
      "Un rapport complet croise les données climatiques, sanitaires, immobilières et professionnelles pour votre commune et votre profil spécifique. Ce que futur•e fait, c'est transformer ces données publiques en lecture lisible et personnalisée, pour que vous puissiez décider, pas seulement vous inquiéter.",
    cta: 'Générer votre rapport complet',
  },
};

function getFallbackAnswer(tensionId) {
  return STATIC_ANSWERS[tensionId] || STATIC_ANSWERS.default;
}

function glass(extra = {}) {
  return {
    background: C.bgElev,
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    border: `1px solid ${C.border}`,
    ...extra,
  };
}

function dedupeTensions(tensions) {
  const seen = new Set();
  const result = [];

  for (const tension of tensions) {
    const key = tension.id.split('_')[0];
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    result.push(tension);

    if (result.length >= 4) {
      break;
    }
  }

  return result;
}

function buildTensions(catalog, categories) {
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

  const result = dedupeTensions(matching);

  for (const id of FALLBACK_TENSION_IDS) {
    if (result.length >= 4) {
      break;
    }

    const fallback = catalog.find((item) => item.id === id && item.is_active);
    if (fallback && !result.find((item) => item.id === fallback.id)) {
      result.push(fallback);
    }
  }

  return result.slice(0, 4);
}

function formatIndicatorValue(value, digits = 0) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return null;
  }

  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
}

function getLandingIndicatorValue(indicators, indicatorCode, gwlId = LANDING_DRIAS_SCENARIO.id) {
  return indicators?.[gwlId]?.[indicatorCode]?.value_numeric ?? null;
}

function getDriaSub(
  tensionId: string,
  horizon: Horizon,
  indicators: Record<string, unknown>,
  communeName: string,
  staticSub: string,
): { sub: string; isDriasProjectable: boolean } {
  const config = DRIAS_TENSION_CONFIG[tensionId];
  if (!config) return { sub: staticSub, isDriasProjectable: false };

  if (horizon === 'today') return { sub: staticSub, isDriasProjectable: true };

  const gwlId = HORIZON_TO_GWL[horizon];
  if (!gwlId) return { sub: staticSub, isDriasProjectable: true };

  const value = (indicators as any)?.[gwlId]?.[config.indicator]?.value_numeric;
  if (value == null || Number.isNaN(Number(value))) return { sub: staticSub, isDriasProjectable: true };

  return { sub: config.getSub(Number(value), communeName), isDriasProjectable: true };
}

function buildDriasContext(communeName, indicators) {
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

function buildGeorisquesContext(georisques) {
  if (!georisques) {
    return null;
  }

  return {
    commune: georisques.communeName || null,
    official_risks: georisques.riskLabels || [],
    flags: georisques.flags || {},
    seismic: georisques.seismic || null,
  };
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
  if (horizon === '2050') return { val: `Le risque d'incendie pourrait fortement progresser autour de ${name}.`, note };
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
    if (summerTemp >= 24) return { val: `Les vignes autour de ${name} sont déjà soumises à des étés chauds.`, note };
    return { val: `La chaleur pourrait modifier les équilibres viticoles autour de ${name}.`, note };
  }

  if (horizon === '2030') {
    if (summerTemp >= 24) return { val: `Les vignes autour de ${name} pourraient voir leurs conditions d'été changer d'ici 2030.`, note };
    return { val: `La maturité des raisins autour de ${name} pourrait s'avancer progressivement.`, note };
  }

  if (horizon === '2050') {
    if (summerTemp >= 26) return { val: `Les cépages traditionnels autour de ${name} pourraient ne plus être adaptés aux étés de 2050.`, note };
    if (summerTemp >= 24) return { val: `Le réchauffement des étés autour de ${name} pourrait transformer les vins du territoire.`, note };
    return { val: `Les parcelles viticoles autour de ${name} pourraient nécessiter une adaptation profonde d'ici 2050.`, note };
  }

  // 2100
  if (summerTemp >= 28) return { val: `La viticulture autour de ${name} pourrait migrer vers des altitudes ou des cépages très différents.`, note };
  return { val: `Les vignes autour de ${name} pourraient connaître des étés sans précédent historique d'ici 2100.`, note };
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
  if (winterTemp >= 3) return { val: `L'économie montagnarde autour de ${name} pourrait être fragilisée par des hivers trop doux.`, note };
  return { val: `Les hivers à ${name} pourraient être méconnaissables d'ici la fin du siècle.`, note };
}

// Narratives submersion marine (horizon-aware, basées sur projections SLR)
function submersionNarrative(name: string, horizon: Horizon): { val: string } {
  if (horizon === 'today') return { val: `${name} figure parmi les communes exposées au risque de submersion marine.` };
  if (horizon === '2030') return { val: `La montée des eaux pourrait aggraver le risque de submersion marine à ${name} d'ici 2030.` };
  if (horizon === '2050') return { val: `La submersion marine à ${name} pourrait s'étendre à de nouvelles zones d'ici 2050.` };
  return { val: `En fin de siècle, des quartiers de ${name} pourraient être régulièrement submergés par la mer.` };
}

// Narratives inondation fluviale (horizon-aware)
function inondationNarrative(name: string, horizon: Horizon): { val: string } {
  if (horizon === 'today') return { val: `Certaines zones de ${name} sont exposées aux inondations.` };
  if (horizon === '2030') return { val: `Les épisodes de crues à ${name} pourraient devenir plus fréquents d'ici 2030.` };
  if (horizon === '2050') return { val: `Le risque d'inondation à ${name} pourrait s'intensifier avec des pluies plus violentes.` };
  return { val: `Les inondations à ${name} pourraient toucher des zones aujourd'hui épargnées d'ici 2100.` };
}

// Narratives argiles/sécheresse géotechnique (horizon-aware)
function argilesNarrative(name: string, horizon: Horizon): { val: string } {
  if (horizon === 'today') return { val: `Les sols argileux de ${name} peuvent provoquer des fissures dans les bâtiments lors des sécheresses.` };
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

function getDriasCard(communeName, indicators, horizon: Horizon = 'today') {
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

function getGeorisquesCard(communeName, georisques, horizon: Horizon = 'today') {
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
      val: `Le territoire de ${communeName} présente une sensibilité aux mouvements de terrain.`,
      col: C.orange,
      src: 'Géorisques / BRGM',
    };
  }

  return null;
}

function getPreviewCards(communeName, categories, indicators, georisques, gissol, horizon: Horizon = 'today') {
  const name = communeName || 'votre commune';
  const safeCategories =
    categories && categories.length > 0 ? categories : ['all'];

  const hasCategory = (category) => safeCategories.includes(category);

  const cards = [];
  const gwlId = HORIZON_TO_GWL[horizon] ?? 'gwl15';
  const driasCard = getDriasCard(name, indicators, horizon);
  const georisquesCard = getGeorisquesCard(name, georisques, horizon);

  // ── Bloc 1 : Canicule sévère (NORTX35D_yr) — toujours en position 1
  if (driasCard) {
    cards.push(driasCard);
  }

  // ── Bloc 2 : Cartes DRIAS spécifiques à la catégorie — position 2
  if (hasCategory('mediterranee') || hasCategory('rural_forestier')) {
    const firedays = getLandingIndicatorValue(indicators, 'NORIFM40_yr', gwlId);
    if (firedays !== null && firedays !== undefined) {
      const { val, note } = feuxNarrative(firedays, name, horizon);
      cards.push({ label: `Feux autour de ${name}`, val, note, col: C.red, src: 'DRIAS / Météo-France' });
    }
  }

  if (hasCategory('rural_agricole') || hasCategory('tension_hydrique_connue')) {
    const drydays = getLandingIndicatorValue(indicators, 'NORSWI04_yr', gwlId);
    if (drydays !== null && drydays !== undefined) {
      const { val, note } = eauNarrative(drydays, name, horizon);
      cards.push({ label: `Eau à ${name}`, val, note, col: C.blue, src: 'DRIAS / Météo-France' });
    }
  }

  if (hasCategory('rural_viticole')) {
    const summerTemp = getLandingIndicatorValue(indicators, 'NORTMm_seas_JJA', gwlId);
    if (summerTemp !== null && summerTemp !== undefined) {
      const { val, note } = vigneNarrative(summerTemp, name, horizon);
      cards.push({ label: `Vigne à ${name}`, val, note, col: C.green, src: 'DRIAS / Météo-France' });
    }
  }

  if (hasCategory('montagne')) {
    const winterTemp = getLandingIndicatorValue(indicators, 'NORTMm_seas_DJF', gwlId);
    if (winterTemp !== null && winterTemp !== undefined) {
      const { val, note } = neigeNarrative(winterTemp, name, horizon);
      cards.push({ label: `Neige à ${name}`, val, note, col: C.blue, src: 'DRIAS / Météo-France' });
    }
  }

  // ── Bloc 3 : Nuits tropicales (NORTR_yr) — universel
  const tropicalNights = getLandingIndicatorValue(indicators, 'NORTR_yr', gwlId);
  if (tropicalNights !== null && tropicalNights !== undefined) {
    const { val, note } = nightsNarrative(tropicalNights, name, horizon);
    cards.push({ label: `Nuits à ${name}`, val, note, col: C.red, src: 'DRIAS / Météo-France' });
  }

  // ── Bloc 4 : Précipitations extrêmes (NORRRq99_yr) — universel
  const extremeRain = getLandingIndicatorValue(indicators, 'NORRRq99_yr', gwlId);
  if (extremeRain !== null && extremeRain !== undefined) {
    const { val, note } = pluiesNarrative(extremeRain, name, horizon);
    cards.push({ label: `Pluies à ${name}`, val, note, col: C.blue, src: 'DRIAS / Météo-France' });
  }

  // ── Bloc 5 : Géorisques (contextuel, horizon-aware)
  if (georisquesCard) {
    cards.push(georisquesCard);
  } else if (hasCategory('littoral') || hasCategory('littoral_atlantique')) {
    cards.push({
      label: `Submersion à ${name}`,
      val: submersionNarrative(name, horizon).val,
      col: C.blue,
      src: 'Géorisques / BRGM',
    });
  }

  // ── Bloc 6 : Cartes contextuelles statiques
  if (hasCategory('periurbain_dependance_auto') || hasCategory('rural_peri_urbain')) {
    cards.push({
      label: `Mobilité à ${name}`,
      val: `La dépendance à la voiture à ${name} expose les habitants aux hausses de coût du carburant.`,
      col: C.orange,
      src: 'INSEE / Ecolab',
    });
  }

  if (hasCategory('tourisme_urbain')) {
    cards.push({
      label: `Tourisme à ${name}`,
      val: `Les étés extrêmes pourraient fragiliser l'activité touristique locale.`,
      col: C.violet,
      src: 'INSEE / France Tourisme',
    });
  }

  if (hasCategory('vallee_industrielle')) {
    cards.push({
      label: `Air à ${name}`,
      val: `La qualité de l'air à ${name} se dégrade lors des pics de chaleur, avec une hausse de l'ozone.`,
      col: C.red,
      src: 'ATMO / Santé publique France',
    });
  }

  cards.push({
    label: `Valeur immobilière à ${name}`,
    val: immobilierNarrative(name, horizon).val,
    col: C.orange,
    src: 'DVF / ADEME',
  });

  // Cadmium GisSol — signal présent/absent, pas projective, en fin de liste
  if (gissol?.cadmium?.label) {
    const cdScore = gissol.cadmium.score ?? 0;
    const cdCol = cdScore >= 65 ? C.red : cdScore >= 45 ? C.orange : C.green;
    const cdLevel = cdScore >= 65
      ? `Les données disponibles montrent une vigilance élevée sur les sols de ${name}.`
      : cdScore >= 45
        ? `Un niveau de vigilance modéré a été relevé dans les sols autour de ${name}.`
        : `Les données disponibles montrent un niveau de vigilance faible pour les sols de ${name}.`;
    cards.push({
      label: `Qualité des sols à ${name}`,
      val: cdLevel,
      col: cdCol,
      src: 'GisSol / RMQS',
    });
  }

  const uniqueCards = [];
  const seen = new Set();

  for (const card of cards) {
    if (seen.has(card.label)) {
      continue;
    }
    seen.add(card.label);
    uniqueCards.push(card);
    if (uniqueCards.length >= 4) {
      break;
    }
  }

  return uniqueCards;
}

function getHeroCopy(communeName, categories, usedFallback) {
  const name = communeName || 'votre commune';
  const safeCategories =
    categories && categories.length > 0 ? categories : ['all'];

  const hasCategory = (category) => safeCategories.includes(category);

  if (usedFallback) {
    return `futur•e décode les données publiques pour projeter l'impact du changement climatique sur votre quotidien. Accédez à une première lecture personnalisée de l'évolution de ${name} à travers le prisme du climat, de la santé et de l'immobilier.`;
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

  return `futur•e décode les données publiques pour projeter l'impact du changement climatique sur votre quotidien. Accédez à une première lecture personnalisée de l'évolution de ${name} à travers le prisme du climat, de la santé et de l'immobilier.`;
}

function getQuestionIntro(communeName, categories, usedFallback) {
  const safeCategories =
    categories && categories.length > 0 ? categories : ['all'];
  const hasCategory = (category) => safeCategories.includes(category);
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

function getEmptyStateCopy(categories) {
  const safeCategories =
    categories && categories.length > 0 ? categories : ['all'];

  if (safeCategories.includes('littoral')) {
    return 'Le module affichera des questions liées au littoral, à la chaleur, au logement et aux projets de vie.';
  }

  if (safeCategories.includes('montagne')) {
    return "Le module affichera des questions liées à la montagne, à l'enneigement, au tourisme et à l'habitabilité.";
  }

  if (
    safeCategories.includes('periurbain_dependance_auto') ||
    safeCategories.includes('rural_peri_urbain')
  ) {
    return "Le module affichera des questions liées à la mobilité, à l'eau, au logement et à l'adaptation du territoire.";
  }

  return 'Quatre questions sélectionnées pour votre territoire apparaîtront ici.';
}

function getCommuneMetaCopy(communeName, usedFallback) {
  if (!communeName) {
    return '';
  }

  if (usedFallback) {
    return 'Une première lecture générale du territoire est déjà disponible.';
  }

  return 'Une lecture territoriale déjà enrichie est disponible.';
}

function mapBanFeature(feature) {
  const properties = feature.properties || {};

  return {
    id: `${properties.citycode || properties.id || properties.label}`,
    name: properties.city || properties.name,
    label: properties.city
      ? `${properties.city}${properties.context ? `, ${properties.context}` : ''}`
      : properties.label,
    postcode: properties.postcode || null,
    citycode: properties.citycode || null,
    context: properties.context || '',
    coordinates: feature.geometry?.coordinates || null,
  };
}

export default function FutureELanding() {
  const supabase = useRef(null);
  const answerRef = useRef(null);
  const searchWrapRef = useRef(null);

  const [selectedCommune, setSelectedCommune] = useState(null);
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState('');
  const [tensionsCatalog, setTensionsCatalog] = useState([]);
  const [communeMeta, setCommuneMeta] = useState(null);
  const [communeIndicators, setCommuneIndicators] = useState({});
  const [communeGeorisques, setCommuneGeorisques] = useState(null);
  const [communeGissol, setCommuneGissol] = useState(null);
  const [communeDataLoading, setCommuneDataLoading] = useState(false);
  const [tensions, setTensions] = useState([]);
  const [activeTension, setActiveTension] = useState(null);
  const [horizon, setHorizon] = useState<Horizon>('today');
  const [answer, setAnswer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [answerError, setAnswerError] = useState('');
  const [answerSource, setAnswerSource] = useState('');
  const [freeText, setFreeText] = useState('');
  const [questionCount, setQuestionCount] = useState(() => {
    if (typeof window === 'undefined') {
      return 0;
    }

    try {
      const raw = window.sessionStorage.getItem(LANDING_QNA_STORAGE_KEY);
      const parsed = raw ? Number.parseInt(raw, 10) : 0;
      return Number.isFinite(parsed) ? parsed : 0;
    } catch {
      return 0;
    }
  });
  const [plmHint, setPlmHint] = useState('');
  const [slotIndex, setSlotIndex] = useState(0);
  const [slotSettled, setSlotSettled] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });

  const wizardRef = useRef(null);
  const [wizardContext, setWizardContext] = useState(null);
  const [wizardCommune, setWizardCommune] = useState<{ name: string; insee: string } | null>(null);
  const openWizard = useCallback((context) => {
    setWizardContext(context);
    // Pré-remplir la commune si déjà sélectionnée dans le hero
    setWizardCommune(
      selectedCommune?.name && communeMeta?.inseeCode
        ? { name: selectedCommune.name, insee: communeMeta.inseeCode }
        : null,
    );
    setTimeout(() => wizardRef.current?.showModal(), 0);
  }, [selectedCommune, communeMeta]);

  const commune = selectedCommune?.name || '';
  const questionLimitReached = questionCount >= LANDING_QNA_LIMIT;

  function incrementQuestionCount() {
    setQuestionCount((current) => {
      const next = Math.min(current + 1, LANDING_QNA_LIMIT);
      try {
        window.sessionStorage.setItem(LANDING_QNA_STORAGE_KEY, String(next));
      } catch {}
      return next;
    });
  }

  function ensureSupabaseClient() {
    if (supabase.current) {
      return supabase.current;
    }

    try {
      supabase.current = createClient();
      return supabase.current;
    } catch (error) {
      const reason =
        error instanceof Error ? error.message : 'Configuration Supabase absente.';
      setCatalogError(`Supabase indisponible. Vérifiez les variables d'environnement. Détail : ${reason}`);
      return null;
    }
  }

  useEffect(() => {
    const onMove = (event) =>
      setMousePos({
        x: event.clientX / window.innerWidth,
        y: event.clientY / window.innerHeight,
      });

    const onClickOutside = (event) => {
      if (!searchWrapRef.current?.contains(event.target)) {
        setSuggestionsOpen(false);
      }
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('click', onClickOutside);

    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('click', onClickOutside);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadCatalog() {
      setCatalogLoading(true);
      setCatalogError('');

      const client = ensureSupabaseClient();
      if (!client) {
        setCatalogLoading(false);
        return;
      }

      const { data, error } = await client
        .from('tensions_catalog')
        .select('id, label_template, subtitle, categories, priority, color, is_active')
        .eq('is_active', true)
        .order('priority', { ascending: true });

      if (cancelled) {
        return;
      }

      if (error) {
        setCatalogError(
          "Impossible de charger les tensions depuis Supabase.",
        );
        setCatalogLoading(false);
        return;
      }

      setTensionsCatalog(
        (data || []).map((row) => ({
          id: row.id,
          label: row.label_template,
          sub: row.subtitle,
          categories: row.categories || [],
          priority: row.priority ?? 3,
          color: row.color || C.orange,
          is_active: row.is_active ?? true,
        })),
      );
      setCatalogLoading(false);
    }

    loadCatalog();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = SLOT_SCHEDULE.map(
      ([cityIdx, delay], i) =>
        setTimeout(() => {
          setSlotIndex(cityIdx);
          if (i === SLOT_SCHEDULE.length - 1) setSlotSettled(true);
        }, delay),
    );
    return () => timers.forEach(clearTimeout);
  }, []); // runs once on mount

  useEffect(() => {
    if (selectedCommune || inputValue.trim().length < 2) {
      return;
    }

    const controller = new AbortController();
    const timeout = setTimeout(async () => {
      setSearchLoading(true);
      setSearchError('');

      try {
        const response = await fetch(
          `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(
            inputValue.trim(),
          )}&type=municipality&limit=6`,
          { signal: controller.signal },
        );

        if (!response.ok) {
          throw new Error('BAN request failed');
        }

        const json = await response.json();
        const nextSuggestions = (json.features || []).map(mapBanFeature);
        setSuggestions(nextSuggestions);
        setSuggestionsOpen(true);
      } catch (error) {
        if (error.name !== 'AbortError') {
          setSearchError('Recherche BAN indisponible pour le moment.');
          setSuggestions([]);
          setSuggestionsOpen(false);
        }
      } finally {
        setSearchLoading(false);
      }
    }, 250);

    return () => {
      controller.abort();
      clearTimeout(timeout);
    };
  }, [inputValue, selectedCommune]);

  useEffect(() => {
    const section = document.getElementById('pricing');
    if (!section) return;
    let fired = false;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !fired) {
          fired = true;
          posthog.capture('pricing_page_viewed');
        }
      },
      { threshold: 0.2 },
    );
    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  async function loadCommuneTensions(nextCommune) {
    const plm = PLM_CENTRAL_CODES[nextCommune.citycode];
    if (plm) {
      setInputValue(`${plm.city} `);
      setSelectedCommune(null);
      setSuggestions([]);
      setSuggestionsOpen(false);
      setPlmHint(
        `${plm.city} est découpée en arrondissements dans nos données. Précisez votre arrondissement, par ex. « ${plm.example} ».`,
      );
      return;
    }

    setSelectedCommune(nextCommune);
    setInputValue(nextCommune.name);
    setSuggestions([]);
    setSuggestionsOpen(false);
    setActiveTension(null);
    setAnswer(null);
    setAnswerError('');
    setAnswerSource('');
    setCommuneMeta(null);
    setCommuneIndicators({});
    setCommuneGeorisques(null);
    setCommuneGissol(null);
    setCommuneDataLoading(true);

    if (tensionsCatalog.length === 0) {
      return;
    }

    const client = ensureSupabaseClient();
    if (!client) {
      return;
    }

    const queries = [];

    if (nextCommune.citycode) {
      queries.push(
        client
          .from('communes_categorization')
          .select('commune_name, insee_code, categories')
          .eq('insee_code', nextCommune.citycode)
          .maybeSingle(),
      );
    }

    queries.push(
      client
        .from('communes_categorization')
        .select('commune_name, insee_code, categories')
        .ilike('commune_name', nextCommune.name)
        .maybeSingle(),
    );

    let matchedRow = null;

    for (const query of queries) {
      const { data, error } = await query;
      if (!error && data) {
        matchedRow = data;
        break;
      }
    }

    const inseeCode = nextCommune.citycode || matchedRow?.insee_code || null;
    const categories =
      matchedRow?.categories && matchedRow.categories.length > 0
        ? matchedRow.categories
        : inseeCode
          ? deriveCategories(inseeCode)
          : ['all'];

    // usedFallback controls generic vs contextual copy: false when we have
    // meaningful categories (either from DB or derived from dept code).
    const hasContextualCategories = categories.length > 0 && !categories.every((c) => c === 'all');

    setCommuneMeta({
      inseeCode,
      categories,
      usedFallback: !matchedRow && !hasContextualCategories,
    });

    const indicatorInseeCode = nextCommune.citycode || matchedRow?.insee_code;

    if (indicatorInseeCode) {
      const [driasResult, georisquesResult, gissolResult] = await Promise.allSettled([
        fetch(`/drias?dataset=landing&insee=${indicatorInseeCode}`),
        fetch(`/georisques?insee=${indicatorInseeCode}`),
        fetch(`/api/gissol?insee=${indicatorInseeCode}`),
      ]);

      if (
        driasResult.status === 'fulfilled' &&
        driasResult.value.ok
      ) {
        try {
          const payload = await driasResult.value.json();
          const nextIndicators = {};

          for (const [scenarioId, scenarioPayload] of Object.entries(payload?.commune?.s || {})) {
            nextIndicators[scenarioId] = {};

            for (const [indicatorCode, valueNumeric] of Object.entries(scenarioPayload?.v || {})) {
              nextIndicators[scenarioId][indicatorCode] = {
                indicator_code: indicatorCode,
                value_numeric: valueNumeric,
                scenario: scenarioId,
                horizon: scenarioPayload.h,
              };
            }
          }

          setCommuneIndicators(nextIndicators);
        } catch {
          setCommuneIndicators({});
        }
      } else {
        setCommuneIndicators({});
      }

      if (
        georisquesResult.status === 'fulfilled' &&
        georisquesResult.value.ok
      ) {
        try {
          setCommuneGeorisques(await georisquesResult.value.json());
        } catch {
          setCommuneGeorisques(null);
        }
      } else {
        setCommuneGeorisques(null);
      }

      if (
        gissolResult.status === 'fulfilled' &&
        gissolResult.value.ok
      ) {
        try {
          setCommuneGissol(await gissolResult.value.json());
        } catch {
          setCommuneGissol(null);
        }
      } else {
        setCommuneGissol(null);
      }
    }

    setTensions(buildTensions(tensionsCatalog, categories));
    setCommuneDataLoading(false);
  }

  const handleInputChange = (value) => {
    setInputValue(value);
    setSearchError('');
    setPlmHint('');

    if (value.trim().length < 2) {
      setSuggestions([]);
      setSuggestionsOpen(false);
      setSearchLoading(false);
    }

    if (selectedCommune && value !== selectedCommune.name) {
      setSelectedCommune(null);
      setCommuneMeta(null);
      setCommuneIndicators({});
      setCommuneGeorisques(null);
      setCommuneGissol(null);
      setTensions([]);
      setActiveTension(null);
      setAnswer(null);
    }
  };

  const selectTension = async (tension) => {
    if (questionLimitReached || loading) {
      return;
    }

    incrementQuestionCount();
    setActiveTension(tension);
    setLoading(true);
    setAnswer(null);
    setAnswerError('');
    setAnswerSource('');

    const client = ensureSupabaseClient();
    if (!client) {
      setAnswer(getFallbackAnswer(tension.id));
      setAnswerSource('fallback_local');
      setAnswerError(
        "Supabase indisponible. Réponse locale affichée. Vérifiez les variables d'environnement côté application.",
      );
      setLoading(false);
      return;
    }

    const { data } = await client
      .from('tension_answers')
      .select('tension_id, verdict, detail, cta_label, cta_href')
      .eq('tension_id', tension.id)
      .maybeSingle();

    const supabaseAnswer = data
      ? {
          verdict: data.verdict,
          detail: data.detail,
          cta: data.cta_label,
          href: data.cta_href || '#',
        }
      : getFallbackAnswer(tension.id);

    let nextAnswer = supabaseAnswer;
    let nextAnswerSource = data ? 'supabase' : 'fallback_local';

    try {
      const response = await fetch('/qna', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          commune,
          categories: communeMeta?.categories || ['all'],
          driasContext: buildDriasContext(commune, communeIndicators),
          georisquesContext: buildGeorisquesContext(communeGeorisques),
          tension,
          fallbackAnswer: supabaseAnswer,
        }),
      });

      if (!response.ok) {
        const errorPayload = await response.json().catch(() => null);
        const errorMessage =
          errorPayload?.details ||
          errorPayload?.error ||
          `Claude request failed with status ${response.status}`;
        throw new Error(errorMessage);
      }

      const generatedAnswer = await response.json();
      if (
        generatedAnswer &&
        typeof generatedAnswer.verdict === 'string' &&
        typeof generatedAnswer.detail === 'string' &&
        typeof generatedAnswer.cta === 'string'
      ) {
        nextAnswer = {
          verdict: generatedAnswer.verdict,
          detail: generatedAnswer.detail,
          cta: generatedAnswer.cta,
          href: '#',
        };
        nextAnswerSource = 'claude';
      }
    } catch (error) {
      const reason =
        error instanceof Error ? error.message : 'Erreur inconnue côté serveur.';
      setAnswerError(
        `Claude API indisponible pour le moment. Réponse éditoriale Supabase affichée. Détail : ${reason}`,
      );
      if (!data) {
        setAnswerError(
          `Claude API indisponible et réponse Supabase absente. Fallback local affiché. Détail : ${reason}`,
        );
      }
    }

    setAnswer(nextAnswer);
    setAnswerSource(nextAnswerSource);
    setLoading(false);
    setTimeout(
      () =>
        answerRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
        }),
      100,
    );
  };

  const submitFree = () => {
    if (!freeText.trim() || questionLimitReached || loading) {
      return;
    }

    const question = freeText.trim();
    incrementQuestionCount();
    setActiveTension({ id: 'free', label: question, color: C.violet });
    setLoading(true);
    setAnswer(null);
    setAnswerError('');
    setAnswerSource('');

    const fallbackAnswer = STATIC_ANSWERS.default;
    const tension = {
      id: 'free',
      label: question,
      sub: 'Question libre',
      color: C.violet,
    };

    fetch('/qna', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        commune,
        categories: communeMeta?.categories || ['all'],
        driasContext: buildDriasContext(commune, communeIndicators),
        georisquesContext: buildGeorisquesContext(communeGeorisques),
        tension,
        fallbackAnswer,
        questionType: 'free',
        freeTextQuestion: question,
      }),
    })
      .then(async (response) => {
        if (!response.ok) {
          const errorPayload = await response.json().catch(() => null);
          const errorMessage =
            errorPayload?.details ||
            errorPayload?.error ||
            `Claude request failed with status ${response.status}`;
          throw new Error(errorMessage);
        }

        const generatedAnswer = await response.json();
        if (
          generatedAnswer &&
          typeof generatedAnswer.verdict === 'string' &&
          typeof generatedAnswer.detail === 'string' &&
          typeof generatedAnswer.cta === 'string'
        ) {
          setAnswer({
            verdict: generatedAnswer.verdict,
            detail: generatedAnswer.detail,
            cta: generatedAnswer.cta,
            href: '#',
          });
          setAnswerSource('claude');
          return;
        }

        throw new Error('Claude returned an invalid payload.');
      })
      .catch((error) => {
        const reason =
          error instanceof Error ? error.message : 'Erreur inconnue côté serveur.';
        setAnswer(fallbackAnswer);
        setAnswerSource('fallback_local');
        setAnswerError(
          `Question libre indisponible pour le moment. Réponse générale affichée. Détail : ${reason}`,
        );
      })
      .finally(() => {
        setLoading(false);
        setTimeout(
          () =>
            answerRef.current?.scrollIntoView({
              behavior: 'smooth',
              block: 'nearest',
            }),
          100,
        );
      });

    setFreeText('');
  };

  const orb1x = (mousePos.x - 0.5) * 30;
  const orb1y = (mousePos.y - 0.5) * 30;

  const styles = {
    root: {
      fontFamily: "'Instrument Sans', system-ui, sans-serif",
      background: C.bg,
      color: C.text,
      minHeight: '100vh',
      overflowX: 'hidden',
      position: 'relative',
      WebkitFontSmoothing: 'antialiased',
    },
    orb1: {
      position: 'fixed',
      width: 600,
      height: 600,
      borderRadius: '50%',
      background: `radial-gradient(circle, ${C.orange}55 0%, transparent 70%)`,
      top: -180,
      left: -150,
      filter: 'blur(100px)',
      opacity: 0.45,
      pointerEvents: 'none',
      zIndex: 0,
      transform: `translate(${orb1x}px,${orb1y}px)`,
      transition: 'transform 0.3s ease',
    },
    orb2: {
      position: 'fixed',
      width: 500,
      height: 500,
      borderRadius: '50%',
      background: `radial-gradient(circle, ${C.violet}40 0%, transparent 70%)`,
      bottom: -150,
      right: -120,
      filter: 'blur(100px)',
      opacity: 0.38,
      pointerEvents: 'none',
      zIndex: 0,
    },
    orb3: {
      position: 'fixed',
      width: 380,
      height: 380,
      borderRadius: '50%',
      background: `radial-gradient(circle, ${C.red}30 0%, transparent 70%)`,
      top: '50%',
      left: '60%',
      filter: 'blur(80px)',
      opacity: 0.22,
      pointerEvents: 'none',
      zIndex: 0,
    },
    nav: {
      position: 'sticky',
      top: 0,
      zIndex: 50,
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      background: 'var(--bg-card)',
      borderBottom: `1px solid ${C.border}`,
    },
    navInner: {
      maxWidth: 1100,
      margin: '0 auto',
      padding: '0 28px',
      height: 64,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 24,
    },
    brand: {
      fontFamily: "'Instrument Serif', serif",
      fontSize: 22,
      fontStyle: 'italic',
      color: C.text,
      letterSpacing: -0.3,
      textDecoration: 'none',
      display: 'flex',
      alignItems: 'center',
      gap: 0,
    },
    brandDot: { color: C.orange, fontStyle: 'normal' },
    navLinks: { display: 'flex', alignItems: 'center', gap: 32 },
    navLink: {
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 11,
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      color: C.muted,
      textDecoration: 'none',
      cursor: 'pointer',
    },
    navActions: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
    },
    navSecondaryLink: {
      padding: '8px 12px',
      borderRadius: 999,
      border: `1px solid ${C.border}`,
      color: C.text,
      textDecoration: 'none',
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 11,
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      background: 'var(--bg-elev)',
    },
    navCta: {
      padding: '8px 20px',
      borderRadius: 6,
      background: C.orange,
      color: C.bg,
      fontFamily: "'Instrument Sans', sans-serif",
      fontWeight: 600,
      fontSize: 13,
      border: 'none',
      cursor: 'pointer',
      textDecoration: 'none',
    },
    hero: {
      position: 'relative',
      zIndex: 2,
      maxWidth: 1100,
      margin: '0 auto',
      padding: '100px 28px 80px',
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 64,
      alignItems: 'center',
    },
    heroLeft: {},
    eyebrow: {
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 11,
      letterSpacing: '0.12em',
      textTransform: 'uppercase',
      color: C.orange,
      marginBottom: 20,
      display: 'flex',
      alignItems: 'center',
      gap: 10,
    },
    eyebrowDot: {
      width: 6,
      height: 6,
      borderRadius: '50%',
      background: C.orange,
      boxShadow: `0 0 12px ${C.orange}`,
      display: 'inline-block',
    },
    h1: {
      fontFamily: "'Instrument Serif', serif",
      fontWeight: 400,
      fontSize: 'clamp(42px,5vw,68px)',
      lineHeight: 1.06,
      letterSpacing: -1.5,
      margin: '0 0 24px',
      color: C.text,
    },
    h1Accent: { fontStyle: 'italic', color: C.orange },
    heroSub: {
      fontSize: 18,
      lineHeight: 1.65,
      color: C.muted,
      margin: '0 0 40px',
      maxWidth: 480,
    },
    searchWrap: { position: 'relative', maxWidth: 480 },
    searchInput: {
      width: '100%',
      padding: '16px 20px 16px 52px',
      borderRadius: 10,
      background: 'var(--bg-elev-2)',
      border: `1px solid ${C.border}`,
      color: C.text,
      fontSize: 16,
      fontFamily: "'Instrument Sans', sans-serif",
      outline: 'none',
      boxSizing: 'border-box',
      transition: 'border-color 0.2s, background 0.2s',
    },
    searchIcon: {
      position: 'absolute',
      left: 18,
      top: 18,
      color: C.dim,
      fontSize: 18,
      pointerEvents: 'none',
      zIndex: 2,
    },
    searchSub: {
      marginTop: 12,
      fontSize: 13,
      color: C.dim,
      fontFamily: "'JetBrains Mono', monospace",
      letterSpacing: '0.04em',
    },
    suggestionsPanel: {
      ...glass({
        borderRadius: 12,
        marginTop: 10,
        overflow: 'hidden',
      }),
      position: 'relative',
      width: '100%',
    },
    suggestionButton: {
      width: '100%',
      display: 'block',
      textAlign: 'left',
      padding: '14px 16px',
      background: 'transparent',
      border: 'none',
      borderBottom: `1px solid ${C.border}`,
      color: C.text,
      cursor: 'pointer',
    },
    suggestionTitle: {
      fontSize: 15,
      fontWeight: 500,
      marginBottom: 4,
    },
    suggestionMeta: {
      fontSize: 12,
      color: C.dim,
      fontFamily: "'JetBrains Mono', monospace",
      letterSpacing: '0.04em',
    },
    helperText: {
      marginTop: 10,
      fontSize: 12,
      color: C.dim,
    },
    heroRight: { display: 'flex', flexDirection: 'column', gap: 12 },
    previewCard: {
      ...glass({ borderRadius: 12, padding: '20px 22px' }),
      display: 'flex',
      gap: 16,
      alignItems: 'flex-start',
    },
    previewDot: (col) => ({
      width: 10,
      height: 10,
      borderRadius: '50%',
      background: col,
      boxShadow: `0 0 8px ${col}`,
      flexShrink: 0,
      marginTop: 4,
    }),
    previewTitle: {
      fontSize: 14,
      fontWeight: 500,
      color: C.text,
      marginBottom: 4,
    },
    previewSub: { fontSize: 12, color: C.dim, lineHeight: 1.5 },
    previewBadge: (col) => ({
      display: 'inline-block',
      padding: '2px 8px',
      borderRadius: 4,
      background: `${col}18`,
      border: `1px solid ${col}30`,
      fontSize: 11,
      color: col,
      fontFamily: "'JetBrains Mono', monospace",
      marginTop: 6,
    }),
    sourcesBar: {
      position: 'relative',
      zIndex: 2,
      borderTop: `1px solid ${C.border}`,
      borderBottom: `1px solid ${C.border}`,
      background: 'var(--bg-card)',
      overflow: 'hidden',
      padding: '12px 0',
    },
    sourcesTrack: {
      display: 'flex',
      gap: 48,
      whiteSpace: 'nowrap',
      animation: 'scroll-x 25s linear infinite',
    },
    sourceItem: {
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 11,
      color: C.dim,
      letterSpacing: '0.06em',
      textTransform: 'uppercase',
      flexShrink: 0,
    },
    qrSection: {
      position: 'relative',
      zIndex: 2,
      maxWidth: 860,
      margin: '0 auto',
      padding: '80px 28px',
    },
    sectionLabel: {
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 11,
      letterSpacing: '0.12em',
      textTransform: 'uppercase',
      color: C.dim,
      marginBottom: 8,
    },
    sectionTitle: {
      fontFamily: "'Instrument Serif', serif",
      fontWeight: 400,
      fontSize: 'clamp(28px,3.5vw,40px)',
      lineHeight: 1.15,
      letterSpacing: -0.5,
      margin: '0 0 8px',
      color: C.text,
    },
    sectionSub: {
      fontSize: 16,
      color: C.muted,
      margin: '0 0 36px',
      lineHeight: 1.6,
    },
    communeDisplay: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 8,
      padding: '6px 14px',
      borderRadius: 100,
      background: 'var(--orange-tint)',
      border: '1px solid var(--orange-ring)',
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 12,
      color: C.orange,
      marginBottom: 12,
      letterSpacing: '0.06em',
    },
    metaBadge: {
      display: 'block',
      marginBottom: 28,
      fontSize: 13,
      color: C.dim,
      lineHeight: 1.6,
    },
    tensionsGrid: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 12,
      marginBottom: 20,
    },
    tensionCard: (active, col, disabled = false) => ({
      ...glass({
        borderRadius: 10,
        padding: '20px 22px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        borderColor: active ? `${col}50` : C.border,
        boxShadow: active
          ? `0 0 0 1px ${col}40, 0 8px 24px ${col}15`
          : 'none',
      }),
      transition: 'all 0.2s ease',
      textAlign: 'left',
      width: '100%',
      display: 'block',
      opacity: disabled ? 0.45 : 1,
      pointerEvents: disabled ? 'none' : 'auto',
    }),
    tensionLabel: {
      fontFamily: "'Instrument Serif', serif",
      fontStyle: 'italic',
      fontSize: 17,
      color: C.text,
      lineHeight: 1.3,
      marginBottom: 6,
    },
    tensionSub: {
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 11,
      color: C.dim,
      letterSpacing: '0.04em',
      lineHeight: 1.4,
    },
    tensionArrow: (col) => ({
      fontSize: 14,
      color: col,
      marginTop: 10,
      display: 'block',
    }),
    freeWrap: { display: 'flex', gap: 10, marginBottom: 32 },
    freeInput: {
      flex: 1,
      padding: '14px 18px',
      borderRadius: 8,
      background: 'var(--bg-elev-2)',
      border: `1px solid ${C.border}`,
      color: C.text,
      fontSize: 15,
      fontFamily: "'Instrument Sans', sans-serif",
      outline: 'none',
    },
    freeBtn: (disabled = false) => ({
      padding: '14px 24px',
      borderRadius: 8,
      background: C.orange,
      color: C.bg,
      fontWeight: 600,
      fontSize: 14,
      border: 'none',
      cursor: disabled ? 'not-allowed' : 'pointer',
      whiteSpace: 'nowrap',
      fontFamily: "'Instrument Sans', sans-serif",
      opacity: disabled ? 0.45 : 1,
    }),
    answerBox: {
      ...glass({
        borderRadius: 12,
        padding: '28px 32px',
        borderColor: activeTension ? `${activeTension?.color || C.orange}40` : C.border,
      }),
    },
    answerLoading: {
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      color: C.muted,
      fontSize: 15,
    },
    spinner: {
      width: 18,
      height: 18,
      border: `2px solid ${C.border}`,
      borderTop: `2px solid ${C.orange}`,
      borderRadius: '50%',
      animation: 'spin 0.8s linear infinite',
    },
    verdict: {
      fontFamily: "'Instrument Serif', serif",
      fontStyle: 'italic',
      fontSize: 22,
      lineHeight: 1.3,
      color: C.text,
      marginBottom: 16,
      paddingBottom: 16,
      borderBottom: `1px solid ${C.border}`,
    },
    detail: {
      fontSize: 16,
      lineHeight: 1.72,
      color: C.muted,
      marginBottom: 24,
    },
    answerCta: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 10,
      padding: '12px 24px',
      borderRadius: 8,
      background: C.orange,
      color: C.bg,
      fontWeight: 600,
      fontSize: 14,
      textDecoration: 'none',
      cursor: 'pointer',
      border: 'none',
      fontFamily: "'Instrument Sans', sans-serif",
    },
    questionLimitNote: {
      marginBottom: 20,
      padding: '14px 16px',
      borderRadius: 10,
      background: 'var(--orange-tint)',
      border: '1px solid var(--orange-ring)',
      color: C.orange,
      fontSize: 14,
      lineHeight: 1.6,
    },
    paywallSecondary: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '13px 18px',
      borderRadius: 10,
      background: 'transparent',
      border: `1px solid ${C.border}`,
      color: C.text,
      fontWeight: 500,
      fontSize: 14,
      textDecoration: 'none',
    },
    amnesieSection: {
      position: 'relative',
      zIndex: 2,
      maxWidth: 860,
      margin: '0 auto',
      padding: '40px 28px 80px',
    },
    amnesieInner: {
      ...glass({
        borderRadius: 16,
        padding: '48px 52px',
        borderColor: 'var(--orange-tint)',
      }),
      position: 'relative',
      overflow: 'hidden',
    },
    amnesieEyebrow: {
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 11,
      letterSpacing: '0.12em',
      textTransform: 'uppercase',
      color: C.orange,
      marginBottom: 20,
    },
    amnesieTitle: {
      fontFamily: "'Instrument Serif', serif",
      fontWeight: 400,
      fontSize: 'clamp(26px,3vw,38px)',
      lineHeight: 1.2,
      letterSpacing: -0.5,
      margin: '0 0 24px',
      color: C.text,
    },
    amnesieBody: {
      fontSize: 17,
      lineHeight: 1.75,
      color: C.muted,
      margin: '0 0 20px',
    },
    amnesieHighlight: {
      ...glass({
        borderRadius: 8,
        padding: '18px 22px',
        borderColor: 'var(--orange-tint-2)',
        borderLeft: `2px solid ${C.orange}`,
        marginTop: 28,
      }),
      fontFamily: "'Instrument Serif', serif",
      fontStyle: 'italic',
      fontSize: 18,
      lineHeight: 1.6,
      color: C.text,
    },
    amnesieVisualWrap: {
      ...glass({
        borderRadius: 16,
        padding: 8,
        borderColor: 'var(--border-1)',
      }),
      marginTop: 24,
      position: 'relative',
      overflow: 'hidden',
      boxShadow: '0 24px 80px rgba(0,0,0,0.24)',
    },
    amnesieVisualInner: {
      position: 'relative',
      width: '100%',
      aspectRatio: '16 / 9',
      minHeight: 260,
      borderRadius: 12,
      overflow: 'hidden',
    },
    modulesSection: {
      position: 'relative',
      zIndex: 2,
      maxWidth: 1100,
      margin: '0 auto',
      padding: '80px 28px',
    },
    modulesGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3,1fr)',
      gap: 16,
    },
    moduleCard: (col) => ({
      ...glass({ borderRadius: 12, padding: '28px 26px' }),
      borderTop: `2px solid ${col}`,
      cursor: 'default',
    }),
    moduleIcon: (col) => ({
      width: 36,
      height: 36,
      borderRadius: 8,
      background: `${col}18`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 18,
      marginBottom: 16,
      border: `1px solid ${col}25`,
    }),
    moduleName: {
      fontFamily: "'Instrument Serif', serif",
      fontWeight: 400,
      fontSize: 20,
      color: C.text,
      marginBottom: 8,
    },
    moduleDesc: {
      fontSize: 14,
      color: C.muted,
      lineHeight: 1.6,
      marginBottom: 16,
    },
    moduleItems: { display: 'flex', flexDirection: 'column', gap: 6 },
    moduleItem: (col) => ({
      fontSize: 12,
      color: C.dim,
      paddingLeft: 12,
      borderLeft: `1px solid ${col}30`,
      lineHeight: 1.5,
      fontFamily: "'JetBrains Mono', monospace",
      letterSpacing: '0.02em',
    }),
    pricingSection: {
      position: 'relative',
      zIndex: 2,
      maxWidth: 1100,
      margin: '0 auto',
      padding: '80px 28px',
    },
    pricingGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3,1fr)',
      gap: 16,
      marginTop: 40,
    },
    planCard: (accent) => ({
      ...glass({ borderRadius: 14, padding: '32px 28px' }),
      position: 'relative',
      borderColor: accent ? `${C.orange}40` : C.border,
    }),
    planBadge: {
      position: 'absolute',
      top: -12,
      left: '50%',
      transform: 'translateX(-50%)',
      padding: '4px 14px',
      borderRadius: 100,
      background: C.orange,
      color: C.bg,
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 11,
      fontWeight: 600,
      letterSpacing: '0.06em',
      whiteSpace: 'nowrap',
    },
    planPrice: {
      fontFamily: "'Instrument Serif', serif",
      fontSize: 40,
      fontWeight: 400,
      color: C.text,
      letterSpacing: -1,
    },
    planPriceSub: {
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 11,
      color: C.dim,
      marginLeft: 4,
      letterSpacing: '0.04em',
    },
    planName: {
      fontFamily: "'Instrument Serif', serif",
      fontStyle: 'italic',
      fontSize: 20,
      color: C.text,
      margin: '12px 0 4px',
    },
    planDesc: {
      fontSize: 14,
      color: C.muted,
      lineHeight: 1.6,
      marginBottom: 24,
    },
    planFeatures: {
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
      marginBottom: 28,
    },
    planFeature: {
      fontSize: 14,
      color: C.muted,
      display: 'flex',
      gap: 10,
      alignItems: 'flex-start',
    },
    planCheck: { color: C.green, flexShrink: 0, marginTop: 1 },
    planBtn: (accent) => ({
      width: '100%',
      padding: '13px',
      borderRadius: 8,
      background: accent ? C.orange : 'var(--bg-elev-3)',
      color: accent ? C.bg : C.text,
      fontWeight: 600,
      fontSize: 14,
      border: accent ? 'none' : `1px solid ${C.border}`,
      cursor: 'pointer',
      fontFamily: "'Instrument Sans', sans-serif",
      transition: 'opacity 0.2s',
    }),
    footer: {
      position: 'relative',
      zIndex: 2,
      borderTop: `1px solid ${C.border}`,
      padding: '40px 28px',
      maxWidth: 1100,
      margin: '0 auto',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 20,
    },
    footerBrand: {
      fontFamily: "'Instrument Serif', serif",
      fontStyle: 'italic',
      fontSize: 18,
      color: C.text,
    },
    footerLinks: { display: 'flex', gap: 28 },
    footerLink: {
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 11,
      color: C.dim,
      letterSpacing: '0.06em',
      textDecoration: 'none',
      textTransform: 'uppercase',
      cursor: 'pointer',
    },
  };

  const MODULES = [
    {
      name: 'Quartier',
      icon: '🏘',
      color: C.blue,
      desc: 'Ce que votre territoire devient face aux aléas climatiques.',
      items: [
        'Canicule et jours extrêmes',
        'Submersion et inondations',
        'Risque incendie',
        'Érosion littorale',
      ],
    },
    {
      name: 'Logement',
      icon: '🏠',
      color: C.orange,
      desc: 'Ce que votre habitat devient : confort, risques, valeur.',
      items: [
        'DPE et réglementation future',
        'Risques physiques par adresse',
        "Coût d'assurance projeté",
        'Valeur immobilière à 20 ans',
      ],
    },
    {
      name: 'Métier',
      icon: '💼',
      color: C.violet,
      desc: 'Ce que le changement climatique fait à votre secteur.',
      items: [
        'Résilience sectorielle',
        'Exposition à la chaleur',
        'Transformations structurelles',
        'Opportunités émergentes',
      ],
    },
    {
      name: 'Santé',
      icon: '🫁',
      color: C.red,
      desc: 'Ce que votre environnement fait à votre corps.',
      items: [
        'Canicule et vulnérabilité',
        'Cadmium et métaux lourds',
        'Pollens et saison allongée',
        "Qualité de l'eau potable",
      ],
    },
    {
      name: 'Mobilité',
      icon: '🚗',
      color: C.green,
      desc: 'Votre dépendance à la voiture et vos alternatives réelles.',
      items: [
        'Part voiture sur le territoire',
        'Alternatives de transport',
        'Coût carburant et fragilité',
        'Transition électrique : si pertinente',
      ],
    },
    {
      name: 'Projets',
      icon: '🗓',
      color: C.blue,
      desc: 'Vos décisions de vie à moyen terme, éclairées.',
      items: [
        'Achat immobilier',
        'Déménagement, vers où',
        'Projet familial',
        'Retraite et territoire',
      ],
    },
  ];

  const SOURCES = [
    'DRIAS / Météo-France',
    'Géorisques / BRGM',
    'ANSES',
    'Santé publique France',
    'GisSol / RMQS',
    'INSEE / Ecolab',
    'RNSA',
    'EFSA',
    'ADEME',
    'Copernicus',
    'transport.data.gouv.fr',
    'IRVE, data.gouv',
    'ACPR / Banque de France',
    'ARS',
    'PhytAtmo / AASQA',
    'INRAE',
  ];

  const activeSlotCity = SLOT_CITIES[slotIndex];
  const previewCommune = commune || activeSlotCity.name;
  const isDev = process.env.NODE_ENV !== 'production';
  const activeCategories = communeMeta?.categories || ['all'];
  const heroCopy = getHeroCopy(
    previewCommune,
    activeCategories,
    communeMeta?.usedFallback,
  );
  const questionIntro = commune
    ? getQuestionIntro(commune, activeCategories, communeMeta?.usedFallback)
    : 'Saisissez votre commune ci-dessus pour voir les questions qui correspondent à votre territoire.';
  const emptyStateCopy = getEmptyStateCopy(activeCategories);
  const communeMetaCopy = getCommuneMetaCopy(
    commune,
    communeMeta?.usedFallback,
  );
  const previewCards = commune
    ? getPreviewCards(commune, activeCategories, communeIndicators, communeGeorisques, communeGissol, horizon)
    : activeSlotCity.cards;
  // Clé d'animation : change à chaque étape du slot, puis à chaque sélection de commune
  const slotAnimKey = commune ? `c-${commune}` : slotSettled ? 'settled' : `s-${slotIndex}`;

  return (
    <div style={styles.root}>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes scroll-x { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        @keyframes breathe { 0%,100% { transform:scale(1); } 50% { transform:scale(1.08) translate(10px,-15px); } }
        .orb2-anim { animation: breathe 12s ease-in-out infinite; }
        .tension-card:hover { transform: translateY(-2px); }
        input::placeholder { color: var(--fg-4); }
        input:focus { border-color: var(--orange-ring) !important; background: var(--bg-elev-3) !important; }
        .answer-anim { animation: fadeIn 0.4s ease; }
        .plan-btn:hover { opacity: 0.88; }
        .suggestion-row:last-child { border-bottom: none !important; }
        @keyframes slot-spin-kf {
          from { transform: translateY(-28px); filter: blur(10px); opacity: 0; }
          to   { transform: translateY(0);     filter: blur(0);    opacity: 1; }
        }
        @keyframes slot-settle-kf {
          0%   { transform: translateY(-32px); filter: blur(7px); opacity: 0; }
          65%  { transform: translateY(5px);   filter: blur(0);   opacity: 1; }
          100% { transform: translateY(0);     filter: blur(0);   opacity: 1; }
        }
        @keyframes slot-card-spin-kf {
          from { transform: translateY(-20px); filter: blur(7px); opacity: 0; }
          to   { transform: translateY(0);     filter: blur(0);   opacity: 1; }
        }
        @keyframes slot-card-settle-kf {
          0%   { transform: translateY(-24px); filter: blur(5px); opacity: 0; }
          65%  { transform: translateY(4px);   filter: blur(0);   opacity: 1; }
          100% { transform: translateY(0);     filter: blur(0);   opacity: 1; }
        }
        @keyframes hero-loading-sweep {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(350%); }
        }
        .slot-spin         { display:inline-block; animation: slot-spin-kf      1.1s cubic-bezier(0.2,0,0.4,1) both; }
        .slot-settle       { display:inline-block; animation: slot-settle-kf    1.3s cubic-bezier(0.2,0.8,0.3,1) both; }
        .slot-card-spin    { animation: slot-card-spin-kf   1.1s cubic-bezier(0.2,0,0.4,1) both; }
        .slot-card-settle  { animation: slot-card-settle-kf 1.3s cubic-bezier(0.2,0.8,0.3,1) both; }
        @media (prefers-reduced-motion: reduce) {
          .slot-spin, .slot-settle, .slot-card-spin, .slot-card-settle { animation: none; }
        }
        .savoir-hub-card:hover { border-color: var(--border-hi) !important; background: var(--bg-elev-3) !important; }
        @media (max-width:768px) {
          .hero-grid { grid-template-columns: 1fr !important; }
          .hero-right { display: none !important; }
          .modules-grid { grid-template-columns: 1fr !important; }
          .pricing-grid { grid-template-columns: 1fr !important; }
          .tensions-grid { grid-template-columns: 1fr !important; }
          .amnesie-inner { padding: 28px 24px !important; }
          .hero-section { padding: 60px 20px 40px !important; }
          .qr-section { padding: 60px 20px !important; }
          .free-wrap { flex-direction: column !important; }
          .savoir-hub-grid { grid-template-columns: 1fr 1fr !important; }
        }
        @media (max-width:480px) {
          .savoir-hub-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <div style={styles.orb1} />
      <div style={styles.orb2} className="orb2-anim" />
      <div style={styles.orb3} />

      <Navbar />

      <section style={{ position: 'relative', zIndex: 2 }}>
        <div style={styles.hero} className="hero-grid hero-section">
          <div style={styles.heroLeft}>
            <div style={styles.eyebrow}>
              <span style={styles.eyebrowDot} />
              Données publiques · Lecture locale · Projection personnalisée
            </div>
            <h1 style={styles.h1}>
              Votre vie à{' '}
              <span
                key={slotAnimKey}
                style={styles.h1Accent}
                className={commune || slotSettled ? 'slot-settle' : 'slot-spin'}
              >
                {previewCommune}
              </span>
              {' '}en 2050.
            </h1>
            <p style={styles.heroSub}>{heroCopy}</p>

            <div style={styles.searchWrap} ref={searchWrapRef}>
              <span style={styles.searchIcon}>⌖</span>
              <input
                id="commune-input"
                style={styles.searchInput}
                placeholder="Saisissez votre commune…"
                value={inputValue}
                onChange={(event) => handleInputChange(event.target.value)}
                onFocus={() => {
                  if (suggestions.length > 0) {
                    setSuggestionsOpen(true);
                  }
                }}
              />

              {suggestionsOpen && suggestions.length > 0 && (
                <div style={styles.suggestionsPanel}>
                  {suggestions.map((suggestion) => (
                    <button
                      key={suggestion.id}
                      className="suggestion-row"
                      style={styles.suggestionButton}
                      onClick={() => loadCommuneTensions(suggestion)}
                    >
                      <div style={styles.suggestionTitle}>{suggestion.name}</div>
                      <div style={styles.suggestionMeta}>
                        {suggestion.postcode ? `${suggestion.postcode} · ` : ''}
                        {suggestion.context}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <p style={styles.searchSub}>
              Tapez votre commune pour faire apparaître les premières questions qui comptent vraiment ici.
            </p>
            <div style={styles.helperText}>
              {catalogLoading && 'Préparation des questions…'}
              {!catalogLoading && catalogError && catalogError}
              {!catalogLoading && !catalogError && searchLoading && 'Recherche en cours…'}
              {!catalogLoading && !catalogError && searchError && searchError}
            </div>

            {plmHint && (
              <div style={{
                marginTop: 10,
                padding: '10px 14px',
                borderRadius: 8,
                background: 'var(--orange-tint)',
                border: '1px solid var(--orange-tint-2)',
                fontSize: 13,
                color: C.orange,
                lineHeight: 1.5,
              }}>
                {plmHint}
              </div>
            )}

          </div>

          <div style={styles.heroRight} className="hero-right">
            {commune && (
              <HorizonSwitch value={horizon} onChange={setHorizon} />
            )}
            {communeDataLoading && (
              <div style={{ position: 'relative', height: 2, borderRadius: 1, background: 'rgba(255,255,255,0.06)', overflow: 'hidden', marginBottom: 6 }}>
                <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '40%', background: 'linear-gradient(90deg, transparent, #fb923c, transparent)', animation: 'hero-loading-sweep 1.4s ease-in-out infinite' }} />
              </div>
            )}
            {previewCards.map((item, index) => (
              <div
                key={`${slotAnimKey}-${index}`}
                className={commune || slotSettled ? 'slot-card-settle' : 'slot-card-spin'}
                style={{
                  ...styles.previewCard,
                  opacity: 1 - index * 0.08,
                  animationDelay: `${index * 35}ms`,
                }}
              >
                <div style={styles.previewDot(item.col)} />
                <div>
                  <div style={styles.previewTitle}>{item.label}</div>
                  <div style={{ ...styles.previewSub, opacity: communeDataLoading ? 0.35 : 1, transition: 'opacity 0.4s' }}>{item.val}</div>
                </div>
              </div>
            ))}

            {commune && (
              <div style={{
                marginTop: 4,
                paddingTop: 16,
                borderTop: '1px solid rgba(255,255,255,0.06)',
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
              }}>
                <p style={{
                  fontFamily: "'Instrument Sans', system-ui, sans-serif",
                  fontSize: 12,
                  color: C.muted,
                  lineHeight: 1.5,
                  margin: 0,
                }}>
                  Ces projections ne sont qu'un aperçu de ce qui pourrait changer à {commune}.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                  <a
                    href="/checkout/rapport-complet"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '9px 14px',
                      borderRadius: 8,
                      background: 'rgba(200,184,154,0.10)',
                      border: '1px solid rgba(200,184,154,0.22)',
                      fontFamily: "'Instrument Sans', system-ui, sans-serif",
                      fontSize: 12,
                      fontWeight: 600,
                      color: '#c8b89a',
                      textDecoration: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    Explorer le rapport complet <span>→</span>
                  </a>
                  <a
                    href="/comparateur"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      padding: '8px 14px',
                      borderRadius: 8,
                      background: 'transparent',
                      border: '1px solid rgba(255,255,255,0.07)',
                      fontFamily: "'Instrument Sans', system-ui, sans-serif",
                      fontSize: 12,
                      fontWeight: 400,
                      color: C.muted,
                      cursor: 'pointer',
                      textDecoration: 'none',
                    }}
                  >
                    Comparer une autre commune
                  </a>
                </div>
                <p style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 9,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  color: C.dim,
                  lineHeight: 1,
                  margin: 0,
                }}>
                  50+ indicateurs climatiques, sanitaires et territoriaux
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      <div style={styles.sourcesBar}>
        <div style={{ display: 'flex' }}>
          <div style={styles.sourcesTrack}>
            {[...SOURCES, ...SOURCES].map((source, index) => (
              <span key={index} style={styles.sourceItem}>
                <span style={{ color: C.orange, marginRight: 6 }}>·</span>
                {source}
              </span>
            ))}
          </div>
        </div>
      </div>

      <section style={styles.qrSection} className="qr-section">
        <div style={styles.sectionLabel}>Première lecture</div>
        <h2 style={styles.sectionTitle}>
          {commune ? `Vos questions sur ${commune}` : 'Vos questions sur votre commune'}
        </h2>
        <p style={styles.sectionSub}>{questionIntro}</p>

        {commune && (
          <>
            <div style={styles.communeDisplay}>⌖ {commune}</div>
            <div style={styles.metaBadge}>{communeMetaCopy}</div>
          </>
        )}

        {commune && tensions.length > 0 && (
          <>
            {questionLimitReached && (
              <div style={styles.questionLimitNote}>
                Vous avez utilisé vos deux questions gratuites. Le Suivi arrive bientôt — inscrivez-vous pour être prévenu·e à l&apos;ouverture.
              </div>
            )}

            <div style={styles.tensionsGrid} className="tensions-grid">
              {tensions.map((tension) => {
                const { sub, isDriasProjectable } = getDriaSub(
                  tension.id,
                  horizon,
                  communeIndicators,
                  commune,
                  tension.sub,
                );
                return (
                  <button
                    key={tension.id}
                    className="tension-card"
                    style={styles.tensionCard(
                      activeTension?.id === tension.id,
                      tension.color,
                      questionLimitReached || loading,
                    )}
                    disabled={questionLimitReached || loading}
                    onClick={() => selectTension(tension)}
                  >
                    <div style={styles.tensionLabel}>
                      {tension.label.replace('{commune}', commune)}
                    </div>
                    <div style={styles.tensionSub}>{sub}</div>
                    <span style={styles.tensionArrow(tension.color)}>→</span>
                  </button>
                );
              })}
            </div>

            <div style={styles.freeWrap} className="free-wrap">
              <input
                style={styles.freeInput}
                placeholder="Ou posez votre propre question sur votre commune…"
                value={freeText}
                onChange={(event) => setFreeText(event.target.value)}
                disabled={questionLimitReached || loading}
                onKeyDown={(event) => event.key === 'Enter' && submitFree()}
              />
              <button
                style={styles.freeBtn(questionLimitReached || loading)}
                onClick={submitFree}
                disabled={questionLimitReached || loading}
              >
                Poser →
              </button>
            </div>

            {answerError && isDev && (
              <div style={{ ...styles.metaBadge, marginBottom: 16 }}>{answerError}</div>
            )}

            {!loading && answerSource && isDev && (
              <div style={{ ...styles.metaBadge, marginBottom: 16 }}>
                Source de la réponse :{' '}
                {answerSource === 'claude'
                  ? 'Claude API'
                  : answerSource === 'supabase'
                    ? 'Supabase'
                    : 'fallback local'}
              </div>
            )}

            {(loading || answer) && (
              <div ref={answerRef} style={styles.answerBox} className="answer-anim">
                {loading ? (
                  <div style={styles.answerLoading}>
                    <div style={styles.spinner} />
                    <span>Analyse des données pour {commune}…</span>
                  </div>
                ) : (
                  answer && (
                    <>
                      <div style={styles.verdict}>« {answer.verdict} »</div>
                      <p style={styles.detail}>{answer.detail}</p>
                      <button
                        type="button"
                        style={{ ...styles.answerCta, border: 'none', cursor: 'pointer' }}
                        onClick={() => {
                          const cta = answer.cta || '';
                          const ctx =
                            cta.includes('Santé') ? 'sante' :
                            cta.includes('Mobilité') ? 'mobilite' :
                            cta.includes('Métier') ? 'metier' :
                            cta.includes('Logement') ? 'logement' :
                            cta.includes('Projets') ? 'projets' : 'quartier';
                          openWizard(ctx);
                        }}
                      >
                        Générer mon rapport personnalisé →
                      </button>
                      {questionLimitReached && (
                        <Link href="/suivi-bientot" style={{ ...styles.paywallSecondary, marginLeft: 10 }}>
                          Être prévenu·e à l&apos;ouverture du Suivi
                        </Link>
                      )}
                    </>
                  )
                )}
              </div>
            )}
          </>
        )}

        {!commune && (
          <div
            style={{
              ...glass({ borderRadius: 12, padding: '40px 32px' }),
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 32, marginBottom: 16 }}>⌖</div>
            <div
              style={{
                fontFamily: "'Instrument Serif', serif",
              fontStyle: 'italic',
              fontSize: 20,
              color: C.muted,
              marginBottom: 8,
            }}
          >
              <button
                type="button"
                onClick={() => {
                  const el = document.getElementById('commune-input');
                  if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); el.focus(); }
                }}
                style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: 'inherit', fontStyle: 'italic', fontSize: 'inherit', color: C.accent, textDecoration: 'underline', textUnderlineOffset: 3 }}
              >
                Saisissez votre commune.
              </button>
            </div>
            <div style={{ fontSize: 14, color: C.dim }}>
              {emptyStateCopy}
            </div>
          </div>
        )}
      </section>

      <section style={styles.modulesSection}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div
            style={{
              ...styles.sectionLabel,
              justifyContent: 'center',
              display: 'flex',
            }}
          >
            6 modules
          </div>
          <h2 style={{ ...styles.sectionTitle, textAlign: 'center' }}>
            Six dimensions de votre vie
          </h2>
          <p
            style={{
              ...styles.sectionSub,
              textAlign: 'center',
              margin: '0 auto',
              maxWidth: 560,
            }}
          >
            Chaque module croise votre profil avec les données publiques
            disponibles pour votre commune.
          </p>
        </div>
        <div style={styles.modulesGrid} className="modules-grid">
          {MODULES.map((module) => (
            <div key={module.name} style={styles.moduleCard(module.color)}>
              <div style={styles.moduleIcon(module.color)}>{module.icon}</div>
              <div style={styles.moduleName}>{module.name}</div>
              <div style={styles.moduleDesc}>{module.desc}</div>
              <div style={styles.moduleItems}>
                {module.items.map((item) => (
                  <div key={item} style={styles.moduleItem(module.color)}>
                    {item}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

 {/* ── CTA Rapport personnalisé ── */}
      <div style={{ position: 'relative', zIndex: 2, maxWidth: 1100, margin: '0 auto', padding: '0 28px 80px' }}>
        <div style={{
          ...glass({ borderRadius: 20, padding: '48px 52px' }),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 40,
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', top: -70, right: -70,
            width: 260, height: 260, borderRadius: '50%',
            background: `radial-gradient(circle, ${C.orange}18 0%, transparent 70%)`,
            pointerEvents: 'none',
          }} />
          <div style={{ maxWidth: 540 }}>
            <div style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 10, letterSpacing: '0.14em',
              textTransform: 'uppercase', color: C.orange, marginBottom: 10,
            }}>
              Rapport personnalisé
            </div>
            <h2 style={{
              fontFamily: "'Instrument Serif', serif",
              fontWeight: 400,
              fontSize: 'clamp(22px, 2.4vw, 30px)',
              lineHeight: 1.2, letterSpacing: '-0.4px',
              color: C.text, margin: '0 0 10px',
            }}>
              Votre rapport en 2 minutes.
            </h2>
            <p style={{ fontSize: 15, color: C.muted, lineHeight: 1.65, margin: 0 }}>
              Répondez à 6 questions. Obtenez un aperçu personnalisé de vos expositions climatiques — logement, métier, santé, mobilité, projets.
            </p>
          </div>
          <div style={{ flexShrink: 0, textAlign: 'center' }}>
            <button
              type="button"
              onClick={() => openWizard('quartier')}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: 8, padding: '14px 28px', borderRadius: 12,
                background: C.orange, color: C.bg,
                fontFamily: "'Instrument Sans', sans-serif",
                fontWeight: 600, fontSize: 15,
                border: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
              }}
            >
              Obtenir mon rapport personnalisé
            </button>
            <p style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 10, color: C.dim,
              letterSpacing: '0.04em', marginTop: 10,
            }}>
              Gratuit · Sans inscription · Résultat partiel immédiat
            </p>
          </div>
        </div>
      </div>

      <section style={styles.amnesieSection}>
        <div style={styles.amnesieInner} className="amnesie-inner">
          <div
            style={{
              position: 'absolute',
              top: -60,
              right: -60,
              width: 250,
              height: 250,
              borderRadius: '50%',
              background: `radial-gradient(circle, ${C.orange}20 0%, transparent 70%)`,
              pointerEvents: 'none',
            }}
          />
          <div style={styles.amnesieEyebrow}>Pourquoi s&apos;abonner</div>
          <h2 style={styles.amnesieTitle}>
            Votre inquiétude mérite une présence calme, toute l&apos;année.
          </h2>
          <p style={styles.amnesieBody}>
            Chaque semaine, une nouvelle alerte. Le cadmium dans les céréales.
            Les pics de pollution. La canicule qui arrive. Les incendies.
            Les inondations.
          </p>
          <p style={styles.amnesieBody}>
            Vous lisez. Vous vous inquiétez. Puis l&apos;actualité passe à
            autre chose, et vous aussi.
          </p>
          <p style={styles.amnesieBody}>
            Ce n&apos;est pas un manque de volonté. La capacité
            d&apos;inquiétude est limitée, c&apos;est documenté. Quand elle se
            remplit d&apos;un sujet, elle se vide d&apos;un autre. Le
            changement climatique, comme les risques sanitaires qui
            l&apos;accompagnent, souffre de cette forme particulière
            d&apos;invisibilité : il n&apos;est pas nié, il est oublié par
            cycles.
          </p>
          <p style={styles.amnesieBody}>
            Le problème, c&apos;est que ces risques ne disparaissent pas quand
            l&apos;attention s&apos;efface. Ils progressent. Ils concernent
            votre commune, votre logement, l&apos;air que respirent vos
            enfants, la valeur de ce que vous possédez, les décisions que vous
            n&apos;avez pas encore prises.
          </p>
          <div style={styles.amnesieVisualWrap}>
            <div style={styles.amnesieVisualInner}>
              <Image
                src="/future-territoire-landing.jpg"
                alt="Vue urbaine au crépuscule à travers une fenêtre ouverte"
                fill
                sizes="(max-width: 900px) 100vw, 860px"
                style={{
                  objectFit: 'cover',
                  objectPosition: 'center center',
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background:
                    'linear-gradient(180deg, rgba(6,8,18,0.02) 0%, rgba(6,8,18,0.14) 100%)',
                  pointerEvents: 'none',
                }}
              />
            </div>
          </div>
          <div style={styles.amnesieHighlight}>
            futur•e existe pour combler cet intervalle. Pas une alarme de plus
            : une présence calme, continue, qui traduit les données publiques
            en lecture personnalisée pour votre vie. Comme vous suivez votre
            santé ou vos finances : sans obsession, sans oubli.
          </div>
        </div>
      </section>

      {/* Hub Savoir */}
      <section
        style={{
          position: 'relative',
          zIndex: 2,
          maxWidth: 1100,
          margin: '0 auto',
          padding: '80px 28px',
        }}
      >
        <div style={{ marginBottom: 48 }}>
          <div
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 11,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: C.orange,
              marginBottom: 14,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: C.orange,
                display: 'inline-block',
              }}
            />
            Hub · Articles publiés
          </div>
          <h2
            style={{
              fontFamily: "'Instrument Serif', serif",
              fontSize: 'clamp(26px, 3vw, 38px)',
              fontWeight: 400,
              color: C.text,
              margin: '0 0 12px',
              lineHeight: 1.2,
            }}
          >
            Comprendre les risques <em style={{ color: C.orange, fontStyle: 'italic' }}>de demain</em>
          </h2>
          <p
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 13,
              color: C.dim,
              margin: 0,
              maxWidth: 540,
            }}
          >
            Des analyses fondées sur des données publiques — DRIAS, GisSol, INSEE, Géorisques.
          </p>
        </div>

        <div
          className="savoir-hub-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 16,
          }}
        >
          {SAVOIR_HUB_ARTICLES.map((article) => (
            <Link
              key={article.slug}
              href={article.href}
              style={{ textDecoration: 'none' }}
            >
              <div
                className="savoir-hub-card"
                style={{
                  background: 'var(--bg-elev)',
                  border: '1px solid var(--border-1)',
                  borderRadius: 12,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'border-color 0.2s, background 0.2s',
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                  boxSizing: 'border-box',
                  overflow: 'hidden',
                }}
              >
                {article.image && (
                  <div style={{ position: 'relative', height: 156, flexShrink: 0 }}>
                    <Image
                      src={article.image}
                      alt={article.title}
                      fill
                      style={{ objectFit: 'cover' }}
                      sizes="(max-width: 480px) 100vw, (max-width: 768px) 50vw, 25vw"
                    />
                    <div style={{
                      position: 'absolute', inset: 0,
                      background: 'linear-gradient(to bottom, transparent 40%, var(--bg-elev) 100%)',
                    }} />
                  </div>
                )}

                <div style={{ padding: '18px 20px 20px', display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
                  <div
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 9,
                      letterSpacing: '0.14em',
                      textTransform: 'uppercase',
                      color: article.accent,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <span
                      style={{
                        width: 5,
                        height: 5,
                        borderRadius: '50%',
                        background: article.accent,
                        display: 'inline-block',
                        flexShrink: 0,
                      }}
                    />
                    {article.category}
                  </div>

                  <div
                    style={{
                      fontFamily: "'Instrument Serif', serif",
                      fontSize: 17,
                      fontWeight: 400,
                      color: 'var(--fg-1)',
                      lineHeight: 1.3,
                      flex: 1,
                    }}
                  >
                    {article.title}
                  </div>

                  <p
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 11,
                      color: 'var(--fg-4)',
                      margin: 0,
                      lineHeight: 1.6,
                    }}
                  >
                    {article.description}
                  </p>

                  <div
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 11,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      color: article.accent,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      marginTop: 'auto',
                    }}
                  >
                    Lire
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M2.5 6H9.5M6.5 3L9.5 6L6.5 9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Lead magnet Comparateur ── */}
      <section style={{ position: 'relative', zIndex: 2, maxWidth: 1100, margin: '0 auto', padding: '0 28px 80px' }}>
        <div style={{
          ...glass({ borderRadius: 20, padding: '52px 56px' }),
          position: 'relative', overflow: 'hidden',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 56,
          alignItems: 'center',
        }}>

          <div style={{
            position: 'absolute', bottom: -100, right: -80,
            width: 320, height: 320, borderRadius: '50%',
            background: `radial-gradient(circle, ${C.red}12 0%, transparent 70%)`,
            pointerEvents: 'none',
          }} />

          {/* Colonne gauche — texte */}
          <div>
            <div style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 10, letterSpacing: '0.14em',
              textTransform: 'uppercase', color: C.red, marginBottom: 16,
            }}>
              Outil gratuit · sans inscription
            </div>

            <h2 style={{
              fontFamily: "'Instrument Serif', serif",
              fontWeight: 400,
              fontSize: 'clamp(26px, 2.6vw, 38px)',
              lineHeight: 1.12, letterSpacing: '-0.5px',
              color: C.text, margin: '0 0 20px',
            }}>
              10 indicateurs pour départager deux communes objectivement<br />
              <em style={{ fontStyle: 'italic', color: C.red }}>dans quelques années</em>
            </h2>

            <p style={{
              fontSize: 15, color: C.muted, lineHeight: 1.72,
              margin: '0 0 28px', maxWidth: 420,
            }}>
              Canicule, inondation, qualité de l&apos;air, cadmium, dépendance automobile...
              comparez deux communes sur ce qui change vraiment à l&apos;horizon 2050.
              Quatre dimensions gratuites. Six supplémentaires avec le Suivi.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                'Données DRIAS, INSEE, Géorisques, ATMO',
                'Résultat en moins de dix secondes',
                'Lecture en clair, sans jargon technique',
              ].map((label) => (
                <div key={label} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 11, color: C.dim, letterSpacing: '0.03em',
                }}>
                  <span style={{
                    width: 4, height: 4, borderRadius: '50%',
                    background: C.red, flexShrink: 0, display: 'inline-block',
                  }} />
                  {label}
                </div>
              ))}
            </div>
          </div>

          {/* Colonne droite — saisie + CTA */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <style>{`
              .lm-label { font-family: 'JetBrains Mono', monospace; font-size: 10px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--fg-4); margin-bottom: 6px; display: block; }
              .lm-input-wrap { position: relative; }
              .lm-input { width: 100%; padding: 14px 16px; border-radius: 10px; border: 1px solid var(--border-1); background: var(--bg-elev); color: var(--fg-1); font-family: 'Instrument Sans', sans-serif; font-size: 15px; transition: border-color 0.2s; outline: none; }
              .lm-input:focus { border-color: var(--red, #f87171); }
              .lm-input::placeholder { color: var(--fg-4); }
              .lm-dropdown { position: absolute; top: calc(100% + 4px); left: 0; right: 0; z-index: 50; background: var(--bg-elev-3); border: 1px solid var(--border-1); border-radius: 10px; overflow: hidden; box-shadow: 0 8px 24px rgba(0,0,0,0.18); }
              .lm-row { width: 100%; display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; border: none; background: transparent; cursor: pointer; text-align: left; border-bottom: 1px solid var(--border-1); transition: background 0.12s; }
              .lm-row:last-child { border-bottom: none; }
              .lm-row:hover { background: var(--bg-elev); }
              .lm-row-name { font-family: 'Instrument Sans', sans-serif; font-size: 14px; color: var(--fg-1); }
              .lm-row-meta { font-family: 'JetBrains Mono', monospace; font-size: 11px; color: var(--fg-4); }
              .lm-cta { width: 100%; padding: 15px 24px; border-radius: 10px; border: none; background: var(--red, #f87171); color: #fff; font-family: 'Instrument Sans', sans-serif; font-weight: 600; font-size: 15px; cursor: pointer; transition: opacity 0.15s; display: flex; align-items: center; justify-content: center; gap: 10px; }
              .lm-cta:disabled { opacity: 0.4; cursor: default; }
              .lm-cta:not(:disabled):hover { opacity: 0.88; }
              .lm-secondary { width: 100%; padding: 13px 24px; border-radius: 10px; border: 1px solid var(--border-1); background: transparent; color: var(--fg-3); font-family: 'JetBrains Mono', monospace; font-size: 11px; letter-spacing: 0.06em; cursor: pointer; text-align: center; text-decoration: none; display: block; transition: color 0.15s, border-color 0.15s; }
              .lm-secondary:hover { color: var(--fg-1); border-color: var(--border-2); }
              @media (max-width: 720px) {
                .lm-comparator-grid { grid-template-columns: 1fr !important; gap: 36px !important; }
              }
            `}</style>

            <LandingComparatorInput />
          </div>

        </div>
      </section>

      <section id="pricing" style={styles.pricingSection}>
        <div style={{ textAlign: 'center', marginBottom: 0 }}>
          <div
            style={{
              ...styles.sectionLabel,
              justifyContent: 'center',
              display: 'flex',
            }}
          >
            Tarifs
          </div>
          <h2
            style={{
              ...styles.sectionTitle,
              textAlign: 'center',
              marginBottom: 8,
            }}
          >
            Choisissez votre formule
          </h2>
          <p
            style={{
              ...styles.sectionSub,
              textAlign: 'center',
              margin: '0 auto 40px',
              maxWidth: 500,
            }}
          >
            Un rapport gratuit pour commencer. Un abonnement si vous voulez que
            le suivi dure.
          </p>
        </div>
        <div style={styles.pricingGrid} className="pricing-grid">
          <div style={styles.planCard(false)}>
            <div style={styles.planPrice}>
              0<span style={styles.planPriceSub}>€</span>
            </div>
            <div style={styles.planName}>Découverte</div>
            <div style={styles.planDesc}>
              Un rapport partiel pour voir ce que futur•e peut faire pour vous.
            </div>
            <div style={styles.planFeatures}>
              {[
                'Saisie de commune et profil simplifié',
                'Rapport partiel (1 module)',
                '3 pages Savoir thématiques',
                'Lien de partage temporaire 72h',
              ].map((feature) => (
                <div key={feature} style={styles.planFeature}>
                  <span style={styles.planCheck}>✓</span>
                  {feature}
                </div>
              ))}
            </div>
            <Link
              style={styles.planBtn(false)}
              className="plan-btn"
              href="/inscription"
            >
              Commencer gratuitement
            </Link>
          </div>

          <div
            style={{
              ...styles.planCard(false),
              borderColor: `${C.green}40`,
              boxShadow: '0 0 0 1px var(--green-soft), 0 16px 48px var(--green-tint)',
            }}
          >
            <div
              style={{
                ...styles.planBadge,
                background: C.green,
                color: C.bg,
              }}
            >
              Disponible maintenant
            </div>
            <div style={styles.planPrice}>
              14<span style={styles.planPriceSub}>€ une fois</span>
            </div>
            <div style={styles.planName}>Rapport complet</div>
            <div style={styles.planDesc}>
              Le rapport intégral, téléchargeable, à conserver.
            </div>
            <div style={styles.planFeatures}>
              {[
                'Rapport complet PDF (6 modules)',
                'Dashboard simplifié en lecture seule',
                'Régénération 1 fois par an',
                'Les 14 € seront déduits à l\'ouverture du Suivi (prochainement).',
              ].map((feature) => (
                <div key={feature} style={styles.planFeature}>
                  <span style={styles.planCheck}>✓</span>
                  {feature}
                </div>
              ))}
            </div>
            <Link
              style={{
                ...styles.planBtn(true),
                background: C.green,
                color: C.bg,
              }}
              className="plan-btn"
              href="/checkout/rapport-complet"
            >
              Acheter le rapport — 14 €
            </Link>
          </div>

          <div
            style={{
              ...styles.planCard(true),
              boxShadow:
                '0 0 0 1px var(--orange-ring), 0 16px 48px var(--orange-tint)',
            }}
          >
            <div style={styles.planBadge}>À venir</div>
            <div style={styles.planPrice}>
              9<span style={styles.planPriceSub}>€ / mois</span>
            </div>
            <div style={styles.planName}>Suivi</div>
            <div style={styles.planDesc}>
              Le rapport vit avec vous. Les alertes arrivent quand vos données
              changent.
            </div>
            <div style={styles.planFeatures}>
              {[
                'Dashboard complet et interactif',
                'Profil modifiable à tout moment',
                'Newsletter mensuelle personnalisée',
                'Notifications ciblées sur événements',
                'Comparateur de villes (exclusif Foyer)',
                'Historique des mises à jour',
              ].map((feature) => (
                <div key={feature} style={styles.planFeature}>
                  <span style={{ color: C.orange, flexShrink: 0, marginTop: 1 }}>
                    ✓
                  </span>
                  {feature}
                </div>
              ))}
            </div>
            <Link
              style={styles.planBtn(true)}
              className="plan-btn"
              href="/suivi-bientot"
            >
              Être prévenu·e à l&apos;ouverture
            </Link>
          </div>
        </div>
      </section>

      <footer style={{ borderTop: `1px solid ${C.border}`, position: 'relative', zIndex: 2 }}>
        <div style={styles.footer}>
          <div style={styles.footerBrand}>
            futur<span style={{ color: C.orange }}>•</span>e
          </div>
          <div style={styles.footerLinks}>
            {['Manifeste', 'Méthodologie', 'Pages Savoir', 'Contact', 'Mentions légales'].map((label) => (
              <a key={label} style={styles.footerLink} href="#">
                {label}
              </a>
            ))}
            <a style={styles.footerLink} href="/politique-confidentialite">
              Confidentialité
            </a>
            <CookieSettingsLink style={styles.footerLink} />
            <a style={{ ...styles.footerLink, opacity: 0.5 }} href="/professionnels">
              Professionnels
            </a>
          </div>
          <div
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 11,
              color: C.dim,
              letterSpacing: '0.04em',
            }}
          >
            Données publiques françaises · Aucune publicité
          </div>
        </div>
      </footer>

      {/* Dialog Wizard — top-layer via showModal(), DOM position ne change pas le rendu */}
      <ReportWizard ref={wizardRef} initialContext={wizardContext} initialCommune={wizardCommune} />
    </div>
  );
}
