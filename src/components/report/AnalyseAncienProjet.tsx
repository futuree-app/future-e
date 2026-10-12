"use client";

import { startTransition, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { BoutonAction, type LibellesAction } from "@/components/interaction/BoutonAction";
import {
  compteRenduAction, gesteAppui, issueDepuisReponse, LECTURE_CONFIRMATION_MS, suivantAction,
  type EtatAction, type IssueAction,
} from "@/lib/interaction/etat-action";

// ════════════════════════════════════════════════════════════════════════════════════════════
// « CETTE ANALYSE RÉPOND AU PROJET QUE VOUS AVIEZ. »
//
// ── POURQUOI LE DIRE, ET NE PAS RECALCULER SEUL ──────────────────────────────────────────────
// Le dossier est figé au jour de l'achat, projet compris. Quand le lecteur modifie ses priorités,
// deux réponses sont fausses : réécrire son analyse sans le dire, ce qui effacerait une décision
// sur laquelle il a peut-être déjà agi, et se taire, ce qui lui laisse croire que ce qu'il lit
// répond à ce qu'il demande aujourd'hui.
//
// La doctrine du vault tranche : une pièce qu'il DÉPOSE (un diagnostic) recalcule seule, parce
// qu'il attend qu'elle compte ; un projet qu'il change se demande, parce que l'analyse achetée
// répondait à une autre question. C'est donc un bouton, jamais un effet de bord.
//
// ── CE QUE LA MISE À JOUR PRODUIT ────────────────────────────────────────────────────────────
// Une version n+1. La précédente reste en base et lisible : c'est ce sur quoi il a décidé.
// ════════════════════════════════════════════════════════════════════════════════════════════

// ── DEUX RAISONS, UN SEUL GESTE (24/09/2026) ─────────────────────────────────────────────────
// Le voisinage se rafraîchit désormais en arrière-plan. Quand il est plus récent que la version
// servie, la même mise à jour est proposée, pour une autre raison : ce n'est pas le lecteur qui a
// changé, c'est ce que futur•e sait de son adresse. La version figée ne bouge pas pour autant.

// ── LE GESTE (FUT-93, prototype Q1 de FUT-75) ────────────────────────────────────────────────
// Un seul bouton qui se transforme : il s'enfonce à la pression, devient l'attente (l'emblème ne
// paraît qu'après 300 ms), puis la confirmation ou l'échec. L'état n'avance que par la réponse
// RÉELLE de la route (`issueDepuisReponse`, `suivantAction`) : « en_cours » n'est jamais un succès,
// et « Analyse mise à jour » ne s'affiche qu'avec une version annoncée `abouti`. L'analyse affichée
// ne bouge pas pendant l'attente ni après un échec ; la page ne la remplace qu'après la confirmation.
const LIBELLES: LibellesAction = {
  repos: "Mettre à jour l'analyse",
  attente: "Mise à jour en cours",
  succes: "Analyse mise à jour",
  echec: "Réessayer la mise à jour",
  ailleurs: "Relire la page",
};

export function AnalyseAncienProjet(
  { insee, scopeKey, raison = "projet" }: { insee: string; scopeKey: string; raison?: "projet" | "lien" | "voisinage" },
) {
  const [etat, setEtat] = useState<EtatAction>("repos");
  const [issue, setIssue] = useState<IssueAction | null>(null);
  const router = useRouter();

  // UNE RÉPONSE NE VAUT QUE POUR LE DOSSIER QUI L'A DEMANDÉE. Si la portée change, ou si le bloc
  // disparaît, avant la réponse, celle-ci est ignorée : rien ne se confirme sur un autre dossier.
  const cle = `${insee}|${scopeKey}`;
  const [clePrecedente, setClePrecedente] = useState(cle);
  if (clePrecedente !== cle) {
    setClePrecedente(cle);
    setEtat("repos");
    setIssue(null);
  }
  const cleCourante = useRef(cle);
  const enVol = useRef(false);
  const minuterie = useRef<number | null>(null);
  useEffect(() => { cleCourante.current = cle; }, [cle]);
  useEffect(() => () => {
    cleCourante.current = "";
    if (minuterie.current) window.clearTimeout(minuterie.current);
  }, []);

  const mettreAJour = async () => {
    const geste = gesteAppui(etat);
    // Double clic, ou appui pendant la confirmation : une seule demande à la fois.
    if (geste === "ignorer" || enVol.current) return;
    // Une mise à jour tourne déjà : on relit la page, on ne relance pas une génération.
    if (geste === "relire") { startTransition(() => router.refresh()); return; }
    enVol.current = true;
    const demande = cle;
    setIssue(null);
    setEtat((e) => suivantAction(e, { type: "appui" }));
    let i: IssueAction;
    try {
      const res = await fetch("/api/dossier/actualiser", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ insee, scopeKey }),
      });
      // UNE GÉNÉRATION DÉJÀ EN COURS N'EST PAS UNE GÉNÉRATION ABOUTIE (revue du 12/08/2026).
      i = issueDepuisReponse({ ok: res.ok, status: res.status, corps: await res.json().catch(() => null) });
    } catch {
      // ON NE PROMET PAS QUE ÇA MARCHERA LA PROCHAINE FOIS. L'ancienne version reste affichée, et
      // c'est le comportement juste : elle est la décision vendue, pas un pis-aller.
      i = { type: "echec", motif: "reseau" };
    }
    enVol.current = false;
    if (cleCourante.current !== demande) return;
    setIssue(i);
    setEtat((e) => suivantAction(e, { type: "issue", issue: i }));
    // La version nouvelle existe : la confirmation se lit, puis la page la sert. Le bloc reste confirmé
    // jusqu'à ce que la page relue le retire (le dossier n'a alors plus de raison de le proposer).
    if (i.type === "livree") {
      minuterie.current = window.setTimeout(() => startTransition(() => router.refresh()), LECTURE_CONFIRMATION_MS);
    }
  };

  return (
    <div
      className="glass rounded-xl p-4 mb-3.5 flex flex-wrap items-center gap-x-4 gap-y-2"
      style={{ borderLeft: "2px solid var(--reg-non-su)" }}
    >
      <p className="text-[13px] text-muted flex-1 min-w-[260px]">
        {raison === "projet"
          ? <>Votre projet a changé depuis cette analyse. Ce que vous lisez répond au projet que vous aviez au moment de l&apos;achat.</>
          : raison === "lien"
            // FUT-10 : la relation ou l'objectif déclarés pour ce bien ont changé. La version affichée
            // reste datée et consultable ; la suivante se demande.
            ? <>Vous avez modifié votre lien avec ce bien ou la raison de votre analyse. Ce que vous lisez repose sur ce que vous aviez déclaré au moment de cette analyse.</>
            : <>Une version plus récente de futur•e est disponible pour ce dossier. Ce que vous lisez reste l&apos;analyse telle qu&apos;elle a été établie.</>}
      </p>
      <BoutonAction etat={etat} onAppui={mettreAJour} libelles={LIBELLES} />
      {/* Toujours présent, vide au repos : une région annoncée doit exister avant que son texte change. */}
      <p className="text-[12.5px] text-muted w-full empty:-mt-2" aria-live="polite">
        {compteRenduAction(etat, issue)}
      </p>
    </div>
  );
}
