"use client";

import { useState } from "react";
import type { ComparaisonTheme, MatchResult } from "@/lib/comparateur-vie";
import { ThemeMatrix } from "./ThemeMatrix";
import { bindOrphans } from "@/lib/typography";

type Props = { themes: ComparaisonTheme[]; trio: MatchResult[]; defaultThemeId: string };

export function ThemeExplorer({ themes, trio, defaultThemeId }: Props) {
  const initial = themes.find((t) => t.id === defaultThemeId) ?? themes[0];
  const [openId, setOpenId] = useState(initial.id);
  // Une seule redirection : après le 1er clic délibéré, le sélecteur se verrouille (cf. spec 2.4).
  const [redirected, setRedirected] = useState(false);
  const open = themes.find((t) => t.id === openId) ?? themes[0];
  const locked = themes.filter((t) => t.id !== open.id);
  const canRedirect = !redirected;

  function reveal(id: string) {
    if (redirected) return;
    setOpenId(id);
    setRedirected(true);
  }

  return (
    <section className="mt-12">
      <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-accent mb-2">Là où ça se joue</p>

      {/* Thème ouvert : la vraie grammaire (paliers + avantages), les 2-3 communes. */}
      <h3 className="font-normal text-[23px] leading-[1.1] text-label mb-1" style={{ fontFamily: "'Instrument Serif', serif" }}>
        {open.titre}
      </h3>
      <p className="text-[14.5px] leading-[1.55] text-muted italic mb-4" style={{ textWrap: "pretty" }}>
        {bindOrphans(open.synthese)}
      </p>
      <ThemeMatrix theme={open} trio={trio} />

      {/* Vitrine : les autres thèmes. Cliquables tant qu'aucune redirection n'a eu lieu. */}
      {locked.length > 0 && (
        <>
          <p className="font-mono text-[10px] tracking-[0.16em] uppercase text-muted mt-8 mb-4">
            {canRedirect ? "Dévoilez le thème qui compte pour vous" : `Les ${locked.length} autres thèmes`}
          </p>
          <div className={`grid grid-cols-1 sm:grid-cols-2 ${trio.length === 2 ? "" : "lg:grid-cols-3"} gap-3`}>
            {locked.map((th) => (
              <button
                key={th.id}
                type="button"
                onClick={() => reveal(th.id)}
                disabled={!canRedirect}
                className={`glass rounded-xl px-4 py-4 flex flex-col text-left transition-colors ${
                  canRedirect ? "hover:border-accent/40 cursor-pointer" : "cursor-default"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[15px] leading-[1.15] text-label" style={{ fontFamily: "'Instrument Serif', serif" }}>
                    {th.titre}
                  </p>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-ghost shrink-0" aria-hidden>
                    <rect x="5" y="11" width="14" height="9" rx="1.5" />
                    <path d="M8 11V8a4 4 0 0 1 8 0v3" />
                  </svg>
                </div>
                <p className="mt-2 text-[11.5px] leading-[1.5] text-ghost">{th.lignes.map((l) => l.label).join(" · ")}</p>
              </button>
            ))}
          </div>
          {!canRedirect && (
            <p className="mt-4 text-[12.5px] leading-[1.55] text-muted">
              {bindOrphans("Vous avez dévoilé votre thème. Les autres se détaillent dans le Pack, critère par critère.")}
            </p>
          )}
        </>
      )}
    </section>
  );
}
