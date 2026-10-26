"use client";

import { useMemo, useState } from "react";
import type { DpeRecord } from "@/lib/dpe-attribution";
import { listeLongue, sortCandidates } from "@/lib/dpe-candidate-match";
import { explicationContradiction } from "@/lib/batiment-rnb";
import {
  champsVariables, compterIdentifiables, decouperListe, ligneCandidat, phraseIdentifiables, type ContexteLigne,
} from "@/lib/dpe-selection-vue";

// ════════════════════════════════════════════════════════════════════════════════════════════
// LE SÉLECTEUR DE DIAGNOSTIC. L'utilisateur désigne SON logement parmi ceux de l'adresse.
// Aucune ligne n'est présélectionnée : pas de faux par défaut.
//
// REFAIT LE 31/07/2026 (identifiant en tête, étage « 0 » masqué, recherche, lignes muettes en fin
// de liste), puis COMPACTÉ LE 06/10/2026 (FUT-68) : ce que chaque ligne montre, combien de lignes
// s'affichent, et la phrase qui dit ce que fait un clic, viennent de `dpe-selection-vue.ts`, pur et
// testé. Ce composant ne fait que poser.
//
// Deux choses ont disparu, et elles comptent :
//   - LA BOÎTE DE DÉFILEMENT (420 px). Une liste qui défile DANS une page qui défile est le pire
//     geste sur un téléphone ; elle cachait aussi l'étendue réelle de la liste. Elle est remplacée
//     par six lignes, puis « Voir les N autres », qui déplie dans la page.
//   - LA CLASSE EN VEDETTE. Elle était à droite, en gras, au même rang que l'identifiant : l'œil
//     choisissait par la lettre. Elle reste, en retrait, parce qu'elle fait partie de la fiche.
//
// UNE LIGNE CONTREDITE PAR LE BÂTIMENT NE SE RETIENT PAS D'UN CLIC (FUT-143, 26/10/2026). Son `id_rnb`
// désigne un autre bâtiment que celui de l'adresse : le clic déplie, sous la ligne, l'explication que donne
// déjà la recherche par numéro (`explicationContradiction`), et seul « Retenir quand même » appelle
// `onPick`. Annuler replie sans rien écrire. Le choix reste possible : un document authentique peut
// corriger une base administrative. Les autres lignes gardent leur clic unique.
// ════════════════════════════════════════════════════════════════════════════════════════════

const ROW: React.CSSProperties = {
  textAlign: "left", padding: "11px 13px", borderRadius: 10, minHeight: 48,
  border: "1px solid var(--border-2)", background: "var(--bg-deep)",
  display: "flex", justifyContent: "space-between", alignItems: "center", gap: 14, width: "100%",
};

const LIEN: React.CSSProperties = {
  justifySelf: "start", fontSize: 13, color: "var(--accent-dim, #7a6e60)", textDecoration: "underline",
  background: "none", border: "none", cursor: "pointer", padding: "6px 0",
};

export function DpeSelector({
  candidates, onPick, onNotInList, busy = false, afficherRefus = true, contexte = {}, autresAdresses = false,
}: {
  candidates: DpeRecord[];
  onPick: (d: DpeRecord) => void;
  onNotInList: () => void;
  busy?: boolean;
  /** `false` quand le refus est déjà offert au-dessus de la liste (liste repliée) : il ne se répète pas. */
  afficherRefus?: boolean;
  /** FUT-80 : l'adresse et les bâtiments du dossier, pour que chaque ligne dise ce qui la distingue. */
  contexte?: ContexteLigne;
  /** FUT-80 : la liste porte les diagnostics du même bâtiment À D'AUTRES ADRESSES, pas ceux de l'adresse. */
  autresAdresses?: boolean;
}) {
  const ou = autresAdresses ? "de ce bâtiment" : "de cette adresse";
  const [q, setQ] = useState("");
  const [toutVoir, setToutVoir] = useState(false);
  // FUT-143 : l'identifiant de la ligne contredite dont l'explication est dépliée, en attente du second geste.
  const [aConfirmer, setAConfirmer] = useState<string | null>(null);
  const ordered = useMemo(() => sortCandidates(candidates), [candidates]);
  const champs = useMemo(() => champsVariables(candidates), [candidates]);
  const { visibles, masques, correspondances } = decouperListe(ordered, q, toutVoir);
  // Le même seuil que le bloc qui monte ce sélecteur : au-delà, on aide à chercher.
  const many = listeLongue(candidates.length);

  return (
    <div style={{ display: "grid", gap: 12 }}>
      {many && (
        <div>
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Porte, surface ou n° du diagnostic"
            aria-label={`Chercher parmi les diagnostics ${ou}`}
            style={{
              width: "100%", padding: "10px 13px", fontSize: 16,
              background: "var(--bg-elev)", border: "1px solid var(--border-1)",
              borderRadius: 10, color: "var(--fg-1)",
            }}
          />
          <p style={{ fontSize: 12.5, color: "var(--fg-4)", lineHeight: 1.55, margin: "7px 0 0" }}>
            {phraseIdentifiables(compterIdentifiables(candidates), candidates.length)}
          </p>
        </div>
      )}

      {/* CE QUE FAIT UN CLIC, ET CE QUE L'ORDRE NE DIT PAS. Sans cette phrase, une ligne se lit
          comme une fiche à ouvrir ; et une liste triée se lit comme un classement du plus probable
          au moins probable, ce qu'elle n'est pas. */}
      {candidates.length > 1 && (
        <p style={{ fontSize: 12.5, color: "var(--fg-4)", lineHeight: 1.55, margin: 0 }}>
          Choisir une ligne la retient pour ce logement, et vous pourrez revenir sur ce choix.
          Les diagnostics qui portent un identifiant viennent en premier, puis par surface : cet
          ordre ne désigne aucun d&apos;entre eux.
        </p>
      )}

      <div style={{ display: "grid", gap: 8 }}>
        {visibles.map((c) => {
          const l = ligneCandidat(c, champs, contexte);
          const deplie = l.contredit && aConfirmer === l.id;
          const ligne = (
            <button
              key={l.id}
              type="button"
              onClick={() => {
                if (l.contredit) { setAConfirmer(deplie ? null : l.id); return; }
                setAConfirmer(null);
                onPick(c);
              }}
              disabled={busy}
              aria-label={l.libelleAccessible}
              {...(l.contredit ? { "aria-expanded": deplie, "aria-controls": `confirmer-${l.id}` } : {})}
              style={{ ...ROW, cursor: busy ? "default" : "pointer", opacity: busy ? 0.6 : 1, ...(deplie ? { borderColor: "var(--accent-dim, #7a6e60)" } : {}) }}
            >
              <span style={{ display: "grid", gap: 2, minWidth: 0 }}>
                <span style={{ fontSize: 14.5, color: l.identifie ? "var(--fg-hi)" : "var(--fg-4)", fontWeight: l.identifie ? 500 : 400, overflowWrap: "anywhere" }}>
                  {l.titre}
                </span>
                {l.details.length > 0 && (
                  <span style={{ fontSize: 12.5, color: "var(--fg-4)", lineHeight: 1.45 }}>
                    {l.details.join(" · ")}
                  </span>
                )}
              </span>
              <span style={{ fontSize: 12.5, color: "var(--fg-3)", whiteSpace: "nowrap" }}>
                {l.classe ? `classe ${l.classe}` : "sans classe"}
              </span>
            </button>
          );
          if (!deplie) return ligne;
          return (
            <div key={l.id} style={{ display: "grid", gap: 0 }}>
              {ligne}
              <div
                id={`confirmer-${l.id}`}
                role="group"
                aria-label="Confirmer un diagnostic rattaché à un autre bâtiment"
                style={{
                  display: "grid", gap: 12, margin: "6px 0 4px", padding: "13px 15px", borderRadius: 10,
                  background: "var(--bg-elev)", border: "1px solid var(--border-1)",
                }}
              >
                <p style={{ fontSize: 13.5, color: "var(--fg-2)", lineHeight: 1.6, margin: 0 }}>
                  {explicationContradiction(
                    "ne le retenez que si vous savez qu'il s'agit bien de ce logement, par exemple parce que son numéro figure sur le document qu'on vous a remis.",
                  )}
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "8px 18px" }}>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => { setAConfirmer(null); onPick(c); }}
                    style={{
                      padding: "9px 15px", minHeight: 44, fontSize: 14, fontWeight: 500, borderRadius: 10,
                      background: "var(--bg-elev-2)", border: "1px solid var(--accent-dim, #7a6e60)", color: "var(--fg-hi)",
                      cursor: busy ? "default" : "pointer", opacity: busy ? 0.5 : 1,
                    }}
                  >
                    Retenir quand même ce diagnostic
                  </button>
                  <button type="button" onClick={() => setAConfirmer(null)} style={{ ...LIEN, color: "var(--fg-2)" }}>
                    Annuler
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {correspondances === 0 && (
          <p style={{ fontSize: 13.5, color: "var(--fg-3)", lineHeight: 1.6, margin: "4px 0" }}>
            Aucun diagnostic {ou} ne correspond à cette recherche. Celui de ce logement
            peut ne pas avoir été versé dans la base ouverte, ou y figurer sans identifiant.
          </p>
        )}
      </div>

      {masques > 0 && (
        <button type="button" onClick={() => setToutVoir(true)} style={{ ...LIEN, color: "var(--fg-2)" }}>
          {masques === 1 ? "Voir l'autre diagnostic" : `Voir les ${masques} autres diagnostics`}
        </button>
      )}

      {/* LE REFUS S'ACCORDE (20/08/2026) au TOTAL de l'adresse, jamais au nombre de lignes filtrées. */}
      {afficherRefus && (
        <button type="button" onClick={onNotInList} disabled={busy} style={LIEN}>
          {candidates.length === 1
            ? "Ce diagnostic n'est pas celui de ce logement"
            : "Aucun de ces diagnostics n'est celui de ce logement"}
        </button>
      )}
    </div>
  );
}
