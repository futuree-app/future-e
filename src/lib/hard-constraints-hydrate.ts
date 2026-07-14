// L'HYDRATATION : ce que le lecteur a déclaré, plus ce que la résolution a trouvé. PURE : elle REÇOIT
// l'annuaire, elle ne va jamais le chercher (sinon comparateur-vie -> hydrate -> comparateur-vie, un
// cycle d'imports).
//
// ELLE VIT AU-DESSUS DES DEUX MOTEURS. Ni le comparateur ni le dossier ne résolvent un label : ils
// reçoivent le même objet résolu. Deux résolutions indépendantes peuvent diverger (un succès ici, un
// échec là, un géocodeur qui a bougé entre-temps) ; une seule ne le peut pas.
import { resolveZoneAnchors, resolveExclusions, ZONE_TABLE } from "./geo-zones.ts";
import {
  resolveNearPlace, resolveUrbanArea, resolveSizeReference, type PlaceDirectory,
} from "./hard-constraints-resolve.ts";
import type {
  NormalizedHardConstraints, PlaceMode, PlaceThreshold, SearchExplorationHint,
} from "./hard-constraints.ts";
import type { HardConstraints } from "./hard-constraint-schema.ts";

// LES RAYONS QUE LE PRODUIT S'EST INVENTÉS. Ils sortent du contrat dur : ils peuvent CADRER une
// recherche, jamais ÉLIMINER une commune ni produire un verdict opposable au lecteur.
const LEGACY_NEAR_PLACE_KM = 50;
const LEGACY_NEAR_SEA_KM = 30;

export function explorationHints(hc: HardConstraints | undefined | null): SearchExplorationHint[] {
  const c = hc ?? {};
  const out: SearchExplorationHint[] = [];
  if (c.nearPlace?.label && c.nearPlace.maxKm == null) {
    out.push({ kind: "near_place_radius", valueKm: LEGACY_NEAR_PLACE_KM, source: "legacy_default", confirmedByUser: false });
  }
  if (c.nearSea?.active && c.nearSea.maxKm == null) {
    out.push({ kind: "near_sea_radius", valueKm: LEGACY_NEAR_SEA_KM, source: "legacy_default", confirmedByUser: false });
  }
  return out;
}

// Un seuil PRÉSENT dans le projet vient toujours du parse, donc du texte du lecteur : les défauts
// (?? 50, ?? 30) étaient appliqués au RUNTIME et n'ont jamais été écrits dans hardConstraints. Il n'y a
// donc aucun « faux user » à démêler dans les projets historiques.
function thresholdFrom(maxKm: number | null | undefined): PlaceThreshold | null {
  return typeof maxKm === "number" && Number.isFinite(maxKm) && maxKm > 0
    ? { metric: "distance", maxKm, source: "user" }
    : null;
}

const MODES: PlaceMode[] = ["car", "walk", "bike"];

// LE TEMPS PRIME SUR LA DISTANCE quand les deux sont déclarés : « à 30 minutes, disons 20 km » est un
// lecteur qui se paraphrase, et le temps est ce qu'il a en tête. Le choix est écrit ici, pas laissé au
// hasard de l'ordre des `if`.
//
// ET LE MODE NE SE DEVINE PAS. Le parse est un LLM : il peut écrire « voiture » ou « transports ». Un mode
// que le noyau ne connaît pas est un mode ABSENT, qui rendra missing_parameter, et que le lecteur se verra
// demander. On ne se replie jamais sur la voiture « parce que c'est le plus fréquent ».
function nearPlaceThreshold(np: NonNullable<HardConstraints["nearPlace"]>): PlaceThreshold | null {
  const minutes = np.maxMinutes;
  if (typeof minutes === "number" && Number.isFinite(minutes) && minutes > 0) {
    const mode = MODES.includes(np.mode as PlaceMode) ? (np.mode as PlaceMode) : null;
    return { metric: "travel_time", maxMinutes: minutes, mode, direction: "to_reference", source: "user" };
  }
  return thresholdFrom(np.maxKm);
}

export function hydrateHardConstraints(
  hc: HardConstraints | undefined | null,
  dir: PlaceDirectory | null,
): NormalizedHardConstraints {
  const c = hc ?? {};
  const zone = resolveZoneAnchors(c.zones);
  const excl = resolveExclusions(c.excludeZones);
  // Le contexte de résolution entre dans l'inputHash : deux « Saint-Jean » dans deux départements
  // différents ne sont pas le même lieu.
  const input = { context: (c.departements ?? []).join(",") };

  // LES ANCRES DURES QUE LA TABLE NE CONNAÎT PAS. `resolveZoneAnchors.unknown` ne dit pas la FORCE du
  // jeton : une ancre souple inconnue ne doit pas rendre la contrainte dure non examinée (elle ne filtre
  // pas). On les recalcule donc ici, en ne gardant que les dures. Sans ce champ, un jeton non reconnu
  // DISPARAÎT, et la contrainte devient « non déclarée » ou « satisfaite » sans avoir été testée.
  const hardZoneAnchors = (c.zones ?? []).filter((z) => z?.strength === "hard");
  const unresolvedHardZones = hardZoneAnchors.filter((z) => !ZONE_TABLE[z.zone]).map((z) => z.zone);

  return {
    departements: c.departements?.length ? c.departements : null,
    zones:
      hardZoneAnchors.length > 0
        ? {
            hardDepartements: zone.hardDepartements ?? new Set<string>(),
            labels: zone.applied.filter((a) => a.strength === "hard").map((a) => a.label),
            unresolvedLabels: unresolvedHardZones,
          }
        : null,
    excludeZones:
      (c.excludeZones?.length ?? 0) > 0
        ? { departements: excl.departements, labels: excl.applied.map((a) => a.label), unresolvedLabels: excl.unknown }
        : null,
    montagne: c.montagne?.strength === "hard",
    reliefProche: c.reliefProche?.strength === "hard",
    nearSea: c.nearSea?.active ? { threshold: thresholdFrom(c.nearSea.maxKm) } : null,
    excludeSea: c.excludeSea === true,
    communeSize: c.communeSize ? { min: c.communeSize.min ?? null, max: c.communeSize.max ?? null } : null,
    nearPlace:
      c.nearPlace?.label && dir
        ? {
            label: c.nearPlace.label,
            threshold: nearPlaceThreshold(c.nearPlace),
            reference: resolveNearPlace(c.nearPlace.label, dir, input),
          }
        : null,
    excludePlace: dir
      ? (c.excludePlace ?? [])
          .filter((e) => e?.label)
          .map((e) => ({ label: e.label, reference: resolveUrbanArea(e.label, dir, input) }))
      : [],
    // sizeRelativeTo ne MUTE PLUS communeSize (matchProjects réécrivait hc.communeSize en douce) : les
    // deux contraintes coexistent, et le lecteur voit la sienne nommée.
    sizeRelativeTo:
      c.sizeRelativeTo?.label && dir
        ? {
            label: c.sizeRelativeTo.label,
            direction: c.sizeRelativeTo.direction,
            reference: resolveSizeReference(c.sizeRelativeTo.label, dir, input),
          }
        : null,
  };
}
