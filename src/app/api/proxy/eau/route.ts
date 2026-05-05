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

const PARAMS_OF_INTEREST: Record<string, { label: string; unit: string; threshold?: number; warn?: number }> = {
  '1340': { label: 'Nitrates', unit: 'mg/L', threshold: 50, warn: 25 },
  '1350': { label: 'Nitrites', unit: 'mg/L', threshold: 0.5 },
  '1313': { label: 'Plomb', unit: 'µg/L', threshold: 10 },
  '1388': { label: 'Arsenic', unit: 'µg/L', threshold: 10 },
  '6860': { label: 'Pesticides totaux', unit: 'µg/L', threshold: 0.5 },
};

type EauRecord = {
  date_prelevement?: string | null;
  conformite_limites_bact_prelevement?: string | null;
  conformite_limites_pc_prelevement?: string | null;
  code_parametre?: string | null;
  libelle_parametre?: string | null;
  resultat_numerique?: number | null;
  libelle_unite?: string | null;
};

function parseConformity(val: string | null | undefined): string | null {
  if (!val) return null;
  const v = val.toLowerCase().trim();
  if (v === 'c' || v === 'conforme') return 'Conforme';
  if (v === 'n' || v.startsWith('non')) return 'Non conforme';
  // Valeurs Hub'Eau connues à ignorer (paramètre non concerné)
  if (v.includes('concerné') || v.includes('reference') || v === 'd') return null;
  return null;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const insee = searchParams.get('insee');
  if (!insee) {
    return NextResponse.json({ error: 'Missing insee parameter.' }, { status: 400 });
  }

  const sixMonthsAgo = new Date(Date.now() - 183 * 86_400_000).toISOString().split('T')[0];
  const url = `${HUBEAU_BASE}/v1/qualite_eau_potable/resultats_dis?code_commune=${encodeURIComponent(insee)}&date_min_prelevement=${sixMonthsAgo}&fields=${FIELDS}&sort=desc&size=50`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) {
      return NextResponse.json({ error: `Upstream error ${res.status}` }, { status: res.status });
    }

    const data = (await res.json()) as { data?: EauRecord[] };
    const records = data.data ?? [];
    if (!records.length) {
      return NextResponse.json({ empty: true });
    }

    // Date du dernier prélèvement
    const lastSampleDate = records[0].date_prelevement?.slice(0, 10) ?? null;

    // Conformité : chercher le premier record avec une valeur exploitable
    let conformBacterio: string | null = null;
    let conformPhysicoChem: string | null = null;
    for (const r of records) {
      if (conformBacterio === null) {
        conformBacterio = parseConformity(r.conformite_limites_bact_prelevement);
      }
      if (conformPhysicoChem === null) {
        conformPhysicoChem = parseConformity(r.conformite_limites_pc_prelevement);
      }
      if (conformBacterio !== null && conformPhysicoChem !== null) break;
    }

    // Paramètres-clés
    const highlights: Array<{ label: string; value: number; unit: string; threshold?: number; warn?: number }> = [];
    for (const [code, paramMeta] of Object.entries(PARAMS_OF_INTEREST)) {
      const rec = records.find(r => r.code_parametre === code && r.resultat_numerique != null);
      if (rec?.resultat_numerique != null) {
        highlights.push({ label: paramMeta.label, value: rec.resultat_numerique, unit: paramMeta.unit, threshold: paramMeta.threshold, warn: paramMeta.warn });
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
