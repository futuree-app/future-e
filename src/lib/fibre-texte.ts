// ════════════════════════════════════════════════════════════════════════════════════════════
// CE QUE FUTUR•E DIT DE LA FIBRE D'UNE COMMUNE (FUT-148). PUR, DÉTERMINISTE, SANS MODÈLE.
//
// Trois choses, dans cet ordre, et rien de plus au premier niveau (doctrine du Relevé, FUT-67) :
//   1. le niveau de déploiement, en une phrase, daté et attribué à l'Arcep ;
//   2. pourquoi ce taux ne garantit rien pour un logement ;
//   3. où vérifier l'adresse (cartefibre.arcep.fr).
// Définitions, effectifs, dénominateur et « raccordables sur demande » vont dans « Méthodologie ».
//
// DEUX INTERDITS DE TEXTE, qu'un test vérifie sur toutes les sorties :
//   - jamais une affirmation à l'adresse (« votre logement est raccordable ») ;
//   - jamais « sans Internet » déduit d'une part faible : 0 % de fibre n'est pas 0 accès.
// Et aucun mot de jugement (« faible », « mauvaise », « zone blanche ») : le chiffre suffit.
//
// LE BESOIN DU LECTEUR. Le Projet n'a pas de priorité « télétravail » ni « fibre », et ce ticket n'en
// crée pas. `emploiHorsSujet` ne sert pas : il réunit retraite, sans activité et télétravail total, et
// en tirer un télétravailleur serait une déduction arbitraire. Seul signal explicite : les mots du
// lecteur que le parseur a gardés tels quels dans `horsMesure` (« fibre », « télétravail »…).
// ════════════════════════════════════════════════════════════════════════════════════════════
import { CARTE_FIBRE_URL, partEntiere, type LectureFibre } from "./data/arcep-fibre.ts";
import { bindOrphans } from "./typography.ts";

const NBSP = " ";
const MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];

/** « 30 juin 2026 » depuis `2026-06-30`. */
export function dateArrete(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return iso;
  const jour = Number(m[3]);
  return `${jour === 1 ? "1er" : jour} ${MOIS[Number(m[2]) - 1]} ${m[1]}`;
}
/** « juin 2026 » depuis `2026-06-30`. */
export function moisArrete(iso: string): string {
  return dateArrete(iso).replace(/^\S+ /, "");
}
/** « 2e trimestre 2026 » depuis `2026T2`. */
export function trimestreLisible(t: string): string {
  const m = /^(\d{4})T([1-4])$/.exec(t);
  return m ? `${m[2] === "1" ? "1er" : `${m[2]}e`} trimestre ${m[1]}` : t;
}
const entier = (n: number) => Math.round(n).toLocaleString("fr-FR").replace(/[   ]/g, NBSP);

// ── LE BESOIN, DANS LES MOTS DU LECTEUR ──────────────────────────────────────────────────────

// La fibre, Internet, le télétravail. PAS la 4G ni le « réseau » : la couverture mobile est une autre
// grandeur, que cette table ne dit pas. PAS « connexion » seul : « une bonne connexion avec Paris » est
// une demande de transport.
const CONNEXION = /\bfibre\b|internet|haut[\s-]d[ée]bit|t[ée]l[ée]-?travail|travail(?:ler)?\s+(?:à|a)\s+distance|\bremote\b|\badsl\b|connexion\s+(?:internet|web|fibre)/i;

/** Ce terme du lecteur parle-t-il de connexion Internet ou de télétravail ? */
export function termeDeConnexion(terme: string | null | undefined): boolean {
  return typeof terme === "string" && CONNEXION.test(terme);
}

/** Le lecteur a-t-il, en ses mots, fait de la connexion une question de son projet ? */
export function projetEvoqueLaConnexion(parsed: { horsMesure?: { term?: string | null }[] | null } | null | undefined): boolean {
  return (parsed?.horsMesure ?? []).some((h) => termeDeConnexion(h?.term));
}

// ── LES PHRASES ──────────────────────────────────────────────────────────────────────────────

/** « de la commune », ou « de l'arrondissement » quand le code lu est un arrondissement. */
function lieu(l: LectureFibre): string {
  const arrondissement = l.etat === "mesuree" ? !l.agrege && /^(751\d\d|6938\d|132\d\d)$/.test(l.code) : /^(751\d\d|6938\d|132\d\d)$/.test(l.code);
  return arrondissement ? "de l'arrondissement" : "de la commune";
}

/** La part, en mots : « 62 % », « moins de 1 % ». `null` quand aucun local n'est raccordable. */
export function partEnMots(locaux: number, raccordables: number): string | null {
  if (raccordables <= 0) return null;
  if ((raccordables * 100) / locaux < 1) return `moins de 1${NBSP}%`;
  return `${partEntiere(locaux, raccordables)}${NBSP}%`;
}

export const AUTRES_TECHNOLOGIES =
  "Un local que la fibre n'atteint pas encore n'est pas privé d'Internet pour autant : le cuivre (ADSL), la 4G ou la 5G fixe, le satellite ou un réseau câblé peuvent le desservir.";

export const VERIFICATION =
  "Pour une adresse précise, la carte de l'Arcep indique si l'immeuble ou la maison est raccordable ; l'opérateur le confirme ensuite.";

export const LIEN_VERIFICATION = { href: CARTE_FIBRE_URL, label: "Vérifier une adresse sur cartefibre.arcep.fr" } as const;

export type TexteFibre = {
  /** Face de carte : la valeur (« 62 % des locaux »), sa ligne secondaire, la source courte. */
  valeur: string;
  sousTitre: string;
  source: string;
  /** La donnée manque (aucun taux affiché). */
  manquant: boolean;
  /** Volet : le chiffre phare, la phrase, la limite, la vérification, la méthode. */
  titreVolet: string;
  phrase: string;
  limite: string;
  verification: string;
  methode: string;
  faits: { label: string; value: string }[];
};

/**
 * LE TEXTE D'UNE LECTURE. `lecture: null` = la table n'a pas pu être lue : on le dit, sans taux.
 * `pourLeProjet` : le lecteur a parlé de connexion ou de télétravail ; la carte le rappelle, sans
 * rien changer au fond.
 */
export function texteFibre(lecture: LectureFibre | null, opts: { pourLeProjet?: boolean } = {}): TexteFibre {
  const rappelProjet = opts.pourLeProjet ? " · une question de votre projet" : "";
  if (!lecture) {
    return {
      valeur: "—", sousTitre: `Donnée indisponible${rappelProjet}`, source: "Arcep", manquant: true,
      titreVolet: "Donnée indisponible",
      phrase: bindOrphans("La couverture en fibre de la commune n'a pas pu être lue. Ce n'est pas une absence de fibre."),
      limite: "", verification: bindOrphans(VERIFICATION), methode: "Arcep, observatoire du haut et très haut débit, fichier par commune.", faits: [],
    };
  }
  const quand = dateArrete(lecture.arrete);
  const source = "Arcep · échelle communale";
  const methodeCommune =
    `Arcep, observatoire du haut et très haut débit, fichier par commune du ${trimestreLisible(lecture.trimestre)} ` +
    `(données au ${quand}), Licence Ouverte.`;
  if (lecture.etat !== "mesuree") {
    const cas = {
      absente: { sous: "Non publiée par l'Arcep", phrase: `La commune n'apparaît pas dans le fichier de l'Arcep au ${quand}. Ce n'est pas une absence de fibre.` },
      sans_locaux: { sous: "Aucun local recensé", phrase: `L'Arcep ne recense aucun logement ni local professionnel ${lieu(lecture)} : aucune part ne peut être calculée.` },
      discordante: {
        sous: "Chiffres de l'Arcep à confirmer",
        phrase: `Les deux publications de l'Arcep au ${quand} ne donnent pas le même nombre de locaux ${lieu(lecture)}, et le taux en dépend : futur•e n'en affiche aucun plutôt qu'un chiffre contestable.`,
      },
    }[lecture.etat];
    return {
      valeur: "—", sousTitre: `${cas.sous}${rappelProjet}`, source, manquant: true,
      titreVolet: cas.sous, phrase: bindOrphans(cas.phrase), limite: "", verification: bindOrphans(VERIFICATION),
      methode: methodeCommune, faits: [],
    };
  }

  const { locaux, raccordables } = lecture;
  const part = partEnMots(locaux, raccordables);
  const phrase = part
    ? `Au ${quand}, ${part} des locaux ${lieu(lecture)} sont raccordables à la fibre, selon l'Arcep.`
    : `Au ${quand}, aucun local ${lieu(lecture)} n'est raccordable à la fibre, selon l'Arcep.`;
  const portee = lecture.agrege || lieu(lecture) === "de la commune" ? "l'ensemble de la commune" : "l'ensemble de l'arrondissement";
  const limite = raccordables >= locaux
    ? `Ce taux concerne ${portee}. Il ne garantit pas que le logement qui vous intéresse est raccordable.`
    : `Ce taux concerne ${portee}. Il ne garantit pas que le logement qui vous intéresse est raccordable. ${AUTRES_TECHNOLOGIES}`;
  const denominateur = lecture.agrege
    ? "Somme des arrondissements, telle que l'Arcep les publie."
    : lecture.denominateurInsee
      ? "Faute de recensement complet par les opérateurs, l'Arcep estime ici le nombre de locaux à partir des données de l'Insee (logements et établissements employeurs)."
      : "Le nombre de locaux est celui que les opérateurs ont recensé.";
  const methode = [
    methodeCommune,
    `Part = locaux raccordables à la fibre jusqu'à l'abonné (FttH) ÷ estimation du nombre de locaux (logements et locaux professionnels) : ${entier(raccordables)} sur environ ${entier(locaux)}.`,
    denominateur,
    "Raccordable : la fibre arrive jusqu'au point de branchement, dans l'immeuble ou à quelques mètres de la maison.",
    "Les locaux « raccordables sur demande », dont le raccordement attend la commande d'un opérateur (jusqu'à six mois), ne sont pas comptés.",
    "Raccordable ne veut dire ni abonné, ni proposé par tous les opérateurs, ni un débit garanti.",
    lecture.partNationale != null ? `En France, ${lecture.partNationale}${NBSP}% des locaux sont raccordables à la même date.` : "",
  ].filter(Boolean).join(" ");
  return {
    valeur: part ? `${part.charAt(0).toUpperCase()}${part.slice(1)} des locaux` : "Aucun local",
    // « Aucun local raccordable », « 62 % des locaux raccordables » : l'accord suit la valeur.
    sousTitre: `${part ? "raccordables" : "raccordable"} à la fibre, ${moisArrete(lecture.arrete)}${rappelProjet}`,
    source,
    manquant: false,
    titreVolet: part ? `${part.charAt(0).toUpperCase()}${part.slice(1)} des locaux raccordables` : "Aucun local raccordable",
    phrase: bindOrphans(phrase),
    limite: bindOrphans(limite),
    verification: bindOrphans(VERIFICATION),
    methode,
    faits: [
      { label: "Locaux raccordables", value: entier(raccordables) },
      { label: "Locaux recensés", value: lecture.denominateurInsee || !Number.isInteger(locaux) ? `environ ${entier(locaux)}` : entier(locaux) },
    ],
  };
}

/**
 * LA LIGNE DU COMPARATEUR, courte, pour un projet qui a parlé de connexion. Un fait, sa date, sa
 * portée. Pas de rang, pas de comparaison entre communes : la ligne ne dit pas « mieux couverte ».
 */
export function ligneComparateur(lecture: LectureFibre | null): string {
  if (!lecture) return "Fibre : donnée indisponible pour cette commune.";
  const mois = moisArrete(lecture.arrete);
  if (lecture.etat === "absente") return "Fibre : commune absente du fichier de l'Arcep.";
  if (lecture.etat === "sans_locaux") return "Fibre : aucun local recensé par l'Arcep.";
  if (lecture.etat === "discordante") return "Fibre : chiffres de l'Arcep à confirmer pour cette commune.";
  const part = partEnMots(lecture.locaux, lecture.raccordables);
  const lieuCourt = lieu(lecture) === "de l'arrondissement" ? "de l'arrondissement" : "de la commune";
  return part
    ? `Fibre : ${part} des locaux ${lieuCourt} raccordables (Arcep, ${mois}), à vérifier à l'adresse.`
    : `Fibre : aucun local ${lieuCourt} raccordable (Arcep, ${mois}) ; d'autres accès à Internet peuvent exister.`;
}
