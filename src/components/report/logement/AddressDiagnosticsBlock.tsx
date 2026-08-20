"use client";

import type { DpeRecord } from "@/lib/dpe-attribution";
import {
  addressContextLead, buildAddressDpeContext, type AddressDpeContext,
} from "@/lib/dpe-address-context";
import { DpeSelector } from "@/components/report/DpeSelector";
import { listeLongue } from "@/lib/dpe-candidate-match";
import { SaisieNumeroDpe } from "./SaisieNumeroDpe";

// ════════════════════════════════════════════════════════════════════════════════════════════
// « DIAGNOSTICS TROUVÉS À CETTE ADRESSE » — la matière NON ATTRIBUÉE.
//
// Remplace l'écran bloquant « Précisez votre logement ». Ce qui change : le rapport s'affiche, et
// cette matière est présentée comme un CONTEXTE D'ADRESSE. Reconnaître son logement devient un
// enrichissement, offert dans un tiroir, jamais un péage.
//
// LA LISTE D'ABORD, ET ELLE NE SE PLIE PLUS (20/08/2026). Elle vivait dans un tiroir replié, en bas
// du bloc, sous une synthèse et un paragraphe : le seul geste de l'écran était le dernier élément
// atteignable, et il fallait le déplier pour le trouver.
//
// Le tiroir avait été écrit pour une adresse toulousaine à vingt-quatre diagnostics, où poser
// d'emblée vingt-quatre lignes « appartement · 10,2 m² · Etage 4 ; Porte 37 » revient à donner un
// devoir à faire. La règle s'appliquait ensuite à TOUTES les adresses, dont celles qui n'ont qu'un
// candidat : là, la liste unique EST la question, et la plier n'épargnait rien à personne.
//
// Ce qui suit la liste change avec le nombre. À un ou deux diagnostics, la synthèse d'adresse
// répéterait mot pour mot la ligne cliquable (« 50 m² · 2023 · E » d'un côté, « Classes observées
// E ×1, Surfaces diagnostiquées 50 m² » de l'autre) : elle ne se rend qu'à partir du moment où
// elle montre une DISPERSION. Le seuil est celui de `listeLongue`, partagé avec le champ de
// recherche du sélecteur.
//
// AUCUNE VALEUR N'EST PRÊTÉE AU LOGEMENT. Chaque chiffre décrit l'adresse. C'est aussi pour ça
// qu'aucune moyenne n'est affichée (cf. `dpe-address-context.ts`) : une moyenne se lit comme LA
// réponse, une répartition se lit comme de la dispersion.
// ════════════════════════════════════════════════════════════════════════════════════════════

// Virgule décimale. Les surfaces ADEME arrivent en flottant (« 10.2 »), et un point décimal dans
// un texte français se lit comme une coquille. Pas d'`Intl` : une seule règle, pas de dépendance à
// la version d'ICU du runtime.
function m2(v: number): string {
  return (Math.round(v * 10) / 10).toString().replace(".", ",");
}

function Ligne({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 16 }}>
      <span style={{ fontSize: 14, color: "var(--fg-2)" }}>{label}</span>
      <span style={{ fontSize: 14.5, color: "var(--fg-hi)", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
        {children}
      </span>
    </div>
  );
}

function Repartition({ ctx }: { ctx: AddressDpeContext }) {
  if (ctx.distribution.length === 0) return null;
  return (
    <div style={{ display: "grid", gap: 7 }}>
      <span style={{ fontSize: 14, color: "var(--fg-2)" }}>Classes observées</span>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
        {ctx.distribution.map(({ label, count }) => (
          <span
            key={label}
            style={{
              fontSize: 13, padding: "4px 10px", borderRadius: 999,
              border: "1px solid var(--border-1)", background: "var(--bg-elev)", color: "var(--fg-1)",
            }}
          >
            {label} <span style={{ color: "var(--fg-4)" }}>&times;&nbsp;{count}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

export function AddressDiagnosticsBlock({
  candidates, dossierId, busy = false, onPick, onNotInList, onPickParNumero,
}: {
  candidates: DpeRecord[];
  dossierId: string;
  busy?: boolean;
  onPick: (d: DpeRecord) => void;
  onNotInList: () => void;
  onPickParNumero: (d: DpeRecord) => void;
}) {
  const ctx = buildAddressDpeContext(candidates);
  if (!ctx) return null;
  const dense = listeLongue(ctx.total);

  return (
    <div style={{ display: "grid", gap: 18 }}>
      {/* La phrase POSE LA QUESTION, et la liste y répond juste dessous. Le sélecteur portait sa
          propre introduction, presque mot pour mot celle-ci : elle a disparu avec le tiroir. */}
      <p style={{ fontSize: 15, color: "var(--fg-1)", lineHeight: 1.6, margin: 0 }}>
        {addressContextLead(ctx)}
      </p>

      <DpeSelector candidates={candidates} onPick={onPick} onNotInList={onNotInList} />

      {/* LE GESTE UTILE, ET IL NE DEMANDE RIEN AU LECTEUR QU'IL NE SACHE. Le numéro à treize
          caractères identifie un diagnostic sans ambiguïté, et celui qui vend ou qui loue l'a.

          DEUX DÉFAUTS CORRIGÉS LE 20/08/2026. La phrase empilait deux compléments avant son verbe
          (« Le numéro …, que porte le document remis avec le dossier de diagnostic technique, lève
          cette incertitude ») : elle part maintenant du lecteur et de ce qu'il a en main. Et son
          « vous pouvez le coller ci-dessous » DÉSIGNAIT UN CHAMP QUI N'EXISTAIT PAS, le sélecteur
          n'affichant sa recherche qu'au-delà de trois diagnostics. Elle ne renvoie plus à un champ
          que lorsqu'il est là. */}
      <div style={{ paddingTop: 14, borderTop: "1px solid var(--border-1)", display: "grid", gap: 12 }}>
        <p style={{ fontSize: 13.5, color: "var(--fg-2)", lineHeight: 1.6, margin: 0 }}>
          Si vous avez le document du diagnostic, il porte un numéro qui lève le doute. Il retrouve
          aussi les diagnostics enregistrés à une entrée voisine de la vôtre, que la liste ci-dessus
          ne montre pas.
        </p>
        <SaisieNumeroDpe dossierId={dossierId} busy={busy} onConfirm={onPickParNumero} />
      </div>

      {ctx.hasCollective && (
        <p style={{ fontSize: 13.5, color: "var(--fg-3)", lineHeight: 1.6, margin: 0 }}>
          L&apos;un de ces diagnostics porte sur l&apos;immeuble entier. Il décrit le bâtiment
          commun, et pas la performance d&apos;un logement en particulier.
        </p>
      )}

      {/* CE QUE LA BASE DIT DE L'ADRESSE, en contexte de la liste et jamais à sa place. Aucune
          valeur n'est prêtée au logement : chaque chiffre décrit l'adresse. C'est aussi pour ça
          qu'aucune moyenne n'est affichée (cf. `dpe-address-context.ts`) : une moyenne se lit comme
          LA réponse, une répartition se lit comme de la dispersion. */}
      {dense && (
        <div style={{ display: "grid", gap: 12, paddingTop: 14, borderTop: "1px solid var(--border-1)" }}>
          <Repartition ctx={ctx} />

          {ctx.spread && (
            <Ligne label="Écart des classes">
              de {ctx.spread.min} à {ctx.spread.max}
            </Ligne>
          )}

          {ctx.surfaces && (
            <Ligne label="Surfaces diagnostiquées">
              {ctx.surfaces.min === ctx.surfaces.max
                ? `${m2(ctx.surfaces.min)} m²`
                : `de ${m2(ctx.surfaces.min)} à ${m2(ctx.surfaces.max)} m²`}
            </Ligne>
          )}

          {ctx.years && (
            <Ligne label="Réalisés entre">
              {ctx.years.min === ctx.years.max ? ctx.years.min : `${ctx.years.min} et ${ctx.years.max}`}
            </Ligne>
          )}

          {ctx.buildingTypes.length > 0 && (
            <Ligne label="Types de bâtiment">{ctx.buildingTypes.join(", ")}</Ligne>
          )}
        </div>
      )}
    </div>
  );
}
