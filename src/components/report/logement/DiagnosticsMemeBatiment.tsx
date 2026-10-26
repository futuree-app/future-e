"use client";

import { useState } from "react";
import type { DpeRecord } from "@/lib/dpe-attribution";
import type { LogementReport } from "@/lib/logement-report-types";
import { PHRASES_MEME_BATIMENT, adresseParLigne, autresAdresses, voieDuLibelle } from "@/lib/batiment-rnb";
import { repartirParGrain } from "@/lib/dpe-grain";
import { ficheImmeuble } from "@/lib/dpe-selection-vue";
import { DpeSelector } from "@/components/report/DpeSelector";
import { DpeBadge } from "./kit";

// ════════════════════════════════════════════════════════════════════════════════════════════
// LES DIAGNOSTICS DU MÊME BÂTIMENT, ENREGISTRÉS À UNE AUTRE ADRESSE (FUT-80).
//
// CE BLOC N'EST PAS LA LISTE DE L'ADRESSE, ET IL NE S'Y MÊLE PAS. Ses lignes sont des candidats plus
// lointains : le même bâtiment n'est pas le même logement (un immeuble de 88 adresses à Royan, deux
// maisons mitoyennes que le référentiel compte ensemble). Il dit donc d'abord de quel bâtiment on
// parle et pourquoi la prudence, et ne montre les lignes qu'à la demande.
//
// RETENIR UNE LIGNE PASSE PAR LA VOIE DU NUMÉRO, qui relit la fiche à l'ADEME et revérifie au référentiel
// que son `id_rnb` est bien un bâtiment de l'adresse du dossier (`rapprocherAvecBatiment`). Le DPE d'un
// immeuble y figure comme fiche, jamais comme ligne à retenir (FUT-74).
// ════════════════════════════════════════════════════════════════════════════════════════════

const LIEN: React.CSSProperties = {
  justifySelf: "start", fontSize: 13.5, color: "var(--fg-1)", textDecoration: "underline",
  background: "none", border: "none", cursor: "pointer", padding: "6px 0", textAlign: "left",
};

export function DiagnosticsMemeBatiment({
  batiment, memeBatiment, banId, busy = false, onPick,
}: {
  batiment: LogementReport["batiment"];
  memeBatiment: LogementReport["dpeMemeBatiment"];
  banId: string | null;
  busy?: boolean;
  /** Retient par la voie du numéro, qui revérifie le bâtiment côté serveur. */
  onPick: (d: DpeRecord) => void;
}) {
  const [ouvert, setOuvert] = useState(false);
  if (batiment?.statut !== "confirme" || !memeBatiment) return null;

  if (memeBatiment.status === "unavailable" && memeBatiment.candidates.length === 0) {
    return (
      <p style={{ fontSize: 13, color: "var(--fg-3)", lineHeight: 1.6, margin: 0 }}>
        {PHRASES_MEME_BATIMENT.indisponible}
      </p>
    );
  }
  const { logements, immeubles } = repartirParGrain(memeBatiment.candidates);
  if (logements.length === 0 && immeubles.length === 0) return null;
  const autres = autresAdresses(batiment, banId);
  // L'adresse sur chaque ligne seulement quand elle peut varier : sinon l'introduction la nomme déjà.
  const parLigne = adresseParLigne([...logements, ...immeubles], autres);

  return (
    <div style={{ display: "grid", gap: 10, paddingTop: 14, borderTop: "1px solid var(--border-1)" }}>
      <p style={{ fontSize: 14.5, color: "var(--fg-1)", lineHeight: 1.6, margin: 0, fontWeight: 500 }}>
        {logements.length > 0
          ? PHRASES_MEME_BATIMENT.titre(logements.length)
          : "Le diagnostic de l'immeuble est enregistré à une autre adresse du même bâtiment."}
      </p>
      <p style={{ fontSize: 13.5, color: "var(--fg-2)", lineHeight: 1.6, margin: 0 }}>
        {PHRASES_MEME_BATIMENT.batiment(autres)}
      </p>
      {logements.length > 0 && (
        <p style={{ fontSize: 13, color: "var(--fg-3)", lineHeight: 1.6, margin: 0 }}>
          {PHRASES_MEME_BATIMENT.prudence}
        </p>
      )}
      {memeBatiment.status === "unavailable" && (
        <p style={{ fontSize: 13, color: "var(--fg-3)", lineHeight: 1.6, margin: 0 }}>
          La base ADEME n&apos;a répondu qu&apos;en partie : d&apos;autres diagnostics de ce bâtiment peuvent exister.
        </p>
      )}

      {/* La troncature se dit AVANT le geste d'ouvrir (revue du 26/10/2026) : le nombre annoncé au-dessus
          n'est pas le total. */}
      {memeBatiment.tronque && (
        <p style={{ fontSize: 13, color: "var(--fg-3)", lineHeight: 1.6, margin: 0 }}>{PHRASES_MEME_BATIMENT.tronque}</p>
      )}

      {!ouvert ? (
        <button type="button" onClick={() => setOuvert(true)} disabled={busy} style={LIEN}>
          {PHRASES_MEME_BATIMENT.bouton(logements.length + immeubles.length)}
        </button>
      ) : (
        <div style={{ display: "grid", gap: 10, paddingTop: 4 }}>
          {immeubles.map((c) => {
            const f = ficheImmeuble(c);
            return (
              <div key={f.id} style={{ display: "flex", gap: 14, alignItems: "center", padding: "11px 13px", borderRadius: 10, border: "1px dashed var(--border-2)" }}>
                {f.classe && <DpeBadge label={f.classe} size="sm" />}
                <div style={{ display: "grid", gap: 2, minWidth: 0 }}>
                  <span style={{ fontSize: 14.5, color: "var(--fg-1)" }}>{f.titre}, {f.classement}</span>
                  <span style={{ fontSize: 12.5, color: "var(--fg-4)", lineHeight: 1.45 }}>
                    {[...(parLigne ? [`enregistré au ${voieDuLibelle(c.adresse) ?? "une autre adresse"}`] : []), ...f.details].join(" · ")}
                  </span>
                </div>
              </div>
            );
          })}
          {logements.length > 0 && (
            <DpeSelector
              candidates={logements}
              onPick={onPick}
              onNotInList={() => setOuvert(false)}
              busy={busy}
              afficherRefus={false}
              contexte={parLigne ? { banId } : {}}
              autresAdresses
            />
          )}
        </div>
      )}
    </div>
  );
}
