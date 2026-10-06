// ════════════════════════════════════════════════════════════════════════════════════════════
// CE QUE DISENT LA CARTE « MÉMOIRE DES CATASTROPHES » ET LA LIGNE DES ANNÉES (FUT-69, 06/10/2026).
//
// Pur, sans réseau, testé : les composants posent ces textes, ils n'en écrivent pas d'autres.
//
// ── LES DÉFAUTS QUE CE MODULE FERME ──────────────────────────────────────────────────────────
//  1. La face de la carte ouvrait sur « Tous risques · 50 reconnaissances » puis « Dont 20 … liées aux
//     inondations », pour toute commune dont l'index portait un compte inondation : l'inondation passait
//     au premier plan même là où la sécheresse dominait. La face dit maintenant le total, puis la
//     répartition selon la règle EXISTANTE (`resumeCatnat`, dominante à 55 %, FUT-60), qui reste neutre
//     quand aucune dominante n'existe. Le compte inondation descend dans le volet, mot pour mot.
//  2. La légende disait « 28 années se détachent », « de plus en plus rapprochées » : des images, et
//     une importance que rien ne mesure. Elle dit ce qui est compté.
//  3. Le repère national (« une commune française sur dix dépasse dix années ») était au premier niveau
//     pour certaines communes seulement. Il devient une ligne de repère, la même pour toutes.
//  4. À Paris, Lyon et Marseille, GASPAR ne publie que la ville : la page d'un arrondissement montrait
//     le compte de toute la ville sans le dire. Le grain se dit (même règle que `catnat-evidence`).
// ════════════════════════════════════════════════════════════════════════════════════════════

import { resumeCatnat } from "./georisques-flags.ts";
import { CATNAT_DEPUIS, libelleCatnatInondation, type CatnatInondation } from "./decision/catnat-evidence.ts";

type ReleveCatnat = { total: number; byRisk: { label: string; count: number }[] };

/** « , à l'échelle de Paris » quand GASPAR ne publie que la ville, rien ailleurs. */
const echelle = (ville: string | null) => (ville ? `, à l'échelle de ${ville}` : "");

export type FaceMemoire = {
  /** Le chiffre de la face. */
  val: string;
  /** La ligne sous le chiffre, ou `undefined`. */
  sub: string | undefined;
  /** La carte ne sait rien. */
  missing: boolean;
  /**
   * Le compte inondation de l'index, MOT POUR MOT la phrase de la pastille du dossier (`catnat-evidence`),
   * pour l'encart du volet. `null` s'il n'y a rien à y mettre.
   */
  noteInondation: string | null;
};

export function faceMemoireCatastrophes(e: {
  catnat: ReleveCatnat | null;
  catnatInondation: CatnatInondation | null;
  catnatMisAJour: CatnatInondation | null;
  ville: string | null;
}): FaceMemoire {
  const { catnat, catnatInondation, catnatMisAJour, ville } = e;
  const total = catnat?.total ?? 0;
  const misAJour = catnatMisAJour
    ? `L'index actuellement chargé indique ${libelleCatnatInondation(catnatMisAJour)}.`
    : null;

  if (catnat && total > 0) {
    // La répartition, seulement selon la règle partagée : « Surtout X » au-delà de 55 %, une égalité
    // dite comme telle sinon. Aucune dominante ne s'invente ici.
    const repartition = resumeCatnat(catnat.byRisk, total)?.replace(/\.$/, "") ?? null;
    return {
      val: `${total} reconnaissance${total > 1 ? "s" : ""} depuis ${CATNAT_DEPUIS}`,
      sub: [repartition, ville ? `À l'échelle de ${ville}` : null].filter(Boolean).join(" · ") || undefined,
      missing: false,
      noteInondation: catnatInondation
        ? [`Dont ${libelleCatnatInondation(catnatInondation)}.`, misAJour].filter(Boolean).join(" ")
        : misAJour,
    };
  }
  if (catnat && total === 0) {
    // FUT-60 : un relevé qui répond sans ligne n'est pas une panne.
    return {
      val: `Aucune reconnaissance depuis ${CATNAT_DEPUIS}${echelle(ville)}`,
      sub: misAJour ?? undefined,
      missing: false,
      noteInondation: null,
    };
  }
  // RELEVÉ DIRECT EN PANNE. Le compte inondation de l'index est alors la SEULE donnée : il devient la
  // face, et dit pourquoi il est seul. Ce n'est pas une hiérarchie, c'est ce qui reste.
  if (catnatInondation) {
    return {
      val: libelleCatnatInondation(catnatInondation),
      sub: ["Le relevé de tous les risques n'a pas répondu", misAJour?.replace(/\.$/, "")].filter(Boolean).join(" · "),
      missing: false,
      noteInondation: null,
    };
  }
  return { val: "—", sub: misAJour ?? undefined, missing: true, noteInondation: null };
}

// ── La ligne des années ──────────────────────────────────────────────────────────────────────

const NOMBRES = [
  "Aucune", "Une", "Deux", "Trois", "Quatre", "Cinq", "Six", "Sept", "Huit",
  "Neuf", "Dix", "Onze", "Douze", "Treize", "Quatorze", "Quinze", "Seize",
];
const enLettres = (n: number) => (n < NOMBRES.length ? NOMBRES[n]! : String(n));

/**
 * Distribution nationale des années marquées par commune depuis 1982, calculée sur le fichier GASPAR
 * national du 2026-06-29 (247 701 arrêtés, 34 969 communes) : médiane 4, p90 = 10.
 */
export const REPERE_NATIONAL = { mediane: 4, p90: 10 } as const;

export type LegendeAnnees = {
  /** Ce qui est compté, pour cette commune. Premier niveau. */
  principale: string;
  /** Le repère national, identique pour toutes les communes. Niveau secondaire. */
  repere: string;
};

export function legendeAnneesCatnat(markedYears: number[], endYear: number, ville: string | null): LegendeAnnees {
  const n = markedYears.length;
  const depuis = `depuis ${CATNAT_DEPUIS}${echelle(ville)}`;
  let principale: string;
  if (n === 0) {
    principale = `Aucune année n'a connu de reconnaissance de catastrophe naturelle ${depuis}.`;
  } else if (n === 1) {
    principale = `Une année a connu au moins une reconnaissance de catastrophe naturelle ${depuis} : ${markedYears[0]}.`;
  } else {
    // Le compte récent remplace « de plus en plus rapprochées » : un fait, sur une fenêtre nommée,
    // donné pour toutes les communes plutôt que seulement quand il « ressort ».
    const debutRecent = endYear - 14;
    const recentes = markedYears.filter((y) => y >= debutRecent).length;
    const dont = recentes === 0 ? `aucune depuis ${debutRecent}` : `${enLettres(recentes).toLowerCase()} depuis ${debutRecent}`;
    principale = `${enLettres(n)} années ont connu au moins une reconnaissance de catastrophe naturelle ${depuis}, dont ${dont}.`;
  }
  return {
    principale,
    repere: `Repère national : la commune médiane en compte ${enLettres(REPERE_NATIONAL.mediane).toLowerCase()}, et une commune sur dix en compte plus de ${enLettres(REPERE_NATIONAL.p90).toLowerCase()}.`,
  };
}
