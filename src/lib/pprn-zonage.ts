// Zonage réglementaire PPRN au point (Face 2 Logement). Lib PURE (pas server-only) :
// utilisée côté serveur par `georisques.ts` pour construire le snapshot, et son TYPE est
// importé côté client par le rapport. Ne déduit JAMAIS les travaux autorisés/interdits :
// elle ne fait que structurer et ordonner ce que l'API Géorisques renvoie déjà.
//
// Sémantique vérifiée sur la donnée réelle (2026-07-03, cf.
// docs/board/2026-07-03-decision-face4-valeur-vs-engagement.md) :
//  - un point peut relever de PLUSIEURS plans distincts (inondation + sécheresse-argiles…) ;
//  - `code` = typeReg COVADIS national (02 prescriptions, 03 interdiction, 04 interdiction
//    stricte…), `codeZone`/`nom` = intitulés LOCAUX propres à chaque plan ;
//  - un plan peut avoir `zoneRegExists: true` mais un `listTypeReg` vide (état C) ;
//  - la réponse au point ne porte que `dateModification` (mise à jour de la fiche, JAMAIS
//    l'approbation du plan), et AUCUN aléa.
//
// FUT-127 (22/10/2026) : LES ALÉAS ET L'APPROBATION VIENNENT DU DÉTAIL DU PLAN. Sans eux, un plan
// littoral (`PPRN-L`) ou multirisque (`PPRN-Multi`) était lu comme étranger à l'inondation, et le
// module écrivait « Aucun plan de prévention des inondations ne réglemente ce point » en zone rouge
// submersible (Charron). `/api/v2/gaspar/pprn/{idGaspar}` les donne, commune par commune : ils sont
// rattachés au plan ici (`detailDuPlan`), et leur ABSENCE (panne, rapport plus ancien) se dit `null`,
// jamais `[]`.

export type RegulatoryZone = {
  regimeCode: string | null; // typeReg COVADIS : "02" | "03" | "04" | ...
  regime: string | null; // libellé officiel : "Prescriptions" | "Interdiction" | ...
  zoneCode: string | null; // code local : "R1", "B2" (non normalisé nationalement)
  zoneName: string | null; // nom local auto-descriptif de la zone
};

export type RegulatoryPlan = {
  gasparId: string | null;
  plan: string | null; // libPpr (nom réel du plan, jamais « PPRI » codé en dur)
  hazardModel: string | null; // modeleProcedure : "PPRN-I", "PPRN-RGA", ...
  zoneRegExists: boolean;
  updatedAt: string | null; // dateModification (fiche), pas une date d'approbation
  zones: RegulatoryZone[];
  topRegimeRank: number; // rang de lecture (bas = plus contraignant), 99 si aucune zone
  /**
   * FUT-127 : les aléas que le plan réglemente POUR LA COMMUNE du lieu, lus dans le détail du plan.
   * `null` ou absent = inconnus (détail non lu, ou rapport antérieur) : jamais « aucun aléa ».
   */
  aleas?: PlanAlea[] | null;
  /** FUT-127 : date d'approbation (ISO `AAAA-MM-JJ`), lue dans le détail du plan. Absente = inconnue. */
  approvedAt?: string | null;
};

/** Un aléa d'un plan : la famille (« Inondation ») et ses déclinaisons (« Par submersion marine »). */
export type PlanAlea = { famille: string; sousAleas: string[] };

/** Ce que le détail d'un plan apporte au plan lu au point. */
export type PlanDetail = { aleas: PlanAlea[]; approvedAt: string | null };

type RawDetailAlea = {
  libelle?: string | null;
  dateApprobation?: string | null;
  sousAlea?: Array<{ libelle?: string | null }> | null;
};
export type RawPprnDetail = {
  communes?: Array<{ codeInsee?: string | null; aleas?: RawDetailAlea[] | null }> | null;
} | null | undefined;

const isoDepuisFr = (v: string | null | undefined): string | null => {
  const m = v ? /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(v.trim()) : null;
  return m ? `${m[3]}-${m[2]}-${m[1]}` : null;
};

/**
 * LE DÉTAIL D'UN PLAN, POUR UNE COMMUNE. Un plan de bassin couvre plusieurs communes, et ses aléas
 * peuvent différer de l'une à l'autre : on lit ceux de la commune du lieu. Si elle n'y figure pas (ou
 * si on ne la connaît pas), on réunit ceux de toutes les communes du plan. `null` quand la réponse ne
 * porte aucun aléa : on ne sait pas, et on ne prétend pas savoir.
 */
export function detailDuPlan(raw: RawPprnDetail, codeInsee?: string | null): PlanDetail | null {
  const communes = raw?.communes ?? [];
  const miennes = codeInsee ? communes.filter((c) => c.codeInsee === codeInsee) : [];
  const lues = (miennes.length > 0 ? miennes : communes).flatMap((c) => c.aleas ?? []);
  if (lues.length === 0) return null;
  const parFamille = new Map<string, Set<string>>();
  let approvedAt: string | null = null;
  for (const a of lues) {
    const famille = a.libelle?.trim();
    if (!famille) continue;
    const sous = parFamille.get(famille) ?? new Set<string>();
    for (const s of a.sousAlea ?? []) if (s.libelle?.trim()) sous.add(s.libelle.trim());
    parFamille.set(famille, sous);
    const d = isoDepuisFr(a.dateApprobation);
    if (d && (!approvedAt || d > approvedAt)) approvedAt = d;
  }
  if (parFamille.size === 0) return null;
  return {
    aleas: [...parFamille.entries()].map(([famille, sous]) => ({ famille, sousAleas: [...sous].sort() })),
    approvedAt,
  };
}

/** Le plan lu au point, complété par son détail quand il a pu être lu. */
export function avecDetail(plan: RegulatoryPlan, detail: PlanDetail | null): RegulatoryPlan {
  return detail ? { ...plan, aleas: detail.aleas, approvedAt: detail.approvedAt } : { ...plan, aleas: null, approvedAt: null };
}

// ── LA NATURE D'UN PLAN AU REGARD DE L'INONDATION (FUT-127) ─────────────────────────────────────
// Trois réponses, et la troisième est tout l'objet du correctif :
//   inondation  le plan réglemente l'inondation (submersion marine comprise) ;
//   autre       il réglemente d'autres phénomènes, et on le SAIT (aléas lus, ou modèle sans ambiguïté) ;
//   inconnue    on ne sait pas : un plan littoral ou multirisque sans aléas lus. Jamais « autre ».
export type NatureInondation = "inondation" | "autre" | "inconnue";

const MOT_INONDATION = /inondation|submersion|crue|ruissel|nappe|torrenti/i;
// « PPRI » est la façon dont la majorité des plans se nomment, sans modèle toujours renseigné. Le mot
// est cerné par des limites : « PPRIF » (feux de forêt) ne doit pas entrer par cette porte.
const NOM_INONDATION = /\bPPRI\b|inondation|inondable|submersion|crue|ruissellement/i;
// Une zone dont le nom local dit le phénomène (« zones submersibles », « zone inondable »).
const ZONE_INONDATION = /submersi|inondab|inondation|\bcrues?\b|d[ée]bordement/i;
const MODELES_INONDATION = new Set(["PPRN-I", "PPRN-SM"]);
const MODELES_AMBIGUS = new Set(["PPRN-L", "PPRN-Multi"]);

/** Le plan porte-t-il l'inondation ? Les aléas lus font foi ; sans eux, on ne conclut qu'à coup sûr. */
export function natureInondation(
  plan: Pick<RegulatoryPlan, "plan" | "hazardModel"> & { aleas?: PlanAlea[] | null; zones?: Pick<RegulatoryZone, "zoneName">[] },
): NatureInondation {
  if (plan.aleas && plan.aleas.length > 0) {
    return plan.aleas.some((a) => MOT_INONDATION.test(a.famille) || a.sousAleas.some((s) => MOT_INONDATION.test(s)))
      ? "inondation" : "autre";
  }
  if ((plan.zones ?? []).some((z) => ZONE_INONDATION.test(z.zoneName ?? ""))) return "inondation";
  if (plan.hazardModel && MODELES_INONDATION.has(plan.hazardModel)) return "inondation";
  if (plan.plan && NOM_INONDATION.test(plan.plan)) return "inondation";
  if (!plan.hazardModel || MODELES_AMBIGUS.has(plan.hazardModel) || /\bPPRL\b/i.test(plan.plan ?? "")) return "inconnue";
  return "autre";
}

/**
 * LA ZONE EST-ELLE EXPLICITEMENT LIÉE À L'INONDATION ? Un plan qui réglemente l'inondation ET un autre
 * phénomène (La Rochelle : submersion marine et recul du trait de côte) ne dit pas, dans la donnée
 * reçue, lequel des deux fonde une zone donnée. La liaison est explicite quand le nom de la zone le dit,
 * ou quand le plan ne réglemente que l'inondation.
 */
export function zoneLieeALInondation(
  plan: Pick<RegulatoryPlan, "plan" | "hazardModel" | "aleas">,
  zone: Pick<RegulatoryZone, "zoneName"> | null,
): boolean {
  if (zone && ZONE_INONDATION.test(zone.zoneName ?? "")) return true;
  if (plan.aleas && plan.aleas.length > 0) {
    return plan.aleas.every((a) => MOT_INONDATION.test(a.famille) || a.sousAleas.some((s) => MOT_INONDATION.test(s)));
  }
  return Boolean(plan.hazardModel && MODELES_INONDATION.has(plan.hazardModel));
}

/** Les phénomènes d'inondation que le plan réglemente, en mots courants (« la submersion marine »). */
export function phenomenesInondation(plan: Pick<RegulatoryPlan, "aleas">): string[] {
  const out: string[] = [];
  for (const a of plan.aleas ?? []) {
    if (!MOT_INONDATION.test(a.famille) && !a.sousAleas.some((s) => MOT_INONDATION.test(s))) continue;
    for (const s of a.sousAleas) {
      const p = PHENOMENE[s] ?? null;
      if (p && !out.includes(p)) out.push(p);
    }
  }
  return out;
}

/** Les autres phénomènes que le plan réglemente (« le recul du trait de côte »). */
export function autresPhenomenes(plan: Pick<RegulatoryPlan, "aleas">): string[] {
  const out: string[] = [];
  for (const a of plan.aleas ?? []) {
    if (MOT_INONDATION.test(a.famille)) continue;
    const libelles = a.sousAleas.length > 0 ? a.sousAleas : [a.famille];
    for (const s of libelles) {
      const p = PHENOMENE[s] ?? s.toLowerCase();
      if (!out.includes(p)) out.push(p);
    }
  }
  return out;
}

// Les sous-aléas GASPAR, tels que l'API et l'export les écrivent, en mots courants. Un libellé hors
// table n'est pas traduit au hasard : `phenomenesInondation` l'omet, et le texte dit « l'inondation ».
export const PHENOMENE: Record<string, string> = {
  "Par submersion marine": "la submersion marine",
  "Par une crue à débordement lent de cours d'eau": "les crues lentes de cours d'eau",
  "Par une crue torrentielle ou à montée rapide de cours d'eau": "les crues rapides ou torrentielles",
  "Par ruissellement et coulée de boue": "le ruissellement et les coulées de boue",
  "Par remontées de nappes naturelles": "les remontées de nappe",
  "Par lave torrentielle (torrent et talweg)": "les laves torrentielles",
  "Recul du trait de côte et de falaises": "le recul du trait de côte",
};

export type RawPprnItem = {
  idGaspar?: string | null;
  libPpr?: string | null;
  modeleProcedure?: string | null;
  dateModification?: string | null;
  zonageReglementaire?: {
    zoneRegExists?: boolean | null;
    listTypeReg?: Array<{
      code?: string | null;
      libelle?: string | null;
      nom?: string | null;
      codeZone?: string | null;
    }> | null;
  } | null;
};

// Ordre de LECTURE (pas une préséance juridique) : interdiction stricte > interdiction >
// prescriptions > autres régimes officiels par code. Un rang bas s'affiche en premier.
const REGIME_RANK: Record<string, number> = { "04": 0, "03": 1, "02": 2, "01": 3, "05": 4, "06": 5 };

export function regimeRank(code: string | null | undefined): number {
  return code && code in REGIME_RANK ? REGIME_RANK[code] : 99;
}

export function buildRegulatoryPlans(items: RawPprnItem[] | null | undefined): RegulatoryPlan[] {
  const plans = (items ?? [])
    // On ne garde que les plans qui réglementent RÉELLEMENT le point : soit une zone est
    // renvoyée, soit `zoneRegExists` est vrai (état C). Un plan présent dans la commune mais
    // dont le point n'intersecte aucune zone est écarté (sinon on affiche une fausse contrainte).
    .filter(
      (it) =>
        Boolean(it.zonageReglementaire?.zoneRegExists) ||
        (it.zonageReglementaire?.listTypeReg?.length ?? 0) > 0,
    )
    .map((it): RegulatoryPlan => {
      const zones: RegulatoryZone[] = (it.zonageReglementaire?.listTypeReg ?? []).map((z) => ({
        regimeCode: z.code ?? null,
        regime: z.libelle ?? null,
        zoneCode: z.codeZone ?? null,
        zoneName: z.nom ?? null,
      }));
      return {
        gasparId: it.idGaspar ?? null,
        plan: it.libPpr ?? null,
        hazardModel: it.modeleProcedure ?? null,
        zoneRegExists: Boolean(it.zonageReglementaire?.zoneRegExists),
        updatedAt: it.dateModification ?? null,
        zones,
        topRegimeRank: zones.length ? Math.min(...zones.map((z) => regimeRank(z.regimeCode))) : 99,
      };
    });
  // Régime le plus contraignant d'abord ; plans sans zone détaillée (état C) rejetés en fin.
  return plans.sort((a, b) => a.topRegimeRank - b.topRegimeRank);
}
