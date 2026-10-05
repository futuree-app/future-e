// LES DRAPEAUX DE RISQUE DE GÉORISQUES, DÉRIVÉS DES LIBELLÉS GASPAR. Module PUR, séparé de la couche
// d'accès (georisques.ts est `server-only`) : cette dérivation n'a aucun besoin du serveur, et tant
// qu'elle y vivait, elle était intestable.
//
// Elle a porté pendant des mois une faute qu'aucun test ne pouvait voir : `wildfire` cherchait
// « feux de foret » AU PLURIEL, quand GASPAR écrit « Feu de forêt » au SINGULIER — vérifié sur
// Lège-Cap-Ferret, Aix-en-Provence, Hyères, Antibes. Le drapeau valait donc `false` pour toutes les
// communes de France, et le dossier de décision en concluait qu'une priorité « à l'abri des incendies »
// était satisfaite, y compris là où l'État recense le risque.
//
// Les libellés de référence vivent dans georisques.test.ts, recopiés tels que l'API les renvoie.
export function riskFlagsFromLabels(riskLabels: string[], seismicZone = false) {
  const normalizedLabels = riskLabels.map(normalizeLabel);
  return {
    flood: normalizedLabels.some((label) => label.includes("inondation")),
    marineSubmersion: normalizedLabels.some((label) => label.includes("submersion marine")),
    landslide: normalizedLabels.some((label) => label.includes("mouvement de terrain")),
    clay: normalizedLabels.some(
      (label) => label.includes("tassements differentiels") || label.includes("argile"),
    ),
    storm: normalizedLabels.some((label) => label.includes("tempete")),
    seismic: seismicZone || normalizedLabels.some((label) => label.includes("seisme")),
    // PPRIF ou risque incendie déclaré dans GASPAR. La regex accepte les deux nombres plutôt qu'une
    // seconde chaîne littérale : c'est la même faute qui reviendrait au prochain libellé.
    wildfire: normalizedLabels.some(
      (label) => label.includes("incendie") || /feux? de forets?/.test(label),
    ),
  };
}

export function normalizeLabel(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}


// Couche de traduction utilisateur — point UNIQUE de conversion des libellés
// administratifs GASPAR/Géorisques en familles compréhensibles sans jargon.
// Réutilisable partout (carte, drawer, synthèse, AskFuture passent par byRisk).
export function simplifyCatnatRisk(raw: string): string {
  const n = normalizeLabel(raw);
  if (n.includes("submersion")) return "Submersion marine";
  // « ÉROSION » A ÉTÉ RETIRÉ DE CE LIBELLÉ (20/09/2026), et le mot était une faute de fond.
  //
  // L'arrêté officiel dit « Chocs Mécaniques liés à l'action des Vagues » : il indemnise les dégâts
  // causés par l'action mécanique des vagues pendant une tempête. Le régime de catastrophe
  // naturelle EXCLUT l'érosion côtière, et c'est précisément pour cela qu'un dispositif séparé
  // existe pour le recul du trait de côte.
  //
  // Traduire cet aléa par « Érosion » faisait donc dire à une reconnaissance CatNat l'inverse de ce
  // qu'elle couvre, sur le sujet le plus sensible du littoral pour un acheteur. La synthèse du
  // Territoire de Châtelaillon-Plage écrivait, en reprenant fidèlement ce libellé : « des
  // reconnaissances en état de catastrophe naturelle liées à […] l'érosion côtière ». Faux.
  //
  // L'érosion reste nommée ailleurs, à sa vraie source : l'indicateur Cerema du trait de côte.
  if (n.includes("vague") || n.includes("chocs mecaniques")) return "Chocs liés aux vagues";
  if (
    n.includes("inondation") ||
    n.includes("coulee") ||
    n.includes("nappe") ||
    n.includes("crue") ||
    n.includes("torrentiel")
  )
    return "Inondations";
  if (n.includes("secheresse") || n.includes("retrait") || n.includes("argile"))
    return "Sécheresse des sols";
  if (
    n.includes("mouvement de terrain") ||
    n.includes("glissement") ||
    n.includes("eboulement") ||
    n.includes("affaissement")
  )
    return "Mouvements de terrain";
  if (n.includes("cyclo") || n.includes("ouragan")) return "Cyclone";
  if (n.includes("tempete") || n.includes("grains")) return "Tempête";
  if (n.includes("seisme") || n.includes("sismi")) return "Séisme";
  if (n.includes("avalanche")) return "Avalanche";
  if (n.includes("grele")) return "Grêle";
  if (n.includes("neige")) return "Neige";
  return raw.trim();
}

// ── CE QUI « DOMINE » LES RECONNAISSANCES, DIT D'UN SEUL ENDROIT (FUT-60, 05/10/2026) ──────────────
// La carte « Mémoire des catastrophes » écrivait « Surtout X » dès qu'un aléa existait, et la synthèse
// « surtout au titre de : » suivi des TROIS premiers, quelle que soit leur part : une commune à cinq
// aléas d'une reconnaissance chacun devenait « surtout » l'un d'eux. Le seuil n'est pas nouveau :
// c'est celui que le résumé du relevé appliquait déjà (55 %), désormais partagé par tous.
export const PART_DOMINANTE = 0.55;

type Repartition = { label: string; count: number }[];
const parFrequence = (byRisk: Repartition) => [...byRisk].sort((a, b) => b.count - a.count);

/** L'aléa qui pèse au moins 55 % des reconnaissances, ou `null` : aucune dominante ne s'invente. */
export function aleaDominant(byRisk: Repartition, total: number): string | null {
  if (!total || byRisk.length === 0) return null;
  const top = parFrequence(byRisk)[0]!;
  return top.count / total >= PART_DOMINANTE ? top.label : null;
}

/** La phrase de répartition (≤ 120 car.), ou `null` sans reconnaissance. Aucune IA. */
export function resumeCatnat(byRisk: Repartition, total: number): string | null {
  if (!total || byRisk.length === 0) return null;
  const tri = parFrequence(byRisk);
  const top = tri[0]!;
  const lower = top.label.toLowerCase();
  if (tri.length === 1) return `Uniquement ${lower}.`;
  if (aleaDominant(tri, total)) return `Surtout ${lower}.`;
  if (top.count / total >= 0.4 && top.count > tri[1]!.count) return `${top.label} : près de la moitié des reconnaissances.`;
  // Deux aléas « les plus fréquents » n'existent que si le deuxième se détache du troisième, et le
  // premier du deuxième ou du troisième : sinon c'est une égalité, qui se dit comme telle.
  if (tri[2] && tri[2].count === tri[1]!.count) return "Plusieurs aléas, sans dominante nette.";
  const sentence = `${top.label} et ${tri[1]!.label.toLowerCase()} sont les aléas les plus fréquents.`;
  return sentence.length <= 120 ? sentence : "Plusieurs aléas, sans dominante nette.";
}

// ── L'AGRÉGATION DES LIGNES GASPAR (déplacée de georisques.ts, FUT-60, comportement inchangé) ────
// UNITÉ : une ligne GASPAR = une reconnaissance (un arrêté, un phénomène, un événement). Un arrêté
// peut porter plusieurs lignes ; le total et la répartition comptent donc des LIGNES, la même unité
// que le compte inondation de l'index (scripts/gaspar/collecter-catnat.mts).
/** Famille visuelle d'une année marquante (palette bande-trajectoire, jamais de rouge). */
export type CatnatBandFamily = "inondation" | "secheresse" | "tempete" | "autre";

export type GasparCatnatSummary = {
  /** Nombre total d'arrêtés CatNat sur la commune. */
  total: number;
  firstYear: number | null;
  lastYear: number | null;
  /** Répartition par famille d'aléa, triée par fréquence décroissante. */
  byRisk: { label: string; count: number }[];
  /** Comptage par décennie (frise temporelle), ordre chronologique. decade = 1980, 1990… */
  byDecade: { decade: number; count: number }[];
  /**
   * Années marquées par au moins un arrêté, ordre chronologique, une famille
   * dominante par année (la plus fréquente dans l'année ; égalité tranchée par
   * gravité inondation > sécheresse > tempête > autre). Alimente la bande
   * « ligne des années » du rapport Territoire.
   */
  years: { year: number; family: CatnatBandFamily }[];
  topRisk: string | null;
  /** Phrase de synthèse déterministe (≤ 120 car.), ou null si aucun arrêté. */
  summary: string | null;
};

// Famille visuelle d'un libellé simplifié (couche bande-trajectoire, 4 couleurs).
const BAND_FAMILY_ORDER: CatnatBandFamily[] = ["inondation", "secheresse", "tempete", "autre"];

function bandFamilyOf(simplified: string): CatnatBandFamily {
  if (
    simplified === "Inondations" ||
    simplified === "Submersion marine" ||
    simplified === "Érosion et impact des vagues"
  )
    return "inondation";
  if (simplified === "Sécheresse des sols") return "secheresse";
  if (simplified === "Tempête" || simplified === "Cyclone") return "tempete";
  return "autre";
}

function parseEvtYear(value: string | null | undefined): number | null {
  if (!value) return null;
  const year = Number(value.split("/")[2]);
  return Number.isFinite(year) && year > 1900 ? year : null;
}

export type LigneCatnat = { libelle_risque_jo?: string | null; date_debut_evt?: string | null };

export function agregerLignesCatnat(items: LigneCatnat[], results?: number | null): GasparCatnatSummary {
  const counts = new Map<string, number>();
  const decadeCounts = new Map<number, number>();
  const yearFamilyCounts = new Map<number, Map<CatnatBandFamily, number>>();
  let firstYear: number | null = null;
  let lastYear: number | null = null;

  for (const item of items) {
    const label = item.libelle_risque_jo?.trim();
    const year = parseEvtYear(item.date_debut_evt);
    if (label) {
      const family = simplifyCatnatRisk(label);
      counts.set(family, (counts.get(family) ?? 0) + 1);
      if (year != null) {
        const perYear = yearFamilyCounts.get(year) ?? new Map<CatnatBandFamily, number>();
        const band = bandFamilyOf(family);
        perYear.set(band, (perYear.get(band) ?? 0) + 1);
        yearFamilyCounts.set(year, perYear);
      }
    }
    if (year != null) {
      firstYear = firstYear == null ? year : Math.min(firstYear, year);
      lastYear = lastYear == null ? year : Math.max(lastYear, year);
      const decade = Math.floor(year / 10) * 10;
      decadeCounts.set(decade, (decadeCounts.get(decade) ?? 0) + 1);
    }
  }

  const years = Array.from(yearFamilyCounts.entries())
    .map(([year, perYear]) => {
      let family: CatnatBandFamily = "autre";
      let best = -1;
      for (const candidate of BAND_FAMILY_ORDER) {
        const count = perYear.get(candidate) ?? 0;
        if (count > best) {
          best = count;
          family = candidate;
        }
      }
      return { year, family };
    })
    .sort((a, b) => a.year - b.year);

  const byRisk = Array.from(counts.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);

  const byDecade = Array.from(decadeCounts.entries())
    .map(([decade, count]) => ({ decade, count }))
    .sort((a, b) => a.decade - b.decade);

  const total = typeof results === "number" ? results : items.length;

  return {
    total,
    firstYear,
    lastYear,
    byRisk,
    byDecade,
    years,
    topRisk: byRisk[0]?.label ?? null,
    summary: resumeCatnat(byRisk, total),
  };
}

// ── LE GRAIN DE GASPAR, PROPRIÉTÉ DE CETTE SOURCE ET D'ELLE SEULE (FUT-60) ─────────────────────────
// GASPAR publie Paris, Lyon et Marseille à la VILLE (75056, 69123, 13055) : un arrondissement n'y a
// aucune ligne. Ce n'est pas une règle PLM générale : le zonage sismique de Géorisques fait l'inverse
// (seul l'arrondissement répond). D'où une table propre à GASPAR, et pas un détour par un helper
// commun qui laisserait croire que toutes les sources se lisent à la ville.
const VILLES_GASPAR: { code: string; ville: string; premier: number; dernier: number }[] = [
  { code: "75056", ville: "Paris", premier: 75101, dernier: 75120 },
  { code: "69123", ville: "Lyon", premier: 69381, dernier: 69389 },
  { code: "13055", ville: "Marseille", premier: 13201, dernier: 13216 },
];
const villeGasparDe = (insee: string | null | undefined) => {
  if (!insee) return null;
  const n = Number(insee);
  return VILLES_GASPAR.find((v) => v.code === insee || (n >= v.premier && n <= v.dernier)) ?? null;
};

/** Le code sous lequel GASPAR publie les reconnaissances de ce lieu. */
export function codeGaspar(insee: string): string {
  return villeGasparDe(insee)?.code ?? insee;
}

/**
 * La ville dont GASPAR donne le compte, quand ce compte n'est PAS propre au lieu demandé : « Paris »
 * pour 75111 comme pour 75056 (le compte d'un arrondissement est celui de toute la ville). `null`
 * partout ailleurs, où le compte est celui de la commune elle-même.
 */
export function villeGaspar(insee: string | null | undefined): string | null {
  return villeGasparDe(insee)?.ville ?? null;
}
