// L'APERÇU DU DOSSIER DE TERRITOIRE, AVANT PAIEMENT (FUT-30). Module PUR : aucune I/O, aucun LLM,
// aucun appel réseau. Le chargement de la donnée vit dans `quartier-preview.ts`.
//
// ── CE QUI A ÉTÉ REMPLACÉ ────────────────────────────────────────────────────────────────────
// L'ancien aperçu attendait huit sources (dont cinq en réseau) sous un plafond global de 1,2 s, et
// rendait `null` au-delà : le bloc disparaissait. Quand il s'affichait, il montrait trois textes FIXES,
// identiques sur toutes les communes (audit du 03/10/2026, 14 communes sur 14), sous le titre « Aperçu
// réel du dossier ». Il prouvait l'existence de familles de données, jamais un fait du lieu.
//
// ── CE QUE CET APERÇU MONTRE ─────────────────────────────────────────────────────────────────
// Un fait communal, deux au plus, tirés de la vérité climatique DU DOSSIER (`buildClimatFacts`), avec
// tout ce qui le rend lisible : la valeur projetée, sa référence 1976-2005 reconstruite, l'horizon et
// son équivalence France, ce que l'indicateur mesure, sa source et son échelle. Aucune interprétation :
// ni « exposée », ni « favorable », ni comparaison à d'autres communes. La lecture d'ensemble, les
// compromis, la synthèse et le croisement au projet restent dans le dossier payé.
//
// ── LA RÈGLE DE SÉLECTION, ET POURQUOI ELLE N'EST PAS UN PALMARÈS ────────────────────────────
// Elle ne cherche PAS l'indicateur où la commune est la plus extrême au national : cette règle-là
// montrerait mécaniquement ce qui impressionne, et ferait de l'aperçu un palmarès anxiogène.
//
// Elle parcourt une LISTE BLANCHE COURTE, dans un ordre FIXE, et retient le premier candidat qui
// remplit le contrat (`contratRempli`) :
//
//   FAIT PRINCIPAL, famille « chaleur », dans cet ordre :
//     1. les jours au-dessus de 35 °C ;
//     2. les nuits tropicales (minimum ≥ 20 °C).
//   Le premier dont la valeur projetée ET la référence sont lisibles, et dont la trajectoire se lit
//   en nombres entiers (au moins un jour par an vers 2050, et davantage qu'en 1976-2005).
//
//   FAIT SECONDAIRE, famille « feu », seulement s'il apporte autre chose :
//     les jours d'indice forêt-météo supérieur à 40, et UNIQUEMENT au-delà du seuil des constats non
//     demandés que le dossier applique déjà (`seuilApplicable(…, "ambiante")`, 15 jours, ~5 % des
//     communes). Un aperçu est par définition un constat que personne n'a demandé : il ne doit pas
//     parler du feu plus facilement que le dossier lui-même. Sa limite est OBLIGATOIRE.
//
// Écartés, avec leur raison : la sécheresse des sols (la doctrine du dossier n'a « pas de seuil
// défendable » et « 115 jours de sol sec ne dit rien à un lecteur ») ; les pluies extrêmes (écart
// relatif, aucune doctrine de constat non demandé) ; tout ce qui dépend d'une source réseau
// (Géorisques, GASPAR, Hub'Eau, VigiEau, ADEME) ; le rang national (il n'est pas interdit, mais il
// ne doit pas servir à chercher ce qui impressionne, et il exigerait l'index complet de 63 Mo).
//
// ── QUAND RIEN NE REMPLIT LE CONTRAT ─────────────────────────────────────────────────────────
// Le bloc ne disparaît plus. Il dit honnêtement qu'aucun fait n'est mis en avant ici, sans laisser
// croire à une panne ni à une absence de données (`etat: "sans_fait"`).
import {
  buildClimatFacts, CLIMAT_HORIZON, CLIMAT_METRICS, seuilApplicable,
  type ClimatAxe, type ClimatMetricKey, type GwlScenarios,
} from "./decision/climat-facts.ts";
import { HORIZON, mentionHorizon, type HorizonKey } from "./horizons.ts";

/** Un fait de l'aperçu, avec tout ce qui le rend lisible seul. */
export type FaitApercu = {
  /** La clé de l'axe dans `CLIMAT_METRICS` : sert aux tests et à la mesure, jamais affichée. */
  axe: ClimatMetricKey;
  /** Le thème, en surtitre. */
  theme: string;
  /** La valeur projetée, déjà formulée (« 14 jours par an au-dessus de 35 °C »). */
  valeur: string;
  /** La trajectoire : l'horizon et la référence 1976-2005. */
  periode: string;
  /** L'horizon et son équivalence France, telle que le produit l'écrit partout. */
  horizon: string;
  /** Ce que l'indicateur mesure réellement, en une phrase. */
  mesure: string;
  /** La limite, quand elle est indispensable à l'interprétation. */
  limite: string | null;
  /** La source de CE fait, et d'aucun autre. */
  source: string;
  /** L'échelle du fait. Toujours la commune ici : FUT-30 ne parle jamais d'une adresse. */
  grain: "commune";
  /** Les nombres affichés, pour que les tests vérifient le texte contre la donnée. */
  projete: number;
  reference: number;
};

export type ApercuTerritoire =
  | { etat: "faits"; commune: string; faits: [FaitApercu] | [FaitApercu, FaitApercu] }
  | { etat: "sans_fait"; commune: string };

const SOURCE_DRIAS = "DRIAS-TRACC, médiane des modèles · Météo-France";

type Candidat = {
  axe: ClimatMetricKey;
  famille: "chaleur" | "feu";
  theme: string;
  /** « 14 jours par an au-dessus de 35 °C » */
  valeur: (n: string) => string;
  /** La forme de la référence : « 3 jours », « moins d'une nuit »… */
  unite: { singulier: string; pluriel: string; moinsDUn: string };
  mesure: string;
  limite: string | null;
};

const CHALEUR: readonly Candidat[] = [
  {
    axe: "joursTresChauds",
    famille: "chaleur",
    theme: "Chaleur",
    valeur: (n) => `${n} par an au-dessus de 35\u00a0°C`,
    unite: { singulier: "jour", pluriel: "jours", moinsDUn: "moins d'un jour" },
    mesure:
      "Un jour compte quand la température maximale dépasse 35\u00a0°C. Le nombre additionne ces jours " +
      "sur l'année, sans dire s'ils forment une période continue.",
    limite: null,
  },
  {
    axe: "nuitsTropicales",
    famille: "chaleur",
    theme: "Nuits chaudes",
    valeur: (n) => `${n} tropicales par an`,
    unite: { singulier: "nuit", pluriel: "nuits", moinsDUn: "moins d'une nuit" },
    mesure:
      "Une nuit est dite tropicale quand la température ne descend pas sous 20\u00a0°C (définition " +
      "Météo-France). Le nombre additionne ces nuits sur l'année, sans dire si elles se suivent.",
    limite: null,
  },
];

const FEU: Candidat = {
  axe: "joursFeu",
  famille: "feu",
  theme: "Météo propice aux feux",
  valeur: (n) => `${n} par an d'indice forêt-météo supérieur à\u00a040`,
  unite: { singulier: "jour", pluriel: "jours", moinsDUn: "moins d'un jour" },
  mesure:
    "L'indice forêt-météo combine température, humidité, vent et sécheresse de la végétation. Au-dessus " +
    "de 40, la météo est très favorable à la propagation d'un feu.",
  // Indispensable : sans elle, le chiffre se lit comme un risque d'incendie.
  limite:
    "Il décrit une météo, pas la probabilité qu'un incendie se déclare : celle-ci dépend aussi de la " +
    "végétation, des activités humaines et des moyens de prévention.",
};

/** Arrondi d'affichage : l'entier le plus proche (les valeurs DRIAS sont des médianes de modèles). */
const entier = (x: number) => Math.round(x);

/** « 14 jours », « 1 jour », « moins d'un jour ». */
function compte(x: number, u: Candidat["unite"]): string {
  const n = entier(x);
  if (n < 1) return u.moinsDUn;
  // Insécable : le nombre ne se sépare jamais de son unité en fin de ligne.
  return `${n}\u00a0${n === 1 ? u.singulier : u.pluriel}`;
}

/**
 * LE CONTRAT D'UN FAIT DE L'APERÇU. Tout ce qui est affiché doit pouvoir l'être honnêtement :
 * - la valeur projetée existe (une valeur absente n'est jamais une exposition faible) ;
 * - la référence 1976-2005 est reconstructible (sans elle, la phrase serait une statistique orpheline) ;
 * - la trajectoire se LIT : au moins une unité vers 2050, et davantage qu'en 1976-2005, en entiers.
 *   « 0 jour contre 0 jour » ou « 3 jours contre 3 jours » ne disent rien au lecteur.
 *
 * Ce n'est PAS un seuil d'exposition (rien n'est dit « élevé ») : c'est la condition pour qu'un nombre
 * soit lisible. La seule convention de signalement appliquée ici est celle du dossier, pour le feu.
 */
export function contratRempli(axe: ClimatAxe): axe is ClimatAxe & { projete: number; reference: number } {
  if (axe.projete == null || axe.reference == null) return false;
  return entier(axe.projete) >= 1 && entier(axe.projete) > entier(axe.reference);
}

function fait(c: Candidat, axe: ClimatAxe & { projete: number; reference: number }): FaitApercu {
  const h = HORIZON[CLIMAT_HORIZON as HorizonKey];
  return {
    axe: c.axe,
    theme: c.theme,
    valeur: c.valeur(compte(axe.projete, c.unite)),
    periode: `vers ${h.annee}, contre ${compte(axe.reference, c.unite)} sur la période de référence 1976-2005`,
    horizon: mentionHorizon(CLIMAT_HORIZON as HorizonKey),
    mesure: c.mesure,
    limite: c.limite,
    source: SOURCE_DRIAS,
    grain: "commune",
    projete: axe.projete,
    reference: axe.reference,
  };
}

/**
 * L'aperçu d'une commune, à partir de ses scénarios DRIAS (la forme de `getClimatDataCommune`).
 * Même commune, même donnée : même aperçu.
 */
export function construireApercu(commune: string, scenarios: GwlScenarios | null): ApercuTerritoire {
  const climat = buildClimatFacts(scenarios);
  if (!climat) return { etat: "sans_fait", commune };

  const faits: FaitApercu[] = [];

  for (const c of CHALEUR) {
    const axe = climat[c.axe];
    if (contratRempli(axe)) {
      faits.push(fait(c, axe));
      break; // une seule chaleur : les deux axes racontent la même famille
    }
  }

  const feu = climat[FEU.axe];
  if (contratRempli(feu) && feu.projete >= seuilApplicable(CLIMAT_METRICS.joursFeu, feu, "ambiante")) {
    faits.push(fait(FEU, feu));
  }

  if (faits.length === 0) return { etat: "sans_fait", commune };
  return { etat: "faits", commune, faits: faits.slice(0, 2) as [FaitApercu] | [FaitApercu, FaitApercu] };
}

// ── LA DONNÉE COMPACTE ───────────────────────────────────────────────────────────────────────
// `src/data/apercu-climat-communes.json`, produit par `scripts/build-apercu-climat.mjs` depuis
// `public/data_climat.json` : pour chaque commune, les six clés DRIAS des trois axes aux trois
// horizons, à la suite. Elle se reconvertit ici dans la forme exacte de `getClimatDataCommune`, pour que
// `buildClimatFacts` lise l'aperçu comme il lit le dossier.

export type ExtraitClimat = {
  schema: 1;
  source: { fichier: string; sha256: string; lignes: number };
  horizons: string[];
  cles: string[];
  communes: Record<string, (number | null)[]>;
};

export function scenariosDepuisExtrait(extrait: ExtraitClimat, insee: string): GwlScenarios | null {
  const ligne = extrait.communes[insee];
  if (!ligne) return null;
  const n = extrait.cles.length;
  const out: GwlScenarios = {};
  extrait.horizons.forEach((h, i) => {
    const v: Record<string, number> = {};
    extrait.cles.forEach((cle, j) => {
      const x = ligne[i * n + j];
      if (typeof x === "number" && Number.isFinite(x)) v[cle] = x;
    });
    out[h] = { h, v };
  });
  return out;
}
