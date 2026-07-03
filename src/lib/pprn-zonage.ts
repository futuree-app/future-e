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
//  - la seule date disponible est `dateModification` (mise à jour de la fiche, JAMAIS
//    l'approbation du plan).

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
