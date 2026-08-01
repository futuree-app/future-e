import type { Metadata } from "next";
import { deCommune } from "@/lib/typography";
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
    title: `Débloquer le rapport ${deCommune(commune)} · futur•e`,
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
  const { nom, rank: rawRank, source: rawSource } = await searchParams;

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

  // Conserve nom + rank + source dans le retour d'auth : sinon l'aller-retour
  // inscription/connexion ampute l'attribution (rang et provenance perdus).
  const source = typeof rawSource === "string" && /^[a-z0-9_]{1,40}$/i.test(rawSource) ? rawSource : null;
  const backParams = new URLSearchParams();
  if (commune) backParams.set("nom", commune);
  if (rank) backParams.set("rank", String(rank));
  if (source) backParams.set("source", source);
  const backQuery = backParams.toString();
  const backHref = `/territoire/${insee}/debloquer${backQuery ? `?${backQuery}` : ""}`;

  // Une seule révélation orchestrée au chargement (stagger). step-enter vit dans globals.css.
  const reveal = (i: number) => ({
    animation: "step-enter 0.55s cubic-bezier(0.22, 1, 0.36, 1) both",
    animationDelay: `${0.06 * i}s`,
  });

  return (
    <div className="relative min-h-screen overflow-hidden bg-canvas text-label" style={{ fontFamily: "var(--font-sans)" }}>
      {/* Atmosphère : halos diffus pour la profondeur (pas un fond plat) */}
      <div aria-hidden className="pointer-events-none fixed -top-40 -left-32 h-[480px] w-[480px] rounded-full blur-[120px] opacity-[0.10]" style={{ background: "var(--orange)" }} />
      <div aria-hidden className="pointer-events-none fixed top-1/3 -right-40 h-[420px] w-[420px] rounded-full blur-[130px] opacity-[0.07]" style={{ background: "var(--color-info)" }} />

      <Navbar />
      <main className="relative z-[1] max-w-[760px] mx-auto px-6 py-16">
        <Link
          href="/ou-vivre"
          className="font-mono text-[11px] tracking-[0.12em] uppercase text-ghost hover:text-muted no-underline"
        >
          ← Retour aux territoires
        </Link>

        {/* 1. Hero de continuité */}
        <div style={reveal(0)}>
          <p className="mt-10 font-mono text-[11px] tracking-[0.16em] uppercase text-accent">
            Rapport de territoire · {displayName} · 14 € une fois
          </p>
          <h1
            className="mt-4 text-[clamp(2rem,4.4vw,3.1rem)] leading-[1.06] tracking-[-0.02em] text-label"
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
        </div>

        {/* 2. Ce que le rapport permet de vérifier (honnête, sans liste de modules) */}
        <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4" style={reveal(1)}>
          {[
            { n: "01", t: "Comprendre le territoire", d: `Ce que les données permettent de dire sur ${displayName} aujourd'hui, et ce qui peut évoluer dans les prochaines décennies.` },
            { n: "02", t: "Identifier les points de vigilance", d: `Ce qui joue en faveur ${deCommune(displayName)}, ce qui demande attention, et ce qui dépend vraiment de votre projet.` },
            { n: "03", t: "Poser vos questions", d: "3 questions à AskFuture pour approfondir cette option avec votre situation." },
          ].map((c) => (
            <div key={c.t} className="rounded-2xl border border-[var(--border-1)] bg-[var(--bg-elev)] p-5">
              <p className="font-mono text-[10px] tracking-[0.14em] text-ghost mb-3">{c.n}</p>
              <p className="text-[16px] leading-[1.2] text-label" style={{ fontFamily: "var(--font-serif)" }}>{c.t}</p>
              <p className="mt-2 text-[13px] leading-[1.6] text-muted">{c.d}</p>
            </div>
          ))}
        </div>

        {/* 3. Aperçu réel = le héros visuel (masqué si indisponible) */}
        {preview && (
          <section className="mt-20" style={reveal(2)}>
            <p className="font-mono text-[10px] tracking-[0.16em] uppercase text-accent mb-2">
              Aperçu réel du rapport
            </p>
            <h2 className="text-[clamp(22px,2.6vw,28px)] leading-[1.15] text-label mb-1" style={{ fontFamily: "var(--font-serif)" }}>
              Ce que futur•e a déjà analysé sur {displayName}
            </h2>
            <p className="text-[13px] text-muted mb-5">
              Le constat est visible, l&apos;analyse complète se débloque avec le rapport.
            </p>
            <PersonalTouch commune={displayName} />
            <TerritoryUnlockPreview preview={preview} commune={displayName} />
          </section>
        )}

        {/* 4. AskFuture par l'exemple */}
        <section className="mt-20" style={reveal(3)}>
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
                <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-ghost" />
                {q}
              </li>
            ))}
          </ul>
        </section>

        {/* 5. Pourquoi payant : prose éditoriale (filet accent), pas une boîte */}
        <section className="mt-20 border-l-2 pl-5" style={{ ...reveal(4), borderColor: "var(--orange)" }}>
          <p className="font-mono text-[10px] tracking-[0.14em] uppercase text-ghost mb-2">
            Pourquoi ce rapport est payant ?
          </p>
          <p className="max-w-[60ch] text-[15px] leading-[1.75] text-muted">
            futur•e croise des données publiques dispersées, les rend lisibles commune par
            commune et les applique à votre projet. Vous ne payez pas l&apos;accès aux données
            publiques, vous payez leur croisement, leur mise en perspective et leur lecture.
          </p>
        </section>

        {/* 6. Aucun engagement : une ligne discrète, pas une boîte de plus */}
        <p className="mt-8 flex items-start gap-2.5 text-[13px] leading-[1.6] text-ghost" style={reveal(5)}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-[2px] shrink-0" aria-hidden>
            <path d="M20 6 9 17l-5-5" />
          </svg>
          <span>
            <span className="text-muted">Aucun engagement.</span> Débloquer ce rapport ne modifie
            pas votre commune de résidence : vous ouvrez simplement {displayName} comme option à
            lire, comparer et conserver.
          </span>
        </p>

        {/* 7. CTA paiement : le point le plus lumineux de la page (anneau + glow) */}
        <section className="mt-20" style={reveal(6)}>
          <h2 className="text-[clamp(22px,2.6vw,28px)] text-label" style={{ fontFamily: "var(--font-serif)" }}>
            Explorer le rapport de {displayName}
          </h2>
          <p className="mt-2 font-mono text-[11px] tracking-[0.08em] text-muted">
            14 € · paiement unique · accès immédiat · TVA non applicable, art. 293 B du CGI
          </p>
          <div
            className="mt-5 rounded-2xl bg-[var(--bg-elev)] p-7"
            style={{ border: "1px solid var(--orange-ring)", boxShadow: "0 24px 70px -28px var(--orange)" }}
          >
            {user ? (
              <TerritoryUnlockPanel
                insee={insee}
                commune={commune}
                rank={rank}
                amount={product.amount}
                submitLabel={`Débloquer le rapport ${deCommune(displayName)}`}
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
                  className="flex items-center justify-center rounded-lg border border-[var(--border-2)] px-6 py-3.5 text-[14px] text-muted no-underline"
                >
                  J&apos;ai déjà un compte
                </Link>
              </div>
            )}
          </div>
          <p className="mt-5 text-center font-mono text-[11px] tracking-[0.06em] text-ghost">
            Paiement sécurisé par Stripe
          </p>
        </section>
      </main>
    </div>
  );
}
