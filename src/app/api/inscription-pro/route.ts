import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  const { profession, email, cabinet, besoin } = await request.json();

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

  return NextResponse.json({ ok: true });
}
