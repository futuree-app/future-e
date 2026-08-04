import React from "react";
import type { OnrnSinistralite, PerilState } from "@/lib/onrn-sinistralite";
import { ReportSection, GlassCard } from "@/components/report/kit";
import { MetricTooltip } from "@/components/MetricTooltip";
import { Disclosure } from "./kit";

// Face 2 — matérialité assurantielle passée (ONRN/CCR, 1995-2021). Coût moyen +
// fréquence des sinistres indemnisés, classes verbatim gatées par la
// représentativité. Jamais prédictif : voir docs/vault/modules/logement.md.
// Reformatage typographique des classes verbatim ONRN : mêmes BORNES exactes, libellé propre
// (le verbatim source est incohérent : « 20k€ » vs « 10 k€ »). On n'invente aucune précision.
const ONRN_COUT_LABEL: Record<string, string> = {
  "Entre 0 et 2,5 k€": "moins de 2 500 €",
  "Entre 2,5 et 5 k€": "2 500 à 5 000 €",
  "Entre 5 et 10 k€": "5 000 à 10 000 €",
  "Entre 10 et 20k€": "10 000 à 20 000 €",
  "Plus de 20 k€": "plus de 20 000 €",
};
// « ‰ » se lit mal : on traduit en « pour 1 000 » (mêmes bornes). Le ‰ reste dans « Sources et limites ».
const ONRN_FREQ_PLAIN: Record<string, string> = {
  "Entre 0 et 1 ‰": "moins de 1 pour 1 000",
  "Entre 1 et 2 ‰": "1 à 2 pour 1 000",
  "Entre 2 et 5 ‰": "2 à 5 pour 1 000",
  "Entre 5 et 10 ‰": "5 à 10 pour 1 000",
  "Plus de 10 ‰": "plus de 10 pour 1 000",
};
// Rang ordinal des classes de fréquence. Sert UNIQUEMENT à comparer deux périls d'une même
// commune quand leurs classes sont strictement séparées (rangs différents). Ce n'est pas un
// score (ADR-0001 vise le score composite et le verdict, pas la comparaison factuelle d'une
// même métrique dans une commune) : on rapporte un fait, on ne note ni ne classe la commune.
const ONRN_FREQ_RANK: Record<string, number> = {
  "Entre 0 et 1 ‰": 1,
  "Entre 1 et 2 ‰": 2,
  "Entre 2 et 5 ‰": 3,
  "Entre 5 et 10 ‰": 4,
  "Plus de 10 ‰": 5,
};
const ONRN_REPR_LABEL: Record<string, string> = {
  "< 15%": "moins de 15 %",
  "Entre 15 et 30%": "15 à 30 %",
  "Entre 30 et 50%": "30 à 50 %",
  "> 50%": "plus de 50 %",
};
const onrnLabel = (map: Record<string, string>, v: string) => map[v] ?? v; // repli = verbatim
const SINI_EYEBROW: React.CSSProperties = { fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--fg-4)" };

function PerilLine({ peril, word, color, state, tip }: { peril: string; word: string; color: string; state: PerilState; tip: string }) {
  if (state.kind === "indispo") return null;
  return (
    <div style={{ display: "grid", gap: 6 }}>
      <div style={{ ...SINI_EYEBROW, color, display: "flex", alignItems: "center", gap: 6 }}>
        <span>{peril}</span>
        <MetricTooltip text={tip} accent={color} />
      </div>
      {state.kind === "lecture" && (
        // Fréquence = le signal (en évidence) ; le coût moyen = preuve secondaire, en dessous
        // (retour porteur : la fréquence relative est le message, pas le coût).
        <div style={{ display: "grid", gap: 2 }}>
          <span style={{ fontSize: 18, fontWeight: 500, color: "var(--fg-hi)", fontVariantNumeric: "tabular-nums" }}>
            {onrnLabel(ONRN_FREQ_PLAIN, state.frequence)}
          </span>
          <span style={{ fontSize: 12.5, color: "var(--fg-4)", lineHeight: 1.55 }}>
            sinistres indemnisés pour 1 000 biens assurés · coût moyen{" "}
            <span style={{ color: "var(--fg-1)", fontWeight: 500 }}>{onrnLabel(ONRN_COUT_LABEL, state.cout)}</span>
          </span>
        </div>
      )}
      {state.kind === "aucun" && (
        <div style={{ fontSize: 14, color: "var(--fg-2)", lineHeight: 1.65 }}>
          Aucun sinistre {word} n&apos;a été remboursé dans cette commune sur la période connue. Un passé sans dégât ne garantit pas l&apos;avenir.
        </div>
      )}
      {state.kind === "faible_repr" && (
        <div style={{ fontSize: 14, color: "var(--fg-2)", lineHeight: 1.65 }}>
          Des sinistres {word} ont été remboursés ici, mais trop peu de logements sont assurés dans la commune pour en tirer une lecture fiable.
        </div>
      )}
    </div>
  );
}

export function SinistraliteBlock({ sinistralite, commune }: { sinistralite: OnrnSinistralite; commune?: string | null }) {
  const { secheresse, inondation } = sinistralite;
  if (secheresse.kind === "indispo" && inondation.kind === "indispo") return null;
  const reprLine = [
    secheresse.kind === "lecture" ? `sécheresse ${onrnLabel(ONRN_REPR_LABEL, secheresse.representativite)}` : null,
    inondation.kind === "lecture" ? `inondation ${onrnLabel(ONRN_REPR_LABEL, inondation.representativite)}` : null,
  ].filter(Boolean).join(", ");
  // Comparaison factuelle des deux périls : n'est asservie QUE si les deux sont en lecture ET
  // que leurs classes de fréquence sont strictement séparées (rangs différents). Sinon muette
  // (jamais de comparaison quand on ne peut pas la fonder).
  const freqCompare = (() => {
    if (secheresse.kind !== "lecture" || inondation.kind !== "lecture") return null;
    const rs = ONRN_FREQ_RANK[secheresse.frequence] ?? 0;
    const ri = ONRN_FREQ_RANK[inondation.frequence] ?? 0;
    if (!rs || !ri || rs === ri) return null;
    return rs > ri
      ? { more: "à la sécheresse", less: "à l’inondation" }
      : { more: "à l’inondation", less: "à la sécheresse" };
  })();
  return (
    <ReportSection eyebrow={commune ? `Sinistres indemnisés à ${commune}` : "Sinistres indemnisés dans la commune"}>
      <div style={{ display: "grid", gap: 14 }}>
        {/* Niveau 1 — ce que ça veut dire, en langage courant, hors de la carte de faits */}
        <div style={{ display: "grid", gap: 6 }}>
          <p style={{ fontSize: 14, color: "var(--fg-2)", lineHeight: 1.65, margin: 0 }}>
            Voici ce que les assurances ont remboursé dans la commune par le passé.
          </p>
          <p style={{ fontSize: 13, fontStyle: "italic", color: "var(--fg-4)", lineHeight: 1.6, margin: 0 }}>
            Ces montants ne disent rien de ce logement en particulier, ni du prix de son assurance.
          </p>
        </div>
        {/* Niveau 2 — les faits, dans la carte ; la conclusion factuelle en tête */}
        <GlassCard>
          <div style={{ display: "grid", gap: 18 }}>
            {/* Lecture transverse : conclusion factuelle en tête des faits, quand elle est fondée */}
            {freqCompare && (
              <p style={{ fontSize: 15.5, fontWeight: 600, color: "var(--fg-hi)", lineHeight: 1.5, margin: 0, letterSpacing: "-0.2px" }}>
                {commune ? `À ${commune}, ` : "Dans la commune, "}les sinistres indemnisés liés {freqCompare.more} ont été plus fréquents que ceux liés {freqCompare.less}.
              </p>
            )}
            <PerilLine peril="Sécheresse (retrait-gonflement des argiles)" word="de sécheresse" color="var(--orange, #E8823A)" state={secheresse} tip="Le sol argileux gonfle avec l’humidité puis se rétracte en période sèche. Ces mouvements peuvent fissurer les murs et les fondations d’un logement." />
            <PerilLine peril="Inondation (tous types)" word="d’inondation" color="var(--blue, #60a5fa)" state={inondation} tip="Regroupe tous les types : débordement de cours d’eau, ruissellement de pluie, remontée de nappe et submersion marine." />
            {/* Rappel court sur l'assurance ; le détail va dans le repli */}
            <p style={{ fontSize: 13, color: "var(--fg-3)", lineHeight: 1.6, margin: 0 }}>
              Ces chiffres ne permettent pas de deviner le prix de votre assurance : la part qui couvre les catastrophes naturelles (la « surprime CatNat ») est la même partout en France.
            </p>
            {/* Niveau 3 — méthode et sources, repliées */}
            <Disclosure summary="Comprendre les chiffres et leurs limites">
              {reprLine && <div>Données 1995-2021, établies sur un échantillon CCR. Couverture du marché local : {reprLine}.</div>}
              <div>La fréquence rapporte les sinistres indemnisés aux biens assurés, exprimée pour mille (‰).</div>
              <div>La surprime légale CatNat est fixée à 20 % de la prime dommages depuis le 1ᵉʳ janvier 2025. Une modulation selon l&apos;exposition locale est débattue : si elle advenait, le passé local mesuré ici compterait davantage.</div>
              <div>ONRN (État / CCR / Mission Risques Naturels), via Géorisques. Biens assurés particuliers et professionnels.</div>
            </Disclosure>
          </div>
        </GlassCard>
      </div>
    </ReportSection>
  );
}
