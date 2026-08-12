// Accès données Territoire (frontière d'intégration : importe comparateur-vie, qui est server-only,
// donc non testable en node --test). Le mapping pur vit dans module-facts-map.ts (testé). Aucune
// valeur de repli : subScore garde déjà les absences, on ne les enveloppe pas d'un try/catch (une
// erreur inattendue doit exploser, ce n'est pas une « donnée indisponible »).
import {
  getCommuneEntry, subScore, PREFERENCE_KEYS, placeDirectory, tailleVilleResolvedOf, type IndexCommune,
} from "../comparateur-vie.ts";
import { hydrateHardConstraints } from "../hard-constraints-hydrate.ts";
import { resolveExternalReferences } from "../hard-constraints-external.ts";
import {
  PRODUCT_CONVENTIONS_VERSION, ROUTABLE_MODES,
  type EvaluationContext, type EvaluationPoint, type NormalizedHardConstraints,
  type TravelTimeEstimate,
} from "../hard-constraints.ts";
import { estimateTravelMinutes, routeRequestHash } from "../route-time.ts";
import { reachabilityStore } from "../reachability-store.ts";
import { mapCommuneToModuleFacts } from "./module-facts-map.ts";
import { buildClimatFacts, type ClimatFacts } from "./climat-facts.ts";
import { getClimatDataCommune } from "../drias-json.ts";
import { getGeorisquesSummary } from "../georisques.ts";
import { getRadonPotentiel } from "../radon.ts";
import { runRules } from "./materiality-rules.ts";
import { assembleDossier } from "./decision-assembler.ts";
import { composeFacts } from "./fact-compositions.ts";
import type { ModuleFacts, Dossier } from "./decision-fact.ts";
import type { RadonFacts } from "./radon-facts.ts";
import type { UserProject } from "../user-project.ts";
import { deCommune } from "../typography.ts";

export function buildModuleFacts(
  entry: IndexCommune,
  opts: { hasAddress: boolean; climat?: ClimatFacts | null; risquesDeclares?: { wildfire: boolean } | null; radon?: RadonFacts | null },
): ModuleFacts {
  const scores: ModuleFacts["scores"] = {};
  for (const key of PREFERENCE_KEYS) scores[key] = subScore(key, entry);
  // La taille d'agglomération vient de comparateur-vie (tailleVilleOf), jamais d'un calcul refait ici :
  // c'est exactement la divergence qu'on vient de fermer (le comparateur jugeait la taille sur l'unité
  // urbaine, le dossier sur la population communale).
  const resolvedSize = tailleVilleResolvedOf(entry);
  return mapCommuneToModuleFacts(entry, scores, {
    hasAddress: opts.hasAddress,
    tailleVille: resolvedSize.value,
    tailleVilleSource: resolvedSize.source,
    climat: opts.climat ?? null,
    risquesDeclares: opts.risquesDeclares ?? null,
    radon: opts.radon ?? null,
  });
}

/**
 * LE POTENTIEL RADON, chargé comme le climat : par l'appelant, jamais dans le mapping pur.
 *
 * `citycode` est le code que le géocodeur a donné à l'adresse. Il compte : à Paris, Lyon et
 * Marseille, la source ne connaît QUE les arrondissements, et la valeur y varie (le 9e de Lyon est
 * en classe 3, les huit autres en 1). Sans adresse dans ces trois villes, il n'y a pas de valeur —
 * `null`, jamais un arrondissement tiré au hasard.
 */
export async function loadRadonFacts(insee: string, citycode?: string | null): Promise<RadonFacts | null> {
  const p = await getRadonPotentiel(insee, citycode);
  return p ? { classe: p.classe, codeInterroge: p.codeInterroge, parArrondissement: p.parArrondissement } : null;
}

// LE CLIMAT VIENT DES SCÉNARIOS DRIAS COMPLETS, pas de l'index du comparateur : l'index ne porte que la
// valeur projetée (gwl20), et la TRAJECTOIRE exige les anomalies (elles seules restituent la référence de
// la fin du XXe siècle, que DRIAS n'expose en aucune colonne).
export async function loadClimatFacts(insee: string): Promise<ClimatFacts | null> {
  try {
    const data = await getClimatDataCommune(insee);
    return buildClimatFacts(data?.commune.s ?? null);
  } catch {
    // Une donnée climatique indisponible n'est pas une exposition faible : les règles rendront
    // `uncertain`, et le critère restera NON EXAMINÉ. Jamais `satisfied`.
    return null;
  }
}

export async function loadModuleFacts(
  insee: string,
  opts: { hasAddress: boolean; citycode?: string | null },
): Promise<ModuleFacts | null> {
  // LES RISQUES DÉCLARÉS entrent dans le socle du dossier. Ils étaient chargés par le module Territoire
  // (l'écran) mais restaient invisibles au MOTEUR : le dossier concluait sur le risque d'incendie à partir
  // du seul indice météo projeté, pendant que Géorisques déclarait « Feu de forêt » sur la même commune.
  // Vu à l'écran sur Lège-Cap-Ferret, en pleins incendies : « Bonne correspondance ».
  //
  // La source est déjà mise en cache par commune (getGeorisquesSummary) : aucun appel supplémentaire pour
  // un lecteur qui ouvre aussi le module Territoire. Une panne rend `null` — jamais `false`.
  const [entryCommune, climat, georisques, radon] = await Promise.all([
    getCommuneEntry(insee),
    loadClimatFacts(insee),
    getGeorisquesSummary(insee).catch(() => null),
    // `citycode` sert aux trois communes à arrondissements : sans lui, Paris, Lyon et Marseille
    // n'ont pas de valeur radon — et c'est la vérité, puisqu'elle y varie d'un arrondissement à
    // l'autre. Cache 30 j : une classification géologique ne bouge pas.
    loadRadonFacts(insee, opts.citycode),
  ]);
  // PARIS, LYON, MARSEILLE : L'INDEX N'A PAS DE LIGNE POUR LE CODE AGRÉGÉ (13/08/2026).
  // ══════════════════════════════════════════════════════════════════════════════════════════
  // Il est bâti par arrondissement, et 75056 / 69123 / 13055 n'y existent pas. Le hub, lui, travaille
  // au grain commune depuis que l'identité de l'artefact y a été remontée : `entry` valait donc
  // `null`, `loadModuleFacts` rendait `null`, et l'écran d'un dossier parisien PAYÉ n'affichait ni
  // verdict ni titre, sans rien dire.
  //
  // `citycode` porte déjà le code LOCAL (il servait au radon, qui varie par arrondissement) : il sert
  // maintenant de repli de lecture. Jamais un arrondissement choisi par défaut, toujours celui que le
  // lecteur possède, décidé en amont par `codeDeLectureLocal`.
  const entry = entryCommune
    ?? (opts.citycode && opts.citycode !== insee ? await getCommuneEntry(opts.citycode) : null);
  const risquesDeclares = georisques ? { wildfire: georisques.flags.wildfire } : null;
  return entry ? buildModuleFacts(entry, { hasAddress: opts.hasAddress, climat, risquesDeclares, radon }) : null;
}

// LE CONTEXTE DES CONTRAINTES DURES, hydraté AU-DESSUS des deux moteurs : le MÊME annuaire et la MÊME
// hydratation que matchProjects. C'est ce qui interdit au dossier et au comparateur de résoudre
// « Brest » différemment, ou de conclure différemment sur la même commune.
export async function buildHardContext(
  project: UserProject,
  facts: ModuleFacts,
  point?: EvaluationPoint,
): Promise<EvaluationContext> {
  // La MÊME chaîne que matchProjects : même annuaire, même géocodage, même isochrone, mêmes contrôles.
  const hcRaw = project.parsed?.hardConstraints;
  const dir = await placeDirectory();
  const constraints = hydrateHardConstraints(hcRaw, dir, await resolveExternalReferences(hcRaw, dir));
  // LE POINT RÉELLEMENT TESTÉ. Sans coordonnées, il reste NULL : une commune sans lat/lon repliée sur
  // (0, 0) atterrit dans le golfe de Guinée, et la contrainte de proximité en tirerait une incompatibilité
  // ÉTABLIE, avec sa carte et sa preuve, sur un point inventé.
  const evalPoint: EvaluationPoint | null =
    point ??
    (facts.lat != null && facts.lon != null
      ? {
          lat: facts.lat, lon: facts.lon,
          grain: "commune_reference", source: "commune_centroid",
          label: `le point de référence ${deCommune(facts.nom)}`,
        }
      : null);

  return {
    constraints,
    point: evalPoint,
    // LE DOSSIER MESURE, LUI AUSSI. Un seul itinéraire (sa commune, ou son adresse), aucun plafond : le
    // comparateur en calcule vingt-quatre, le dossier n'en a qu'un.
    travelTime: await estimateTravelTimeAt(constraints, evalPoint),
    conventionsVersion: PRODUCT_CONVENTIONS_VERSION,
  };
}

// L'ESTIMATION, AU POINT RÉELLEMENT ÉVALUÉ. Une durée calculée depuis le centroïde de la commune ne vaut
// PAS pour une adresse posée à son extrémité : les deux demandes ont des hash différents, et le noyau
// rejette une estimation qui ne concorde pas avec le point qu'il évalue. On la recalcule donc, plutôt que
// de resservir celle de la commune.
export async function estimateTravelTimeAt(
  constraints: NormalizedHardConstraints,
  point: EvaluationPoint | null,
): Promise<TravelTimeEstimate | null> {
  const np = constraints.nearPlace;
  if (!point || !np || np.reference.status !== "resolved") return null;
  if (np.threshold?.metric !== "travel_time") return null;
  const mode = np.threshold.mode;
  if (mode == null || !ROUTABLE_MODES.includes(mode)) return null; // le vélo n'est pas routable chez IGN

  const ref = np.reference;
  const request = {
    fromLat: point.lat, fromLon: point.lon,
    toLat: ref.lat, toLon: ref.lon,
    mode: mode as "car" | "walk",
    direction: "to_reference" as const,
  };
  const minutes = await estimateTravelMinutes(request, reachabilityStore());
  if (minutes == null) return { status: "unavailable" }; // une panne, jamais un verdict
  return {
    status: "estimated",
    minutes,
    mode,
    from: { lat: point.lat, lon: point.lon },
    to: { lat: ref.lat, lon: ref.lon },
    direction: "to_reference",
    requestHash: routeRequestHash(request),
  };
}

// LE GRAIN CHANGE, DONC LA DEMANDE CHANGE. Le dossier commune+adresse repart du même socle (références
// résolues une seule fois) et n'en change que le POINT : il doit donc REFAIRE l'estimation pour ce point,
// et non traîner celle de la commune.
export async function withEvaluationPoint(
  hard: EvaluationContext,
  point: EvaluationPoint,
): Promise<EvaluationContext> {
  return { ...hard, point, travelTime: await estimateTravelTimeAt(hard.constraints, point) };
}

// Orchestrateur du hub : commune -> ModuleFacts -> règles -> assemblage. `hasAddress` reflète la
// présence d'une analyse logement déjà sauvegardée pour cette commune (l'appelant le détermine) :
// il coupe la règle « confort sans adresse ». parsed null est géré par l'assembleur.
//
// `hard` est RENDU à l'appelant : le dossier commune+adresse (DossierAvecLogement) repart du même socle
// et n'en change que le POINT (l'adresse), sans re-résoudre les références.
export async function buildCommuneDossier(
  insee: string,
  project: UserProject,
  // `citycode` : le code que le géocodeur a donné à l'adresse analysée, quand il y en a une. Il n'est
  // PAS redondant avec `insee` pour Paris, Lyon et Marseille, où il porte l'arrondissement — seule
  // maille à laquelle certaines sources (le radon) répondent, et à laquelle leur valeur varie.
  opts?: { hasAddress?: boolean; citycode?: string | null },
): Promise<{ moduleFacts: ModuleFacts; dossier: Dossier; hard: EvaluationContext } | null> {
  const facts = await loadModuleFacts(insee, { hasAddress: opts?.hasAddress ?? false, citycode: opts?.citycode });
  if (!facts) return null;
  const hard = await buildHardContext(project, facts);
  // moduleFacts retournés pour que l'augmentation Logement reparte du MÊME socle (pas de reload).
  const run = runRules(facts, project, hard);
  return {
    moduleFacts: facts,
    dossier: assembleDossier(run, project, "commune", facts.nom, composeFacts(run, facts, project)),
    hard,
  };
}
