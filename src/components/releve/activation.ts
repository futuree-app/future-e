// FUT-91 · L'ACTIVATION DU RELEVÉ DANS « MA DÉCISION ».
//
// La nouvelle présentation est LIVRÉE ÉTEINTE : sans `DECISION_RELEVE=true` côté serveur, la production
// rend exactement l'écran actuel. Le porteur l'active pour revue (localement, ou sur un environnement
// de prévisualisation), puis en production quand il le décide. Une prop explicite gagne toujours :
// les pages de comparaison de développement montrent les deux présentations côte à côte.
export type PresentationDossier = "classique" | "releve";

export function presentationDuDossier(
  explicite: PresentationDossier | undefined,
  env: Record<string, string | undefined> = process.env,
): PresentationDossier {
  if (explicite) return explicite;
  return env.DECISION_RELEVE === "true" ? "releve" : "classique";
}
