"use client";

// FUT-75 (2e itération) · C2 · LA RÉVÉLATION DANS LA CARTE. DEV UNIQUEMENT.
//
// Une seule carte, deux compositions, et les deux sont belles sans mouvement :
//   repliée   la conclusion seule, en clair, avec son registre et son geste ;
//   dépliée   la conclusion, plus grande, au-dessus de ses quatre fondements posés en strates :
//             votre priorité, la donnée, la convention, la limite.
// Le passage de l'une à l'autre est une transformation (View Transitions : la conclusion change de
// place et de corps), puis les couches arrivent une à une (140 ms d'écart, 900 ms au plus en tout).
// À chaque couche, la conclusion gagne en présence : son trait de registre s'allonge et sa teinte
// passe à l'encre. Elle était lisible avant ; elle est désormais FONDÉE, pas « calculée ».
import { useEffect, useRef, useState } from "react";
import type { DonneesChemin } from "./CheminDeLaDecision";
import type { ModeMouvement } from "./motion";
import { avecContinuite } from "./vues";
import m from "./motion.module.css";

const r = (v: number) => Math.round(v);
const ECART_COUCHES = 140;

export function ConstatCouches({ donnees: d, mode, initial = false }: { donnees: DonneesChemin; mode: ModeMouvement; initial?: boolean }) {
  const [deplie, setDeplie] = useState(initial);
  const [couches, setCouches] = useState(initial ? 4 : 0);
  const minuteries = useRef<number[]>([]);
  useEffect(() => () => minuteries.current.forEach((t) => window.clearTimeout(t)), []);

  const basculer = () => {
    minuteries.current.forEach((t) => window.clearTimeout(t));
    minuteries.current = [];
    if (deplie) { avecContinuite(mode, () => { setDeplie(false); setCouches(0); }, "c2"); return; }
    if (mode !== "anime") { setDeplie(true); setCouches(4); return; }
    avecContinuite(mode, () => setDeplie(true), "c2");
    // Les couches suivent la transformation : une à une, sans jamais dépasser le plafond.
    for (let k = 1; k <= 4; k++) minuteries.current.push(window.setTimeout(() => setCouches(k), 240 + (k - 1) * ECART_COUCHES));
  };
  const [jours, nuits] = d.convention.mesures;
  const presence = deplie ? couches / 4 : 0;

  return (
    <article className={m.carteCouches} data-deplie={deplie}>
      <div className={m.carteConclusion} data-vt-nom="fut75-conclusion">
        <p className={m.devoileSurtitre}><span className={m.trait} style={{ background: "var(--reg-ecart)" }} />{d.constat.sujet}</p>
        <p className={m.carteVerdict} style={{ color: presence >= 1 || !deplie ? "var(--r-encre)" : "var(--r-texte)" }}>
          <span aria-hidden className={m.carteRegistre} style={{ transform: `scaleY(${deplie ? 0.35 + 0.65 * presence : 1})` }} />
          {d.verdict.titre}
        </p>
        <p className={m.sceneGeste}><span aria-hidden className={m.losangeGeste} />{d.geste.libelle}</p>
        <button type="button" className={m.boutonScene} aria-expanded={deplie} onClick={basculer}>
          {deplie ? "Replier les fondements" : "Voir ce qui fonde ce constat"}
        </button>
      </div>

      {deplie ? (
        <ol className={m.couches} aria-label="Ce qui fonde ce constat">
          <li className={m.couche} data-visible={couches >= 1}>
            <p className={m.coucheNom}>Votre priorité</p>
            <p className={m.couchePrincipal}>{d.projet.libelle.charAt(0).toUpperCase() + d.projet.libelle.slice(1)}
              <span aria-hidden className={m.poids}>{Array.from({ length: d.projet.poidsMax }, (_, k) => <i key={k} data-plein={k < d.projet.poids || undefined} />)}</span>
            </p>
          </li>
          <li className={m.couche} data-visible={couches >= 2}>
            <p className={m.coucheNom}>Ce que la donnée établit · horizon {d.convention.horizon}, commune</p>
            <div className={m.coucheChiffres}>
              {[jours, nuits].filter(Boolean).map((ms) => (
                <span key={ms!.cle} className={m.coucheChiffre}>
                  <strong className={m.chaleur}>{r(ms!.valeur)}</strong>
                  <span>{ms!.unite}{ms!.reference != null ? <>, contre {r(ms!.reference)} sur 1976-2005</> : null}</span>
                </span>
              ))}
            </div>
            <p className={m.coucheSource}>{d.fait.preuves.map((p, k) => <span key={k}>{k > 0 ? " · " : ""}{p.href ? <a href={p.href}>{p.libelle}{p.valeur ? ` : ${p.valeur}` : ""}</a> : p.libelle}</span>)}</p>
          </li>
          <li className={m.couche} data-visible={couches >= 3}>
            <p className={m.coucheNom}>La convention appliquée</p>
            {[jours, nuits].filter(Boolean).map((ms) => (
              <div key={ms!.cle} className={m.coucheSeuil}>
                <span className={m.coucheSeuilPiste}>
                  <span className={m.coucheSeuilValeur} style={{ width: `${Math.min(100, (ms!.valeur / Math.max(ms!.valeur, ms!.seuil) / 1.15) * 100)}%` }} />
                  <span className={m.coucheSeuilTrait} style={{ left: `${(ms!.seuil / Math.max(ms!.valeur, ms!.seuil) / 1.15) * 100}%` }} />
                </span>
                <span className={m.coucheSeuilTexte}>seuil {ms!.seuil} · {ms!.franchi ? "franchi" : "non franchi"}</span>
              </div>
            ))}
            <p className={m.coucheSource}>Une convention de signalement de futur•e, pas une limite officielle de danger.</p>
          </li>
          <li className={m.couche} data-visible={couches >= 4} data-limite>
            <p className={m.coucheNom}>Ce que la donnée ne dit pas</p>
            <p className={m.coucheTexte}>{d.limite}</p>
          </li>
        </ol>
      ) : null}
    </article>
  );
}
