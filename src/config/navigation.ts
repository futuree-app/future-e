export type NavLink = {
  label: string;
  href: string;
  description?: string;
  badge?: string;
};

export type NavGroup = {
  groupLabel: string;
  color: string;
  links: NavLink[];
};

export type NavFlatItem = {
  label: string;
  href: string;
  groups?: never;
};

export type NavDropdownItem = {
  label: string;
  href?: never;
  groups: NavGroup[];
};

export type NavItem = NavFlatItem | NavDropdownItem;

export const NAV_ITEMS: NavItem[] = [
  // ─── Où vivre — porte d'entrée principale du produit ────────────────────────
  { label: 'Où vivre', href: '/ou-vivre' },

  // ─── Explorer — une ligne par enjeu, et rien d'autre ────────────────────────
  //
  // Refonte du 30/07/2026. Trois choses ont disparu, et le motif de chacune compte :
  //
  // 1. LES QUATRE BADGES « BIENTÔT » (qualité de l'air, eau potable, famille, retraite). Une
  //    navigation qui annonce quatre destinations inexistantes est le signal d'inachèvement le plus
  //    visible d'un site. Elles reviendront quand elles existeront, pas avant.
  // 2. LA COLONNE « PAR PROFIL ». Elle mettait sur un même plan une tâche produit (« je cherche à
  //    déménager », doublon pur de /ou-vivre, déjà en tête de ce menu), une situation (la voiture,
  //    qui est en réalité l'enjeu Mobilité et remonte ci-dessous), une composition de foyer et un
  //    moment de vie. La doctrine produit tranche : l'archétype se prend au MOMENT, jamais à la
  //    démographie ; « j'ai des enfants » n'est donc pas une entrée de menu, c'est une contrainte
  //    du projet, saisie dans /ou-vivre.
  // 3. LES DESTINATIONS `territoires/[slug]`, retirées du produit le même jour (gabarit au score
  //    composite sur 100). Feux pointe vers son guide, seule page réelle sur le sujet ; pollutions
  //    des sols vers l'article rédigé, qui vaut mieux que le hub générique qu'il remplace.
  {
    label: 'Explorer',
    groups: [
      {
        groupLabel: 'Par enjeu',
        color: '#f87171',
        links: [
          { label: 'Chaleur et canicule',      href: '/chaleur',                       description: 'Jours > 30 °C, nuits tropicales' },
          { label: 'Inondation et submersion', href: '/inondation',                    description: 'Risque côtier et cours d\'eau' },
          { label: 'Feux de forêt',            href: '/agir/feux-forets',              description: 'Exposition, débroussaillement, prévention' },
          { label: 'Pollutions des sols',      href: '/savoir/cadmium',                description: 'Cadmium, métaux lourds, sites pollués' },
          { label: 'Maladies émergentes',      href: '/savoir/maladies-emergentes',    description: 'Moustiques, tiques, hantavirus' },
          { label: 'Mobilité',                 href: '/j-utilise-beaucoup-ma-voiture', description: 'Voiture, transports, dépendance' },
        ],
      },
    ],
  },

  { label: 'Mon rapport', href: '/rapport' },
  { label: 'Comparateur', href: '/comparateur' },
  { label: 'Pourquoi futur•e', href: '/pourquoi' },
];

// ─── Hub articles landing page ────────────────────────────────────────────────
export type HubArticle = {
  slug: string;
  title: string;
  description: string;
  category: string;
  accent: string;
  href: string;
  image?: string;
};

export const SAVOIR_HUB_ARTICLES: HubArticle[] = [
  {
    slug: 'cadmium',
    title: 'Cadmium dans les sols',
    description:
      "Un Français sur deux est surexposé. Les sols agricoles français sont naturellement chargés en cadmium, et votre commune est peut-être concernée.",
    category: 'Santé',
    accent: '#4ade80',
    href: '/savoir/cadmium',
    image: '/hub-cadmium.jpg',
  },
  {
    slug: 'dependance-auto',
    title: 'Dépendance automobile',
    description:
      "84 % des actifs ruraux utilisent leur voiture chaque jour. La transition énergétique frappe d'abord les territoires sans alternative.",
    category: 'Mobilité',
    accent: '#60a5fa',
    href: '/savoir/dependance-auto',
    image: '/hub-dependance.jpg',
  },
  {
    slug: 'canicule',
    title: 'Canicule en 2050',
    description:
      "Des villes comme Marseille atteindront 63 jours > 30 °C par an. Découvrez les communes françaises les plus exposées.",
    category: 'Environnement',
    accent: '#f87171',
    href: '/chaleur',
    image: '/hub-canicule.jpg',
  },
  {
    slug: 'submersion',
    title: 'Submersion côtière',
    description:
      "Un million de logements français sont en zone inondable. Sur le littoral atlantique, le risque progresse. Certaines communes ne seront plus assurables.",
    category: 'Environnement',
    accent: '#60a5fa',
    href: '/inondation',
    image: '/hub-submersion.jpg',
  },
  {
    slug: 'maladies-emergentes',
    title: 'Maladies émergentes',
    description:
      "Moustique tigre, West Nile, hantavirus : ce que le changement climatique déplace déjà vers la France.",
    category: 'Santé',
    accent: '#E8823A',
    href: '/savoir/maladies-emergentes',
    image: '/maladies-emergentes.png',
  },
  {
    slug: 'preparation-catastrophes',
    title: 'Sommes-nous prêts ?',
    description:
      "84 % des Français savent que leur territoire devra s'adapter. Pourtant seulement 26 % se sentent préparés à une canicule. Le paradoxe français de l'adaptation.",
    category: 'Adaptation',
    accent: '#E8823A',
    href: '/savoir/preparation-catastrophes',
    image: '/hub-preparation.jpg',
  },
];

// ─── Agir guides registry (pour les liens contextuels depuis Territoires) ─────
export const AGIR_GUIDES: Record<string, { label: string; href: string; available: boolean }> = {
  cadmium:          { label: 'Réduire son exposition au cadmium',    href: '/agir/cadmium',   available: true  },
  canicule:         { label: 'Se préparer à la canicule',            href: '/agir/canicule',    available: true  },
  submersion:       { label: 'Gérer le risque inondation',           href: '/agir/inondation',  available: true  },
  feux:             { label: 'Face aux feux de forêt',               href: '/agir/feux-forets', available: true  },
  'dependance-auto':{ label: 'Réduire sa dépendance automobile',     href: '/agir/dependance-auto', available: true  },
  'voiture-electrique': { label: "Passer à l'électrique",            href: '/agir/voiture-electrique', available: true },
  secheresse:       { label: 'Adapter ses usages à la sécheresse',   href: '/agir/secheresse',available: false },
  pollens:          { label: 'Gérer les allergies polliniques',      href: '/agir/pollens',   available: false },
};
