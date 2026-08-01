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
import { deriveCategories } from '@/lib/commune-categories';
import { deCommune } from '@/lib/typography';
import posthog from 'posthog-js';
import { HorizonSwitch, type Horizon } from '@/components/HorizonSwitch';
import HeroProjetTerritoires from '@/components/HeroProjetTerritoires';

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
      { label: 'Mobilité à Lyon',      val: 'Métro, tram et train dessinent un quotidien moins dépendant de la voiture à Lyon.',  col: C.violet, src: 'INSEE MOBPRO / SNCF' },
      { label: 'Vie locale à Lyon',    val: 'Commerces, écoles et vie associative restent denses dans le quotidien lyonnais.',    col: C.green,  src: 'INSEE BPE / RNA' },
      { label: 'Nuits tropicales',      val: 'Les nuits sans fraîcheur, celles où l\'on ne récupère pas, seront plus fréquentes à Lyon.', col: C.red, src: 'DRIAS · +4°C' },
    ],
  },
  {
    name: 'Marseille',
    cards: [
      { label: 'Chaleur à Marseille',   val: 'Les projections placent Marseille parmi les communes les plus exposées aux étés futurs.',  col: C.red,    src: 'DRIAS · +4°C' },
      { label: 'Nature à Marseille',     val: 'Entre mer et calanques, l\'accès à la nature pèse dans le quotidien marseillais.',           col: C.green,  src: 'OSM / IGN' },
      { label: 'Mobilité à Marseille',   val: 'Au quotidien, se déplacer à Marseille tient encore beaucoup à la voiture.',                      col: C.violet, src: 'INSEE MOBPRO' },
      { label: 'Submersion à Marseille', val: 'Marseille figure parmi les communes exposées au risque de submersion.',                           col: C.blue,   src: 'Géorisques / BRGM' },
    ],
  },
  {
    name: 'Vannes',
    cards: [
      { label: 'Canicule à Vannes',     val: 'D\'ici 2050, les étés à Vannes seront sensiblement plus chauds qu\'aujourd\'hui.',          col: C.red,    src: 'DRIAS · +4°C' },
      { label: 'Vie locale à Vannes',   val: 'À taille humaine, Vannes garde un centre dense en commerces et en services.',                col: C.green,  src: 'INSEE BPE' },
      { label: 'Mobilité à Vannes',     val: 'Courtes distances : à Vannes, une partie des trajets du quotidien se fait à pied ou à vélo.', col: C.violet, src: 'INSEE MOBPRO' },
      { label: 'Littoral à Vannes',     val: 'Vannes figure parmi les communes exposées au risque de submersion.',                          col: C.blue,   src: 'Géorisques / BRGM' },
    ],
  },
  {
    name: 'La Rochelle',
    cards: [
      { label: 'Submersion à La Rochelle', val: 'La Rochelle figure parmi les communes exposées au risque de submersion.',                     col: C.blue,   src: 'Géorisques / BRGM' },
      { label: 'Mobilité à La Rochelle',   val: 'La Rochelle reste une ville où le vélo tient une vraie place dans les trajets.',             col: C.violet, src: 'INSEE MOBPRO' },
      { label: 'Nature à La Rochelle',     val: 'Océan, marais et parcs : l\'accès à la nature marque le quotidien rochelais.',               col: C.green,  src: 'OSM / IGN' },
      { label: 'Chaleur à La Rochelle',    val: 'Les fortes chaleurs devraient devenir plus fréquentes à La Rochelle.',                        col: C.red,    src: 'DRIAS · +4°C' },
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
// Persiste la commune choisie pour la restaurer au retour arrière (navigation
// dure vers /ou-vivre puis « précédent »), sinon on repart à zéro.
const LANDING_COMMUNE_STORAGE_KEY = 'futuree:landing-commune';

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
      "Sur le littoral, le risque de submersion et d'érosion progresse, et le coût de l'assurance habitation grimpe dans les zones exposées. L'achat reste viable, à condition de regarder le risque à l'adresse, la qualité énergétique du logement (diagnostic de performance énergétique) et son assurabilité dans la durée. Le choix du quartier change tout.",
    cta: 'Voir le rapport interactif sur votre commune',
  },
  enfants_sante: {
    verdict: 'Plusieurs signaux méritent votre attention.',
    detail:
      "La santé des enfants face au climat se joue sur quelques fronts : la qualité de l'air, l'allongement de la saison pollinique, le nombre de jours de forte chaleur qui augmente, et selon les territoires la qualité des sols. Rien d'irrémédiable, mais autant connaître la situation de votre commune tôt pour agir au bon moment.",
    cta: 'Voir le module Territoire de votre rapport interactif',
  },
  mobilite_fragile: {
    verdict: "Ici, la place de la voiture mérite d'être posée.",
    detail:
      "Dans beaucoup de communes rurales et périurbaines, la voiture n'est pas un choix : l'offre de transport collectif reste limitée et les trajets du quotidien sont longs. Cette dépendance expose directement le budget des foyers à la volatilité du prix des carburants. Les alternatives, vélo, covoiturage, recharge électrique, dépendent fortement du territoire.",
    cta: "Voir le module Autour de l'adresse de votre rapport interactif",
  },
  metier_general: {
    verdict: "Ça dépend du secteur. Certains gagnent, d'autres perdent.",
    detail:
      "Le secteur associatif et de l'ESS sera relativement peu exposé aux risques physiques directs, mais fortement affecté par l'évolution des financements et des priorités. Les métiers liés à l'adaptation climatique (bilan carbone, transition énergétique) sont en forte croissance. Les secteurs à exposition extérieure (BTP, agriculture) sont les plus vulnérables à la chaleur croissante (INRS).",
    cta: 'Voir le module Territoire de votre rapport interactif',
  },
  valeur_immo: {
    verdict: "Moins risqué que ce qu'on raconte, mais pas sans condition.",
    detail:
      'Les zones exposées aux risques documentés (PPRi, RGA, submersion) voient déjà leurs prix stagner ou baisser par rapport à des zones similaires sans risque (DVF 2024). Le DPE devient un facteur de valeur majeur : un logement F ou G se négocie en moyenne 6 à 15 % moins cher que son équivalent C (ADEME). À l\'horizon 2030, les obligations de rénovation énergétique rendront certains biens quasi invendables sans travaux.',
    cta: 'Voir le module Logement de votre rapport interactif',
  },
  default: {
    verdict: 'Les données pour cette commune pointent plusieurs signaux.',
    detail:
      "Un rapport interactif croise les données climatiques, sanitaires, immobilières et professionnelles pour votre commune et votre profil spécifique. Ce que futur•e fait, c'est transformer ces données publiques en lecture lisible et personnalisée, pour que vous puissiez décider, pas seulement vous inquiéter.",
    cta: 'Générer votre rapport interactif',
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

// Famille « vie / territoire » : les questions en tension qui ne sont ni climat ni
// risque (calme, transports, croissance, vie locale, départ de la ville). Sans
// règle de diversité, les questions climat (prioritaires et nombreuses) saturent
// les 4 slots et celles-ci ne surfacent jamais. On leur RÉSERVE un slot.
const TERRITORY_TENSION_IDS = new Set([
  'calme_infra',
  'tc_sansvoiture',
  'croissance_transformation',
  'vielocale_reelle',
  'quitter_ville',
]);

// Dédup par préfixe d'id (avant le premier « _ ») : évite 5 variantes « Acheter à X ? ».
function dedupeByPrefix(tensions) {
  const seen = new Set();
  const result = [];
  for (const tension of tensions) {
    const key = tension.id.split('_')[0];
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(tension);
  }
  return result;
}

const MAX_TENSIONS = 4;

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

  const deduped = dedupeByPrefix(matching);
  const isTerritory = (t) => TERRITORY_TENSION_IDS.has(t.id);
  const bestTerritory = deduped.find(isTerritory) ?? null;

  // Règle de diversité : le climat reste dominant (3 slots), mais si une question
  // « vie / territoire » s'applique, on lui garantit le dernier slot plutôt que
  // de laisser une 4e question climat le prendre.
  const result = [];
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

function getPreviewCards(communeName, categories, indicators, georisques, gissol, horizon: Horizon = 'today') {
  const name = communeName || 'votre commune';
  const safeCategories =
    categories && categories.length > 0 ? categories : ['all'];

  const hasCategory = (category) => safeCategories.includes(category);
  const hasAny = (...cats) => cats.some((category) => safeCategories.includes(category));

  const gwlId = HORIZON_TO_GWL[horizon] ?? 'gwl15';

  // ── Cartes CLIMAT (par ordre de priorité) ─────────────────────────
  // La canicule sévère reste l'accroche : toujours en position 1.
  const climate = [];
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
  const depth = [];
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
  const fillers = [];
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
  const result = [];
  const pushUnique = (card) => {
    if (card && !result.some((c) => c.label === card.label)) result.push(card);
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

function getHeroCopy(communeName, categories, usedFallback) {
  const name = communeName || 'votre commune';
  const safeCategories =
    categories && categories.length > 0 ? categories : ['all'];

  const hasCategory = (category) => safeCategories.includes(category);

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
  const [communeFieldOpen, setCommuneFieldOpen] = useState(false);
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
  const orb1Ref = useRef(null);

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

  // Retour en haut au montage : en navigation client (Link), App Router restaure
  // la position de scroll précédente. Au retour depuis /ou-vivre, ça tombait au
  // milieu (les modules) car la home se remonte avec une autre mise en page.
  // On force le haut, après la restauration du routeur (rAF).
  useEffect(() => {
    const id = window.requestAnimationFrame(() => window.scrollTo(0, 0));
    return () => window.cancelAnimationFrame(id);
  }, []);

  // Ancre douce : quand une commune est saisie depuis le hero, on amène l'œil
  // sur « Première lecture » (ses questions), là où est l'interaction forte.
  // L'effet ne se déclenche qu'aux transitions de commune (commune part de '').
  // restoringRef : une restauration au montage (retour arrière) ne doit PAS
  // déclencher le scroll, sinon la page recharge déjà scrollée vers le bas.
  const firstReadRef = useRef<HTMLElement>(null);
  const restoringRef = useRef(false);
  useEffect(() => {
    if (!commune) return;
    if (restoringRef.current) { restoringRef.current = false; return; }
    if (typeof window !== 'undefined'
      && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      return;
    }
    const id = window.requestAnimationFrame(() => {
      firstReadRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    return () => window.cancelAnimationFrame(id);
  }, [commune]);

  // Restauration de la commune au montage : une fois le catalogue de tensions
  // chargé, on rejoue loadCommuneTensions(sauvegarde) pour réhydrater commune +
  // indicateurs + tensions. restoringRef coupe le scroll auto (pas de saut au
  // chargement). Lecture en effet (jamais au SSR) → pas de mismatch d'hydratation.
  const didRestoreRef = useRef(false);
  useEffect(() => {
    if (didRestoreRef.current || tensionsCatalog.length === 0 || selectedCommune) return;
    let saved: { name?: string; citycode?: string } | null = null;
    try {
      const raw = window.sessionStorage.getItem(LANDING_COMMUNE_STORAGE_KEY);
      if (raw) saved = JSON.parse(raw);
    } catch {}
    if (!saved?.name) return;
    didRestoreRef.current = true;
    restoringRef.current = true;
    setCommuneFieldOpen(true);
    loadCommuneTensions(saved);
  }, [tensionsCatalog, selectedCommune]);

  // Seconde voie du hero : révèle le champ commune (replié par défaut) et y place
  // le curseur. La voie principale reste « Trouver où vivre » vers le parcours.
  const openCommuneField = useCallback(() => {
    setCommuneFieldOpen(true);
    setTimeout(() => {
      const el = document.getElementById('commune-input');
      if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); el.focus(); }
    }, 60);
  }, []);
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
    // Parallaxe orb1 pilotée hors React : on coalesce les mousemove en une seule
    // mise à jour par frame (rAF) appliquée directement au DOM. Évite de re-render
    // tout le composant à chaque micro-mouvement de souris (cause de jank, surtout
    // au-dessus des cartes glass de bas de page).
    let raf = 0;
    let nx = 0;
    let ny = 0;
    const onMove = (event) => {
      nx = (event.clientX / window.innerWidth - 0.5) * 30;
      ny = (event.clientY / window.innerHeight - 0.5) * 30;
      if (!raf) {
        raf = requestAnimationFrame(() => {
          raf = 0;
          if (orb1Ref.current) orb1Ref.current.style.transform = `translate(${nx}px, ${ny}px)`;
        });
      }
    };

    const onClickOutside = (event) => {
      if (!searchWrapRef.current?.contains(event.target)) {
        setSuggestionsOpen(false);
      }
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('click', onClickOutside);

    return () => {
      if (raf) cancelAnimationFrame(raf);
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
    // Persiste la sélection pour la restaurer au retour arrière.
    try {
      window.sessionStorage.setItem(
        LANDING_COMMUNE_STORAGE_KEY,
        JSON.stringify(nextCommune),
      );
    } catch {}
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
    // Catégorisation manuelle (44 communes affinées à la main) prioritaire ; sinon
    // on tire les catégories de la VRAIE donnée commune via /api/landing-signals
    // (index A), au lieu du préfixe département qui laissait dormir le catalogue.
    let categories: string[];
    if (matchedRow?.categories && matchedRow.categories.length > 0) {
      categories = matchedRow.categories;
    } else if (inseeCode) {
      try {
        const res = await fetch(`/api/landing-signals?insee=${inseeCode}`);
        const payload = res.ok ? await res.json() : null;
        categories = Array.isArray(payload?.categories) && payload.categories.length > 0
          ? payload.categories
          : deriveCategories(inseeCode); // repli dept si l'endpoint échoue
      } catch {
        categories = deriveCategories(inseeCode);
      }
    } else {
      categories = ['all'];
    }

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
      try { window.sessionStorage.removeItem(LANDING_COMMUNE_STORAGE_KEY); } catch {}
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
          inseeCode: communeMeta?.inseeCode ?? null,
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
      opacity: 0.45,
      pointerEvents: 'none',
      zIndex: 0,
      transform: 'translate(0px, 0px)',
      transition: 'transform 0.3s ease',
      willChange: 'transform',
    },
    orb2: {
      position: 'fixed',
      width: 500,
      height: 500,
      borderRadius: '50%',
      background: `radial-gradient(circle, ${C.violet}40 0%, transparent 70%)`,
      bottom: -150,
      right: -120,
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
    heroCtaRow: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: 12,
      marginBottom: 24,
    },
    heroCtaPrimary: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '14px 28px',
      borderRadius: 10,
      background: C.orange,
      color: C.bg,
      fontFamily: "'Instrument Sans', sans-serif",
      fontWeight: 600,
      fontSize: 15,
      textDecoration: 'none',
    },
    heroCtaSecondary: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '14px 24px',
      borderRadius: 10,
      background: 'var(--bg-elev)',
      border: `1px solid ${C.border}`,
      color: C.text,
      fontFamily: "'Instrument Sans', sans-serif",
      fontWeight: 600,
      fontSize: 15,
      cursor: 'pointer',
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
      // perf : fond opaque sans backdrop-filter (le verre dépoli au-dessus des orbs
      // fixes coûtait très cher au scroll sur GPU faible — cf. bas de page lourd)
      background: 'var(--bg-card)',
      backdropFilter: 'none',
      WebkitBackdropFilter: 'none',
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
      background: 'var(--bg-card)',
      backdropFilter: 'none',
      WebkitBackdropFilter: 'none',
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
      background: 'var(--bg-card)',
      backdropFilter: 'none',
      WebkitBackdropFilter: 'none',
      marginTop: 24,
      position: 'relative',
      overflow: 'hidden',
      boxShadow: '0 24px 80px rgba(0,0,0,0.24)',
    },
    amnesieVisualInner: {
      position: 'relative',
      width: '100%',
      aspectRatio: '21 / 9',
      minHeight: 200,
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
    // Trois cartes tiennent sur UNE ligne (elles étaient six sur deux) : chacune reçoit plus de
    // place, donc plus d'air. Le padding vertical monte pour que la ligne ne paraisse pas écrasée
    // sous le titre de section.
    moduleCard: (col) => ({
      ...glass({ borderRadius: 12, padding: '32px 28px 30px' }),
      borderTop: `2px solid ${col}`,
      cursor: 'default',
      display: 'flex',
      flexDirection: 'column',
    }),
    // Bandeau d'échelle : le numéro d'ordre puis le grain de lecture, en mono, dans la couleur du
    // module. C'est le seul endroit de la page où l'emboîtement commune > secteur > bâti se lit
    // d'un coup d'œil.
    moduleScale: (col) => ({
      display: 'flex',
      alignItems: 'center',
      gap: 7,
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 10.5,
      letterSpacing: '0.12em',
      textTransform: 'uppercase',
      color: col,
      marginBottom: 18,
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
    // `marginTop: auto` colle les listes au bas des cartes : les descriptions n'ont pas la même
    // longueur, et sans ça les quatre lignes de sujets partaient à des hauteurs différentes d'une
    // carte à l'autre.
    moduleItems: { display: 'flex', flexDirection: 'column', gap: 7, marginTop: 'auto' },
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
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      textDecoration: 'none',
      boxSizing: 'border-box',
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

  // TROIS MODULES = TROIS ÉCHELLES EMBOÎTÉES (bascule du 29/07/2026). Chaque carte porte son
  // échelle (`scale`) : c'est elle qui fait comprendre la structure au premier coup d'œil, bien
  // avant la liste des sujets. Les anciens modules par domaine de vie (Métier, Santé, Mobilité,
  // Projets) n'ont pas disparu comme sujets, ils sont traités à l'échelle qui les concerne.
  const MODULES = [
    {
      name: 'Territoire',
      scale: 'La commune',
      icon: '🏘',
      color: C.blue,
      desc: "Ce qui structure la vie ici et ce qui la transforme : les services, la population, la nature, et la trajectoire du climat.",
      items: [
        'Accès aux services essentiels',
        'Population, vacance, résidences secondaires',
        'Espaces naturels et boisement',
        'Chaleur, eau, feux, littoral',
      ],
    },
    {
      name: "Autour de l'adresse",
      scale: 'Le voisinage',
      icon: '🚶',
      color: C.green,
      desc: "Ce qui se trouve à proximité, ce qui manque, et ce qui distingue ce secteur du reste de la commune.",
      items: [
        'Commerces, école, santé, gare',
        'Espace vert le plus proche',
        'Îlot de chaleur du quartier',
        'Ce que la voiture pèse ici',
      ],
    },
    {
      name: 'Logement',
      scale: 'Le bâtiment',
      icon: '🏠',
      color: C.orange,
      desc: "Ce que son diagnostic établit, ce à quoi son adresse l'expose, et ce qu'il reste à demander avant de signer.",
      items: [
        'Diagnostic et confort d’été',
        'Sol de la parcelle, sismicité, cavités',
        'Zone réglementée, sinistres indemnisés',
        'À vérifier avant de décider',
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
        @media (max-width:1024px) and (min-width:769px) {
          .pricing-grid { grid-template-columns: repeat(2,1fr) !important; }
        }
        @media (max-width:768px) {
          .hero-grid { grid-template-columns: 1fr !important; }
          /* La preuve produit du hero ne disparaît plus sur téléphone : elle passe sous le titre,
             réduite à ses deux premières cartes. C'est la seule donnée réelle de la commune que
             voit un visiteur mobile avant de scroller. */
          .hero-right { margin-top: 32px; }
          .hero-preview-extra { display: none !important; }
          .modules-grid { grid-template-columns: 1fr !important; }
          .pricing-grid { grid-template-columns: 1fr !important; }
          .lifecompare-grid { grid-template-columns: 1fr !important; gap: 32px !important; padding: 32px 22px !important; }
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

      <div ref={orb1Ref} style={styles.orb1} />
      <div style={styles.orb2} />
      <div style={styles.orb3} />

      <Navbar />

      <section style={{ position: 'relative', zIndex: 2 }}>
        <div style={styles.hero} className="hero-grid hero-section">
          <div style={styles.heroLeft}>
            <div style={styles.eyebrow}>
              <span style={styles.eyebrowDot} />
              Données publiques · Lecture locale · Projection personnalisée
            </div>
            <h1 style={styles.h1}>Où vivre demain ?</h1>
            <p style={styles.heroSub}>
              {commune
                ? heroCopy
                : "Comparez les territoires français selon votre projet de vie, des services du quotidien jusqu'au climat de demain."}
            </p>

            {/* Deux entrées : trouver où vivre (parcours, voie principale) ou
                analyser une commune précise (seconde voie, champ replié). */}
            <div style={styles.heroCtaRow}>
              <Link href="/ou-vivre" style={styles.heroCtaPrimary}>
                Trouver où vivre
              </Link>
              <button
                type="button"
                onClick={openCommuneField}
                style={styles.heroCtaSecondary}
              >
                Analyser ma commune
              </button>
            </div>

            {(communeFieldOpen || commune) && (
              <>
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
                  Saisissez une commune précise pour en lire les premières questions qui comptent ici.
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
              </>
            )}

          </div>

          <div style={styles.heroRight} className="hero-right">
            {commune && (
              <HorizonSwitch value={horizon} onChange={setHorizon} />
            )}
            {communeDataLoading && (
              <div style={{ position: 'relative', height: 2, borderRadius: 1, background: 'var(--bg-elev-3)', overflow: 'hidden', marginBottom: 6 }}>
                <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '40%', background: 'linear-gradient(90deg, transparent, #fb923c, transparent)', animation: 'hero-loading-sweep 1.4s ease-in-out infinite' }} />
              </div>
            )}
            {/* `hero-preview-extra` porte les cartes 3 et 4 : sur téléphone, la preuve produit se
                réduit aux deux premières (l'accroche climat, puis la carte de profondeur) plutôt
                que de disparaître entièrement comme avant. Voir la media query 768 px. */}
            {previewCards.map((item, index) => (
              <div
                key={`${slotAnimKey}-${index}`}
                className={`${commune || slotSettled ? 'slot-card-settle' : 'slot-card-spin'}${index >= 2 ? ' hero-preview-extra' : ''}`}
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
                borderTop: '1px solid var(--border-1)',
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
                  Ces projections ne sont qu&apos;un aperçu de ce qui pourrait changer à {commune}. futur•e croise près de 30 critères (cadre de vie, santé, mobilité, climat) avec votre profil.
                </p>
                <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: 7 }}>
                  <button
                    type="button"
                    onClick={() => openWizard('quartier')}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '8px 12px',
                      borderRadius: 8,
                      background: 'rgba(200,184,154,0.10)',
                      border: '1px solid rgba(200,184,154,0.22)',
                      fontFamily: "'Instrument Sans', system-ui, sans-serif",
                      fontSize: 12,
                      fontWeight: 600,
                      color: '#c8b89a',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    Créer mon rapport interactif →
                  </button>
                  <Link
                    href="/ou-vivre"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      padding: '8px 12px',
                      borderRadius: 8,
                      background: 'transparent',
                      border: '1px solid var(--border-1)',
                      fontFamily: "'Instrument Sans', system-ui, sans-serif",
                      fontSize: 12,
                      fontWeight: 400,
                      color: C.muted,
                      cursor: 'pointer',
                      textDecoration: 'none',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    Comparer selon mon projet de vie
                  </Link>
                </div>
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

      {/* Quand une commune est saisie, on remonte « Première lecture » (les
          questions sur la commune) au-dessus de l'encart comparateur : on veut
          d'abord laisser l'utilisateur questionner sa commune et découvrir le
          produit. Sans commune, l'ordre par défaut met le comparateur en tête. */}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
      {/* ── Encart : comparateur de projet de vie (voie principale) ── */}
      <section style={{ position: 'relative', zIndex: 2, maxWidth: 1100, margin: '0 auto', padding: '56px 28px 16px', order: commune ? 2 : 1 }}>
        <div style={{
          ...glass({ borderRadius: 20, padding: '52px 56px' }),
          position: 'relative', overflow: 'hidden',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 56,
          alignItems: 'start',
        }} className="lifecompare-grid">
          <div style={{
            position: 'absolute', bottom: -100, right: -80,
            width: 320, height: 320, borderRadius: '50%',
            background: `radial-gradient(circle, ${C.orange}14 0%, transparent 70%)`,
            pointerEvents: 'none',
          }} />

          {/* Colonne gauche : texte */}
          <div>
            <div style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 10, letterSpacing: '0.14em',
              textTransform: 'uppercase', color: C.orange, marginBottom: 16,
            }}>
              Trouver où vivre · sans inscription
            </div>
            <h2 style={{
              fontFamily: "'Instrument Serif', serif",
              fontWeight: 400,
              fontSize: 'clamp(26px, 2.6vw, 38px)',
              lineHeight: 1.12, letterSpacing: '-0.5px',
              color: C.text, margin: '0 0 20px',
            }}>
              Décrivez votre projet de vie,<br />
              <em style={{ fontStyle: 'italic', color: C.orange }}>futur•e cherche les territoires qui s&apos;en approchent</em>
            </h2>
            <p style={{
              fontSize: 15, color: C.muted, lineHeight: 1.72,
              margin: '0 0 28px', maxWidth: 420,
            }}>
              Vous écrivez ce qui compte pour vous : le quotidien, vos contraintes, ce à quoi
              vous tenez. futur•e les confronte aux données publiques de chaque territoire et
              fait remonter ceux qui y répondent le mieux, du cadre de vie au climat de demain.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                '34 000 communes, près de 30 critères',
                'Cadre de vie, services, mobilité, santé, climat',
                'Une lecture en langage clair, sans jargon',
              ].map((label) => (
                <div key={label} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 11, color: C.dim, letterSpacing: '0.03em',
                }}>
                  <span style={{
                    width: 4, height: 4, borderRadius: '50%',
                    background: C.orange, flexShrink: 0, display: 'inline-block',
                  }} />
                  {label}
                </div>
              ))}
            </div>
          </div>

          {/* Colonne droite : animation projet de vie -> territoires + CTA */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'stretch' }}>
            <HeroProjetTerritoires />
            <Link href="/ou-vivre" style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              padding: '15px 28px', borderRadius: 10,
              background: C.orange, color: C.bg,
              fontFamily: "'Instrument Sans', sans-serif", fontWeight: 600, fontSize: 15,
              textDecoration: 'none',
            }}>
              Trouver où vivre →
            </Link>
          </div>
        </div>
      </section>

      <section ref={firstReadRef} style={{ ...styles.qrSection, order: commune ? 1 : 2 }} className="qr-section">
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
                      {/* Justification commerciale explicite : pourquoi aller plus loin. */}
                      <p style={{ fontSize: 13.5, color: C.dim, lineHeight: 1.55, margin: '0 0 16px' }}>
                        Cette réponse reste générale. Le rapport tient compte de votre logement,
                        de votre situation et de votre projet de vie.
                      </p>
                      {/* Deux portes au même niveau : analyser cette commune (rapport) OU
                          en trouver de meilleures (comparateur, produit différenciant). */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                        <button
                          type="button"
                          style={{ ...styles.answerCta, border: 'none', cursor: 'pointer' }}
                          onClick={() => {
                            // Le sujet de la question oriente vers l'ÉCHELLE qui le traite :
                            // le corps et le climat se lisent à la commune, les trajets et les
                            // services au secteur, le bâti au logement. (Le wizard reçoit ce
                            // contexte sans encore s'en servir, cf. WizardTeaser.)
                            const cta = answer.cta || '';
                            const ctx =
                              cta.includes('Autour') ? 'autour' :
                              cta.includes('Logement') ? 'logement' : 'quartier';
                            openWizard(ctx);
                          }}
                        >
                          Générer mon rapport interactif personnalisé →
                        </button>
                        <Link
                          href="/ou-vivre"
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: 10,
                            padding: '12px 24px', borderRadius: 8,
                            background: 'transparent', border: `1px solid ${C.orange}`,
                            color: C.orange, fontWeight: 600, fontSize: 14,
                            textDecoration: 'none', cursor: 'pointer',
                            fontFamily: "'Instrument Sans', sans-serif",
                          }}
                        >
                          Trouver des territoires qui me correspondent →
                        </Link>
                      </div>
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
                onClick={openCommuneField}
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
      </div>

      <section style={styles.modulesSection}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div
            style={{
              ...styles.sectionLabel,
              justifyContent: 'center',
              display: 'flex',
            }}
          >
            3 modules
          </div>
          <h2 style={{ ...styles.sectionTitle, textAlign: 'center' }}>
            Trois échelles, de la commune à vos murs
          </h2>
          <p
            style={{
              ...styles.sectionSub,
              textAlign: 'center',
              margin: '0 auto',
              maxWidth: 620,
            }}
          >
            Une bonne commune ne fait pas un bon quartier, et un bon quartier ne fait
            pas un bon logement. Les trois se lisent séparément, sur les données
            publiques, et chacune peut contredire la précédente.
          </p>
        </div>
        <div style={styles.modulesGrid} className="modules-grid">
          {MODULES.map((module, i) => (
            <div key={module.name} style={styles.moduleCard(module.color)}>
              {/* L'en-tête porte l'échelle : le numéro dit l'ordre de lecture (on part du large),
                  le libellé dit à quoi on zoome. C'est la grille elle-même qui doit enseigner la
                  structure du produit, pas un paragraphe au-dessus. */}
              <div style={styles.moduleScale(module.color)}>
                <span>0{i + 1}</span>
                <span style={{ opacity: 0.45 }}>·</span>
                <span>{module.scale}</span>
              </div>
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

 {/* ── CTA Rapport interactif personnalisé ── */}
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
              Rapport interactif personnalisé
            </div>
            <h2 style={{
              fontFamily: "'Instrument Serif', serif",
              fontWeight: 400,
              fontSize: 'clamp(22px, 2.4vw, 30px)',
              lineHeight: 1.2, letterSpacing: '-0.4px',
              color: C.text, margin: '0 0 10px',
            }}>
              Votre rapport interactif en 2 minutes.
            </h2>
            <p style={{ fontSize: 15, color: C.muted, lineHeight: 1.65, margin: 0 }}>
              Répondez à 6 questions. Obtenez un aperçu personnalisé de ce que devient votre commune face au climat : ce à quoi elle est exposée, ce qui la transforme.
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
              Obtenir mon rapport interactif personnalisé
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

      {/* Hub Savoir. L'ancre `#savoir` est la cible du lien « Pages Savoir » des deux pieds de page
          (celui-ci et celui de /rapport) : il n'existe pas de route d'index /savoir, seulement des
          slugs. Renommer ou déplacer cette section demande de suivre les deux liens. */}
      <section
        id="savoir"
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
            Des analyses fondées sur des données publiques, DRIAS, GisSol, INSEE, Géorisques.
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
            Découvrir, comprendre ou arbitrer
          </h2>
          <p
            style={{
              ...styles.sectionSub,
              textAlign: 'center',
              margin: '0 auto 40px',
              maxWidth: 500,
            }}
          >
            Une lecture personnalisée à partir de vos réponses et des données publiques,
            à l&apos;échelle d&apos;une commune ou de plusieurs.
          </p>
        </div>
        <div style={styles.pricingGrid} className="pricing-grid">
          <div style={styles.planCard(false)}>
            <div style={styles.planPrice}>
              0<span style={styles.planPriceSub}>€</span>
            </div>
            <div style={styles.planName}>Découverte</div>
            <div style={styles.planDesc}>
              Le questionnaire et votre première lecture personnalisée, pour voir ce que futur•e révèle sur votre situation.
            </div>
            <div style={styles.planFeatures}>
              {[
                'Le questionnaire de profil personnalisé',
                'Votre première lecture : vos premiers points d\'attention',
                'Le climat déjà observé pour votre commune',
                '3 pages Savoir thématiques',
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
            <div style={styles.planName}>Rapport interactif</div>
            <div style={styles.planDesc}>
              Le rapport interactif intégral, téléchargeable, à conserver.
            </div>
            <div style={styles.planFeatures}>
              {[
                'La commune en entier : climat, risques, cadre de vie, ce qui la transforme',
                'AskFuture : 3 questions incluses',
                'Export PDF, à conserver',
                'Régénération 1 fois par an',
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
              Acheter le rapport interactif · 14 €
            </Link>
          </div>

          <div
            style={{
              ...styles.planCard(false),
              borderColor: `${C.violet}40`,
              boxShadow: '0 0 0 1px rgba(167,139,250,0.18), 0 16px 48px rgba(167,139,250,0.10)',
            }}
          >
            <div
              style={{
                ...styles.planBadge,
                background: C.violet,
                color: C.bg,
              }}
            >
              Au bout du parcours
            </div>
            <div style={styles.planPrice}>
              39<span style={styles.planPriceSub}>€ une fois</span>
            </div>
            <div style={styles.planName}>Pack Décision</div>
            <div style={styles.planDesc}>
              Quand une commune ne suffit plus : trois territoires comparés thème
              par thème, pour décider avec plus de recul.
            </div>
            <div style={styles.planFeatures}>
              {[
                'La comparaison complète des trois communes sur 27 dimensions.',
                'Les trois rapports interactifs complets, par commune',
                'Trois nouvelles pistes si aucune ne tranche',
                'AskFuture : 9 questions incluses',
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
                background: C.violet,
                color: C.bg,
              }}
              className="plan-btn"
              href="/ou-vivre"
            >
              Comparer trois territoires
            </Link>
          </div>
        </div>
      </section>


      {/* Résumé de la page /pourquoi, en clôture de landing. Toutes les formules
          viennent de /pourquoi : ne pas en inventer ici, sinon les deux pages
          divergent. Reprend la charpente de l'ancienne section (orbe, visuel,
          visuel) — cf. styles.amnesie*. */}
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
          <div style={styles.amnesieEyebrow}>Pourquoi futur•e</div>
          <h2 style={styles.amnesieTitle}>
            Votre futur lieu de vie ne tient pas dans une annonce.
          </h2>
          <p style={styles.amnesieBody}>
            Choisir où vivre est l’une des décisions les plus engageantes qui
            soient : des années de vie, une grande partie d’un patrimoine,
            parfois la santé d’une famille.
          </p>
          <p style={styles.amnesieBody}>
            Pourtant, celui qui vend, loue ou aménage connaît le lieu et son
            environnement mieux que la personne qui arrive. Certaines données
            sont publiques mais illisibles. D’autres n’ont jamais été produites.
            D’autres encore ne sont pas transmises alors qu’elles sont connues.
          </p>
          <p style={styles.amnesieBody}>
            futur•e rassemble ce qui est connu, rend visibles les angles morts et
            vous aide à savoir ce qu’il reste à vérifier avant de vous engager.
            Les faits sont les mêmes pour tout le monde : ce qui change avec
            votre projet, c’est le poids de chaque fait pour votre décision.
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
          <div style={{
            marginTop: 32,
            paddingTop: 28,
            borderTop: `1px solid ${C.border}`,
          }}>
            <p style={{
              fontFamily: "'Instrument Serif', serif",
              fontSize: 'clamp(19px, 2.2vw, 23px)',
              lineHeight: 1.5,
              margin: '0 0 22px',
            }}>
              <span style={{ color: C.text }}>Ce que nous savons.</span>{' '}
              <span style={{ color: C.muted }}>Ce que cela change pour vous.</span>{' '}
              <span style={{ color: C.orange, fontStyle: 'italic' }}>Ce qu’il reste à vérifier.</span>
            </p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
              <Link href="/ou-vivre" style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '13px 24px', borderRadius: 10,
                background: C.orange, border: '1px solid transparent',
                color: C.bg, fontWeight: 600, fontSize: 14,
                textDecoration: 'none',
                fontFamily: "'Instrument Sans', sans-serif",
              }}>
                Décrire mon projet →
              </Link>
              <Link href="/pourquoi" style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '13px 24px', borderRadius: 10,
                background: 'transparent', border: `1px solid ${C.borderHi}`,
                color: C.muted, fontWeight: 500, fontSize: 14,
                textDecoration: 'none',
                fontFamily: "'Instrument Sans', sans-serif",
              }}>
                Découvrir notre méthode
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer style={{ borderTop: `1px solid ${C.border}`, position: 'relative', zIndex: 2 }}>
        <div style={styles.footer}>
          <div style={styles.footerBrand}>
            futur<span style={{ color: C.orange }}>•</span>e
          </div>
          <div style={styles.footerLinks}>
            {/* Ces cinq liens pointaient tous vers `#`, ici et à l'identique dans le pied de page de
                /rapport. Chacun mène désormais à une destination qui existe. Une disparition
                assumée : « Méthodologie » doublonnait /pourquoi, qui porte déjà la section « La
                méthode ». */}
            {[
              { label: 'Pourquoi futur•e', href: '/pourquoi' },
              { label: 'Pages Savoir', href: '/#savoir' },
              { label: 'Contact', href: 'mailto:hello@futur-e.fr' },
              { label: 'Mentions légales', href: '/mentions-legales' },
            ].map(({ label, href }) => (
              <a key={label} style={styles.footerLink} href={href}>
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
