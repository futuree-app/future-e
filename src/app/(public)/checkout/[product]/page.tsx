import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckoutPaymentPanel } from "@/components/CheckoutPaymentPanel";
import { getCheckoutProduct } from "@/lib/checkout-products";
import { createClient } from "@/lib/supabase/server";

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ product: string }>;
}) {
  const { product: productSlug } = await params;
  const product = getCheckoutProduct(productSlug);

  if (!product) {
    notFound();
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const checkoutPath = `/checkout/${product.slug}`;

  return (
    <main className="min-h-screen bg-[var(--bg)] px-6 py-10 text-[var(--fg-1)]">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10">
        <Link
          href="/#pricing"
          className="font-mono text-[11px] tracking-[0.12em] text-[var(--fg-4)] uppercase transition-colors hover:text-[var(--fg-1)]"
        >
          ← Retour aux tarifs
        </Link>

        <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <section className="rounded-[28px] border border-white/8 bg-white/[0.03] p-8 md:p-10">
            <p className="mb-3 font-mono text-[11px] tracking-[0.14em] text-[var(--fg-4)] uppercase">
              Paiement sécurisé
            </p>
            <h1
              className="mb-4 text-[clamp(34px,5vw,54px)] leading-[0.96] tracking-[-0.04em]"
              style={{ fontFamily: "'Instrument Serif', serif" }}
            >
              {product.title}
            </h1>
            <p className="mb-8 max-w-2xl text-[16px] leading-relaxed text-[var(--fg-3)]">
              {product.subtitle}
            </p>

            <div className="mb-8 flex items-end gap-3">
              <div className="text-[42px] font-semibold tracking-[-0.05em] text-[var(--fg-1)]">
                {product.amount}
                <span className="ml-1 text-[22px] text-[var(--fg-3)]">€</span>
              </div>
              <div className="pb-1 text-[14px] text-[var(--fg-4)]">{product.priceLabel.replace(`${product.amount} €`, "").trim()}</div>
            </div>

            <div className="grid gap-3">
              {product.features.map((feature) => (
                <div
                  key={feature}
                  className="flex items-start gap-3 rounded-2xl border border-white/8 bg-white/[0.02] px-4 py-3 text-[15px] text-[var(--fg-2)]"
                >
                  <span className="mt-[2px] text-[var(--accent)]">✓</span>
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </section>

          <aside className="rounded-[28px] border border-white/8 bg-[var(--bg-elev)] p-8 md:p-10">
            {user ? (
              <CheckoutPaymentPanel product={product} userEmail={user.email} />
            ) : (
              <div className="flex h-full flex-col justify-between gap-8">
                <div>
                  <p className="mb-2 font-mono text-[11px] tracking-[0.12em] text-[var(--fg-4)] uppercase">
                    Avant de payer
                  </p>
                  <h2
                    className="mb-4 text-[30px] leading-tight tracking-[-0.04em]"
                    style={{ fontFamily: "'Instrument Serif', serif" }}
                  >
                    Ouvrez d’abord votre espace.
                  </h2>
                  <p className="text-[15px] leading-relaxed text-[var(--fg-3)]">
                    Le paiement doit être rattaché à un compte pour débloquer votre rapport, votre dashboard et vos modules.
                  </p>
                </div>

                <div className="flex flex-col gap-3">
                  <Link
                    href={`/inscription?next=${encodeURIComponent(checkoutPath)}`}
                    className="flex items-center justify-center rounded-xl bg-[var(--accent)] px-5 py-4 text-[15px] font-semibold text-[var(--bg)] transition-opacity hover:opacity-90"
                  >
                    Créer mon compte puis payer
                  </Link>
                  <Link
                    href={`/connexion?next=${encodeURIComponent(checkoutPath)}`}
                    className="flex items-center justify-center rounded-xl border border-white/10 px-5 py-4 text-[14px] text-[var(--fg-2)] transition-colors hover:border-white/20 hover:text-[var(--fg-1)]"
                  >
                    J’ai déjà un compte
                  </Link>
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>
    </main>
  );
}
