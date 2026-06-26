import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { seedComparaison } from "@/lib/comparateur-vie";
import { ModeChoixSearch } from "./ModeChoixSearch";
import { ModeChoixAsk } from "./ModeChoixAsk";
import { ThemeMatrix } from "./ThemeMatrix";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Comparateur de communes · futur•e",
  description:
    "Vous hésitez entre plusieurs communes ? Comparez-les thème par thème : climat, risques, cadre de vie, mobilité, services, et voyez ce qui les départage vraiment.",
};

// Mode choix : le lecteur NOMME 2 à 3 communes (?communes=I1,I2[,I3]). Un seul moteur
// (seedComparaison), une sortie (la matrice d'arbitrages). Aperçu gratuit tronqué (En
// résumé + 2 thèmes), la matrice complète au Pack Décision. cf. arbitrages/comparateur-
// un-moteur-trois-portes + modules/comparateur (1 moteur, 3 portes).

function parseCommunes(raw: string | string[] | undefined): string[] {
  const s = Array.isArray(raw) ? raw[0] : raw;
  if (typeof s !== "string") return [];
  return s
    .split(",")
    .map((x) => x.trim().toUpperCase())
    .filter((x) => /^[0-9AB][0-9]{4}$/i.test(x))
    .slice(0, 3);
}

const Shell = ({ children }: { children: React.ReactNode }) => (
  <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
    <Navbar />
    <main style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 24px 120px" }}>{children}</main>
  </div>
);

function Hero() {
  return (
    <div className="mb-8">
      <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-accent mb-3">Comparateur de communes</p>
      <h1
        className="font-normal text-[clamp(28px,4vw,44px)] leading-[1.1] tracking-[-0.8px] text-label max-w-[820px]"
        style={{ fontFamily: "'Instrument Serif', serif", textWrap: "balance" }}
      >
        Vous hésitez entre plusieurs communes ?{" "}
        <span className="italic text-accent">Comparez-les,&nbsp;tranchez&nbsp;sans&nbsp;deviner.</span>
      </h1>
      <p className="mt-4 text-[15px] leading-[1.6] text-muted max-w-[640px]" style={{ textWrap: "pretty" }}>
        Nommez les communes que vous avez en tête. On les met côte à côte, thème par thème, pour
        montrer ce qui les départage vraiment, pas un score de&nbsp;plus.
      </p>
    </div>
  );
}

export default async function ComparateurPage({
  searchParams,
}: {
  searchParams: Promise<{ communes?: string | string[] }>;
}) {
  const { communes: raw } = await searchParams;
  const insees = parseCommunes(raw);

  // Pas (encore) de communes nommées : la saisie seule.
  if (insees.length < 2) {
    return (
      <Shell>
        <Hero />
        <ModeChoixSearch />
      </Shell>
    );
  }

  const seeded = await seedComparaison(insees);

  // Moins de 2 communes valides après filtrage (toutes hors index, dont PLM en commune
  // pleine). On le dit honnêtement et on relance la saisie.
  if (!seeded) {
    return (
      <Shell>
        <Hero />
        <div className="glass rounded-2xl p-6 mb-6 border border-amber-500/20">
          <p className="text-[14px] leading-[1.6] text-label">
            Nous n&apos;avons pas pu situer ces communes dans notre référentiel. Pour Paris, Lyon ou
            Marseille, choisissez un arrondissement (« Paris 11e »).
          </p>
        </div>
        <ModeChoixSearch />
      </Shell>
    );
  }

  const { trio, comparaison, ignores } = seeded;
  const initial = trio.map((r) => ({ code: r.insee, nom: r.nom }));
  const ctaHref = `/comparateur/pack-decision?communes=${trio.map((r) => r.insee).join(",")}&mode=choix`;
  const colsClass = trio.length === 2 ? "md:grid-cols-2" : "md:grid-cols-3";

  // Le thème DÉVOILÉ = celui qui porte la fracture (le plus parlant). Repli : 1er thème.
  const div = comparaison.divergence;
  const nomBy = new Map(trio.map((r) => [r.insee, r.nom]));
  const revealed =
    (div && comparaison.themes.find((t) => t.id === div.themeId)) ?? comparaison.themes[0];
  const lockedThemes = comparaison.themes.filter((t) => t.id !== revealed.id);

  return (
    <Shell>
      <Hero />
      <ModeChoixSearch initial={initial} />

      {ignores.length > 0 && (
        <p className="mt-4 text-[13px] leading-[1.55] text-muted">
          {ignores.length === 1 ? "Une commune n'a pas pu être située" : `${ignores.length} communes n'ont pas pu être situées`} et
          n&apos;apparaît{ignores.length === 1 ? "" : "ssent"} pas ci-dessous (pour Paris, Lyon ou Marseille, choisissez un arrondissement).
        </p>
      )}

      {/* 1. LA LIGNE DE FRACTURE : là où les communes s'écartent le plus. La tension, pas un classement. */}
      {div && (
        <div className="mt-12 mb-2">
          <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-accent mb-3">Là où ça se joue</p>
          {div.domine ? (
            <>
              <h2
                className="font-normal text-[clamp(22px,3vw,32px)] leading-[1.18] tracking-[-0.4px] text-label max-w-[760px]"
                style={{ fontFamily: "'Instrument Serif', serif", textWrap: "balance" }}
              >
                {nomBy.get(div.dominatorInsee ?? "") ?? "L'une d'elles"} ressort sur presque tous les thèmes.{" "}
                <span className="italic text-accent">Ce n&apos;est pas vraiment un compromis.</span>
              </h2>
              <p className="mt-3 text-[15px] leading-[1.6] text-muted max-w-[640px]" style={{ textWrap: "pretty" }}>
                Le seul vrai contre-point : {nomBy.get(div.leaderInsee)}, {div.leaderPalier}.
              </p>
            </>
          ) : (
            <>
              <h2
                className="font-normal text-[clamp(22px,3vw,32px)] leading-[1.18] tracking-[-0.4px] text-label max-w-[760px]"
                style={{ fontFamily: "'Instrument Serif', serif", textWrap: "balance" }}
              >
                C&apos;est sur {div.label.toLowerCase()} que l&apos;écart est le plus net{" "}
                <span className="italic text-accent">entre vos communes.</span>
              </h2>
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-[760px]">
                <div className="glass rounded-xl px-4 py-3">
                  <p className="text-[13px] text-accent" style={{ fontFamily: "'Instrument Serif', serif" }}>{nomBy.get(div.leaderInsee)}</p>
                  <p className="mt-0.5 text-[13.5px] leading-[1.5] text-label">{div.leaderPalier}.</p>
                </div>
                <div className="glass rounded-xl px-4 py-3">
                  <p className="text-[13px] text-muted" style={{ fontFamily: "'Instrument Serif', serif" }}>{nomBy.get(div.exposeInsee)}</p>
                  <p className="mt-0.5 text-[13.5px] leading-[1.5] text-label">{div.exposePalier}.</p>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* 2. LE FACE-À-FACE : une signature (offre) + un revers (compromis) par commune. */}
      <div className={`mt-8 grid grid-cols-1 ${colsClass} gap-4`}>
        {trio.map((r, i) => (
          <div key={r.insee} className="glass rounded-2xl p-5 flex flex-col">
            <div className="flex items-baseline gap-2 mb-3">
              <span className="font-mono text-[10px] text-accent">{String(i + 1).padStart(2, "0")}</span>
              <span className="text-[20px] leading-[1.1] text-label" style={{ fontFamily: "'Instrument Serif', serif" }}>
                {r.nom}
              </span>
            </div>
            <p className="text-[14px] leading-[1.55] text-accent italic">{r.identite}</p>
            <p className="mt-3 pt-3 border-t border-white/[0.08] text-[13px] leading-[1.55] text-muted">
              {r.compromis}
            </p>
          </div>
        ))}
      </div>

      {/* 3. UN THÈME DÉVOILÉ : la vraie grammaire du produit (paliers + avantages). */}
      <section className="mt-12">
        <p className="font-mono text-[10px] tracking-[0.16em] uppercase text-accent mb-2">Le détail, sur un thème</p>
        <h3 className="font-normal text-[23px] leading-[1.1] text-label mb-1" style={{ fontFamily: "'Instrument Serif', serif" }}>
          {revealed.titre}
        </h3>
        <p className="text-[14.5px] leading-[1.55] text-muted italic mb-4 max-w-[680px]" style={{ textWrap: "pretty" }}>
          {revealed.synthese}
        </p>
        <ThemeMatrix theme={revealed} trio={trio} />
      </section>

      {/* 4. LE RESTE, VERROUILLÉ : squelette réel (thèmes + critères), verdict voilé. */}
      {lockedThemes.length > 0 && (
        <section className="mt-12">
          <p className="font-mono text-[10px] tracking-[0.16em] uppercase text-muted mb-4">
            Les {lockedThemes.length} autres thèmes
          </p>
          <div className={`grid grid-cols-1 sm:grid-cols-2 ${trio.length === 2 ? "" : "lg:grid-cols-3"} gap-3`}>
            {lockedThemes.map((th) => (
              <div key={th.id} className="glass rounded-xl px-4 py-4 flex flex-col">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[15px] leading-[1.15] text-label" style={{ fontFamily: "'Instrument Serif', serif" }}>
                    {th.titre}
                  </p>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-ghost shrink-0" aria-hidden>
                    <rect x="5" y="11" width="14" height="9" rx="1.5" />
                    <path d="M8 11V8a4 4 0 0 1 8 0v3" />
                  </svg>
                </div>
                <p className="mt-2 text-[11.5px] leading-[1.5] text-ghost">{th.lignes.map((l) => l.label).join(" · ")}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* AskFuture (borné, 2 questions) au point de curiosité maximale, avant le paywall. */}
      <ModeChoixAsk
        trio={trio.map((r) => ({
          insee: r.insee,
          nom: r.nom,
          identite: r.identite,
          compromis: r.compromis,
          distinctive: r.distinctive,
          signaux: r.signaux,
          logement: r.logement,
          littoral: r.littoral,
          heritageIndustriel: r.heritageIndustriel,
        }))}
      />

      {/* 5. CTA Pack : l'amorce prend le relais de la tension, ancrée sur la VALEUR. */}
      <div className="mt-10 glass rounded-2xl p-6 md:p-7 border border-accent/20">
        <p className="text-[15px] leading-[1.6] text-label max-w-[640px]" style={{ textWrap: "pretty" }}>
          Vous voyez où chacune penche. Le Pack vous donne les sept thèmes critère par critère : le
          palier de chaque commune et ce qui les départage, là où ça compte pour votre décision.
        </p>
        <p className="mt-3 text-[13.5px] leading-[1.6] text-muted max-w-[640px]" style={{ textWrap: "pretty" }}>
          39 €, paiement unique, sans engagement. Une décision de lieu de vie pèse des années :
          c&apos;est peu, contre une commune mal choisie.
        </p>
        <Link
          href={ctaHref}
          className="inline-flex items-center justify-center mt-5 px-6 py-3 rounded-lg bg-accent text-canvas font-semibold text-[14px]"
        >
          Voir la comparaison complète · 39 €
        </Link>
      </div>
    </Shell>
  );
}
