"use client";
// AJOUTER UNE PISTE · une commune (« et pourquoi pas Angers ? ») ou un logement (une annonce, un lien,
// quelques mots). Le texte collé est lu localement ; chaque valeur proposée montre l'extrait qui la
// fonde et ne s'enregistre que confirmée. Aucun lien d'annonce n'est ouvert par futur•e.
import { useId, useState } from "react";
import { Selecteur, releve as s } from "@/components/releve/primitives";
import { extraireAnnonce, siteDe, urlAnnonceValide, type ExtraitAnnonce, type Logement, type NatureAnnonce } from "./modele41";
import { AUJOURDHUI, COMMUNES } from "./scenarios41";
import type { Api41 } from "./CentreDecision41";
import v from "./v41.module.css";

export function Ajout41({ api, fermer }: { api: Api41; fermer: () => void }) {
  const id = useId();
  const [quoi, setQuoi] = useState<"logement" | "commune">("logement");
  const [commune, setCommune] = useState(COMMUNES[0]!.insee);
  const [libelle, setLibelle] = useState("");
  const [adresse, setAdresse] = useState("");
  const [url, setUrl] = useState("");
  const [texte, setTexte] = useState("");
  const [extrait, setExtrait] = useState<ExtraitAnnonce | null>(null);
  const [garde, setGarde] = useState({ montant: true, nature: true, surface: true, pieces: true });
  const [erreur, setErreur] = useState<string | null>(null);
  const absentes = COMMUNES.filter((c) => !api.etat.communes.some((x) => x.insee === c.insee));

  const ajouter = () => {
    if (quoi === "commune") { api.envoyer({ type: "ajouter_commune", insee: commune }); fermer(); return; }
    if (!libelle.trim()) { setErreur("Donnez un nom à ce logement, par exemple « T3 près de la gare »."); return; }
    if (url && !urlAnnonceValide(url)) { setErreur("Ce lien doit commencer par http:// ou https://."); return; }
    const c = COMMUNES.find((x) => x.insee === commune)!;
    const x = extrait ?? {};
    const l: Logement = {
      id: `ajout-${api.etat.logements.length + 1}`, libelle: libelle.trim(), commune: { insee: c.insee, nom: c.nom },
      adresse: adresse.trim() ? `${adresse.trim()}, ${c.nom}` : null,
      annonce: { url: url || null, site: url ? siteDe(url) : null, nature: x.nature && garde.nature ? x.nature.valeur : null as NatureAnnonce, montant: x.montant && garde.montant ? x.montant.valeur : null, surface: x.surface && garde.surface ? x.surface.valeur : null, pieces: x.pieces && garde.pieces ? x.pieces.valeur : null },
      statut: "a_etudier", ajouteLe: AUJOURDHUI, visiteLe: null, droit: "aucun", position: null, photo: null, analyses: [],
      journal: [{ date: AUJOURDHUI, type: "ajoute", texte: `Ajouté${adresse ? "" : ", sans adresse exacte"}.` }], observations: [], verifications: [],
    };
    api.envoyer({ type: "ajouter_logement", logement: l });
  };

  return (
    <form className={v.ajout} onSubmit={(e) => { e.preventDefault(); ajouter(); }} aria-labelledby={`${id}-t`}>
      <p className={v.sectionTitre} id={`${id}-t`}>Ajouter une piste</p>
      <Selecteur id={`${id}-q`} question="Vous envisagez" valeur={quoi} onChoisir={setQuoi} options={[{ valeur: "logement", libelle: "un logement" }, { valeur: "commune", libelle: "une commune" }]} />
      {quoi === "commune" ? (
        absentes.length ? (
          <label className={v.champ}>
            <span className={s.etiquette}>Commune (trois communes dans le prototype)</span>
            <select value={absentes.some((c) => c.insee === commune) ? commune : absentes[0]!.insee} onChange={(e) => setCommune(e.target.value)}>
              {absentes.map((c) => <option key={c.insee} value={c.insee}>{c.nom}</option>)}
            </select>
            <span className={s.nuance}>Elle arrive en lecture gratuite : des repères nationaux, rien de conclu pour votre Projet tant qu&apos;elle n&apos;est pas examinée.</span>
          </label>
        ) : <p className={s.nuance}>Les trois communes du prototype sont déjà dans vos pistes.</p>
      ) : (
        <div className={v.ajoutGrille}>
          <label className={v.champ}><span className={s.etiquette}>Nom pour vous en souvenir</span><input value={libelle} onChange={(e) => setLibelle(e.target.value)} maxLength={80} placeholder="T3 près de la gare" /></label>
          <label className={v.champ}><span className={s.etiquette}>Commune</span>
            <select value={commune} onChange={(e) => setCommune(e.target.value)}>{COMMUNES.map((c) => <option key={c.insee} value={c.insee}>{c.nom}</option>)}</select>
          </label>
          <label className={v.champ}><span className={s.etiquette}>Adresse exacte (facultatif)</span><input value={adresse} onChange={(e) => setAdresse(e.target.value)} maxLength={160} placeholder="Si l'annonce la donne" /></label>
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
        <button type="submit" className={`${s.bouton} ${s.boutonMarque}`} disabled={quoi === "commune" && !absentes.length}>{quoi === "commune" ? "Ajouter cette commune" : "Garder ce logement"}</button>
        <button type="button" className={s.action} onClick={fermer}>Annuler</button>
      </div>
    </form>
  );
}
