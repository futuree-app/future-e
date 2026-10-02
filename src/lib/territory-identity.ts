// Carte d'identité du territoire (bloc 2, sous la ligne des années) et données riches des cartes
// « Le territoire ». Pur formatage : aucune conclusion logement / santé / mobilité / métier / projets.
//
// DEPUIS FUT-6 (28/09/2026), TOUT VIENT DU `FactsSnapshot` DE L'ÉCRAN. Ce module ne classe plus rien
// lui-même : il affiche les `DerivedFact` du registre (src/lib/territoire/facts.ts), que la synthèse
// reçoit aussi. Avant, il portait sa propre grille du couvert (classe dominante ≥ 40 %), différente de
// celle de la carte (≥ 50 %) : à Châtelaillon, l'identité disait « Dominante urbaine » et la carte
// « Occupation mixte », sur le même chiffre.

import { derivedOf, valueOf, type FactsSnapshot } from "./facts/contract.ts";
import { DEMOGRAPHY_PHRASE, isDemographyCode, type UrbanRole } from "./territoire/facts.ts";
import { REPERE_PRES_DU_RIVAGE_KM } from "./mer-recherche.ts";
import { kmLisible } from "./hard-constraints.ts";
import { deCommune } from "./typography.ts";

export type TerritoryIdentity = {
  // Phrase de synthèse descriptive (compose les champs, sans interprétation).
  summary: string;
  typologie: string;
  densite: { label: string; value: string | null } | null;
  population: string | null;
  role: string | null;
  geo: string | null;
  solDominant: string | null;
};

// Groupement par milliers avec espace fine insécable (U+202F), déterministe
// (sans dépendre de l'ICU de Node pour toLocaleString).
export function frInt(n: number | null | undefined): string | null {
  if (n == null || !isFinite(n)) return null;
  return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

function roleLabel(r: UrbanRole, communePop: number | null): string | null {
  // Taille de l'unité urbaine (= agglomération), surfacée quand elle situe la
  // commune : toujours pour une commune d'agglo (elle n'en est qu'une part),
  // et pour un pôle seulement si l'agglo dépasse nettement la commune (sinon
  // c'est le même nombre que la population, donc inerte).
  const uuPop = frInt(r.uuPop);
  switch (r.role) {
    case "isolee":
      return "Commune isolée, hors agglomération";
    case "pole": {
      if (uuPop && r.uuPop != null && r.uuPop > (communePop ?? 0) * 1.1) {
        return `Principal pôle d'une agglomération de ${uuPop} habitants`;
      }
      return "Principal pôle urbain local";
    }
    case "agglo": {
      const base = r.uuLabel ? `Dans l'agglomération ${deCommune(r.uuLabel)}` : "Dans une agglomération";
      return uuPop ? `${base} (${uuPop} habitants)` : base;
    }
  }
}

type Position = { merCentreKm?: number | null; reliefProximite: number | null; altitude: number | null };

// FUT-33 : la DISTANCE est l'information (« Rivage marin à 1,6 km »), jamais « En bord de mer » (la mesure compte
// les lagunes : Narbonne est à 1,6 km de l'étang de Bages). Le repère de 8 km (validé le 02/10/2026) décide
// seulement si la ligne s'affiche. Un snapshot ancien (ancienne distance, sans `merCentreKm`) n'en montre aucune.
function geoLabel(p: Position | null): string | null {
  if (!p) return null;
  if (p.merCentreKm != null && p.merCentreKm <= REPERE_PRES_DU_RIVAGE_KM) return `Rivage marin à ${kmLisible(p.merCentreKm)}`;
  if (p.reliefProximite != null && p.reliefProximite >= 55) return "Proche du relief";
  if (p.altitude != null && p.altitude >= 600) return "En altitude";
  return null;
}

// Phrase de synthèse avec du caractère : une amorce qui situe le territoire
// (nature + typologie + densité), puis le rôle dans le bassin de vie. Reste
// strictement factuelle (rien d'inventé, pas de « portuaire » deviné).
// Ex : « Ville dense de la façade atlantique, La Rochelle concentre les
// fonctions urbaines de son bassin de vie. »
const TYPE_TRAIT: Record<string, string> = {
  "Littoral atlantique": "de la façade atlantique",
  "Méditerranéen": "méditerranéenne",
  "Montagne": "de montagne",
  "Intérieur": "de l'intérieur",
};

function summaryHead(typeLabel: string, role: UrbanRole | null, dense: boolean): string {
  const noun = role?.role === "isolee" ? "Commune" : "Ville";
  const d = dense ? "dense " : "";
  const trait = TYPE_TRAIT[typeLabel];
  if (!trait) return `${noun} ${d}`.trim();
  // « méditerranéenne » est un adjectif (accord direct) ; les autres sont « de X ».
  if (typeLabel === "Méditerranéen") return `${noun} ${d}méditerranéenne`.trim();
  return `${noun} ${d}${trait}`.trim();
}

function summaryRole(role: UrbanRole | null): string {
  switch (role?.role) {
    case "pole":
      return "concentre les fonctions urbaines de son bassin de vie";
    case "agglo":
      return role.uuLabel ? `s'inscrit dans l'agglomération ${deCommune(role.uuLabel)}` : "s'inscrit dans une agglomération";
    case "isolee":
      return "structure la vie locale d'un territoire plus rural";
    default:
      return "compose son propre territoire";
  }
}

export function buildTerritoryIdentity(snapshot: FactsSnapshot): TerritoryIdentity {
  const name = valueOf<string>(snapshot, "place.name") ?? "Cette commune";
  const typeLabel = valueOf<string>(snapshot, "place.typology") ?? "";
  const role = valueOf<UrbanRole>(snapshot, "place.urban_role");
  const population = valueOf<number>(snapshot, "place.population");
  const density = valueOf<number>(snapshot, "place.density");
  const densityCat = derivedOf(snapshot, "density.category");
  const land = derivedOf(snapshot, "land.category");
  const densityValue = frInt(density);
  return {
    summary: `${summaryHead(typeLabel, role, densityCat?.value === "dense")}, ${name} ${summaryRole(role)}.`,
    typologie: typeLabel,
    densite: densityCat ? { label: densityCat.label, value: densityValue ? `${densityValue} hab/km²` : null } : null,
    population: frInt(population) ? `${frInt(population)} habitants` : null,
    role: role ? roleLabel(role, population) : null,
    geo: geoLabel(valueOf<Position>(snapshot, "place.position")),
    // D4 : le même libellé que la face de la carte « Espaces naturels ».
    solDominant: land?.label ?? null,
  };
}

// ── Bloc 4 : données riches des cartes Territoire ────────────────────────────────────────────

export type DemographieCardData = {
  status: string; // valeur de la carte (« Croissance récente »…)
  recitPhrase: string | null;
  annualPct: number | null; // taux annualisé (taux_total)
  totalPeriodPct: number | null; // évolution totale sur la fenêtre 2015-2021
  partNouveaux: number | null;
};

export type CouvertCardData = {
  headlineLabel: string; // valeur de la carte (« Occupation mixte »…)
  brutPct: number; // couvert naturel sur la commune
  radiusPct: number | null; // couvert naturel dans 15 km
  composition: { label: string; pct: number }[]; // classes triées, décroissant
};

export type TerritoryCards = {
  demographie: DemographieCardData | null;
  couvertNaturel: CouvertCardData | null;
};

export const COMPOSITION_LABELS: Record<string, string> = {
  artificialise: "Espaces urbanisés",
  agricole: "Terres agricoles",
  foret: "Forêts",
  prairies: "Prairies",
  landes_pelouses: "Landes et pelouses",
  mineral_dunes: "Roche et dunes",
  eau: "Eau",
};

const DEMOGRAPHIE_WINDOW_YEARS = 6; // 2015 -> 2021

type Trend = { annualPct: number | null; newcomersPct: number | null; code: string | null };

export function buildTerritoryCards(snapshot: FactsSnapshot): TerritoryCards {
  let demographie: DemographieCardData | null = null;
  const trend = valueOf<Trend>(snapshot, "demography.trend");
  const demoCat = derivedOf(snapshot, "demography.category");
  if (trend && demoCat && isDemographyCode(demoCat.value)) {
    const annual = trend.annualPct;
    const totalPeriod =
      annual != null ? Math.round((Math.pow(1 + annual / 100, DEMOGRAPHIE_WINDOW_YEARS) - 1) * 1000) / 10 : null;
    demographie = {
      status: demoCat.label,
      recitPhrase: DEMOGRAPHY_PHRASE[demoCat.value],
      annualPct: annual,
      totalPeriodPct: totalPeriod,
      partNouveaux: trend.newcomersPct,
    };
  }

  let couvertNaturel: CouvertCardData | null = null;
  const land = derivedOf(snapshot, "land.category");
  const composition = valueOf<Record<string, number>>(snapshot, "land.composition");
  const brut = valueOf<number>(snapshot, "land.natural_share");
  if (land && composition && brut != null) {
    const radius = valueOf<number>(snapshot, "land.natural_share_15km");
    couvertNaturel = {
      headlineLabel: land.label,
      brutPct: Math.round(brut),
      radiusPct: radius != null ? Math.round(radius) : null,
      composition: Object.entries(composition)
        .filter(([, v]) => typeof v === "number" && v >= 1)
        .map(([k, v]) => ({ label: COMPOSITION_LABELS[k] ?? k, pct: Math.round(v) }))
        .sort((a, b) => b.pct - a.pct),
    };
  }

  return { demographie, couvertNaturel };
}
