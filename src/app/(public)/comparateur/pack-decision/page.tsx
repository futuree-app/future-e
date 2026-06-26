import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import Navbar from "@/components/Navbar";
import { createClient } from "@/lib/supabase/server";
import { resolvePackOwnership, grantDecisionPackFromSnapshot } from "@/lib/decision-packs";
import { matchProjects, seedComparaison, truncateComparaison } from "@/lib/comparateur-vie";
import { PackConvictionView } from "./PackConvictionView";
import { ChoixConvictionView } from "./ChoixConvictionView";
import { PackUnlockedView } from "./PackUnlockedView";

export const metadata: Metadata = {
  title: "Pack Décision · futur•e",
  robots: { index: false, follow: false },
};

function parseCommunes(raw: string | undefined): string[] {
  if (typeof raw !== "string") return [];
  return raw
    .split(",")
    .map((s) => s.trim().toUpperCase())
    .filter((s) => /^[0-9AB][0-9]{4}$/i.test(s))
    .slice(0, 3);
}

// Suffixe de query préservant communes + mode, pour les URL de retour (Stripe/auth).
function packQuery(insees: string[], mode: "replay" | "choix"): string {
  const base = `communes=${insees.join(",")}`;
  return mode === "choix" ? `${base}&mode=choix` : base;
}

async function getBaseUrl() {
  const headerStore = await headers();
  const forwardedProto = headerStore.get("x-forwarded-proto");
  const forwardedHost = headerStore.get("x-forwarded-host");
  const host = forwardedHost || headerStore.get("host");
  const envBaseUrl = process.env.NEXT_PUBLIC_SITE_URL;
  const productionHost =
    process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;

  if (host && !host.includes("localhost")) {
    return `${forwardedProto || "https"}://${host}`;
  }

  if (productionHost) {
    return `https://${productionHost}`;
  }

  if (envBaseUrl && !envBaseUrl.includes("localhost")) {
    return envBaseUrl;
  }

  if (host) {
    return `${forwardedProto || "http"}://${host}`;
  }

  return envBaseUrl || "http://localhost:3000";
}

export default async function PackDecisionPage({
  searchParams,
}: {
  searchParams: Promise<{ communes?: string; mode?: string; payment_intent?: string; redirect_status?: string }>;
}) {
  const { communes: rawCommunes, mode: rawMode, payment_intent: paymentIntent, redirect_status: redirectStatus } =
    await searchParams;
  const insees = parseCommunes(rawCommunes);
  // mode demandé par l'URL (porte choix) ; le mode RÉEL d'un pack possédé prime (pack.mode).
  const requestedMode: "replay" | "choix" = rawMode === "choix" ? "choix" : "replay";
  // Replay exige un trio ; choix se contente de 2 communes. Sinon retour au comparateur.
  const minCommunes = requestedMode === "choix" ? 2 : 3;
  if (insees.length < minCommunes) redirect(requestedMode === "choix" ? "/comparateur" : "/ou-vivre");

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Retour de Stripe : confirmPayment redirige ici avec ?payment_intent. On octroie
  // le pack de façon optimiste (idempotent avec le webhook) AVANT le contrôle de
  // possession, pour afficher le complet sans attendre le webhook. Sécurité : la
  // fonction vérifie que le snapshot appartient bien à l'utilisateur courant.
  if (user && paymentIntent && redirectStatus === "succeeded") {
    const admin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );
    await grantDecisionPackFromSnapshot(admin, paymentIntent, user.id, user.email ?? undefined);
  }

  const pack = user ? await resolvePackOwnership(supabase, user.id, insees) : null;

  if (pack) {
    // POSSÉDÉ : on reconstruit la matrice côté serveur, jamais via une API publique.
    // replay : on rejoue le projet acheté (parsed_snapshot). choix : on reconstruit
    // depuis les communes nommées (seedComparaison), sans projet et sans pistes.
    if (pack.mode === "choix" || !pack.parsedSnapshot) {
      const seeded = await seedComparaison(pack.insees);
      if (!seeded) redirect("/comparateur");
      return (
        <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
          <Navbar />
          <main style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 24px 120px" }}>
            <PackUnlockedView
              data={seeded.comparaison}
              trio={seeded.trio}
              pistes={[]}
              projetLabel={pack.projetLabel}
            />
          </main>
        </div>
      );
    }
    const outcome = await matchProjects(pack.parsedSnapshot);
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
        <Navbar />
        <main style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 24px 120px" }}>
          <PackUnlockedView
            data={outcome.comparaisonComplete}
            trio={outcome.results.slice(0, 3)}
            pistes={outcome.pistes}
            projetLabel={pack.projetLabel}
          />
        </main>
      </div>
    );
  }

  // NON POSSÉDÉ : teaser. Le compte est requis avant paiement (comme le 14 €).
  const returnPath = `/comparateur/pack-decision?${packQuery(insees, requestedMode)}`;
  const returnUrl = new URL(returnPath, await getBaseUrl()).toString();

  // CHOIX : aperçu calculé côté serveur (seedComparaison, pas de projet localStorage).
  if (requestedMode === "choix") {
    const seeded = await seedComparaison(insees);
    if (!seeded) redirect("/comparateur");
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
        <Navbar />
        <main style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 24px 120px" }}>
          <ChoixConvictionView
            trio={seeded.trio.map((r) => ({ insee: r.insee, nom: r.nom }))}
            apercu={truncateComparaison(seeded.comparaison)}
            userEmail={user?.email ?? null}
            returnUrl={returnUrl}
            returnPath={returnPath}
          />
        </main>
      </div>
    );
  }

  // REPLAY : le parsed du projet est lu côté client (localStorage).
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <Navbar />
      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 24px 120px" }}>
        <PackConvictionView
          insees={insees}
          userEmail={user?.email ?? null}
          returnUrl={returnUrl}
          returnPath={returnPath}
        />
      </main>
    </div>
  );
}
