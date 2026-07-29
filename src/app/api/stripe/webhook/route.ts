import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type Stripe from "stripe";
import { getResend } from "@/lib/resend";
import { getStripe } from "@/lib/stripe";
import { getPostHogClient } from "@/lib/posthog-server";
import { grantDecisionPackFromSnapshot } from "@/lib/decision-packs";

export const runtime = "nodejs";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// UN SEUL JEU DE DROITS DE COMPTE, parce qu'il n'existe qu'un seul produit qui en pose (30/07/2026).
// La branche `suivi-foyer` posait plan `foyer` + mode foyer + dashboard interactif : trois notions
// qu'aucun parcours ne vendait et qu'aucun écran ne lisait. Le paramètre `productType` a disparu
// avec elle ; le jour où un second produit pose des droits de compte, c'est ici qu'il se distingue.
//
// CE QUI OUVRE UNE COMMUNE N'EST PAS ICI : c'est le report_grant écrit plus bas, et le dossier
// d'adresse. `report_access` dit seulement que le compte a payé quelque chose.
function getEntitlements() {
  return {
    plan: "one_shot",
    status: "active",
    report_access: "complete",
    newsletter_enabled: false,
    notifications_enabled: false,
  };
}

async function handleSucceededPayment(paymentIntent: Stripe.PaymentIntent) {
  const { userId, userEmail, productType, targetInsee, targetCommune, grantSource, grantRank } =
    paymentIntent.metadata;

  // Territoire ciblé (parcours comparateur). Vide = achat sur la résidence.
  const insee = typeof targetInsee === "string" ? targetInsee.trim() : "";
  const commune = typeof targetCommune === "string" ? targetCommune.trim() : "";
  const source = grantSource || "direct";
  const rank = grantRank ? Number.parseInt(grantRank, 10) : null;
  const resend = getResend();

  // Pack Décision : crée le pack + 3 grants + entitlements one_shot (report_access
  // complete) depuis le snapshot en staging, via la fonction partagée (l'email pose
  // les entitlements, sans quoi l'acheteur ne pourrait ni lire les rapports ni
  // utiliser AskFuture). Puis mail de confirmation, et on s'arrête (pas de
  // territoire actif, le pack gère son propre déblocage).
  if (productType === "pack-decision") {
    await grantDecisionPackFromSnapshot(supabaseAdmin, paymentIntent.id, undefined, userEmail || undefined);
    await supabaseAdmin.from("payments").upsert(
      {
        user_id: userId && userId !== "anonymous" ? userId : null,
        stripe_payment_intent_id: paymentIntent.id,
        amount: paymentIntent.amount / 100,
        product_type: productType,
        status: "succeeded",
        email: userEmail || null,
      },
      { onConflict: "stripe_payment_intent_id" },
    );
    if (userEmail) {
      await resend.emails.send({
        from: "futur•e <hello@futur-e.fr>",
        to: userEmail,
        subject: "Votre Pack Décision futur•e est débloqué",
        html: `
          <p>Merci pour votre confiance.</p>
          <p>Votre comparaison complète et vos trois rapports sont accessibles depuis votre espace.</p>
          <p>futur•e</p>
        `,
      });
    }
    const posthog = getPostHogClient();
    posthog.capture({
      distinctId: userEmail || userId || paymentIntent.id,
      event: "payment_completed",
      properties: { product_type: productType, amount: paymentIntent.amount / 100 },
    });
    await posthog.shutdown();
    return;
  }

  await supabaseAdmin.from("payments").upsert(
    {
      user_id: userId && userId !== "anonymous" ? userId : null,
      stripe_payment_intent_id: paymentIntent.id,
      amount: paymentIntent.amount / 100,
      product_type: productType,
      status: "succeeded",
      email: userEmail || null,
      target_insee: insee || null,
    },
    { onConflict: "stripe_payment_intent_id" },
  );

  if (userId && userId !== "anonymous") {
    const entitlements = getEntitlements();

    await supabaseAdmin.from("user_accounts").upsert(
      {
        user_id: userId,
        email: userEmail || "",
        ...entitlements,
      },
      { onConflict: "user_id" },
    );

    // Profil : on n'écrase JAMAIS la résidence. Si un territoire a été ciblé
    // (comparateur), on le trace comme grant et on le pose en territoire actif
    // de lecture. Sinon, comportement historique (rapport sur la résidence).
    //
    // `household_mode_enabled` a quitté cet objet avec le mode foyer (30/07/2026), ce qui le laisse
    // VIDE quand aucun territoire n'est ciblé. D'où la garde plus bas : un `.update({})` ne veut
    // rien dire, et écrirait au mieux une ligne inchangée.
    const profileUpdate: Record<string, unknown> = {};

    if (insee) {
      await supabaseAdmin.from("report_grants").upsert(
        {
          user_id: userId,
          insee,
          commune: commune || null,
          source,
          rank: rank && rank >= 1 && rank <= 3 ? rank : null,
          stripe_payment_intent_id: paymentIntent.id,
        },
        { onConflict: "user_id,insee" },
      );

      profileUpdate.active_insee_code = insee;
      profileUpdate.active_commune = commune || null;
    }

    if (Object.keys(profileUpdate).length > 0) {
      await supabaseAdmin
        .from("user_profiles")
        .update(profileUpdate)
        .eq("user_id", userId);
    }
  }

  if (userEmail) {
    await resend.emails.send({
      from: "futur•e <hello@futur-e.fr>",
      to: userEmail,
      subject: "Votre rapport interactif futur•e est en préparation",
      html: `
        <p>Merci pour votre confiance.</p>
        <p>Votre rapport interactif est en préparation. Vous le recevrez dans les prochaines minutes.</p>
        <p>— futur•e</p>
      `,
    });
  }

  const distinctId = userEmail || userId || paymentIntent.id;
  const posthog = getPostHogClient();
  posthog.capture({
    distinctId,
    event: "payment_completed",
    properties: {
      product_type: productType,
      amount: paymentIntent.amount / 100,
      currency: paymentIntent.currency,
      payment_intent_id: paymentIntent.id,
      user_id: userId && userId !== "anonymous" ? userId : null,
    },
  });
  await posthog.shutdown();
}

export async function POST(request: Request) {
  const body = await request.text();
  const signature = (await headers()).get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Signature Stripe manquante." },
      { status: 400 },
    );
  }

  let event: Stripe.Event;

  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch (error) {
    console.error("[stripe/webhook] invalid signature", error);

    return NextResponse.json(
      { error: "Webhook invalide." },
      { status: 400 },
    );
  }

  if (event.type === "payment_intent.succeeded") {
    await handleSucceededPayment(event.data.object as Stripe.PaymentIntent);
  }

  return NextResponse.json({ received: true });
}
