// FUT-50 · LA CONFIRMATION D'UNE COMMUNE : son nom canonique, dès la sélection, sans attendre une priorité. DEV.
//
// Même résolution que les lectures (`communeCanonique`) : COG ultramarin embarqué (sans charger l'index métropolitain),
// puis Paris/Lyon/Marseille, puis l'index des communes. 400 si le code est malformé, 404 s'il est inconnu.
import { NextResponse } from "next/server";
import { FORMAT_INSEE, communeCanonique } from "@/components/prototypes/fut50/c/identite";

export async function GET(req: Request) {
  if (process.env.NODE_ENV === "production") return new NextResponse(null, { status: 404 });
  const insee = (new URL(req.url).searchParams.get("insee") ?? "").trim().toUpperCase();
  if (!FORMAT_INSEE.test(insee)) return NextResponse.json({ error: "requete_invalide" }, { status: 400 });
  const canon = await communeCanonique(insee);
  if (!canon) return NextResponse.json({ error: "commune_inconnue" }, { status: 404 });
  return NextResponse.json(canon, { headers: { "Cache-Control": "no-store" } });
}
