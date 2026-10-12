// FUT-75 · LE CONTRAT DE `/api/dossier/actualiser`, REJOUÉ SANS RIEN ÉCRIRE. DEV UNIQUEMENT : 404 en production.
// Mêmes réponses que la vraie route (main et FUT-10) : 200 abouti + version, 200 en_cours, 409, 503, 502.
// Elle sert l'aperçu du bouton Q1 dans `/dev/motion` : aucune génération, aucun accès aux données.
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
const REPONSES: Record<string, [number, Record<string, unknown>]> = {
  abouti: [200, { ok: true, statut: "abouti", version: 4 }],
  en_cours: [200, { ok: true, statut: "en_cours" }],
  projet: [409, { error: "PROJECT_MISSING" }],
  contexte: [503, { error: "PURCHASE_CONTEXT_UNAVAILABLE" }],
  generation: [502, { error: "GENERATION_FAILED" }],
};

export async function POST(req: Request) {
  if (process.env.NODE_ENV === "production") return new NextResponse(null, { status: 404 });
  const u = new URL(req.url);
  await new Promise((r) => setTimeout(r, Math.min(Math.max(Number(u.searchParams.get("delai")) || 0, 0), 15000)));
  const [status, corps] = REPONSES[u.searchParams.get("issue") ?? "abouti"] ?? REPONSES.abouti!;
  return NextResponse.json(corps, { status });
}
