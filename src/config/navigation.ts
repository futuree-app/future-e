export type NavLink = {
  label: string;
  href: string;
  description?: string;
  badge?: string;
  category?: string;
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
            category: 'Santé',
          },
          {
            label: 'Pollens & allergies',
            href: '/savoir/pollens',
            description: 'Saison pollinique élargie en 2050',
            badge: 'Bientôt',
            category: 'Santé',
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
            category: 'Mobilité',
          },
        ],
      },
      {
        groupLabel: 'Environnement',
        color: '#f87171',
        links: [
          {
            label: 'Canicule',
            href: '/savoir/canicule',
            description: 'Jours > 30 °C projetés en 2050',
            category: 'Environnement',
          },
          {
            label: 'Submersion',
            href: '/savoir/submersion',
            description: 'Risque inondation côtier et fluvial',
            category: 'Environnement',
          },
          {
            label: 'Feux de forêt',
            href: '/savoir/feux',
            description: "Exposition aux incendies estivaux",
            category: 'Environnement',
          },
          {
            label: 'Sécheresse',
            href: '/savoir/secheresse',
            description: 'Stress hydrique des sols agricoles',
            category: 'Environnement',
          },
        ],
      },
    ],
  },
  { label: 'Tarifs', href: '#pricing' },
];

/** Articles publiés dans la section Hub de la landing page */
export type HubArticle = {
  slug: string;
  title: string;
  description: string;
  category: string;
  accent: string;
  href: string;
  published: boolean;
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
    published: true,
  },
  {
    slug: 'dependance-auto',
    title: 'Dépendance automobile',
    description:
      "84 % des actifs ruraux utilisent leur voiture chaque jour. La transition énergétique frappe d'abord les territoires sans alternative.",
    category: 'Mobilité',
    accent: '#60a5fa',
    href: '/savoir/dependance-auto',
    published: true,
  },
  {
    slug: 'canicule',
    title: 'Canicule en 2050',
    description:
      "Des villes comme Marseille atteindront 63 jours > 30 °C par an. Découvrez les communes françaises les plus exposées.",
    category: 'Environnement',
    accent: '#f87171',
    href: '/savoir/canicule',
    published: true,
  },
  {
    slug: 'submersion',
    title: 'Submersion côtière',
    description:
      "Le littoral atlantique fait face à une hausse du risque de +31 % en scénario médian. Les zones PPRi sont déjà en tension.",
    category: 'Environnement',
    accent: '#60a5fa',
    href: '/savoir/submersion',
    published: true,
  },
];
