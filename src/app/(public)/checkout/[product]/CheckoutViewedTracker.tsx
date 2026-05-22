"use client";

import { useEffect } from "react";
import posthog from "posthog-js";

export function CheckoutViewedTracker({ productSlug }: { productSlug: string }) {
  useEffect(() => {
    posthog.capture("checkout_viewed", { product: productSlug });
  }, [productSlug]);

  return null;
}
