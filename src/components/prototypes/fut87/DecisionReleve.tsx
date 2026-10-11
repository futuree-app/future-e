// FUT-87 · PROTOTYPE 2 · « MA DÉCISION » DANS LA DIRECTION « LE RELEVÉ ». DEV UNIQUEMENT.
//
// Même dossier que la production (assemblé par le moteur, lu par `lireDossier`), autre composition :
//
//   1. La plaque : le verdict du moteur, mot pour mot. Sur mobile, le sommaire tient en quelques
//      jetons juste sous le titre, avant l'explication (mesure à 390 × 844 dans le document de
//      direction).
//   2. D'où viennent ces constats : l'emblème des trois échelles, avec le nombre de constats lus à
//      chacune. Un moment visuel, qui sert aussi de légende aux glyphes de grain.
//   3. La balance, sur une bande teintée : ce qui correspond et ce qui correspond moins bien, face à
//      face. Les deux sections du moteur restent entières ; seule leur disposition change.
//   4. Le registre des contrôles, puis le non su, en liste à filets, preuves en marge.
//   5. La coupe des trois échelles.
//
// RYTHME (revue V2). La V1 enchaînait des filets de même poids : une monotonie de lignes à la place
// d'une monotonie de cartes. Trois densités alternent désormais : la plaque (éditoriale), l'emblème
// et la bande de la balance (visuelles), le registre des contrôles (sobre).
//
// Aucun ordre n'est inventé : les sections suivent l'ordre de la minute. Seule la paire
// correspondance / écart est mise en regard, à la place de la première des deux.
import Link from "next/link";
import type { CSSProperties } from "react";
import type { VerificationActionType } from "@/lib/decision/decision-fact";
import { evidenceHref } from "@/lib/decision/evidence-targets";
import { dateFr } from "@/lib/decision/autour-permis";
import { bindOrphans } from "@/lib/typography";
import { lectureDesEchelles, texteEtatEchelle, type LectureDecision, type EntreeLue, type SectionLue, type PreuveLue, type GrainLu } from "./lecture-dossier";
import {
  releve as s, Surtitre, Ligne, Marge, Registre, Plaque, CoupeEchelles, Grain, EmblemeEchelles,
  TEINTE_REGISTRE, RegleDeRang, Seuils, type ElementDeMarge, type GrainCle, type EtatTrace,
} from "./primitives";

const TON: Record<LectureDecision["verdict"]["ton"], string> = {
  critical: "var(--red)",
  caution: "var(--orange)",
  neutral: "var(--ghost)",
  positive: "var(--green)",
};

const GESTE: Record<VerificationActionType, string> = {
  verifier_sur_place: "M1 8s2.5-4.5 7-4.5S15 8 15 8s-2.5 4.5-7 4.5S1 8 1 8Z M9.8 8a1.8 1.8 0 1 1-3.6 0 1.8 1.8 0 0 1 3.6 0Z",
  obtenir_document: "M4 1.8h5l3 3v9.4H4V1.8Z M9 1.8v3h3",
  demander_confirmation: "M5.7 5.7a2.3 2.3 0 1 1 3.1 2.2c-.5.2-.8.6-.8 1.1v.4 M8 12.3h.01",
  renseigner_adresse: "M2.5 8h10 M8.8 4.3 13 8l-4.2 3.7",
};

function Geste({ libelle, type }: { libelle: string; type?: VerificationActionType }) {
  return (
    <p className={s.dense} style={{ display: "flex", gap: 10, alignItems: "flex-start", color: "var(--r-encre)" }}>
      <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden focusable="false" style={{ flex: "none", marginTop: 3 }}
        fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
        <path d={GESTE[type ?? "renseigner_adresse"]} />
      </svg>
      <span>{libelle}</span>
    </p>
  );
}

const GRAIN_EN_MARGE: Record<GrainLu, string> = {
  commune: "à l'échelle de la commune",
  unite_urbaine: "à l'échelle de l'agglomération",
  secteur: "dans le secteur",
  adresse: "à cette adresse",
};

const lien = (p: PreuveLue) => (p.href ? evidenceHref(p.cible, p.href) : undefined);
const observee = (p: PreuveLue) => (p.date && dateFr(p.date) ? `observée le ${dateFr(p.date)}` : undefined);

/**
 * LA MARGE D'UNE CARTE : tous ses grains, puis ses preuves chiffrées, puis ses sources nommées.
 * Chaque source garde son lien et sa date (revue V2). Quand la carte mêle plusieurs grains, chaque
 * preuve dit le sien par son propre glyphe.
 */
function margeDe(e: { grains: GrainLu[]; preuves: PreuveLue[]; sources: PreuveLue[] }): ElementDeMarge[] {
  const grainParPreuve = e.grains.length !== 1;
  const propre = (p: PreuveLue) => (grainParPreuve ? { grain: p.grain as GrainCle } : {});
  return [
    ...e.grains.map((g) => ({ type: "grain" as const, grain: g as GrainCle, libelle: GRAIN_EN_MARGE[g] })),
    ...e.preuves.map((p) => ({
      type: "valeur" as const, libelle: p.href ? "Preuve" : p.libelle, valeur: p.valeur ?? p.libelle,
      href: lien(p), date: observee(p), ...propre(p),
    })),
    ...e.sources.map((p) => ({
      type: "source" as const, texte: `Source : ${p.libelle}`, href: lien(p), date: observee(p), ...propre(p),
    })),
  ];
}

/**
 * LA TEINTE D'UNE SECTION, une seule règle pour le sommaire, l'en-tête et les cartes. Celle de la
 * production : la section des conditions ne prend le rouge de l'incompatibilité que si elle en porte
 * une ; des conditions ouvertes ou remplies ne sont pas un blocage (FUT-7).
 */
function teinteSection(section: SectionLue): string {
  if (section.cle === "incompatibilities" && !section.entrees.some((x) => x.nature === "incompatibility")) return "var(--reg-controle)";
  return TEINTE_REGISTRE[section.cle] ?? "var(--reg-non-su)";
}

function teinteEntree(section: SectionLue, e: EntreeLue): string {
  if (e.nature === "condition_check") return TEINTE_REGISTRE.condition_check!;
  if (e.nature === "condition_met") return TEINTE_REGISTRE.condition_met!;
  return teinteSection(section);
}

function Corps({ section, e, compacte }: { section: SectionLue; e: EntreeLue; compacte: boolean }) {
  const teinte = teinteEntree(section, e);
  return (
    <>
      {e.horsPriorites ? <p className={s.etiquette}>Au-delà de vos priorités</p> : null}
      {e.sujet ? (
        <Registre teinte={teinte} as="h3">{e.sujet.charAt(0).toUpperCase() + e.sujet.slice(1)}</Registre>
      ) : null}
      {e.statut ? <p className={`${s.etiquette} ${s.teinte}`} style={{ "--r-teinte": teinte } as CSSProperties}>{e.statut}</p> : null}
      {e.sujet ? (
        <p className={compacte ? s.dense : s.corps}>{e.enonce}</p>
      ) : (
        <Registre teinte={teinte} className={`${s.corps} ${s.encre}`}>{e.enonce}</Registre>
      )}
      {e.fondement?.type === "rang" ? <RegleDeRang bas={e.fondement.bas} haut={e.fondement.haut} sujet={e.sujet ?? ""} /> : null}
      {e.fondement?.type === "seuils" ? <Seuils horizon={e.fondement.horizon} mesures={e.fondement.mesures} /> : null}
      {e.nuance ? <p className={s.nuance}>{e.nuance}</p> : null}
      {e.cotes.length > 0 ? (
        <ul className={s.liste} style={{ marginTop: 6 }}>
          {e.cotes.map((c, i) => (
            <li key={i} className={s.cote}>
              <div className={s.pileSerree}>
                {c.libelle ? <p className={s.etiquette}>{c.libelle}</p> : null}
                {c.statut ? <p className={s.etiquette}>{c.statut}</p> : null}
                <p className={s.dense}>{c.enonce}</p>
                {c.nuance ? <p className={s.nuance}>{c.nuance}</p> : null}
                {c.preuves.length + c.sources.length > 0 ? (
                  <Marge elements={margeDe({ grains: [], preuves: c.preuves, sources: c.sources })} enLigne />
                ) : null}
                {c.geste ? <Geste libelle={c.geste.libelle} type={c.geste.type} /> : null}
              </div>
            </li>
          ))}
        </ul>
      ) : null}
      {e.geste ? <Geste libelle={e.geste.libelle} type={e.geste.type} /> : null}
      {e.limites.length > 0 || e.detailles.length > 0 ? (
        <details className={s.details}>
          <summary>
            {e.detailles.length > 0
              ? `Données, limites et ${e.detailles.length > 1 ? `les ${e.detailles.length} constats détaillés` : "le constat détaillé"}`
              : "Données et limites"}
          </summary>
          <div className={s.pile} style={{ marginTop: 8, paddingLeft: 12, borderLeft: "1px solid var(--r-filet)" }}>
            {e.limites.map((l, i) => <p key={i} className={s.nuance}>{l}</p>)}
            {e.detailles.map((d) => (
              <div key={d.ancre} className={s.pileSerree}>
                <p className={s.dense}>{d.enonce}</p>
                <Marge elements={margeDe(d)} enLigne />
              </div>
            ))}
          </div>
        </details>
      ) : null}
    </>
  );
}

function Entree({ section, e, compacte = false }: { section: SectionLue; e: EntreeLue; compacte?: boolean }) {
  return (
    <li id={e.ancre} tabIndex={-1} style={{ scrollMarginTop: 96 }}>
      {compacte ? (
        <div className={s.pile}>
          <Corps section={section} e={e} compacte />
          <Marge elements={margeDe(e)} />
        </div>
      ) : (
        <Ligne marge={<Marge elements={margeDe(e)} />}><Corps section={section} e={e} compacte={false} /></Ligne>
      )}
    </li>
  );
}

function EnTeteSection({ numero, section }: { numero: string; section: SectionLue }) {
  return (
    <div className={s.enTeteMouvement} id={`section-${section.cle}`}>
      <Surtitre numero={numero}>{section.titre}</Surtitre>
      {section.intro ? <p className={s.nuance}>{section.intro}</p> : null}
    </div>
  );
}

/** Le sommaire : des comptes de cartes, pas une note. Aucune somme, barre ni pourcentage (ADR-0001). */
function Sommaire({ sections, compact }: { sections: SectionLue[]; compact: boolean }) {
  if (compact) {
    return (
      <nav aria-label="Sommaire du dossier" className={s.sommaireCompact}>
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
  return (
    <nav aria-label="Sommaire du dossier" className={`${s.marge} ${s.sommaireMarge}`} style={{ fontFamily: "var(--font-sans)", fontSize: 14 }}>
      <p className={s.etiquette} style={{ marginBottom: 4 }}>Dans ce dossier</p>
      {sections.map((x) => (
        <a key={x.cle} href={`#section-${x.cle}`} className={s.lien} style={{ display: "flex", justifyContent: "space-between", gap: 12, textDecoration: "none", color: "var(--r-texte)", padding: "5px 0", borderTop: "1px solid var(--r-filet)" }}>
          <span style={{ display: "flex", gap: 8, alignItems: "baseline" }}>
            <span aria-hidden style={{ width: 3, height: 11, background: teinteSection(x), display: "inline-block", flex: "none" }} />
            {x.titre}
          </span>
          <span className={s.mono} style={{ color: "var(--r-meta)" }}>{x.entrees.length}</span>
        </a>
      ))}
    </nav>
  );
}


export function DecisionReleve({
  lecture, projet, lienAvant,
}: {
  lecture: LectureDecision;
  /** Les priorités déclarées, dans les mots du produit (`PREFERENCE_LABELS`). */
  projet: string[];
  lienAvant: string;
}) {
  const ton = TON[lecture.verdict.ton];
  const sections = lecture.sections;
  const iAlign = sections.findIndex((x) => x.cle === "alignments");
  const iEcart = sections.findIndex((x) => x.cle === "mismatches");
  const balance = iAlign >= 0 || iEcart >= 0 ? Math.min(...[iAlign, iEcart].filter((i) => i >= 0)) : -1;
  const reste = sections.filter((x) => x.cle !== "alignments" && x.cle !== "mismatches");
  const avantBalance = balance >= 0 ? sections.slice(0, balance).filter((x) => x.cle !== "alignments" && x.cle !== "mismatches") : reste;
  const apresBalance = balance >= 0 ? reste.filter((x) => !avantBalance.includes(x)) : [];
  const align = iAlign >= 0 ? sections[iAlign]! : null;
  const ecart = iEcart >= 0 ? sections[iEcart]! : null;

  // D'OÙ VIENNENT CES CONSTATS (revue du 11/10/2026). L'état de chaque échelle vient du PÉRIMÈTRE du
  // dossier (`lectureDesEchelles`) : une échelle que cette lecture n'a pas examinée ne reçoit aucun
  // nombre, et « 0 » ne s'écrit que pour une échelle examinée sans constat affiché.
  const echelles = lectureDesEchelles(lecture);
  const trace = (i: number): EtatTrace => {
    const e = echelles[i]!;
    return e.etat === "non_examinee" ? "non_examinee" : e.constats > 0 ? "constats" : "examinee";
  };
  const GLYPHE: Record<string, GrainCle> = { territoire: "commune", quartier: "secteur", logement: "batiment" };

  // LES NUMÉROS SONT CALCULÉS AVANT LE RENDU, dans l'ordre du document : un compteur incrémenté
  // pendant le rendu suivrait l'ordre d'appel des composants, pas celui de la page.
  const ordre = [
    ...avantBalance.map((x) => x.cle as string),
    ...(align || ecart ? ["balance"] : []),
    ...apresBalance.map((x) => x.cle as string),
    ...(lecture.conditionsSansCarte.length > 0 ? ["conditions"] : []),
    "coupe",
  ];
  const num = (cle: string) => String(ordre.indexOf(cle) + 1).padStart(2, "0");

  const Section = ({ section }: { section: SectionLue }) => (
    <section className={s.mouvement} aria-labelledby={`section-${section.cle}`}>
      <EnTeteSection numero={num(section.cle)} section={section} />
      <ul className={s.liste}>
        {section.entrees.map((e) => <Entree key={e.ancre} section={section} e={e} />)}
      </ul>
    </section>
  );

  return (
    <div className={s.feuille}>
      {/* ── En-tête : où l'on est, ce que le lecteur a demandé ─────────────────────────── */}
      <header className={s.enTeteDossier}>
        <div className={s.rangee}>
          <Surtitre numero="Dossier">Ma décision</Surtitre>
          <Grain grain="commune">{lecture.commune}</Grain>
          {lecture.portee === "commune+adresse" ? <Grain grain="adresse">avec une adresse</Grain> : null}
        </div>
        {projet.length > 0 ? (
          <>
            <p className={`${s.dense} ${s.projetLong}`}>
              <span className={s.etiquette}>Votre projet · </span>
              {projet.join(" · ")}
            </p>
            {/* Sur mobile, le projet se replie : il prenait trois lignes au-dessus du verdict. */}
            <details className={`${s.details} ${s.projetCourt}`}>
              <summary>Votre projet · {projet.length} priorité{projet.length > 1 ? "s" : ""}</summary>
              <p className={s.dense} style={{ marginTop: 6 }}>{projet.join(" · ")}</p>
            </details>
          </>
        ) : null}
      </header>

      {/* ── 1. La plaque : la réponse, le sommaire, ce qu'il faut faire d'abord ─────────── */}
      <Plaque etiquette="Conclusion du dossier">
        <div className={s.ligne}>
          <div className={s.pile} style={{ gap: 16 }}>
            <p className={s.etiquette} style={{ color: ton, display: "flex", alignItems: "center", gap: 8 }}>
              <span aria-hidden style={{ width: 8, height: 8, background: ton, display: "inline-block" }} />
              {lecture.verdict.etiquette}
            </p>
            {/* Les petits mots et la ponctuation haute restent liés au mot voisin (même règle que la
                production) : un « : » ne commence jamais une ligne. */}
            <h1 className={`${s.display} ${s.verdict}`}>{bindOrphans(lecture.verdict.titre)}</h1>
            <Sommaire sections={sections} compact />
            {lecture.priorites ? (
              <div className={s.pileSerree}>
                <p className={s.etiquette} style={{ color: "var(--reg-controle)" }}>{lecture.priorites.titre}</p>
                <ol className={s.liste} style={{ gap: 0 }}>
                  {lecture.priorites.gestes.map((g, i) => (
                    <li key={g.ancre + i} style={{ padding: "8px 0", display: "flex", gap: 14, alignItems: "baseline", borderTop: i ? "1px solid var(--r-filet)" : 0 }}>
                      <span className={s.numero}>{String(i + 1).padStart(2, "0")}</span>
                      <a href={`#${g.ancre}`} className={s.lien} style={{ fontSize: 16 }}>{g.libelle}</a>
                    </li>
                  ))}
                </ol>
              </div>
            ) : null}
            {lecture.verdict.detail ? <p className={`${s.chapo} ${s.verdictDetail}`}>{bindOrphans(lecture.verdict.detail)}</p> : null}
            {lecture.conditionNonExaminee ? (
              <div className={s.pileSerree}>
                {/* Le trait de registre se pose devant le libellé, jamais sur tout le bloc. */}
                <Registre teinte="var(--reg-non-su)" className={s.etiquette}>Condition à vérifier</Registre>
                <p className={s.dense}>{lecture.conditionNonExaminee}</p>
              </div>
            ) : null}
            {lecture.preuvesDuVerdict.length > 0 ? (
              <Marge enLigne elements={margeDe({
                grains: [], preuves: lecture.preuvesDuVerdict.filter((p) => p.valeur), sources: lecture.preuvesDuVerdict.filter((p) => !p.valeur),
              })} />
            ) : null}
            {lecture.nonCouvert ? <p className={s.nuance}>{lecture.nonCouvert}</p> : null}
          </div>
          <Sommaire sections={sections} compact={false} />
        </div>
      </Plaque>

      {/* ── 2. D'où viennent ces constats : l'emblème, compté ──────────────────────────── */}
      <section className={s.echellesDuDossier} aria-label="Les échelles où ces constats ont été établis">
        <div style={{ maxWidth: 220, width: "100%", justifySelf: "center" }}>
          {/* Sans renvois : la liste d'à côté porte les états en toutes lettres. Trait plein : des
              constats ; trait fin : examinée, rien d'affiché ; pointillé : non examinée ici. */}
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
                  ) : (
                    <span aria-hidden />
                  )}
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

      {avantBalance.map((x) => <Section key={x.cle} section={x} />)}

      {/* ── 3. La balance : le projet face au lieu, sur une bande ──────────────────────── */}
      {align || ecart ? (
        <section className={`${s.mouvement} ${s.bande}`} aria-label="Votre projet face au lieu">
          <div className={s.enTeteMouvement}>
            <Surtitre numero={num("balance")}>Votre projet face au lieu</Surtitre>
          </div>
          <div className={align && ecart ? s.deux : undefined}>
            {[align, ecart].filter((x): x is SectionLue => x !== null).map((x) => (
              <div key={x.cle} className={s.pile} style={{ gap: 16, alignContent: "start" }}>
                <div className={s.enTeteMouvement} style={{ marginBottom: 4 }} id={`section-${x.cle}`}>
                  <Registre teinte={teinteSection(x)} as="h2" className={s.titre}>{x.titre}</Registre>
                  {x.intro ? <p className={s.nuance}>{x.intro}</p> : null}
                </div>
                <ul className={s.liste}>
                  {x.entrees.map((e) => <Entree key={e.ancre} section={x} e={e} compacte={Boolean(align && ecart)} />)}
                </ul>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {/* ── 4. Les contrôles, le non su, les conditions ────────────────────────────────── */}
      {apresBalance.map((x) => <Section key={x.cle} section={x} />)}

      {lecture.conditionsSansCarte.length > 0 ? (
        <section className={s.mouvement}>
          <div className={s.enTeteMouvement}><Surtitre numero={num("conditions")}>Vos conditions sans compromis</Surtitre></div>
          <ul className={s.liste}>
            {lecture.conditionsSansCarte.map((c) => (
              <li key={c.cle}>
                <Registre teinte="var(--reg-non-su)" as="h3">{c.libelle}</Registre>
                <p className={s.etiquette}>{c.cause === "ne_pas_mesurer" ? "Non évaluée" : "Condition ouverte"}</p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* ── 5. La coupe : changer d'échelle ────────────────────────────────────────────── */}
      <section className={s.mouvementSerre} aria-label="Changer d'échelle">
        <div className={s.enTeteMouvement}><Surtitre numero={num("coupe")}>Lire le lieu à une autre échelle</Surtitre></div>
        <CoupeEchelles liens={{ territoire: "#", autour: "#", logement: "/dev/fut87/logement" }} />
      </section>

      <footer className={s.mouvementSerre}>
        <p className={s.nuance}>
          Comparer avec <Link className={s.lien} href={lienAvant}>le rendu actuel du même dossier</Link>.
        </p>
      </footer>
    </div>
  );
}
