// LES MESSAGES D'ATTENTE, UN JEU PAR CONTEXTE DE CHARGEMENT. Lib PURE, aucune dépendance.
//
// SIX JEUX CONTEXTUELS, PAS SIX ÉCHELLES. Le produit a TROIS échelles, et elles seules : Territoire,
// Autour, Logement. `compte`, `rapport` et `dossiers` sont des surfaces. Confondre les deux dans le
// vocabulaire interne finirait par brouiller l'architecture elle-même.
//
// Pourquoi par contexte plutôt qu'au hasard : un tirage aléatoire aurait exigé du JS client, ou un
// `Math.random()` qui rend le fallback dynamique, donc plus lent à s'afficher. Or c'est la seule
// qualité qui compte pour un écran d'attente. Un `loading.tsx` par segment donne la variété sans rien
// coûter, et la rend PERTINENTE plutôt qu'arbitraire.
//
// LA DISCIPLINE DES ÉTATS, dans cet ordre et sans exception :
//   1. `matiere`  : ce qui est réellement en train d'être chargé ;
//   2. puis       : ce que cette lecture permet de comprendre ;
//   3. enfin      : la transparence sur le délai. Passé sept secondes, le lecteur ne demande plus de
//                   la personnalité, il veut savoir que le système n'est pas bloqué.
//
// PAS DE STATUT GÉNÉRIQUE RÉPÉTÉ. « Toujours en cours », puis « Toujours en cours de lecture », donnait
// l'impression d'un système figé. Un état porte une phrase qui dit quelque chose, ou il n'existe pas.
//
// LA RÈGLE D'HONNÊTETÉ, ET ELLE N'EST PAS LA MÊME PARTOUT.
//   - `territoire` peut nommer ses SOURCES : /rapport/quartier interroge réellement DRIAS, Géorisques,
//     GASPAR, l'ADEME et VigiEau pendant le rendu serveur, donc pendant que cet écran est à l'affiche.
//   - `autour` et `logement` nomment leur MATIÈRE, jamais un organisme : leurs modules chargent leurs
//     sources APRÈS le rendu, par des routes API. Les annoncer ici serait faux au moment où c'est écrit.
//   - Aucune phrase n'affirme une granularité que le produit ne porte pas. « Sinistres » laissait croire
//     à un historique propre au bâtiment, « à trois cents mètres près » à un rayon qui serait une règle
//     stable d'Autour, et « deux logements d'un même immeuble ne vieillissent pas pareil » à une
//     distinction par étage et orientation. Trois fausses précisions, d'autant plus coûteuses qu'elles
//     étaient mémorables.

export type LoadingMessages = {
  /** État initial, en mono : ce qui est réellement chargé. Le seul que voit un chargement court. */
  matiere: string;
  /** Les états suivants, en serif, dans l'ordre : ce que la lecture permet de comprendre, puis le délai. */
  suites: readonly [string, ...string[]];
};

export const LOADING_MESSAGES = {
  // Espace compte et mémoire.
  compte: {
    matiere: "Nous retrouvons votre espace",
    suites: [
      "Vos rapports et vos adresses vous attendent.",
      "Cela prend un peu plus de temps.",
    ],
  },

  // Hub du rapport. « Un lieu » et non « une commune » : depuis que /rapport ouvre le territoire d'un
  // dossier d'adresse, la commune n'est plus la seule maille qu'il sert.
  rapport: {
    matiere: "Les sources se rassemblent",
    suites: [
      "Un lieu ne se lit pas en un chiffre.",
      "Certaines données répondent plus lentement.",
    ],
  },

  // Territoire. L'énumération porte les QUATRE familles, pas seulement le climat et le risque :
  // réduire Territoire à « climat, eau, risques » reproduisait le défaut déjà signalé sur le rapport
  // de Nantes, futur•e paraissant ne parler que de vulnérabilité.
  territoire: {
    matiere: "Climat, risques, services, mobilités",
    suites: [
      "Les données publiques se recoupent.",
      "Un territoire ne se lit pas seulement au présent.",
      "Le chargement prend plus de temps que prévu.",
    ],
  },

  // Autour de l'adresse. « À quelques rues près » plutôt qu'une distance : ce qui compte est l'accès
  // concret, pas une frontière de quartier ni un rayon qui n'est pas une règle stable du module.
  autour: {
    matiere: "Commerces, écoles, transports, espaces verts",
    suites: [
      "Ce qui change autour de l'adresse",
      "À quelques rues près, le quotidien change.",
      "Le chargement prend plus de temps que prévu.",
    ],
  },

  // Le bien lui-même. « L'adresse seule ne décrit pas un logement » dit le rôle de la qualification
  // sans promettre une granularité par étage.
  logement: {
    matiere: "DPE, parcelle, bâtiment",
    suites: [
      "Ce que le bâtiment permet de vérifier",
      "L'adresse seule ne décrit pas un logement.",
      "Le chargement prend plus de temps que prévu.",
    ],
  },

  // Sélecteur de biens. La meilleure phrase du lot pour dire pourquoi plusieurs dossiers coexistent.
  dossiers: {
    matiere: "Nous retrouvons vos dossiers",
    suites: [
      "Chaque adresse garde sa propre lecture.",
      "Cela prend un peu plus de temps.",
    ],
  },
} as const satisfies Record<string, LoadingMessages>;

export type LoadingScope = keyof typeof LOADING_MESSAGES;

// CHRONOLOGIE, en secondes.
//
// `T_MATIERE` évite le flash sur un chargement instantané : rien ne s'affiche avant, et une navigation
// de 150 ms ne montre donc aucun texte. L'apparition qui suit est COURTE (`D_APPARITION`) : la montée
// de 1,1 s d'une version précédente consommait presque tout le temps disponible avant la première
// bascule, ce qui rendait illisible l'état censé être le plus lu de tous.
export const T_MATIERE = 0.2;
export const T_BASCULE = 3.4;
export const D_APPARITION = 0.3;
export const D_SORTIE = 0.35;

/** L'instant d'apparition d'un état : la matière, puis une bascule toutes les `T_BASCULE`. */
export function instantDeLEtat(index: number): number {
  return index === 0 ? T_MATIERE : T_BASCULE * index;
}
