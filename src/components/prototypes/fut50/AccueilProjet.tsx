"use client";
// FUT-50 · DIRECTION A · « LE PROJET D'ABORD ». DEV UNIQUEMENT.
//
// Thèse : futur•e commence par ce que la personne cherche. Le premier écran montre le Projet comme un
// objet (une phrase, et les questions qu'elle pose à chaque lieu), lisible sans attendre aucune animation.
// Le deuxième écran prouve que ce Projet change la lecture : deux interrupteurs, quatre lectures RÉELLES
// du moteur pour Sète (fixture `cas-sete.ts`, vérifiée par test et par rejeu). Le fait des nuits
// tropicales ne change jamais ; sa place dans la décision, si.
//
// Héritage : c'est la bascule de `HeroProjetTerritoires` (« , sans subir la canicule ») rendue vraie.
// L'animation actuelle inventait ses villes et cochait des critères ; ici, rien n'est calculé dans le
// navigateur, tout est relu.
import { useState, useSyncExternalStore } from "react";
import { flushSync } from "react-dom";
import { releve as r, Surtitre, Plaque, Marge, TEINTE_REGISTRE } from "@/components/releve/primitives";
import { CAS_SETE } from "./cas-sete";
import { fr, Portes, VoieComparer, Chaine, ProvenanceSete, DescenteEchelles, PORTE_OU_VIVRE, PORTE_ADRESSE, teinte } from "./commun";
import f from "./fut50.module.css";

// ── 1. La fiche du Projet ─────────────────────────────────────────────────────────────────────

type CleQuestion = "taille" | "mer" | "voiture" | "ete";

// La phrase d'exemple découpée : chaque fragment souligné devient une question posée à chaque lieu.
const SEGMENTS: { t: string; q?: CleQuestion }[] = [
  { t: "Une ville à taille humaine", q: "taille" }, { t: ", " },
  { t: "près de la mer", q: "mer" }, { t: ", où l'on peut " },
  { t: "vivre sans voiture", q: "voiture" }, { t: ", avec " },
  { t: "des étés supportables", q: "ete" }, { t: "." },
];

const QUESTIONS: { cle: CleQuestion; texte: string; poids: string }[] = [
  { cle: "mer", texte: "La mer est-elle proche ?", poids: "priorité forte" },
  { cle: "voiture", texte: "Peut-on y vivre sans voiture ?", poids: "priorité forte" },
  { cle: "ete", texte: "Les étés y resteront-ils supportables ?", poids: "priorité forte" },
  { cle: "taille", texte: "La ville est-elle à taille humaine ?", poids: "priorité moyenne" },
];

// Les quatre issues d'une question, avec les teintes des registres du dossier.
const ISSUES = [
  { texte: "correspond", teinte: TEINTE_REGISTRE.alignments },
  { texte: "correspond moins bien", teinte: TEINTE_REGISTRE.mismatches },
  { texte: "reste à vérifier", teinte: TEINTE_REGISTRE.verifications },
  { texte: "ne se tranche pas ici", teinte: TEINTE_REGISTRE.unknowns },
];

function FicheProjet() {
  const [active, setActive] = useState<CleQuestion | null>(null);
  return (
    <aside className={f.fiche} aria-label="Exemple : un projet devient des questions posées à chaque lieu">
      <div className={f.ficheEntete}>
        <span className={r.etiquette}>Un projet, tel qu&apos;on l&apos;écrit</span>
        <span className={f.mention}>exemple</span>
      </div>
      <p className={f.phrase}>
        «&nbsp;{SEGMENTS.map((s, i) => (s.q
          ? <span key={i} className={`${f.fragment} ${active === s.q ? f.fragmentActif : ""}`}>{fr(s.t)}</span>
          : <span key={i}>{fr(s.t)}</span>))}&nbsp;»
      </p>
      <div style={{ display: "grid", gap: 10 }}>
        <span className={r.etiquette}>devient quatre questions, posées à chaque lieu</span>
        <ul className={f.questions}>
          {QUESTIONS.map((q) => (
            <li
              key={q.cle}
              tabIndex={0}
              className={`${f.question} ${active === q.cle ? f.questionActive : ""}`}
              onMouseEnter={() => setActive(q.cle)}
              onMouseLeave={() => setActive(null)}
              onFocus={() => setActive(q.cle)}
              onBlur={() => setActive(null)}
            >
              <span aria-hidden style={{ color: "var(--r-discret)", fontFamily: "var(--font-mono)", fontSize: 13 }}>?</span>
              <span>{fr(q.texte)}</span>
              <span className={f.poids}>{q.poids}</span>
            </li>
          ))}
        </ul>
      </div>
      <div style={{ display: "grid", gap: 8 }}>
        <span className={r.etiquette}>Chaque question reçoit sa propre réponse</span>
        <ul className={f.issues}>
          {ISSUES.map((i) => <li key={i.texte} className={f.issue} style={teinte(i.teinte)}>{i.texte}</li>)}
        </ul>
      </div>
    </aside>
  );
}

// ── 2. La démonstration : quatre lectures réelles ────────────────────────────────────────────

type CleLecture = keyof typeof CAS_SETE.lectures;
const lectureDe = (ete: boolean, merCondition: boolean): CleLecture =>
  ete ? (merCondition ? "merConfirmee" : "avecChaleur") : (merCondition ? "merConfirmeeSansChaleur" : "sansChaleur");

const TEINTE_VERDICT: Record<string, string> = {
  "Arbitrage": TEINTE_REGISTRE.compromises!,
  "Condition ouverte": TEINTE_REGISTRE.condition_check!,
  "Correspondance favorable": TEINTE_REGISTRE.alignments!,
};

const reduit = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const pasDeServeur = () => () => {};

function Interrupteur({ actif, onBascule, libelle, etats }: { actif: boolean; onBascule: () => void; libelle: string; etats: [string, string] }) {
  return (
    <button type="button" role="switch" aria-checked={actif} className={f.interrupteur} onClick={onBascule}>
      <span className={f.piste} aria-hidden />
      <span className={f.interrupteurTexte}>
        {libelle}
        <span className={f.interrupteurEtat}>{actif ? etats[0] : etats[1]}</span>
      </span>
    </button>
  );
}

function Groupe({ titre, teinteGroupe, children }: { titre: string; teinteGroupe: string; children: React.ReactNode }) {
  return (
    <div className={f.groupeLecture}>
      <h3 className={f.groupeTitre} style={{ ...teinte(teinteGroupe), margin: 0 }}>{titre}</h3>
      {children}
    </div>
  );
}

const F = CAS_SETE.faits;
const margeNuits = (
  <Marge enLigne elements={[
    { type: "grain", grain: "commune", libelle: "à l'échelle de la commune" },
    { type: "valeur", libelle: F.nuits.preuve.libelle, valeur: F.nuits.preuve.valeur },
    { type: "source", texte: "DRIAS · Météo-France, palier +2,7 °C en France" },
  ]} />
);

function FaitNuits({ priorite }: { priorite: boolean }) {
  return (
    <div className={`${f.fait} ${f.faitMobile}`}>
      <Chaine maillons={[
          { role: "Fait établi", texte: F.nuits.constat },
          priorite
            ? { role: "Pour ce projet", texte: F.nuits.titreSiPriorite, fort: true }
            : { role: "Pour ce projet", texte: <>Hors de vos priorités. {F.nuits.conventionHorsPriorite}</> },
          { role: "Limite", texte: F.nuits.limite },
          { role: "À vérifier ensuite", texte: F.nuits.geste },
        ]} />
      <div className={f.preuveEnLigne}>{margeNuits}</div>
    </div>
  );
}

function Demonstration() {
  const [ete, setEte] = useState(true);
  const [mer, setMer] = useState(false);
  const estClient = useSyncExternalStore(pasDeServeur, () => true, () => false);
  const cle = lectureDe(ete, mer);
  const lecture = CAS_SETE.lectures[cle];

  // Le fait des nuits change de SECTION sans disparaître : une transition de vue là où elle existe.
  const basculer = (maj: () => void) => {
    const doc = document as Document & { startViewTransition?: (cb: () => void) => unknown };
    if (doc.startViewTransition && !reduit()) doc.startViewTransition(() => flushSync(maj));
    else maj();
  };

  return (
    <section className={f.demo} aria-labelledby="demo-titre">
      <div className={f.demoEntete}>
        <Surtitre>Exemple réel · {CAS_SETE.commune}</Surtitre>
        <h2 id="demo-titre" className={r.titre}>Changez une priorité : les faits restent les mêmes, leur poids dans votre décision change.</h2>
        <p className={r.chapo}>
          Voici ce que futur•e lit pour Sète, dans l&apos;Hérault, avec le projet ci-dessus. Chaque réglage affiche la
          lecture que le moteur produit réellement, relevée le {CAS_SETE.releveLe}.
        </p>
      </div>

      <div className={f.demoGrille}>
        <div className={f.reglages}>
          <span className={r.etiquette}>Votre projet</span>
          <Interrupteur
            actif={ete}
            onBascule={() => basculer(() => setEte((v) => !v))}
            libelle="Des étés supportables font partie de mes priorités"
            etats={["dans le projet", "retiré du projet"]}
          />
          <Interrupteur
            actif={mer}
            onBascule={() => basculer(() => setMer((v) => !v))}
            libelle="La proximité de la mer est une condition sans compromis"
            etats={["condition sans compromis", "simple priorité"]}
          />
          <p className={r.nuance} style={{ marginTop: 6 }}>
            À observer : le constat sur les nuits tropicales est identique dans les quatre lectures. Selon votre
            projet, il devient un écart à arbitrer ou un point à contrôler.
          </p>
          {!estClient ? <p className={r.nuance}>Les réglages demandent JavaScript ; la lecture affichée est celle du projet complet.</p> : null}
        </div>

        <div>
          <Plaque etiquette="La lecture de Sète pour ce projet">
            <div aria-live="polite" style={{ display: "grid", gap: 14 }}>
              <span className={f.verdictLabel} style={teinte(TEINTE_VERDICT[lecture.verdict] ?? "var(--r-encre)")}>{lecture.verdict}</span>
              <p className={f.verdictTitre}>{fr(lecture.titre)}</p>
              <p className={r.corps}>{fr(lecture.detail)}</p>
            </div>
          </Plaque>

          {mer ? (
            <Groupe titre={CAS_SETE.sections.conditions} teinteGroupe={TEINTE_REGISTRE.condition_check!}>
              <div className={f.fait}>
                <Chaine maillons={[
                    { role: "Statut", texte: F.mer.statut, fort: true },
                    { role: "Fait établi", texte: F.mer.constat },
                    { role: "Pourquoi rien n'est tranché", texte: F.mer.pourquoi },
                    { role: "Conséquence", texte: F.mer.consequence },
                  ]} />
                <div className={f.preuveEnLigne}><Marge enLigne elements={[
                  { type: "grain", grain: "commune", libelle: "point de référence de la commune" },
                  { type: "valeur", libelle: F.mer.preuve.libelle, valeur: F.mer.preuve.valeur },
                ]} /></div>
              </div>
            </Groupe>
          ) : null}

          <Groupe titre={CAS_SETE.sections.alignments} teinteGroupe={TEINTE_REGISTRE.alignments!}>
            <div className={f.fait}>
              <Chaine maillons={[{ role: "Fait établi", texte: F.voiture.constat }]} />
                <div className={f.preuveEnLigne}><Marge enLigne elements={[
                { type: "grain", grain: "commune", libelle: "à l'échelle de la commune" },
                { type: "source", texte: F.voiture.preuve.source },
              ]} /></div>
            </div>
          </Groupe>

          {ete ? (
            <Groupe titre={CAS_SETE.sections.mismatches} teinteGroupe={TEINTE_REGISTRE.mismatches!}>
              <FaitNuits priorite />
            </Groupe>
          ) : null}

          <Groupe titre={CAS_SETE.sections.verifications} teinteGroupe={TEINTE_REGISTRE.verifications!}>
            {!ete ? <FaitNuits priorite={false} /> : null}
            <div className={f.fait}>
              <Chaine maillons={[
                  { role: "Fait établi", texte: F.feu.constat },
                  { role: "Limite", texte: F.feu.limite },
                  { role: "À vérifier ensuite", texte: F.feu.geste },
                ]} />
                <div className={f.preuveEnLigne}><Marge enLigne elements={[
                { type: "grain", grain: "commune", libelle: "à l'échelle de la commune" },
                { type: "valeur", libelle: F.feu.preuve.libelle, valeur: F.feu.preuve.valeur },
              ]} /></div>
            </div>
          </Groupe>

          <Groupe titre="Examinées, sans constat affiché" teinteGroupe={TEINTE_REGISTRE.unknowns!}>
            <div className={f.fait}>
              <Chaine maillons={[
                ...(mer ? [] : [{ role: "La mer", texte: "Examinée comme simple priorité : le dossier n'en fait pas une carte. Faites-en une condition pour lire la distance mesurée et ce qu'elle ne dit pas." }]),
                { role: "Taille de la ville", texte: `${F.taille.description} Sète compte ${F.taille.population.toLocaleString("fr-FR")} habitants.` },
              ]} />
              <p className={r.nuance} style={{ marginTop: 10 }}>Description de l&apos;accueil : le dossier, lui, n&apos;affiche rien pour ces priorités.</p>
            </div>
          </Groupe>

          <ProvenanceSete />
        </div>
      </div>
    </section>
  );
}

// ── La page ───────────────────────────────────────────────────────────────────────────────────

export function AccueilProjet() {
  return (
    <div className={r.feuille}>
      <section className={f.ecran} aria-labelledby="promesse-a">
        <div style={{ display: "grid", gap: 24, alignContent: "center" }}>
          <h1 id="promesse-a" className={f.promesse}>Choisissez où vivre à partir de ce qui compte pour vous.</h1>
          <p className={f.sousPromesse}>
            Décrivez votre projet. futur•e le confronte aux données publiques de chaque lieu, de la commune jusqu&apos;au
            logement, et vous montre ce qui correspond, ce qui correspond moins bien et ce qui reste à vérifier.
          </p>
          <div style={{ display: "grid", gap: 10 }}>
            <Portes
              etiquette="Deux manières de commencer"
              portes={[{ ...PORTE_OU_VIVRE, marque: true }, PORTE_ADRESSE]}
            />
            <VoieComparer />
          </div>
        </div>
        <FicheProjet />
      </section>

      <Demonstration />

      <DescenteEchelles
        titre="Puis la lecture descend jusqu'au logement."
        intro={<>Une commune ne dit pas tout d&apos;une adresse. La limite du constat sur Sète le dit elle-même : lu à la commune, il ne dit rien d&apos;un logement. Chaque échelle répond à une autre question du même projet, et peut nuancer la précédente.</>}
      />

      <section className={f.fin} aria-labelledby="fin-a">
        <h2 id="fin-a" className={r.titre}>Commencez par votre situation.</h2>
        <Portes etiquette="Commencer" portes={[{ ...PORTE_OU_VIVRE, marque: true }, PORTE_ADRESSE]} />
      </section>
    </div>
  );
}
