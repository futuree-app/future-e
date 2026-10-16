// FUT-50 · LA CONFIRMATION D'UNE COMMUNE, POUR LE PROTOTYPE. DEV UNIQUEMENT : 404 en production.
//
// Le même service que la route publique `/api/accueil/commune` : COG ultramarin, Paris/Lyon/Marseille, puis les
// données légères de l'accueil (sans charger l'index du comparateur). 400 si le code est malformé, 404 s'il est
// inconnu.
import { NextResponse } from "next/server";
import { FORMAT_INSEE, communeCanonique } from "@/lib/accueil/lecture-accueil";

export async function GET(req: Request) {
  if (process.env.NODE_ENV === "production") return new NextResponse(null, { status: 404 });
  const insee = (new URL(req.url).searchParams.get("insee") ?? "").trim().toUpperCase();
  if (!FORMAT_INSEE.test(insee)) return NextResponse.json({ error: "requete_invalide" }, { status: 400 });
  const canon = await communeCanonique(insee);
  if (!canon) return NextResponse.json({ error: "commune_inconnue" }, { status: 404 });
  return NextResponse.json(canon, { headers: { "Cache-Control": "no-store" } });
}
