// Lecteurs PURS au-dessus d'un `Dossier` assemblé : ce que l'ÉCRAN décide de montrer, jamais ce que
// le moteur a établi. Même partage que project-view.ts au-dessus de UserProject.
//
// La frontière est nette et vaut d'être tenue : une règle de présentation ne retire jamais un fait du
// dossier. Le fait reste dans `conclusionBasis`, dans les comptes, dans la couverture. On masque une
// carte ; on ne réécrit pas ce qui a été établi.
import type { Dossier, DossierSection, DossierCard, DecisionFact, IncompatibilityFact } from "./decision-fact.ts";
import type { FactComposition } from "./fact-composition.ts";

// LA CONDITION QUE LE BLOC DE TÊTE PORTE DÉJÀ ENTIÈREMENT.
//
// Le détail du verdict EST le `statement` du fait, mot pour mot (cf. conclusion-plan.ts, branche
// `incompatible`). Afficher en dessous une section « Vos conditions non négociables » qui répète cette
// phrase donnait à lire deux fois la même chose à trois centimètres d'écart, sur la branche la plus
// grave du dossier. Le blocage est la réponse : il se lit une fois, et sa preuve remonte dans le bloc.
//
// Trois conditions, toutes nécessaires :
//   - une SEULE carte dans la section : à deux ou plus, le bloc n'en nomme qu'une, la section reprend
//     son rôle et ne répète plus rien ;
//   - un FAIT, pas une composition : une composition porte un résumé propre, distinct du détail ;
//   - ÉTABLIE : une incompatibilité seulement indicative n'est pas celle que le héros nomme
//     (`establishedIncompatibility` filtre sur `evidenceStrength === "established"`), donc sa carte
//     n'est redondante avec rien.
export function conditionPorteeParLeBloc(dossier: Dossier): IncompatibilityFact | null {
  const cards = dossier.sections.find((s) => s.key === "incompatibilities")?.cards ?? [];
  const seule = cards.length === 1 ? cards[0]! : null;
  if (!seule || seule.kind !== "fact") return null;
  const f = seule.fact;
  return f.role === "incompatibility" && f.evidenceStrength === "established" ? f : null;
}

// LE MISMATCH DE TAILLE QUE LE VERDICT PORTE DÉJÀ.
//
// Le lecteur peut poser DEUX critères sur la même dimension : une contrainte dure communeSize (une
// fourchette) ET une priorité souple de taille. Quand la contrainte dure est ÉTABLIE incompatible, elle
// porte le verdict (« Condition non respectée ») avec le même chiffre et la même conclusion que le
// mismatch souple. La carte « Une métropole » redit alors, trois centimètres plus bas, ce que le héros
// vient de dire. On la masque — le fait reste dans le dossier (couverture, base de conclusion,
// orientation), c'est la même frontière que conditionPorteeParLeBloc : on masque une carte, jamais un fait.
//
// Deux garde-fous à la portée :
//   - SYMÉTRIQUES seulement (eviter_grandes_villes / prefere_grande_ville) : la catégorie d'agglo dit
//     directement la préférence, donc le mismatch conclut dans le MÊME sens que la fourchette. eviter_isolement
//     est un proxy ASYMÉTRIQUE qui porte sa propre limite (« ne prouve pas un isolement effectif ») : il dit
//     ce que le seuil brut ne dit pas, on ne le masque jamais.
//   - Cartes-FAITS seulement : un mismatch absorbé dans une composition (shared_evidence de taille) n'est pas
//     une carte isolée, et cette composition peut porter aussi un fait non redondant.
const CLES_TAILLE_SYMETRIQUES = new Set<string>(["eviter_grandes_villes", "prefere_grande_ville"]);

function tailleEtabliePorteeParLeVerdict(dossier: Dossier): boolean {
  const incompatibilites = dossier.sections.find((s) => s.key === "incompatibilities")?.cards ?? [];
  return incompatibilites.some(
    (c) => c.kind === "fact" && c.fact.role === "incompatibility"
      && c.fact.evidenceStrength === "established" && c.fact.hardConstraintKey === "communeSize",
  );
}
function estCarteMismatchTailleSymetrique(card: DossierCard): boolean {
  return card.kind === "fact" && card.fact.role === "mismatch"
    && card.fact.basis.kind === "categorical_state"
    && CLES_TAILLE_SYMETRIQUES.has(card.fact.projectKey);
}

// Les sections réellement rendues. `dossier.sections` reste la vérité de ce qui a été assemblé.
export function sectionsAffichees(dossier: Dossier): DossierSection[] {
  const base = conditionPorteeParLeBloc(dossier)
    ? dossier.sections.filter((s) => s.key !== "incompatibilities")
    : dossier.sections;
  if (!tailleEtabliePorteeParLeVerdict(dossier)) return base;
  return base
    .map((s) => s.key === "mismatches" ? { ...s, cards: s.cards.filter((c) => !estCarteMismatchTailleSymetrique(c)) } : s)
    .filter((s) => s.cards.length > 0);
}

// CE QUE LE DÉPLIABLE D'UNE COMPOSITION A ENCORE À MONTRER.
//
// Chaque patron recopie le constat de ses faits absorbés sur sa FACE : un tradeoff sur ses deux côtés,
// une grouped_verification sur ses items, une shared_evidence sur ses conséquences. Le dépliable
// « Voir les N constats détaillés » les redisait donc une seconde fois, mot pour mot, à dix
// centimètres, avec la même preuve deux ou trois fois. Vu à l'écran sur Salers.
//
// L'invariant d'audit (« les faits absorbés restent lisibles dans leur forme d'origine ») est tenu par
// la face dès qu'elle porte leur constat. Le dépliable ne garde donc que les faits qu'elle ne narre
// PAS : il disparaît quand il n'en reste aucun, et reviendra seul si un futur patron absorbe un fait
// sans le montrer.
//
// La comparaison porte sur des IDENTIFIANTS, jamais sur des textes : chaque patron déclare déjà quels
// faits chaque partie de sa face porte (`factIds`, `factId`).
export function factsNonNarresParLaFace(
  composition: FactComposition,
  absorbedFacts: DecisionFact[],
): DecisionFact[] {
  const narres = new Set(
    composition.kind === "tradeoff"
      ? [...composition.favorableSide.factIds, ...composition.unfavorableSide.factIds]
      : composition.kind === "grouped_verification"
        ? composition.items.flatMap((i) => i.factIds)
        : composition.consequences.map((c) => c.factId),
  );
  return absorbedFacts.filter((f) => !narres.has(f.id));
}
