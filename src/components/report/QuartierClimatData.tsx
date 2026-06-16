"use client";

import { useState } from "react";
import { useHorizon, HORIZON_META, type HorizonKey } from "@/hooks/useHorizon";
import { MetricDrawer, type CardDetail } from "@/components/MetricDrawer";
import { MetricTooltip } from "@/components/MetricTooltip";
import type { GeorisquesSummary, GasparCatnatSummary } from "@/lib/georisques";
import type { EaufranceSummary } from "@/lib/eaufrance";
import type { VigieauSummary, DroughtLevel } from "@/lib/vigieau";
import type { LittoralSummary, LittoralFacade } from "@/lib/littoral";
import type { DemographieCardData, CouvertCardData } from "@/lib/territory-identity";
import type { Era5Trend } from "@/lib/era5-trend";
import type { TerritoryType } from "@/lib/territory-mood";

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
  territoire: Territoire | null;
  vigieau: VigieauSummary | null;
  catnat?: GasparCatnatSummary | null;
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
  // Archétype climatique (déterministe, dérivé du département) : ancre le récit
  // « Ce que cela raconte » du drawer Températures dans le caractère du lieu.
  climatType?: TerritoryType | null;
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
  "Températures moyennes": "climat",
  "Chaleurs estivales": "climat",
  "Nuits tropicales": "climat",
  "Conditions favorables au feu": "climat",
  "Sécheresse des sols": "climat",
  "Pluies et épisodes intenses": "climat",
  "Inondation fluviale": "risque",
  "Submersion marine": "risque",
  "Catastrophes naturelles reconnues": "risque",
  "Érosion du littoral": "risque",
};
function themeOf(label: string): ThemeKey {
  return THEME_OF[label] ?? "territoire";
}
// Ordre de lecture au sein de chaque thème (le décor avant l'aléa, le légible avant le pointu).
const CARD_ORDER: string[] = [
  "Trajectoire de population", "Logements inoccupés", "Accès aux services", "Espaces naturels", "Taux de boisement", "Résidences secondaires",
  // Climat alterné mouvement/niveau pour le rythme (évite un mur de « +X »).
  "Températures moyennes", "Sécheresse des sols", "Chaleurs estivales", "Conditions favorables au feu", "Nuits tropicales", "Pluies et épisodes intenses",
  "Inondation fluviale", "Submersion marine", "Catastrophes naturelles reconnues", "Érosion du littoral",
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

// Récit « Ce que cela raconte » des drawers climat, ancré dans le caractère
// climatique du lieu (archétype déterministe) plutôt qu'une phrase passe-partout.
// Identitaire mais sobre ; échelle territoire (pas la vie de l'utilisateur, pas
// le logement ni la santé), non catastrophiste. Variantes par thème ; on ne
// décline « temperature » et « chaleur » que pour l'instant.
function buildClimatWhy(
  theme: "temperature" | "chaleur" | "nuits",
  communeName: string,
  type: TerritoryType,
  signals: { summerAnom?: number | null; winterAnom?: number | null },
): string {
  if (theme === "nuits") {
    const core: Record<TerritoryType, string> = {
      littoral_atlantique: `À ${communeName}, les nuits restaient fraîches au bord de l'Atlantique ; elles gardent de plus en plus la chaleur du jour.`,
      mediterraneen: `À ${communeName}, les nuits chaudes font déjà partie de l'été méditerranéen ; elles deviennent plus nombreuses et la saison s'étire.`,
      montagne: `À ${communeName}, l'altitude a longtemps garanti des nuits fraîches ; elles commencent à céder lors des étés les plus chauds.`,
      plaine: `À ${communeName}, loin de la mer, les nuits suivent le jour : quand les étés chauffent, elles cessent plus souvent de rafraîchir.`,
    };
    return core[type];
  }
  if (theme === "chaleur") {
    const core: Record<TerritoryType, string> = {
      littoral_atlantique: `À ${communeName}, le climat atlantique a longtemps gardé les fortes chaleurs rares ; elles deviennent peu à peu une part ordinaire de l'été.`,
      mediterraneen: `À ${communeName}, les fortes chaleurs font déjà partie de l'été ; ce qui change, c'est leur nombre et la longueur des épisodes.`,
      montagne: `À ${communeName}, l'altitude a longtemps tenu les fortes chaleurs à distance ; elles gagnent désormais les étés.`,
      plaine: `À ${communeName}, sans façade maritime ni relief pour tempérer, les fortes chaleurs s'installent plus tôt et durent plus longtemps.`,
    };
    return `${core[type]} La progression s'accélère, elle ne fait pas que monter.`;
  }

  // theme === "temperature" : la nuance été/hiver n'est ajoutée que si l'écart
  // est net (>0,3 °C), pour ne jamais affirmer une généralité fausse (ex. à la
  // montagne l'été se réchauffe plus vite que l'hiver).
  const core: Record<TerritoryType, string> = {
    littoral_atlantique: `À ${communeName}, le climat atlantique tempère encore les extrêmes, mais cet effet d'amortisseur faiblit à mesure que les saisons se réchauffent.`,
    mediterraneen: `À ${communeName}, la chaleur fait déjà partie du climat ; ce qui change, c'est son intensité et sa durée au fil de l'année.`,
    montagne: `À ${communeName}, le froid d'altitude a longtemps marqué le climat ; il devient moins présent, saison après saison.`,
    plaine: `À ${communeName}, le climat intérieur se réchauffe sans l'amortisseur direct de l'océan ou de l'altitude.`,
  };
  let seasonClause = "";
  const { summerAnom, winterAnom } = signals;
  if (summerAnom != null && winterAnom != null) {
    if (winterAnom - summerAnom > 0.3) seasonClause = " Ici, l'hiver se réchauffe plus vite que l'été.";
    else if (summerAnom - winterAnom > 0.3) seasonClause = " Ici, l'été se réchauffe plus vite que l'hiver.";
  }
  return core[type] + seasonClause;
}

// Face avant « mouvement » d'un phénomène compté en jours/nuits, avec garde-fou :
// en climat froid (montagne) le phénomène est quasi absent (« +0 nuits » = effet
// bug). On RAISONNE SUR LA VALEUR BRUTE (non arrondie) : sous le plancher on dit la
// rareté ; sinon mouvement si le delta est net, à défaut le niveau absolu.
function movementOrLevel(
  absRaw: number | null | undefined,
  deltaRaw: number | null | undefined,
  unit: string,
  rareLabel: string,
  year: string,
): string {
  if (absRaw == null) return "—";
  if (absRaw < 1.5) return rareLabel;
  if (deltaRaw != null && Math.round(deltaRaw) >= 2) return `${signedInt(deltaRaw)} ${unit} d'ici ${year}`;
  return `${Math.round(absRaw)} ${unit}/an en ${year}`;
}

function buildFactors(
  scenarios: GwlScenarios | null,
  horizonKey: HorizonKey,
  georisques: GeorisquesSummary | null,
  territoire: Territoire | null,
  vigieau: VigieauSummary | null,
  drought: Drought | null,
  communeName: string,
  catnat?: GasparCatnatSummary | null,
  littoral?: LittoralSummary | null,
  demographie?: DemographieCardData | null,
  couvertNaturel?: CouvertCardData | null,
  saisonnalitePct?: number | null,
  logementVacancePct?: number | null,
  eloignementServicesPct?: number | null,
  era5?: Era5Trend | null,
  climatType?: TerritoryType | null,
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

  // ── Carte « Jours chauds » → drawer : la chaleur qui s'installe ───────────────
  // On lit les trois horizons et on les rend comme une montée VISIBLE (barres),
  // pas comme un tableau. Le récit prime ; les sources passent en pied de drawer.
  // Référence reconstruite (jours > 30°C de la période de référence DRIAS) : la
  // face affiche « +X jours d'ici {horizon} » depuis CE point, le drawer doit
  // donc partir d'ici pour que les deux racontent le même mouvement.
  const hotRef = reconstructReference(scenarios, "NORTX30D_yr", "ATX30D_yr");
  // Référence des jours > 35°C (≈ 0 : la chaleur extrême est quasi nouvelle).
  const extremeRef = reconstructReference(scenarios, "NORTX35D_yr", "ATX35D_yr");
  const heatDetail: CardDetail | undefined = hotDays != null
    ? {
        eyebrow: "Des étés qui s'intensifient",
        title: "Chaleurs estivales",
        // Option A : référence → horizon sélectionné (colle exactement à la face).
        headline:
          hotRef != null
            ? `≈ ${Math.round(hotRef)} → ${hotDays} jours chauds par an d'ici ${meta.year}`
            : `${hotDays} jours chauds par an en ${meta.year}`,
        subhead: "Les fortes chaleurs gagnent du terrain, année après année.",
        accent: "var(--orange)",
        breakdownLabel: "Jours au-dessus de 30°C, par an",
        breakdown: trajectoryBreakdown(scenarios, "NORTX30D_yr", {
          ref: hotRef,
          format: (n) => `${Math.round(n)} jours`,
          refApprox: true,
          withBars: true,
          selectedHorizon: horizonKey,
        }),
        // Chaleur extrême : masquée à 0 (un « 0 » sous une carte qui crie « +X »
        // est du bruit). Règle de temporalité : toute donnée projetée du drawer
        // porte son horizon. Trajectoire référence → horizon si la référence se
        // reconstruit (elle est ≈ 0 : la chaleur extrême apparaît), sinon niveau daté.
        facts:
          heatDays != null && heatDays >= 1
            ? [
                {
                  label: "Jours au-dessus de 35°C",
                  value:
                    extremeRef != null
                      ? `≈ ${Math.round(extremeRef)} → ${heatDays} par an d'ici ${meta.year}`
                      : `${heatDays} par an en ${meta.year}`,
                },
              ]
            : undefined,
        why: buildClimatWhy("chaleur", communeName, climatType ?? "plaine", {}),
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
        eyebrow: "Des nuits qui ne retombent plus",
        title: "Nuits tropicales",
        headline:
          tropicalNightsRef != null
            ? `≈ ${Math.round(tropicalNightsRef)} → ${tropicalNights} nuits par an d'ici ${meta.year}`
            : `${tropicalNights} nuits par an en ${meta.year}`,
        subhead: "Des nuits où la chaleur ne retombe pas sous 20°C.",
        accent: "var(--orange)",
        breakdownLabel: "Nuits au-dessus de 20°C, par an",
        breakdown: trajectoryBreakdown(scenarios, "NORTR_yr", {
          ref: tropicalNightsRef,
          format: (n) => `${Math.round(n)} nuits`,
          refApprox: true,
          withBars: true,
          selectedHorizon: horizonKey,
        }),
        why: buildClimatWhy("nuits", communeName, climatType ?? "plaine", {}),
        whyLabel: "Ce que cela raconte",
        askPrefill: "Les nuits tropicales vont-elles augmenter dans ma commune ?",
        sources: "Projections DRIAS-TRACC, Météo-France · nuits tropicales (Tmin > 20°C), période de référence 1976-2005",
      }
    : undefined;

  // ── Carte « Sécheresse des sols » → drawer : un territoire qui s'assèche ──────
  // Trois temps (présent, terrain, futur) racontés en langage utilisateur ; les
  // noms de bases (VigiEau, ONDE, DRIAS) descendent en pied de drawer.
  const hasDroughtStory = drySoilDays != null || !!vigieau?.maxLevel || !!drought?.isDry;
  const droughtActive = !!vigieau?.maxLevel || !!drought?.isDry;
  // « Vigilance » est le niveau le plus bas de VigiEau : c'est de la
  // sensibilisation, pas une restriction d'usage. La nommer « restriction »
  // contredit le reste de la carte. On ne parle de restriction qu'à partir
  // d'« alerte ».
  const todayValue = vigieau?.maxLevel
    ? vigieau.maxLevel === "vigilance"
      ? "Vigilance sécheresse, sans restriction"
      : `Restriction « ${levelLabel(vigieau.maxLevel).toLowerCase()} » en cours`
    : "Aucune restriction en cours";
  const droughtRows: { label: string; value: string }[] = [
    { label: "Aujourd'hui", value: todayValue },
    // Terrain : uniquement si on a une vraie observation ONDE. Sans donnée, on
    // n'invente pas une réassurance (« pas de tension ») qui contredirait une
    // restriction en cours.
    ...(drought
      ? [{ label: "Sur le terrain", value: drought.isDry ? "Cours d'eau à sec par endroits" : "Pas de cours d'eau à sec" }]
      : []),
    ...(drySoilDays != null
      ? [{ label: `À l'horizon ${meta.year}`, value: `Environ ${drySoilDays} jours secs par an` }]
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
        eyebrow: "Un territoire qui s'assèche",
        title: "Sécheresse des sols",
        headline:
          drySoilDays != null
            ? `Environ ${drySoilDays} jours secs par an d'ici ${meta.year}`
            : vigieau?.maxLevel
              ? vigieau.maxLevel === "vigilance"
                ? "Vigilance sécheresse en cours"
                : `Restriction « ${levelLabel(vigieau.maxLevel).toLowerCase()} » en cours`
              : "Cours d'eau à sec observé",
        subhead: droughtActive
          ? "Les premiers signes sont déjà là, et le climat les amplifie."
          : "Le territoire s'assèche peu à peu, et les étés pèsent de plus en plus sur l'eau.",
        accent: "var(--orange)",
        breakdownLabel: "Le fil de la sécheresse",
        breakdown: droughtRows,
        facts: droughtFacts && droughtFacts.length > 0 ? droughtFacts : undefined,
        why: "La sécheresse ne se voit pas d'un coup, elle s'installe. L'eau qu'on restreint l'été, les cours d'eau qui faiblissent, la terre qui se rétracte : ces phénomènes racontent un même mouvement du territoire, du présent vers l'avenir. C'est un changement de fond, pas un épisode isolé.",
        askPrefill: "Ma commune est-elle exposée à la sécheresse ?",
        sources: "VigiEau (arrêtés préfectoraux) · réseau ONDE, Hub'Eau (cours d'eau) · projections DRIAS, Météo-France",
      }
    : undefined;

  const factors: Factor[] = [
    {
      // Registre A (mouvement) : face avant = delta projeté, garde-fou montagne
      // (delta quasi nul -> « Restent rares »). Le drawer absorbe la chaleur extrême.
      label: "Chaleurs estivales",
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
      val: movementOrLevel(gwlData?.["NORTR_yr"], tropicalNightsAnom, "nuits", "Quasi inexistantes", meta.year),
      col: "var(--orange)",
      src: "DRIAS / Météo-France · Tmin > 20°C",
      missing: tropicalNights == null,
      detail: tropicalNightsDetail,
      tip: showTropicalDetail
        ? undefined
        : "Quand la chaleur ne retombe pas la nuit, l'air ne rafraîchit plus le territoire. C'est l'un des signes les plus parlants d'un climat qui change près de chez soi.",
    },
    {
      // Registre B (niveau) : le chiffre porte son échelle, on garde l'absolu.
      label: "Conditions favorables au feu",
      val: fireDays != null ? `${fireDays} jours/an en ${meta.year}` : "—",
      col: "var(--orange)",
      src: "DRIAS · IFM > 40 · indice météo, pas risque réel",
      missing: fireDays == null,
      tip: "Indice météo (pas le risque réel à l'adresse) : plus ces journées se multiplient, plus le risque qu'un feu démarre et se propage augmente, surtout près des espaces naturels.",
    },
    {
      label: "Sécheresse des sols",
      val:
        drySoilDays != null
          ? `${drySoilDays} jours/an en ${meta.year}`
          : vigieau?.maxLevel
            ? levelLabel(vigieau.maxLevel)
            : drought?.isDry
              ? "Cours d'eau à sec"
              : "—",
      col: "var(--orange)",
      src: `DRIAS · indice SWI < 0,4 · France ${meta.france}`,
      missing: !hasDroughtStory,
      detail: droughtDetail,
    },
    {
      label: "Inondation fluviale",
      val: georisques ? (georisques.flags.flood ? "Une partie du territoire est concernée" : "Aucun périmètre recensé") : "—",
      col: "var(--blue)",
      src: "Géorisques · échelle communale",
      missing: !georisques?.flags.flood,
      tip: "Savoir qu'une partie de la commune peut être atteinte par une crue aide à comprendre ce qui peut être touché. Détail à votre adresse dans le module Logement.",
    },
    {
      label: "Submersion marine",
      val: georisques ? (georisques.flags.marineSubmersion ? "Le littoral fait partie des zones surveillées" : "Aucun périmètre recensé") : "—",
      col: "var(--blue)",
      src: "Géorisques · échelle communale",
      missing: !georisques?.flags.marineSubmersion,
      tip: "Sur le littoral, savoir si la mer peut atteindre la commune aide à comprendre ce qui est exposé aux tempêtes. Détail à votre adresse dans le module Logement.",
    },
    // Carte couvert naturel : enrichie (OSO + composition) si fournie, sinon
    // repli sur le seul taux de boisement ADEME.
    couvertNaturel
      ? {
          label: "Espaces naturels",
          val: couvertNaturel.headlineLabel,
          col: "var(--green)",
          src: "OSO · ADEME · échelle communale",
          missing: false,
          detail: {
            eyebrow: "L'occupation des sols",
            title: "Espaces naturels",
            headline: `${couvertNaturel.brutPct} % d'espaces naturels`,
            subhead: `${
              couvertNaturel.brutPct >= 75
                ? `À ${communeName}, le naturel l'emporte largement : le bâti tient peu de place.`
                : couvertNaturel.brutPct >= 50
                  ? `À ${communeName}, le naturel domine le paysage, le bâti reste minoritaire.`
                  : couvertNaturel.brutPct >= 25
                    ? `À ${communeName}, espaces bâtis et espaces ouverts s'équilibrent.`
                    : `À ${communeName}, les espaces naturels sont rares : la commune est très urbanisée.`
            }${
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
        why: "La trajectoire de population dit beaucoup d'un territoire : une commune qui gagne des habitants attire et se transforme, une commune qui en perd voit ses services et ses logements évoluer autrement. C'est une tendance de fond, pas un chiffre isolé.",
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
            subhead: "Le climat de fond, pas les pics : moyennes de juin-août et décembre-février.",
            accent: "var(--orange)",
            breakdownLabel: "Été moyen, par horizon",
            breakdown: summerBreakdown,
            facts: tempFacts.length > 0 ? tempFacts : undefined,
            why: buildClimatWhy("temperature", communeName, climatType ?? "plaine", { summerAnom, winterAnom }),
            whyLabel: "Ce que cela raconte",
            ...(era5
              ? {
                  noteLabel: "Déjà observé",
                  note: `${signed(era5.delta_c)} °C depuis 1961-1990 (réanalyse Copernicus / ERA5-Land). Le réchauffement projeté a déjà commencé.`,
                }
              : {}),
            askPrefill: "Comment les températures évoluent-elles dans ma commune ?",
            sources: era5
              ? "Projections DRIAS-TRACC, Météo-France (moyennes saisonnières, période de référence 1976-2005) · réanalyse ERA5-Land, Copernicus (tendance observée)"
              : "Projections DRIAS-TRACC, Météo-France · moyennes saisonnières (juin-août, décembre-février), période de référence 1976-2005",
          }
        : undefined,
  });

  // ── Pluies et épisodes intenses (fusion, Registre B : niveau en JOURS) ─────────
  // Ni le cumul mm muet ni le % abstrait : on affiche les jours de fortes pluies
  // (NORRRq99refD, déjà chargé). Cumul annuel + mm/24h descendent au drawer.
  const annualRain = gwlData?.["NORRR_yr"];
  const heavyRain = gwlData?.["NORRRq99_yr"];
  const rainDaysTraj = (["gwl15", "gwl20", "gwl30"] as HorizonKey[])
    .map((k) => ({ k, v: r(scenarios?.[k]?.v?.["NORRRq99refD_yr"]) }))
    .filter((x): x is { k: HorizonKey; v: number } => x.v != null);
  const rainDaysMax = Math.max(...rainDaysTraj.map((x) => x.v), 1);
  const rainFacts: { label: string; value: string }[] = [
    ...(annualRain != null ? [{ label: "Cumul annuel", value: `${Math.round(annualRain)} mm` }] : []),
    ...(heavyRain != null ? [{ label: "Pluie intense en 24h", value: `${Math.round(heavyRain)} mm` }] : []),
  ];
  factors.push({
    label: "Pluies et épisodes intenses",
    val: heavyRainDays != null ? `${heavyRainDays} jours de fortes pluies/an en ${meta.year}` : "—",
    col: "var(--orange)",
    src: "DRIAS / Météo-France · jours de pluie intense",
    missing: heavyRainDays == null,
    detail:
      heavyRainDays != null
        ? {
            eyebrow: "Quand la pluie se concentre",
            title: "Pluies et épisodes intenses",
            headline: `${heavyRainDays} jours de fortes pluies par an en ${meta.year}`,
            subhead: "Ce qui pèse n'est pas tant le cumul annuel que la façon dont la pluie se concentre.",
            accent: "var(--orange)",
            breakdownLabel: rainDaysTraj.length >= 2 ? "Jours de fortes pluies, par horizon" : undefined,
            breakdown:
              rainDaysTraj.length >= 2
                ? rainDaysTraj.map((t) => ({ label: `Horizon ${HORIZON_META[t.k].year}`, value: `${t.v} jours`, bar: t.v / rainDaysMax }))
                : undefined,
            facts: rainFacts.length > 0 ? rainFacts : undefined,
            why: "Le cumul de pluie sur l'année dit peu de chose. Ce qui compte, c'est l'intensité : quand la pluie tombe en peu d'heures, le ruissellement et le débordement deviennent possibles, même loin d'un cours d'eau. L'exposition précise de votre adresse relève du module Logement.",
            whyLabel: "Ce que cela raconte",
            askPrefill: "Les pluies intenses vont-elles s'aggraver dans ma commune ?",
            sources: "Projections DRIAS, Météo-France · jours de pluie intense (p99), cumul annuel, pluie journalière extrême",
          }
        : undefined,
  });

  // ── Cartes territoire P0 : le système humain (ADEME, échelle commune) ─────────
  // Face avant qualitative (« vacance » ≈ « vacances » et « 0 % » = effet bug) ;
  // Face avant = le chiffre ET son interprétation (head sur la ligne valeur,
  // précision en dessous) ; le tooltip se limite à la définition.
  if (logementVacancePct != null) {
    const vac = Math.round(logementVacancePct);
    const [vacHead, vacSub] =
      vac >= 13
        ? ["Perte d'attractivité", "Des logements qui peinent à trouver preneur"]
        : vac < 8
          ? ["Tension sur le logement", "Peu de biens disponibles"]
          : ["Marché équilibré", "Vacance dans la moyenne"];
    factors.push({
      label: "Logements inoccupés",
      val: `${vac} % · ${vacHead}`,
      sub: vacSub,
      col: "var(--green)",
      src: "INSEE / ADEME · échelle communale",
      missing: false,
      tip: "Part du parc sans occupant au recensement.",
    });
  }
  if (eloignementServicesPct != null) {
    const elo = Math.round(eloignementServicesPct);
    const eloLabel = elo < 5 ? "Services proches" : elo <= 20 ? "Éloignement modéré" : "Éloignement marqué";
    factors.push({
      label: "Accès aux services",
      val: eloLabel,
      col: "var(--green)",
      src: "INSEE / ADEME · à plus de 20 min d'un service",
      missing: false,
      tip: `${elo} % des habitants vivent à plus de 20 min des services essentiels. Cette carte décrit le bassin de vie de la commune, pas vos trajets : ceux-ci relèvent du module Mobilité.`,
    });
  }

  // Carte CatNat (GASPAR) — ajoutée seulement quand l'appelant fournit la donnée
  // (QuartierAside). Histoire vécue : nombre de reconnaissances depuis l'origine.
  if (catnat !== undefined) {
    const hasCatnat = !!catnat && catnat.total > 0;
    const headline = hasCatnat
      ? `${catnat!.total} arrêté${catnat!.total > 1 ? "s" : ""}${catnat!.firstYear ? ` depuis ${catnat!.firstYear}` : ""}`
      : "—";
    const detail: CardDetail | undefined = hasCatnat
      ? {
          eyebrow: "Histoire du territoire",
          title: "Catastrophes naturelles reconnues",
          headline,
          subhead: catnat!.summary ?? undefined,
          accent: "var(--blue)",
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
          why: "Les arrêtés de catastrophe naturelle racontent l'histoire vécue du territoire : ils montrent quels aléas ont déjà marqué la commune, et à quelle fréquence.",
          whyLabel: "Ce que cela raconte",
          askPrefill: "Que racontent les arrêtés de catastrophe naturelle de ma commune ?",
          sources: "Géorisques · base GASPAR (arrêtés de catastrophe naturelle)",
        }
      : undefined;
    factors.push({
      label: "Catastrophes naturelles reconnues",
      val: headline,
      col: "var(--blue)",
      src: hasCatnat && catnat!.topRisk
        ? `Géorisques · GASPAR · surtout ${catnat!.topRisk.toLowerCase()}`
        : "Géorisques · GASPAR · arrêtés CatNat",
      missing: !hasCatnat,
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
      eyebrow: `Littoral · ${FACADE_LABEL[littoral.facade]}`,
      title: "Érosion du littoral",
      headline,
      subhead:
        e && !e.amenage && e.pctRecul != null
          ? `${e.pctRecul} % du littoral communal montrent une érosion observée : la côte y recule.`
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

  if (drought?.isDry) {
    const cours = drought.riverName ? `le ${drought.riverName}` : "le cours d'eau local";
    const lead = droughtSentences.length === 0
      ? `${cours.charAt(0).toUpperCase()}${cours.slice(1)} a été observé`
      : `Localement, ${cours} a été observé`;
    droughtSentences.push(
      `${lead} à sec dans une observation récente du réseau ONDE (Hub'Eau, OFB).`,
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

export function QuartierAside({ communeName, scenarios, georisques, territoire, vigieau, drought, catnat, littoral, demographie, couvertNaturel, saisonnalitePct, logementVacancePct, eloignementServicesPct, era5, climatType }: SharedProps) {
  const [horizon] = useHorizon();
  const [openDetail, setOpenDetail] = useState<CardDetail | null>(null);
  const factors = buildFactors(scenarios, horizon, georisques, territoire, vigieau ?? null, drought ?? null, communeName, catnat ?? null, littoral ?? null, demographie ?? null, couvertNaturel ?? null, saisonnalitePct ?? null, logementVacancePct ?? null, eloignementServicesPct ?? null, era5 ?? null, climatType ?? null);

  // Regroupement par thème : le décor (territoire) d'abord, puis le climat, puis
  // les risques. Le code couleur suit le thème, pas la carte individuelle.
  const groups = THEME_ORDER
    .map((t) => ({
      t,
      items: factors.filter((f) => themeOf(f.label) === t).sort((a, b) => cardRank(a.label) - cardRank(b.label)),
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
              <div className="grid grid-cols-4 gap-2.5">
                {g.items.map((f) => {
                  const clickable = !!f.detail;
                  return (
                    <div
                      key={f.label}
                      className={`glass rounded-xl px-4 py-3.5${clickable ? " metric-card-clickable" : ""}`}
                      style={{
                        position: "relative",
                        borderTop: `2px solid ${f.missing ? "var(--ghost)" : col}`,
                        opacity: f.missing ? 0.45 : 1,
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
                      <div className="text-[12px] font-medium text-label mb-2 leading-[1.3]">{f.label}</div>
                      <div className="font-mono text-[11px] tracking-[0.02em] mb-0.5" style={{ color: f.missing ? "var(--ghost)" : col }}>{f.val}</div>
                      {f.sub && <div className="text-[11px] text-label tracking-[0.01em] leading-[1.4] mb-0.5">{f.sub}</div>}
                      <div className="font-mono text-[10px] text-ghost tracking-[0.02em] leading-[1.4]">{f.src}</div>
                      {clickable && (
                        <div className="font-mono text-[10px] tracking-[0.06em] mt-2" style={{ color: col }}>
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
        .metric-card-clickable:hover { transform: translateY(-2px); background: rgba(255,255,255,0.05); }
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
      <h2 className="font-normal text-[clamp(24px,2.8vw,36px)] leading-[1.18] tracking-[-0.5px] text-label" style={{ fontFamily: "'Instrument Serif', serif" }}>
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
    <div className="glass rounded-xl p-8 border-t-2 border-t-info">
      <h3 className="font-normal text-[26px] text-label mb-3 tracking-[-0.3px]" style={{ fontFamily: "'Instrument Serif', serif" }}>
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
