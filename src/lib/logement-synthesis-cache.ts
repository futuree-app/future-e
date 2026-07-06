// Cache de la synthèse Logement traitée en ARTEFACT (cf. spec 1a). Deux fonctions pures :
// - buildFactHash : clé stable des FAITS du logement (la posture n'y entre pas -> ne régénère jamais).
// - buildSynthesisPayload : assemble les faits déjà montrés pour le prompt (+autour, -irep/friches).
// Pas de `server-only` : buildFactHash est aussi utilisé côté client pour le gating en session.

import { deriveThermalEvidence, thermalEvidenceSummary } from "./thermal-evidence.ts";
import type { DpeRecord } from "./dpe-attribution.ts";

export const SYNTHESIS_PROMPT_VERSION = "v1";

// Clé de faits : point géocodé (arrondi ~1 m), DPE attribué, version des sources autour, version
// du prompt. Lisible et déterministe ; sert de clé de cache ET de gate en session.
export function buildFactHash(input: {
  latitude: number;
  longitude: number;
  dpeId: string | null;
  sourcesVersion: string;
  promptVersion: string;
}): string {
  const lat = input.latitude.toFixed(5);
  const lon = input.longitude.toFixed(5);
  const dpe = input.dpeId ?? "none";
  return `syn:${lat}:${lon}:${dpe}:${input.sourcesVersion}:${input.promptVersion}`;
}

// Forme d'entrée (sous-ensemble de ce que le client poste). Champs optionnels/défensifs.
export type SynthesisData = {
  address?: { label?: string | null } | null;
  altitude?: number | null;
  dpeSelectionStatus?: string | null;
  selectedDpe?: DpeRecord | null;
  georisques?: { parcel?: { risks?: { labels?: string[] }; pprn?: { labels?: string[] }; seismic?: { label?: string | null }; rga?: { label?: string | null } } } | null;
  sinistralite?: unknown;
  autour?: {
    bpe?: Array<{ category?: string; nearest?: { typeLabel?: string | null; distanceMeters?: number } | null }>;
    osm?: { nearestMappedGreenSpace?: { kind?: string | null; distanceMeters?: number } | null } | null;
  } | null;
  communeData?: { commune?: { nom?: string | null; population?: number | null } } | null;
  // irep / cartofriches / posture : volontairement ignorés (frontière Santé / posture ≠ fait).
};

const DPE_CONFIRMED = (s: string | null | undefined) =>
  s === "auto_confirmed" || s === "user_confirmed";

export function buildSynthesisPayload(data: SynthesisData): Record<string, unknown> {
  const dpe = DPE_CONFIRMED(data.dpeSelectionStatus) && data.selectedDpe;
  const parcel = data.georisques?.parcel;
  return {
    address: data.address?.label ?? null,
    altitude: data.altitude ?? null,
    dpe: dpe
      ? {
          etiquette: data.selectedDpe!.etiquette_dpe,
          ges: data.selectedDpe!.etiquette_ges,
          conso: data.selectedDpe!.conso_ep_m2,
          emissions: data.selectedDpe!.emission_ges_m2,
          surface: data.selectedDpe!.surface_m2,
          construction: data.selectedDpe!.annee_construction,
          type: data.selectedDpe!.type_batiment,
        }
      : null,
    confortEte: dpe ? thermalEvidenceSummary(deriveThermalEvidence(data.selectedDpe!)) : null,
    risks: [...(parcel?.risks?.labels ?? []), ...(parcel?.pprn?.labels ?? [])],
    seismic: parcel?.seismic?.label ?? null,
    rga: parcel?.rga?.label ?? null,
    sinistralite: data.sinistralite ?? null,
    autour: data.autour
      ? {
          proximites: (data.autour.bpe ?? [])
            .filter((b) => b.nearest)
            .map((b) => ({ categorie: b.category, type: b.nearest?.typeLabel ?? null, metres: b.nearest?.distanceMeters ?? null })),
          espaceVert: data.autour.osm?.nearestMappedGreenSpace
            ? { nature: data.autour.osm.nearestMappedGreenSpace.kind, metres: data.autour.osm.nearestMappedGreenSpace.distanceMeters }
            : null,
        }
      : null,
    commune: data.communeData?.commune
      ? { name: data.communeData.commune.nom, population: data.communeData.commune.population }
      : null,
  };
}
