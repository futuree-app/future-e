// FUT-50 · VERSION C · LA LECTURE D'UNE PASTILLE, POUR LE PROTOTYPE. DEV UNIQUEMENT : 404 en production.
//
// GET ?insee=17300&cle=chaleur
// Le même service que la route publique `/api/accueil/lecture` (`src/lib/accueil/lecture-accueil.ts`), sur les
// mêmes données légères : le prototype voit exactement ce que verra l'accueil. Les paramètres `commune` et
// `libelle` que le prototype envoie encore ne sont jamais lus : l'identité vient du code.
import { NextResponse } from "next/server";
import { lireAccueil } from "@/lib/accueil/lecture-accueil";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (process.env.NODE_ENV === "production") return new NextResponse(null, { status: 404 });
  const u = new URL(req.url);
  const debut = Date.now();
  const r = await lireAccueil(u.searchParams.get("insee") ?? "", u.searchParams.get("cle") ?? "", {
    type: u.searchParams.get("type") === "adresse" ? "adresse" : "commune",
  });
  if (r.statut !== 200) return NextResponse.json({ error: r.erreur }, { status: r.statut });
  return NextResponse.json({ lecture: r.lecture, durable: r.durable, motif: r.motif, duree: Date.now() - debut }, { headers: { "Cache-Control": "no-store" } });
}
