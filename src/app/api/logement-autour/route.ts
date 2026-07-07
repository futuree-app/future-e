import { after } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getCurrentUserAccount, requireCurrentUser } from "@/lib/user-account";
import { canAccessCompleteReport } from "@/lib/access";
import { canAnalyzeCommune } from "@/lib/active-territory";
import { loadBpePointsAround, nearestByCategory } from "@/lib/logement-bpe";
import { getTileGeoms, computeOsmProximity, OSM_BBOX_RADIUS_M } from "@/lib/logement-osm";
import { assembleSnapshot } from "@/lib/logement-autour";
import { getLogement, upsertLogement, needsRecompute, SOURCES_VERSION } from "@/lib/logement-store";
import type { Posture } from "@/lib/logement-autour-types";

export const dynamic = "force-dynamic";

// Client service-role pour le cache de tuile partagé (bypasse la RLS, écrit une donnée
// mutualisée entre utilisateurs). Jamais exposé au client.
const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

type Body = {
  logement_id: string;
  insee: string;
  latitude: number;
  longitude: number;
  address_label: string;
  parcel_code?: string | null;
  posture?: Posture;
};

export async function POST(req: Request) {
  const account = await getCurrentUserAccount();
  if (!canAccessCompleteReport(account)) {
    return Response.json({ error: "forbidden" }, { status: 403 });
  }
  const { supabase, user } = await requireCurrentUser();

  const body = (await req.json()) as Body;
  if (!body?.logement_id || !body.insee || typeof body.latitude !== "number" || typeof body.longitude !== "number") {
    return Response.json({ error: "logement_id/insee/latitude/longitude requis" }, { status: 400 });
  }
  // Frontière de monétisation (étape 4.5) : commune de l'adresse lisible par l'utilisateur.
  if (!(await canAnalyzeCommune(supabase, user.id, body.insee))) {
    return Response.json({ error: "COMMUNE_NOT_UNLOCKED", code: "COMMUNE_NOT_UNLOCKED", insee: body.insee }, { status: 403 });
  }
  const center = { lat: body.latitude, lon: body.longitude };
  const posture: Posture = body.posture === "prospection" ? "prospection" : "residence";

  // Snapshot déjà valide en base (même adresse, même version) -> le renvoyer figé.
  const existing = await getLogement(supabase, user.id, body.logement_id);
  if (existing && !needsRecompute(existing, center, SOURCES_VERSION)) {
    // La posture peut avoir changé (sonde ProjectProbe) sans invalider le calcul.
    if (existing.posture !== posture) {
      await upsertLogement(supabase, { ...existing, posture });
    }
    return Response.json({ snapshot: existing.snapshot });
  }

  // BPE : local, immédiat.
  const bpe = nearestByCategory(center, await loadBpePointsAround(center));

  // OSM : cache de cellule (service-role) ; si froid, tentative inline sous timeout court.
  let osm = null;
  let osmStatus: "complete" | "pending" | "failed" = "pending";
  try {
    const tile = await Promise.race([
      getTileGeoms(admin, center),
      new Promise<{ geoms: never[]; status: "pending" }>((res) =>
        setTimeout(() => res({ geoms: [], status: "pending" }), 3500),
      ),
    ]);
    if (tile.status === "complete") {
      osm = computeOsmProximity(center, tile.geoms, OSM_BBOX_RADIUS_M);
      osmStatus = "complete";
    } else if (tile.status === "failed") {
      osmStatus = "failed";
    } else {
      // Timeout : poursuivre le remplissage du cache après réponse (tuile chaude au retry).
      after(async () => {
        await getTileGeoms(admin, center).catch(() => {});
      });
    }
  } catch {
    osmStatus = "failed";
  }

  const snapshot = assembleSnapshot(center, bpe, osm, osmStatus);
  await upsertLogement(supabase, {
    user_id: user.id,
    logement_id: body.logement_id,
    insee: body.insee,
    address_label: body.address_label,
    latitude: body.latitude,
    longitude: body.longitude,
    parcel_code: body.parcel_code ?? null,
    posture,
    snapshot,
  });

  return Response.json({ snapshot });
}
