"use client";

import posthog from "posthog-js";
import { PostHogProvider as PHProvider } from "posthog-js/react";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useSyncExternalStore, Suspense } from "react";
import { createClient } from "@/lib/supabase/client";
import { definirCompte, identiteConnue, mesureActive, souscrireMesure, synchroniserMesure } from "@/lib/mesure-audience";
import { CLE_CONSENTEMENT_MESURE, EVENEMENT_CHANGEMENT_CONSENTEMENT } from "@/lib/mesure-audience-regles";

// FUT-181 : PostHog ne démarre qu'avec le consentement (`@/lib/mesure-audience`). Ce composant ne
// fait que brancher ce module sur la page : le choix de la bannière, les autres onglets, la session.

const sansMesureCoteServeur = () => false;
// Mesure active ET session relue : l'identité du $pageview est alors la bonne (cf. `identiteConnue`).
const pretAMesurer = () => mesureActive() && identiteConnue();

function PostHogPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const active = useSyncExternalStore(souscrireMesure, pretAMesurer, sansMesureCoteServeur);

  // Une vue par navigation, et seulement mesure active : la page où l'on accepte est comptée à
  // partir de l'acceptation, jamais avant. L'URL est réduite par `before_send` (paramètres retirés).
  useEffect(() => {
    if (!pathname || !active) return;
    const url = searchParams.toString() ? `${pathname}?${searchParams.toString()}` : pathname;
    posthog.capture("$pageview", { $current_url: url });
  }, [pathname, searchParams, active]);

  return null;
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // L'état du choix au chargement : démarre si « granted », sinon efface les traces éventuelles.
    synchroniserMesure();

    const surChoix = () => synchroniserMesure();
    // Un autre onglet a accepté, refusé ou rouvert la bannière (`null` : stockage vidé).
    const surStockage = (e: StorageEvent) => {
      if (e.key === null || e.key === CLE_CONSENTEMENT_MESURE) synchroniserMesure();
    };
    window.addEventListener(EVENEMENT_CHANGEMENT_CONSENTEMENT, surChoix);
    window.addEventListener("storage", surStockage);
    return () => {
      window.removeEventListener(EVENEMENT_CHANGEMENT_CONSENTEMENT, surChoix);
      window.removeEventListener("storage", surStockage);
    };
  }, []);

  useEffect(() => {
    // Le compte connecté, transmis au module qui décide seul s'il peut l'identifier (consentement)
    // et avec quoi (l'UUID Supabase, jamais l'e-mail).
    // Une session illisible vaut « aucun compte » : au pire, l'identité de mesure repart à neuf.
    let supabase: ReturnType<typeof createClient>;
    try {
      supabase = createClient();
    } catch {
      definirCompte(null);
      return;
    }
    supabase.auth.getUser().then(
      ({ data: { user } }) => definirCompte(user?.id ?? null),
      () => definirCompte(null),
    );
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") definirCompte(null);
      else if (session?.user) definirCompte(session.user.id);
    });
    return () => subscription.unsubscribe();
  }, []);

  return (
    <PHProvider client={posthog}>
      <Suspense fallback={null}>
        <PostHogPageView />
      </Suspense>
      {children}
    </PHProvider>
  );
}
