// ════════════════════════════════════════════════════════════════════════════════════════════
// LA COUVERTURE PAR FAMILLE : PRÉSENTE, RIEN TROUVÉ, OU PAS DE RÉPONSE.
//
// Cette dérivation vivait dans `server/logement-decision-data.ts`, où le moteur de décision la
// lisait. Le module Logement, lui, refaisait les MÊMES booléens à partir des MÊMES sources, dans
// son composant client, avec ses propres tests d'égalité (`/moyen|fort|élev/i` recopié, un
// `.length > 0` ici, un `count > 0` là). Deux dérivations d'un même fait finissent toujours par
// diverger, et rien n'aurait dit laquelle avait raison : le lecteur aurait vu un geste proposé
// dans le module et absent du dossier, sur la même adresse, le même jour.
//
// Elle est donc remontée ICI, pure, et les deux chemins l'appellent :
//
//   • `fetchLogementDecisionData` (serveur, dossier de décision) ;
//   • `/api/georisques-logement` (route du module), qui la renvoie au client dans son rapport.
//
// ── « RIEN TROUVÉ » ET « PAS DE RÉPONSE » NE SE CONFONDENT JAMAIS ─────────────────────────────
// `none` veut dire que la source a répondu et n'a rien à signaler ; `unavailable`, qu'elle n'a
// pas répondu. Le moteur en tire deux faits opposés : un silence, ou une inconnue nommée. Un
// booléen seul (« exposé : oui/non ») écrase cette différence et fait passer une panne pour une
// bonne nouvelle.
//
// Pur, testé sous `node --test`.
// ════════════════════════════════════════════════════════════════════════════════════════════

import type { RegulatoryPlan } from "../pprn-zonage.ts";
import type { OnrnSinistralite } from "../onrn-sinistralite.ts";

export type SourceCoverage = "present" | "none" | "unavailable"; // none = la source a répondu, rien trouvé

/** Ce qu'un résumé Géorisques apporte à la couverture. Structurel : adresse et parcelle le portent. */
type GeorisquesLike = { regulatoryPlans: RegulatoryPlan[]; rga: { label: string | null } | null } | null;

export type LogementCoverageInputs = {
  /** Résumé au point géocodé. `null` = token absent ou panne. */
  georisquesAddress: GeorisquesLike;
  /** Résumé à la parcelle. `null` = pas de parcelle résolue, token absent, ou panne. */
  georisquesParcel: GeorisquesLike;
  /** `null` = panne ; `[]` = la source a répondu, aucune cavité. La distinction est tout l'objet. */
  cavites: unknown[] | null;
  heritage: { items: unknown[]; sourceStatus: "ok" | "unavailable" };
  /** `null` = pas de code commune, ou panne. */
  sinistralite: OnrnSinistralite | null;
};

export type LogementCoverage = {
  rga: { coverage: SourceCoverage; label: string | null };
  pprn: { coverage: SourceCoverage; count: number; label: string | null };
  cavites: { coverage: SourceCoverage; count: number };
  patrimoine: { coverage: SourceCoverage; count: number };
  sinistralite: { coverage: SourceCoverage; active: boolean };
};

/**
 * L'ÉTAT ÉNERGÉTIQUE, DEPUIS L'ÉTIQUETTE.
 *
 * `absent` couvre l'absence d'étiquette, quelle qu'en soit la raison : aucun diagnostic à cette
 * adresse, ou aucun rattaché à ce logement. Ces deux situations n'appellent pas le même geste, et
 * c'est `diagnosticNonAttribue` qui les sépare, pas cette fonction.
 *
 * Vivait dans `logement-checklist.ts`, supprimé le 01/08/2026 avec l'unification des deux chemins
 * « à vérifier ».
 */
export function energyState(etiquette: string | null): "passoire" | "energivore" | "correct" | "absent" {
  if (!etiquette) return "absent";
  const e = etiquette.toUpperCase();
  if (e === "F" || e === "G") return "passoire";
  if (e === "E") return "energivore";
  return "correct";
}

/**
 * L'EXPOSITION NOTABLE AU RETRAIT-GONFLEMENT DES ARGILES.
 *
 * Le test vit ici, en un seul endroit, parce qu'il était écrit à l'identique dans l'adaptateur du
 * moteur et dans le composant du module. Il gate sur « moyen ou fort » : l'aléa faible couvre une
 * grande partie du territoire et ne fonde aucun geste.
 */
export function expositionArgileNotable(label: string | null | undefined): boolean {
  return !!label && /moyen|fort|élev/i.test(label);
}

/**
 * UN PÉRIL INDEMNISÉ LISIBLE. `lecture` et `faible_repr` disent tous deux qu'il y a eu des
 * indemnisations ; le second ajoute que la représentativité communale est faible, ce que la carte
 * dit dans sa limitation. `aucun` et `indispo` ne fondent aucun geste, pour des raisons opposées.
 */
function sinistraliteActive(s: OnrnSinistralite | null): boolean {
  return s != null && [s.secheresse.kind, s.inondation.kind].some((k) => k === "lecture" || k === "faible_repr");
}

export function deriveLogementCoverage(i: LogementCoverageInputs): LogementCoverage {
  // Champ par champ, parcelle d'abord puis adresse : la parcelle est plus fine, mais elle ne porte
  // pas toujours tout.
  const rgaLabel = i.georisquesParcel?.rga?.label ?? i.georisquesAddress?.rga?.label ?? null;
  const plans: RegulatoryPlan[] = i.georisquesParcel?.regulatoryPlans ?? i.georisquesAddress?.regulatoryPlans ?? [];
  const topPlan = plans.length ? plans.reduce((a, b) => (a.topRegimeRank <= b.topRegimeRank ? a : b)) : null;

  // LES DEUX RÉSUMÉS SONT UNE SEULE SOURCE. Aucun des deux n'a répondu : Géorisques est muet, donc
  // ni l'argile ni le zonage ne sont établis. Un seul des deux suffit à conclure « rien trouvé ».
  const georisquesMuet = i.georisquesAddress == null && i.georisquesParcel == null;

  const siniMuet =
    i.sinistralite == null ||
    (i.sinistralite.secheresse.kind === "indispo" && i.sinistralite.inondation.kind === "indispo");
  const siniActive = sinistraliteActive(i.sinistralite);

  return {
    rga: { coverage: georisquesMuet ? "unavailable" : rgaLabel ? "present" : "none", label: rgaLabel },
    pprn: {
      coverage: georisquesMuet ? "unavailable" : plans.length > 0 ? "present" : "none",
      count: plans.length,
      label: topPlan?.plan ?? null,
    },
    cavites: {
      coverage: i.cavites == null ? "unavailable" : i.cavites.length > 0 ? "present" : "none",
      count: i.cavites?.length ?? 0,
    },
    patrimoine: {
      coverage: i.heritage.sourceStatus === "unavailable" ? "unavailable" : i.heritage.items.length > 0 ? "present" : "none",
      count: i.heritage.items.length,
    },
    sinistralite: { coverage: siniMuet ? "unavailable" : siniActive ? "present" : "none", active: siniActive },
  };
}
