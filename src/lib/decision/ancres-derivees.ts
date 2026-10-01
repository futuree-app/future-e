// LES CRITÈRES QU'UNE COMMUNE-ANCRE A FABRIQUÉS, ET QUE LE DOSSIER NE PRÊTE PAS AU LECTEUR (FUT-7).
//
// « Une ville comme Brest » : la route du parseur traduit l'ancre en préférences, puis ajoute d'office
// deux critères géographiques que le lecteur n'a jamais écrits (parse/route.ts) :
//   - l'exclusion de l'agglomération de Brest, pour que la recherche ne propose pas Brest en réponse
//     à « comme Brest » ;
//   - une fourchette de taille autour de celle de Brest.
// Dans « Où vivre », ce sont des réglages de RECHERCHE, et ils y restent. Enregistrés comme projet, ils
// faisaient lire, sur un dossier à Brest : « Cette commune fait partie de l'agglomération de Brest,
// que vous souhaitez quitter. » (audit du 30/09, cas R3).
//
// LE DOSSIER LES NEUTRALISE À LA LECTURE, sans migrer ni réécrire le projet (FUT-8 corrigera la source),
// et SEULEMENT QUAND L'ORIGINE EST CERTAINE :
//   - une ville à quitter dont le nom est celui d'une ancre résolue du projet ;
//   - une fourchette de taille ÉGALE, au chiffre près, à celle que la dérivation calcule depuis les
//     ancres (`gabaritTailleAncre`, le calcul même du parseur).
// Dans le doute, on ne devine pas : le critère reste ce qu'il est.
import type { UserProject } from "../user-project.ts";
import { gabaritTailleAncre } from "../ancre-gabarit.ts";
import { normalizeName } from "../hard-constraints-resolve.ts";

/** Ce que l'annuaire sait d'une ancre : son nom canonique et sa taille d'agglomération. */
export type AncreResolue = { nom: string; tailleVille: number | null };

export type DerivesNeutralises = { excludePlace: string[]; communeSize: boolean };

export function projetSansDerivesDAncre(
  project: UserProject,
  resoudre: (label: string) => AncreResolue | null,
): { project: UserProject; neutralises: DerivesNeutralises } {
  const rien = { project, neutralises: { excludePlace: [], communeSize: false } };
  const parsed = project.parsed;
  const hc = parsed?.hardConstraints;
  const labels = (parsed?.communeAncre ?? []).map((a) => a?.label?.trim()).filter((l): l is string => Boolean(l));
  if (!parsed || !hc || labels.length === 0) return rien;

  // La dérivation ne retient que les ancres RÉSOLUES : on fait de même, avec le même annuaire.
  const ancres = labels.map(resoudre).filter((a): a is AncreResolue => a != null);
  if (ancres.length === 0) return rien;

  const nomsAncres = new Set(ancres.map((a) => normalizeName(a.nom)));
  const exclues = (hc.excludePlace ?? []).filter((e) => e?.label && nomsAncres.has(normalizeName(e.label)));

  // La fourchette, recalculée comme au parse : une ancre donne son gabarit, plusieurs donnent la
  // fourchette englobante (deriveAnchorPreferences).
  const gabarits = ancres.filter((a) => a.tailleVille != null).map((a) => gabaritTailleAncre(a.tailleVille!));
  const attendue = gabarits.length > 0
    ? { min: Math.min(...gabarits.map((g) => g.min)), max: Math.max(...gabarits.map((g) => g.max)) }
    : null;
  const cs = hc.communeSize;
  const tailleDerivee = attendue != null && cs != null && cs.min === attendue.min && cs.max === attendue.max;

  if (exclues.length === 0 && !tailleDerivee) return rien;

  const hcLu = { ...hc };
  if (exclues.length > 0) hcLu.excludePlace = (hc.excludePlace ?? []).filter((e) => !exclues.includes(e));
  if (tailleDerivee) delete hcLu.communeSize;
  return {
    project: { ...project, parsed: { ...parsed, hardConstraints: hcLu } },
    neutralises: { excludePlace: exclues.map((e) => e.label), communeSize: tailleDerivee },
  };
}
