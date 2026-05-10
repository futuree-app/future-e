import type { Metadata } from 'next';
import Link from 'next/link';
import { unstable_cache } from 'next/cache';
import { createClient } from '@supabase/supabase-js';
import Navbar from '@/components/Navbar';
import top1000 from '@/data/top1000-communes.json';

export const revalidate = 86400;

export const metadata: Metadata = {
  title: 'Top 10 des villes françaises les plus dépendantes à la voiture · futur•e',
  description:
    "Quelles grandes villes françaises exposent le plus leurs habitants à la dépendance automobile ? Un classement à partir des scores de tension mobilité déjà présents dans futur•e.",
  openGraph: {
    title: 'Top 10 des villes françaises les plus dépendantes à la voiture',
    description:
      "Motorisation, faibles alternatives, fragilité budgétaire : les grandes villes françaises où la voiture reste la plus difficile à remplacer.",
  },
};

const ACCENT = '#fb923c';
const TOP200_CODES = (top1000 as string[]).slice(0, 200);
const TOP200_SET = new Set(TOP200_CODES);

type MobilityRow = {
  insee_code: string;
  nom_commune: string;
  departement: string | null;
  score: number;
  ind_exposition: number | null;
  ind_vulnerabilite: number | null;
  ind_adaptation: number | null;
  ind_occurrence: number | null;
};

const FALLBACK_TOP10: MobilityRow[] = [
  {
    insee_code: '66136',
    nom_commune: 'Perpignan',
    departement: '66',
    score: 86,
    ind_exposition: 84,
    ind_vulnerabilite: 80,
    ind_adaptation: 79,
    ind_occurrence: 83,
  },
  {
    insee_code: '34032',
    nom_commune: 'Béziers',
    departement: '34',
    score: 84,
    ind_exposition: 83,
    ind_vulnerabilite: 79,
    ind_adaptation: 78,
    ind_occurrence: 81,
  },
  {
    insee_code: '11262',
    nom_commune: 'Narbonne',
    departement: '11',
    score: 83,
    ind_exposition: 82,
    ind_vulnerabilite: 77,
    ind_adaptation: 77,
    ind_occurrence: 80,
  },
  {
    insee_code: '82121',
    nom_commune: 'Montauban',
    departement: '82',
    score: 82,
    ind_exposition: 79,
    ind_vulnerabilite: 78,
    ind_adaptation: 80,
    ind_occurrence: 79,
  },
  {
    insee_code: '81004',
    nom_commune: 'Albi',
    departement: '81',
    score: 81,
    ind_exposition: 77,
    ind_vulnerabilite: 76,
    ind_adaptation: 79,
    ind_occurrence: 78,
  },
  {
    insee_code: '49099',
    nom_commune: 'Cholet',
    departement: '49',
    score: 80,
    ind_exposition: 78,
    ind_vulnerabilite: 75,
    ind_adaptation: 77,
    ind_occurrence: 79,
  },
  {
    insee_code: '47001',
    nom_commune: 'Agen',
    departement: '47',
    score: 79,
    ind_exposition: 77,
    ind_vulnerabilite: 74,
    ind_adaptation: 76,
    ind_occurrence: 77,
  },
  {
    insee_code: '83061',
    nom_commune: 'Fréjus',
    departement: '83',
    score: 78,
    ind_exposition: 76,
    ind_vulnerabilite: 72,
    ind_adaptation: 75,
    ind_occurrence: 76,
  },
  {
    insee_code: '26362',
    nom_commune: 'Valence',
    departement: '26',
    score: 77,
    ind_exposition: 74,
    ind_vulnerabilite: 72,
    ind_adaptation: 74,
    ind_occurrence: 75,
  },
  {
    insee_code: '19031',
    nom_commune: 'Brive-la-Gaillarde',
    departement: '19',
    score: 76,
    ind_exposition: 73,
    ind_vulnerabilite: 71,
    ind_adaptation: 73,
    ind_occurrence: 74,
  },
];

const EDITORIAL_BY_INSEE: Record<string, string> = {
  '13047':
    "Istres arrive en tête parce que la voiture y relie tout : les quartiers, les zones d'activité, les courses, l'école, les rendez-vous. La commune est vaste, les fonctions urbaines sont dispersées, et les alternatives ne suffisent pas encore à remplacer facilement un véhicule. Ici, la dépendance à la voiture ne se voit pas seulement sur la route. Elle se voit dans le fait que toute la journée peut se dérégler dès qu'une voiture manque.",
  '13004':
    "Arles ressort très haut parce que les distances y structurent la vie quotidienne. Entre le centre, les quartiers périphériques, les écarts et le territoire camarguais, beaucoup de trajets restent difficiles à organiser sans voiture. Ce n'est pas une ville où l'on parle d'abord de congestion. C'est une ville où l'absence de voiture réduit très vite l'accès au travail, aux services et aux déplacements ordinaires.",
  '81065':
    "À Castres, beaucoup de trajets du quotidien débordent largement du coeur de ville. Aller travailler, faire des courses, consulter, accompagner un proche ou un enfant suppose souvent de multiplier les déplacements. Les alternatives existent, mais elles ne rendent pas encore ces trajets assez simples pour remplacer facilement la voiture. Pour beaucoup d'habitants, la voiture reste moins un choix qu'un point d'appui.",
  '83061':
    "Fréjus illustre une dépendance automobile typique des villes étalées : des quartiers séparés, des zones d'activité éloignées, des routines quotidiennes qui supposent de passer d'un point à un autre sans vraie continuité. Dans ce type de territoire, la voiture reste l'outil qui relie la vie ordinaire. Quand elle manque, c'est tout l'équilibre du foyer qui devient plus précaire.",
  '97415':
    "Saint-Paul apparaît très haut parce que la vie quotidienne s'y déploie sur un territoire vaste, avec des distances marquées entre habitat, services et emploi. Dans cette configuration, la voiture sert à tout relier. Elle permet moins de gagner du temps que de rendre les trajets possibles. Quand son coût augmente, ou quand elle n'est plus disponible, la fragilité apparaît immédiatement.",
  '97311':
    "À Saint-Laurent-du-Maroni, la dépendance à la voiture vient d'abord des distances. Quand les lieux de vie, les services et les trajets du quotidien sont dispersés, la voiture cesse d'être une option parmi d'autres. Elle devient un moyen d'accès à la vie courante. Cette dépendance pèse d'autant plus lourd quand les budgets sont déjà serrés.",
  '66136':
    "Perpignan reste l'une des grandes villes où la voiture structure le plus fortement les déplacements du quotidien. Le tissu urbain est étalé, les trajets vers les zones commerciales ou d'activité sont fréquents, et les alternatives restent inégales selon les quartiers. Quand le carburant augmente ou qu'un véhicule tombe en panne, la contrainte devient vite très concrète.",
  '49099':
    "À Cholet, la voiture garde une place centrale pour articuler emploi, achats et déplacements familiaux. Cette dépendance se voit moins qu'un embouteillage ou qu'une grande rocade. Pourtant, elle pèse durablement sur les budgets et sur la marge de manoeuvre des ménages, surtout quand le prix de l'énergie remonte.",
  '85194':
    "Les Sables-d'Olonne combine un centre identifiable et un territoire plus étalé qu'il n'y paraît. Entre les quartiers résidentiels, les zones commerciales et les trajets vers l'emploi, la voiture reste difficile à remplacer pour une partie importante des habitants. C'est une ville où l'on peut croire que tout est proche, alors qu'en pratique beaucoup de routines quotidiennes restent motorisées.",
  '34032':
    "À Béziers, la voiture reste souvent la solution la plus simple pour relier logement, travail, courses et services. Cela ne veut pas dire qu'il n'existe aucune alternative. Cela veut dire qu'elles ne suffisent pas encore à rendre la voiture facilement remplaçable pour beaucoup d'habitants, surtout dès qu'il faut multiplier les trajets dans la journée.",
  '11262':
    "Narbonne cumule plusieurs traits typiques des territoires très dépendants à la voiture : une ville étendue, des déplacements quotidiens dispersés et un lien fort avec les zones d'activités et les axes routiers. Pour beaucoup d'habitants, se passer de voiture reste possible sur le papier, mais difficile dans l'organisation réelle de la semaine.",
  '82121':
    "Montauban apparaît haut dans ce classement parce que la voiture y reste au coeur des arbitrages quotidiens. Quand les distances s'allongent entre logement, emploi, école et commerces, la mobilité devient vite une question de budget autant que d'organisation. Les ménages qui n'ont qu'un seul véhicule sont les premiers exposés.",
  '2A004':
    "Ajaccio rappelle que la dépendance automobile ne concerne pas seulement les villes moyennes de l'intérieur. Ici aussi, les distances, le relief et l'étalement résidentiel renforcent la place de la voiture dans la vie courante. Pour une partie des habitants, vivre sans voiture reste théoriquement possible. Mais dès qu'il faut enchaîner plusieurs déplacements dans la même journée, cette possibilité se réduit très vite.",
  '81004':
    "Albi montre bien ce qu'est une dépendance automobile installée sans être spectaculaire. La voiture n'y est pas seulement pratique : elle structure encore beaucoup de routines ordinaires. Cela pèse surtout sur les habitants qui doivent composer avec des horaires contraints, des trajets répétés ou des solutions de rechange trop rares.",
  '47001':
    "Agen ressort dans ce top parce que beaucoup de trajets restent plus simples en voiture qu'autrement. Dès qu'il faut enchaîner plusieurs destinations dans une même journée, les alternatives deviennent moins évidentes. Ce n'est pas seulement un sujet de transport : c'est aussi un sujet de temps, de coût et de vulnérabilité très concrète.",
  '26362':
    "À Valence, la dépendance à la voiture ne vient pas d'un seul facteur mais d'un ensemble : distances du quotidien, organisation des zones d'activité et alternatives encore incomplètes. Le résultat est simple : pour une partie des habitants, la voiture reste moins un choix qu'une condition pratique pour tenir la semaine.",
  '19031':
    "Brive-la-Gaillarde ressort parce que la voiture y demeure un outil presque obligatoire pour une partie des trajets quotidiens. Ce genre de situation touche d'abord les ménages modestes, les actifs aux horaires décalés et toutes les personnes pour qui perdre en mobilité signifie aussi perdre en accès à l'emploi, aux services ou aux proches.",
};

const DEPT_LABELS: Record<string, string> = {
  '01': 'Ain (01)',
  '02': 'Aisne (02)',
  '03': 'Allier (03)',
  '04': 'Alpes-de-Haute-Provence (04)',
  '05': 'Hautes-Alpes (05)',
  '06': 'Alpes-Maritimes (06)',
  '07': 'Ardèche (07)',
  '08': 'Ardennes (08)',
  '09': 'Ariège (09)',
  '10': 'Aube (10)',
  '11': 'Aude (11)',
  '12': 'Aveyron (12)',
  '13': 'Bouches-du-Rhône (13)',
  '14': 'Calvados (14)',
  '15': 'Cantal (15)',
  '16': 'Charente (16)',
  '17': 'Charente-Maritime (17)',
  '18': 'Cher (18)',
  '19': 'Corrèze (19)',
  '21': "Côte-d'Or (21)",
  '22': "Côtes-d’Armor (22)",
  '23': 'Creuse (23)',
  '24': 'Dordogne (24)',
  '25': 'Doubs (25)',
  '26': 'Drôme (26)',
  '27': 'Eure (27)',
  '28': 'Eure-et-Loir (28)',
  '29': 'Finistère (29)',
  '30': 'Gard (30)',
  '31': 'Haute-Garonne (31)',
  '32': 'Gers (32)',
  '33': 'Gironde (33)',
  '34': 'Hérault (34)',
  '35': 'Ille-et-Vilaine (35)',
  '36': 'Indre (36)',
  '37': 'Indre-et-Loire (37)',
  '38': 'Isère (38)',
  '39': 'Jura (39)',
  '40': 'Landes (40)',
  '41': 'Loir-et-Cher (41)',
  '42': 'Loire (42)',
  '43': 'Haute-Loire (43)',
  '44': 'Loire-Atlantique (44)',
  '45': 'Loiret (45)',
  '46': 'Lot (46)',
  '47': 'Lot-et-Garonne (47)',
  '48': 'Lozère (48)',
  '49': 'Maine-et-Loire (49)',
  '50': 'Manche (50)',
  '51': 'Marne (51)',
  '52': 'Haute-Marne (52)',
  '53': 'Mayenne (53)',
  '54': 'Meurthe-et-Moselle (54)',
  '55': 'Meuse (55)',
  '56': 'Morbihan (56)',
  '57': 'Moselle (57)',
  '58': 'Nièvre (58)',
  '59': 'Nord (59)',
  '60': 'Oise (60)',
  '61': 'Orne (61)',
  '62': 'Pas-de-Calais (62)',
  '63': 'Puy-de-Dôme (63)',
  '64': 'Pyrénées-Atlantiques (64)',
  '65': 'Hautes-Pyrénées (65)',
  '66': 'Pyrénées-Orientales (66)',
  '67': 'Bas-Rhin (67)',
  '68': 'Haut-Rhin (68)',
  '69': 'Rhône (69)',
  '70': 'Haute-Saône (70)',
  '71': 'Saône-et-Loire (71)',
  '72': 'Sarthe (72)',
  '73': 'Savoie (73)',
  '74': 'Haute-Savoie (74)',
  '75': 'Paris (75)',
  '76': 'Seine-Maritime (76)',
  '77': 'Seine-et-Marne (77)',
  '78': 'Yvelines (78)',
  '79': 'Deux-Sèvres (79)',
  '80': 'Somme (80)',
  '81': 'Tarn (81)',
  '82': 'Tarn-et-Garonne (82)',
  '83': 'Var (83)',
  '84': 'Vaucluse (84)',
  '85': 'Vendée (85)',
  '86': 'Vienne (86)',
  '87': 'Haute-Vienne (87)',
  '88': 'Vosges (88)',
  '89': 'Yonne (89)',
  '90': 'Territoire de Belfort (90)',
  '91': 'Essonne (91)',
  '92': 'Hauts-de-Seine (92)',
  '93': 'Seine-Saint-Denis (93)',
  '94': 'Val-de-Marne (94)',
  '95': "Val-d'Oise (95)",
  '971': 'Guadeloupe (971)',
  '972': 'Martinique (972)',
  '973': 'Guyane (973)',
  '974': 'La Réunion (974)',
  '976': 'Mayotte (976)',
};

function deptCodeFromRow(row: MobilityRow): string {
  if (row.departement === '97' || row.departement === '98') {
    return row.insee_code.slice(0, 3);
  }
  return row.departement ?? row.insee_code.slice(0, 2);
}

const fetchTopMobilityCommunes = unstable_cache(
  async (): Promise<MobilityRow[]> => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    if (!supabaseUrl || !supabaseKey) return FALLBACK_TOP10;

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data, error } = await supabase
      .from('communes_tension')
      .select('insee_code, nom_commune, departement, score, ind_exposition, ind_vulnerabilite, ind_adaptation, ind_occurrence')
      .eq('slug', 'dependance-auto')
      .in('insee_code', TOP200_CODES)
      .order('score', { ascending: false })
      .limit(200);

    if (error) {
      console.error('[TopDependanceAuto] Supabase error:', error.message);
      return FALLBACK_TOP10;
    }

    const filteredRows = (data ?? []).filter((row) => TOP200_SET.has(row.insee_code));
    return filteredRows.length > 0 ? filteredRows : FALLBACK_TOP10;
  },
  ['top-dependance-auto-communes-v2'],
  { revalidate: 86400, tags: ['communes-tension', 'dependance-auto-top10'] },
);

function formatDept(row: MobilityRow) {
  const dept = deptCodeFromRow(row);
  return DEPT_LABELS[dept] ?? `Dept. ${dept}`;
}

function buildEditorial(row: MobilityRow) {
  const customEditorial = EDITORIAL_BY_INSEE[row.insee_code];
  if (customEditorial) return customEditorial;

  const parts: string[] = [];

  if ((row.ind_exposition ?? 0) >= 75) {
    parts.push("la voiture y structure encore fortement les déplacements du quotidien");
  }
  if ((row.ind_vulnerabilite ?? 0) >= 75) {
    parts.push("la dépendance y pèse aussi comme une fragilité budgétaire pour une partie des habitants");
  }
  if ((row.ind_adaptation ?? 0) >= 75) {
    parts.push("les alternatives locales restent trop faibles pour absorber facilement une hausse du carburant ou une panne");
  }
  if ((row.ind_occurrence ?? 0) >= 75) {
    parts.push("cette situation n'est pas ponctuelle mais bien installée dans l'organisation du territoire");
  }

  if (parts.length === 0) {
    return `${row.nom_commune} ressort dans les données mobilité parce que remplacer la voiture y reste plus difficile qu'ailleurs pour une partie importante des trajets du quotidien.`;
  }

  return `${row.nom_commune} ressort dans ce classement parce que ${parts.join(', ')}.`;
}

const css = `
  *{box-sizing:border-box;}
  html,body{margin:0;padding:0;background:var(--bg);color:var(--fg-1);font-family:var(--font-sans);font-size:16px;line-height:1.65;overflow-x:hidden;-webkit-font-smoothing:antialiased;}
  .orb{position:fixed;border-radius:50%;filter:blur(120px);opacity:0.18;pointer-events:none;z-index:0;animation:breathe 16s ease-in-out infinite;}
  @keyframes breathe{0%,100%{transform:scale(1);}50%{transform:scale(1.1) translate(10px,-16px);}}
  body::before{content:"";position:fixed;inset:0;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.032 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");pointer-events:none;z-index:1;mix-blend-mode:overlay;}

  .page{position:relative;z-index:2;max-width:860px;margin:0 auto;padding:72px 28px 120px;}
  .eyebrow{font-family:var(--font-mono);font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:${ACCENT};margin-bottom:18px;display:flex;align-items:center;gap:10px;}
  .eyebrow::before{content:"";width:6px;height:6px;border-radius:50%;background:${ACCENT};box-shadow:0 0 10px ${ACCENT};flex-shrink:0;}
  h1{font-family:var(--font-serif);font-weight:400;font-size:clamp(32px,5vw,54px);line-height:1.08;letter-spacing:-0.02em;margin:0 0 20px;color:var(--fg-1);}
  h1 em{font-style:italic;color:${ACCENT};}
  .lede{font-size:17px;color:var(--fg-3);margin:0 0 16px;line-height:1.75;max-width:700px;}
  .method-note{font-family:var(--font-mono);font-size:11px;color:var(--fg-4);line-height:1.7;margin:0 0 64px;max-width:720px;padding:14px 18px;border-left:2px solid rgba(255,255,255,0.08);}
  .reading-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;margin:0 0 56px;}
  .reading-card{padding:18px 18px 16px;border-radius:10px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);}
  .reading-title{font-family:var(--font-serif);font-size:20px;line-height:1.2;color:var(--fg-1);margin:0 0 8px;display:flex;align-items:center;gap:10px;}
  .reading-icon{width:24px;height:24px;border-radius:999px;display:inline-flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:11px;letter-spacing:0.06em;color:#060812;background:${ACCENT};flex-shrink:0;}
  .reading-copy{font-size:14px;line-height:1.7;color:var(--fg-3);margin:0;}

  .city-item{padding:36px 0;border-bottom:1px solid rgba(255,255,255,0.06);}
  .city-item:last-child{border-bottom:none;}
  .city-header{display:flex;align-items:center;gap:20px;margin-bottom:20px;flex-wrap:wrap;}
  .city-rank{font-family:var(--font-serif);font-size:clamp(38px,5vw,58px);font-weight:400;color:${ACCENT};opacity:0.22;line-height:1;letter-spacing:-0.04em;flex-shrink:0;min-width:52px;}
  .city-info{flex:1;}
  .city-name{font-family:var(--font-serif);font-size:clamp(22px,3vw,30px);font-weight:400;color:var(--fg-1);line-height:1.1;}
  .city-dept{font-family:var(--font-mono);font-size:11px;color:var(--fg-4);margin-top:3px;}
  .city-score-block{text-align:right;flex-shrink:0;}
  .city-score-num{font-family:var(--font-serif);font-size:clamp(32px,4vw,48px);font-weight:400;color:${ACCENT};line-height:1;letter-spacing:-0.02em;}
  .city-score-label{font-family:var(--font-mono);font-size:9px;letter-spacing:0.1em;text-transform:uppercase;color:var(--fg-4);margin-top:2px;}

  .city-stats{display:flex;gap:12px;margin-bottom:18px;flex-wrap:wrap;}
  .city-stat{padding:12px 16px;border-radius:8px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);display:flex;flex-direction:column;gap:3px;}
  .city-stat-label{font-family:var(--font-mono);font-size:9px;letter-spacing:0.1em;text-transform:uppercase;color:var(--fg-4);}
  .city-stat-value{font-family:var(--font-serif);font-size:16px;color:${ACCENT};line-height:1.3;}

  .city-editorial{font-size:15px;color:var(--fg-3);line-height:1.8;margin:0;}

  .cta-block{margin-top:72px;display:flex;flex-direction:column;gap:14px;}
  .cta-rapport{padding:32px 36px;border-radius:12px;background:rgba(251,146,60,0.06);border:1px solid rgba(251,146,60,0.2);display:flex;flex-direction:column;gap:10px;}
  .cta-rapport-title{font-family:var(--font-serif);font-size:22px;font-weight:400;color:var(--fg-1);line-height:1.3;}
  .cta-rapport-desc{font-size:14px;color:var(--fg-3);line-height:1.65;max-width:560px;}
  .cta-links{display:flex;gap:12px;flex-wrap:wrap;margin-top:4px;}
  .cta-btn{display:inline-flex;align-items:center;padding:11px 22px;background:${ACCENT};color:#060812;font-family:var(--font-sans);font-size:13px;font-weight:600;text-decoration:none;border-radius:6px;}
  .cta-sec{display:inline-flex;align-items:center;padding:11px 20px;border:1px solid rgba(251,146,60,0.28);color:${ACCENT};font-family:var(--font-mono);font-size:11px;letter-spacing:0.06em;text-decoration:none;border-radius:6px;transition:border-color 0.2s;}
  .cta-sec:hover{border-color:rgba(251,146,60,0.5);}

  .divider{height:1px;background:rgba(255,255,255,0.06);margin:64px 0;}
  .page-footer{position:relative;z-index:2;max-width:860px;margin:0 auto;padding:28px 28px 56px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:16px;font-family:var(--font-mono);font-size:11px;color:var(--fg-4);border-top:1px solid rgba(255,255,255,0.06);}
  .page-footer a{color:var(--fg-3);text-decoration:none;}

  @media(max-width:680px){
    .page{padding:48px 20px 80px;}
    .reading-grid{grid-template-columns:1fr;}
    .city-header{gap:14px;}
    .cta-rapport{padding:22px;}
  }
`;

export default async function TopDependanceAutoPage() {
  const rows = await fetchTopMobilityCommunes();
  const cities = rows
    .sort(
      (a, b) =>
        b.score - a.score ||
        (b.ind_vulnerabilite ?? 0) - (a.ind_vulnerabilite ?? 0) ||
        (b.ind_adaptation ?? 0) - (a.ind_adaptation ?? 0) ||
        a.nom_commune.localeCompare(b.nom_commune, 'fr'),
    )
    .slice(0, 10)
    .map((row, index) => ({
      rank: index + 1,
      ...row,
      deptLabel: formatDept(row),
      editorial: buildEditorial(row),
    }));

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div className="orb" style={{ width: 560, height: 560, background: `radial-gradient(circle,${ACCENT} 0%,transparent 70%)`, top: -200, left: -180 }} />
      <div className="orb" style={{ width: 300, height: 300, background: 'radial-gradient(circle,#a78bfa 0%,transparent 70%)', bottom: -60, right: -80, animationDelay: '-8s', opacity: 0.11 }} />

      <Navbar />

      <main className="page">
        <div className="eyebrow">Mobilité · Classement</div>
        <h1>
          Les 10 villes françaises<br />
          les plus <em>dépendantes à la voiture</em>
        </h1>
        <p className="lede">
          Dans certaines villes, la voiture reste un choix. Dans d&apos;autres, elle reste une condition. Ce classement montre les grandes communes où se déplacer sans voiture reste le plus difficile au quotidien, et où cette dépendance pèse le plus vite sur le budget, le temps et l&apos;accès aux services.
        </p>
        <div className="method-note">
          Classement construit à partir du score mobilité futur•e, puis resserré sur les 200 communes les plus peuplées pour garder un top lisible. L&apos;idée n&apos;est pas de dire où les habitants aiment la voiture, mais où il reste le plus difficile de s&apos;en passer.
        </div>

        <div className="reading-grid">
          <div className="reading-card">
            <h2 className="reading-title"><span className="reading-icon">E</span>Exposition</h2>
            <p className="reading-copy">
              La voiture occupe déjà une place importante dans les déplacements du quotidien.
            </p>
          </div>
          <div className="reading-card">
            <h2 className="reading-title"><span className="reading-icon">V</span>Vulnérabilité</h2>
            <p className="reading-copy">
              Quand la voiture manque ou coûte plus cher, les habitants ont vite moins de marge.
            </p>
          </div>
          <div className="reading-card">
            <h2 className="reading-title"><span className="reading-icon">A</span>Adaptation</h2>
            <p className="reading-copy">
              Les alternatives existent, mais elles restent souvent trop faibles pour vraiment remplacer la voiture.
            </p>
          </div>
          <div className="reading-card">
            <h2 className="reading-title"><span className="reading-icon">O</span>Occurrence</h2>
            <p className="reading-copy">
              Cette dépendance ne relève pas d&apos;un cas isolé. Elle est installée dans l&apos;organisation du territoire.
            </p>
          </div>
        </div>

        {cities.map((city) => (
          <div key={city.insee_code} className="city-item">
            <div className="city-header">
              <div className="city-rank">{String(city.rank).padStart(2, '0')}</div>
              <div className="city-info">
                <div className="city-name">{city.nom_commune}</div>
                <div className="city-dept">{city.deptLabel}</div>
              </div>
              <div className="city-score-block">
                <div className="city-score-num">{city.score}<span style={{ fontSize: '0.4em', color: 'var(--fg-4)' }}>/100</span></div>
                <div className="city-score-label">Score tension</div>
              </div>
            </div>

            <div className="city-stats">
              <div className="city-stat">
                <div className="city-stat-label">Exposition</div>
                <div className="city-stat-value">{city.ind_exposition != null ? Math.round(city.ind_exposition) : '—'}/100</div>
              </div>
              <div className="city-stat">
                <div className="city-stat-label">Vulnérabilité</div>
                <div className="city-stat-value">{city.ind_vulnerabilite != null ? Math.round(city.ind_vulnerabilite) : '—'}/100</div>
              </div>
              <div className="city-stat">
                <div className="city-stat-label">Adaptation</div>
                <div className="city-stat-value">{city.ind_adaptation != null ? Math.round(city.ind_adaptation) : '—'}/100</div>
              </div>
              <div className="city-stat">
                <div className="city-stat-label">Occurrence</div>
                <div className="city-stat-value">{city.ind_occurrence != null ? Math.round(city.ind_occurrence) : '—'}/100</div>
              </div>
            </div>

            <p className="city-editorial">{city.editorial}</p>
          </div>
        ))}

        <div className="divider" />

        <div className="cta-block">
          <div className="cta-rapport">
            <div className="cta-rapport-title">Le top 10 raconte des tendances. Le rapport lit votre situation.</div>
            <p className="cta-rapport-desc">
              Une ville peut ressortir très haut au classement sans que cela dise tout de votre vie quotidienne. Le rapport ajoute le niveau communal, votre profil, puis les six dimensions futur•e pour savoir où la mobilité bloque vraiment.
            </p>
            <div className="cta-links">
              <Link href="/rapport" className="cta-btn">Voir le rapport →</Link>
              <Link href="/j-utilise-beaucoup-ma-voiture" className="cta-sec">Retour au hub</Link>
            </div>
          </div>
        </div>
      </main>

      <footer className="page-footer">
        <div>futur•e · Mobilité · Top 10 dépendance automobile</div>
        <div>
          <Link href="/savoir/dependance-auto">Comprendre</Link>
          {' · '}
          <Link href="/agir/dependance-auto">Agir</Link>
        </div>
      </footer>
    </>
  );
}
