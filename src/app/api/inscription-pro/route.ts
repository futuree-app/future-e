import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getPostHogClient } from '@/lib/posthog-server';
import { identifiantMesureConsenti } from '@/lib/posthog-identity';

export async function POST(request: Request) {
  const body = await request.json();
  const { profession, email, cabinet, besoin } = body;

  if (!profession || !email) {
    return NextResponse.json({ error: 'Champs requis manquants.' }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );

  const { error } = await supabase
    .from('pro_inscriptions')
    .insert({ profession, email: email.trim().toLowerCase(), cabinet: cabinet || null, besoin: besoin || null });

  if (error) {
    console.error('[inscription-pro]', error.message);
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 });
  }

  // FUT-181 : mesuré seulement avec le consentement du navigateur (identifiant de mesure transmis),
  // et sans rien de ce que la personne a écrit : ni l'e-mail (il servait d'identifiant), ni le nom du
  // cabinet, ni le besoin en texte libre. Tout cela reste dans `pro_inscriptions`, la seule trace utile.
  const distinctId = identifiantMesureConsenti(body.distinctId);
  if (distinctId) {
    const posthog = getPostHogClient();
    posthog.capture({
      distinctId,
      event: 'pro_inscription_submitted',
      properties: { profession, cabinet_renseigne: Boolean(cabinet), besoin_renseigne: Boolean(besoin) },
    });
    await posthog.shutdown();
  }

  return NextResponse.json({ ok: true });
}
