import type { LogementReport } from "@/lib/logement-report-types";
import type { DpeRecord } from "@/lib/dpe-attribution";
import { PassportTiltScene } from "@/components/report/PassportTiltScene";
import { DpeBadge } from "./kit";

// Passeport du bien : pendant du passeport territorial, au grain adresse. Surface
// teintée à l'accent du module, adresse en grand (Instrument Serif), DPE en sceau.
export function PropertyPassport({
  address,
  parcel,
  dpe,
}: {
  address: LogementReport["address"];
  parcel: LogementReport["parcel"];
  dpe: DpeRecord | null;
}) {
  const tint = "#c8b89a";
  const dpeLetter = dpe?.etiquette_dpe ?? null;
  const fields: { label: string; value: string }[] = [];
  if (dpe?.surface_m2) fields.push({ label: "Surface", value: `${dpe.surface_m2} m²` });
  if (dpe?.annee_construction) fields.push({ label: "Construction", value: String(dpe.annee_construction) });
  if (dpe?.type_batiment) fields.push({ label: "Type de bâti", value: dpe.type_batiment });
  if (parcel?.parcelCode)
    fields.push({ label: "Parcelle", value: parcel.contenance ? `${parcel.parcelCode} · ${parcel.contenance} m²` : parcel.parcelCode });

  return (
    // Scène 3D : pendant du passeport territorial. Se déplie au chargement, puis
    // répond au survol (tilt, reflet, parallaxe). Classes dans globals.css.
    <PassportTiltScene>
    <section
      className="passport-unfold rounded-2xl px-7 py-6 relative overflow-hidden"
      style={{
        background: `linear-gradient(150deg, ${tint}1f 0%, ${tint}0a 55%, rgba(8,10,18,0.6) 100%)`,
        border: `1px solid ${tint}33`,
        boxShadow: `inset 0 1px 0 ${tint}1f`,
      }}
    >
      <div className="flex items-start justify-between gap-4 mb-3">
        <div>
          <p className="font-mono text-[10px] tracking-[0.22em] uppercase" style={{ color: tint }}>
            Passeport du logement
          </p>
          {parcel?.parcelCode && (
            <p className="font-mono text-[10px] tracking-[0.16em] uppercase text-ghost mt-1">Parcelle {parcel.parcelCode}</p>
          )}
        </div>
        <div className="flex flex-col items-end gap-1.5 shrink-0 passport-layer-seal">
          <DpeBadge label={dpeLetter} size="lg" />
          {!dpeLetter && (
            <p className="text-right font-mono text-[9px] tracking-[0.1em] uppercase text-ghost/70">DPE non trouvé</p>
          )}
        </div>
      </div>

      <h3
        className="passport-layer-name font-normal text-[clamp(22px,3vw,32px)] leading-[1.1] tracking-[-0.01em] text-label"
        style={{ fontFamily: "'Instrument Serif', serif" }}
      >
        {address?.label ?? "Logement"}
      </h3>
      {dpeLetter && (
        <p className="text-[14px] leading-[1.55] text-muted mt-2">Classé {dpeLetter} au diagnostic énergétique.</p>
      )}

      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-0 mt-5 pt-2 border-t" style={{ borderColor: `${tint}26` }}>
        {fields.map((f) => (
          <div key={f.label} className="flex items-start gap-3 py-3 border-b" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
            <div className="min-w-0">
              <dt className="font-mono text-[10px] tracking-[0.14em] uppercase text-ghost mb-1">{f.label}</dt>
              <dd className="text-[15px] text-label leading-snug">{f.value}</dd>
            </div>
          </div>
        ))}
      </dl>
    </section>
    </PassportTiltScene>
  );
}
