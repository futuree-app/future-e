import Link from "next/link";
import { AccountNav } from "@/components/AccountNav";
import { canAccessCompleteReport } from "@/lib/access";
import { PRODUCT_MODULES } from "@/lib/product";
import { getCurrentUserAccount } from "@/lib/user-account";
import { QuartierWorkbook } from "../compte/QuartierWorkbook";

const MODULE_COLORS: Record<string, string> = {
  quartier: "#60a5fa",
  logement: "#fb923c",
  metier: "#a78bfa",
  sante: "#4ade80",
  mobilite: "#f87171",
  projets: "#fb923c",
};

const MODULE_ICONS: Record<string, string> = {
  quartier: "🏘",
  logement: "🏠",
  metier: "💼",
  sante: "🫁",
  mobilite: "🚗",
  projets: "🗓",
};

const MODULE_BENEFIT: Record<string, string> = {
  quartier: "Ce que votre territoire devient. Chaleur, inondations, érosion, qualité de vie : ce qui change autour de chez vous dans les prochaines décennies.",
  logement: "Ce que votre logement devient : confort d'été, valeur future, coût d'assurance, obligations de rénovation. Ce que vous ne voyez pas encore dans votre bail ou votre acte de propriété.",
  metier: "Ce que le changement climatique fait à votre secteur. Certains métiers gagnent en importance, d'autres se fragilisent.",
  sante: "Ce que votre environnement fait à votre corps. Chaleur, pollens, qualité de l'air, cadmium dans les sols : des signaux qui existent déjà.",
  mobilite: "Est-ce que votre mode de vie quotidien reste tenable ici ? Dépendance à la voiture, coût des trajets, alternatives réelles.",
  projets: "Est-ce que vos projets sont cohérents avec ce que ce lieu va devenir ? Achat, déménagement, retraite, installation durable.",
};

const QUARTIER_FACTORS = [
  { label: "Jours de chaleur extrême", val: "34 jours/an en 2050", col: "#f87171", src: "DRIAS / Météo-France · +2,7°C" },
  { label: "Risque submersion", val: "+31 % en scénario médian", col: "#60a5fa", src: "Géorisques / BRGM" },
  { label: "Érosion littorale", val: "Recul du trait de côte documenté", col: "#60a5fa", src: "Cerema · littoral atlantique" },
  { label: "Îlots de chaleur urbains", val: "Quartiers centre exposés", col: "#f87171", src: "INSEE / IGN" },
];

const LOCKED_MODULE_IDS = ["logement", "metier", "sante", "mobilite", "projets"];

export default async function RapportPage() {
  const account = await getCurrentUserAccount();
  const fullReport = canAccessCompleteReport(account);

  const allModules = PRODUCT_MODULES;
  const lockedModules = PRODUCT_MODULES.filter((m) => LOCKED_MODULE_IDS.includes(m.id));

  const heroSignals = [
    { label: "Cadmium dans les sols charentais", src: "GisSol / RMQS", col: "#fb923c" },
    { label: "Saison pollinique allongée de 28 jours", src: "RNSA / Copernicus", col: "#4ade80" },
    { label: "Assurance habitation : +8 à 12 %/an sur le littoral", src: "ACPR / Banque de France", col: "#60a5fa" },
  ];

  return (
    <div
      className="min-h-screen bg-canvas text-label relative overflow-hidden"
      style={{ fontFamily: "'Instrument Sans', sans-serif" }}
    >
      {/* Orbs */}
      <div className="fixed top-[-160px] left-[-130px] w-[540px] h-[540px] rounded-full bg-accent/[0.14] blur-[100px] opacity-40 pointer-events-none z-0" />
      <div className="fixed bottom-[-100px] right-[-100px] w-[420px] h-[420px] rounded-full bg-amethyst/[0.12] blur-[90px] opacity-28 pointer-events-none z-0" />
      <div className="fixed top-[42%] left-[58%] w-[280px] h-[280px] rounded-full bg-info/[0.08] blur-[70px] opacity-16 pointer-events-none z-0" />

      <AccountNav
        secondaryCta={{ href: "/compte", label: "Mon compte" }}
        primaryCta={{ href: "/dashboard", label: "Dashboard" }}
      />

      <div className="relative z-[2] max-w-[1100px] mx-auto px-7 pb-24">

        {/* ── Hero ── */}
        <section className="grid grid-cols-[1fr_400px] gap-16 items-start py-20">
          <div>
            <div className="flex items-center gap-2.5 font-mono text-[11px] tracking-[0.12em] uppercase text-accent mb-5">
              <span className="w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
              {fullReport ? "Rapport complet" : "Rapport partiel"}
            </div>

            {fullReport ? (
              <>
                <h1 className="font-normal text-[clamp(36px,4vw,54px)] leading-[1.08] tracking-[-1.2px] mb-6 text-label" style={{ fontFamily: "'Instrument Serif', serif" }}>
                  Votre vie à La Rochelle<br />
                  <span className="italic text-accent">en 2050, dimension par dimension.</span>
                </h1>
                <p className="text-[17px] leading-[1.72] text-muted mb-9 max-w-[500px]">
                  Les six lectures de votre situation sont ouvertes. Chaque dimension croise vos données avec les projections disponibles pour La Rochelle.
                </p>
                <div className="flex gap-3 flex-wrap">
                  <Link href="/dashboard" className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-accent text-canvas font-semibold text-[14px] no-underline" style={{ fontFamily: "'Instrument Sans', sans-serif" }}>
                    Voir le dashboard
                  </Link>
                  <Link href="/compte" className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-white/[0.05] text-muted text-[14px] no-underline border border-white/[0.08]">
                    Mon compte
                  </Link>
                </div>
              </>
            ) : (
              <>
                <h1 className="font-normal text-[clamp(36px,4vw,54px)] leading-[1.08] tracking-[-1.2px] mb-6 text-label" style={{ fontFamily: "'Instrument Serif', serif" }}>
                  Ce que La Rochelle devient.<br />
                  <span className="italic text-accent">Les premiers signaux, sans détours.</span>
                </h1>
                <p className="text-[17px] leading-[1.72] text-muted mb-9 max-w-[500px]">
                  Quelques données publiques sur votre territoire suffisent déjà à poser des questions que vous n&apos;auriez peut-être pas pensé à formuler. Ce que vous lisez ici est une première lecture, pas le rapport complet.
                </p>
                <div className="flex gap-3 flex-wrap">
                  <Link href="/#pricing" className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-accent text-canvas font-semibold text-[14px] no-underline" style={{ fontFamily: "'Instrument Sans', sans-serif" }}>
                    Ouvrir le rapport complet
                  </Link>
                  <Link href="/compte" className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-white/[0.05] text-muted text-[14px] no-underline border border-white/[0.08]">
                    Mon compte
                  </Link>
                </div>
              </>
            )}
          </div>

          {/* Panel signals / résumé */}
          <aside
            className="glass rounded-2xl p-7 relative overflow-hidden"
            style={!fullReport ? { borderColor: "rgba(251,146,60,0.22)", boxShadow: "0 0 0 1px rgba(251,146,60,0.15), 0 20px 60px rgba(251,146,60,0.07)" } : undefined}
          >
            {!fullReport && (
              <div className="absolute top-[-50px] right-[-50px] w-[160px] h-[160px] rounded-full pointer-events-none"
                style={{ background: "radial-gradient(circle, rgba(251,146,60,0.08) 0%, transparent 70%)" }} />
            )}
            <p className="font-mono text-[10px] tracking-[0.14em] uppercase text-ghost mb-1">
              {fullReport ? "Six dimensions ouvertes" : "Quelques signaux déjà disponibles"}
            </p>
            <h2 className="font-normal text-[22px] leading-[1.2] text-label mb-5 tracking-[-0.3px]" style={{ fontFamily: "'Instrument Serif', serif" }}>
              {fullReport ? "Rapport complet · La Rochelle · 2050" : "La Rochelle, ce que les données montrent déjà"}
            </h2>

            {fullReport ? (
              <div className="flex flex-col gap-2.5">
                {allModules.map((m) => {
                  const col = MODULE_COLORS[m.id] ?? "#a78bfa";
                  return (
                    <div key={m.id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg" style={{ background: `${col}0a`, border: `1px solid ${col}1a` }}>
                      <span className="text-[16px]">{MODULE_ICONS[m.id]}</span>
                      <span className="text-[14px] text-label font-medium">{m.name}</span>
                      <span className="ml-auto font-mono text-[10px] tracking-[0.06em] uppercase" style={{ color: col }}>Ouvert</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col gap-2.5">
                {heroSignals.map((s) => (
                  <div key={s.label} className="flex gap-3.5 items-start px-3.5 py-3 rounded-lg" style={{ background: `${s.col}0c`, border: `1px solid ${s.col}22` }}>
                    <span className="w-[7px] h-[7px] rounded-full shrink-0 mt-[5px]" style={{ background: s.col, boxShadow: `0 0 8px ${s.col}` }} />
                    <div>
                      <div className="text-[13px] font-medium text-label mb-0.5 leading-[1.3]">{s.label}</div>
                      <div className="font-mono text-[10px] text-ghost tracking-[0.04em]">{s.src}</div>
                    </div>
                  </div>
                ))}
                <p className="font-mono text-[11px] text-ghost tracking-[0.04em] leading-[1.6] mt-1 px-3 py-2.5 rounded-lg bg-white/[0.02] border border-white/[0.08]">
                  Le rapport complet lit ces signaux à travers votre profil. Ce n&apos;est pas la même chose que de lire des données brutes.
                </p>
              </div>
            )}
          </aside>
        </section>

        <div className="border-t border-white/[0.08]" />

        {/* ── Vue gratuite ── */}
        {!fullReport && (
          <>
            {/* Module Quartier ouvert */}
            <section className="pt-14" id="quartier">
              <div className="grid grid-cols-[1fr_300px] gap-10 items-end mb-8">
                <div>
                  <p className="font-mono text-[11px] tracking-[0.12em] uppercase text-ghost mb-2">Ce que votre territoire devient</p>
                  <h2 className="font-normal text-[clamp(24px,2.8vw,36px)] leading-[1.18] tracking-[-0.5px] text-label" style={{ fontFamily: "'Instrument Serif', serif" }}>
                    Quartier : la lecture ouverte.
                  </h2>
                </div>
                <p className="text-[15px] text-muted leading-[1.65]">
                  Ce module lit ce qui se passe autour de chez vous : chaleur, eau, littoral, cadre de vie.
                </p>
              </div>

              <div className="grid grid-cols-[1fr_320px] gap-6 mb-8">
                {/* Carte principale */}
                <div className="glass rounded-xl p-8 border-t-2 border-t-info">
                  <h3 className="font-normal text-[26px] text-label mb-3 tracking-[-0.3px]" style={{ fontFamily: "'Instrument Serif', serif" }}>
                    La Rochelle, à l&apos;horizon 2050 dans le scénario médian.
                  </h3>
                  <p className="text-[16px] leading-[1.75] text-muted mb-4">
                    La chaleur d&apos;abord : La Rochelle passera de 5 à 34 jours par an en alerte canicule d&apos;ici 2050, dans le scénario à +2,7°C (DRIAS / Météo-France). Ce n&apos;est pas une projection lointaine. Ce sont des étés qui changent de texture.
                  </p>
                  <p className="text-[16px] leading-[1.75] text-muted mb-4">
                    Le littoral ensuite. Le risque de submersion progresse de 31 % en scénario médian selon Géorisques. Les quartiers des Minimes et d&apos;Aytré concentrent l&apos;exposition. Le centre historique et les zones en hauteur sont moins concernés.
                  </p>
                  <p className="text-[16px] leading-[1.75] text-muted mb-6">
                    Ce module donne une lecture de ce qui change autour de chez vous. Ce qu&apos;il ne fait pas encore : lire comment ces changements croisent votre logement précis, votre santé, votre métier. C&apos;est ce que le rapport complet articule.
                  </p>

                  <div className="grid grid-cols-2 gap-2.5">
                    {QUARTIER_FACTORS.map((f) => (
                      <div key={f.label} className="glass rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: f.col, boxShadow: `0 0 6px ${f.col}` }} />
                          <span className="text-[13px] font-medium text-label leading-[1.3]">{f.label}</span>
                        </div>
                        <span className="block font-mono text-[11px] tracking-[0.02em] ml-3.5" style={{ color: f.col }}>{f.val}</span>
                        <span className="block font-mono text-[10px] text-ghost tracking-[0.02em] ml-3.5">{f.src}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Sidebar */}
                <div className="flex flex-col gap-3.5">
                  <div className="glass rounded-xl p-5" style={{ borderLeft: "2px solid #fb923c", borderColor: "rgba(251,146,60,0.15)" }}>
                    <p className="font-mono text-[10px] tracking-[0.14em] uppercase text-ghost mb-2">Ce que le rapport complet ajoute</p>
                    <p className="text-[14px] leading-[1.65] text-muted mb-4">
                      Le module Quartier seul donne la lecture du territoire. Le rapport complet croise ces signaux avec votre logement, votre santé et votre mode de vie.
                    </p>
                    <Link href="/#pricing" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-accent text-canvas font-semibold text-[13px] no-underline" style={{ fontFamily: "'Instrument Sans', sans-serif" }}>
                      Voir les formules
                    </Link>
                  </div>

                  <div className="glass rounded-xl p-5" style={{ borderLeft: "2px solid #60a5fa", borderColor: "rgba(96,165,250,0.15)" }}>
                    <p className="font-mono text-[10px] tracking-[0.14em] uppercase text-ghost mb-2">Pages Savoir associées</p>
                    <p className="text-[14px] leading-[1.65] text-muted mb-3">
                      Trois lectures de fond sur les sujets que ce module touche, accessibles gratuitement.
                    </p>
                    <div className="flex flex-col gap-2">
                      {[
                        { label: "La submersion côtière", href: "/savoir/submersion-cotiere" },
                        { label: "Comprendre le DPE de votre logement", href: "/savoir/dpe-logement" },
                        { label: "Le cadmium dans l'alimentation", href: "/savoir/cadmium-alimentation" },
                      ].map((p) => (
                        <Link key={p.href} href={p.href} className="flex items-center gap-1.5 text-[13px] text-info no-underline">
                          <span className="opacity-60">→</span>
                          {p.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Compléter le module Quartier */}
              <div className="border-t border-white/[0.06] pt-8 mb-12">
                <div className="grid grid-cols-[1fr_300px] gap-10 items-end mb-6">
                  <div>
                    <p className="font-mono text-[11px] tracking-[0.12em] uppercase text-ghost mb-2">Module ouvert · à compléter</p>
                    <h3 className="font-normal text-[clamp(20px,2.2vw,28px)] leading-[1.2] tracking-[-0.4px] text-label" style={{ fontFamily: "'Instrument Serif', serif" }}>
                      Vos observations complètent la lecture.
                    </h3>
                  </div>
                  <p className="text-[15px] text-muted leading-[1.65]">
                    Vos réponses croisent les données sans les remplacer. Ce que vous notez reste dans votre espace.
                  </p>
                </div>
                <QuartierWorkbook userKey={account.userId} />
              </div>
            </section>

            {/* Cinq modules fermés */}
            <section className="pt-2">
              <div className="grid grid-cols-[1fr_320px] gap-10 items-end mb-8">
                <div>
                  <p className="font-mono text-[11px] tracking-[0.12em] uppercase text-ghost mb-2">Cinq lectures fermées</p>
                  <h2 className="font-normal text-[clamp(24px,2.8vw,36px)] leading-[1.18] tracking-[-0.5px] text-label" style={{ fontFamily: "'Instrument Serif', serif" }}>
                    Ce que le rapport complet lit pour vous.
                  </h2>
                </div>
                <p className="text-[15px] text-muted leading-[1.65]">
                  Chaque dimension croise votre profil avec les données publiques disponibles pour La Rochelle.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3.5">
                {lockedModules.map((module, i) => {
                  const col = MODULE_COLORS[module.id] ?? "#a78bfa";
                  const benefit = MODULE_BENEFIT[module.id] ?? module.summary;
                  return (
                    <article
                      key={module.id}
                      className="glass rounded-xl p-6 relative opacity-50"
                      style={{ borderTop: "2px solid rgba(255,255,255,0.06)" }}
                    >
                      <div className="w-[34px] h-[34px] rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-[17px] mb-3.5 grayscale">
                        {MODULE_ICONS[module.id]}
                      </div>
                      <p className="font-mono text-[10px] tracking-[0.1em] text-ghost mb-1 uppercase">Module 0{i + 2}</p>
                      <h3 className="font-normal text-[20px] text-muted mb-2.5" style={{ fontFamily: "'Instrument Serif', serif" }}>{module.name}</h3>
                      <p className="text-[13px] text-ghost leading-[1.65] mb-3.5 opacity-70">{benefit}</p>
                      <span className="inline-flex items-center gap-1.5 font-mono text-[10px] tracking-[0.08em] uppercase text-ghost bg-white/[0.04] border border-white/[0.08] rounded-full px-2.5 py-1">
                        Fermé
                      </span>
                    </article>
                  );
                })}
              </div>
            </section>

            {/* Upgrade band */}
            <div className="glass rounded-2xl p-11 grid grid-cols-[1fr_200px] gap-14 items-center mt-12 relative overflow-hidden" style={{ borderColor: "rgba(251,146,60,0.15)" }}>
              <div className="absolute top-[-80px] right-[-80px] w-[260px] h-[260px] rounded-full pointer-events-none"
                style={{ background: "radial-gradient(circle, rgba(251,146,60,0.1) 0%, transparent 70%)" }} />
              <div>
                <p className="font-mono text-[10px] tracking-[0.14em] uppercase text-ghost mb-2.5">Rapport complet</p>
                <h2 className="font-normal text-[clamp(22px,2.4vw,30px)] leading-[1.2] tracking-[-0.5px] text-label mb-3.5" style={{ fontFamily: "'Instrument Serif', serif" }}>
                  Six lectures de votre vie à La Rochelle. Sourcées. Sans généralités.
                </h2>
                <p className="text-[15px] text-muted leading-[1.7]">
                  Logement, métier, santé, mobilité, projets : le rapport complet lit chacune de ces dimensions à travers votre profil et les données publiques disponibles pour votre commune.
                </p>
              </div>
              <div className="text-center">
                <span className="block text-[52px] text-label leading-none tracking-[-2px]" style={{ fontFamily: "'Instrument Serif', serif" }}>
                  14<span className="text-[22px] text-ghost">€</span>
                </span>
                <span className="block font-mono text-[11px] text-ghost tracking-[0.04em] mt-1 mb-5">une fois · ou 9 €/mois</span>
                <Link href="/#pricing" className="flex items-center justify-center px-5 py-2.5 rounded-lg bg-accent text-canvas font-semibold text-[13px] no-underline w-full" style={{ fontFamily: "'Instrument Sans', sans-serif" }}>
                  Voir les formules
                </Link>
                <p className="mt-2.5 font-mono text-[10px] text-ghost tracking-[0.04em] text-center leading-[1.6]">
                  Les 14 € sont déductibles si vous passez en Suivi mensuel.
                </p>
              </div>
            </div>
          </>
        )}

        {/* ── Vue payant ── */}
        {fullReport && (
          <section className="pt-14">
            <div className="grid grid-cols-[1fr_320px] gap-10 items-end mb-8">
              <div>
                <p className="font-mono text-[11px] tracking-[0.12em] uppercase text-ghost mb-2">Six lectures ouvertes</p>
                <h2 className="font-normal text-[clamp(24px,2.8vw,36px)] leading-[1.18] tracking-[-0.5px] text-label" style={{ fontFamily: "'Instrument Serif', serif" }}>
                  Votre situation à La Rochelle, dimension par dimension.
                </h2>
              </div>
              <p className="text-[15px] text-muted leading-[1.65]">
                Sans score synthétique : les arbitrages restent les vôtres.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3.5">
              {allModules.map((module, i) => {
                const col = MODULE_COLORS[module.id] ?? "#a78bfa";
                const benefit = MODULE_BENEFIT[module.id] ?? module.summary;
                return (
                  <article
                    key={module.id}
                    className="glass rounded-xl p-6 relative"
                    style={{ borderTop: `2px solid ${col}` }}
                  >
                    <div className="w-[34px] h-[34px] rounded-lg flex items-center justify-center text-[17px] mb-3.5 border"
                      style={{ background: `${col}16`, borderColor: `${col}22` }}>
                      {MODULE_ICONS[module.id]}
                    </div>
                    <p className="font-mono text-[10px] tracking-[0.1em] text-ghost mb-1 uppercase">Module 0{i + 1}</p>
                    <h3 className="font-normal text-[20px] text-label mb-2.5" style={{ fontFamily: "'Instrument Serif', serif" }}>{module.name}</h3>
                    <p className="text-[13px] text-muted leading-[1.65] mb-3.5">{benefit}</p>
                    <span className="inline-flex items-center gap-1.5 font-mono text-[10px] tracking-[0.08em] uppercase" style={{ color: col }}>
                      <span className="w-[5px] h-[5px] rounded-full shrink-0" style={{ background: col, boxShadow: `0 0 6px ${col}` }} />
                      Ouvert
                    </span>
                  </article>
                );
              })}
            </div>
          </section>
        )}

        {/* Footer nav */}
        <div className="flex items-center gap-3 flex-wrap mt-12 pt-7 border-t border-white/[0.08]">
          <Link href="/#pricing" className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-accent text-canvas font-semibold text-[14px] no-underline" style={{ fontFamily: "'Instrument Sans', sans-serif" }}>
            Ouvrir le rapport complet
          </Link>
          <Link href="/compte" className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-white/[0.05] text-muted text-[14px] no-underline border border-white/[0.08]">
            Mon compte
          </Link>
          <Link href="/" className="font-mono text-[11px] tracking-[0.06em] uppercase text-ghost no-underline py-2 ml-auto">
            Retour au site
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-[2] border-t border-white/[0.08]">
        <div className="max-w-[1100px] mx-auto px-7 py-9 flex items-center justify-between gap-6 flex-wrap">
          <div className="text-[20px] italic text-label tracking-[-0.3px]" style={{ fontFamily: "'Instrument Serif', serif" }}>
            futur<span className="text-accent not-italic">•</span>e
          </div>
          <div className="flex gap-6 flex-wrap">
            {["Manifeste", "Méthodologie", "Pages Savoir", "Contact", "Mentions légales"].map((l) => (
              <a key={l} href="#" className="font-mono text-[11px] text-ghost no-underline tracking-[0.06em] uppercase">
                {l}
              </a>
            ))}
          </div>
          <div className="font-mono text-[11px] text-ghost tracking-[0.04em]">
            Données publiques françaises · Aucune publicité
          </div>
        </div>
      </footer>
    </div>
  );
}
