"use client";
// FUT-50 · DIRECTION B · « UNE DÉCISION ÉCLAIRÉE PAR LES PREUVES ». DEV UNIQUEMENT.
//
// Thèse : futur•e commence au moment où l'on s'engage pour un lieu, et par ce qui manque à ce moment-là.
// Le premier écran pose la situation (une adresse, une décision) et montre ce que l'on sait d'une commune
// réelle AVANT de connaître votre projet : des faits sourcés, datés, au bon grain. Le deuxième écran est un
// relevé paragraphé, citable : le fait, ce que futur•e en dit sans vous, puis, sur demande, ce que votre
// projet en fait. Le spectaculaire est la bascule de lecture, jamais une animation.
//
// Toutes les phrases du dossier viennent de `cas-sete.ts` (moteur réel, relevé daté, vérifié).
import { useState } from "react";
import Link from "next/link";
import { releve as r, Surtitre, Plaque, Marge, RegleDuTemps, GlypheGrain, TEINTE_REGISTRE } from "@/components/releve/primitives";
import { CAS_SETE, NUITS_SETE_JALONS } from "./cas-sete";
import { fr, Portes, VoieComparer, Chaine, ProvenanceSete, DescenteEchelles, PORTE_OU_VIVRE, PORTE_ADRESSE, teinte } from "./commun";
import f from "./fut50.module.css";

const F = CAS_SETE.faits;

// ── 1. Ce que l'on sait d'un lieu, sans connaître votre projet ─────────────────────────────────

function ReleveNeutre() {
  const lignes = [
    { texte: F.nuits.constat, preuve: `${F.nuits.preuve.valeur} · DRIAS` },
    { texte: F.feu.constat, preuve: "Géorisques" },
    { texte: F.voiture.constat, preuve: "INSEE, trajets domicile-travail" },
  ];
  return (
    <aside className={f.fiche} aria-label="Exemple réel : ce que l'on sait de Sète avant de connaître votre projet">
      <div className={f.ficheEntete}>
        <span className={r.etiquette}>Sète · Hérault · ce que l&apos;on sait avant votre projet</span>
        <span className={f.mention}>exemple réel</span>
      </div>
      <ul className={f.questions} style={{ borderTop: 0 }}>
        {lignes.map((l) => (
          <li key={l.preuve} className={f.question} style={{ gridTemplateColumns: "auto minmax(0, 1fr)", fontSize: 15, lineHeight: 1.5, color: "var(--r-texte)", alignItems: "start" }}>
            <span aria-hidden style={{ color: "var(--r-encre)", paddingTop: 3 }}><GlypheGrain grain="commune" taille={12} /></span>
            <span style={{ display: "grid", gap: 4 }}>
              <span>{fr(l.texte)}</span>
              <span className={f.poids}>commune · {l.preuve}</span>
            </span>
          </li>
        ))}
      </ul>
      <p className={r.nuance}>
        Trois faits vrais, et aucun ne dit encore si Sète vous convient. C&apos;est votre projet qui leur donne un poids.
      </p>
    </aside>
  );
}

// ── 2. Le relevé paragraphé ───────────────────────────────────────────────────────────────────

function Paragraphe({ numero, titre, marge, children, className }: { numero: string; titre: string; marge?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <li className={`${f.paragraphe} ${className ?? ""}`} id={`releve-${numero.replace(".", "-")}`}>
      <span className={f.paragrapheNumero}>{numero}</span>
      <div className={f.paragrapheCorps}>
        <h3 className={f.paragrapheTitre}>{titre}</h3>
        {children}
      </div>
      {marge ?? <div aria-hidden />}
    </li>
  );
}

function Releve() {
  const [lu, setLu] = useState(false);
  const lecture = CAS_SETE.lectures.merConfirmee;
  return (
    <section className={f.demo} aria-labelledby="releve-titre">
      <div className={f.demoEntete}>
        <Surtitre>Exemple réel · {CAS_SETE.commune}</Surtitre>
        <h2 id="releve-titre" className={r.titre}>Un fait, ce qu&apos;il établit, et ce que votre projet en fait.</h2>
        <p className={r.chapo}>
          Une ligne du dossier de Sète, dépliée. Chaque paragraphe dit d&apos;où vient l&apos;information et jusqu&apos;où elle porte.
        </p>
      </div>

      <ol className={f.paragraphes}>
        <Paragraphe
          numero="1.1"
          titre="Le fait"
          marge={<Marge elements={[
            { type: "grain", grain: "commune", libelle: "à l'échelle de la commune" },
            { type: "valeur", libelle: F.nuits.preuve.libelle, valeur: F.nuits.preuve.valeur },
            { type: "source", texte: "DRIAS · Météo-France, projections aux paliers de réchauffement" },
          ]} />}
        >
          <p className={r.corps}>{fr(F.nuits.constat)}</p>
          <RegleDuTemps
            etiquette="Nuits tropicales par an à Sète : référence 1976-2005 et trois horizons"
            jalons={NUITS_SETE_JALONS.map((j) => ({ ...j }))}
            hauteurValeurs={{ min: 30, max: 105, valeurs: Object.fromEntries(NUITS_SETE_JALONS.map((j) => [j.annee, Number(j.valeur)])) }}
          />
          <p className={r.nuance}>Nuits tropicales par an. Sous chaque horizon, le réchauffement correspondant en France. Chaque horizon est un palier projeté : rien n&apos;est tracé entre eux.</p>
        </Paragraphe>

        <Paragraphe numero="1.2" titre="Ce que futur•e en dit sans connaître votre projet">
          <p className={r.corps} style={teinte(TEINTE_REGISTRE.verifications!)}>
            <span className={f.verdictLabel} style={{ fontSize: 13.5 }}>{CAS_SETE.sections.verifications}</span>
          </p>
          <p className={r.corps}>{fr(F.nuits.conventionHorsPriorite)}</p>
          <p className={r.nuance}>Sans projet, un fait important du lieu reste signalé. Il ne devient ni une bonne ni une mauvaise nouvelle.</p>
        </Paragraphe>

        <Paragraphe numero="1.3" titre="Ce que votre projet en fait" className={lu ? f.revele : undefined}>
          {!lu ? (
            <>
              <p className={r.corps}>
                Prenez un projet : «&nbsp;{CAS_SETE.projet.phrase}&nbsp;» Faites de la proximité de la mer une condition
                sans compromis. Le même fait change de place.
              </p>
              <button type="button" className={f.boutonLire} onClick={() => setLu(true)} aria-controls="lecture-projet">
                Lire ces faits avec ce projet <span aria-hidden>→</span>
              </button>
            </>
          ) : (
            <div id="lecture-projet" className={f.apparition} style={{ display: "grid", gap: 18 }}>
              <p className={r.nuance}>Projet d&apos;exemple : «&nbsp;{CAS_SETE.projet.phrase}&nbsp;» La mer y est une condition sans compromis.</p>
              <Plaque etiquette="La lecture de Sète pour ce projet">
                <div aria-live="polite" style={{ display: "grid", gap: 12 }}>
                  <span className={f.verdictLabel} style={teinte(TEINTE_REGISTRE.condition_check!)}>{lecture.verdict}</span>
                  <p className={f.verdictTitre}>{fr(lecture.titre)}</p>
                  <p className={r.corps}>{fr(lecture.detail)}</p>
                </div>
              </Plaque>
              <Chaine maillons={[
                { role: CAS_SETE.sections.mismatches, texte: <><strong style={{ color: "var(--r-encre)" }}>{F.nuits.titreSiPriorite}.</strong> Le fait 1.1 ne change pas : il répond désormais à une priorité déclarée, et c&apos;est un écart à arbitrer.</> },
                { role: CAS_SETE.sections.alignments, texte: F.voiture.constat },
                { role: CAS_SETE.sections.conditions, texte: <>{F.mer.constat} {F.mer.pourquoi} {F.mer.consequence}</> },
                { role: "Sans constat affiché", texte: `${F.taille.description}` },
              ]} />
              <button type="button" className={f.boutonLire} style={{ borderColor: "var(--r-filet-fort)" }} onClick={() => setLu(false)}>
                Revenir à la lecture sans projet
              </button>
            </div>
          )}
        </Paragraphe>

        <Paragraphe numero="1.4" titre="Ce que la commune ne peut pas dire">
          <p className={r.corps}>{fr(F.nuits.limite)}</p>
          <p className={r.corps}>
            <Link href="/dossier" style={{ color: "var(--r-encre)", textDecoration: "underline", textUnderlineOffset: 4 }}>{F.nuits.geste}</Link>
            <span aria-hidden> →</span>
          </p>
        </Paragraphe>
      </ol>
      <ProvenanceSete />
    </section>
  );
}

// ── La page ───────────────────────────────────────────────────────────────────────────────────

export function AccueilPreuves() {
  return (
    <div className={r.feuille}>
      <section className={f.ecran} aria-labelledby="promesse-b">
        <div style={{ display: "grid", gap: 24, alignContent: "center" }}>
          <Surtitre>Avant de vous engager pour un lieu</Surtitre>
          <h1 id="promesse-b" className={f.promesse}>Votre futur lieu de vie ne tient pas dans une annonce.</h1>
          <p className={f.sousPromesse}>
            {fr("Une adresse se lit à trois échelles : la commune, ce qui l'entoure, le logement. futur•e en rassemble les faits publics, datés et sourcés, puis les lit avec votre projet.")}
          </p>
          <div style={{ display: "grid", gap: 10 }}>
            <Portes
              etiquette="Deux manières de commencer"
              portes={[{ ...PORTE_ADRESSE, marque: true }, { ...PORTE_OU_VIVRE, situation: "Je cherche encore où vivre" }]}
            />
            <VoieComparer />
          </div>
        </div>
        <ReleveNeutre />
      </section>

      <Releve />

      <DescenteEchelles
        numerote
        titre="Le sommaire d'un dossier d'adresse."
        intro={<>Trois lectures d&apos;un même lieu, du plus large au plus précis, puis la décision qui les relie à votre projet. Chacune peut nuancer la précédente.</>}
      />

      <section className={f.fin} aria-labelledby="fin-b">
        <h2 id="fin-b" className={r.titre}>Commencez par votre situation.</h2>
        <Portes etiquette="Commencer" portes={[{ ...PORTE_ADRESSE, marque: true }, { ...PORTE_OU_VIVRE, situation: "Je cherche encore où vivre" }]} />
      </section>
    </div>
  );
}
