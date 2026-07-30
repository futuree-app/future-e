import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";
import { getPostHogClient } from "@/lib/posthog-server";

export const runtime = "nodejs";

// Server-side price map — client-provided amounts are never trusted
const PRODUCT_PRICES: Record<string, { amountEur: number; stripePriceId: string }> = {
  "one-shot":      { amountEur: 14, stripePriceId: process.env.STRIPE_RAPPORT_PRICE_ID ?? "" },
  "pack-decision": { amountEur: 39, stripePriceId: process.env.STRIPE_PACK_PRICE_ID    ?? "" },
};

export async function POST(request: Request) {
  try {
    const { productType, targetInsee, targetCommune, source, rank, pack } =
      await request.json();

    if (typeof productType !== "string" || productType.trim().length === 0) {
      return NextResponse.json(
        { error: "Produit invalide." },
        { status: 400 },
      );
    }

    const priceConfig = PRODUCT_PRICES[productType.trim()];
    if (!priceConfig) {
      return NextResponse.json(
        { error: "Produit inconnu." },
        { status: 400 },
      );
    }

    // Territoire ciblé (parcours comparateur). Optionnel : sans lui, achat sur
    // la commune de résidence (comportement historique). On valide un vrai code
    // INSEE à 5 caractères pour ne jamais propager un code postal (piège connu).
    const cleanInsee =
      typeof targetInsee === "string" && /^[0-9AB][0-9]{4}$/i.test(targetInsee.trim())
        ? targetInsee.trim().toUpperCase()
        : "";
    const cleanCommune =
      typeof targetCommune === "string" ? targetCommune.trim().slice(0, 120) : "";
    const cleanSource =
      source === "comparateur_vie" || source === "pack_decision" ? source : "direct";
    const cleanRank =
      Number.isInteger(rank) && rank >= 1 && rank <= 3 ? String(rank) : "";

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // AUCUN PAIEMENT ANONYME, POUR AUCUN DES TROIS PRODUITS. Chacun livre un droit rattaché à un
    // compte : le 14 € pose un report_grant sur un user_id, le Pack en pose trois, le dossier crée
    // une ligne address_dossiers dont la colonne user_id est `not null`. Sans utilisateur, le
    // webhook encaissait et ne livrait rien (il garde `if (userId && userId !== "anonymous")`),
    // donc l'acheteur recevait un e-mail de confirmation et zéro accès.
    if (!user) {
      return NextResponse.json(
        { error: "Connexion requise pour finaliser un achat.", code: "AUTH_REQUIRED" },
        { status: 401 },
      );
    }

    const stripe = getStripe();

    // Pack Décision : 2-3 INSEE valides. Mode 'replay' (trio /ou-vivre, snapshot du
    // projet requis) ou 'choix' (communes nommées sur /comparateur, sans projet,
    // reconstruites via seedComparaison). Le snapshot replay est persisté en base
    // (pack_snapshots) ; les metadata Stripe ne portent que le petit (INSEE, communes,
    // libellé/mode).
    const isPack = productType.trim() === "pack-decision";
    const packMode = pack?.mode === "choix" ? "choix" : "replay";
    let packTrio: { insee: string; commune: string }[] = [];
    let packProjetLabel = "";
    if (isPack) {
      const raw = Array.isArray(pack?.trio) ? pack.trio : [];
      packTrio = raw
        .map((t: { insee?: string; commune?: string }) => ({
          insee: typeof t?.insee === "string" && /^[0-9AB][0-9]{4}$/i.test(t.insee.trim())
            ? t.insee.trim().toUpperCase() : "",
          commune: typeof t?.commune === "string" ? t.commune.trim().slice(0, 120) : "",
        }))
        .filter((t: { insee: string }) => t.insee)
        .slice(0, 3);
      // choix : 2 ou 3 communes ; replay : exactement 3.
      const okCount = packMode === "choix" ? packTrio.length >= 2 : packTrio.length === 3;
      if (!okCount) {
        return NextResponse.json(
          { error: packMode === "choix" ? "2 à 3 communes requises." : "Trio de 3 communes requis." },
          { status: 400 },
        );
      }
      // replay seul exige le snapshot du projet ; choix n'en a pas.
      if (packMode === "replay" && (!pack?.parsedSnapshot || typeof pack.parsedSnapshot !== "object")) {
        return NextResponse.json({ error: "Projet manquant." }, { status: 400 });
      }
      packProjetLabel = typeof pack?.projetLabel === "string" ? pack.projetLabel.trim().slice(0, 200) : "";
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(priceConfig.amountEur * 100),
      currency: "eur",
      payment_method_types: ["card"],
      metadata: {
        userId: user.id,
        userEmail: user.email ?? "",
        productType: productType.trim(),
        stripePriceId: priceConfig.stripePriceId,
        targetInsee: cleanInsee,
        targetCommune: cleanCommune,
        grantSource: cleanSource,
        grantRank: cleanRank,
        packMode: isPack ? packMode : "",
        packInsee1: isPack ? packTrio[0].insee : "",
        packInsee2: isPack ? packTrio[1].insee : "",
        packInsee3: isPack ? (packTrio[2]?.insee ?? "") : "",
        packCommune1: isPack ? packTrio[0].commune : "",
        packCommune2: isPack ? packTrio[1].commune : "",
        packCommune3: isPack ? (packTrio[2]?.commune ?? "") : "",
        packProjetLabel,
      },
    });

    if (isPack) {
      const { createClient: createAdminClient } = await import("@supabase/supabase-js");
      const { trioKey } = await import("@/lib/decision-packs");
      const admin = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
      );
      await admin.from("pack_snapshots").upsert(
        {
          stripe_payment_intent_id: paymentIntent.id,
          user_id: user.id,
          mode: packMode,
          trio_key: trioKey(packTrio.map((t) => t.insee)),
          insee_1: packTrio[0].insee,
          insee_2: packTrio[1].insee,
          insee_3: packTrio[2]?.insee ?? null,
          commune_1: packTrio[0].commune || null,
          commune_2: packTrio[1].commune || null,
          commune_3: packTrio[2]?.commune || null,
          projet_label: packProjetLabel || null,
          // choix : aucun ParsedProject (la matrice se reconstruit via seedComparaison).
          parsed_snapshot: packMode === "choix" ? null : pack.parsedSnapshot,
        },
        { onConflict: "stripe_payment_intent_id" },
      );
    }

    const posthog = getPostHogClient();
    posthog.capture({
      distinctId: user.email ?? user.id,
      event: "payment_intent_created",
      properties: {
        product_type: productType.trim(),
        amount: priceConfig.amountEur,
        currency: "eur",
        user_id: user.id,
      },
    });
    await posthog.shutdown();

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    console.error("[stripe/create-payment-intent]", error);

    return NextResponse.json(
      { error: "Erreur lors de la création du paiement." },
      { status: 500 },
    );
  }
}
