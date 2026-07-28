// Cache de la synthèse Logement traitée en ARTEFACT (cf. spec 1a). Deux fonctions pures :
// - buildFactHash : hash du CONTENU des faits (le payload EST le contrat : s'il change, le texte
//   doit changer ; s'il ne change pas, cache). La posture n'entre pas dans le payload -> ne
//   régénère jamais. Voit tout changement de fait ou de source amont modifiée
//   (board 2026-07-07, critique 2 : ne plus hasher l'IDENTITÉ).
// - buildSynthesisPayload : assemble les faits déjà montrés pour le prompt (-irep/friches).
//
// L'« AUTOUR » A QUITTÉ CE PAYLOAD le 29/07/2026, avec le module Autour de l'adresse. La règle qui
// gouverne ce fichier est que le payload ne contient QUE des faits affichés sous le texte : c'est
// ce qui autorise le prompt à dire « les blocs détaillés portent déjà chaque donnée » et interdit
// au modèle de sortir une donnée que le lecteur ne peut pas vérifier d'un coup d'œil. Depuis que
// l'entourage se lit dans son propre module, l'y laisser aurait fait commenter au texte Logement
// des équipements et des espaces verts qui ne s'affichent plus nulle part sur cette page.
// Pas de `server-only` : buildFactHash est aussi utilisé côté client pour le gating en session.

import { deriveThermalEvidence, thermalEvidenceSummary } from "./thermal-evidence.ts";
import { stableStringify } from "./stable-stringify.ts";
import type { DpeRecord } from "./dpe-attribution.ts";

export const SYNTHESIS_PROMPT_VERSION = "v8"; // v8 : sortie de l'« autour » — la lecture Logement s'arrête aux murs et à ce à quoi l'adresse est exposée ; l'entourage (équipements, espace vert, îlot de chaleur) est passé au module Autour de l'adresse, donc il quitte le payload ET le prompt. Bump = régénération de toutes les synthèses existantes, voulue : les anciennes commentent un entourage que la page n'affiche plus. // v7 : passe langage non-expert renforcée — le vocabulaire d'expert n'apparaît JAMAIS même glosé (« retrait-gonflement des argiles », « inertie », « conditions conventionnelles », « représentativité » interdits), test de la mère. // v6 : croisement Logement × Territoire — le climat projeté (gwl20/2050) éclaire une caractéristique du bâti sans jamais en être le sujet ni changer le diagnostic (il change le POIDS) ; poids narratif (le climat ne prend jamais l'enjeu principal, la sinistralité communale n'est jamais couronnée). MARQUEE-ONLY en v1 (notable rendu silencieux : répétition de charnière observée 8/8 à fréquence notable). Axe chaleur seul (sécheresse différée). Passe Editorial v2.

// Empreinte de CACHE déterministe (FNV-1a 32 bits), PAS un mécanisme de sécurité. Le risque de
// collision est négligeable à cette échelle ; l'intégrité des faits sera assurée par la
// reconstruction serveur du payload depuis l'artefact logement (dette acceptée, cf. board étape 3
// geste 1 différé), jamais par ce hash. Synchrone à dessein : le gating client se fait au rendu,
// une empreinte crypto asynchrone (WebCrypto) n'y aurait pas sa place.
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

// Signal climat projeté (gwl20 / 2050), curé et PRÉ-DIGÉRÉ en intensité qualitative : le modèle
// ne reçoit jamais de chiffre, seulement un code par axe. Dérivé serveur-only par
// `deriveClimatProjete` (drias-json), injecté dans `data` avant le hash. Axe chaleur seul en v1 ;
// `secheresse_sols` reste `null` (pas de seuil défendable sur SWI absolu, cf. décision porteur).
export type ClimatProjete = {
  horizon: "2050";
  chaleur: "marquee" | "notable" | null;
  secheresse_sols: "marquee" | "notable" | null;
};

// Forme d'entrée (sous-ensemble de ce que le client poste). Champs optionnels/défensifs.
export type SynthesisData = {
  address?: { label?: string | null } | null;
  altitude?: number | null;
  dpeSelectionStatus?: string | null;
  selectedDpe?: DpeRecord | null;
  georisques?: { parcel?: { risks?: { labels?: string[] }; pprn?: { labels?: string[] }; seismic?: { label?: string | null } | null; rga?: { label?: string | null } | null } | null } | null;
  sinistralite?: unknown;
  communeData?: { commune?: { nom?: string | null; population?: number | null } } | null;
  // Injecté serveur-only avant le hash (jamais posé par le client, qui ne peut pas lire le JSON
  // DRIAS). Conséquence : le hash client (sans climat) et le hash serveur (avec) DIVERGENT, mais
  // ils ne sont jamais comparés l'un à l'autre (le client dédup en local sur ses faits visibles,
  // le serveur clé son cache sur son propre hash). Divergence inoffensive, cf. route.
  climatProjete?: ClimatProjete | null;
  // irep / cartofriches / posture : volontairement ignorés. Les deux premiers ne sont interprétés par
  // aucun fait aujourd'hui (cf. le registre des sources dormantes) ; la posture n'est pas un fait.
  // autour : retiré en v8 — il appartient au module Autour de l'adresse (cf. en-tête).
};

const DPE_CONFIRMED = (s: string | null | undefined) =>
  s === "auto_confirmed" || s === "user_confirmed";

export function buildSynthesisPayload(data: SynthesisData): Record<string, unknown> {
  const dpe = DPE_CONFIRMED(data.dpeSelectionStatus) && data.selectedDpe;
  const parcel = data.georisques?.parcel;
  return {
    address: data.address?.label ?? null,
    altitude: data.altitude ?? null,
    // `?? null` sur chaque champ : le type promet `| null`, mais ces objets viennent d'un JSON de base
    // où une colonne absente donne `undefined`, que le type ne voit pas. Or stableStringify JETTE sur
    // undefined (il refuse de donner la même identité à `absent` et à `null`), et ce hash tourne AUSSI
    // dans le navigateur. On rend donc le payload total plutôt que de l'espérer. Chaîne inchangée
    // quand la valeur est présente : aucun artefact existant n'est invalidé.
    dpe: dpe
      ? {
          etiquette: data.selectedDpe!.etiquette_dpe ?? null,
          ges: data.selectedDpe!.etiquette_ges ?? null,
          conso: data.selectedDpe!.conso_ep_m2 ?? null,
          emissions: data.selectedDpe!.emission_ges_m2 ?? null,
          surface: data.selectedDpe!.surface_m2 ?? null,
          construction: data.selectedDpe!.annee_construction ?? null,
          type: data.selectedDpe!.type_batiment ?? null,
        }
      : null,
    confortEte: dpe ? thermalEvidenceSummary(deriveThermalEvidence(data.selectedDpe!)) : null,
    risks: [...(parcel?.risks?.labels ?? []), ...(parcel?.pprn?.labels ?? [])],
    seismic: parcel?.seismic?.label ?? null,
    rga: parcel?.rga?.label ?? null,
    sinistralite: data.sinistralite ?? null,
    commune: data.communeData?.commune
      ? {
          name: data.communeData.commune.nom ?? null,
          population: data.communeData.commune.population ?? null,
        }
      : null,
    // Signal climat curé (codes, aucun chiffre). null si commune hors DRIAS ou sous plancher.
    climat_projete: data.climatProjete ?? null,
  };
}
