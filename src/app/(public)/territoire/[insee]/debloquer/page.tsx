import type { Metadata } from "next";
import { deCommune } from "@/lib/typography";
import Link from "next/link";
import { notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import { createClient } from "@/lib/supabase/server";
import { getCheckoutProduct } from "@/lib/checkout-products";
import { getApercuTerritoire } from "@/lib/quartier-preview";
import { TerritoryUnlockPanel } from "./TerritoryUnlockPanel";
import { TerritoryUnlockPreview } from "./TerritoryUnlockPreview";
import { PersonalTouch } from "./PersonalTouch";
import { communeIdentifiee } from "@/lib/commerce/eligibilite-territoriale";
import { communeDuReferentiel, nomDuReferentiel } from "@/lib/commerce/referentiel-communes";

// Paywall de territoire : ouvre le dossier d'une commune explorée depuis le
// comparateur (parcours « territoires découverts »). Distinct du checkout
// produit générique : il est orienté territoire, pas profil personnel, et ne
// passe jamais par le wizard (doctrine de parcours 5.12).

// FUT-114 : la page ne s'ouvre que sur une commune VENDABLE (métropole, Corse comprise, connue de l'index).
// Elle n'offre rien à payer ailleurs : un code ultramarin ou inconnu rend une 404, et la route de paiement
// refuse de son côté le même code, quelle que soit la page qui l'appelle. L'ancienne garde
// (`^[0-9AB][0-9]{4}$`) rendait aussi une 404 sur toute commune corse.
//
// FUT-119 : le NOM vient du référentiel, comme le code. Le paramètre `nom` de l'URL n'est plus lu : il
// laissait `/territoire/30189/debloquer?nom=La%20Rochelle` vendre les faits de Nîmes sous le nom de La
// Rochelle, jusqu'au paiement et au territoire actif. Les liens qui le portent encore restent valides.
function communeOfferte(raw: string) {
  const verdict = communeIdentifiee(raw, communeDuReferentiel, nomDuReferentiel);
  return verdict.ok ? verdict : null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ insee: string }>;
}): Promise<Metadata> {
  const commune = communeOfferte((await params).insee);
  return {
    title: commune ? `Ouvrir le dossier ${deCommune(commune.nom)} · futur•e` : "Dossier de territoire · futur•e",
    robots: { index: false, follow: false },
  };
}

export default async function TerritoryUnlockPage({
  params,
  searchParams,
}: {
  params: Promise<{ insee: string }>;
  searchParams: Promise<{ rank?: string; source?: string }>;
}) {
  const { insee: rawInsee } = await params;
  const { rank: rawRank, source: rawSource } = await searchParams;

  const offerte = communeOfferte(rawInsee);
  if (!offerte) notFound();
  const { insee, nom: displayName } = offerte;
  const rank = rawRank && /^[1-3]$/.test(rawRank) ? Number.parseInt(rawRank, 10) : null;

  const product = getCheckoutProduct("rapport-complet")!;
  // Local et synchrone : l'aperçu ne dépend d'aucune source réseau et ne peut plus disparaître (FUT-30).
  const apercu = getApercuTerritoire(insee, displayName);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Conserve rank + source dans le retour d'auth : sinon l'aller-retour
  // inscription/connexion ampute l'attribution (rang et provenance perdus). Le nom n'y est plus : la page le
  // retrouve depuis le code (FUT-119).
  const source = typeof rawSource === "string" && /^[a-z0-9_]{1,40}$/i.test(rawSource) ? rawSource : null;
  const backParams = new URLSearchParams();
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
            Dossier de territoire · {displayName} · 14 € une fois
          </p>
          <h1
            className="mt-4 text-[length:var(--text-display)] leading-[1.06] tracking-[-0.02em] text-label"
            style={{ fontFamily: "var(--font-serif)" }}
          >
            Avant de choisir <span className="italic text-accent">{displayName}</span>, regardez ce
            que les données racontent vraiment.
          </h1>
          <p className="mt-5 max-w-[58ch] text-[16px] leading-[1.7] text-muted">
            Vous avez vu pourquoi {displayName} ressort dans votre recherche. Le dossier va
            plus loin : il met à plat ce que ce territoire implique concrètement pour votre projet, à
            partir des données disponibles sur le climat, les risques, la santé environnementale, la
            mobilité, le logement et le cadre de vie.
          </p>
        </div>

        {/* 2. Ce que le dossier permet de vérifier (honnête, sans liste de modules) */}
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

        {/* 3. Aperçu : un ou deux faits de la commune, ou un état explicite sans fait. Toujours rendu.
            RENOMMÉ (FUT-30). « Aperçu réel du dossier » et « Ce que futur•e a déjà analysé sur {commune} »
            annonçaient une analyse du lieu, au-dessus de trois textes identiques partout. Le bloc montre
            désormais un fait tiré des données du dossier, et son titre dit exactement cela. */}
        <section className="mt-20" style={reveal(2)}>
          <p className="font-mono text-[10px] tracking-[0.16em] uppercase text-accent mb-2">
            {apercu.etat !== "faits"
              ? "Aperçu du dossier"
              : apercu.faits.length > 1 ? "Deux faits de ce territoire" : "Un fait de ce territoire"}
          </p>
          <h2 className="text-[length:var(--text-section)] leading-[1.15] text-label mb-1" style={{ fontFamily: "var(--font-serif)" }}>
            {apercu.etat === "faits"
              ? `Ce que les projections disent déjà de ${displayName}`
              : `Ce que le dossier examine sur ${displayName}`}
          </h2>
          <p className="text-[13px] text-muted mb-5">
            {apercu.etat === "faits"
              ? "Un extrait des données du dossier, donné tel quel. La lecture d'ensemble, ce qu'elle implique et ce qu'il reste à vérifier s'ouvrent avec le dossier."
              : "La lecture d'ensemble, ce qu'elle implique et ce qu'il reste à vérifier s'ouvrent avec le dossier."}
          </p>
          <PersonalTouch commune={displayName} />
          <TerritoryUnlockPreview apercu={apercu} />
        </section>

        {/* 4. AskFuture par l'exemple */}
        <section className="mt-20" style={reveal(3)}>
          <h2 className="text-[22px] text-label mb-4" style={{ fontFamily: "var(--font-serif)" }}>
            Vous pourrez demander
          </h2>
          <ul className="flex flex-col gap-2.5">
            {[
              `Est-ce que ${displayName} convient à mon projet ?`,
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
          {/* RÉÉCRIT LE 04/08/2026. La version précédente disait « futur•e croise des données
              publiques dispersées, les rend lisibles et les applique à votre projet » : une
              promesse qu'un moteur de recherche à résumés revendique désormais mot pour mot, donc
              une justification qui ne justifiait plus rien. Ce qu'aucune réponse conversationnelle
              ne produit, c'est la POSITION RELATIVE : elle demande d'avoir mesuré les 34 000 autres
              communes avec la même méthode, avant qu'on pose la question. */}
          <p className="font-mono text-[10px] tracking-[0.14em] uppercase text-ghost mb-2">
            Pourquoi ce dossier est payant ?
          </p>
          <p className="max-w-[60ch] text-[15px] leading-[1.75] text-muted">
            Dire que la chaleur va augmenter à {displayName} ne vous apprend rien : c&apos;est vrai
            presque partout. Ce qui décide, c&apos;est de savoir où cette commune se situe parmi les 34 000
            communes de l&apos;Hexagone et de Corse, et sur quels critères précisément. Cette position se calcule avant
            qu&apos;on vous la demande, sur toutes les communes à la fois, avec la même méthode.
            C&apos;est ce travail que vous payez, pas l&apos;accès à des données publiques et
            gratuites.
          </p>
        </section>

        {/* L'ESCALIER, RENDU VISIBLE LE 04/08/2026. La déduction vit dans `dossier-pricing.ts`
            depuis le 29/07 et n'était affichée sur aucun écran : quelqu'un qui voulait les trois
            échelles pouvait calculer 14 + 39 = 53 € et sauter la marche d'entrée pour cette
            raison. Placée après la justification du prix et avant le CTA, là où la question
            « et si j'en veux plus ? » se pose. */}
        <section className="mt-10 rounded-2xl border border-[var(--border-1)] bg-[var(--bg-elev)] p-6" style={reveal(5)}>
          <p className="font-mono text-[10px] tracking-[0.14em] uppercase text-ghost mb-3">
            Et si vous allez plus loin
          </p>
          <p className="max-w-[62ch] text-[14px] leading-[1.7] text-muted">
            Ce dossier couvre la commune. Le secteur autour d&apos;une adresse précise et le
            logement lui-même se lisent dans un dossier d&apos;adresse, à 39 €. Si vous l&apos;ouvrez
            ensuite sur {displayName}, ces 14 € en sont déduits : il vous reste 25 € à payer.
            Commencer par le territoire ne coûte rien de plus que de tout prendre d&apos;un coup.
          </p>
        </section>

        {/* 6. Aucun engagement : une ligne discrète, pas une boîte de plus */}
        <p className="mt-8 flex items-start gap-2.5 text-[13px] leading-[1.6] text-ghost" style={reveal(6)}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-[2px] shrink-0" aria-hidden>
            <path d="M20 6 9 17l-5-5" />
          </svg>
          <span>
            <span className="text-muted">Aucun engagement.</span> Ouvrir ce dossier ne modifie
            pas votre commune de résidence : vous ouvrez simplement {displayName} comme option à
            lire, comparer et conserver.
          </span>
        </p>

        {/* 7. CTA paiement : le point le plus lumineux de la page (anneau + glow) */}
        <section className="mt-20" style={reveal(7)}>
          <h2 className="text-[length:var(--text-section)] text-label" style={{ fontFamily: "var(--font-serif)" }}>
            Ouvrir le dossier de {displayName}
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
                commune={displayName}
                rank={rank}
                amount={product.amount}
                submitLabel={`Ouvrir le dossier ${deCommune(displayName)}`}
              />
            ) : (
              <div className="flex flex-col gap-4">
                <h3 className="text-[20px] text-label" style={{ fontFamily: "var(--font-serif)" }}>
                  Ouvrez d&apos;abord votre espace.
                </h3>
                <p className="text-[14px] leading-[1.6] text-muted">
                  Le dossier est rattaché à votre compte pour que vous le retrouviez à tout moment.
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
