// Cache de la synthèse Logement traitée en ARTEFACT (cf. spec 1a). Deux fonctions pures :
// - buildFactHash : hash du CONTENU des faits (le payload EST le contrat : s'il change, le texte
//   doit changer ; s'il ne change pas, cache). La posture n'entre pas dans le payload -> ne
//   régénère jamais. Voit tout changement de fait, y compris l'arrivée tardive de l'« autour »
//   ou une source amont modifiée (board 2026-07-07, critique 2 : ne plus hasher l'IDENTITÉ).
// - buildSynthesisPayload : assemble les faits déjà montrés pour le prompt (+autour, -irep/friches).
// Pas de `server-only` : buildFactHash est aussi utilisé côté client pour le gating en session.

import { deriveThermalEvidence, thermalEvidenceSummary } from "./thermal-evidence.ts";
import type { DpeRecord } from "./dpe-attribution.ts";

export const SYNTHESIS_PROMPT_VERSION = "v1";

// Sérialisation stable (clés triées récursivement) : deux payloads égaux -> même chaîne, quel que
// soit l'ordre d'insertion des clés. Base du hash de contenu.
function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value) ?? "null";
  if (Array.isArray(value)) return "[" + value.map(stableStringify).join(",") + "]";
  const obj = value as Record<string, unknown>;
  return "{" + Object.keys(obj).sort()
    .map((k) => JSON.stringify(k) + ":" + stableStringify(obj[k])).join(",") + "}";
}

// Empreinte 32 bits déterministe (FNV-1a). Suffisant pour une clé de cache / un détecteur de
// changement : l'intégrité des faits est assurée côté serveur, pas par ce hash (le hash n'est
// pas une frontière de sécurité). Synchrone à dessein : le gating client se fait au rendu, une
// empreinte crypto asynchrone (WebCrypto) n'y aurait pas sa place.
function fnv1a(str: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}

// Hash de CONTENU : empreinte du payload de synthèse sérialisé + version du prompt. Sert de clé
// de cache serveur ET de gate en session. Remplace l'ancien hash d'identité
// (lat:lon:dpeId:sourcesVersion) qui manquait les changements amont, figeait une synthèse générée
// sans l'« autour », et couplait par erreur la version des sources Face 3 (bump Face 3 =
// invalidation surprise de toutes les synthèses).
export function buildFactHash(data: SynthesisData): string {
  return `syn:${SYNTHESIS_PROMPT_VERSION}:${fnv1a(stableStringify(buildSynthesisPayload(data)))}`;
}

// Forme d'entrée (sous-ensemble de ce que le client poste). Champs optionnels/défensifs.
export type SynthesisData = {
  address?: { label?: string | null } | null;
  altitude?: number | null;
  dpeSelectionStatus?: string | null;
  selectedDpe?: DpeRecord | null;
  georisques?: { parcel?: { risks?: { labels?: string[] }; pprn?: { labels?: string[] }; seismic?: { label?: string | null } | null; rga?: { label?: string | null } | null } | null } | null;
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
