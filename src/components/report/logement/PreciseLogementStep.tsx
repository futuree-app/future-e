import { deriveAddressDpeContext, type DpeRecord } from "@/lib/dpe-attribution";
import { DpeSelector } from "@/components/report/DpeSelector";

// Écran intermédiaire « Précisez votre logement » (spec 5a, retour porteur) : quand plusieurs
// diagnostics existent à l'adresse, on demande LEQUEL est le bon AVANT de rendre le rapport, pour
// que le Passeport s'affiche rempli (jamais un Passeport vide « DPE non trouvé » en tête).
export function PreciseLogementStep({
  addressLabel, candidates, onPick, onNotInList,
}: {
  addressLabel: string | null;
  candidates: DpeRecord[];
  onPick: (d: DpeRecord) => void;
  onNotInList: () => void;
}) {
  return (
    <section style={{ padding: "24px 0 96px" }}>
      <div className="glass rounded-xl p-8 border-t-2 border-t-accent" style={{ maxWidth: 760 }}>
        <p className="font-mono text-[11px] tracking-[0.12em] uppercase text-ghost mb-2">Précisez votre logement</p>
        {addressLabel && (
          <h2 className="font-normal text-[clamp(20px,2.4vw,28px)] leading-[1.15] tracking-[-0.3px] text-label mb-5" style={{ fontFamily: "'Instrument Serif', serif" }}>
            {addressLabel}
          </h2>
        )}
        <DpeSelector
          candidates={candidates}
          context={deriveAddressDpeContext(candidates)}
          onPick={onPick}
          onNotInList={onNotInList}
        />
      </div>
    </section>
  );
}
