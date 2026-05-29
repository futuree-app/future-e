import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";
import { getPostHogClient } from "@/lib/posthog-server";

export const runtime = "nodejs";

// Server-side price map — client-provided amounts are never trusted
const PRODUCT_PRICES: Record<string, { amountEur: number; stripePriceId: string }> = {
  "one-shot":   { amountEur: 14, stripePriceId: process.env.STRIPE_RAPPORT_PRICE_ID ?? "" },
  "suivi-solo": { amountEur: 9,  stripePriceId: process.env.STRIPE_SUIVI_PRICE_ID   ?? "" },
};

export async function POST(request: Request) {
  try {
    const { productType } = await request.json();

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

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const stripe = getStripe();

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(priceConfig.amountEur * 100),
      currency: "eur",
      payment_method_types: ["card"],
      metadata: {
        userId: user?.id ?? "anonymous",
        userEmail: user?.email ?? "",
        productType: productType.trim(),
        stripePriceId: priceConfig.stripePriceId,
      },
    });

    const posthog = getPostHogClient();
    posthog.capture({
      distinctId: user?.email ?? "anonymous",
      event: "payment_intent_created",
      properties: {
        product_type: productType.trim(),
        amount: priceConfig.amountEur,
        currency: "eur",
        user_id: user?.id ?? null,
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
