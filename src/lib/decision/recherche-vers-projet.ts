// « REPRENDRE CETTE RECHERCHE POUR DÉFINIR MON PROJET » (FUT-8, §5.2). Lib PURE.
//
// Une recherche n'écrit plus jamais le Projet d'elle-même. Le lecteur le demande, voit ce qui sera
// retenu, et le serveur écrit un `parsed` NETTOYÉ : rien de ce qui ne sert que la recherche (exclusion
// de l'ancre, fourchette de taille de l'ancre, retrait de la puce de taille), aucune borne de taille
// que le lecteur n'a pas chiffrée. Ni condition, ni définition, ni adoption : un projet neuf.
import type { ParsedProject } from "../comparateur-vie.ts";
import type { UserProject, CriterionRef } from "../user-project.ts";
import { normalizeUserProject } from "../user-project.ts";
import { assainirParsed } from "../parse-assainir.ts";
import { projetSansDerivesDAncre, type AncreResolue } from "./ancres-derivees.ts";
import { declaredHardConstraintKeys, declaredPreferenceKeys } from "./project-view.ts";
import { presenterCritere } from "./criterion-labels.ts";
import { instancesDe, FAMILLES_MULTIPLES } from "./effective-value.ts";

export type ApercuReprise = {
  retenus: string[];
  propresALaRecherche: string[];
};

/** Le `parsed` que le Projet recevra. `null` si la recherche ne porte rien d'enregistrable. */
export function parsedPourLeProjet(
  parsed: ParsedProject | null, rawText: string, resoudre: (label: string) => AncreResolue | null,
): ParsedProject | null {
  if (!parsed) return null;
  // La provenance d'une préférence (« inspiré de Brest ») est conservée : assainirParsed la réécrirait.
  const provenance = new Map((parsed.preferences ?? []).map((p) => [p.key, p.source ?? "parse"]));
  const propre = assainirParsed(parsed, rawText);
  propre.preferences = (propre.preferences ?? []).map((p) => ({ ...p, source: provenance.get(p.key) ?? "parse" }));
  delete propre.ancreSansTaille;
  // Une recherche enregistrée avant FUT-8 porte encore les dérivés d'ancre : ils sont retirés.
  const brut = normalizeUserProject({ posture: "recherche", rawText, parsed: propre })!;
  return projetSansDerivesDAncre(brut, resoudre).project.parsed;
}

/** Ce que la feuille montre avant d'écrire, en langage du lecteur. */
export function apercuReprise(parsedProjet: ParsedProject, parsedRecherche: ParsedProject): ApercuReprise {
  const projet = normalizeUserProject({ posture: "recherche", rawText: "", parsed: parsedProjet }) as UserProject;
  const hc = parsedProjet.hardConstraints ?? {};
  const refs: CriterionRef[] = [
    ...declaredHardConstraintKeys(projet).flatMap((key): CriterionRef[] =>
      FAMILLES_MULTIPLES.has(key) ? instancesDe(hc, key).map((instance) => ({ kind: "hard", key, instance })) : [{ kind: "hard", key }]),
    ...declaredPreferenceKeys(projet).map((key): CriterionRef => ({ kind: "preference", key })),
  ];
  const retenus = [...new Set(refs.flatMap((r) => presenterCritere(projet, r)?.titre ?? []))];
  const ancres = (parsedRecherche.communeAncre ?? []).map((a) => a.label).filter(Boolean);
  const propresALaRecherche = ancres.flatMap((nom) => [
    `ne pas vous reproposer ${nom}`,
    ...(parsedRecherche.ancreSansTaille || hc.communeSize || hc.sizeRelativeTo ? [] : [`des villes d'une taille proche de ${nom}`]),
  ]);
  return { retenus, propresALaRecherche };
}
