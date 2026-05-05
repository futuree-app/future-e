import { NextResponse } from 'next/server';

const UPSTREAM = 'https://api.recosante.beta.gouv.fr/v1/indice_atmo/';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const insee = searchParams.get('insee');
  if (!insee) {
    return NextResponse.json({ error: 'Missing insee parameter.' }, { status: 400 });
  }

  const today = new Date().toISOString().slice(0, 10);
  const url = `${UPSTREAM}?insee=${encodeURIComponent(insee)}&date=${today}`;
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
      headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200' },
    });
  } catch (err) {
    clearTimeout(timeout);
    const message = err instanceof Error ? err.message : 'ATMO proxy failed.';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
