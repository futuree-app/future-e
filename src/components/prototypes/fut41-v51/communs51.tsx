"use client";
// FUT-41 V5.1 · LA GRAMMAIRE VISUELLE. Cinq rôles, toujours traités de la même façon, sans encadré
// autour de chaque information et sans nouvelle couleur sémantique :
//   · Constat     ce que futur•e sait : texte plein, la valeur concrète en gras ;
//   · Conséquence ce que cela implique pour le Projet : la condition nommée en tête, son poids déclaré ;
//   · Incertitude ce qui manque : un cercle en pointillé avec « ? », et le mot ;
//   · Action      ce que la personne peut faire : un verbe sur un bouton, une flèche ;
//   · Preuve      d'où vient l'information : repliée, en petit, jamais en première lecture.
// Chaque signe porte son mot : la forme aide à reconnaître, le mot dit.
import type { ReactNode } from "react";
import { releve as s } from "@/components/releve/primitives";
import { connaissance51, suivi51 } from "./lecture51";
import type { Logement, Recherche } from "../fut41-v5/modele5";
import w from "./v51.module.css";

type Genre = "fait" | "incertain" | "action" | "preuve";

/** Le signe d'un rôle (décoratif : le mot qui suit dit la même chose). */
export function Signe({ genre }: { genre: Genre }) {
  return (
    <span className={w.signe} data-genre={genre} aria-hidden>
      <svg width="18" height="18" viewBox="0 0 18 18" focusable="false">
        {genre === "fait" ? <circle cx="9" cy="9" r="4.5" fill="currentColor" /> : null}
        {genre === "incertain" ? <><circle cx="9" cy="9" r="7" fill="none" stroke="currentColor" strokeWidth="1.4" strokeDasharray="2.6 2.2" /><text x="9" y="12.6" textAnchor="middle" fontSize="10" fontWeight="700" fill="currentColor">?</text></> : null}
        {genre === "action" ? <path d="M3 9h11M10 5l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /> : null}
        {genre === "preuve" ? <path d="M5 3h6l3 3v9H5zM7 8h5M7 11h5" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" /> : null}
      </svg>
    </span>
  );
}

/** Une ligne de première lecture : son signe, son intitulé court, puis la phrase. */
export function Retenir({ genre, titre, children, action }: { genre: Genre; titre: string; children: ReactNode; action?: ReactNode }) {
  return (
    <li className={w.retenir} data-genre={genre}>
      <Signe genre={genre} />
      <div className={w.retenirCorps}>
        <p className={w.retenirTitre}>{titre}</p>
        <div className={w.retenirTexte}>{children}</div>
        {action ? <div className={w.retenirAction}>{action}</div> : null}
      </div>
    </li>
  );
}

/** Le bouton d'une action : un verbe concret et une flèche. `principal` : l'action la plus utile de l'écran. */
export function Agir({ children, onClick, principal = false, id }: { children: ReactNode; onClick: (el: HTMLElement) => void; principal?: boolean; id?: string }) {
  return (
    <button type="button" id={id} className={`${s.bouton} ${principal ? s.boutonMarque : ""} ${w.agir}`} onClick={(e) => onClick(e.currentTarget)}>
      <span>{children}</span><svg width="16" height="16" viewBox="0 0 16 16" aria-hidden focusable="false"><path d="M3 8h9M9 4.5 12.5 8 9 11.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
    </button>
  );
}

/** La preuve, repliée : « D'où viennent ces informations ». */
export function Preuves({ titre = "D'où viennent ces informations", children }: { titre?: string; children: ReactNode }) {
  return (
    <details className={`${s.details} ${w.preuves}`}>
      <summary><Signe genre="preuve" /> {titre}</summary>
      <div className={w.preuvesCorps}>{children}</div>
    </details>
  );
}

// ── Les deux dimensions d'un logement ─────────────────────────────────────────────────────────

const ICONE_SUIVI: Record<ReturnType<typeof suivi51>["cle"], ReactNode> = {
  repere: <path d="M5 2.5h6v11l-3-2.4-3 2.4z" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />,
  visite_envisagee: <><rect x="2.5" y="3.5" width="11" height="10" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.3" /><path d="M2.5 6.5h11M5.5 2v3M10.5 2v3" stroke="currentColor" strokeWidth="1.3" /></>,
  visite_prevue: <><rect x="2.5" y="3.5" width="11" height="10" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.3" /><path d="M2.5 6.5h11M5.5 2v3M10.5 2v3" stroke="currentColor" strokeWidth="1.3" /><rect x="5" y="8.5" width="3" height="3" fill="currentColor" /></>,
  visite: <path d="M3 8.5 6.5 12 13 4.5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />,
  ecarte: <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />,
};

/** Votre suivi : une icône et le mot. */
export function Suivi({ logement }: { logement: Logement }) {
  const x = suivi51(logement);
  return (
    <span className={w.suivi} data-suivi={x.cle}>
      <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden focusable="false">{ICONE_SUIVI[x.cle]}</svg>
      <span><span className={w.sr}>Votre suivi : </span>{x.libelle}</span>
    </span>
  );
}

/**
 * Ce que futur•e en sait : trois paliers (la commune, l'adresse, l'analyse) et un mot. La forme se lit
 * sans couleur : un palier plein est acquis, un palier vide ne l'est pas. Le mot dit l'essentiel.
 */
export function Savoir({ r, logement, detail = true }: { r: Recherche; logement: Logement; detail?: boolean }) {
  const k = connaissance51(r, logement);
  return (
    <span className={w.savoir} data-actualiser={k.actualiser || undefined}>
      <span className={w.paliers} aria-hidden>
        {k.paliers.map((p, i) => <span key={i} className={w.palier} data-plein={p || undefined} />)}
      </span>
      <span><span className={w.sr}>Ce que futur•e en sait : </span>{k.libelle}{detail && k.detail ? <span className={w.savoirDetail}> · {k.detail}</span> : null}</span>
    </span>
  );
}
