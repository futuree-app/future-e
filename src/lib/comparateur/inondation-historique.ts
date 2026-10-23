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
// EN ATTENTE DE VALIDATION DU PORTEUR : 0,2 est la proposition argumentée dans FUT-129, pas une valeur
// arrêtée. Elle donne 10 points à une priorité de poids 3 sur un projet de poids total 6, et 2,9 points
// à une priorité de poids 1 sur un projet de poids total 7.
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

/** Une fois par recherche, quand le lecteur a déclaré cette priorité. */
export const PHRASE_TRANSPARENCE =
  "Pour l'inondation, nous faisons reculer les communes où les sinistres indemnisés ont été fréquents de 1995 à 2021. "
  + "Nous comparons des sinistres passés, pas la probabilité d'une inondation à venir : aucune donnée communale ne permet de désigner une commune sans risque. Cela se vérifie à l'adresse.";
