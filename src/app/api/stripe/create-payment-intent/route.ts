import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";
import { getPostHogClient } from "@/lib/posthog-server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const { amount, productType } = await request.json();

    if (
      typeof amount !== "number" ||
      !Number.isFinite(amount) ||
      amount <= 0 ||
      typeof productType !== "string" ||
      productType.trim().length === 0
    ) {
      return NextResponse.json(
        { error: "Montant ou produit invalide." },
        { status: 400 },
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const stripe = getStripe();

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: "eur",
      payment_method_types: ["card"],
      metadata: {
        userId: user?.id ?? "anonymous",
        userEmail: user?.email ?? "",
        productType: productType.trim(),
      },
    });

    const posthog = getPostHogClient();
    posthog.capture({
      distinctId: user?.email ?? "anonymous",
      event: "payment_intent_created",
      properties: {
        product_type: productType.trim(),
        amount,
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
