"use client";

// FUT-75 · APERÇU DE CONTRÔLE (DEV). Q1 : le vrai `BoutonAction`, piloté par les vraies règles
// (`suivantAction`, `issueDepuisReponse`) et le contrat d'`actualiser` rejoué par une route de dev.
// Q2 : le sélecteur élastique à trois durées, pour choisir à l'usage (140, 180, 220 ms).
import { useRef, useState } from "react";
import { BoutonAction } from "@/components/interaction/BoutonAction";
import { issueDepuisReponse, PHRASE_ECHEC, suivantAction, type EtatAction, type IssueAction } from "@/lib/interaction/etat-action";
import { SelecteurDuree } from "./SelecteurDuree";

const ISSUES = [["abouti", "version livrée"], ["en_cours", "déjà en cours"], ["projet", "409 projet manquant"], ["contexte", "503 contexte indisponible"], ["generation", "502 génération"]] as const;
const DELAIS = [["150", "0,15 s"], ["1600", "1,6 s"], ["6000", "6 s"]] as const;

function Choix({ titre, valeurs, courant, choisir }: { titre: string; valeurs: readonly (readonly [string, string])[]; courant: string; choisir: (v: string) => void }) {
  return (
    <fieldset style={{ border: 0, padding: 0, margin: 0, display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
      <legend style={{ float: "left", marginRight: 8, fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--ghost)" }}>{titre}</legend>
      {valeurs.map(([v, n]) => <button key={v} type="button" aria-pressed={v === courant} onClick={() => choisir(v)}
        style={{ font: "12px var(--font-mono)", padding: "5px 9px", borderRadius: 3, cursor: "pointer", color: v === courant ? "var(--fg-hi)" : "var(--fg-3)", background: "transparent", border: `1px solid ${v === courant ? "var(--fg-hi)" : "var(--border-2)"}` }}>{n}</button>)}
    </fieldset>
  );
}

export function Apercu() {
  const [issue, setIssue] = useState("abouti");
  const [delai, setDelai] = useState("1600");
  const [etat, setEtat] = useState<EtatAction>("repos");
  const [derniere, setDerniere] = useState<IssueAction | null>(null);
  const fin = useRef<number | null>(null);
  const agir = async () => {
    if (fin.current) window.clearTimeout(fin.current);
    setEtat((e) => suivantAction(e, { type: "appui" }));
    let i: IssueAction;
    try {
      const res = await fetch(`/dev/motion/api/actualiser?issue=${issue}&delai=${delai}`, { method: "POST" });
      i = issueDepuisReponse({ ok: res.ok, status: res.status, corps: await res.json().catch(() => null) });
    } catch { i = { type: "echec", motif: "reseau" }; }
    setDerniere(i);
    setEtat((e) => suivantAction(e, { type: "issue", issue: i }));
    if (i.type === "livree") fin.current = window.setTimeout(() => setEtat((e) => suivantAction(e, { type: "fin_confirmation" })), 2600);
  };
  const compteRendu = etat === "attente" ? "Mise à jour demandée, en attente de la réponse. L'analyse affichée reste consultable."
    : etat === "succes" && derniere?.type === "livree" ? `Version ${derniere.version} établie. La précédente reste consultable.`
      : etat === "echec" && derniere?.type === "echec" ? `${PHRASE_ECHEC[derniere.motif]} L'analyse affichée reste celle de votre achat.`
        : etat === "ailleurs" ? "Une mise à jour de ce dossier est déjà en cours."
          : derniere?.type === "livree" ? `Dernière mise à jour : version ${derniere.version}.` : "Votre projet a changé depuis cette analyse.";
  return (
    <div style={{ display: "grid", gap: 56 }}>
      <section id="q1" style={{ display: "grid", gap: 16 }}>
        <h2 style={{ fontSize: 22, fontWeight: 600, color: "var(--fg-hi)", margin: 0 }}>Q1 · Mettre à jour l&apos;analyse (composant prêt, non raccordé)</h2>
        <p style={{ margin: 0, color: "var(--fg-3)", fontSize: 14, lineHeight: 1.55 }}>Le vrai composant `BoutonAction`, piloté par les règles de production et le contrat réel de la route `actualiser`, rejoué sans rien écrire. Son raccordement à `AnalyseAncienProjet` attend la fusion de FUT-10.</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 20px" }}>
          <Choix titre="Réponse" valeurs={ISSUES} courant={issue} choisir={setIssue} />
          <Choix titre="Délai" valeurs={DELAIS} courant={delai} choisir={setDelai} />
        </div>
        <div style={{ padding: "16px 18px", borderRadius: 12, border: "1px solid var(--border-1)", borderLeft: "2px solid var(--reg-non-su)", background: "var(--bg-elev)" }}>
          <BoutonAction etat={etat} onAppui={agir} compteRendu={compteRendu}
            libelles={{ repos: "Mettre à jour l'analyse", attente: "Mise à jour en cours", succes: "Analyse mise à jour", echec: "Réessayer la mise à jour", ailleurs: "Mise à jour déjà en cours" }} />
        </div>
      </section>
      <section id="q2" style={{ display: "grid", gap: 16 }}>
        <h2 style={{ fontSize: 22, fontWeight: 600, color: "var(--fg-hi)", margin: 0 }}>Q2 · Sélecteur élastique : trois durées</h2>
        <p style={{ margin: 0, color: "var(--fg-3)", fontSize: 14, lineHeight: 1.55 }}>Départ immédiat au clic, bord de tête en avance de 25 % du trajet, pose sur le micro-ressort sans traînée. Retenu : 180 ms.</p>
        {[140, 180, 220].map((d) => <SelecteurDuree key={d} duree={d} />)}
      </section>
    </div>
  );
}
