"use client";

import { useRouter } from "next/navigation";
import { PaymentWrapper } from "@/components/PaymentWrapper";
import type { CheckoutProduct } from "@/lib/checkout-products";

type CheckoutPaymentPanelProps = {
  product: CheckoutProduct;
  userEmail: string | null | undefined;
};

export function CheckoutPaymentPanel({
  product,
  userEmail,
}: CheckoutPaymentPanelProps) {
  const router = useRouter();

  return (
    <>
      <div className="mb-6">
        <p className="mb-2 font-mono text-[11px] tracking-[0.12em] text-[var(--fg-4)] uppercase">
          Votre compte
        </p>
        <p className="text-[15px] text-[var(--fg-3)]">
          Paiement rattaché à <span className="text-[var(--fg-1)]">{userEmail}</span>
        </p>
      </div>
      <PaymentWrapper
        amount={product.amount}
        productType={product.productType}
        onSuccess={() => {
          router.push("/merci");
        }}
      />
      <p className="mt-5 text-[13px] leading-relaxed text-[var(--fg-4)]">
        En validant ce paiement, vous activez cette formule sur votre espace futur•e.
      </p>
    </>
  );
}
