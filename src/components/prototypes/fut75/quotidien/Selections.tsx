"use client";

// FUT-75 (2e itération) · Q2 · SÉLECTIONS ET ONGLETS. DEV UNIQUEMENT.
//
// Trois usages réels d'un même geste : l'horizon (module Territoire), l'échelle de lecture (hub), la
// mesure affichée. En production, l'option choisie change de fond d'un coup (`HorizonSwitch`, rendu
// tel quel ci-contre pour comparer). Ici, l'indicateur élastique (`SelecteurElastique`) : le bord de
// tête s'étire vers la cible, l'autre suit, l'ensemble se pose sur un micro-ressort ; au survol, il
// penche vers l'option visée. La sélection est immédiate, le mouvement suit.
import { useState } from "react";
import { HorizonSwitch, type Horizon } from "@/components/HorizonSwitch";
import { HORIZON } from "@/lib/horizons";
import { ORDRE_HORIZONS, type CleHorizon, type ModeMouvement } from "../motion";
import { SelecteurElastique } from "../SelecteurElastique";
import m from "../motion.module.css";

const Forme = ({ f }: { f: "c" | "a" | "l" }) => (
  <svg width="13" height="13" viewBox="0 0 14 14" aria-hidden style={{ display: "inline-block", marginRight: 7, verticalAlign: "-1px" }}>
    {f === "c" ? <circle cx="7" cy="7" r="5.6" fill="none" stroke="currentColor" strokeWidth="1.4" />
      : f === "a" ? <rect x="1.8" y="1.8" width="10.4" height="10.4" rx="1.6" fill="none" stroke="currentColor" strokeWidth="1.4" />
        : <rect x="3.3" y="3.3" width="7.4" height="7.4" rx="0.8" transform="rotate(45 7 7)" fill="none" stroke="currentColor" strokeWidth="1.4" />}
  </svg>
);

export function SelectionsNouveau({ mode }: { mode: ModeMouvement }) {
  const [h, setH] = useState<CleHorizon>("gwl20");
  const [e, setE] = useState<"territoire" | "autour" | "logement">("territoire");
  const [mesure, setMesure] = useState<"jours" | "nuits" | "feu">("jours");
  return (
    <div className={m.selectionsGrille}>
      <div className={m.selectionsLigne}>
        <p className={m.coucheNom}>Horizon (module Territoire)</p>
        <SelecteurElastique etiquette="Horizon" valeur={h} choisir={setH} mode={mode} teinte="var(--red)"
          options={ORDRE_HORIZONS.map((k) => ({ cle: k, libelle: HORIZON[k].annee, sous: HORIZON[k].france }))} />
      </div>
      <div className={m.selectionsLigne}>
        <p className={m.coucheNom}>Échelle de lecture (hub)</p>
        <SelecteurElastique etiquette="Échelle" valeur={e} choisir={setE} mode={mode} taille="compact"
          options={[{ cle: "territoire", libelle: <><Forme f="c" />Territoire</> }, { cle: "autour", libelle: <><Forme f="a" />Autour</> }, { cle: "logement", libelle: <><Forme f="l" />Logement</> }]} />
      </div>
      <div className={m.selectionsLigne}>
        <p className={m.coucheNom}>Mesure affichée</p>
        <SelecteurElastique etiquette="Mesure" valeur={mesure} choisir={setMesure} mode={mode} taille="compact"
          options={[{ cle: "jours", libelle: "Jours > 35 °C" }, { cle: "nuits", libelle: "Nuits tropicales" }, { cle: "feu", libelle: "Danger de feu" }]} />
      </div>
    </div>
  );
}

/** Le composant de production `HorizonSwitch`, rendu tel quel, et deux répliques du même comportement. */
export function SelectionsAncien() {
  const [h, setH] = useState<Horizon>("2050" as Horizon);
  const [e, setE] = useState("territoire");
  const bouton = (actif: boolean) => `px-3 py-2 rounded-md text-[13px] border ${actif ? "border-[var(--border-2)] bg-[var(--bg-elev-2)] text-label font-semibold" : "border-transparent text-muted"}`;
  return (
    <div className={m.selectionsGrille}>
      <div className={m.selectionsLigne}><p className={m.coucheNom}>Horizon : HorizonSwitch de production</p><HorizonSwitch value={h} onChange={setH} /></div>
      <div className={m.selectionsLigne}>
        <p className={m.coucheNom}>Échelle (réplique)</p>
        <div className="flex gap-1">{["territoire", "autour", "logement"].map((k) => <button key={k} type="button" className={bouton(k === e)} onClick={() => setE(k)}>{k}</button>)}</div>
      </div>
    </div>
  );
}
