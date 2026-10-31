// ════════════════════════════════════════════════════════════════════════════════════════════
// LA SANTÉ ENVIRONNEMENTALE D'UNE COMMUNE, EN MOTS (FUT-167, D1, décision du porteur du 30/10/2026). PUR.
//
// Quatre lectures que le dossier de décision fait déjà, et qu'aucun écran ne montrait : l'air de fond, les
// sites industriels, le bruit des grandes infrastructures, le potentiel radon. Leurs preuves menaient en
// haut du module Territoire, où rien n'en parlait. La carte « Santé environnementale » les démontre, une
// ligne par lecture, et chaque preuve du dossier ouvre SA ligne.
//
// ── LA RÈGLE QUI GOUVERNE TOUT : LA CARTE NE SIGNALE QUE CE QUE LE DOSSIER SIGNALERAIT ─────────
// Les seuils viennent de `decision/sante-facts.ts` et de `decision/radon-facts.ts`, jamais recopiés. Une
// valeur sous le seuil se montre, avec ses repères ; elle n'est jamais mise en avant. Sans cette règle,
// la carte raconterait un constat que le dossier a écarté (CLAUDE.md, « un seuil qui devient conditionnel »).
//
// ── LE GRAIN, DIT SUR CHAQUE LIGNE ────────────────────────────────────────────────────────────
//   - l'air : une moyenne annuelle COMMUNALE, modélisée ;
//   - l'industrie et le bruit : des distances depuis le POINT DE RÉFÉRENCE de la commune (son centre),
//     jamais depuis un logement ;
//   - le radon : un classement RÉGLEMENTAIRE du sous-sol de la commune (ou de l'arrondissement).
// Aucune ligne ne parle « du logement » : ce qui se lit à l'adresse vit dans Logement.
//
// ── LE SITE « RETENU » N'EST PAS LE SITE « LE PLUS PROCHE » ───────────────────────────────────
// Le calcul d'exposition industrielle retient le site qui PÈSE le plus (gravité × proximité, 8 km) : un
// site soumis à la directive IED à 1 km pèse plus qu'un Seveso seuil bas à 7 km. La carte ne confond donc
// jamais les deux : elle dit la catégorie que le calcul retient (celle de la preuve du dossier), puis les
// sites Seveso réellement présents dans le rayon, avec leur distance, lus dans l'index des sites Seveso.
// Aucune absence de Seveso ne se déduit du score.
//
// ── CE QU'AUCUNE PHRASE N'A LE DROIT DE DIRE ─────────────────────────────────────────────────
// Qu'un air est pur ou sain, qu'un environnement est sans danger, qu'un logement est exposé ou épargné.
// `PHRASES_INTERDITES` est testé sur tous les états.
// ════════════════════════════════════════════════════════════════════════════════════════════
import {
  AIR_NO2_OMS, AIR_PM25_UE_2030, BRUIT_MAX_KM, distanceEnPhrase, industrieEnPhrase, industrieGlose,
  type BruitSource, type IndustrieClasse,
} from "./decision/sante-facts.ts";
import { RADON_CLASSE_SIGNALEE } from "./decision/radon-facts.ts";
import type { RadonClasse } from "./radon.ts";
import { SEVESO_RAYON_KM, nomAffichable, type SiteProche } from "./data/installations-seveso.ts";
import type { EvidenceTargetKey } from "./decision/evidence-targets.ts";
import { deCommune } from "./typography.ts";

// ── Repères officiels, pour le texte (les seuils de DÉCISION restent ceux de sante-facts) ─────────
/** Recommandation OMS 2021 pour les PM2,5, en moyenne annuelle. Repère d'affichage : aucune règle ne s'y compare. */
export const REPERE_PM25_OMS = 5;
/** Valeur limite européenne 2030 pour le NO₂ (directive 2024/2881). Repère d'affichage. */
export const REPERE_NO2_UE_2030 = 20;
// FUT-163 (31/10/2026) : `PM25_MINIMUM_NATIONAL` (5,6 µg/m³, minimum de l'index) fondait « aucune commune
// française ne la respecte ». L'index n'a pas démontré sa couverture nationale exhaustive : la généralisation est
// retirée. Le texte compare la valeur LUE à la recommandation, et ne parle d'aucune commune qu'il n'a pas lue.

export const AIR_SOURCE =
  "Moyennes annuelles modélisées par l'Ineris (modèle de chimie-transport CHIMERE, corrigé par les mesures des stations des associations de surveillance de la qualité de l'air), diffusées par l'ADEME (jeu data_communes).";
/**
 * L'ANNÉE DES CONCENTRATIONS N'EST PAS DÉMONTRÉE (recherche du 30/10/2026). La fiche ADEME du jeu indique
 * « Ineris, Year: 2023 », mais renvoie à une méthode « en date de février 2020 » et à une réanalyse publiée sur
 * 2000-2015 (Real et al., ESSD 2022). Aucune de ces dates n'est, de façon établie, l'année mesurée. On ne
 * l'invente pas, et on ne s'en sert pas pour rassurer.
 */
export const AIR_PERIODE =
  "L'année des concentrations n'est pas précisée par la source : la fiche de l'ADEME indique 2023 pour son édition et renvoie à une méthode de l'Ineris publiée en 2020.";

export const SANTE_LIBELLES = {
  air: "Air de fond",
  industrie: "Sites industriels",
  bruit: "Bruit des infrastructures",
  radon: "Radon",
} as const;
type CleLigne = keyof typeof SANTE_LIBELLES;

/** La clé de phénomène de chaque ligne : la preuve du dossier qui la vise ouvre le volet sur elle. */
export const SANTE_CIBLES: Record<CleLigne, EvidenceTargetKey> = {
  air: "health.air_background",
  industrie: "health.industrial_site",
  bruit: "health.noise_infrastructure",
  radon: "health.radon",
};

/** Ce qu'aucune phrase de ce module ne doit contenir. Testé sur tous les états. */
export const PHRASES_INTERDITES =
  /air (pur|sain)|environnement sain|sans danger|aucun risque|sans risque|à l'abri|épargn|protég|rassur|peu expos|exposition (faible|nulle)|(votre|ce) logement est expos|danger(eux|euse)|toxique|—/i;

// ── Entrées ───────────────────────────────────────────────────────────────────────────────────

/** Une lecture en un point de référence : la commune, ou un arrondissement de Paris, Lyon, Marseille. */
export type LectureLocale = {
  code: string;
  /** « Lille », « 9e arrondissement ». */
  libelle: string;
  /** La lecture porte sur un arrondissement de Paris, Lyon ou Marseille : son centre est celui de l'arrondissement. */
  estArrondissement?: boolean;
  air: { pm25: number | null; no2: number | null } | null;
  /** Le calcul d'exposition de l'index : `null` = commune non géolocalisée (non lue). */
  industrie: { classeRetenue: IndustrieClasse | null; notable: boolean } | null;
  /** Les sites Seveso dans le rayon, du plus proche au plus lointain ; `"indisponible"` = index illisible. */
  seveso: SiteProche[] | "indisponible";
  bruit: { source: BruitSource | null; distanceKm: number | null; notable: boolean } | null;
  /** `null` = non lu (source muette ou en panne lors de la consultation). */
  radon: RadonClasse | null;
};

export type EntreeSante = {
  communeName: string;
  /** Une lecture (commune, arrondissement) ou plusieurs (Paris, Lyon, Marseille au grain de la ville). */
  lectures: LectureLocale[];
  /** Le lecteur a un dossier d'adresse sur cette commune : les distances le disent depuis le centre, jamais depuis lui. */
  adresseConnue: boolean;
  /** Date de la lecture, ISO. Le volet la dit : c'est un complément daté, pas un fait du dossier figé. */
  luLe: string;
  /** Date d'extraction de l'index Seveso, ISO ; `null` = index illisible. */
  sevesoExtraitLe: string | null;
};

// ── Sorties ───────────────────────────────────────────────────────────────────────────────────

export type LigneSante = {
  cle: CleLigne;
  cible: EvidenceTargetKey;
  libelle: string;
  /** La valeur courte de la ligne (répartition du volet). */
  valeur: string;
  /** La ligne franchit le seuil de la règle du dossier. */
  signal: boolean;
  /** Le grain, dit en clair. */
  grain: string;
  paragraphes: string[];
  limite: string;
  geste: string | null;
};

export type CarteSante = {
  face: { valeur: string; sous: string };
  lignes: LigneSante[];
  /** Une lecture n'a pu être faite pour aucune des quatre familles. */
  manquante: boolean;
  note: string;
  sources: string;
};

// ── Mise en forme ─────────────────────────────────────────────────────────────────────────────

const nb = (v: number): string => v.toFixed(1).replace(".", ",");
const cap = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1);
const dateFr = (iso: string): string => {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : iso;
};
const plage = (vs: number[]): string => {
  const min = Math.min(...vs), max = Math.max(...vs);
  return nb(min) === nb(max) ? nb(min) : `de ${nb(min)} à ${nb(max)}`;
};
const listeFr = (xs: string[]): string => (xs.length <= 1 ? xs[0] ?? "" : `${xs.slice(0, -1).join(", ")} et ${xs[xs.length - 1]}`);

const SEUIL_FR = { seveso_haut: "Seveso seuil haut", seveso_bas: "Seveso seuil bas" } as const;

/** « du centre de la commune », « du centre de l'arrondissement » : le point d'où partent les distances. */
const centreDe = (l: LectureLocale): string => (l.estArrondissement ? "du centre de l'arrondissement" : "du centre de la commune");
/** « de Lille », « d'Arles », « du Havre », « du 9e arrondissement ». */
const duLieu = (l: LectureLocale): string => {
  if (l.estArrondissement) return `du ${l.libelle}`;
  if (/^Les\s/.test(l.libelle)) return `des ${l.libelle.slice(4)}`;
  if (/^Le\s/.test(l.libelle)) return `du ${l.libelle.slice(3)}`;
  return deCommune(l.libelle);
};
/** « 1er, 2e et 13e arrondissements » à partir des libellés « 1er arrondissement »… */
const arrondissementsFr = (ls: LectureLocale[]): string => {
  const ords = ls.map((l) => l.libelle.replace(/ arrondissement$/, ""));
  return `${listeFr(ords)} arrondissement${ords.length > 1 ? "s" : ""}`;
};
/** La catégorie retenue par le calcul, en forme courte (valeur de ligne et face de carte). */
const CLASSE_COURTE: Record<IndustrieClasse, string> = {
  seveso_haut: "Site Seveso seuil haut", seveso_bas: "Site Seveso seuil bas",
  ied: "Site soumis à la directive IED", industrie: "Site industriel soumis à autorisation",
};

// ── L'air ─────────────────────────────────────────────────────────────────────────────────────

const signalAir = (a: { pm25: number | null; no2: number | null }) =>
  (a.no2 != null && a.no2 >= AIR_NO2_OMS) || (a.pm25 != null && a.pm25 >= AIR_PM25_UE_2030);

function phrasePm25(v: number): string {
  const ue = v >= AIR_PM25_UE_2030
    ? `au-delà de la valeur limite européenne applicable en 2030 (${AIR_PM25_UE_2030} µg/m³)`
    : `sous la valeur limite européenne applicable en 2030 (${AIR_PM25_UE_2030} µg/m³)`;
  return `Particules fines (PM2,5) : ${nb(v)} µg/m³ en moyenne annuelle, ${ue}. La recommandation de l'Organisation mondiale de la santé est de ${REPERE_PM25_OMS} µg/m³ : cette moyenne ${v > REPERE_PM25_OMS ? "la dépasse" : "la respecte"}.`;
}

function phraseNo2(v: number): string {
  const oms = v >= AIR_NO2_OMS
    ? `au-delà de la recommandation de l'Organisation mondiale de la santé (${AIR_NO2_OMS} µg/m³)`
    : `sous la recommandation de l'Organisation mondiale de la santé (${AIR_NO2_OMS} µg/m³)`;
  return `Dioxyde d'azote (NO₂) : ${nb(v)} µg/m³ en moyenne annuelle, ${oms}. La valeur limite européenne applicable en 2030 est de ${REPERE_NO2_UE_2030} µg/m³.`;
}

const LIMITE_AIR =
  "Ce sont des moyennes annuelles de fond, modélisées pour l'ensemble de la commune. Le dioxyde d'azote, marqueur du trafic, varie fortement d'une rue à l'autre : il chute de moitié à quelques dizaines de mètres d'un axe passant.";
const GESTE_AIR = "Situez le logement par rapport aux voies passantes, et regardez sur quelle façade donnent les chambres.";

function ligneAir(ls: LectureLocale[]): LigneSante {
  const base = { cle: "air" as const, cible: SANTE_CIBLES.air, libelle: SANTE_LIBELLES.air, limite: LIMITE_AIR, geste: GESTE_AIR };
  const lues = ls.filter((l) => l.air && (l.air.pm25 != null || l.air.no2 != null));
  if (lues.length === 0) {
    const ou = ls.length > 1 ? "pour les arrondissements de la ville" : ls[0]?.estArrondissement ? "pour cet arrondissement" : "pour cette commune";
    return { ...base, valeur: "Non publié", signal: false, grain: ls.length > 1 ? "arrondissements" : "commune", paragraphes: [`Ces moyennes ne sont pas publiées ${ou}. Rien n'en est déduit.`], geste: null };
  }
  if (ls.length === 1) {
    const a = lues[0]!.air!;
    const paragraphes = [
      ...(a.pm25 != null ? [phrasePm25(a.pm25)] : ["Les particules fines (PM2,5) ne sont pas publiées pour cette commune."]),
      ...(a.no2 != null ? [phraseNo2(a.no2)] : ["Le dioxyde d'azote (NO₂) n'est pas publié pour cette commune."]),
      AIR_PERIODE,
    ];
    const valeur = [a.pm25 != null ? `PM2,5 ${nb(a.pm25)}` : null, a.no2 != null ? `NO₂ ${nb(a.no2)}` : null].filter(Boolean).join(" · ") + " µg/m³";
    return { ...base, valeur, signal: signalAir(a), grain: "moyenne annuelle de la commune", paragraphes };
  }
  // Paris, Lyon, Marseille : une fourchette par arrondissement, jamais une moyenne de la ville.
  const pm = lues.flatMap((l) => (l.air!.pm25 != null ? [l.air!.pm25] : []));
  const no = lues.flatMap((l) => (l.air!.no2 != null ? [l.air!.no2] : []));
  const auDela = lues.filter((l) => signalAir(l.air!)).map((l) => l.libelle);
  const valeur = [pm.length ? `PM2,5 ${plage(pm)}` : null, no.length ? `NO₂ ${plage(no)}` : null].filter(Boolean).join(" · ") + " µg/m³";
  const paragraphes = [
    `Ces moyennes sont publiées par arrondissement : elles vont ${pm.length ? `${plage(pm)} µg/m³ pour les particules fines (PM2,5)` : ""}${pm.length && no.length ? " et " : ""}${no.length ? `${plage(no)} µg/m³ pour le dioxyde d'azote (NO₂)` : ""}, selon l'arrondissement.`,
    auDela.length
      ? `${auDela.length === lues.length ? "Tous les arrondissements dépassent" : `${cap(listeFr(auDela))} ${auDela.length > 1 ? "dépassent" : "dépasse"}`} au moins un des seuils que retient futur•e : la recommandation de l'Organisation mondiale de la santé pour le dioxyde d'azote (${AIR_NO2_OMS} µg/m³) ou la valeur limite européenne de 2030 pour les particules fines (${AIR_PM25_UE_2030} µg/m³).`
      : `Aucun arrondissement ne dépasse la recommandation de l'Organisation mondiale de la santé pour le dioxyde d'azote (${AIR_NO2_OMS} µg/m³) ni la valeur limite européenne de 2030 pour les particules fines (${AIR_PM25_UE_2030} µg/m³).${pm.length ? ` La recommandation de l'OMS pour les particules fines est de ${REPERE_PM25_OMS} µg/m³ : ${pm.every((v) => v > REPERE_PM25_OMS) ? "chacune de ces moyennes la dépasse" : pm.every((v) => v <= REPERE_PM25_OMS) ? "chacune de ces moyennes la respecte" : "certaines de ces moyennes la dépassent"}.` : ""}`,
    AIR_PERIODE,
  ];
  return { ...base, valeur, signal: auDela.length > 0, grain: "moyenne annuelle de chaque arrondissement", paragraphes };
}

// ── L'industrie ───────────────────────────────────────────────────────────────────────────────

const LIMITE_INDUSTRIE =
  "Ces distances partent du point de référence de la commune et vont jusqu'au point publié de chaque site, pas jusqu'à son enceinte. Elles ne mesurent aucune exposition : ce qui s'applique autour d'un site se lit dans son plan de prévention des risques technologiques, à l'adresse.";
const GESTE_INDUSTRIE = "Consultez l'état des risques de l'adresse : il indique si un plan de prévention des risques technologiques s'y applique.";

function siteEnPhrase(s: SiteProche, depuis?: string): string {
  const fin = s.etat && /fin d'exploitation/i.test(s.etat) ? ", en fin d'exploitation" : "";
  // Position publiée absente ou fausse : le site est placé au centre de sa commune, la distance est approchée.
  const approx = s.approchee ? `environ ${distanceEnPhrase(s.distanceKm)} (position approchée : la fiche ne publie pas de position exploitable)` : distanceEnPhrase(s.distanceKm);
  return `${nomAffichable(s.nom)} (${SEUIL_FR[s.seuil]}${fin}), à ${approx}${depuis ? ` du centre ${depuis}` : ""}`;
}

/** Les sites cités nommément ; au-delà, ils sont comptés. */
const SITES_CITES = 5;

function ligneIndustrie(ls: LectureLocale[], sevesoExtraitLe: string | null, adresseConnue: boolean): LigneSante {
  const base = { cle: "industrie" as const, cible: SANTE_CIBLES.industrie, libelle: SANTE_LIBELLES.industrie, limite: LIMITE_INDUSTRIE, geste: GESTE_INDUSTRIE };
  const grain = `dans un rayon de ${SEVESO_RAYON_KM} km autour ${ls.length > 1 ? "du centre de chaque arrondissement" : centreDe(ls[0]!)}`;
  const paragraphes: string[] = [];

  // 1. Ce que retient le calcul d'exposition (celui de la preuve du dossier), quand il franchit le seuil.
  const notables = ls.filter((l) => l.industrie?.notable && l.industrie.classeRetenue);
  if (ls.length === 1 && notables.length === 1) {
    const c = notables[0]!.industrie!.classeRetenue!;
    paragraphes.push(
      `Le calcul d'exposition de futur•e pondère la gravité et la proximité des sites dans un rayon de ${SEVESO_RAYON_KM} km autour ${centreDe(ls[0]!)}. Il retient ici ${industrieEnPhrase(c)}, et l'exposition calculée atteint le niveau à partir duquel le dossier la signale. ${industrieGlose(c)}`.trim(),
    );
  } else if (notables.length > 0) {
    // Paris, Lyon, Marseille : une phrase par catégorie retenue, jamais une par arrondissement.
    paragraphes.push(`Le calcul d'exposition de futur•e pondère la gravité et la proximité des sites dans un rayon de ${SEVESO_RAYON_KM} km autour du centre de chaque arrondissement.`);
    for (const c of ["seveso_haut", "seveso_bas", "ied", "industrie"] as IndustrieClasse[]) {
      const ar = notables.filter((l) => l.industrie!.classeRetenue === c);
      if (ar.length) paragraphes.push(`${cap(arrondissementsFr(ar))} : il retient ${industrieEnPhrase(c)}, et l'exposition calculée atteint le niveau à partir duquel le dossier la signale.`);
    }
  }

  // 2. Les sites Seveso réellement présents, lus dans l'index (jamais déduits du score).
  const indisponible = ls.some((l) => l.seveso === "indisponible") || !sevesoExtraitLe;
  const parCode = new Map<string, { site: SiteProche; depuis: string }>();
  if (!indisponible) {
    for (const l of ls) for (const s of l.seveso as SiteProche[]) {
      const deja = parCode.get(s.code);
      if (!deja || s.distanceKm < deja.site.distanceKm) parCode.set(s.code, { site: s, depuis: ls.length > 1 ? `du ${l.libelle}` : "" });
    }
  }
  const sites = [...parCode.values()].sort((a, b) => a.site.distanceKm - b.site.distanceKm);
  const extraction = sevesoExtraitLe ? `extraction Géorisques du ${dateFr(sevesoExtraitLe)}` : "";

  let valeur: string;
  if (indisponible) {
    valeur = "Sites Seveso non lus";
    paragraphes.push("La liste des sites Seveso n'a pas pu être lue lors de cette consultation. Aucune absence n'en est déduite.");
  } else if (sites.length === 0) {
    valeur = `Aucun site Seveso à moins de ${SEVESO_RAYON_KM} km`;
    paragraphes.push(`Aucun site classé Seveso (seuil haut ou seuil bas) n'est recensé à moins de ${SEVESO_RAYON_KM} km ${ls.length > 1 ? "du centre des arrondissements" : centreDe(ls[0]!)} (${extraction}).`);
  } else {
    const p = sites[0]!.site;
    valeur = `${SEUIL_FR[p.seuil]} à ${distanceEnPhrase(p.distanceKm)}`;
    const cites = sites.slice(0, SITES_CITES).map((x) => siteEnPhrase(x.site, x.depuis || undefined));
    const reste = sites.length - cites.length;
    paragraphes.push(
      `${sites.length === 1 ? "Un site classé Seveso est recensé" : `${sites.length} sites classés Seveso sont recensés`} à moins de ${SEVESO_RAYON_KM} km ${ls.length > 1 ? "du centre d'au moins un arrondissement" : centreDe(ls[0]!)} (${extraction}) : ${listeFr(cites)}${reste > 0 ? `, et ${reste} autre${reste > 1 ? "s" : ""}` : ""}.`,
    );
  }
  paragraphes.push("Les autres installations classées (soumises à autorisation, ou à la directive européenne sur les émissions industrielles) ne sont pas détaillées ici.");
  if (adresseConnue) paragraphes.push(`Ces distances partent ${ls.length > 1 ? "du centre de chaque arrondissement" : centreDe(ls[0]!)}, pas de votre adresse.`);

  // Le calcul retient un site non Seveso (IED, autorisation) : la valeur dit la catégorie retenue, pas une absence.
  const retenue = notables[0]?.industrie?.classeRetenue;
  if (retenue && retenue !== "seveso_haut" && retenue !== "seveso_bas" && sites.length === 0 && !indisponible) {
    valeur = `${CLASSE_COURTE[retenue]} à proximité`;
  }
  if (ls.every((l) => l.industrie == null) && indisponible) {
    return { ...base, valeur: "Non lu", signal: false, grain, paragraphes: ["Cette lecture n'a pas pu être faite pour cette commune."], geste: null };
  }
  return { ...base, valeur, signal: notables.length > 0, grain, paragraphes };
}

// ── Le bruit ──────────────────────────────────────────────────────────────────────────────────

const LIMITE_BRUIT =
  "Cette distance est mesurée depuis le point de référence de la commune, pas depuis une adresse. Le bruit réellement perçu dépend de la façade, de l'étage, du relief et de l'isolation : ce n'est pas une mesure de bruit.";
const GESTE_BRUIT = "Écoutez sur place, à plusieurs heures. La carte de bruit de la commune donne les niveaux en décibels le long des grandes infrastructures.";
const BRUIT_COURT: Record<BruitSource, string> = { auto: "Autoroute", rail: "Voie ferrée", aero: "Aéroport" };

/** « une autoroute ou une voie rapide », « une voie ferrée », « un aéroport » : la source, en sujet de phrase. */
const BRUIT_SUJET: Record<BruitSource, string> = { auto: "une autoroute ou une voie rapide", rail: "une voie ferrée", aero: "un aéroport" };
const BRUIT_MINUSCULE: Record<BruitSource, string> = { auto: "autoroute", rail: "voie ferrée", aero: "aéroport" };

function ligneBruit(ls: LectureLocale[], adresseConnue: boolean): LigneSante {
  const base = { cle: "bruit" as const, cible: SANTE_CIBLES.bruit, libelle: SANTE_LIBELLES.bruit, limite: LIMITE_BRUIT, geste: GESTE_BRUIT };
  const lues = ls.filter((l) => l.bruit);
  const aeroLogement = adresseConnue ? ["Le bruit des avions à votre adresse, quand un plan d'exposition au bruit existe, est lu dans le module Logement."] : [];
  if (lues.length === 0) return { ...base, valeur: "Non lu", signal: false, grain: "commune", paragraphes: ["Cette lecture n'a pas pu être faite pour cette commune."], geste: null };

  if (ls.length === 1) {
    const l = lues[0]!;
    const b = l.bruit!;
    const grain = `depuis ${centreDe(l).replace(/^du /, "le ")}`;
    if (b.source != null && b.distanceKm != null) {
      const seuil = distanceEnPhrase(BRUIT_MAX_KM[b.source]);
      // La même information que le constat du dossier (`bruitEnPhrase`), avec le bon point de départ pour un arrondissement.
      const phrase = `${cap(BRUIT_SUJET[b.source])} passe à ${distanceEnPhrase(b.distanceKm)} ${centreDe(l)}`;
      return {
        ...base, valeur: `${BRUIT_COURT[b.source]} à ${distanceEnPhrase(b.distanceKm)}`, signal: b.notable, grain,
        paragraphes: [
          b.notable
            ? `${phrase}. futur•e signale ce type de source à partir de ${seuil}.`
            : `${phrase}. C'est au-delà de la distance à partir de laquelle futur•e signale ce type de source (${seuil}).`,
          ...aeroLogement,
        ],
      };
    }
    return {
      ...base, valeur: "Aucune grande infrastructure retenue", signal: false, grain,
      paragraphes: [`Aucune autoroute ou voie rapide, aucune voie ferrée principale et aucun aéroport commercial n'est retenu à proximité ${centreDe(l)}.`, ...aeroLogement],
    };
  }
  // Paris, Lyon, Marseille : une liste compacte, arrondissement par arrondissement.
  const signalees = lues.filter((l) => l.bruit!.notable && l.bruit!.source && l.bruit!.distanceKm != null);
  const detail = signalees.map((l) => `${l.libelle.replace(/ arrondissement$/, "")} (${BRUIT_MINUSCULE[l.bruit!.source!]} à ${distanceEnPhrase(l.bruit!.distanceKm!)})`);
  return {
    ...base,
    valeur: signalees.length ? `${signalees.length} arrondissement${signalees.length > 1 ? "s" : ""} sur ${ls.length}` : "Aucun arrondissement signalé",
    signal: signalees.length > 0,
    grain: "depuis le centre de chaque arrondissement",
    paragraphes: [
      signalees.length
        ? `Depuis le centre de ${signalees.length} arrondissement${signalees.length > 1 ? "s" : ""} sur ${ls.length}, une grande infrastructure passe à une distance que futur•e signale : ${listeFr(detail)}.`
        : "Depuis le centre d'aucun arrondissement, une autoroute, une voie ferrée ou un aéroport ne passe à une distance que futur•e signale.",
      `Distances retenues : ${distanceEnPhrase(BRUIT_MAX_KM.auto)} pour une autoroute ou une voie rapide, ${distanceEnPhrase(BRUIT_MAX_KM.rail)} pour une voie ferrée, ${distanceEnPhrase(BRUIT_MAX_KM.aero)} pour un aéroport.`,
      ...aeroLogement,
    ],
  };
}

// ── Le radon ──────────────────────────────────────────────────────────────────────────────────

const LIMITE_RADON =
  "Ce classement décrit le sous-sol, pas un logement. Deux logements voisins peuvent présenter des situations très différentes selon leur construction, leur contact avec le sol et leur ventilation : seule une mesure à l'intérieur établit la concentration réelle.";
const SENS_CLASSE: Record<RadonClasse, string> = {
  "1": "catégorie 1 sur 3, le potentiel le plus faible",
  "2": "catégorie 2 sur 3 : un potentiel faible, mais des facteurs géologiques particuliers peuvent faciliter la remontée du radon vers les bâtiments",
  "3": "catégorie 3 sur 3, un potentiel plus important",
};

function ligneRadon(ls: LectureLocale[]): LigneSante {
  const base = { cle: "radon" as const, cible: SANTE_CIBLES.radon, libelle: SANTE_LIBELLES.radon, limite: LIMITE_RADON };
  const intro = "Le radon est un gaz radioactif naturel qui provient du sol et peut s'accumuler dans les bâtiments.";
  const lues = ls.filter((l) => l.radon != null);
  if (lues.length === 0) {
    return { ...base, valeur: "Non lu", signal: false, grain: "commune", paragraphes: [intro, "Le classement de la commune n'a pas pu être lu lors de cette consultation. Rien n'en est déduit."], geste: null };
  }
  const signal = lues.some((l) => l.radon === RADON_CLASSE_SIGNALEE);
  const geste = signal
    ? "Mesurez le radon dans le logement : un dosimètre posé deux mois en hiver, dans une pièce de vie, suffit."
    : "Une mesure dans le logement reste le seul moyen de connaître sa concentration.";
  if (ls.length === 1) {
    const c = lues[0]!.radon!;
    return {
      ...base, valeur: `Catégorie ${c} sur 3`, signal, geste,
      grain: `classement réglementaire ${ls[0]!.estArrondissement ? "de l'arrondissement" : "de la commune"}`,
      paragraphes: [intro, `Le sous-sol ${duLieu(ls[0]!)} est classé en ${SENS_CLASSE[c]}.`],
    };
  }
  const parClasse = (["3", "2", "1"] as RadonClasse[]).map((c) => ({ c, ar: lues.filter((l) => l.radon === c).map((l) => l.libelle) })).filter((g) => g.ar.length);
  const valeur = parClasse.length === 1 ? `Catégorie ${parClasse[0]!.c} sur 3` : `Catégories ${parClasse.map((g) => g.c).sort().join(" et ")} sur 3`;
  return {
    ...base, valeur, signal, geste, grain: "classement réglementaire de chaque arrondissement",
    paragraphes: [
      intro,
      parClasse.length === 1
        ? `Le sous-sol de ${lues.length === ls.length ? "tous les arrondissements" : listeFr(parClasse[0]!.ar)} est classé en ${SENS_CLASSE[parClasse[0]!.c]}.`
        : parClasse.map((g) => `${cap(listeFr(g.ar))} : ${SENS_CLASSE[g.c]}.`).join(" "),
      ...(lues.length < ls.length ? [`Le classement de ${ls.length - lues.length} arrondissement${ls.length - lues.length > 1 ? "s" : ""} n'a pas pu être lu.`] : []),
    ],
  };
}

// ── La carte ──────────────────────────────────────────────────────────────────────────────────

export function lireSanteEnvironnementale(e: EntreeSante): CarteSante {
  const lignes = [
    ligneAir(e.lectures),
    ligneIndustrie(e.lectures, e.sevesoExtraitLe, e.adresseConnue),
    ligneBruit(e.lectures, e.adresseConnue),
    ligneRadon(e.lectures),
  ];
  // La face : le premier signal, dans l'ordre de gravité réglementaire ; sans signal, l'air de fond, en chiffres.
  const ordre: CleLigne[] = ["industrie", "radon", "air", "bruit"];
  const premier = ordre.map((k) => lignes.find((l) => l.cle === k)!).find((l) => l.signal);
  const air = lignes[0]!;
  const face = premier
    ? { valeur: premier.cle === "radon" ? `Radon : ${premier.valeur.toLowerCase()}` : premier.valeur, sous: `${premier.libelle} · à vérifier` }
    : { valeur: air.valeur, sous: "Air de fond, industrie, bruit, radon" };
  const manquante = e.lectures.length === 0
    || lignes.every((l) => /^Non (lu|publié)$|non lus$/.test(l.valeur));
  return {
    face,
    lignes,
    manquante,
    note: `Lecture faite le ${dateFr(e.luLe)}, à côté de votre dossier : elle ne modifie aucun constat déjà produit. Chaque ligne a son grain : la commune ou son centre, jamais un logement.`,
    sources: [
      AIR_SOURCE,
      `Sites Seveso : ${e.sevesoExtraitLe ? `installations classées, Géorisques (extraction du ${dateFr(e.sevesoExtraitLe)})` : "installations classées, Géorisques"}. Calcul d'exposition industrielle : sites Seveso, IED et soumis à autorisation, pondérés par leur gravité et leur proximité dans un rayon de ${SEVESO_RAYON_KM} km.`,
      "Grandes infrastructures de transport : OpenStreetMap (autoroutes et voies rapides, voies ferrées principales, aéroports commerciaux).",
      "Potentiel radon : classement réglementaire des communes (arrêté du 27 juin 2018), via Géorisques.",
    ].join(" "),
  };
}
