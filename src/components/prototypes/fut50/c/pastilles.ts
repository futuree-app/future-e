// FUT-50 · VERSION C · LES PASTILLES ET CE QU'ELLES PEUVENT HONNÊTEMENT DIRE. Module PUR.
//
// Une pastille n'est pas un critère inventé : chacune est rattachée à ce que le produit sait réellement lire
// à l'échelle d'une commune, vérifié sur le moteur (14/10/2026, panel de 20 communes urbaines et rurales).
//
//   chaleur    moteur `faible_chaleur` (poids 2) + projections DRIAS : défavorable, favorable ou neutre.
//   hivers     moteur `douceur_climat` (poids 2) : position parmi les communes de France sur la température
//              moyenne de l'hiver (1976-2005), avec la limite écrite par le moteur. Lectures bien réparties :
//              Sète, Nice, Nîmes, Brest parmi les plus doux ; Annecy et la Lozère parmi les moins doux ;
//              Lille, Rennes, Strasbourg, Guéret sans position marquée.
//   taille     moteur `eviter_grandes_villes` (poids 2) : la population de l'agglomération et la convention de
//              taille de futur•e, dite en clair (moins de 25 000 habitants : petite ville).
//   risques    recensement Géorisques : une INFORMATION actuelle de la commune entière, jamais un jugement.
//   voiture    AUCUNE lecture communale fiable (les trois critères de mobilité divergent : un village de Lozère
//              sort « parmi les 5 % les plus favorables », la desserte quotidienne ne trouve rien à Sète). Elle ne
//              figure que dans la composition de comparaison : sa seule réponse honnête est « cela se lit à
//              l'adresse ».
//
// Écartée : « Avoir des services à proximité » (muette pour toutes les villes testées).
// Aucune génération IA, à aucun clic.

import { AGGLOMERATION_SIZE_CONVENTION } from "../../../../lib/decision/agglomeration-facts.ts";

export type CleePastille = "chaleur" | "hivers" | "taille" | "voiture" | "risques";

export type Pastille = {
  cle: CleePastille;
  libelle: string;
};

const DEFINITIONS: Record<CleePastille, Pastille> = {
  chaleur: { cle: "chaleur", libelle: "Éviter les fortes chaleurs" },
  hivers: { cle: "hivers", libelle: "Avoir des hivers doux" },
  taille: { cle: "taille", libelle: "Vivre dans une petite ville" },
  voiture: { cle: "voiture", libelle: "Pouvoir vivre sans voiture" },
  risques: { cle: "risques", libelle: "Connaître les risques naturels" },
};

/**
 * DEUX COMPOSITIONS, À COMPARER DANS LE PROTOTYPE (`?pastilles=mobilite`).
 * La recommandée : quatre pastilles qui donnent toutes une lecture réelle de la commune choisie.
 * La comparaison : la mobilité à la place des hivers, dont la réponse renvoie à l'adresse.
 */
export const COMPOSITIONS = {
  recommandee: ["chaleur", "hivers", "taille", "risques"],
  mobilite: ["chaleur", "taille", "voiture", "risques"],
} as const satisfies Record<string, readonly CleePastille[]>;
export type Composition = keyof typeof COMPOSITIONS;

export function pastillesDe(composition: Composition): Pastille[] {
  return COMPOSITIONS[composition].map((c) => DEFINITIONS[c]);
}
export function libelleDe(cle: CleePastille): string {
  return DEFINITIONS[cle].libelle;
}

/** Compatibilité : la composition recommandée. */
export const PASTILLES: readonly Pastille[] = pastillesDe("recommandee");

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
export type Signal = "defavorable" | "favorable" | "neutre" | "sous_seuil" | "information" | "adresse" | "indisponible";

export type LecturePastille = {
  cle: CleePastille;
  commune: string;
  fait: {
    texte: string;
    source: string;
    grain: "commune" | "unite_urbaine";
    /**
     * LA DONNÉE PRINCIPALE, quand une mesure pertinente existe : affichée en grand, toujours avec son unité et sa
     * légende (libellé, période, contexte). Absente quand le fait n'est pas une valeur unique : on ne force pas.
     * Le texte complet reste celui du fait, lu par les lecteurs d'écran.
     */
    mesure?: { valeur: string; unite: string; legende: string };
    /** Deux dimensions côte à côte (chaleur : jours au-dessus de 35 °C et nuits tropicales). */
    mesures?: MesureChaleur[];
  } | null;
  pourVous: { signal: Signal; texte: string };
  /** L'explication de méthode, consultable (« Comment lire ce résultat ? »). Ne répète pas les chiffres affichés. */
  methode?: string[];
  aVerifier: string;
  /** Le prochain geste : toujours un vrai parcours. */
  suite: { libelle: string; href: string };
};

export const MOT_DU_SIGNAL: Record<Signal, string> = {
  defavorable: "Plutôt défavorable",
  favorable: "Plutôt favorable",
  neutre: "Ni favorable, ni défavorable",
  // Sous les seuils n'est PAS « favorable » : la chaleur progresse sans atteindre ce que futur•e signale.
  sous_seuil: "À surveiller",
  information: "À savoir",
  adresse: "Se lit à l'adresse",
  indisponible: "Donnée indisponible",
};

// ── Les entrées, telles que la route de développement les rassemble ───────────────────────────────

/**
 * LA CHALEUR, EN TROIS COUCHES SÉPARÉES (revue du 15/10) :
 *   données         `buildClimatFacts` (DRIAS, horizon 2050, référence 1976-2005 reconstruite), valeurs non arrondies ;
 *   classification  `classifyClimateComfort`, la fonction même de la règle du moteur (seuils déclarés : 8 jours
 *                   au-dessus de 35 °C, 25 nuits tropicales par an ; un seul axe atteint suffit) ;
 *   formulation     ici. Les DEUX trajectoires sont toujours montrées, quelle que soit la classification : la
 *                   différence entre deux communes tient à l'interprétation, pas aux données auxquelles on a droit.
 * « Sous les seuils » n'est jamais présenté comme favorable : les seuils sont des conventions de signalement de
 * futur•e, pas des seuils sanitaires ni une promesse de confort.
 */
export type AxeChaleur = { projete: number | null; reference: number | null; seuil: number };
/** Un grand chiffre de la lecture. `texte` : sa phrase complète, pour les lecteurs d'écran. `bascule` : une
 *  autre lecture de la MÊME mesure, que le lecteur peut afficher à la place (les journées au-dessus de 30 °C). */
export type MesureChaleur = {
  valeur: string; unite: string; legende: string; texte?: string;
  bascule?: { valeur: string; unite: string; legende: string; texte: string; ouvrir: string; revenir: string };
};

export type EntreesChaleur = {
  verdict: "unfavorable" | "under_threshold" | "uncertain" | "absent";
  jours: AxeChaleur;
  nuits: AxeChaleur;
  /** Les journées au-dessus de 30 °C (même horizon, même reconstruction de la référence). Complément de lecture :
   *  elles n'entrent JAMAIS dans le classement, qui reste fondé sur 35 °C et les nuits tropicales. */
  jours30?: { projete: number | null; reference: number | null };
  /** Formulation d'une référence (« moins d'une journée », « 5 nuits »), par l'accueil (`formatCompte`). */
  referenceTexte: (v: number, nuits: boolean) => string;
  /** La limite du moteur pour le climat, et son geste sans adresse. */
  limite: string;
  gesteSansAdresse: string;
};

/**
 * UNE VALEUR AFFICHÉE NE FRANCHIT JAMAIS LE SEUIL QU'ELLE NE FRANCHIT PAS. Arrondir 24,6 nuits à « 25 » sous un
 * seuil de 25 contredirait la lecture « sous le seuil » : dans ce cas, on garde une décimale.
 */
export function valeurAffichee(v: number, seuil: number): string {
  const r = Math.round(v);
  if (v < 1) return "moins de 1";
  if ((r >= seuil) !== (v >= seuil)) return v.toLocaleString("fr-FR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  return String(r);
}

// ── LA GRAMMAIRE DE LA LECTURE DE CHALEUR (revue du 15/10, soir) ─────────────────────────────────────
//
// Le moteur raisonne en seuils ; la lecture parle de jours et de nuits. Tout ce qu'elle affirme se déduit des
// valeurs et du classement EXISTANTS, sans aucun nouveau seuil :
//   - le classement du moteur (`verdict`) et les axes qui atteignent leur seuil (`>=`, valeur non arrondie) ;
//   - l'évolution depuis 1976-2005, dite par un multiple arrondi (arithmétique sur les valeurs affichées) ;
//   - l'axe mis en avant : le plus proche de SON seuil (projeté / seuil), l'échelle que le moteur fournit déjà ;
//   - « moins d'un par an » : le palier existant de l'accueil (`formatCompte`).
// Aucun mot comme « fort », « nettement » ou « peu » : ils demanderaient une convention qui n'existe pas.

type Axe = "jours" | "nuits";

/** Ce que la commune gagnerait par an, en moyenne : projeté moins référence reconstruite. `null` sans référence. */
const gain = (a: AxeChaleur) => (a.projete != null && a.reference != null ? a.projete - a.reference : null);
const MOT_AXE: Record<Axe, string> = { jours: "les journées très chaudes", nuits: "les nuits chaudes" };

/**
 * LA RÉPONSE À LA PRIORITÉ (revue utilisateur du 15/10, soir) : une pastille, puis au plus une phrase courte,
 * qui interprète sans jamais reformuler les nombres affichés juste au-dessus.
 *
 *   classement du moteur     | pastille             | ce qui la fonde
 *   unfavorable              | Plutôt défavorable   | au moins un axe atteint le seuil (`classifyClimateComfort`)
 *   under_threshold, rare    | Plutôt favorable     | les DEUX mesures sous une par an même en 2050 (palier existant
 *                            |                      | « moins d'un » de l'accueil)
 *   under_threshold, sinon   | À surveiller         | sous les seuils, mais des fortes chaleurs présentes : un verdict
 *                            |                      | positif ne serait pas honnête (La Rochelle : 23 nuits pour 25)
 *   absent / uncertain       | Donnée indisponible  | (traité dans `lireChaleur`)
 *
 * « d'abord la nuit » désigne l'axe dont l'écart avec 1976-2005 est le plus grand : une comparaison des chiffres
 * affichés, sans palier nouveau.
 */
export function phraseChaleur(e: EntreesChaleur): { signal: Signal; texte: string } {
  const { jours, nuits } = e;
  if (jours.projete! < 1 && nuits.projete! < 1) {
    return { signal: "favorable", texte: "Les fortes chaleurs resteraient exceptionnelles ici, même en 2050." };
  }
  const axe = { jours, nuits };
  if (e.verdict === "unfavorable") {
    const atteints = (["nuits", "jours"] as Axe[]).filter((k) => axe[k].projete! >= axe[k].seuil);
    return {
      signal: "defavorable",
      texte: atteints.length === 2
        ? "Les journées très chaudes comme les nuits chaudes dépassent ce que futur•e signale."
        : `Ce sont ${MOT_AXE[atteints[0]!]} qui dépassent ce que futur•e signale.`,
    };
  }
  const gj = gain(jours), gn = gain(nuits);
  if (gj == null || gn == null) return { signal: "sous_seuil", texte: "Sans atteindre ce que futur•e signale, faute de comparaison avec 1976-2005 pour en dire plus." };
  if (gj < 1 && gn < 1) return { signal: "sous_seuil", texte: "Les fortes chaleurs resteraient à peu près au niveau de 1976-2005, sans atteindre ce que futur•e signale." };
  const dabord = gn >= gj ? "d'abord la nuit" : "d'abord le jour";
  return { signal: "sous_seuil", texte: `Les fortes chaleurs progresseraient, ${dabord}, sans atteindre ce que futur•e signale.` };
}

/** « Comment lire ce résultat ? » : la méthode, sans répéter les chiffres affichés au-dessus. */
export function methodeChaleur(e: EntreesChaleur): string[] {
  const { jours, nuits } = e;
  const jAtteint = jours.projete! >= jours.seuil, nAtteint = nuits.projete! >= nuits.seuil;
  const un = (v: number) => v.toLocaleString("fr-FR", { maximumFractionDigits: 1 });
  let ici: string;
  if (jAtteint && nAtteint) ici = "Ici, les deux repères sont atteints.";
  else if (jAtteint || nAtteint) ici = `Ici, seul le repère ${nAtteint ? "des nuits tropicales" : "des journées au-dessus de 35 °C"} est atteint.`;
  else if (jours.projete! < 1 && nuits.projete! < 1) ici = "Ici, aucun des deux repères n'est atteint.";
  else {
    // La mesure la plus proche de son repère, dite par sa valeur exacte : aucun qualificatif, aucun palier nouveau.
    const n = nuits.projete! / nuits.seuil >= jours.projete! / jours.seuil;
    const a = n ? nuits : jours;
    ici = `Ici, aucun des deux repères n'est atteint ; la mesure qui s'en approche le plus est celle des ${n ? "nuits tropicales" : "journées au-dessus de 35 °C"} (${un(a.projete!)} pour un repère de ${a.seuil}). Une commune peut se réchauffer beaucoup sans atteindre ces repères.`;
  }
  return [
    "Deux mesures du climat de la commune : les journées où il fait plus de 35 °C, et les nuits tropicales, où la température ne descend pas sous 20 °C. Elles sont projetées pour 2050, quand la France se serait réchauffée d'environ 2,7 °C, et comparées à la période 1976-2005, qui n'est pas la situation actuelle.",
    `futur•e signale une exposition à partir de ${jours.seuil} journées au-dessus de 35 °C, ou de ${nuits.seuil} nuits tropicales par an en 2050. Ce sont des repères propres à futur•e, pas des seuils sanitaires officiels. ${ici}`,
    ...(e.jours30?.projete != null
      ? ["Les journées au-dessus de 30 °C, à afficher sous le premier chiffre, complètent la lecture : elles comprennent celles au-dessus de 35 °C, et n'entrent pas dans ce résultat."]
      : []),
  ];
}

export function lireChaleur(lieu: Lieu, e: EntreesChaleur): LecturePastille {
  const suite = SUITE_ADRESSE(lieu);
  const { jours, nuits } = e;
  if (e.verdict === "absent" || e.verdict === "uncertain" || jours.projete == null || nuits.projete == null) {
    return {
      cle: "chaleur", commune: lieu.commune, fait: null,
      pourVous: e.verdict === "absent"
        ? { signal: "indisponible", texte: "Sans ces données, nous ne pouvons rien dire de ses étés futurs : une absence de donnée n'est pas une bonne nouvelle." }
        : { signal: "indisponible", texte: "Une des deux mesures manque pour cette commune : nous ne tirons aucune conclusion de celle qui reste." },
      aVerifier: "Le dossier de la commune présente les projections disponibles, avec leur période de référence.",
      suite,
    };
  }
  const ref = (a: AxeChaleur, n: boolean) => (a.reference != null ? `contre ${e.referenceTexte(a.reference, n)} sur 1976-2005` : "référence 1976-2005 non lisible");
  const vj = valeurAffichee(jours.projete, jours.seuil);
  const vn = valeurAffichee(nuits.projete, nuits.seuil);
  const uniteJours = (v: number) => (v >= 1 && Math.round(v) > 1 ? "jours par an" : "jour par an");
  const mesures: MesureChaleur[] = [
    { valeur: vj, unite: uniteJours(jours.projete), legende: `au-dessus de 35 °C à l'horizon 2050, ${ref(jours, false)}`, texte: `À l'horizon 2050 : ${vj} ${uniteJours(jours.projete)} au-dessus de 35 °C, ${ref(jours, false)}.` },
    { valeur: vn, unite: nuits.projete >= 1 && Math.round(nuits.projete) > 1 ? "nuits tropicales" : "nuit tropicale", legende: `par an à l'horizon 2050, sans descendre sous 20 °C, ${ref(nuits, true)}` },
  ];
  mesures[1]!.texte = `Et ${vn} ${mesures[1]!.unite} par an, sans descendre sous 20 °C, ${ref(nuits, true)}.`;
  // 30 °C : seulement si la valeur existe. Sans référence reconstructible, aucune comparaison n'est fabriquée.
  const j30 = e.jours30;
  if (j30?.projete != null) {
    const v30 = valeurAffichee(j30.projete, Infinity);
    const ref30 = j30.reference != null ? `contre ${e.referenceTexte(j30.reference, false)} sur 1976-2005` : "sans comparaison possible avec 1976-2005";
    mesures[0]!.bascule = {
      valeur: v30, unite: uniteJours(j30.projete),
      legende: `au-dessus de 30 °C à l'horizon 2050, dont ${vj} au-dessus de 35 °C ; ${ref30}`,
      texte: `À l'horizon 2050 : ${v30} ${uniteJours(j30.projete)} au-dessus de 30 °C, dont ${vj} au-dessus de 35 °C ; ${ref30}.`,
      ouvrir: "Et au-dessus de 30 °C ?",
      revenir: "Revenir à 35 °C",
    };
  }
  const texte = `À l'horizon 2050 (+2,7 °C en France) : ${vj} ${mesures[0]!.unite} au-dessus de 35 °C (${ref(jours, false)}), et ${vn} ${mesures[1]!.unite} par an (${ref(nuits, true)}).`;
  const pourVous = phraseChaleur(e);
  const methode = methodeChaleur(e);
  return {
    cle: "chaleur", commune: lieu.commune,
    fait: { texte, source: SOURCE_DRIAS, grain: "commune", mesures },
    pourVous,
    methode,
    aVerifier: `${e.limite} La chaleur ressentie dépend aussi du quartier et du logement : orientation, étage, isolation, possibilité d'aérer la nuit. ${e.gesteSansAdresse}.`,
    suite,
  };
}

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
  if (e.issue === "absent" || e.population == null) {
    return {
      cle: "taille", commune: lieu.commune, fait: null,
      pourVous: { signal: "indisponible", texte: "La population de cette commune n'a pas pu être lue ici." },
      aVerifier: "Le dossier de la commune présente sa taille et sa provenance.",
      suite,
    };
  }
  // LA CONVENTION, DITE EN CLAIR : les seuils sont ceux du moteur (`AGGLOMERATION_SIZE_CONVENTION`), jamais
  // recopiés à la main.
  const t = AGGLOMERATION_SIZE_CONVENTION.thresholds;
  const n = (x: number) => x.toLocaleString("fr-FR");
  const lecture: Record<"favorable" | "mismatch" | "indeterminate", { signal: Signal; texte: string }> = {
    favorable: { signal: "favorable", texte: `Moins de ${n(t.petiteMaxExclusive)} habitants : c'est une petite ville, ou un village, au sens de futur•e.` },
    mismatch: { signal: "defavorable", texte: `Plus de ${n(t.moyenneMaxExclusive)} habitants : ce n'est pas une petite ville.` },
    indeterminate: { signal: "neutre", texte: `Entre ${n(t.petiteMaxExclusive)} et ${n(t.moyenneMaxExclusive)} habitants : une ville moyenne, ni petite, ni grande.` },
  };
  // Le fait : la population, dite simplement. La catégorie du moteur (`categoryStatementFragment`) se lit dans
  // la convention juste dessous, sans jargon (« agglomération selon la convention de taille… »).
  const ou = e.source === "urban_unit" ? `dans l'agglomération de ${lieu.commune}` : `à ${lieu.commune}`;
  return {
    cle: "taille", commune: lieu.commune,
    fait: {
      texte: `Environ ${n(Math.round(e.population!))} habitants ${ou}.`,
      mesure: { valeur: n(Math.round(e.population!)), unite: "habitants", legende: ou },
      source: e.source === "urban_unit" ? "INSEE · population de l'unité urbaine" : "INSEE · population communale",
      // Le grain suit la mesure : la taille d'une agglomération n'est pas lue à la commune.
      grain: e.source === "urban_unit" ? "unite_urbaine" : "commune",
    },
    pourVous: lecture[e.issue],
    aVerifier: "La taille d'une ville ne dit pas l'ambiance d'un quartier : le calme, l'animation et les trajets se lisent autour d'une adresse.",
    suite,
  };
}

export type EntreesHivers = {
  issue: "favorable" | "mismatch" | "indeterminate" | "absent";
  /** La position du moteur (carte « correspond » ou « correspond moins bien »), sans préambule. */
  position: string | null;
  /** La limite écrite par le moteur pour ce critère. */
  limite: string | null;
  /** La température moyenne de l'hiver sur 1976-2005, écrite par l'accueil (DRIAS). */
  temperatureReference: string | null;
  /** La même valeur, formatée par l'accueil (« 5,8 °C »), pour la mesure. */
  temperatureValeur?: string | null;
};

const LIMITE_HIVERS = "Cette position décrit la douceur hivernale (température moyenne de décembre à février) sur la période de référence 1976-2005. Les fortes chaleurs estivales, notamment futures, sont traitées à part.";

export function lireHivers(lieu: Lieu, e: EntreesHivers): LecturePastille {
  const suite = SUITE_ADRESSE(lieu);
  if (e.issue === "absent") {
    return {
      cle: "hivers", commune: lieu.commune, fait: null,
      pourVous: { signal: "indisponible", texte: "Les températures d'hiver de cette commune ne sont pas lisibles ici. Une donnée absente n'est jamais une bonne nouvelle." },
      aVerifier: "Le dossier de la commune présente les données disponibles, avec leur période de référence.",
      suite,
    };
  }
  const signal: Signal = e.issue === "favorable" ? "favorable" : e.issue === "mismatch" ? "defavorable" : "neutre";
  // Neutre : le moteur ne produit pas de carte. La phrase reprend la tournure de ses conditions
  // (`condition-rules.ts`, constat neutre) : ni parmi les plus favorables, ni parmi les moins favorables.
  const texte = e.position ?? "À l'échelle de la commune, la douceur des hivers ne se distingue ni parmi les communes les plus favorables, ni parmi les moins favorables.";
  return {
    cle: "hivers", commune: lieu.commune,
    fait: e.temperatureReference
      ? {
          texte: e.temperatureReference, source: "DRIAS · Météo-France, période de référence 1976-2005", grain: "commune",
          ...(e.temperatureValeur ? {
            mesure: {
              valeur: e.temperatureValeur.replace(/\s*°C$/, ""),
              unite: "°C",
              legende: "température moyenne de l'hiver (décembre à février), période de référence 1976-2005",
            },
          } : {}),
        }
      : null,
    pourVous: { signal, texte },
    aVerifier: e.limite ?? LIMITE_HIVERS,
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
