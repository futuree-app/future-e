import "server-only";
export const dynamic = "force-dynamic";

import Link from "next/link";
import { AccountNav } from "@/components/AccountNav";
import { QuartierWorkbook } from "@/app/(account)/compte/QuartierWorkbook";
import { canAccessCompleteReport } from "@/lib/access";
import { getCurrentUserAccount, requireCurrentUser } from "@/lib/user-account";
import { gatherCommuneEnrichment, type EnrichmentResult } from "@/lib/commune-enrichment";
import { CommuneSetupBanner } from "@/components/CommuneSetupBanner";

type Factor = { label: string; val: string; col: string; src: string; missing: boolean };

function buildFactors(enrichment: EnrichmentResult | null): Factor[] {
  const gwl20 = enrichment?.drias?.commune.s["gwl20"]?.v;
  const ademe = enrichment?.ademe;
  const r = (v: number | undefined | null) => (v != null ? Math.round(v) : null);

  const heatDays = r(gwl20?.["NORTX35D_yr"]);
  const tropicalNights = r(gwl20?.["NORTR_yr"]);
  const pm25 = ademe?.commune.qualite_air.pm25 ?? null;
  const fireDays = r(gwl20?.["NORIFM40_yr"]);

  return [
    {
      label: "Jours de chaleur extrême",
      val: heatDays != null ? `${heatDays} jours/an en 2050` : "—",
      col: "var(--red)",
      src: "DRIAS / Météo-France · scénario +2°C",
      missing: heatDays == null,
    },
    {
      label: "Nuits tropicales",
      val: tropicalNights != null ? `${tropicalNights} nuits/an en 2050` : "—",
      col: "var(--orange)",
      src: "DRIAS / Météo-France · Tmin > 20°C",
      missing: tropicalNights == null,
    },
    {
      label: "Qualité de l'air",
      val: pm25 != null ? `${pm25} µg/m³ (PM2.5 annuel)` : "—",
      col: "var(--blue)",
      src: "ADEME / données territoires",
      missing: pm25 == null,
    },
    {
      label: "Risque incendie",
      val: fireDays != null ? `${fireDays} jours/an en 2050` : "—",
      col: "var(--orange)",
      src: "DRIAS · indice météo-feu > 40",
      missing: fireDays == null,
    },
  ];
}

function buildParagraphs(communeName: string, enrichment: EnrichmentResult | null): string[] {
  const gwl20 = enrichment?.drias?.commune.s["gwl20"]?.v;
  const ademe = enrichment?.ademe;
  const r = (v: number | undefined | null) => (v != null ? Math.round(v) : null);

  const heatDays = r(gwl20?.["NORTX35D_yr"]);
  const tropicalNights = r(gwl20?.["NORTR_yr"]);
  const pm25 = ademe?.commune.qualite_air.pm25 ?? null;
  const fireDays = r(gwl20?.["NORIFM40_yr"]);

  const paragraphs: string[] = [];

  if (heatDays != null) {
    let p = `La chaleur d'abord : ${communeName} atteindrait ${heatDays} jour${heatDays > 1 ? "s" : ""} par an de chaleur extrême (Tmax > 35°C) d'ici 2050, dans le scénario à +2°C. Ce n'est pas un basculement abstrait. Ce sont des étés qui deviennent plus longs, plus lourds et plus difficiles à traverser.`;
    if (tropicalNights != null) {
      p += ` Les nuits ne rafraîchissent plus : ${tropicalNights} nuit${tropicalNights > 1 ? "s" : ""} tropicale${tropicalNights > 1 ? "s" : ""} par an sont attendues (Tmin > 20°C).`;
    }
    paragraphs.push(p);
  } else if (!enrichment?.drias) {
    paragraphs.push(
      `Les projections climatiques pour ${communeName} ne sont pas encore disponibles dans notre base DRIAS. Cette commune sera intégrée lors de la prochaine mise à jour.`,
    );
  }

  const airParts: string[] = [];
  if (pm25 != null) airParts.push(`la qualité de l'air affiche ${pm25} µg/m³ de PM2.5 en moyenne annuelle`);
  if (fireDays != null && fireDays > 2)
    airParts.push(`le risque météo-feu dépasse le seuil critique ${fireDays} jour${fireDays > 1 ? "s" : ""} par an en 2050`);
  if (airParts.length > 0) {
    paragraphs.push(
      airParts
        .map((s, i) => (i === 0 ? s.charAt(0).toUpperCase() + s.slice(1) : s))
        .join(", et ") + ".",
    );
  }

  paragraphs.push(
    "Ce module lit ce qui change autour de chez vous. Il ne dit pas encore comment ces changements croisent votre logement précis, votre budget ou votre santé. C'est la suite du rapport qui prend le relais.",
  );

  return paragraphs;
}

export default async function RapportQuartierPage() {
  const account = await getCurrentUserAccount();
  const { supabase, user } = await requireCurrentUser();
  const fullReport = canAccessCompleteReport(account);

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("home_commune, home_insee_code")
    .eq("user_id", user.id)
    .maybeSingle();

  const communeName = profile?.home_commune ?? null;
  const inseeCode = profile?.home_insee_code ?? null;

  const enrichment = inseeCode ? await gatherCommuneEnrichment(inseeCode) : null;

  const factors = buildFactors(enrichment);
  const paragraphs = communeName ? buildParagraphs(communeName, enrichment) : [];

  const displayName = communeName ?? "votre commune";

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
        {!communeName && (
          <div className="pt-10">
            <CommuneSetupBanner />
          </div>
        )}

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
              Ce module lit ce qui change autour de chez vous : chaleur, eau, air, cadre de vie. Les données donnent la trajectoire. Vos réponses donnent le point d&apos;accroche le plus personnel.
            </p>
            <div className="flex gap-3 flex-wrap">
              <Link href="/rapport" className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-white/[0.05] text-muted text-[14px] no-underline border border-white/[0.08]">
                Retour au hub
              </Link>
            </div>
          </div>

          <aside className="glass rounded-2xl p-7">
            <p className="font-mono text-[10px] tracking-[0.14em] uppercase text-ghost mb-1">Lecture territoriale</p>
            <h2 className="font-normal text-[22px] leading-[1.2] text-label mb-5 tracking-[-0.3px]" style={{ fontFamily: "'Instrument Serif', serif" }}>
              {displayName}, horizon 2050.
            </h2>
            <div className="flex flex-col gap-2.5">
              {factors.map((f) => (
                <div
                  key={f.label}
                  className="flex gap-3.5 items-start px-3.5 py-3 rounded-lg"
                  style={{
                    background: f.missing ? "var(--ghost)08" : `${f.col}0c`,
                    border: `1px solid ${f.missing ? "var(--ghost)" : f.col}22`,
                    opacity: f.missing ? 0.5 : 1,
                  }}
                >
                  <span
                    className="w-[7px] h-[7px] rounded-full shrink-0 mt-[5px]"
                    style={{ background: f.missing ? "var(--ghost)" : f.col, boxShadow: f.missing ? "none" : `0 0 8px ${f.col}` }}
                  />
                  <div>
                    <div className="text-[13px] font-medium text-label mb-0.5 leading-[1.3]">{f.label}</div>
                    <div className="font-mono text-[10px] tracking-[0.04em]" style={{ color: f.missing ? "var(--ghost)" : f.col }}>{f.val}</div>
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
              <p className="font-mono text-[11px] tracking-[0.12em] uppercase text-ghost mb-2">Lecture par données</p>
              <h2 className="font-normal text-[clamp(24px,2.8vw,36px)] leading-[1.18] tracking-[-0.5px] text-label" style={{ fontFamily: "'Instrument Serif', serif" }}>
                Les premiers signaux autour de chez vous.
              </h2>
            </div>
            <p className="text-[15px] text-muted leading-[1.65]">
              Une lecture de lieu : chaleur, air, risques, cadre de vie. Pas encore votre logement, pas encore votre santé, pas encore votre mobilité.
            </p>
          </div>

          <div className="grid grid-cols-[1fr_320px] gap-6 mb-8">
            <div className="glass rounded-xl p-8 border-t-2 border-t-info">
              <h3 className="font-normal text-[26px] text-label mb-3 tracking-[-0.3px]" style={{ fontFamily: "'Instrument Serif', serif" }}>
                {displayName}, à l&apos;horizon 2050 dans le scénario médian.
              </h3>
              {paragraphs.length > 0 ? (
                paragraphs.map((p, i) => (
                  <p key={i} className="text-[16px] leading-[1.75] text-muted mb-4">
                    {p}
                  </p>
                ))
              ) : (
                <p className="text-[16px] leading-[1.75] text-muted mb-4">
                  Renseignez votre commune dans votre profil pour accéder aux projections climatiques de votre territoire.
                </p>
              )}

              <div className="grid grid-cols-2 gap-2.5 mt-6">
                {factors.map((f) => (
                  <div key={f.label} className="glass rounded-lg p-4" style={{ opacity: f.missing ? 0.45 : 1 }}>
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className="w-1.5 h-1.5 rounded-full shrink-0"
                        style={{ background: f.missing ? "var(--ghost)" : f.col, boxShadow: f.missing ? "none" : `0 0 6px ${f.col}` }}
                      />
                      <span className="text-[13px] font-medium text-label leading-[1.3]">{f.label}</span>
                    </div>
                    <span className="block font-mono text-[11px] tracking-[0.02em] ml-3.5" style={{ color: f.missing ? "var(--ghost)" : f.col }}>{f.val}</span>
                    <span className="block font-mono text-[10px] text-ghost tracking-[0.02em] ml-3.5">{f.src}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-3.5">
              {fullReport && (
                <div className="glass rounded-xl p-5" style={{ borderLeft: "2px solid var(--orange)" }}>
                  <p className="font-mono text-[10px] tracking-[0.14em] uppercase text-ghost mb-2">Module suivant</p>
                  <p className="text-[14px] leading-[1.65] text-muted mb-4">
                    Le module Quartier donne la lecture du lieu. Logement, santé, mobilité, métier et projets croisent ensuite ces données avec votre profil.
                  </p>
                  <Link href="/rapport/logement" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-white/[0.05] text-muted text-[13px] no-underline border border-white/[0.08]">
                    Ouvrir le module Logement
                  </Link>
                </div>
              )}

              <div className="glass rounded-xl p-5" style={{ borderLeft: "2px solid var(--blue)" }}>
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
