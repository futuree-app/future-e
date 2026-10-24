// ════════════════════════════════════════════════════════════════════════════════════════════
// LES PLANS DE PRÉVENTION DES INONDATIONS D'UNE COMMUNE (FUT-127, 22/10/2026)
//
// ── LE DÉFAUT QUE CE MODULE FERME ────────────────────────────────────────────────────────────
// La carte inondation du dossier communal se déclenchait sur le RANG du compte de reconnaissances
// CatNat (rang >= 66, soit 4 reconnaissances depuis 1982), et elle l'appelait « exposition élevée ».
// Mesuré sur l'index : 48 % des communes, 99 % des villes de plus de 50 000 habitants. Le compte suit
// surtout la taille de la commune et les demandes de son maire ; il ne dit ni où, ni quelle part du
// territoire, ni avec quelle probabilité. Et sous le seuil, il fabriquait une bonne nouvelle : Charron,
// couverte par un plan littoral et endeuillée par Xynthia, ressortait « non notable ».
//
// ── CE QUE CE MODULE APPORTE À LA PLACE ──────────────────────────────────────────────────────
// Un fait réglementaire : la commune est-elle couverte par un plan de prévention qui porte sur
// l'inondation (submersion marine comprise), et dans quel état administratif ? Arbitrage porteur du
// 22/10/2026 (option A de l'audit FUT-127).
//
// ── CE QU'IL NE DIT PAS, ET LE TEXTE NE DOIT JAMAIS LE LUI FAIRE DIRE ────────────────────────
// Une commune couverte par un plan n'est pas exposée partout : le plan découpe des zones, et une
// adresse peut n'être dans aucune. Seule la lecture à l'adresse (Géorisques au point ou à la parcelle)
// dit si un lieu est en zone. Une commune SANS plan n'est pas une commune sans risque.
//
// ── LES TROIS ÉTATS ADMINISTRATIFS, ET LEUR PORTÉE ───────────────────────────────────────────
//   approuve  « Opposable / Approuvé » : servitude d'utilité publique, son zonage s'impose.
//   anticipe  « Opposable / Anticipé » : certaines dispositions s'appliquent avant l'approbation.
//   prescrit  « Prescrit » ou « Prorogé » : le plan est en cours d'élaboration ; aucun zonage
//             n'est encore opposable à ce titre.
// Les plans caducs (abrogés, déprescrits, annulés) n'entrent pas.
//
// Module PUR : aucun réseau, aucun fichier. Le script `scripts/gaspar/extraire-pprn-inondation.mts`
// lit l'export GASPAR et écrit `data/gaspar-pprn-inondation.json` ; le serveur le lit par
// `src/lib/gaspar-pprn-commune.ts`.
// ════════════════════════════════════════════════════════════════════════════════════════════
import { codeGaspar } from "../georisques-flags.ts";

/** Version de la CONVENTION (périmètre, états retenus). À relever si la matière change. */
export const PPRN_INONDATION_CONVENTION = "pprn-inondation-1";

export type StatutPlan = "approuve" | "anticipe" | "prescrit";

export type PlanInondationCommune = {
  /** Identifiant GASPAR de la procédure (ex. 17DDTM20100014). */
  id: string;
  /** Libellé de la procédure, tel que GASPAR le publie. */
  nom: string;
  /** Modèle GASPAR (PPRN-I, PPRN-L, PPRN-Multi…). */
  modele: string;
  statut: StatutPlan;
  /** La date qui fonde le statut (approbation, application anticipée, prescription), ISO `AAAA-MM-JJ`. */
  date: string | null;
  /** Les sous-aléas inondation que le plan porte pour cette commune (« Par submersion marine »…). */
  aleas: string[];
};

export type TablePlansInondation = {
  meta: { source: string; export: string; convention: string };
  communes: Record<string, PlanInondationCommune[]>;
};

/** Ce que le moteur reçoit pour une commune. `plans: []` = la base n'en connaît aucun (pas « aucun risque »). */
export type PlansInondationCommune = {
  plans: PlanInondationCommune[];
  /** Date de l'export GASPAR lu (`AAAA-MM-JJ`). */
  export: string;
};

/** Une ligne de l'export `pprn_gaspar_*.csv`, réduite aux colonnes lues. */
export type LigneExportPprn = Record<string, string | undefined>;

const STATUT: Record<string, StatutPlan> = {
  "Opposable|Approuvé": "approuve",
  "Opposable|Anticipé": "anticipe",
  "Prescrit|Prescrit": "prescrit",
  "Prescrit|Prorogé": "prescrit",
};

const dateIso = (v: string | undefined): string | null => (v && /^\d{4}-\d{2}-\d{2}/.test(v) ? v.slice(0, 10) : null);

/**
 * L'export GASPAR porte UNE LIGNE PAR (procédure, commune, risque). Une procédure entre pour une
 * commune dès qu'une de ses lignes y porte le risque « Inondation » ; ses sous-aléas inondation sont
 * réunis. Le rang de statut le plus fort l'emporte si deux lignes se contredisent (jamais observé).
 */
export function extrairePlansInondation(lignes: LigneExportPprn[]): Record<string, PlanInondationCommune[]> {
  const parCommune = new Map<string, Map<string, PlanInondationCommune>>();
  for (const l of lignes) {
    const statut = STATUT[`${l["LIBELLE ETAT"] ?? ""}|${l["LIBELLE SOUS-ETAT"] ?? ""}`];
    if (!statut) continue;
    if ((l["LIBELLE RISQUE 2"] ?? "").trim() !== "Inondation") continue;
    const insee = (l["CODE INSEE COMMUNE"] ?? "").trim();
    const id = (l["CODE PROCEDURE"] ?? "").trim();
    if (!insee || !id) continue;
    const date = statut === "approuve" ? dateIso(l["APPROBATION"])
      : statut === "anticipe" ? dateIso(l["APPLIC_ANTIC"]) ?? dateIso(l["APPROBATION"])
        : dateIso(l["PRESCRIPTION"]);
    const plans = parCommune.get(insee) ?? new Map<string, PlanInondationCommune>();
    const deja = plans.get(id);
    const alea = (l["LIBELLE RISQUE 3"] ?? "").trim();
    if (deja) {
      if (alea && !deja.aleas.includes(alea)) deja.aleas.push(alea);
    } else {
      plans.set(id, {
        id, nom: (l["LIBELLE PROCEDURE"] ?? "").trim(), modele: (l["CODE MODELE"] ?? "").trim(),
        statut, date, aleas: alea ? [alea] : [],
      });
    }
    parCommune.set(insee, plans);
  }
  const ordre: Record<StatutPlan, number> = { approuve: 0, anticipe: 1, prescrit: 2 };
  const out: Record<string, PlanInondationCommune[]> = {};
  for (const insee of [...parCommune.keys()].sort()) {
    out[insee] = [...parCommune.get(insee)!.values()]
      .map((p) => ({ ...p, aleas: [...p.aleas].sort() }))
      .sort((a, b) => ordre[a.statut] - ordre[b.statut] || a.id.localeCompare(b.id));
  }
  return out;
}

/**
 * LES PLANS D'UNE COMMUNE, à son grain GASPAR (Paris, Lyon, Marseille : la ville, cf. `codeGaspar`).
 * `null` quand la table n'est pas chargée : on ne sait pas. `plans: []` quand elle l'est et ne connaît
 * aucun plan inondation pour cette commune.
 */
export function plansInondationDeLaCommune(
  table: TablePlansInondation | null | undefined, insee: string,
): PlansInondationCommune | null {
  if (!table) return null;
  const plans = table.communes[insee] ?? table.communes[codeGaspar(insee)] ?? [];
  return { plans, export: table.meta.export };
}

const MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
/** « 26 février 2019 » depuis `2019-02-26`. */
export function dateLongue(iso: string | null | undefined): string | null {
  const m = iso ? /^(\d{4})-(\d{2})-(\d{2})/.exec(iso) : null;
  if (!m) return null;
  const jour = Number(m[3]);
  return `${jour === 1 ? "1er" : jour} ${MOIS[Number(m[2]) - 1]} ${m[1]}`;
}
