// L'APERÇU DU DOSSIER DE TERRITOIRE, AVANT PAIEMENT (FUT-30). Module PUR : aucune I/O, aucun LLM,
// aucun appel réseau. Le chargement de la donnée vit dans `quartier-preview.ts`.
//
// ── CE QUI A ÉTÉ REMPLACÉ ────────────────────────────────────────────────────────────────────
// L'ancien aperçu attendait huit sources (dont cinq en réseau) sous un plafond global de 1,2 s, et
// rendait `null` au-delà : le bloc disparaissait. Quand il s'affichait, il montrait trois textes FIXES,
// identiques sur toutes les communes (audit du 03/10/2026, 14 communes sur 14), sous le titre « Aperçu
// réel du dossier ». Il prouvait l'existence de familles de données, jamais un fait du lieu.
//
// ── AUCUNE DOCTRINE NOUVELLE ICI ─────────────────────────────────────────────────────────────
// Cet aperçu CHOISIT et ORDONNE ; il ne décide jamais à partir de quelle valeur un phénomène mérite
// d'être dit, ni comment un nombre s'écrit. Les trois briques viennent du produit :
//   - la donnée : `buildClimatFacts` (le dossier), sur l'extrait DRIAS de `quartier-preview.ts` ;
//   - la formulation et l'arrondi : les cartes de l'accueil (`carteCompte`, FUT-37), qui écrivent
//     0,4 et 0,6 « moins d'une journée », 1,1 « 1 jour », et jamais « 1 jour » pour 0,6 ;
//   - le seul seuil appliqué, celui du feu : `seuilApplicable(…, "ambiante")`, la règle du dossier pour
//     un constat que personne n'a demandé. Un aperçu gratuit est exactement cela.
// Une première version (Phase 1) exigeait « au moins un jour, et plus qu'en 1976-2005 » et arrondissait
// elle-même : c'était une convention de signification propre au paywall. Elle est retirée.
//
// ── LA RÈGLE ─────────────────────────────────────────────────────────────────────────────────
// Une liste blanche courte, dans un ordre FIXE. Jamais « l'indicateur le plus extrême » : cette règle-là
// montrerait mécaniquement ce qui impressionne.
//   FAIT PRINCIPAL : le premier candidat que la carte canonique sait formuler (valeur projetée présente),
//     1. les jours au-dessus de 35 °C ;  2. les nuits tropicales.
//     La chaleur domine donc presque partout, et c'est voulu : c'est le fait climatique que le produit
//     formule pour toute commune, avec sa propre valeur. Aucune diversité de thème n'est recherchée.
//   FAIT SECONDAIRE, facultatif : la météo propice aux feux, seulement au-delà du seuil ambiant du
//     dossier, avec la formulation et la limite de l'accueil. Jamais « risque d'incendie ».
//   Un fait suffit ; deux seulement s'ils sont de familles différentes ; aucun emplacement à remplir.
//
// Écartés : la sécheresse des sols (la doctrine du dossier n'a « pas de seuil défendable »), les pluies
// extrêmes (aucune doctrine de constat non demandé), toute source réseau, le rang national.
//
// ── L'ÉCHELLE ────────────────────────────────────────────────────────────────────────────────
// DRIAS publie une valeur par commune, et par ARRONDISSEMENT pour Paris, Lyon et Marseille. Le
// comparateur ouvre ce paywall avec le code d'un arrondissement et le nom de la ville (`75101`,
// « Paris ») : l'aperçu dit alors « arrondissement », jamais « commune ». Les codes ville (75056,
// 69123, 13055) n'ont pas de ligne DRIAS : l'aperçu n'emprunte la valeur d'AUCUN arrondissement pour
// eux (le 1er arrondissement ne représente pas la ville) et rend l'état sans fait. Le nom affiché
// relève de FUT-43.
//
// ── QUAND RIEN N'EST FORMULABLE ──────────────────────────────────────────────────────────────
// Le bloc ne disparaît plus : il rend `etat: "sans_fait"`, que la page dit sans laisser croire à une
// panne ni à une absence d'analyse.
import { buildClimatFacts, CLIMAT_HORIZON, CLIMAT_METRICS, seuilApplicable, type ClimatMetricKey, type GwlScenarios } from "./decision/climat-facts.ts";
import { mentionHorizon, type HorizonKey } from "./horizons.ts";
import { carteCompte, CHALEUR, NUITS, FEUX, type IndicateurCompte } from "./accueil/recits.ts";
import { indicatorsDepuisScenarios, NOTES_FAITS } from "./accueil/faits.ts";
import { communeParent } from "./plm.ts";

/** Un fait de l'aperçu, avec tout ce qui le rend lisible seul. */
export type FaitApercu = {
  /** La clé de l'axe dans `CLIMAT_METRICS` : sert aux tests et à la mesure, jamais affichée. */
  axe: ClimatMetricKey;
  /** Le titre canonique de la carte (« Jours > 35 °C »). */
  titre: string;
  /** La valeur forte, écrite par l'accueil (« 6 j/an », « < 1 j/an »). */
  valeur: string;
  /** La comparaison à 1976-2005, écrite par l'accueil (« +5 j vs 1976–2005 »). */
  comparaison: string | null;
  /** L'horizon et son équivalence France (`mentionHorizon`). */
  horizon: string;
  /** Le fait en toutes lettres, écrit par l'accueil. */
  fait: string;
  /** Une lecture qui reste dans la grandeur mesurée, si l'accueil en écrit une. */
  lecture: string | null;
  /** Ce qu'un nombre de jours ne dit pas (`NOTES_FAITS`). */
  note: string;
  /** La limite propre à l'indicateur (feu). */
  limite: string | null;
  /** La source de CE fait. */
  source: string;
  /** L'échelle de la valeur DRIAS. Jamais une adresse. */
  grain: "commune" | "arrondissement";
  projete: number;
  reference: number | null;
};

export type ApercuTerritoire =
  | { etat: "faits"; commune: string; faits: [FaitApercu] | [FaitApercu, FaitApercu] }
  | { etat: "sans_fait"; commune: string };

/** « Un nombre de jours par an ne dit rien de la durée ni de la continuité d'une période. » */
const NOTE_COMPTE = NOTES_FAITS.find((n) => n.startsWith("Un nombre de jours"))!;

const PRINCIPAUX: readonly { axe: ClimatMetricKey; def: IndicateurCompte }[] = [
  { axe: "joursTresChauds", def: CHALEUR },
  { axe: "nuitsTropicales", def: NUITS },
];

/** L'année affichée par l'accueil pour l'horizon du dossier (« 2050 »). */
const ANNEE = "2050" as const;

function fait(
  axe: ClimatMetricKey, def: IndicateurCompte, insee: string, scenarios: GwlScenarios,
  projete: number, reference: number | null,
): FaitApercu | null {
  const carte = carteCompte(def, indicatorsDepuisScenarios(scenarios), ANNEE);
  if (!carte || !carte.valeur) return null; // la carte canonique ne le formule pas : l'aperçu non plus
  return {
    axe,
    titre: carte.titre,
    valeur: carte.valeur,
    comparaison: carte.comparaison ?? null,
    horizon: mentionHorizon(CLIMAT_HORIZON as HorizonKey),
    fait: carte.fait,
    lecture: carte.lecture ?? null,
    note: NOTE_COMPTE,
    limite: carte.limite ?? null,
    source: carte.source,
    grain: communeParent(insee) !== insee ? "arrondissement" : "commune",
    projete,
    reference,
  };
}

/**
 * L'aperçu d'un code INSEE, à partir de ses scénarios DRIAS (la forme de `getClimatDataCommune`).
 * Même code, même donnée : même aperçu.
 */
export function construireApercu(insee: string, commune: string, scenarios: GwlScenarios | null): ApercuTerritoire {
  const climat = buildClimatFacts(scenarios);
  if (!climat || !scenarios) return { etat: "sans_fait", commune };

  const faits: FaitApercu[] = [];

  for (const { axe, def } of PRINCIPAUX) {
    const a = climat[axe];
    if (a.projete == null) continue; // le dossier ne lit rien : rien à formuler
    const f = fait(axe, def, insee, scenarios, a.projete, a.reference);
    if (f) {
      faits.push(f);
      break; // une seule chaleur : les deux axes racontent la même famille
    }
  }

  // Le feu, facultatif : la règle du dossier pour un constat non demandé, à l'identique.
  const feu = climat.joursFeu;
  if (feu.projete != null && feu.projete >= seuilApplicable(CLIMAT_METRICS.joursFeu, feu, "ambiante")) {
    const f = fait("joursFeu", FEUX, insee, scenarios, feu.projete, feu.reference);
    if (f) faits.push(f);
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
