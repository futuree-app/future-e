import { NextResponse } from "next/server";
import { lireAtmoCommune } from "@/lib/atmo";
import { estCodeInsee } from "@/lib/sites-sols";

// L'indice ATMO du jour (FUT-152) : 200 avec l'indice, 404 quand la source n'en publie pas pour la commune,
// 502 quand elle ne répond pas. Les deux derniers cas ne se confondent plus : une panne était présentée au
// lecteur comme une couverture régionale incomplète.
// UN INDICE SE GARDE AU PLUS 20 MINUTES (revue du 29/10/2026) : 15 minutes fraîches, puis 5 minutes servies
// pendant qu'on relit la source. ATMO publie une fois par jour, en début d'après-midi, l'indice du jour et
// celui du lendemain, et peut le corriger dans la journée. L'ancien `stale-while-revalidate=86400` pouvait
// servir l'indice de la veille jusqu'à 25 h. Une absence et une panne ne sont jamais gardées.
const ATMO_CACHE_CONTROL = "public, s-maxage=900, stale-while-revalidate=300";

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
    return NextResponse.json({ etat: lecture.etat }, { status: 502, headers: { "Cache-Control": "no-store" } });
  }
  if (lecture.etat === "absent_dans_source") {
    return NextResponse.json({ etat: lecture.etat }, { status: 404, headers: { "Cache-Control": "no-store" } });
  }
  return NextResponse.json(lecture.indice, { headers: { "Cache-Control": ATMO_CACHE_CONTROL } });
}
