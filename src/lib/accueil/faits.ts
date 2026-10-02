// LES FAITS D'UNE COMMUNE, TELS QUE L'ACCUEIL PEUT LES AFFIRMER (FUT-37). Module PUR, client et serveur.
//
// Ils alimentent deux choses : le contexte donné au modèle par /qna, et la réponse de repli
// déterministe. Les deux lisent donc EXACTEMENT les mêmes valeurs, et rien d'autre : aucune réponse
// éditoriale écrite pour une autre commune (la table `tension_answers` servait La Rochelle à toute
// commune littorale et « les sols charentais » à toute la France), aucun chiffre qui ne soit pas ici.
//
// L'horizon est celui du dossier (CLIMAT_HORIZON, gwl20 = 2050, +2,7 °C en France), pris dans
// horizons.ts. Avant FUT-37, l'accueil envoyait gwl30 (2100, +4 °C) étiqueté « 2050 ».
import { HORIZON } from "../horizons.ts";
import { CLIMAT_HORIZON, reconstructReference, type GwlScenarios } from "../decision/climat-facts.ts";
import type { Indicators, GeorisquesFlags } from "./recits.ts";

export type Mesure = { projete: number | null; reference: number | null; unite: "jours/an" | "nuits/an" | "°C" };

export type FaitsCommune = {
  commune: string;
  horizon: { annee: string; scenario: string; rechauffement_france: string; reference: string };
  /** null : DRIAS n'a pas pu être lu pour cette commune. */
  climat: {
    jours_au_dessus_de_35C: Mesure;
    jours_au_dessus_de_30C: Mesure;
    nuits_tropicales_20C: Mesure;
    jours_meteo_propice_aux_feux_IFM40: Mesure;
    jours_de_sol_sec_SWI04: Mesure;
    temperature_moyenne_hiver_C: Mesure;
  } | null;
  /** null : Géorisques n'a pas pu être lu. Sinon, des faits ACTUELS au grain de la commune. */
  risques_recenses_sur_la_commune: {
    submersion_marine: boolean;
    inondation: boolean;
    tassements_argiles: boolean;
    mouvement_de_terrain: boolean;
    feu_de_foret: boolean;
    libelles: string[];
  } | null;
  notes: string[];
};

const r1 = (x: number | null) => (x == null ? null : Math.round(x * 10) / 10);

function enScenarios(ind: Indicators): GwlScenarios {
  const out: GwlScenarios = {};
  for (const [gwl, parCle] of Object.entries(ind ?? {})) {
    const v: Record<string, number> = {};
    for (const [cle, x] of Object.entries(parCle ?? {})) {
      const n = x?.value_numeric;
      if (typeof n === "number" && Number.isFinite(n)) v[cle] = n;
    }
    out[gwl] = { h: gwl, v };
  }
  return out;
}

/** Ce que les faits ne disent pas, envoyé au modèle avec eux. Constant : jamais repris du navigateur. */
export const NOTES_FAITS: readonly string[] = [
  "Les valeurs climatiques sont des projections DRIAS-TRACC (médiane des modèles) pour la commune, à l'horizon indiqué, et leur référence 1976-2005 reconstruite. Aucune n'est une valeur actuelle.",
  "Un nombre de jours par an ne dit rien de la durée ni de la continuité d'une période.",
  "Les jours de sol sec décrivent l'humidité du sol pour la végétation ; ils ne mesurent ni les nappes, ni les rivières, ni l'eau du robinet.",
  "L'indice forêt-météo décrit une météo favorable aux feux, pas la probabilité qu'un incendie se déclare.",
  "Les risques recensés sont des faits actuels, à l'échelle de la commune : ils ne disent ni quelle partie est concernée, ni comment ils évolueront.",
];

/** L'horizon des faits : celui du dossier. */
export function horizonDesFaits(): FaitsCommune["horizon"] {
  const h = HORIZON[CLIMAT_HORIZON as keyof typeof HORIZON];
  return { annee: h.annee, scenario: h.key, rechauffement_france: h.france, reference: "1976-2005" };
}

/** La forme renvoyée par `getClimatDataCommune` (commune.s) convertie en celle de l'accueil. */
export function indicatorsDepuisScenarios(s: GwlScenarios | null | undefined): Indicators {
  const out: Indicators = {};
  for (const [gwl, sc] of Object.entries(s ?? {})) {
    out[gwl] = Object.fromEntries(Object.entries(sc?.v ?? {}).map(([k, n]) => [k, { value_numeric: n }]));
  }
  return out;
}

export function construireFaitsCommune(
  commune: string,
  indicators: Indicators | null | undefined,
  georisques: { flags?: GeorisquesFlags | null; riskLabels?: string[] | null } | null | undefined,
): FaitsCommune {
  const sc = enScenarios(indicators ?? {});
  const aDuClimat = Object.values(sc).some((s) => Object.keys(s.v).length > 0);
  const mesure = (absolu: string, ecart: string | null, unite: Mesure["unite"]): Mesure => ({
    projete: r1(sc[CLIMAT_HORIZON]?.v?.[absolu] ?? null),
    reference: r1(ecart ? reconstructReference(sc, absolu, ecart) : null),
    unite,
  });
  const f = georisques?.flags;
  return {
    commune,
    horizon: horizonDesFaits(),
    climat: aDuClimat
      ? {
          jours_au_dessus_de_35C: mesure("NORTX35D_yr", "ATX35D_yr", "jours/an"),
          jours_au_dessus_de_30C: mesure("NORTX30D_yr", "ATX30D_yr", "jours/an"),
          nuits_tropicales_20C: mesure("NORTR_yr", "ATR_yr", "nuits/an"),
          jours_meteo_propice_aux_feux_IFM40: mesure("NORIFM40_yr", "AIFM40_yr", "jours/an"),
          jours_de_sol_sec_SWI04: mesure("NORSWI04_yr", "ASWI04_yr", "jours/an"),
          temperature_moyenne_hiver_C: mesure("NORTMm_seas_DJF", "ATMm_seas_DJF", "°C"),
        }
      : null,
    risques_recenses_sur_la_commune: f
      ? {
          submersion_marine: Boolean(f.marineSubmersion),
          inondation: Boolean(f.flood),
          tassements_argiles: Boolean(f.clay),
          mouvement_de_terrain: Boolean(f.landslide),
          feu_de_foret: Boolean(f.wildfire),
          libelles: Array.isArray(georisques?.riskLabels) ? georisques!.riskLabels!.slice(0, 12) : [],
        }
      : null,
    notes: [...NOTES_FAITS],
  };
}
