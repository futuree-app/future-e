// FUT-91 · UNE CARTE DU DOSSIER DANS LE RELEVÉ : le constat à gauche, sa preuve en marge.
//
// Partagée par la minute (`DossierDecisionReleve`) et la liste complète des contrôles
// (`ControlesReleve`) : une seule façon de rendre une carte, quelle que soit la section.
// Elle ne lit que `EntreeLue` (`lecture-dossier.ts`), qui garde chaque texte et chaque preuve du moteur.
//
// LES LIENS DE PREUVE PORTENT LA PROVENANCE (parité FUT-91). `evidenceHref(cible, href, provenance)` :
// quand le dossier servi vient d'un artefact daté, le lien rouvre la donnée de CETTE version, pas celle
// d'aujourd'hui. Le prototype FUT-87 l'omettait.
import type { CSSProperties } from "react";
import type { VerificationActionType } from "@/lib/decision/decision-fact";
import type { EntreeLue } from "./lecture-dossier";
import { releve as s, Ligne, Marge, Registre, RegleDeRang, Seuils } from "./primitives";
import { margeDe } from "./marge";

export { margeDe, teinteSection, teinteEntree } from "./marge";

const GESTE: Record<VerificationActionType, string> = {
  verifier_sur_place: "M1 8s2.5-4.5 7-4.5S15 8 15 8s-2.5 4.5-7 4.5S1 8 1 8Z M9.8 8a1.8 1.8 0 1 1-3.6 0 1.8 1.8 0 0 1 3.6 0Z",
  obtenir_document: "M4 1.8h5l3 3v9.4H4V1.8Z M9 1.8v3h3",
  demander_confirmation: "M5.7 5.7a2.3 2.3 0 1 1 3.1 2.2c-.5.2-.8.6-.8 1.1v.4 M8 12.3h.01",
  renseigner_adresse: "M2.5 8h10 M8.8 4.3 13 8l-4.2 3.7",
};

export function Geste({ libelle, type }: { libelle: string; type?: VerificationActionType }) {
  return (
    <p className={s.dense} style={{ display: "flex", gap: 10, alignItems: "flex-start", color: "var(--r-encre)" }}>
      <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden focusable="false" style={{ flex: "none", marginTop: 3 }}
        fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
        <path d={GESTE[type ?? "renseigner_adresse"]} />
      </svg>
      <span>{libelle}</span>
    </p>
  );
}

function DonneesEtLimites({ e, provenance }: { e: EntreeLue; provenance?: string }) {
  if (e.aVerifier.length + e.methode.length + e.detailles.length === 0) return null;
  return (
    <details className={s.details}>
      <summary>
        {e.detailles.length > 0
          ? `Données, limites et ${e.detailles.length > 1 ? `les ${e.detailles.length} constats détaillés` : "le constat détaillé"}`
          : "Données et limites"}
      </summary>
      <div className={s.pile} style={{ marginTop: 8, paddingLeft: 12, borderLeft: "1px solid var(--r-filet)" }}>
        {/* Les deux zones de `MethodDetails`, dans le même ordre et sous les mêmes noms. */}
        {e.aVerifier.length > 0 ? (
          <div className={s.pileSerree}>
            <p className={s.etiquette}>À vérifier</p>
            {e.aVerifier.map((l, i) => <p key={i} className={s.nuance}>{l}</p>)}
          </div>
        ) : null}
        {e.methode.length > 0 ? (
          <div className={s.pileSerree}>
            <p className={s.etiquette}>Méthode du signal</p>
            {e.methode.map((l, i) => <p key={i} className={s.nuance}>{l}</p>)}
          </div>
        ) : null}
        {e.detailles.map((d) => (
          <div key={d.ancre} className={s.pileSerree}>
            {d.statut ? <p className={s.etiquette}>{d.statut}</p> : null}
            <p className={s.dense}>{d.enonce}</p>
            {d.nuance ? <p className={s.nuance}>{d.nuance}</p> : null}
            <Marge elements={margeDe(d, provenance)} enLigne />
            {d.geste ? <Geste libelle={d.geste.libelle} type={d.geste.type} /> : null}
          </div>
        ))}
      </div>
    </details>
  );
}

function Corps({ e, teinte, compacte, provenance }: { e: EntreeLue; teinte: string; compacte: boolean; provenance?: string }) {
  return (
    <>
      {e.horsPriorites ? <p className={s.etiquette}>Au-delà de vos priorités</p> : null}
      {e.sujet ? <Registre teinte={teinte} as="h3">{e.sujet.charAt(0).toUpperCase() + e.sujet.slice(1)}</Registre> : null}
      {e.statut ? <p className={`${s.etiquette} ${s.teinte}`} style={{ "--r-teinte": teinte } as CSSProperties}>{e.statut}</p> : null}
      {e.sujet ? (
        <p className={compacte ? s.dense : s.corps}>{e.enonce}</p>
      ) : (
        <Registre teinte={teinte} className={`${s.corps} ${s.encre}`}>{e.enonce}</Registre>
      )}
      {e.fondement?.type === "rang" ? <RegleDeRang bas={e.fondement.bas} haut={e.fondement.haut} sujet={e.sujet ?? ""} /> : null}
      {e.fondement?.type === "seuils" ? <Seuils horizon={e.fondement.horizon} mesures={e.fondement.mesures} /> : null}
      {e.nuance ? <p className={s.nuance}>{e.nuance}</p> : null}
      {e.cotes.length > 0 ? (
        <ul className={`${s.liste} ${e.nature === "tradeoff" ? s.cotesEnRegard : ""}`} style={{ marginTop: 6 }}>
          {e.cotes.map((c, i) => (
            <li key={i} className={s.cote}>
              <div className={s.pileSerree}>
                {c.libelle ? <p className={s.etiquette}>{c.libelle}</p> : null}
                {c.statut ? <p className={s.etiquette}>{c.statut}</p> : null}
                <p className={s.dense}>{c.enonce}</p>
                {c.nuance ? <p className={s.nuance}>{c.nuance}</p> : null}
                {c.preuves.length + c.sources.length > 0 ? (
                  <Marge elements={margeDe({ grains: [], preuves: c.preuves, sources: c.sources }, provenance)} enLigne />
                ) : null}
                {c.geste ? <Geste libelle={c.geste.libelle} type={c.geste.type} /> : null}
              </div>
            </li>
          ))}
        </ul>
      ) : null}
      {e.geste ? <Geste libelle={e.geste.libelle} type={e.geste.type} /> : null}
      <DonneesEtLimites e={e} provenance={provenance} />
    </>
  );
}

/**
 * UNE CARTE. L'ancre et le focus programmatique sont ceux de la production (`dossierAnchorId`,
 * `tabIndex=-1`) : « À contrôler en priorité » y renvoie. `compacte` : la marge passe sous le texte
 * (colonnes de la balance).
 */
export function EntreeReleve({ e, teinte, compacte = false, provenance, ancre = true }: {
  e: EntreeLue; teinte: string; compacte?: boolean; provenance?: string;
  /** `false` dans la liste complète des contrôles : comme en production, seule la minute porte les
   *  ancres, sans quoi une carte présente aux deux endroits aurait deux fois le même identifiant. */
  ancre?: boolean;
}) {
  return (
    <li id={ancre ? e.ancre : undefined} tabIndex={ancre ? -1 : undefined} className={s.entree}>
      {compacte ? (
        <div className={s.pile}>
          <Corps e={e} teinte={teinte} compacte provenance={provenance} />
          <Marge elements={margeDe(e, provenance)} />
        </div>
      ) : (
        <Ligne marge={<Marge elements={margeDe(e, provenance)} />}>
          <Corps e={e} teinte={teinte} compacte={false} provenance={provenance} />
        </Ligne>
      )}
    </li>
  );
}
