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
  { label: 'Le produit', href: '#produit' },

  // ─── Savoir — contenu éditorial gratuit ─────────────────────────────────────
  {
    label: 'Savoir',
    groups: [
      {
        groupLabel: 'Santé',
        color: '#4ade80',
        links: [
          {
            label: 'Cadmium dans les sols',
            href: '/savoir/cadmium',
            description: 'Pollution naturelle et alimentation',
          },
          {
            label: 'Pollens & allergies',
            href: '/savoir/pollens',
            description: 'Saison pollinique élargie en 2050',
            badge: 'Bientôt',
          },
        ],
      },
      {
        groupLabel: 'Mobilité',
        color: '#60a5fa',
        links: [
          {
            label: 'Dépendance automobile',
            href: '/savoir/dependance-auto',
            description: 'Vulnérabilité des territoires ruraux',
          },
        ],
      },
      {
        groupLabel: 'Environnement',
        color: '#f87171',
        links: [
          {
            label: 'Canicule en 2050',
            href: '/savoir/canicule',
            description: 'Projections DRIAS pour les villes françaises',
          },
          {
            label: 'Submersion côtière',
            href: '/savoir/submersion',
            description: 'Risque inondation et littoral',
          },
          {
            label: 'Feux de forêt',
            href: '/savoir/feux',
            description: 'Extension des zones à risque incendie',
          },
          {
            label: 'Sécheresse',
            href: '/savoir/secheresse',
            description: 'Stress hydrique des sols agricoles',
          },
        ],
      },
    ],
  },

  // ─── Territoires — données communes, 100% gratuit ────────────────────────────
  {
    label: 'Territoires',
    groups: [
      {
        groupLabel: 'Chercher ma commune',
        color: '#60a5fa',
        links: [
          {
            label: 'Communes exposées à la chaleur',
            href: '/territoires/canicule',
            description: 'Score de tension · Jours > 30 °C en 2050',
          },
          {
            label: 'Communes en zone inondable',
            href: '/territoires/submersion',
            description: 'Score de tension · Littoral et cours d\'eau',
          },
          {
            label: 'Communes en zone incendie',
            href: '/territoires/feux',
            description: 'Score de tension · Risque feux de forêt',
          },
          {
            label: 'Communes à risque cadmium',
            href: '/territoires/cadmium',
            description: 'Score de tension · Sols et alimentation',
          },
          {
            label: 'Communes sans alternative à la voiture',
            href: '/territoires/dependance-auto',
            description: 'Score de tension · Mobilité et carburant',
          },
        ],
      },
    ],
  },

  // ─── Agir — guides premium avec paywall ─────────────────────────────────────
  {
    label: 'Agir',
    groups: [
      {
        groupLabel: 'Guides pratiques',
        color: '#4ade80',
        links: [
          {
            label: 'Réduire son exposition au cadmium',
            href: '/agir/cadmium',
            description: 'Leviers documentés · Étapes concrètes',
          },
          {
            label: 'Se préparer à la canicule',
            href: '/agir/canicule',
            description: 'Logement, santé, habitudes',
            badge: 'Bientôt',
          },
          {
            label: 'Gérer le risque inondation',
            href: '/agir/submersion',
            description: 'Prévention et dispositifs',
            badge: 'Bientôt',
          },
          {
            label: 'Face aux feux de forêt',
            href: '/agir/feux',
            description: 'Zones à risque et mesures',
            badge: 'Bientôt',
          },
        ],
      },
      {
        groupLabel: 'Par profil',
        color: '#fb923c',
        links: [
          {
            label: 'Pour les propriétaires',
            href: '/agir/proprietaire',
            description: 'DPE, rénovation, assurances',
            badge: 'Bientôt',
          },
          {
            label: 'Pour les familles',
            href: '/agir/famille',
            description: 'Santé des enfants, mobilité, scolarité',
            badge: 'Bientôt',
          },
          {
            label: 'Pour les retraités',
            href: '/agir/retraite',
            description: 'Chaleur, dépendance, budget',
            badge: 'Bientôt',
          },
        ],
      },
    ],
  },

  { label: 'Tarifs', href: '#pricing' },
];

// ─── Hub articles landing page ────────────────────────────────────────────────
export type HubArticle = {
  slug: string;
  title: string;
  description: string;
  category: string;
  accent: string;
  href: string;
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
  },
  {
    slug: 'dependance-auto',
    title: 'Dépendance automobile',
    description:
      "84 % des actifs ruraux utilisent leur voiture chaque jour. La transition énergétique frappe d'abord les territoires sans alternative.",
    category: 'Mobilité',
    accent: '#60a5fa',
    href: '/savoir/dependance-auto',
  },
  {
    slug: 'canicule',
    title: 'Canicule en 2050',
    description:
      "Des villes comme Marseille atteindront 63 jours > 30 °C par an. Découvrez les communes françaises les plus exposées.",
    category: 'Environnement',
    accent: '#f87171',
    href: '/savoir/canicule',
  },
  {
    slug: 'submersion',
    title: 'Submersion côtière',
    description:
      "Le littoral atlantique fait face à une hausse du risque de +31 % en scénario médian. Les zones PPRi sont déjà en tension.",
    category: 'Environnement',
    accent: '#60a5fa',
    href: '/savoir/submersion',
  },
];

// ─── Agir guides registry (pour les liens contextuels depuis Territoires) ─────
export const AGIR_GUIDES: Record<string, { label: string; href: string; available: boolean }> = {
  cadmium:          { label: 'Réduire son exposition au cadmium',    href: '/agir/cadmium',   available: true  },
  canicule:         { label: 'Se préparer à la canicule',            href: '/agir/canicule',  available: false },
  submersion:       { label: 'Gérer le risque inondation',           href: '/agir/submersion',available: false },
  feux:             { label: 'Face aux feux de forêt',               href: '/agir/feux',      available: false },
  'dependance-auto':{ label: 'Réduire sa dépendance automobile',     href: '/agir/dependance-auto', available: false },
  secheresse:       { label: 'Adapter ses usages à la sécheresse',   href: '/agir/secheresse',available: false },
  pollens:          { label: 'Gérer les allergies polliniques',      href: '/agir/pollens',   available: false },
};
