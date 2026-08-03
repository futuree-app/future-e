// ════════════════════════════════════════════════════════════════════════════════════════════
// L'ÉTAT D'UNE AUTORISATION D'URBANISME, DÉDUIT DE SES DATES.
//
// Première brique du chantier « les permis autour de l'adresse » : la seule question qu'aucune
// visite ne peut trancher, ce qui va se construire à côté.
//
// ── POURQUOI LES DATES ET PAS LE CODE ─────────────────────────────────────────────────────────
// Le jeu SDES porte `ETAT_DAU`, un code numérique dont la nomenclature n'accompagne pas le
// fichier. Mesuré le 01/08/2026 sur les 1 091 autorisations de La Rochelle depuis 2013, croisé
// avec les trois dates réelles :
//
//   ETAT_DAU=2  ->  autorisé, non commencé     199
//   ETAT_DAU=4  ->  autorisé, non commencé      90
//   ETAT_DAU=4  ->  chantier ouvert              7   <-- le même code pour deux états
//   ETAT_DAU=5  ->  chantier ouvert            178
//   ETAT_DAU=6  ->  achevé                     617
//
// Le code 4 recouvre deux situations différentes. Les dates, elles, ne se contredisent jamais :
// une déclaration d'ouverture de chantier a eu lieu ou non, une déclaration d'achèvement a eu lieu
// ou non. On lit donc les dates, et le code sert seulement de contrôle.
//
// ── CE QUE CHAQUE ÉTAT AUTORISE À DIRE ────────────────────────────────────────────────────────
// Un permis autorisé n'est pas un bâtiment. Il peut n'être jamais construit, être annulé, ou
// périmer (une autorisation devient caduque si les travaux ne commencent pas). Le vocabulaire doit
// donc coller à l'acte constaté et jamais au projet imaginé : « autorisé » n'est pas « prévu »,
// « chantier ouvert » n'est pas « en construction jusqu'en 2027 ».
//
// Pur, testé sous `node --test`.
// ════════════════════════════════════════════════════════════════════════════════════════════

/** Les dates réelles portées par une autorisation, telles que le CSV SDES les rend. */
export type SitadelDates = {
  /** DATE_REELLE_AUTORISATION : l'autorisation a été délivrée. */
  autorisation?: string | null;
  /** DATE_REELLE_DOC : déclaration d'ouverture de chantier. */
  ouvertureChantier?: string | null;
  /** DATE_REELLE_DAACT : déclaration attestant l'achèvement des travaux. */
  achevement?: string | null;
};

export type EtatAutorisation =
  | "acheve"
  | "chantier_ouvert"
  | "autorise_non_commence"
  | "sans_date";

const rempli = (v: string | null | undefined): boolean => typeof v === "string" && v.trim().length > 0;

/**
 * L'état constaté. L'ordre de lecture va du fait le plus avancé au moins avancé : un dossier
 * achevé porte aussi ses dates d'autorisation et d'ouverture, donc tester l'achèvement en premier
 * est la seule façon de ne pas le classer « autorisé ».
 */
export function etatAutorisation(d: SitadelDates): EtatAutorisation {
  if (rempli(d.achevement)) return "acheve";
  if (rempli(d.ouvertureChantier)) return "chantier_ouvert";
  if (rempli(d.autorisation)) return "autorise_non_commence";
  return "sans_date";
}

/**
 * CE QU'ON A LE DROIT D'ÉCRIRE POUR CHAQUE ÉTAT.
 *
 * Aucune projection : ni « sera livré », ni « va transformer le quartier ». On décrit un acte
 * administratif constaté, avec le verbe qui lui correspond exactement.
 */
export const LIBELLE_ETAT: Record<Exclude<EtatAutorisation, "sans_date">, string> = {
  acheve: "travaux déclarés achevés",
  chantier_ouvert: "chantier déclaré ouvert",
  // CE QUE LA SOURCE ÉTABLIT EST UNE ABSENCE DE DÉCLARATION, PAS UNE ABSENCE DE TRAVAUX.
  //
  // L'état se déduit de trois DATES DÉCLARÉES (autorisation, ouverture de chantier, achèvement).
  // « Travaux non commencés » transformait donc l'absence d'une déclaration en constat matériel :
  // un chantier peut avoir commencé sans que la déclaration d'ouverture soit parvenue au registre.
  // La formule dit exactement ce qui est dans la source, et rien de plus.
  //
  // LA RÉSERVE TEMPORELLE RESTE, sous une autre forme. Elle est indispensable, le jeu SDES ayant un
  // millésime MENSUEL : sans elle, le lecteur comprend « toujours rien aujourd'hui », ce que la
  // source ne garantit pas. Deux formules ont précédé celle-ci. « À cette date » obligeait à
  // chercher laquelle des deux dates affichées était désignée, celle du dépôt ou celle de la
  // consultation. « À la date du registre » nommait la bonne, mais gardait « travaux non
  // commencés ». « Dans le registre consulté » borne l'information à sa source, et la ligne
  // « consulté le … » du même bloc dit quand.
  autorise_non_commence: "autorisé, sans ouverture de chantier déclarée dans le registre consulté",
};

/**
 * L'état mérite-t-il d'être montré à quelqu'un qui examine une adresse AUJOURD'HUI ?
 *
 * `sans_date` est écarté : un dossier sans aucune date n'établit rien de constatable, et
 * l'afficher ferait passer un enregistrement administratif pour un projet.
 *
 * `acheve` est CONSERVÉ, contrairement à une première intuition. Un immeuble achevé l'an dernier
 * juste à côté est exactement ce qu'un acheteur veut savoir : il explique une vue, une ombre, un
 * voisinage qui vient de changer. C'est l'ANCIENNETÉ qui décide de sa pertinence, pas son état, et
 * ce filtre-là appartient à l'appelant.
 */
// GARDE DE TYPE, pas un simple booléen : elle retire `sans_date` du type pour l'appelant, donc
// `LIBELLE_ETAT[etat]` compile sans assertion. Un `boolean` obligerait à forcer le type là où
// la vérification vient d'avoir lieu, et c'est exactement là que les erreurs s'installent.
export function etatMontrable(e: EtatAutorisation): e is Exclude<EtatAutorisation, "sans_date"> {
  return e !== "sans_date";
}
