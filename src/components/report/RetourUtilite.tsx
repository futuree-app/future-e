"use client";

import { useEffect, useId, useRef, useState } from "react";
import posthog from "posthog-js";
import { bindOrphans } from "@/lib/typography";
import { mesureAutorisee } from "@/lib/consentement-mesure";
import {
  LIBELLE_REPONSE, MAX_COMMENTAIRE, QUESTION_COMMENTAIRE, QUESTION_UTILITE, REPONSES_UTILITE,
  longueurCommentaire, type ReponseUtilite, type RetourEnregistre,
} from "@/lib/retour-utilite";
import { releve as s } from "@/components/releve/primitives";
import type { PresentationDossier } from "@/components/releve/activation";
import d from "./autour-du-releve.module.css";

// ════════════════════════════════════════════════════════════════════════════════════════════
// LE RETOUR D'UTILITÉ EN FIN DE DOSSIER (FUT-94).
//
// UNE QUESTION, TROIS RÉPONSES, UN COMMENTAIRE FACULTATIF. Un geste suffit : la réponse s'enregistre
// au clic, le commentaire vient ensuite, s'il vient. Le dossier ne dépend de rien ici : ce bloc est
// sous la lecture, il ne la précède ni ne la recouvre, et un échec n'affecte que lui.
//
// CE QUI EST GARANTI AU LECTEUR :
//   · une réponse confirmée par le serveur, et seulement là, est montrée comme enregistrée ;
//   · un échec garde le texte du commentaire dans le champ, mot pour mot, et propose de réessayer ;
//   · un double clic n'envoie qu'une requête (verrou synchrone), et la base n'a qu'une ligne par
//     compte et par dossier, de toute façon ;
//   · une réponse enregistrée ne se redemande pas : à la visite suivante, une ligne la rappelle, avec
//     de quoi la modifier, et rien d'autre ;
//   · le commentaire reste privé : il ne part jamais vers PostHog. Le bloc porte `ph-no-capture`, que
//     posthog-js honore deux fois : l'autocapture l'ignore (aucun clic, aucun texte d'élément), et
//     l'enregistreur de session le remplace par un aplat (`blockClass`). Le seul événement est celui,
//     explicite, qui suit un enregistrement confirmé, et il ne part qu'avec le consentement
//     « granted » de la bannière (`mesureAutorisee`) ;
//   · passer à « Pas encore lu » retire le commentaire enregistré (la route l'efface), et l'écran le dit.
//
// Les boutons ne passent JAMAIS en `disabled` pendant un envoi : un bouton désactivé perd le focus,
// et le lecteur au clavier se retrouverait en haut de la page. `aria-disabled` et le verrou suffisent.
// ════════════════════════════════════════════════════════════════════════════════════════════

const ENDPOINT = "/api/dossier/retour-utilite";
/** Le compte de caractères n'apparaît qu'à l'approche de la borne : en deçà, il ne dit rien d'utile. */
const SEUIL_COMPTE = MAX_COMMENTAIRE - 200;

type Envoi = "reponse" | "commentaire";
type Corps = { insee: string; dossierId: string | null; presentation: PresentationDossier; answer: ReponseUtilite; comment?: string | null };

const nombre = (n: number) => n.toLocaleString("fr-FR");

export function RetourUtilite({
  insee, dossierId, initial, presentation = "classique", endpoint = ENDPOINT,
}: {
  /** La commune lue, au code de l'artefact. */
  insee: string;
  /** Le dossier d'adresse lu, ou `null` pour un dossier de commune seule. */
  dossierId: string | null;
  /** Le retour déjà enregistré pour CE dossier, lu côté serveur. */
  initial: RetourEnregistre | null;
  presentation?: PresentationDossier;
  /** Pour le banc de développement seulement. */
  endpoint?: string;
}) {
  const [enregistre, setEnregistre] = useState<RetourEnregistre | null>(initial);
  // Ouvert : la question est posée. Fermé : une réponse existe, une ligne la rappelle.
  const [ouvert, setOuvert] = useState(initial === null);
  const [envoi, setEnvoi] = useState<Envoi | null>(null);
  const [brouillon, setBrouillon] = useState(initial?.comment ?? "");
  const [erreur, setErreur] = useState<Envoi | null>(null);
  const [confirme, setConfirme] = useState<Envoi | null>(null);
  const [commentaireRetire, setCommentaireRetire] = useState(false);
  const verrou = useRef(false);
  const titreRef = useRef<HTMLHeadingElement>(null);
  const resumeRef = useRef<HTMLParagraphElement>(null);
  const aFocaliser = useRef<"titre" | "resume" | null>(null);
  const id = useId();

  // Le focus suit le bloc quand il change de forme : sans ça, le bouton activé disparaît et le
  // lecteur au clavier repart du haut de la page.
  useEffect(() => {
    const cible = aFocaliser.current === "titre" ? titreRef.current : aFocaliser.current === "resume" ? resumeRef.current : null;
    aFocaliser.current = null;
    cible?.focus();
  }, [ouvert]);

  const longueur = longueurCommentaire(brouillon);
  const tropLong = longueur > MAX_COMMENTAIRE;
  // Un champ vidé s'envoie seulement s'il efface un commentaire déjà enregistré.
  const envoyable = envoi === null && !tropLong && (longueur > 0 || Boolean(enregistre?.comment));

  async function envoyer(type: Envoi, corps: Corps): Promise<RetourEnregistre | null> {
    if (verrou.current) return null;
    verrou.current = true;
    setEnvoi(type);
    setErreur(null);
    setConfirme(null);
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(corps),
      });
      const json = (await res.json().catch(() => null)) as { ok?: boolean; retour?: RetourEnregistre } | null;
      if (!res.ok || !json?.ok || !json.retour) throw new Error(String(res.status));
      const precedent = enregistre;
      setEnregistre(json.retour);
      setConfirme(type);
      const retire = type === "reponse" && Boolean(precedent?.comment) && json.retour.comment === null;
      setCommentaireRetire(retire);
      // L'écran vient de dire « votre commentaire précédent a été retiré » : le champ ne doit pas le
      // reproposer au retour à « Oui » (un clic sur Envoyer le ressusciterait). Trouvé en recette réelle.
      if (retire) setBrouillon("");
      // UN ÉVÉNEMENT AGRÉGÉ, SANS LE TEXTE, ET SEULEMENT AVEC CONSENTEMENT. La réponse, la présence d'un
      // commentaire, la portée.
      try {
        if (mesureAutorisee()) posthog.capture("dossier_utility_feedback_submitted", {
          answer: json.retour.answer,
          has_comment: json.retour.comment !== null,
          step: type,
          is_change: precedent !== null && (type === "commentaire" || precedent.answer !== json.retour.answer),
          scope: dossierId ? "adresse" : "commune",
          presentation,
        });
      } catch { /* la mesure ne doit jamais faire échouer l'enregistrement */ }
      return json.retour;
    } catch {
      setErreur(type);
      return null;
    } finally {
      verrou.current = false;
      setEnvoi(null);
    }
  }

  function choisir(r: ReponseUtilite) {
    void envoyer("reponse", { insee, dossierId, presentation, answer: r });
  }

  async function envoyerCommentaire() {
    if (!enregistre || tropLong) return;
    const r = await envoyer("commentaire", { insee, dossierId, presentation, answer: enregistre.answer, comment: brouillon });
    if (r) {
      setBrouillon(r.comment ?? "");
      aFocaliser.current = "resume";
      setOuvert(false);
    }
  }

  function modifier() {
    setConfirme(null);
    setErreur(null);
    aFocaliser.current = "titre";
    setOuvert(true);
  }

  function saisir(v: string) {
    setBrouillon(v);
    if (erreur === "commentaire") setErreur(null);
  }

  const releve = presentation === "releve";
  const occupe = envoi !== null;
  const reponseCourante = enregistre?.answer ?? null;
  // Le commentaire répond à « quoi » ou à « qu'est-ce qui a manqué » : il n'a rien à dire d'un
  // dossier pas encore lu. Celui qui a été donné plus tôt, lui, reste enregistré.
  const champCommentaire = ouvert && reponseCourante !== null && reponseCourante !== "pas_encore_lu";
  const idQuestion = `${id}-question`;
  const idChamp = `${id}-commentaire`;
  const idAide = `${id}-aide`;

  const statut =
    envoi === "reponse" ? "Enregistrement…"
    : envoi === "commentaire" ? "Envoi…"
    : confirme === "commentaire" ? "Merci, votre commentaire est enregistré."
    : confirme === "reponse" && reponseCourante === "pas_encore_lu" && commentaireRetire
      ? "Merci, c'est noté. Votre commentaire précédent a été retiré."
    : confirme === "reponse" && reponseCourante === "pas_encore_lu" ? "Merci, c'est noté."
    : confirme === "reponse" ? "Merci, votre réponse est enregistrée."
    : "";
  const messageErreur =
    erreur === "reponse" ? "Votre réponse n'a pas pu être enregistrée. Réessayez."
    : erreur === "commentaire" ? "Votre commentaire n'a pas pu être envoyé. Il est conservé dans le champ : réessayez."
    : null;

  // ── Les classes des deux présentations, côte à côte : même structure, même ordre, même texte. ──
  const c = releve
    ? {
        section: `${s.releveSection} ${d.bloc} ${d.blocSuivant}`,
        titre: `${s.dense} ${s.encre} font-semibold`,
        groupe: s.selecteur,
        option: s.option,
        etiquette: s.etiquette,
        champ: d.texte,
        bouton: s.bouton,
        action: s.action,
        nuance: s.nuance,
        statut: `${s.nuance} ${s.encre}`,
        erreur: d.incident,
      }
    : {
        section: "mt-12 pt-7 border-t border-[var(--border-1)] grid gap-4",
        titre: "text-[15px] font-semibold leading-snug text-label",
        groupe: "flex flex-wrap gap-2",
        option: "min-h-[44px] rounded-lg px-4 py-2 text-[14px] text-muted bg-[var(--bg-elev-2)] border border-[var(--border-2)] hover:text-label hover:border-white/25 aria-pressed:text-label aria-pressed:border-accent/70 aria-pressed:bg-[var(--bg-elev)] aria-pressed:font-medium aria-disabled:opacity-60 aria-disabled:cursor-progress focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent transition-colors",
        etiquette: "text-[13px] font-medium text-muted",
        champ: "w-full min-h-[88px] rounded-lg px-3.5 py-3 text-[14px] leading-[1.6] text-label bg-[var(--bg-elev)] border border-[var(--border-2)] placeholder:text-ghost focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent resize-y",
        bouton: "inline-flex items-center min-h-[44px] rounded-lg px-4 py-2 text-[14px] font-medium text-label bg-[var(--bg-elev-2)] border border-[var(--border-2)] hover:border-white/30 aria-disabled:opacity-60 aria-disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
        action: "inline-flex items-center min-h-[44px] sm:min-h-0 text-[13px] text-muted underline underline-offset-4 decoration-[var(--border-2)] hover:text-label focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
        nuance: "text-[12.5px] leading-[1.5] text-ghost",
        statut: "text-[13px] leading-[1.5] text-label",
        erreur: "text-danger text-[13px] leading-[1.5]",
      };

  // Les messages suivent ce qu'ils confirment : sous les réponses tant que la question est ouverte, sous
  // la ligne de rappel ensuite. Ils sont rendus d'avance, vides : une région vivante doit exister AVANT
  // que son texte change pour être annoncée.
  const messages = (
    <>
      <p role="status" aria-live="polite" className={statut ? c.statut : "sr-only"}>{statut}</p>
      <p role="alert" className={messageErreur ? c.erreur : "sr-only"}>{messageErreur ?? ""}</p>
    </>
  );

  return (
    <section aria-labelledby={idQuestion} className={`${c.section} ph-no-capture`} data-retour-utilite="">
      {ouvert ? (
        <>
          <h2 id={idQuestion} ref={titreRef} tabIndex={-1} className={`${c.titre} outline-none`}>
            {bindOrphans(QUESTION_UTILITE)}
          </h2>
          <div role="group" aria-labelledby={idQuestion} className={c.groupe}>
            {REPONSES_UTILITE.map((r) => (
              <button
                key={r}
                type="button"
                className={c.option}
                aria-pressed={reponseCourante === r}
                aria-disabled={occupe || undefined}
                onClick={() => { if (!occupe) choisir(r); }}
              >
                {LIBELLE_REPONSE[r]}
              </button>
            ))}
          </div>
          {messages}
          {champCommentaire ? (
            <div className="grid gap-2">
              <label htmlFor={idChamp} className={c.etiquette}>
                {QUESTION_COMMENTAIRE} <span className="font-normal">(facultatif)</span>
              </label>
              <textarea
                id={idChamp}
                className={c.champ}
                value={brouillon}
                rows={3}
                aria-describedby={idAide}
                aria-invalid={tropLong || undefined}
                onChange={(e) => saisir(e.target.value)}
              />
              <p id={idAide} className={c.nuance}>
                {longueur >= SEUIL_COMPTE
                  ? `${nombre(longueur)} / ${nombre(MAX_COMMENTAIRE)} caractères${tropLong ? " : raccourcissez votre commentaire." : "."} `
                  : ""}
                {bindOrphans("Lu par l'équipe de futur•e seulement, jamais publié.")}
              </p>
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
                <button
                  type="button"
                  className={c.bouton}
                  aria-disabled={!envoyable || undefined}
                  onClick={() => { if (envoyable) void envoyerCommentaire(); }}
                >
                  {erreur === "commentaire" ? "Réessayer l'envoi" : "Envoyer"}
                </button>
              </div>
            </div>
          ) : null}
        </>
      ) : enregistre ? (
        // Une réponse enregistrée : une ligne, et de quoi la changer. La question n'est pas reposée.
        <p ref={resumeRef} tabIndex={-1} id={idQuestion} className={`${c.nuance} outline-none flex flex-wrap items-center gap-x-3 gap-y-1`}>
          <span>
            {`Votre retour sur cette analyse : ${LIBELLE_REPONSE[enregistre.answer]}${enregistre.comment ? ", avec un commentaire" : ""}. Merci.`}
          </span>
          <button type="button" className={c.action} onClick={modifier}>Modifier</button>
        </p>
      ) : null}
      {!ouvert && enregistre ? messages : null}
    </section>
  );
}
