import { NextResponse } from "next/server";
import { lireAtmoCommune } from "@/lib/atmo";
import { estCodeInsee } from "@/lib/sites-sols";

// L'indice ATMO du jour (FUT-152) : 200 avec l'indice, 404 quand la source n'en publie pas pour la commune,
// 502 quand elle ne répond pas. Les deux derniers cas ne se confondent plus : une panne était présentée au
// lecteur comme une couverture régionale incomplète.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ insee: string }> },
) {
  const { insee } = await params;
  if (!estCodeInsee(insee)) {
    return NextResponse.json({ error: "Code INSEE invalide." }, { status: 400 });
  }

  const lecture = await lireAtmoCommune(insee);
  if (lecture.etat === "indisponible") {
    return NextResponse.json({ etat: lecture.etat }, { status: 502 });
  }
  if (lecture.etat === "absent_dans_source") {
    return NextResponse.json({ etat: lecture.etat }, { status: 404, headers: { "Cache-Control": "no-store" } });
  }
  return NextResponse.json(lecture.indice, {
    headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" },
  });
}
