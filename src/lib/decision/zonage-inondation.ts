// ════════════════════════════════════════════════════════════════════════════════════════════
// LE ZONAGE INONDATION À L'ADRESSE, DIT UNE SEULE FOIS (FUT-127, 22/10/2026). PUR.
//
// ── LE DÉFAUT QUE CE MODULE FERME ────────────────────────────────────────────────────────────
// Le dossier d'adresse lisait les plans de prévention au point et à la parcelle, puis la règle
// inondation les ignorait : elle concluait sur le seul compte communal de reconnaissances CatNat. À
// Charron, en zone rouge « submersible, aléa très fort », un acheteur qui demandait un faible risque
// d'inondation lisait « Bonne correspondance ». Ailleurs, elle renvoyait vers Géorisques une
// information que futur•e avait déjà.
//
// ── CE QUE CE MODULE ÉTABLIT, ET SEULEMENT CELA ─────────────────────────────────────────────
// À partir des plans lus au point et à la parcelle, un des cinq états suivants :
//
//   zone          un plan qui réglemente l'inondation classe le lieu dans une de ses zones ;
//                 `rattachement` dit si l'on peut s'y fier, `liaison` si la zone elle-même est liée à
//                 l'inondation (un plan littoral réglemente aussi le recul du trait de côte) ;
//   alea_inconnu  un plan classe le lieu, mais la donnée reçue ne dit pas s'il porte sur l'inondation ;
//   hors_zone     Géorisques a répondu, et aucun plan inondation ne classe le lieu ;
//   indisponible  Géorisques n'a répondu ni au point ni à la parcelle.
//
// ── CE QU'IL NE CONCLUT JAMAIS ──────────────────────────────────────────────────────────────
// Ni qu'un lieu hors zone est à l'abri (un plan ne réglemente que ce qu'il a étudié), ni qu'une zone
// d'interdiction rend un logement inhabitable (le régime encadre les projets et les travaux).
// ════════════════════════════════════════════════════════════════════════════════════════════
import {
  natureInondation, zoneLieeALInondation, phenomenesInondation, autresPhenomenes,
  type RegulatoryPlan, type RegulatoryZone,
} from "../pprn-zonage.ts";
import type { MaterialityTier, ModuleFacts } from "./decision-fact.ts";
import type { UserProject } from "../user-project.ts";
import { preferenceSurfaced } from "./conditions.ts";

/** La zone retenue, avec ce qu'il faut pour la dire et pour la peser. */
export type ZoneInondationLue = {
  plan: string | null;
  gasparId: string | null;
  modele: string | null;
  /** Phénomènes d'inondation réglementés par le plan, en mots courants. Vide = non précisés. */
  phenomenes: string[];
  /** Autres phénomènes que le plan réglemente (« le recul du trait de côte »). */
  autresPhenomenes: string[];
  approbation: string | null;
  zoneCode: string | null;
  zoneNom: string | null;
  regimeCode: string | null;
  regime: string | null;
};

export type ZonageInondationFait =
  | {
      etat: "zone";
      grain: "parcelle" | "point";
      zone: ZoneInondationLue;
      /** `fiable` : point et parcelle concordent, ou une seule lecture sans repli cadastral. */
      rattachement: "fiable" | "ambigu";
      /** `explicite` : la zone ou le plan entier portent l'inondation. `plan` : le plan porte aussi d'autres phénomènes. */
      liaison: "explicite" | "plan";
      /** Quand le point et la parcelle ne disent pas la même zone (avec le régime de chacune, pour dire
       *  au premier niveau si l'une des deux lectures est contraignante). */
      divergence: { point: string | null; parcelle: string | null; regimePoint?: string | null; regimeParcelle?: string | null } | null;
      parcelleParRepli: boolean;
    }
  | { etat: "alea_inconnu"; grain: "parcelle" | "point"; zone: ZoneInondationLue }
  | { etat: "hors_zone"; grain: "parcelle" | "point" }
  | { etat: "indisponible" };

type PlansLus = Pick<RegulatoryPlan, "plan" | "gasparId" | "hazardModel" | "zones" | "topRegimeRank" | "aleas" | "approvedAt">[];

export type EntreeZonage = {
  /** Plans au point géocodé. `null` = la lecture au point n'a pas abouti. */
  point: PlansLus | null;
  /** Plans à la parcelle. `null` = pas de parcelle, ou lecture en échec. */
  parcelle: PlansLus | null;
  /** La parcelle vient du repli cadastral (point hors parcelle) : elle peut être celle d'un voisin. */
  parcelleParRepli?: boolean;
};

const RANG: Record<string, number> = { "04": 0, "06": 1, "05": 2, "03": 3, "02": 4, "01": 5 };
const rangDe = (z: Pick<RegulatoryZone, "regimeCode"> | null) => (z?.regimeCode && z.regimeCode in RANG ? RANG[z.regimeCode]! : 9);

function zoneLaPlusContraignante(plan: PlansLus[number]): RegulatoryZone | null {
  if (plan.zones.length === 0) return null;
  return [...plan.zones].sort((a, b) => rangDe(a) - rangDe(b))[0]!;
}

function lue(plan: PlansLus[number], zone: RegulatoryZone | null): ZoneInondationLue {
  return {
    plan: plan.plan, gasparId: plan.gasparId, modele: plan.hazardModel,
    phenomenes: phenomenesInondation(plan), autresPhenomenes: autresPhenomenes(plan),
    approbation: plan.approvedAt ?? null,
    zoneCode: zone?.zoneCode ?? null, zoneNom: zone?.zoneName ?? null,
    regimeCode: zone?.regimeCode ?? null, regime: zone?.regime ?? null,
  };
}

/** Le plan inondation le plus contraignant d'une lecture, ou `null`. */
function meilleurPlan(plans: PlansLus | null, nature: "inondation" | "inconnue") {
  const candidats = (plans ?? []).filter((p) => natureInondation(p) === nature);
  if (candidats.length === 0) return null;
  const tri = [...candidats].sort((a, b) => rangDe(zoneLaPlusContraignante(a)) - rangDe(zoneLaPlusContraignante(b)));
  const plan = tri[0]!;
  return { plan, zone: zoneLaPlusContraignante(plan) };
}

/** « zone Rs2 » ou, sans code, le nom local, ou `null`. */
export function libelleCourtDeZone(z: Pick<ZoneInondationLue, "zoneCode" | "zoneNom"> | null): string | null {
  if (!z) return null;
  if (z.zoneCode) return `zone ${z.zoneCode}`;
  const nom = (z.zoneNom ?? "").replace(/^zone\s+/i, "").trim();
  return nom ? `zone ${nom}` : null;
}

export function zonageInondationDeLAdresse(e: EntreeZonage): ZonageInondationFait {
  if (e.point == null && e.parcelle == null) return { etat: "indisponible" };
  const grain: "parcelle" | "point" = e.parcelle != null ? "parcelle" : "point";
  const parRepli = Boolean(e.parcelleParRepli) && e.parcelle != null;

  const auPoint = meilleurPlan(e.point, "inondation");
  const aLaParcelle = meilleurPlan(e.parcelle, "inondation");
  const retenu = aLaParcelle ?? auPoint;
  if (retenu) {
    const zone = lue(retenu.plan, retenu.zone);
    const libellePoint = auPoint ? libelleCourtDeZone(lue(auPoint.plan, auPoint.zone)) ?? "une zone sans libellé" : null;
    const libelleParcelle = aLaParcelle ? libelleCourtDeZone(lue(aLaParcelle.plan, aLaParcelle.zone)) ?? "une zone sans libellé" : null;
    // DEUX LECTURES QUI NE DISENT PAS LA MÊME CHOSE. Seulement quand les deux ont répondu : une lecture
    // absente ne contredit rien. Le point « hors zone » contre une parcelle « en zone » est un écart.
    const deuxLues = e.point != null && e.parcelle != null;
    const ecart = deuxLues && (
      (auPoint == null) !== (aLaParcelle == null)
      || (auPoint && aLaParcelle && (auPoint.plan.gasparId !== aLaParcelle.plan.gasparId
        || (auPoint.zone?.zoneCode ?? null) !== (aLaParcelle.zone?.zoneCode ?? null)))
    );
    const divergence = ecart
      ? { point: libellePoint, parcelle: libelleParcelle, regimePoint: auPoint?.zone?.regimeCode ?? null, regimeParcelle: aLaParcelle?.zone?.regimeCode ?? null }
      : null;
    // Une parcelle de repli que le point ne confirme pas n'est pas un rattachement sûr.
    const repliNonConfirme = parRepli && (auPoint == null || divergence != null);
    return {
      etat: "zone", grain: aLaParcelle ? "parcelle" : "point", zone,
      rattachement: divergence || repliNonConfirme ? "ambigu" : "fiable",
      liaison: zoneLieeALInondation(retenu.plan, retenu.zone) ? "explicite" : "plan",
      divergence,
      parcelleParRepli: parRepli,
    };
  }
  const inconnu = meilleurPlan(e.parcelle, "inconnue") ?? meilleurPlan(e.point, "inconnue");
  if (inconnu) return { etat: "alea_inconnu", grain, zone: lue(inconnu.plan, inconnu.zone) };
  return { etat: "hors_zone", grain };
}

// ── LE POIDS D'UNE ZONE, ARBITRÉ PAR LE PORTEUR LE 22/10/2026 ──────────────────────────────────
// Interdiction (03), interdiction stricte (04), délaissement ou expropriation possibles (05, 06) :
// `decision_critical`. Prescriptions (02) ou régime non détaillé : `structuring`. Prescriptions hors
// zone d'aléa (01) : `secondary`. Ce palier ne s'applique qu'à une zone liée EXPLICITEMENT à
// l'inondation et rattachée de façon fiable ; sinon, la lecture reste prudente (cf. règles).
export function palierDeZone(regimeCode: string | null): MaterialityTier {
  if (regimeCode === "03" || regimeCode === "04" || regimeCode === "05" || regimeCode === "06") return "decision_critical";
  if (regimeCode === "01") return "secondary";
  return "structuring";
}

/** L'état scannable (≤ 32 caractères, sans point), en mots que comprend un acheteur. */
export function statutDeZone(regimeCode: string | null): string {
  if (regimeCode === "04") return "Zone d'interdiction stricte";
  if (regimeCode === "03") return "Zone d'interdiction";
  if (regimeCode === "05" || regimeCode === "06") return "Zone à règles particulières";
  if (regimeCode === "02" || regimeCode === "01") return "Constructible sous conditions";
  return "Zone réglementée";
}

/**
 * CE QUE LE RÉGIME CHANGE, EN CLAIR, POUR LA FACE DE LA CARTE (FUT-127, passe éditoriale du 23/10).
 * Une phrase courte, sans le mot « régime ». La version technique (`regimeEnPhrase`) descend dans
 * « Données et limites ». Jamais une impossibilité d'habiter : le plan encadre les projets.
 */
export function regimeEnClair(regimeCode: string | null): string {
  switch (regimeCode) {
    case "04": return "La plupart des constructions et des travaux nouveaux y sont interdits.";
    case "03": return "Certaines constructions et certains travaux y sont interdits.";
    case "05": case "06": return "Des règles particulières s'y appliquent, que seul le règlement du plan détaille.";
    case "02": case "01": return "Construire ou faire des travaux y reste possible, sous conditions.";
    default: return "Le règlement du plan dit ce qui y est permis.";
  }
}

/** Ce que le régime encadre, sans jamais en tirer une impossibilité d'habiter. */
export function regimeEnPhrase(regimeCode: string | null): string {
  switch (regimeCode) {
    case "04": return "Le plan range cette zone sous son régime le plus strict : la plupart des projets nouveaux y sont interdits, et le règlement fixe ce qu'il impose aux constructions existantes.";
    case "03": return "Le plan range cette zone sous un régime d'interdiction : certains projets y sont interdits, et le règlement fixe ce qu'il impose aux constructions existantes.";
    case "05": case "06": return "Le plan range cette zone sous un régime particulier, que seul son règlement détaille.";
    case "02": return "Le plan range cette zone sous un régime de prescriptions : des règles s'appliquent aux projets, et peuvent s'appliquer aux constructions existantes.";
    case "01": return "Le plan range cette zone hors des zones d'aléa, avec des prescriptions que son règlement détaille.";
    default: return "La donnée reçue ne détaille pas le régime de cette zone : seul le règlement du plan le dit.";
  }
}

// « Zone rouge Rs2: Ensemble des zones submersibles… » : le nom local, débarrassé de son préfixe
// « Zone » et de son code, sans accent ajouté (on cite la source telle qu'elle est écrite).
export function nomLocalDeZone(z: Pick<ZoneInondationLue, "zoneCode" | "zoneNom">): string | null {
  let nom = (z.zoneNom ?? "").trim();
  if (!nom) return null;
  if (z.zoneCode) {
    const i = nom.indexOf(`${z.zoneCode}:`);
    if (i >= 0) nom = nom.slice(i + z.zoneCode.length + 1).trim();
  }
  nom = nom.replace(/^zone\s+/i, "").trim();
  return nom ? nom.charAt(0).toLowerCase() + nom.slice(1) : null;
}

/** « plan de prévention « PPR Charron », approuvé le 10 août 2021, qui réglemente la submersion marine » (sans article). */
export function planEnPhrase(z: Pick<ZoneInondationLue, "plan" | "phenomenes" | "autresPhenomenes" | "approbation">, dateLongue: (iso: string | null) => string | null): string {
  const nom = z.plan ? `plan de prévention « ${z.plan} »` : "plan de prévention des risques";
  const date = dateLongue(z.approbation);
  const phen = [...z.phenomenes, ...z.autresPhenomenes];
  const reglemente = phen.length > 0 ? `, qui réglemente ${joinFr(phen)}` : "";
  return `${nom}${date ? `, approuvé le ${date}` : ""}${reglemente}`;
}

/** « plan de prévention « PPR Charron », approuvé le 10 août 2021 » (sans article ni phénomènes). */
export function planDate(z: Pick<ZoneInondationLue, "plan" | "approbation">, dateLongue: (iso: string | null) => string | null): string {
  const date = dateLongue(z.approbation);
  return `${z.plan ? `plan de prévention « ${z.plan} »` : "plan de prévention des risques"}${date ? `, approuvé le ${date}` : ""}`;
}

export function joinFr(items: string[]): string {
  if (items.length <= 1) return items[0] ?? "";
  return `${items.slice(0, -1).join(", ")} et ${items[items.length - 1]}`;
}

/**
 * LA CARTE INONDATION DU DOSSIER PORTE-T-ELLE DÉJÀ CE PLAN ? Vrai quand le lecteur a déclaré
 * l'inondation (et que la priorité se matérialise) et que l'adresse est classée par ce plan, en zone
 * ou sous un plan dont l'aléa reste à confirmer. La carte « plan applicable » du module Logement se
 * tait alors : le même plan, la même adresse, ne se lisent pas deux fois sous deux gestes.
 * Partagé par `materiality-rules.ts` (qui émet la carte) et `logement-rules.ts` (qui se tait).
 */
export function carteInondationPorteLePlan(f: Pick<ModuleFacts, "hasAddress" | "logement" | "insee">, p: UserProject): boolean {
  // SEULEMENT DANS LE DOSSIER COMPLET. La liste « à vérifier » du module Logement n'évalue que les règles
  // Logement, sur des faits minimaux sans commune (`logement-verifications.ts`) : la carte inondation n'y
  // existe pas, et taire le plan y effacerait le seul geste réglementaire.
  if (typeof f.insee !== "string" || f.insee.length === 0) return false;
  const l = f.logement;
  const z = f.hasAddress ? l?.zonageInondation : undefined;
  if (!l || !z || (z.etat !== "zone" && z.etat !== "alea_inconnu")) return false;
  if (!preferenceSurfaced(p, "faible_risque_inondation")) return false;
  return z.zone.plan != null && z.zone.plan === l.pprnLabel;
}
