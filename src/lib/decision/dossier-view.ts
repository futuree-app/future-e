// Lecteurs PURS au-dessus d'un `Dossier` assemblé : ce que l'ÉCRAN décide de montrer, jamais ce que
// le moteur a établi. Même partage que project-view.ts au-dessus de UserProject.
//
// La frontière est nette et vaut d'être tenue : une règle de présentation ne retire jamais un fait du
// dossier. Le fait reste dans `conclusionBasis`, dans les comptes, dans la couverture. On masque une
// carte ; on ne réécrit pas ce qui a été établi.
import type { Dossier, DossierSection, IncompatibilityFact } from "./decision-fact.ts";

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

// Les sections réellement rendues. `dossier.sections` reste la vérité de ce qui a été assemblé.
export function sectionsAffichees(dossier: Dossier): DossierSection[] {
  return conditionPorteeParLeBloc(dossier)
    ? dossier.sections.filter((s) => s.key !== "incompatibilities")
    : dossier.sections;
}
