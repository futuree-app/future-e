// ════════════════════════════════════════════════════════════════════════════════════════════
// LES INCENDIES OBSERVÉS, EN MOTS (FUT-147, arbitrages du porteur du 28/10/2026). PUR.
//
// Toutes les phrases que futur•e affiche sur la mémoire BDIFF viennent d'ici, et seulement d'ici :
// le volet Territoire, la ligne d'une carte de résultat du comparateur, la cellule « Incendies
// observés » du Dossier comparatif. Aucun modèle ne les reformule (C6) : ni la synthèse Territoire, ni
// AskFuture ne reçoivent ce fait.
//
// ── CE QUE LES PHRASES ONT LE DROIT DE DIRE ──────────────────────────────────────────────────
//   « Un incendie dont le départ a été enregistré sur la commune a parcouru 1 917 hectares au total
//     en 2022. »  (formulation validée)
// La surface est celle de TOUT le feu ; la commune est celle de son DÉPART. Jamais « X hectares ont
// brûlé dans la commune ». Les nombres cumulés désignent des événements RECENSÉS DANS LA BASE, jamais
// le nombre réel d'incendies, et ils restent dans « En savoir plus ».
//
// ── CE QU'ELLES N'ONT JAMAIS LE DROIT DE DIRE ────────────────────────────────────────────────
// Qu'une commune serait épargnée, à l'abri, sans incendie, ou que la météo projetée serait démentie
// ou confirmée par le passé. Un résultat vide ne rassure pas : il se dit avec ce qu'il ne permet pas
// de conclure. Le contrôle `PHRASES_INTERDITES` est testé sur tous les états.
// ════════════════════════════════════════════════════════════════════════════════════════════
import { dateLongue } from "./data/gaspar-pprn-inondation.ts";
import { lienFiche, type FeuRecense, type MemoireIncendies } from "./data/bdiff-incendies.ts";

/** Seuil de la ligne du comparateur et de la cellule du Dossier comparatif (C3, C4) : 10 ha parcourus. */
export const SEUIL_COMPARATEUR_HA = 10;

/** Ce qu'aucune phrase de ce module ne doit contenir. Testé sur tous les états. */
export const PHRASES_INTERDITES = /aucun incendie|épargn|à l'abri|sans risque|risque faible|faible risque|peu expos|ont brûlé dans|brûlés? dans la commune|confirm|dément|contredi|assur|santé|a brûlé|brûlés|protég|préserv|\bsûr|sécurit/i;

const NOMS_VILLE: Record<string, string> = { "13055": "Marseille", "75056": "Paris", "69123": "Lyon" };

/** « 1 917 », « 2,9 », « 14 » : entier à partir de 10 ha, une décimale en dessous. */
export function hectares(ha: number): string {
  const v = ha >= 10 ? Math.round(ha) : Math.round(ha * 10) / 10;
  return v.toLocaleString("fr-FR", { maximumFractionDigits: 1 }).replace(/ /g, " ");
}

const plusGrand = (m: MemoireIncendies): FeuRecense | null =>
  m.etat === "recense" ? m.entree.feux[0] ?? null : null;

/** Où le départ est enregistré, en clair. Marseille : la ville entière, jamais l'arrondissement. */
function lieuDuDepart(m: Extract<MemoireIncendies, { etat: "recense" }>, f: FeuRecense, communeName: string): string {
  if (m.echelle.type === "ville") return `à ${NOMS_VILLE[m.echelle.code] ?? "la ville"}`;
  if (f.ancienneCommune) return `sur l'ancienne commune de ${f.ancienneCommune}, aujourd'hui rattachée à ${communeName},`;
  return "sur la commune";
}

const listeAnnees = (as: number[]): string =>
  as.length <= 1 ? String(as[0] ?? "") : `${as.slice(0, -1).join(", ")} et ${as[as.length - 1]}`;

/** Les campagnes que la source déclare inconnues : une limite VISIBLE, jamais repliée dans le détail. */
const phraseNonRenseignees = (as: number[]): string =>
  `La base signale un nombre d'incendies inconnu pour ce département en ${listeAnnees(as)} : ce relevé peut donc être incomplet.`;

const PRUDENCE_2020 =
  "Hors du pourtour méditerranéen, le producteur de la base signale une couverture moins complète avant 2020.";

/** La limite qui accompagne TOUT feu cité : visible, jamais repliée. */
export const LIMITE_SURFACE =
  "Cette surface est celle de tout le feu : il a pu s'étendre sur les communes voisines. Un feu parti d'une commune voisine n'est pas compté ici.";

export type TexteTerritoire = {
  /** Intitulé de la section du volet. */
  titre: string;
  /** Les phrases visibles, dans l'ordre (le fait, puis sa limite). */
  phrases: string[];
  /** Les faits chiffrés du détail (« En savoir plus »). */
  details: string[];
  /** La fiche officielle du feu cité. */
  fiche: { libelle: string; href: string } | null;
};

/** La section « Les incendies enregistrés depuis 2006 » du volet feu de Territoire, pour chacun des quatre états. */
export function texteTerritoire(m: MemoireIncendies, communeName: string): TexteTerritoire {
  const titre = "Les incendies enregistrés depuis 2006";
  if (m.etat === "indisponible") {
    return { titre, phrases: ["Les incendies enregistrés dans la base nationale n'ont pas pu être lus pour le moment."], details: [], fiche: null };
  }
  const [de, a] = m.periode.split("-");
  const details: string[] = [];
  const nonRenseignees = m.etat === "recense" || m.etat === "incomplet" ? m.campagnesNonRenseignees : [];
  const ville = m.echelle.type === "ville" ? NOMS_VILLE[m.echelle.code] ?? "la ville" : null;

  if (m.etat === "recense") {
    const f = plusGrand(m);
    const phrases: string[] = [];
    if (f) {
      phrases.push(`Un incendie dont le départ a été enregistré ${lieuDuDepart(m, f, communeName)} a parcouru ${hectares(f.hectares)} hectare${f.hectares >= 2 ? "s" : ""} au total en ${f.annee}.`);
      phrases.push(LIMITE_SURFACE);
    } else {
      phrases.push(`Les départs de feu de forêt enregistrés ${ville ? `à ${ville}` : "sur la commune"} dans la base nationale, de ${de} à ${a}, ont tous parcouru moins d'un hectare.`);
      phrases.push("Un feu parti d'une commune voisine n'est pas compté ici.");
    }
    if (nonRenseignees.length > 0) phrases.push(phraseNonRenseignees(nonRenseignees));
    if (ville) phrases.push(`Ces faits concernent l'ensemble de ${ville} : la base ne situe pas les feux par arrondissement.`);
    const e = m.entree;
    details.push(`Départs de feu de forêt recensés dans la base, ${de}-${a} : ${e.nombre}, dont ${e.nombre1ha} d'au moins un hectare. Ce sont les fiches de la base, pas le nombre réel d'incendies.`);
    for (const g of e.feux) {
      details.push(`${cap(dateLongue(g.date) ?? String(g.annee))} : ${hectares(g.hectares)} ha parcouru${g.hectares >= 2 ? "s" : ""} au total, surface ${g.mesuree ? "mesurée" : "estimée"}${g.fichePartielle ? ", fiche signalée incomplète par la source" : ""}.`);
    }
    if (!m.mediterranee) details.push(PRUDENCE_2020);
    return { titre, phrases, details, fiche: f ? { libelle: `Fiche officielle de l'incendie ${f.annee}-${f.numero}`, href: lienFiche(f) } : null };
  }

  if (m.etat === "incomplet") {
    if (m.departementSansFiche) {
      return {
        titre,
        phrases: ["La base nationale des incendies de forêt ne contient aucune fiche pour ce département : elle ne renseigne pas cette commune."],
        details: m.mediterranee ? [] : [PRUDENCE_2020],
        fiche: null,
      };
    }
    return {
      titre,
      phrases: [
        `La base nationale signale un nombre d'incendies inconnu pour ce département en ${listeAnnees(m.campagnesNonRenseignees)}. Elle ne recense pas de départ de feu de forêt ${ville ? `à ${ville}` : "sur la commune"} les autres années, ce qui ne permet pas de conclure.`,
      ],
      details: m.mediterranee ? [] : [PRUDENCE_2020],
      fiche: null,
    };
  }

  // aucun : un résultat vide, dit avec ce qu'il ne permet pas de conclure.
  const vide = `La base nationale consultée ne recense pas de départ de feu de forêt ${ville ? `à ${ville}` : "sur la commune"} de ${de} à ${a}.`;
  return {
    titre,
    phrases: m.mediterranee
      ? [vide, "Ce résultat ne permet pas de conclure, et les feux partis d'une commune voisine n'y sont pas comptés."]
      : [vide, `${PRUDENCE_2020} Ce résultat ne permet donc pas de conclure, et les feux partis d'une commune voisine n'y sont pas comptés.`],
    details: [],
    fiche: null,
  };
}

/** Le feu d'au moins `SEUIL_COMPARATEUR_HA` qu'un écran du comparateur peut citer, ou `null` (silence). */
export function feuNotable(m: MemoireIncendies): FeuRecense | null {
  const f = plusGrand(m);
  return f && f.hectares >= SEUIL_COMPARATEUR_HA ? f : null;
}

/**
 * La ligne d'une carte de résultat (C3). Seulement quand la priorité feu est dans le projet ET qu'un feu
 * d'au moins 10 ha est parti de la commune ; `null` sinon, sans aucun signal pour les autres.
 */
export function ligneCarteIncendies(m: MemoireIncendies, communeName: string, feuDeclare: boolean): string | null {
  if (!feuDeclare || m.etat !== "recense") return null;
  const f = feuNotable(m);
  if (!f) return null;
  const lieu = m.echelle.type === "ville"
    ? `à ${NOMS_VILLE[m.echelle.code] ?? "la ville"} (l'ensemble de la ville)`
    : lieuDuDepart(m, f, communeName);
  return `Incendies observés : un incendie dont le départ a été enregistré ${lieu} a parcouru ${hectares(f.hectares)} ha au total en ${f.annee}.`;
}

/** L'aide de la ligne « Incendies observés » du Dossier comparatif (doctrine des aides : bref, sans source). */
export const AIDE_INCENDIES_OBSERVES =
  "Le plus grand feu parti de la commune depuis 2006, surface de tout le feu ; un feu venu d'une voisine n'est pas compté. Il n'entre pas dans la ligne « Météo propice aux feux ».";

export const LIBELLE_INCENDIES_OBSERVES = "Incendies observés";

/**
 * La cellule « Incendies observés » du Dossier comparatif (C4). La ligne n'apparaît que si une commune du
 * trio porte un feu notable (`ligneIncendiesUtile`) ; les autres cellules disent leur état sans rassurer.
 * Juxtaposée à un grand feu, une cellule vide se lirait comme une sécurité : elle porte donc TOUJOURS
 * ses limites (années déclarées inconnues, feux venus d'une voisine non comptés, couverture avant 2020).
 */
export function celluleIncendies(m: MemoireIncendies): { palier: string; qualifier: string | null; disponible: boolean; alerte: false } {
  if (m.etat === "indisponible") return { palier: "Non disponible", qualifier: null, disponible: false, alerte: false };
  const ville = m.echelle.type === "ville" ? NOMS_VILLE[m.echelle.code] ?? "la ville" : null;
  const f = feuNotable(m);
  if (f) {
    return {
      palier: `Un feu de ${hectares(f.hectares)} ha au total en ${f.annee}`,
      qualifier: ville ? `parti de ${ville}, toute la ville` : f.ancienneCommune ? `parti de l'ancienne commune de ${f.ancienneCommune}` : "parti de la commune",
      disponible: true,
      alerte: false,
    };
  }
  if (m.etat === "incomplet") {
    return {
      palier: "Base incomplète pour ce département",
      qualifier: m.departementSansFiche
        ? `aucune fiche de ${m.periode.replace("-", " à ")}`
        : `nombre d'incendies inconnu en ${listeAnnees(m.campagnesNonRenseignees)}`,
      disponible: true,
      alerte: false,
    };
  }
  const limites = [
    ...(m.etat === "recense" && m.campagnesNonRenseignees.length > 0 ? [`nombre d'incendies inconnu en ${listeAnnees(m.campagnesNonRenseignees)}`] : []),
    "feux partis d'une commune voisine non comptés",
    ...(m.mediterranee ? [] : ["base moins complète avant 2020"]),
  ];
  return {
    palier: `Pas de feu de 10 ha ou plus enregistré au départ de ${ville ? `${ville} (toute la ville)` : "la commune"}`,
    qualifier: limites.join(", "),
    disponible: true,
    alerte: false,
  };
}

/** La ligne du Dossier comparatif n'existe que si au moins une commune affichée porte un feu notable. */
export function ligneIncendiesUtile(ms: MemoireIncendies[]): boolean {
  return ms.some((m) => feuNotable(m) != null);
}

const cap = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1);
