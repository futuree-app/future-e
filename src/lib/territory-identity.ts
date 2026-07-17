// Carte d'identité du territoire (bloc 2, sous la ligne des années).
// Dérive des libellés d'affichage déterministes à partir de la typologie (mood)
// et de l'entrée d'index (densité, population, rôle UU, géographie, sol dominant).
// Pur formatage : aucune conclusion logement / santé / mobilité / métier / projets.

import { RECIT_DEMOGRAPHIE, type TerritoryContext, type IndexCommune } from "@/lib/comparateur-vie";
import { deCommune } from "@/lib/typography";

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
function frInt(n: number | null | undefined): string | null {
  if (n == null || !isFinite(n)) return null;
  return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}


function densiteLabel(d: number | null | undefined): { label: string; value: string | null } | null {
  if (d == null) return null;
  const value = frInt(d);
  const label = d >= 1500 ? "Commune dense" : d >= 150 ? "Densité intermédiaire" : "Commune peu dense";
  return { label, value: value ? `${value} hab/km²` : null };
}

function roleLabel(ctx: TerritoryContext): string | null {
  // Taille de l'unité urbaine (= agglomération), surfacée quand elle situe la
  // commune : toujours pour une commune d'agglo (elle n'en est qu'une part),
  // et pour un pôle seulement si l'agglo dépasse nettement la commune (sinon
  // c'est le même nombre que la population, donc inerte).
  const uuPop = frInt(ctx.uuPop);
  switch (ctx.role) {
    case "isolee":
      return "Commune isolée, hors agglomération";
    case "pole": {
      const communePop = ctx.entry.population ?? 0;
      if (uuPop && ctx.uuPop != null && ctx.uuPop > communePop * 1.1) {
        return `Principal pôle d'une agglomération de ${uuPop} habitants`;
      }
      return "Principal pôle urbain local";
    }
    case "agglo": {
      const base = ctx.uuLabel
        ? `Dans l'agglomération ${deCommune(ctx.uuLabel)}`
        : "Dans une agglomération";
      return uuPop ? `${base} (${uuPop} habitants)` : base;
    }
  }
}

function geoLabel(ctx: TerritoryContext): string | null {
  const c = ctx.entry;
  if (c.distance_cote_km != null && c.distance_cote_km <= 2) return "En bord de mer";
  if (c.distance_cote_km != null && c.distance_cote_km <= 8) return "Proche du littoral";
  if (c.relief_proximite != null && c.relief_proximite >= 55) return "Proche du relief";
  if (c.altitude != null && c.altitude >= 600) return "En altitude";
  return null;
}

// Caractère dominant du sol, sans le mot « artificialisation » (jargon banni).
// Forme de champ courte (« Dominante X »), pas de phrase.
const SOL_LABELS: Record<string, string> = {
  artificialise: "Dominante urbaine",
  agricole: "Dominante agricole",
  foret: "Dominante forestière",
  prairies: "Milieux ouverts",
  landes_pelouses: "Milieux ouverts",
};

function solDominant(ctx: TerritoryContext): string | null {
  const comp = ctx.entry.nature?.composition;
  if (!comp) return null;
  let topKey: string | null = null;
  let topVal = 0;
  for (const [k, v] of Object.entries(comp)) {
    if (typeof v === "number" && v > topVal) {
      topVal = v;
      topKey = k;
    }
  }
  // Dominance nette seulement (évite d'étiqueter un sol partagé).
  if (!topKey || topVal < 40) return null;
  return SOL_LABELS[topKey] ?? null;
}

// Bloc 4 — données riches des cartes Territoire, pour leur donner la même
// profondeur que les cartes climat (carte -> drawer -> ce que cela raconte).
// Calculé côté serveur (récit démographie du moteur, composition OSO) ; le
// composant client construit le CardDetail à partir de ces données.

export type DemographieCardData = {
  status: string; // valeur de la carte (« Croissance récente »…)
  recitPhrase: string | null;
  annualPct: number | null; // taux annualisé (taux_total)
  totalPeriodPct: number | null; // évolution totale sur la fenêtre 2015-2021
  partNouveaux: number | null;
};

export type CouvertCardData = {
  headlineLabel: string; // valeur de la carte (« Majoritairement urbanisé »…)
  brutPct: number; // couvert naturel sur la commune
  radiusPct: number | null; // couvert naturel dans 15 km
  composition: { label: string; pct: number }[]; // classes triées, décroissant
};

export type TerritoryCards = {
  demographie: DemographieCardData | null;
  couvertNaturel: CouvertCardData | null;
};

const COMPOSITION_LABELS: Record<string, string> = {
  artificialise: "Espaces urbanisés",
  agricole: "Terres agricoles",
  foret: "Forêts",
  prairies: "Prairies",
  landes_pelouses: "Landes et pelouses",
  mineral_dunes: "Roche et dunes",
  eau: "Eau",
};

const DEMOGRAPHIE_WINDOW_YEARS = 6; // 2015 -> 2021

function couvertHeadline(brutPct: number, comp: Record<string, number>): string {
  const urb = comp.artificialise ?? 0;
  const agri = comp.agricole ?? 0;
  if (urb >= 50) return "Majoritairement urbanisé";
  if (brutPct >= 45) return "Forte présence naturelle";
  if (agri >= 50) return "À dominante agricole";
  if (brutPct < 20) return "Faible présence d'espaces naturels";
  return "Occupation mixte";
}

export function buildTerritoryCards(entry: IndexCommune): TerritoryCards {
  let demographie: DemographieCardData | null = null;
  const d = entry.demographie;
  if (d && d.recit) {
    const phrase = RECIT_DEMOGRAPHIE[d.recit] ?? null;
    const status = d.recit.startsWith("gagne")
      ? "Croissance récente"
      : d.recit.startsWith("perd")
        ? "Population en recul"
        : "Population stable";
    const annual = d.taux_total ?? null;
    const totalPeriod =
      annual != null ? Math.round((Math.pow(1 + annual / 100, DEMOGRAPHIE_WINDOW_YEARS) - 1) * 1000) / 10 : null;
    demographie = {
      status,
      recitPhrase: phrase,
      annualPct: annual,
      totalPeriodPct: totalPeriod,
      partNouveaux: d.part_nouveaux ?? null,
    };
  }

  let couvertNaturel: CouvertCardData | null = null;
  const nat = entry.nature;
  if (nat && nat.brut_pct != null && nat.composition) {
    const composition = Object.entries(nat.composition)
      .filter(([, v]) => typeof v === "number" && v >= 1)
      .map(([k, v]) => ({ label: COMPOSITION_LABELS[k] ?? k, pct: Math.round(v as number) }))
      .sort((a, b) => b.pct - a.pct);
    couvertNaturel = {
      headlineLabel: couvertHeadline(nat.brut_pct, nat.composition),
      brutPct: Math.round(nat.brut_pct),
      radiusPct: nat.radius_pct != null ? Math.round(nat.radius_pct) : null,
      composition,
    };
  }

  return { demographie, couvertNaturel };
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

function summaryHead(typeLabel: string, ctx: TerritoryContext): string {
  const noun = ctx.role === "isolee" ? "Commune" : "Ville";
  const dense = ctx.entry.densite != null && ctx.entry.densite >= 1500 ? "dense " : "";
  const trait = TYPE_TRAIT[typeLabel];
  if (!trait) return `${noun} ${dense}`.trim();
  // « méditerranéenne » est un adjectif (accord direct) ; les autres sont « de X ».
  if (typeLabel === "Méditerranéen") return `${noun} ${dense}méditerranéenne`.trim();
  return `${noun} ${dense}${trait}`.trim();
}

function summaryRole(ctx: TerritoryContext): string {
  switch (ctx.role) {
    case "pole":
      return "concentre les fonctions urbaines de son bassin de vie";
    case "agglo":
      return ctx.uuLabel ? `s'inscrit dans l'agglomération ${deCommune(ctx.uuLabel)}` : "s'inscrit dans une agglomération";
    case "isolee":
      return "structure la vie locale d'un territoire plus rural";
  }
}

function buildSummary(communeName: string, typeLabel: string, ctx: TerritoryContext): string {
  return `${summaryHead(typeLabel, ctx)}, ${communeName} ${summaryRole(ctx)}.`;
}

export function buildTerritoryIdentity(params: {
  communeName: string;
  typeLabel: string;
  context: TerritoryContext;
}): TerritoryIdentity {
  const { communeName, typeLabel, context } = params;
  return {
    summary: buildSummary(communeName, typeLabel, context),
    typologie: typeLabel,
    densite: densiteLabel(context.entry.densite),
    population: frInt(context.entry.population) ? `${frInt(context.entry.population)} habitants` : null,
    role: roleLabel(context),
    geo: geoLabel(context),
    solDominant: solDominant(context),
  };
}
