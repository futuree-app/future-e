import { bindOrphans } from "@/lib/typography";

type Props = {
  arbitrage: string | null;
  // Ligne de contexte spatial : la RELATION entre les communes (distance, même région/UU). Pose
  // l'enjeu géographique du choix sans carte ni bloc (cf. board « révéler, pas localiser »).
  spatialContext: string | null;
};

// Synthèse d'ouverture du mode choix. La phrase d'arbitrage déterministe NOMME la tension du
// choix (« selon votre priorité, c'est X ou Y »), sans la résoudre : elle dit SUR QUOI se joue
// le départage, pas COMMENT il se tranche. C'est le teaser qui crée l'envie sans cannibaliser.
//
// Le narratif IA streamé qui DÉNOUAIT le choix a été retiré (board 2026-06-27) : il tranchait
// gratuitement à la place du lecteur (« suffit presque pour départager »), donc cannibalisait le
// Pack. La route /api/comparateur-vie/synthesize-choix reste en place : réversible. Décision à
// confirmer sur données une fois le funnel instrumenté (cf. rapport Business Strategist).
export function ModeChoixSynthese({ arbitrage, spatialContext }: Props) {
  if (!arbitrage && !spatialContext) return null;
  return (
    <section className="mt-10">
      <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-accent mb-3">En un coup d&apos;œil</p>
      {/* Apex typographique de la page résultat : la lecture du choix domine le titre d'explorateur
          (23px). Mesure de lecture ~680px en style inline (prose en espace ouvert, pas une carte). */}
      {arbitrage && (
        <p className="text-[26px] leading-[1.35] text-label" style={{ fontFamily: "'Instrument Serif', serif", textWrap: "pretty", maxWidth: 680 }}>
          {bindOrphans(arbitrage)}
        </p>
      )}
      {/* Contexte spatial : une ligne sobre, sous l'arbitrage (la relation, pas la localisation). */}
      {spatialContext && (
        <p className="mt-3 text-[14.5px] leading-[1.55] text-muted" style={{ textWrap: "pretty", maxWidth: 680 }}>
          {bindOrphans(spatialContext)}
        </p>
      )}
    </section>
  );
}
