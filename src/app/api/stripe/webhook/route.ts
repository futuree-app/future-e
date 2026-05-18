import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type Stripe from "stripe";
import { getResend } from "@/lib/resend";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

function getEntitlements(productType: string) {
  if (productType === "suivi-solo") {
    return {
      plan: "suivi",
      status: "active",
      report_access: "complete",
      dashboard_access: "interactive",
      newsletter_enabled: true,
      notifications_enabled: true,
      household_mode_enabled: false,
    };
  }

  if (productType === "suivi-foyer") {
    return {
      plan: "foyer",
      status: "active",
      report_access: "complete",
      dashboard_access: "interactive",
      newsletter_enabled: true,
      notifications_enabled: true,
      household_mode_enabled: true,
    };
  }

  return {
    plan: "one_shot",
    status: "active",
    report_access: "complete",
    dashboard_access: "read_only",
    newsletter_enabled: false,
    notifications_enabled: false,
    household_mode_enabled: false,
  };
}

async function handleSucceededPayment(paymentIntent: Stripe.PaymentIntent) {
  const { userId, userEmail, productType } = paymentIntent.metadata;
  const resend = getResend();

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

  if (userId && userId !== "anonymous") {
    const entitlements = getEntitlements(productType);

    await supabaseAdmin.from("user_accounts").upsert(
      {
        user_id: userId,
        email: userEmail || "",
        ...entitlements,
      },
      { onConflict: "user_id" },
    );

    await supabaseAdmin
      .from("user_profiles")
      .update({
        household_mode_enabled: entitlements.household_mode_enabled,
      })
      .eq("user_id", userId);
  }

  if (userEmail) {
    await resend.emails.send({
      from: "futur·e <hello@futuree.fr>",
      to: userEmail,
      subject: "Votre rapport futur·e est en cours de génération",
      html: `
        <p>Merci pour votre confiance.</p>
        <p>Votre rapport est en cours de génération. Vous le recevrez dans les prochaines minutes.</p>
        <p>— futur·e</p>
      `,
    });
  }

  if (productType === "one-shot" && userEmail) {
    const sendAt = new Date();
    sendAt.setDate(sendAt.getDate() + 7);

    await resend.emails.send({
      from: "futur·e <hello@futuree.fr>",
      to: userEmail,
      subject: "Vos 14 € couvrent votre premier mois de Suivi",
      scheduledAt: sendAt.toISOString(),
      html: `
        <p>Votre rapport futur·e est là depuis une semaine.</p>
        <p>
          Si vous souhaitez suivre l'évolution de votre situation mois par mois,
          vos 14 € couvrent votre premier mois de Suivi — et une partie du second.
          Rien à repayer avant le mois 3.
        </p>
        <p>
          <a href="https://futuree.fr/inscription?upgrade=true">
            Activer mon Suivi →
          </a>
        </p>
        <p>— futur·e</p>
      `,
    });
  }
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
