import { NextResponse } from 'next/server';
import { estCodeInsee } from '@/lib/sites-sols';
import { getSitesSolsCommune } from '@/lib/server/sites-sols';

// Les quatre inventaires « sites et sols » d'une commune (FUT-152). Chaque catégorie porte son état
// (`disponible`, `partiel`, `absent_dans_source`, `indisponible`) : la route répond 200 même quand une
// catégorie est en panne, et 502 seulement quand AUCUNE n'a pu être lue. Une réponse en panne n'est pas
// mise en cache.
export async function GET(request: Request) {
  const insee = new URL(request.url).searchParams.get('insee') ?? '';
  if (!estCodeInsee(insee)) {
    return NextResponse.json({ error: 'Code INSEE invalide.' }, { status: 400 });
  }

  const data = await getSitesSolsCommune(insee);
  const etats = [data.sis.etat, data.instructions.etat, data.sup.etat, data.casias.etat];
  if (etats.every((e) => e === 'indisponible')) {
    return NextResponse.json({ error: 'Géorisques indisponible.' }, { status: 502 });
  }
  const complet = !etats.includes('indisponible');
  return NextResponse.json(data, {
    headers: { 'Cache-Control': complet ? 'public, s-maxage=86400, stale-while-revalidate=604800' : 'no-store' },
  });
}
