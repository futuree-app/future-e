"use client";

// FUT-75 (2e itération) · Q6 · PASSER D'UNE ÉCHELLE À L'AUTRE, ET REVENIR À UNE PREUVE. DEV UNIQUEMENT.
//
// En production, changer de module remplace la page ; une preuve d'arrivée est désignée par un bref
// contour (`EvidenceArrival`). Ici, dans un même cadre :
//   - la vue entrante arrive du côté où l'on va : vers le précis (Logement) elle vient de la droite,
//     vers le large (Territoire) de la gauche. L'ordre des échelles devient un sens de lecture ;
//   - le glyphe de l'échelle (cercle, carré, losange) se transforme de l'un en l'autre (View
//     Transitions), il ne disparaît jamais ;
//   - « voir la preuve » change de vue ET pose le lecteur sur la carte visée, qui reçoit un liseré qui
//     s'efface en 900 ms, et le focus (lecteurs d'écran).
// Les cartes sont celles du vrai dossier d'adresse public, rangées par la projection du moteur.
import { useEffect, useRef, useState } from "react";
import type { ModeMouvement } from "../motion";
import { SelecteurElastique } from "../SelecteurElastique";
import { avecContinuite } from "../vues";
import m from "../motion.module.css";

type Cle = "territoire" | "quartier" | "logement";
export type Apercu = Record<Cle, { ancre: string; sujet: string; enonce: string; preuve?: string }[]>;
const ORDRE: Cle[] = ["territoire", "quartier", "logement"];
const NOM: Record<Cle, string> = { territoire: "Territoire", quartier: "Autour de l'adresse", logement: "Logement" };
const GRAIN: Record<Cle, string> = { territoire: "la commune", quartier: "le voisinage", logement: "le bâtiment" };

function Glyphe({ cle }: { cle: Cle }) {
  return (
    <svg width="34" height="34" viewBox="0 0 34 34" aria-hidden data-vt-nom="fut75-vue-glyphe" className={m.vueGlyphe}>
      {cle === "territoire" ? <circle cx="17" cy="17" r="14" /> : cle === "quartier" ? <rect x="4" y="4" width="26" height="26" rx="4" /> : <rect x="9" y="9" width="16" height="16" rx="2" transform="rotate(45 17 17)" />}
    </svg>
  );
}

export function TransitionVuesNouveau({ apercu, mode }: { apercu: Apercu; mode: ModeMouvement }) {
  const [vue, setVue] = useState<Cle>("territoire");
  const [arrivee, setArrivee] = useState<string | null>(null);
  const cadre = useRef<HTMLDivElement>(null);
  const aller = (cible: Cle, ancre?: string) => {
    if (typeof document !== "undefined") document.documentElement.dataset.sens = ORDRE.indexOf(cible) >= ORDRE.indexOf(vue) ? "avant" : "arriere";
    avecContinuite(mode, () => { setVue(cible); setArrivee(ancre ?? null); }, "q6");
  };
  // LE FOCUS SUIT LE RENDU DE LA NOUVELLE VUE. Avec View Transitions, la mise à jour est appliquée de
  // façon asynchrone : la carte visée n'existe qu'après ce rendu-là, pas au moment du clic.
  useEffect(() => {
    if (!arrivee) return;
    const el = document.getElementById(`vue-${arrivee}`);
    el?.focus({ preventScroll: true });
    el?.scrollIntoView({ block: "nearest", behavior: mode === "anime" ? "smooth" : "auto" });
  }, [arrivee, vue, mode]);
  const preuveTerritoire = apercu.territoire.find((c) => c.preuve);
  return (
    <div className={m.vues}>
      <SelecteurElastique etiquette="Échelle de lecture" valeur={vue} choisir={(v) => aller(v)} mode={mode} taille="compact"
        options={ORDRE.map((k) => ({ cle: k, libelle: NOM[k] }))} />
      <div ref={cadre} className={m.vueCadre} data-vt-nom="fut75-vue">
        <div className={m.vueTete}><Glyphe cle={vue} /><div><p className={m.carteVerdict} style={{ fontSize: 24, paddingLeft: 0 }}>{NOM[vue]}</p><p className={m.coucheNom}>{GRAIN[vue]}</p></div></div>
        {apercu[vue].length === 0 ? <p className={m.coucheTexte}>Examiné, aucun constat affiché à cette échelle.</p> : null}
        <ul className={m.vueCartes}>
          {apercu[vue].map((c) => (
            <li key={c.ancre} id={`vue-${c.ancre}`} tabIndex={-1} className={m.vueCarte} data-arrivee={arrivee === c.ancre || undefined}>
              <p className={m.coucheNom}>{c.sujet}</p>
              <p className={m.coucheTexte}>{c.enonce}</p>
              {c.preuve ? <p className={m.coucheSource}>{c.preuve}</p> : null}
            </li>
          ))}
        </ul>
        {vue !== "territoire" && preuveTerritoire ? (
          <button type="button" className={m.boutonScene} onClick={() => aller("territoire", preuveTerritoire.ancre)}>
            ← Voir la preuve à l&apos;échelle de la commune : {preuveTerritoire.preuve}
          </button>
        ) : null}
      </div>
    </div>
  );
}

export function TransitionVuesAncien({ apercu }: { apercu: Apercu }) {
  const [vue, setVue] = useState<Cle>("territoire");
  return (
    <div className="grid gap-3">
      <div className="flex gap-1">{ORDRE.map((k) => <button key={k} type="button" onClick={() => setVue(k)} className={`px-3 py-2 rounded-md text-[13px] border ${k === vue ? "border-[var(--border-2)] bg-[var(--bg-elev-2)] text-label" : "border-transparent text-muted"}`}>{NOM[k]}</button>)}</div>
      <ul className="grid gap-2">{apercu[vue].map((c) => <li key={c.ancre} className="text-[14px] text-muted">{c.sujet} : {c.enonce}</li>)}</ul>
    </div>
  );
}
