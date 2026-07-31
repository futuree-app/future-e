"use client";

import { useMemo, useState } from "react";
import type { DpeRecord } from "@/lib/dpe-attribution";
import {
  candidateIdentifier, isUnidentifiable, matchesQuery, meaningfulFloor, sortCandidates,
} from "@/lib/dpe-candidate-match";

// ════════════════════════════════════════════════════════════════════════════════════════════
// LE SÉLECTEUR DE DIAGNOSTIC. L'utilisateur désigne SON logement parmi ceux de l'adresse.
// Aucune ligne n'est présélectionnée : pas de faux par défaut.
//
// REFAIT LE 31/07/2026, après avoir mesuré ce que la base porte vraiment (les chiffres sont dans
// l'en-tête de `dpe-candidate-match.ts`). Ce qui change, et pourquoi :
//
//   - L'ÉTAGE DISPARAÎT quand il vaut « 0 », ce qui est le cas de 96 % des lignes au Capitole.
//     Il s'affichait, donc presque chaque ligne portait un « · 0 » qui ne disait rien et qui
//     noyait le seul champ utile.
//   - L'IDENTIFIANT DE LOGEMENT PASSE EN TÊTE, en évidence. C'est le complément d'adresse, du
//     texte libre saisi par le diagnostiqueur, et c'est la seule chose qui distingue deux
//     logements d'un même immeuble.
//   - UN CHAMP DE RECHERCHE, parce que vingt-quatre lignes ne se parcourent pas. Il cherche dans
//     tout ce que la personne peut connaître : la porte, l'étage, la surface, l'année, et le
//     NUMÉRO À TREIZE CARACTÈRES que la checklist lui dit de réclamer au vendeur. Sans ce champ,
//     ce geste-là n'avait nulle part où aboutir.
//   - LES LIGNES MUETTES SONT MARQUÉES et reléguées en fin de liste. Un diagnostic sans
//     identifiant ni étage ne pourra jamais être reconnu de l'extérieur : le dire évite de
//     chercher ce qui n'y est pas.
// ════════════════════════════════════════════════════════════════════════════════════════════

const ROW: React.CSSProperties = {
  textAlign: "left", padding: "11px 13px", borderRadius: 10,
  border: "1px solid var(--border-2)", background: "var(--bg-deep)", cursor: "pointer",
  display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 16, width: "100%",
};

/** Les repères secondaires d'une ligne, dans l'ordre où ils aident : surface, étage, année. */
function secondaryParts(c: DpeRecord): string[] {
  const parts: string[] = [];
  if (c.surface_m2 != null) parts.push(`${String(c.surface_m2).replace(".", ",")} m²`);
  const floor = meaningfulFloor(c.etage);
  if (floor) parts.push(`étage ${floor}`);
  if (c.date_dpe) parts.push(c.date_dpe.slice(0, 4));
  return parts;
}

export function DpeSelector({
  candidates, onPick, onNotInList,
}: {
  candidates: DpeRecord[];
  onPick: (d: DpeRecord) => void;
  onNotInList: () => void;
}) {
  const [q, setQ] = useState("");
  const ordered = useMemo(() => sortCandidates(candidates), [candidates]);
  const shown = useMemo(() => ordered.filter((c) => matchesQuery(c, q)), [ordered, q]);
  const identifiables = useMemo(() => ordered.filter((c) => !isUnidentifiable(c)).length, [ordered]);
  const many = candidates.length > 3;

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <p style={{ fontSize: 14, color: "var(--fg-2)", lineHeight: 1.6, margin: 0 }}>
        {candidates.length > 1
          ? "Si vous savez lequel est le vôtre, désignez-le : le dossier lira alors son diagnostic."
          : "Un diagnostic a été retrouvé à cette adresse. Est-ce celui de ce logement ?"}
      </p>

      {many && (
        <div>
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Un numéro de porte, une surface, ou le numéro du diagnostic"
            aria-label="Chercher parmi les diagnostics de cette adresse"
            style={{
              width: "100%", padding: "10px 13px", fontSize: 14.5,
              background: "var(--bg-elev)", border: "1px solid var(--border-1)",
              borderRadius: 10, color: "var(--fg-1)",
            }}
          />
          <p style={{ fontSize: 12.5, color: "var(--fg-4)", lineHeight: 1.55, margin: "7px 0 0" }}>
            {identifiables === 0
              ? "Aucun de ces diagnostics ne porte d'identifiant de logement : ils ne peuvent pas être reconnus de l'extérieur."
              : `${identifiables} sur ${ordered.length} portent un identifiant de logement.`}
          </p>
        </div>
      )}

      <div style={{ display: "grid", gap: 8, maxHeight: 420, overflowY: "auto" }}>
        {shown.map((c) => {
          const ident = candidateIdentifier(c);
          return (
            <button key={c.id_dpe} type="button" onClick={() => onPick(c)} style={ROW}>
              <span style={{ display: "grid", gap: 2, minWidth: 0 }}>
                <span style={{ fontSize: 14.5, color: ident ? "var(--fg-hi)" : "var(--fg-4)", fontWeight: ident ? 500 : 400 }}>
                  {ident ?? "Sans identifiant de logement"}
                </span>
                <span style={{ fontSize: 12.5, color: "var(--fg-4)" }}>
                  {secondaryParts(c).join(" · ")}
                </span>
              </span>
              <span style={{ fontSize: 15, fontWeight: 500, color: "var(--fg-hi)", whiteSpace: "nowrap" }}>
                {c.etiquette_dpe ?? "—"}
              </span>
            </button>
          );
        })}

        {shown.length === 0 && (
          <p style={{ fontSize: 13.5, color: "var(--fg-3)", lineHeight: 1.6, margin: "4px 0" }}>
            Aucun diagnostic de cette adresse ne correspond à cette recherche. Celui de ce logement
            peut ne pas avoir été versé dans la base ouverte, ou y figurer sans identifiant.
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={onNotInList}
        style={{ justifySelf: "start", fontSize: 12.5, color: "var(--accent-dim, #7a6e60)", textDecoration: "underline", background: "none", border: "none", cursor: "pointer", padding: 0 }}
      >
        Aucun de ces diagnostics n&apos;est celui de ce logement
      </button>
    </div>
  );
}
