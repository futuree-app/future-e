import { NextResponse } from 'next/server';
import { IREP_RAYON_PAGE_M } from '@/lib/data/irep-registre';
import { getIrepAutour } from '@/lib/server/irep-registre';

// Les établissements du registre IREP dans un rayon fixe autour d'un point (FUT-152). Le rayon n'est pas
// un paramètre : c'est le périmètre affiché au lecteur. Index local : 502 seulement si le fichier est illisible.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = Number(searchParams.get('lat'));
  const lon = Number(searchParams.get('lon'));
  if (!searchParams.get('lat') || !searchParams.get('lon') || !Number.isFinite(lat) || !Number.isFinite(lon)
    || Math.abs(lat) > 90 || Math.abs(lon) > 180) {
    return NextResponse.json({ error: 'Paramètres lat/lon invalides.' }, { status: 400 });
  }

  const data = await getIrepAutour(lat, lon, IREP_RAYON_PAGE_M);
  if (data.etat === 'indisponible') {
    return NextResponse.json({ error: 'Registre IREP illisible.' }, { status: 502 });
  }
  return NextResponse.json(data, {
    headers: { 'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800' },
  });
}
