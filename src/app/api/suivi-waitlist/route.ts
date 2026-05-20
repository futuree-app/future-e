import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  const { email, commune, motivation } = await request.json();

  if (!email || typeof email !== 'string') {
    return NextResponse.json({ error: 'Email requis.' }, { status: 400 });
  }

  const cleanEmail = email.trim().toLowerCase();
  const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail);
  if (!isValid) {
    return NextResponse.json({ error: 'Email invalide.' }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );

  const { error } = await supabase
    .from('suivi_waitlist')
    .upsert(
      {
        email: cleanEmail,
        commune: commune?.trim() || null,
        motivation: motivation?.trim() || null,
        source: 'suivi-bientot',
      },
      { onConflict: 'email' },
    );

  if (error) {
    console.error('[suivi-waitlist]', error.message);
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
