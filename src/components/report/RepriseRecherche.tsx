"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// « REPRENDRE CETTE RECHERCHE POUR DÉFINIR MON PROJET » (FUT-8, §5.2).
//
// Une recherche « Où vivre » n'écrit plus jamais le Projet d'elle-même. Ce geste montre d'abord ce qui
// sera retenu, ce qui reste propre à la recherche, et ce que le remplacement abandonnerait ; il n'écrit
// qu'après « Enregistrer comme projet ». Le serveur fait le tri (route /api/project/from-search) :
// le navigateur n'envoie que la recherche telle qu'elle est.
//
// `recherche` absente : la dernière session « Où vivre » de ce navigateur (sur /rapport).

const SESSION_KEY = "futuree:ouvivre:session"; // même clé que OuVivreClient
const SESSION_VERSION = 3;
const SESSION_TTL_MS = 2 * 60 * 60 * 1000;

type Recherche = { parsed: unknown; rawText: string };
type Apercu = {
  retenus: string[];
  propresALaRecherche: string[];
  remplace: { texte: string; updatedAt: string | null } | null;
  abandonnes: { conditions: number; precisions: number; adoptions: number } | null;
};

function derniereRecherche(): Recherche | null {
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as { v?: number; savedAt?: number; parsed?: unknown; submittedText?: string };
    if (s.v !== SESSION_VERSION || !s.savedAt || Date.now() - s.savedAt > SESSION_TTL_MS || !s.parsed) return null;
    return { parsed: s.parsed, rawText: typeof s.submittedText === "string" ? s.submittedText : "" };
  } catch {
    return null;
  }
}

async function demander(recherche: Recherche, corps: Record<string, unknown>) {
  return fetch("/api/project/from-search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ parsed: recherche.parsed, rawText: recherche.rawText, ...corps }),
  });
}

export function RepriseRecherche({ recherche: fournie, variante = "lien" }: {
  recherche?: Recherche | null;
  variante?: "lien" | "bouton";
}) {
  const router = useRouter();
  const [recherche, setRecherche] = useState<Recherche | null>(fournie ?? null);
  const [apercu, setApercu] = useState<Apercu | null>(null);
  const [ouvert, setOuvert] = useState(false);
  const [etat, setEtat] = useState<"repos" | "envoi" | "fait">("repos");
  const [erreur, setErreur] = useState<string | null>(null);

  // Lecteur connecté seulement, et seulement s'il y a une recherche à reprendre. L'aperçu est demandé
  // d'emblée : il dit aussi s'il existe déjà un projet (et donc quel libellé montrer).
  useEffect(() => {
    let annule = false;
    const r = fournie ?? derniereRecherche();
    if (!r) return;
    createClient().auth.getSession().then(async ({ data }) => {
      if (annule || !data.session) return;
      const res = await demander(r, { mode: "apercu" }).catch(() => null);
      if (annule || !res?.ok) return;
      setRecherche(r);
      setApercu((await res.json()) as Apercu);
    });
    return () => { annule = true; };
  }, [fournie]);

  if (!recherche || !apercu || etat === "fait") return null;

  const libelle = apercu.remplace ? "Utiliser cette recherche pour mon projet" : "Reprendre cette recherche pour définir mon projet";
  const perdus = apercu.abandonnes
    ? apercu.abandonnes.conditions + apercu.abandonnes.precisions + apercu.abandonnes.adoptions
    : 0;

  async function enregistrer() {
    if (!recherche || !apercu) return;
    setEtat("envoi");
    setErreur(null);
    const res = await demander(recherche, { mode: "enregistrer", vuUpdatedAt: apercu.remplace?.updatedAt ?? null }).catch(() => null);
    if (res?.ok) {
      setEtat("fait");
      router.refresh();
      return;
    }
    setEtat("repos");
    setErreur(res?.status === 409
      ? "Votre projet a changé entre-temps. Rechargez la page avant de le remplacer."
      : "L'enregistrement n'a pas abouti. Réessayez.");
  }

  if (!ouvert) {
    return (
      <button
        type="button"
        onClick={() => setOuvert(true)}
        className={variante === "bouton"
          ? "inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-[14px] text-label bg-[var(--bg-elev-2)] border border-[var(--border-2)] hover:border-white/25 transition-colors"
          : "text-[14px] text-accent underline underline-offset-4 hover:opacity-80"}
      >
        {libelle}
      </button>
    );
  }

  return (
    <div className="glass rounded-2xl p-6 mt-4 text-left" role="region" aria-label={libelle}>
      <p className="text-[15px] font-semibold text-label mb-3">Ce que futur•e retiendra dans votre projet</p>
      {apercu.retenus.length > 0 ? (
        <ul className="mb-4 space-y-1.5">
          {apercu.retenus.map((t) => (
            <li key={t} className="text-[15px] leading-[1.6] text-label flex gap-2">
              <span aria-hidden className="text-accent">·</span>{t}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-[15px] leading-[1.6] text-muted mb-4">Votre texte, tel que vous l&apos;avez écrit.</p>
      )}
      {apercu.propresALaRecherche.length > 0 && (
        <p className="text-[14px] leading-[1.6] text-muted mb-4">
          Ce qui reste propre à cette recherche : {apercu.propresALaRecherche.join(", ")}.
        </p>
      )}
      {apercu.remplace && (
        <div className="mb-4">
          <p className="text-[14px] leading-[1.6] text-label mb-2">
            Cela remplacera votre projet actuel.{perdus > 0 ? " Ses conditions et précisions ne seront pas reprises." : ""}
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-[var(--border-2)] p-3">
              <p className="text-[12px] uppercase tracking-wide text-muted mb-1">Projet actuel</p>
              <p className="text-[14px] leading-[1.55] text-muted">{apercu.remplace.texte || "Sans texte"}</p>
            </div>
            <div className="rounded-lg border border-[var(--border-2)] p-3">
              <p className="text-[12px] uppercase tracking-wide text-muted mb-1">Cette recherche</p>
              <p className="text-[14px] leading-[1.55] text-label">{recherche.rawText || "Sans texte"}</p>
            </div>
          </div>
        </div>
      )}
      {erreur && <p className="text-[14px] text-[var(--danger,#e5484d)] mb-3" role="alert">{erreur}</p>}
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          disabled={etat === "envoi"}
          onClick={enregistrer}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-accent text-canvas font-semibold text-[14px] hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          Enregistrer comme projet
        </button>
        <button
          type="button"
          onClick={() => { setOuvert(false); setErreur(null); }}
          className="px-4 py-2.5 rounded-lg text-[14px] text-muted hover:text-label"
        >
          Annuler
        </button>
      </div>
    </div>
  );
}
