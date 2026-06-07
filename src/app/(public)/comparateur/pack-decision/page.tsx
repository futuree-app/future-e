import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import Navbar from "@/components/Navbar";
import { createClient } from "@/lib/supabase/server";
import { resolvePackOwnership, grantDecisionPackFromSnapshot } from "@/lib/decision-packs";
import { matchProjects } from "@/lib/comparateur-vie";
import { PackConvictionView } from "./PackConvictionView";
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

export default async function PackDecisionPage({
  searchParams,
}: {
  searchParams: Promise<{ communes?: string; payment_intent?: string; redirect_status?: string }>;
}) {
  const { communes: rawCommunes, payment_intent: paymentIntent, redirect_status: redirectStatus } =
    await searchParams;
  const insees = parseCommunes(rawCommunes);
  // Sans trio exploitable, on renvoie au comparateur (le pack n'a pas de sens hors parcours).
  if (insees.length !== 3) redirect("/ou-vivre");

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
    // POSSÉDÉ : on calcule la comparaison complète + les pistes côté serveur,
    // depuis le snapshot acheté (reproductible). La matrice n'a jamais transité
    // par une API publique.
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

  // NON POSSÉDÉ : teaser. Le parsed du projet est lu côté client (localStorage),
  // et le compte est requis avant paiement (comme le 14 €).
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <Navbar />
      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 24px 120px" }}>
        <PackConvictionView
          insees={insees}
          userEmail={user?.email ?? null}
          returnUrl={`/comparateur/pack-decision?communes=${insees.join(",")}`}
        />
      </main>
    </div>
  );
}
