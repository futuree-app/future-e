"use client";

import { useEffect } from "react";
import posthog from "posthog-js";

export function CheckoutViewedTracker({
  productSlug,
  amount,
  source = "direct",
}: {
  productSlug: string;
  amount?: number;
  source?: string;
}) {
  useEffect(() => {
    // checkout_viewed : arrivée sur la page (conservé, rétrocompatible)
    posthog.capture("checkout_viewed", { product: productSlug });
    // checkout_started : intention active d'achat avec plan + prix
    posthog.capture("checkout_started", {
      plan: productSlug,
      price: amount ?? null,
      source,
    });
  }, [productSlug, amount, source]);

  return null;
}
