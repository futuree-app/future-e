"use client";

import { useState } from "react";
import type { DpeRecord } from "@/lib/dpe-attribution";
import {
  addressContextLead, buildAddressDpeContext, type AddressDpeContext,
} from "@/lib/dpe-address-context";
import { DpeSelector } from "@/components/report/DpeSelector";
import { listeLongue } from "@/lib/dpe-candidate-match";
import { PHRASE_DPE_IMMEUBLE, SAISIE_NUMERO, listeRepliee, phrasesOuvertureRepliee } from "@/lib/dpe-selection-vue";
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
// AU-DELÀ DE SIX DIAGNOSTICS, LA LISTE SE REPLIE DE NOUVEAU (FUT-68, 06/10/2026), mais pas comme en
// juillet. Le tiroir d'alors cachait le SEUL geste de l'écran tout en bas ; ici, le premier niveau dit
// combien de diagnostics existent et que futur•e a besoin du lecteur pour savoir lequel est le bon,
// puis pose les trois réponses possibles : identifier son logement, n'en reconnaître aucun, apporter
// le numéro du document. Ni classes, ni années, ni « 31 sur 34 » à ce niveau : ils n'aident pas à
// reconnaître un logement, et la classe y redevenait un critère de choix. À 34 diagnostics, la page ne s'ouvre plus sur 34 lignes, et le refus
// n'arrive plus au bout d'une liste. Jusqu'à six, rien ne change : la liste reste la question.
// Seuil d'écran, documenté dans `dpe-selection-vue.ts`.
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

const BOUTON_PRINCIPAL: React.CSSProperties = {
  justifySelf: "start", padding: "11px 18px", minHeight: 44, fontSize: 14.5, fontWeight: 500,
  borderRadius: 10, cursor: "pointer", backgroundColor: "var(--bg-elev-2)",
  border: "1px solid var(--accent-dim, #7a6e60)", color: "var(--fg-hi)",
};

const LIEN: React.CSSProperties = {
  justifySelf: "start", fontSize: 13, color: "var(--accent-dim, #7a6e60)", textDecoration: "underline",
  background: "none", border: "none", cursor: "pointer", padding: "6px 0", textAlign: "left",
};

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
  candidates, listeIncomplete = false, dossierId, busy = false, onPick, onNotInList, onPickParNumero,
}: {
  candidates: DpeRecord[];
  /** FUT-65 : un des deux jeux ADEME n'a pas répondu. Le compte ci-dessous est un minimum. */
  listeIncomplete?: boolean;
  dossierId: string;
  busy?: boolean;
  onPick: (d: DpeRecord) => void;
  onNotInList: () => void;
  onPickParNumero: (d: DpeRecord) => void;
}) {
  const [ouvert, setOuvert] = useState(false);
  const ctx = buildAddressDpeContext(candidates);
  if (!ctx) return null;
  const dense = listeLongue(ctx.total);
  const repliee = listeRepliee(ctx.total);
  const ouverture = phrasesOuvertureRepliee(ctx.total);

  return (
    <div style={{ display: "grid", gap: 18 }}>
      {/* La phrase POSE LA QUESTION, et la liste (ou, repliée, le geste qui l'ouvre) y répond juste
          dessous. Le sélecteur portait sa propre introduction, presque mot pour mot celle-ci : elle a
          disparu avec le tiroir. */}
      {repliee ? (
        <div style={{ display: "grid", gap: 6 }}>
          <p style={{ fontSize: 15, color: "var(--fg-1)", lineHeight: 1.6, margin: 0, fontWeight: 500 }}>
            {ouverture.titre}
          </p>
          <p style={{ fontSize: 14, color: "var(--fg-2)", lineHeight: 1.6, margin: 0 }}>
            {ouverture.aide}
          </p>
        </div>
      ) : (
        <p style={{ fontSize: 15, color: "var(--fg-1)", lineHeight: 1.6, margin: 0 }}>
          {addressContextLead(ctx)}
        </p>
      )}
      {/* FUT-65 : « N diagnostics sont enregistrés » se lirait comme un total. Il ne l'est pas ici. */}
      {listeIncomplete && (
        <p style={{ fontSize: 13.5, color: "var(--fg-3)", lineHeight: 1.6, margin: 0 }}>
          La base ADEME n&apos;a répondu qu&apos;en partie lors de cette collecte : d&apos;autres diagnostics
          peuvent être enregistrés à cette adresse.
        </p>
      )}

      {/* LE DIAGNOSTIC D'IMMEUBLE EST NOMMÉ AVANT LA LISTE (FUT-68). Il venait après elle : on pouvait
          choisir sa ligne avant d'apprendre qu'elle décrit le bâtiment commun. Sa ligne le dit aussi. */}
      {ctx.hasCollective && (
        <p style={{ fontSize: 13.5, color: "var(--fg-3)", lineHeight: 1.6, margin: 0 }}>
          {PHRASE_DPE_IMMEUBLE}
        </p>
      )}

      {repliee ? (
        <div style={{ display: "grid", gap: 10 }}>
          {!ouvert && (
            <button type="button" onClick={() => setOuvert(true)} disabled={busy} style={BOUTON_PRINCIPAL}>
              Identifier mon logement
            </button>
          )}
          {/* LE REFUS AU PREMIER NIVEAU, jamais au bout de la liste : ne reconnaître aucune ligne
              est une réponse aussi légitime que d'en choisir une, et la plus utile à la qualité du
              dossier quand le bon diagnostic n'a pas été versé. */}
          <button type="button" onClick={onNotInList} disabled={busy} style={LIEN}>
            Aucun de ces diagnostics n&apos;est celui de ce logement
          </button>
          {ouvert && (
            <div style={{ paddingTop: 6 }}>
              <DpeSelector
                candidates={candidates}
                onPick={onPick}
                onNotInList={onNotInList}
                busy={busy}
                afficherRefus={false}
              />
            </div>
          )}
        </div>
      ) : (
        <DpeSelector candidates={candidates} onPick={onPick} onNotInList={onNotInList} busy={busy} />
      )}

      {/* LE NUMÉRO DU DOCUMENT, le seul geste qui ne demande pas de deviner. Il était introduit par
          « Si vous avez le document…, il porte un numéro qui lève le doute. Il retrouve aussi… » :
          un « il » ambigu, et un cas technique (l'entrée voisine) expliqué avant l'action. C'est
          maintenant une question, et le cas technique vit dans l'aide du champ (FUT-68).
          LE CHAMP RESTE VISIBLE, y compris liste repliée : c'est le chemin le plus fiable pour
          désigner un diagnostic, et le cacher derrière un clic le reléguait (décision du 06/10). */}
      <div style={{ paddingTop: 14, borderTop: "1px solid var(--border-1)", display: "grid", gap: 10 }}>
        <p style={{ fontSize: 14, color: "var(--fg-1)", lineHeight: 1.6, margin: 0 }}>
          {SAISIE_NUMERO.question}
        </p>
        <SaisieNumeroDpe dossierId={dossierId} busy={busy} onConfirm={onPickParNumero} />
        <p style={{ fontSize: 12.5, color: "var(--fg-4)", lineHeight: 1.55, margin: 0 }}>
          {SAISIE_NUMERO.aide}
        </p>
      </div>

      {/* CE QUE LA BASE DIT DE L'ADRESSE, en contexte de la liste et jamais à sa place. Aucune
          valeur n'est prêtée au logement : chaque chiffre décrit l'adresse. C'est aussi pour ça
          qu'aucune moyenne n'est affichée (cf. `dpe-address-context.ts`) : une moyenne se lit comme
          LA réponse, une répartition se lit comme de la dispersion. Elle vient APRÈS les gestes :
          les classes n'aident pas à reconnaître un logement. */}
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
