"use client";

import { useEffect, useState } from "react";
import { evidenceAnchorId, type EvidenceTargetKey } from "@/lib/decision/evidence-targets";
import type { CatnatInondation } from "@/lib/decision/catnat-evidence";
import { arriveeDepuisPastille, faceMemoireCatastrophes } from "@/lib/catnat-memoire";
import { registerForCard, type RegisterKey } from "@/lib/decision/evidence-registers";
import { useHorizon, HORIZON_META, type HorizonKey } from "@/hooks/useHorizon";
import { MetricDrawer, type CardDetail } from "@/components/MetricDrawer";
import { MetricTooltip } from "@/components/MetricTooltip";
import type { GeorisquesSummary, GasparCatnatSummary } from "@/lib/georisques";
import type { EaufranceSummary } from "@/lib/eaufrance";
import { lireEcoulement } from "@/lib/eaufrance-ecoulement";
import type { VigieauSummary, DroughtLevel } from "@/lib/vigieau";
import { libelleRestrictions } from "@/lib/restrictions-eau";
import type { LittoralSummary, LittoralFacade } from "@/lib/littoral";
import type { DemographieCardData, CouvertCardData } from "@/lib/territory-identity";
import type { Era5Trend } from "@/lib/era5-trend";
import type { MemoireIncendies } from "@/lib/data/bdiff-incendies";
import { texteTerritoire } from "@/lib/incendies-observes";
import { LIEN_VERIFICATION, type TexteFibre } from "@/lib/fibre-texte";

// Façade maritime → libellé (le composant est client : on duplique le libellé
// plutôt que d'importer une valeur depuis littoral.ts, server-only).
const FACADE_LABEL: Record<LittoralFacade, string> = {
  manche: "façade Manche",
  atlantique: "façade atlantique",
  bretagne: "littoral breton",
  mediterranee: "façade méditerranéenne",
  outre_mer: "littoral ultramarin",
};

// Libellé FR d'un niveau VigiEau. Dupliqué ici (et non importé depuis lib/vigieau)
// car ce composant est client et vigieau.ts est server-only.
function levelLabel(level: DroughtLevel | "pas_de_restrictions" | null | undefined): string {
  switch (level) {
    case "crise": return "Crise";
    case "alerte_renforcee": return "Alerte renforcée";
    case "alerte": return "Alerte";
    case "vigilance": return "Vigilance";
    default: return "Aucune restriction";
  }
}

// ─── Types ────────────────────────────────────────────────────────────────────

type GwlScenarios = Record<string, { h: string; v: Record<string, number> }>;
type Factor = {
  label: string;
  val: string;
  /** Ligne secondaire sous la valeur (précision discrète, ex. « Peu de biens disponibles »). */
  sub?: string;
  col: string;
  src: string;
  missing: boolean;
  /** Carte cliquable → drawer éditorial (la carte raconte une histoire). */
  detail?: CardDetail;
  /** Glose courte au survol/focus (seuil ou sens à expliquer, mais pas d'histoire). */
  tip?: string;
  /**
   * LE PHÉNOMÈNE que cette carte démontre, dans le vocabulaire partagé avec le moteur de décision. La
   * carte pose alors une ancre stable, et une preuve du dossier peut y renvoyer directement.
   *
   * Déclarée ICI, sur la carte qui la construit, et non dans une table `clé -> composant` tenue
   * ailleurs : une carte supprimée emporte sa déclaration, au lieu de laisser un lien qui vise le vide.
   * Une carte peut porter plusieurs phénomènes ; le tableau les liste tous.
   */
  targets?: EvidenceTargetKey[];
  /**
   * FUT-69 : ce que change l'arrivée par l'ancre de cette carte (lien « Preuve » du dossier). Le volet
   * s'ouvre, avec ces ajustements CONTEXTUELS (ligne mise en évidence, éventuel écart). Absent : la carte
   * ne s'ouvre pas seule. Le volet ordinaire n'en garde aucune trace.
   */
  arrivee?: Pick<CardDetail, "surligner" | "note" | "noteLabel">;
};

type Drought = NonNullable<EaufranceSummary["drought"]>;
type Territoire = {
  densite: number | null;
  incendies: number | null;
  taux_boisement: number | null;
};

type SharedProps = {
  communeName: string;
  scenarios: GwlScenarios | null;
  georisques: GeorisquesSummary | null;
  drought: Drought | null;
  /** FUT-165 : l'écoulement n'a pas pu être lu ; dit « indisponible », jamais « pas de cours d'eau à sec ». */
  droughtIndisponible?: boolean;
  territoire: Territoire | null;
  vigieau: VigieauSummary | null;
  catnat?: GasparCatnatSummary | null;
  /**
   * LE COMPTE QUE LA PREUVE DU DOSSIER ANNONCE, dans son objet partagé (`catnat-evidence`). Distinct
   * de `catnat` ci-dessus, qui est le relevé DIRECT tous risques : ce sont deux périmètres et deux
   * chemins. La carte « Mémoire des catastrophes » affiche les deux, en disant lequel est lequel,
   * pour que le lecteur arrivé par la pastille retrouve SON chiffre sans ouvrir de volet.
   */
  catnatInondation?: CatnatInondation | null;
  /**
   * LE COMPTE DE L'INDEX COURANT, quand il DIFFÈRE de celui figé dans l'artefact. `null` le reste du
   * temps. La carte l'annonce comme une mise à jour : taire un chiffre qui a changé depuis l'achat
   * serait le défaut symétrique de celui qu'on vient de corriger.
   */
  catnatMisAJour?: CatnatInondation | null;
  /** FUT-69 : « Paris » pour un arrondissement, dont GASPAR ne publie que la ville. `null` ailleurs. */
  catnatVille?: string | null;
  littoral?: LittoralSummary | null;
  // Bloc 4 : trajectoire de population + couvert naturel + saisonnalité (données riches).
  demographie?: DemographieCardData | null;
  couvertNaturel?: CouvertCardData | null;
  saisonnalitePct?: number | null;
  // P0 : système humain (ADEME, échelle commune).
  logementVacancePct?: number | null;
  eloignementServicesPct?: number | null;
  // Tendance observée ERA5-Land (Copernicus) : preuve « le passé valide la
  // projection » dans le drawer Températures. Le passé ne porte pas la face
  // avant (ce serait saboter le moat projection), il sert de preuve.
  era5?: Era5Trend | null;
  // FUT-147 : la mémoire des incendies enregistrés (BDIFF), lue HORS du snapshot Territoire : elle n'entre
  // pas dans la synthèse rédigée, donc pas dans l'empreinte qui valide son cache (arbitrage C6 du 28/10/2026).
  incendies?: MemoireIncendies | null;
  /**
   * FUT-148 : la part des locaux raccordables à la fibre (Arcep), déjà rédigée par `texteFibre` côté
   * serveur. Absente (`undefined`) = la page ne la fournit pas, aucune carte. `pourLeProjet` : le lecteur
   * a parlé de connexion ou de télétravail ; la carte passe en tête du groupe « Le territoire ».
   */
  fibre?: { texte: TexteFibre; pourLeProjet: boolean };
  // FUT-116 : plus d'archétype (`climatType`). Il choisissait le récit des volets climat sur un
  // classement administratif (Littoral, Montagne…), sans rapport avec la donnée affichée.
};

// ─── Thèmes de lecture ────────────────────────────────────────────────────────
// Code couleur stable et lisible : vert = le territoire (ce qu'il est, ce qui le
// transforme), orange = le climat, bleu = les risques recensés. Les cartes sont
// regroupées et titrées par thème : le décor d'abord, l'aléa ensuite.
type ThemeKey = "territoire" | "climat" | "risque";
const THEME: Record<ThemeKey, { label: string; col: string }> = {
  territoire: { label: "Le territoire", col: "var(--green)" },
  climat: { label: "Le climat", col: "var(--orange)" },
  risque: { label: "Les risques", col: "var(--blue)" },
};
const THEME_ORDER: ThemeKey[] = ["territoire", "climat", "risque"];
const THEME_OF: Record<string, ThemeKey> = {
  "Trajectoire de population": "territoire",
  "Logements inoccupés": "territoire",
  "Accès aux services": "territoire",
  "Résidences secondaires": "territoire",
  "Espaces naturels": "territoire",
  "Taux de boisement": "territoire",
  "Fibre optique": "territoire",
  "Températures moyennes": "climat",
  "Chaleurs estivales": "climat",
  "Nuits tropicales": "climat",
  "Sécheresse des sols": "climat",
  "Jours de pluie intense": "climat",
  "Inondation fluviale": "risque",
  "Submersion marine": "risque",
  "Conditions favorables au feu": "risque",
  "Mémoire des catastrophes": "risque",
  "Érosion du littoral": "risque",
};
function themeOf(label: string): ThemeKey {
  return THEME_OF[label] ?? "territoire";
}
// Ordre de lecture au sein de chaque thème (le décor avant l'aléa, le légible avant le pointu).
const CARD_ORDER: string[] = [
  "Trajectoire de population", "Logements inoccupés", "Accès aux services", "Espaces naturels", "Taux de boisement", "Résidences secondaires", "Fibre optique",
  // Climat alterné mouvement/niveau pour le rythme (évite un mur de « +X »).
  "Températures moyennes", "Sécheresse des sols", "Chaleurs estivales", "Nuits tropicales", "Jours de pluie intense",
  "Mémoire des catastrophes", "Inondation fluviale", "Submersion marine", "Conditions favorables au feu", "Érosion du littoral",
];
function cardRank(label: string): number {
  const i = CARD_ORDER.indexOf(label);
  return i === -1 ? 999 : i;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function r(v: number | undefined | null) {
  return v != null ? Math.round(v) : null;
}

// Nombre français à une décimale (virgule), sans zéro inutile. Ex : 4 -> "4", 0.68 -> "0,7".
function frFloat(n: number): string {
  return (Math.round(n * 10) / 10).toString().replace(".", ",");
}

function cap(s: string): string {
  return s.length > 0 ? s[0].toUpperCase() + s.slice(1) : s;
}

function signed(n: number): string {
  return `${n >= 0 ? "+" : ""}${frFloat(n)}`;
}

// Entier signé pour les deltas en jours/nuits (ex : 11,3 -> « +11 »).
function signedInt(n: number): string {
  return `${n >= 0 ? "+" : ""}${Math.round(n)}`;
}

// ─── Briques réutilisables du module Territoire (gabarit cartes climat) ───────
// Doctrine : Face = mouvement projeté · Drawer = référence → trajectoire →
// interprétation territoriale. La face et le drawer doivent parler du MÊME
// mouvement, donc le drawer part de la même référence que la face.

// Référence reconstruite (projeté − anomalie) : DRIAS n'expose pas de colonne
// dédiée, mais l'anomalie par horizon la restitue, et elle est stable d'un
// horizon à l'autre (même période de référence). Médiane pour lisser le bruit
// de médiane-des-modèles. Renvoie null si l'indicateur n'a pas d'anomalie (la
// carte sait alors retomber sur l'ancien mode).
function reconstructReference(
  scenarios: GwlScenarios | null,
  absKey: string,
  anomKey: string,
): number | null {
  const refs = (["gwl15", "gwl20", "gwl30"] as HorizonKey[])
    .map((k) => {
      const p = scenarios?.[k]?.v?.[absKey];
      const a = scenarios?.[k]?.v?.[anomKey];
      return p != null && a != null ? p - a : null;
    })
    .filter((x): x is number => x != null)
    .sort((a, b) => a - b);
  return refs.length ? refs[Math.floor((refs.length - 1) / 2)] : null;
}

// Trajectoire du drawer : ligne de référence (départ) + un point par horizon.
// `format` décide l'unité/arrondi (°C en frFloat, jours en entier) ; `refApprox`
// préfixe « ≈ » sur la référence reconstruite ; `withBars` ajoute les barres.
// Les barres sont normalisées sur l'horizon CHOISI (selectedHorizon) : c'est lui
// le 100 %, et les horizons au-delà sont grisés (du contexte, pas le focus) —
// sinon 2100 écrase visuellement l'horizon que l'utilisateur a sélectionné.
function trajectoryBreakdown(
  scenarios: GwlScenarios | null,
  absKey: string,
  opts: {
    ref: number | null;
    format: (n: number) => string;
    refApprox?: boolean;
    withBars?: boolean;
    refLabel?: string;
    selectedHorizon?: HorizonKey;
  },
): { label: string; value: string; bar?: number; muted?: boolean }[] {
  const order: HorizonKey[] = ["gwl15", "gwl20", "gwl30"];
  const rows = order
    .map((k) => ({ k, v: scenarios?.[k]?.v?.[absKey] }))
    .filter((x): x is { k: HorizonKey; v: number } => x.v != null);
  const selIdx = opts.selectedHorizon ? order.indexOf(opts.selectedHorizon) : -1;
  const selVal = opts.selectedHorizon ? scenarios?.[opts.selectedHorizon]?.v?.[absKey] : null;
  // Base de normalisation = valeur de l'horizon choisi (à défaut, le max).
  const base = selVal != null && selVal > 0 ? selVal : Math.max(opts.ref ?? 0, ...rows.map((x) => x.v), 1);
  const out: { label: string; value: string; bar?: number; muted?: boolean }[] = [];
  if (opts.ref != null) {
    out.push({
      label: opts.refLabel ?? "Fin du XXe siècle",
      value: `${opts.refApprox ? "≈ " : ""}${opts.format(opts.ref)}`,
      ...(opts.withBars ? { bar: Math.min(1, opts.ref / base) } : {}),
    });
  }
  for (const x of rows) {
    const beyond = selIdx >= 0 && order.indexOf(x.k) > selIdx;
    out.push({
      label: `Horizon ${HORIZON_META[x.k].year}`,
      value: opts.format(x.v),
      ...(opts.withBars ? { bar: Math.min(1, x.v / base), muted: beyond } : {}),
    });
  }
  return out;
}

// Ce que dit un compte annuel projeté (jours chauds, nuits tropicales) à un horizon : LA RÈGLE DE LA
// FACE, et le récit du volet la lit aussi (FUT-116). On RAISONNE SUR LA VALEUR BRUTE (non arrondie) :
// sous le plancher, la rareté ; sinon une hausse si l'écart arrondi atteint 2, un écart faible s'il
// reste sous 1,5 en valeur absolue. Sans colonne d'écart, l'évolution est inconnue, jamais « faible ».
type LectureCompte = "absent" | "rare" | "hausse_nette" | "baisse_nette" | "ecart_faible" | "ecart_inconnu";
function lireCompte(absRaw: number | null | undefined, deltaRaw: number | null | undefined): LectureCompte {
  if (absRaw == null) return "absent";
  if (absRaw < 1.5) return "rare";
  if (deltaRaw == null) return "ecart_inconnu";
  if (Math.round(deltaRaw) >= 2) return "hausse_nette";
  if (deltaRaw <= -1.5) return "baisse_nette";
  return "ecart_faible";
}

// Récit « Ce que cela raconte » des volets climat. FUT-116 : il ne dit QUE ce que le volet mesure,
// à l'horizon choisi, par rapport à la référence 1976-2005 (« fin du XXe siècle », comme la
// trajectoire). Il se choisissait sur l'archétype du lieu (Littoral, Montagne…) et affirmait des
// accélérations, des tendances continues, des durées d'épisodes et des causes qu'aucune colonne ne
// porte : DRIAS-TRACC donne trois paliers de réchauffement, pas une série, et l'archétype est un
// classement administratif, pas une donnée climatique (Latour-de-France, « montagne », compte ≈ 25
// jours chauds de référence). La convention est celle de la face (`lireCompte`) : les deux disent le
// même mouvement, sans seuil propre au récit.
type SignauxClimat = {
  year: string;
  /** chaleur / nuits : compte projeté à l'horizon et son écart à la référence, bruts. */
  abs?: number | null;
  delta?: number | null;
  /** temperature : écarts saisonniers à l'horizon. */
  summerAnom?: number | null;
  winterAnom?: number | null;
};
function buildClimatWhy(theme: "temperature" | "chaleur" | "nuits", communeName: string, signals: SignauxClimat): string {
  // Ton du Relevé (revue PR #70) : le chiffre donne la précision, le récit donne le sens. Le
  // conditionnel porte la projection ; la période de référence est nommée une fois.
  const { year } = signals;
  const REF = "la période 1976-2005";
  if (theme === "chaleur" || theme === "nuits") {
    const jours = theme === "chaleur";
    const objet = jours ? "jours au-dessus de 30 °C" : "nuits tropicales";
    const lecture = lireCompte(signals.abs, signals.delta);
    switch (lecture) {
      case "rare":
        return `À ${communeName}, les ${objet} resteraient très rares à l'horizon ${year} : moins de deux par an en moyenne dans les projections.`;
      case "ecart_faible":
        return `À ${communeName}, le nombre de ${objet} bougerait peu à l'horizon ${year} : l'écart avec ${REF} resterait inférieur à deux par an dans les projections.`;
      case "hausse_nette":
      case "baisse_nette": {
        const ecart = Math.round(Math.abs(signals.delta!));
        const sens = lecture === "hausse_nette" ? "de plus" : "de moins";
        // LA LIMITE DU COMPTE : un total annuel ne dit pas si les journées (ou les nuits) se suivent.
        const limite = jours
          ? "On ne sait toutefois pas si ces journées seraient isolées ou concentrées dans plusieurs épisodes."
          : "On ne sait toutefois pas si ces nuits seraient isolées ou successives.";
        const compte = jours ? `${ecart} jours ${sens} par an au-dessus de 30 °C` : `${ecart} nuits tropicales ${sens} par an`;
        return `À ${communeName}, les projections indiquent environ ${compte} à l'horizon ${year}, par rapport à ${REF}. ${limite}`;
      }
      case "ecart_inconnu":
        return `À ${communeName}, les projections donnent environ ${Math.round(signals.abs!)} ${objet} par an à l'horizon ${year}. Faute d'écart publié avec ${REF}, on ne peut pas dire s'il y en aurait plus ou moins qu'avant.`;
      case "absent":
        return `À ${communeName}, la projection n'est pas disponible à l'horizon ${year}.`;
    }
  }

  // theme === "temperature" : le réchauffement ne se dit que si les deux écarts (ou celui de l'été,
  // seul publié) sont positifs ; la nuance été/hiver n'est ajoutée que si l'écart est net (>0,3 °C),
  // pour ne jamais affirmer une généralité fausse (ex. à la montagne l'été se réchauffe plus vite).
  const { summerAnom, winterAnom } = signals;
  let core = `À ${communeName}, la trajectoire ci-dessus montre l'été moyen projeté à chaque horizon.`;
  if (summerAnom != null && summerAnom > 0 && winterAnom != null && winterAnom > 0) {
    core = `À ${communeName}, les projections indiquent un été et un hiver plus chauds à l'horizon ${year} que sur ${REF}.`;
  } else if (summerAnom != null && summerAnom > 0 && winterAnom == null) {
    core = `À ${communeName}, les projections indiquent un été plus chaud à l'horizon ${year} que sur ${REF}.`;
  }
  let seasonClause = "";
  if (summerAnom != null && winterAnom != null && summerAnom > 0 && winterAnom > 0) {
    if (winterAnom - summerAnom > 0.3) seasonClause = " Ici, l'hiver se réchaufferait plus vite que l'été.";
    else if (summerAnom - winterAnom > 0.3) seasonClause = " Ici, l'été se réchaufferait plus vite que l'hiver.";
  }
  return core + seasonClause;
}

// Note « Observé » du volet Températures : l'écart de température moyenne annuelle entre la norme
// 1961-1990 et les dix dernières années complètes de la réanalyse, signé tel quel.
function noteEra5(era5: Era5Trend): string {
  const fin = era5.data_through_year;
  return `Température moyenne annuelle ${fin - 9}-${fin} : ${signed(era5.delta_c)} °C par rapport à 1961-1990 (réanalyse Copernicus / ERA5-Land).`;
}

// Face avant « mouvement » d'un phénomène compté en jours/nuits, avec garde-fou :
// en climat froid (montagne) le phénomène est quasi absent (« +0 nuits » = effet
// bug). Sous le plancher on dit la rareté ; sinon mouvement si le delta est net,
// à défaut le niveau absolu. La règle vit dans `lireCompte`, partagée avec le récit.
function movementOrLevel(
  absRaw: number | null | undefined,
  deltaRaw: number | null | undefined,
  unit: string,
  rareLabel: string,
  year: string,
): string {
  const lecture = lireCompte(absRaw, deltaRaw);
  if (lecture === "absent") return "—";
  if (lecture === "rare") return rareLabel;
  if (lecture === "hausse_nette") return `${signedInt(deltaRaw!)} ${unit} d'ici ${year}`;
  return `${Math.round(absRaw!)} ${unit}/an en ${year}`;
}

export function buildFactors(
  scenarios: GwlScenarios | null,
  horizonKey: HorizonKey,
  georisques: GeorisquesSummary | null,
  territoire: Territoire | null,
  vigieau: VigieauSummary | null,
  drought: Drought | null,
  communeName: string,
  catnat?: GasparCatnatSummary | null,
  catnatInondation?: CatnatInondation | null,
  catnatMisAJour?: CatnatInondation | null,
  littoral?: LittoralSummary | null,
  demographie?: DemographieCardData | null,
  couvertNaturel?: CouvertCardData | null,
  saisonnalitePct?: number | null,
  logementVacancePct?: number | null,
  eloignementServicesPct?: number | null,
  era5?: Era5Trend | null,
  catnatVille?: string | null,
  incendies?: MemoireIncendies | null,
  droughtIndisponible?: boolean,
): Factor[] {
  const meta = HORIZON_META[horizonKey] ?? HORIZON_META.gwl20;
  const gwlData = scenarios?.[horizonKey]?.v ?? null;
  const heatDays = r(gwlData?.["NORTX35D_yr"]);
  const hotDays = r(gwlData?.["NORTX30D_yr"]);
  const tropicalNights = r(gwlData?.["NORTR_yr"]);
  const fireDays = r(gwlData?.["NORIFM40_yr"]);
  const drySoilDays = r(gwlData?.["NORSWI04_yr"]);
  // Anomalies (delta projeté) pour les faces avant « mouvement ».
  const summerAnom = gwlData?.["ATMm_seas_JJA"];
  const winterAnom = gwlData?.["ATMm_seas_DJF"];
  const hotDaysAnom = gwlData?.["ATX30D_yr"];
  const tropicalNightsAnom = gwlData?.["ATR_yr"];
  const heavyRainDays = r(gwlData?.["NORRRq99refD_yr"]);

  const boisementPct = territoire?.taux_boisement != null
    ? Math.round(territoire.taux_boisement)
    : null;

  // ── Carte « Conditions favorables au feu » → drawer en deux temps (FUT-147) ───────────
  // D'abord ce que projette la météo (la face), puis les incendies ENREGISTRÉS depuis 2006, dans une
  // section à part : deux grandeurs de nature différente, que le volet juxtapose sans les relier. Les
  // phrases de la seconde viennent toutes de `incendies-observes.ts` (quatre états, aucune ne rassure).
  const incendiesTexte = incendies ? texteTerritoire(incendies, communeName) : null;
  const fireDetail: CardDetail | undefined = fireDays != null || incendiesTexte
    ? {
        eyebrow: "L'indice forêt-météo",
        title: "Conditions favorables au feu",
        headline: fireDays != null
          ? `${fireDays} jour${fireDays > 1 ? "s" : ""} par an en ${meta.year}`
          : "Projection météo indisponible",
        subhead: "Combien de jours par an la météo favoriserait-elle les feux de forêt ?",
        whyLabel: "Ce que projette la météo",
        why: fireDays != null
          ? `Vers ${meta.year}, la météo réunirait ${fireDays} jour${fireDays > 1 ? "s" : ""} par an les conditions qui favorisent le départ et la propagation d'un feu de forêt. Cette projection décrit la météo seule : la végétation, l'entretien des abords et l'accès des secours n'y entrent pas.`
          : `Les projections météo ne sont pas disponibles pour ${communeName}.`,
        sections: incendiesTexte
          ? [{ label: incendiesTexte.titre, paragraphs: incendiesTexte.phrases, link: incendiesTexte.fiche ? { label: incendiesTexte.fiche.libelle, href: incendiesTexte.fiche.href } : null, more: incendiesTexte.details }]
          : undefined,
        sources: `Projection : DRIAS / Météo-France, jours où l'indice forêt-météo (IFM) dépasse 40, France ${meta.france}. Incendies enregistrés : Base de données des incendies de forêt en France (BDIFF), ministère de l'Agriculture et IGN, campagnes 2006 à 2025 (bdiff.agriculture.gouv.fr). Chaque feu y est rattaché à sa commune de départ, avec la surface totale qu'il a parcourue.`,
      }
    : undefined;

  // ── Carte « Jours chauds » → drawer : la chaleur qui s'installe ───────────────
  // On lit les trois horizons et on les rend comme une montée VISIBLE (barres),
  // pas comme un tableau. Le récit prime ; les sources passent en pied de drawer.
  // Référence reconstruite (jours > 30°C de la période de référence DRIAS) : la
  // face affiche « +X jours d'ici {horizon} » depuis CE point, le drawer doit
  // donc partir d'ici pour que les deux racontent le même mouvement.
  const hotRef = reconstructReference(scenarios, "NORTX30D_yr", "ATX30D_yr");
  const heatDetail: CardDetail | undefined = hotDays != null
    ? {
        // FUT-116 : surtitre et sous-titre DÉCRIVENT le compte, sans tendance : ils s'affichent aussi sous
        // « Restent rares » et sous un écart faible. Le mouvement, quand il existe, est dit par le récit.
        eyebrow: "Le seuil des 30 °C",
        title: "Chaleurs estivales",
        // Option A : référence → horizon sélectionné (colle exactement à la face).
        headline:
          hotRef != null
            ? `≈ ${Math.round(hotRef)} → ${hotDays} jours chauds par an d'ici ${meta.year}`
            : `${hotDays} jours chauds par an en ${meta.year}`,
        subhead: "Combien de jours par an dépasseraient 30 °C ?",
        accent: "var(--orange)",
        breakdownLabel: "Jours au-dessus de 30°C, par an",
        breakdown: trajectoryBreakdown(scenarios, "NORTX30D_yr", {
          ref: hotRef,
          format: (n) => `${Math.round(n)} jours`,
          refApprox: true,
          withBars: true,
          selectedHorizon: horizonKey,
        }),
        // Chaleur extrême = sous-signal qui QUALIFIE les jours chauds, pas une
        // carte à part : un simple fait daté suffit (pas de trajectoire, « 0 → 3 »
        // emballe du rien). Masqué à 0 (bruit sous une carte qui crie « +X »).
        // Règle de temporalité respectée : la valeur porte son horizon.
        facts:
          heatDays != null && heatDays >= 1
            ? [{ label: "Jours au-dessus de 35°C", value: `Environ ${heatDays} par an en ${meta.year}` }]
            : undefined,
        why: buildClimatWhy("chaleur", communeName, { year: meta.year, abs: gwlData?.["NORTX30D_yr"], delta: hotDaysAnom }),
        whyLabel: "Ce que cela raconte",
        askPrefill: `Comment la chaleur va-t-elle évoluer dans ma commune d'ici ${HORIZON_META.gwl30.year} ?`,
        sources: "Projections DRIAS-TRACC, Météo-France · jours de forte chaleur (Tmax > 30°C), période de référence 1976-2005",
      }
    : undefined;

  // ── Carte « Nuits tropicales » → drawer (gabarit) ────────────────────────────
  // Même mécanique que Chaleurs. On ne montre le drawer que si le phénomène est
  // réel (sinon, sur une commune froide à 0 nuit, une trajectoire « 0 → 0 » n'a
  // rien à raconter : on garde le tooltip et la face dit « Quasi inexistantes »).
  const tropicalNightsRef = reconstructReference(scenarios, "NORTR_yr", "ATR_yr");
  const tropicalNightsMax = Math.max(
    ...(["gwl15", "gwl20", "gwl30"] as HorizonKey[]).map((k) => scenarios?.[k]?.v?.["NORTR_yr"] ?? 0),
    0,
  );
  const showTropicalDetail = tropicalNights != null && tropicalNightsMax >= 3;
  const tropicalNightsDetail: CardDetail | undefined = showTropicalDetail
    ? {
        eyebrow: "Le seuil des 20 °C",
        title: "Nuits tropicales",
        headline:
          tropicalNightsRef != null
            ? `≈ ${Math.round(tropicalNightsRef)} → ${tropicalNights} nuits par an d'ici ${meta.year}`
            : `${tropicalNights} nuits par an en ${meta.year}`,
        // FUT-116 : une nuit tropicale peut se rafraîchir ; seule sa température minimale reste au-dessus de 20 °C.
        subhead: "Une nuit tropicale est une nuit où la température ne descend pas sous 20 °C.",
        accent: "var(--orange)",
        breakdownLabel: "Nuits au-dessus de 20°C, par an",
        breakdown: trajectoryBreakdown(scenarios, "NORTR_yr", {
          ref: tropicalNightsRef,
          format: (n) => `${Math.round(n)} nuits`,
          refApprox: true,
          withBars: true,
          selectedHorizon: horizonKey,
        }),
        why: buildClimatWhy("nuits", communeName, { year: meta.year, abs: gwlData?.["NORTR_yr"], delta: tropicalNightsAnom }),
        whyLabel: "Ce que cela raconte",
        askPrefill: "Les nuits tropicales vont-elles augmenter dans ma commune ?",
        sources: "Projections DRIAS-TRACC, Météo-France · nuits tropicales (Tmin > 20°C), période de référence 1976-2005",
      }
    : undefined;

  // ── Carte « Sécheresse des sols » → drawer : trois lectures, jamais confondues ──
  // Restriction du moment (VigiEau), relevé de terrain (ONDE), sols secs projetés (DRIAS) : trois
  // sources, trois natures. FUT-116 : aucune ne dit une tendance (le composant ne lit aucun écart de
  // sécheresse), et l'une ne se déduit pas des autres. Les noms de bases restent en pied de drawer.
  // FUT-163 (31/10/2026) : `isDry` ne dit plus que l'assec confirmé. L'écoulement interrompu (« Ecoulement
  // non visible ») reste une observation à dire, distincte : tout se lit sur l'état brut, jamais sur le booléen
  // enregistré dans le dossier (son sens a changé, l'état de la source non).
  const etatOnde = drought ? lireEcoulement(drought).etat : null;
  const ondeSignale = etatOnde === "assec" || etatOnde === "ecoulement_interrompu";
  const hasDroughtStory = drySoilDays != null || !!vigieau?.maxLevel || ondeSignale;
  // « Vigilance » est le niveau le plus bas de VigiEau : c'est de la
  // sensibilisation, pas une restriction d'usage. La nommer « restriction »
  // contredit le reste de la carte. On ne parle de restriction qu'à partir
  // d'« alerte ».
  // LA RÈGLE VIT DANS `lib/restrictions-eau.ts`, pure et testée : elle distingue trois états là
  // où ce composant n'en connaissait que deux, et une panne y annonçait « aucune restriction ».
  const restrictions = libelleRestrictions(vigieau);
  const todayValue = restrictions.texte;

  const droughtRows: { label: string; value: string }[] = [
    // « AUJOURD'HUI » AFFIRMAIT UN PRÉSENT SANS DIRE QUAND IL AVAIT ÉTÉ LU (05/08/2026). La valeur
    // vient d'un cache d'une heure, ce qui est parfaitement acceptable pour un arrêté préfectoral,
    // et qui ne se dit pas « en direct ». Le libellé porte donc la date de consultation : c'est le
    // registre des données VIVANTES, distinct de la date de génération du dossier affichée en tête.
    {
      label: vigieau?.consultedAt
        ? `État consulté le ${formatFrDate(vigieau.consultedAt)}`
        : "Aujourd'hui",
      value: todayValue,
    },
    // Terrain : uniquement si on a une vraie observation ONDE. Sans donnée, on
    // n'invente pas une réassurance (« pas de tension ») qui contredirait une
    // restriction en cours.
    ...(drought
      // FUT-116 : un relevé ponctuel porte sa date, comme la consultation VigiEau ci-dessus.
      // FUT-165 : la valeur est l'état que la source a relevé (assec, écoulement interrompu, visible,
      // observation impossible). « Pas de cours d'eau à sec » se disait quand l'état n'était jamais lu ; un
      // relevé daté sans état (dossiers enregistrés avant le correctif) est dit « non vérifiable ».
      ? [{
          label: drought.lastObservationDate ? `Relevé de terrain du ${formatFrDate(drought.lastObservationDate)}` : "Sur le terrain",
          value: `${lireEcoulement(drought).texte}${drought.riverName ? ` : ${drought.riverName}` : ""}`,
        }]
      : droughtIndisponible
        ? [{ label: "Relevé de terrain", value: "Source indisponible lors de la consultation" }]
        : []),
    ...(drySoilDays != null
      ? [{ label: `À l'horizon ${meta.year}`, value: `Environ ${drySoilDays} jours de sols secs par an` }]
      : []),
  ];
  const droughtFacts =
    vigieau?.maxLevel && vigieau.topZone
      ? [
          ...(vigieau.topZone.label ? [{ label: "Territoire de gestion de l'eau", value: vigieau.topZone.label }] : []),
          ...(vigieau.topZone.endDate ? [{ label: "Mesure en vigueur jusqu'au", value: formatFrDate(vigieau.topZone.endDate) }] : []),
        ]
      : undefined;
  const droughtDetail: CardDetail | undefined = hasDroughtStory
    ? {
        eyebrow: "L'eau et les sols",
        title: "Sécheresse des sols",
        headline:
          drySoilDays != null
            ? `Environ ${drySoilDays} jours de sols secs par an à l'horizon ${meta.year}`
            : restrictions.etat === "en_vigueur"
              // MÊME PHRASE QUE LA LIGNE DU FIL, et c'est le but : deux formulations d'un même
              // état obligeaient le lecteur à vérifier qu'elles disaient bien la même chose.
              ? restrictions.texte
              // FUT-116 : l'observation ne se dit QUE si ONDE l'a relevée. Elle était la branche par
              // défaut : toute ouverture du volet sans sols secs ni restriction l'aurait affirmée.
              : ondeSignale
                ? (etatOnde === "assec" ? "Cours d'eau à sec observé" : "Écoulement interrompu observé")
                : restrictions.texte,
        subhead: "Restrictions d'eau, cours d'eau et sols : trois lectures à ne pas confondre.",
        accent: "var(--orange)",
        breakdownLabel: "Le fil de la sécheresse",
        breakdown: droughtRows,
        facts: droughtFacts && droughtFacts.length > 0 ? droughtFacts : undefined,
        // FUT-116 : le récit affirmait « des cours d'eau qui faiblissent » (même sous « Pas de cours d'eau
        // à sec »), « la terre qui se rétracte » (aucune donnée ici) et « un changement de fond ». Il dit
        // désormais comment lire les trois lignes, et ce qu'elles ne permettent pas de conclure.
        why: "Une restriction est une décision préfectorale prise pour la période en cours. L'état d'un cours d'eau est un relevé ponctuel sur le terrain. Les jours de sols secs sont une moyenne annuelle projetée. L'une de ces lectures ne permet pas de déduire les autres.",
        askPrefill: "Ma commune est-elle exposée à la sécheresse ?",
        sources: "VigiEau (arrêtés préfectoraux) · réseau ONDE, Hub'Eau (cours d'eau) · projections DRIAS, Météo-France",
      }
    : undefined;

  const factors: Factor[] = [
    {
      // Registre A (mouvement) : face avant = delta projeté, garde-fou montagne
      // (delta quasi nul -> « Restent rares »). Le drawer absorbe la chaleur extrême.
      label: "Chaleurs estivales",
      targets: ["climate.extreme_heat"],
      val: movementOrLevel(gwlData?.["NORTX30D_yr"], hotDaysAnom, "jours chauds", "Restent rares", meta.year),
      col: "var(--orange)",
      src: `DRIAS / Météo-France · France ${meta.france}`,
      missing: hotDays == null,
      detail: heatDetail,
    },
    {
      // Registre A (mouvement) : « +9 nuits d'ici 2050 ». Drawer gabarit si le
      // phénomène est réel ; sinon tooltip (commune froide où il reste rare).
      label: "Nuits tropicales",
      targets: ["climate.tropical_nights"],
      val: movementOrLevel(gwlData?.["NORTR_yr"], tropicalNightsAnom, "nuits", "Quasi inexistantes", meta.year),
      col: "var(--orange)",
      src: "DRIAS / Météo-France · Tmin > 20°C",
      missing: tropicalNights == null,
      detail: tropicalNightsDetail,
      tip: showTropicalDetail
        ? undefined
        : "Une nuit tropicale est une nuit où la température ne descend pas sous 20 °C. La carte en donne le nombre moyen par an, selon les projections.",
    },
    {
      // Registre B (niveau) : le chiffre porte son échelle, on garde l'absolu. FUT-147 : la face reste la
      // projection météo ; le volet ajoute, dans une section DISTINCTE, les incendies enregistrés (passé).
      label: "Conditions favorables au feu",
      targets: ["risk.wildfire"],
      val: fireDays != null ? `${fireDays} jours/an en ${meta.year}` : "—",
      col: "var(--orange)",
      src: "DRIAS · IFM > 40 · indice météo, pas risque réel",
      missing: fireDays == null,
      detail: fireDetail,
      tip: "Indice météo (pas le risque réel à l'adresse) : plus ces journées se multiplient, plus le risque qu'un feu démarre et se propage augmente, surtout près des espaces naturels.",
    },
    {
      label: "Sécheresse des sols",
      val:
        drySoilDays != null
          ? `${drySoilDays} jours/an en ${meta.year}`
          : vigieau?.maxLevel
            ? levelLabel(vigieau.maxLevel)
            : ondeSignale
              ? (etatOnde === "assec" ? "Cours d'eau à sec" : "Écoulement interrompu")
              : "—",
      col: "var(--orange)",
      src: `DRIAS · indice SWI < 0,4 · France ${meta.france}`,
      missing: !hasDroughtStory,
      detail: droughtDetail,
    },
    {
      label: "Inondation fluviale",
      targets: ["risk.flooding"],
      val: georisques ? (georisques.flags.flood ? "Une partie du territoire est concernée" : "Aucun périmètre recensé") : "—",
      col: "var(--blue)",
      src: "Géorisques · échelle communale",
      // L'inondation est pertinente partout : « aucun périmètre » est un signal
      // POSITIF (non grisé), pas une donnée absente. Grisé seulement sans donnée.
      missing: !georisques,
      tip: "Savoir qu'une partie de la commune peut être atteinte par une crue aide à comprendre ce qui peut être touché. Détail à votre adresse dans le module Logement.",
    },
    // Submersion marine : aléa propre au littoral. On n'affiche la carte QUE si la
    // commune est concernée (sinon elle est simplement absente, pas grisée : une
    // « Submersion : non » n'a aucun sens à l'intérieur des terres).
    ...(georisques?.flags.marineSubmersion
      ? [{
          label: "Submersion marine",
          val: "Le littoral fait partie des zones surveillées",
          col: "var(--blue)",
          src: "Géorisques · échelle communale",
          missing: false,
          tip: "Sur le littoral, savoir si la mer peut atteindre la commune aide à comprendre ce qui est exposé aux tempêtes. Détail à votre adresse dans le module Logement.",
        }]
      : []),
    // Carte couvert naturel : enrichie (OSO + composition) si fournie, sinon
    // repli sur le seul taux de boisement ADEME.
    couvertNaturel
      ? {
          label: "Espaces naturels",
      targets: ["nature.green_spaces"],
          val: couvertNaturel.headlineLabel,
          col: "var(--green)",
          src: "OSO · ADEME · échelle communale",
          missing: false,
          detail: {
            eyebrow: "L'occupation des sols",
            title: "Espaces naturels",
            headline: `${couvertNaturel.brutPct} % d'espaces naturels`,
            // D4 (FUT-6) : le volet ne qualifie plus. Sa grille 75 / 50 / 25 était une TROISIÈME
            // lecture du même chiffre (après la face et la carte d'identité), et pouvait les
            // contredire. Il montre la mesure et sa définition ; la catégorie est celle de la face.
            subhead: `Forêts, prairies, landes et pelouses, roche et dunes, eau : ils couvrent ${couvertNaturel.brutPct} % de la commune. Les cultures n'en font pas partie.${
              couvertNaturel.radiusPct != null
                ? ` Dans un rayon de 15 km autour de la commune : ${couvertNaturel.radiusPct} %.`
                : ""
            }`,
            accent: "var(--green)",
            breakdownLabel: "Ce qui couvre le territoire",
            breakdown: couvertNaturel.composition.slice(0, 5).map((c) => ({
              label: c.label,
              value: `${c.pct} %`,
              bar: c.pct / 100,
            })),
            why: "La place laissée aux espaces naturels en dit long sur le territoire : ils rafraîchissent la commune l'été, retiennent l'eau lors des fortes pluies et abritent la vie. Là où le bâti domine, ces effets se font plus rares.",
            whyLabel: "Ce que cela raconte",
            askPrefill: "Quelle place les espaces naturels occupent-ils dans ma commune ?",
            sources: "OSO 2023 (CESBIO, couverture des sols) · ADEME (taux de boisement)",
          },
        }
      : {
          label: "Taux de boisement",
    targets: ["nature.forest_cover"],
          val: boisementPct != null ? `${boisementPct}%` : "—",
          col: "var(--green)",
          src: "ADEME · données communales",
          missing: boisementPct == null,
          tip: "Les arbres rafraîchissent la commune l'été et abritent la vie. Leur place en dit long sur le confort par fortes chaleurs et sur le quotidien qu'on y trouve.",
        },
  ];

  // Carte « Trajectoire de population » en tête de grille (le décor avant l'aléa).
  if (demographie) {
    const facts: { label: string; value: string }[] = [];
    if (demographie.annualPct != null) facts.push({ label: "Évolution annuelle", value: `${signed(demographie.annualPct)} %/an` });
    if (demographie.partNouveaux != null) facts.push({ label: "Nouveaux arrivants", value: `${frFloat(demographie.partNouveaux)} %` });
    factors.unshift({
      label: "Trajectoire de population",
      val: demographie.status,
      col: "var(--green)",
      src: "INSEE · recensement · échelle communale",
      missing: false,
      detail: {
        eyebrow: "La trajectoire du territoire",
        title: "Trajectoire de population",
        headline: demographie.totalPeriodPct != null ? `${signed(demographie.totalPeriodPct)} % depuis 2015` : demographie.status,
        subhead: demographie.recitPhrase ? `${cap(demographie.recitPhrase)}.` : undefined,
        accent: "var(--green)",
        facts: facts.length > 0 ? facts : undefined,
        why: "La trajectoire de population dit beaucoup d'un territoire : une commune qui gagne des habitants attire et se transforme, une commune qui en perd voit ses services et ses logements évoluer autrement. C'est une tendance de fond qui façonne durablement la commune.",
        whyLabel: "Ce que cela raconte",
        askPrefill: "Comment la population de ma commune évolue-t-elle ?",
        sources: "INSEE, recensement (évolution de la population 2015-2021)",
      },
    });
  }

  // Carte saisonnalité (résidences secondaires) — toujours présente, même faible,
  // pour une grille sans trou. Le regroupement par thème la place avec le territoire.
  const saiLevel =
    saisonnalitePct == null
      ? null
      : saisonnalitePct >= 40
        ? "Forte"
        : saisonnalitePct >= 20
          ? "Marquée"
          : saisonnalitePct >= 8
            ? "Modérée"
            : "Faible";
  factors.push({
    label: "Résidences secondaires",
    val: saiLevel ?? "—",
    col: "var(--green)",
    src: "INSEE · logement · échelle communale",
    missing: saisonnalitePct == null,
    detail:
      saisonnalitePct != null
        ? {
            eyebrow: "La saisonnalité du territoire",
            title: "Résidences secondaires",
            headline: `${Math.round(saisonnalitePct)} % du parc de logements`,
            subhead:
              saisonnalitePct >= 40
                ? `À ${communeName}, le tourisme est très présent : la population réelle gonfle l'été et s'allège fortement hors saison.`
                : saisonnalitePct >= 20
                  ? `À ${communeName}, la saisonnalité est marquée : le tourisme pèse sur le rythme de la commune.`
                  : saisonnalitePct >= 8
                    ? `À ${communeName}, la présence touristique reste modérée, sans bouleverser le quotidien.`
                    : `${communeName} est une commune de résidents permanents, peu marquée par le tourisme saisonnier.`,
            accent: "var(--green)",
            why: "Une part élevée de résidences secondaires signale une fréquentation touristique : la population réelle gonfle l'été et s'allège hors saison. Cela façonne les commerces, les services et le rythme de la commune au fil de l'année.",
            whyLabel: "Ce que cela raconte",
            askPrefill: "Ma commune est-elle marquée par le tourisme saisonnier ?",
            sources: "INSEE, recensement (base communale logement 2022)",
          }
        : undefined,
  });

  // ── Cartes climat P0 : été / hiver moyens + pluies (DRIAS, par horizon) ───────
  const seasonalTraj = (key: string) =>
    (["gwl15", "gwl20", "gwl30"] as HorizonKey[])
      .map((k) => ({ k, v: scenarios?.[k]?.v?.[key] }))
      .filter((x): x is { k: HorizonKey; v: number } => x.v != null);

  // ── Températures moyennes (fusion été + hiver, Registre A : mouvement) ─────────
  // Face avant = delta projeté des DEUX saisons. Drawer = trajectoire du niveau
  // (été par horizon) + hiver + PREUVE observée ERA5 (« le passé valide le futur »).
  const winter = gwlData?.["NORTMm_seas_DJF"];
  const summer = gwlData?.["NORTMm_seas_JJA"];
  const summerTraj = seasonalTraj("NORTMm_seas_JJA");

  // Référence été reconstruite via la brique partagée (médiane projeté − anomalie).
  const summerRef = reconstructReference(scenarios, "NORTMm_seas_JJA", "ATMm_seas_JJA");

  // Paire équilibrée été/hiver à l'horizon choisi : l'hiver ne doit pas paraître
  // secondaire face à la trajectoire d'été.
  const tempFacts: { label: string; value: string }[] = [
    ...(summer != null
      ? [{ label: `Été ${meta.year}`, value: `${frFloat(summer)} °C${summerAnom != null ? ` (${signed(summerAnom)})` : ""}` }]
      : []),
    ...(winter != null
      ? [{ label: `Hiver ${meta.year}`, value: `${frFloat(winter)} °C${winterAnom != null ? ` (${signed(winterAnom)})` : ""}` }]
      : []),
  ];

  // Trajectoire été = point de départ (référence) + horizons, pour lire la pente.
  // Même brique que Chaleurs ; ici en °C (frFloat), sans « ≈ » ni barres.
  const summerBreakdown = trajectoryBreakdown(scenarios, "NORTMm_seas_JJA", {
    ref: summerRef,
    format: (n) => `${frFloat(n)} °C`,
  });
  factors.push({
    label: "Températures moyennes",
    targets: ["climate.mean_temperature"],
    val:
      summerAnom != null && winterAnom != null
        ? `Été ${signed(summerAnom)} °C · hiver ${signed(winterAnom)} °C d'ici ${meta.year}`
        : summerAnom != null
          ? `Été ${signed(summerAnom)} °C d'ici ${meta.year}`
          : "—",
    col: "var(--orange)",
    src: `DRIAS / Météo-France · moyennes saisonnières · France ${meta.france}`,
    missing: summerAnom == null && winterAnom == null,
    detail:
      summerTraj.length >= 2
        ? {
            eyebrow: "Trajectoire climatique",
            title: "Températures moyennes",
            headline:
              summerAnom != null && winterAnom != null
                ? `Été ${signed(summerAnom)} °C d'ici ${meta.year}\nHiver ${signed(winterAnom)} °C`
                : `${frFloat(summerTraj[summerTraj.length - 1].v)} °C l'été à l'horizon ${HORIZON_META.gwl30.year}`,
            subhead: "Comment les températures d'été et d'hiver pourraient évoluer.",
            accent: "var(--orange)",
            breakdownLabel: "Été moyen, par horizon",
            breakdown: summerBreakdown,
            facts: tempFacts.length > 0 ? tempFacts : undefined,
            why: buildClimatWhy("temperature", communeName, { year: meta.year, summerAnom, winterAnom }),
            whyLabel: "Ce que cela raconte",
            ...(era5
              ? {
                  // FUT-116 : la mesure observée et ses deux périodes, sans conclure : un écart observé ne
                  // valide pas une projection, et son signe n'est pas garanti.
                  noteLabel: "Observé",
                  note: noteEra5(era5),
                }
              : {}),
            askPrefill: "Comment les températures évoluent-elles dans ma commune ?",
            sources: era5
              ? "Projections DRIAS-TRACC, Météo-France (moyennes saisonnières, période de référence 1976-2005) · réanalyse ERA5-Land, Copernicus (écart observé)"
              : "Projections DRIAS-TRACC, Météo-France · moyennes saisonnières (juin-août, décembre-février), période de référence 1976-2005",
          }
        : undefined,
  });

  // ── Jours de pluie intense (Registre B : NIVEAU absolu, pas de trajectoire) ───
  // Signal faible et non monotone (il DÉCROÎT à Nice) : une trajectoire par horizon
  // emballerait du bruit, voire des barres qui baissent. On reste donc sur le niveau
  // daté + qualifieurs datés (cumul, intensité), sans tableau de pente.
  const heavyRain = gwlData?.["NORRRq99_yr"];
  // Pluies = caractéristique du climat local, pas une trajectoire honnête (signal
  // non monotone, décroît en Méditerranée). UNE histoire : la concentration. On
  // garde la fréquence (lisible) + l'intensité 24h ; le cumul annuel descend en
  // méthodologie — le récit dit lui-même qu'il « dit peu de chose ».
  const rainFacts: { label: string; value: string }[] =
    heavyRain != null ? [{ label: "Pluie intense en 24h", value: `Jusqu'à ${Math.round(heavyRain)} mm en une journée` }] : [];
  factors.push({
    label: "Jours de pluie intense",
    targets: ["climate.heavy_rain"],
    val: heavyRainDays != null ? `${heavyRainDays} par an en ${meta.year}` : "—",
    col: "var(--orange)",
    src: "DRIAS / Météo-France · jours de pluie intense",
    missing: heavyRainDays == null,
    detail:
      heavyRainDays != null
        ? {
            eyebrow: "Quand la pluie se concentre",
            title: "Jours de pluie intense",
            headline: `Environ ${heavyRainDays} jours de pluie intense par an en ${meta.year}`,
            subhead: "Les épisodes de pluie les plus concentrés, souvent à l'origine des ruissellements et des inondations locales.",
            accent: "var(--orange)",
            facts: rainFacts.length > 0 ? rainFacts : undefined,
            why: "Le cumul de pluie sur l'année dit peu de chose. Ce qui compte, c'est l'intensité : quand la pluie tombe en peu d'heures, le ruissellement et le débordement deviennent possibles, même loin d'un cours d'eau. L'exposition précise d'une adresse relève du module Logement.",
            whyLabel: "Ce que cela raconte",
            askPrefill: "Les pluies intenses vont-elles s'aggraver dans ma commune ?",
            sources: "Projections DRIAS, Météo-France · jours de pluie intense (p99), cumul annuel, pluie journalière extrême",
          }
        : undefined,
  });

  // ── Carte « Logements inoccupés » (ADEME, échelle commune) ─────────────────────
  // D5 (FUT-6) : LE CHIFFRE, SANS CONCLUSION DE MARCHÉ. La face disait « Tension sur le logement ·
  // Peu de biens disponibles » sous 8 % et « Perte d'attractivité » au-delà de 13 % : deux inférences
  // tirées d'un seul indicateur, sur des seuils jamais documentés. Une lecture du marché reviendra
  // quand elle reposera sur des indicateurs dédiés (futur DerivedFact) ; en attendant, la carte dit
  // ce qui est mesuré.
  if (logementVacancePct != null) {
    const vac = Math.round(logementVacancePct);
    factors.push({
      label: "Logements inoccupés",
      val: `${vac} % du parc`,
      sub: "Logements sans occupant au recensement 2022",
      col: "var(--green)",
      src: "INSEE / ADEME · échelle communale",
      missing: false,
      tip: "Part du parc sans occupant au recensement.",
    });
  }
  // LA CARTE « ACCÈS AUX SERVICES » A ÉTÉ RETIRÉE LE 04/08/2026, et le champ avec elle.
  //
  // Elle affirmait « X % des habitants vivent à plus de 20 min des SERVICES ESSENTIELS ». La
  // recherche de source du 04/08 a établi que l'ADEME ne documente pas ce champ, et que le seul
  // indicateur homonyme du catalogue de l'ANCT porte sur les services DE SANTÉ de proximité. Le
  // faisceau est fort (les ordres de grandeur concordent), la preuve manque, et l'écran, lui,
  // affirmait sans réserve. Dire « services essentiels » d'une donnée qui compte peut-être des
  // médecins, c'est affirmer au-delà de la preuve.
  //
  // Le critère du comparateur qui reposait sur ce même champ a été remplacé par le niveau de
  // centralité de l'ANCT (`centralite-services.ts`), qui est identifié, daté et complet. Cette
  // carte reviendra quand ce niveau sera câblé jusqu'ici : il vit dans l'index du comparateur, pas
  // dans le jeu ADEME que cette page lit. En attendant, une carte absente vaut mieux qu'une carte
  // qui nomme mal ce qu'elle mesure.
  void eloignementServicesPct;

  // Carte CatNat (GASPAR) — ajoutée seulement quand l'appelant fournit la donnée
  // (QuartierAside). Histoire vécue : nombre de reconnaissances depuis l'origine.
  //
  // FUT-69 : LA FACE NE MET PLUS L'INONDATION EN AVANT. Elle disait « Tous risques · N » puis « Dont N
  // liées aux inondations » dès que l'index portait ce compte, même là où la sécheresse dominait. Le
  // texte vit dans `catnat-memoire.ts` (pur, testé) : le total, puis la répartition selon la règle
  // partagée (`resumeCatnat`), neutre sans dominante. Le volet non plus ne privilégie aucun aléa :
  // l'inondation y est une ligne de la répartition. Arriver par la pastille inondation du dossier ouvre
  // le volet et met cette ligne en évidence, pour cette entrée seulement (`arrivee`).
  if (catnat !== undefined) {
    const hasCatnat = !!catnat && catnat.total > 0;
    const face = faceMemoireCatastrophes({
      catnat: catnat ?? null, catnatInondation: catnatInondation ?? null,
      catnatMisAJour: catnatMisAJour ?? null, ville: catnatVille ?? null,
    });
    const detail: CardDetail | undefined = hasCatnat
      ? {
          eyebrow: "Histoire du territoire",
          title: "Mémoire des catastrophes",
          headline: face.val,
          subhead: face.sub,
          accent: "var(--blue)",
          // La ventilation réelle, tous aléas, triée par fréquence : c'est elle qui dit ce qui domine.
          breakdown: catnat!.byRisk.map((rk) => ({
            label: rk.label,
            value: String(rk.count),
            bar: catnat!.total > 0 ? rk.count / catnat!.total : 0,
          })),
          timeline:
            catnat!.byDecade.length > 0
              ? catnat!.byDecade.map((dc) => ({ label: `${String(dc.decade).slice(2)}s`, count: dc.count }))
              : undefined,
          timelineLabel: "Au fil des décennies",
          facts: [
            ...(catnat!.firstYear ? [{ label: "Première reconnaissance", value: String(catnat!.firstYear) }] : []),
            ...(catnat!.lastYear ? [{ label: "Dernière reconnaissance", value: String(catnat!.lastYear) }] : []),
          ],
          why: "Une reconnaissance de catastrophe naturelle est un acte administratif, qui ouvre l'indemnisation après un épisode. Ce compte dit quels aléas ont été reconnus dans la commune depuis 1982 ; il ne mesure pas une probabilité, et il ne dit pas qu'un logement précis a été sinistré.",
          whyLabel: "Ce que ce compte dit",
          askPrefill: "Que racontent les arrêtés de catastrophe naturelle de ma commune ?",
          sources: "Géorisques · base GASPAR (reconnaissances de catastrophe naturelle)",
        }
      : undefined;
    factors.push({
      label: "Mémoire des catastrophes",
      // La preuve du dossier qui compte les arrêtés vise CETTE carte, et non celle du zonage
      // inondation, qui ne dit rien des arrêtés (cf. materiality-rules, règle inondation).
      targets: ["risk.catnat"],
      // Seule la pastille inondation du dossier vise cette carte (`materiality-rules`) : y arriver,
      // c'est arriver par l'inondation. Le volet s'ouvre sur sa ligne, mise en évidence.
      arrivee: arriveeDepuisPastille(catnat ?? null, catnatInondation ?? null) ?? undefined,
      val: face.val,
      sub: face.sub,
      col: "var(--blue)",
      src: "Géorisques · GASPAR · reconnaissances CatNat",
      missing: face.missing,
      detail,
    });
  }

  // Carte Littoral (recul du trait de côte) — Niveau 4 de la doctrine littoral :
  // c'est ICI que vit l'intensité (le rapport démontre), pas sur les cartes du
  // comparateur. Affichée si la commune a une donnée d'érosion (Cerema, couverture
  // nationale) OU est inscrite loi Climat et Résilience. Le drawer mène par les
  // OBSERVATIONS (ampleur, recul max, période) puis les IMPLICATIONS projet de vie.
  if (littoral && (littoral.erosion || littoral.traitDeCote.concernee)) {
    const e = littoral.erosion;
    const CLASSE_LABEL: Record<string, string> = {
      faible: "Érosion faible",
      "modéré": "Érosion modérée",
      "marqué": "Érosion marquée",
      "très marqué": "Érosion très marquée",
    };
    const CLASSE_FEM: Record<string, string> = {
      faible: "faible",
      "modéré": "modérée",
      "marqué": "marquée",
      "très marqué": "très marquée",
    };
    // La classe Cerema décrit le RYTHME du recul, pas son étendue. Le % (pctRecul)
    // décrit l'étendue. Sans ce rappel, « Érosion faible » + « 54 % » se contredit
    // visuellement. On réconcilie : la côte recule largement MAIS lentement.
    const CLASSE_PACE: Record<string, string> = {
      faible: "mais à un rythme lent",
      "modéré": "à un rythme modéré",
      "marqué": "à un rythme déjà soutenu",
      "très marqué": "à un rythme rapide",
    };
    const fr1 = (n: number) => Math.abs(n).toLocaleString("fr-FR", { maximumFractionDigits: 1 });
    const decretDate = littoral.traitDeCote.decret?.debut
      ? formatFrDate(littoral.traitDeCote.decret.debut)
      : null;

    // Label de carte + headline du drawer
    let cardVal: string;
    let headline: string;
    if (e && e.amenage) {
      cardVal = "Littoral aménagé";
      headline = "Littoral fortement aménagé";
    } else if (e && e.classe) {
      cardVal = CLASSE_LABEL[e.classe];
      headline = CLASSE_LABEL[e.classe];
    } else {
      cardVal = "Exposée à l'érosion";
      headline = "Exposée à l'érosion du littoral";
    }

    // « Ce que montrent les observations » (seulement si donnée d'érosion)
    const obs: { label: string; value: string }[] = [];
    if (e) {
      // % d'ampleur seulement hors garde-fou (sur côte aménagée, trop peu de
      // segments valides pour un pourcentage honnête).
      if (e.pctRecul != null && !e.amenage)
        obs.push({ label: "Part du littoral qui recule", value: `${e.pctRecul} %` });
      if (e.reculMaxMpan != null && e.reculMaxMpan < 0)
        obs.push({ label: "Recul max observé", value: `jusqu'à ${fr1(e.reculMaxMpan)} m/an` });
      if (e.periode)
        obs.push({ label: "Période observée", value: `${e.periode[0]}–${e.periode[1]}` });
    }

    const facts = littoral.traitDeCote.concernee
      ? [
          { label: "Statut", value: "Inscrite (loi Climat et Résilience)" },
          ...(decretDate ? [{ label: "Depuis", value: decretDate }] : []),
        ]
      : undefined;

    const amenageStrong = !!e?.amenage && (e.classe === "marqué" || e.classe === "très marqué");
    const amenageNote = e?.amenage
      ? `Le littoral est fortement aménagé (digues, port) : l'érosion y est partiellement mesurable.${amenageStrong && e.classe ? ` Sur les rares secteurs mesurables, une érosion ${CLASSE_FEM[e.classe]} est observée.` : ""} `
      : "";
    // Récit PILOTÉ PAR LA CLASSE : l'intensité du texte suit l'intensité de la donnée
    // (sinon La Rochelle « faible » sonnerait comme un avertissement fort). Le cadre
    // assurantiel sort du récit (encart « À savoir » fixe, même ton pour tous).
    const CLASSE_NARRATIVE: Record<string, string> = {
      faible:
        "Les observations disponibles montrent que le littoral évolue localement, mais à un rythme faible. Cela ne signifie pas qu'un projet immobilier est aujourd'hui remis en question : pour la plupart des habitants, le recul du trait de côte restera un sujet lointain et très dépendant de la localisation précise du bien. Comme partout sur le littoral, il reste utile de comprendre ces dynamiques avant d'acheter ou de transmettre un bien.",
      "modéré":
        "Les observations montrent un recul mesurable sur certains secteurs du littoral. Cela ne remet pas en cause la vie quotidienne, mais peut devenir un élément à prendre en compte dans un projet immobilier de long terme, notamment pour la valeur future ou les possibilités d'aménagement.",
      "marqué":
        "Le recul observé est significatif sur une partie du littoral. Pour un projet immobilier, il devient pertinent de s'intéresser à la localisation exacte du bien, aux documents d'urbanisme et aux perspectives d'évolution du trait de côte sur plusieurs décennies.",
      "très marqué":
        "Le recul observé figure parmi les plus importants du littoral français. Pour un projet de vie ou d'investissement, la question ne se limite plus au cadre de vie : l'évolution future du littoral peut avoir des conséquences concrètes sur la valeur, la constructibilité et la transmission des biens situés dans les secteurs les plus exposés.",
    };
    const narrFallback =
      "Le littoral de la commune est concerné par le recul du trait de côte. Comme partout sur le littoral, il reste utile de comprendre ces dynamiques avant d'acheter ou de transmettre un bien.";
    const classNarrative = e?.classe ? CLASSE_NARRATIVE[e.classe] : null;

    const littoralDetail: CardDetail = {
      // FUT-33 : la façade vient de la liste officielle (loi Climat et Résilience) ; sans elle, aucune n'est devinée.
      eyebrow: littoral.facade ? `Littoral · ${FACADE_LABEL[littoral.facade]}` : "Littoral",
      title: "Érosion du littoral",
      headline,
      subhead:
        e && !e.amenage && e.pctRecul != null
          ? `La côte recule sur ${e.pctRecul} % du littoral communal, ${(e.classe && CLASSE_PACE[e.classe]) ?? "à un rythme mesuré"}.`
          : `${communeName} est exposée à l'érosion du littoral.`,
      accent: "var(--blue)",
      breakdownLabel: obs.length ? "Ce que montrent les observations" : undefined,
      breakdown: obs.length ? obs : undefined,
      facts,
      whyLabel: "Ce que cela implique pour un projet de vie",
      why: e
        ? `${amenageNote}Ce sont des observations passées, pas une prévision. ${classNarrative ?? narrFallback}`
        : narrFallback,
      note: "Contrairement à la submersion marine, le recul du trait de côte n'est pas couvert par le régime catastrophes naturelles, car il est considéré comme un phénomène prévisible.",
      askPrefill: "Qu'est-ce que l'érosion du littoral change pour ma commune ?",
      sources:
        "Cerema, indicateur national de l'érosion côtière (Géolittoral) · Liste des communes, loi Climat et Résilience (data.gouv.fr) · CCR, régime catastrophes naturelles",
    };

    factors.push({
      label: "Érosion du littoral",
      val: cardVal,
      col: "var(--blue)",
      src: e ? "Cerema · indicateur d'érosion côtière" : "Cerema · Loi Climat et Résilience",
      missing: false,
      detail: littoralDetail,
    });
  }

  return factors;
}

function buildParagraphs(
  communeName: string,
  gwlData: Record<string, number> | null | undefined,
  horizonKey: string,
  georisques: GeorisquesSummary | null,
  drought: Drought | null,
  vigieau: VigieauSummary | null,
): string[] {
  const meta = HORIZON_META[horizonKey as keyof typeof HORIZON_META] ?? HORIZON_META.gwl20;
  const heatDays = r(gwlData?.["NORTX35D_yr"]);
  const hotDays = r(gwlData?.["NORTX30D_yr"]);
  const tropicalNights = r(gwlData?.["NORTR_yr"]);
  const fireDays = r(gwlData?.["NORIFM40_yr"]);
  const drySoilDays = r(gwlData?.["NORSWI04_yr"]);

  const paragraphs: string[] = [];

  if (heatDays != null || hotDays != null) {
    let p = `À l'horizon ${meta.year}, ${communeName} atteindrait`;
    if (hotDays != null) p += ` ${hotDays} jour${hotDays > 1 ? "s" : ""} par an au-dessus de 30°C`;
    if (hotDays != null && heatDays != null) p += `, dont`;
    if (heatDays != null) p += ` ${heatDays} jour${heatDays > 1 ? "s" : ""} de chaleur extrême dépassant 35°C`;
    p += `.`;
    if (tropicalNights != null) {
      p += ` Les nuits ne rafraîchissent plus : ${tropicalNights} nuit${tropicalNights > 1 ? "s" : ""} par an resteraient au-dessus de 20°C.`;
    }
    p += " Ce n'est pas un basculement abstrait. Ce sont des étés qui deviennent plus lourds et plus difficiles à traverser.";
    paragraphs.push(p);
  } else if (!gwlData) {
    paragraphs.push(
      `Les projections climatiques pour ${communeName} ne sont pas encore disponibles dans notre base de données. Cette commune sera intégrée lors de la prochaine mise à jour.`,
    );
  }

  if (fireDays != null) {
    paragraphs.push(
      `Les projections indiquent ${fireDays} jour${fireDays > 1 ? "s" : ""} par an en ${meta.year} avec des conditions météo favorables aux incendies. Cet indice reflète la météo, pas la probabilité réelle : le risque effectif dépend aussi de la végétation et de l'humidité des sols.`,
    );
  }

  if (georisques) {
    const risks: string[] = [];
    if (georisques.flags.flood) risks.push("inondation fluviale");
    if (georisques.flags.marineSubmersion) risks.push("submersion marine");
    if (risks.length > 0) {
      paragraphs.push(
        `${communeName} est classée en zone à risque ${risks.join(" et ")}. Ces risques sont identifiés à l'échelle de la commune. L'exposition précise de votre adresse est accessible dans le module Logement.`,
      );
    }
  }

  // Sécheresse : arc temporel à 3 signaux quand ils sont disponibles.
  //   VigiEau     → présent administratif (100% France)
  //   ONDE        → présent observation terrain (rural seulement)
  //   DRIAS SWI04 → futur modélisé (100% France, dépend de l'horizon)
  const droughtSentences: string[] = [];

  if (vigieau?.maxLevel) {
    const niveau = levelLabel(vigieau.maxLevel).toLowerCase();
    const bassin = vigieau.topZone?.label ? ` sur le bassin ${vigieau.topZone.label}` : "";
    const fin = vigieau.topZone?.endDate
      ? ` jusqu'au ${formatFrDate(vigieau.topZone.endDate)}`
      : "";
    droughtSentences.push(
      `${communeName} est actuellement en ${niveau} sécheresse${bassin}${fin}, selon l'arrêté préfectoral en vigueur (VigiEau, Propluvia).`,
    );
  }

  // FUT-163 : l'état brut décide, pas `isDry` (cf. la carte « Sécheresse des sols »).
  const etatReleve = drought ? lireEcoulement(drought).etat : null;
  if (drought && (etatReleve === "assec" || etatReleve === "ecoulement_interrompu")) {
    const cours = drought.riverName ? `le ${drought.riverName}` : "le cours d'eau local";
    const lead = droughtSentences.length === 0
      ? `${cours.charAt(0).toUpperCase()}${cours.slice(1)} a été observé`
      : `Localement, ${cours} a été observé`;
    // FUT-165 : « écoulement non visible » n'est pas un assec ; la phrase dit l'état relevé, et sa date.
    const etat = etatReleve === "assec" ? "à sec" : "sans écoulement visible";
    const quand = drought.lastObservationDate ? ` le ${formatFrDate(drought.lastObservationDate)}` : "";
    droughtSentences.push(
      `${lead} ${etat}${quand} par le réseau ONDE (Hub'Eau, OFB).`,
    );
  }

  if (drySoilDays != null) {
    droughtSentences.push(
      `À l'horizon ${meta.year}, le sol de la commune serait sec environ ${drySoilDays} jours par an dans le scénario France ${meta.france} (DRIAS, indice SWI < 0,4).`,
    );
  }

  if (droughtSentences.length > 0) {
    paragraphs.push(droughtSentences.join(" "));
  }

  return paragraphs;
}

function formatFrDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

// ─── FactorGrid (grille horizontale de cartes) ────────────────────────────────

// LA TEINTE D'UN REGISTRE, seule table de correspondance de ce fichier. Identique à celle du dossier
// (DossierDecisionSection) : la même chose dite au même endroit doit se peindre pareil.
const REGISTER_TONE: Record<RegisterKey, string> = {
  incompatibilities: "var(--reg-incompatibilite)",
  alignments: "var(--reg-alignement)",
  mismatches: "var(--reg-ecart)",
  compromises: "var(--reg-compromis)",
  unknowns: "var(--reg-non-su)",
  verifications: "var(--reg-controle)",
};

// ── Carte « Fibre optique » (Arcep, FUT-148) ──────────────────────────────────────────────
// Un fait territorial, pas une note : le chiffre, sa date, ce qu'il ne garantit pas, où vérifier. Les
// phrases viennent de `fibre-texte.ts` (pur, testé) ; la carte ne fait que les poser. Hors de
// `buildFactors` : la donnée n'est pas dans le snapshot Territoire (cf. `fibre-commune.ts`).
function facteurFibre(t: TexteFibre): Factor {
  return {
    label: "Fibre optique",
    val: t.valeur,
    sub: t.sousTitre,
    col: "var(--green)",
    src: t.source,
    missing: t.manquant,
    detail: {
      eyebrow: "Le raccordement à la fibre",
      title: "Fibre optique",
      headline: t.titreVolet,
      subhead: t.manquant ? undefined : t.phrase,
      accent: "var(--green)",
      facts: t.faits.length > 0 ? t.faits : undefined,
      why: t.manquant ? t.phrase : t.limite,
      whyLabel: t.manquant ? "Ce que l'on sait" : "Ce que ce taux ne dit pas",
      note: t.verification,
      noteLabel: "À vérifier",
      lien: { ...LIEN_VERIFICATION },
      sources: t.methode,
    },
  };
}

export function QuartierAside({ registres, communeName, scenarios, georisques, territoire, vigieau, drought, droughtIndisponible, catnat, catnatInondation, catnatMisAJour, catnatVille, littoral, demographie, couvertNaturel, saisonnalitePct, logementVacancePct, eloignementServicesPct, era5, incendies, fibre }: SharedProps & { registres?: Map<EvidenceTargetKey, Set<RegisterKey>> }) {
  const [horizon] = useHorizon();
  const [openDetail, setOpenDetail] = useState<CardDetail | null>(null);
  const factors = buildFactors(scenarios, horizon, georisques, territoire, vigieau ?? null, drought ?? null, communeName, catnat ?? null, catnatInondation ?? null, catnatMisAJour ?? null, littoral ?? null, demographie ?? null, couvertNaturel ?? null, saisonnalitePct ?? null, logementVacancePct ?? null, eloignementServicesPct ?? null, era5 ?? null, catnatVille ?? null, incendies ?? null, droughtIndisponible ?? false);
  if (fibre) factors.push(facteurFibre(fibre.texte));
  // Le lecteur a parlé de connexion ou de télétravail : la fibre ouvre le groupe « Le territoire ».
  // Seul l'ordre change ; ni la couleur ni le filet, qui disent la relation au dossier de décision.
  const rangPourLeProjet = (label: string) => (fibre?.pourLeProjet && label === "Fibre optique" ? -1 : cardRank(label));

  // FUT-69 : ARRIVÉE PAR LA PASTILLE DU DOSSIER. Une carte qui porte son chiffre dans le volet
  // (`arrivee`) l'ouvre quand l'ancre de la page est la sienne : le lecteur retrouve le compte
  // annoncé sans avoir à le chercher. Une fois, au montage ; le hash ne se relit pas ensuite.
  useEffect(() => {
    const ancre = window.location.hash.slice(1);
    if (!ancre) return;
    const cible = factors.find((f) => f.arrivee && f.detail && f.targets?.some((t) => evidenceAnchorId(t) === ancre));
    // Lecture du hash au montage, côté client seulement : pas de rendu en cascade.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (cible?.detail) setOpenDetail({ ...cible.detail, ...cible.arrivee });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Regroupement par thème : le décor (territoire) d'abord, puis le climat, puis
  // les risques. Le code couleur suit le thème, pas la carte individuelle.
  const groups = THEME_ORDER
    .map((t) => ({
      t,
      items: factors.filter((f) => themeOf(f.label) === t).sort((a, b) => rangPourLeProjet(a.label) - rangPourLeProjet(b.label)),
    }))
    .filter((g) => g.items.length > 0);

  return (
    <div>
      <div className="flex flex-col gap-7">
        {groups.map((g) => {
          const col = THEME[g.t].col;
          return (
            <div key={g.t}>
              <div className="flex items-center gap-2 mb-3">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: col }} />
                <span className="font-mono text-[11px] tracking-[0.12em] uppercase" style={{ color: col }}>
                  {THEME[g.t].label}
                </span>
              </div>
              {/* Quatre colonnes seulement à partir de `lg`. Figée à 4, cette grille donnait
                  ~72 px par carte sur téléphone, pour un libellé, une valeur, un sous-titre et une
                  source : la carte devenait illisible là où la donnée est justement le produit. */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
                {g.items.map((f) => {
                  const clickable = !!f.detail;
                  // LE FILET DIT LA RELATION AU PROJET, plus le thème du groupe.
                  //
                  // Il portait la couleur du thème, donc la même sur toutes les cartes d'un groupe,
                  // sous un surtitre qui la disait déjà : il ne distinguait rien et devenait un motif
                  // (DESIGN.md § 6.2). Il dit maintenant à quel registre du dossier cette donnée
                  // participe, et il est RARE par construction : la plupart des cartes n'en ont pas.
                  // Les règles de sélection vivent dans `evidence-registers.ts`, avec leurs tests.
                  const registre = registres ? registerForCard(f.targets, registres) : null;
                  const tone = registre ? REGISTER_TONE[registre] : null;
                  return (
                    <div
                      key={f.label}
                      // L'ANCRE DU PHÉNOMÈNE : une preuve du dossier (« En une minute ») renvoie ici,
                      // sur la carte qui la DÉMONTRE, plutôt qu'en haut du module. Une carte peut
                      // présenter plusieurs phénomènes ; seul le premier porte l'`id` (un élément n'en
                      // a qu'un), les suivants sont posés en ancres vides juste avant, ci-dessous.
                      id={f.targets?.[0] ? evidenceAnchorId(f.targets[0]) : undefined}
                      className={`glass rounded-xl px-4 py-3.5 scroll-mt-24${clickable ? " metric-card-clickable" : ""}`}
                      // L'ABSENCE SE LIT SANS PASSER SOUS LE PLANCHER D'ACCESSIBILITÉ. `opacity: 0.45`
                      // sur la carte estompait le TEXTE avec elle : le libellé tombait à 3,96:1 et
                      // la source à 1,72:1, quand WCAG AA exige 4,5:1. L'effacement passe désormais
                      // par `--fg-absent` (contraste vérifié sur --bg, --bg-deep et le verre), le
                      // filet gris et le tiret « — ». Une donnée qu'on n'a pas doit rester lisible :
                      // c'est une information, pas un déchet visuel.
                      style={{
                        position: "relative",
                        borderTop: tone ? `2px solid ${tone}` : undefined,
                        cursor: clickable ? "pointer" : undefined,
                      }}
                      role={clickable ? "button" : undefined}
                      tabIndex={clickable ? 0 : undefined}
                      onClick={clickable ? () => setOpenDetail(f.detail!) : undefined}
                      onKeyDown={
                        clickable
                          ? (e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                setOpenDetail(f.detail!);
                              }
                            }
                          : undefined
                      }
                    >
                      {/* Les phénomènes SUPPLÉMENTAIRES de cette carte : un élément ne porte qu'un
                          `id`, donc les clés au-delà de la première deviennent des ancres vides, au
                          même endroit. Une carte climatique qui présente la chaleur ET les nuits
                          tropicales est atteignable par les deux liens, sans prétendre que ces deux
                          phénomènes n'en font qu'un. */}
                      {f.targets?.slice(1).map((t) => (
                        <span key={t} id={evidenceAnchorId(t)} aria-hidden className="block h-0 scroll-mt-24" />
                      ))}
                      <div className={`text-[13px] font-medium mb-2 leading-[1.3]${f.missing ? "" : " text-label"}`} style={f.missing ? { color: "var(--fg-absent)" } : undefined}>{f.label}</div>
                      <div className="font-mono text-[12px] tracking-[0.02em] mb-0.5" style={{ color: f.missing ? "var(--fg-absent)" : col }}>{f.val}</div>
                      {f.sub && <div className={`text-[12px] tracking-[0.01em] leading-[1.4] mb-0.5${f.missing ? "" : " text-label"}`} style={f.missing ? { color: "var(--fg-absent)" } : undefined}>{f.sub}</div>}
                      <div className="font-mono text-[11px] text-ghost tracking-[0.02em] leading-[1.4]">{f.src}</div>
                      {clickable && (
                        <div className="font-mono text-[11px] tracking-[0.06em] mt-2" style={{ color: col }}>
                          Détail →
                        </div>
                      )}
                      {!clickable && f.tip && (
                        <span style={{ position: "absolute", top: 10, right: 10 }}>
                          <MetricTooltip text={f.tip} accent={f.missing ? undefined : col} />
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <MetricDrawer detail={openDetail} onClose={() => setOpenDetail(null)} />

      <style>{`
        .metric-card-clickable { transition: transform 0.15s ease, background 0.15s ease; }
        .metric-card-clickable:hover { transform: translateY(-2px); background: var(--bg-elev-2); }
        .metric-card-clickable:focus-visible { outline: 2px solid var(--blue); outline-offset: 2px; }
      `}</style>
    </div>
  );
}

// ─── SectionTitle (titre dynamique horizon-aware) ─────────────────────────────

export function QuartierSectionTitle({ communeName, scenarios, georisques }: Pick<SharedProps, "communeName" | "scenarios" | "georisques">) {
  const [horizon] = useHorizon();
  const meta = HORIZON_META[horizon];
  const gwlData = scenarios?.[horizon]?.v ?? null;
  const hotDays = r(gwlData?.["NORTX30D_yr"]);
  const tropicalNights = r(gwlData?.["NORTR_yr"]);
  const flood = georisques?.flags.flood ?? false;
  const submersion = georisques?.flags.marineSubmersion ?? false;

  let title = "";

  if (hotDays != null && (flood || submersion)) {
    const risks = [flood && "inondations", submersion && "submersion marine"].filter(Boolean).join(" et ");
    title = `${hotDays} jours de chaleur en ${meta.year}, ${communeName} exposée aux ${risks}.`;
  } else if (hotDays != null && tropicalNights != null) {
    title = `${hotDays} jours chauds et ${tropicalNights} nuits tropicales attendus en ${meta.year}.`;
  } else if (hotDays != null) {
    title = `${hotDays} jours au-dessus de 30°C attendus à l'horizon ${meta.year}.`;
  } else if (flood || submersion) {
    const risks = [flood && "inondations", submersion && "submersion marine"].filter(Boolean).join(" et ");
    title = `${communeName} exposée aux ${risks} selon les données de risques naturels.`;
  } else {
    title = `Les signaux climatiques pour ${communeName} à l'horizon ${meta.year}.`;
  }

  return (
    <div>
      <p className="font-mono text-[11px] tracking-[0.12em] uppercase text-ghost mb-2">Synthèse territoriale</p>
      <h2 className="font-[var(--weight-title)] text-[length:var(--text-title)] leading-[1.18] tracking-[-0.5px] text-label" style={{ fontFamily: "var(--font-serif)" }}>
        {title}
      </h2>
    </div>
  );
}

// ─── DataBody (bloc principal de données) ─────────────────────────────────────

export function QuartierDataBody({ communeName, scenarios, georisques, drought, vigieau }: SharedProps) {
  const [horizon] = useHorizon();
  const meta = HORIZON_META[horizon];
  const gwlData = scenarios?.[horizon]?.v ?? null;
  const paragraphs = communeName ? buildParagraphs(communeName, gwlData, horizon, georisques, drought, vigieau) : [];

  return (
    /* Le filet bleu de tête a été retiré le 30/07/2026 : il portait la couleur d'échelle Territoire,
       que le § 7 de DESIGN.md ne reconnaît plus, et il était seul de son espèce sur cet écran, donc
       il ne distinguait rien (§ 6.2). Le bloc reste la surface élevée de son mouvement. */
    <div className="glass rounded-xl p-6 sm:p-8">
      <h3 className="font-normal text-[26px] text-label mb-3 tracking-[-0.3px]" style={{ fontFamily: "var(--font-serif)" }}>
        {communeName}, à l&apos;horizon {meta.year}, scénario France {meta.france}.
      </h3>
      {paragraphs.length > 0 ? (
        paragraphs.map((p, i) => (
          <p key={i} className="text-[16px] leading-[1.75] text-muted mb-4">{p}</p>
        ))
      ) : (
        <p className="text-[16px] leading-[1.75] text-muted mb-4">
          Renseignez votre commune dans votre profil pour accéder aux projections climatiques de votre territoire.
        </p>
      )}
    </div>
  );
}
