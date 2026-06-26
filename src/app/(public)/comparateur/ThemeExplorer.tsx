"use client";

import { useState } from "react";
import type { ComparaisonTheme, MatchResult } from "@/lib/comparateur-vie";
import { ThemeMatrix } from "./ThemeMatrix";
import { bindOrphans } from "@/lib/typography";

type Props = { themes: ComparaisonTheme[]; trio: MatchResult[]; defaultThemeId: string };

export function ThemeExplorer({ themes, trio, defaultThemeId }: Props) {
  const initial = themes.find((t) => t.id === defaultThemeId) ?? themes[0];
  const [openId, setOpenId] = useState(initial.id);
  // `chosen` = le thème vers lequel le lecteur a redirigé (null avant le 1er clic). Spec 2.4 :
  // au plus 2 thèmes révélés sur une page (le défaut + le sien). Après le 1er clic on ne peut
  // plus OUVRIR un 3e thème, mais on peut faire l'aller-retour entre le défaut et son choix
  // (aucun thème supplémentaire n'est consommé : le paywall reste intact).
  const [chosen, setChosen] = useState<string | null>(null);
  const open = themes.find((t) => t.id === openId) ?? themes[0];
  const locked = themes.filter((t) => t.id !== open.id);
  const canRedirect = chosen === null;

  // Une carte verrouillée est cliquable si : aucune redirection encore (n'importe lequel), ou
  // c'est le défaut / le thème déjà choisi (simple bascule, pas un nouveau dévoilement).
  function isOpenable(id: string) {
    return canRedirect || id === initial.id || id === chosen;
  }

  function reveal(id: string) {
    if (!isOpenable(id)) return;
    setOpenId(id);
    if (canRedirect && id !== initial.id) setChosen(id);
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

      {/* Vitrine : les autres thèmes. Cliquables selon la règle 2.4 (1 redirection, retour au défaut permis). */}
      {locked.length > 0 && (
        <>
          <p className="font-mono text-[10px] tracking-[0.16em] uppercase text-muted mt-8 mb-4">
            {canRedirect ? "Dévoilez le thème qui compte pour vous" : `Les ${locked.length} autres thèmes`}
          </p>
          <div className={`grid grid-cols-1 sm:grid-cols-2 ${trio.length === 2 ? "" : "lg:grid-cols-3"} gap-3`}>
            {locked.map((th) => {
              const openable = isOpenable(th.id);
              return (
                <button
                  key={th.id}
                  type="button"
                  onClick={() => reveal(th.id)}
                  disabled={!openable}
                  className={`group glass rounded-xl px-4 py-4 flex flex-col text-left transition-all duration-300 ${
                    openable
                      ? "cursor-pointer hover:border-accent/40 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_-12px_rgba(0,0,0,0.35)]"
                      : "cursor-default"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[15px] leading-[1.15] text-label" style={{ fontFamily: "'Instrument Serif', serif" }}>
                      {th.titre}
                    </p>
                    {/* Cadenas : au survol d'une carte ouvrable, l'anse se soulève et l'icône vire accent. */}
                    <svg
                      width="13"
                      height="13"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className={`shrink-0 transition-colors duration-300 ${openable ? "text-ghost group-hover:text-accent" : "text-ghost"}`}
                      aria-hidden
                    >
                      <rect x="5" y="11" width="14" height="9" rx="1.5" />
                      <path
                        d="M8 11V8a4 4 0 0 1 8 0v3"
                        className={`origin-bottom transition-transform duration-300 ${openable ? "group-hover:-translate-y-[3px]" : ""}`}
                      />
                    </svg>
                  </div>
                  <p className="mt-2 font-mono text-[10px] tracking-[0.12em] uppercase text-ghost/80">
                    {th.lignes.length} critère{th.lignes.length > 1 ? "s" : ""} comparé{th.lignes.length > 1 ? "s" : ""}
                  </p>
                  <p className="mt-1 text-[11.5px] leading-[1.5] text-ghost">{th.lignes.map((l) => l.label).join(" · ")}</p>
                </button>
              );
            })}
          </div>
          {!canRedirect && (
            <p className="mt-4 text-[12.5px] leading-[1.55] text-muted">
              {bindOrphans(
                open.id === initial.id
                  ? "Vous êtes revenu au thème suggéré. Vous pouvez rouvrir le vôtre ; les autres se détaillent dans le Pack."
                  : "Vous avez dévoilé votre thème. Revenez au thème suggéré si besoin ; les autres se détaillent dans le Pack, critère par critère.",
              )}
            </p>
          )}
        </>
      )}
    </section>
  );
}
