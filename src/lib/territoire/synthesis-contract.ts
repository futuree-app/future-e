// ════════════════════════════════════════════════════════════════════════════════════════════
// LE CONTRAT DE LA SYNTHÈSE TERRITOIRE (FUT-6, 28/09/2026).
//
// La synthèse Territoire répond à une seule question : « Qu'est-ce que ce territoire raconte,
// indépendamment de mon projet personnel ? ». Elle dépend des faits du lieu et de l'horizon, et de
// RIEN d'autre : ni relation au lieu, ni repères de terrain, ni attentes de découverte. La future
// « Lecture pour votre projet » portera cette personnalisation, dans une couche séparée.
//
// Ce module fixe ce que le modèle reçoit (la PROJECTION, D11), la consigne, et la version du
// contrat. Tout ce qui change la sortie monte `SYNTHESIS_CONTRACT_VERSION` : projection, consigne,
// modèle, contrôles (synthesis-checks.ts), patrons déterministes (synthesis-deterministe.ts).
// ════════════════════════════════════════════════════════════════════════════════════════════

import { derivedOf, synthesisFacts, valueOf, type FactsSnapshot } from "../facts/contract.ts";
import { DEMOGRAPHY_PHRASE, isDemographyCode, type GwlScenarios, type UrbanRole } from "./facts.ts";
import { normaliserRoleUrbain, type RoleUrbain } from "./statut-urbain.ts";
import { estGrilleDensite, LIBELLE_GRILLE, limiteGrille, type ClasseGrille, type GrilleDensite } from "./grille-densite.ts";
import type { GasparCatnatSummary } from "../georisques.ts";
import type { VigieauSummary } from "../vigieau.ts";
import type { EaufranceSummary } from "../eaufrance.ts";
import { lireEcoulement } from "../eaufrance-ecoulement.ts";
import type { LittoralSummary } from "../littoral.ts";
import type { Era5Trend } from "../era5-trend.ts";

export const SYNTHESIS_MODEL = "claude-sonnet-4-6";

/**
 * TOUT ce qui peut changer le texte : projection, consigne, modèle, contrôles, patrons déterministes.
 * La monter invalide le cache de synthèse (clé = empreinte + horizon + cette version).
 */
// @6 (FUT-175 + FUT-176) : parts OSO rapportées aux terres, eau à part (FUT-175) ; rôle territorial lu au statut Insee,
// arrondissements, consigne et contrôle contre sa surinterprétation (FUT-176). Les deux @5 de branche ne sont jamais sortis.
// @7 (FUT-177) : catégorie d'occupation des sols dite en mots et limites OSO transmises ; contrôles « faible nature
// lue comme bâti », « urbanisé lu comme bâtiments », cadre de vie et écologie ; texte déterministe qui nomme les cultures.
// @8 (FUT-184) : la catégorie de densité est la classe de la grille communale Insee (DENS7), transmise à part de la
// densité moyenne, avec ce qu'elle dit, sa portée (commune entière, ville entière pour un arrondissement) et sa limite ;
// consigne et contrôles réécrits (« ville » et « rural » suivent la grille), patron déterministe en conséquence.
export const SYNTHESIS_CONTRACT_VERSION = `territoire-synthese@8:${SYNTHESIS_MODEL}`;

export type HorizonKey = "gwl15" | "gwl20" | "gwl30";
export const HORIZONS: HorizonKey[] = ["gwl15", "gwl20", "gwl30"];
export const HORIZON_META: Record<HorizonKey, { year: string; france: string }> = {
  gwl15: { year: "2030", france: "+2 °C" },
  gwl20: { year: "2050", france: "+2,7 °C" },
  gwl30: { year: "2100", france: "+4 °C" },
};

export function isHorizonKey(v: unknown): v is HorizonKey {
  return v === "gwl15" || v === "gwl20" || v === "gwl30";
}

const COMPOSITION_KEYS: Record<string, string> = {
  artificialise: "espaces_urbanises",
  agricole: "terres_agricoles",
  foret: "forets",
  prairies: "prairies",
  landes_pelouses: "landes_et_pelouses",
  mineral_dunes: "roche_et_dunes",
};

// FUT-176 : le rôle dit au modèle (et au patron déterministe), en mots courants, au statut Insee. Jamais
// « isolée » (le terme Insee « ville isolée » veut dire « agglomération d'une seule commune »), jamais « pôle »,
// jamais « ville » (une commune de banlieue de 171 habitants n'en est pas une). Statut inconnu : aucun rôle.
export const ROLE_TEXT: Record<RoleUrbain, string | null> = {
  ville_centre: "au centre de son agglomération",
  banlieue: "commune de banlieue de son agglomération",
  ville_isolee: "seule commune de son agglomération",
  hors_uu: "hors de toute agglomération (aucun ensemble bâti continu de 2 000 habitants)",
  dans_agglomeration: "commune d'une agglomération",
  inconnu: null,
};

/**
 * FUT-176 (contre-revue) : un arrondissement de Paris, Lyon ou Marseille n'a pas de statut Insee propre. L'index lui
 * prête celui de sa commune (ville-centre), mais Paris 20e n'est pas « au centre de son agglomération » : c'est Paris
 * qui l'est. Le rôle transmis dit donc l'appartenance à la commune, et le statut reste celui de la commune entière.
 * Les autres faits (population, densité…) restent ceux de l'arrondissement.
 */
export const ROLE_TEXT_ARRONDISSEMENT = "arrondissement d'une commune qui est au centre de son agglomération (le statut est celui de la commune entière, pas de l'arrondissement)";

/** Le rôle territorial transmis au modèle, ou null quand on ne sait rien (aucun texte n'est alors produit). */
export function roleTerritorialPourSynthese(role: UrbanRole | null): Record<string, unknown> | null {
  if (!role) return null;
  const r = normaliserRoleUrbain(role.role);
  if (role.arrondissementDe) {
    // Seul un arrondissement d'une ville-centre est connu (Paris, Lyon, Marseille). Un autre rôle serait une incohérence.
    if (r !== "ville_centre") return null;
    return {
      role: ROLE_TEXT_ARRONDISSEMENT,
      commune: role.arrondissementDe,
      agglomeration: role.uuLabel,
      population_agglomeration: role.uuPop,
    };
  }
  const texte = ROLE_TEXT[r];
  if (!texte) return null;
  return {
    role: texte,
    agglomeration: r === "hors_uu" ? null : role.uuLabel,
    population_agglomeration: r === "hors_uu" ? null : role.uuPop,
  };
}

const round1 = (n: number) => Math.round(n * 10) / 10;

/**
 * FUT-177 · CE QUE DIT CHAQUE CATÉGORIE D'OCCUPATION DES SOLS, la grille `landCategory` (facts.ts) mise en mots,
 * SANS CHIFFRE : un seuil écrit ici deviendrait un nombre admis par `checkNumbers`. « Faible présence d'espaces
 * naturels » pouvait se lire « très urbanisé » : ses terres se partagent pourtant entre cultures et espaces
 * urbanisés, aucun des deux n'atteignant la moitié (Carpiquet : 45 % de cultures, 41 % d'urbanisé). La phrase dit
 * donc aussi ce que la catégorie NE dit PAS. Un libellé ajouté à `LAND_LABEL` sans entrée ici est refusé par test.
 */
export const LAND_CATEGORY_MEANING: Record<string, string> = {
  "Majoritairement urbanisé": "Les espaces urbanisés couvrent au moins la moitié des terres. Ils comptent routes, parkings, zones industrielles et commerciales autant que les bâtiments : la catégorie ne dit ni la part couverte par des bâtiments, ni une densité de constructions.",
  "Forte présence naturelle": "Les espaces naturels couvrent près de la moitié des terres ou davantage, et les espaces urbanisés moins de la moitié.",
  "À dominante agricole": "Les cultures couvrent au moins la moitié des terres. Ce sont des terres agricoles, pas des espaces naturels.",
  "Faible présence d'espaces naturels": "Les espaces naturels couvrent moins d'un cinquième des terres ; le reste se partage entre cultures et espaces urbanisés, sans que les uns ni les autres atteignent la moitié des terres. La catégorie ne dit pas que la commune est bâtie ou très urbanisée : seule la composition dit la part de chacun.",
  "Occupation mixte": "Ni les espaces urbanisés ni les cultures n'atteignent la moitié des terres, et les espaces naturels en couvrent entre un cinquième et près de la moitié.",
};

/**
 * FUT-177 (A7) · LES LIMITES DE LA MESURE, transmises au modèle. La définition complète des espaces urbanisés vivait
 * dans le registre (`land.composition.limits`) sans atteindre la projection, qui disait « bâti, routes et surfaces
 * imperméabilisées » (un mot que `interdit:impermeabilisation` refuse ensuite dans le texte) : « urbanisé » pouvait
 * se lire « couvert de bâtiments ». Sans chiffre, pour la même raison (le millésime 2023 figure dans `source`).
 */
export const OSO_LIMITES_SYNTHESE = {
  source: "Carte d'occupation des sols OSO 2023 (CESBIO), établie à partir d'images satellite",
  echelle: "la commune entière, sur la surface que la carte a classée (les pixels non classés, de part non mesurée, n'y figurent pas)",
  espaces_urbanises: "Tout ce que le satellite voit comme construit ou revêtu : bâtiments, mais aussi routes, parkings, zones industrielles et commerciales. Ce n'est ni la part couverte par des bâtiments, ni une densité de constructions, ni la mesure réglementaire de l'occupation du sol (OCS GE), qui suit d'autres règles.",
  ce_que_la_mesure_ne_dit_pas: "Ni l'accès à la nature, ni les espaces verts urbains (parcs, jardins), que la carte ne distingue pas, ni le calme, ni la biodiversité, ni le cadre de vie, ni ce qui se passe dans un quartier.",
} as const;

/**
 * LA VALEUR DE RÉFÉRENCE 1976-2005, telle que la carte l'affiche (« ≈ 7 → 19 jours chauds »). DRIAS ne
 * la publie pas : elle se reconstruit par horizon (projeté − écart), et l'on prend la médiane des trois
 * horizons, exactement comme `reconstructReference` dans QuartierClimatData.tsx. Elle est donnée au
 * modèle (D11 : ce que l'écran montre) pour qu'il ne la recalcule pas lui-même.
 */
function reference(scen: GwlScenarios | null, abs: string, anom: string): number | null {
  const refs = HORIZONS
    .map((h) => {
      const p = scen?.[h]?.v?.[abs];
      const a = scen?.[h]?.v?.[anom];
      return typeof p === "number" && typeof a === "number" ? p - a : null;
    })
    .filter((x): x is number => x != null)
    .sort((a, b) => a - b);
  return refs.length ? refs[Math.floor((refs.length - 1) / 2)] : null;
}

function metric(v: Record<string, number> | null, abs: string, anom?: string, scen?: GwlScenarios | null) {
  const valeur = v?.[abs];
  if (typeof valeur !== "number") return null;
  const ecart = anom ? v?.[anom] : undefined;
  if (typeof ecart !== "number") return { valeur: round1(valeur) };
  const ref = anom && scen ? reference(scen, abs, anom) : null;
  return {
    valeur: round1(valeur),
    ecart_par_rapport_a_1976_2005: round1(ecart),
    ...(ref != null ? { valeur_de_reference_1976_2005: round1(ref) } : {}),
  };
}

/**
 * FUT-184 · CE QUE DIT CHAQUE CLASSE DE LA GRILLE, pour le modèle. Sans aucun seuil chiffré : ceux de l'Insee portent
 * sur des ensembles de carreaux de 1 km², jamais sur la commune, et un chiffre transmis se lirait comme une population
 * ou une densité communale. Chaque phrase dit la répartition des habitants, puis ce que la classe ne dit pas.
 */
export const GRILLE_MEANING: Record<ClasseGrille, string> = {
  1: "Les habitants de la commune vivent surtout dans un grand ensemble urbain dense, qui peut s'étendre sur plusieurs communes.",
  2: "Les habitants de la commune vivent surtout dans un ensemble urbain dense de taille moyenne, qui peut s'étendre sur plusieurs communes.",
  3: "Les habitants de la commune vivent surtout dans un ensemble urbain de densité intermédiaire, à l'écart des ensembles denses. La taille en cause est celle de cet ensemble, qui peut déborder la commune : ce n'est pas la population de la commune.",
  4: "Les habitants de la commune vivent surtout dans des secteurs de densité intermédiaire voisins d'un ensemble urbain dense, en ceinture d'agglomération. Ce classement ne mesure ni une distance à une ville, ni des trajets.",
  5: "Les habitants de la commune vivent surtout dans un bourg au sens de l'Insee : un petit ensemble habité assez dense, en milieu rural. Ce classement porte sur cet ensemble, pas sur la population totale de la commune.",
  6: "Les habitants de la commune vivent surtout dans des secteurs modérément peuplés, sans former un bourg ni un ensemble urbain au sens de l'Insee. Ce classement ne décrit ni la forme du village, ni l'habitat d'une adresse.",
  7: "Les habitants de la commune vivent surtout dans des secteurs très peu peuplés. Ce classement ne décrit ni la forme du village, ni l'habitat d'une adresse.",
};

/** La grille transmise au modèle : la classe, sa portée, ce qu'elle dit, sa limite. `null` : grille inconnue. */
export function grillePourSynthese(g: GrilleDensite | null): Record<string, unknown> | null {
  if (!g) return null;
  const ville = g.perimetre === "commune_parente" ? g.ville ?? null : null;
  return {
    categorie: LIBELLE_GRILLE[g.classe],
    echelle: ville ? `commune entière de ${ville} : la grille ne classe pas les arrondissements` : "commune entière",
    ce_que_dit_la_categorie: GRILLE_MEANING[g.classe],
    limite: limiteGrille(g),
  };
}

/**
 * LA PROJECTION : ce que le modèle reçoit, et rien d'autre. Construite UNIQUEMENT à partir des faits
 * `include: true` du snapshot (synthesisFacts), jamais d'une source relue. Les catégories
 * déterministes (`categorie`) y figurent à côté de leurs chiffres : le modèle les réutilise, il ne
 * les requalifie pas (D3, D4).
 */
export function projectForSynthesis(snapshot: FactsSnapshot, horizon: HorizonKey): Record<string, unknown> {
  const allowed = synthesisFacts(snapshot);
  const has = (key: string) => allowed.facts.some((f) => f.key === key);
  const get = <V>(key: string): V | null => (has(key) ? valueOf<V>(snapshot, key) : null);
  const cat = (key: string) => (allowed.derived.some((d) => d.key === key) ? derivedOf(snapshot, key) : null);
  const meta = HORIZON_META[horizon];

  const role = get<UrbanRole>("place.urban_role");
  const composition = get<Record<string, number>>("land.composition");
  const eau = get<number>("land.water_share");
  const trend = get<{ annualPct: number | null; newcomersPct: number | null; code: string | null }>("demography.trend");
  const demoCat = cat("demography.category");
  const scen = get<GwlScenarios>("climate.scenarios");
  const v = scen?.[horizon]?.v ?? null;
  const era5 = get<Era5Trend>("climate.era5_trend");
  const vigieau = get<Omit<VigieauSummary, "consultedAt">>("water.restrictions");
  const river = get<NonNullable<EaufranceSummary["drought"]>>("water.river_drought");
  const risks = get<{ flood: boolean; marineSubmersion: boolean }>("risk.georisques");
  const catnat = get<GasparCatnatSummary>("risk.catnat");
  const littoral = get<LittoralSummary>("coast.littoral");
  const secondary = get<number>("housing.secondary_share");
  const vacancy = get<number>("housing.vacancy_share");
  const forestAdeme = get<number>("land.forest_ademe");
  const grille = get<unknown>("place.density_grid");

  return {
    commune: {
      nom: get<string>("place.name"),
      population_habitants: get<number>("place.population"),
      // FUT-184 : la densité moyenne, en chiffre seulement ; sa catégorie est désormais la grille, transmise à part.
      densite: get<number>("place.density") != null ? { habitants_par_km2: round1(get<number>("place.density")!) } : null,
      grille_densite_insee: grillePourSynthese(estGrilleDensite(grille) ? grille : null),
      typologie: get<string>("place.typology"),
      role_territorial: roleTerritorialPourSynthese(role),
    },
    horizon: { annee: meta.year, scenario_france: meta.france },
    occupation_des_sols: composition
      ? {
          categorie: cat("land.category")?.label ?? null,
          part_espaces_naturels_des_terres_pct: get<number>("land.natural_share"),
          part_eau_de_la_commune_pct: eau,
          composition_des_terres_pct: Object.fromEntries(
            Object.entries(composition)
              .filter(([, x]) => typeof x === "number" && x >= 1)
              .sort(([, a], [, b]) => b - a)
              .map(([k, x]) => [COMPOSITION_KEYS[k] ?? k, round1(x)]),
          ),
          // FUT-177 : la catégorie en mots ; le modèle la cite, il ne la reconstruit pas avec ses propres adjectifs.
          ce_que_dit_la_categorie: LAND_CATEGORY_MEANING[cat("land.category")?.label ?? ""] ?? null,
          definition: "Les parts sont rapportées aux TERRES de la commune, l'eau (mer, étangs, lacs, rivières) étant comptée à part, en % de sa surface cartographiée. Trois familles se partagent les terres : espaces urbanisés, terres agricoles (cultures) et espaces naturels. Espaces naturels = forêts, prairies, landes et pelouses, roche et dunes ; ni les cultures ni l'eau n'en font partie. Espaces urbanisés, source et échelle de la mesure : voir \"limites\".",
          limites: OSO_LIMITES_SYNTHESE,
        }
      : null,
    boisement_ademe_pct: forestAdeme != null
      ? { valeur: forestAdeme, limite: "Définition et millésime non documentés : ne permet aucune conclusion forte." }
      : null,
    demographie: trend && demoCat && isDemographyCode(demoCat.value)
      ? {
          categorie: demoCat.label,
          observation: DEMOGRAPHY_PHRASE[demoCat.value],
          // DEUX MESURES, DEUX TEMPORALITÉS (correction du 28/09). Vu en réel : « près de 10 %
          // d'arrivants récents entre 2015 et 2021 ». La période 2015-2021 est celle de l'évolution ;
          // la part d'arrivants se mesure par rapport à l'année précédant le recensement, elle ne se
          // cumule pas sur plusieurs années.
          evolution_de_la_population: {
            pct_par_an: trend.annualPct,
            periode: "2015-2021",
          },
          arrivants_recents: {
            part_des_habitants_pct: trend.newcomersPct,
            definition: "Part des habitants qui vivaient dans une autre commune un an avant le recensement de 2021. Une situation mesurée sur une seule année, jamais un cumul sur plusieurs années.",
          },
          limite: "Aucune mesure d'attractivité.",
        }
      : null,
    residences_secondaires: secondary != null
      ? { part_pct: round1(secondary), categorie: cat("seasonality.category")?.label ?? null }
      : null,
    logements_vacants: vacancy != null
      ? { part_pct: vacancy, limite: "Un seul indicateur : il ne dit rien de la tension du marché ni de l'attractivité." }
      : null,
    climat_projete: v
      ? {
          jours_au_dessus_de_30C: metric(v, "NORTX30D_yr", "ATX30D_yr", scen),
          jours_au_dessus_de_35C: metric(v, "NORTX35D_yr"),
          nuits_au_dessus_de_20C: metric(v, "NORTR_yr", "ATR_yr", scen),
          temperature_moyenne_ete_C: metric(v, "NORTMm_seas_JJA", "ATMm_seas_JJA", scen),
          temperature_moyenne_hiver_C: metric(v, "NORTMm_seas_DJF", "ATMm_seas_DJF", scen),
          jours_de_sols_secs_par_an: metric(v, "NORSWI04_yr"),
          jours_de_pluie_intense_par_an: metric(v, "NORRRq99refD_yr"),
          pluie_journaliere_extreme_mm: metric(v, "NORRRq99_yr"),
          jours_de_conditions_meteo_favorables_au_feu: metric(v, "NORIFM40_yr"),
          periode_de_reference: "1976-2005",
          note: "Ces indicateurs comptent un nombre de jours sur l'année ; ils ne permettent pas, à eux seuls, de déduire la durée ni la continuité d'une période.",
        }
      : null,
    tendance_observee: era5
      ? { rechauffement_observe_C: round1(era5.delta_c), periode: `depuis 1961-1990, jusqu'en ${era5.data_through_year}` }
      : null,
    restrictions_eau_en_vigueur: vigieau?.maxLevel && vigieau.maxLevel !== "vigilance"
      ? { niveau: vigieau.maxLevel, bassin: vigieau.topZone?.label ?? null }
      : null,
    // FUT-163 (01/11/2026) : l'état BRUT décide, jamais `isDry`. Un snapshot enregistré garde le booléen du jour de
    // sa collecte ; « Ecoulement non visible » avec `isDry: true` n'y est pas un assec.
    cours_eau_a_sec_observe: river && lireEcoulement(river).etat === "assec" ? { nom: river.riverName ?? null } : null,
    risques_recenses_echelle_communale: risks
      ? {
          inondation: risks.flood ? "recensé" : "non recensé",
          submersion_marine: risks.marineSubmersion ? "recensé" : "non recensé",
        }
      : null,
    catastrophes_naturelles_reconnues: catnat && catnat.total > 0
      ? {
          nombre_arretes: catnat.total,
          premiere_annee: catnat.firstYear,
          derniere_annee: catnat.lastYear,
          principaux_aleas: catnat.byRisk.slice(0, 3),
        }
      : null,
    littoral: littoral && (littoral.erosion || littoral.traitDeCote.concernee)
      ? {
          inscrit_recul_trait_de_cote: littoral.traitDeCote.concernee,
          // Un littoral aménagé (digues, port) n'a que peu de segments mesurables : sa part de recul
          // n'a pas de sens (la carte ne l'affiche pas non plus), seule sa classe est donnée.
          littoral_amenage: littoral.erosion?.amenage ?? false,
          erosion_classe: littoral.erosion?.classe ?? null,
          erosion_part_du_littoral_qui_recule_pct: littoral.erosion && !littoral.erosion.amenage ? littoral.erosion.pctRecul ?? null : null,
          periode_observee: littoral.erosion?.periode ? `${littoral.erosion.periode[0]}-${littoral.erosion.periode[1]}` : null,
        }
      : null,
  };
}

// ── La consigne ──────────────────────────────────────────────────────────────────────────────

export const SYNTHESIS_SYSTEM = `Vous êtes l'analyste éditorial de futur•e pour le module Territoire. Vous répondez à une seule question : « Que raconte ce territoire à cet horizon, pour quiconque s'y intéresse ? ». La lecture est GÉNÉRIQUE : elle ne s'adresse à personne en particulier, elle ne suppose ni que le lecteur vit ici ni qu'il envisage de s'y installer. Votre travail n'est pas de décrire tous les signaux (les cartes s'en chargent juste en dessous), mais de RELIER et de HIÉRARCHISER ce que les données montrent.

VOIX ÉDITORIALE — RÈGLES ABSOLUES
- Vouvoiement si vous vous adressez au lecteur, mais préférez parler du territoire. Jamais de tutoiement.
- Ton calme, humain, accessible, intelligent. Jamais alarmiste, jamais militant, jamais institutionnel.
- Pas d'exclamations, pas de questions rhétoriques, pas d'emoji.
- Pas de tirets cadratin. Utilisez des deux-points, des virgules, des points.
- Pas d'antithèse d'emphase ("c'est X, pas Y", "non pas X mais Y"). Affirmez directement ce qui est.
- Pas de phrases IA-typiques ("il convient de", "force est de constater") ni de superlatifs vides.
- Ne citez jamais les sources dans le texte : elles sont affichées séparément.
- Les chiffres sont des preuves, pas le moteur du texte.
- Jargon interdit : "régime climatique", "bassin versant", "aléa", "résilience", "stress hydrique", "vulnérabilité", "artificialisation" et ses dérivés, "évapotranspiration", "tissu urbain", "frange littorale", "régime hydrique", "front de mer" (dites "bord de mer").
- Test de lecture : une personne de 60 ans qui ne lit jamais de rapports comprend chaque phrase du premier coup.

LES FAITS FOURNIS SONT LES SEULS FAITS
- Chaque affirmation doit se rattacher à un champ du payload. Ne comblez jamais un manque par une connaissance générale de la commune.
- Les champs "categorie" sont des qualifications DÉTERMINISTES, affichées telles quelles à l'écran. Réutilisez-les. Ne les requalifiez jamais avec vos propres adjectifs : si la grille de densité classe la commune "Centre urbain intermédiaire", n'écrivez ni "dense", ni "très dense", ni "peu dense". Si l'occupation des sols est "Occupation mixte", n'écrivez pas que le territoire est "très urbanisé", "très bâti" ou qu'il a "peu d'espaces verts".
- Occupation des sols : appuyez-vous sur la catégorie, sur ce qu'elle dit ("ce_que_dit_la_categorie") et sur la composition fournies. N'inventez aucune couverture d'arbres, d'ombre ou de végétation des rues. Les parts portent sur les terres ; l'eau est une part de la commune, à part : ne la présentez jamais comme un espace naturel ou vert, et n'additionnez pas une part d'eau à une part des terres.
- Les terres se partagent entre trois familles : espaces urbanisés, cultures, espaces naturels. Le peu de l'une ne prouve pas la dominance d'une autre : "Faible présence d'espaces naturels" ne veut pas dire que la commune est bâtie ou très urbanisée (les cultures peuvent y tenir plus de place que les espaces urbanisés) ; "À dominante agricole" ne veut pas dire naturel. N'écrivez jamais "peu de nature, donc urbanisé".
- Espaces urbanisés : ce que le satellite voit comme construit ou revêtu, routes, parkings et zones d'activité compris (voir "limites"). N'en tirez ni une part de bâtiments ("50 % de bâtiments", "couvert de constructions"), ni une densité de constructions, ni un territoire "bâti" ou "construit".
- La composition des sols ne dit rien de l'accès à la nature, des espaces verts, du calme, de la biodiversité ni du cadre de vie : ne les déduisez pas.
- Démographie : décrivez ce qui est mesuré. L'évolution de la population porte sur 2015-2021. La part d'arrivants récents est une situation sur UNE année ("X % des habitants vivaient ailleurs un an plus tôt") : ne l'associez jamais à la période 2015-2021 ni à plusieurs années. N'écrivez jamais que la commune "attire", est "attractive", "recherchée" ou "prisée" : aucune donnée ne mesure l'attractivité.
- Catastrophes naturelles : la "sécheresse des sols" reconnue en catastrophe naturelle (dommages aux bâtiments, argiles) n'est pas le même objet que les "jours de sols secs" projetés (un indicateur climatique). Citez-les séparément si besoin, sans jamais présenter l'un comme le prolongement ou l'annonce de l'autre.
- Logements vacants : un chiffre, rien de plus. Ne concluez ni à une tension du marché, ni à une disponibilité des biens, ni à une attractivité.
- Sols et eau : aucune donnée ne décrit l'imperméabilisation des sols, l'absorption de l'eau ou le ruissellement. N'en parlez pas. Des pluies plus intenses ne prouvent pas de débordement ni un mécanisme précis : restez sur ce que disent les chiffres.
- Grille de densité ("grille_densite_insee") : un classement statistique de l'Insee qui porte sur la commune ENTIÈRE, d'après la façon dont ses habitants se répartissent sur son territoire. Citez sa catégorie telle quelle et appuyez-vous sur "ce_que_dit_la_categorie". Elle ne décrit ni un quartier, ni une adresse, ni la forme du bourg ou de l'habitat, ni les services ou les transports, et elle ne dit pas combien d'habitants compte la commune. Elle est distincte de la densité moyenne ("habitants_par_km2") et du rôle territorial : citez-les séparément, sans présenter l'un comme corrigeant ou contredisant l'autre. N'appelez pas "ville" une commune que la grille classe rurale. Quand son échelle est la commune entière de Paris, Lyon ou Marseille, ne l'attribuez jamais à l'arrondissement, et ne qualifiez pas vous-même la densité de l'arrondissement ("dense", "peu dense") : donnez son chiffre.
- Pas de classement national ("parmi les communes les plus…", "l'une des villes les plus…") : aucune donnée comparative n'est fournie.
- Rôle territorial ("role_territorial") : c'est un classement statistique de l'Insee, qui dit seulement si la commune fait partie d'un ensemble bâti continu d'au moins 2 000 habitants, et à quelle place. Reprenez-le tel quel. N'en déduisez jamais la présence de services ou de commerces, l'animation, l'isolement, ni un rôle de "pôle" ou de "centre de vie" pour les environs. N'écrivez jamais que la commune est "isolée", et n'appelez pas "ville" une commune que le payload ne présente pas comme telle. Quand le rôle présente un arrondissement, c'est la commune nommée ("commune"), pas l'arrondissement, qui est au centre de l'agglomération : n'écrivez jamais que l'arrondissement est une ville-centre ou au centre de l'agglomération. S'il est absent, n'en parlez pas.
- Pas de psychologie collective : n'affirmez jamais ce que les habitants pensent, ressentent, attendent ou recherchent ("les résidents comptent sur…", "on attend…"), ni ce qu'on "voit rarement", "pense rarement" ou "oublie".
- Pas de comparaison sans donnée comparative : ni "beaucoup pour une commune de cette densité", ni "peu pour une ville de cette taille", ni "remarquable compte tenu de…". Donnez le chiffre, sans le juger par rapport à d'autres communes.
- Eau : les jours de sols secs, les catastrophes naturelles reconnues et les restrictions d'eau en vigueur sont des faits distincts. Juxtaposez-les si besoin ; n'en tirez aucune conclusion sur une tension, une pression, une rareté ou un accès futur à la ressource en eau : aucune donnée ne la mesure.
TROIS NIVEAUX : CE QUI EST LIBRE, CE QUI SE COMPOSE, CE QUI EST INTERDIT
1. LIBERTÉ ÉDITORIALE (encouragée) : choisir un fil conducteur, sélectionner quelques faits plutôt que tout répéter, reformuler, condenser, faire des transitions, signaler une limite. Une sélection prudente est bienvenue : "la chaleur estivale ressort parmi les évolutions les plus visibles", "constitue un fil conducteur de cette projection". Ce qui est interdit, c'est la hiérarchie OBJECTIVE qu'aucune donnée ne calcule : "le fait le plus structurant", "l'enjeu principal", "le phénomène dominant", "ce qui pèse le plus".
2. COMPOSITION AUTORISÉE : deux faits peuvent être reliés ("prolonge", "confirme", "va dans le même sens") seulement s'ils mesurent la même grandeur. Aujourd'hui, une seule composition l'est : le réchauffement observé depuis 1961-1990 et les températures projetées.
3. INFÉRENCE INTERDITE : aucun mécanisme causal, aucune conséquence future, aucune nouvelle grandeur tirés de faits seulement voisins. Vous pouvez les citer dans le même bloc, séparément, jamais les relier. En particulier :
   - densité ou part urbanisée × chaleur ou nuits chaudes : n'écrivez pas que l'une rend l'autre plus pénible ;
   - pluies intenses projetées × inondations reconnues en catastrophe naturelle : pas de continuité ("s'inscrit dans", "prolonge un problème connu") ;
   - jours de sols secs × sécheresse reconnue en catastrophe naturelle : idem ;
   - arrivants récents × besoins futurs (eau, fraîcheur, services, logements) : la part d'arrivants n'est ni un flux annuel, ni une pression, ni un besoin ;
   - marché, attractivité, tension sur l'eau : aucune donnée ;
   - pas de conséquence non mesurée ("a des effets sur les paysages et les usages") et pas de fait absent du payload (l'altitude, par exemple, n'y figure pas) ;
   - pas de qualité que la donnée ne mesure pas : une photo d'une date n'établit ni la stabilité ("un cadre stable"), ni la constance ("une place constante"), ni des usages ("une diversité d'usages"). Une catégorie fournie ("globalement stable" pour la démographie) reste, elle, citable.
- Pas de changement d'échelle : une donnée communale ne décrit ni une rue ni un quartier.
- Risques : "non recensé" autorise à dire qu'aucun périmètre n'est recensé ; jamais d'affirmer une exposition. "recensé" autorise à dire qu'une partie du territoire est concernée ; jamais de le nier.
- Ne dites "rural" que pour citer la grille de densité quand elle classe la commune rurale ("Bourg rural", "Commune rurale de faible densité", "Commune rurale de très faible densité"). Ne dites jamais "station balnéaire" : aucune donnée ne l'établit.

PÉRIMÈTRE : LA COMMUNE, RIEN EN DESSOUS
- Vous traitez le territoire à l'échelle communale : ce qu'il est, ce qui le transforme, ce à quoi il est exposé.
- Vous ne concluez JAMAIS sur ce qui se joue sous cette échelle : le voisinage d'une adresse (commerces, école, gare, espace vert, îlot de chaleur) et le logement lui-même (bâti, état, âge, confort, valeur, dommages). Aucune donnée du payload ne décrit le bâti : n'en parlez pas.
- Ni sur le corps (santé, exposition individuelle), ni sur les projets personnels (achat, enfants, retraite).
- Il n'existe que trois modules : Territoire (vous êtes ici), Autour de l'adresse, Logement. N'en inventez pas d'autre.

CHIFFRES
- N'écrivez en chiffres que des valeurs présentes dans le payload, éventuellement arrondies ("38 %" pour 37,9), ou précédées de "environ" ou "près de" lorsque c'est exact.
- Les écarts à la période 1976-2005 ("ecart_par_rapport_a_1976_2005") et les valeurs de cette période ("valeur_de_reference_1976_2005") sont fournis : citez-les tels quels, ne les recalculez pas. Un écart n'est pas une valeur : "19 jours au-dessus de 30 °C" n'est pas "19 jours de plus".
- Aucun calcul : pas de ratio, pas de "x fois plus", pas de différence entre deux horizons, pas de conversion de jours en semaines ou en mois. Un nombre de jours sur l'année ne dit rien de la durée ni de la continuité d'une période.

FORMAT DE SORTIE
Strictement :
1. Première ligne : un titre court de la forme "{Nom de la commune} à l'horizon {année}"
2. Une ligne vide.
3. Trois blocs, chacun introduit par exactement "## {nom du bloc}" sur sa propre ligne, suivi d'une ligne vide, puis de 2 à 5 phrases.

Les trois blocs, dans cet ordre exact :
## Ce qui domine
Le fil conducteur que vous choisissez parmi les évolutions visibles, incarné dans le quotidien. Présentez-le comme un choix de lecture ("ressort parmi…", "fil conducteur"), jamais comme le phénomène objectivement dominant.

## Ce qui tient, ce qui se tend
Un atout établi par les données, et le compromis qui émerge. Une force réelle, et son prix.

## Ce qu'on sous-estime ici
Un phénomène moins visible mais étayé par les chiffres. S'il n'y en a pas, recentrez sobrement sur la lecture d'ensemble. Vous pouvez indiquer en une phrase que l'effet concret dépendra du quartier et du logement (modules Autour de l'adresse et Logement), sans les traiter.

ARBITRER, PAS INVENTORIER
- Au plus trois phénomènes sur l'ensemble de la synthèse. Une synthèse plus courte et plus juste vaut mieux qu'une synthèse qui case tout.
- Entre 250 et 420 mots au total.

DONNÉES
L'utilisateur vous transmet un payload JSON. Utilisez-le sans le réciter.`;

export function synthesisUserMessage(projection: Record<string, unknown>, horizon: HorizonKey, violations?: string[]): string {
  const meta = HORIZON_META[horizon];
  const commune = (projection.commune as { nom?: string } | undefined)?.nom ?? "la commune";
  const correction = violations && violations.length > 0
    ? `\n\nVOTRE VERSION PRÉCÉDENTE A ÉTÉ REFUSÉE par les contrôles de cohérence, pour ces raisons :\n${violations.map((x) => `- ${x}`).join("\n")}\nRéécrivez la synthèse entière en corrigeant ces points, sans en introduire d'autres.`
    : "";
  return `Commune : ${commune}. Horizon : ${meta.year} (scénario France ${meta.france}).

Produisez la sortie selon vos règles de format. Ne récitez pas le payload, utilisez-le.${correction}

DONNÉES :
${JSON.stringify(projection, null, 2)}`;
}
