// ════════════════════════════════════════════════════════════════════════════════════════════
// L'INONDATION DANS LE COMPARATEUR : L'HISTORIQUE DES SINISTRES, COMPARÉ AVEC PRUDENCE (FUT-129). PUR.
//
// ── LE DÉFAUT QUE CE MODULE FERME ────────────────────────────────────────────────────────────
// Le comparateur classait la priorité « un faible risque d'inondation » sur le RANG du nombre de
// reconnaissances CatNat : peu de reconnaissances = « Risque d'inondation faible ». C'était une fausse
// réassurance. Charron (3 reconnaissances, zone rouge submersible) ressortait « faible » ; en
// Charente-Maritime, Yves, La Couarde-sur-Mer, l'Île-d'Aix, où les sinistres indemnisés dépassent
// 10 pour 1 000 biens assurés par an, étaient en tête d'une recherche « faible risque ».
//
// ── CE QUE CE MODULE COMPARE, ET SEULEMENT CELA ─────────────────────────────────────────────
// La FRÉQUENCE DES SINISTRES D'INONDATION INDEMNISÉS (ONRN / CCR, 1995-2021) : le nombre de sinistres
// rapporté au nombre de biens assurés de la commune, en moyenne annuelle, publié en CLASSES par le
// producteur. C'est un taux : il se compare d'une commune à l'autre (usage prévu par la fiche ONRN).
//
// Arbitrages du porteur (23/10/2026) :
//   - seules les deux classes les plus hautes (5 à 10 ‰, plus de 10 ‰) font reculer une commune, et
//     seulement quand l'échantillon est assez représentatif. C'est une convention de prudence, pas un
//     seuil de danger ; les classes sont celles du producteur, aucune n'est inventée ;
//   - AUCUNE commune n'est jamais « favorable » à ce titre : une faible fréquence, l'absence de sinistre
//     répertorié et un échantillon trop partiel sont trois situations distinctes, et aucune ne prouve un
//     faible risque (la fiche ONRN le dit : « des communes avec des faibles fréquences de sinistres […]
//     peuvent néanmoins être fortement exposées ») ;
//   - le recul est NON POSITIF par construction : il part du score calculé SANS cette priorité, et ne
//     peut que le baisser (propriété testée sur l'index entier) ;
//   - les plans de prévention ne pénalisent rien : ils s'affichent comme faits.
// ════════════════════════════════════════════════════════════════════════════════════════════

/** Les classes de fréquence, VERBATIM, dans l'ordre du producteur (fiche ONRN v11, 2024). */
export const CLASSES_FREQUENCE = [
  "Pas de sinistre ou de risque répertoriés à CCR",
  "Entre 0 et 1 ‰",
  "Entre 1 et 2 ‰",
  "Entre 2 et 5 ‰",
  "Entre 5 et 10 ‰",
  "Plus de 10 ‰",
] as const;
export type ClasseFrequence = (typeof CLASSES_FREQUENCE)[number];

/** La représentativité de l'échantillon (part de marché des sinistres présents dans la base CCR). */
export const CLASSES_REPRESENTATIVITE = [
  "Pas de sinistre répertorié à CCR",
  "< 15%",
  "Entre 15 et 30%",
  "Entre 30 et 50%",
  "> 50%",
] as const;
export type ClasseRepresentativite = (typeof CLASSES_REPRESENTATIVITE)[number];

// LA REPRÉSENTATIVITÉ SUFFISANTE : 30 % et plus. Convention de futur•e, pas un seuil normatif de l'ONRN,
// alignée sur le module Logement (`onrn-sinistralite.ts`, GATE_REPR), pour qu'une même commune ne soit
// pas « lue » dans un écran et « trop partielle » dans un autre. Sensibilité mesurée (index, classes
// 5 ‰ et plus) : 681 communes à plus de 50 %, 1 536 à 30 % et plus, 1 877 à 15 % et plus.
const REPRESENTATIVITE_SUFFISANTE: ReadonlySet<string> = new Set(["Entre 30 et 50%", "> 50%"]);

/** Ce que l'index porte pour une commune (champ `historiqueInondation`), labels verbatim du producteur. */
export type HistoriqueInondationBrut = { frequence: string; representativite: string } | null | undefined;

export type HistoriqueInondation =
  /** Classe 5 ‰ et plus, échantillon suffisant : la seule situation qui fait reculer une commune. */
  | { etat: "sinistres_frequents"; classe: "Entre 5 et 10 ‰" | "Plus de 10 ‰"; representativite: string }
  /** Une fréquence mesurée, plus basse : un fait, jamais une réassurance. */
  | { etat: "frequence_mesuree"; classe: "Entre 0 et 1 ‰" | "Entre 1 et 2 ‰" | "Entre 2 et 5 ‰"; representativite: string }
  /** Aucun sinistre répertorié dans l'échantillon : une absence d'enregistrement, pas une absence de risque. */
  | { etat: "aucun_sinistre" }
  /** L'échantillon est trop partiel pour comparer (ou la source se contredit). */
  | { etat: "representativite_insuffisante"; classe: string; representativite: string }
  /** La commune n'est pas dans le jeu (Outre-mer, commune nouvelle…). */
  | { etat: "indisponible" };

export function historiqueInondation(brut: HistoriqueInondationBrut): HistoriqueInondation {
  if (!brut) return { etat: "indisponible" };
  const { frequence, representativite } = brut;
  const rangF = (CLASSES_FREQUENCE as readonly string[]).indexOf(frequence);
  if (rangF < 0) return { etat: "indisponible" };
  // AUCUN SINISTRE RÉPERTORIÉ : soit ni sinistre ni bien assuré connus (17 494 communes), soit des biens
  // assurés sans aucun sinistre, donc une fréquence nulle rangée « Entre 0 et 1 ‰ » (508 communes).
  if (representativite === "Pas de sinistre répertorié à CCR" && rangF <= 1) return { etat: "aucun_sinistre" };
  // LA SOURCE SE CONTREDIT : une fréquence d'au moins 1 ‰ sans aucun sinistre répertorié (84 communes),
  // ou l'inverse (12 communes). Comme un échantillon trop partiel : on ne compare pas.
  if (rangF === 0 || !REPRESENTATIVITE_SUFFISANTE.has(representativite)) {
    return { etat: "representativite_insuffisante", classe: frequence, representativite };
  }
  if (frequence === "Entre 5 et 10 ‰" || frequence === "Plus de 10 ‰") {
    return { etat: "sinistres_frequents", classe: frequence, representativite };
  }
  return { etat: "frequence_mesuree", classe: frequence as "Entre 0 et 1 ‰" | "Entre 1 et 2 ‰" | "Entre 2 et 5 ‰", representativite };
}

// ── LE RECUL ─────────────────────────────────────────────────────────────────────────────────
// En points de compatibilité (0-100), retranchés au score calculé SANS la priorité inondation :
//
//   recul = INTENSITE × 100 × poids de l'inondation / (poids de l'inondation + poids des autres critères)
//
// Proportionnel à la place que le lecteur donne à l'inondation dans son projet ; jamais une exclusion
// (une commune bien meilleure sur le reste reste devant) ; jamais positif. Trois intensités ont été
// simulées sur l'index entier (0,1 / 0,2 / 0,3, cf. FUT-129).
//
// VALIDÉ PAR LE PORTEUR LE 23/10/2026, après simulation des trois intensités (FUT-129) : 0,2. C'est une
// CONVENTION DE CLASSEMENT, jamais une estimation du risque, et elle ne s'affiche nulle part. Elle donne
// 10 points à une priorité de poids 3 sur un projet de poids total 6, et 2,9 points à une priorité de
// poids 1 sur un projet de poids total 7. Pas de plafond pour la priorité seule (elle passe en exploration).
export const INTENSITE_RECUL_INONDATION = 0.2;

export function reculInondation(o: {
  historique: HistoriqueInondation;
  poidsInondation: number;
  poidsAutres: number;
  intensite?: number;
}): number {
  if (o.historique.etat !== "sinistres_frequents") return 0;
  const total = o.poidsInondation + o.poidsAutres;
  if (!(o.poidsInondation > 0) || !(total > 0)) return 0;
  const intensite = Math.max(0, o.intensite ?? INTENSITE_RECUL_INONDATION);
  return intensite * 100 * (o.poidsInondation / total);
}

/** Le score avec recul : jamais au-dessus du score de référence, jamais sous zéro. */
export function scoreAvecRecul(scoreReference: number, recul: number): number {
  return Math.max(0, scoreReference - Math.max(0, recul));
}

// ── LES MOTS ─────────────────────────────────────────────────────────────────────────────────
// Simples, sans sigle, avec la période. Ce qui est comparé : des sinistres indemnisés PASSÉS, pas la
// probabilité d'une inondation à venir.
export const PERIODE_SINISTRES = "1995-2021";

const EN_CLAIR: Record<string, string> = {
  "Entre 0 et 1 ‰": "moins de 1 sinistre pour 1 000 biens assurés",
  "Entre 1 et 2 ‰": "1 à 2 sinistres pour 1 000 biens assurés",
  "Entre 2 et 5 ‰": "2 à 5 sinistres pour 1 000 biens assurés",
  "Entre 5 et 10 ‰": "5 à 10 sinistres pour 1 000 biens assurés",
  "Plus de 10 ‰": "plus de 10 sinistres pour 1 000 biens assurés",
};

/** La phrase factuelle, pour une carte ou une comparaison. Aucune ne rassure. */
export function phraseHistorique(h: HistoriqueInondation): string {
  switch (h.etat) {
    case "sinistres_frequents":
    case "frequence_mesuree":
      return `De 1995 à 2021, les inondations ont donné lieu en moyenne chaque année à ${EN_CLAIR[h.classe]} dans la commune.`;
    case "aucun_sinistre":
      return "Aucun sinistre d'inondation indemnisé n'est répertorié de 1995 à 2021 dans les données des assureurs.";
    case "representativite_insuffisante":
      return "Les données des assureurs sur les inondations de 1995 à 2021 sont trop partielles ici pour être comparées.";
    case "indisponible":
      return "Pas de données des assureurs sur les inondations pour cette commune.";
  }
}

/** Ce que la phrase ne dit pas : à afficher à côté, jamais à omettre. */
export function limiteHistorique(h: HistoriqueInondation): string {
  return h.etat === "sinistres_frequents"
    ? "Ce sont des sinistres passés : ils ne disent pas si une adresse précise est exposée."
    : "Peu ou pas de sinistres passés ne veut pas dire un faible risque : cela se vérifie à l'adresse.";
}

/** La raison qui accompagne un recul dans les résultats. */
export const RAISON_SINISTRES_FREQUENTS = "inondations indemnisées fréquentes de 1995 à 2021";

/**
 * QUAND L'INONDATION EST LA SEULE DEMANDE CLASSABLE (arbitrage du 23/10/2026) : pas de palmarès.
 * L'ordre est annoncé tel qu'il est.
 */
export const PHRASE_EXPLORATION =
  "Votre recherche ne porte que sur l'inondation : nous ne classons pas les communes sur cette seule demande. "
  + "Voici des communes à explorer, rangées par nombre d'habitants, celles où les sinistres indemnisés ont été fréquents de 1995 à 2021 en dernier. "
  + "Ajoutez ce qui compte pour vous (un cadre, des services, une région) pour obtenir des communes qui vous correspondent.";

// ── LES COMPARATIFS PAYANTS DÉJÀ VENDUS ──────────────────────────────────────────────────────
// Un Dossier comparatif n'est pas figé : il se recalcule à chaque visite. Celui qui a été acheté avant
// cette lecture affichait, sur la ligne « Inondation », un palier tiré du nombre de reconnaissances
// CatNat. On ne réécrit rien en base ; on dit, au-dessus du comparatif, que la ligne a changé.
// À AJUSTER LE JOUR DE LA MISE EN PRODUCTION : la date à partir de laquelle la nouvelle lecture est servie.
// null pendant la préparation : renseigner le jour effectif de production avant livraison.
export const LECTURE_INONDATION_DEPUIS: string | null = null;

export function avertissementPackAnterieur(
  createdAt: string | null | undefined,
  depuis: string | null = LECTURE_INONDATION_DEPUIS,
): string | null {
  if (!depuis || !createdAt || !/^\d{4}-\d{2}-\d{2}/.test(createdAt) || !(createdAt.slice(0, 10) < depuis)) return null;
  return "Ce comparatif a été acheté avant une évolution de futur•e. La ligne « Inondation » ne classe plus les communes "
    + "d'après le nombre de catastrophes naturelles reconnues : elle présente les sinistres indemnisés de 1995 à 2021 et les plans de prévention, "
    + "sans désigner de commune sans risque. Votre comparatif est affiché avec cette lecture.";
}

/** Quand le classement a changé depuis l'achat : on garde les communes achetées, on le dit. */
export const AVERTISSEMENT_TRIO_RECOMPOSE =
  "Le classement a évolué depuis votre achat. Votre comparatif reste celui des communes que vous avez achetées ; "
  + "il est présenté sans le classement de votre recherche d'origine.";

/** Une fois par recherche, quand le lecteur a déclaré cette priorité. */
export const PHRASE_TRANSPARENCE =
  "Pour l'inondation, nous faisons reculer les communes où les sinistres indemnisés ont été fréquents de 1995 à 2021. "
  + "Nous comparons des sinistres passés, pas la probabilité d'une inondation à venir : aucune donnée communale ne permet de désigner une commune sans risque. Cela se vérifie à l'adresse.";

// ── LES PLANS DE PRÉVENTION : DES FAITS, JAMAIS UNE PÉNALITÉ ───────────────────────────────────
// Présence, phénomène et statut, d'après l'export GASPAR (table `data/gaspar-pprn-inondation.json`,
// reprise à l'identique de FUT-127). Arbitrage du porteur (23/10/2026) : aucune commune ne recule du
// seul fait d'un plan, qui découpe des zones et ne dit rien d'une adresse. Les trois statuts restent
// distincts : approuvé, appliqué par anticipation, prescrit (en préparation).
export type StatutPlanInondation = "approuve" | "anticipe" | "prescrit";
export type PlanInondationIndex = { statut: StatutPlanInondation; aleas: string[] };

const PHENOMENE_COURT: Record<string, string> = {
  "Par une crue à débordement lent de cours d'eau": "crues lentes de cours d'eau",
  "Par une crue torrentielle ou à montée rapide de cours d'eau": "crues rapides",
  "Par ruissellement et coulée de boue": "ruissellement",
  "Par remontées de nappes naturelles": "remontées de nappe",
  "Par submersion marine": "submersion marine",
  "Par lave torrentielle (torrent et talweg)": "laves torrentielles",
};

const joinFr = (xs: string[]): string => (xs.length <= 1 ? (xs[0] ?? "") : `${xs.slice(0, -1).join(", ")} et ${xs[xs.length - 1]}`);

function phenomenes(plans: PlanInondationIndex[]): string {
  const vus = [...new Set(plans.flatMap((p) => p.aleas.map((a) => PHENOMENE_COURT[a]).filter((x): x is string => Boolean(x))))];
  return joinFr(vus);
}

const STATUT_EN_CLAIR: Record<StatutPlanInondation, string> = {
  approuve: "approuvé",
  anticipe: "appliqué par anticipation",
  prescrit: "en préparation, zones pas encore fixées",
};

/**
 * « Plan de prévention des inondations approuvé (submersion marine). » Un plan par statut, dans l'ordre
 * approuvé, anticipé, prescrit. `null` quand la table n'a pas été lue : on ne dit pas « aucun plan ».
 */
export function phrasePlans(plans: PlanInondationIndex[] | null | undefined): string | null {
  if (plans == null) return null;
  if (plans.length === 0) return "Aucun plan de prévention des inondations recensé dans la commune.";
  const ordre: StatutPlanInondation[] = ["approuve", "anticipe", "prescrit"];
  const parties = ordre
    .map((st) => {
      const ps = plans.filter((p) => p.statut === st);
      if (ps.length === 0) return null;
      const phen = phenomenes(ps);
      const nb = ps.length > 1 ? `${ps.length} plans de prévention des inondations` : "plan de prévention des inondations";
      return `${nb} ${STATUT_EN_CLAIR[st]}${ps.length > 1 && st !== "prescrit" ? "s" : ""}${phen ? ` (${phen})` : ""}`;
    })
    .filter((x): x is string => x != null);
  return `${cap(joinFr(parties))}.`;
}

const cap = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1);

/** Le statut le plus avancé, en deux ou trois mots, pour une cellule ou une ligne courte. */
export function plansCourt(plans: PlanInondationIndex[] | null | undefined): string | null {
  if (plans == null) return null;
  if (plans.some((p) => p.statut === "approuve")) return "plan de prévention approuvé";
  if (plans.some((p) => p.statut === "anticipe")) return "plan appliqué par anticipation";
  if (plans.some((p) => p.statut === "prescrit")) return "plan en préparation";
  return "aucun plan de prévention des inondations recensé";
}

// ── LES SURFACES DU COMPARATEUR ───────────────────────────────────────────────────────────────

const COURT: Record<string, string> = {
  "Entre 0 et 1 ‰": "Moins de 1 sinistre pour 1 000 biens par an",
  "Entre 1 et 2 ‰": "1 à 2 sinistres pour 1 000 biens par an",
  "Entre 2 et 5 ‰": "2 à 5 sinistres pour 1 000 biens par an",
  "Entre 5 et 10 ‰": "Sinistres fréquents : 5 à 10 pour 1 000 biens par an",
  "Plus de 10 ‰": "Sinistres fréquents : plus de 10 pour 1 000 biens par an",
};

/**
 * LA CELLULE « INONDATION » DE LA COMPARAISON (3 communes, Dossier comparatif). Un fait par commune,
 * jamais un palier « faible / modéré / élevé », jamais de gagnant. L'alerte (rouge) est réservée aux
 * sinistres fréquents. Le qualificatif porte le plan de prévention.
 */
export function celluleInondation(h: HistoriqueInondation, plans: PlanInondationIndex[] | null | undefined): {
  palier: string; qualifier: string | null; disponible: boolean; alerte: boolean;
} {
  const qualifier = plansCourt(plans);
  switch (h.etat) {
    case "sinistres_frequents":
    case "frequence_mesuree":
      return { palier: COURT[h.classe]!, qualifier, disponible: true, alerte: h.etat === "sinistres_frequents" };
    case "aucun_sinistre":
      return { palier: "Aucun sinistre répertorié", qualifier, disponible: true, alerte: false };
    case "representativite_insuffisante":
      return { palier: "Données trop partielles", qualifier, disponible: true, alerte: false };
    case "indisponible":
      return { palier: "Non disponible", qualifier, disponible: qualifier != null, alerte: false };
  }
}

/** L'aide de la ligne « Inondation » : ce qui est comparé, et ce qui ne l'est pas. */
export const AIDE_INONDATION =
  "Les sinistres d'inondation indemnisés de 1995 à 2021, rapportés au nombre de biens assurés, et les plans de prévention de la commune. "
  + "Ce sont des faits passés, pas une probabilité : aucune commune n'est désignée comme sans risque.";

/** Le signal pour AskFuture (« et côté inondation ? ») : factuel, même quand il est bas. */
export function signalInondation(h: HistoriqueInondation): string {
  switch (h.etat) {
    case "sinistres_frequents":
      return `inondations indemnisées fréquentes de 1995 à 2021 (${EN_CLAIR[h.classe]} chaque année)`;
    case "frequence_mesuree":
      return `de 1995 à 2021, ${EN_CLAIR[h.classe]} chaque année après une inondation, ce qui ne garantit pas un faible risque`;
    case "aucun_sinistre":
      return "aucun sinistre d'inondation indemnisé répertorié de 1995 à 2021, ce qui ne prouve pas l'absence de risque";
    case "representativite_insuffisante":
      return "données des assureurs sur les inondations trop partielles pour être comparées";
    case "indisponible":
      return "pas de données des assureurs sur les inondations";
  }
}

/** La ligne factuelle d'une carte de résultat, quand le lecteur a déclaré cette priorité. */
export function ligneCarteInondation(h: HistoriqueInondation, plans: PlanInondationIndex[] | null | undefined): string {
  const court = plansCourt(plans);
  const histo = h.etat === "sinistres_frequents" || h.etat === "frequence_mesuree"
    ? `${COURT[h.classe]!.replace(/^Sinistres fréquents : /, "")} (1995-2021)`
    : h.etat === "aucun_sinistre" ? "aucun sinistre répertorié (1995-2021)"
      : h.etat === "representativite_insuffisante" ? "données des assureurs trop partielles"
        : "pas de données des assureurs";
  return `Inondation : ${h.etat === "sinistres_frequents" ? "sinistres fréquents, " : ""}${histo.charAt(0).toLowerCase()}${histo.slice(1)}${court ? ` · ${court}` : ""}`;
}

/**
 * CE QUE LA SYNTHÈSE RÉDIGÉE REÇOIT SUR L'INONDATION (route `comparateur-vie/synthesize`) : les deux
 * phrases factuelles, rien d'autre. Elles viennent du navigateur : on n'accepte que des chaînes, bornées,
 * et jamais une phrase qui qualifierait le risque de faible (défense en profondeur).
 */
export function champInondationSynthese(
  brut: { historique?: unknown; plans?: unknown } | null | undefined,
): { historique: string | null; plans: string | null } | null {
  if (!brut || typeof brut !== "object") return null;
  const propre = (v: unknown): string | null => {
    if (typeof v !== "string") return null;
    const t = v.trim().slice(0, 300);
    return t && !/faible risque|risque faible|peu expos|sans risque|à l'abri|épargn/i.test(t) ? t : null;
  };
  const historique = propre(brut.historique);
  const plans = propre(brut.plans);
  return historique || plans ? { historique, plans } : null;
}
