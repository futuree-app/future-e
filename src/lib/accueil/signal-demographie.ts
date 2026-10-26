// FUT-72 : CE QUE /qna DIT AU MODÈLE DE LA DÉMOGRAPHIE. Module PUR : aucune I/O, aucun appel IA.
//
// `buildTerritorySignals` (comparateur-vie.ts) transmettait deux champs au modèle :
//   - `recit_nouveaux_arrivants: "gagne_attire"` : le code interne de `scripts/populate-demographie.py`.
//     Lu par un modèle, « attire » devient une cause (« une commune qui attire »). FUT-6 et FUT-36 l'ont
//     retirée du Territoire et du comparateur ; /qna la réintroduisait par le contexte ;
//   - `tendance` : comparait `taux_total`, stocké en POINTS de pourcentage par an (1,36 = +1,36 %/an), à
//     0,05 et 0,01 comme s'il était une fraction. Toute commune à plus de +0,05 %/an était dite en « forte
//     croissance récente » (16 484 communes sur 34 725), et 2 946 recevaient une tendance contraire au code
//     (« forte croissance » pour une population que le code dit stable).
//
// Le moteur garde ses codes, ses scores et ses classements. Seul le contexte du modèle change : le signal
// démographique y est REMPLACÉ par des constats neutres, dérivés des seules conventions déjà établies
// (bande stable ±0,15 %/an, part d'arrivants dans le tiers haut national). Aucun nouveau seuil : la
// « forte » croissance disparaît, faute d'une convention qui la définisse.
import { BANDE_STABLE_PCT } from "../territoire/plm-communal.ts";
import { isDemographyCode, type DemographyCode } from "../territoire/facts.ts";

/** Le champ `demographie` de l'index, tel que la route le lit. */
export type DemographieIndex = {
  taux_total: number | null;
  part_nouveaux: number | null;
  recit: string | null;
} | null | undefined;

export type SignalDemographie = {
  evolution_population: string;
  arrivants_recents?: string;
  ce_que_cela_mesure: string;
};

const EVOLUTION: Record<"hausse" | "stable" | "baisse", string> = {
  hausse: "la population augmente",
  stable: "la population est globalement stable",
  baisse: "la population diminue",
};

const SENS_DU_CODE: Record<DemographyCode, keyof typeof EVOLUTION> = {
  gagne_attire: "hausse",
  gagne_sans_renouv: "hausse",
  stable_renouv: "stable",
  stable: "stable",
  perd: "baisse",
};

// Ce que le code dit de la part d'arrivants. `perd` ne la qualifie pas : rien n'est dit.
const ARRIVANTS_DU_CODE: Partial<Record<DemographyCode, string>> = {
  gagne_attire: "part élevée d'habitants arrivés d'une autre commune dans l'année précédant le recensement",
  stable_renouv: "part élevée d'habitants arrivés d'une autre commune dans l'année précédant le recensement",
  gagne_sans_renouv: "part d'habitants arrivés d'une autre commune dans l'année précédant le recensement qui n'est pas particulièrement élevée",
  stable: "part d'habitants arrivés d'une autre commune dans l'année précédant le recensement qui n'est pas particulièrement élevée",
};

const MESURE =
  // Aucun chiffre ici : le contrôle des nombres de /qna refuserait tout chiffre que le modèle en recopierait.
  "Évolution annuelle moyenne de la population entre deux recensements de l'INSEE (stable : variation très faible dans un sens ou dans l'autre) ; " +
  "une part d'arrivants est dite élevée quand elle se situe dans le tiers des communes où elle est la plus forte. " +
  "Ce sont des constats observés : ils ne disent pas pourquoi la population change ni pourquoi des habitants s'installent.";

/** Le sens de l'évolution : le code d'abord, sinon le taux avec la même bande stable. */
function sens(d: NonNullable<DemographieIndex>): keyof typeof EVOLUTION | null {
  if (isDemographyCode(d.recit)) return SENS_DU_CODE[d.recit];
  const t = d.taux_total;
  if (t == null || !Number.isFinite(t)) return null;
  return t > BANDE_STABLE_PCT ? "hausse" : t < -BANDE_STABLE_PCT ? "baisse" : "stable";
}

/** Le signal démographique dit au modèle, ou `null` quand aucune mesure ne le fonde. */
export function signalDemographie(d: DemographieIndex): SignalDemographie | null {
  if (!d) return null;
  const s = sens(d);
  if (!s) return null;
  const arrivants = isDemographyCode(d.recit) ? ARRIVANTS_DU_CODE[d.recit] : undefined;
  return {
    evolution_population: EVOLUTION[s],
    ...(arrivants ? { arrivants_recents: arrivants } : {}),
    ce_que_cela_mesure: MESURE,
  };
}

/**
 * Les signaux territoire tels qu'envoyés au modèle : ceux de `buildTerritorySignals`, dont le champ
 * `demographie` est remplacé (ou retiré) par `signalDemographie`. Les autres champs passent inchangés.
 */
export function signauxPourLeModele(
  signaux: Record<string, unknown>,
  demographie: DemographieIndex,
): Record<string, unknown> {
  const reste = { ...signaux };
  delete reste.demographie;
  const demo = signalDemographie(demographie);
  return demo ? { ...reste, demographie: demo } : reste;
}
