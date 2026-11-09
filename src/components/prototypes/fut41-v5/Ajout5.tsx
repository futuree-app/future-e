"use client";
// AJOUTER · une commune (« et pourquoi pas Angers ? ») ou un logement (une adresse, un lien, le texte
// d'une annonce). Les deux entrées se valent : un logement ajouté par son adresse emmène sa commune.
// Le texte collé est lu sur l'appareil ; chaque valeur proposée montre l'extrait qui la fonde et ne
// s'enregistre que confirmée. futur•e n'ouvre jamais le lien d'une annonce.
import { useId, useState } from "react";
import { Selecteur, releve as s } from "@/components/releve/primitives";
import { extraireAnnonce, siteDe, urlAnnonceValide, type ExtraitAnnonce, type Logement, type NatureAnnonce } from "./modele5";
import { AUJOURDHUI, COMMUNES } from "./scenarios5";
import type { Api5 } from "./CentreDecision5";
import v from "./v5.module.css";

/** La commune reconnue dans une adresse (prototype : trois communes connues). */
const communeDansAdresse = (a: string) => COMMUNES.find((c) => new RegExp(`\\b${c.nom}\\b`, "i").test(a));

export function Ajout5({ api, depart, fermer }: { api: Api5; depart: "commune" | "logement"; fermer: () => void }) {
  const id = useId();
  const [quoi, setQuoi] = useState(depart);
  const absentes = COMMUNES.filter((c) => !api.etat.communes.some((x) => x.insee === c.insee && x.statut !== "ecartee"));
  const [commune, setCommune] = useState(absentes[0]?.insee ?? COMMUNES[0]!.insee);
  const [communeLog, setCommuneLog] = useState("");
  const [libelle, setLibelle] = useState("");
  const [adresse, setAdresse] = useState("");
  const [url, setUrl] = useState("");
  const [texte, setTexte] = useState("");
  const [extrait, setExtrait] = useState<ExtraitAnnonce | null>(null);
  const [garde, setGarde] = useState({ montant: true, nature: true, surface: true, pieces: true });
  const [erreur, setErreur] = useState<string | null>(null);
  const reconnue = adresse ? communeDansAdresse(adresse) : undefined;
  const insee = reconnue?.insee ?? communeLog;

  const ajouter = () => {
    if (quoi === "commune") { api.envoyer({ type: "ajouter_commune", insee: commune }); fermer(); return; }
    if (!insee) { setErreur("Dites dans quelle commune se trouve ce logement (Nantes, Rennes ou Angers dans le prototype)."); return; }
    if (url && !urlAnnonceValide(url)) { setErreur("Ce lien doit commencer par http:// ou https://."); return; }
    const c = COMMUNES.find((x) => x.insee === insee)!;
    const x = extrait ?? {};
    const nomPropose = libelle.trim() || (adresse.trim() ? adresse.trim().replace(/,.*$/, "") : `Logement à ${c.nom}`);
    const l: Logement = {
      id: `ajout-${api.etat.logements.length + 1}`, libelle: nomPropose, commune: { insee: c.insee, nom: c.nom },
      adresse: adresse.trim() ? (reconnue ? adresse.trim() : `${adresse.trim()}, ${c.nom}`) : null,
      annonce: { url: url || null, site: url ? siteDe(url) : null, nature: x.nature && garde.nature ? x.nature.valeur : null as NatureAnnonce, montant: x.montant && garde.montant ? x.montant.valeur : null, surface: x.surface && garde.surface ? x.surface.valeur : null, pieces: x.pieces && garde.pieces ? x.pieces.valeur : null },
      statut: "a_etudier", ajouteLe: AUJOURDHUI, visiteLe: null, droit: "aucun", position: null, photo: null, analyses: [],
      journal: [{ date: AUJOURDHUI, type: "ajoute", texte: `Ajouté${adresse ? "" : ", sans adresse exacte"}.` }], observations: [], verifications: [],
    };
    api.envoyer({ type: "ajouter_logement", logement: l });
  };

  return (
    <form className={v.ajout} onSubmit={(e) => { e.preventDefault(); ajouter(); }} aria-labelledby={`${id}-t`}>
      <p className={v.sectionTitre} id={`${id}-t`}>Ajouter</p>
      <Selecteur id={`${id}-q`} question="Vous gardez" valeur={quoi} onChoisir={(q) => { setQuoi(q); setErreur(null); }} options={[{ valeur: "commune", libelle: "une commune" }, { valeur: "logement", libelle: "un logement" }]} />
      {quoi === "commune" ? (
        absentes.length ? (
          <label className={v.champ}>
            <span className={s.etiquette}>Commune (trois communes dans le prototype)</span>
            <select value={absentes.some((c) => c.insee === commune) ? commune : absentes[0]!.insee} onChange={(e) => setCommune(e.target.value)}>
              {absentes.map((c) => <option key={c.insee} value={c.insee}>{c.nom}</option>)}
            </select>
            <span className={s.nuance}>Elle arrive avec ses repères gratuits. Rien n&apos;est conclu pour votre Projet tant qu&apos;elle n&apos;est pas lue.</span>
          </label>
        ) : <p className={s.nuance}>Les trois communes du prototype sont déjà gardées.</p>
      ) : (
        <div className={v.ajoutGrille}>
          <label className={v.champ}><span className={s.etiquette}>Adresse exacte, si vous la connaissez</span><input value={adresse} onChange={(e) => setAdresse(e.target.value)} maxLength={160} placeholder="12 rue des Lilas, Nantes" />
            {reconnue ? <span className={s.nuance}>Commune reconnue : {reconnue.nom}.</span> : null}
          </label>
          {!reconnue ? (
            <label className={v.champ}><span className={s.etiquette}>Commune</span>
              <select value={communeLog} onChange={(e) => setCommuneLog(e.target.value)}><option value="">Choisir</option>{COMMUNES.map((c) => <option key={c.insee} value={c.insee}>{c.nom}</option>)}</select>
            </label>
          ) : null}
          <label className={v.champ}><span className={s.etiquette}>Un nom pour le retrouver (facultatif)</span><input value={libelle} onChange={(e) => setLibelle(e.target.value)} maxLength={80} placeholder="T3 avec balcon" /></label>
          <label className={v.champ}><span className={s.etiquette}>Lien de l&apos;annonce (facultatif)</span><input type="url" value={url} onChange={(e) => setUrl(e.target.value)} maxLength={500} placeholder="https://…" /><span className={s.nuance}>Gardé pour vous ; futur•e n&apos;ouvre pas la page.</span></label>
          <div className={`${v.champ} ${v.pleineLargeur}`}>
            <label className={s.etiquette} htmlFor={`${id}-txt`}>Texte de l&apos;annonce (facultatif)</label>
            <textarea id={`${id}-txt`} rows={3} value={texte} onChange={(e) => setTexte(e.target.value)} maxLength={4000} placeholder="Collez la description : futur•e propose des valeurs, vous les confirmez." />
            <div className={v.ligneGestes}>
              <button type="button" className={s.action} disabled={!texte.trim()} onClick={() => setExtrait(extraireAnnonce(texte))}>Lire ce texte</button>
              <button type="button" className={s.action} onClick={() => setTexte("Appartement T3 de 66 m², à vendre 305 000 €, proche tramway, 2e étage avec balcon.")}>Essayer avec un exemple</button>
            </div>
            {extrait ? (
              Object.keys(extrait).length ? (
                <ul className={v.extrait} aria-label="Valeurs proposées, à confirmer">
                  {(["montant", "nature", "surface", "pieces"] as const).filter((k) => extrait[k]).map((k) => (
                    <li key={k}>
                      <label><input type="checkbox" checked={garde[k]} onChange={(e) => setGarde((g) => ({ ...g, [k]: e.target.checked }))} /> {k === "montant" ? `Montant : ${extrait.montant!.valeur} €` : k === "nature" ? `Annonce ${extrait.nature!.valeur === "vente" ? "à vendre" : "à louer"}` : k === "surface" ? `Surface : ${extrait.surface!.valeur} m²` : `${extrait.pieces!.valeur} pièces`}</label>
                      <span className={v.extraitSource}>lu dans « {extrait[k]!.extrait} »</span>
                    </li>
                  ))}
                </ul>
              ) : <p className={s.nuance}>Rien de reconnaissable dans ce texte : rien n&apos;est deviné.</p>
            ) : null}
          </div>
        </div>
      )}
      {erreur ? <p className={v.erreur} role="alert">{erreur}</p> : null}
      <div className={v.ligneGestes}>
        <button type="submit" className={`${s.bouton} ${s.boutonMarque}`} disabled={quoi === "commune" && !absentes.length}>{quoi === "commune" ? "Garder cette commune" : "Garder ce logement"}</button>
        <button type="button" className={s.action} onClick={fermer}>Annuler</button>
      </div>
      <p className={s.nuance}>Garder une commune ou un logement ne coûte rien et n&apos;ouvre aucune analyse.</p>
    </form>
  );
}
