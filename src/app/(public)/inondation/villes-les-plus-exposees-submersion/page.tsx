import type { Metadata } from 'next';
import Link from 'next/link';
import { unstable_cache } from 'next/cache';
import { createClient } from '@supabase/supabase-js';
import Navbar from '@/components/Navbar';

export const revalidate = 86400;

export const metadata: Metadata = {
  title: 'Top 10 des villes françaises les plus exposées à la submersion marine · futur•e',
  description:
    'Classement des 10 villes françaises les plus exposées à la montée des eaux et aux submersions marines, selon les scores submersion enregistrés en base.',
  openGraph: {
    title: 'Top 10 des villes françaises les plus exposées à la submersion marine',
    description: 'Zones sous le niveau de la mer, cordons dunaires, estuaires atlantiques : les 10 villes françaises les plus vulnérables à la submersion marine selon les scores communes_tension.',
  },
};

const ACCENT = '#38bdf8';

type CoastalEditorial = {
  nom: string;
  insee: string;
  dept: string;
  altitudeM: number;
  descriptionSite: string;
  mareeLabel?: string;
  tieBreaker: number;
  editorial: string;
  sources: string;
};

type CommuneTensionRow = {
  insee_code: string;
  nom_commune: string;
  departement: string | null;
  score: number;
  altitude_m?: number | null;
};

// Score : max(0, round(100 - max(0, altitude) × (100/15)))
// 0 m au-dessus de la mer = 100 | 3 m = 80 | 5 m = 67 | 10 m = 33 | 15 m = 0
const COASTAL_EDITORIAL: CoastalEditorial[] = [
  {
    nom: 'Arles',
    insee: '13004',
    dept: 'Bouches-du-Rhône (13)',
    altitudeM: -1.5,
    descriptionSite: 'Camargue et delta du Rhône',
    mareeLabel: 'Marées faibles, surcotes de tempête',
    tieBreaker: 76,
    editorial: "Arles n'est pas une ville côtière au sens habituel du terme : son centre historique se trouve loin du rivage. Mais la commune est immense, et son territoire descend jusqu'à la Camargue maritime, entre le Rhône, les étangs, les marais salants et la Méditerranée. C'est cette géographie communale qui explique son score. Une partie du territoire arlésien est très basse, parfois sous le niveau moyen de la mer, et dépend d'un équilibre fragile entre digues, canaux, drainage agricole et protections du littoral. Le risque ne se lit donc pas seulement depuis le centre-ville. Il concerne surtout les zones basses du delta, où une surcote marine, une tempête méditerranéenne ou une crue du Rhône peuvent se combiner et ralentir l'évacuation de l'eau.",
    sources: 'IGN/EUDEM, Géorisques, plan Rhône, Parc naturel régional de Camargue, BRGM littoral',
  },
  {
    nom: 'Arcachon',
    insee: '33009',
    dept: 'Gironde (33)',
    altitudeM: -0.5,
    descriptionSite: 'Bassin, passes et cordons sableux',
    mareeLabel: 'Marées de 3 à 5 m',
    tieBreaker: 98,
    editorial: "Arcachon vit au bord d'une mer intérieure qui semble abritée, mais le bassin n'est pas fermé. Les passes l'ouvrent directement sur l'Atlantique, et les marées y font entrer et sortir de très grands volumes d'eau. La ville basse, le port, les quartiers proches du front de mer et les secteurs gagnés sur les zones humides sont les plus sensibles. Une tempête d'ouest, si elle arrive en même temps qu'une grande marée, peut faire monter le niveau du bassin au-dessus des niveaux habituels et pousser l'eau dans les rues basses. La montée du niveau marin ne crée pas un risque entièrement nouveau à Arcachon. Elle relève progressivement le point de départ de chaque marée et réduit la marge de sécurité des quais, des digues et des plages qui protègent la ville.",
    sources: 'BRGM, Cerema, SHOM, Géorisques, Observatoire de la côte Nouvelle-Aquitaine',
  },
  {
    nom: 'Saint-Hilaire-de-Riez',
    insee: '85226',
    dept: 'Vendée (85)',
    altitudeM: -0.4,
    descriptionSite: 'Marais breton et cordon dunaire',
    mareeLabel: 'Marées de 4 à 5 m',
    tieBreaker: 90,
    editorial: "Saint-Hilaire-de-Riez est construite entre l'Atlantique, les dunes et les marais. Cette disposition fait sa vulnérabilité : une partie du territoire communal se trouve derrière un cordon sableux qui protège les terres basses, mais qui peut être entamé par l'érosion et les tempêtes. La tempête Xynthia, en février 2010, a rappelé ce que produit la combinaison d'une dépression, d'une grande marée et de quartiers bas sur le littoral vendéen. Saint-Hilaire-de-Riez n'a pas connu le même bilan humain que les communes les plus touchées, mais sa géographie relève du même système côtier. Le score élevé traduit cette exposition physique : faible altitude, proximité directe de l'océan, zones humides arrière-littorales, et dépendance aux protections naturelles ou artificielles.",
    sources: 'Géorisques, plan de prévention des risques littoraux Vendée, Cerema, BRGM, IGN/EUDEM',
  },
  {
    nom: 'Mauguio',
    insee: '34154',
    dept: 'Hérault (34)',
    altitudeM: 0.1,
    descriptionSite: 'Étang de l’Or et lido méditerranéen',
    mareeLabel: 'Marées faibles, coups de mer méditerranéens',
    tieBreaker: 88,
    editorial: "Mauguio est souvent perçue comme une commune de plaine près de Montpellier. Son risque de submersion se comprend plutôt par Carnon, l'étang de l'Or et le lido qui sépare la lagune de la Méditerranée. Dans ce paysage très bas, quelques dizaines de centimètres comptent. Les marées méditerranéennes sont faibles, mais les coups de mer peuvent faire monter brutalement le niveau de l'eau sous l'effet du vent, surtout quand les étangs sont déjà hauts après des pluies intenses. La montée du niveau marin rend ces épisodes plus faciles à déclencher : la mer part de plus haut, le lido protège moins, et les écoulements vers la lagune deviennent plus difficiles. Le risque concerne donc autant la façade maritime que les zones basses autour de l'étang.",
    sources: 'BRGM, Cerema, Géorisques, plan de prévention des risques littoraux Hérault, Observatoire du littoral Occitanie',
  },
  {
    nom: 'Saint-Brevin-les-Pins',
    insee: '44154',
    dept: 'Loire-Atlantique (44)',
    altitudeM: 0.6,
    descriptionSite: 'Embouchure de la Loire',
    mareeLabel: 'Marées de 4 à 6 m',
    tieBreaker: 92,
    editorial: "Saint-Brevin-les-Pins occupe la rive sud de l'estuaire de la Loire, face à Saint-Nazaire. Ce n'est pas seulement une commune de plage : c'est un point de rencontre entre l'océan, un grand fleuve et des zones basses urbanisées. Lors des grandes marées, l'eau remonte dans l'estuaire. Lors des tempêtes atlantiques, le vent peut pousser la mer vers l'intérieur et freiner l'écoulement de la Loire. Si les deux phénomènes coïncident, les quartiers proches du front de mer, les secteurs bas et les abords de l'estuaire perdent une partie de leur marge de sécurité. Le score élevé traduit cette configuration : une altitude faible, une exposition à l'Atlantique, et une dépendance à la manière dont l'estuaire absorbe les épisodes extrêmes.",
    sources: 'Géorisques, Cerema, SHOM, GIP Loire Estuaire, plan de prévention des risques littoraux Loire-Atlantique',
  },
  {
    nom: 'Urrugne',
    insee: '64545',
    dept: 'Pyrénées-Atlantiques (64)',
    altitudeM: 0.8,
    descriptionSite: 'Baie de Saint-Jean-de-Luz et côte basque',
    mareeLabel: 'Marées de 3 à 5 m',
    tieBreaker: 72,
    editorial: "Urrugne associe deux paysages très différents : des reliefs basques qui montent vite, et une façade littorale autour de Socoa, de la baie de Saint-Jean-de-Luz et de la corniche. Le score de submersion ne décrit donc pas toute la commune. Il pointe les secteurs bas en contact avec la mer, là où les vagues atlantiques, les grandes marées et les tempêtes peuvent concentrer l'eau. Sur la côte basque, le risque ne vient pas seulement d'une mer qui monte lentement. Il vient aussi de la puissance de la houle, de l'érosion des falaises et des ouvrages portuaires qui protègent les zones habitées. Quand le niveau marin s'élève, les mêmes coups de mer atteignent plus facilement les quais, les routes basses et les fronts bâtis.",
    sources: 'BRGM, Observatoire de la côte de Nouvelle-Aquitaine, Géorisques, SHOM, Cerema',
  },
  {
    nom: 'Grande-Synthe',
    insee: '59271',
    dept: 'Nord (59)',
    altitudeM: 0,
    descriptionSite: 'Terre sous le niveau de la mer',
    mareeLabel: 'Marées de 5 à 6 m',
    tieBreaker: 95,
    editorial: "Grande-Synthe est construite sur des terres qui se trouvent sous le niveau de la mer. Sans le réseau de digues et de canaux qui l'entoure, la commune entière serait sous l'eau en permanence. Ce système de protection, hérité des siècles passés, fonctionne tant que les tempêtes restent dans les limites prévues. Lors d'une forte tempête coïncidant avec une grande marée, la mer peut dépasser le niveau des protections et inonder la zone très rapidement, sans que les habitants aient le temps d'évacuer. La montée du niveau de la mer prévue par le Groupe d'experts intergouvernemental sur l'évolution du climat (plus 50 cm à plus 1 m d'ici 2100) rendra le maintien de ces protections de plus en plus difficile et coûteux.",
    sources: 'BRGM, IGN, plan de prévention des risques littoraux Nord, Géorisques GASPAR',
  },
  {
    nom: 'Gravelines',
    insee: '59273',
    dept: 'Nord (59)',
    altitudeM: 1,
    descriptionSite: 'Terre sous le niveau de la mer',
    mareeLabel: 'Marées de 5 à 6 m',
    tieBreaker: 100,
    editorial: "Gravelines est l'un des points les plus sensibles du littoral français parce que plusieurs enjeux se superposent au même endroit : une plaine maritime très basse, un port, des digues, des canaux et la centrale nucléaire la plus puissante du pays. La commune appartient au système des wateringues, ces terres gagnées sur la mer et maintenues habitables par drainage permanent. En temps normal, ce dispositif rend le territoire ordinaire. Lors d'une tempête de mer du Nord, surtout si elle coïncide avec une grande marée, la situation change : l'eau peut pousser contre les digues pendant que les canaux évacuent moins bien vers la mer. La montée du niveau marin ne signifie pas que Gravelines sera submergée demain. Elle réduit progressivement la marge entre le niveau de l'eau et les protections qui rendent la commune habitable.",
    sources: 'BRGM, IGN, plan de prévention des risques littoraux Flandres, EDF, Géorisques',
  },
  {
    nom: 'Fos-sur-Mer',
    insee: '13039',
    dept: 'Bouches-du-Rhône (13)',
    altitudeM: 1.1,
    descriptionSite: 'Golfe de Fos et étangs littoraux',
    mareeLabel: 'Marées faibles, surcotes de mistral et tempêtes',
    tieBreaker: 78,
    editorial: "Fos-sur-Mer est installée dans une zone où la mer, les étangs, les canaux industriels et les anciennes plaines humides se touchent presque. Le golfe de Fos est protégé de certaines houles, mais il reste ouvert aux surcotes liées au vent et aux tempêtes méditerranéennes. La commune concentre aussi des infrastructures portuaires et industrielles à très faible altitude, ce qui change la nature du risque : la submersion ne concerne pas seulement des plages ou des quartiers résidentiels, elle peut toucher des accès, des réseaux, des zones d'activité et des sols déjà très artificialisés. Dans ce type de territoire, quelques centimètres de niveau marin supplémentaire ont un effet concret. Ils rendent plus fréquents les débordements qui étaient auparavant limités aux épisodes les plus défavorables.",
    sources: 'BRGM, Cerema, Géorisques, Grand Port Maritime de Marseille, IGN/EUDEM',
  },
  {
    nom: 'Sète',
    insee: '34301',
    dept: 'Hérault (34)',
    altitudeM: 1,
    descriptionSite: 'Île entre mer et lagune',
    mareeLabel: 'Marées très faibles (Méditerranée)',
    tieBreaker: 89,
    editorial: "Sète est une île artificielle coincée entre la mer Méditerranée et l'étang de Thau, avec un centre-ville à moins d'un mètre au-dessus du niveau de la mer. En Méditerranée, les marées sont quasi nulles, mais les tempêtes peuvent faire monter le niveau de la mer de 50 à 80 cm en quelques heures sous l'effet du vent. En 2003 et en 2019, des quartiers du centre ont été inondés lors de coups de mer. La bande de sable qui sépare la plage du centre-ville est en érosion : elle recule sous l'effet de la houle, réduisant d'année en année la protection naturelle de la ville. Géorisques classe Sète parmi les communes méditerranéennes les plus vulnérables à la submersion.",
    sources: 'BRGM, Cerema, Géorisques GASPAR, plan de prévention des risques littoraux Sète, Copernicus',
  },
  {
    nom: 'Dunkerque',
    insee: '59183',
    dept: 'Nord (59)',
    altitudeM: 2,
    descriptionSite: 'Plaine littorale basse',
    mareeLabel: 'Marées de 5 à 6 m',
    tieBreaker: 94,
    editorial: "Dunkerque est un grand port maritime construit sur une plaine côtière à peine au-dessus de la mer du Nord. Lors des grandes marées, l'eau monte de 5 à 6 mètres entre marée basse et marée haute. Une tempête venant du nord-ouest, en coïncidant avec une grande marée, peut faire monter le niveau de la mer d'un mètre supplémentaire, portant l'eau au bord des digues de protection. Des quartiers de la ville basse ont été inondés à plusieurs reprises au cours du XXe siècle. La Communauté Urbaine de Dunkerque a engagé un plan de 200 millions d'euros pour renforcer la protection du littoral d'ici 2050.",
    sources: 'BRGM, plan de prévention des risques littoraux Dunkerque, Communauté Urbaine de Dunkerque, Géorisques',
  },
  {
    nom: 'Les Sables-d\'Olonne',
    insee: '85194',
    dept: 'Vendée (85)',
    altitudeM: 2,
    descriptionSite: 'Cordon de sable et estuaire',
    mareeLabel: 'Marées de 4 à 5 m',
    tieBreaker: 84,
    editorial: "La tempête Xynthia, en février 2010, a frappé le littoral vendéen avec une brutalité inédite. À La Faute-sur-Mer, à 20 km des Sables-d'Olonne, 29 personnes sont mortes noyées dans leurs maisons en une seule nuit. Les Sables-d'Olonne ont été moins touchées, mais plusieurs quartiers bas ont été inondés. La ville est construite sur une bande de sable et une plaine côtière de moins de 3 mètres au-dessus de la mer, exposée à l'Atlantique sans protection naturelle. Le plan de prévention des risques littoraux classe plusieurs dizaines d'hectares en zone inconstructible.",
    sources: 'Géorisques GASPAR, plan de prévention des risques littoraux Vendée, Cerema, BRGM',
  },
  {
    nom: 'Calais',
    insee: '62193',
    dept: 'Pas-de-Calais (62)',
    altitudeM: 1,
    descriptionSite: 'Plaine littorale',
    mareeLabel: 'Marées de 6 à 7 m',
    tieBreaker: 82,
    editorial: "Calais est une ville de détroit, construite entre un port, des dunes, des canaux et une plaine maritime très basse. La Manche y concentre des marées fortes, avec plusieurs mètres d'écart entre basse mer et pleine mer. Ce mouvement est normal, mais il devient dangereux quand une tempête pousse l'eau vers la côte au même moment qu'une grande marée. Les secteurs bas autour du port, des canaux et de la plaine arrière-littorale peuvent alors recevoir l'eau rapidement, ou avoir plus de difficulté à l'évacuer. Le score élevé de Calais vient de cette combinaison : altitude faible, forte amplitude de marée, exposition aux vents de Manche et présence d'ouvrages de protection dont l'efficacité dépend du niveau atteint par la mer.",
    sources: 'BRGM, plan de prévention des risques littoraux Pas-de-Calais, Géorisques GASPAR, SHOM',
  },
  {
    nom: 'Saint-Nazaire',
    insee: '44184',
    dept: 'Loire-Atlantique (44)',
    altitudeM: 1.9,
    descriptionSite: 'Port atlantique et estuaire de la Loire',
    mareeLabel: 'Marées de 4 à 6 m',
    tieBreaker: 93,
    editorial: "Saint-Nazaire est à la fois une ville portuaire atlantique et la porte maritime de la Loire. Cette double position explique son exposition. Côté océan, les tempêtes peuvent faire monter le niveau de la mer contre les quais, les digues et les fronts bâtis. Côté estuaire, la marée remonte dans le fleuve et peut gêner l'évacuation des eaux vers l'Atlantique, surtout lorsque les vents poussent l'eau vers l'intérieur. Le risque ne se limite donc pas à une ligne de plage. Il concerne aussi les infrastructures portuaires, les bassins, les accès routiers bas et les quartiers proches de l'eau. Avec la montée du niveau marin, les épisodes qui restaient contenus dans les ouvrages portuaires ont moins de marge avant de déborder.",
    sources: 'Géorisques, Cerema, SHOM, GIP Loire Estuaire, Grand Port Maritime Nantes Saint-Nazaire',
  },
  {
    nom: 'La Rochelle',
    insee: '17300',
    dept: 'Charente-Maritime (17)',
    altitudeM: 3,
    descriptionSite: 'Rade et marais côtiers',
    mareeLabel: 'Marées de 4 à 5 m',
    tieBreaker: 86,
    editorial: "La Rochelle est entourée d'eau sur trois côtés : l'Atlantique à l'ouest, des marais et des terres basses au nord et au sud. La tempête Xynthia de 2010 a fait monter la mer d'un mètre au-dessus des niveaux habituels, inondant plusieurs quartiers bas de l'agglomération. La commune de L'Aiguillon-sur-Mer, à 30 km, a perdu 12 personnes cette nuit-là. La Rochelle est l'une des premières villes françaises à avoir intégré explicitement la montée des eaux dans son plan d'urbanisme, avec des projections tablant sur 60 cm à 1 m de hausse du niveau marin d'ici 2100.",
    sources: 'BRGM, Géorisques GASPAR, plan de prévention des risques littoraux Charente-Maritime, Ville de La Rochelle',
  },
  {
    nom: 'Saint-Malo',
    insee: '35288',
    dept: 'Ille-et-Vilaine (35)',
    altitudeM: 5,
    descriptionSite: 'Baie à très forte marée',
    mareeLabel: 'Marées jusqu\'à 13 m',
    tieBreaker: 81,
    editorial: "Saint-Malo enregistre les marées les plus importantes de France : jusqu'à 13 mètres de différence entre marée basse et marée haute lors des grandes marées d'équinoxe. Par fort coefficient, la mer monte au niveau des remparts, et les vagues les franchissent parfois lors des tempêtes. Plusieurs quartiers du Sillon, la langue de sable qui relie la vieille ville au continent, sont régulièrement balayés par les paquets de mer. La ville a subi des submersions de voirie lors des tempêtes Ciara (2020) et Ciarán (2023). Avec la montée du niveau marin, des marées qui débordent exceptionnellement aujourd'hui deviendront courantes d'ici la fin du siècle.",
    sources: 'SHOM, Géorisques GASPAR, plan de prévention des risques littoraux Ille-et-Vilaine, Cerema',
  },
  {
    nom: 'Royan',
    insee: '17306',
    dept: 'Charente-Maritime (17)',
    altitudeM: 5,
    descriptionSite: 'Estuaire de la Gironde',
    mareeLabel: 'Marées de 4 à 5 m',
    tieBreaker: 79,
    editorial: "Royan est à l'entrée de la Gironde, le plus grand estuaire d'Europe occidentale. Lors d'une forte tempête atlantique combinée à une grande marée, la mer peut remonter dans l'estuaire bien au-delà de son niveau habituel, et bloquer en même temps l'écoulement des eaux de la Gironde vers l'océan. Lors de la tempête Xynthia, des quartiers bas de Royan ont été inondés. La côte sauvage au nord recule de 1 à 3 mètres par an sous l'effet de l'érosion, et ce recul s'accélère avec la montée des eaux.",
    sources: 'BRGM, Géorisques GASPAR, plan de prévention des risques littoraux Charente-Maritime, GIP Littoral Aquitain',
  },
  {
    nom: 'Boulogne-sur-Mer',
    insee: '62160',
    dept: 'Pas-de-Calais (62)',
    altitudeM: 6,
    descriptionSite: 'Estuaire de la Liane',
    mareeLabel: 'Marées de 7 à 9 m',
    tieBreaker: 77,
    editorial: "Boulogne-sur-Mer est le premier port de pêche de France, construit à l'embouchure de la Liane. La ville basse, en bord d'estuaire, se situe à moins de 6 mètres au-dessus de la mer, avec des marées qui montent de 8 à 9 mètres lors des grandes marées. Une tempête atlantique coïncidant avec une grande marée peut faire monter la mer dans l'estuaire et inonder les zones basses du port. La tempête Ciara, en 2020, a causé des submersions dans le bas-port. La Liane est aussi sujette aux crues lors des pluies intenses, ce qui peut aggraver les inondations en bloquant le drainage des quartiers bas.",
    sources: 'BRGM, Géorisques GASPAR, plan de prévention des risques littoraux Pas-de-Calais, SHOM, Cerema',
  },
];

const EDITORIAL_BY_INSEE = new Map(COASTAL_EDITORIAL.map((city) => [city.insee, city]));

// Départage uniquement les scores égaux : historique documenté, exposition du tissu habité,
// présence d'enjeux critiques et dépendance à des protections littorales.
const DEFAULT_TIE_BREAKER = 50;

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
  '17': 'Charente-Maritime (17)',
  '22': 'Côtes-d’Armor (22)',
  '29': 'Finistère (29)',
  '30': 'Gard (30)',
  '33': 'Gironde (33)',
  '34': 'Hérault (34)',
  '35': 'Ille-et-Vilaine (35)',
  '40': 'Landes (40)',
  '44': 'Loire-Atlantique (44)',
  '50': 'Manche (50)',
  '56': 'Morbihan (56)',
  '59': 'Nord (59)',
  '62': 'Pas-de-Calais (62)',
  '64': 'Pyrénées-Atlantiques (64)',
  '66': 'Pyrénées-Orientales (66)',
  '76': 'Seine-Maritime (76)',
  '83': 'Var (83)',
  '85': 'Vendée (85)',
  '2A': 'Corse-du-Sud (2A)',
  '2B': 'Haute-Corse (2B)',
};

const fetchTopSubmersionCommunes = unstable_cache(
  async (): Promise<CommuneTensionRow[]> => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.warn('[SubmersionTop10] Missing Supabase env vars');
      return [];
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const baseQuery = () =>
      supabase
        .from('communes_tension')
        .select('insee_code, nom_commune, departement, score, altitude_m')
        .eq('slug', 'submersion')
        .order('score', { ascending: false })
        .limit(10);

    const { data, error } = await baseQuery();

    if (!error) return data ?? [];

    // Backward compatible if the production table has not received altitude_m yet.
    const fallback = await supabase
      .from('communes_tension')
      .select('insee_code, nom_commune, departement, score')
      .eq('slug', 'submersion')
      .order('score', { ascending: false })
      .limit(10);

    if (fallback.error) {
      console.error('[SubmersionTop10] Supabase error:', fallback.error.message);
      return [];
    }

    return fallback.data ?? [];
  },
  ['top-submersion-communes'],
  { revalidate: 86400, tags: ['communes-tension', 'submersion-top10'] },
);

function formatDept(row: CommuneTensionRow, editorial?: CoastalEditorial): string {
  if (editorial?.dept) return editorial.dept;
  const dept = row.departement ?? row.insee_code.slice(0, 2);
  return DEPT_LABELS[dept] ?? `Dept. ${dept}`;
}

function formatAltitude(altitudeM?: number | null): string | null {
  if (altitudeM == null) return null;
  if (altitudeM <= 0) return 'Au niveau de la mer';
  return `${Number.isInteger(altitudeM) ? altitudeM : altitudeM.toFixed(1)} m`;
}

function defaultEditorial(cityName: string): string {
  return `${cityName} ressort dans les données de submersion marine parce que la commune combine un contact direct avec la mer, une lagune ou un estuaire, et une altitude basse sur au moins une partie de son territoire. Le score affiché provient de la base communes_tension alimentée par le script altimétrique côtier ; il peut donc évoluer quand les données sont recalculées.`;
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
  .lede{font-size:17px;color:var(--fg-3);margin:0 0 16px;line-height:1.75;max-width:680px;}
  .hero-image{width:100%;height:auto;display:block;border-radius:12px;margin:0 0 28px;border:1px solid rgba(255,255,255,0.08);}
  .method-note{font-family:var(--font-mono);font-size:11px;color:var(--fg-4);line-height:1.7;margin:0 0 64px;max-width:680px;padding:14px 18px;border-left:2px solid rgba(255,255,255,0.08);}

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

  .city-editorial{font-size:15px;color:var(--fg-3);line-height:1.8;margin:0 0 12px;}
  .city-sources{font-family:var(--font-mono);font-size:10px;color:var(--fg-4);}
  .city-link{display:inline-flex;align-items:center;gap:6px;font-family:var(--font-mono);font-size:10px;letter-spacing:0.08em;text-transform:uppercase;color:${ACCENT};text-decoration:none;margin-top:10px;opacity:0.8;transition:opacity 0.2s;}
  .city-link:hover{opacity:1;}

  .cta-block{margin-top:72px;display:flex;flex-direction:column;gap:14px;}
  .cta-rapport{padding:32px 36px;border-radius:12px;background:rgba(56,189,248,0.06);border:1px solid rgba(56,189,248,0.2);display:flex;flex-direction:column;gap:10px;}
  .cta-rapport-title{font-family:var(--font-serif);font-size:22px;font-weight:400;color:var(--fg-1);line-height:1.3;}
  .cta-rapport-desc{font-size:14px;color:var(--fg-3);line-height:1.65;max-width:560px;}
  .cta-links{display:flex;gap:12px;flex-wrap:wrap;margin-top:4px;}
  .cta-btn{display:inline-flex;align-items:center;padding:11px 22px;background:${ACCENT};color:#060812;font-family:var(--font-sans);font-size:13px;font-weight:600;text-decoration:none;border-radius:6px;}
  .cta-sec{display:inline-flex;align-items:center;padding:11px 20px;border:1px solid rgba(56,189,248,0.28);color:${ACCENT};font-family:var(--font-mono);font-size:11px;letter-spacing:0.06em;text-decoration:none;border-radius:6px;transition:border-color 0.2s;}
  .cta-sec:hover{border-color:rgba(56,189,248,0.5);}

  .divider{height:1px;background:rgba(255,255,255,0.06);margin:64px 0;}
  .page-footer{position:relative;z-index:2;max-width:860px;margin:0 auto;padding:28px 28px 56px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:16px;font-family:var(--font-mono);font-size:11px;color:var(--fg-4);border-top:1px solid rgba(255,255,255,0.06);}
  .page-footer a{color:var(--fg-3);text-decoration:none;}

  @media(max-width:680px){
    .page{padding:48px 20px 80px;}
    .city-header{gap:14px;}
    .cta-rapport{padding:22px;}
  }
`;

export default async function SubmersionTop10() {
  const rows = await fetchTopSubmersionCommunes();
  const cities = rows
    .map((row) => {
      const editorial = EDITORIAL_BY_INSEE.get(row.insee_code);
      const altitudeM = row.altitude_m ?? editorial?.altitudeM ?? null;

      return {
        insee: row.insee_code,
        nom: row.nom_commune,
        dept: formatDept(row, editorial),
        score: row.score,
        tieBreaker: editorial?.tieBreaker ?? DEFAULT_TIE_BREAKER,
        altitudeLabel: formatAltitude(altitudeM),
        descriptionSite: editorial?.descriptionSite ?? 'Commune littorale basse',
        mareeLabel: editorial?.mareeLabel,
        editorial: editorial?.editorial ?? defaultEditorial(row.nom_commune),
        sources:
          editorial?.sources ??
          'communes_tension Supabase, script altimétrique côtier, IGN/EUDEM, Géorisques',
      };
    })
    .sort((a, b) => b.score - a.score || b.tieBreaker - a.tieBreaker || a.nom.localeCompare(b.nom, 'fr'))
    .map((city, i) => ({ ...city, rank: i + 1 }));

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div className="orb" style={{ width: 560, height: 560, background: `radial-gradient(circle,${ACCENT} 0%,transparent 70%)`, top: -200, left: -180 }} />
      <div className="orb" style={{ width: 300, height: 300, background: 'radial-gradient(circle,#818cf8 0%,transparent 70%)', bottom: -60, right: -80, animationDelay: '-8s', opacity: 0.11 }} />

      <Navbar />

      <main className="page">
        <div className="eyebrow">Submersion marine · Classement 2050</div>
        <h1>
          Les 10 villes françaises<br />
          les plus exposées à la <em>submersion marine</em>
        </h1>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/top10-submersion-marine.jpg"
          alt="Littoral à marée très haute sous un ciel froid, image éditoriale de submersion marine"
          className="hero-image"
        />
        <p className="lede">
          Terres sous le niveau de la mer, bandes de sable qui rétrécissent, estuaires atlantiques : les dix villes françaises les plus vulnérables à la montée des eaux et aux submersions marines, selon les données de hauteur IGN et les projections du service géologique de l&apos;État (BRGM).
        </p>
        <div className="method-note">
          Comment lire ce classement. Le score principal vient de la base communes_tension et mesure l&apos;exposition altimétrique côtière. Quand plusieurs villes ont le même score, elles sont départagées par des signaux historiques et territoriaux : submersions déjà documentées, exposition directe des zones habitées, amplitude des marées, dépendance aux digues ou aux cordons dunaires, présence d&apos;enjeux portuaires ou industriels. Les inondations fluviales et pluviales sont un risque différent : elles font l&apos;objet d&apos;un classement séparé.
        </div>

        {cities.length === 0 && (
          <p className="city-editorial">
            Le classement n&apos;est pas disponible pour le moment : aucune commune submersion n&apos;a été trouvée dans la base.
          </p>
        )}

        {cities.map((city) => (
          <div key={city.insee} className="city-item">
            <div className="city-header">
              <div className="city-rank">{String(city.rank).padStart(2, '0')}</div>
              <div className="city-info">
                <div className="city-name">{city.nom}</div>
                <div className="city-dept">{city.dept}</div>
              </div>
              <div className="city-score-block">
                <div className="city-score-num">{city.score}<span style={{ fontSize: '0.4em', color: 'var(--fg-4)' }}>/100</span></div>
                <div className="city-score-label">Score tension</div>
              </div>
            </div>

            <div className="city-stats">
              {city.altitudeLabel && (
                <div className="city-stat">
                  <div className="city-stat-label">Hauteur au-dessus de la mer</div>
                  <div className="city-stat-value">{city.altitudeLabel}</div>
                </div>
              )}
              <div className="city-stat">
                <div className="city-stat-label">Situation géographique</div>
                <div className="city-stat-value">{city.descriptionSite}</div>
              </div>
              {city.mareeLabel && (
                <div className="city-stat">
                  <div className="city-stat-label">Marées</div>
                  <div className="city-stat-value">{city.mareeLabel}</div>
                </div>
              )}
            </div>

            <p className="city-editorial">{city.editorial}</p>
            <div className="city-sources">Sources : {city.sources}</div>
            <Link href={`/inondation/${city.insee}`} className="city-link">
              Données complètes pour {city.nom} →
            </Link>
          </div>
        ))}

        <div className="divider" />

        <div className="cta-block">
          <div className="cta-rapport">
            <div className="cta-rapport-title">Votre commune est-elle exposée à la submersion ?</div>
            <p className="cta-rapport-desc">
              Ces dix villes concentrent les risques côtiers les plus élevés, mais la submersion marine concerne des centaines de communes du littoral français. Cherchez la vôtre pour voir son niveau d&apos;exposition, puis construisez votre rapport personnalisé.
            </p>
            <div className="cta-links">
              <Link href="/rapport" className="cta-btn">Créer mon rapport →</Link>
              <Link href="/inondation" className="cta-sec">Explorer par commune</Link>
              <Link href="/inondation/villes-les-plus-exposees" className="cta-sec">Top 10 inondations fluviales</Link>
            </div>
          </div>
        </div>
      </main>

      <footer className="page-footer">
        <div>futur•e · Submersion marine · Top 10 villes les plus exposées</div>
        <div>
          <Link href="/inondation">← Toutes les communes</Link>
          {' · '}
          <Link href="/pourquoi">Méthodologie</Link>
        </div>
      </footer>
    </>
  );
}
