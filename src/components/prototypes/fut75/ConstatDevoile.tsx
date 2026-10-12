"use client";

// FUT-75 (2e itération) · C1 · LE DÉVOILEMENT ÉDITORIAL. DEV UNIQUEMENT.
//
// La conclusion du dossier est en tête, lisible dès l'arrivée. En dessous, une SCÈNE de quatre temps
// que le lecteur parcourt à son rythme, dans un même espace (pas de longue page) :
//   01 ce que vous recherchez        la priorité déclarée, en grand, avec son poids ;
//   02 ce que la donnée établit      les deux mesures, très grandes, face à 1976-2005 ;
//   03 ce que futur•e en conclut     la phrase du verdict, et ce qui la fonde ;
//   04 ce qui reste à vérifier       le geste au bâtiment, et la limite de la donnée.
//
// LES FORMES CHANGENT DE FONCTION. La priorité de la scène 1 et les chiffres de la scène 2 ne
// disparaissent pas : ils se transforment, par l'API View Transitions, en étiquettes « parce que »
// sous la conclusion de la scène 3. On voit d'où vient la phrase, sans qu'elle soit « calculée » : elle
// est déjà écrite en tête de section depuis le début.
import { useRef, useState, type KeyboardEvent } from "react";
import type { DonneesChemin } from "./CheminDeLaDecision";
import type { ModeMouvement } from "./motion";
import { avecContinuite } from "./vues";
import m from "./motion.module.css";

const SCENES = [
  { cle: "recherche", titre: "Ce que vous recherchez" },
  { cle: "donnee", titre: "Ce que la donnée établit" },
  { cle: "conclusion", titre: "Ce que futur•e en conclut" },
  { cle: "verification", titre: "Ce qui reste à vérifier" },
] as const;
const r = (v: number) => Math.round(v);

export function ConstatDevoile({ donnees: d, mode, initial = 0 }: { donnees: DonneesChemin; mode: ModeMouvement; initial?: number }) {
  const [i, setI] = useState(initial);
  const titre = useRef<HTMLParagraphElement>(null);
  const aller = (n: number) => {
    const k = Math.max(0, Math.min(SCENES.length - 1, n));
    if (k === i) return;
    avecContinuite(mode, () => setI(k), "c1");
    requestAnimationFrame(() => titre.current?.focus({ preventScroll: true }));
  };
  const clavier = (e: KeyboardEvent) => {
    if (e.key === "ArrowRight") { e.preventDefault(); aller(i + 1); }
    if (e.key === "ArrowLeft") { e.preventDefault(); aller(i - 1); }
  };
  const [jours, nuits] = d.convention.mesures;
  const priorite = (taille: "grand" | "etiquette") => (
    <span className={taille === "grand" ? m.prioriteGrande : m.etiquetteFondement} data-vt-nom="fut75-priorite">
      {taille === "grand" ? <>{`«\u202f${d.projet.libelle.charAt(0).toUpperCase() + d.projet.libelle.slice(1)}\u202f»`.replace(/ (\S+\u202f»)$/, "\u00a0$1")}</> : <>{d.projet.libelle} · priorité {d.projet.poids}/{d.projet.poidsMax}</>}
    </span>
  );
  const chiffre = (ms: typeof jours, taille: "grand" | "etiquette", nom: string) => ms ? (
    taille === "grand" ? (
      <span className={m.chiffreScene} data-vt-nom={nom}>
        <span className={m.chiffreSceneValeur}>{r(ms.valeur)}</span>
        <span className={m.chiffreSceneUnite}>{ms.unite}</span>
        {ms.reference != null ? <span className={m.chiffreSceneRef}>contre {r(ms.reference)} sur 1976-2005</span> : null}
      </span>
    ) : (
      <span className={m.etiquetteFondement} data-vt-nom={nom}>
        <strong className={m.chaleur}>{r(ms.valeur)}</strong> {ms.unite.replace(" par an", "")} · seuil {ms.seuil}
      </span>
    )
  ) : null;

  return (
    <div className={m.devoile} onKeyDown={clavier}>
      {/* LA CONCLUSION D'ABORD, en clair, avant toute exploration. */}
      <div className={m.devoileTete}>
        <p className={m.devoileSurtitre}><span className={m.trait} style={{ background: "var(--reg-ecart)" }} />{d.verdict.etiquette} · {d.constat.sujet}</p>
        <p className={m.devoileVerdict}>{d.verdict.titre}</p>
      </div>

      <div className={m.scene75} data-vt-nom="fut75-scene" aria-roledescription="séquence" aria-label="Comprendre ce constat">
        <nav className={m.progression} aria-label="Étapes du constat">
          {SCENES.map((s, k) => (
            <button key={s.cle} type="button" className={m.progressionPas} aria-current={k === i ? "step" : undefined} data-fait={k < i || undefined} onClick={() => aller(k)}>
              <span className={m.progressionBarre} />
              <span className={m.progressionTexte}><span className={m.etapeNumero}>{String(k + 1).padStart(2, "0")}</span> {s.titre}</span>
            </button>
          ))}
        </nav>

        <div className={m.sceneCorps}>
          <p ref={titre} tabIndex={-1} className={m.sceneTitre} aria-live="polite">{String(i + 1).padStart(2, "0")} · {SCENES[i]!.titre}</p>

          {i === 0 ? (
            <div className={m.sceneContenu}>
              {priorite("grand")}
              <p className={m.scenePoids}>
                <span aria-hidden className={m.poids}>{Array.from({ length: d.projet.poidsMax }, (_, k) => <i key={k} data-plein={k < d.projet.poids || undefined} />)}</span>
                Priorité forte dans votre projet : {d.projet.poids} sur {d.projet.poidsMax}.
              </p>
            </div>
          ) : null}

          {i === 1 ? (
            <div className={m.sceneContenu}>
              <div className={m.chiffresScene}>
                {chiffre(jours, "grand", "fut75-jours")}
                {chiffre(nuits, "grand", "fut75-nuits")}
              </div>
              <p className={m.sceneNote}>
                ○ À l&apos;échelle de la commune, horizon {d.convention.horizon} (+2,7 °C en France). {d.fait.preuves.map((p, k) => (
                  <span key={k}>{k > 0 ? " · " : ""}{p.href ? <a href={p.href}>{p.libelle}{p.valeur ? ` : ${p.valeur}` : ""}</a> : p.libelle}</span>
                ))}
              </p>
            </div>
          ) : null}

          {i === 2 ? (
            <div className={m.sceneContenu}>
              <p className={m.sceneVerdict}><span className={m.traitVertical} style={{ background: "var(--reg-ecart)" }} />{d.verdict.titre}</p>
              <div className={m.parceQue}>
                <span className={m.parceQueMot}>parce que</span>
                {priorite("etiquette")}
                {chiffre(jours, "etiquette", "fut75-jours")}
                {chiffre(nuits, "etiquette", "fut75-nuits")}
              </div>
              <p className={m.sceneNote}>Le seuil de signalement est une convention de futur•e, pas une limite officielle de danger.</p>
            </div>
          ) : null}

          {i === 3 ? (
            <div className={m.sceneContenu}>
              <p className={m.sceneGeste}><span aria-hidden className={m.losangeGeste} />{d.geste.libelle}</p>
              {d.geste.aVerifier.map((l, k) => <p key={k} className={m.sceneTexte}>{l}</p>)}
              <p className={m.sceneLimite}>{d.limite}</p>
            </div>
          ) : null}
        </div>

        <div className={m.sceneCommandes}>
          <button type="button" className={m.boutonScene} onClick={() => aller(i - 1)} disabled={i === 0}>Précédent</button>
          <button type="button" className={`${m.boutonScene} ${m.boutonScenePrincipal}`} onClick={() => aller(i === SCENES.length - 1 ? 0 : i + 1)}>
            {i === SCENES.length - 1 ? "Revoir depuis le début" : "Suivant"}
          </button>
          <span className={m.etapeNumero}>flèches ← →</span>
        </div>
      </div>
    </div>
  );
}
