"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { UserProject, ProjectPosture, ProjectIntent } from "@/lib/user-project";
import { doitReparser, parsedASauvegarder } from "@/lib/decision/projet-edition";

const POSTURE_OPTIONS: { value: ProjectPosture; label: string }[] = [
  { value: "recherche", label: "Je cherche où vivre" },
  // « POUR ACHETER OU LOUER » EST TOMBÉ DU LIBELLÉ (12/08/2026) : la question est posée juste en
  // dessous, et l'annoncer dans l'objectif faisait croire que la réponse était déjà donnée.
  { value: "adresse", label: "J'étudie ce lieu" },
  { value: "habitant", label: "J'y habite déjà" },
];

// L'INTENTION ÉTAIT INATTEIGNABLE (12/08/2026). Cette carte envoyait `intent: project?.intent ?? null` :
// elle recopiait indéfiniment ce que le wizard ou /ou-vivre avait posé. Or le moteur la LIT (elle
// change les gestes proposés) et `signatureDecisionnelle` la compte comme matérielle. Quelqu'un qui
// passe d'un achat à une location ne pouvait pas le dire à l'endroit même où le dossier prétend lire
// son projet.
//
// « NI L'UN NI L'AUTRE » EST UN CHOIX, pas une absence de réponse : il écrit `null`. C'est ce qui
// rend possible le cas réel du locataire qui achète son logement (posture habitant + intention
// achat) sans laisser traîner une intention périmée après un changement d'objectif.
const INTENT_OPTIONS: { value: ProjectIntent | null; label: string }[] = [
  { value: "achat", label: "Acheter" },
  { value: "location", label: "Louer" },
  { value: null, label: "Ni l'un ni l'autre" },
];

// Carte « Votre projet » en tête du hub, dans le langage visuel de futur•e (glass, eyebrow mono,
// Instrument Serif, accent orange). Trois états : projet présent, absent (invitation), édition. La
// sauvegarde explicite ne prétend JAMAIS avoir réussi sans confirmation serveur : en cas d'échec
// l'éditeur reste ouvert avec un message. La posture est choisie, jamais devinée.
function ProjectEyebrow({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2.5 font-mono text-[11px] tracking-[0.14em] uppercase text-ghost mb-3">
      <span className="w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
      {label}
    </div>
  );
}

export function ProjectSummaryCard({ initial }: { initial: UserProject | null }) {
  const [project, setProject] = useState<UserProject | null>(initial);
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(initial?.rawText ?? "");
  const [posture, setPosture] = useState<ProjectPosture | null>(initial?.posture ?? null);
  const [intent, setIntent] = useState<ProjectIntent | null>(initial?.intent ?? null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // DEUX ÉTATS DISTINCTS, ET LA DISTINCTION EST TOUT. `error` dit « ce n'est PAS enregistré » et
  // garde l'éditeur ouvert. `avertissement` dit « c'est enregistré, mais vos priorités n'ont pas pu
  // être comprises », et il survit à la fermeture de l'éditeur, puisqu'il concerne ce qui vient
  // d'être écrit.
  const [avertissement, setAvertissement] = useState<string | null>(null);
  const router = useRouter();

  async function save() {
    const raw = text.trim();
    if (!raw || !posture) return;
    setBusy(true);
    setError(null);
    setAvertissement(null);

    // ON NE REPARSE QUE SI LE TEXTE A CHANGÉ, et la règle vit dans `projet-edition.ts`, où elle est
    // testée. Sans elle, changer la seule intention un jour de panne du parseur enregistrait le
    // projet sans ses priorités : le dossier retombait en « projet non structuré » alors que le
    // lecteur n'avait pas touché à son texte.
    const reparse = doitReparser(raw, project);
    let parsedRecu: UserProject["parsed"] | null = null;
    if (reparse) {
      try {
        const r = await fetch("/api/comparateur-vie/parse", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: raw }),
        });
        const data = r.ok ? ((await r.json()) as { parsed?: unknown }) : null;
        parsedRecu = data?.parsed && typeof data.parsed === "object"
          ? (data.parsed as UserProject["parsed"])
          : null;
      } catch {
        parsedRecu = null;
      }
    }
    const { parsed, avertir } = parsedASauvegarder({ reparse, parsedRecu, projet: project });
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          field: "user_project",
          value: { posture, intent, rawText: raw, parsed },
        }),
      });
      if (!res.ok) {
        setError("Enregistrement impossible pour le moment. Réessayez.");
        setBusy(false);
        return;
      }
      const data = (await res.json()) as { project?: UserProject };
      if (!data.project) {
        setError("Enregistrement impossible pour le moment. Réessayez.");
        setBusy(false);
        return;
      }
      setProject(data.project); // uniquement le projet confirmé par le serveur
      setEditing(false);
      // L'AVERTISSEMENT SURVIT À LA FERMETURE DE L'ÉDITEUR : il concerne ce qui vient d'être
      // enregistré, et il se lit sur la carte fermée. Le poser avant l'appel l'aurait rendu
      // prématuré ; le poser dans `error` l'aurait fait disparaître avec l'éditeur.
      if (avertir) {
        setAvertissement("Votre texte est enregistré. Nous n'avons pas pu en extraire vos priorités : rouvrez l'éditeur et enregistrez à nouveau pour une analyse complète.");
      }
      router.refresh(); // régénère le dossier de décision (rendu serveur) avec le projet à jour
    } catch {
      setError("Enregistrement impossible pour le moment. Réessayez.");
      setBusy(false);
      return;
    }
    setBusy(false);
  }

  // « VOTRE PROJET » N'EST PAS LE MOT D'UN HABITANT. Quelqu'un qui a coché « j'y habite déjà » n'a pas
  // de projet : il a un lieu de vie et des questions dessus. Le titre suit donc la posture choisie,
  // comme le fait déjà le verdict et le titre des vérifications. Déclaré hors du rendu : une
  // fonction-composant créée pendant le rendu est recréée à chaque passe.
  const eyebrowLabel = (project?.posture ?? posture) === "habitant" ? "Ce qui compte pour vous" : "Votre projet";

  const reformulation = project?.parsed?.reformulation ?? project?.rawText ?? null;

  // ── Projet présent ──
  if (!editing && project && reformulation) {
    return (
      <div className="glass rounded-2xl p-7">
        <ProjectEyebrow label={eyebrowLabel} />
        <p className="text-[17px] leading-[1.65] text-label">{reformulation}</p>
        {/* La teinte est celle du NON SU, jamais celle d'une erreur : le texte EST enregistré, c'est
            sa structure qui manque. */}
        {avertissement ? (
          <p className="text-[13px] leading-[1.55] mt-3" style={{ color: "var(--reg-non-su)" }}>{avertissement}</p>
        ) : null}
        <button
          type="button"
          onClick={() => { setText(project.rawText ?? ""); setPosture(project.posture); setIntent(project.intent ?? null); setError(null); setEditing(true); }}
          className="mt-4 inline-flex items-center gap-2 font-mono text-[11px] tracking-[0.08em] uppercase text-accent hover:text-label transition-colors"
        >
          Affiner
          <span aria-hidden className="text-[13px] leading-none">→</span>
        </button>
      </div>
    );
  }

  // ── Aucun projet ──
  if (!editing && !project) {
    return (
      <div className="glass rounded-2xl p-7">
        <ProjectEyebrow label={eyebrowLabel} />
        <p className="text-[16px] leading-[1.65] text-muted mb-5">
          Décrivez votre projet pour une lecture qui parle de votre situation, pas d&apos;une commune en général.
        </p>
        <button
          type="button"
          onClick={() => { setError(null); setEditing(true); }}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-accent text-canvas font-semibold text-[14px] hover:opacity-90 transition-opacity"
        >
          Décrire mon projet
        </button>
      </div>
    );
  }

  // ── Édition ──
  return (
    <div className="glass rounded-2xl p-7">
      <ProjectEyebrow label={eyebrowLabel} />
      <p className="font-mono text-[10px] tracking-[0.1em] uppercase text-ghost mb-2.5">Vous êtes plutôt</p>
      <div className="flex gap-2 flex-wrap mb-5">
        {POSTURE_OPTIONS.map((o) => {
          const active = posture === o.value;
          return (
            <button
              key={o.value}
              type="button"
              onClick={() => setPosture(o.value)}
              className={
                active
                  ? "rounded-lg px-3.5 py-2 text-[13px] font-medium bg-accent text-canvas border border-transparent transition-colors"
                  : "rounded-lg px-3.5 py-2 text-[13px] text-muted bg-[var(--bg-elev-2)] border border-[var(--border-2)] hover:text-label hover:border-white/25 transition-colors"
              }
            >
              {o.label}
            </button>
          );
        })}
      </div>

      {/* L'INTENTION EST TOUJOURS DEMANDÉE, et son libellé suit l'objectif. Pour « j'y habite déjà »,
          la question devient « envisagez-vous d'acheter ou de louer ce logement » : le locataire qui
          achète le logement où il vit est un cas réel, et `bucketDuProjet` teste l'intention avant
          la posture. Effacer silencieusement l'intention au moment où l'on coche « j'y habite déjà »
          serait muter une valeur DÉCLARÉE au nom du lecteur. Il voit les deux réponses en même temps
          et tranche lui-même. */}
      <p className="font-mono text-[10px] tracking-[0.1em] uppercase text-ghost mb-2.5">
        {posture === "habitant" ? "Envisagez-vous d'acheter ou de louer ce logement" : "Vous comptez"}
      </p>
      <div className="flex gap-2 flex-wrap mb-5">
        {INTENT_OPTIONS.map((o) => {
          const active = intent === o.value;
          return (
            <button
              key={o.label}
              type="button"
              onClick={() => setIntent(o.value)}
              className={
                active
                  ? "rounded-lg px-3.5 py-2 text-[13px] font-medium bg-accent text-canvas border border-transparent transition-colors"
                  : "rounded-lg px-3.5 py-2 text-[13px] text-muted bg-[var(--bg-elev-2)] border border-[var(--border-2)] hover:text-label hover:border-white/25 transition-colors"
              }
            >
              {o.label}
            </button>
          );
        })}
      </div>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={3}
        placeholder="Par exemple : nous cherchons une maison au calme, proche de la mer, avec une école à pied."
        className="w-full rounded-xl bg-[var(--bg-elev)] border border-[var(--border-2)] px-4 py-3 text-[14px] text-label placeholder:text-ghost leading-[1.6] resize-y focus:outline-none focus:border-accent/60 transition-colors"
        style={{ fontFamily: "inherit" }}
      />

      {error ? <p className="text-danger text-[13px] mt-2.5">{error}</p> : null}

      <div className="flex items-center gap-4 mt-4">
        <button
          type="button"
          onClick={save}
          disabled={busy || !text.trim() || !posture}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-accent text-canvas font-semibold text-[14px] transition-opacity disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90"
        >
          {busy ? "Enregistrement…" : "Enregistrer"}
        </button>
        {project && (
          <button
            type="button"
            onClick={() => { setEditing(false); setError(null); }}
            className="font-mono text-[11px] tracking-[0.08em] uppercase text-ghost hover:text-label transition-colors"
          >
            Annuler
          </button>
        )}
      </div>
    </div>
  );
}
