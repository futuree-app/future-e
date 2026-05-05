import { NextResponse } from 'next/server';

const HUBEAU_BASE = 'https://hubeau.eaufrance.fr/api';
const FIELDS = [
  'date_prelevement',
  'conformite_limites_bact_prelevement',
  'conformite_limites_pc_prelevement',
  'code_parametre',
  'libelle_parametre',
  'resultat_numerique',
  'libelle_unite',
].join(',');

// Paramètres d'intérêt à mettre en avant
const PARAMS_OF_INTEREST: Record<string, { label: string; unit: string; threshold?: number; warn?: number }> = {
  '1340': { label: 'Nitrates', unit: 'mg/L', threshold: 50, warn: 25 },
  '1350': { label: 'Nitrites', unit: 'mg/L', threshold: 0.5 },
  '1313': { label: 'Plomb', unit: 'µg/L', threshold: 10 },
  '1388': { label: 'Arsenic', unit: 'µg/L', threshold: 10 },
  '6860': { label: 'Pesticides totaux', unit: 'µg/L', threshold: 0.5 },
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const insee = searchParams.get('insee');
  if (!insee) {
    return NextResponse.json({ error: 'Missing insee parameter.' }, { status: 400 });
  }

  const sixMonthsAgo = new Date(Date.now() - 183 * 86_400_000).toISOString().split('T')[0];
  const url = `${HUBEAU_BASE}/v1/qualite_eau_potable/resultats_dis?code_commune=${encodeURIComponent(insee)}&date_min_prelevement=${sixMonthsAgo}&fields=${FIELDS}&sort=desc&size=30`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) {
      return NextResponse.json({ error: `Upstream error ${res.status}` }, { status: res.status });
    }

    const data = (await res.json()) as {
      data?: Array<{
        date_prelevement?: string | null;
        conformite_limites_bact_prelevement?: string | null;
        conformite_limites_pc_prelevement?: string | null;
        code_parametre?: string | null;
        libelle_parametre?: string | null;
        resultat_numerique?: number | null;
        libelle_unite?: string | null;
      }>;
    };

    const records = data.data ?? [];
    if (!records.length) {
      return NextResponse.json({ empty: true });
    }

    const latest = records[0];
    const conformBacterio = latest.conformite_limites_bact_prelevement ?? null;
    const conformPhysicoChem = latest.conformite_limites_pc_prelevement ?? null;
    const lastSampleDate = latest.date_prelevement?.slice(0, 10) ?? null;

    // Extract key parameters
    const highlights: Array<{ label: string; value: number; unit: string; threshold?: number; warn?: number }> = [];
    for (const [code, meta] of Object.entries(PARAMS_OF_INTEREST)) {
      const rec = records.find(r => r.code_parametre === code);
      if (rec?.resultat_numerique != null) {
        highlights.push({ label: meta.label, value: rec.resultat_numerique, unit: meta.unit, threshold: meta.threshold, warn: meta.warn });
      }
    }

    return NextResponse.json(
      { conformBacterio, conformPhysicoChem, lastSampleDate, highlights },
      { headers: { 'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800' } },
    );
  } catch (err) {
    clearTimeout(timeout);
    const message = err instanceof Error ? err.message : 'Eau proxy failed.';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
