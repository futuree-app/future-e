// ════════════════════════════════════════════════════════════════════════════════════════════
// LES RISQUES INDUSTRIELS À L'ADRESSE (FUT-167, D2, décision du porteur du 30/10/2026). PUR.
//
// Deux faits de nature différente, jamais confondus :
//   1. LES SITES SEVESO autour du logement : nom officiel, seuil, état d'activité, distance à vol d'oiseau depuis
//      le point géocodé jusqu'au POINT PUBLIÉ du site (pas son enceinte). Un fait de PROXIMITÉ, qui ne mesure
//      aucune exposition et n'emporte aucune règle.
//   2. LES PLANS DE PRÉVENTION DES RISQUES TECHNOLOGIQUES (PPRT) : le seul fait RÉGLEMENTAIRE qui s'applique à un
//      bien. Lu par Géorisques AU POINT (`/api/v2/gaspar/pprt?latitude&longitude` : les plans dont le zonage couvre
//      ce point, avec la zone qui s'y applique) et SUR LA COMMUNE (`/api/v1/gaspar/pprt?codeInsee` : les plans qui
//      concernent la commune).
//
// LA QUESTION À LAQUELLE LA SECTION RÉPOND EXPLICITEMENT : le logement est-il dans un périmètre de PPRT, et que
// peut-on établir pour ce bien ? Cinq réponses distinctes, jamais fondues :
//   - `dans_un_plan`          : le zonage d'un plan couvre le point ; la zone et son régime sont ceux publiés ;
//   - `plan_sur_la_commune`   : un plan concerne la commune, son zonage ne couvre pas le point ;
//   - `aucun_plan`            : aucun plan sur la commune ni au point, requêtes complètes ;
//   - `incomplet`             : le point est lu, la liste de la commune non (ou l'inverse) ;
//   - `non_determinable`      : la lecture au point a échoué : rien n'est affirmé.
// Un site Seveso proche n'implique PAS un plan applicable, et l'absence de plan n'est pas une absence de risque.
//
// CE QUI N'EST PAS ÉTABLI, ET LE RESTE : le contenu du règlement (travaux, délais, aides). L'API ne publie pas le
// détail d'un PPRT (`/api/v2/gaspar/pprt/{id}` : « n'a pas de détails de risques associés », vérifié le
// 30/10/2026), ni sa date d'approbation. La section dit où le trouver, jamais ce qu'il contient.
// ════════════════════════════════════════════════════════════════════════════════════════════
import { distanceEnPhrase } from "./decision/sante-facts.ts";
import { nomAffichable } from "./data/installations-seveso.ts";

export const PPRT_SOURCE = {
  producteur: "Base nationale GASPAR (ministère de la Transition écologique), via Géorisques",
  page: "https://www.georisques.gouv.fr/risques/risques-technologiques",
} as const;

/** La fiche Géorisques d'une installation classée. */
export const ficheInstallation = (code: string) => `https://www.georisques.gouv.fr/risques/installations/donnees/details/${code}`;

/** Les sites cités nommément ; au-delà, ils sont comptés. */
export const SITES_ADRESSE_CITES = 6;

export type ZonePprt = { regimeCode: string | null; regime: string | null; code: string | null; nom: string | null };
export type PlanPprt = {
  id: string;
  nom: string;
  /** Une servitude d'utilité publique est publiée pour ce plan (`supExists`). */
  servitude: boolean;
  enRevision: boolean;
  /** Mise à jour de la FICHE GASPAR, `AAAA-MM-JJ` : jamais une date d'approbation. */
  ficheMajLe: string | null;
  zones: ZonePprt[];
};

export type SiteSevesoAdresse = {
  code: string;
  nom: string;
  seuil: "seveso_haut" | "seveso_bas";
  etat: string | null;
  commune: string | null;
  distanceKm: number;
  approchee: boolean;
  decimales: number;
};

/** La précision du point géocodé (type d'objet de la Base adresse nationale). */
export type PrecisionPoint = "numero" | "rue" | "lieu_dit" | "commune" | "inconnue";

// PAS DE DATE DE CONSULTATION DANS LA LECTURE : l'empreinte d'un rapport Logement couvre tout son contenu, et
// une horodate y ferait une nouvelle version à chaque actualisation. La date dite au lecteur est celle de la
// collecte de la version (`collecteeLe`), passée au texte.
export type LectureIndustrieAdresse = {
  precision: PrecisionPoint;
  seveso: { etat: "lu"; extraitLe: string; rayonKm: number; sites: SiteSevesoAdresse[] } | { etat: "indisponible" };
  pprtPoint: { etat: "lu"; plans: PlanPprt[] } | { etat: "indisponible" };
  pprtCommune: { etat: "lu"; plans: { id: string; nom: string }[] } | { etat: "indisponible" };
};

export type ReponsePprt = "dans_un_plan" | "plan_sur_la_commune" | "aucun_plan" | "incomplet" | "non_determinable";

/** La réponse à « le logement est-il dans un périmètre de PPRT ? », sans rien supposer au-delà des requêtes lues. */
export function reponsePprt(l: LectureIndustrieAdresse): ReponsePprt {
  if (l.pprtPoint.etat === "indisponible") return "non_determinable";
  if (l.pprtPoint.plans.length > 0) return "dans_un_plan";
  if (l.pprtCommune.etat === "indisponible") return "incomplet";
  return l.pprtCommune.plans.length > 0 ? "plan_sur_la_commune" : "aucun_plan";
}

// ── Lecture des réponses Géorisques (formes vérifiées le 30/10/2026) ─────────────────────────────

const texte = (v: unknown): string | null => (typeof v === "string" && v.trim() ? v.trim() : null);
/** « 10/04/2025 » → « 2025-04-10 ». */
const isoDepuisFr = (v: unknown): string | null => {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(texte(v) ?? "");
  return m ? `${m[3]}-${m[2]}-${m[1]}` : null;
};

/** Une page `content[]` lisible : le total annoncé est-il entièrement lu ? `null` = réponse inexploitable. */
export function lirePagePprt(r: unknown): { plans: PlanPprt[]; complete: boolean } | null {
  const p = r as { totalElements?: unknown; content?: unknown };
  if (!p || typeof p.totalElements !== "number" || !Array.isArray(p.content)) return null;
  const plans: PlanPprt[] = [];
  for (const x of p.content as Record<string, unknown>[]) {
    const id = texte(x.idGaspar);
    if (!id) continue;
    const zr = (x.zonageReglementaire ?? {}) as { listTypeReg?: unknown };
    const zones = (Array.isArray(zr.listTypeReg) ? zr.listTypeReg : []) as Record<string, unknown>[];
    plans.push({
      id,
      nom: texte(x.libPpr) ?? id,
      servitude: x.supExists === true,
      enRevision: x.etatRevision === true,
      ficheMajLe: isoDepuisFr(x.dateModification),
      zones: zones.map((z) => ({ regimeCode: texte(z.code), regime: texte(z.libelle), code: texte(z.codeZone), nom: texte(z.nom) })),
    });
  }
  return { plans, complete: plans.length >= p.totalElements };
}

// ── Les mots ──────────────────────────────────────────────────────────────────────────────────

const dateFr = (iso: string): string => {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : iso;
};
const listeFr = (xs: string[]): string => (xs.length <= 1 ? xs[0] ?? "" : `${xs.slice(0, -1).join(", ")} et ${xs[xs.length - 1]}`);
const SEUIL_FR = { seveso_haut: "Seveso seuil haut", seveso_bas: "Seveso seuil bas" } as const;

/** Ordre de lecture des régimes COVADIS : le plus contraignant d'abord. */
const RANG_REGIME: Record<string, number> = { "04": 0, "03": 1, "02": 2, "01": 3, "00": 4 };

function zoneEnPhrase(z: ZonePprt): string {
  const regime = z.regimeCode === "00" || !z.regime ? "régime non précisé par la base" : z.regime.toLowerCase();
  const code = z.code ? `zone « ${z.code} »` : "zone sans code publié";
  return `${code} (${regime})${z.nom ? ` : « ${z.nom} »` : ""}`;
}

export const PHRASES_INTERDITES =
  /sans danger|aucun risque|sans risque|à l'abri|épargn|protég|rassur|en sécurité|dangereux|toxique|(votre|ce) logement est expos|exposition (faible|nulle|élevée)|—/i;

export type TexteIndustrieAdresse = {
  /** La réponse à la question, en une phrase, en tête de section. */
  reponse: ReponsePprt;
  question: string;
  constat: string;
  /** Ce que l'on peut établir pour ce bien (zone et régime publiés), ou ce qui reste à établir. */
  pourCeBien: string[];
  sites: { titre: string; lignes: { texte: string; href: string }[]; reste: string | null; vide: string | null };
  limites: string[];
  verifier: string[];
  marge: { valeur: string; sources: { texte: string; date?: string }[] };
};

const QUESTION = "Le logement est-il dans le périmètre d'un plan de prévention des risques technologiques ?";

export function texteIndustrieAdresse(l: LectureIndustrieAdresse, collecteeLe: string | null): TexteIndustrieAdresse {
  const r = reponsePprt(l);
  // « consultée le 30/10/2026 », ou « consultée lors de la collecte de ce rapport » quand la date manque.
  const consulte = collecteeLe ? `le ${dateFr(collecteeLe)}` : "lors de la collecte de ce rapport";
  const pointApproche = l.precision !== "numero";
  const pourCeBien: string[] = [];
  let constat: string;

  if (r === "dans_un_plan") {
    const plans = (l.pprtPoint as { plans: PlanPprt[] }).plans;
    const p = plans[0]!;
    const zones = [...p.zones].sort((a, b) => (RANG_REGIME[a.regimeCode ?? ""] ?? 9) - (RANG_REGIME[b.regimeCode ?? ""] ?? 9));
    constat = `Oui. Le point de cette adresse est dans le périmètre réglementé du plan « ${p.nom} »${plans.length > 1 ? `, et de ${plans.length - 1} autre${plans.length > 2 ? "s" : ""} plan${plans.length > 2 ? "s" : ""} (${listeFr(plans.slice(1).map((x) => `« ${x.nom} »`))})` : ""} (base GASPAR, consultée ${consulte}).`;
    if (zones.length) {
      pourCeBien.push(`Au point de l'adresse, la base publie ${zones.length > 1 ? "ces zones" : "cette zone"} : ${listeFr(zones.map(zoneEnPhrase))}.`);
    } else {
      pourCeBien.push("La base ne publie pas la zone qui s'applique au point : elle se lit sur le plan de zonage du règlement.");
    }
    pourCeBien.push("Ce que la zone impose ou recommande au bien (travaux de renforcement, délais, aides prévues) est écrit dans le règlement du plan. La base nationale ne le publie pas : il est annexé à l'état des risques que le vendeur ou le bailleur doit fournir, et consultable en mairie.");
    if (p.enRevision) pourCeBien.push("La base indique que ce plan est en cours de révision : son zonage peut changer.");
    if (pointApproche) pourCeBien.push("Le point géocodé n'est pas celui du bâtiment : la zone exacte du logement se vérifie sur le plan de zonage.");
  } else if (r === "plan_sur_la_commune") {
    const plans = (l.pprtCommune as { plans: { nom: string }[] }).plans;
    constat = `Non, d'après la base consultée ${consulte} : la commune est concernée par ${plans.length > 1 ? `${plans.length} plans` : "un plan"} (${listeFr(plans.map((p) => `« ${p.nom} »`))}), mais le point de cette adresse n'est dans aucune zone réglementée publiée.`;
    pourCeBien.push(pointApproche
      ? "Le point géocodé n'est pas celui du bâtiment : un logement voisin du périmètre se vérifie sur le plan de zonage."
      : "L'état des risques fourni par le vendeur ou le bailleur le confirme ou le corrige : c'est le document opposable.");
  } else if (r === "aucun_plan") {
    constat = `Non. Aucun plan de prévention des risques technologiques n'est recensé sur la commune ni au point de cette adresse (base GASPAR, consultée ${consulte}).`;
  } else if (r === "incomplet") {
    constat = `Le point de cette adresse n'est dans aucune zone réglementée publiée (base GASPAR, consultée ${consulte}). La liste des plans de la commune n'a pas pu être lue : l'état des risques le confirme.`;
  } else {
    constat = `Non déterminable : la base des plans n'a pas répondu ${consulte}. Rien n'en est déduit ; l'état des risques fourni par le vendeur ou le bailleur répond à cette question.`;
    if (l.pprtCommune.etat === "lu" && l.pprtCommune.plans.length) {
      pourCeBien.push(`La commune est concernée par ${listeFr(l.pprtCommune.plans.map((p) => `le plan « ${p.nom} »`))}.`);
    }
  }

  // Les sites Seveso : un fait de proximité, distinct du plan.
  const sites = (() => {
    if (l.seveso.etat === "indisponible") {
      return { titre: "Sites Seveso autour du logement", lignes: [], reste: null, vide: "La liste des sites Seveso n'a pas pu être lue. Aucune absence n'en est déduite." };
    }
    const s = l.seveso;
    const cites = s.sites.slice(0, SITES_ADRESSE_CITES).map((x) => ({
      texte: `${nomAffichable(x.nom)} : ${SEUIL_FR[x.seuil]}${x.etat && /fin d'exploitation/i.test(x.etat) ? ", en fin d'exploitation" : ""}, à ${x.approchee ? "environ " : ""}${distanceEnPhrase(x.distanceKm)} à vol d'oiseau${x.approchee ? " (position approchée : la fiche ne publie pas de position exploitable)" : x.decimales <= 3 ? " (position publiée arrondie à une centaine de mètres)" : ""}`,
      href: ficheInstallation(x.code),
    }));
    const reste = s.sites.length - cites.length;
    return {
      titre: `Sites Seveso à moins de ${s.rayonKm} km du logement`,
      lignes: cites,
      reste: reste > 0 ? `Et ${reste} autre${reste > 1 ? "s" : ""}, plus éloigné${reste > 1 ? "s" : ""}.` : null,
      vide: s.sites.length === 0 ? `Aucun site classé Seveso n'est recensé à moins de ${s.rayonKm} km de l'adresse (installations classées, extraction Géorisques du ${dateFr(s.extraitLe)}).` : null,
    };
  })();

  const limites = [
    "Les distances vont du point géocodé de l'adresse au point publié de chaque site, pas à son enceinte. Elles ne mesurent aucune exposition, et un site proche n'implique pas qu'un plan s'applique au logement.",
    ...(r !== "dans_un_plan" && l.seveso.etat === "lu" && l.seveso.sites.length > 0
      ? ["L'absence de plan au point ne dit pas l'absence de risque : autour d'un site Seveso seuil haut, un plan particulier d'intervention organise l'alerte, et la commune publie ses consignes."]
      : []),
    "Les autres installations classées (soumises à autorisation, ou à la directive européenne sur les émissions industrielles) ne sont pas listées ici. Les rejets déclarés (IREP) ne mesurent pas l'exposition d'un logement voisin et ne sont pas repris.",
  ];

  const verifier = [
    "Demandez l'état des risques du bien : il indique si un plan de prévention des risques technologiques s'applique, et le vendeur ou le bailleur doit le fournir.",
    ...(r === "dans_un_plan"
      ? [
        "Demandez le règlement du plan et la zone exacte de la parcelle, en mairie ou auprès de la direction départementale des territoires.",
        "Demandez au vendeur si des travaux prescrits par le plan ont été réalisés, et leurs justificatifs.",
      ]
      : []),
    ...(l.seveso.etat === "lu" && l.seveso.sites.length > 0
      ? ["Consultez le document d'information communal sur les risques majeurs (DICRIM) : il donne les consignes en cas d'alerte industrielle."]
      : []),
  ];

  const marge = {
    valeur: r === "dans_un_plan" ? "Dans un plan de prévention" : r === "non_determinable" ? "Non déterminable" : r === "incomplet" ? "Hors zone au point, commune non lue" : "Hors périmètre réglementé",
    sources: [
      { texte: "Plans de prévention des risques technologiques, base GASPAR (Géorisques)", ...(collecteeLe ? { date: collecteeLe.slice(0, 10) } : {}) },
      ...(l.seveso.etat === "lu" ? [{ texte: "Installations classées, Géorisques", date: l.seveso.extraitLe.slice(0, 10) }] : []),
    ],
  };

  return { reponse: r, question: QUESTION, constat, pourCeBien, sites, limites, verifier, marge };
}

/** Le type d'objet BAN → précision du point. `housenumber` seul situe le bâtiment. */
export function precisionDuPoint(banType: string | null | undefined): PrecisionPoint {
  if (banType === "housenumber") return "numero";
  if (banType === "street") return "rue";
  if (banType === "locality") return "lieu_dit";
  if (banType === "municipality") return "commune";
  return "inconnue";
}
