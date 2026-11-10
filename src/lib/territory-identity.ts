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
import { normaliserRoleUrbain, peutDireVille, SEUIL_HABITANTS_VILLE, type RoleUrbain } from "./territoire/statut-urbain.ts";
import { estGrilleDensite, grilleUrbaine, type GrilleDensite } from "./territoire/grille-densite.ts";

export type TerritoryIdentity = {
  // Phrase de synthèse descriptive (compose les champs, sans interprétation).
  summary: string;
  typologie: string;
  /** FUT-184 : la classe de la grille communale de densité Insee, au libellé lecteur (« Bourg rural »). */
  grille: string | null;
  /** La densité moyenne, en chiffre et à son périmètre (« 1 234 hab/km² » ; « … (arrondissement) »). Fait à part. */
  densite: string | null;
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

// FUT-176 : la ligne « rôle » dit le STATUT Insee de la commune, en langage courant, et rien de plus. Avant :
// « Commune isolée, hors agglomération » pour toute commune sans code d'unité urbaine (Bony, mais aussi Orée
// d'Anjou, dont la donnée manquait), et « Principal pôle urbain local » pour la commune la plus peuplée de son
// unité urbaine (Corte, qui forme seule son agglomération). Un statut statistique ne dit ni services, ni
// animation, ni isolement ; un statut inconnu ne dit rien.
function roleLabel(r: UrbanRole, ville: boolean): string | null {
  const role = normaliserRoleUrbain(r.role);
  const uuPop = frInt(r.uuPop);
  const habitants = uuPop ? ` (${uuPop} habitants)` : "";
  const agglo = r.uuLabel ? `l'agglomération ${deCommune(r.uuLabel)}` : "son agglomération";
  // Un arrondissement porte le statut de sa ville sans être la ville-centre : on le dit (Paris 1er, 15 919 habitants).
  if (r.arrondissementDe && role === "ville_centre") {
    const sienne = !r.uuLabel || r.uuLabel === r.arrondissementDe ? "son agglomération" : agglo;
    return `Arrondissement de ${r.arrondissementDe}, ville-centre de ${sienne}${habitants}`;
  }
  switch (role) {
    case "ville_centre":
      return `${ville ? "Ville-centre" : "Commune-centre"} de ${agglo}${habitants}`;
    case "banlieue":
      return `Commune de banlieue de ${agglo}${habitants}`;
    case "ville_isolee":
      // L'agglomération est la commune : son nombre d'habitants est déjà sur la ligne population.
      return "Forme à elle seule une agglomération";
    case "hors_uu":
      return `Hors agglomération : aucun ensemble bâti continu de ${frInt(SEUIL_HABITANTS_VILLE)} habitants`;
    case "dans_agglomeration":
      return `Dans ${agglo}${habitants}`;
    case "inconnu":
      return null;
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

// Phrase de synthèse : une amorce qui situe le territoire (nature + typologie + densité), puis la place de la
// commune dans le zonage en agglomérations. Strictement factuelle (rien d'inventé, pas de « portuaire » deviné).
// Ex : « Ville de la façade atlantique, La Rochelle est au centre de son agglomération. » ; « Commune de
// l'intérieur, Bony se situe hors de toute agglomération. »
const TYPE_TRAIT: Record<string, string> = {
  "Littoral atlantique": "de la façade atlantique",
  "Méditerranéen": "méditerranéenne",
  "Montagne": "de montagne",
  "Intérieur": "de l'intérieur",
};

// FUT-184 : l'amorce ne dit plus « dense » : ce mot venait du palier de 1 500 hab/km², que la grille Insee remplace. La
// classe de la grille a sa ligne sur la carte ; la phrase garde le nom (ville, commune, arrondissement) et la typologie.
function summaryHead(typeLabel: string, ville: boolean, arrondissement = false): string {
  const noun = arrondissement ? "Arrondissement" : ville ? "Ville" : "Commune";
  const trait = TYPE_TRAIT[typeLabel];
  if (!trait) return noun;
  // « méditerranéenne » est un adjectif (accord direct) ; les autres sont « de X ».
  if (typeLabel === "Méditerranéen") return `${noun} ${arrondissement ? "méditerranéen" : "méditerranéenne"}`;
  return `${noun} ${trait}`;
}

/**
 * FUT-184 · LE MOT « VILLE », AU CROISEMENT DE DEUX ZONAGES. FUT-176 l'exige du statut d'unité urbaine (centre, ou
 * agglomération à elle seule) et de 2 000 habitants. La grille de densité peut classer rurale une telle commune
 * (Sèvremoine, Bressuire, Lamballe-Armor : bourgs ruraux, 1 374 cas) : les deux sont vrais, l'un mesure la continuité
 * du bâti, l'autre la concentration des habitants. Écrire « Ville » au-dessus de « Bourg rural » ferait se contredire la
 * carte : le mot n'est dit que si la grille ne classe pas la commune rurale. Grille inconnue : la règle FUT-176 seule.
 * Le statut reste dit, à sa ligne (« Commune-centre de l'agglomération de… »).
 */
export function peutDireVilleTerritoire(role: RoleUrbain, population: number | null | undefined, grille: GrilleDensite | null): boolean {
  if (!peutDireVille(role, population)) return false;
  return grille == null || grille.perimetre !== "commune" || grilleUrbaine(grille.classe);
}

// Le verbe de la phrase de synthèse : la place de la commune dans le zonage, sans rôle prêté (FUT-176 : ni
// « concentre les fonctions urbaines de son bassin de vie », ni « structure la vie locale d'un territoire plus
// rural »). `null` quand le statut est inconnu : la phrase se passe alors de verbe.
function summaryRole(role: UrbanRole | null, name: string): string | null {
  const r = role ? normaliserRoleUrbain(role.role) : "inconnu";
  const label = role?.uuLabel ?? null;
  const memeNom = label != null && label.trim().toLowerCase() === name.trim().toLowerCase();
  if (role?.arrondissementDe && r === "ville_centre") return `appartient à ${role.arrondissementDe}, ville-centre de son agglomération`;
  switch (r) {
    case "ville_centre":
      return !label || memeNom ? "est au centre de son agglomération" : `fait partie du centre de l'agglomération ${deCommune(label)}`;
    case "banlieue":
    case "dans_agglomeration":
      return label && !memeNom ? `s'inscrit dans l'agglomération ${deCommune(label)}` : "s'inscrit dans une agglomération";
    case "ville_isolee":
      return "forme à elle seule une agglomération";
    case "hors_uu":
      return "se situe hors de toute agglomération";
    case "inconnu":
      return null;
  }
}

export function buildTerritoryIdentity(snapshot: FactsSnapshot): TerritoryIdentity {
  const name = valueOf<string>(snapshot, "place.name") ?? "Cette commune";
  const typeLabel = valueOf<string>(snapshot, "place.typology") ?? "";
  const role = valueOf<UrbanRole>(snapshot, "place.urban_role");
  const population = valueOf<number>(snapshot, "place.population");
  const density = valueOf<number>(snapshot, "place.density");
  const densityCat = derivedOf(snapshot, "density.category");
  const grilleBrute = valueOf<unknown>(snapshot, "place.density_grid");
  const grille = estGrilleDensite(grilleBrute) ? grilleBrute : null;
  const densityScale = snapshot.facts.find((f) => f.key === "place.density")?.scale;
  const land = derivedOf(snapshot, "land.category");
  const densityValue = frInt(density);
  const ville = role != null && peutDireVilleTerritoire(normaliserRoleUrbain(role.role), population, grille);
  const head = summaryHead(typeLabel, ville, Boolean(role?.arrondissementDe));
  const verbe = summaryRole(role, name);
  return {
    summary: verbe ? `${head}, ${name} ${verbe}.` : `${name}, ${head.charAt(0).toLowerCase()}${head.slice(1)}.`,
    typologie: typeLabel,
    // FUT-184 : la classe de la grille vient du registre (« …, à l'échelle de Paris » pour un arrondissement), comme pour
    // la synthèse ; ancien snapshot (catégorie « Commune peu dense » de la densité moyenne) : aucune ligne, pas d'ancien palier.
    grille: grille && densityCat?.rule.startsWith("density-grid-insee") ? densityCat.label : null,
    // FUT-179 : le chiffre de l'arrondissement est celui de l'arrondissement, et la ligne le dit.
    densite: densityValue ? `${densityValue} hab/km²${densityScale === "arrondissement" ? " (arrondissement)" : ""}` : null,
    population: frInt(population) ? `${frInt(population)} habitants` : null,
    role: role ? roleLabel(role, ville) : null,
    geo: geoLabel(valueOf<Position>(snapshot, "place.position")),
    // D4 : le même libellé que la face de la carte « Espaces naturels ».
    solDominant: land?.label ?? null,
  };
}

/**
 * LES CHAMPS DU PASSEPORT, dans l'ordre affiché par `TerritoryIdentityCard` (qui les lit ici). FUT-184 : la classe de la
 * grille Insee décrit d'abord la commune ; le statut d'agglomération vient ensuite, à sa ligne ; la densité moyenne, en
 * chiffre, est un autre fait, sous un autre intitulé.
 */
export type ChampIdentite = { kind: string; label: string; value: string };

export function champsIdentite(identity: TerritoryIdentity): ChampIdentite[] {
  const fields: ChampIdentite[] = [{ kind: "type", label: "Type", value: identity.typologie }];
  if (identity.grille) fields.push({ kind: "densite", label: "Grille de densité Insee", value: identity.grille });
  if (identity.role) fields.push({ kind: "role", label: "Rôle", value: identity.role });
  if (identity.population) fields.push({ kind: "population", label: "Population", value: identity.population });
  if (identity.densite) fields.push({ kind: "densite", label: "Densité moyenne", value: identity.densite });
  if (identity.geo) fields.push({ kind: "geo", label: "Position", value: identity.geo });
  if (identity.solDominant) fields.push({ kind: "sol", label: "Occupation des sols", value: identity.solDominant });
  return fields;
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
  // FUT-183 : toutes les parts au dixième, à afficher avec `pctOso`.
  naturelTerresPct: number; // FUT-175 : milieux naturels terrestres, en % des TERRES (eau exclue)
  eauPct: number | null; // part de l'eau dans la surface cartographiée de la commune, comptée à part
  radiusPct: number | null; // naturel et eau confondus dans 15 km (l'eau n'a pas pu en être retirée)
  composition: { label: string; pct: number }[]; // postes terrestres, en % des terres, triés décroissant
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
};

const round1 = (n: number) => Math.round(n * 10) / 10;

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
    const eau = valueOf<number>(snapshot, "land.water_share");
    // FUT-183 : au dixième, comme la catégorie (cf. `pctOso`, territoire/oso-format.ts) ; le rayon aussi, pour une seule précision par carte.
    couvertNaturel = {
      headlineLabel: land.label,
      naturelTerresPct: round1(brut),
      eauPct: eau != null ? round1(eau) : null,
      radiusPct: radius != null ? round1(radius) : null,
      composition: Object.entries(composition)
        .filter(([, v]) => typeof v === "number" && v >= 1)
        .map(([k, v]) => ({ label: COMPOSITION_LABELS[k] ?? k, pct: round1(v) }))
        .sort((a, b) => b.pct - a.pct),
    };
  }

  return { demographie, couvertNaturel };
}
