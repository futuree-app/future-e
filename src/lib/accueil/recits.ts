// LES RÉCITS DE L'ACCUEIL (FUT-37). Module PUR : aucune I/O, aucun JSX, imports relatifs (testable
// sous `node --test`, lisible par le client).
//
// LA RÈGLE : une phrase ne conclut que sur ce que mesure son entrée. Chaque carte porte donc d'abord
// son FAIT (la grandeur exacte, l'horizon, la référence), puis, au plus, une lecture qui reste dans la
// même grandeur et une limite qui nomme ce que la donnée ne mesure pas. Avant FUT-37, les phrases
// étaient les mêmes pour toutes les communes de France à un horizon donné (Chamonix, 0 jour au-dessus de
// 35 °C, recevait « plusieurs semaines par an »), et le chiffre était calculé puis jeté.
//
// TROIS FAITS DU DOSSIER S'APPLIQUENT ICI SANS ÊTRE RECOPIÉS (src/lib/decision/climat-facts.ts) :
//   1. DRIAS n'expose aucune valeur présente. L'onglet qui disait « Aujourd'hui · données actuelles »
//      lisait en réalité la projection 2030 (gwl15). Il devient la période de référence 1976-2005,
//      reconstruite par `reconstructReference` (projeté moins écart), la brique du dossier.
//   2. Les horizons et leurs niveaux viennent de src/lib/horizons.ts, jamais d'une table locale (l'accueil
//      envoyait à /qna les valeurs de 2100 sous la date « 2050 »).
//   3. Un nombre de jours dans l'année ne dit rien de la durée ni de la continuité d'une période.
//
// Les risques recensés par l'État (Géorisques, GASPAR) sont des faits ACTUELS et COMMUNAUX : leur texte
// ne change pas avec l'horizon, et aucune carte de risque ne naît d'une simple catégorie (`littoral`).
//
// Ce module ne choisit PAS « le meilleur fait » de la commune : l'assemblage des cartes reste celui
// d'avant FUT-37. Le repositionnement du haut de l'accueil relève de FUT-50.
import { HORIZONS, type HorizonKey } from "../horizons.ts";
import { reconstructReference, CLIMAT_REFERENCE_LABEL, type GwlScenarios } from "../decision/climat-facts.ts";
import { aCommune, deCommune } from "../typography.ts";

// ── Horizons ─────────────────────────────────────────────────────────────────────────────────

/** L'onglet « reference » est la période 1976-2005 reconstruite ; les trois autres sont les paliers DRIAS. */
export type HorizonAccueil = "reference" | "2030" | "2050" | "2100";

export const PERIODE_REFERENCE = "1976-2005";

export const HORIZONS_ACCUEIL: readonly { key: HorizonAccueil; label: string; mention: string }[] = [
  { key: "reference", label: "1976–2005", mention: "référence 1976–2005 · reconstruite depuis DRIAS-TRACC" },
  ...HORIZONS.map((h) => ({
    key: h.annee as HorizonAccueil,
    label: h.annee,
    mention: `projection DRIAS-TRACC · ${h.france} en France`,
  })),
];

/** Le scénario DRIAS d'un onglet. `null` pour la référence : elle n'est la valeur d'aucun scénario. */
export function gwlDeHorizon(h: HorizonAccueil): HorizonKey | null {
  return HORIZONS.find((x) => x.annee === h)?.key ?? null;
}

// ── Entrées ──────────────────────────────────────────────────────────────────────────────────

/** La forme que l'accueil construit à partir de /drias : scénario → indicateur → { value_numeric }. */
export type Indicators = Record<string, Record<string, { value_numeric?: number | null } | undefined> | undefined>;
export type GeorisquesFlags = Partial<Record<"flood" | "marineSubmersion" | "landslide" | "clay" | "wildfire" | "storm" | "seismic", boolean>>;
export type GeorisquesAccueil = { flags?: GeorisquesFlags | null } | null | undefined;

function fini(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v);
}

function valeur(ind: Indicators, gwl: string, cle: string): number | null {
  const v = ind?.[gwl]?.[cle]?.value_numeric;
  return fini(v) ? v : null;
}

function enScenarios(ind: Indicators): GwlScenarios {
  const out: GwlScenarios = {};
  for (const [gwl, parCle] of Object.entries(ind ?? {})) {
    const v: Record<string, number> = {};
    for (const [cle, x] of Object.entries(parCle ?? {})) if (fini(x?.value_numeric)) v[cle] = x!.value_numeric!;
    out[gwl] = { h: gwl, v };
  }
  return out;
}

// ── Formats ──────────────────────────────────────────────────────────────────────────────────

const FR1 = new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

/** Une température, au dixième, avec le vrai signe moins. */
export function formatTemperature(t: number): string {
  return `${FR1.format(t).replace("-", "−")} °C`;
}

type Compte = { singulier: string; pluriel: string; feminin: boolean };
const JOURNEE: Compte = { singulier: "jour", pluriel: "jours", feminin: false };
const NUIT: Compte = { singulier: "nuit", pluriel: "nuits", feminin: true };

// Les trois paliers d'écriture d'un compte. Ce ne sont pas des seuils d'interprétation : « moins d'une
// journée » EST la valeur 0,4 écrite en français, sans rien en conclure.
type Palier = "aucun" | "moins-d-un" | number;
function palier(n: number): Palier {
  if (n < 0.05) return "aucun";
  if (n < 1) return "moins-d-un";
  return Math.round(n);
}

/** « 14 jours », « moins d'une journée », « aucune nuit ». */
export function formatCompte(n: number, c: Compte = JOURNEE): string {
  const p = palier(n);
  if (p === "aucun") return c.feminin ? `aucune ${c.singulier}` : "aucune journée";
  if (p === "moins-d-un") return c.feminin ? `moins d'une ${c.singulier}` : "moins d'une journée";
  return `${p} ${p > 1 ? c.pluriel : c.singulier}`;
}

/** Le même compte, sans son nom, pour la comparaison : « contre 3 », « contre moins d'une ». */
function formatCompteNu(n: number): string {
  const p = palier(n);
  if (p === "aucun") return "aucune";
  if (p === "moins-d-un") return "moins d'une";
  return String(p);
}

const majuscule = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** « …, contre 3 sur 1976-2005 » ou « …, comme sur 1976-2005 » quand l'écriture ne distingue pas. */
function comparaison(v: number, ref: number | null): string {
  if (ref == null) return "";
  if (palier(v) === palier(ref)) return `, comme sur ${PERIODE_REFERENCE}`;
  return `, contre ${formatCompteNu(ref)} sur ${PERIODE_REFERENCE}`;
}

// ── La carte ─────────────────────────────────────────────────────────────────────────────────

// DEUX NIVEAUX DE LECTURE. La carte AFFICHE un titre (la grandeur), une valeur forte, une comparaison
// courte et sa source. Ce que l'interface dit déjà n'y est pas répété : l'horizon est celui de l'onglet
// sélectionné, la commune celle de la page. Le fait en toutes lettres, la lecture et la limite vivent au
// second niveau (« Données et limites ») : ils sont exacts, mais une accueil n'est pas un rapport.
export type CarteApercu = {
  /** Stable, pour les tests et le dédoublonnage. */
  cle: string;
  titre: string;
  /** La valeur forte, affichée en grand : « 14 j/an », « < 1 j/an », « −1,8 °C », « Risque recensé par l'État ». */
  valeur?: string;
  /** La comparaison courte : « +11 j vs 1976–2005 », « identique à 1976–2005 ». */
  comparaison?: string;
  /** Un second fait court, juxtaposé sans raccord (« Feu de forêt recensé par l'État »). */
  complement?: string;
  /** Le fait en toutes lettres (second niveau ; seul niveau des cartes sans valeur). */
  fait: string;
  /** Une lecture qui reste dans la grandeur mesurée (second niveau). */
  lecture?: string;
  /** Ce que la donnée ne mesure pas (second niveau). */
  limite?: string;
  source: string;
  col: string;
};

/** La période de référence telle que l'interface l'écrit (tiret demi-cadratin). */
export const PERIODE_REFERENCE_AFFICHEE = "1976–2005";

/** « 14 j/an », « < 1 j/an », « 0 j/an » ; « 43 nuits/an », « < 1 nuit/an ». */
export function valeurCompacte(n: number, c: Compte = JOURNEE): string {
  const p = palier(n);
  const u = c.feminin ? (p === "aucun" || p === "moins-d-un" || p === 1 ? "nuit" : "nuits") : "j";
  if (p === "aucun") return `0 ${u}/an`;
  if (p === "moins-d-un") return `< 1 ${u}/an`;
  return `${p} ${u}/an`;
}

/** « +11 j vs 1976–2005 », « identique à 1976–2005 », « réf. 1976–2005 : < 1 ». */
export function comparaisonCompacte(v: number, ref: number | null, c: Compte = JOURNEE): string | undefined {
  if (ref == null) return undefined;
  const pv = palier(v);
  const pr = palier(ref);
  if (pv === pr) return `identique à ${PERIODE_REFERENCE_AFFICHEE}`;
  if (typeof pv === "number" && typeof pr === "number") {
    const d = pv - pr;
    const u = c.feminin ? (Math.abs(d) > 1 ? "nuits" : "nuit") : "j";
    return `${d > 0 ? "+" : "−"}${Math.abs(d)} ${u} vs ${PERIODE_REFERENCE_AFFICHEE}`;
  }
  return `réf. ${PERIODE_REFERENCE_AFFICHEE} : ${pr === "aucun" ? "0" : pr === "moins-d-un" ? "< 1" : pr}`;
}

const COL = { rouge: "var(--red)", bleu: "var(--blue)", vert: "var(--green)", violet: "var(--violet)", orange: "var(--orange)" };

const SOURCE_DRIAS = "DRIAS · Météo-France";
const SOURCE_GASPAR = "Géorisques · fait actuel";

// EXPORTÉS POUR L'APERÇU DU PAYWALL TERRITOIRE (FUT-30), qui formule ses faits climatiques avec ces
// définitions et `carteCompte`, sans second vocabulaire ni second arrondi. Aucun changement de comportement.
export type IndicateurCompte = {
  cle: string;
  absolu: string;
  ecart: string;
  compte: Compte;
  titre: string;
  /** La phrase de fait, valeur et comparaison déjà écrites. */
  fait: (compte: string, horizon: string, comparaison: string) => string;
  faitReference: (compte: string) => string;
  lecture?: (v: number) => string | undefined;
  limite?: string;
  col: string;
};

export const CHALEUR: IndicateurCompte = {
  cle: "chaleur",
  absolu: "NORTX35D_yr",
  ecart: "ATX35D_yr",
  compte: JOURNEE,
  titre: "Jours > 35 °C",
  fait: (compte, horizon, comp) => `${majuscule(compte)} par an à l'horizon ${horizon}${comp}.`,
  faitReference: (compte) => `${majuscule(compte)} par an ${CLIMAT_REFERENCE_LABEL}.`,
  col: COL.rouge,
};

export const NUITS: IndicateurCompte = {
  cle: "nuits",
  absolu: "NORTR_yr",
  ecart: "ATR_yr",
  compte: NUIT,
  titre: "Nuits tropicales",
  fait: (compte, horizon, comp) =>
    `${majuscule(compte)} par an où la température ne descend pas sous 20 °C, à l'horizon ${horizon}${comp}.`,
  faitReference: (compte) => `${majuscule(compte)} par an où la température ne descend pas sous 20 °C, ${CLIMAT_REFERENCE_LABEL}.`,
  // La nuit tropicale est le marqueur sanitaire des fortes chaleurs : c'est sa définition, pas une
  // extrapolation. La lecture ne s'écrit que s'il y a des nuits à lire.
  lecture: (v) => (v >= 1 ? "Ce sont des nuits sans fraîcheur, où le corps récupère mal de la chaleur du jour." : undefined),
  col: COL.rouge,
};

export const FEUX: IndicateurCompte = {
  cle: "feux",
  absolu: "NORIFM40_yr",
  ecart: "AIFM40_yr",
  compte: JOURNEE,
  titre: "Météo propice aux feux",
  fait: (compte, horizon, comp) =>
    `${majuscule(compte)} par an de danger météorologique élevé pour les feux (indice forêt-météo ≥ 40), à l'horizon ${horizon}${comp}.`,
  faitReference: (compte) =>
    `${majuscule(compte)} par an de danger météorologique élevé pour les feux (indice forêt-météo ≥ 40), ${CLIMAT_REFERENCE_LABEL}.`,
  limite:
    "Cet indice décrit des conditions météorologiques favorables aux feux ; il ne mesure ni la végétation ni la probabilité qu'un incendie se déclare.",
  col: COL.rouge,
};

// Le SWI est modélisé : « environ » devant un nombre, jamais devant « moins d'une journée ».
const environ = (compte: string) => (/^\d/.test(compte) ? `Environ ${compte}` : majuscule(compte));

const SOLS_SECS: IndicateurCompte = {
  cle: "sols-secs",
  absolu: "NORSWI04_yr",
  ecart: "ASWI04_yr",
  compte: JOURNEE,
  titre: "Sols secs",
  fait: (compte, horizon, comp) => `${environ(compte)} par an de sol sec, à l'horizon ${horizon}${comp}.`,
  faitReference: (compte) => `${environ(compte)} par an de sol sec, ${CLIMAT_REFERENCE_LABEL}.`,
  limite:
    "Indice d'humidité des sols (SWI) inférieur à 0,4 : il décrit l'eau disponible pour la végétation. Il ne mesure ni les nappes, ni les rivières, ni l'eau du robinet.",
  col: COL.bleu,
};

export function carteCompte(def: IndicateurCompte, ind: Indicators, horizon: HorizonAccueil): CarteApercu | null {
  const ref = reconstructReference(enScenarios(ind), def.absolu, def.ecart);
  const gwl = gwlDeHorizon(horizon);
  let fait: string;
  let lecture: string | undefined;
  let valeurAffichee: string;
  let comp: string | undefined;
  if (gwl == null) {
    if (ref == null) return null; // pas de référence reconstructible : la carte se tait plutôt que d'inventer
    fait = def.faitReference(formatCompte(ref, def.compte));
    lecture = def.lecture?.(ref);
    valeurAffichee = valeurCompacte(ref, def.compte);
    comp = `période de référence ${PERIODE_REFERENCE_AFFICHEE}`;
  } else {
    const v = valeur(ind, gwl, def.absolu);
    if (v == null) return null;
    fait = def.fait(formatCompte(v, def.compte), horizon, comparaison(v, ref));
    lecture = def.lecture?.(v);
    valeurAffichee = valeurCompacte(v, def.compte);
    comp = comparaisonCompacte(v, ref, def.compte);
  }
  return {
    cle: def.cle,
    titre: def.titre,
    valeur: valeurAffichee,
    ...(comp ? { comparaison: comp } : {}),
    fait,
    ...(lecture ? { lecture } : {}),
    ...(def.limite ? { limite: def.limite } : {}),
    source: SOURCE_DRIAS,
    col: def.col,
  };
}

/** Température moyenne de l'hiver. Rien sur la neige : futur•e ne la mesure pas. */
function carteHivers(ind: Indicators, horizon: HorizonAccueil): CarteApercu | null {
  const ref = reconstructReference(enScenarios(ind), "NORTMm_seas_DJF", "ATMm_seas_DJF");
  const gwl = gwlDeHorizon(horizon);
  const base = { cle: "hivers", titre: "Hivers · température moyenne", source: SOURCE_DRIAS, col: COL.bleu };
  if (gwl == null) {
    if (ref == null) return null;
    return {
      ...base,
      valeur: formatTemperature(ref),
      comparaison: `période de référence ${PERIODE_REFERENCE_AFFICHEE}`,
      fait: `Température moyenne de l'hiver : ${formatTemperature(ref)} ${CLIMAT_REFERENCE_LABEL}.`,
    };
  }
  const v = valeur(ind, gwl, "NORTMm_seas_DJF");
  if (v == null) return null;
  const comp = ref == null ? "" : `, contre ${formatTemperature(ref)} sur ${PERIODE_REFERENCE}`;
  const ecart = ref == null ? null : Math.round((v - ref) * 10) / 10;
  const ecartAffiche =
    ecart == null ? undefined
      : ecart === 0 ? `identique à ${PERIODE_REFERENCE_AFFICHEE}`
        : `${ecart > 0 ? "+" : "−"}${formatTemperature(Math.abs(ecart))} vs ${PERIODE_REFERENCE_AFFICHEE}`;
  return {
    ...base,
    valeur: formatTemperature(v),
    ...(ecartAffiche ? { comparaison: ecartAffiche } : {}),
    fait: `Température moyenne de l'hiver : ${formatTemperature(v)} à l'horizon ${horizon}${comp}.`,
    ...(ecart != null && ecart > 0 ? { lecture: `Des hivers plus doux de ${formatTemperature(ecart)}.` } : {}),
  };
}

// ── Risques recensés (Géorisques) : faits actuels, invariants par horizon ───────────────────

const LIMITE_RECENSEMENT =
  "Ce recensement ne dit pas quelle partie de la commune est concernée ni comment elle évoluera. L'exposition d'une adresse se vérifie dans le dossier Logement.";

/** Le premier risque recensé, dans l'ordre d'avant FUT-37. Aucun paramètre d'horizon : il n'en a pas. */
export function carteRisqueRecense(georisques: GeorisquesAccueil): CarteApercu | null {
  const f = georisques?.flags;
  if (!f) return null;
  const base = { source: SOURCE_GASPAR, limite: LIMITE_RECENSEMENT, valeur: "Risque recensé par l'État" };
  if (f.marineSubmersion) {
    return { ...base, cle: "submersion", titre: "Submersion marine", fait: "L'État recense un risque de submersion marine sur la commune.", col: COL.bleu };
  }
  if (f.flood) {
    return { ...base, cle: "inondation", titre: "Inondation", fait: "L'État recense un risque d'inondation sur la commune.", col: COL.bleu };
  }
  if (f.clay) {
    return {
      ...base,
      cle: "argiles",
      titre: "Argiles · tassements différentiels",
      fait: "L'État recense un risque de tassements différentiels, liés aux sols argileux, sur la commune.",
      limite:
        "Ce recensement ne dit pas quelle partie de la commune est concernée. L'effet sur un bâtiment dépend du sol de la parcelle et des fondations : il se vérifie à l'adresse, dans le dossier Logement.",
      col: COL.orange,
    };
  }
  if (f.landslide) {
    return { ...base, cle: "terrain", titre: "Mouvements de terrain", fait: "L'État recense un risque de mouvement de terrain sur la commune.", col: COL.orange };
  }
  return null;
}

// ── Assemblage (inchangé dans son principe : FUT-50 le repensera) ───────────────────────────

// Hash déterministe d'un nom de commune → varie le mix de cartes d'une commune à l'autre sans
// flicker (pas de Math.random, stable au re-render et au SSR).
function hashName(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h;
}

/**
 * Les cartes climat d'une commune, dans l'ordre d'avant FUT-37 (chaleur, feux, sols secs, hivers,
 * nuits, risque recensé). Les récits sans base fiable ont disparu : pluies, vigne, air, immobilier,
 * qualité des sols, et la submersion déduite de la seule catégorie `littoral`.
 *
 * `rural_viticole` et `tension_hydrique_connue` (catégories saisies à la main, sans donnée derrière)
 * ne déclenchent plus rien ici.
 */
export function cartesClimat(
  categories: readonly string[],
  ind: Indicators,
  georisques: GeorisquesAccueil,
  horizon: HorizonAccueil,
): CarteApercu[] {
  const has = (c: string) => categories.includes(c);
  const out: (CarteApercu | null)[] = [];
  out.push(carteCompte(CHALEUR, ind, horizon));
  if (has("mediterranee") || has("rural_forestier")) {
    const feux = carteCompte(FEUX, ind, horizon);
    // Un second fait, actuel et administratif, juxtaposé SANS raccord : l'indice météo ne « confirme »
    // pas le recensement, et le recensement ne « prouve » pas l'indice.
    if (feux && georisques?.flags?.wildfire) {
      feux.complement = "Feu de forêt recensé par l'État (Géorisques)";
      feux.lecture = "Par ailleurs, l'État recense un risque de feu de forêt sur la commune (Géorisques).";
    }
    out.push(feux);
  }
  if (has("rural_agricole")) out.push(carteCompte(SOLS_SECS, ind, horizon));
  if (has("montagne")) out.push(carteHivers(ind, horizon));
  out.push(carteCompte(NUITS, ind, horizon));
  out.push(carteRisqueRecense(georisques));
  return out.filter((c): c is CarteApercu => c != null);
}

// ── Mobilité : une MESURE, jamais une catégorie (FUT-185) ───────────────────────────────────
//
// Avant FUT-185, la carte « Mobilité » disait « le quotidien dépend largement de la voiture » dès qu'une
// commune portait l'une de six catégories (densité moyenne sous 1 500 hab/km², couvert agricole ou
// forestier, montagne…), et « transports et courtes distances » sinon, les deux sous la source « INSEE
// MOBPRO », qu'aucune ne lisait. Nîmes, Aix-en-Provence ou Quimper recevaient la première ; Chamonix la
// recevait par sa seule altitude. La carte porte désormais la part réelle des trajets domicile-travail
// faits en voiture, ou n'existe pas.

/** La part des actifs en emploi d'une commune qui vont travailler en voiture (RP 2022, MOBPRO), de 0 à 1. */
export type MobiliteAccueil = { partVoitureDomicileTravail: number | null } | null | undefined;

export const SOURCE_MOBPRO = "Insee · recensement 2022 (MOBPRO)";

const LIMITE_MOBPRO =
  "Ce chiffre ne couvre que les trajets domicile-travail des actifs en emploi, voiture, camion et fourgonnette compris, à l'échelle de la commune. Il ne dit rien des autres déplacements, ni de ce qu'une adresse permet de faire sans voiture.";

/** La part voiture affichable, ou `null` : une valeur absente ou hors de [0, 1] ne fait pas de carte. */
function partVoiture(m: MobiliteAccueil): number | null {
  const p = m?.partVoitureDomicileTravail;
  return fini(p) && p >= 0 && p <= 1 ? Math.round(p * 100) : null;
}

/** La carte Mobilité d'une commune, construite sur la mesure MOBPRO, ou `null` sans mesure. */
export function carteMobilite(name: string, mobilite: MobiliteAccueil): CarteApercu | null {
  const pct = partVoiture(mobilite);
  if (pct == null) return null;
  return {
    cle: "mobilite",
    titre: "Aller travailler en voiture",
    valeur: `${pct} %`,
    fait: `${majuscule(aCommune(name))}, ${pct} % des actifs en emploi qui y habitent vont travailler en voiture.`,
    limite: LIMITE_MOBPRO,
    source: SOURCE_MOBPRO,
    col: COL.violet,
  };
}

/** Les cartes de profondeur. La carte Mobilité ne naît que de la mesure (FUT-185). Les cartes Nature et
 *  Vie locale gardent leurs textes d'avant FUT-37 : génériques et sans lecture de leur source affichée,
 *  elles restent une dette relevée par l'audit FUT-185 (FUT-50 pour l'aperçu, FUT-182 pour le couvert OSO). */
function cartesProfondeur(name: string, categories: readonly string[], mobilite: MobiliteAccueil): CarteApercu[] {
  const has = (c: string) => categories.includes(c);
  const hasAny = (...cats: string[]) => cats.some(has);
  const depth: CarteApercu[] = [];
  const mob = carteMobilite(name, mobilite);
  if (mob) depth.push(mob);
  if (hasAny("littoral", "littoral_atlantique")) {
    depth.push({ cle: "nature", titre: `Nature à ${name}`, fait: `À ${name}, le littoral et les espaces ouverts façonnent le cadre de vie.`, source: "OSM / IGN", col: COL.vert });
  } else if (has("montagne")) {
    depth.push({ cle: "nature", titre: `Nature à ${name}`, fait: `À ${name}, le relief et le plein air façonnent le cadre de vie.`, source: "OSM / IGN", col: COL.vert });
  } else if (hasAny("rural_forestier", "rural_agricole", "rural_viticole")) {
    depth.push({ cle: "nature", titre: `Nature à ${name}`, fait: `Autour ${deCommune(name)}, espaces agricoles et nature rythment le quotidien.`, source: "OSM / IGN", col: COL.vert });
  } else if (has("tourisme_urbain")) {
    depth.push({ cle: "vie-locale", titre: `Vie locale à ${name}`, fait: `À ${name}, commerces, services et vie culturelle animent le quotidien.`, source: "INSEE BPE / RNA", col: COL.vert });
  } else {
    depth.push({ cle: "vie-locale", titre: `Vie locale à ${name}`, fait: `À ${name}, commerces, services et vie associative font le quotidien.`, source: "INSEE BPE / RNA", col: COL.vert });
  }
  return depth;
}

export function getPreviewCards(
  communeName: string,
  categories: readonly string[] | null | undefined,
  indicators: Indicators,
  georisques: GeorisquesAccueil,
  horizon: HorizonAccueil,
  mobilite?: MobiliteAccueil,
): CarteApercu[] {
  const name = communeName || "votre commune";
  const cats = categories && categories.length > 0 ? categories : ["all"];

  const climate = cartesClimat(cats, indicators, georisques, horizon);
  const depth = cartesProfondeur(name, cats, mobilite);

  // Assemblage d'avant FUT-37 : accroche climat en position 1, puis un climat et deux profondeurs,
  // entrelacés selon le nom (stable par commune, insensible à l'horizon).
  const result: CarteApercu[] = [];
  const pushUnique = (card: CarteApercu | undefined) => {
    if (card && !result.some((c) => c.cle === card.cle)) result.push(card);
  };
  pushUnique(climate.shift());
  const c = climate.slice(0, 1);
  const d = depth.slice(0, 2);
  const order = [["c", "d", "d"], ["d", "c", "d"], ["d", "d", "c"]][hashName(name) % 3];
  for (const slot of order) {
    if (slot === "c" && c.length) pushUnique(c.shift());
    else if (slot === "d" && d.length) pushUnique(d.shift());
  }
  [...c, ...d].forEach(pushUnique);
  for (const card of [...climate, ...depth]) {
    if (result.length >= 4) break;
    pushUnique(card);
  }
  return result.slice(0, 4);
}

/**
 * Ce que le hero affiche pour une commune. Pendant le chargement de DRIAS et de Géorisques : un SQUELETTE,
 * sans aucune phrase. Avant FUT-37, les cartes construites avec des données encore vides racontaient des
 * récits de repli (submersion tirée de la seule catégorie `littoral`, immobilier sans donnée), grisés
 * mais lisibles. Une absence de phrase vaut mieux qu'une phrase fausse.
 */
export type ApercuCommune = { etat: "squelette" } | { etat: "cartes"; cartes: CarteApercu[] };

export function apercuCommune(args: {
  commune: string;
  chargement: boolean;
  categories: readonly string[] | null | undefined;
  indicators: Indicators;
  georisques: GeorisquesAccueil;
  horizon: HorizonAccueil;
  mobilite?: MobiliteAccueil;
}): ApercuCommune {
  if (args.chargement) return { etat: "squelette" };
  return { etat: "cartes", cartes: getPreviewCards(args.commune, args.categories, args.indicators, args.georisques, args.horizon, args.mobilite) };
}

// ── Sous-titres chiffrés des questions ───────────────────────────────────────────────────────

// Seulement les questions dont l'indicateur RÉPOND à la question posée. `eau_potable` (« L'eau du
// robinet va-t-elle rester bonne ? ») n'y est plus : des jours de sol sec ne disent rien de la qualité
// de l'eau distribuée.
export const DRIAS_TENSION_CONFIG: Record<string, { indicator: string; getSub: (value: number, name: string) => string }> = {
  canicule_vivable: { indicator: "NORTX30D_yr", getSub: (v, name) => `${Math.round(v)} jours au-dessus de 30 °C par an ${aCommune(name)}` },
  acheter_canicule: { indicator: "NORTX30D_yr", getSub: (v, name) => `${Math.round(v)} jours au-dessus de 30 °C par an ${aCommune(name)}` },
  enfants_chaleur: { indicator: "NORTX30D_yr", getSub: (v, name) => `${Math.round(v)} jours au-dessus de 30 °C par an ${aCommune(name)}` },
  feux: { indicator: "NORIFM40_yr", getSub: (v) => `${Math.round(v)} jours par an de météo très propice aux feux` },
  randonner_ici: { indicator: "NORIFM40_yr", getSub: (v) => `${Math.round(v)} jours par an de météo très propice aux feux` },
  metier_agricole: { indicator: "NORRR_seas_JJA", getSub: (v, name) => `${Math.round(v)} mm de pluie en été ${aCommune(name)}` },
  vignobles: { indicator: "NORTMm_seas_JJA", getSub: (v, name) => `${formatTemperature(v)} en moyenne l'été ${aCommune(name)}` },
};

/** Le sous-titre d'une question : chiffré à un horizon projeté, celui du catalogue sinon. */
export function getDriaSub(tensionId: string, horizon: HorizonAccueil, indicators: Indicators, communeName: string, staticSub: string): string {
  const config = DRIAS_TENSION_CONFIG[tensionId];
  const gwl = gwlDeHorizon(horizon);
  if (!config || gwl == null) return staticSub;
  const v = valeur(indicators, gwl, config.indicator);
  return v == null ? staticSub : config.getSub(v, communeName);
}

// ── Cadrage (hero, intro des questions, état vide) ──────────────────────────────────────────
// Ne promet que des sujets que futur•e couvre : plus d'enneigement, d'assurance, d'accès à l'eau ni de
// « tension sur l'eau ». La structure reste celle d'avant ; le fond est l'affaire de FUT-50.
//
// FUT-185 : plus aucune phrase de cadrage ne parle de « dépendance à la voiture ». Elle venait de
// `rural_peri_urbain` (densité moyenne sous 1 500 hab/km²) ou de `periurbain_dependance_auto`, deux
// catégories, dont la seconde peut aussi venir de la table manuelle (Toulouse, Bordeaux) sans aucune mesure.
// Ces communes reçoivent le cadrage général ; la part voiture mesurée a sa carte (`carteMobilite`).

export function getHeroCopy(communeName: string, categories: readonly string[] | null | undefined, usedFallback: boolean | undefined): string {
  const name = communeName || "votre commune";
  const cats = categories && categories.length > 0 ? categories : ["all"];
  const has = (c: string) => cats.includes(c);

  if (usedFallback) {
    return `futur•e décode les données publiques pour lire ce que le changement climatique change déjà dans votre quotidien. Accédez à une première lecture personnalisée de l'évolution ${deCommune(name)} à travers le prisme du climat, de la santé et du logement.`;
  }
  if (has("littoral")) {
    return `futur•e lit ${name} à travers ses enjeux côtiers : risques recensés, érosion du trait de côte, chaleur estivale et qualité de vie. Pas une carte générale du climat, mais ce que ce territoire change concrètement pour vos décisions.`;
  }
  if (has("montagne")) {
    return `futur•e lit ${name} à travers ses équilibres de montagne : hivers, accès, chaleur estivale et risques naturels recensés. L'objectif n'est pas d'alimenter l'angoisse, mais d'éclairer vos choix avec des signaux crédibles.`;
  }
  if (has("urbain_dense_sud") || has("mediterranee")) {
    return `futur•e croise chaleur, qualité de l'air, mobilité et logement pour lire ce que vivre ${aCommune(name)} veut vraiment dire dans un territoire où les étés se réchauffent.`;
  }
  return `futur•e décode les données publiques pour projeter l'impact du changement climatique sur votre quotidien. Accédez à une première lecture personnalisée de l'évolution ${deCommune(name)} à travers le prisme du climat, de la santé et du logement.`;
}

export function getQuestionIntro(communeName: string, categories: readonly string[] | null | undefined, usedFallback: boolean | undefined): string {
  const cats = categories && categories.length > 0 ? categories : ["all"];
  const has = (c: string) => cats.includes(c);
  const lieu = majuscule(aCommune(communeName || "votre commune"));

  if (usedFallback) return `${lieu}, le futur se joue déjà entre chaleur, logement et qualité de vie.`;
  if (has("littoral") || has("littoral_atlantique")) return `${lieu}, le futur se joue déjà entre chaleur, littoral et qualité de vie.`;
  if (has("littoral_mediterranee")) return `${lieu}, le futur se joue entre chaleur, météo propice aux feux et littoral.`;
  if (has("montagne")) return `${lieu}, le futur se joue entre hivers plus doux, chaleur estivale et risques naturels.`;
  if (has("mediterranee")) return `${lieu}, le futur se joue déjà entre chaleur, nuits tropicales et météo propice aux feux.`;
  if (has("rural_agricole")) return `${lieu}, le futur se joue entre chaleur, sols plus souvent secs et vie agricole.`;
  if (has("urbain_dense_sud") || has("urbain_dense_nord")) return `${lieu}, le futur se joue entre chaleur urbaine, qualité de l'air, logement et services.`;
  return `${lieu}, le futur se joue déjà entre chaleur, logement et qualité de vie.`;
}

export function getEmptyStateCopy(categories: readonly string[] | null | undefined): string {
  const cats = categories && categories.length > 0 ? categories : ["all"];
  if (cats.includes("littoral")) return "Les questions porteront ici sur le littoral, la chaleur, le logement et les projets de vie.";
  if (cats.includes("montagne")) return "Les questions porteront ici sur la montagne, les hivers, le relief et l'habitabilité.";
  // Annonce des sujets, pas un constat : `periurbain_dependance_auto` ouvre les questions sur la voiture.
  if (cats.includes("periurbain_dependance_auto")) {
    return "Les questions porteront ici sur les déplacements, le logement et l'adaptation du territoire.";
  }
  return "Quatre questions sélectionnées pour votre territoire apparaîtront ici.";
}

// ── Machine à sous du hero ───────────────────────────────────────────────────────────────────
// Avant toute commune, l'accueil fait défiler quatre villes. Leurs cartes climat sont désormais
// CONSTRUITES par les mêmes fonctions que celles d'une commune, à l'horizon 2050, depuis un extrait
// figé de data/data_climat.json (un test vérifie qu'il n'a pas dérivé). Les cartes non climatiques
// restent dans le composant (hors FUT-37).
//
// Retirés : « parmi les communes les plus exposées » (classement sans base affichée), « seront »
// (certitude), « DRIAS · +4 °C » sous « d'ici 2050 » (le palier de 2100), et la submersion de Vannes,
// que l'État ne recense pas (GASPAR, vérifié le 02/10/2026).

export const HORIZON_MACHINE_A_SOUS: HorizonAccueil = "2050";

/** Valeurs DRIAS (médiane) des mailles utilisées. Lyon et Marseille : la maille du 1er arrondissement,
 *  comme `DRIAS_CITY_FALLBACK` le fait pour la ville entière. */
export const MACHINE_A_SOUS_DRIAS = {
  "69381": {
    gwl15: { NORTX35D_yr: 5.1, ATX35D_yr: 3.7, NORTR_yr: 31.6, ATR_yr: 16.3 },
    gwl20: { NORTX35D_yr: 7.8, ATX35D_yr: 6.3, NORTR_yr: 42.7, ATR_yr: 28.2 },
    gwl30: { NORTX35D_yr: 16.5, ATX35D_yr: 14.9, NORTR_yr: 63.1, ATR_yr: 48.8 },
  },
  "13201": {
    gwl15: { NORTX35D_yr: 1.6, ATX35D_yr: 1.5, NORTR_yr: 76.8, ATR_yr: 26.3 },
    gwl20: { NORTX35D_yr: 2.8, ATX35D_yr: 2.7, NORTR_yr: 89.8, ATR_yr: 39.7 },
    gwl30: { NORTX35D_yr: 8.6, ATX35D_yr: 8.5, NORTR_yr: 112.5, ATR_yr: 61.7 },
  },
  "56260": {
    gwl15: { NORTX35D_yr: 0.8, ATX35D_yr: 0.6, NORTR_yr: 5.9, ATR_yr: 4.4 },
    gwl20: { NORTX35D_yr: 2, ATX35D_yr: 1.8, NORTR_yr: 9.4, ATR_yr: 7.9 },
    gwl30: { NORTX35D_yr: 4.8, ATX35D_yr: 4.6, NORTR_yr: 20.2, ATR_yr: 18.9 },
  },
  "17300": {
    gwl15: { NORTX35D_yr: 1.2, ATX35D_yr: 1, NORTR_yr: 13.6, ATR_yr: 8.6 },
    gwl20: { NORTX35D_yr: 2.8, ATX35D_yr: 2.5, NORTR_yr: 23.4, ATR_yr: 18.1 },
    gwl30: { NORTX35D_yr: 6.6, ATX35D_yr: 6.3, NORTR_yr: 41.5, ATR_yr: 36.4 },
  },
} as const;

/** Drapeaux GASPAR des villes de la machine à sous, relevés le 02/10/2026 (13055 pour Marseille). */
export const MACHINE_A_SOUS_GASPAR: Record<string, GeorisquesFlags> = {
  Marseille: { marineSubmersion: true, flood: true },
  "La Rochelle": { marineSubmersion: true, flood: true },
  Vannes: {},
  Lyon: {},
};

function indicateursFiges(insee: keyof typeof MACHINE_A_SOUS_DRIAS): Indicators {
  return Object.fromEntries(
    Object.entries(MACHINE_A_SOUS_DRIAS[insee]).map(([g, v]) => [
      g,
      Object.fromEntries(Object.entries(v as Record<string, number>).map(([k, n]) => [k, { value_numeric: n }])),
    ]),
  );
}

/**
 * Les cartes climat et risques d'une ville de la machine à sous, ou `null` si elle n'en a pas le fait.
 * Ici, aucun sélecteur n'est affiché : la ville et l'horizon entrent donc dans la carte (« · Lyon »,
 * « en 2050 · »), alors qu'une carte de commune ne les répète pas.
 */
export function carteMachineASous(
  ville: "Lyon" | "Marseille" | "Vannes" | "La Rochelle",
  famille: "chaleur" | "nuits" | "risque",
): CarteApercu | null {
  if (famille === "risque") {
    const r = carteRisqueRecense({ flags: MACHINE_A_SOUS_GASPAR[ville] });
    return r && { ...r, titre: `${r.titre} · ${ville}` };
  }
  const insee = ({ Lyon: "69381", Marseille: "13201", Vannes: "56260", "La Rochelle": "17300" } as const)[ville];
  const def = famille === "chaleur" ? CHALEUR : NUITS;
  const carte = carteCompte(def, indicateursFiges(insee), HORIZON_MACHINE_A_SOUS);
  if (!carte) return null;
  const maille = insee === "69381" || insee === "13201" ? " · maille du 1er arrondissement" : "";
  return {
    ...carte,
    titre: `${carte.titre} · ${ville}`,
    comparaison: [`en ${HORIZON_MACHINE_A_SOUS}`, carte.comparaison].filter(Boolean).join(" · "),
    source: `${carte.source}${maille}`,
  };
}

/** Part des actifs en emploi qui vont travailler en voiture (RP 2022, base MOBPRO, pondération IPONDI),
 *  à l'échelle de la ville ENTIÈRE : Lyon (69123) et Marseille (13055) agrègent leurs arrondissements de
 *  résidence. Vannes et La Rochelle sont les valeurs de l'index (un test vérifie qu'elles n'ont pas dérivé) ;
 *  Lyon et Marseille se recalculent par docs/audits/2026-11-10-fut185-libelles-densite/mobpro-villes.py.
 *  Avant FUT-185, ces quatre cartes étaient rédigées à la main sous la source « INSEE MOBPRO ». */
export const MACHINE_A_SOUS_MOBPRO = {
  Lyon: 0.2916,
  Marseille: 0.5178,
  Vannes: 0.6754,
  "La Rochelle": 0.5328,
} as const;

/** La carte Mobilité d'une ville de la machine à sous : la même que celle d'une commune, ville nommée. */
export function carteMobiliteMachineASous(ville: keyof typeof MACHINE_A_SOUS_MOBPRO): CarteApercu {
  const carte = carteMobilite(ville, { partVoitureDomicileTravail: MACHINE_A_SOUS_MOBPRO[ville] })!;
  return { ...carte, titre: `${carte.titre} · ${ville}` };
}
