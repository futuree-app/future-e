"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { relireLaPage } from "@/components/interaction/relire-la-page";
import type { CritereVue, OptionDePrecision, Portee } from "@/lib/decision/projet-criteres-vue";
import { releve as s, Registre } from "@/components/releve/primitives";
import type { PresentationDossier } from "@/components/releve/activation";
import d from "./autour-du-releve.module.css";
import { groupesDeCriteres } from "./criteres-groupes";

// LES CRITÈRES DU PROJET, UN PAR LIGNE (FUT-8, §8.1).
//
// Chaque ligne parle la langue du lecteur et porte au plus une action visible. Une condition sans
// compromis ne se pose jamais d'un clic : on montre d'abord, si elle manque, la précision qui permettra
// de la trancher, puis la phrase qui dit comment futur•e la comprendra, et ce qu'elle pourra en faire.
// Le serveur a tout préparé (vueCriteres) ; ce composant montre et renvoie `seen`.

const PORTEE_DITE: Record<Portee, string | null> = {
  trancher: null,
  adresse_seulement: "Elle sera tranchée dans les dossiers d'adresse.",
  apprecier: "futur•e pourra apprécier cette condition, sans pouvoir la trancher avec les données actuelles.",
  ne_pas_mesurer: "futur•e ne sait pas encore évaluer ce critère : la condition restera non évaluée.",
};

async function geste(corps: Record<string, unknown>): Promise<string | null> {
  try {
    const res = await fetch("/api/project/criterion", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(corps),
    });
    if (res.ok) return null;
    if (res.status === 409) return "Votre projet a changé entre-temps. Rechargez la page.";
    const data = (await res.json().catch(() => null)) as { error?: string } | null;
    return data?.error ?? "Enregistrement impossible pour le moment. Réessayez.";
  } catch {
    return "Enregistrement impossible pour le moment. Réessayez.";
  }
}

const lienAction = "font-mono text-[11px] tracking-[0.08em] uppercase text-accent hover:text-label transition-colors disabled:opacity-40";
const boutonChoix = "rounded-lg px-3.5 py-2 text-[13px] text-label bg-[var(--bg-elev-2)] border border-[var(--border-2)] hover:border-white/25 transition-colors disabled:opacity-40";
const boutonPrincipal = "rounded-lg px-4 py-2 text-[13px] font-semibold bg-accent text-canvas hover:opacity-90 transition-opacity disabled:opacity-40";

export function CriteresDuProjet({ criteres, presentation = "classique" }: { criteres: CritereVue[]; presentation?: PresentationDossier }) {
  if (criteres.length === 0) return null;
  if (presentation === "releve") return <CriteresReleve criteres={criteres} />;
  return (
    <ul className="mt-5 pt-5 border-t border-[var(--border-1)] space-y-4">
      {criteres.map((c) => <LigneCritere key={c.id} c={c} />)}
    </ul>
  );
}

// ════════════════════════════════════════════════════════════════════════════════════════════
// FUT-125 · LES MÊMES CRITÈRES SOUS LE RELEVÉ : TROIS GROUPES, DES GESTES DISCRETS.
//
// La recette lisait cinq fois « Inspiré de Brest : … », chacun suivi de « GARDER CE CRITÈRE · ÇA NE
// COMPTE PAS POUR MOI » en capitales orange : la liste se lisait comme une suite de boutons. Ici, l'origine
// se dit une fois, en tête de son groupe, et chaque critère garde ses gestes, en mots courts soulignés
// d'un filet. Leur nom accessible dit le critère (« Garder : une ville étudiante ») : un lecteur d'écran ne
// lit pas cinq « Garder » identiques. Aucun geste n'est retiré, aucun n'est nouveau ; l'ordre des
// critères dans chaque groupe est celui du serveur (`vueCriteres`).
// ════════════════════════════════════════════════════════════════════════════════════════════
function CriteresReleve({ criteres }: { criteres: CritereVue[] }) {
  return (
    <div className={d.groupes}>
      {groupesDeCriteres(criteres).map((g) => (
        <div key={g.cle} className={d.groupe}>
          <h3 id={`criteres-${g.cle}`} className={s.surtitre}>{g.titre}</h3>
          {g.note ? <p className={s.nuance}>{g.note}</p> : null}
          <ul className={s.liste} aria-labelledby={`criteres-${g.cle}`}>
            {g.criteres.map((c) => <LigneCritere key={c.id} c={c} releve sansOrigine={g.sansOrigine} />)}
          </ul>
        </div>
      ))}
    </div>
  );
}

function capitale(t: string): string {
  return t.charAt(0).toUpperCase() + t.slice(1);
}

function LigneCritere({ c, releve = false, sansOrigine = false }: {
  c: CritereVue;
  /** FUT-125 : la ligne se rend dans la grammaire du Relevé (mêmes états, mêmes gestes). */
  releve?: boolean;
  /** L'origine est dite par le groupe : la ligne montre le critère seul. */
  sansOrigine?: boolean;
}) {
  const router = useRouter();
  const [confirmation, setConfirmation] = useState(false);
  const [option, setOption] = useState<OptionDePrecision | null>(null);
  const [busy, setBusy] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [suggestionEcartee, setSuggestionEcartee] = useState(false);
  const [seuil, setSeuil] = useState("");

  // Ce que le lecteur doit voir avant de confirmer : la précision choisie l'emporte sur la lecture actuelle.
  const besoinDePrecision = (c.confirmation.options.length > 0 || c.confirmation.saisieSeuil != null) && option == null;

  // « Près de Nantes » : le lecteur saisit son seuil, puis choisit son unité.
  function choisirSeuil(cle: "km_vol_oiseau" | "min_voiture" | "min_pied", phraseUnite: string, porteeUnite: Portee) {
    const n = Number(seuil.replace(",", "."));
    if (!Number.isFinite(n) || n <= 0) {
      setErreur("Indiquez un nombre.");
      return;
    }
    setErreur(null);
    const definition = cle === "km_vol_oiseau"
      ? { kind: "distance_lieu" as const, metric: "vol_oiseau" as const, maxKm: n }
      : { kind: "temps_lieu" as const, mode: cle === "min_voiture" ? "car" as const : "walk" as const, maxMinutes: n };
    setOption({ label: `${n}`, definition, phrase: phraseUnite, portee: porteeUnite });
  }
  const phrase = option ? option.phrase : c.confirmation.phrase;
  const portee = option ? option.portee : c.confirmation.portee;

  async function envoyer(corps: Record<string, unknown>) {
    setBusy(true);
    setErreur(null);
    const e = await geste({ criterion: c.ref, ...corps });
    setBusy(false);
    if (e) {
      setErreur(e);
      return;
    }
    setConfirmation(false);
    setOption(null);
    relireLaPage(router);
  }

  function confirmer() {
    void envoyer({
      action: "confirmer", seen: c.seenEffectif,
      ...(option ? { definition: option.definition } : {}),
      // La phrase montrée, gardée pour l'audit (hors empreinte).
      ...(phrase ? { interpretation: phrase } : {}),
    });
  }

  if (releve) {
    const titre = sansOrigine ? capitale(c.court) : c.titre;
    // Le nom accessible d'un geste nomme son critère : « Garder : une ville étudiante ».
    const pour = (geste: string) => `${geste} : ${c.court}`;
    const gestes: ReactNode[] = [];
    if (c.etat === "inspire" && c.ancre) {
      gestes.push(
        <button key="garder" type="button" disabled={busy} className={s.action} aria-label={pour("Garder")} onClick={() => envoyer({ action: "adopter", seen: c.seenEffectif })}>Garder</button>,
        <button key="ecarter" type="button" disabled={busy} className={s.action} aria-label={pour("Écarter, ça ne compte pas pour moi")} onClick={() => envoyer({ action: "rejeter", seen: c.seenEffectif })}>Écarter</button>,
      );
    }
    if (c.etat === "rejete") {
      gestes.push(<button key="reprendre" type="button" disabled={busy} className={s.action} aria-label={pour("Reprendre")} onClick={() => envoyer({ action: "adopter", seen: c.seenEffectif })}>Reprendre</button>);
    }
    if (c.etat === "condition") {
      gestes.push(<button key="retirer" type="button" disabled={busy} className={s.action} aria-label={pour("Retirer la condition")} onClick={() => envoyer({ action: "retirer_condition" })}>Retirer la condition</button>);
    }
    if (c.etat === "a_revoir" && c.revoir) {
      if (c.seenEffectif) gestes.push(<button key="garder-condition" type="button" disabled={busy} className={s.action} aria-label={pour("Garder la condition")} onClick={() => setConfirmation(true)}>La garder</button>);
      gestes.push(<button key="retirer-condition" type="button" disabled={busy} className={s.action} aria-label={pour("Retirer la condition")} onClick={() => envoyer({ action: "retirer_condition" })}>La retirer</button>);
    }
    const suggestion = c.etat === "compris" && c.motFort && !suggestionEcartee && !confirmation;
    if (suggestion) {
      gestes.push(
        <button key="oui" type="button" className={s.action} aria-label={pour("En faire une condition sans compromis")} onClick={() => setConfirmation(true)}>En faire une condition</button>,
        <button key="non" type="button" className={s.action} aria-label={pour("Ne pas en faire une condition")} onClick={() => setSuggestionEcartee(true)}>Non</button>,
      );
    }
    const compris = c.etat === "compris" && (!c.motFort || suggestionEcartee) && !confirmation;
    if (compris) {
      gestes.push(<button key="condition" type="button" className={s.action} aria-label={pour("En faire une condition sans compromis")} onClick={() => setConfirmation(true)}>En faire une condition sans compromis</button>);
      // Un critère gardé reste retirable : le rejet retire l'adoption, et la ville ne le repropose plus.
      if (c.adopte) gestes.push(<button key="plus" type="button" disabled={busy} className={s.action} aria-label={pour("Écarter, ça ne compte plus pour moi")} onClick={() => envoyer({ action: "rejeter", seen: c.seenEffectif })}>Écarter</button>);
    }
    return (
      <li className={d.critere}>
        <div className={d.ligneCritere}>
          <div className={s.pileSerree}>
            {c.etat === "condition" ? (
              <>
                <Registre teinte="var(--reg-incompatibilite)" className={`${s.dense} ${s.encre}`}>{titre}</Registre>
                <p className={s.etiquette}>Condition sans compromis</p>
              </>
            ) : (
              <p className={`${s.dense} ${c.etat === "rejete" ? d.critereEcarte : s.encre}`}>{titre}</p>
            )}
            {c.etat === "a_revoir" && c.revoir ? <p className={`${s.nuance} ${s.encre}`}>{c.revoir}</p> : null}
            {suggestion ? <p className={s.nuance}>Vous avez écrit « {c.motFort} ». En faire une condition sans compromis ?</p> : null}
            {compris && c.interpretation ? (
              <details className={s.details}>
                <summary>Comment futur•e l&apos;interprète</summary>
                <p className={s.nuance} style={{ marginTop: 6 }}>{c.interpretation}</p>
              </details>
            ) : null}
          </div>
          {gestes.length > 0 ? <div className={d.gestes}>{gestes}</div> : null}
        </div>

        {confirmation ? (
          <div className={d.confirmation}>
            {besoinDePrecision ? (
              <>
                {c.confirmation.question ? <p className={`${s.dense} ${s.encre}`}>{c.confirmation.question}</p> : null}
                {c.confirmation.saisieSeuil ? (
                  <div className={d.reponses}>
                    <input
                      type="number" inputMode="decimal" min={1} value={seuil}
                      onChange={(e) => setSeuil(e.target.value)}
                      aria-label="Votre seuil" className={d.saisie}
                    />
                    {c.confirmation.saisieSeuil.unites.map((u) => (
                      <button key={u.cle} type="button" className={s.bouton} onClick={() => choisirSeuil(u.cle, u.phrase, u.portee)}>{u.libelle}</button>
                    ))}
                  </div>
                ) : (
                  <div className={d.reponses}>
                    {c.confirmation.options.map((o) => (
                      <button key={o.label} type="button" className={s.bouton} onClick={() => setOption(o)}>{o.label}</button>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <>
                {phrase ? <p className={`${s.dense} ${s.encre}`}>{phrase}</p> : null}
                {PORTEE_DITE[portee] ? <p className={s.nuance}>{PORTEE_DITE[portee]}</p> : null}
                <div className={d.reponses}>
                  <button type="button" disabled={busy} className={`${s.bouton} ${s.boutonMarque}`} onClick={confirmer}>
                    {phrase ? "Ça me convient" : "Confirmer"}
                  </button>
                </div>
              </>
            )}
            <div>
              <button type="button" className={s.action} onClick={() => { setConfirmation(false); setOption(null); setErreur(null); }}>Annuler</button>
            </div>
          </div>
        ) : null}

        {erreur ? <p className={d.incident} role="alert" style={{ marginTop: 8 }}>{erreur}</p> : null}
      </li>
    );
  }

  return (
    <li>
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <p className={`text-[15px] leading-[1.6] ${c.etat === "rejete" ? "text-ghost line-through decoration-1" : "text-label"}`}>
          {c.titre}
          {c.etat === "condition" ? <span className="text-accent"> · condition sans compromis</span> : null}
        </p>
      </div>

      {c.etat === "a_revoir" && c.revoir ? (
        <div className="mt-1.5">
          <p className="text-[13.5px] leading-[1.55]" style={{ color: "var(--reg-non-su)" }}>{c.revoir}</p>
          <div className="flex flex-wrap gap-4 mt-2">
            {c.seenEffectif ? (
              <button type="button" disabled={busy} className={lienAction} onClick={() => setConfirmation(true)}>
                La garder pour ce critère
              </button>
            ) : null}
            <button type="button" disabled={busy} className={lienAction} onClick={() => envoyer({ action: "retirer_condition" })}>
              La retirer
            </button>
          </div>
        </div>
      ) : null}

      {c.etat === "condition" ? (
        <button type="button" disabled={busy} className={`${lienAction} mt-1.5`} onClick={() => envoyer({ action: "retirer_condition" })}>
          Retirer la condition
        </button>
      ) : null}

      {c.etat === "inspire" && c.ancre ? (
        <div className="flex flex-wrap gap-4 mt-1.5">
          <button type="button" disabled={busy} className={lienAction} onClick={() => envoyer({ action: "adopter", seen: c.seenEffectif })}>
            Garder ce critère
          </button>
          <button type="button" disabled={busy} className={lienAction} onClick={() => envoyer({ action: "rejeter", seen: c.seenEffectif })}>
            Ça ne compte pas pour moi
          </button>
        </div>
      ) : null}

      {c.etat === "rejete" ? (
        <div className="flex flex-wrap items-baseline gap-4 mt-1">
          <p className="text-[13.5px] text-ghost">Écarté de votre projet.</p>
          <button type="button" disabled={busy} className={lienAction} onClick={() => envoyer({ action: "adopter", seen: c.seenEffectif })}>
            Le reprendre
          </button>
        </div>
      ) : null}

      {c.etat === "compris" && c.motFort && !suggestionEcartee && !confirmation ? (
        <div className="mt-1.5">
          <p className="text-[13.5px] leading-[1.55] text-muted">
            Vous avez écrit « {c.motFort} ». En faire une condition sans compromis ?
          </p>
          <div className="flex flex-wrap gap-4 mt-2">
            <button type="button" className={lienAction} onClick={() => setConfirmation(true)}>Oui</button>
            <button type="button" className={lienAction} onClick={() => setSuggestionEcartee(true)}>Non</button>
          </div>
        </div>
      ) : null}

      {c.etat === "compris" && (!c.motFort || suggestionEcartee) && !confirmation ? (
        <div className="flex flex-wrap items-center gap-4 mt-1.5">
          {c.interpretation ? (
            <details className="text-[13px] text-muted">
              <summary className="cursor-pointer text-ghost hover:text-muted">Comment futur•e l&apos;interprète</summary>
              <p className="mt-1.5 leading-[1.55]">{c.interpretation}</p>
            </details>
          ) : null}
          <button type="button" className={lienAction} onClick={() => setConfirmation(true)}>
            En faire une condition sans compromis
          </button>
          {/* Un critère gardé reste retirable : le rejet retire l'adoption, et la ville ne le repropose plus. */}
          {c.adopte ? (
            <button type="button" disabled={busy} className={lienAction} onClick={() => envoyer({ action: "rejeter", seen: c.seenEffectif })}>
              Ça ne compte plus pour moi
            </button>
          ) : null}
        </div>
      ) : null}

      {confirmation ? (
        <div className="mt-3 rounded-xl border border-[var(--border-2)] p-4">
          {besoinDePrecision ? (
            <>
              {c.confirmation.question ? <p className="text-[14px] leading-[1.6] text-label mb-3">{c.confirmation.question}</p> : null}
              {c.confirmation.saisieSeuil ? (
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="number" inputMode="decimal" min={1} value={seuil}
                    onChange={(e) => setSeuil(e.target.value)}
                    aria-label="Votre seuil"
                    className="w-24 rounded-lg px-3 py-2 text-[14px] text-label bg-[var(--bg-deep)] border border-[var(--border-2)]"
                  />
                  {c.confirmation.saisieSeuil.unites.map((u) => (
                    <button key={u.cle} type="button" className={boutonChoix} onClick={() => choisirSeuil(u.cle, u.phrase, u.portee)}>{u.libelle}</button>
                  ))}
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {c.confirmation.options.map((o) => (
                    <button key={o.label} type="button" className={boutonChoix} onClick={() => setOption(o)}>{o.label}</button>
                  ))}
                </div>
              )}
            </>
          ) : (
            <>
              {phrase ? <p className="text-[14px] leading-[1.6] text-label">{phrase}</p> : null}
              {PORTEE_DITE[portee] ? <p className="text-[13.5px] leading-[1.55] text-muted mt-1.5">{PORTEE_DITE[portee]}</p> : null}
              <div className="flex flex-wrap gap-3 mt-3">
                <button type="button" disabled={busy} className={boutonPrincipal} onClick={confirmer}>
                  {phrase ? "Ça me convient" : "Confirmer"}
                </button>
              </div>
            </>
          )}
          <button type="button" className="mt-3 text-[13px] text-muted hover:text-label" onClick={() => { setConfirmation(false); setOption(null); setErreur(null); }}>
            Annuler
          </button>
        </div>
      ) : null}

      {erreur ? <p className="text-danger text-[13px] mt-2">{erreur}</p> : null}
    </li>
  );
}
