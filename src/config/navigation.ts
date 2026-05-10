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
  // ─── Explorer — thèmes + profils ────────────────────────────────────────────
  {
    label: 'Explorer',
    groups: [
      {
        groupLabel: 'Par thème',
        color: '#f87171',
        links: [
          {
            label: 'Chaleur et canicule',
            href: '/chaleur',
            description: 'Jours > 30 °C, nuits tropicales · DRIAS 2050',
          },
          {
            label: 'Inondation et submersion',
            href: '/inondation',
            description: 'Risque côtier et cours d\'eau · Géorisques',
          },
          {
            label: 'Feux de forêt',
            href: '/territoires/feux',
            description: 'Zones à risque incendie · Prométhée / DREAL',
          },
          {
            label: 'Pollutions des sols',
            href: '/territoires/cadmium',
            description: 'Cadmium, sites pollués · GisSol / IREP',
          },
          {
            label: 'Qualité de l\'air',
            href: '/territoires/air',
            description: 'PM2.5, NO₂, O₃ · ATMO France',
            badge: 'Bientôt',
          },
          {
            label: 'Eau potable',
            href: '/territoires/eau',
            description: 'Stress hydrique, nappes · BRGM',
            badge: 'Bientôt',
          },
          {
            label: 'Maladies émergentes',
            href: '/savoir/maladies-emergentes',
            description: 'Moustiques, tiques, hantavirus · Santé publique France',
          },
        ],
      },
      {
        groupLabel: 'Par profil',
        color: '#fb923c',
        links: [
          {
            label: 'Je cherche à déménager',
            href: '/comparateur',
            description: 'Comparer deux communes côte à côte',
          },
          {
            label: 'J\'utilise beaucoup ma voiture',
            href: '/j-utilise-beaucoup-ma-voiture',
            description: 'Vulnérabilité mobilité · INSEE / Ecolab',
          },
          {
            label: 'J\'ai des enfants',
            href: '/agir/famille',
            description: 'Santé, pollutions, qualité de vie',
            badge: 'Bientôt',
          },
          {
            label: 'Je prépare ma retraite',
            href: '/agir/retraite',
            description: 'Chaleur, dépendance, budget',
            badge: 'Bientôt',
          },
        ],
      },
    ],
  },

  { label: 'Mon rapport', href: '/rapport' },
  { label: 'Comparateur', href: '/comparateur' },
  { label: 'Pourquoi futur·e', href: '/pourquoi' },
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
      "Un Français sur deux est surexposé. Les sols agricoles français sont naturellement chargés en cadmium — et votre commune est peut-être concernée.",
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
    href: '/savoir/canicule',
    image: '/hub-canicule.jpg',
  },
  {
    slug: 'submersion',
    title: 'Submersion côtière',
    description:
      "Un million de logements français sont en zone inondable. Sur le littoral atlantique, le risque progresse. Certaines communes ne seront plus assurables.",
    category: 'Environnement',
    accent: '#60a5fa',
    href: '/savoir/submersion',
    image: '/hub-submersion.jpg',
  },
  {
    slug: 'maladies-emergentes',
    title: 'Maladies émergentes',
    description:
      "Moustique tigre, West Nile, hantavirus : ce que le changement climatique déplace déjà vers la France.",
    category: 'Santé',
    accent: '#fb923c',
    href: '/savoir/maladies-emergentes',
    image: '/maladies-emergentes.png',
  },
  {
    slug: 'preparation-catastrophes',
    title: 'Sommes-nous prêts ?',
    description:
      "84 % des Français savent que leur territoire devra s'adapter. Pourtant seulement 26 % se sentent préparés à une canicule. Le paradoxe de la résilience hexagonale.",
    category: 'Résilience',
    accent: '#fb923c',
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
