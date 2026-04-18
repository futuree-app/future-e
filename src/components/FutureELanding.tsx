// @ts-nocheck
'use client';
import { useState, useEffect, useRef } from 'react';

// ─── Palette & tokens ───────────────────────────────────────────────
const C = {
  bg:       '#060812',
  bgElev:   'rgba(255,255,255,0.03)',
  border:   'rgba(255,255,255,0.08)',
  borderHi: 'rgba(255,255,255,0.15)',
  text:     '#e9ecf2',
  muted:    '#9ba3b4',
  dim:      '#6b7388',
  orange:   '#fb923c',
  red:      '#f87171',
  violet:   '#a78bfa',
  green:    '#4ade80',
  blue:     '#60a5fa',
};

// ─── 26 tensions (catalogue complet, simplifié pour la démo) ────────
const TENSIONS_CATALOG = [
  { id:'acheter_littoral',  label:'Acheter à {commune} ?',            sub:'Risque côtier, valeur à 20 ans',        cats:['littoral'],                   priority:1, color:C.blue   },
  { id:'acheter_canicule',  label:'Acheter à {commune} ?',            sub:'Chaleur extrême, valeur à 20 ans',      cats:['urbain_dense_sud','mediterranee'], priority:1, color:C.red  },
  { id:'acheter_rural',     label:"S'installer à {commune} ?",        sub:'Qualité de vie, ressources, valeur',    cats:['rural_peri_urbain'],          priority:1, color:C.green  },
  { id:'acheter_urbain',    label:'Acheter à {commune} ?',            sub:'Climat urbain, valeur à 20 ans',        cats:['urbain_dense_nord'],          priority:1, color:C.blue   },
  { id:'acheter_montagne',  label:'Acheter en altitude à {commune} ?',sub:'Neige, saisons, attractivité',          cats:['montagne'],                   priority:1, color:C.blue   },
  { id:'surfer_ici',        label:'Surfer à {commune} dans 20 ans ?', sub:"Saisons, qualité de l'eau, tempêtes",   cats:['littoral_atlantique'],        priority:2, color:C.blue   },
  { id:'baignade_ici',      label:"Se baigner à {commune} l'été ?",   sub:'Plages, rivières, qualité sanitaire',   cats:['littoral_mediterranee','rural_lacs'], priority:2, color:C.blue },
  { id:'ski_ici',           label:'Skier à {commune} dans 20 ans ?',  sub:'Enneigement, stations, saisons',        cats:['montagne'],                   priority:2, color:C.blue   },
  { id:'randonner_ici',     label:'Randonner autour de {commune} ?',  sub:'Feux de forêt, chaleur, accès',         cats:['mediterranee','rural_forestier'], priority:3, color:C.green },
  { id:'metier_exterieur',  label:'Mon métier en extérieur va-t-il tenir ?', sub:'BTP, agriculture, voirie',      cats:['all'],                        priority:2, color:C.orange },
  { id:'metier_tourisme',   label:'Mon métier du tourisme va-t-il tenir ?',  sub:'Hôtellerie, restauration',      cats:['littoral','montagne','tourisme_urbain'], priority:2, color:C.orange },
  { id:'metier_general',    label:'Mon métier est-il menacé par le climat ?', sub:'Secteur, structure, évolutions',cats:['all'],                        priority:3, color:C.orange },
  { id:'metier_agricole',   label:"L'agriculture locale va-t-elle survivre ?",sub:'Filières, eau, rendements',    cats:['rural_agricole'],             priority:2, color:C.green  },
  { id:'enfants_chaleur',   label:'Élever mes enfants ici face à la chaleur ?',sub:'École, air, canicule',        cats:['urbain_dense_sud','mediterranee'], priority:2, color:C.red },
  { id:'enfants_sante',     label:'Élever mes enfants à {commune} ?', sub:'Air, cadmium, école, chaleur',          cats:['all'],                        priority:2, color:C.red    },
  { id:'enfants_littoral',  label:'Élever mes enfants face au littoral ?',sub:'Submersion, érosion, école',       cats:['littoral'],                   priority:2, color:C.red    },
  { id:'eau_potable',       label:"L'eau du robinet va-t-elle rester bonne ?",sub:'Ressource, qualité, restrictions',cats:['rural_agricole','tension_hydrique_connue'], priority:2, color:C.blue },
  { id:'canicule_vivable',  label:'Vivre les étés à {commune} dans 20 ans ?',sub:'Chaleur, nuits tropicales, santé',cats:['urbain_dense_sud','mediterranee'], priority:2, color:C.red },
  { id:'air_urbain',        label:"Qualité de l'air à {commune} dans 20 ans ?",sub:'Ozone, particules, santé respiratoire',cats:['urbain_dense_sud','vallee_industrielle'], priority:3, color:C.red },
  { id:'retraite_ici',      label:'Ma retraite à {commune} est-elle viable ?',sub:"Santé, climat, coût de la vie", cats:['all'],                        priority:3, color:C.violet },
  { id:'demenager_vers',    label:'Partir vers le Nord ou rester à {commune} ?',sub:'Comparer les climats futurs',cats:['urbain_dense_sud','mediterranee'], priority:3, color:C.violet },
  { id:'valeur_immo',       label:'Mon logement va-t-il perdre de la valeur ?',sub:'DPE, risques, assurance',     cats:['all'],                        priority:2, color:C.orange },
  { id:'vignobles',         label:'Mon vignoble va-t-il tenir à {commune} ?', sub:'Cépages, rendements, AOC',     cats:['rural_viticole'],             priority:2, color:C.green  },
  { id:'feux',              label:'Les feux vont-ils atteindre {commune} ?',  sub:'Risque, évolution, protection', cats:['mediterranee','rural_forestier'], priority:2, color:C.red },
  { id:'mobilite_fragile',  label:'Mon mode de vie à {commune} repose-t-il trop sur la voiture ?',sub:'Dépendance auto, coût carburant, alternatives',cats:['rural_peri_urbain','periurbain_dependance_auto'], priority:1, color:C.orange },
  { id:'voiture_electrique',label:"Passer à l'électrique a-t-il du sens à {commune} ?",sub:'Recharge, trajets, coût, usage réel',cats:['periurbain_dependance_auto','bonne_couverture_irve'], priority:2, color:C.orange },
];

// Catégories de communes (simplifié — en prod, lookup Supabase)
const COMMUNE_CATEGORIES = {
  'La Rochelle': ['littoral','littoral_atlantique','tension_hydrique_connue'],
  'Chamonix':    ['montagne'],
  'Bordeaux':    ['urbain_dense_sud','sud_ouest','periurbain_dependance_auto'],
  'Rodez':       ['rural_peri_urbain','rural_agricole'],
  'Marseille':   ['urbain_dense_sud','littoral_mediterranee','mediterranee','tourisme_urbain'],
  'Nantes':      ['urbain_dense_nord'],
  'Lyon':        ['urbain_dense_nord','vallee_industrielle'],
  'Brest':       ['littoral','littoral_manche','urbain_dense_nord'],
  'Toulouse':    ['urbain_dense_sud','periurbain_dependance_auto'],
  'Nice':        ['littoral_mediterranee','mediterranee','tourisme_urbain'],
};

function getTensions(commune) {
  const cats = COMMUNE_CATEGORIES[commune] || ['all'];
  const matching = TENSIONS_CATALOG.filter(t =>
    t.cats.includes('all') || t.cats.some(c => cats.includes(c))
  ).sort((a,b) => a.priority - b.priority);
  // Dédupliquer par module, max 4
  const seen = new Set();
  const result = [];
  for (const t of matching) {
    const key = t.id.split('_')[0];
    if (!seen.has(key) && result.length < 4) {
      seen.add(key);
      result.push(t);
    }
  }
  // Fallback si moins de 4
  const fallback = ['enfants_sante','metier_general','valeur_immo','retraite_ici'];
  for (const fid of fallback) {
    if (result.length >= 4) break;
    const t = TENSIONS_CATALOG.find(x => x.id === fid);
    if (t && !result.find(r => r.id === fid)) result.push(t);
  }
  return result.slice(0,4);
}

// Réponses statiques pré-générées (simulant Prompt 10 , appel Claude API en production)
const STATIC_ANSWERS = {
  acheter_littoral: {
    verdict: "À acheter avec les yeux ouverts.",
    detail: "La Rochelle présente un risque de submersion en hausse de +31 % en scénario médian 2050 (DRIAS, Géorisques). Les Minimes et Aytré sont en zone PPRi modérée à élevée. Les coûts d'assurance habitation progressent de 8 à 12 % par an sur le littoral charentais (ACPR 2024). L'achat reste viable à condition de choisir le bon quartier, d'étudier la DPE et l'assurabilité future.",
    cta: "Voir le rapport complet sur La Rochelle"
  },
  enfants_sante: {
    verdict: "Trois signaux méritent votre attention.",
    detail: "Les sols charentais sont naturellement chargés en cadmium (GisSol/RMQS). L'ANSES a alerté en mars 2026 qu'un Français sur deux est surexposé par son alimentation, dont 36 % des enfants de moins de 3 ans. La saison pollinique s'est allongée de 28 jours en Nouvelle-Aquitaine (RNSA/Copernicus). Les jours de canicule projetés à La Rochelle passent de 5 à 34 par an en 2050 en scénario médian (DRIAS). Rien d'irrémédiable, mais autant le savoir tôt.",
    cta: "Voir le module Santé de votre rapport"
  },
  mobilite_fragile: {
    verdict: "Bressuire est un territoire où la voiture n'est pas un choix.",
    detail: "84 % des actifs résidant dans des communes rurales similaires utilisent la voiture pour aller travailler (INSEE/Ecolab). Les flux domicile-travail sortants dépassent souvent 50 %. L'offre de transport collectif reste limitée et les bornes de recharge publique insuffisantes pour une transition fluide. Cette structure expose directement les budgets des foyers à la volatilité du prix des carburants.",
    cta: "Voir le module Mobilité de votre rapport"
  },
  metier_general: {
    verdict: "Ça dépend du secteur. Certains gagnent, d'autres perdent.",
    detail: "Le secteur associatif et de l'ESS sera relativement peu exposé aux risques physiques directs, mais fortement affecté par l'évolution des financements et des priorités. Les métiers liés à l'adaptation climatique (bilan carbone, transition énergétique) sont en forte croissance. Les secteurs à exposition extérieure (BTP, agriculture) sont les plus vulnérables à la chaleur croissante (INRS).",
    cta: "Voir le module Métier de votre rapport"
  },
  valeur_immo: {
    verdict: "Moins risqué que ce qu'on raconte, mais pas sans condition.",
    detail: "Les zones exposées aux risques documentés (PPRi, RGA, submersion) voient déjà leurs prix stagner ou baisser par rapport à des zones similaires sans risque (DVF 2024). Le DPE devient un facteur de valeur majeur : un logement F ou G se négocie en moyenne 6 à 15 % moins cher que son équivalent C (ADEME). À l'horizon 2030, les obligations de rénovation énergétique rendront certains biens quasi invendables sans travaux.",
    cta: "Voir le module Logement de votre rapport"
  },
  default: {
    verdict: "Les données pour cette commune pointent plusieurs signaux.",
    detail: "Un rapport complet croise les données climatiques, sanitaires, immobilières et professionnelles pour votre commune et votre profil spécifique. Ce que futur•e fait, c'est transformer ces données publiques en lecture lisible et personnalisée, pour que vous puissiez décider, pas seulement vous inquiéter.",
    cta: "Générer votre rapport complet"
  }
};

function getAnswer(tensionId) {
  return STATIC_ANSWERS[tensionId] || STATIC_ANSWERS.default;
}

// ─── Composants utilitaires ──────────────────────────────────────────
const glass = (extra = {}) => ({
  background: C.bgElev,
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  border: `1px solid ${C.border}`,
  ...extra
});

export default function FutureELanding() {
  const [commune, setCommune] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [tensions, setTensions] = useState([]);
  const [activeTension, setActiveTension] = useState(null);
  const [answer, setAnswer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [freeText, setFreeText] = useState('');
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });
  const [menuOpen, setMenuOpen] = useState(false);
  const answerRef = useRef(null);

  useEffect(() => {
    const onMove = (e) => setMousePos({ x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight });
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  const handleCommune = (val) => {
    setInputValue(val);
    if (COMMUNE_CATEGORIES[val]) {
      setCommune(val);
      setTensions(getTensions(val));
      setActiveTension(null);
      setAnswer(null);
    }
  };

  const selectTension = (t) => {
    setActiveTension(t);
    setLoading(true);
    setAnswer(null);
    setTimeout(() => {
      setAnswer(getAnswer(t.id));
      setLoading(false);
      setTimeout(() => answerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 100);
    }, 900);
  };

  const submitFree = () => {
    if (!freeText.trim()) return;
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
    root: { fontFamily:"'Instrument Sans', system-ui, sans-serif", background: C.bg, color: C.text, minHeight: '100vh', overflowX: 'hidden', position: 'relative', WebkitFontSmoothing: 'antialiased' },
    // Orbes
    orb1: { position:'fixed', width:600, height:600, borderRadius:'50%', background:`radial-gradient(circle, ${C.orange}55 0%, transparent 70%)`, top:-180, left:-150, filter:'blur(100px)', opacity:0.45, pointerEvents:'none', zIndex:0, transform:`translate(${orb1x}px,${orb1y}px)`, transition:'transform 0.3s ease' },
    orb2: { position:'fixed', width:500, height:500, borderRadius:'50%', background:`radial-gradient(circle, ${C.violet}40 0%, transparent 70%)`, bottom:-150, right:-120, filter:'blur(100px)', opacity:0.38, pointerEvents:'none', zIndex:0 },
    orb3: { position:'fixed', width:380, height:380, borderRadius:'50%', background:`radial-gradient(circle, ${C.red}30 0%, transparent 70%)`, top:'50%', left:'60%', filter:'blur(80px)', opacity:0.22, pointerEvents:'none', zIndex:0 },

    // Nav
    nav: { position:'sticky', top:0, zIndex:50, backdropFilter:'blur(16px)', WebkitBackdropFilter:'blur(16px)', background:'rgba(6,8,18,0.7)', borderBottom:`1px solid ${C.border}` },
    navInner: { maxWidth:1100, margin:'0 auto', padding:'0 28px', height:64, display:'flex', alignItems:'center', justifyContent:'space-between', gap:24 },
    brand: { fontFamily:"'Instrument Serif', serif", fontSize:22, fontStyle:'italic', color: C.text, letterSpacing:-0.3, textDecoration:'none', display:'flex', alignItems:'center', gap:0 },
    brandDot: { color: C.orange, fontStyle:'normal' },
    navLinks: { display:'flex', alignItems:'center', gap:32 },
    navLink: { fontFamily:"'JetBrains Mono', monospace", fontSize:11, letterSpacing:'0.08em', textTransform:'uppercase', color: C.muted, textDecoration:'none', cursor:'pointer' },
    navCta: { padding:'8px 20px', borderRadius:6, background: C.orange, color: C.bg, fontFamily:"'Instrument Sans', sans-serif", fontWeight:600, fontSize:13, border:'none', cursor:'pointer' },

    // Hero
    hero: { position:'relative', zIndex:2, maxWidth:1100, margin:'0 auto', padding:'100px 28px 80px', display:'grid', gridTemplateColumns:'1fr 1fr', gap:64, alignItems:'center' },
    heroLeft: {},
    eyebrow: { fontFamily:"'JetBrains Mono', monospace", fontSize:11, letterSpacing:'0.12em', textTransform:'uppercase', color: C.orange, marginBottom:20, display:'flex', alignItems:'center', gap:10 },
    eyebrowDot: { width:6, height:6, borderRadius:'50%', background: C.orange, boxShadow:`0 0 12px ${C.orange}`, display:'inline-block' },
    h1: { fontFamily:"'Instrument Serif', serif", fontWeight:400, fontSize:'clamp(42px,5vw,68px)', lineHeight:1.06, letterSpacing:-1.5, margin:'0 0 24px', color: C.text },
    h1Accent: { fontStyle:'italic', color: C.orange },
    heroSub: { fontSize:18, lineHeight:1.65, color: C.muted, margin:'0 0 40px', maxWidth:480 },

    // Search
    searchWrap: { position:'relative', maxWidth:480 },
    searchInput: { width:'100%', padding:'16px 20px 16px 52px', borderRadius:10, background:'rgba(255,255,255,0.05)', border:`1px solid ${C.border}`, color: C.text, fontSize:16, fontFamily:"'Instrument Sans', sans-serif", outline:'none', boxSizing:'border-box', transition:'border-color 0.2s, background 0.2s' },
    searchIcon: { position:'absolute', left:18, top:'50%', transform:'translateY(-50%)', color: C.dim, fontSize:18, pointerEvents:'none' },
    searchSub: { marginTop:12, fontSize:13, color: C.dim, fontFamily:"'JetBrains Mono', monospace", letterSpacing:'0.04em' },

    // Hero right, demo preview
    heroRight: { display:'flex', flexDirection:'column', gap:12 },
    previewCard: { ...glass({ borderRadius:12, padding:'20px 22px' }), display:'flex', gap:16, alignItems:'flex-start' },
    previewDot: (col) => ({ width:10, height:10, borderRadius:'50%', background:col, boxShadow:`0 0 8px ${col}`, flexShrink:0, marginTop:4 }),
    previewTitle: { fontSize:14, fontWeight:500, color: C.text, marginBottom:4 },
    previewSub: { fontSize:12, color: C.dim, lineHeight:1.5 },
    previewBadge: (col) => ({ display:'inline-block', padding:'2px 8px', borderRadius:4, background:`${col}18`, border:`1px solid ${col}30`, fontSize:11, color:col, fontFamily:"'JetBrains Mono', monospace", marginTop:6 }),

    // Sources bar
    sourcesBar: { position:'relative', zIndex:2, borderTop:`1px solid ${C.border}`, borderBottom:`1px solid ${C.border}`, background:'rgba(6,8,18,0.6)', overflow:'hidden', padding:'12px 0' },
    sourcesTrack: { display:'flex', gap:48, whiteSpace:'nowrap', animation:'scroll-x 25s linear infinite' },
    sourceItem: { fontFamily:"'JetBrains Mono', monospace", fontSize:11, color: C.dim, letterSpacing:'0.06em', textTransform:'uppercase', flexShrink:0 },

    // Module Q&R
    qrSection: { position:'relative', zIndex:2, maxWidth:860, margin:'0 auto', padding:'80px 28px' },
    sectionLabel: { fontFamily:"'JetBrains Mono', monospace", fontSize:11, letterSpacing:'0.12em', textTransform:'uppercase', color: C.dim, marginBottom:8 },
    sectionTitle: { fontFamily:"'Instrument Serif', serif", fontWeight:400, fontSize:'clamp(28px,3.5vw,40px)', lineHeight:1.15, letterSpacing:-0.5, margin:'0 0 8px', color: C.text },
    sectionSub: { fontSize:16, color: C.muted, margin:'0 0 36px', lineHeight:1.6 },
    communeDisplay: { display:'inline-flex', alignItems:'center', gap:8, padding:'6px 14px', borderRadius:100, background:`rgba(251,146,60,0.12)`, border:`1px solid rgba(251,146,60,0.3)`, fontFamily:"'JetBrains Mono', monospace", fontSize:12, color: C.orange, marginBottom:28, letterSpacing:'0.06em' },

    // Tension cards
    tensionsGrid: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:20 },
    tensionCard: (active, col) => ({
      ...glass({ borderRadius:10, padding:'20px 22px', cursor:'pointer', borderColor: active ? `${col}50` : C.border, boxShadow: active ? `0 0 0 1px ${col}40, 0 8px 24px ${col}15` : 'none' }),
      transition:'all 0.2s ease',
      textAlign:'left', width:'100%', display:'block',
    }),
    tensionLabel: { fontFamily:"'Instrument Serif', serif", fontStyle:'italic', fontSize:17, color: C.text, lineHeight:1.3, marginBottom:6 },
    tensionSub: { fontFamily:"'JetBrains Mono', monospace", fontSize:11, color: C.dim, letterSpacing:'0.04em', lineHeight:1.4 },
    tensionArrow: (col) => ({ fontSize:14, color:col, marginTop:10, display:'block' }),

    // Champ libre
    freeWrap: { display:'flex', gap:10, marginBottom:32 },
    freeInput: { flex:1, padding:'14px 18px', borderRadius:8, background:'rgba(255,255,255,0.04)', border:`1px solid ${C.border}`, color: C.text, fontSize:15, fontFamily:"'Instrument Sans', sans-serif", outline:'none' },
    freeBtn: { padding:'14px 24px', borderRadius:8, background: C.orange, color: C.bg, fontWeight:600, fontSize:14, border:'none', cursor:'pointer', whiteSpace:'nowrap', fontFamily:"'Instrument Sans', sans-serif" },

    // Réponse
    answerBox: { ...glass({ borderRadius:12, padding:'28px 32px', borderColor: activeTension ? `${activeTension?.color || C.orange}40` : C.border }) },
    answerLoading: { display:'flex', alignItems:'center', gap:12, color: C.muted, fontSize:15 },
    spinner: { width:18, height:18, border:`2px solid ${C.border}`, borderTop:`2px solid ${C.orange}`, borderRadius:'50%', animation:'spin 0.8s linear infinite' },
    verdict: { fontFamily:"'Instrument Serif', serif", fontStyle:'italic', fontSize:22, lineHeight:1.3, color: C.text, marginBottom:16, paddingBottom:16, borderBottom:`1px solid ${C.border}` },
    detail: { fontSize:16, lineHeight:1.72, color: C.muted, marginBottom:24 },
    answerCta: { display:'inline-flex', alignItems:'center', gap:10, padding:'12px 24px', borderRadius:8, background: C.orange, color: C.bg, fontWeight:600, fontSize:14, textDecoration:'none', cursor:'pointer', border:'none', fontFamily:"'Instrument Sans', sans-serif" },

    // Section amnésie
    amnesieSection: { position:'relative', zIndex:2, maxWidth:860, margin:'0 auto', padding:'40px 28px 80px' },
    amnesieInner: { ...glass({ borderRadius:16, padding:'48px 52px', borderColor: 'rgba(251,146,60,0.15)' }), position:'relative', overflow:'hidden' },
    amnesieEyebrow: { fontFamily:"'JetBrains Mono', monospace", fontSize:11, letterSpacing:'0.12em', textTransform:'uppercase', color: C.orange, marginBottom:20 },
    amnesieTitle: { fontFamily:"'Instrument Serif', serif", fontWeight:400, fontSize:'clamp(26px,3vw,38px)', lineHeight:1.2, letterSpacing:-0.5, margin:'0 0 24px', color: C.text },
    amnesieBody: { fontSize:17, lineHeight:1.75, color: C.muted, margin:'0 0 20px' },
    amnesieHighlight: { ...glass({ borderRadius:8, padding:'18px 22px', borderColor:`rgba(251,146,60,0.2)`, borderLeft:`2px solid ${C.orange}`, marginTop:28 }), fontFamily:"'Instrument Serif', serif", fontStyle:'italic', fontSize:18, lineHeight:1.6, color: C.text },

    // Modules
    modulesSection: { position:'relative', zIndex:2, maxWidth:1100, margin:'0 auto', padding:'80px 28px' },
    modulesGrid: { display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16 },
    moduleCard: (col) => ({ ...glass({ borderRadius:12, padding:'28px 26px' }), borderTop:`2px solid ${col}`, cursor:'default' }),
    moduleIcon: (col) => ({ width:36, height:36, borderRadius:8, background:`${col}18`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, marginBottom:16, border:`1px solid ${col}25` }),
    moduleName: { fontFamily:"'Instrument Serif', serif", fontWeight:400, fontSize:20, color: C.text, marginBottom:8 },
    moduleDesc: { fontSize:14, color: C.muted, lineHeight:1.6, marginBottom:16 },
    moduleItems: { display:'flex', flexDirection:'column', gap:6 },
    moduleItem: (col) => ({ fontSize:12, color: C.dim, paddingLeft:12, borderLeft:`1px solid ${col}30`, lineHeight:1.5, fontFamily:"'JetBrains Mono', monospace", letterSpacing:'0.02em' }),

    // Pricing
    pricingSection: { position:'relative', zIndex:2, maxWidth:1100, margin:'0 auto', padding:'80px 28px' },
    pricingGrid: { display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16, marginTop:40 },
    planCard: (accent) => ({ ...glass({ borderRadius:14, padding:'32px 28px' }), position:'relative', borderColor: accent ? `${C.orange}40` : C.border }),
    planBadge: { position:'absolute', top:-12, left:'50%', transform:'translateX(-50%)', padding:'4px 14px', borderRadius:100, background: C.orange, color: C.bg, fontFamily:"'JetBrains Mono', monospace", fontSize:11, fontWeight:600, letterSpacing:'0.06em', whiteSpace:'nowrap' },
    planPrice: { fontFamily:"'Instrument Serif', serif", fontSize:40, fontWeight:400, color: C.text, letterSpacing:-1 },
    planPriceSub: { fontFamily:"'JetBrains Mono', monospace", fontSize:11, color: C.dim, marginLeft:4, letterSpacing:'0.04em' },
    planName: { fontFamily:"'Instrument Serif', serif", fontStyle:'italic', fontSize:20, color: C.text, margin:'12px 0 4px' },
    planDesc: { fontSize:14, color: C.muted, lineHeight:1.6, marginBottom:24 },
    planFeatures: { display:'flex', flexDirection:'column', gap:10, marginBottom:28 },
    planFeature: { fontSize:14, color: C.muted, display:'flex', gap:10, alignItems:'flex-start' },
    planCheck: { color: C.green, flexShrink:0, marginTop:1 },
    planBtn: (accent) => ({ width:'100%', padding:'13px', borderRadius:8, background: accent ? C.orange : 'rgba(255,255,255,0.06)', color: accent ? C.bg : C.text, fontWeight:600, fontSize:14, border: accent ? 'none' : `1px solid ${C.border}`, cursor:'pointer', fontFamily:"'Instrument Sans', sans-serif", transition:'opacity 0.2s' }),

    // Footer
    footer: { position:'relative', zIndex:2, borderTop:`1px solid ${C.border}`, padding:'40px 28px', maxWidth:1100, margin:'0 auto', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:20 },
    footerBrand: { fontFamily:"'Instrument Serif', serif", fontStyle:'italic', fontSize:18, color: C.text },
    footerLinks: { display:'flex', gap:28 },
    footerLink: { fontFamily:"'JetBrains Mono', monospace", fontSize:11, color: C.dim, letterSpacing:'0.06em', textDecoration:'none', textTransform:'uppercase', cursor:'pointer' },
  };

  const MODULES = [
    { name:'Quartier', icon:'🏘', color: C.blue,   desc:"Ce que votre territoire devient face aux aléas climatiques.", items:['Canicule et jours extrêmes','Submersion et inondations','Risque incendie','Érosion littorale'] },
    { name:'Logement', icon:'🏠', color: C.orange, desc:"Ce que votre habitat devient : confort, risques, valeur.", items:['DPE et réglementation future','Risques physiques par adresse','Coût d\'assurance projeté','Valeur immobilière à 20 ans'] },
    { name:'Métier',   icon:'💼', color: C.violet, desc:"Ce que le changement climatique fait à votre secteur.", items:['Résilience sectorielle','Exposition à la chaleur','Transformations structurelles','Opportunités émergentes'] },
    { name:'Santé',    icon:'🫁', color: C.red,    desc:"Ce que votre environnement fait à votre corps.", items:['Canicule et vulnérabilité','Cadmium et métaux lourds','Pollens et saison allongée','Qualité de l\'eau potable'] },
    { name:'Mobilité', icon:'🚗', color: C.green,  desc:"Votre dépendance à la voiture et vos alternatives réelles.", items:['Part voiture sur le territoire','Alternatives de transport','Coût carburant et fragilité','Transition électrique : si pertinente'] },
    { name:'Projets',  icon:'🗓', color: C.blue,   desc:"Vos décisions de vie à moyen terme, éclairées.", items:['Achat immobilier','Déménagement, vers où','Projet familial','Retraite et territoire'] },
  ];

  const SOURCES = ['DRIAS / Météo-France','Géorisques / BRGM','ANSES','Santé publique France','GisSol / RMQS','INSEE / Ecolab','RNSA','EFSA','ADEME','Copernicus','transport.data.gouv.fr','IRVE, data.gouv','ACPR / Banque de France','ARS','PhytAtmo / AASQA','INRAE'];

  return (
    <div style={styles.root}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Instrument+Sans:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');
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
        }
      `}</style>

      {/* Orbes */}
      <div style={styles.orb1} />
      <div style={{...styles.orb2}} className="orb2-anim" />
      <div style={styles.orb3} />

      {/* Nav */}
      <nav style={styles.nav}>
        <div style={styles.navInner}>
          <a style={styles.brand} href="#">
            futur<span style={styles.brandDot}>•</span>e
          </a>
          <div style={styles.navLinks} className="nav-links">
            <a style={styles.navLink} href="#">Le produit</a>
            <a style={styles.navLink} href="#">Pages Savoir</a>
            <a style={styles.navLink} href="#">Tarifs</a>
          </div>
          <button style={styles.navCta}>Commencer</button>
        </div>
      </nav>

      {/* Hero */}
      <section style={{position:'relative', zIndex:2}}>
        <div style={{...styles.hero}} className="hero-grid hero-section">
          <div style={styles.heroLeft}>
            <div style={styles.eyebrow}>
              <span style={styles.eyebrowDot} />
              Données publiques · Projection personnalisée · Vouvoiement strict
            </div>
            <h1 style={styles.h1}>
              Votre vie à{' '}
              <span style={styles.h1Accent}>
                {commune || 'La Rochelle'}
              </span>
              {' '}en 2050.
            </h1>
            <p style={styles.heroSub}>
              futur•e croise les données climatiques, sanitaires et immobilières publiques avec votre profil pour vous donner une lecture personnalisée et située du changement climatique. Pas des généralités : votre situation, dans votre commune.
            </p>
            {/* Saisie commune */}
            <div style={styles.searchWrap}>
              <span style={styles.searchIcon}>⌖</span>
              <input
                style={styles.searchInput}
                placeholder="Saisissez votre commune…"
                value={inputValue}
                onChange={e => handleCommune(e.target.value)}
                list="communes-list"
              />
              <datalist id="communes-list">
                {Object.keys(COMMUNE_CATEGORIES).map(c => <option key={c} value={c} />)}
              </datalist>
            </div>
            <p style={styles.searchSub}>
              Essayez : La Rochelle, Bordeaux, Chamonix, Marseille, Rodez…
            </p>
          </div>

          {/* Preview cards hero */}
          <div style={styles.heroRight} className="hero-right">
            {[
              { label:'Canicule à La Rochelle', val:'34 jours/an en 2050', col:C.red, src:'DRIAS / Météo-France' },
              { label:'Cadmium sols / Charentes', val:'Teneur élevée · ANSES 2026', col:C.orange, src:'GisSol / RMQS' },
              { label:'Submersion côtière', val:'+31 % en scénario médian', col:C.blue, src:'Géorisques' },
              { label:'Saison pollinique', val:'+28 jours en Nouvelle-Aquitaine', col:C.green, src:'RNSA / Copernicus' },
            ].map((item, i) => (
              <div key={i} style={{...styles.previewCard, opacity: 1 - i * 0.08}}>
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

      {/* Bandeau sources */}
      <div style={styles.sourcesBar}>
        <div style={{display:'flex'}}>
          <div style={styles.sourcesTrack}>
            {[...SOURCES,...SOURCES].map((s,i) => (
              <span key={i} style={styles.sourceItem}>
                <span style={{color: C.orange, marginRight:6}}>·</span>{s}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ═══ MODULE Q&R ═══════════════════════════════════════════ */}
      <section style={styles.qrSection} className="qr-section">
        <div style={styles.sectionLabel}>Module Question-Réponse</div>
        <h2 style={styles.sectionTitle}>
          {commune ? `Vos questions sur ${commune}` : 'Vos questions sur votre commune'}
        </h2>
        <p style={styles.sectionSub}>
          {commune
            ? `Quatre signaux sélectionnés selon le profil territorial de ${commune}. Cliquez pour obtenir une réponse directe.`
            : 'Saisissez votre commune ci-dessus pour voir les questions qui correspondent à votre territoire.'
          }
        </p>

        {commune && (
          <div style={styles.communeDisplay}>
            ⌖ {commune}
          </div>
        )}

        {tensions.length > 0 && (
          <>
            <div style={styles.tensionsGrid} className="tensions-grid">
              {tensions.map(t => (
                <button
                  key={t.id}
                  className="tension-card"
                  style={styles.tensionCard(activeTension?.id === t.id, t.color)}
                  onClick={() => selectTension(t)}
                >
                  <div style={styles.tensionLabel}>
                    {t.label.replace('{commune}', commune)}
                  </div>
                  <div style={styles.tensionSub}>{t.sub}</div>
                  <span style={styles.tensionArrow(t.color)}>→</span>
                </button>
              ))}
            </div>

            {/* Champ libre */}
            <div style={styles.freeWrap}>
              <input
                style={styles.freeInput}
                placeholder="Ou posez votre propre question sur votre commune…"
                value={freeText}
                onChange={e => setFreeText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && submitFree()}
              />
              <button style={styles.freeBtn} onClick={submitFree}>Poser →</button>
            </div>

            {/* Réponse */}
            {(loading || answer) && (
              <div ref={answerRef} style={styles.answerBox} className="answer-anim">
                {loading ? (
                  <div style={styles.answerLoading}>
                    <div style={styles.spinner} />
                    <span>Analyse des données pour {commune}…</span>
                  </div>
                ) : answer && (
                  <>
                    <div style={styles.verdict}>« {answer.verdict} »</div>
                    <p style={styles.detail}>{answer.detail}</p>
                    <button style={styles.answerCta}>
                      {answer.cta} →
                    </button>
                  </>
                )}
              </div>
            )}

            {!commune && (
              <div style={{textAlign:'center', color: C.dim, fontFamily:"'JetBrains Mono', monospace", fontSize:13, padding:'40px 0'}}>
                Saisissez votre commune pour voir vos questions.
              </div>
            )}
          </>
        )}

        {!commune && (
          <div style={{...glass({ borderRadius:12, padding:'40px 32px' }), textAlign:'center'}}>
            <div style={{fontSize:32, marginBottom:16}}>⌖</div>
            <div style={{fontFamily:"'Instrument Serif', serif", fontStyle:'italic', fontSize:20, color: C.muted, marginBottom:8}}>
              Saisissez votre commune dans le champ ci-dessus.
            </div>
            <div style={{fontSize:14, color: C.dim}}>
              Le module affiche 4 questions sélectionnées selon le profil de votre territoire.
            </div>
          </div>
        )}
      </section>

      {/* ═══ SECTION AMNÉSIE CLIMATIQUE ══════════════════════════ */}
      <section style={styles.amnesieSection}>
        <div style={{...styles.amnesieInner}} className="amnesie-inner">
          <div style={{position:'absolute', top:-60, right:-60, width:250, height:250, borderRadius:'50%', background:`radial-gradient(circle, ${C.orange}20 0%, transparent 70%)`, pointerEvents:'none'}} />
          <div style={styles.amnesieEyebrow}>Pourquoi s'abonner</div>
          <h2 style={styles.amnesieTitle}>
            Contre l'amnésie,<br />pas contre le climat.
          </h2>
          <p style={styles.amnesieBody}>
            Le changement climatique souffre en France d'une forme particulière d'invisibilité. Il n'est ni nié ni ignoré. Il est oublié par cycles. Chaque été, les canicules, les sécheresses, les incendies reviennent dans l'actualité. Chaque automne, l'attention s'efface. Chaque hiver, le sujet retourne à l'arrière-plan.
          </p>
          <p style={styles.amnesieBody}>
            Cette amnésie saisonnière n'est pas un manque de volonté. C'est un phénomène documenté en psychologie comportementale : la capacité finie d'inquiétude. L'attention aux risques collectifs est limitée. Quand elle se remplit d'un sujet, elle se vide d'un autre.
          </p>
          <p style={styles.amnesieBody}>
            futur•e existe contre cet oubli. Une présence éditoriale calme, mensuelle, personnalisée, qui maintient le climat de votre vie dans votre conscience active toute l'année, sans jamais peser, sans jamais profiter des pics médiatiques pour vendre sa pertinence.
          </p>
          <div style={styles.amnesieHighlight}>
            L'enjeu n'est pas de remplacer l'alarme saisonnière par une alarme permanente. L'enjeu est de rendre le climat intégrable à la texture d'une vie qui pense , à la façon dont on intègre sa santé, ses finances, l'éducation de ses enfants : sans obsession, sans oubli, avec continuité.
          </div>
        </div>
      </section>

      {/* ═══ MODULES ═════════════════════════════════════════════ */}
      <section style={styles.modulesSection}>
        <div style={{textAlign:'center', marginBottom:48}}>
          <div style={{...styles.sectionLabel, justifyContent:'center', display:'flex'}}>6 modules</div>
          <h2 style={{...styles.sectionTitle, textAlign:'center'}}>Six dimensions de votre vie</h2>
          <p style={{...styles.sectionSub, textAlign:'center', margin:'0 auto', maxWidth:560}}>
            Chaque module croise votre profil avec les données publiques disponibles pour votre commune.
          </p>
        </div>
        <div style={styles.modulesGrid} className="modules-grid">
          {MODULES.map(m => (
            <div key={m.name} style={styles.moduleCard(m.color)}>
              <div style={styles.moduleIcon(m.color)}>{m.icon}</div>
              <div style={styles.moduleName}>{m.name}</div>
              <div style={styles.moduleDesc}>{m.desc}</div>
              <div style={styles.moduleItems}>
                {m.items.map(item => (
                  <div key={item} style={styles.moduleItem(m.color)}>{item}</div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ PRICING ═════════════════════════════════════════════ */}
      <section style={styles.pricingSection}>
        <div style={{textAlign:'center', marginBottom:0}}>
          <div style={{...styles.sectionLabel, justifyContent:'center', display:'flex'}}>Tarifs</div>
          <h2 style={{...styles.sectionTitle, textAlign:'center', marginBottom:8}}>Choisissez votre formule</h2>
          <p style={{...styles.sectionSub, textAlign:'center', margin:'0 auto 40px', maxWidth:500}}>
            Un rapport gratuit pour commencer. Un abonnement si vous voulez que le suivi dure.
          </p>
        </div>
        <div style={styles.pricingGrid} className="pricing-grid">
          {/* Gratuit */}
          <div style={styles.planCard(false)}>
            <div style={styles.planPrice}>0<span style={styles.planPriceSub}>€</span></div>
            <div style={styles.planName}>Découverte</div>
            <div style={styles.planDesc}>Un rapport partiel pour voir ce que futur•e peut faire pour vous.</div>
            <div style={styles.planFeatures}>
              {['Saisie de commune et profil simplifié','Rapport partiel (1 module)','3 pages Savoir thématiques','Lien de partage temporaire 72h'].map(f => (
                <div key={f} style={styles.planFeature}><span style={styles.planCheck}>✓</span>{f}</div>
              ))}
            </div>
            <button style={styles.planBtn(false)} className="plan-btn">Commencer gratuitement</button>
          </div>

          {/* One-shot */}
          <div style={styles.planCard(false)}>
            <div style={styles.planPrice}>14<span style={styles.planPriceSub}>€ une fois</span></div>
            <div style={styles.planName}>Rapport complet</div>
            <div style={styles.planDesc}>Le rapport intégral, téléchargeable, à conserver.</div>
            <div style={styles.planFeatures}>
              {['Rapport complet PDF (6 modules)','Dashboard simplifié en lecture seule','Régénération 1 fois par an','Crédit applicable vers le Suivi'].map(f => (
                <div key={f} style={styles.planFeature}><span style={styles.planCheck}>✓</span>{f}</div>
              ))}
            </div>
            <button style={styles.planBtn(false)} className="plan-btn">Acheter le rapport</button>
          </div>

          {/* Suivi, mis en avant */}
          <div style={{...styles.planCard(true), boxShadow:`0 0 0 1px rgba(251,146,60,0.3), 0 16px 48px rgba(251,146,60,0.12)`}}>
            <div style={styles.planBadge}>Recommandé</div>
            <div style={styles.planPrice}>9<span style={styles.planPriceSub}>€ / mois</span></div>
            <div style={styles.planName}>Suivi</div>
            <div style={styles.planDesc}>Le rapport vit avec vous. Les alertes arrivent quand vos données changent.</div>
            <div style={styles.planFeatures}>
              {['Dashboard complet et interactif','Profil modifiable à tout moment','Newsletter mensuelle personnalisée','Notifications ciblées sur événements','Comparateur de villes (exclusif Foyer)','Historique des mises à jour'].map(f => (
                <div key={f} style={styles.planFeature}><span style={{color: C.orange, flexShrink:0, marginTop:1}}>✓</span>{f}</div>
              ))}
            </div>
            <button style={styles.planBtn(true)} className="plan-btn">S'abonner au Suivi</button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{borderTop:`1px solid ${C.border}`, position:'relative', zIndex:2}}>
        <div style={styles.footer}>
          <div style={styles.footerBrand}>futur<span style={{color: C.orange}}>•</span>e</div>
          <div style={styles.footerLinks}>
            {['Manifeste','Méthodologie','Pages Savoir','Contact','Mentions légales'].map(l => (
              <a key={l} style={styles.footerLink} href="#">{l}</a>
            ))}
          </div>
          <div style={{fontFamily:"'JetBrains Mono', monospace", fontSize:11, color: C.dim, letterSpacing:'0.04em'}}>
            Données publiques françaises · Aucune publicité
          </div>
        </div>
      </footer>
    </div>
  );
}
