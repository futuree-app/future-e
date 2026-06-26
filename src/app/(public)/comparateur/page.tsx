import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { seedComparaison } from "@/lib/comparateur-vie";
import { bindOrphans } from "@/lib/typography";
import { ModeChoixSearch } from "./ModeChoixSearch";
import { ModeChoixAsk } from "./ModeChoixAsk";
import { ModeChoixSynthese } from "./ModeChoixSynthese";
import { ThemeExplorer } from "./ThemeExplorer";

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

function Hero({ compact = false }: { compact?: boolean }) {
  // En état « résultats », le hero se condense pour ne pas dominer typographiquement la ligne
  // de fracture (qui doit être le premier grand bloc). cf. rapports-agents/design-critic.
  if (compact) {
    return (
      <div className="mb-6">
        <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-accent mb-2">Comparateur de communes</p>
        <p className="text-[15px] leading-[1.55] text-muted" style={{ textWrap: "pretty" }}>
          {bindOrphans("Vos communes, côte à côte, thème par thème. Ce qui les départage vraiment, pas un score de plus.")}
        </p>
      </div>
    );
  }
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
      <p className="mt-4 text-[15px] leading-[1.6] text-muted" style={{ textWrap: "pretty" }}>
        {bindOrphans("Nommez les communes que vous avez en tête. On les met côte à côte, thème par thème, pour montrer ce qui les départage vraiment, pas un score de plus.")}
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

  // Thème ouvert par défaut dans l'explorateur : celui de la divergence repondérée (cf. Task 1).
  // Repli : 1er thème. L'explorateur gère ensuite l'ouverture/verrouillage côté client.
  const revealedThemeId = comparaison.divergence?.themeId ?? comparaison.themes[0].id;

  return (
    <Shell>
      <Hero compact />
      <ModeChoixSearch initial={initial} />

      {ignores.length > 0 && (
        <p className="mt-4 text-[13px] leading-[1.55] text-muted">
          {ignores.length === 1 ? "Une commune n'a pas pu être située" : `${ignores.length} communes n'ont pas pu être situées`} et
          n&apos;apparaît{ignores.length === 1 ? "" : "ssent"} pas ci-dessous (pour Paris, Lyon ou Marseille, choisissez un arrondissement).
        </p>
      )}

      {/* 1. SYNTHÈSE générée (effet wow), une seule fois par chargement. */}
      <ModeChoixSynthese
        communes={trio.map((r) => ({
          nom: r.nom,
          region: r.region,
          identite: r.identite,
          compromis: r.compromis,
          distinctive: r.distinctive,
        }))}
        divergence={comparaison.divergence ? { domine: comparaison.divergence.domine, dominatorInsee: comparaison.divergence.dominatorInsee } : null}
      />

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

      {/* 3. L'EXPLORATEUR : un thème dévoilé (défaut repondéré), le reste en vitrine cliquable. */}
      <ThemeExplorer themes={comparaison.themes} trio={trio} defaultThemeId={revealedThemeId} />

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
          {bindOrphans("Vous voyez où chacune penche. Le Pack vous donne les sept thèmes critère par critère : le palier de chaque commune et ce qui les départage, là où ça compte pour votre décision.")}
        </p>
        <p className="mt-3 text-[13.5px] leading-[1.6] text-muted max-w-[640px]" style={{ textWrap: "pretty" }}>
          {bindOrphans("39 €, paiement unique, sans engagement. Une décision de lieu de vie pèse des années : c'est peu pour la trancher les yeux ouverts.")}
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
