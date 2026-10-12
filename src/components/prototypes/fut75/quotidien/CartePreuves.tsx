"use client";

// FUT-75 (2e itération) · Q4 · UNE CARTE QUI DÉPLOIE SES PREUVES. DEV UNIQUEMENT.
//
// En production, « Données et limites » est un `<details>` natif : il s'ouvre d'un coup, et le texte
// qui suit saute de toute la hauteur révélée. Ici, la carte S'AGRANDIT : la zone passe de zéro à sa
// hauteur naturelle (`grid-template-rows: 0fr → 1fr`, sans mesure ni script), le contenu monte de 6 px
// en apparaissant, et le titre de la carte ne bouge pas : on garde sa ligne de lecture. Le bouton dit
// ce qu'il ouvre et combien (« 2 preuves »), son signe tourne d'un quart de tour.
import { useId, useState } from "react";
import type { DonneesChemin } from "../CheminDeLaDecision";
import m from "../motion.module.css";

export function CartePreuvesNouveau({ donnees: d }: { donnees: DonneesChemin }) {
  const [ouvert, setOuvert] = useState(false);
  const id = useId();
  const n = d.fait.preuves.length;
  return (
    <article className={m.cartePreuves} data-ouvert={ouvert}>
      <p className={m.devoileSurtitre}><span className={m.trait} style={{ background: "var(--reg-ecart)" }} />{d.constat.sujet}</p>
      <p className={m.cartePreuvesEnonce}>{d.fait.enonce}</p>
      <p className={m.sceneGeste} style={{ fontSize: 16 }}><span aria-hidden className={m.losangeGeste} />{d.geste.libelle}</p>
      <button type="button" className={m.deploiement} aria-expanded={ouvert} aria-controls={id} onClick={() => setOuvert((o) => !o)}>
        <span aria-hidden className={m.deploiementSigne}>+</span>
        {ouvert ? "Replier" : "Données, limites et"} {n} preuve{n > 1 ? "s" : ""}
      </button>
      <div id={id} className={m.zoneDeployee} data-ouvert={ouvert} inert={!ouvert || undefined}>
        <div className={m.zoneDeployeeInterieur}>
          <div className={m.zoneDeployeeContenu}>
            <ul className={m.listePreuves}>
              {d.fait.preuves.map((p, k) => (
                <li key={k}><span className={m.coucheNom}>○ à l&apos;échelle de la commune</span>
                  {p.href ? <a href={p.href}>{p.libelle}{p.valeur ? ` : ${p.valeur}` : ""}</a> : p.libelle}{p.date ? <span className={m.coucheNom}> · {p.date}</span> : null}
                </li>
              ))}
            </ul>
            {d.geste.aVerifier.length ? <div><p className={m.coucheNom}>À vérifier</p>{d.geste.aVerifier.map((l, k) => <p key={k} className={m.coucheTexte}>{l}</p>)}</div> : null}
            {d.convention.methode.length ? <div><p className={m.coucheNom}>Méthode du signal</p>{d.convention.methode.map((l, k) => <p key={k} className={m.coucheTexte}>{l}</p>)}</div> : null}
            <p className={m.sceneLimite}>{d.limite}</p>
          </div>
        </div>
      </div>
      <p className={m.suiteCarte}>La carte suivante du dossier commence ici : elle glisse avec la carte, elle ne saute pas.</p>
    </article>
  );
}

export function CartePreuvesAncien({ donnees: d }: { donnees: DonneesChemin }) {
  return (
    <article className="grid gap-3">
      <p className="text-[13px] text-muted">{d.constat.sujet}</p>
      <p className="text-[15px] leading-[1.6] text-label">{d.fait.enonce}</p>
      <details>
        <summary className="cursor-pointer text-[13px] text-muted">Données et limites</summary>
        <div className="grid gap-2 mt-2">
          {d.fait.preuves.map((p, k) => <p key={k} className="text-[13px] text-muted">{p.libelle}{p.valeur ? ` : ${p.valeur}` : ""}</p>)}
          {d.geste.aVerifier.map((l, k) => <p key={k} className="text-[13px] text-muted">{l}</p>)}
          <p className="text-[13px] text-muted">{d.limite}</p>
        </div>
      </details>
      <p className="text-[13px] text-ghost">La carte suivante du dossier commence ici.</p>
    </article>
  );
}
