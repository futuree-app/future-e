// ════════════════════════════════════════════════════════════════════════════════════════════
// L'INONDATION, LUE PAR SES TROIS SOURCES, AU MÊME ENDROIT.
//
// ── LE DÉFAUT QUE CE MODULE FERME (premier test réel, 16/08/2026) ─────────────────────────────
// Le dossier d'une adresse de Ciré-d'Aunis juxtaposait trois faits vrais, chacun dans son bloc :
//
//   « Aucune règle de construction particulière à cette adresse »   (PPRN au point, Géorisques)
//   « Aucun sinistre d'inondation n'a été remboursé dans cette commune sur la période connue »
//                                                                    (ONRN/CCR, 1995-2021)
//   5 arrêtés de catastrophe naturelle inondation depuis 1982        (GASPAR, module Territoire)
//
// Aucun n'était faux. Aucun ne disait son grain, sa période ni son objet AVANT son résultat, et
// aucun ne parlait des deux autres. Le lecteur a lu « pas de risque d'inondation » puis « risque
// d'inondation », et il a conclu que le dossier se contredisait. Ce n'est pas une erreur de donnée,
// c'est une absence de lecture : la seule chose qui manquait était la phrase qui ordonne les trois.
//
// ── CE QUE CE MODULE GARANTIT ────────────────────────────────────────────────────────────────
//  1. Chaque constat porte son EN-TÊTE (grain, période, objet mesuré) avant son énoncé.
//  2. Aucune sortie constructible ne conclut à une absence de risque. Le mot « risque » n'apparaît
//     que dans la phrase qui refuse de conclure.
//  3. L'absence de sinistre ONRN n'est JAMAIS énonçable seule quand des arrêtés sont comptés : la
//     phrase de réconciliation la borne, dans le même objet, par construction.
//  4. Le compte d'arrêtés vient de `catnat-evidence.ts` et de sa phrase, jamais réécrite ici. Deux
//     formulations voisines suffiraient à rouvrir le défaut que ce module-là a fermé.
//
// ── CE QU'IL NE FAIT PAS, ET C'EST DÉLIBÉRÉ ──────────────────────────────────────────────────
// Aucun verdict, aucun score, aucune synthèse « le risque d'inondation ici est … ». Les trois
// sources ne se résument pas : elles s'ordonnent. Ce module ordonne.
//
// Pur, sans réseau, testé sous `node --test`.
// ════════════════════════════════════════════════════════════════════════════════════════════

import {
  phraseConstatCatnatInondation, sourceCatnatInondation, type CatnatInondation,
} from "./catnat-evidence.ts";
import type { PerilState } from "../onrn-sinistralite.ts";

/** La période couverte par le jeu ONRN/CCR embarqué. Écrite une fois, affichée partout. */
export const ONRN_PERIODE = "1995-2021";

/**
 * LE ZONAGE RÉGLEMENTAIRE INONDATION AU POINT DE L'ADRESSE.
 *
 * `zonage_autre` existe pour une raison précise : un point peut relever d'un plan de prévention
 * (argiles, mouvements de terrain) sans qu'aucun ne concerne l'inondation. Le confondre avec
 * `aucun_zonage` ferait dire « aucun plan ne s'applique ici » là où un plan s'applique.
 */
export type ZonageInondationPoint =
  | { kind: "zone_inondation"; plans: string[] }
  | { kind: "zonage_autre" }
  | { kind: "aucun_zonage" }
  | { kind: "indisponible" };

export type CleConstatInondation = "zonage_point" | "catnat_commune" | "onrn_assurance";

export type ConstatInondation = {
  cle: CleConstatInondation;
  /** Le grain et l'objet mesuré, LUS AVANT le résultat. Jamais optionnel. */
  entete: string;
  /** La fenêtre temporelle de la source, ou `null` quand elle n'en a pas (un zonage est actuel). */
  periode: string | null;
  enonce: string;
  /** De quoi vérifier : la source, telle qu'on la citerait à quelqu'un qui conteste. */
  source: string;
  /** Cette source porte-t-elle un signal (zonage, arrêté, indemnisation) ? Gouverne l'affichage. */
  signal: boolean;
};

export type LectureInondation = {
  constats: ConstatInondation[];
  /** La phrase qui ordonne les lectures et refuse de conclure. Toujours présente. */
  reconciliation: string;
  /** Ce que l'ensemble ne dit pas. Toujours présente. */
  limite: string;
};

export type EntreeLectureInondation = {
  zonage: ZonageInondationPoint;
  /** Le compte d'arrêtés, tel que l'artefact du dossier l'a figé (ou l'index courant). */
  catnat: CatnatInondation | null;
  /** L'état ONRN/CCR du péril inondation. */
  onrn: PerilState;
};

const SOURCE_PPRN =
  "Géorisques, plans de prévention des risques naturels (zonage réglementaire au point géocodé)";
const SOURCE_ONRN =
  `ONRN / CCR via Géorisques, sinistres indemnisés ${ONRN_PERIODE}, échantillon de contrats assurés`;

/**
 * Le zonage inondation au point, DEPUIS LES MÊMES PLANS que « Statut réglementaire à cette
 * adresse ». Les deux blocs ne peuvent donc pas dire deux choses du même point : ils lisent la
 * même liste, filtrée ici sur l'aléa.
 *
 * `modeleProcedure` (PPRN-I, PPRN-SM) est le champ propre ; le nom du plan sert de repli, parce
 * qu'il manque sur une partie du parc (« PPRI de la Charente » sans modèle renseigné).
 */
// « PPRI » est dans la liste parce que c'est ainsi que la majorité des plans se nomment dans
// `libPpr` (« PPRI de la Charente »), sans que `modeleProcedure` soit toujours renseigné. Le mot
// est cerné par des limites de mot : « PPRIF » (feux de forêt) ne doit pas entrer par cette porte.
const ALEA_INONDATION = /\bPPRI\b|inondation|inondable|submersion|crue|ruissellement/i;

export function zonageInondationDepuisPlans(
  plans: { plan: string | null; hazardModel: string | null }[] | null | undefined,
): ZonageInondationPoint {
  if (plans == null) return { kind: "indisponible" };
  const inondation = plans.filter(
    (p) =>
      p.hazardModel === "PPRN-I" ||
      p.hazardModel === "PPRN-SM" ||
      (p.plan != null && ALEA_INONDATION.test(p.plan)),
  );
  if (inondation.length > 0) {
    return {
      kind: "zone_inondation",
      plans: inondation.map((p) => p.plan).filter((p): p is string => Boolean(p)),
    };
  }
  return plans.length > 0 ? { kind: "zonage_autre" } : { kind: "aucun_zonage" };
}

function constatZonage(z: ZonageInondationPoint): ConstatInondation | null {
  if (z.kind === "indisponible") return null;
  const base = {
    cle: "zonage_point" as const,
    entete: "Au point de l'adresse · zonage réglementaire",
    periode: null,
    source: SOURCE_PPRN,
  };
  if (z.kind === "zone_inondation") {
    const noms = z.plans.length > 0 ? ` : ${z.plans.join(", ")}` : "";
    return {
      ...base, signal: true,
      enonce: `Un plan de prévention du risque inondation réglemente ce point${noms}.`,
    };
  }
  // LES DEUX ABSENCES DISENT CE QU'UN ZONAGE EST, sans quoi « aucun » se lit « rien à craindre ».
  // Un zonage encadre la construction ; il ne mesure pas ce qui peut arriver au lieu.
  return {
    ...base, signal: false,
    enonce:
      z.kind === "zonage_autre"
        ? "Aucun plan de prévention du risque inondation ne réglemente ce point. D'autres plans de prévention s'y appliquent, pour d'autres phénomènes. Un zonage encadre la construction, il ne mesure pas ce que le lieu peut connaître."
        : "Aucun plan de prévention du risque inondation ne réglemente ce point. Un zonage encadre la construction, il ne mesure pas ce que le lieu peut connaître.",
  };
}

function constatCatnat(c: CatnatInondation | null): ConstatInondation | null {
  if (!c) return null;
  return {
    cle: "catnat_commune",
    entete: "Dans la commune · reconnaissances de catastrophe naturelle",
    periode: `depuis ${c.depuis}`,
    source: sourceCatnatInondation(c),
    signal: c.count > 0,
    // LA PHRASE DU COMPTE N'EST PAS ÉCRITE ICI. Elle vient de l'objet partagé, celui que la pastille
    // du dossier et la carte « Mémoire des catastrophes » affichent déjà.
    enonce:
      c.count > 0
        ? `La commune compte ${phraseConstatCatnatInondation(c)}. Une reconnaissance est un acte administratif qui ouvre l'indemnisation après un épisode, pas une probabilité.`
        : `Aucune reconnaissance de catastrophe naturelle inondation n'est comptée dans cette commune depuis ${c.depuis}.`,
  };
}

function constatOnrn(o: PerilState): ConstatInondation | null {
  if (o.kind === "indispo") return null;
  const base = {
    cle: "onrn_assurance" as const,
    entete: "Dans la commune · sinistres indemnisés par les assurances",
    periode: ONRN_PERIODE,
    source: SOURCE_ONRN,
  };
  if (o.kind === "lecture") {
    // LA FRÉQUENCE ET LE COÛT NE SONT PAS REPRIS ICI. Ils sont rendus juste en dessous, dans leur
    // carte, avec leurs classes et leur représentativité : les redire ferait deux versions du même
    // chiffre à trente centimètres d'écart, et c'est exactement le défaut que ce module ferme.
    return {
      ...base, signal: true,
      enonce: `Sur ${ONRN_PERIODE}, des sinistres d'inondation indemnisés sont recensés dans cette commune.`,
    };
  }
  if (o.kind === "faible_repr") {
    return {
      ...base, signal: true,
      enonce: `Sur ${ONRN_PERIODE}, des sinistres d'inondation indemnisés sont recensés dans cette commune, mais trop peu de biens y sont assurés dans l'échantillon pour en tirer une fréquence.`,
    };
  }
  // L'ABSENCE, ET SES DEUX BORNES INSÉPARABLES : la période, et le fait que c'est un échantillon.
  return {
    ...base, signal: false,
    enonce: `Sur ${ONRN_PERIODE}, aucun sinistre d'inondation indemnisé n'est recensé dans l'échantillon de contrats de cette commune.`,
  };
}

const MOT_NOMBRE: Record<number, string> = { 1: "Cette lecture", 2: "Ces deux lectures", 3: "Ces trois lectures" };

/**
 * LA PHRASE QUI ORDONNE, ET QUI NE CONCLUT PAS.
 *
 * Elle nomme ce que chaque source mesure, dans l'ordre où le lecteur les rencontre, puis refuse
 * explicitement la conclusion que la juxtaposition invite à tirer. Elle ne dit jamais que les
 * sources « ne se contredisent pas » : elles sont méthodologiquement compatibles, et leur écart
 * reste une information à expliquer, pas à neutraliser (arbitrage porteur, 17/08/2026).
 */
function reconcilie(constats: ConstatInondation[], catnat: CatnatInondation | null, onrn: PerilState): string {
  const objets: string[] = [];
  if (constats.some((c) => c.cle === "zonage_point")) objets.push("une règle d'urbanisme au point de l'adresse");
  if (constats.some((c) => c.cle === "catnat_commune")) objets.push("des reconnaissances administratives à l'échelle communale");
  if (constats.some((c) => c.cle === "onrn_assurance")) objets.push("des indemnisations observées dans un échantillon assurantiel");
  const enumeration =
    objets.length > 1 ? `${objets.slice(0, -1).join(", ")} et ${objets[objets.length - 1]}` : objets[0];

  let phrase = `${MOT_NOMBRE[constats.length] ?? "Ces lectures"} ne mesurent pas la même chose : ${enumeration}.`;

  // L'ABSENCE ONRN NE PART JAMAIS SEULE. Cette phrase est attachée au constat par construction :
  // il n'existe aucun chemin de ce module qui produise l'absence sans elle.
  if (onrn.kind === "aucun") {
    phrase +=
      " L'absence de sinistre recensé dans cet échantillon ne permet pas de conclure à l'absence d'événement ou de risque à cette adresse.";
    if (catnat && catnat.count > 0) {
      // LE COMPTE EST RAPPELÉ, PAS RÉSOLU. On dit l'écart et on dit ce qu'il faut aller vérifier ;
      // on ne prétend pas savoir lequel des deux jeux décrit le mieux ce lieu.
      phrase +=
        ` Le dossier compte par ailleurs ${phraseConstatCatnatInondation(catnat)} : cet écart tient aux périmètres, à la période et au champ des contrats couverts, et il ne se tranche pas depuis ces données.`;
    }
  } else if (onrn.kind !== "indispo" && catnat && catnat.count === 0) {
    phrase +=
      " Des indemnisations sont recensées ici sans qu'aucune reconnaissance de catastrophe naturelle inondation ne soit comptée : tous les dégâts d'eau n'en relèvent pas.";
  }
  return phrase;
}

function limiteDe(constats: ConstatInondation[]): string {
  const communal = constats.some((c) => c.cle !== "zonage_point");
  const point = constats.some((c) => c.cle === "zonage_point");
  const echelle =
    communal && point
      ? "Seul le zonage est lu au point de l'adresse ; les deux autres lectures portent sur la commune entière."
      : communal
        ? "Ces lectures portent sur la commune entière, pas sur l'adresse."
        : "Cette lecture porte sur le point géocodé de l'adresse.";
  return `${echelle} Aucune ne décrit ce que ce logement a subi : cela se demande au vendeur, dans l'état des risques et le questionnaire de sinistres.`;
}

/**
 * QUAND LA CARTE S'AFFICHE.
 *
 * Deux sources déterminées AU MOINS (sans quoi il n'y a rien à ordonner), et AU MOINS UN signal :
 * un zonage inondation, un arrêté, ou des indemnisations, même faiblement représentatives.
 *
 * Trois absences bien lues (pas de zonage, aucun arrêté, aucun sinistre) ne justifient pas une
 * carte de plus : la ligne bornée de la sinistralité les porte déjà, et une carte qui n'existerait
 * que pour dire « ces absences ne prouvent rien » se répéterait sur des milliers de dossiers sans
 * enjeu (arbitrage porteur, 17/08/2026).
 */
export function construireLectureInondation(e: EntreeLectureInondation): LectureInondation | null {
  const constats = [constatZonage(e.zonage), constatCatnat(e.catnat), constatOnrn(e.onrn)]
    .filter((c): c is ConstatInondation => c !== null);
  if (constats.length < 2) return null;
  if (!constats.some((c) => c.signal)) return null;
  return {
    constats,
    reconciliation: reconcilie(constats, e.catnat, e.onrn),
    limite: limiteDe(constats),
  };
}

/**
 * LA LIGNE ONRN DE LA CARTE « SINISTRES INDEMNISÉS », pour le péril inondation.
 *
 * Deux formes, parce qu'il y a deux situations de lecture, et elles vivent ICI côte à côte pour
 * la même raison que dans `catnat-evidence.ts` : écrites chacune de son côté, elles dériveraient.
 *
 *  • `avecLecture` : la carte de réconciliation est rendue au-dessus. La ligne se réduit alors au
 *    FAIT, borné par sa période et son échantillon, sans reprendre la phrase de réconciliation à
 *    trente centimètres d'elle-même.
 *  • sans elle (compte d'arrêtés inconnu) : la ligne porte elle-même sa borne, parce qu'elle est
 *    seule. Elle ne dit toujours pas « aucun sinistre d'inondation » tout court.
 */
export function ligneOnrnInondation(
  o: PerilState,
  avecLecture: boolean,
): { valeur: string; precision: string } | null {
  if (o.kind !== "aucun") return null;
  return {
    valeur: "Aucun sinistre indemnisé recensé",
    precision: avecLecture
      ? `échantillon de contrats assurés, ${ONRN_PERIODE}`
      : `échantillon de contrats assurés, ${ONRN_PERIODE}. Cette absence ne permet pas de conclure à l'absence d'événement ou de risque à cette adresse.`,
  };
}

/**
 * LA MÊME LIGNE POUR LA SÉCHERESSE, et pour tout péril dont on n'a pas d'historique administratif.
 *
 * La phrase d'origine (« Aucun sinistre de sécheresse n'a été remboursé dans cette commune sur la
 * période connue ») était absolue sur les DEUX périls : « la période connue » ne nomme pas la
 * période, et « remboursé dans cette commune » laisse croire à un relevé exhaustif des contrats.
 */
export function lignePerilSansSinistre(): { valeur: string; precision: string } {
  return {
    valeur: "Aucun sinistre indemnisé recensé",
    precision: `échantillon de contrats assurés, ${ONRN_PERIODE}. Cette absence ne permet pas de conclure à l'absence d'événement.`,
  };
}
