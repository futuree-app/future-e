import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import Navbar from "@/components/Navbar";
import { createClient } from "@/lib/supabase/server";
import { resolvePackOwnership } from "@/lib/decision-packs";
import { getStripe } from "@/lib/stripe";
import { traiterRetourPaiementPack, type EtatRetourPack } from "@/lib/server/retour-paiement-pack";
import { PackPaiementEnAttente } from "./PackPaiementEnAttente";
import { rejouerPack, seedComparaison, truncateComparaison } from "@/lib/comparateur-vie";
import { avertissementPackAnterieur, AVERTISSEMENT_TRIO_RECOMPOSE } from "@/lib/comparateur/inondation-historique";
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
  // `redirect_status` n'est volontairement PAS lu (FUT-115) : un paramètre d'URL ne prouve aucun paiement.
  const { communes: rawCommunes, mode: rawMode, payment_intent: paymentIntent } = await searchParams;
  const insees = parseCommunes(rawCommunes);
  // mode demandé par l'URL (porte choix) ; le mode RÉEL d'un pack possédé prime (pack.mode).
  const requestedMode: "replay" | "choix" = rawMode === "choix" ? "choix" : "replay";
  // Replay exige un trio ; choix se contente de 2 communes. Sinon retour au comparateur.
  const minCommunes = requestedMode === "choix" ? 2 : 3;
  if (insees.length < minCommunes) redirect(requestedMode === "choix" ? "/comparateur" : "/ou-vivre");

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let pack = user ? await resolvePackOwnership(supabase, user.id, insees) : null;

  // ════════════════════════════════════════════════════════════════════════════════════════════════
  // RETOUR DE STRIPE (FUT-115). L'ancien code octroyait le comparatif dès que l'URL portait
  // `redirect_status=succeeded`, or l'instantané existe dès la CRÉATION du paiement et son identifiant
  // est dans le `clientSecret` remis au navigateur : recopier l'URL de retour suffisait. Désormais
  // `payment_intent` n'est qu'une clé : le serveur relit le paiement chez Stripe, et l'octroi exige la
  // preuve (statut, montant, devise, produit, compte, communes). Un comparatif déjà ouvert (webhook
  // arrivé, page rechargée) ne redemande rien à Stripe.
  // ════════════════════════════════════════════════════════════════════════════════════════════════
  let etatRetour: EtatRetourPack = "aucun";
  if (!pack && user && paymentIntent) {
    etatRetour = await traiterRetourPaiementPack(
      {
        lirePaiement: (id) => getStripe().paymentIntents.retrieve(id),
        admin: createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!),
      },
      paymentIntent,
      { id: user.id, email: user.email },
    );
    if (etatRetour === "octroye") pack = await resolvePackOwnership(supabase, user.id, insees);
  }

  if (!pack && etatRetour === "en_attente") {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
        <Navbar />
        <main style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 24px 120px" }}>
          <PackPaiementEnAttente />
        </main>
      </div>
    );
  }

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
              avertissements={[avertissementPackAnterieur(pack.createdAt)].filter((x): x is string => x != null)}
            />
          </main>
        </div>
      );
    }
    // FUT-129 : les communes ACHETÉES priment sur le classement recalculé (cf. `rejouerPack`).
    const rejoue = await rejouerPack(pack.parsedSnapshot, pack.insees);
    if (!rejoue) redirect("/comparateur");
    const avertissements = [
      avertissementPackAnterieur(pack.createdAt),
      rejoue.trioRecompose ? AVERTISSEMENT_TRIO_RECOMPOSE : null,
    ].filter((x): x is string => x != null);
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
        <Navbar />
        <main style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 24px 120px" }}>
          <PackUnlockedView
            data={rejoue.data}
            trio={rejoue.trio}
            pistes={rejoue.pistes}
            projetLabel={pack.projetLabel}
            avertissements={avertissements}
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
