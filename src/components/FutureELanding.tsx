'use client';

import { useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

const C = {
  bg: '#060812',
  bgElev: 'rgba(255,255,255,0.03)',
  border: 'rgba(255,255,255,0.08)',
  borderHi: 'rgba(255,255,255,0.15)',
  text: '#e9ecf2',
  muted: '#9ba3b4',
  dim: '#6b7388',
  orange: '#fb923c',
  red: '#f87171',
  violet: '#a78bfa',
  green: '#4ade80',
  blue: '#60a5fa',
};

const FALLBACK_TENSION_IDS = [
  'enfants_sante',
  'metier_general',
  'valeur_immo',
  'retraite_ici',
];

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
      'Les zones exposées aux risques documentés (PPRi, RGA, submersion) voient déjà leurs prix stagner ou baisser par rapport à des zones similaires sans risque (DVF 2024). Le DPE devient un facteur de valeur majeur : un logement F ou G se négocie en moyenne 6 à 15 % moins cher que son équivalent C (ADEME). À l’horizon 2030, les obligations de rénovation énergétique rendront certains biens quasi invendables sans travaux.',
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

function getPreviewCards(communeName, categories) {
  const name = communeName || 'votre commune';
  const safeCategories =
    categories && categories.length > 0 ? categories : ['all'];

  const hasCategory = (category) => safeCategories.includes(category);

  const cards = [];

  if (hasCategory('littoral') || hasCategory('littoral_atlantique')) {
    cards.push({
      label: `Submersion à ${name}`,
      val: '+31 % en scénario médian',
      col: C.blue,
      src: 'Géorisques / BRGM',
    });
  }

  if (hasCategory('montagne')) {
    cards.push({
      label: `Neige à ${name}`,
      val: 'Saisons plus courtes à horizon 2050',
      col: C.blue,
      src: 'Météo-France montagne',
    });
  }

  if (hasCategory('mediterranee') || hasCategory('rural_forestier')) {
    cards.push({
      label: `Feux autour de ${name}`,
      val: 'Risque en hausse pendant les étés secs',
      col: C.red,
      src: 'Prométhée / DREAL',
    });
  }

  if (
    hasCategory('urbain_dense_sud') ||
    hasCategory('urbain_dense_nord') ||
    hasCategory('mediterranee')
  ) {
    cards.push({
      label: `Canicule à ${name}`,
      val: '34 jours/an en 2050',
      col: C.red,
      src: 'DRIAS / Météo-France',
    });
  }

  if (hasCategory('rural_agricole') || hasCategory('tension_hydrique_connue')) {
    cards.push({
      label: `Eau potable à ${name}`,
      val: 'Ressource sous tension l’été',
      col: C.blue,
      src: 'BRGM / Agences de l’eau',
    });
  }

  if (hasCategory('periurbain_dependance_auto') || hasCategory('rural_peri_urbain')) {
    cards.push({
      label: `Mobilité à ${name}`,
      val: 'Dépendance voiture à surveiller',
      col: C.orange,
      src: 'INSEE / Ecolab',
    });
  }

  if (hasCategory('tourisme_urbain')) {
    cards.push({
      label: `Tourisme à ${name}`,
      val: 'Activité sensible aux étés extrêmes',
      col: C.violet,
      src: 'INSEE / France Tourisme',
    });
  }

  if (hasCategory('rural_viticole')) {
    cards.push({
      label: `Vigne à ${name}`,
      val: 'Pression sur cépages et rendements',
      col: C.green,
      src: 'INAO / Agreste',
    });
  }

  if (hasCategory('vallee_industrielle')) {
    cards.push({
      label: `Air à ${name}`,
      val: 'Pollution et ozone à surveiller',
      col: C.red,
      src: 'ATMO / Santé publique France',
    });
  }

  cards.push(
    {
      label: `Cadmium sols / ${name}`,
      val: 'Signal sanitaire à confirmer localement',
      col: C.orange,
      src: 'GisSol / RMQS',
    },
    {
      label: `Saison pollinique à ${name}`,
      val: 'Allongement probable dans les prochaines décennies',
      col: C.green,
      src: 'RNSA / Copernicus',
    },
    {
      label: `Valeur immobilière à ${name}`,
      val: 'Risque + DPE pèseront davantage',
      col: C.orange,
      src: 'DVF / ADEME',
    },
  );

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
    return `futur•e croise les données climatiques, sanitaires et immobilières publiques pour donner une première lecture locale du changement climatique. Pour ${name}, cette lecture est déjà utile, même si elle sera encore enrichie au fil du temps.`;
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

  return `futur•e croise les données climatiques, sanitaires et immobilières publiques avec votre profil pour vous donner une lecture personnalisée et située du changement climatique. Pas des généralités : votre situation, dans ${name}.`;
}

function getQuestionIntro(communeName, categories, usedFallback) {
  const safeCategories =
    categories && categories.length > 0 ? categories : ['all'];

  const hasCategory = (category) => safeCategories.includes(category);

  if (usedFallback) {
    return "Voici quatre questions utiles pour commencer. La lecture du territoire s'affinera au fil de l'enrichissement des communes.";
  }

  if (hasCategory('littoral')) {
    return 'Quatre angles de lecture pour comprendre ce que le climat change concrètement ici.';
  }

  if (hasCategory('montagne')) {
    return 'Quatre angles de lecture pour comprendre ce que la montagne change ici dans les prochaines décennies.';
  }

  if (hasCategory('periurbain_dependance_auto') || hasCategory('rural_peri_urbain')) {
    return 'Quatre angles de lecture pour comprendre ce que le territoire change ici en mobilité, logement, eau et qualité de vie.';
  }

  return 'Quatre angles de lecture pour comprendre ce que le climat change concrètement ici.';
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

  return 'Le module affiche 4 questions sélectionnées selon le profil de votre territoire.';
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
  const [tensions, setTensions] = useState([]);
  const [activeTension, setActiveTension] = useState(null);
  const [answer, setAnswer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [answerError, setAnswerError] = useState('');
  const [answerSource, setAnswerSource] = useState('');
  const [freeText, setFreeText] = useState('');
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });
  const commune = selectedCommune?.name || '';

  useEffect(() => {
    supabase.current = createClient();
  }, []);

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

      const client = supabase.current ?? createClient();
      supabase.current = client;

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

  async function loadCommuneTensions(nextCommune) {
    setSelectedCommune(nextCommune);
    setInputValue(nextCommune.name);
    setSuggestions([]);
    setSuggestionsOpen(false);
    setActiveTension(null);
    setAnswer(null);
    setAnswerError('');
    setAnswerSource('');
    setCommuneMeta(null);

    if (tensionsCatalog.length === 0) {
      return;
    }

    const client = supabase.current ?? createClient();
    supabase.current = client;

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

    const categories =
      matchedRow?.categories && matchedRow.categories.length > 0
        ? matchedRow.categories
        : ['all'];

    setCommuneMeta({
      inseeCode: nextCommune.citycode || matchedRow?.insee_code || null,
      categories,
      usedFallback: !matchedRow,
    });

    setTensions(buildTensions(tensionsCatalog, categories));
  }

  const handleInputChange = (value) => {
    setInputValue(value);
    setSearchError('');

    if (value.trim().length < 2) {
      setSuggestions([]);
      setSuggestionsOpen(false);
      setSearchLoading(false);
    }

    if (selectedCommune && value !== selectedCommune.name) {
      setSelectedCommune(null);
      setCommuneMeta(null);
      setTensions([]);
      setActiveTension(null);
      setAnswer(null);
    }
  };

  const selectTension = async (tension) => {
    setActiveTension(tension);
    setLoading(true);
    setAnswer(null);
    setAnswerError('');
    setAnswerSource('');

    const client = supabase.current ?? createClient();
    supabase.current = client;

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
      const response = await fetch('/api/qna', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          commune,
          categories: communeMeta?.categories || ['all'],
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
    if (!freeText.trim()) {
      return;
    }

    setActiveTension({ id: 'free', label: freeText, color: C.violet });
    setLoading(true);
    setAnswer(null);

    setTimeout(() => {
      setAnswer(STATIC_ANSWERS.default);
      setLoading(false);
    }, 1100);

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
      background: 'rgba(6,8,18,0.7)',
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
      background: 'rgba(255,255,255,0.05)',
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
      background: 'rgba(6,8,18,0.6)',
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
      background: 'rgba(251,146,60,0.12)',
      border: '1px solid rgba(251,146,60,0.3)',
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
    tensionCard: (active, col) => ({
      ...glass({
        borderRadius: 10,
        padding: '20px 22px',
        cursor: 'pointer',
        borderColor: active ? `${col}50` : C.border,
        boxShadow: active
          ? `0 0 0 1px ${col}40, 0 8px 24px ${col}15`
          : 'none',
      }),
      transition: 'all 0.2s ease',
      textAlign: 'left',
      width: '100%',
      display: 'block',
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
      background: 'rgba(255,255,255,0.04)',
      border: `1px solid ${C.border}`,
      color: C.text,
      fontSize: 15,
      fontFamily: "'Instrument Sans', sans-serif",
      outline: 'none',
    },
    freeBtn: {
      padding: '14px 24px',
      borderRadius: 8,
      background: C.orange,
      color: C.bg,
      fontWeight: 600,
      fontSize: 14,
      border: 'none',
      cursor: 'pointer',
      whiteSpace: 'nowrap',
      fontFamily: "'Instrument Sans', sans-serif",
    },
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
        borderColor: 'rgba(251,146,60,0.15)',
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
        borderColor: 'rgba(251,146,60,0.2)',
        borderLeft: `2px solid ${C.orange}`,
        marginTop: 28,
      }),
      fontFamily: "'Instrument Serif', serif",
      fontStyle: 'italic',
      fontSize: 18,
      lineHeight: 1.6,
      color: C.text,
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
      background: accent ? C.orange : 'rgba(255,255,255,0.06)',
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

  const previewCommune = commune || 'La Rochelle';
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
  const previewCards = getPreviewCards(
    previewCommune,
    activeCategories,
  );

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
        input::placeholder { color: #6b7388; }
        input:focus { border-color: rgba(251,146,60,0.5) !important; background: rgba(255,255,255,0.06) !important; }
        .answer-anim { animation: fadeIn 0.4s ease; }
        .plan-btn:hover { opacity: 0.88; }
        .suggestion-row:last-child { border-bottom: none !important; }
        @media (max-width:768px) {
          .hero-grid { grid-template-columns: 1fr !important; }
          .hero-right { display: none !important; }
          .modules-grid { grid-template-columns: 1fr !important; }
          .pricing-grid { grid-template-columns: 1fr !important; }
          .tensions-grid { grid-template-columns: 1fr !important; }
          .nav-links { display: none !important; }
          .amnesie-inner { padding: 28px 24px !important; }
          .hero-section { padding: 60px 20px 40px !important; }
          .qr-section { padding: 60px 20px !important; }
          .free-wrap { flex-direction: column !important; }
        }
      `}</style>

      <div style={styles.orb1} />
      <div style={styles.orb2} className="orb2-anim" />
      <div style={styles.orb3} />

      <nav style={styles.nav}>
        <div style={styles.navInner}>
          <a style={styles.brand} href="#">
            futur<span style={styles.brandDot}>•</span>e
          </a>
          <div style={styles.navLinks} className="nav-links">
            <a style={styles.navLink} href="#">
              Le produit
            </a>
            <a style={styles.navLink} href="#">
              Pages Savoir
            </a>
            <a style={styles.navLink} href="#">
              Tarifs
            </a>
          </div>
          <button style={styles.navCta}>Commencer</button>
        </div>
      </nav>

      <section style={{ position: 'relative', zIndex: 2 }}>
        <div style={styles.hero} className="hero-grid hero-section">
          <div style={styles.heroLeft}>
            <div style={styles.eyebrow}>
              <span style={styles.eyebrowDot} />
              Données publiques · Lecture locale · Projection personnalisée
            </div>
            <h1 style={styles.h1}>
              Votre vie à <span style={styles.h1Accent}>{previewCommune}</span> en
              2050.
            </h1>
            <p style={styles.heroSub}>{heroCopy}</p>

            <div style={styles.searchWrap} ref={searchWrapRef}>
              <span style={styles.searchIcon}>⌖</span>
              <input
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
          </div>

          <div style={styles.heroRight} className="hero-right">
            {previewCards.map((item, index) => (
              <div
                key={index}
                style={{ ...styles.previewCard, opacity: 1 - index * 0.08 }}
              >
                <div style={styles.previewDot(item.col)} />
                <div>
                  <div style={styles.previewTitle}>{item.label}</div>
                  <div style={styles.previewSub}>{item.val}</div>
                  <span style={styles.previewBadge(item.col)}>{item.src}</span>
                </div>
              </div>
            ))}
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
            <div style={styles.tensionsGrid} className="tensions-grid">
              {tensions.map((tension) => (
                <button
                  key={tension.id}
                  className="tension-card"
                  style={styles.tensionCard(
                    activeTension?.id === tension.id,
                    tension.color,
                  )}
                  onClick={() => selectTension(tension)}
                >
                  <div style={styles.tensionLabel}>
                    {tension.label.replace('{commune}', commune)}
                  </div>
                  <div style={styles.tensionSub}>{tension.sub}</div>
                  <span style={styles.tensionArrow(tension.color)}>→</span>
                </button>
              ))}
            </div>

            <div style={styles.freeWrap} className="free-wrap">
              <input
                style={styles.freeInput}
                placeholder="Ou posez votre propre question sur votre commune…"
                value={freeText}
                onChange={(event) => setFreeText(event.target.value)}
                onKeyDown={(event) => event.key === 'Enter' && submitFree()}
              />
              <button style={styles.freeBtn} onClick={submitFree}>
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
                      <a href={answer.href || '#'} style={styles.answerCta}>
                        {answer.cta} →
                      </a>
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
              Saisissez votre commune.
            </div>
            <div style={{ fontSize: 14, color: C.dim }}>
              {emptyStateCopy}
            </div>
          </div>
        )}
      </section>

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
            Contre l&apos;amnésie,
            <br />
            pas contre le climat.
          </h2>
          <p style={styles.amnesieBody}>
            Le changement climatique souffre en France d&apos;une forme
            particulière d&apos;invisibilité. Il n&apos;est ni nié ni ignoré.
            Il est oublié par cycles. Chaque été, les canicules, les
            sécheresses, les incendies reviennent dans l&apos;actualité. Chaque
            automne, l&apos;attention s&apos;efface. Chaque hiver, le sujet
            retourne à l&apos;arrière-plan.
          </p>
          <p style={styles.amnesieBody}>
            Cette amnésie saisonnière n&apos;est pas un manque de volonté.
            C&apos;est un phénomène documenté en psychologie comportementale : la
            capacité finie d&apos;inquiétude. L&apos;attention aux risques
            collectifs est limitée. Quand elle se remplit d&apos;un sujet, elle
            se vide d&apos;un autre.
          </p>
          <p style={styles.amnesieBody}>
            futur•e existe contre cet oubli. Une présence éditoriale calme,
            mensuelle, personnalisée, qui maintient le climat de votre vie dans
            votre conscience active toute l&apos;année, sans jamais peser, sans
            jamais profiter des pics médiatiques pour vendre sa pertinence.
          </p>
          <div style={styles.amnesieHighlight}>
            L&apos;enjeu n&apos;est pas de remplacer l&apos;alarme saisonnière
            par une alarme permanente. L&apos;enjeu est de rendre le climat
            intégrable à la texture d&apos;une vie qui pense, à la façon dont on
            intègre sa santé, ses finances, l&apos;éducation de ses enfants :
            sans obsession, sans oubli, avec continuité.
          </div>
        </div>
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

      <section style={styles.pricingSection}>
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
            <button style={styles.planBtn(false)} className="plan-btn">
              Commencer gratuitement
            </button>
          </div>

          <div style={styles.planCard(false)}>
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
                'Crédit applicable vers le Suivi',
              ].map((feature) => (
                <div key={feature} style={styles.planFeature}>
                  <span style={styles.planCheck}>✓</span>
                  {feature}
                </div>
              ))}
            </div>
            <button style={styles.planBtn(false)} className="plan-btn">
              Acheter le rapport
            </button>
          </div>

          <div
            style={{
              ...styles.planCard(true),
              boxShadow:
                '0 0 0 1px rgba(251,146,60,0.3), 0 16px 48px rgba(251,146,60,0.12)',
            }}
          >
            <div style={styles.planBadge}>Recommandé</div>
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
            <button style={styles.planBtn(true)} className="plan-btn">
              S&apos;abonner au Suivi
            </button>
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
    </div>
  );
}
