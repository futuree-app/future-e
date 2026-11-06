// ════════════════════════════════════════════════════════════════════════════════════════════
// LA PROVENANCE D'UNE PREUVE (FUT-12, 04/11/2026). Un seul contrat, pour le moteur de décision
// (`EvidenceRef.provenance`) et pour le registre Territoire (`Fact.provenance`).
//
// LE DÉFAUT QU'IL CORRIGE. Les sources étaient identifiables, jamais structurées : un libellé libre
// (« BRGM, via Géorisques », « CCR · indicateurs ONRN, mise à jour 2025 · données 1995-2021 ») portait
// à la fois le producteur, le diffuseur, l'édition et la période, quand il les portait. Une donnée
// chargée en 2026 et mesurée en 2022 n'avait aucun champ pour dire 2022, et la date de consultation
// connue du serveur (`fetchedAt`) n'arrivait jamais à l'écran.
//
// LA RÈGLE : chaque date a UN sens, et un seul champ.
//   - `period`      : ce que la donnée MESURE (l'année, la période, le jour du diagnostic) ;
//   - `version`     : l'édition officielle du jeu ou de sa distribution (« carte d'exposition 2026 ») ;
//   - `publishedAt` : la publication par le producteur, quand elle est connue ;
//   - `consultedAt` : la lecture d'une source vivante par futur•e, quand elle a réellement eu lieu ;
//   - `loadedAt`    : l'entrée d'un fichier dans futur•e (un artefact construit à une date connue).
// Aucune ne se déduit d'une autre. Une donnée consultée le 4 novembre 2026 n'est pas une donnée de
// 2026 : la fonction de rendu ne fabrique JAMAIS une période à partir d'une consultation ou d'un
// chargement, et un test le vérifie.
//
// ABSENT VEUT DIRE INCONNU. Aucun champ n'est obligatoire, et aucun n'a de valeur par défaut. Une
// preuve historique (produite avant ce contrat) n'en porte aucun : elle se lit par son libellé, comme
// avant, et rien ne lui est attribué après coup.
//
// PUR ET UNIVERSEL : aucun import, utilisable par un composant client.
// ════════════════════════════════════════════════════════════════════════════════════════════

/**
 * La nature de la preuve. Elle règle le verbe de la période (« observées », « estimation »,
 * « projection »), et c'est elle qui empêche une estimation de se lire comme une mesure.
 *   - `observation`  : mesurée ou constatée (un recensement, une vente enregistrée, un relevé) ;
 *   - `derive`       : calculée par futur•e à partir d'observations (une médiane, un rang) ;
 *   - `estimation`   : modélisée ou imputée par le producteur (un loyer d'annonce estimé, un sondage) ;
 *   - `projection`   : une trajectoire simulée (DRIAS) ;
 *   - `reglementaire`: un zonage ou un acte qui s'applique (plan de prévention, carte d'exposition).
 */
export type ProvenanceNature = "observation" | "derive" | "estimation" | "projection" | "reglementaire";

export type Provenance = {
  /** Qui produit la donnée (« Insee », « BRGM », « DGFiP »). */
  producer?: string;
  /** Le jeu de données précis (« Recensement de la population 2022 », « Base GASPAR »). */
  dataset?: string;
  /** Qui la diffuse, ou le service que futur•e interroge (« Géorisques », « ADEME »). */
  distributor?: string;
  /** Une référence pertinente (page de distribution, fichier). */
  sourceUrl?: string;
  /** L'édition officielle du jeu ou de sa distribution, telle qu'établie (« Carte d'exposition 2026 »). */
  version?: string;
  /** Ce que la donnée mesure : « 2022 », « 2022-2025 », ou un jour AAAA-MM-JJ (un diagnostic). */
  period?: string;
  /** Publication par le producteur : AAAA, AAAA-MM ou AAAA-MM-JJ. */
  publishedAt?: string;
  /** Lecture effective d'une source vivante par futur•e (ISO). Volatile : hors des empreintes. */
  consultedAt?: string;
  /** Entrée du fichier dans futur•e (AAAA-MM-JJ ou ISO). Technique : hors des empreintes. */
  loadedAt?: string;
  nature?: ProvenanceNature;
  /** Seul `provisoire` se dit à l'écran ; `definitif` documente. Absent = inconnu. */
  status?: "definitif" | "provisoire";
  /**
   * LE REPLI GÉOGRAPHIQUE : la maille réellement utilisée quand elle est plus large que celle de la
   * preuve (« l'intercommunalité » pour un prix communal faute de ventes). Absent = mesurée à son grain.
   */
  fallback?: { grain: string };
  /** La limite qui empêche une mauvaise lecture, quand elle tient à la source elle-même. */
  limits?: string;
};

/** Les champs qui changent à chaque lecture sans changer le sens : jamais dans une empreinte. */
export const CHAMPS_VOLATILS = ["consultedAt", "loadedAt"] as const;

export function sansChampsVolatils(p: Provenance): Provenance {
  const { consultedAt: _c, loadedAt: _l, ...reste } = p;
  void _c; void _l;
  return reste;
}

/**
 * Construit une provenance sans clé `undefined` : les empreintes (`stableStringify`) refusent
 * `undefined`, et une clé présente à vide se lirait comme une information.
 */
export function provenance(p: { [K in keyof Provenance]?: Provenance[K] | null }): Provenance {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(p)) {
    if (v === undefined || v === null || v === "") continue;
    out[k] = v;
  }
  return out as Provenance;
}

// ── Rendu ────────────────────────────────────────────────────────────────────────────────────

const MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];

type DateLue = { annee: string; mois?: number; jour?: number };

/** AAAA, AAAA-MM, AAAA-MM-JJ ou ISO complet. Rien d'autre ne se lit comme une date. */
export function lireDate(s: string | undefined | null): DateLue | null {
  if (!s) return null;
  const m = /^(\d{4})(?:-(\d{2})(?:-(\d{2}))?)?(?:T.*)?$/.exec(s.trim());
  if (!m) return null;
  const mois = m[2] ? Number(m[2]) : undefined;
  const jour = m[3] ? Number(m[3]) : undefined;
  if (mois !== undefined && (mois < 1 || mois > 12)) return null;
  if (jour !== undefined && (jour < 1 || jour > 31)) return null;
  return { annee: m[1]!, ...(mois ? { mois } : {}), ...(jour ? { jour } : {}) };
}

/**
 * « le 4 novembre 2026 », « en novembre 2026 », « en 2026 ». La date ISO complète est lue dans le
 * fuseau de Paris (une consultation à 23 h 30 UTC le 3 est une consultation du 4 pour le lecteur).
 */
export function dateEnClair(s: string | undefined | null): string | null {
  if (!s) return null;
  if (/T\d{2}:\d{2}/.test(s)) {
    const d = new Date(s);
    if (Number.isNaN(d.getTime())) return null;
    const parts = new Intl.DateTimeFormat("fr-FR", { timeZone: "Europe/Paris", year: "numeric", month: "2-digit", day: "2-digit" })
      .formatToParts(d);
    const v = (t: string) => parts.find((x) => x.type === t)?.value ?? "";
    return dateEnClair(`${v("year")}-${v("month")}-${v("day")}`);
  }
  const d = lireDate(s);
  if (!d) return null;
  if (d.jour && d.mois) return `le ${d.jour === 1 ? "1er" : d.jour} ${MOIS[d.mois - 1]} ${d.annee}`;
  if (d.mois) return `en ${MOIS[d.mois - 1]} ${d.annee}`;
  return `en ${d.annee}`;
}

/** « en 2022 », « de 2022 à 2025 », « le 12 mars 2023 ». `null` si la période n'est pas lisible. */
export function periodeEnClair(period: string | undefined): string | null {
  if (!period) return null;
  const intervalle = /^(\d{4})\s*[-–→]\s*(\d{4})$/.exec(period.trim());
  if (intervalle) return intervalle[1] === intervalle[2] ? `en ${intervalle[1]}` : `de ${intervalle[1]} à ${intervalle[2]}`;
  return dateEnClair(period.trim());
}

/** La ligne de source : « Insee · Recensement de la population 2022, via ADEME ». */
export function sourceEnClair(p: Provenance): string | null {
  const tete = [p.producer, p.dataset].filter(Boolean).join(" · ");
  if (!tete) return p.distributor ? `Via ${p.distributor}` : null;
  return p.distributor ? `${tete}, via ${p.distributor}` : tete;
}

const VERBE_DE_LA_PERIODE: Record<ProvenanceNature | "inconnue", (quand: string) => string> = {
  observation: (q) => `Données observées ${q}`,
  derive: (q) => `Calculé sur des données ${q.replace(/^en /, "de ").replace(/^le /, "du ")}`,
  estimation: (q) => `Estimation sur des données ${q.replace(/^en /, "de ").replace(/^le /, "du ")}`,
  projection: (q) => `Projection, période de référence ${q.replace(/^en /, "").replace(/^de (\d{4}) à (\d{4})$/, "$1-$2")}`,
  reglementaire: (q) => `Données ${q.replace(/^en /, "de ").replace(/^le /, "du ")}`,
  inconnue: (q) => `Données ${q.replace(/^en /, "de ").replace(/^le /, "du ")}`,
};

const MAJ = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/**
 * LA FRAÎCHEUR, en une ligne sobre : nature, période mesurée, édition, publication, statut, repli,
 * chargement, consultation. Chaque morceau vient de SON champ ; un champ absent ne produit rien.
 * `null` quand rien n'est connu : l'écran ne dit alors rien plutôt que « date inconnue » sur chaque
 * preuve.
 */
export function fraicheurEnClair(p: Provenance): string | null {
  const parts: string[] = [];
  const quand = periodeEnClair(p.period);
  if (quand) parts.push(VERBE_DE_LA_PERIODE[p.nature ?? "inconnue"](quand));
  else if (p.nature === "estimation") parts.push("Estimation");
  else if (p.nature === "projection") parts.push("Projection");
  if (p.version) parts.push(MAJ(p.version));
  const publie = dateEnClair(p.publishedAt);
  if (publie) parts.push(`Publiée ${publie}`);
  if (p.status === "provisoire") parts.push("Provisoire");
  if (p.fallback) parts.push(`Valeur établie à l'échelle de ${p.fallback.grain}`);
  // Le chargement se dit au mois : le jour d'une construction d'artefact n'apprend rien au lecteur.
  const charge = dateEnClair(p.loadedAt ? p.loadedAt.slice(0, 7) : null);
  if (charge) parts.push(`Chargées dans futur•e ${charge}`);
  const consulte = dateEnClair(p.consultedAt);
  if (consulte) parts.push(`Source consultée ${consulte}`);
  return parts.length ? parts.join(" · ") : null;
}

/** Les deux lignes d'une provenance : la source, puis sa fraîcheur. */
export function provenanceEnClair(p: Provenance | null | undefined): { source: string | null; fraicheur: string | null } | null {
  if (!p) return null;
  const source = sourceEnClair(p);
  const fraicheur = fraicheurEnClair(p);
  return source || fraicheur ? { source, fraicheur } : null;
}

/** La même provenance en une seule ligne : « Source : … — … ». */
export function ligneDeProvenance(p: Provenance | null | undefined): string | null {
  const l = provenanceEnClair(p);
  if (!l) return null;
  return [l.source ? `Source : ${l.source}` : null, l.fraicheur].filter(Boolean).join(". ");
}
