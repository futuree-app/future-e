// FUT-91 · LE VRAI HUB « MA DÉCISION » DANS LA DIRECTION « LE RELEVÉ ».
//
// Rendu par `DossierDecisionSection` quand la présentation `releve` est active (drapeau serveur
// `DECISION_RELEVE=true`, ou prop explicite). MÊMES PROPS, MÊMES ÉTATS, MÊME CONCLUSION que la
// présentation classique : seule la composition change. La matrice de parité vit dans
// `docs/audits/2026-10-11-fut91-decision-releve.md`.
//
// CE QUI N'EST PAS RECALCULÉ ICI. Le verdict, la minute, l'ordre des sections, les gestes prioritaires,
// la condition portée par le bloc : tout vient du moteur (`narrativePlan`, `sectionsDeLaMinute`,
// `conditionPorteeParLeBloc`, `ancresRendues`), exactement comme dans la présentation classique.
// La lecture enrichie passe par le même `ConclusionRedigee` (gating, cache, génération, validation),
// sous le même `Suspense`, avec le même repli déterministe ; seule sa présentation change.
//
// PRÉVU POUR LE MOUVEMENT (FUT-75), SANS EN AJOUTER. Chaque mouvement est un `section` stable avec un
// identifiant ; l'emblème, la plaque et les cartes sont des nœuds distincts ; rien n'est animé ici.
import Link from "next/link";
import { Suspense, type CSSProperties, type ReactNode } from "react";
import type { Dossier } from "@/lib/decision/decision-fact";
import { ConclusionBlock, planToBlocks, type NiveauTitre } from "@/components/report/ConclusionBlock";
import { ConclusionRedigee } from "@/components/report/ConclusionRedigee";
import { AnalyseAncienProjet } from "@/components/report/AnalyseAncienProjet";
import { conditionPorteeParLeBloc, ancresRendues, controlesParEchelle } from "@/lib/decision/dossier-view";
import { dateFr } from "@/lib/decision/autour-permis";
import { bindOrphans } from "@/lib/typography";
import { lireDossier, lireCarteDuDossier, lectureDesEchelles, texteEtatEchelle, type SectionLue } from "./lecture-dossier";
import { EntreeReleve, teinteSection, teinteEntree } from "./EntreeReleve";
import {
  releve as s, Surtitre, Registre, Plaque, Grain, EmblemeEchelles, type EtatTrace, type GrainCle,
} from "./primitives";

export type DossierDecisionReleveProps = {
  dossier: Dossier;
  generatedAt?: string | null;
  logement?: { href: string; label: string } | null;
  logementStatus?: "none" | "pending" | "done" | "unavailable";
  insee: string;
  scopeKey: string;
  provenance?: string;
  projetAChange?: boolean;
  voisinageAChange?: boolean;
  espacement?: string;
  titre?: NiveauTitre;
  supportingPane?: ReactNode;
};

/** Le sommaire : des comptes de cartes de la minute, pas une note. Aucune somme, barre ni pourcentage (ADR-0001). */
function Sommaire({ sections }: { sections: SectionLue[] }) {
  if (sections.length === 0) return null;
  return (
    <nav aria-label="Sommaire du dossier" className={s.sommaireJetons}>
      {sections.map((x) => (
        <a key={x.cle} href={`#section-${x.cle}`} className={s.sommaireJeton}>
          <span aria-hidden className={s.sommaireTrait} style={{ background: teinteSection(x) }} />
          <span>{x.titre}</span>
          <span className={s.mono} style={{ color: "var(--r-meta)" }}>{x.entrees.length}</span>
        </a>
      ))}
    </nav>
  );
}

const GLYPHE: Record<string, GrainCle> = { territoire: "commune", quartier: "secteur", logement: "batiment" };

type ConditionOuverte = { cle: string; libelle: string; cause: "a_confirmer" | "ne_pas_mesurer" | "donnee_absente" };

/** FUT-7 : les conditions sans carte, avec les phrases de `ConditionsSansCarte`, mot pour mot. */
function ConditionsOuvertes({ conditions }: { conditions: ConditionOuverte[] }) {
  return (
    <ul className={s.liste}>
      {conditions.map((c) => (
        <li key={c.cle}>
          <div className={s.pileSerree}>
            <Registre teinte="var(--reg-non-su)" as="h3">{c.libelle.charAt(0).toUpperCase() + c.libelle.slice(1)}</Registre>
            <p className={s.etiquette}>{c.cause === "ne_pas_mesurer" ? "Non évaluée" : "Condition ouverte"}</p>
            <p className={s.corps}>
              {c.cause === "ne_pas_mesurer"
                ? `futur•e ne sait pas encore évaluer de façon suffisamment fiable ${c.libelle}.`
                : `La donnée qui permettrait d'évaluer ${c.libelle} manque pour cette commune.`}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}

/** Une section de la minute : son titre teinté, ses cartes, et les conditions ouvertes sous les conditions. */
function SectionReleve({ section, provenance, conditions }: { section: SectionLue; provenance?: string; conditions: ConditionOuverte[] }) {
  return (
    <section className={s.mouvement} aria-labelledby={`section-${section.cle}`} id={`mouvement-${section.cle}`}>
      <div className={s.enTeteMouvement}>
        <p className={s.surtitre} id={`section-${section.cle}`}>
          <span aria-hidden className={s.sommaireTrait} style={{ background: teinteSection(section) }} />
          <span>{section.titre}</span>
        </p>
        {section.intro ? <p className={s.nuance}>{section.intro}</p> : null}
      </div>
      <ul className={s.liste}>
        {section.entrees.map((e) => <EntreeReleve key={e.ancre} e={e} teinte={teinteEntree(teinteSection(section), e)} provenance={provenance} />)}
      </ul>
      {section.cle === "incompatibilities" && conditions.length > 0 ? (
        <div style={{ marginTop: 24, paddingTop: 24, borderTop: "1px solid var(--r-filet)" }}><ConditionsOuvertes conditions={conditions} /></div>
      ) : null}
    </section>
  );
}

export function DossierDecisionReleve({
  dossier, logement, logementStatus = "none", insee, scopeKey, provenance, projetAChange, voisinageAChange,
  generatedAt, espacement = "mt-14", titre, supportingPane,
}: DossierDecisionReleveProps) {
  const structured = dossier.conclusionState !== "project_not_structured";
  const lecture = lireDossier(dossier);
  const sections = lecture.sections;

  // La condition portée par le bloc de tête, et les cartes que CETTE section rend : les mêmes appels
  // que la présentation classique.
  const conditionDuBloc = conditionPorteeParLeBloc(dossier);
  const conditionEvidence = conditionDuBloc
    ? { evidence: conditionDuBloc.evidence, ...(conditionDuBloc.limitation ? { limitation: conditionDuBloc.limitation } : {}) }
    : null;
  const renderedIds = ancresRendues(dossier);
  const sommaire = <Sommaire sections={sections} />;
  const presentation = { variante: "releve" as const, apresTitre: sommaire };
  const deterministe = (
    <ConclusionBlock plan={dossier.narrativePlan} blocks={planToBlocks(dossier.narrativePlan)} condition={conditionEvidence} renderedIds={renderedIds} titre={titre} {...presentation} />
  );

  // La balance : la paire correspondance / écart, en regard, à la place de la première des deux.
  const iAlign = sections.findIndex((x) => x.cle === "alignments");
  const iEcart = sections.findIndex((x) => x.cle === "mismatches");
  const balance = iAlign >= 0 || iEcart >= 0 ? Math.min(...[iAlign, iEcart].filter((i) => i >= 0)) : -1;
  const reste = sections.filter((x) => x.cle !== "alignments" && x.cle !== "mismatches");
  const avantBalance = balance >= 0 ? sections.slice(0, balance).filter((x) => x.cle !== "alignments" && x.cle !== "mismatches") : reste;
  const apresBalance = balance >= 0 ? reste.filter((x) => !avantBalance.includes(x)) : [];
  const align = iAlign >= 0 ? sections[iAlign]! : null;
  const ecart = iEcart >= 0 ? sections[iEcart]! : null;

  // FUT-7 : les conditions sans carte. Dans la section des conditions quand elle existe, sinon seules.
  const conditionsSansCarte = lecture.conditionsSansCarte;
  const sectionConditions = sections.some((x) => x.cle === "incompatibilities");

  // Les cartes de la liste complète des contrôles, rendue sous cette section (`ControlesDuDossier`) :
  // elles sont affichées sur la page, l'emblème les compte (sans doublon avec la minute).
  const echelles = lectureDesEchelles(lecture, controlesParEchelle(dossier).flatMap((g) => g.cards.map((c) => lireCarteDuDossier(dossier, c))));
  const trace = (i: number): EtatTrace => {
    const e = echelles[i]!;
    return e.etat === "non_examinee" ? "non_examinee" : e.constats > 0 ? "constats" : "examinee";
  };

  return (
    <section className={`${espacement} ${s.releveSection}`} id="dossier-decision">
      <div className={supportingPane
        ? "lg:grid lg:grid-cols-[minmax(0,1fr)_280px] lg:grid-rows-[auto_1fr] lg:gap-x-10 lg:items-start"
        : ""}
      >
        <div className={supportingPane ? "lg:col-start-1 lg:row-start-1" : ""}>
          {/* La date qualifie la version SERVIE, et n'existe que pour un artefact : jamais « aujourd'hui ». */}
          {generatedAt && dateFr(generatedAt) ? (
            <p className={s.mono} style={{ fontSize: 11.5, color: "var(--r-meta)", marginBottom: 14 }}>Analyse générée le {dateFr(generatedAt)}</p>
          ) : null}
          {(projetAChange || voisinageAChange) && insee ? (
            <AnalyseAncienProjet insee={insee} scopeKey={scopeKey} raison={projetAChange ? "projet" : "voisinage"} />
          ) : null}
          {/* Les deux états de l'analyse d'adresse, avec les phrases de production. `unavailable` n'est
              jamais présenté comme une adresse lue : l'emblème garde alors le périmètre communal. */}
          {logementStatus === "pending" ? (
            <p className={`${s.etatDossier} ${s.dense}`} style={{ "--r-teinte": "var(--reg-controle)" } as CSSProperties}>
              <span>{bindOrphans("Première lecture à l'échelle de la commune. L'analyse du logement et de son environnement immédiat est en cours.")}</span>
            </p>
          ) : null}
          {logementStatus === "unavailable" ? (
            <p className={`${s.etatDossier} ${s.dense}`}>
              <span>{bindOrphans("L'analyse réglementaire de cette adresse n'a pas pu être actualisée. La conclusion ci-dessous reste limitée à la commune.")}</span>
            </p>
          ) : null}

          {/* ── La plaque. En « pending », pas de génération : le dossier n'est pas final. ── */}
          <Plaque etiquette="Conclusion du dossier">
            {logementStatus === "pending" ? deterministe : (
              <Suspense fallback={deterministe}>
                <ConclusionRedigee plan={dossier.narrativePlan} insee={insee} scopeKey={scopeKey} condition={conditionEvidence} renderedIds={renderedIds} titre={titre} {...presentation} />
              </Suspense>
            )}
          </Plaque>
        </div>

        {supportingPane ? (
          <div className="mt-6 mb-2 lg:col-start-2 lg:row-start-1 lg:row-span-2 lg:mt-0 lg:mb-0">{supportingPane}</div>
        ) : null}

        <div className={supportingPane ? "lg:col-start-1 lg:row-start-2" : ""}>
          {/* ── D'où viennent ces constats : le périmètre du dossier, jamais le nombre de cartes ── */}
          <section className={s.echellesDuDossier} aria-label="Les échelles où ces constats ont été établis" id="mouvement-echelles">
            <div style={{ maxWidth: 200, width: "100%", justifySelf: "center" }}>
              <EmblemeEchelles
                etiquette={`D'où viennent ces constats : ${echelles.map((e) => { const t = texteEtatEchelle(e); return `${t.nom}, ${t.phrase.toLowerCase()}`; }).join(" ; ")}`}
                etats={{ commune: trace(0), secteur: trace(1), batiment: trace(2) }}
              />
            </div>
            <div className={s.pile} style={{ gap: 10, alignContent: "center" }}>
              <p className={s.etiquette}>D&apos;où viennent ces constats</p>
              <ul className={s.liste}>
                {echelles.map((e) => {
                  const t = texteEtatEchelle(e);
                  const plein = e.etat === "examinee" && e.constats > 0;
                  return (
                    <li key={e.echelle} className={s.ligneEchelle}>
                      <span style={{ color: plein ? "var(--r-encre)" : "var(--r-meta)" }}><Grain grain={GLYPHE[e.echelle]!}>{""}</Grain></span>
                      {t.valeur != null ? (
                        <span className={s.chiffre} style={{ fontSize: 24, color: plein ? "var(--r-encre)" : "var(--r-meta)" }}>{t.valeur}</span>
                      ) : <span aria-hidden />}
                      <span className={s.pileSerree}>
                        <span className={s.etiquette} style={{ color: plein ? "var(--r-texte)" : "var(--r-meta)" }}>{t.nom}</span>
                        <span className={s.dense} style={{ color: plein ? undefined : "var(--r-meta)" }}>{t.phrase}</span>
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </section>

          {conditionsSansCarte.length > 0 && !sectionConditions ? (
            <section className={s.mouvement} aria-label="Vos conditions sans compromis">
              <div className={s.enTeteMouvement}><Surtitre>Vos conditions sans compromis</Surtitre></div>
              <ConditionsOuvertes conditions={conditionsSansCarte} />
            </section>
          ) : null}

          {avantBalance.map((x) => <SectionReleve key={x.cle} section={x} provenance={provenance} conditions={conditionsSansCarte} />)}

          {/* ── La balance : le projet face au lieu ── */}
          {align || ecart ? (
            <section className={s.bandeColonne} aria-label="Votre projet face au lieu" id="mouvement-balance">
              <div className={align && ecart ? s.deux : undefined}>
                {[align, ecart].filter((x): x is SectionLue => x !== null).map((x) => (
                  <div key={x.cle} className={s.pile} style={{ gap: 16, alignContent: "start" }}>
                    <div className={s.enTeteMouvement} style={{ marginBottom: 4 }} id={`section-${x.cle}`}>
                      <Registre teinte={teinteSection(x)} as="h2" className={`${s.titre} ${s.titreBalance}`}>{x.titre}</Registre>
                      {x.intro ? <p className={s.nuance}>{x.intro}</p> : null}
                    </div>
                    <ul className={s.liste}>
                      {x.entrees.map((e) => (
                        <EntreeReleve key={e.ancre} e={e} teinte={teinteEntree(teinteSection(x), e)} compacte={Boolean(align && ecart)} provenance={provenance} />
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {apresBalance.map((x) => <SectionReleve key={x.cle} section={x} provenance={provenance} conditions={conditionsSansCarte} />)}

          {/* La colonne d'appui porte déjà ces destinations ; sans elle, le lien de production reste. */}
          {!supportingPane && structured ? (
            <Link href={logement ? logement.href : "/dossier"} className={s.porte} style={{ marginTop: 24, borderTop: "1px solid var(--r-filet-fort)" }}>
              <span style={{ color: "var(--r-encre)", paddingTop: 4 }}><Grain grain={logement ? "batiment" : "adresse"}>{""}</Grain></span>
              <span className={s.pileSerree}>
                <span className={s.sousTitre}>{logement ? "Voir l'analyse du logement" : "Affiner avec une adresse"}</span>
                <span className={s.dense}>{logement ? logement.label : "Le bâtiment, les risques localisés, les contraintes réglementaires et l'environnement immédiat."}</span>
              </span>
              <span aria-hidden className={s.mono} style={{ color: "var(--r-encre)" }}>→</span>
            </Link>
          ) : null}
        </div>
      </div>
    </section>
  );
}
