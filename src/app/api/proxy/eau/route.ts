import { NextResponse } from 'next/server';
import { getEauPotableCommune } from '@/lib/server/eau-potable';
import { communeParent } from '@/lib/plm';
import { estCodeInsee } from '@/lib/sites-sols';

// Le dernier contrôle sanitaire publié de chaque réseau d'eau potable de la commune (FUT-152). La lecture
// et ses états vivent dans `lib/eau-potable.ts`. Une source en panne répond 502, jamais une liste vide ;
// une lecture partielle n'est pas mise en cache.
export async function GET(request: Request) {
  const insee = new URL(request.url).searchParams.get('insee') ?? '';
  if (!estCodeInsee(insee)) {
    return NextResponse.json({ error: 'Code INSEE invalide.' }, { status: 400 });
  }

  // Hub'Eau publie Paris, Lyon et Marseille sous le code de la ville ; la zone de chaque réseau dit
  // quels arrondissements il dessert.
  const data = await getEauPotableCommune(communeParent(insee));
  if (data.etat === 'indisponible') {
    return NextResponse.json({ error: "Hub'Eau indisponible." }, { status: 502 });
  }
  return NextResponse.json(data, {
    headers: {
      'Cache-Control': data.etat === 'partiel' ? 'no-store' : 'public, s-maxage=86400, stale-while-revalidate=604800',
    },
  });
}
