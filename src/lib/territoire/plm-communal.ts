// ════════════════════════════════════════════════════════════════════════════════════════════
// PARIS, LYON, MARSEILLE LUS À LA COMMUNE, DEPUIS LEURS ARRONDISSEMENTS (FUT-43). Lib PURE.
//
// Le module Territoire parle de la COMMUNE (75056, 69123, 13055). L'index du comparateur, lui, range ces
// trois villes par arrondissement : `getTerritoryContext("75056")` ne trouvait rien, et le snapshot de
// Paris perdait sa population, son agglomération et sa démographie au profit d'un « les données
// disponibles ne permettent pas de décrire ce point ».
//
// ── LA RÈGLE : AGRÉGER CE QUI S'AGRÈGE, TAIRE LE RESTE ───────────────────────────────────────
// Jamais « Paris = Paris 1er ». Chaque champ est décidé :
//   population        SOMME de tous les arrondissements (`populationCommunalePLM`, un seul manquant = inconnu)
//   unité urbaine     commune à tous les arrondissements (sinon inconnue), population de l'UU idem
//   taux démographique RECALCULÉ sur les sommes : P2015 de chaque arrondissement reconstruite depuis son
//                     taux (P2015 = P2021 / (1 + t)^6), puis t = (ΣP2021 / ΣP2015)^(1/6) − 1. Jamais une
//                     moyenne de taux.
//   arrivants         ABSENT. L'INSEE traite chaque arrondissement comme une commune : un déménagement du
//                     11e au 15e y compte comme une arrivée « d'ailleurs ». Les additionner surestimerait les
//                     arrivées dans la ville.
//   récit             seulement « perd » (taux < −0,15 %/an), le seul qui ne dépend pas des arrivants ;
//                     sinon absent (« gagne / stable » exigent la part d'arrivants).
//   densité, couvert naturel, position (mer, relief, altitude), trait distinctif : ABSENTS. L'index n'a ni
//                     superficie ni couvert pour les arrondissements, une position se mesure en un point, et
//                     un percentile ne s'additionne pas.
// ════════════════════════════════════════════════════════════════════════════════════════════
import { ARRONDISSEMENTS_PLM, populationCommunalePLM } from "../plm-population.ts";

const VILLES: Record<string, { cle: keyof typeof ARRONDISSEMENTS_PLM; nom: string }> = {
  "75056": { cle: "paris", nom: "Paris" },
  "69123": { cle: "lyon", nom: "Lyon" },
  "13055": { cle: "marseille", nom: "Marseille" },
};

/** La ville PLM d'un code COMMUNE (75056…), ou `null`. Un arrondissement n'en est pas une. */
export function villePLM(insee: string): { cle: string; nom: string; arrondissements: readonly string[] } | null {
  const v = VILLES[insee];
  return v ? { ...v, arrondissements: ARRONDISSEMENTS_PLM[v.cle]! } : null;
}

/** La ville d'un code d'ARRONDISSEMENT (75111 → Paris), ou `null`. */
export function villeDeArrondissement(insee: string): { code: string; nom: string } | null {
  for (const [code, v] of Object.entries(VILLES)) if (ARRONDISSEMENTS_PLM[v.cle]!.includes(insee)) return { code, nom: v.nom };
  return null;
}

/** Bande « stable » de `scripts/populate-demographie.py` (±0,15 %/an), en points de pourcentage. */
export const BANDE_STABLE_PCT = 0.15;
const ANNEES = 6; // 2015 → 2021

export type ArrondissementIndex = {
  insee: string;
  population?: number | null;
  uu?: string | null;
  uu_pop?: number | null;
  demographie?: { taux_total?: number | null } | null;
};

export type LectureCommunalePLM = {
  population: number | null;
  uu: string | null;
  uuPop: number | null;
  demographie: { taux_total: number; part_nouveaux: null; recit: "perd" | null } | null;
};

const unique = <T>(valeurs: T[]): T | null => (valeurs.length > 0 && valeurs.every((v) => v === valeurs[0]) ? valeurs[0]! : null);

export function lectureCommunalePLM(insee: string, communes: readonly ArrondissementIndex[]): LectureCommunalePLM | null {
  const ville = villePLM(insee);
  if (!ville) return null;
  const parInsee = new Map(communes.map((c) => [c.insee, c]));
  const arr = ville.arrondissements.map((a) => parInsee.get(a));
  if (arr.some((a) => !a)) return null;
  const tous = arr as ArrondissementIndex[];

  const uu = unique(tous.map((a) => a.uu ?? null));
  const uuPop = uu ? unique(tous.map((a) => a.uu_pop ?? null)) : null;

  let demographie: LectureCommunalePLM["demographie"] = null;
  const complets = tous.every((a) => typeof a.population === "number" && a.population > 0 && typeof a.demographie?.taux_total === "number");
  if (complets) {
    let p2021 = 0, p2015 = 0;
    for (const a of tous) {
      const p = a.population!;
      p2021 += p;
      p2015 += p / Math.pow(1 + a.demographie!.taux_total! / 100, ANNEES);
    }
    const taux = Math.round((Math.pow(p2021 / p2015, 1 / ANNEES) - 1) * 10000) / 100;
    demographie = { taux_total: taux, part_nouveaux: null, recit: taux < -BANDE_STABLE_PCT ? "perd" : null };
  }

  return { population: populationCommunalePLM(ville.cle, tous), uu, uuPop, demographie };
}

/**
 * LE NOM DE CHAQUE AGGLOMÉRATION : sa commune la plus peuplée. Les arrondissements d'une même ville PLM
 * concourent ENSEMBLE, sous le nom de la ville : sinon l'agglomération de Paris s'appelait « Paris 15e
 * Arrondissement », celle de Lyon « Villeurbanne », celle de Marseille « Aix-en-Provence » (FUT-43).
 */
export function libellesAgglomeration(
  communes: readonly { insee: string; nom: string; uu?: string | null; population?: number | null }[],
): Map<string, string> {
  const best = new Map<string, { nom: string; pop: number }>();
  const villes = new Map<string, { nom: string; pop: number; uu: string }>();
  const candidat = (uu: string, nom: string, pop: number) => {
    const prev = best.get(uu);
    if (!prev || pop > prev.pop) best.set(uu, { nom, pop });
  };
  for (const c of communes) {
    if (!c.uu) continue;
    const ville = villeDeArrondissement(c.insee);
    if (ville) {
      const v = villes.get(ville.code) ?? { nom: ville.nom, pop: 0, uu: c.uu };
      v.pop += c.population ?? 0;
      villes.set(ville.code, v);
    } else candidat(c.uu, c.nom, c.population ?? 0);
  }
  for (const v of villes.values()) candidat(v.uu, v.nom, v.pop);
  return new Map([...best].map(([uu, v]) => [uu, v.nom]));
}
