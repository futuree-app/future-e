// LE CACHE PARTAGÉ DES ARTEFACTS DE MOBILITÉ (table `reachability_artifact`).
//
// Une isochrone (polygone) ou un itinéraire (durée), sous le hash de sa demande. Deux lecteurs qui visent la
// même gare au même seuil lisent le MÊME objet, et l'API IGN (qui rate-limite) n'est pas rappelée. Il survit
// aux redémarrages, là où le cache mémoire du process meurt avec lui.
//
// CE QU'IL NE PROMET PAS : il ne déduplique pas deux premiers calculs strictement CONCURRENTS sur deux
// instances (il n'y a pas de verrou distribué ici). Il partage les RÉSULTATS, pas le premier calcul. Ne pas
// l'annoncer autrement.
//
// Il est INJECTÉ dans isochrone.ts et route-time.ts (patron de getTileGeoms(sb, …)) : ces modules restent
// ainsi testables sous node --test, sans client Supabase ni variables d'environnement.
//
// Écrit en service-role : le comparateur est ANONYME (aucun utilisateur pour porter une RLS).
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { PolygonGeometry } from "./geo-polygon.ts";

export type ArtifactMeta = {
  engine: string; // « ign-valhalla »
  resource: string; // « bdtopo-valhalla »
  integrationVersion: string; // NOTRE version (paramètres, parsing)
  engineVersion?: string | null; // le resourceVersion rendu par l'API, pour la traçabilité
};

export type ArtifactStore = {
  getIsochrone(hash: string): Promise<PolygonGeometry | null>;
  putIsochrone(hash: string, geometry: PolygonGeometry, meta: ArtifactMeta): Promise<void>;
  getMinutes(hash: string): Promise<number | null>;
  putMinutes(hash: string, minutes: number, meta: ArtifactMeta): Promise<void>;
};

// Le graphe routier évolue : un artefact n'est pas éternel. 30 jours, pour l'isochrone comme pour la durée.
const TTL_DAYS = 30;

function expiresAt(): string {
  return new Date(Date.now() + TTL_DAYS * 24 * 60 * 60 * 1000).toISOString();
}

// UNE VALEUR LUE EN BASE SE VÉRIFIE. Une durée nulle, négative ou non finie n'est pas une durée : on la
// refuse et on recalcule, plutôt que de servir au lecteur un temps qui ne veut rien dire.
function minutesValides(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) && v > 0 ? v : null;
}

function geometrieValide(v: unknown): PolygonGeometry | null {
  const g = v as PolygonGeometry | null;
  if (!g || (g.type !== "Polygon" && g.type !== "MultiPolygon")) return null;
  if (!Array.isArray(g.coordinates) || g.coordinates.length === 0) return null;
  return g;
}

function store(sb: SupabaseClient): ArtifactStore {
  // Une erreur de CACHE ne fait jamais tomber une recherche : au pire, on rappelle l'API.
  const lire = async (kind: "isochrone" | "route", hash: string) => {
    try {
      const { data } = await sb
        .from("reachability_artifact")
        .select("geometry,minutes,expires_at")
        .eq("kind", kind)
        .eq("request_hash", hash)
        .maybeSingle();
      if (!data) return null;
      if (new Date(data.expires_at as string).getTime() < Date.now()) return null; // périmé : on recalcule
      return data;
    } catch {
      return null;
    }
  };

  const ecrire = async (row: Record<string, unknown>) => {
    try {
      await sb.from("reachability_artifact").upsert(row, { onConflict: "kind,request_hash" });
    } catch {
      /* le cache est un confort, pas une dépendance */
    }
  };

  return {
    async getIsochrone(hash) {
      const row = await lire("isochrone", hash);
      return row ? geometrieValide(row.geometry) : null;
    },
    async putIsochrone(hash, geometry, meta) {
      await ecrire({
        kind: "isochrone", request_hash: hash, geometry, minutes: null,
        engine: meta.engine, engine_version: meta.engineVersion ?? null, resource: meta.resource,
        integration_version: meta.integrationVersion, expires_at: expiresAt(),
      });
    },
    async getMinutes(hash) {
      const row = await lire("route", hash);
      return row ? minutesValides(row.minutes) : null;
    },
    async putMinutes(hash, minutes, meta) {
      if (minutesValides(minutes) == null) return; // on n'écrit pas une durée qui ne veut rien dire
      await ecrire({
        kind: "route", request_hash: hash, geometry: null, minutes,
        engine: meta.engine, engine_version: meta.engineVersion ?? null, resource: meta.resource,
        integration_version: meta.integrationVersion, expires_at: expiresAt(),
      });
    },
  };
}

let cached: ArtifactStore | null | undefined;

// `null` sans clés (développement local, tests) : le cache mémoire suffit alors, et rien ne tombe.
export function reachabilityStore(): ArtifactStore | null {
  if (cached !== undefined) return cached;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  cached = url && key ? store(createClient(url, key, { auth: { persistSession: false } })) : null;
  return cached;
}
