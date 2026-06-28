// TEMPORAIRE — vérification manuelle de la dérivation d'ancre. Supprimée en fin de plan.
import { NextResponse, type NextRequest } from "next/server";
import {
  resolveCommuneByName,
  deriveAnchorPreferences,
  type IndexCommune,
} from "@/lib/comparateur-vie";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const labels = (req.nextUrl.searchParams.get("q") ?? "")
    .split(",").map((s) => s.trim()).filter(Boolean);
  const entries: IndexCommune[] = [];
  const unresolved: string[] = [];
  for (const l of labels) {
    const e = await resolveCommuneByName(l);
    if (e) entries.push(e); else unresolved.push(l);
  }
  return NextResponse.json({
    resolved: entries.map((e) => e.nom),
    unresolved,
    derivation: deriveAnchorPreferences(entries),
  });
}
