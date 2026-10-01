// LES CRITÈRES DU PROJET, TELS QUE LE LECTEUR LES VOIT (FUT-8, §8.1). Lib PURE, appelée par le serveur ;
// son résultat est sérialisable et part tel quel au navigateur.
//
// Une ligne par critère, en langage du lecteur, avec au plus une action visible. La confirmation se
// prépare ICI, pas dans le navigateur : la précision à choisir (seulement si elle manque pour trancher),
// la phrase d'interprétation à montrer avant « Ça me convient », et ce que futur•e pourra en faire
// (trancher, seulement à l'adresse, apprécier). Le navigateur ne fait que montrer et renvoyer `seen`.
import type { UserProject, CriterionRef, DefinitionBody } from "../user-project.ts";
import { normalizeUserProject, normalizeConditions, normalizeRejets } from "../user-project.ts";
import { declaredHardConstraintKeys } from "./project-view.ts";
import { criterionFingerprint, isConfirmed, isStale, sameCriterion } from "./conditions.ts";
import {
  effectiveProject, effectivePreferences, parsedFingerprint, FAMILLES_MULTIPLES, instancesDe,
} from "./effective-value.ts";
import { criterionCapability } from "./capability.ts";
import { presenterCritere } from "./criterion-labels.ts";
import { appliquerGeste } from "./criterion-gestes.ts";
import { conventionDeZone } from "./conventions.ts";
import { ADMIN_REGION_TOKENS } from "./capability.ts";

export type Portee = "trancher" | "adresse_seulement" | "apprecier" | "ne_pas_mesurer";

export type OptionDePrecision = {
  label: string;
  definition: DefinitionBody;
  // Ce que le lecteur verra au moment de confirmer, si elle est choisie.
  phrase: string | null;
  portee: Portee;
};

export type CritereVue = {
  id: string;
  ref: CriterionRef;
  titre: string;
  // « Comment futur•e l'interprète », replié par défaut : jamais une question.
  interpretation: string | null;
  etat: "compris" | "inspire" | "condition" | "a_revoir" | "rejete";
  // « Inspiré de Brest » : la commune d'où vient la suggestion, tant que le lecteur ne l'a pas gardée.
  ancre: string | null;
  // Un mot fort écrit par le lecteur sur CE critère : la suggestion de condition.
  motFort: string | null;
  seenParsed: string | null;
  seenEffectif: string | null;
  // La préparation de la confirmation.
  confirmation: {
    question: string | null;
    options: OptionDePrecision[];
    // « Près de Nantes » : le seuil est à SAISIR par le lecteur (un nombre et son unité). Jamais deviné.
    saisieSeuil: { unites: { cle: "km_vol_oiseau" | "min_voiture" | "min_pied"; libelle: string; phrase: string; portee: Portee }[] } | null;
    phrase: string | null;
    portee: Portee;
  };
  revoir: string | null;
};

function portee(project: UserProject, ref: CriterionRef): Portee {
  if (ref.kind === "preference") {
    const c = criterionCapability(ref, "commune").capability;
    return c === "trancher" ? "trancher" : c === "apprecier" ? "apprecier" : "ne_pas_mesurer";
  }
  const hc = effectiveProject(project).parsed?.hardConstraints ?? {};
  const restreint = ref.instance ? { ...hc, ...(ref.key === "excludePlace"
    ? { excludePlace: (hc.excludePlace ?? []).filter((e) => instancesDe({ excludePlace: [e] }, "excludePlace")[0] === ref.instance) }
    : { excludeZones: (hc.excludeZones ?? []).filter((t) => t === ref.instance) }) } : hc;
  const commune = criterionCapability({ kind: "hard", key: ref.key, hc: restreint }, "commune").capability;
  if (commune === "trancher") return "trancher";
  const adresse = criterionCapability({ kind: "hard", key: ref.key, hc: restreint }, "adresse").capability;
  if (adresse === "trancher") return "adresse_seulement";
  return commune === "apprecier" || adresse === "apprecier" ? "apprecier" : "ne_pas_mesurer";
}

// Les précisions qui manquent pour trancher, en langage du lecteur.
function optionsPour(project: UserProject, ref: CriterionRef): DefinitionBody[] | null {
  const hc = project.parsed?.hardConstraints ?? {};
  if (ref.kind !== "hard") return null;
  switch (ref.key) {
    case "nearPlace": {
      const np = hc.nearPlace;
      if (np?.maxMinutes != null && !np.mode) {
        return [{ kind: "temps_lieu", mode: "car", maxMinutes: np.maxMinutes }, { kind: "temps_lieu", mode: "walk", maxMinutes: np.maxMinutes }];
      }
      if (np?.maxKm != null && !np.metric && np.maxMinutes == null) {
        return [{ kind: "distance_lieu", metric: "vol_oiseau", maxKm: np.maxKm }, { kind: "distance_lieu", metric: "route", maxKm: np.maxKm }];
      }
      return null;
    }
    case "communeSize": {
      const cs = hc.communeSize;
      if (!cs || cs.unit || (cs.min == null && cs.max == null)) return null;
      return (["commune", "unite_urbaine"] as const).map((unit) => ({ kind: "taille", unit, min: cs.min ?? null, max: cs.max ?? null }));
    }
    case "sizeRelativeTo":
      return hc.sizeRelativeTo && !hc.sizeRelativeTo.unit
        ? (["commune", "unite_urbaine"] as const).map((unit) => ({ kind: "taille_relative", unit })) : null;
    case "excludePlace": {
      const ville = (hc.excludePlace ?? []).find((e) => instancesDe({ excludePlace: [e] }, "excludePlace")[0] === ref.instance);
      return ville && !ville.scope ? (["commune", "unite_urbaine"] as const).map((scope) => ({ kind: "quitter_ville", scope })) : null;
    }
    case "excludeZones":
      return ref.instance === "paris" || ref.instance === "idf"
        ? (["paris", "petite_couronne", "agglomeration", "ile_de_france"] as const).map((perimetre) => ({ kind: "perimetre_parisien", perimetre }))
        : null;
    case "zones": {
      const macros = (hc.zones ?? []).filter((z) => z.strength === "hard" && !ADMIN_REGION_TOKENS.includes(z.zone));
      if (macros.length === 0) return null;
      const conventions = macros.map((z) => conventionDeZone(z.zone));
      // Une façade ou un massif n'a pas de périmètre proposé : rien à accepter, la condition restera appréciée.
      if (conventions.some((c) => c == null)) return null;
      return [{
        kind: "perimetre_zones",
        conventions: conventions.map((c) => ({ token: (c!.definition as { token: string }).token, conventionId: c!.id, conventionVersion: c!.version })),
      }];
    }
    default:
      return null;
  }
}

function libelleOption(d: DefinitionBody): string {
  switch (d.kind) {
    case "distance_lieu": return d.metric === "vol_oiseau" ? "À vol d'oiseau" : "Par la route";
    case "temps_lieu": return d.mode === "car" ? "En voiture" : "À pied";
    case "taille": return d.unit === "commune" ? "La commune elle-même" : "Toute l'agglomération";
    case "taille_relative": return d.unit === "commune" ? "La commune elle-même" : "Toute l'agglomération";
    case "quitter_ville": return d.scope === "commune" ? "La commune seulement" : "Toute l'agglomération";
    case "perimetre_parisien":
      return { paris: "Paris", petite_couronne: "Paris et la petite couronne", agglomeration: "L'agglomération parisienne", ile_de_france: "Toute l'Île-de-France" }[d.perimetre];
    case "perimetre_zones": return "Ça me convient";
    case "convention": return "Ça me convient";
  }
}

// La phrase d'interprétation se montre au moment de confirmer quand le sens peut écarter un lieu que le
// lecteur croirait dedans : une région, une macro-zone, une agglomération, une unité de taille.
const PHRASE_AU_MOMENT_DE_CONFIRMER = new Set(["zones", "excludeZones", "excludePlace", "communeSize", "sizeRelativeTo", "nearPlace"]);

export function vueCriteres(project: UserProject | null): CritereVue[] {
  if (!project?.parsed) return [];
  const eff = effectiveProject(project);
  const hc = project.parsed.hardConstraints ?? {};
  const refs: CriterionRef[] = [
    ...declaredHardConstraintKeys(project).flatMap((key): CriterionRef[] =>
      FAMILLES_MULTIPLES.has(key) ? instancesDe(hc, key).map((instance) => ({ kind: "hard", key, instance })) : [{ kind: "hard", key, instance: null }]),
    ...effectivePreferences(project).filter((p) => p.weight > 0).map((p): CriterionRef => ({ kind: "preference", key: p.key, instance: null })),
  ];
  const vues: CritereVue[] = [];
  for (const ref of refs) {
    const pres = presenterCritere(eff, ref);
    if (!pres) continue;
    const confirme = isConfirmed(project, ref);
    const perimee = isStale(project, ref);
    const pref = ref.kind === "preference" ? project.parsed.preferences?.find((p) => p.key === ref.key) : null;
    const adoptee = ref.kind === "preference" && (project.adoptions ?? []).some((a) => a.criterion.key === ref.key);
    const ancre = pref?.source === "ancre" && !adoptee ? project.parsed.communeAncre?.[0]?.label ?? null : null;
    const motFort = (project.parsed.forceMarkers ?? []).find((m) => sameCriterion(m.criterion, ref))?.quote ?? null;
    const options = (optionsPour(eff, ref) ?? []).flatMap((definition): OptionDePrecision[] => {
      const essai = appliquerGeste(project, { action: "definir", criterion: ref, seen: parsedFingerprint(project, ref) ?? "", definition }, "1970-01-01T00:00:00.000Z");
      if (!essai.ok) return [];
      const presOpt = presenterCritere(effectiveProject(essai.project), ref);
      return [{
        label: libelleOption(definition), definition,
        phrase: presOpt?.interpretation ?? null, portee: portee(essai.project, ref),
      }];
    });
    vues.push({
      id: `${ref.kind}:${ref.key}:${ref.instance ?? ""}`,
      ref, titre: pres.titre,
      interpretation: pres.interpretation ?? null,
      etat: perimee ? "a_revoir" : confirme ? "condition" : ancre ? "inspire" : "compris",
      ancre, motFort: confirme ? null : motFort,
      seenParsed: parsedFingerprint(project, ref),
      seenEffectif: criterionFingerprint(project, ref),
      confirmation: {
        saisieSeuil: saisieSeuilPour(eff, ref),
        question: options.length > 0 || saisieSeuilPour(eff, ref) ? pres.question ?? (options[0]!.definition.kind === "perimetre_zones" ? pres.interpretation ?? null : null) : null,
        options,
        phrase: PHRASE_AU_MOMENT_DE_CONFIRMER.has(ref.key) || ref.kind === "preference" ? pres.interpretation ?? null : null,
        portee: portee(project, ref),
      },
      revoir: perimee ? messageARevoir(project, ref) : null,
    });
  }
  // Les suggestions d'ancre que le lecteur a écartées, tant qu'une ancre les propose encore : une ligne
  // discrète, pour pouvoir changer d'avis. Un critère que le texte porte n'est pas « écarté ».
  for (const r of normalizeRejets(project.rejets)) {
    const pref = project.parsed.preferences?.find((p) => p.key === r.criterion.key);
    if (!pref || (pref.source ?? "parse") === "parse") continue;
    const ref: CriterionRef = { kind: "preference", key: r.criterion.key, instance: null };
    const pres = presenterCritere(project, ref);
    if (!pres) continue;
    vues.push({
      id: `rejet:${r.criterion.key}`, ref, titre: pres.titre, interpretation: null, etat: "rejete",
      ancre: project.parsed.communeAncre?.[0]?.label ?? r.origin.labels[0] ?? null, motFort: null,
      seenParsed: null, seenEffectif: `pref:${r.criterion.key}`,
      confirmation: { question: null, options: [], saisieSeuil: null, phrase: null, portee: "ne_pas_mesurer" },
      revoir: null,
    });
  }
  // Les conditions dont l'élément a disparu du projet (« Lyon » devenu « Nantes ») : à revoir, et à
  // retirer, jamais oubliées en silence.
  for (const c of normalizeConditions(project.conditions)) {
    if (refs.some((r) => sameCriterion(r, c.criterion))) continue;
    const nom = c.criterion.instance ?? c.criterion.key;
    vues.push({
      id: `orpheline:${c.criterion.kind}:${c.criterion.key}:${c.criterion.instance ?? ""}`,
      ref: c.criterion, titre: c.criterion.key === "excludePlace" ? `Quitter ${nom.replace(/\b\w/g, (l) => l.toUpperCase())}` : "Une condition",
      interpretation: null, etat: "a_revoir", ancre: null, motFort: null, seenParsed: null, seenEffectif: null,
      confirmation: { question: null, options: [], saisieSeuil: null, phrase: null, portee: "ne_pas_mesurer" },
      revoir: "Votre projet n'en parle plus.",
    });
  }
  return vues;
}

// « Près de Nantes », sans distance ni temps : le lecteur saisit son seuil. Les trois unités se tranchent
// à l'adresse (aucune ne se tranche au point de référence de la commune).
function saisieSeuilPour(project: UserProject, ref: CriterionRef): CritereVue["confirmation"]["saisieSeuil"] {
  const np = project.parsed?.hardConstraints?.nearPlace;
  if (ref.kind !== "hard" || ref.key !== "nearPlace" || !np?.label || np.maxKm != null || np.maxMinutes != null) return null;
  return {
    unites: [
      { cle: "km_vol_oiseau", libelle: "km à vol d'oiseau", phrase: "À vol d'oiseau, depuis votre logement.", portee: "adresse_seulement" },
      { cle: "min_voiture", libelle: "minutes en voiture", phrase: "Temps estimé sans trafic, depuis votre logement.", portee: "adresse_seulement" },
      { cle: "min_pied", libelle: "minutes à pied", phrase: "Temps estimé à pied, depuis votre logement.", portee: "adresse_seulement" },
    ],
  };
}

// « Votre condition portait sur Nantes ; votre projet parle désormais de Rennes. » Le lieu d'origine se
// lit dans l'empreinte de la confirmation (la valeur canonique y est en clair) ; à défaut, une phrase
// générale, jamais une supposition.
function messageARevoir(project: UserProject, ref: CriterionRef): string {
  const ancienne = normalizeConditions(project.conditions).find((c) => sameCriterion(c.criterion, ref));
  const avant = ancienne?.fingerprint.match(/"label":"([^"]+)"/)?.[1] ?? null;
  const hc = project.parsed?.hardConstraints ?? {};
  const maintenant = ref.key === "nearPlace" ? hc.nearPlace?.label : ref.key === "sizeRelativeTo" ? hc.sizeRelativeTo?.label : null;
  if (avant && maintenant && avant !== maintenant) return `Votre condition portait sur ${avant} ; votre projet parle désormais de ${maintenant}.`;
  return "Votre projet a changé depuis que vous avez posé cette condition.";
}

/** Utilitaire de test : la vue d'un projet brut tel que la base le rend. */
export function vueDepuisBrut(raw: unknown): CritereVue[] {
  return vueCriteres(normalizeUserProject(raw));
}
