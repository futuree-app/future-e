// Libellés humains des clés de préférence du Comparateur de vie.
//
// Client-safe (pas de "server-only", pas d'fs) : la page /ou-vivre l'importe
// pour convertir les clés techniques du projet parsé en libellés lisibles avant
// de les passer à AskFuture comparateur. Le firewall de la route ask interdit la
// donnée profonde ; cette map garantit qu'AUCUNE clé technique (faible_chaleur,
// faible_pression_agricole…) ne quitte le client, seulement sa glose humaine.
//
// Source de vérité du vocabulaire : alignée sur la route synthesize. Si une clé
// PREFERENCE_KEYS est ajoutée au moteur, l'ajouter ici.

export const PREFERENCE_LABELS: Record<string, string> = {
  faible_chaleur: "des étés plus frais",
  douceur_climat: "un climat doux",
  ensoleillement_recherche: "du soleil et de la chaleur",
  faible_secheresse: "des sols peu exposés à la sécheresse",
  faible_risque_feu: "un faible risque de feu",
  faible_precip_extremes: "moins de pluies intenses",
  proximite_mer: "la proximité de la mer",
  cadre_calme: "un cadre calme",
  eviter_isolement: "ne pas être isolé",
  air_sain: "un air plus pur",
  acces_soins: "un bon accès aux soins",
  acces_services: "des services du quotidien accessibles",
  faible_pression_agricole: "un environnement peu marqué par l'agriculture intensive",
  viabilite_emploi: "un bassin d'emploi dynamique",
  nature: "des espaces naturels à proximité",
};

// Interprétations visibles (audit sémantique, cf. AUDIT_SEMANTIQUE_COMPARATEUR.md).
// Glose affichée sous la puce du critère pour rendre EXPLICITE ce que le moteur
// entend, et désamorcer les faux amis (« doux » = hiver océanique, pas Méditerranée)
// et la polysémie (« calme » = densité, pas la campagne). null = le libellé dit déjà
// tout, on ne glose pas (anti-bloat). Pur affichage : aucun impact sur le score.
export const PREFERENCE_INTERPRETATIONS: Record<string, string | null> = {
  douceur_climat: "hivers tempérés, étés sans excès",
  cadre_calme: "densité modérée, sans isolement",
  ensoleillement_recherche: "plus chaud et plus sec",
  proximite_mer: "accès rapide à la côte",
  eviter_isolement: "commune assez peuplée pour une vie locale",
  // « à proximité » assumé (on mesure le couvert autour, pas dans la commune). Jamais
  // « préservé / sauvage / biodiversité », qu'on ne mesure pas (cf. NATURE_TERRITORIAL.md).
  nature: "forêts, prairies et milieux naturels autour",
  // self-évidents (le mot = la mesure) : pas de glose
  faible_chaleur: null,
  faible_secheresse: null,
  faible_risque_feu: null,
  faible_precip_extremes: null,
  air_sain: null,
  acces_soins: null,
  acces_services: null,
  faible_pression_agricole: null,
  viabilite_emploi: null,
};

// Convertit une liste de préférences {key} en libellés humains, sans doublon,
// en ignorant toute clé inconnue.
export function preferencesToLabels(
  preferences: { key: string }[] | null | undefined,
): string[] {
  if (!preferences) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const p of preferences) {
    const label = PREFERENCE_LABELS[p.key];
    if (label && !seen.has(label)) {
      seen.add(label);
      out.push(label);
    }
  }
  return out;
}

// Variante portant l'interprétation visible (glose) à côté du libellé, sans doublon.
export function preferencesToInterpreted(
  preferences: { key: string }[] | null | undefined,
): { label: string; gloss: string | null }[] {
  if (!preferences) return [];
  const seen = new Set<string>();
  const out: { label: string; gloss: string | null }[] = [];
  for (const p of preferences) {
    const label = PREFERENCE_LABELS[p.key];
    if (label && !seen.has(label)) {
      seen.add(label);
      out.push({ label, gloss: PREFERENCE_INTERPRETATIONS[p.key] ?? null });
    }
  }
  return out;
}

// Phrases honnêtes affichées au gate pour les notions sans critère dans le moteur.
// Formulation FIXE par kind (on n'interpole pas le mot brut de l'utilisateur, pour
// éviter les accords bancals). écoles / culture = « pas encore » (une donnée publique
// pourrait les approcher un jour, BPE) ; affectif = jamais (expérience personnelle).
const HORS_MESURE_PHRASES: Record<string, string> = {
  ecoles:
    "La présence d'écoles, de collèges et de lycées n'est pas encore un critère mesuré par futur•e.",
  culture:
    "L'accès à la vie culturelle (cinémas, théâtres, musées) n'est pas encore un critère mesuré par futur•e.",
  affectif:
    "Le caractère d'un lieu (authentique, chaleureux, vivant) relève d'une expérience personnelle, pas d'une donnée territoriale.",
};

// Convertit les notions hors-mesure en phrases à afficher, sans doublon de phrase
// (deux termes d'un même kind se replient sur une seule phrase). Ignore les kinds inconnus.
export function horsMesureToPhrases(
  items: { term: string; kind: string }[] | null | undefined,
): string[] {
  if (!items) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const it of items) {
    const phrase = HORS_MESURE_PHRASES[it.kind];
    if (phrase && !seen.has(phrase)) {
      seen.add(phrase);
      out.push(phrase);
    }
  }
  return out;
}

// Trait distinctif d'une commune RELATIF aux autres communes affichées : l'attribut
// où elle sort le plus du lot, en langage léger (« la plus proche de la mer des trois »).
// Décisionnel (aide à trancher ENTRE les propositions), narratif, hors score, hors tri.
// Se tait si rien ne se détache (doctrine : on ne remplit jamais pour remplir).
type DistinctiveMetrics = {
  precip_annuelle: number | null;
  population: number | null;
  jours_chauds_30: number | null;
  temp_hiver: number | null;
  distance_cote_km: number | null;
  ifm: number | null;
};
type DistinctiveInput = { insee: string; metrics: DistinctiveMetrics };

const DISTINCTIVE_CANDIDATES: {
  key: keyof DistinctiveMetrics;
  dir: "min" | "max";
  scale: number;
  label: string;
  guard?: (v: number) => boolean;
}[] = [
  { key: "distance_cote_km", dir: "min", scale: 50, label: "la plus proche de la mer", guard: (v) => v <= 60 },
  { key: "precip_annuelle", dir: "max", scale: 250, label: "la plus pluvieuse", guard: (v) => v >= 850 },
  { key: "precip_annuelle", dir: "min", scale: 250, label: "la plus sèche", guard: (v) => v <= 750 },
  { key: "jours_chauds_30", dir: "max", scale: 15, label: "les étés les plus chauds" },
  { key: "jours_chauds_30", dir: "min", scale: 15, label: "les étés les plus frais" },
  { key: "temp_hiver", dir: "max", scale: 4, label: "les hivers les plus doux" },
  { key: "temp_hiver", dir: "min", scale: 4, label: "les hivers les plus rudes" },
  { key: "ifm", dir: "max", scale: 20, label: "la plus exposée aux feux", guard: (v) => v >= 15 },
];
const DISTINCTIVE_FLOOR = 0.45; // saillance minimale (écart au plus proche, normalisé)

export function buildDistinctiveTraits(results: DistinctiveInput[]): Record<string, string> {
  const n = results.length;
  if (n < 2) return {};
  const suffix = n >= 3 ? " des trois" : " des deux";
  const cand = new Map<string, { label: string; sal: number }[]>(
    results.map((r) => [r.insee, []]),
  );

  for (const c of DISTINCTIVE_CANDIDATES) {
    const vals = results
      .map((r) => ({ insee: r.insee, v: r.metrics?.[c.key] }))
      .filter((x): x is { insee: string; v: number } => x.v != null);
    if (vals.length < 2) continue;
    const sorted = [...vals].sort((a, b) => a.v - b.v);
    const ext = c.dir === "min" ? sorted[0] : sorted[sorted.length - 1];
    const nearest = c.dir === "min" ? sorted[1] : sorted[sorted.length - 2];
    if (c.guard && !c.guard(ext.v)) continue;
    const sal = Math.abs(ext.v - nearest.v) / c.scale;
    if (sal >= DISTINCTIVE_FLOOR) cand.get(ext.insee)!.push({ label: c.label + suffix, sal });
  }

  // Population : saillance par ratio (échelle log), pas additive.
  const pops = results
    .map((r) => ({ insee: r.insee, v: r.metrics?.population }))
    .filter((x): x is { insee: string; v: number } => x.v != null);
  if (pops.length >= 2) {
    const s = [...pops].sort((a, b) => a.v - b.v);
    const ratioSmall = s[1].v / s[0].v;
    const ratioBig = s[s.length - 1].v / s[s.length - 2].v;
    if (ratioSmall >= 1.6) cand.get(s[0].insee)!.push({ label: "la plus petite" + suffix, sal: Math.log2(ratioSmall) });
    if (ratioBig >= 1.6) cand.get(s[s.length - 1].insee)!.push({ label: "la plus grande" + suffix, sal: Math.log2(ratioBig) });
  }

  const out: Record<string, string> = {};
  for (const r of results) {
    const best = (cand.get(r.insee) ?? []).sort((a, b) => b.sal - a.sal)[0];
    if (best) out[r.insee] = best.label;
  }
  return out;
}
