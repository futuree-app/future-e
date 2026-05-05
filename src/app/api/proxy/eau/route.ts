import { NextResponse } from 'next/server';

const UPSTREAM = 'https://hubeau.eaufrance.fr/api/v1/qualite_eau_potable/resultats_dis';
const FIELDS = 'date_prelevement,libelle_parametre,resultat_numerique,valeur_max_parametrique,libelle_conclusion_conformite_prelevement';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const insee = searchParams.get('insee');
  if (!insee) {
    return NextResponse.json({ error: 'Missing insee parameter.' }, { status: 400 });
  }

  const url = `${UPSTREAM}?code_commune=${encodeURIComponent(insee)}&size=20&sort=desc&fields=${FIELDS}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) {
      return NextResponse.json({ error: `Upstream error ${res.status}` }, { status: res.status });
    }
    const data = await res.json();
    return NextResponse.json(data, {
      headers: { 'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800' },
    });
  } catch (err) {
    clearTimeout(timeout);
    const message = err instanceof Error ? err.message : 'Eau proxy failed.';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
