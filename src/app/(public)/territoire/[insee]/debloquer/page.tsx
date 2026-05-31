import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import { createClient } from "@/lib/supabase/server";
import { getCheckoutProduct } from "@/lib/checkout-products";
import { TerritoryUnlockPanel } from "./TerritoryUnlockPanel";

// Paywall de territoire : débloque le rapport d'une commune explorée depuis le
// comparateur (parcours « territoires découverts »). Distinct du checkout
// produit générique : il est orienté territoire, pas profil personnel, et ne
// passe jamais par le wizard (doctrine de parcours 5.12).

const INSEE_RE = /^[0-9AB][0-9]{4}$/i;

function cleanInsee(raw: string): string | null {
  const v = raw.trim().toUpperCase();
  return INSEE_RE.test(v) ? v : null;
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ nom?: string }>;
}): Promise<Metadata> {
  const { nom } = await searchParams;
  const commune = typeof nom === "string" && nom.trim() ? nom.trim() : "ce territoire";
  return {
    title: `Débloquer le rapport de ${commune} · futur•e`,
    robots: { index: false, follow: false },
  };
}

export default async function TerritoryUnlockPage({
  params,
  searchParams,
}: {
  params: Promise<{ insee: string }>;
  searchParams: Promise<{ nom?: string; rank?: string; source?: string }>;
}) {
  const { insee: rawInsee } = await params;
  const { nom, rank: rawRank } = await searchParams;

  const insee = cleanInsee(rawInsee);
  if (!insee) notFound();

  const commune = typeof nom === "string" && nom.trim() ? nom.trim().slice(0, 120) : null;
  const displayName = commune ?? "ce territoire";
  const rank = rawRank && /^[1-3]$/.test(rawRank) ? Number.parseInt(rawRank, 10) : null;

  const product = getCheckoutProduct("rapport-complet")!;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const backHref = `/territoire/${insee}/debloquer${commune ? `?nom=${encodeURIComponent(commune)}` : ""}`;

  return (
    <div className="min-h-screen bg-canvas text-label" style={{ fontFamily: "var(--font-sans)" }}>
      <Navbar />
      <main className="max-w-[760px] mx-auto px-6 py-16">
        <Link
          href="/ou-vivre"
          className="font-mono text-[11px] tracking-[0.12em] uppercase text-ghost hover:text-muted no-underline"
        >
          ← Retour aux territoires
        </Link>

        <p className="mt-10 font-mono text-[11px] tracking-[0.16em] uppercase text-accent">
          Rapport de territoire · 14 € une fois
        </p>
        <h1
          className="mt-4 text-[clamp(2rem,4vw,3rem)] leading-[1.08] tracking-[-0.02em] text-label"
          style={{ fontFamily: "var(--font-serif)" }}
        >
          Le rapport complet de{" "}
          <span className="italic text-accent">{displayName}</span>.
        </h1>
        <p className="mt-5 max-w-[46ch] text-[16px] leading-[1.7] text-muted">
          Vous avez vu pourquoi ce territoire ressort. Le rapport va plus loin : ce que ses
          données impliquent concrètement, six modules sourcés sur les données publiques.
          Votre commune de résidence n&apos;est pas modifiée, vous ajoutez simplement ce
          territoire à votre lecture.
        </p>

        <ul className="mt-8 flex flex-col gap-2.5">
          {product.features.map((f) => (
            <li key={f} className="flex items-start gap-3 text-[14px] text-label/90">
              <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
              {f}
            </li>
          ))}
        </ul>

        <div className="mt-10 rounded-2xl border border-white/[0.1] bg-white/[0.03] p-7">
          {user ? (
            <TerritoryUnlockPanel
              insee={insee}
              commune={commune}
              rank={rank}
              amount={product.amount}
            />
          ) : (
            <div className="flex flex-col gap-4">
              <h2 className="text-[20px] text-label" style={{ fontFamily: "var(--font-serif)" }}>
                Ouvrez d&apos;abord votre espace.
              </h2>
              <p className="text-[14px] leading-[1.6] text-muted">
                Le rapport est rattaché à votre compte pour que vous le retrouviez à tout moment.
              </p>
              <Link
                href={`/inscription?next=${encodeURIComponent(backHref)}`}
                className="flex items-center justify-center rounded-lg bg-accent px-6 py-4 font-mono text-[12px] tracking-[0.12em] uppercase font-semibold text-canvas no-underline"
              >
                Créer mon compte puis débloquer
              </Link>
              <Link
                href={`/connexion?next=${encodeURIComponent(backHref)}`}
                className="flex items-center justify-center rounded-lg border border-white/[0.12] px-6 py-3.5 text-[14px] text-muted no-underline"
              >
                J&apos;ai déjà un compte
              </Link>
            </div>
          )}
        </div>

        <p className="mt-6 text-center font-mono text-[11px] tracking-[0.06em] text-ghost">
          Stripe · sécurisé · TVA incluse · paiement unique
        </p>
      </main>
    </div>
  );
}
