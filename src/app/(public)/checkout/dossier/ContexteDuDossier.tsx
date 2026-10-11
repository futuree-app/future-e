"use client";

import type { ReactNode } from "react";
import type { AddressObjective } from "@/lib/relation-au-lieu";
import { OBJECTIF_LIBELLE, RELATION_LIBELLE, noteDuCouple, type ChoixRelation } from "@/lib/dossier-contexte-ecran";

// ════════════════════════════════════════════════════════════════════════════════════════════
// LES QUESTIONS AVANT LE PAIEMENT (FUT-10). Ce composant ne fait que montrer et recueillir ; il
// n'enregistre rien. `DossierCheckoutPanel` décide quand le projet s'écrit et quand le paiement s'ouvre.
//
// TROIS QUESTIONS, TROIS OBJETS (contrat : docs/audits/2026-10-11-fut10-projet-relation-checkout.md) :
//   1. pourquoi ce logement     → l'objectif de cette analyse, propre à ce bien ;
//   2. votre lien avec ce bien  → la relation effective, indépendante de la première ;
//   3. ce qui compte pour vous  → le projet durable, réutilisé s'il existe.
// Aucune n'est obligatoire, et aucune ne se déduit d'une autre : une suggestion contextuelle se lit,
// elle ne coche rien.
//
// DES RADIOS NATIFS, habillés en puces : flèches, Tab et Espace fonctionnent sans code, et un lecteur
// d'écran annonce le groupe et l'état. Le vocabulaire interne (`place_relation`, `posture`) n'apparaît
// nulle part.
// ════════════════════════════════════════════════════════════════════════════════════════════

export type ChoixProjet = "garder" | "modifier";

function Puce({
  name, value, checked, onChange, children,
}: { name: string; value: string; checked: boolean; onChange: () => void; children: ReactNode }) {
  return (
    <label
      className={
        "cursor-pointer rounded-lg px-3.5 py-2 text-[13.5px] border transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[var(--blue)] "
        + (checked
          ? "bg-accent/[0.14] text-label border-accent/[0.45]"
          : "bg-[var(--bg-elev-2)] text-muted border-[var(--border-2)] hover:text-label")
      }
    >
      <input type="radio" name={name} value={value} checked={checked} onChange={onChange} className="sr-only" />
      {children}
    </label>
  );
}

function Question({ legende, children }: { legende: string; children: ReactNode }) {
  return (
    <fieldset className="border-0 p-0 m-0 min-w-0">
      <legend className="text-[15px] text-label leading-snug mb-3 p-0">{legende}</legend>
      {children}
    </fieldset>
  );
}

export function ContexteDuDossier({
  objectif, setObjectif, relation, setRelation,
  reformulation, choixProjet, setChoixProjet, texte, setTexte, projetSansTexte,
}: {
  objectif: AddressObjective | null;
  setObjectif: (o: AddressObjective) => void;
  relation: ChoixRelation | null;
  setRelation: (r: ChoixRelation) => void;
  /** Ce que le projet existant dit de ce qui compte (reformulation ou texte), ou `null`. */
  reformulation: string | null;
  choixProjet: ChoixProjet;
  setChoixProjet: (c: ChoixProjet) => void;
  texte: string;
  setTexte: (t: string) => void;
  /** Un projet existe (objectif, intention), mais il ne dit pas encore ce qui compte. */
  projetSansTexte: boolean;
}) {
  const note = noteDuCouple(objectif, relation);
  const zoneTexte = (
    <>
      <textarea
        id="projet-texte"
        value={texte}
        onChange={(e) => setTexte(e.target.value)}
        rows={3}
        maxLength={1200}
        aria-describedby="projet-aide"
        placeholder="Nous cherchons un appartement calme, bien desservi, où il sera possible de vivre sans voiture."
        className="w-full rounded-lg border border-[var(--border-2)] bg-[var(--bg-deep,#0f1424)] px-4 py-3 text-[14.5px] leading-relaxed text-label outline-none focus:border-accent/60 resize-y"
      />
      <p id="projet-aide" className="text-[12.5px] text-ghost leading-relaxed mt-2">
        Une phrase suffit. Elle devient votre projet : il vaut pour tous vos dossiers, et vous le
        retrouverez dans votre espace pour le modifier.
      </p>
    </>
  );

  return (
    <div style={{ display: "grid", gap: 28 }}>
      <Question legende="Pourquoi examinez-vous ce logement ?">
        <div className="flex flex-wrap gap-2">
          {(Object.keys(OBJECTIF_LIBELLE) as AddressObjective[]).map((o) => (
            <Puce key={o} name="objectif" value={o} checked={objectif === o} onChange={() => setObjectif(o)}>
              {OBJECTIF_LIBELLE[o]}
            </Puce>
          ))}
        </div>
      </Question>

      <Question legende="Quel est votre lien actuel avec ce bien ?">
        <div className="flex flex-wrap gap-2">
          {(Object.keys(RELATION_LIBELLE) as ChoixRelation[]).map((r) => (
            <Puce key={r} name="relation" value={r} checked={relation === r} onChange={() => setRelation(r)}>
              {RELATION_LIBELLE[r]}
            </Puce>
          ))}
        </div>
        {note && (
          <p className="text-[13px] text-muted leading-relaxed mt-3" aria-live="polite">{note}</p>
        )}
      </Question>

      <Question legende="Qu'est-ce qui compte le plus pour vous ?">
        {reformulation ? (
          <>
            <blockquote className="m-0 mb-3 rounded-lg border border-[var(--border-1)] bg-[var(--bg-elev)] px-4 py-3 text-[14.5px] leading-relaxed text-label">
              {reformulation}
            </blockquote>
            <div className="flex flex-wrap gap-2 mb-3">
              <Puce name="projet" value="garder" checked={choixProjet === "garder"} onChange={() => setChoixProjet("garder")}>
                Garder ce projet
              </Puce>
              <Puce name="projet" value="modifier" checked={choixProjet === "modifier"} onChange={() => setChoixProjet("modifier")}>
                Le modifier
              </Puce>
            </div>
            {choixProjet === "modifier" && (
              <>
                <label htmlFor="projet-texte" className="sr-only">Votre projet</label>
                {zoneTexte}
              </>
            )}
          </>
        ) : (
          <>
            {projetSansTexte && (
              <p className="text-[13.5px] text-muted leading-relaxed mb-3">
                Votre projet ne dit pas encore ce qui compte pour vous.
              </p>
            )}
            <label htmlFor="projet-texte" className="sr-only">Votre projet</label>
            {zoneTexte}
          </>
        )}
      </Question>
    </div>
  );
}
