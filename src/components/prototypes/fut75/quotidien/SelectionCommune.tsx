"use client";

// FUT-75 (2e itération) · Q3 · SÉLECTIONNER DES COMMUNES À COMPARER. DEV UNIQUEMENT.
//
// En production (comparateur, Où vivre), une case se coche et un compteur change : la commune choisie
// ne va nulle part. Ici, elle REJOINT le plateau de comparaison : son étiquette se transforme en jeton
// du plateau (View Transitions, la même forme qui change de fonction), le compteur se pose sur un
// micro-ressort, et la ligne d'origine garde la trace de l'ajout. Retirer un jeton le renvoie à sa
// ligne. Au-delà de trois, rien ne bouge : la limite est dite, sans secousse.
import { useState } from "react";
import type { ModeMouvement } from "../motion";
import { avecContinuite } from "../vues";
import m from "../motion.module.css";

export const COMMUNES_DEMO = [
  { insee: "30189", nom: "Nîmes", dep: "Gard" },
  { insee: "35238", nom: "Rennes", dep: "Ille-et-Vilaine" },
  { insee: "67482", nom: "Strasbourg", dep: "Bas-Rhin" },
  { insee: "29019", nom: "Brest", dep: "Finistère" },
  { insee: "74010", nom: "Annecy", dep: "Haute-Savoie" },
] as const;
const MAX = 3;

export function SelectionCommuneNouveau({ mode }: { mode: ModeMouvement }) {
  const [choix, setChoix] = useState<string[]>([]);
  const [limite, setLimite] = useState(false);
  const basculer = (insee: string) => {
    if (!choix.includes(insee) && choix.length >= MAX) { setLimite(true); return; }
    setLimite(false);
    avecContinuite(mode, () => setChoix((c) => (c.includes(insee) ? c.filter((x) => x !== insee) : [...c, insee])), "q3");
  };
  return (
    <div className={m.selectionCommune}>
      <ul className={m.listeCommunes}>
        {COMMUNES_DEMO.map((c) => {
          const pris = choix.includes(c.insee);
          return (
            <li key={c.insee} className={m.ligneCommune} data-pris={pris || undefined}>
              <span className={m.nomCommune}>{c.nom}<span className={m.depCommune}>{c.dep}</span></span>
              <button type="button" className={m.boutonComparer} aria-pressed={pris} onClick={() => basculer(c.insee)}
                data-vt-nom={pris ? undefined : `fut75-commune-${c.insee}`}>
                {pris ? "Ajoutée ✓" : "Comparer"}
              </button>
            </li>
          );
        })}
      </ul>
      <div className={m.plateau} aria-live="polite">
        <span className={m.plateauCompte}><strong key={choix.length} className={m.ressortPose}>{choix.length}</strong> / {MAX} à comparer</span>
        <span className={m.plateauJetons}>
          {choix.map((insee) => {
            const c = COMMUNES_DEMO.find((x) => x.insee === insee)!;
            return (
              <button key={insee} type="button" className={m.jeton} data-vt-nom={`fut75-commune-${insee}`} onClick={() => basculer(insee)} aria-label={`Retirer ${c.nom}`}>
                {c.nom} <span aria-hidden>×</span>
              </button>
            );
          })}
        </span>
        {limite ? <span className={m.plateauLimite}>Trois communes au plus : retirez-en une pour en ajouter une autre.</span> : null}
        <button type="button" className={m.boutonScene} disabled={choix.length < 2}>Comparer {choix.length >= 2 ? `ces ${choix.length} communes` : ""}</button>
      </div>
    </div>
  );
}

export function SelectionCommuneAncien() {
  const [choix, setChoix] = useState<string[]>([]);
  return (
    <div className="grid gap-3">
      <ul className="grid gap-1">
        {COMMUNES_DEMO.map((c) => (
          <li key={c.insee} className="flex items-center gap-3 text-[14px] text-label">
            <input type="checkbox" checked={choix.includes(c.insee)} onChange={() => setChoix((x) => (x.includes(c.insee) ? x.filter((y) => y !== c.insee) : x.length < MAX ? [...x, c.insee] : x))} />
            {c.nom} <span className="text-ghost text-[12px]">{c.dep}</span>
          </li>
        ))}
      </ul>
      <p className="text-[13px] text-muted">{choix.length} commune{choix.length > 1 ? "s" : ""} sélectionnée{choix.length > 1 ? "s" : ""}</p>
    </div>
  );
}
