// ════════════════════════════════════════════════════════════════════════════════════════════
// LA LECTURE ENRICHIE DU MODULE TERRITOIRE (FUT-6, 28/09/2026).
//
// Cette route ne lit AUCUNE source. Elle relit le `FactsSnapshot` que la page a rendu et persisté,
// par son empreinte, et produit (ou sert) la synthèse de CE snapshot. Les cartes et le texte
// partent donc de la même photo des données (D10).
//
//   GET  ?snapshot=…&horizon=…  → l'état : prête (texte validé), en préparation, ou absente.
//   POST { snapshotHash, horizon } → sert le cache, ou lance la génération si personne ne la prépare.
//   Seul un POST qui va réellement générer est compté dans la limite par adresse.
//
// La synthèse est GÉNÉRIQUE : aucune donnée de lecteur n'entre dans le texte ni dans la clé de cache.
// Le texte n'est jamais streamé : il n'est rendu qu'une fois contrôlé (D8). Le budget du modèle se
// réserve seulement quand une génération part vraiment (cf. realEnsureDeps).
// ════════════════════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { getCurrentSessionUser } from "@/lib/user-account";
import { canAccessTerritory } from "@/lib/active-territory";
import { limiteParAdresse } from "@/lib/server/garde-appels-modele";
import { isHorizonKey } from "@/lib/territoire/synthesis-contract";
import { synthesisCacheKey } from "@/lib/territoire/synthesis-cache";
import { ensureTerritoireSynthesis } from "@/lib/territoire/synthesis-ensure";
import { realEnsureDeps } from "@/lib/server/territoire-snapshot";

export const runtime = "nodejs";
// Deux générations au plus (première tentative + une régénération), chacune ~15 à 25 s.
export const maxDuration = 120;

const HASH = /^[0-9a-f]{64}$/;

async function snapshotFor(req: { hash: unknown; horizon: unknown }) {
  if (typeof req.hash !== "string" || !HASH.test(req.hash) || !isHorizonKey(req.horizon)) {
    return { error: NextResponse.json({ error: "snapshot ou horizon invalide" }, { status: 400 }) } as const;
  }
  const { supabase, user } = await getCurrentSessionUser();
  if (!user) return { error: NextResponse.json({ error: "unauthorized" }, { status: 401 }) } as const;
  const deps = realEnsureDeps();
  if (!deps) return { error: NextResponse.json({ status: "unavailable" }, { status: 503 }) } as const;
  const snapshot = await deps.store.readSnapshot(req.hash);
  if (!snapshot) return { error: NextResponse.json({ error: "snapshot inconnu" }, { status: 404 }) } as const;
  // LE DROIT SE DEMANDE SUR LA COMMUNE DU SNAPSHOT, jamais sur une commune envoyée par le client.
  if (!(await canAccessTerritory(supabase, user.id, snapshot.scope.id))) {
    return { error: NextResponse.json({ error: "forbidden" }, { status: 403 }) } as const;
  }
  return { snapshot, deps, horizon: req.horizon } as const;
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const r = await snapshotFor({ hash: url.searchParams.get("snapshot"), horizon: url.searchParams.get("horizon") });
  if ("error" in r) return r.error;
  const stored = await r.deps.store.readSynthesis(synthesisCacheKey(r.snapshot.hash, r.horizon), new Date());
  if (!stored) return NextResponse.json({ status: "absent" });
  return NextResponse.json(stored.status === "ready" ? { status: "ready", text: stored.text, origin: stored.origin } : { status: "pending" });
}

export async function POST(req: NextRequest) {
  let body: { snapshotHash?: unknown; horizon?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corps invalide." }, { status: 400 });
  }
  const r = await snapshotFor({ hash: body.snapshotHash, horizon: body.horizon });
  if ("error" in r) return r.error;

  // LE CACHE D'ABORD, GRATUITEMENT (correction du 28/09). Une synthèse prête, ou déjà en préparation,
  // ne coûte rien : elle ne doit pas consommer la limite par adresse. Sans cela, un lecteur qui
  // passait de 2030 à 2050 puis à 2100 se faisait bloquer sans qu'aucun modèle ne soit appelé.
  const stored = await r.deps.store.readSynthesis(synthesisCacheKey(r.snapshot.hash, r.horizon), new Date());
  if (stored?.status === "ready") return NextResponse.json({ status: "ready", text: stored.text, origin: stored.origin });
  if (stored?.status === "pending") return NextResponse.json({ status: "pending" });

  // LA LIMITE PAR ADRESSE, seulement quand une génération pourrait vraiment partir. Le budget, lui, se
  // réserve ensuite, avant CHAQUE appel au modèle (cf. produceSynthesis).
  const tropVite = limiteParAdresse(req);
  if (tropVite) return tropVite;

  const result = await ensureTerritoireSynthesis(r.snapshot, r.horizon, r.deps);
  if (result.status === "ready") return NextResponse.json({ status: "ready", text: result.text, origin: result.origin });
  if (result.status === "pending") return NextResponse.json({ status: "pending" });
  return NextResponse.json({ status: "unavailable", reason: result.reason }, { status: 503 });
}
