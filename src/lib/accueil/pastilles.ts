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

import { AGGLOMERATION_SIZE_CONVENTION } from "../decision/agglomeration-facts.ts";

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
    /** `secteur` : une mesure plus fine que la commune (SocleOM, point de grille de ~3 km près de la mairie). */
    grain: "commune" | "unite_urbaine" | "secteur";
    /**
     * LA DONNÉE PRINCIPALE, quand une mesure pertinente existe : affichée en grand, toujours avec son unité et sa
     * légende (libellé, période, contexte). Absente quand le fait n'est pas une valeur unique : on ne force pas.
     * Le texte complet reste celui du fait, lu par les lecteurs d'écran.
     */
    mesure?: { valeur: string; unite: string; legende: string };
    /** Deux dimensions côte à côte (chaleur : jours au-dessus de 35 °C et nuits tropicales). */
    mesures?: MesureChaleur[];
    /** Un détail consultable, replié par défaut (risques : la liste structurée de ce que la source recense). */
    detail?: { resume: string; groupes: GroupeRisques[]; notes?: string[] };
  } | null;
  pourVous: { signal: Signal; texte: string };
  /** L'explication de méthode, consultable (« Comment lire ce résultat ? »). Ne répète pas les chiffres affichés. */
  methode?: string[];
  aVerifier: string;
  /**
   * Le prochain geste : toujours un vrai parcours. `horsOffre` : aucun parcours payant n'existe pour ce lieu (V1 :
   * Hexagone et Corse seulement, décision du 16/10/2026) ; la lecture le dit, sans bouton qui laisserait croire
   * qu'un achat est possible.
   */
  suite: { libelle: string; href: string } | { horsOffre: string };
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
/**
 * LA VALEUR AFFICHÉE NE CONTREDIT JAMAIS LA CLASSIFICATION. Le moteur classe sur la valeur NON arrondie
 * (`>= seuil`). L'affichage essaie, dans l'ordre, l'entier puis une décimale, et retient la première forme qui
 * reste du même côté du seuil que la valeur réelle. Si aucune ne le fait (24,96 → « 25 », puis « 25,0 »), il dit
 * la relation elle-même : « moins de 25 » (ou « au moins N » pour un seuil non entier dépassé de peu). Aucune
 * deuxième décimale : ce serait une précision que la donnée n'a pas.
 *   - sous une occurrence par an : « moins de 1 » (si le seuil est au-dessus de 1) ;
 *   - `seuil = Infinity` : pas de seuil (journées au-dessus de 30 °C), l'entier suffit.
 * Contrat : `v` est fini (les faits climatiques filtrent les valeurs non finies ; `lireChaleur` les traite comme
 * absentes). Une valeur non finie lève une erreur plutôt que d'afficher « NaN ».
 */
const estFini = (v: number | null | undefined): v is number => typeof v === "number" && Number.isFinite(v);

export function valeurAffichee(v: number, seuil: number, precision: "entier" | "decimale" = "entier"): string {
  if (!Number.isFinite(v)) throw new RangeError(`valeur climatique non finie : ${v}`);
  const atteint = v >= seuil;
  if (v < 1 && seuil > 1) return "moins de 1";
  const dixieme = Math.round(v * 10) / 10;
  // « entier » : le grand chiffre (l'entier d'abord, la décimale seulement si l'entier franchirait le seuil).
  // « decimale » : la méthode, qui donne la valeur au dixième (« 23,4 pour un repère de 25 »), sous la même garantie.
  const formes: [string, number][] = precision === "decimale"
    ? [[dixieme.toLocaleString("fr-FR", { maximumFractionDigits: 1 }), dixieme]]
    : [
        [String(Math.round(v)), Math.round(v)],
        [v.toLocaleString("fr-FR", { minimumFractionDigits: 1, maximumFractionDigits: 1 }), dixieme],
      ];
  for (const [texte, nombre] of formes) if ((nombre >= seuil) === atteint) return texte;
  const s = seuil.toLocaleString("fr-FR");
  return atteint ? `au moins ${s}` : `moins de ${s}`;
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


/** Ce que la commune gagnerait par an, en moyenne : projeté moins référence reconstruite. `null` sans référence. */
const gain = (a: AxeChaleur) => (a.projete != null && a.reference != null ? a.projete - a.reference : null);
/**
 * LA RÉPONSE À LA PRIORITÉ : une pastille, puis une phrase qui parle de la commune, jamais du mécanisme de futur•e
 * (revue du 15/10 : ni « seuil », ni « ce que futur•e signale »). Elle ne reformule pas les nombres affichés.
 *
 *   classement du moteur     | pastille             | phrase
 *   unfavorable              | Plutôt défavorable   | nomme ce qui atteint le seuil du moteur, et seulement cela
 *   under_threshold, rare    | Plutôt favorable     | les deux mesures sous une par an même en 2050 (palier existant)
 *   under_threshold, sinon   | À surveiller         | jamais favorable : la chaleur progresse sous les seuils
 *   absent / uncertain       | Donnée indisponible  | (traité dans `lireChaleur`)
 *
 * Chaque qualificatif a sa règle, et une seule :
 *   « peu nombreuses »              → sous le seuil du moteur (8 jours, 25 nuits) ;
 *   « particulièrement fréquentes » → seuil du moteur atteint ;
 *   « beaucoup plus fréquentes »    → au moins DOUBLÉES depuis 1976-2005 (convention éditoriale du 15/10, à valider) ;
 *   « plus fréquentes »             → une de plus par an au moins, sans doubler (palier « moins d'un » existant).
 * Deux communes aux chiffres différents peuvent recevoir la même phrase : la différence se lit dans les chiffres.
 */
const double = (a: AxeChaleur) => a.projete != null && a.reference != null && a.projete >= 1 && a.projete >= 2 * a.reference;

/** Comment évoluent les nuits tropicales d'une commune sous les seuils. `null` : rien à en dire sans inventer. */
function evolutionNuits(n: AxeChaleur): string | null {
  const g = gain(n);
  if (g == null || g < 1) return null;
  return double(n) ? "les nuits tropicales deviendraient beaucoup plus fréquentes" : "les nuits tropicales seraient plus fréquentes";
}

export function phraseChaleur(e: EntreesChaleur, commune: string): { signal: Signal; texte: string } {
  const { jours, nuits } = e;
  if (jours.projete! < 1 && nuits.projete! < 1) {
    return { signal: "favorable", texte: "Les fortes chaleurs resteraient exceptionnelles ici, même en 2050." };
  }
  if (e.verdict === "unfavorable") {
    const j = jours.projete! >= jours.seuil, n = nuits.projete! >= nuits.seuil;
    if (j && n) {
      const hausse = (gain(jours) ?? 0) >= 1 && (gain(nuits) ?? 0) >= 1;
      return {
        signal: "defavorable",
        texte: `${hausse ? "Les fortes chaleurs augmenteraient de jour comme de nuit." : "Les fortes chaleurs seraient fréquentes de jour comme de nuit."} Sur ces deux aspects, ${commune} correspond mal à votre priorité.`,
      };
    }
    const sujet = n ? "Les nuits tropicales" : "Les journées au-dessus de 35 °C";
    return { signal: "defavorable", texte: `${sujet} deviendraient particulièrement fréquentes, ce qui correspond mal à votre souhait d'éviter les fortes chaleurs.` };
  }
  // Sous les seuils : les deux mesures restent sous le seuil du moteur, donc « peu nombreuses ».
  const nuitsEvoluent = evolutionNuits(nuits);
  return {
    signal: "sous_seuil",
    texte: nuitsEvoluent
      ? `Les journées au-dessus de 35 °C resteraient peu nombreuses, mais ${nuitsEvoluent}.`
      : "Les journées au-dessus de 35 °C comme les nuits tropicales resteraient peu nombreuses.",
  };
}

/** « Comment lire ce résultat ? » : la méthode, sans répéter les chiffres affichés au-dessus. */
export function methodeChaleur(e: EntreesChaleur): string[] {
  const { jours, nuits } = e;
  const jAtteint = jours.projete! >= jours.seuil, nAtteint = nuits.projete! >= nuits.seuil;
  let ici: string;
  if (jAtteint && nAtteint) ici = "Ici, les deux repères sont atteints.";
  else if (jAtteint || nAtteint) ici = `Ici, seul le repère ${nAtteint ? "des nuits tropicales" : "des journées au-dessus de 35 °C"} est atteint.`;
  else if (jours.projete! < 1 && nuits.projete! < 1) ici = "Ici, aucun des deux repères n'est atteint.";
  else {
    // La mesure la plus proche de son repère, dite par sa valeur exacte : aucun qualificatif, aucun palier nouveau.
    const n = nuits.projete! / nuits.seuil >= jours.projete! / jours.seuil;
    const a = n ? nuits : jours;
    ici = `Ici, aucun des deux repères n'est atteint ; la mesure qui s'en approche le plus est celle des ${n ? "nuits tropicales" : "journées au-dessus de 35 °C"} (${valeurAffichee(a.projete!, a.seuil, "decimale")} pour un repère de ${a.seuil}). Une commune peut se réchauffer beaucoup sans atteindre ces repères.`;
  }
  return [
    "Deux mesures du climat de la commune : les journées où il fait plus de 35 °C, et les nuits tropicales, où la température ne descend pas sous 20 °C. Elles sont projetées pour 2050, quand la France se serait réchauffée d'environ 2,7 °C, et comparées à la période 1976-2005, qui n'est pas la situation actuelle.",
    `futur•e signale une exposition à partir de ${jours.seuil} journées au-dessus de 35 °C, ou de ${nuits.seuil} nuits tropicales par an en 2050. Ce sont des repères propres à futur•e, pas des seuils sanitaires officiels. ${ici}`,
    ...(estFini(e.jours30?.projete)
      ? ["Les journées au-dessus de 30 °C, à afficher sous le premier chiffre, complètent la lecture : elles comprennent celles au-dessus de 35 °C, et n'entrent pas dans ce résultat."]
      : []),
  ];
}

export function lireChaleur(lieu: Lieu, e: EntreesChaleur): LecturePastille {
  const suite = SUITE_ADRESSE(lieu);
  const { jours, nuits } = e;
  // Une valeur non finie (NaN, Infinity) est une donnée absente, jamais un nombre à afficher.
  if (e.verdict === "absent" || e.verdict === "uncertain" || !estFini(jours.projete) || !estFini(nuits.projete)) {
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
  if (j30 && estFini(j30.projete)) {
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
  const pourVous = phraseChaleur(e, lieu.commune);
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

// ── LES RISQUES : un constat, puis le détail replié (revues du 15/10) ─────────────────────────────────
//
// Source : GASPAR (Géorisques, `/api/v1/gaspar/risques`), le recensement des risques par commune. Nomenclature de
// référence : le fichier officiel `ddrm_risq_gaspar` de l'archive GASPAR (files.georisques.fr/GASPAR/gaspar.zip,
// millésime 2026-10-05, publié sur data.gouv.fr), colonnes `num_risque` / `lib_risque`. Le code est HIÉRARCHIQUE,
// et c'est lui qui classe, jamais le libellé :
//   - premier chiffre = nature : 1 naturel (11 à 18), 2 technologique (21 à 25), 3 minier (31 à 34 ; « 32
//     Inondations de terrains miniers » n'est donc PAS une inondation naturelle) ;
//   - deux chiffres = une famille ; trois = une déclinaison de la famille dont il porte le préfixe.
// Hors de ce format (« AUTRE » dans le fichier, « AUT » dans l'API : « Autre risque », 27 communes de l'Oise et du
// Calvados ; un code vide ou inattendu), la ligne n'est JAMAIS ignorée : elle va dans « Autres risques recensés »,
// non classée, et le constat cesse de dire qu'aucun risque naturel n'est recensé.

export type RisqueGaspar = { code: string; libelle: string };
export type NatureRisque = "naturel" | "technologique" | "minier" | "autre";
export type FamilleRisque = { code: string; nom: string; declinaisons: string[]; precision?: string };
export type GroupeRisques = { nature: NatureRisque; titre: string; note?: string; familles: FamilleRisque[] };

const NATURE_DU_CHIFFRE: Record<string, NatureRisque> = { "1": "naturel", "2": "technologique", "3": "minier" };

// Les familles naturelles dans les mots du lecteur : un renommage des familles DE LA SOURCE (même code, même
// périmètre), pas un regroupement nouveau ; une famille inconnue garde le libellé de la source.
const NOM_FAMILLE_NATURELLE: Record<string, string> = {
  "11": "inondation", "12": "mouvements de terrain", "13": "séisme", "14": "avalanche",
  "15": "éruption volcanique", "16": "feux de forêt", "17": "phénomènes météorologiques", "18": "radon",
};

/**
 * LA PRÉCISION DANS LE CONSTAT. Une famille se précise quand elle n'a qu'UNE déclinaison ET que cette déclinaison
 * est une MANIÈRE dont la famille se produit : dans la nomenclature, ce sont les déclinaisons de l'inondation,
 * toutes écrites « Par … » (112 à 117), qui qualifient la famille d'elles-mêmes (« inondation par submersion
 * marine »). Les autres déclinaisons sont des sous-types (127 « Tassements différentiels », 172 « Tempête… ») :
 * les accrocher au constat en ferait une liste dans la liste. Mesuré sur les 31 733 communes du fichier : la règle
 * « toute famille à une déclinaison » rallongeait le constat de 40 % en moyenne (jusqu'à 150 caractères, jusqu'à
 * trois précisions) ; celle-ci, de 11 %, une précision au plus. Formes courtes fidèles au libellé officiel.
 */
const PRECISION_DE_MANIERE: Record<string, string> = {
  "112": "par crue lente", "113": "par crue rapide", "114": "par ruissellement",
  "115": "par lave torrentielle", "116": "par remontée de nappe", "117": "par submersion marine",
};

/** « Eboulement », « Eruption » : la source omet l'accent de la capitale ; en minuscule, il devient une faute. */
const libelleLecteur = (l: string) => minusculeInitiale(l.replace(/^Eboulement/, "Éboulement").replace(/^Eruption/, "Éruption"));

export function regrouperRisques(risques: RisqueGaspar[]): GroupeRisques[] {
  const familles = new Map<string, FamilleRisque & { nature: NatureRisque; codesDeclinaisons: string[] }>();
  const nonClassees: FamilleRisque[] = [];
  for (const r of [...risques].sort((a, b) => a.code.localeCompare(b.code))) {
    const code = r.code.trim();
    const libelle = r.libelle.trim();
    // Une ligne sans libellé ne dit rien de lisible : on ne l'affiche pas, mais `illisibles` la compte (plus bas).
    if (!libelle) continue;
    if (!/^\d{2,}$/.test(code)) {
      nonClassees.push({ code: code || "?", nom: libelleLecteur(libelle), declinaisons: [] });
      continue;
    }
    const cle = code.slice(0, 2);
    const nature = NATURE_DU_CHIFFRE[code[0]!] ?? "autre";
    const f = familles.get(cle) ?? { code: cle, nom: "", declinaisons: [], codesDeclinaisons: [], nature };
    if (code.length === 2) f.nom = nature === "naturel" ? (NOM_FAMILLE_NATURELLE[cle] ?? libelleLecteur(libelle)) : libelleLecteur(libelle);
    else { f.declinaisons.push(libelleLecteur(libelle)); f.codesDeclinaisons.push(code); }
    familles.set(cle, f);
  }
  // Une déclinaison sans sa famille dans la réponse (aucun cas dans le fichier officiel, possible dans l'API) : son
  // code nomme la famille. Famille naturelle connue → ce nom, la déclinaison reste dessous ; sinon la déclinaison
  // devient sa propre ligne. Rien ne se perd.
  for (const f of familles.values()) {
    if (f.nom) continue;
    const connue = f.nature === "naturel" ? NOM_FAMILLE_NATURELLE[f.code] : undefined;
    if (connue) f.nom = connue;
    else { f.nom = f.declinaisons.shift() ?? f.code; f.codesDeclinaisons.shift(); }
  }
  const groupe = (nature: NatureRisque, titre: string, note?: string): GroupeRisques | null => {
    const liste = nature === "autre"
      ? [...[...familles.values()].filter((f) => f.nature === "autre").map(({ code, nom, declinaisons }) => ({ code, nom, declinaisons })), ...nonClassees]
      : [...familles.values()].filter((f) => f.nature === nature).map(({ code, nom, declinaisons, codesDeclinaisons }) => {
          const precision = codesDeclinaisons.length === 1 ? PRECISION_DE_MANIERE[codesDeclinaisons[0]!] : undefined;
          return { code, nom, declinaisons, ...(precision ? { precision } : {}) };
        });
    return liste.length ? { nature, titre, ...(note ? { note } : {}), familles: liste } : null;
  };
  return [
    groupe("naturel", "Risques naturels"),
    groupe("technologique", "Risques technologiques", "Recensés par la même source, ils ne relèvent pas des risques naturels."),
    groupe("minier", "Risques miniers", "Liés aux anciennes exploitations, ils ne relèvent pas des risques naturels."),
    groupe("autre", "Autres risques recensés", "La source ne les classe pas parmi les risques naturels, technologiques ou miniers : ils sont repris tels quels."),
  ].filter((g): g is GroupeRisques => g != null);
}

/**
 * LA RÉPONSE DE L'API, en trois situations jamais confondues :
 *   - `data: []` : la base répond valablement sans rien pour cette commune → `[]` ;
 *   - une commune SANS `risques_detail` (absent, nul, pas une liste), ou une réponse sans `data` : réponse
 *     incomplète. Le contrat de l'API ne dit pas qu'elle vaut « rien de recensé » → `null`, comme une panne ;
 *   - sinon, chaque ligne est transmise, même sans code ou sans libellé : `regrouperRisques` décide.
 */
export function interpreterReponseGaspar(json: unknown): RisqueGaspar[] | null {
  const data = (json as { data?: unknown } | null)?.data;
  if (!Array.isArray(data)) return null;
  if (data.length === 0) return [];
  const detail = (data[0] as { risques_detail?: unknown } | null)?.risques_detail;
  if (!Array.isArray(detail)) return null;
  return detail.map((d: { num_risque?: unknown; libelle_risque_long?: unknown } | null) => ({
    code: String(d?.num_risque ?? "").trim(),
    libelle: String(d?.libelle_risque_long ?? "").trim(),
  }));
}

const SOURCE_GEORISQUES = "Géorisques, base GASPAR · recensement actuel de l'État";
// Ce que le dossier d'adresse sait fournir au point : le zonage d'un plan de prévention quand il en existe un, ses
// règles, et la nature du sol (argiles, zone sismique). Rien de plus n'est promis.
const A_VERIFIER_RISQUES = "À une adresse précise, vérifiez si elle se trouve dans une zone réglementée, les règles qui s'y appliquent et la nature du sol.";
const HORS_ZONE = "Être hors d'une zone réglementée ne met pas à l'abri de tout risque.";

/**
 * `risques` : `null` quand la source ne fournit pas de réponse exploitable (panne, ou réponse incomplète : jamais
 * « aucun risque ») ; `[]` quand elle répond valablement sans rien recenser. GASPAR ne distingue pas « commune sans
 * risque recensé » de « commune absente de la base » (02813 et 80589 répondent 0 résultat, comme un code
 * inexistant) : le texte dit donc seulement que la base ne recense rien.
 */
export function lireRisques(lieu: Lieu, risques: RisqueGaspar[] | null): LecturePastille {
  const suite = SUITE_ADRESSE(lieu);
  if (risques == null) {
    return {
      cle: "risques", commune: lieu.commune, fait: null,
      pourVous: { signal: "indisponible", texte: "La base nationale des risques n'a pas répondu : nous ne pouvons rien en dire, ni dans un sens ni dans l'autre." },
      aVerifier: A_VERIFIER_RISQUES,
      suite,
    };
  }
  const groupes = regrouperRisques(risques);
  const illisibles = risques.filter((r) => !r.libelle.trim()).length;
  const naturels = groupes.find((g) => g.nature === "naturel")?.familles ?? [];
  const nonClasse = groupes.some((g) => g.nature === "autre");
  const autres = groupes.filter((g) => g.nature !== "naturel");
  const nomme = (f: FamilleRisque) => (f.precision ? `${f.nom} ${f.precision}` : f.nom);
  const constat = naturels.length >= 2
    ? `Plusieurs risques naturels sont recensés dans la commune : ${joinFr(naturels.map(nomme))}.`
    : naturels.length === 1
      ? `Un risque naturel est recensé dans la commune : ${nomme(naturels[0]!)}.`
      : nonClasse
        // Un risque non classé pourrait être naturel : on ne dit ni « aucun risque naturel », ni qu'il ne l'est pas.
        ? "La source recense pour la commune un risque sans en préciser la nature : il est détaillé ci-dessous."
        : autres.length
          ? "Aucun risque naturel n'est recensé dans la commune ; d'autres risques le sont, détaillés ci-dessous."
          : illisibles
            ? "La source recense des risques pour la commune, mais sans libellé lisible : nous ne pouvons pas les nommer."
            : "La base nationale des risques ne recense rien pour cette commune.";
  const noteDetail = [
    ...(illisibles ? [`${illisibles === 1 ? "Une ligne" : `${illisibles} lignes`} de la source, sans libellé, n'${illisibles === 1 ? "a" : "ont"} pas pu être lue${illisibles === 1 ? "" : "s"}.`] : []),
    HORS_ZONE,
  ];
  return {
    cle: "risques", commune: lieu.commune,
    fait: {
      texte: constat, source: SOURCE_GEORISQUES, grain: "commune",
      ...(groupes.length ? { detail: { resume: "Voir les risques recensés", groupes, notes: noteDetail } } : {}),
    },
    pourVous: {
      signal: "information",
      texte: naturels.length || nonClasse
        ? "Un risque recensé dans la commune ne concerne pas forcément chaque adresse."
        : "Une absence de recensement ne garantit pas l'absence de danger.",
    },
    aVerifier: A_VERIFIER_RISQUES,
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
