"use client";

import { useState } from "react";
import type { DpeRecord } from "@/lib/dpe-attribution";
import { etiquetteExploitable, type NiveauRapprochement } from "@/lib/dpe-rapprochement";
import { DpeBadge } from "./kit";

// ════════════════════════════════════════════════════════════════════════════════════════════
// « J'AI LE DOCUMENT » — la seule question dont la réponse ne dépend pas de ce que le lecteur devine.
//
// Reconnaître son logement dans la liste d'une adresse suppose qu'il connaisse un étage, une porte
// ou une surface. Quelqu'un qui ENVISAGE d'acheter ne les connaît pas ; quelqu'un qui vient
// d'emménager a le dossier de diagnostic technique sous les yeux. Le numéro à treize caractères
// tranche là où la reconnaissance visuelle échoue.
//
// L'écran le PROMETTAIT DÉJÀ sans le tenir : « Vous pouvez le coller ci-dessous » désignait un champ
// de recherche qui filtrait les diagnostics DE L'ADRESSE, et qui ne trouvait donc jamais un numéro
// dont l'identifiant BAN pointe sur l'entrée voisine. C'est précisément le cas le plus fréquent,
// puisque c'est le diagnostiqueur qui géocode au moment de la saisie.
//
// RIEN N'EST RATTACHÉ SANS QUE LE LECTEUR AIT VU CE QU'IL RATTACHE. La recherche montre la fiche et
// l'adresse enregistrée à l'ADEME ; le rattachement est un second geste. Et la règle qui autorise
// ou refuse vit dans `dpe-rapprochement.ts`, testée, jamais dans cet écran.
// ════════════════════════════════════════════════════════════════════════════════════════════

type Reponse =
  | { status: "forme_invalide" }
  | { status: "introuvable" }
  | { status: "indisponible" }
  | { status: "expire"; date: string | null; adresse: string | null }
  | {
      status: "trouve";
      niveau: NiveauRapprochement;
      attachable: boolean;
      confirmationRequise: boolean;
      adresse: string | null;
      dpe: DpeRecord;
    };

const CHAMP: React.CSSProperties = {
  flex: "1 1 220px", padding: "10px 13px", fontSize: 14.5,
  background: "var(--bg-elev)", border: "1px solid var(--border-1)",
  borderRadius: 10, color: "var(--fg-1)",
};

function Message({ children, ton = "neutre" }: { children: React.ReactNode; ton?: "neutre" | "refus" }) {
  return (
    <p style={{
      fontSize: 13.5, lineHeight: 1.6, margin: 0,
      color: ton === "refus" ? "var(--reg-non-su, var(--fg-3))" : "var(--fg-2)",
    }}>
      {children}
    </p>
  );
}

function jour(iso: string | null): string | null {
  if (!iso) return null;
  const [a, m, j] = iso.slice(0, 10).split("-");
  return a && m && j ? `${j}/${m}/${a}` : null;
}

export function SaisieNumeroDpe({
  dossierId, onConfirm, busy = false,
}: {
  dossierId: string;
  /** Rattache le diagnostic trouvé. Le numéro voyage, jamais la fiche : le serveur la relit. */
  onConfirm: (dpe: DpeRecord) => void;
  busy?: boolean;
}) {
  const [numero, setNumero] = useState("");
  const [cherche, setCherche] = useState(false);
  const [reponse, setReponse] = useState<Reponse | null>(null);
  const [panne, setPanne] = useState(false);

  async function chercher() {
    if (!numero.trim() || cherche) return;
    setCherche(true);
    setPanne(false);
    setReponse(null);
    try {
      const res = await fetch("/api/logement-dpe/numero", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dossierId, numero }),
      });
      if (!res.ok) { setPanne(true); return; }
      setReponse((await res.json()) as Reponse);
    } catch {
      setPanne(true);
    } finally {
      setCherche(false);
    }
  }

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <input
          value={numero}
          onChange={(e) => setNumero(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); void chercher(); } }}
          placeholder="Par exemple 2517E1568444P"
          aria-label="Numéro du diagnostic"
          // Le numéro se recopie d'un papier : le téléphone n'a ni à le compléter, ni à le corriger,
          // ni à lui mettre une majuscule de début de phrase.
          autoComplete="off" autoCorrect="off" autoCapitalize="characters" spellCheck={false}
          enterKeyHint="search"
          style={CHAMP}
        />
        <button
          type="button"
          onClick={() => void chercher()}
          disabled={cherche || busy || numero.trim().length === 0}
          style={{
            padding: "10px 16px", fontSize: 14, borderRadius: 10, cursor: "pointer",
            background: "var(--bg-elev-2)", border: "1px solid var(--border-2)", color: "var(--fg-1)",
            opacity: cherche || busy || numero.trim().length === 0 ? 0.5 : 1,
          }}
        >
          {cherche ? "Recherche…" : "Chercher"}
        </button>
      </div>

      {panne && <Message>La recherche n&apos;a pas abouti. Réessayez dans un instant.</Message>}

      {reponse?.status === "forme_invalide" && (
        <Message>
          Ce numéro ne ressemble pas à celui d&apos;un diagnostic. Il compte une dizaine de
          caractères, chiffres et lettres mélangés.
        </Message>
      )}

      {reponse?.status === "indisponible" && (
        <Message>
          La base des diagnostics ne répond pas pour le moment. Votre numéro est peut-être bon :
          réessayez dans quelques minutes.
        </Message>
      )}

      {reponse?.status === "introuvable" && (
        <Message>
          Aucun diagnostic ne porte ce numéro dans la base ouverte. Vérifiez les caractères, ou
          demandez confirmation à la personne qui vous a remis le document.
        </Message>
      )}

      {/* UN DIAGNOSTIC EXPIRÉ EXISTE, ET IL NE DÉCRIT PLUS RIEN. Répondre « introuvable » serait
          faux et enverrait chercher une faute de frappe. L'attribuer donnerait pour actuelle une
          étiquette qui ne l'est plus : tous les diagnostics antérieurs à juillet 2021 ont expiré au
          plus tard le 31/12/2024. */}
      {reponse?.status === "expire" && (
        <Message ton="refus">
          Ce numéro correspond à un diagnostic
          {jour(reponse.date) ? ` du ${jour(reponse.date)}` : ""}
          {reponse.adresse ? `, enregistré au ${reponse.adresse}` : ""}. Les diagnostics antérieurs à
          juillet 2021 ont tous expiré au 31 décembre 2024 : celui-ci ne dit plus la performance de
          ce logement. Demandez un diagnostic en cours de validité au propriétaire ou au vendeur.
        </Message>
      )}

      {reponse?.status === "trouve" && (
        <div style={{
          display: "grid", gap: 12, padding: "14px 16px", borderRadius: 12,
          background: "var(--bg-elev)", border: "1px solid var(--border-1)",
        }}>
          <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
            <DpeBadge label={reponse.dpe.etiquette_dpe} size="sm" />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 14.5, color: "var(--fg-hi)" }}>
                {reponse.adresse ?? "Adresse non renseignée dans la base"}
              </div>
              <div style={{ fontSize: 12.5, color: "var(--fg-4)", marginTop: 3 }}>
                {[
                  reponse.dpe.surface_m2 != null ? `${String(reponse.dpe.surface_m2).replace(".", ",")} m²` : null,
                  jour(reponse.dpe.date_dpe),
                  reponse.dpe.type_batiment,
                ].filter(Boolean).join(" · ")}
              </div>
            </div>
          </div>

          {/* UN DIAGNOSTIC VIERGE DÉCRIT LE FAIT QU'ON NE SAIT PAS. La base rend « N » et une
              consommation nulle quand le diagnostiqueur n'a pas pu reconstituer les consommations,
              cas fréquent avant 2021. Le rattacher reste utile (surface, année, type de bâtiment),
              et promettre une classe le serait beaucoup moins. */}
          {!etiquetteExploitable(reponse.dpe.etiquette_dpe) && (
            <Message>
              Ce diagnostic ne porte aucune étiquette énergétique : le diagnostiqueur n&apos;a pas pu
              établir la consommation du logement. Le rattacher renseignera sa surface et sa date,
              sans classe de A à G.
            </Message>
          )}

          {reponse.niveau === "batiment" && (
            <Message>
              L&apos;ADEME enregistre ce diagnostic à une entrée voisine de la vôtre, ce qui arrive
              souvent : c&apos;est le diagnostiqueur qui saisit l&apos;adresse. Vérifiez qu&apos;il
              s&apos;agit bien de ce logement avant de le rattacher.
            </Message>
          )}

          {reponse.niveau === "commune" && (
            <Message ton="refus">
              Cette adresse n&apos;est pas celle de ce dossier. Être dans la même commune ne suffit
              pas à dire qu&apos;il s&apos;agit du même logement : vérifiez le numéro sur votre
              document.
            </Message>
          )}

          {reponse.niveau === "ailleurs" && (
            <Message ton="refus">
              Ce diagnostic porte sur une autre commune que celle de ce dossier.
            </Message>
          )}

          {reponse.niveau === "inconnu" && (
            <Message ton="refus">
              Ce diagnostic ne porte pas d&apos;adresse exploitable dans la base ouverte : rien ne
              permet de vérifier qu&apos;il décrit ce logement.
            </Message>
          )}

          {reponse.attachable && (
            <button
              type="button"
              disabled={busy}
              onClick={() => onConfirm(reponse.dpe)}
              style={{
                justifySelf: "start", padding: "9px 15px", fontSize: 14, borderRadius: 10,
                background: "var(--accent)", color: "var(--canvas, #14110d)", border: "none",
                cursor: busy ? "default" : "pointer", fontWeight: 500, opacity: busy ? 0.5 : 1,
              }}
            >
              {busy ? "Enregistrement…" : "C'est le diagnostic de ce logement"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
