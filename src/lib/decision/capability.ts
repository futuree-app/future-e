// CE QUE futur•e SAIT CONCLURE SUR UN CRITÈRE (FUT-7, 01/10/2026). Lib PURE.
//
// Trois capacités, et seule la première peut fonder « Condition non respectée » :
//
//   trancher        une mesure exactement alignée sur ce que le lecteur a dit répond oui ou non ;
//   apprecier       une donnée éclaire, sans conclure : une convention de futur•e, un rang, une
//                   distance mesurée depuis un point qui n'est pas celui que vise la condition ;
//   ne_pas_mesurer  aucune donnée ne répond aujourd'hui, ou un paramètre indispensable manque.
//
// ── CE DONT ELLE DÉPEND, ET CE DONT ELLE NE DÉPEND JAMAIS ─────────────────────────────────────
// Elle dépend du CRITÈRE TEL QU'IL EST DÉCLARÉ (sa clé ET ses paramètres) et du GRAIN évalué. Une
// table `clé → capacité` ne suffit pas : « près d'un lieu » se tranche avec un temps de trajet et un
// mode à l'adresse, s'apprécie avec des kilomètres, ne se mesure pas à vélo.
//
// Elle ne dépend JAMAIS du lieu, de la donnée disponible ici, du résultat de l'évaluation, du poids ni
// de la confirmation. Une donnée qui manque sur une commune est une ISSUE LOCALE (`inconclusive`),
// pas une capacité : la mélanger ferait dire « futur•e ne sait pas » là où il faut dire « la donnée
// manque ici ». C'est pourquoi cette fonction ne reçoit aucun `ModuleFacts`.
//
// ── CE N'EST PAS LA CIBLE : LA CIBLE EST DE TRANCHER LE PLUS POSSIBLE ─────────────────────────
// La prudence de cette table est la conséquence du schéma ACTUEL, qui perd de l'information. Ce n'est
// pas une doctrine définitive. futur•e tranche dès qu'une demande se traduit en une définition
// opérationnelle exacte, transparente et défendable, de deux façons :
//   A. une mesure qui correspond exactement à ce que le lecteur a formulé (métrique, seuil, mode, grain) ;
//   B. une CONVENTION de futur•e (la montagne, une petite ville, la proximité de la mer) justifiée,
//      précise, versionnée, visible, et ACCEPTÉE par le lecteur comme le sens de sa condition.
// Dans le cas B, la confirmation porte sur la définition elle-même : elle entre dans les paramètres du
// critère, donc dans son empreinte (`criterion-value.ts`), et cette fonction pourra alors rendre
// « trancher ». Rien ici ne l'empêche : la capacité lit déjà les paramètres du critère, pas sa seule
// famille. FUT-8 n'aura qu'à ajouter ces paramètres et leurs branches.
//
// ── LE SCHÉMA ACTUEL LIMITE CE QUI SE TRANCHE, ET C'EST ASSUMÉ ───────────────────────────────
// Le projet n'enregistre ni l'unité d'une taille (commune ou agglomération), ni la provenance d'un
// seuil (dit par le lecteur ou posé par la consigne du parseur), ni le caractère « à vol d'oiseau »
// d'une distance. La distance à la mer, elle, est toujours celle du point de référence de la commune.
// Ces critères restent donc `apprecier` tant que le projet ne porte pas ces précisions (FUT-8).
import type { HardConstraintKey } from "../hard-constraints.ts";
import { ROUTABLE_MODES } from "../hard-constraints.ts";
import type { PreferenceKey } from "../comparateur-vie.ts";
import type { HardConstraints } from "../hard-constraint-schema.ts";
import { hardZoneAnchorsDe, nearPlaceThreshold } from "../hard-constraints-hydrate.ts";
import { ZONE_TABLE } from "../geo-zones.ts";
import { conventionPar, conventionTranchable } from "./conventions.ts";

export type Capability = "trancher" | "apprecier" | "ne_pas_mesurer";
export type EvaluationGrain = "commune" | "adresse";

// POURQUOI. Une liste fermée : elle sert aux tests, et à la phrase qui explique au lecteur pourquoi
// futur•e ne tranche pas.
export type CapabilityReason =
  | "perimetre_administratif"   // département, région administrative : appartenance exacte
  | "temps_de_trajet"           // un temps, un mode, depuis l'adresse : ce que la condition vise
  | "convention_produit"        // « la montagne », « la façade atlantique », « pas le littoral »
  | "point_de_reference"        // mesure prise au point de référence de la commune
  | "metrique_non_enregistree"  // des kilomètres, sans dire « à vol d'oiseau » ou « par la route »
  | "unite_non_enregistree"     // une taille, sans dire commune ou agglomération, ni d'où vient le seuil
  | "agglomeration_implicite"   // « quitter Lyon » lu comme toute l'agglomération lyonnaise
  | "sans_seuil"                // « près de Brest », « il nous faut la mer »
  | "parametre_manquant"        // un temps sans mode
  | "metrique_non_supportee"    // le vélo
  | "position_relative"         // un rang, une catégorie, un indicateur communal
  | "aucune_regle"              // aucune règle ne sait l'examiner
  // FUT-8 : les promotions par la sémantique du Projet.
  | "distance_a_vol_oiseau"     // des km, dits à vol d'oiseau, mesurés depuis l'adresse
  | "distance_par_la_route"     // des km par la route : aucune mesure routière en km aujourd'hui
  | "seuil_et_unite_du_lecteur" // une taille chiffrée par le lecteur, avec son unité
  | "perimetre_choisi"          // un périmètre choisi (ville, région parisienne)
  | "definition_acceptee";      // une convention de périmètre acceptée par le lecteur

export type CapabilityAssessment = { capability: Capability; reason: CapabilityReason };

export type DeclaredCriterion =
  | { kind: "hard"; key: HardConstraintKey; hc: HardConstraints }
  | { kind: "preference"; key: PreferenceKey };

// LES RÉGIONS ADMINISTRATIVES, et elles seules, se tranchent. Les autres jetons (macro-zones, façades,
// massifs, « Paris et sa proche banlieue ») sont des listes de départements choisies par futur•e :
// des conventions, affichées comme telles, qui ne suffisent pas à trancher la condition d'un lecteur.
// Un test vérifie que chaque jeton listé ici existe et porte bien la convention « la région … ».
export const ADMIN_REGION_TOKENS: readonly string[] = [
  "bretagne", "normandie", "pays_de_la_loire", "nouvelle_aquitaine", "occitanie",
  "provence_alpes_cote_d_azur", "auvergne_rhone_alpes", "bourgogne_franche_comte", "grand_est",
  "hauts_de_france", "centre_val_de_loire", "ile_de_france",
];
// « La région parisienne » (`idf`) N'EN FAIT PAS PARTIE. Le jeton désigne bien toute l'Île-de-France, une
// frontière nette ; mais il traduit une expression VERNACULAIRE, et rien ne dit que le lecteur pensait à
// la frontière administrative. La netteté de la géométrie n'est pas la fidélité au sens. Seul le jeton
// de la région nommée (`ile_de_france`) tranche.
const ADMIN_EXCLUSION_TOKENS = new Set<string>(ADMIN_REGION_TOKENS);

// LES PRÉFÉRENCES QU'AUCUNE RÈGLE NE SAIT EXAMINER. Un test vérifie, en faisant tourner le registre,
// que toutes les autres sont bien examinées par au moins une règle.
export const PREFERENCES_SANS_REGLE: readonly PreferenceKey[] = ["faible_secheresse", "faible_pression_agricole"];

const t = (reason: CapabilityReason): CapabilityAssessment => ({ capability: "trancher", reason });
const a = (reason: CapabilityReason): CapabilityAssessment => ({ capability: "apprecier", reason });
const n = (reason: CapabilityReason): CapabilityAssessment => ({ capability: "ne_pas_mesurer", reason });

function hardCapability(key: HardConstraintKey, hc: HardConstraints, grain: EvaluationGrain): CapabilityAssessment {
  switch (key) {
    case "departements":
      return t("perimetre_administratif");
    case "zones": {
      // FUT-8 : une macro-zone tranche si le lecteur a accepté son périmètre (convention « périmètre »),
      // pour CHAQUE ancre non administrative. Une façade ou un massif n'a pas de convention tranchable.
      const ancres = hardZoneAnchorsDe(hc.zones);
      const acceptees = hc.zonesConventions ?? [];
      const tranche = (token: string) => ADMIN_REGION_TOKENS.includes(token)
        || acceptees.some((c) => {
          const conv = conventionPar(c.conventionId, c.conventionVersion);
          return c.token === token && conv != null && conv.definition.kind === "departements"
            && conv.definition.token === token && conventionTranchable(conv, grain);
        });
      if (ancres.length === 0 || !ancres.every((z) => tranche(z.zone))) return a("convention_produit");
      return ancres.every((z) => ADMIN_REGION_TOKENS.includes(z.zone)) ? t("perimetre_administratif") : t("definition_acceptee");
    }
    case "excludeZones": {
      // FUT-8 : « région parisienne » tranche une fois son périmètre choisi par le lecteur.
      const tokens = hc.excludeZones ?? [];
      const choisis = hc.excludeZonesPerimetres ?? {};
      if (tokens.length === 0 || !tokens.every((z) => ADMIN_EXCLUSION_TOKENS.has(z) || choisis[z] != null)) return a("convention_produit");
      return tokens.some((z) => choisis[z] != null) ? t("perimetre_choisi") : t("perimetre_administratif");
    }
    // Une convention SANS définition acceptée par le lecteur s'apprécie. Avec une définition versionnée et
    // confirmée comme sens de la condition (FUT-8), elle pourra trancher.
    case "montagne":
    case "reliefProche":
    case "excludeSea":
      return a("convention_produit");
    case "nearSea":
      // Avec ou sans adresse, la distance au littoral est celle du point de référence de la commune.
      return typeof hc.nearSea?.maxKm === "number" && hc.nearSea.maxKm > 0
        ? a("point_de_reference")
        : a("sans_seuil");
    case "farFromSea":
      // FUT-33 : même mesure, même capacité que `nearSea` (aucune promotion avant le calcul à l'adresse).
      return typeof hc.farFromSea?.minKm === "number" && hc.farFromSea.minKm > 0
        ? a("point_de_reference")
        : a("sans_seuil");
    case "nearPlace": {
      const np = hc.nearPlace;
      const seuil = np ? nearPlaceThreshold(np) : null;
      if (seuil == null) return a("sans_seuil");
      if (seuil.metric === "distance") {
        // FUT-8 : des kilomètres DITS à vol d'oiseau se tranchent depuis l'adresse ; par la route, aucune
        // mesure routière en km n'existe encore ; sans métrique, rien ne dit ce que le lecteur vise.
        if (np?.metric === "vol_oiseau") return grain === "adresse" ? t("distance_a_vol_oiseau") : a("point_de_reference");
        if (np?.metric === "route") return a("distance_par_la_route");
        return a("metrique_non_enregistree");
      }
      if (seuil.mode == null) return n("parametre_manquant");
      if (!ROUTABLE_MODES.includes(seuil.mode)) return n("metrique_non_supportee");
      return grain === "adresse" ? t("temps_de_trajet") : a("point_de_reference");
    }
    // FUT-8 : une taille chiffrée AVEC son unité se tranche. Sans unité (legacy, ou mot qualitatif), non.
    case "communeSize":
      return hc.communeSize?.unit && (hc.communeSize.min != null || hc.communeSize.max != null)
        ? t("seuil_et_unite_du_lecteur") : a("unite_non_enregistree");
    // FUT-8 : la taille relative se tranche dès que l'unité est dite (agglomérations ou communes ; pour une
    // référence dont la population communale manque, l'évaluateur rend « non examiné », jamais un verdict).
    case "sizeRelativeTo":
      return hc.sizeRelativeTo?.unit ? t("seuil_et_unite_du_lecteur") : a("unite_non_enregistree");
    case "excludePlace": {
      // FUT-8 : chaque ville à quitter doit avoir son périmètre (commune ou agglomération).
      const villes = (hc.excludePlace ?? []).filter((e) => e?.label);
      return villes.length > 0 && villes.every((e) => e.scope === "commune" || e.scope === "unite_urbaine")
        ? t("perimetre_choisi") : a("agglomeration_implicite");
    }
  }
}

export function criterionCapability(criterion: DeclaredCriterion, grain: EvaluationGrain): CapabilityAssessment {
  if (criterion.kind === "hard") return hardCapability(criterion.key, criterion.hc, grain);
  // Avec le schéma actuel (`{ key, weight }`), une préférence ne porte aucun seuil du lecteur : la
  // donnée la situe parmi les communes, elle ne dit pas oui ou non à sa place.
  return PREFERENCES_SANS_REGLE.includes(criterion.key) ? n("aucune_regle") : a("position_relative");
}

// Exporté pour le test de cohérence avec la table des zones.
export function estRegionAdministrative(token: string): boolean {
  return ADMIN_REGION_TOKENS.includes(token) && ZONE_TABLE[token] != null;
}
