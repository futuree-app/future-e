"use client";

import { useEffect, useEffectEvent, useRef, useState, useSyncExternalStore, useTransition } from "react";
import { useRouter } from "next/navigation";
import { BoutonAction, type LibellesAction } from "@/components/interaction/BoutonAction";
import {
  cleMemoireAffichage, compteRenduAction, DELAI_RELECTURE_MS, etapeAffichage, gesteAppui, issueDepuisReponse,
  LECTURE_CONFIRMATION_MS, lireMemoireAffichage, suivantAction, versionAtteinte,
  type EtatAction, type IssueAction, type SuiviAffichage,
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
// RÉELLE de la route (`issueDepuisReponse`, `suivantAction`) : « en_cours » n'est jamais un succès.
//
// ── LIVRÉE N'EST PAS AFFICHÉE (FUT-93, test réel du 12/10/2026) ──────────────────────────────────
// En production, la v3 était prête en base, la route l'avait annoncée, la page avait été relue... et
// l'écran gardait la v2 sous « Analyse mise à jour ». Désormais :
//   « Nouvelle analyse prête »        le serveur a annoncé la version N (`abouti`) ;
//   « Affichage de votre analyse… »    la page relit la version prête ; l'ancienne reste lisible ;
//   la nouvelle analyse, avec sa date  constaté sur la version SERVIE (`versionServie` >= N), jamais
//                                      supposé d'après un rafraîchissement, une date ou un bandeau ;
//   « Afficher la nouvelle analyse »   la version est prête mais la page n'a pas pu l'afficher.
// La récupération est bornée (`etapeAffichage`) : une seconde relecture au plus, puis un seul
// rechargement complet de la même adresse. Aucune de ces étapes ne renvoie de requête à la route.
const LIBELLES: LibellesAction = {
  repos: "Mettre à jour l'analyse",
  attente: "Mise à jour en cours",
  succes: "Nouvelle analyse prête",
  affichage: "Affichage de votre analyse…",
  affichee: "Nouvelle analyse affichée",
  non_affichee: "Afficher la nouvelle analyse",
  echec: "Réessayer la mise à jour",
  ailleurs: "Relire la page",
};

// Le stockage de session peut manquer (navigation privée, données bloquées) : chaque accès est gardé.
const lireStockage = (k: string): string | null => {
  try { return window.sessionStorage.getItem(k); } catch { return null; }
};
const ecrireStockage = (k: string, v: string | null): boolean => {
  try {
    if (v === null) window.sessionStorage.removeItem(k);
    else window.sessionStorage.setItem(k, v);
    return true;
  } catch { return false; }
};
const sansAbonnement = () => () => {};

export function AnalyseAncienProjet(
  { insee, scopeKey, versionServie = null, raison = "projet" }: {
    insee: string;
    scopeKey: string;
    /** La version figée que la page sert pour cette portée (`StoredArtifact.servedVersion`). */
    versionServie?: number | null;
    raison?: "projet" | "lien" | "voisinage";
  },
) {
  const [etat, setEtat] = useState<EtatAction>("repos");
  const [issue, setIssue] = useState<IssueAction | null>(null);
  // La version que le serveur a annoncée, et les relectures déjà tentées pour l'afficher.
  const [suivi, setSuivi] = useState<SuiviAffichage | null>(null);
  const [delaiDepasse, setDelaiDepasse] = useState(false);
  const [relectureEnCours, lancerRelecture] = useTransition();
  const router = useRouter();

  // UNE RÉPONSE NE VAUT QUE POUR LE DOSSIER QUI L'A DEMANDÉE. Si la portée change, ou si le bloc
  // disparaît, avant la réponse, celle-ci est ignorée : rien ne se confirme sur un autre dossier.
  const cle = `${insee}|${scopeKey}`;
  const [clePrecedente, setClePrecedente] = useState(cle);
  if (clePrecedente !== cle) {
    setClePrecedente(cle);
    setEtat("repos");
    setIssue(null);
    setSuivi(null);
    setDelaiDepasse(false);
  }
  const cleCourante = useRef(cle);
  const enVol = useRef(false);
  const minuterie = useRef<number | null>(null);
  const echeance = useRef<number | null>(null);
  useEffect(() => { cleCourante.current = cle; }, [cle]);
  useEffect(() => () => {
    cleCourante.current = "";
    if (minuterie.current) window.clearTimeout(minuterie.current);
    if (echeance.current) window.clearTimeout(echeance.current);
  }, []);

  // CE QUE LE RECHARGEMENT COMPLET A LAISSÉ : la version attendue pour CE dossier. Lu hors rendu
  // serveur (le stockage n'existe pas côté serveur), sans écart à l'hydratation.
  const memoireBrute = useSyncExternalStore(
    sansAbonnement,
    () => { const b = lireStockage(cleMemoireAffichage(cle)); return lireMemoireAffichage(b, cle, Date.now()) ? b : null; },
    () => null,
  );
  const memoire = lireMemoireAffichage(memoireBrute, cle);

  // L'ÉTAT AFFICHÉ SE DÉDUIT DE LA VERSION SERVIE. « Affichée » n'est jamais posé à la main : c'est
  // la page qui le dit, en servant une version >= celle que le serveur a annoncée.
  const attendue = suivi?.attendue ?? (memoire?.rechargee ? memoire.attendue : null);
  const enAffichage = etat === "succes" || etat === "affichage" || etat === "non_affichee" || (etat === "repos" && attendue !== null);
  const etatVisible: EtatAction = attendue !== null && enAffichage && versionAtteinte(attendue, versionServie)
    ? "affichee"
    : etat === "repos" && !suivi && memoire?.rechargee ? "non_affichee" : etat;

  // La mémoire ne sert plus une fois la version servie : on l'efface (aucun état React n'en dépend).
  useEffect(() => {
    if (memoire && versionAtteinte(memoire.attendue, versionServie)) ecrireStockage(cleMemoireAffichage(cle), null);
  }, [memoire, versionServie, cle]);

  // ── LA RÉCUPÉRATION, BORNÉE (voir `etapeAffichage`) ──────────────────────────────────────────
  const etape = suivi && etat === "affichage"
    ? etapeAffichage(suivi, { servie: versionServie, relectureEnCours, delaiDepasse })
    : null;
  const relire = () => {
    setSuivi((s) => (s ? { ...s, tentatives: s.tentatives + 1 } : s));
    setDelaiDepasse(false);
    if (echeance.current) window.clearTimeout(echeance.current);
    echeance.current = window.setTimeout(() => setDelaiDepasse(true), DELAI_RELECTURE_MS);
    lancerRelecture(() => router.refresh());
  };
  const recharger = (a: number) => {
    // Le rechargement n'a lieu qu'UNE fois, et seulement si la page rechargée saura pourquoi : sans
    // mémoire possible, on renonce plutôt que de risquer de reproposer une mise à jour déjà faite.
    const memorise = ecrireStockage(cleMemoireAffichage(cle), JSON.stringify({ cle, attendue: a, rechargee: true, le: Date.now() }));
    if (!memorise) { setEtat((e) => suivantAction(e, { type: "affichage_echoue" })); return; }
    window.location.reload();
  };
  const agirEtape = useEffectEvent((e: NonNullable<typeof etape>) => {
    if (!suivi) return;
    if (e === "relire") relire();
    else if (e === "recharger") recharger(suivi.attendue);
    else if (e === "renoncer") setEtat((x) => suivantAction(x, { type: "affichage_echoue" }));
  });
  useEffect(() => {
    if (!etape || etape === "attendre" || etape === "affichee") return;
    // Hors du rendu, et une seule fois par étape : l'étape change dès que l'action a été lancée.
    const t = window.setTimeout(() => agirEtape(etape), 0);
    return () => window.clearTimeout(t);
  }, [etape]);

  const mettreAJour = async () => {
    const geste = gesteAppui(etatVisible);
    // Double clic, ou appui pendant la confirmation ou l'affichage : une seule demande à la fois.
    if (geste === "ignorer" || enVol.current) return;
    // Une mise à jour tourne déjà : on relit la page, on ne relance pas une génération. Rechargement
    // COMPLET, pas `router.refresh()` : sur cette page, une relecture du routeur dont la conclusion
    // rédigée ne change pas peut ne jamais s'afficher (cause établie le 12/10/2026, voir le compte rendu).
    if (geste === "relire") { window.location.reload(); return; }
    // La version est prête mais la page ne l'a pas affichée : on recharge, jamais de nouvelle demande.
    if (geste === "recharger") { window.location.reload(); return; }
    enVol.current = true;
    const demande = cle;
    setIssue(null);
    setSuivi(null);
    setDelaiDepasse(false);
    setEtat((e) => suivantAction(e, { type: "appui" }));
    let i: IssueAction;
    try {
      const res = await fetch("/api/dossier/actualiser", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // La version que CETTE page sert : une version plus récente déjà prête ne sera pas regénérée.
        body: JSON.stringify({ insee, scopeKey, versionLue: versionServie }),
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
    // La version N existe : « Nouvelle analyse prête » se lit, puis l'affichage commence. Il ne se dira
    // réussi qu'à la version servie (voir `etatVisible`).
    if (i.type === "livree") {
      setSuivi({ attendue: i.version, tentatives: 0, rechargee: false });
      // La version attendue est aussi confiée à `AnnonceVersion`, qui l'annoncera une fois servie.
      ecrireStockage(cleMemoireAffichage(cle), JSON.stringify({ cle, attendue: i.version, rechargee: false, le: Date.now() }));
      minuterie.current = window.setTimeout(() => setEtat((e) => suivantAction(e, { type: "lecture" })), LECTURE_CONFIRMATION_MS);
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
      <BoutonAction etat={etatVisible} onAppui={mettreAJour} libelles={LIBELLES} />
      {/* Toujours présent, vide au repos : une région annoncée doit exister avant que son texte change. */}
      <p className="text-[12.5px] text-muted w-full empty:-mt-2" aria-live="polite">
        {compteRenduAction(etatVisible, issue)}
      </p>
    </div>
  );
}
