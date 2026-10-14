// FUT-50 · VERSION C · LES QUATRE PASTILLES ET CE QU'ELLES PEUVENT HONNÊTEMENT DIRE. Module PUR.
//
// Une pastille n'est pas un critère inventé : chacune est rattachée à ce que le produit sait réellement lire
// à l'échelle d'une commune, vérifié sur le moteur le 14/10/2026 (panel de 14 communes, urbaines et rurales).
//
//   chaleur    moteur `faible_chaleur` (poids 2) + projections DRIAS : une vraie lecture, défavorable,
//              favorable ou neutre, pour toute commune dont DRIAS est lisible.
//   risques    recensement Géorisques (GASPAR) : une INFORMATION actuelle, au grain de la commune. Ce n'est
//              pas une priorité du moteur, et la pastille ne prétend pas en juger.
//   voiture    AUCUNE lecture communale fiable. Les trois critères de mobilité du moteur divergent : la part de
//              la voiture dans les trajets domicile-travail place un village de Lozère « parmi les 5 % les plus
//              favorables » (on y travaille sur place), la desserte quotidienne ne trouve rien à Sète et reste
//              muette à Lille. La pastille le dit : cela se lit autour de l'adresse.
//   taille     moteur `eviter_grandes_villes` (poids 2) : déterministe, sur la population de l'agglomération et
//              la convention de taille de futur•e. La phrase de taille est celle du moteur
//              (`categoryStatementFragment`).
//
// Écartée après vérification : « Avoir des services à proximité ». Le niveau de services communal reste muet
// pour toutes les villes testées (Sète, Lille, Brest, Annecy, Nîmes, Vannes, Rodez, Guéret) et ne parle que pour
// les communes les plus isolées ; sa réponse honnête serait la même que « sans voiture » (cela se lit à
// l'adresse). Une seule pastille suffit à le montrer.
//
// Le moteur ne tourne que pour `chaleur` et `taille` ; aucune génération IA, à aucun clic.

export type CleePastille = "chaleur" | "taille" | "voiture" | "risques";

export type Pastille = {
  cle: CleePastille;
  libelle: string;
  /** Ce que la pastille interroge, en une phrase, pour le titre de la lecture. */
  question: string;
};

export const PASTILLES: readonly Pastille[] = [
  { cle: "chaleur", libelle: "Éviter les fortes chaleurs", question: "Les étés y resteront-ils supportables ?" },
  { cle: "taille", libelle: "Vivre dans une ville à taille humaine", question: "Est-ce une ville à taille humaine ?" },
  { cle: "voiture", libelle: "Pouvoir vivre sans voiture", question: "Peut-on s'y passer de voiture ?" },
  { cle: "risques", libelle: "Connaître les risques naturels", question: "Quels risques l'État recense-t-il ?" },
];

/** Le lieu choisi : une commune, ou une adresse dont seule la commune est lue ici. */
export type Lieu = {
  type: "commune" | "adresse";
  /** Le libellé que la personne a choisi (« Sète » ou « 3 Quai de la Marine 34200 Sète »). */
  libelle: string;
  commune: string;
  insee: string;
};

/**
 * Ce que l'accueil affiche après une pastille. Quatre temps, toujours les mêmes :
 * ce que disent les données, ce que cela implique pour cette priorité, ce qu'il reste à vérifier,
 * et ce qu'on peut faire ensuite.
 */
export type Signal = "defavorable" | "favorable" | "neutre" | "information" | "adresse" | "indisponible";

export type LecturePastille = {
  cle: CleePastille;
  commune: string;
  fait: { texte: string; source: string; grain: "commune" | "unite_urbaine" } | null;
  pourVous: { signal: Signal; texte: string };
  aVerifier: string;
  /** Le prochain geste : toujours un vrai parcours. */
  suite: { libelle: string; href: string };
};

export const MOT_DU_SIGNAL: Record<Signal, string> = {
  defavorable: "Plutôt défavorable",
  favorable: "Plutôt favorable",
  neutre: "Ni favorable, ni défavorable",
  information: "À savoir",
  adresse: "Se lit à l'adresse",
  indisponible: "Donnée indisponible",
};

// ── Les entrées, telles que la route de développement les rassemble ───────────────────────────────

export type EntreesChaleur = {
  /** L'issue du registre des critères pour `faible_chaleur` (poids 2). */
  issue: "favorable" | "mismatch" | "indeterminate" | "absent";
  /** Le constat du moteur quand il est défavorable (carte « Ce qui correspond moins bien »). */
  ecart: { constat: string; titre: string; limite: string | null; geste: string | null } | null;
  /** La phrase du moteur quand la priorité est lue comme condition (favorable ou neutre). */
  phraseCondition: string | null;
  /** Le fait DRIAS des jours au-dessus de 35 °C, écrit par l'accueil (`carteCompte`). */
  faitDrias: string | null;
  /** Le geste du moteur sans adresse (`summerComfortAction(false)`). */
  gesteSansAdresse: string;
};

const SUITE_ADRESSE = (lieu: Lieu) => ({
  libelle: lieu.type === "adresse" ? "Faire examiner cette adresse" : `Examiner une adresse à ${lieu.commune}`,
  href: "/dossier",
});

// La phrase de l'accueil actuel pour les questions qui se lisent à l'adresse (`reponses.ts`, reponseMobilite),
// reprise mot pour mot : « Les trajets, les transports à pied et les services proches dépendent de l'endroit
// précis où l'on vit… ».
const ADRESSE_TEXTE = (commune: string, aCommune: (n: string) => string) =>
  `Les trajets, les transports à pied et les services proches dépendent de l'endroit précis où l'on vit ${aCommune(commune)}. Le dossier les mesure autour de l'adresse.`;

const SOURCE_DRIAS = "DRIAS · Météo-France, horizon 2050 (+2,7 °C en France)";
const SOURCE_GEORISQUES = "Géorisques · recensement actuel de l'État";

export function lireChaleur(lieu: Lieu, e: EntreesChaleur): LecturePastille {
  const suite = SUITE_ADRESSE(lieu);
  if (e.issue === "mismatch" && e.ecart) {
    return {
      cle: "chaleur", commune: lieu.commune,
      fait: { texte: e.ecart.constat, source: SOURCE_DRIAS, grain: "commune" },
      pourVous: { signal: "defavorable", texte: e.ecart.titre },
      aVerifier: [e.ecart.limite, `${e.ecart.geste ?? e.gesteSansAdresse}.`].filter(Boolean).join(" "),
      suite,
    };
  }
  if ((e.issue === "favorable" || e.issue === "indeterminate") && e.phraseCondition) {
    return {
      cle: "chaleur", commune: lieu.commune,
      fait: e.faitDrias ? { texte: `Jours au-dessus de 35 °C : ${minusculeInitiale(e.faitDrias)}`, source: SOURCE_DRIAS, grain: "commune" } : null,
      pourVous: { signal: e.issue === "favorable" ? "favorable" : "neutre", texte: e.phraseCondition },
      aVerifier: `Cette lecture vaut pour la commune entière. ${e.gesteSansAdresse}.`,
      suite,
    };
  }
  return {
    cle: "chaleur", commune: lieu.commune, fait: null,
    pourVous: { signal: "indisponible", texte: "Les projections de chaleur de cette commune ne sont pas lisibles ici. Une donnée absente n'est jamais une bonne nouvelle." },
    aVerifier: "Le dossier de la commune présente les projections disponibles, avec leur période de référence.",
    suite,
  };
}

export function lireRisques(lieu: Lieu, libelles: string[] | null): LecturePastille {
  const suite = SUITE_ADRESSE(lieu);
  if (libelles == null) {
    return {
      cle: "risques", commune: lieu.commune, fait: null,
      pourVous: { signal: "indisponible", texte: "Géorisques n'a pas répondu. Une absence de réponse ne dit pas qu'il n'y a pas de risque." },
      aVerifier: "L'état des risques précise ce qu'il en est à une adresse donnée.",
      suite,
    };
  }
  const fait = libelles.length === 0
    ? "L'État ne recense aucun risque naturel ou technologique pour la commune."
    : `L'État recense pour la commune : ${joinFr(libelles.map(minusculeInitiale))}.`;
  return {
    cle: "risques", commune: lieu.commune,
    fait: { texte: fait, source: SOURCE_GEORISQUES, grain: "commune" },
    pourVous: {
      signal: "information",
      texte: libelles.length === 0
        ? "Ce recensement vaut pour la commune entière : il ne dit rien d'une adresse précise."
        : "Ce recensement est actuel et porte sur la commune entière : il ne dit pas quelle partie est concernée, ni comment le risque évoluera.",
    },
    aVerifier: "L'état des risques précise ce qu'il en est à une adresse donnée : zone réglementée, sol, sinistres reconnus.",
    suite,
  };
}

export type EntreesTaille = {
  issue: "favorable" | "mismatch" | "indeterminate" | "absent";
  /** La phrase du moteur (`categoryStatementFragment`), sans point final. */
  phraseTaille: string | null;
  /** La population retenue et sa provenance (unité urbaine ou commune). */
  population: number | null;
  source: "urban_unit" | "commune" | null;
};

export function lireTaille(lieu: Lieu, e: EntreesTaille): LecturePastille {
  const suite = SUITE_ADRESSE(lieu);
  if (e.issue === "absent" || !e.phraseTaille) {
    return {
      cle: "taille", commune: lieu.commune, fait: null,
      pourVous: { signal: "indisponible", texte: "La population de cette commune n'a pas pu être lue ici." },
      aVerifier: "Le dossier de la commune présente sa taille et sa provenance.",
      suite,
    };
  }
  const pop = e.population != null
    ? ` (environ ${Math.round(e.population).toLocaleString("fr-FR")} habitants${e.source === "urban_unit" ? " dans l'agglomération" : ""})`
    : "";
  const lecture: Record<"favorable" | "mismatch" | "indeterminate", { signal: Signal; texte: string }> = {
    favorable: { signal: "favorable", texte: "Cela va dans le sens d'une ville à taille humaine." },
    mismatch: { signal: "defavorable", texte: "Cela va plutôt contre le souhait d'une ville à taille humaine." },
    indeterminate: { signal: "neutre", texte: "Une ville moyenne : ni petite, ni grande. Cela ne tranche pas cette priorité." },
  };
  return {
    cle: "taille", commune: lieu.commune,
    fait: {
      texte: `${e.phraseTaille}${pop}.`,
      source: e.source === "urban_unit" ? "INSEE · population de l'unité urbaine" : "INSEE · population communale",
      // Le grain suit la mesure : la taille d'une agglomération n'est pas lue à la commune.
      grain: e.source === "urban_unit" ? "unite_urbaine" : "commune",
    },
    pourVous: lecture[e.issue],
    aVerifier: "La taille d'une agglomération ne dit pas l'ambiance d'un quartier : le calme, l'animation et les trajets se lisent autour de l'adresse.",
    suite,
  };
}

export function lireAdresse(cle: "voiture", lieu: Lieu, aCommune: (n: string) => string): LecturePastille {
  return {
    cle, commune: lieu.commune, fait: null,
    pourVous: { signal: "adresse", texte: "Cette question se lit à l'échelle de l'adresse, pas de la commune." },
    aVerifier: ADRESSE_TEXTE(lieu.commune, aCommune),
    suite: SUITE_ADRESSE(lieu),
  };
}

function minusculeInitiale(s: string): string {
  // Les sigles et noms propres gardent leur majuscule ; seul un mot ordinaire en tête est abaissé.
  return /^[A-ZÀ-Ý][a-zà-ÿ]/.test(s) ? s.charAt(0).toLowerCase() + s.slice(1) : s;
}

function joinFr(items: string[]): string {
  if (items.length <= 1) return items[0] ?? "";
  return `${items.slice(0, -1).join(", ")} et ${items[items.length - 1]}`;
}
