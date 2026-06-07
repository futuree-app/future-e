import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import { createClient } from "@/lib/supabase/server";
import { getCheckoutProduct } from "@/lib/checkout-products";
import { getQuartierPreview } from "@/lib/quartier-preview";
import { TerritoryUnlockPanel } from "./TerritoryUnlockPanel";
import { TerritoryUnlockPreview } from "./TerritoryUnlockPreview";
import { PersonalTouch } from "./PersonalTouch";

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
  const preview = await getQuartierPreview(insee);

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

        {/* 1. Hero de continuité */}
        <p className="mt-10 font-mono text-[11px] tracking-[0.16em] uppercase text-accent">
          Rapport de territoire · {displayName} · 14 € une fois
        </p>
        <h1
          className="mt-4 text-[clamp(2rem,4vw,3rem)] leading-[1.08] tracking-[-0.02em] text-label"
          style={{ fontFamily: "var(--font-serif)" }}
        >
          Avant de choisir <span className="italic text-accent">{displayName}</span>, regardez ce
          que les données racontent vraiment.
        </h1>
        <p className="mt-5 max-w-[58ch] text-[16px] leading-[1.7] text-muted">
          Vous avez vu pourquoi {displayName} ressort dans votre recherche. Le rapport complet va
          plus loin : il met à plat ce que ce territoire implique concrètement pour votre projet, à
          partir des données disponibles sur le climat, les risques, la santé environnementale, la
          mobilité, le logement et le cadre de vie.
        </p>

        {/* 2. Ce que le rapport permet de vérifier (honnête, sans liste de modules) */}
        <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { t: "Comprendre le territoire", d: `Ce que les données permettent de dire sur ${displayName} aujourd'hui, et ce qui peut évoluer dans les prochaines décennies.` },
            { t: "Identifier les points de vigilance", d: `Ce qui joue en faveur de ${displayName}, ce qui demande attention, et ce qui dépend vraiment de votre projet.` },
            { t: "Poser vos questions", d: "3 questions à AskFuture pour approfondir cette option avec votre situation." },
          ].map((c) => (
            <div key={c.t} className="rounded-2xl border border-white/[0.1] bg-white/[0.03] p-5">
              <p className="text-[15px] text-label" style={{ fontFamily: "var(--font-serif)" }}>{c.t}</p>
              <p className="mt-2 text-[13px] leading-[1.6] text-muted">{c.d}</p>
            </div>
          ))}
        </div>

        {/* 3. Aperçu réel (masqué si indisponible) */}
        {preview && (
          <section className="mt-14">
            <h2 className="text-[22px] text-label mb-1" style={{ fontFamily: "var(--font-serif)" }}>
              Aperçu du rapport de {displayName}
            </h2>
            <p className="text-[13px] text-muted mb-5">
              Le constat est visible, l&apos;analyse complète se débloque avec le rapport.
            </p>
            <PersonalTouch commune={displayName} />
            <TerritoryUnlockPreview preview={preview} commune={displayName} />
          </section>
        )}

        {/* 4. AskFuture par l'exemple */}
        <section className="mt-14">
          <h2 className="text-[22px] text-label mb-4" style={{ fontFamily: "var(--font-serif)" }}>
            Vous pourrez demander
          </h2>
          <ul className="flex flex-col gap-2.5">
            {[
              `${displayName} est-elle adaptée à mon projet ?`,
              "Quels sont les compromis les plus importants ?",
              "Quels risques regarder avant d'acheter ou de louer ?",
              "Que faudrait-il vérifier sur place ?",
              `Pourquoi ${displayName} plutôt qu'une autre option ?`,
            ].map((q) => (
              <li key={q} className="flex items-start gap-3 text-[14px] text-label/90">
                <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                {q}
              </li>
            ))}
          </ul>
        </section>

        {/* 5. Pourquoi ce rapport est payant ? */}
        <section className="mt-14 rounded-2xl border border-white/[0.1] bg-white/[0.03] p-7">
          <p className="font-mono text-[10px] tracking-[0.14em] uppercase text-accent mb-2">
            Pourquoi ce rapport est payant ?
          </p>
          <p className="text-[14px] leading-[1.7] text-muted">
            futur·e croise des données publiques dispersées, les rend lisibles commune par
            commune et les applique à votre projet. Vous ne payez pas l&apos;accès aux données
            publiques, vous payez leur croisement, leur mise en perspective et leur lecture.
          </p>
        </section>

        {/* 6. Aucun engagement (réassurance, bloc dédié) */}
        <section className="mt-4 rounded-2xl border border-white/[0.1] bg-white/[0.03] p-7">
          <p className="font-mono text-[10px] tracking-[0.14em] uppercase text-accent mb-2">
            Aucun engagement
          </p>
          <p className="text-[14px] leading-[1.7] text-muted">
            Débloquer ce rapport ne modifie pas votre commune de résidence. Vous ouvrez
            simplement {displayName} comme option à lire, comparer et conserver.
          </p>
        </section>

        {/* 7. CTA paiement (titre produit ; le bouton Stripe dit « Débloquer le rapport de … ») */}
        <h2 className="mt-14 text-[22px] text-label" style={{ fontFamily: "var(--font-serif)" }}>
          Explorer le rapport de {displayName}
        </h2>
        <div className="mt-5 rounded-2xl border border-white/[0.1] bg-white/[0.03] p-7">
          {user ? (
            <TerritoryUnlockPanel
              insee={insee}
              commune={commune}
              rank={rank}
              amount={product.amount}
              submitLabel={`Débloquer le rapport de ${displayName}`}
            />
          ) : (
            <div className="flex flex-col gap-4">
              <h3 className="text-[20px] text-label" style={{ fontFamily: "var(--font-serif)" }}>
                Ouvrez d&apos;abord votre espace.
              </h3>
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
