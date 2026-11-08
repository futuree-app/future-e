"use client";
// LE RELEVÉ, simplifié pour la revue (en production : DossierDecisionReleve, FUT-91). Même conclusion,
// mot pour mot, que la fiche ; on en ressort vers la fiche.
import { EmblemeEchelles, Ligne, Marge, Plaque, Registre, releve as s } from "@/components/releve/primitives";
import { analyseServie, communeCommeLieu, dateCourte, etatsEmbleme, libelleCritere, GRAIN_LIBELLE, TEINTE_ISSUE, LIBELLE_ISSUE_SIMPLE } from "../modele41";
import type { Api41 } from "../CentreDecision41";
import { Fil41, lier } from "../communs41";
import v from "../v41.module.css";

export function Releve41({ api }: { api: Api41 }) {
  const { etat, aller } = api;
  const id = etat.vue.id ?? "";
  const commune = id.startsWith("c:") ? etat.communes.find((c) => `c:${c.insee}` === id) : undefined;
  const lieu = commune ? communeCommeLieu(commune) : etat.logements.find((l) => l.id === id);
  const a = lieu ? analyseServie(lieu) : null;
  const retour = () => aller(commune ? { ecran: "commune", id } : { ecran: "fiche", id });
  if (!lieu || !a) return <h1 className={s.titre} tabIndex={-1} data-titre-vue>Aucun dossier ici</h1>;
  return (
    <>
      <Fil41 segments={[{ libelle: "Ma décision", aller: () => aller({ ecran: "accueil" }) }, { libelle: lieu.libelle, aller: retour }, { libelle: "Relevé" }]} />
      <p className={v.simplifie}>Relevé simplifié pour la revue. En production : le Relevé du dossier servi, version {a.version} du {dateCourte(a.generatedAt)}.</p>
      <div className={v.releveTete}>
        <div className={s.pileSerree}>
          <p className={s.surtitre}><span>{a.perimetre === "commune" ? "Rapport de territoire" : "Dossier d'adresse"} · {dateCourte(a.generatedAt)}</span></p>
          <h1 className={`${s.titre} ${v.titreVue}`} tabIndex={-1} data-titre-vue>{lieu.adresse ?? lieu.libelle}</h1>
        </div>
        <div className={v.releveEmbleme}><EmblemeEchelles etiquette="Échelles lues" etats={etatsEmbleme(lieu)} /></div>
      </div>
      <Plaque etiquette="Verdict"><p className={s.etiquette}>{a.conclusion.etiquette}</p><p className={`${s.display} ${s.verdict}`} data-conclusion>{lier(a.conclusion.phrase)}</p></Plaque>
      <div className={`${s.liste} ${v.releveListe}`}>
        {a.projet.criteres.map((k) => {
          const r = a.registre.find((x) => x.cle === k.cle);
          if (!r) return null;
          return (
            <Ligne key={k.cle} marge={<Marge elements={[...(r.grain ? [{ type: "grain" as const, grain: r.grain, libelle: GRAIN_LIBELLE[r.grain] }] : []), ...(r.preuve ? [{ type: "source" as const, texte: `Source : ${r.preuve.source}`, date: r.preuve.date }] : [])]} />}>
              <Registre teinte={TEINTE_ISSUE[r.issue]} as="h3">{libelleCritere(k)}</Registre>
              <p className={s.dense}><strong className={s.encre}>{LIBELLE_ISSUE_SIMPLE[r.issue]}</strong>{r.constat ? ` : ${r.constat}` : ""}</p>
            </Ligne>
          );
        })}
      </div>
      <div className={v.ligneGestes}><button type="button" className={`${s.bouton} ${s.boutonMarque}`} onClick={retour}>Retrouver {lieu.libelle} dans Ma décision</button></div>
    </>
  );
}
