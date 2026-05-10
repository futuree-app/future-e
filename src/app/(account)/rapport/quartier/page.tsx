import Link from "next/link";
import { AccountNav } from "@/components/AccountNav";
import { QuartierWorkbook } from "@/app/(account)/compte/QuartierWorkbook";
import { canAccessCompleteReport } from "@/lib/access";
import { getCurrentUserAccount } from "@/lib/user-account";

const QUARTIER_FACTORS = [
  { label: "Jours de chaleur extrême", val: "34 jours/an en 2050", col: "var(--red)", src: "DRIAS / Météo-France · +2,7°C" },
  { label: "Risque submersion", val: "+31 % en scénario médian", col: "var(--blue)", src: "Géorisques / BRGM" },
  { label: "Érosion littorale", val: "Recul du trait de côte documenté", col: "var(--blue)", src: "Cerema · littoral atlantique" },
  { label: "Îlots de chaleur urbains", val: "Quartiers centre exposés", col: "var(--red)", src: "INSEE / IGN" },
];

export default async function RapportQuartierPage() {
  const account = await getCurrentUserAccount();
  const fullReport = canAccessCompleteReport(account);

  return (
    <div
      className="min-h-screen bg-canvas text-label relative overflow-hidden"
      style={{ fontFamily: "'Instrument Sans', sans-serif" }}
    >
      <div className="fixed top-[-160px] left-[-130px] w-[520px] h-[520px] rounded-full bg-info/[0.10] blur-[100px] opacity-32 pointer-events-none z-0" />
      <div className="fixed bottom-[-100px] right-[-80px] w-[400px] h-[400px] rounded-full bg-accent/[0.08] blur-[88px] opacity-24 pointer-events-none z-0" />

      <AccountNav
        secondaryCta={{ href: "/rapport", label: "Mon rapport" }}
        primaryCta={{ href: "/dashboard", label: "Dashboard" }}
      />

      <div className="relative z-[2] max-w-[1100px] mx-auto px-7 pb-24">
        <section className="grid grid-cols-[1fr_360px] gap-14 items-start py-20">
          <div>
            <div className="flex items-center gap-2.5 font-mono text-[11px] tracking-[0.12em] uppercase text-info mb-5">
              <span className="w-1.5 h-1.5 rounded-full bg-info shrink-0" />
              Module 01 · Quartier
            </div>
            <h1
              className="font-normal text-[clamp(36px,4vw,54px)] leading-[1.08] tracking-[-1.2px] mb-6 text-label"
              style={{ fontFamily: "'Instrument Serif', serif" }}
            >
              Ce que votre territoire devient.<br />
              <span className="italic text-info">Et ce que vous y voyez déjà.</span>
            </h1>
            <p className="text-[17px] leading-[1.72] text-muted mb-9 max-w-[560px]">
              Ce module lit ce qui change autour de chez vous : chaleur, eau, littoral, cadre de vie. Les données donnent la trajectoire. Vos réponses donnent le point d&apos;accroche le plus personnel.
            </p>
            <div className="flex gap-3 flex-wrap">
              <Link href="/rapport" className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-white/[0.05] text-muted text-[14px] no-underline border border-white/[0.08]">
                Retour au hub
              </Link>
              {!fullReport ? (
                <Link href="/#pricing" className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-accent text-canvas font-semibold text-[14px] no-underline">
                  Ouvrir le rapport complet
                </Link>
              ) : null}
            </div>
          </div>

          <aside className="glass rounded-2xl p-7">
            <p className="font-mono text-[10px] tracking-[0.14em] uppercase text-ghost mb-1">Lecture territoriale</p>
            <h2 className="font-normal text-[22px] leading-[1.2] text-label mb-5 tracking-[-0.3px]" style={{ fontFamily: "'Instrument Serif', serif" }}>
              La Rochelle, horizon 2050.
            </h2>
            <div className="flex flex-col gap-2.5">
              {QUARTIER_FACTORS.map((f) => (
                <div key={f.label} className="flex gap-3.5 items-start px-3.5 py-3 rounded-lg" style={{ background: `${f.col}0c`, border: `1px solid ${f.col}22` }}>
                  <span className="w-[7px] h-[7px] rounded-full shrink-0 mt-[5px]" style={{ background: f.col, boxShadow: `0 0 8px ${f.col}` }} />
                  <div>
                    <div className="text-[13px] font-medium text-label mb-0.5 leading-[1.3]">{f.label}</div>
                    <div className="font-mono text-[10px] tracking-[0.04em]" style={{ color: f.col }}>{f.val}</div>
                    <div className="font-mono text-[10px] text-ghost tracking-[0.04em]">{f.src}</div>
                  </div>
                </div>
              ))}
            </div>
          </aside>
        </section>

        <div className="border-t border-white/[0.08]" />

        <section className="pt-14">
          <div className="grid grid-cols-[1fr_320px] gap-10 items-end mb-8">
            <div>
              <p className="font-mono text-[11px] tracking-[0.12em] uppercase text-ghost mb-2">Lecture par défaut</p>
              <h2 className="font-normal text-[clamp(24px,2.8vw,36px)] leading-[1.18] tracking-[-0.5px] text-label" style={{ fontFamily: "'Instrument Serif', serif" }}>
                Les premiers signaux autour de chez vous.
              </h2>
            </div>
            <p className="text-[15px] text-muted leading-[1.65]">
              Une lecture de lieu : chaleur, littoral, eau, cadre de vie. Pas encore votre logement, pas encore votre santé, pas encore votre mobilité.
            </p>
          </div>

          <div className="grid grid-cols-[1fr_320px] gap-6 mb-8">
            <div className="glass rounded-xl p-8 border-t-2 border-t-info">
              <h3 className="font-normal text-[26px] text-label mb-3 tracking-[-0.3px]" style={{ fontFamily: "'Instrument Serif', serif" }}>
                La Rochelle, à l&apos;horizon 2050 dans le scénario médian.
              </h3>
              <p className="text-[16px] leading-[1.75] text-muted mb-4">
                La chaleur d&apos;abord : La Rochelle passerait de 5 à 34 jours par an en alerte canicule d&apos;ici 2050, dans le scénario à +2,7°C. Ce n&apos;est pas un basculement abstrait. Ce sont des étés qui deviennent plus longs, plus lourds et plus difficiles à traverser dans les quartiers denses.
              </p>
              <p className="text-[16px] leading-[1.75] text-muted mb-4">
                Le littoral ensuite. Le risque de submersion progresse sur l&apos;agglomération et les quartiers des Minimes ou d&apos;Aytré concentrent une partie de l&apos;exposition. Le centre historique et les secteurs plus hauts restent moins concernés.
              </p>
              <p className="text-[16px] leading-[1.75] text-muted mb-6">
                Ce module lit ce qui change autour de chez vous. Il ne dit pas encore comment ces changements croisent votre logement précis, votre budget ou votre santé. C&apos;est la suite du rapport qui prend le relais.
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

            <div className="flex flex-col gap-3.5">
              <div className="glass rounded-xl p-5" style={{ borderLeft: "2px solid var(--orange)", borderColor: "var(--orange-tint)" }}>
                <p className="font-mono text-[10px] tracking-[0.14em] uppercase text-ghost mb-2">Ce que le rapport complet ajoute</p>
                <p className="text-[14px] leading-[1.65] text-muted mb-4">
                  Le module Quartier donne la lecture du lieu. Le rapport complet la croise ensuite avec votre logement, votre profil et vos autres dimensions de vie.
                </p>
                {!fullReport ? (
                  <Link href="/#pricing" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-accent text-canvas font-semibold text-[13px] no-underline">
                    Voir les formules
                  </Link>
                ) : (
                  <Link href="/rapport/logement" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-white/[0.05] text-muted text-[13px] no-underline border border-white/[0.08]">
                    Ouvrir le module Logement
                  </Link>
                )}
              </div>

              <div className="glass rounded-xl p-5" style={{ borderLeft: "2px solid var(--blue)", borderColor: "var(--blue-tint)" }}>
                <p className="font-mono text-[10px] tracking-[0.14em] uppercase text-ghost mb-2">Pages Savoir associées</p>
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
        </section>

        <section className="pt-4">
          <div className="grid grid-cols-[1fr_300px] gap-10 items-end mb-6">
            <div>
              <p className="font-mono text-[11px] tracking-[0.12em] uppercase text-ghost mb-2">Approfondissement</p>
              <h3 className="font-normal text-[clamp(20px,2.2vw,28px)] leading-[1.2] tracking-[-0.4px] text-label" style={{ fontFamily: "'Instrument Serif', serif" }}>
                Vos observations complètent la lecture.
              </h3>
            </div>
            <p className="text-[15px] text-muted leading-[1.65]">
              Vos réponses croisent les données sans les remplacer. Elles restent locales à votre espace.
            </p>
          </div>
          <QuartierWorkbook userKey={account.userId} />
        </section>
      </div>
    </div>
  );
}
