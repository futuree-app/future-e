// FUT-87 · LE RENDU ACTUEL DU MODULE LOGEMENT, POUR LA COMPARAISON AVANT / APRÈS. DEV UNIQUEMENT.
//
// Les blocs de production, tels quels et dans l'ordre de `LogementModule`, nourris par la fixture
// anonymisée du prototype (`fixture-logement.ts`). Le module complet n'est pas monté : il lit le
// dossier du compte et appelle les sources. Ses blocs, eux, sont purement présentationnels.
// Absents ici : la synthèse rédigée (elle exige le modèle) et le sélecteur de diagnostic.
import { notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import { PropertyPassport } from "@/components/report/logement/PropertyPassport";
import { EnergieAvant } from "@/components/prototypes/fut87/EnergieAvant";
import { ThermalComfortSection } from "@/components/report/ThermalComfortSection";
import { RegulatoryStatusBlock } from "@/components/report/logement/RegulatorySection";
import { InondationLectureBlock } from "@/components/report/logement/InondationSection";
import { SinistraliteBlock } from "@/components/report/logement/SinistraliteSection";
import { DecisionChecklist } from "@/components/report/logement/DecisionChecklist";
import { FamilyHeading, Block } from "@/components/report/logement/kit";
import { ReportSection, GlassCard } from "@/components/report/kit";
import { EchelleVisual } from "@/components/report/EchelleVisual";
import { RAPPORT_TEMOIN, DPE_TEMOIN, FAITS_TEMOIN, PROJET_TEMOIN, COMMUNE_TEMOIN, lecturesTemoin } from "@/components/prototypes/fut87/fixture-logement";

export default function AvantLogement() {
  if (process.env.NODE_ENV === "production") notFound();
  const r = RAPPORT_TEMOIN;
  const l = lecturesTemoin();
  const g = r.georisques?.address;
  return (
    <>
      <Navbar />
      <div className="max-w-[1100px] mx-auto px-5 sm:px-7">
        <p className="pt-6 font-mono text-[11px] text-ghost">Rendu actuel (blocs de production) · même logement témoin que le prototype FUT-87</p>
        <section className="pt-10 pb-12 flex flex-wrap items-center justify-between gap-8 border-b border-[var(--border-1)]">
          <div className="max-w-[640px]">
            <p className="font-mono text-[11px] tracking-[0.12em] uppercase text-accent mb-4">Module 03 · Logement</p>
            <h1 className="text-[length:var(--text-display)] font-[var(--weight-display)] leading-[1.1] text-label">
              Ce logement, lu à son adresse.<br /><span className="text-accent italic">Énergie, risques, bâti.</span>
            </h1>
          </div>
          <EchelleVisual active="logement" />
        </section>
        <section style={{ padding: "24px 0 96px", display: "grid", gap: 40 }}>
          <PropertyPassport address={r.address} parcel={r.parcel} dpe={DPE_TEMOIN} />
          <div style={{ display: "grid", gap: 36 }}>
            <FamilyHeading color="var(--accent)">Le logement lui-même</FamilyHeading>
            <EnergieAvant dpe={DPE_TEMOIN} audit={r.audit} auditStatus={r.auditStatus} candidates={r.dpeCandidates ?? []} />
            <ThermalComfortSection evidence={l.confort} communeName={COMMUNE_TEMOIN} dpeYear="2024" />
            <FamilyHeading color="var(--blue)">Ce à quoi cette adresse est exposée</FamilyHeading>
            <ReportSection eyebrow="Risques du bâti">
              <GlassCard>
                <div style={{ display: "grid", gap: 16 }}>
                  <p style={{ fontSize: 14, color: "var(--fg-2)", lineHeight: 1.65, margin: 0 }}>Ce que les bases publiques recensent sur l&apos;exposition du bâti à cette adresse.</p>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px,1fr))", gap: 14 }}>
                    <Block label="Sismicité" value="Faible" />
                    <Block label="Retrait-gonflement des argiles" value={g?.rga?.label ?? "—"} />
                  </div>
                </div>
              </GlassCard>
            </ReportSection>
            <RegulatoryStatusBlock georisques={r.georisques} heritage={r.heritage ?? null} />
            {l.inondation ? <InondationLectureBlock lecture={l.inondation} /> : null}
            <SinistraliteBlock sinistralite={r.sinistralite!} commune={COMMUNE_TEMOIN} lectureInondationRendue={Boolean(l.inondation)} />
          </div>
          <DecisionChecklist facts={FAITS_TEMOIN} project={PROJET_TEMOIN} />
        </section>
      </div>
    </>
  );
}
