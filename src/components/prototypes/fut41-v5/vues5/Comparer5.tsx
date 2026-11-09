"use client";
// COMPARER, V5 · deux modes explicites (vos communes, vos logements), une seule structure :
//   1. En bref : ce qui bloque (dit une fois, Z12), ce qui les distingue, ce qui manque ;
//   2. Ce que chacun apporte, ce qu'il demande d'accepter, ce qui pourrait changer l'arbitrage,
//      et son prochain geste : en colonnes, valeurs côte à côte ;
//   3. Le détail, condition par condition, couche par couche, avec mesures et preuves.
// Sur ordinateur : deux à quatre colonnes. Sur téléphone : deux, en face-à-face, et l'on change
// l'une ou l'autre. Aucun ordre de mérite : les colonnes suivent l'ordre de vos communes.
import { useId, useState, useSyncExternalStore, type CSSProperties } from "react";
import { GlypheGrain, Plaque, releve as s } from "@/components/releve/primitives";
import { bilan, colonnesDe, confronter, dateCourte, enBref, logementsDe, type Bilan, type Piste } from "../modele5";
import { faireGeste, type Api5 } from "../CentreDecision5";
import { BoutonGeste, Fil, Section, Vignette, lier } from "../communs5";
import { Confrontation } from "../Confrontation";
import { Plan5 } from "../Plan5";
import v from "../v5.module.css";

const MAX = 4;
const requete = "(max-width: 759px)";
const abonner = (f: () => void) => { const m = window.matchMedia(requete); m.addEventListener("change", f); return () => m.removeEventListener("change", f); };
export const useEtroit = () => useSyncExternalStore(abonner, () => window.matchMedia(requete).matches, () => false);

export function Comparer5({ api }: { api: Api5 }) {
  const { etat, aller } = api;
  const id = useId();
  const etroit = useEtroit();
  const mode = etat.vue.mode ?? "logements";
  const communes = etat.communes.filter((c) => c.statut !== "ecartee");
  const candidats: Piste[] = mode === "communes"
    ? communes.map((commune) => ({ type: "commune", commune }))
    : communes.flatMap((c) => logementsDe(etat, c).filter((l) => l.statut !== "ecarte").map((logement) => ({ type: "logement" as const, logement })));
  const idDe = (p: Piste) => (p.type === "commune" ? `c:${p.commune.insee}` : p.logement.id);
  const sel = (etat.vue.selection ?? []).filter((x) => candidats.some((p) => idDe(p) === x)).slice(0, MAX);
  const choisis = candidats.filter((p) => sel.includes(idDe(p)));
  const [duel, setDuel] = useState<[number, number]>([0, 1]);
  const d0 = Math.min(duel[0], choisis.length - 1); const d1 = Math.min(duel[1], choisis.length - 1);
  const montres = etroit && choisis.length > 2 ? [choisis[d0]!, choisis[d1 === d0 ? (d0 + 1) % choisis.length : d1]!] : choisis;
  const choisir = (selection: string[], m = mode) => aller({ ecran: "comparer", mode: m, selection });
  const basculer = (x: string) => choisir(sel.includes(x) ? sel.filter((y) => y !== x) : sel.length >= MAX ? sel : [...sel, x]);

  const conf = montres.length >= 2 ? confronter(etat, montres) : null;
  const cols = montres.length >= 2 ? colonnesDe(etat, montres) : [];
  const bilans = cols.map((c) => bilan(etat, montres.find((p) => idDe(p) === c.id)!, etat.droits));
  const communesVues = [...new Set(montres.map((p) => (p.type === "commune" ? p.commune.insee : p.logement.commune.insee)))].map((i) => etat.communes.find((c) => c.insee === i)!).filter(Boolean);

  return (
    <>
      <Fil segments={[{ libelle: "Ma décision", aller: () => aller({ ecran: "ensemble" }) }, { libelle: "Comparer" }]} />
      <div className={v.tete}>
        <h1 className={`${s.titre} ${v.titreVue}`} tabIndex={-1} data-titre-vue>{mode === "communes" ? "Comparer vos communes" : "Comparer vos logements"}</h1>
        <p className={s.nuance}>Aucun classement : ce qui les distingue, ce que chacun demande, ce qui reste à savoir. Face à votre Projet (révision {etat.projet.revision} du {dateCourte(etat.projet.date)})</p>
      </div>

      <div className={v.modes} role="group" aria-label="Ce que vous comparez">
        {(["communes", "logements"] as const).map((m) => (
          <button key={m} type="button" className={v.mode} aria-pressed={mode === m}
            onClick={() => choisir(m === "communes" ? communes.map((c) => `c:${c.insee}`).slice(0, MAX) : (() => { const ls = communes.flatMap((c) => logementsDe(etat, c).filter((l) => l.statut !== "ecarte")); return ls.length <= MAX ? ls.map((l) => l.id) : []; })(), m)}>
            {m === "communes" ? "Vos communes" : "Vos logements"}
          </button>
        ))}
      </div>

      <div className={v.choix} role="group" aria-labelledby={`${id}-c`}>
        <p className={s.etiquette} id={`${id}-c`}>{mode === "communes" ? "Communes comparées" : "Logements comparés"} · deux à {MAX}</p>
        <div className={v.choixGroupes}>
          {mode === "communes" ? (
            <div className={v.choixGroupe}>{candidats.map((p) => <Puce key={idDe(p)} p={p} actif={sel.includes(idDe(p))} plein={sel.length >= MAX} basculer={basculer} />)}</div>
          ) : communes.map((c) => {
            const ps = candidats.filter((p) => p.type === "logement" && p.logement.commune.insee === c.insee);
            return ps.length ? (
              <div key={c.insee} className={v.choixGroupe}>
                <span className={v.choixCommune}><GlypheGrain grain="commune" taille={10} /> {c.nom}</span>
                {ps.map((p) => <Puce key={idDe(p)} p={p} actif={sel.includes(idDe(p))} plein={sel.length >= MAX} basculer={basculer} />)}
              </div>
            ) : null;
          })}
        </div>
        {sel.length >= MAX ? <p className={s.nuance}>Quatre au plus côte à côte : au-delà, les colonnes deviennent illisibles. Retirez-en un pour en ajouter un autre.</p> : null}
        {mode === "logements" && !candidats.length ? <p className={s.nuance}>Aucun logement gardé pour l&apos;instant. Vous pouvez déjà comparer vos communes.</p> : null}
      </div>

      {!conf ? (
        <p className={s.corps}>{mode === "communes" ? "Choisissez au moins deux communes." : "Choisissez au moins deux logements, dans une même commune ou dans plusieurs."}</p>
      ) : (
        <>
          {etroit && choisis.length > 2 ? (
            <div className={v.duel} role="group" aria-label="Les deux que vous voyez côte à côte">
              {[0, 1].map((i) => (
                <label key={i} className={v.duelChamp}>
                  <span className={v.sr}>{i === 0 ? "À gauche" : "À droite"}</span>
                  <select value={i === 0 ? d0 : d1} onChange={(e) => { const n = Number(e.target.value); setDuel(i === 0 ? [n, n === d1 ? d0 : d1] : [n === d0 ? d1 : d0, n]); }}>
                    {choisis.map((p, k) => <option key={idDe(p)} value={k}>{p.type === "commune" ? p.commune.nom : p.logement.libelle}</option>)}
                  </select>
                </label>
              ))}
            </div>
          ) : null}

          <Plaque etiquette="En bref" className={v.bref}>
            <p className={s.etiquette}>En bref</p>
            <div className={v.brefTexte}>{enBref(etat, montres).map((x, i) => <p key={i}>{lier(x)}</p>)}</div>
          </Plaque>

          <Section titre={mode === "communes" ? "Ce que chacune apporte, et ce qu'elle demande" : "Ce que chacun apporte, et ce qu'il demande"} id="bilan">
            <Bilans bilans={bilans} api={api} montres={montres} />
          </Section>

          {mode === "communes" || communesVues.length > 1 ? (
            <Section titre="Où elles sont" id="carte" sous="Un repère pour situer les communes l'une par rapport à l'autre. Le trajet réel se mesure depuis une adresse.">
              <Plan5 api={api} communes={communesVues} />
            </Section>
          ) : null}

          <Section titre="Le détail, condition par condition" id="detail"
            sous={mode === "communes" ? "Lu à l'échelle de la commune. La gare, le calme et le quartier se lisent aussi aux abords d'une adresse : pour un logement, la commune n'en donne qu'un repère." : "D'abord ce qui est lu à la commune (une seule case quand deux logements la partagent), puis ce qui se lit depuis l'adresse."}>
            <Confrontation colonnes={conf.colonnes} lignes={conf.lignes} projet={etat.projet} />
          </Section>

          <div className={v.ligneGestes}>
            {mode === "logements" && communesVues.length > 1 ? <button type="button" className={s.bouton} onClick={() => choisir(communesVues.map((c) => `c:${c.insee}`), "communes")}>Comparer leurs communes</button> : null}
            {mode === "communes" && montres.some((p) => p.type === "commune" && logementsDe(etat, p.commune).some((l) => l.statut !== "ecarte")) ? (
              <button type="button" className={s.bouton} onClick={() => { const ls = montres.flatMap((p) => (p.type === "commune" ? logementsDe(etat, p.commune).filter((l) => l.statut !== "ecarte").map((l) => l.id) : [])); choisir(ls.slice(0, MAX), "logements"); }}>Comparer leurs logements</button>
            ) : null}
          </div>
        </>
      )}
    </>
  );
}

function Puce({ p, actif, plein, basculer }: { p: Piste; actif: boolean; plein: boolean; basculer: (id: string) => void }) {
  const id = p.type === "commune" ? `c:${p.commune.insee}` : p.logement.id;
  return (
    <button type="button" className={v.puce} aria-pressed={actif} disabled={!actif && plein} onClick={() => basculer(id)} data-commune={p.type === "commune" || undefined}>
      {p.type === "commune" ? <><GlypheGrain grain="commune" taille={10} /> {p.commune.nom}</> : p.logement.libelle}
    </button>
  );
}

const RANGS: { cle: keyof Pick<Bilan, "apporte" | "accepte" | "ouvert" | "pasLu">; titre: string; genre: string }[] = [
  { cle: "apporte", titre: "Apporte", genre: "apporte" },
  { cle: "accepte", titre: "Demande d'accepter", genre: "accepte" },
  { cle: "ouvert", titre: "Pourrait changer l'arbitrage", genre: "inconnu" },
  { cle: "pasLu", titre: "Pas encore lu", genre: "manque" },
];

function Bilans({ bilans, api, montres }: { bilans: Bilan[]; api: Api5; montres: Piste[] }) {
  const piste = (id: string) => montres.find((p) => (p.type === "commune" ? `c:${p.commune.insee}` : p.logement.id) === id)!;
  return (
    <div className={v.bilans} style={{ "--cols": bilans.length } as CSSProperties}>
      <div className={v.bilanRang} data-tete>
        <span className={v.bilanCle} aria-hidden />
        {bilans.map((b) => {
          const p = piste(b.id);
          return (
            <div key={b.id} className={v.bilanNom}>
              {p.type === "logement" && p.logement.photo ? <Vignette logement={p.logement} taille={32} /> : null}
              <span className={s.pileSerree}>
                <button type="button" className={v.lien} onClick={() => api.aller(p.type === "commune" ? { ecran: "commune", id: b.id } : { ecran: "logement", id: b.id })}>{b.nom}</button>
                <span className={v.bilanSous}>{p.type === "commune" ? "la commune" : p.logement.commune.nom}</span>
                {b.bloque ? <span className={v.etiquetteBloque}>bloque, voir En bref</span> : b.aRevoir ? <span className={v.etiquetteRevoir}>lu sous votre ancien Projet</span> : null}
              </span>
            </div>
          );
        })}
      </div>
      {RANGS.map((r) => bilans.some((b) => b[r.cle].length) ? (
        <div key={r.cle} className={v.bilanRang} data-genre={r.genre}>
          <span className={v.bilanCle}>{r.titre}</span>
          {bilans.map((b) => (
            <div key={b.id} className={v.bilanCell}>
              <span className={v.sr}>{b.nom}, {r.titre.toLowerCase()} : </span>
              {b[r.cle].length ? (r.cle === "pasLu" ? <span className={v.nonLu}>{b[r.cle].join(", ")}</span> : <ul>{b[r.cle].map((x) => <li key={x}>{lier(x)}</li>)}</ul>) : <span className={v.nonLu}>rien</span>}
            </div>
          ))}
        </div>
      ) : null)}
      <div className={v.bilanRang} data-genre="geste">
        <span className={v.bilanCle}>Prochain geste</span>
        {bilans.map((b) => (
          <div key={b.id} className={v.bilanCell}>
            <BoutonGeste geste={b.geste} faire={faireGeste(api, piste(b.id))} apport={b.geste.commercial ? b.geste.court ?? null : null} />
          </div>
        ))}
      </div>
    </div>
  );
}
