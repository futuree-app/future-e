import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { seedComparaison } from "@/lib/comparateur-vie";
import { ModeChoixSearch } from "./ModeChoixSearch";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Comparateur de communes · futur•e",
  description:
    "Vous hésitez entre plusieurs communes ? Comparez-les thème par thème — climat, risques, cadre de vie, mobilité, services — et voyez ce qui les départage vraiment.",
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
  const themesShown = comparaison.themes.slice(0, 2);
  const themesRestants = comparaison.themes.length - themesShown.length;
  const ctaHref = `/comparateur/pack-decision?communes=${trio.map((r) => r.insee).join(",")}&mode=choix`;

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

      {/* Aperçu gratuit : En résumé + les 2 premiers thèmes en synthèse. La matrice
          complète (paliers, avantages, 7 thèmes) est le coeur du Pack Décision. */}
      <div className="mt-10">
        <p className="font-mono text-[10px] tracking-[0.16em] uppercase text-muted mb-4">
          {trio.map((r) => r.nom).join(" · ")}
        </p>

        {comparaison.resume.length > 0 && (
          <div className="glass rounded-2xl px-6 py-5">
            <p className="font-mono text-[10px] tracking-[0.14em] uppercase text-accent mb-2.5">En résumé</p>
            <div className="space-y-1.5">
              {comparaison.resume.map((s, n) => (
                <p key={n} className={n === 0 ? "text-[16px] leading-[1.55] text-label" : "text-[14.5px] leading-[1.55] text-muted"}>
                  {s}
                </p>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6 space-y-4">
          {themesShown.map((th) => (
            <div key={th.id} className="glass rounded-2xl px-6 py-5">
              <p className="font-mono text-[10px] tracking-[0.14em] uppercase text-accent mb-1.5">{th.titre}</p>
              <p className="text-[14.5px] leading-[1.6] text-label">{th.synthese}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Voile + CTA Pack : ce qu'on débloque, ancré sur la VALEUR (pas la remise). */}
      <div className="mt-8 glass rounded-2xl p-6 md:p-7 border border-accent/20">
        <p className="text-[15px] leading-[1.6] text-label max-w-[640px]">
          {themesRestants > 0
            ? `Et ${themesRestants} autres thèmes, critère par critère : le palier de chaque commune et ce qui penche, là où ça compte pour votre décision.`
            : "La comparaison complète, critère par critère : le palier de chaque commune et ce qui penche, là où ça compte pour votre décision."}
        </p>
        <p className="mt-3 text-[13.5px] leading-[1.6] text-muted max-w-[640px]">
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
