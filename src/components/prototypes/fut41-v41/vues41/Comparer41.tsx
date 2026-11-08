"use client";
// COMPARER, V4.1 · le sens d'abord, le détail ensuite. Communes et logements se comparent ensemble,
// chacun à l'échelle où il est réellement lu : les communes sur le Territoire (une colonne par commune),
// les logements aux abords et dans le logement. Rien n'est répété sur l'écran (arbitrage Z12).
import { Fragment, useId } from "react";
import { GlypheGrain, Plaque, Selecteur, releve as s } from "@/components/releve/primitives";
import {
  dateCourte, gestePrincipal, lire, logementsDe, synthese, voies, NOM_ECHELLE,
  type Echelle, type Piste,
} from "../modele41";
import type { Api41 } from "../CentreDecision41";
import { BoutonGeste, Fil41, Marque, Section, Vignette, lier } from "../communs41";
import { faireGeste } from "./Accueil";
import v from "../v41.module.css";

const OU_ECHELLE: Record<Echelle, string> = { territoire: "À la commune", abords: "Aux abords", logement: "Dans le logement" };

export function Comparer41({ api }: { api: Api41 }) {
  const { etat, aller } = api;
  const id = useId();
  const communes = etat.communes.filter((c) => c.statut !== "ecartee");
  const sel = etat.vue.selection ?? [];
  const pistes: Piste[] = sel.map((x): Piste | null => {
    if (x.startsWith("c:")) { const c = communes.find((k) => `c:${k.insee}` === x); return c ? { type: "commune", commune: c } : null; }
    const l = etat.logements.find((k) => k.id === x && k.statut !== "ecarte"); return l ? { type: "logement", logement: l } : null;
  }).filter((p): p is Piste => !!p);
  const choisir = (selection: string[], echelle = etat.vue.echelle) => aller({ ecran: "comparer", selection, ...(echelle ? { echelle } : {}) });
  const basculer = (x: string) => choisir(sel.includes(x) ? sel.filter((y) => y !== x) : [...sel, x]);
  const tousLogements = etat.logements.filter((l) => l.statut !== "ecarte").map((l) => l.id);
  const toutesCommunes = communes.map((c) => `c:${c.insee}`);

  const lec = pistes.length >= 2 ? lire(etat, pistes) : null;
  const lesVoies = pistes.length >= 2 ? voies(etat, pistes) : [];
  const echelle = (etat.vue.echelle as Echelle | undefined) ?? lesVoies[0]?.echelle ?? "territoire";
  const voie = lesVoies.find((x) => x.echelle === echelle) ?? lesVoies[0];
  const nbC = pistes.filter((p) => p.type === "commune").length;
  const nbL = pistes.length - nbC;

  return (
    <>
      <Fil41 segments={[{ libelle: "Ma décision", aller: () => aller({ ecran: "accueil" }) }, { libelle: "Comparer" }]} />
      <div className={v.tete}>
        <h1 className={`${s.titre} ${v.titreVue}`} tabIndex={-1} data-titre-vue>Comparer</h1>
        <p className={s.nuance}>{nbC ? `${nbC} commune${nbC > 1 ? "s" : ""}` : ""}{nbC && nbL ? " et " : ""}{nbL ? `${nbL} logement${nbL > 1 ? "s" : ""}` : ""}{pistes.length ? ", " : ""}face à votre Projet (révision {etat.projet.revision}, {dateCourte(etat.projet.date)})</p>
      </div>

      <div className={v.choix} role="group" aria-labelledby={`${id}-c`}>
        <div className={v.choixTete}>
          <p className={s.etiquette} id={`${id}-c`}>Ce que vous comparez</p>
          <div className={v.ligneGestes}>
            <button type="button" className={s.action} onClick={() => choisir(toutesCommunes, "territoire")}>Les communes</button>
            <button type="button" className={s.action} onClick={() => choisir(tousLogements, "abords")}>Les logements</button>
            <button type="button" className={s.action} onClick={() => choisir([...toutesCommunes, ...tousLogements])}>Tout</button>
          </div>
        </div>
        <div className={v.choixGroupes}>
          {communes.map((c) => (
            <div key={c.insee} className={v.choixGroupe}>
              <button type="button" className={v.puce} data-commune aria-pressed={sel.includes(`c:${c.insee}`)} onClick={() => basculer(`c:${c.insee}`)}>
                <GlypheGrain grain="commune" taille={10} /> {c.nom}
              </button>
              {logementsDe(etat, c).filter((l) => l.statut !== "ecarte").map((l) => (
                <button key={l.id} type="button" className={v.puce} aria-pressed={sel.includes(l.id)} onClick={() => basculer(l.id)}>{l.libelle}</button>
              ))}
            </div>
          ))}
        </div>
      </div>

      {!lec ? <p className={s.corps}>Choisissez au moins deux pistes : deux communes, deux logements, ou les deux.</p> : (
        <>
          <Plaque etiquette="En bref" className={v.bref}>
            <p className={s.etiquette}>En bref</p>
            <div className={v.brefTexte}>{synthese(etat, pistes).map((x, i) => <p key={i}>{lier(x)}</p>)}</div>
          </Plaque>

          {lec.bloque.length ? (
            <Section titre="Ce qui bloque" id="bloque" sous="Une condition sans compromis non tenue : aucun point favorable ne la compense.">
              <ul className={v.points}>{lec.bloque.map((b, i) => <li key={i} data-genre="bloque">{lier(b.phrase)}</li>)}</ul>
            </Section>
          ) : null}

          <Section titre="Ce qui fait la différence" id="difference" sous={lec.bloque.length ? "Entre les options qui tiennent vos conditions sans compromis." : undefined}>
            {lec.difference.length || lec.pourrait.length ? (
              (["territoire", "abords", "logement"] as Echelle[]).map((e) => {
                const d = lec.difference.filter((x) => x.echelle === e);
                const p = lec.pourrait.filter((x) => x.echelle === e);
                if (!d.length && !p.length) return null;
                return (
                  <div key={e} className={v.diffGroupe}>
                    <p className={v.diffOu}><GlypheGrain grain={e === "territoire" ? "commune" : e === "abords" ? "secteur" : "batiment"} taille={11} /> {OU_ECHELLE[e]}</p>
                    <ul className={v.points}>
                      {d.map((x) => <li key={x.cle} data-genre="difference">{lier(x.phrase)}</li>)}
                      {p.map((x) => <li key={`p${x.cle}`} data-genre="verifier"><span className={v.pointGenre}>À vérifier</span>{lier(x.phrase)}</li>)}
                    </ul>
                  </div>
                );
              })
            ) : <p className={s.corps}>Rien ne fait encore la différence de façon établie entre ces options.</p>}
          </Section>

          <Section titre="Ce que chaque option vous demande" id="options" sous="Ce qu'elle apporte, ce qu'elle demande d'accepter, ce qui reste inconnu, et le prochain geste.">
            {lec.compromis.length > 1 ? <p className={v.defiler}>Faites glisser pour voir les {lec.compromis.length} options.</p> : null}
            <div className={v.options} role="list">
              {lec.compromis.map((c) => {
                const p = pistes.find((x) => (x.type === "commune" ? `c:${x.commune.insee}` : x.logement.id) === c.pisteId)!;
                const g = gestePrincipal(etat, p, etat.droits);
                return (
                  <article key={c.pisteId} className={v.option} role="listitem" aria-labelledby={`o-${c.pisteId}`}>
                    <header className={v.optionTete}>
                      {p.type === "logement" ? <Vignette logement={p.logement} taille={40} /> : <span className={v.optionGlyphe}><GlypheGrain grain="commune" taille={20} /></span>}
                      <div>
                        <h3 className={v.optionNom} id={`o-${c.pisteId}`}>
                          <button type="button" className={v.lien} onClick={() => aller(p.type === "commune" ? { ecran: "commune", id: c.pisteId } : { ecran: "fiche", id: c.pisteId })}>{c.nom}</button>
                        </h3>
                        <p className={s.nuance}>{p.type === "commune" ? "La commune" : p.logement.commune.nom}</p>
                      </div>
                    </header>
                    <Liste titre="Apporte" items={c.apporte} genre="apporte" />
                    <Liste titre="Demande d'accepter" items={c.accepte} genre="accepte" />
                    <Liste titre="Reste inconnu" items={c.inconnu} genre="inconnu" />
                    {c.limite ? <p className={v.nonLu}>{lier(c.limite)}</p> : null}
                    {c.nonLu.length ? <p className={v.nonLu}>Pas encore lu : {c.nonLu.join(", ").toLowerCase()}.</p> : null}
                    <div className={v.optionPied}><BoutonGeste geste={g} faire={faireGeste(api, p)} avecApport={g.commercial} /></div>
                  </article>
                );
              })}
            </div>
          </Section>

          {lec.pasComparable.length ? (
            <Section titre="Pas encore comparable" id="pas-comparable" sous="Ces conclusions existent, mais elles n'ont pas été obtenues dans les mêmes conditions : les rapprocher tromperait.">
              <ul className={v.points}>{lec.pasComparable.map((x, i) => <li key={i} data-genre="manque">{lier(x.phrase)}</li>)}</ul>
              <p className={s.nuance}>Mettre à jour l&apos;analyse la plus ancienne avec votre Projet actuel (gratuit pour un dossier acquis) les rendrait comparables.</p>
            </Section>
          ) : null}

          {voie ? (
            <Section titre="Le détail, échelle par échelle" id="detail">
              <Selecteur id={`${id}-e`} question="Lire" valeur={voie.echelle} onChoisir={(e) => choisir(sel, e)}
                options={lesVoies.map((x) => ({ valeur: x.echelle, libelle: NOM_ECHELLE[x.echelle] }))} />
              <p className={s.nuance}>{voie.note}</p>
              {voie.lignes.length ? (
                <div className={v.voie} style={{ "--cols": voie.colonnes.length } as React.CSSProperties} role="table" aria-label={`${NOM_ECHELLE[voie.echelle]} : chaque condition pour chaque option`}>
                  <div className={v.voieTete} role="row">
                    <span role="columnheader" className={v.voieCoin}>Votre Projet</span>
                    {voie.colonnes.map((c) => <span key={c.id} role="columnheader" className={v.voieCol}><strong>{c.nom}</strong><span>{c.sous}</span></span>)}
                  </div>
                  {voie.lignes.map((li) => (
                    <Fragment key={li.cle}>
                      <div role="row" className={v.voieLigne} data-diff={li.difference}>
                        <span role="rowheader" className={v.voieCrit}>
                          <span className={v.voieCritNom}>{li.libelle}{li.sansCompromis ? <span className={v.dur}> · sans compromis</span> : null}</span>
                          <span className={v.voieVerdict}>{({ fait_la_difference: "Fait la différence", pourrait: "Pourrait faire la différence", pareil: "Pareil", pas_comparable: "Pas encore comparable", pas_lu: "Pas assez lu" } as const)[li.difference]}</span>
                        </span>
                        {li.cellules.map((c) => (
                          <span key={c.id} role="cell" className={v.voieCell}>
                            <span className={v.voieCellNom}>{c.nom}</span>
                            <Marque ligne={c.ligne} sansLieu />
                            {c.partageAvec?.length ? <span className={v.partage}>vaut pour {c.partageAvec.join(", ")}</span> : null}
                          </span>
                        ))}
                      </div>
                      <div className={v.voiePourquoi}>{lier(li.pourquoi)}</div>
                    </Fragment>
                  ))}
                </div>
              ) : <p className={s.corps}>Aucune option n&apos;est encore lue à cette échelle. {voie.echelle !== "territoire" ? "Analyser une adresse lirait ses abords et le logement." : ""}</p>}
            </Section>
          ) : null}
        </>
      )}
    </>
  );
}

function Liste({ titre, items, genre }: { titre: string; items: string[]; genre: string }) {
  if (!items.length) return null;
  return (
    <div className={v.optListe} data-genre={genre}>
      <p className={v.optTitre}>{titre}</p>
      <ul>{items.map((x) => <li key={x}>{x}</li>)}</ul>
    </div>
  );
}
