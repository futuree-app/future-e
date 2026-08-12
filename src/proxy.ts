import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Required by @supabase/ssr: refreshes the access token before it expires
 * and propagates the updated session cookie to both request and response.
 * Without this, supabase.auth.getUser() returns null for expired sessions.
 */
/**
 * L'URL DEMANDÉE, RENDUE LISIBLE AUX SERVER COMPONENTS.
 *
 * Un layout ne reçoit ni les `params` ni les `searchParams` de la page qu'il enveloppe. Or
 * `AskFutureMount` vit dans le layout du compte, et il doit connaître le bien qu'on est en train de
 * lire : sans cela, ouvrir directement `/rapport/logement?dossierId=…` d'une autre commune affichait
 * la page nantaise sous un « Une question sur La Rochelle ? », et la question partait vers le
 * mauvais territoire (revue du 11/08/2026).
 *
 * Persister le contexte après montage ne pouvait pas corriger un arbre DÉJÀ rendu. Le chemin lui
 * est donc donné ici, une fois, pour tout le rendu serveur.
 */
export const HEADER_URL = "x-futuree-url";

export async function proxy(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(HEADER_URL, `${request.nextUrl.pathname}${request.nextUrl.search}`);

  let supabaseResponse = NextResponse.next({ request: { headers: requestHeaders } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request: { headers: requestHeaders } });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Validates and refreshes the JWT — do not remove
  await supabase.auth.getUser();

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
