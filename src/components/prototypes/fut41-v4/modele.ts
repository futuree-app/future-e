// FUT-41 / FUT-22 · PROTOTYPE V4 DU CENTRE DE DÉCISION · MODÈLE PUR (données fictives).
//
// CE FICHIER N'EST PAS LE MOTEUR. Il porte, sur des fixtures, le CONTRAT PROPOSÉ par la V4 pour la
// revue produit : comparabilité critère par critère (note FUT-22 du 20/10), lecture partagée d'une
// même commune, tri explicable, simulation « Et si… ? » et « Faire le point ». Aucune de ces règles
// n'existe dans `src/lib/decision/` : le prototype les rend visibles pour qu'on les arbitre, il ne
// prouve pas qu'elles sont implémentées. `comparaison-candidats.ts` reste non rendable (FUT-22).
//
// Les formes de données suivent les contrats réels là où ils existent (`CriterionOutcome`,
// `DecisionArtifactV1.projectSnapshot`, `generatedAt`, `engineVersion`, `conventionsVersion`,
// `scope`) et ajoutent, en le disant, ce que la note FUT-22 propose de figer (`CadreDuCritere` :
// grain, sources et millésimes par critère).
//
// Invariants tenus ici et testés (`modele.test.ts`) :
//   - aucun score, aucun total, aucun gagnant : aucune fonction ne rend « le meilleur » ;
//   - une condition sans compromis non tenue n'est jamais compensée, ni remontée par un tri ;
//   - une information déclarée (annonce) n'est jamais une conclusion de futur•e ;
//   - deux analyses produites sous deux cadres ne se disent jamais « en commun », même à issue égale ;
//   - deux adresses d'une même commune n'ont qu'UNE lecture de la commune : elle ne départage rien ;
//   - une simulation ne modifie jamais le Projet ; elle dit ce qui POURRAIT changer.

// ── Vocabulaire ──────────────────────────────────────────────────────────────────────────────

export type Grain = "commune" | "secteur" | "batiment";
/** `CriterionOutcome` de production, plus `non_examine` (coverage `unexamined`). */
export type Issue = "favorable" | "reserve" | "mismatch" | "incompatible" | "to_confirm" | "indeterminate" | "non_examine";
export type CleCritere = "mer" | "gare" | "nuits" | "calme" | "medecin" | "quartier";
export type Intention = "location" | "achat";

export type CritereProjet = {
  cle: CleCritere;
  nature: "sans_compromis" | "priorite";
  /** Le poids d'une priorité (1 compte un peu, 3 compte beaucoup). Sans effet sur l'empreinte (cf. `empreinte`). */
  poids?: 1 | 2 | 3;
  /** La valeur canonique quand le critère en a une (`valeurDecisionnelle`) : km, minutes. */
  valeur?: number;
};

export type Projet = {
  revision: number;
  /** Date de la révision, ISO (jour). */
  date: string;
  /** L'intention déclarée. Jamais déduite d'une annonce, et une annonce ne la change jamais. */
  intention: Intention;
  criteres: CritereProjet[];
  /** Ce que la personne a déclaré pouvoir payer. futur•e ne le mesure pas : il ne sert qu'aux montants déclarés. */
  budget: { montant: number; periodicite: "mois" | "total" } | null;
};

export type Source = { id: string; nom: string; millesime: string };

export type LigneRegistre = {
  cle: CleCritere;
  issue: Issue;
  /** Grain auquel l'issue a été établie (proposé : `CadreDuCritere.grain`). Absent si non examiné. */
  grain: Grain | null;
  /** Une mesure figée par l'analyse, quand elle existe (le trajet mesuré, la distance). */
  mesure?: { valeur: number; unite: string };
  /** Le constat tel que le dossier le dit, et sa preuve. Absent : établi sans constat détaillé. */
  constat?: string;
  preuve?: { source: string; date: string };
  /** Sources lues pour ce critère et leur millésime (proposé : `CadreDuCritere.sources`). */
  sources: Source[];
};

/** Une analyse figée : la forme d'un `decision_artifact` servi, réduite à ce que la V4 lit. */
export type Analyse = {
  id: string;
  version: number;
  generatedAt: string;
  engineVersion: string;
  conventionsVersion: string;
  perimetre: "commune" | "commune+adresse";
  /** `projectSnapshot` : les critères tels qu'ils étaient lors de l'analyse. */
  projet: Pick<Projet, "revision" | "date" | "criteres">;
  conclusion: { etiquette: string; ton: "positif" | "reserve" | "critique"; phrase: string };
  registre: LigneRegistre[];
  /** Vrai pour une analyse que le prototype fait apparaître sur un geste (aucune génération réelle). */
  simulee?: boolean;
};

export type Statut = "a_etudier" | "a_visiter" | "visite" | "ecarte";
/** La nature de l'annonce, déclarée ou non précisée. Indépendante de `Projet.intention`. */
export type NatureAnnonce = "location" | "vente" | null;

export type Annonce = {
  url: string | null;
  site: string | null;
  nature: NatureAnnonce;
  /** Loyer mensuel charges comprises (location) ou prix (vente), DÉCLARÉ par l'annonce. */
  montant: number | null;
  surface: number | null;
  pieces: number | null;
};

export type NatureObservation = "observation" | "declaration" | "document";

export type Observation = {
  id: string;
  date: string;
  nature: NatureObservation;
  texte: string;
  cle?: CleCritere;
};

export type MomentVerification = "avant_visite" | "sur_place" | "avant_engagement";

export type Verification = {
  id: string;
  cle: CleCritere;
  moment: MomentVerification;
  question: string;
  /** Pourquoi cette question compte pour CE Projet (l'inconnue qu'elle vise). */
  pourquoi: string;
  reponses: { valeur: string; libelle: string; effet: string; reste: string }[];
  reponse?: { valeur: string; date: string; nature: NatureObservation };
};

export type ContexteDecision = {
  revision: number;
  /** Le libellé de la condition invoquée, avec la valeur d'alors (« une gare à moins de 30 min »). */
  condition?: string;
  cle?: CleCritere;
  valeur?: number;
};

export type Evenement = {
  date: string;
  type: "ajoute" | "statut" | "ecarte" | "reactive" | "analyse" | "observation" | "verification";
  texte: string;
  raison?: string;
  contexte?: ContexteDecision;
};

export type Lieu = {
  id: string;
  libelle: string;
  commune: { insee: string; nom: string };
  adresse: string | null;
  annonce: Annonce | null;
  statut: Statut;
  ajouteLe: string;
  visiteLe: string | null;
  /** Versions d'analyse servies, de la plus ancienne à la plus récente. */
  analyses: Analyse[];
  /** Le droit déjà acquis sur ce lieu (n'ouvre rien d'autre que lui-même). */
  droit: "aucun" | "territoire" | "adresse";
  journal: Evenement[];
  observations: Observation[];
  verifications: Verification[];
};

// ── Libellés ─────────────────────────────────────────────────────────────────────────────────

export const NOM_CRITERE: Record<CleCritere, string> = {
  mer: "La mer",
  gare: "La gare",
  nuits: "Des nuits fraîches l'été",
  calme: "Le calme",
  medecin: "Un médecin disponible",
  quartier: "Une vie de quartier",
};

/** Le libellé instancié, avec la valeur du Projet considéré (jamais celle d'aujourd'hui pour le passé). */
export function libelleCritere(c: Pick<CritereProjet, "cle" | "valeur">): string {
  switch (c.cle) {
    case "mer": return `La mer à moins de ${c.valeur ?? 15} km`;
    case "gare": return `Une gare à moins de ${c.valeur ?? 20} min`;
    default: return NOM_CRITERE[c.cle];
  }
}

export const LIBELLE_ISSUE: Record<Issue, string> = {
  favorable: "Correspond",
  reserve: "Compromis",
  mismatch: "Répond moins bien",
  incompatible: "Ne tient pas",
  to_confirm: "À vérifier",
  indeterminate: "Non établi",
  non_examine: "Non examiné",
};

/** La teinte de registre d'une issue (jetons de la charte, jamais une couleur en dur). */
export const TEINTE_ISSUE: Record<Issue, string> = {
  favorable: "var(--reg-alignement)",
  reserve: "var(--reg-compromis)",
  mismatch: "var(--reg-ecart)",
  incompatible: "var(--reg-incompatibilite)",
  to_confirm: "var(--reg-controle)",
  indeterminate: "var(--reg-non-su)",
  non_examine: "var(--reg-non-su)",
};

export const GRAIN_LIBELLE: Record<Grain, string> = { commune: "à la commune", secteur: "aux abords", batiment: "dans le logement" };

export const LIBELLE_STATUT: Record<Statut, string> = {
  a_etudier: "À étudier", a_visiter: "À visiter", visite: "Visité", ecarte: "Écarté",
};

export const LIBELLE_NATURE: Record<Exclude<NatureAnnonce, null> | "non_precise", string> = {
  location: "à louer", vente: "à vendre", non_precise: "nature non précisée",
};

const MOIS = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];
/** « 9 oct. » : la date courte du Relevé. Déterministe, sans fuseau (les dates fictives sont des jours). */
export function dateCourte(iso: string): string {
  const [, m, j] = iso.slice(0, 10).split("-").map(Number);
  return `${j} ${MOIS[(m ?? 1) - 1]}`;
}

export function montantFr(n: number): string {
  return `${String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, "\u00a0")} €`;
}

/** « 980 € par mois » ou « 210 000 € » : un montant toujours accompagné de sa nature. */
export function montantAnnonce(a: Annonce | null): string | null {
  if (!a || a.montant == null) return null;
  return a.nature === "location" ? `${montantFr(a.montant)} par mois` : montantFr(a.montant);
}

// ── Lecture d'un lieu ────────────────────────────────────────────────────────────────────────

export function analyseServie(l: Lieu): Analyse | null {
  return l.analyses.length ? l.analyses[l.analyses.length - 1]! : null;
}

export function ligneDe(l: Lieu, cle: CleCritere): LigneRegistre | null {
  return analyseServie(l)?.registre.find((r) => r.cle === cle) ?? null;
}

export type Connaissance = "enregistre" | "commune_analysee" | "analyse";

/** Ce que futur•e sait réellement du lieu : rien (enregistré), la commune, ou les trois échelles. */
export function connaissance(l: Lieu): Connaissance {
  const a = analyseServie(l);
  if (!a) return "enregistre";
  return a.perimetre === "commune" ? "commune_analysee" : "analyse";
}

export function libelleConnaissance(l: Lieu): string {
  const k = connaissance(l);
  if (k === "analyse") return "Commune, abords et logement analysés";
  if (k === "commune_analysee") return l.adresse ? "Commune analysée · adresse pas encore analysée" : "Commune analysée · adresse inconnue";
  return l.adresse ? "Enregistré · rien n'est encore analysé" : "Annonce enregistrée · adresse inconnue";
}

/** L'état de l'emblème : quelles échelles l'analyse servie a parcourues. */
export function etatsEmbleme(l: Lieu): { commune: "constats" | "examinee" | "non_examinee"; secteur: "constats" | "examinee" | "non_examinee"; batiment: "constats" | "examinee" | "non_examinee" } {
  const a = analyseServie(l);
  const etat = (g: Grain) => {
    if (!a) return "non_examinee" as const;
    if (g !== "commune" && a.perimetre === "commune") return "non_examinee" as const;
    return a.registre.some((r) => r.grain === g && r.constat) ? "constats" as const : "examinee" as const;
  };
  return { commune: etat("commune"), secteur: etat("secteur"), batiment: etat("batiment") };
}

const INCONNUE = new Set<Issue>(["to_confirm", "indeterminate", "non_examine"]);
export const estEtabli = (r: LigneRegistre | null): r is LigneRegistre => !!r && !INCONNUE.has(r.issue);

// ── Empreinte d'un critère et cadre ──────────────────────────────────────────────────────────

/**
 * L'EMPREINTE D'UN CRITÈRE : ce que le moteur lit du Projet pour CE critère (nature et valeur).
 * Le poids n'y entre pas dans la V4 : il règle l'ordre d'affichage, et aucune règle fictive ne le
 * consomme. En production, la liste des paramètres lus doit venir du moteur, règle par règle (note
 * FUT-22 § 4, réserve des règles croisées) ; jamais de l'interface.
 */
export function empreinte(c: CritereProjet | undefined): string {
  return c ? `${c.nature}|${c.valeur ?? ""}` : "absent";
}

const critereDe = (p: Pick<Projet, "criteres">, cle: CleCritere) => p.criteres.find((c) => c.cle === cle);

/** Règles touchées entre deux moteurs (table proposée par la note FUT-22, composante 4). Fictive ici. */
export const REGLES_TOUCHEES: Record<string, CleCritere[]> = {
  "engine-5>engine-6": ["nuits"],
};

function reglesTouchees(e1: string, e2: string): CleCritere[] | "toutes" {
  if (e1 === e2) return [];
  return REGLES_TOUCHEES[`${e1}>${e2}`] ?? REGLES_TOUCHEES[`${e2}>${e1}`] ?? "toutes";
}

/** L'analyse répond-elle encore au Projet courant, pour ce critère ? (péremption PAR critère) */
export function critereAJour(a: Analyse, cle: CleCritere, projet: Projet): boolean {
  return empreinte(critereDe(a.projet, cle)) === empreinte(critereDe(projet, cle));
}

/** Les critères dont l'empreinte a changé depuis l'analyse, avec la valeur d'alors et d'aujourd'hui. */
export function criteresDepasses(a: Analyse, projet: Projet): { cle: CleCritere; avant: string; apres: string }[] {
  return projet.criteres
    .filter((c) => !critereAJour(a, c.cle, projet))
    .map((c) => {
      const avant = critereDe(a.projet, c.cle);
      return { cle: c.cle, avant: avant ? libelleCritere(avant) : "absent de votre Projet d'alors", apres: libelleCritere(c) };
    });
}

// ── Comparer deux lieux sur un critère ───────────────────────────────────────────────────────

export type EtatComparaison =
  | "meme_lecture"
  | "difference_demontree"
  | "difference_possible"
  | "a_verifier"
  | "non_comparable"
  | "indisponible";

export const LIBELLE_ETAT: Record<EtatComparaison, string> = {
  meme_lecture: "Même lecture",
  difference_demontree: "Différence démontrée",
  difference_possible: "Différence possible",
  a_verifier: "À vérifier des deux côtés",
  non_comparable: "Ne se compare pas",
  indisponible: "Information indisponible",
};

export type Motif = {
  type: "sans_analyse" | "non_etabli" | "lecture_partagee" | "projet" | "moteur" | "millesime" | "grain";
  texte: string;
};

export type ComparaisonCritere = {
  cle: CleCritere;
  etat: EtatComparaison;
  motifs: Motif[];
  a: LigneRegistre | null;
  b: LigneRegistre | null;
  /** Les deux lieux comparés, dans l'ordre de la paire. */
  ida: string;
  idb: string;
};

/**
 * LA RÈGLE CRITÈRE PAR CRITÈRE (note FUT-22 § 3, plus la lecture partagée). L'ordre des tests est le
 * contrat : l'absence d'analyse, puis la lecture partagée, puis l'établissement, puis le cadre. La
 * fonction dit TOUJOURS pourquoi elle rapproche ou refuse de rapprocher : `motifs` n'est vide que
 * pour une même lecture ou une différence démontrée dans le même cadre.
 */
export function comparerCritere(cle: CleCritere, a: Lieu, b: Lieu): ComparaisonCritere {
  const aa = analyseServie(a);
  const ab = analyseServie(b);
  const la = ligneDe(a, cle);
  const lb = ligneDe(b, cle);
  const base = { cle, a: la, b: lb, ida: a.id, idb: b.id };

  // 1. Pas d'analyse : ce que déclare une annonce n'est jamais une conclusion.
  const sans = [!aa ? a : null, !ab ? b : null].filter(Boolean) as Lieu[];
  if (sans.length) {
    return { ...base, etat: "indisponible", motifs: sans.map((l) => ({
      type: "sans_analyse" as const,
      texte: `${l.libelle} n'est pas analysé : ce que dit son annonce n'est pas une conclusion de futur•e.`,
    })) };
  }

  // 2. Une adresse non analysée face à une adresse analysée, sur un critère établi aux abords ou au logement.
  const absentA = !la || la.issue === "non_examine";
  const absentB = !lb || lb.issue === "non_examine";
  if (absentA !== absentB) {
    const manque = absentA ? a : b;
    return { ...base, etat: "indisponible", motifs: [{
      type: "grain",
      texte: `Un seul est examiné ici : ${manque.libelle} n'a été lu qu'à l'échelle de sa commune.`,
    }] };
  }

  // 3. Même commune, établi à la commune des deux côtés, sur les mêmes sources : UNE seule lecture.
  if (la && lb && la.grain === "commune" && lb.grain === "commune" && a.commune.insee === b.commune.insee
    && memesMillesimes(la, lb)) {
    return { ...base, etat: "non_comparable", motifs: [{
      type: "lecture_partagee",
      texte: `Une seule lecture de ${a.commune.nom}, la même pour les deux : elle ne les départage pas.`,
    }] };
  }

  // 4. Non établi d'un ou des deux côtés : rien à départager, quelque chose à vérifier.
  const ea = estEtabli(la);
  const eb = estEtabli(lb);
  if (!ea && !eb) {
    return { ...base, etat: "a_verifier", motifs: [{ type: "non_etabli", texte: "Ni l'un ni l'autre n'est établi : une vérification pourrait les départager." }] };
  }
  if (!ea || !eb) {
    const ouvert = !ea ? a : b;
    return { ...base, etat: "difference_possible", motifs: [{
      type: "non_etabli",
      texte: `Établi d'un seul côté : l'écart reste possible tant que ${ouvert.libelle} n'est pas vérifié.`,
    }] };
  }

  // 5. Le cadre de CE critère.
  const motifs: Motif[] = [];
  const ca = critereDe(aa!.projet, cle);
  const cb = critereDe(ab!.projet, cle);
  if (empreinte(ca) !== empreinte(cb)) {
    motifs.push({ type: "projet", texte: `Votre condition a changé entre les deux analyses : « ${ca ? libelleCritere(ca) : "absente"} » pour ${a.libelle}, « ${cb ? libelleCritere(cb) : "absente"} » pour ${b.libelle}.` });
  }
  const touchees = reglesTouchees(aa!.engineVersion, ab!.engineVersion);
  if (touchees === "toutes" || touchees.includes(cle)) {
    motifs.push({ type: "moteur", texte: `Les règles de ce critère ont changé entre les deux analyses (${aa!.engineVersion} et ${ab!.engineVersion}).` });
  }
  if (!memesMillesimes(la!, lb!)) {
    motifs.push({ type: "millesime", texte: `Les données lues ne sont pas du même millésime : ${millesimes(la!)} pour ${a.libelle}, ${millesimes(lb!)} pour ${b.libelle}.` });
  }
  if (la!.grain !== lb!.grain) {
    motifs.push({ type: "grain", texte: `Pas établi à la même échelle : ${GRAIN_LIBELLE[la!.grain!]} pour ${a.libelle}, ${GRAIN_LIBELLE[lb!.grain!]} pour ${b.libelle}.` });
  }
  if (motifs.length) return { ...base, etat: "non_comparable", motifs };
  return { ...base, etat: la!.issue === lb!.issue ? "meme_lecture" : "difference_demontree", motifs: [] };
}

function memesMillesimes(a: LigneRegistre, b: LigneRegistre): boolean {
  const mb = new Map(b.sources.map((s) => [s.id, s.millesime]));
  return a.sources.every((s) => !mb.has(s.id) || mb.get(s.id) === s.millesime);
}
const millesimes = (l: LigneRegistre) => l.sources.map((s) => `${s.nom} ${s.millesime}`).join(", ") || "sources non datées";

/** Le résumé « Se compare / Ne se compare pas » d'une paire, par échelle. */
export function perimetreComparable(a: Lieu, b: Lieu, projet: Projet): { seCompare: string[]; neSeComparePas: string[] } {
  const seCompare = new Set<string>();
  const non = new Map<string, string>();
  for (const c of projet.criteres) {
    const r = comparerCritere(c.cle, a, b);
    const g = (r.a?.grain ?? r.b?.grain) as Grain | null;
    const echelle = g ? ({ commune: "la commune", secteur: "les abords", batiment: "le logement" } as const)[g] : "l'annonce";
    if (r.etat === "meme_lecture" || r.etat === "difference_demontree" || r.etat === "difference_possible" || r.etat === "a_verifier") seCompare.add(echelle);
    else if (r.motifs[0]) non.set(`${echelle} · ${NOM_CRITERE[c.cle].toLowerCase()}`, r.motifs[0].type === "lecture_partagee" ? "une seule lecture, la même pour les deux" : minusculeInitiale(r.motifs[0].texte));
  }
  return { seCompare: [...seCompare], neSeComparePas: [...non.entries()].map(([k, v]) => `${k} : ${v}`) };
}

const minusculeInitiale = (t: string) => t.charAt(0).toLowerCase() + t.slice(1);

// ── Ce qui départage, à N ────────────────────────────────────────────────────────────────────

export type ClasseCritere = "departage" | "departage_possible" | "hors_cadre" | "accord" | "sans_reponse" | "indisponible";

export const LIBELLE_CLASSE: Record<ClasseCritere, string> = {
  departage: "Départage",
  departage_possible: "Pourrait départager",
  hors_cadre: "Ne se compare pas encore",
  accord: "En commun",
  sans_reponse: "Sans réponse",
  indisponible: "Pas encore lu",
};

export type LectureCritere = { cle: CleCritere; classe: ClasseCritere; phrase: string; paires: ComparaisonCritere[] };

const listeFr = (xs: string[]) => (xs.length <= 1 ? xs.join("") : `${xs.slice(0, -1).join(", ")} et ${xs[xs.length - 1]}`);

/**
 * CE QUI DÉPARTAGE N LIEUX, critère par critère, dans l'ordre du Projet (jamais trié par importance
 * calculée). Construit sur les paires, sans les additionner : une seule paire démontrée suffit à dire
 * « départage », et la phrase nomme les lieux concernés. Les lieux écartés ne sont pas lus.
 */
export function ceQuiDepartage(lieux: Lieu[], projet: Projet): LectureCritere[] {
  const actifs = lieux.filter((l) => l.statut !== "ecarte");
  return projet.criteres.map((c) => {
    const paires: ComparaisonCritere[] = [];
    const nomsDe = new Map<ComparaisonCritere, [string, string]>();
    for (let i = 0; i < actifs.length; i++) {
      for (let j = i + 1; j < actifs.length; j++) {
        const r = comparerCritere(c.cle, actifs[i]!, actifs[j]!);
        paires.push(r);
        nomsDe.set(r, [actifs[i]!.libelle, actifs[j]!.libelle]);
      }
    }
    const de = (e: EtatComparaison) => paires.filter((p) => p.etat === e);
    const nom = NOM_CRITERE[c.cle];
    const demontrees = de("difference_demontree");
    if (demontrees.length) {
      const p = demontrees[0]!;
      const [na, nb] = nomsDe.get(p)!;
      return { cle: c.cle, classe: "departage" as const, paires, phrase: `${nom} départage ${na} (${LIBELLE_ISSUE[p.a!.issue].toLowerCase()} ${GRAIN_LIBELLE[p.a!.grain!]}) et ${nb} (${LIBELLE_ISSUE[p.b!.issue].toLowerCase()} ${GRAIN_LIBELLE[p.b!.grain!]}).` };
    }
    const possibles = de("difference_possible");
    if (possibles.length) {
      const ouverts = [...new Set(possibles.flatMap((p) => {
        const [na, nb] = nomsDe.get(p)!;
        return [estEtabli(p.a) ? null : na, estEtabli(p.b) ? null : nb].filter(Boolean) as string[];
      }))];
      return { cle: c.cle, classe: "departage_possible" as const, paires, phrase: `${nom} pourrait départager vos lieux : reste à vérifier pour ${listeFr(ouverts)}.` };
    }
    // HORS CADRE, MÊME À ISSUE ÉGALE (note FUT-22, règle 4) : un accord obtenu sous deux cadres n'est
    // pas plus établi qu'un désaccord. Une seule paire hors cadre suffit à refuser « en commun ».
    const hors = de("non_comparable").filter((p) => p.motifs.some((m) => m.type !== "lecture_partagee"));
    if (hors.length) {
      const h = hors.find((p) => p.a?.issue !== p.b?.issue) ?? hors[0]!;
      const [na, nb] = nomsDe.get(h)!;
      const verbe = h.a?.issue === h.b?.issue ? "concluent pareil" : "concluent différemment";
      return { cle: c.cle, classe: "hors_cadre" as const, paires, phrase: `${nom} : ${na} et ${nb} ${verbe}, mais pas dans le même cadre. ${h.motifs[0]!.texte}` };
    }
    if (paires.length && paires.every((p) => p.etat === "indisponible")) {
      return { cle: c.cle, classe: "indisponible" as const, paires, phrase: `${nom} : pas encore lu pour assez de lieux.` };
    }
    if (paires.length && paires.every((p) => p.etat === "a_verifier" || p.etat === "indisponible")) {
      return { cle: c.cle, classe: "sans_reponse" as const, paires, phrase: `${nom} : établi pour aucun de vos lieux.` };
    }
    const partage = paires.some((p) => p.motifs.some((m) => m.type === "lecture_partagee"));
    return { cle: c.cle, classe: "accord" as const, paires, phrase: partage ? `${nom} : une seule lecture de la commune pour les lieux qui la partagent.` : `${nom} : même lecture pour les lieux qui se comparent.` };
  });
}

// ── Conditions sans compromis ────────────────────────────────────────────────────────────────

export type ConditionNonTenue = { lieuId: string; cle: CleCritere; phrase: string; aJour: boolean };

/**
 * LES CONDITIONS SANS COMPROMIS NON TENUES. Jamais compensées, toujours en tête. Une issue obtenue
 * sous une autre valeur de la condition est dite comme telle (« ne tenait pas votre condition
 * d'alors ») ; une mesure figée qui dépasse la valeur actuelle est dite POSSIBLE, jamais conclue.
 */
export function conditionsNonTenues(l: Lieu, projet: Projet): ConditionNonTenue[] {
  const a = analyseServie(l);
  if (!a) return [];
  const out: ConditionNonTenue[] = [];
  for (const c of projet.criteres.filter((x) => x.nature === "sans_compromis")) {
    const r = ligneDe(l, c.cle);
    if (!r) continue;
    const aJour = critereAJour(a, c.cle, projet);
    const alors = critereDe(a.projet, c.cle);
    if (r.issue === "incompatible") {
      out.push({ lieuId: l.id, cle: c.cle, aJour, phrase: aJour
        ? `${l.libelle} ne tient pas votre condition sans compromis : ${libelleCritere(c).toLowerCase()}.`
        : `${l.libelle} ne tenait pas votre condition d'alors (${alors ? libelleCritere(alors).toLowerCase() : "?"}) ; votre Projet a changé depuis.` });
    } else if (!aJour && r.mesure && c.valeur != null && r.mesure.valeur > c.valeur) {
      out.push({ lieuId: l.id, cle: c.cle, aJour, phrase: `${l.libelle} : la mesure de son analyse (${r.mesure.valeur} ${r.mesure.unite}) dépasse votre limite actuelle de ${c.valeur} ${r.mesure.unite}. L'analyse, faite sous ${alors?.valeur ?? "?"} ${r.mesure.unite}, ne le disait pas ; la mettre à jour le confirmerait.` });
    }
  }
  return out;
}

// ── Tri explicable ───────────────────────────────────────────────────────────────────────────

export type DimensionTri = "ajout" | "montant" | "surface" | "trajet" | "maintenant";

export const LIBELLE_DIMENSION: Record<DimensionTri, string> = {
  ajout: "Ordre d'ajout",
  montant: "Loyer ou prix déclaré",
  surface: "Surface déclarée",
  trajet: "Trajet jusqu'à la gare",
  maintenant: "À examiner maintenant",
};

export type GroupeTri = { titre: string; note?: string; lieux: { lieu: Lieu; valeur: string | null; raison?: string }[] };

/**
 * TRIER SUR UNE DIMENSION CHOISIE, JAMAIS SUR UN TOTAL. Chaque dimension dit d'où vient sa valeur
 * (déclarée par l'annonce, ou mesurée par une analyse). Ce qui ne se range pas sur la même échelle
 * reste dans un groupe à part : un loyer ne se range pas avec un prix de vente, un trajet mesuré à la
 * commune ne se range pas avec un trajet mesuré à l'adresse. Une condition sans compromis non tenue
 * n'est jamais remontée par un tri : elle reste signalée à sa place.
 */
export function trier(lieux: Lieu[], dim: DimensionTri, projet: Projet, aujourdhui: string): GroupeTri[] {
  const actifs = lieux.filter((l) => l.statut !== "ecarte");
  if (dim === "ajout") {
    return [{ titre: "Dans l'ordre où vous les avez ajoutés", lieux: [...actifs].sort((x, y) => x.ajouteLe.localeCompare(y.ajouteLe)).map((lieu) => ({ lieu, valeur: dateCourte(lieu.ajouteLe) })) }];
  }
  if (dim === "montant" || dim === "surface") {
    const valeur = (l: Lieu) => (dim === "montant" ? l.annonce?.montant : l.annonce?.surface) ?? null;
    const aff = (l: Lieu) => (dim === "montant" ? montantAnnonce(l.annonce) : l.annonce?.surface != null ? `${l.annonce.surface} m²` : null);
    const groupes: GroupeTri[] = [];
    const parNature: [NatureAnnonce, string][] = [["location", "À louer"], ["vente", "À vendre"], [null, "Nature non précisée"]];
    for (const [n, titre] of parNature) {
      const ls = actifs.filter((l) => (l.annonce?.nature ?? null) === n && valeur(l) != null).sort((x, y) => valeur(x)! - valeur(y)!);
      if (ls.length) groupes.push({ titre, lieux: ls.map((lieu) => ({ lieu, valeur: aff(lieu) })) });
    }
    if (dim === "montant" && groupes.length > 1) groupes[0]!.note = "Un loyer et un prix de vente ne se rangent pas sur la même échelle : chaque nature a son groupe.";
    const sans = actifs.filter((l) => valeur(l) == null);
    if (sans.length) groupes.push({ titre: dim === "montant" ? "Sans montant déclaré" : "Sans surface déclarée", lieux: sans.map((lieu) => ({ lieu, valeur: null })) });
    if (groupes[0] && dim === "montant" && projet.budget) {
      groupes[0].note = [groupes[0].note, `Votre budget déclaré (${montantFr(projet.budget.montant)}${projet.budget.periodicite === "mois" ? " par mois" : ""}) n'entre dans aucune conclusion de futur•e.`].filter(Boolean).join(" ");
    }
    return groupes;
  }
  if (dim === "trajet") {
    const mesure = (l: Lieu) => {
      const r = ligneDe(l, "gare");
      return r?.mesure && r.grain === "secteur" ? r.mesure.valeur : null;
    };
    const ranges = actifs.filter((l) => mesure(l) != null).sort((x, y) => mesure(x)! - mesure(y)!);
    const autres = actifs.filter((l) => mesure(l) == null);
    const groupes: GroupeTri[] = [{
      titre: "Mesuré depuis l'adresse par leur analyse",
      note: "Trajet à pied ou à vélo vers la gare la plus proche, mesuré par chaque analyse. L'ordre ne dit pas si votre condition est tenue : la ligne le dit.",
      lieux: ranges.map((lieu) => {
        const nt = conditionsNonTenues(lieu, projet).find((x) => x.cle === "gare");
        return { lieu, valeur: `${mesure(lieu)} min`, raison: nt ? nt.phrase : undefined };
      }),
    }];
    if (autres.length) groupes.push({ titre: "Pas mesuré à l'adresse", lieux: autres.map((lieu) => ({ lieu, valeur: null, raison: connaissance(lieu) === "enregistre" ? "Aucune analyse : l'annonce ne dit rien du trajet que futur•e puisse retenir." : "Lu à l'échelle de la commune seulement." })) });
    return groupes;
  }
  return examinerMaintenant(lieux, projet, aujourdhui);
}

/**
 * « À EXAMINER MAINTENANT » : des RÈGLES dans un ordre fixe, pas un score. Chaque lieu reçoit au plus
 * une raison, la première règle qui le concerne ; l'écran affiche la règle. Un lieu qui ne tient pas
 * une condition sans compromis va dans le dernier groupe, quelle que soit la richesse de ses points
 * favorables.
 */
export function examinerMaintenant(lieux: Lieu[], projet: Projet, aujourdhui: string): GroupeTri[] {
  const actifs = lieux.filter((l) => l.statut !== "ecarte");
  const deja = new Set<string>();
  const groupes: GroupeTri[] = [];
  const regle = (titre: string, test: (l: Lieu) => string | null) => {
    const ls = actifs.filter((l) => !deja.has(l.id)).map((l) => ({ l, r: test(l) })).filter((x) => x.r);
    ls.forEach((x) => deja.add(x.l.id));
    if (ls.length) groupes.push({ titre, lieux: ls.map((x) => ({ lieu: x.l, valeur: null, raison: x.r! })) });
  };
  regle("Ne tient pas une condition sans compromis", (l) => conditionsNonTenues(l, projet).find((c) => c.aJour)?.phrase ?? null);
  // Ce groupe est calculé en premier pour être EXCLU des suivants, puis déplacé en fin de liste.
  const bloques = groupes.splice(0, groupes.length);
  regle("Une visite approche", (l) => {
    if (!l.visiteLe || l.visiteLe < aujourdhui) return null;
    const n = l.verifications.filter((v) => v.moment === "sur_place" && !v.reponse).length;
    return `Visite le ${dateCourte(l.visiteLe)}${n ? ` : ${n} point${n > 1 ? "s" : ""} à vérifier sur place` : ""}.`;
  });
  regle("Une vérification pourrait le départager", (l) => {
    const v = l.verifications.find((x) => !x.reponse && (ligneDe(l, x.cle)?.issue === "to_confirm" || ligneDe(l, x.cle)?.issue === "indeterminate"));
    return v ? `${NOM_CRITERE[v.cle]} reste à vérifier : « ${v.question} »` : null;
  });
  regle("Son analyse répond à une ancienne version de votre Projet", (l) => {
    const a = analyseServie(l);
    const d = a ? criteresDepasses(a, projet) : [];
    return d.length ? d.map((x) => `Analysé sous « ${x.avant.toLowerCase()} » ; votre Projet dit aujourd'hui « ${x.apres.toLowerCase()} ».`).join(" ") : null;
  });
  regle("Il manque de quoi aller plus loin", (l) => (connaissance(l) === "enregistre" ? (l.adresse ? "Adresse connue, rien n'est encore analysé." : "L'adresse exacte manque pour lire les abords et le logement.") : connaissance(l) === "commune_analysee" ? "Seule la commune est lue : les abords et le logement ne le sont pas." : null));
  regle("Rien d'urgent", () => "Aucune règle ne le signale aujourd'hui.");
  return [...groupes, ...bloques];
}

// ── Et si… ? ─────────────────────────────────────────────────────────────────────────────────

export type ModificationProjet =
  | { type: "valeur"; cle: CleCritere; valeur: number }
  | { type: "nature"; cle: CleCritere; nature: "sans_compromis" | "priorite" }
  | { type: "budget"; montant: number };

export type EffetSimule = {
  lieuId: string;
  cle: CleCritere | "budget";
  /** `pourrait_changer` : une mesure figée le laisse penser ; `a_mettre_a_jour` : seule une analyse le dirait. */
  certitude: "pourrait_changer" | "a_mettre_a_jour" | "raison_a_revoir" | "information";
  phrase: string;
};

export function appliquer(projet: Projet, m: ModificationProjet): Projet {
  if (m.type === "budget") return { ...projet, budget: projet.budget ? { ...projet.budget, montant: m.montant } : { montant: m.montant, periodicite: projet.intention === "location" ? "mois" : "total" } };
  return { ...projet, criteres: projet.criteres.map((c) => (c.cle !== m.cle ? c : m.type === "valeur" ? { ...c, valeur: m.valeur } : { ...c, nature: m.nature })) };
}

/**
 * SIMULER SANS MODIFIER. Rend le Projet simulé et ce qui pourrait changer, lieu par lieu, avec le
 * degré de certitude de chaque phrase. Ne rend jamais une nouvelle issue comme acquise : seule une
 * analyse mise à jour l'établirait (geste explicite, gratuit pour un dossier déjà acquis, FUT-122).
 */
export function simuler(lieux: Lieu[], projet: Projet, m: ModificationProjet): { projet: Projet; effets: EffetSimule[] } {
  const p2 = appliquer(projet, m);
  const effets: EffetSimule[] = [];
  if (m.type === "budget") {
    for (const l of lieux.filter((x) => x.statut !== "ecarte" && x.annonce?.montant != null)) {
      const memeNature = (l.annonce!.nature === "location") === (projet.intention === "location") || l.annonce!.nature == null;
      if (!memeNature) continue;
      const avant = projet.budget ? l.annonce!.montant! <= projet.budget.montant : true;
      const apres = l.annonce!.montant! <= m.montant;
      if (avant !== apres) effets.push({ lieuId: l.id, cle: "budget", certitude: "information", phrase: `${l.libelle} (${montantAnnonce(l.annonce)}, déclaré) passerait ${apres ? "sous" : "au-dessus de"} votre budget. futur•e ne le mesure pas : aucune conclusion ne change.` });
    }
    return { projet: p2, effets };
  }
  const cle = m.cle;
  for (const l of lieux) {
    const r = ligneDe(l, cle);
    const c2 = critereDe(p2, cle)!;
    if (l.statut === "ecarte") {
      const e = [...l.journal].reverse().find((x) => x.type === "ecarte");
      if (e?.contexte?.cle === cle && e.contexte.valeur != null && m.type === "valeur" && r?.mesure && r.mesure.valeur <= m.valeur) {
        effets.push({ lieuId: l.id, cle, certitude: "raison_a_revoir", phrase: `${l.libelle} a été écarté le ${dateCourte(e.date)} pour « ${e.raison} », quand votre limite était ${e.contexte.valeur} min. Mesuré à ${r.mesure.valeur} min, il tiendrait votre nouvelle limite : vous pourriez le réactiver.` });
      }
      continue;
    }
    if (!r) continue;
    if (m.type === "valeur" && r.mesure) {
      // « Tenait » se lit sous le Projet ACTUEL : une analyse faite sous une autre valeur de cette
      // condition ne dit pas si elle tient aujourd'hui ; sa mesure, si.
      const a = analyseServie(l)!;
      const c1 = critereDe(projet, cle);
      const tenait = critereAJour(a, cle, projet) || c1?.valeur == null
        ? r.issue !== "incompatible" && r.issue !== "mismatch"
        : r.mesure.valeur <= c1.valeur;
      const tiendrait = r.mesure.valeur <= m.valeur;
      if (tenait !== tiendrait) {
        effets.push({ lieuId: l.id, cle, certitude: "pourrait_changer", phrase: `${l.libelle} : mesuré à ${r.mesure.valeur} ${r.mesure.unite}, il ${tiendrait ? "pourrait tenir" : "pourrait ne plus tenir"} « ${libelleCritere(c2).toLowerCase()} ». La mise à jour de son analyse le dirait.` });
      }
    } else if (m.type === "nature" && m.nature === "sans_compromis" && (r.issue === "reserve" || r.issue === "mismatch")) {
      // Un compromis peut devenir une condition non tenue : seul le moteur le dirait.
      effets.push({ lieuId: l.id, cle, certitude: "a_mettre_a_jour", phrase: `${l.libelle} : ${NOM_CRITERE[cle].toLowerCase()} y est un compromis ; sans compromis, il pourrait ne plus tenir. Seule une analyse mise à jour le dirait.` });
    } else if (m.type === "nature" && m.nature === "priorite" && r.issue === "incompatible") {
      effets.push({ lieuId: l.id, cle, certitude: "a_mettre_a_jour", phrase: `${l.libelle} : cette condition n'y tient pas ; redevenue une priorité, elle deviendrait un compromis à peser. Seule une analyse mise à jour le dirait.` });
    } else if (m.type === "valeur" && r.issue !== "non_examine" && r.issue !== "indeterminate") {
      effets.push({ lieuId: l.id, cle, certitude: "a_mettre_a_jour", phrase: `${l.libelle} : aucune mesure figée ne permet de le prévoir ; seule une analyse mise à jour le dirait.` });
    }
  }
  return { projet: p2, effets };
}

// ── Faire le point ───────────────────────────────────────────────────────────────────────────

export type Point = {
  situation: string;
  rangee: { lieu: Lieu; etat: string }[];
  hesitations: string[];
  actions: { texte: string; sous: string; lieuId: string }[];
  nonMesure: string[];
  provenance: string;
};

/**
 * FAIRE LE POINT, RECALCULÉ À CHAQUE OUVERTURE (note de validité X9) : aucune mise en cache, aucune
 * IA. Quatre blocs, chacun nourri par les fonctions ci-dessus : le point ne dit rien que la fiche
 * ou la comparaison ne disent déjà.
 */
export function faireLePoint(lieux: Lieu[], projet: Projet, aujourdhui: string): Point {
  const actifs = lieux.filter((l) => l.statut !== "ecarte");
  const ecartes = lieux.filter((l) => l.statut === "ecarte");
  const analyses = actifs.filter((l) => connaissance(l) !== "enregistre");
  const nombre = ["Aucun", "Un", "Deux", "Trois", "Quatre", "Cinq", "Six", "Sept", "Huit"][actifs.length] ?? String(actifs.length);
  const situation = `${nombre} logement${actifs.length > 1 ? "s" : ""} en course, dont ${analyses.length} analysé${analyses.length > 1 ? "s" : ""}${ecartes.length ? ` ; ${ecartes.length} écarté${ecartes.length > 1 ? "s" : ""}` : ""}.`;

  const hesitations: string[] = [];
  for (const l of actifs) for (const c of conditionsNonTenues(l, projet)) hesitations.push(c.phrase);
  for (const lc of ceQuiDepartage(actifs, projet)) if (lc.classe === "departage" || lc.classe === "departage_possible" || lc.classe === "hors_cadre") hesitations.push(lc.phrase);
  for (const l of ecartes) {
    const e = [...l.journal].reverse().find((x) => x.type === "ecarte");
    const c = e?.contexte?.cle ? critereDe(projet, e.contexte.cle) : undefined;
    if (e?.contexte?.cle && c && c.valeur !== e.contexte.valeur) {
      hesitations.push(`${l.libelle} a été écarté pour « ${e.raison} », quand votre condition était « ${e.contexte.condition} » ; elle est aujourd'hui « ${libelleCritere(c).toLowerCase()} ».`);
    }
  }

  const actions = examinerMaintenant(lieux, projet, aujourdhui)
    .filter((g) => g.titre !== "Rien d'urgent" && g.titre !== "Ne tient pas une condition sans compromis")
    .flatMap((g) => g.lieux.map((x) => ({ texte: x.raison!, sous: `${g.titre} · ${x.lieu.libelle}`, lieuId: x.lieu.id })))
    .slice(0, 4);

  const nonMesure = [
    projet.budget ? `Votre budget de ${montantFr(projet.budget.montant)}${projet.budget.periodicite === "mois" ? " par mois" : ""} : les montants viennent des annonces, futur•e ne les vérifie pas.` : null,
    "Vos notes de visite : elles restent les vôtres et ne modifient aucune preuve publique.",
    actifs.some((l) => l.annonce && l.annonce.nature && (l.annonce.nature === "location") !== (projet.intention === "location"))
      ? `Votre Projet est ${projet.intention === "location" ? "une location" : "un achat"} ; une annonce dit le contraire. futur•e n'en déduit rien : à vous de dire si elle reste en course.`
      : null,
  ].filter(Boolean) as string[];

  const dates = analyses.map((l) => analyseServie(l)!.generatedAt).sort();
  const notes = lieux.reduce((n, l) => n + l.observations.length, 0);
  const provenance = `Établi le ${dateCourte(aujourdhui)} à partir de ${analyses.length} analyse${analyses.length > 1 ? "s" : ""}${dates.length ? ` (du ${dateCourte(dates[0]!)} au ${dateCourte(dates[dates.length - 1]!)})` : ""} et de ${notes} note${notes > 1 ? "s" : ""} · votre Projet du ${dateCourte(projet.date)} · aucun texte rédigé par une IA`;

  return {
    situation,
    rangee: lieux.map((lieu) => ({ lieu, etat: lieu.statut === "ecarte" ? `écarté le ${dateCourte([...lieu.journal].reverse().find((e) => e.type === "ecarte")?.date ?? lieu.ajouteLe)}` : libelleConnaissance(lieu) })),
    hesitations,
    actions,
    nonMesure,
    provenance,
  };
}

// ── Ajout assisté d'une annonce ──────────────────────────────────────────────────────────────

export type ExtraitAnnonce = {
  montant?: { valeur: number; extrait: string };
  nature?: { valeur: Exclude<NatureAnnonce, null>; extrait: string };
  surface?: { valeur: number; extrait: string };
  pieces?: { valeur: number; extrait: string };
};

/**
 * LIRE UN TEXTE COLLÉ PAR LA PERSONNE, jamais une page distante. Chaque valeur proposée garde
 * l'extrait exact qui la fonde, pour être confirmée ou corrigée avant d'être enregistrée. Rien n'est
 * retenu sans geste ; rien n'est deviné quand le texte ne le dit pas.
 */
export function extraireAnnonce(texte: string): ExtraitAnnonce {
  const t = texte.replace(/ |\u00a0/g, " ");
  const out: ExtraitAnnonce = {};
  const m = /(\d{1,3}(?:[ .]\d{3})+|\d{3,7})\s*(?:€|euros?)(\s*(?:\/\s*mois|par mois|cc|charges comprises|hc))?/i.exec(t);
  if (m) out.montant = { valeur: Number(m[1]!.replace(/[ .]/g, "")), extrait: m[0].trim() };
  const loc = /(?<!\p{L})(à louer|location|loyer|charges comprises|\/\s*mois|par mois)(?!\p{L})/iu.exec(t);
  const ven = /(?<!\p{L})(à vendre|vente|prix de vente|honoraires charge acquéreur)(?!\p{L})/iu.exec(t);
  if (loc && !ven) out.nature = { valeur: "location", extrait: loc[0] };
  else if (ven && !loc) out.nature = { valeur: "vente", extrait: ven[0] };
  const s = /(\d{2,4}(?:[,.]\d{1,2})?)\s*m(?:²|2)(?![a-z0-9])/i.exec(t);
  if (s) out.surface = { valeur: Number(s[1]!.replace(",", ".")), extrait: s[0] };
  const p = /\b(\d)\s*pi[eè]ces?\b|\b[TF](\d)\b/i.exec(t);
  if (p) out.pieces = { valeur: Number(p[1] ?? p[2]), extrait: p[0] };
  return out;
}

/** Une URL d'annonce acceptable : http(s), bornée, jamais récupérée par futur•e. */
export function urlAnnonceValide(u: string): boolean {
  if (u.length > 500) return false;
  try {
    const x = new URL(u);
    return x.protocol === "https:" || x.protocol === "http:";
  } catch {
    return false;
  }
}

export function siteDe(u: string): string | null {
  try {
    return new URL(u).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}
