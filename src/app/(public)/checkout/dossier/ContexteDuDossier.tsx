"use client";

import type { ReactNode } from "react";
import type { AddressObjective } from "@/lib/relation-au-lieu";
import {
  EXEMPLES_DE_LECTURE, OBJECTIF_LIBELLE, RELATION_LIBELLE, noteDuCouple, type ChoixRelation,
} from "@/lib/dossier-contexte-ecran";

// ════════════════════════════════════════════════════════════════════════════════════════════
// LE DÉBUT DE L'EXPÉRIENCE, AVANT LE PAIEMENT (FUT-10). Ce composant montre et recueille ; il
// n'enregistre rien. `DossierCheckoutPanel` décide quand le projet s'écrit et quand le paiement s'ouvre.
//
// LA HIÉRARCHIE DIT LE SENS (revue du 11/10/2026) :
//   1. le PROJET d'abord : c'est lui qui donne un sens à la lecture. Déjà renseigné, il est montré tel
//      que futur•e le connaît, et se garde d'un geste. Absent, une phrase suffit, et deux exemples
//      courts disent ce qu'elle change à la lecture d'une même adresse ;
//   2. puis « pour ce logement » : l'objectif de l'analyse et le lien avec le bien, deux réponses
//      distinctes qui précisent la situation (le locataire qui achète son logement répond aux deux).
// Aucune n'est obligatoire, aucune ne se déduit d'une autre : une suggestion se lit, elle ne coche rien.
//
// DES RADIOS NATIFS habillés en puces : flèches, Tab et Espace fonctionnent sans code, et un lecteur
// d'écran annonce le groupe et l'état. Le vocabulaire interne n'apparaît nulle part.
// ════════════════════════════════════════════════════════════════════════════════════════════

export type ChoixProjet = "garder" | "modifier";

export type SyntheseProjet = { intention: string | null; priorites: string | null; conditions: string[] };

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

function Question({ legende, cachee = false, children }: { legende: string; cachee?: boolean; children: ReactNode }) {
  return (
    <fieldset className="border-0 p-0 m-0 min-w-0">
      <legend className={cachee ? "sr-only" : "text-[14.5px] text-label leading-snug mb-2.5 p-0"}>{legende}</legend>
      {children}
    </fieldset>
  );
}

export function ContexteDuDossier({
  synthese, choixProjet, setChoixProjet, texte, setTexte,
  objectif, setObjectif, relation, setRelation,
}: {
  /** Ce que futur•e connaît déjà du projet, ou `null` s'il n'y en a pas. */
  synthese: SyntheseProjet | null;
  choixProjet: ChoixProjet;
  setChoixProjet: (c: ChoixProjet) => void;
  texte: string;
  setTexte: (t: string) => void;
  objectif: AddressObjective | null;
  setObjectif: (o: AddressObjective) => void;
  relation: ChoixRelation | null;
  setRelation: (r: ChoixRelation) => void;
}) {
  const note = noteDuCouple(objectif, relation);
  const projetRenseigne = Boolean(synthese?.priorites);

  const zoneTexte = (
    <>
      <label htmlFor="projet-texte" className="sr-only">Ce qui compte pour vous</label>
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
        Une phrase suffit. Elle devient votre projet : il vaut pour tous vos dossiers, et se modifie
        depuis votre espace.
      </p>
    </>
  );

  return (
    <div>
      {/* ── 1. LE PROJET ─────────────────────────────────────────────────────────────── */}
      {projetRenseigne && synthese ? (
        <section aria-labelledby="projet-titre">
          <h2 id="projet-titre" className="text-[20px] text-label leading-snug mb-2" style={{ fontFamily: "var(--font-serif)" }}>
            Votre projet est déjà renseigné.
          </h2>
          <p className="text-[14px] text-muted leading-relaxed mb-4">
            Votre dossier lira cette adresse à travers lui.
          </p>
          <div className="border-l-2 border-accent/50 pl-4 mb-4" style={{ display: "grid", gap: 6 }}>
            {synthese.intention && <p className="m-0 text-[13px] text-ghost">{synthese.intention}</p>}
            <p className="m-0 text-[15px] leading-relaxed text-label">{synthese.priorites}</p>
            {synthese.conditions.length > 0 && (
              <p className="m-0 text-[13px] text-muted">
                {synthese.conditions.length === 1 ? "Condition sans compromis : " : "Conditions sans compromis : "}
                {synthese.conditions.join(", ")}.
              </p>
            )}
          </div>
          <Question legende="Votre projet" cachee>
            <div className="flex flex-wrap gap-2">
              <Puce name="projet" value="garder" checked={choixProjet === "garder"} onChange={() => setChoixProjet("garder")}>
                Garder ce projet
              </Puce>
              <Puce name="projet" value="modifier" checked={choixProjet === "modifier"} onChange={() => setChoixProjet("modifier")}>
                Le modifier
              </Puce>
            </div>
          </Question>
          {choixProjet === "modifier" && <div className="mt-3">{zoneTexte}</div>}
        </section>
      ) : (
        <section aria-labelledby="projet-titre">
          <h2 id="projet-titre" className="text-[20px] text-label leading-snug mb-2" style={{ fontFamily: "var(--font-serif)" }}>
            Un lieu ne se résume pas à ses données.
          </h2>
          <p className="text-[14px] text-muted leading-relaxed mb-5">
            Les faits documentés sur cette adresse sont les mêmes pour tout le monde. Ce qui compte pour
            vous décide de ce que votre dossier met en avant, rapproche et vous propose de vérifier.
          </p>
          <p className="text-[15px] text-label leading-snug mb-2.5">Qu&apos;est-ce qui compte pour vous&nbsp;?</p>
          {synthese && !synthese.priorites && (
            <p className="text-[13px] text-muted leading-relaxed mb-2.5">
              Votre projet existe, mais il ne dit pas encore ce qui compte pour vous.
            </p>
          )}
          {zoneTexte}
          {/* DEUX EXEMPLES, DITS COMME TELS : ils n'affichent aucune valeur et ne parlent d'aucune
              adresse réelle. Ils montrent seulement qu'une même adresse ne se lit pas pareil. */}
          <div className="mt-4">
            <p className="font-mono text-[10.5px] tracking-[0.1em] uppercase text-ghost mb-2">
              Par exemple, pour une même adresse
            </p>
            <ul className="list-none m-0 p-0" style={{ display: "grid", gap: 6 }}>
              {EXEMPLES_DE_LECTURE.map((e) => (
                <li key={e.priorite} className="text-[13px] text-muted leading-relaxed">
                  <span className="text-label">{e.priorite}</span> : {e.lecture}
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* ── 2. POUR CE LOGEMENT ──────────────────────────────────────────────────────── */}
      <section aria-labelledby="bien-titre" className="mt-8 pt-6 border-t border-[var(--border-1)]" style={{ display: "grid", gap: 20 }}>
        <div>
          <h3 id="bien-titre" className="text-[15px] text-label leading-snug m-0">Et pour ce logement</h3>
          <p className="text-[13px] text-ghost leading-relaxed mt-1 mb-0">
            Votre situation oriente les vérifications proposées.
          </p>
        </div>
        <Question legende="Vous l'examinez…">
          <div className="flex flex-wrap gap-2">
            {(Object.keys(OBJECTIF_LIBELLE) as AddressObjective[]).map((o) => (
              <Puce key={o} name="objectif" value={o} checked={objectif === o} onChange={() => setObjectif(o)}>
                {OBJECTIF_LIBELLE[o]}
              </Puce>
            ))}
          </div>
        </Question>
        <Question legende="Votre lien actuel avec ce bien">
          <div className="flex flex-wrap gap-2">
            {(Object.keys(RELATION_LIBELLE) as ChoixRelation[]).map((r) => (
              <Puce key={r} name="relation" value={r} checked={relation === r} onChange={() => setRelation(r)}>
                {RELATION_LIBELLE[r]}
              </Puce>
            ))}
          </div>
          {note && (
            <p className="text-[13px] text-muted leading-relaxed mt-2.5" aria-live="polite">{note}</p>
          )}
        </Question>
      </section>
    </div>
  );
}
