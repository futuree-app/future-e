"use client";
// FUT-41 V5 · formes partagées. Elles composent les primitives du Relevé ; aucune nouvelle primitive.
// Chaque signe porte aussi un MOT : le glyphe de l'échelle (cercle, carré, losange) aide à reconnaître,
// il n'est jamais la seule façon de comprendre. Une photo n'apparaît que si la personne l'a ajoutée.
import type { CSSProperties, ReactNode } from "react";
import { GlypheGrain, releve as s } from "@/components/releve/primitives";
import { lier } from "../fut41-v4/communs";
import { TEINTE_ISSUE, LIBELLE_ISSUE_SIMPLE, type Geste, type LigneRegistre, type Logement } from "./modele5";
import v from "./v5.module.css";

export { lier };

export const GLYPHE_COUCHE = { commune: "commune", abords: "secteur", logement: "batiment" } as const;

/** L'issue : le trait de son registre et un mot simple. */
export function Marque({ ligne, perime = false }: { ligne: LigneRegistre | null; perime?: boolean }) {
  if (!ligne) return <span className={v.pasLu}>pas encore étudié</span>;
  // B (revue Work) : une issue écrite sous une autre version de la condition est un fait daté.
  if (perime) return (
    <span className={v.marque} style={{ "--r-teinte": "var(--reg-controle)" } as CSSProperties}>
      <span className={v.trait} aria-hidden />
      <span className={v.marqueMot}>À revoir</span>
      <span className={v.marqueAlors}>concluait « {LIBELLE_ISSUE_SIMPLE[ligne.issue].toLowerCase()} » sous votre Projet d&apos;alors</span>
    </span>
  );
  return (
    <span className={v.marque} style={{ "--r-teinte": TEINTE_ISSUE[ligne.issue] } as CSSProperties}>
      <span className={v.trait} aria-hidden />
      <span className={v.marqueMot}>{LIBELLE_ISSUE_SIMPLE[ligne.issue]}</span>
    </span>
  );
}

/**
 * UNE MESURE SUR SA RÈGLE (idée reprise de la V4.1 Work) : la valeur mesurée, la limite actuelle en
 * pointillé, et la limite d'alors quand l'analyse a été faite sous une autre. La donnée ne s'anime pas.
 */
export function Mesure({ valeur, unite, limite, limiteAlors, date }: { valeur: number; unite: string; limite: number | null; limiteAlors: number | null; date?: string | null }) {
  const max = Math.max(40, valeur + 5, limite ?? 0, limiteAlors ?? 0);
  const pc = (x: number) => `${Math.round((x / max) * 1000) / 10}%`;
  return (
    <span className={v.mesure}>
      <span className={v.mesureValeur}>{valeur} {unite}</span>
      <span className={v.regle} aria-hidden>
        {/* Une mesure faite sous une autre limite n'est pas colorée comme un dépassement : elle ne dit pas la situation présente. */}
        <span className={v.regleValeur} style={{ width: pc(valeur) }} data-depasse={limite != null && limiteAlors == null && valeur > limite ? "" : undefined} />
        {limite != null ? <span className={v.regleLimite} style={{ left: pc(limite) }} /> : null}
        {limiteAlors != null ? <span className={v.regleAlors} style={{ left: pc(limiteAlors) }} /> : null}
      </span>
      <span className={v.mesureNote}>
        {limite != null ? `votre limite : ${limite} ${unite}` : null}
        {limiteAlors != null ? ` · mesuré${date ? ` le ${date}` : ""} quand elle était de ${limiteAlors} ${unite} ; une mise à jour dirait où il en est aujourd'hui` : null}
      </span>
    </span>
  );
}

export function Glyphe({ couche, taille = 11 }: { couche: keyof typeof GLYPHE_COUCHE; taille?: number }) {
  return <GlypheGrain grain={GLYPHE_COUCHE[couche]} taille={taille} />;
}

/** La vignette d'un logement : la photo de la personne, ou une plaque neutre (jamais d'illustration). */
export function Vignette({ logement, taille = 56 }: { logement: Logement; taille?: number }) {
  if (logement.photo) {
    return (
      <span className={v.vignette} style={{ width: taille, height: taille }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logement.photo} alt={`Photo ajoutée par vous : ${logement.libelle}`} />
      </span>
    );
  }
  const initiales = logement.libelle.replace(/^(T\d|Maison)\s+/i, "").split(/\s+/).filter((m) => m.length > 2).slice(0, 2).map((m) => m[0]!.toUpperCase()).join("");
  return (
    <span className={`${v.vignette} ${v.vignetteVide}`} style={{ width: taille, height: taille }} aria-hidden>
      <span className={v.vignettePieces}>{logement.annonce?.pieces ? `${logement.annonce.pieces}p` : "?"}</span>
      <span className={v.vignetteInit}>{initiales}</span>
    </span>
  );
}

/** Le geste principal d'une possibilité : un bouton et, dessous si demandé, ce qu'il apporte. */
export function BoutonGeste({ geste, faire, principal = false, apport }: { geste: Geste; faire: (e: HTMLElement) => void; principal?: boolean; apport?: string | null }) {
  return (
    <div className={v.geste}>
      <button type="button" className={principal ? `${s.bouton} ${s.boutonMarque}` : s.bouton} onClick={(e) => faire(e.currentTarget)}>{geste.libelle}</button>
      {apport ? <p className={v.gesteApport}>{lier(apport)}</p> : null}
    </div>
  );
}

export function Fil({ segments }: { segments: { libelle: string; aller?: () => void }[] }) {
  return (
    <nav aria-label="Fil d'Ariane" className={v.fil}>
      {segments.map((seg, i) => (
        <span key={i} className={v.filSeg}>
          {i > 0 ? <span aria-hidden className={v.filSep}>/</span> : null}
          {seg.aller ? <button type="button" className={v.filLien} onClick={seg.aller}>{seg.libelle}</button> : <span aria-current="page">{seg.libelle}</span>}
        </span>
      ))}
    </nav>
  );
}

export function Section({ titre, children, id, action, sous }: { titre: string; children: ReactNode; id: string; action?: ReactNode; sous?: string }) {
  return (
    <section className={v.section} aria-labelledby={`${id}-t`} id={id}>
      <div className={v.sectionTete}>
        <div>
          <h2 className={v.sectionTitre} id={`${id}-t`} tabIndex={-1}>{titre}</h2>
          {sous ? <p className={s.nuance}>{sous}</p> : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function Declare({ children = "déclaré" }: { children?: ReactNode }) {
  return <span className={v.declare}>{children}</span>;
}
