// FUT-50 · L'IDENTITÉ PUBLIQUE D'UNE COMMUNE, DÈS SA CONFIRMATION SUR L'ACCUEIL.
//
// GET /api/accueil/commune?insee=97411 → { insee: "97411", nom: "Saint-Denis (La Réunion)" }
// COG ultramarin, puis Paris/Lyon/Marseille, puis les données légères de l'accueil : jamais l'index du comparateur,
// jamais un nom envoyé par le navigateur. 400 si le code est malformé, 404 s'il est inconnu.
import { NextResponse } from "next/server";
import { FORMAT_INSEE, communeCanonique } from "@/lib/accueil/lecture-accueil";
import { politiqueCache, PARAMETRES_COMMUNE } from "@/lib/accueil/cache-accueil";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const u = new URL(req.url);
  const insee = (u.searchParams.get("insee") ?? "").trim().toUpperCase();
  const canon = FORMAT_INSEE.test(insee) ? await communeCanonique(insee) : null;
  const statut = !FORMAT_INSEE.test(insee) ? 400 : canon ? 200 : 404;
  const cache = politiqueCache({ statut }, u.searchParams.keys(), PARAMETRES_COMMUNE);
  const headers = { "Cache-Control": cache.cacheControl, "X-Accueil-Cache": cache.raison };
  if (statut !== 200) return NextResponse.json({ error: statut === 400 ? "requete_invalide" : "commune_inconnue" }, { status: statut, headers });
  return NextResponse.json(canon, { headers });
}
