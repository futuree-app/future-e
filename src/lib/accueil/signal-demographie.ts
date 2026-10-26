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
import type { DemographyCode } from "../territoire/facts.ts";

/** Le champ `demographie` de l'index, tel que la route le lit. */
export type DemographieIndex = {
  taux_total: number | null;
  part_nouveaux: number | null;
  recit: string | null;
} | null | undefined;

export type SignalDemographie = {
  evolution_population?: string;
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

// ── Cohérence des valeurs et du code (revue de Work, 26/10) ─────────────────────────────────
//
// Le code n'a plus la priorité : il est DÉRIVÉ du taux et de la part (`recit_code` de
// populate-demographie.py) et ne vaut que s'il s'accorde avec eux. Un constat qui n'est pas démontré
// est omis ; un constat indépendant qui reste démontré est gardé.
//
// Arrondi de stockage : `taux_total` est le taux brut ×100 arrondi à deux décimales. Le code « hausse »
// exige un taux brut > 0,15 %/an, donc un taux stocké ≥ 0,15 ; « baisse » un stocké ≤ −0,15 ; « stable »
// un stocké dans [−0,15 ; 0,15]. À ±0,15 exactement, les deux codes voisins sont possibles (l'index en
// compte 248 communes) : sans code, ce taux ne tranche pas.
//
// Limite : le seuil de la part d'arrivants (tiers haut national) n'est pas stocké, et la part est arrondie
// à 0,1 point. La qualification « élevée » ne peut donc pas être recalculée ici ; elle exige le code ET
// une part valide (nombre fini entre 0 et 100). Le test sur l'index réel vérifie que les codes y sont
// séparés par un seul seuil.

const finiOuNull = (v: unknown): number | null => (typeof v === "number" && Number.isFinite(v) ? v : null);

// Domaine du taux (revue de Work, 3e passe) : `taux_total` vaut ((P21/P15)^(1/6) − 1) × 100, et
// populate-demographie.py écarte P21 ≤ 0. Le taux brut est donc strictement supérieur à −100 %/an ; arrondi,
// le taux stocké est ≥ −100. En dessous, la valeur est impossible : elle est invalide, avec ou sans code.
// Aucune borne haute : la formule n'en a pas, et un plafond serait un seuil arbitraire.
const TAUX_MINIMUM_PCT = -100;
const tauxOuNull = (v: unknown): number | null => {
  const t = finiOuNull(v);
  return t != null && t >= TAUX_MINIMUM_PCT ? t : null;
};

/** Le sens que le taux STOCKÉ démontre à lui seul, ou `null` s'il ne tranche pas (absent, invalide ou impossible, borne). */
function sensDuTaux(t: number | null): keyof typeof EVOLUTION | null {
  if (t == null) return null;
  if (t > BANDE_STABLE_PCT) return "hausse";
  if (t < -BANDE_STABLE_PCT) return "baisse";
  if (t > -BANDE_STABLE_PCT && t < BANDE_STABLE_PCT) return "stable";
  return null;
}

/** Le code s'accorde-t-il avec le taux stocké, arrondi compris ? */
function codeCompatible(code: DemographyCode, t: number): boolean {
  const s = SENS_DU_CODE[code];
  if (s === "hausse") return t >= BANDE_STABLE_PCT;
  if (s === "baisse") return t <= -BANDE_STABLE_PCT;
  return t >= -BANDE_STABLE_PCT && t <= BANDE_STABLE_PCT;
}

/** Les constats démontrés : chacun est `null` quand les valeurs ne le fondent pas. */
function constats(d: NonNullable<DemographieIndex>): { sens: keyof typeof EVOLUTION | null; arrivants: string | null } {
  const t = tauxOuNull(d.taux_total);
  const p = finiOuNull(d.part_nouveaux);
  const partValide = p != null && p >= 0 && p <= 100;
  // `Object.hasOwn`, pas `in` (celui de `isDemographyCode`) : « toString » ou « constructor » ne sont pas des codes.
  const code = typeof d.recit === "string" && Object.hasOwn(SENS_DU_CODE, d.recit) ? (d.recit as DemographyCode) : null;
  // Sans code reconnu (absent ou inconnu) : le taux seul, rien sur les arrivants.
  if (!code) return { sens: sensDuTaux(t), arrivants: null };
  // Un code sans taux valide, ou contredit par le taux : le code n'est pas fiable, aucun constat n'en sort.
  // Le taux seul ne suffit pas non plus : la valeur ou le code est faux, on ne sait pas lequel.
  if (t == null || !codeCompatible(code, t)) return { sens: null, arrivants: null };
  return { sens: SENS_DU_CODE[code], arrivants: partValide ? ARRIVANTS_DU_CODE[code] ?? null : null };
}

/** Le signal démographique dit au modèle, ou `null` quand aucune mesure ne le fonde. */
export function signalDemographie(d: DemographieIndex): SignalDemographie | null {
  if (!d) return null;
  const { sens, arrivants } = constats(d);
  if (!sens && !arrivants) return null;
  return {
    ...(sens ? { evolution_population: EVOLUTION[sens] } : {}),
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
