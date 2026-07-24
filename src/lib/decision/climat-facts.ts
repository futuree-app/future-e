// LA DOCTRINE CLIMATIQUE DU DOSSIER. Lib PURE : aucune I/O, aucun LLM, aucun chargement de fichier.
//
// TROIS FAITS COMMANDENT CE FICHIER, et ils sont vérifiés (DRIAS-TRACC, 2026-07-14) :
//
// 1. DRIAS N'EXPOSE AUCUNE VALEUR PRÉSENTE. Sa période de référence est 1976-2005, et ses horizons sont
//    +2 °C (2030), +2,7 °C (2050) et +4 °C (2100) EN FRANCE. La référence se RECONSTRUIT (valeur projetée
//    moins anomalie), et le module Territoire l'affiche déjà sous le libellé « Fin du XXe siècle ».
//    IL EST DONC INTERDIT D'ÉCRIRE « la commune connaît ACTUELLEMENT tant de jours à plus de 35 °C ».
//
// 2. LA GRANDEUR EST OFFICIELLE, LA FRÉQUENCE EST UNE CONVENTION. « Un jour à plus de 35 °C », « une nuit
//    tropicale » (Tmin >= 20 °C, définition Météo-France), « un jour d'indice forêt-météo supérieur à 40 »
//    sont des grandeurs absolues et signifiantes. Mais le NOMBRE de jours à partir duquel futur•e signale
//    une exposition est NOTRE décision, calibrée sur les 34 788 communes. Elle est donc nommée, versionnée,
//    et DITE dans le texte, jamais appliquée en silence.
//
// 3. LA SÉCHERESSE DES SOLS N'A PAS DE SEUIL DÉFENDABLE (distribution continue de 67 à 160 jours, et
//    « 115 jours de sol sec » ne dit rien à un lecteur). Elle n'est donc PAS ici, et `faible_secheresse`
//    reste non examiné. Le retrait-gonflement des argiles est une CONSÉQUENCE géotechnique sur certains
//    sols, pas une mesure de la sécheresse : il est couvert par le module Logement, au grain adresse.

// La forme rendue par `getClimatDataCommune` (drias-json.ts).
export type GwlScenarios = Record<string, { h: string; v: Record<string, number> }>;

// L'horizon de décision : +2,7 °C en France, soit 2050. C'est aussi celui de l'index du comparateur, et
// les deux moteurs n'ont pas le droit de lire des horizons différents.
export const CLIMAT_HORIZON = "gwl20";
export const CLIMAT_HORIZON_LABEL = "2050";

// LA PÉRIODE DE RÉFÉRENCE EST DATÉE, pas évoquée. DRIAS l'écrit noir sur blanc : « les changements
// correspondent à des écarts pour les températures et des écarts relatifs pour les précipitations PAR
// RAPPORT À LA PÉRIODE DE RÉFÉRENCE 1976-2005 ». « La fin du XXe siècle » était une paraphrase : elle
// laissait croire que la période s'arrêtait en 2000, et surtout elle n'était pas OPPOSABLE. Un lecteur
// doit pouvoir retrouver le chiffre à la source.
export const CLIMAT_REFERENCE_LABEL = "sur la période de référence 1976-2005";

// ATTENTION AU PIÈGE DES DEUX BASES, et il est vicieux parce que les deux chiffres sont vrais.
// Le niveau TRACC de l'horizon 2050 (« +2,7 °C en France ») est mesuré par rapport au DÉBUT DU XXe SIÈCLE
// (1900-1930). Les valeurs locales, elles, sont comparées à 1976-2005, période où la France s'était DÉJÀ
// réchauffée : l'écart n'y est donc que de +2,1 °C. Écrire « +2,7 °C » à côté d'une valeur locale
// laisserait croire que cet écart-là est celui qu'on lit dans le tableau. (Table DRIAS : global +1,5 / +2 /
// +3 °C = France +2 / +2,7 / +4 °C vs 1900-1930 = +1,4 / +2,1 / +3,4 °C vs 1976-2005.)
export const TRACC_HORIZON_2050 = {
  franceVsPreindustriel: 2.7, // le chiffre de la TRACC, celui que le lecteur a vu dans la presse
  franceVsReference: 2.1, // celui qui correspond aux valeurs de ce tableau
} as const;

export const CLIMAT_CONVENTIONS_VERSION = "clim-conv-1";

// LE MAPPING DES CLÉS DRIAS, GRAVÉ. Deux indicateurs voisins mal branchés (les jours > 30 °C au lieu des
// jours > 35 °C) produiraient un chiffre plausible et faux, que rien ne trahirait à l'écran.
export type ClimatMetricKey = "joursTresChauds" | "nuitsTropicales" | "joursFeu" | "pluieMax24h";

export type ClimatMetricDefinition = {
  absoluteKey: string; // la valeur PROJETÉE à l'horizon
  anomalyKey: string; // l'écart à la période de référence (c'est lui qui restitue la référence)
  // LE PIÈGE QUI A FAILLI PASSER. DRIAS exprime les écarts de TEMPÉRATURE en absolu (des jours, des °C)
  // et ceux de PRÉCIPITATION en RELATIF (une fraction : 0,11 = +11 %). Soustraire 0,11 à 74 mm donnait
  // « les pluies passeraient de 74 mm à 74 mm » : un constat faux, absurde, et parfaitement silencieux.
  // Vérifié sur les 35 006 communes : ARRx1d_yr va de -0,04 à +0,25, quand ATR_yr va de 0 à 47,6 jours.
  anomalyKind: "absolute" | "relative";
  threshold: number; // la convention de SIGNALEMENT futur•e (pas une limite officielle de danger)
  unit: "jours" | "mm";
  // LE NOM DU COMPTE, distinct de l'unité. Trois métriques se comptent en « jours » (unit), mais une chip
  // isolée doit dire « 44 NUITS » pour les nuits tropicales : « unit » ne suffit pas à trancher jour/nuit,
  // et fmtClimat, aveugle à cette distinction, rendait « 44 jours » (le bug d'unité). Absent pour la pluie
  // (mm), dont l'unité EST le nom.
  countNoun?: "jour" | "nuit";
};

export const CLIMAT_METRICS: Record<ClimatMetricKey, ClimatMetricDefinition> = {
  // 9,6 % des communes (médiane nationale : 3,6 j/an à l'horizon 2050 ; maximum : 22,7).
  joursTresChauds: { absoluteKey: "NORTX35D_yr", anomalyKey: "ATX35D_yr", anomalyKind: "absolute", threshold: 8, unit: "jours", countNoun: "jour" },
  // 12,5 % des communes. Une nuit qui ne descend pas sous 20 °C empêche la récupération nocturne : c'est
  // le marqueur sanitaire des canicules, davantage que le pic de l'après-midi.
  nuitsTropicales: { absoluteKey: "NORTR_yr", anomalyKey: "ATR_yr", anomalyKind: "absolute", threshold: 25, unit: "jours", countNoun: "nuit" },
  // 10,4 % des communes. L'indice forêt-météo mesure un DANGER MÉTÉOROLOGIQUE favorable aux incendies, pas
  // la probabilité qu'un incendie survienne : la phrase ne doit pas promettre plus que la donnée.
  joursFeu: { absoluteKey: "NORIFM40_yr", anomalyKey: "AIFM40_yr", anomalyKind: "absolute", threshold: 9, unit: "jours", countNoun: "jour" },
  // 10,2 % des communes (médiane : 41 mm ; p90 : 65 mm).
  // L'anomalie est RELATIVE (+11 % en médiane) : la référence se retrouve en DIVISANT, pas en soustrayant.
  pluieMax24h: { absoluteKey: "NORRx1d_yr", anomalyKey: "ARRx1d_yr", anomalyKind: "relative", threshold: 65, unit: "mm" },
};

export type ClimatAxe = {
  reference: number | null; // fin du XXe siècle, RECONSTRUITE. `null` = non reconstructible.
  projete: number | null; // à l'horizon 2050. `null` = la décision ne peut pas se prendre.
  notable: boolean; // projete >= seuil. Un projete ABSENT n'est jamais « non notable ».
  threshold: number;
  unit: "jours" | "mm";
  countNoun?: "jour" | "nuit"; // hérité de la définition : porte « nuit » pour les nuits tropicales.
};

export type ClimatFacts = {
  joursTresChauds: ClimatAxe;
  nuitsTropicales: ClimatAxe;
  joursFeu: ClimatAxe;
  pluieMax24h: ClimatAxe;
};

const HORIZONS = ["gwl15", "gwl20", "gwl30"];

function fini(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v);
}

// LA RÉFÉRENCE, RECONSTRUITE. DRIAS ne la donne pas en colonne, mais l'anomalie la restitue à chaque
// horizon (même période de référence), d'où la médiane : elle lisse le bruit de la médiane des modèles.
//
// On ne retient QUE les couples dont la valeur ET l'anomalie sont finies. Un couple boiteux donnerait une
// référence fausse, et personne ne le verrait : le chiffre resterait plausible.
export function reconstructReference(
  sc: GwlScenarios | null | undefined,
  absoluteKey: string,
  anomalyKey: string,
  anomalyKind: "absolute" | "relative" = "absolute",
): number | null {
  const refs = HORIZONS.map((h) => {
    const p = sc?.[h]?.v?.[absoluteKey];
    const a = sc?.[h]?.v?.[anomalyKey];
    if (!fini(p) || !fini(a)) return null;
    // Écart ABSOLU (jours, °C) : on soustrait. Écart RELATIF (une fraction) : on divise. Une division par
    // zéro ou par un négatif rendrait une référence absurde : on refuse plutôt que d'inventer.
    if (anomalyKind === "absolute") return p - a;
    return 1 + a > 0 ? p / (1 + a) : null;
  })
    .filter((x): x is number => x != null)
    .sort((a, b) => a - b);
  return refs.length ? refs[Math.floor((refs.length - 1) / 2)]! : null;
}

function axe(sc: GwlScenarios | null | undefined, def: ClimatMetricDefinition): ClimatAxe {
  const projeteRaw = sc?.[CLIMAT_HORIZON]?.v?.[def.absoluteKey];
  const projete = fini(projeteRaw) ? projeteRaw : null;
  return {
    reference: reconstructReference(sc, def.absoluteKey, def.anomalyKey, def.anomalyKind),
    projete,
    // LA DÉCISION SE PREND SUR LA VALEUR PROJETÉE, jamais sur la référence reconstruite. Et une valeur
    // ABSENTE n'est pas une exposition faible : `notable` reste faux, mais la règle, elle, saura qu'elle
    // n'a rien lu (projete === null) et rendra `uncertain` plutôt que `satisfied`.
    notable: projete != null && projete >= def.threshold,
    threshold: def.threshold,
    unit: def.unit,
    ...(def.countNoun ? { countNoun: def.countNoun } : {}),
  };
}

// `null` = aucun axe n'a de valeur projetée : il n'y a rien à examiner, et la règle rendra `uncertain`.
export function buildClimatFacts(sc: GwlScenarios | null | undefined): ClimatFacts | null {
  const facts: ClimatFacts = {
    joursTresChauds: axe(sc, CLIMAT_METRICS.joursTresChauds),
    nuitsTropicales: axe(sc, CLIMAT_METRICS.nuitsTropicales),
    joursFeu: axe(sc, CLIMAT_METRICS.joursFeu),
    pluieMax24h: axe(sc, CLIMAT_METRICS.pluieMax24h),
  };
  const rienDuTout = Object.values(facts).every((a) => a.projete == null);
  return rienDuTout ? null : facts;
}

// ── Lot D : le confort thermique futur (chaleur), classé ─────────────────────────
//
// La chaleur est jugée sur DEUX axes (jours au-dessus de 35 °C, nuits tropicales), chacun avec son seuil de
// signalement. UNE seule mesure défavorable suffit (`trigger: "any"`). Le classifieur PUR rend le verdict et,
// pour un cas défavorable, le fondement multivarié (quel axe a déclenché, quels seuils, quel horizon) — pas
// une valeur unique aplatie. `under_threshold` exige les DEUX axes lus (un axe absent n'est pas une bonne
// nouvelle) ; sinon `uncertain`. La branche FAVORABLE (alignment) est différée : elle exige un rang de
// trajectoire qui n'existe pas encore (lot D, increment 2).
import type { ClimateThresholdBasis, DecisionAction } from "./decision-fact.ts";

// LE RENVOI AU LOGEMENT, PARTAGÉ. Un mismatch de chaleur ne porte AUCUNE action (le constat est établi) :
// le contrôle du confort d'été se joue au grain du bâtiment, et c'est une COMPOSITION qui le restaure
// (lot D, Task 2). Cette action vivait inline dans ruleChaleur ; extraite ici, elle est la seule source de
// vérité, utilisée par les patrons de composition climatique. Avec adresse : « Regardez comment le logement
// tient l'été » ; sans adresse : la seule manœuvre qui se fait DANS le produit, sur un ton d'invitation.
export function summerComfortAction(hasAddress: boolean): DecisionAction {
  return hasAddress
    ? {
        type: "verifier_sur_place",
        label: "Regardez comment le logement tient l'été",
        detail: "L'orientation, l'étage, l'épaisseur des murs, les protections solaires et la possibilité d'ouvrir la nuit pèsent sur l'inconfort ressenti.",
      }
    : { type: "renseigner_adresse", label: "Renseignez votre adresse pour descendre au niveau du logement" };
}

// LE RENVOI AU TERRAIN, PARTAGÉ (lot feu). Même rôle que `summerComfortAction` pour la chaleur : un
// mismatch de danger d'incendie ne porte AUCUNE action (le constat est établi), et c'est une COMPOSITION
// qui restaure ce geste. L'action vivait inline dans ruleFeu ; extraite ici, elle devient la source unique,
// partagée par la règle ambiante et par le patron de composition.
//
// Sans adresse, le geste change de nature : on ne peut rien dire des abords d'un terrain qu'on ne connaît
// pas. On invite alors à la seule manœuvre qui se fait DANS le produit, exactement comme pour la chaleur.
export function wildfireExposureAction(hasAddress: boolean): DecisionAction {
  return hasAddress
    ? {
        type: "verifier_sur_place",
        label: "Regardez la végétation autour du terrain",
        detail: "L'obligation de débroussaillement, l'accès des secours et les matériaux de la toiture pèsent sur ce qu'un départ de feu proche peut atteindre.",
      }
    : { type: "renseigner_adresse", label: "Renseignez votre adresse pour descendre au niveau du terrain" };
}

// LE DANGER D'INCENDIE, CLASSIFIÉ (lot feu). Même forme que `classifyClimateComfort`, mais MONO-AXE : le
// danger météorologique de feu se lit sur le seul indice forêt-météo (jours où l'IFM dépasse 40). Deux
// fonctions plutôt qu'une paramétrée : la chaleur croise deux axes avec un déclencheur « any » qui n'a pas
// de sens ici, et surtout ce sont deux phénomènes que le lecteur peut prioriser séparément.
//
// LE MÊME PIÈGE EST TENU : une donnée absente n'est jamais une bonne nouvelle (`uncertain`, pas
// `under_threshold`). Un indice non lu ne prouve pas un territoire épargné.
export function classifyWildfireDanger(
  climat: ClimatFacts,
): { verdict: "unfavorable" | "under_threshold" | "uncertain"; basis: ClimateThresholdBasis | null } {
  const axe = climat.joursFeu;
  if (axe.projete == null) return { verdict: "uncertain", basis: null };
  if (!axe.notable) return { verdict: "under_threshold", basis: null };
  return {
    verdict: "unfavorable",
    basis: {
      kind: "climate_threshold", horizon: 2050, referencePeriod: "1976-2005",
      conventionId: CLIMAT_CONVENTIONS_VERSION, trigger: "any",
      measures: [{
        key: "fire_weather_days", projectedValue: axe.projete, threshold: axe.threshold,
        unit: "days", isUnfavorable: true,
      }],
    },
  };
}

export function classifyClimateComfort(
  climat: ClimatFacts,
): { verdict: "unfavorable" | "under_threshold" | "uncertain"; basis: ClimateThresholdBasis | null } {
  const axes = [
    { key: "days_over_35" as const, unit: "days" as const, axe: climat.joursTresChauds },
    { key: "tropical_nights" as const, unit: "nights" as const, axe: climat.nuitsTropicales },
  ];
  // On ne met en mesure que les axes RÉELLEMENT lus (projete fini) : une valeur absente n'invente pas de mesure.
  const measures = axes
    .filter((x) => x.axe.projete != null)
    .map((x) => ({
      key: x.key, projectedValue: x.axe.projete!, threshold: x.axe.threshold, unit: x.unit, isUnfavorable: x.axe.notable,
    }));

  if (measures.some((m) => m.isUnfavorable)) {
    return {
      verdict: "unfavorable",
      basis: {
        kind: "climate_threshold", horizon: 2050, referencePeriod: "1976-2005",
        conventionId: CLIMAT_CONVENTIONS_VERSION, trigger: "any", measures,
      },
    };
  }
  // Aucune mesure défavorable : « sous le seuil » seulement si les DEUX axes ont été lus ; sinon on n'a pas tout vu.
  const complet = climat.joursTresChauds.projete != null && climat.nuitsTropicales.projete != null;
  return { verdict: complet ? "under_threshold" : "uncertain", basis: null };
}

// ── Le texte ─────────────────────────────────────────────────────────────────

// LE COMPTE AVEC SON UNITÉ, pour une chip de preuve ISOLÉE : « 44 nuits », « 9 jours », « 78 mm ». Une
// phrase porte l'unité dans son SUJET (« Les nuits tropicales ») et n'écrit que le nombre ; une chip, hors
// phrase, doit la dire. Et pour une nuit tropicale, ce n'est pas « jours » : `countNoun` tranche jour/nuit
// là où `unit` (« jours ») les confond (le bug que fmtClimat, aveugle, laissait passer).
export function fmtClimatCount(v: number, a: ClimatAxe): string {
  const r = Math.round(v);
  if (a.unit === "mm") return `${r} mm`;
  const noun = a.countNoun ?? "jour";
  return `${r} ${r <= 1 ? noun : `${noun}s`}`;
}

// LA TRAJECTOIRE, DITE HONNÊTEMENT. La référence est la FIN DU XXe SIÈCLE, jamais « aujourd'hui ». Quand
// elle n'est pas reconstructible, on ne fabrique pas de comparaison : on donne la valeur projetée seule.
//
// LE SUJET PORTE L'UNITÉ. « Les jours au-dessus de 35 °C » dit déjà « jours » : la trajectoire n'écrit que
// le nombre (« passeraient de 2 par an à 9 »), sinon « jours » revient trois fois dans une phrase. Le cumul
// de pluie garde « mm » : son sujet (« les épisodes les plus intenses ») ne porte pas l'unité. « Par an » ne
// vaut QUE pour un compte de jours : « 68 mm par an » ferait passer un épisode de 24 heures pour une
// pluviométrie annuelle dérisoire.
export function trajectoirePhrase(
  a: ClimatAxe,
  sujet: string,
  // CADRE HÉRITÉ : quand une phrase enchaîne DEUX trajectoires (les jours très chauds, puis les nuits
  // tropicales), la seconde hérite du cadre posé par la première. On compresse : « de {ref} à {proj} par
  // an », sans redire « sur la période de référence 1976-2005 » ni un second « à l'horizon 2050 ». La
  // période reste dite une fois, entièrement, sur la première trajectoire, et elle reste opposable.
  opts?: { heriteCadre?: boolean },
): string {
  if (a.projete == null) return "";
  // Le nombre NU pour un compte de jours/nuits (le sujet porte l'unité) ; « X mm » pour un cumul de pluie.
  const num = (v: number): string => (a.unit === "mm" ? `${Math.round(v)} mm` : String(Math.round(v)));
  const cadence = a.unit === "jours" ? " par an" : "";
  const proj = num(a.projete);
  if (opts?.heriteCadre) {
    return a.reference == null
      ? `${sujet} atteindraient ${proj}${cadence}`
      : `${sujet} passeraient de ${num(a.reference)} à ${proj}${cadence}`;
  }
  if (a.reference == null) {
    return `${sujet} atteindraient ${proj}${cadence} à l'horizon ${CLIMAT_HORIZON_LABEL}`;
  }
  return `${sujet} passeraient de ${num(a.reference)}${cadence} ${CLIMAT_REFERENCE_LABEL} à ${proj} à l'horizon ${CLIMAT_HORIZON_LABEL}`;
}
