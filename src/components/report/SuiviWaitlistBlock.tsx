"use client";

import { useEffect, useRef } from "react";
import { usePostHog } from "posthog-js/react";

const WAITLIST_URL = "https://futur-e.fr/suivi-bientot";

type Props = {
  commune: string | null;
  inseeCode: string | null;
  moduleId: string;
};

// Bloc de transition vers la liste d'attente du Suivi futur•e.
// Le Suivi n'est pas encore disponible : on présente exclusivement une
// inscription à la liste d'attente, jamais comme un produit commercialisable.
//
// Posthog :
//   - follow_waitlist_cta_viewed   : impression (déclenchée à l'apparition,
//                                    via IntersectionObserver pour éviter de
//                                    compter les vues en bas de page jamais lues)
//   - follow_waitlist_cta_clicked  : clic sur le CTA
export function SuiviWaitlistBlock({ commune, inseeCode, moduleId }: Props) {
  const posthog = usePostHog();
  const rootRef = useRef<HTMLDivElement>(null);
  const viewedRef = useRef(false);

  useEffect(() => {
    if (!posthog || !rootRef.current) return;
    const node = rootRef.current;
    const obs = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && !viewedRef.current) {
            viewedRef.current = true;
            posthog.capture("follow_waitlist_cta_viewed", {
              report_id: inseeCode,
              commune,
              module: moduleId,
              source: "end_of_module",
            });
            obs.disconnect();
          }
        }
      },
      { threshold: 0.4 },
    );
    obs.observe(node);
    return () => obs.disconnect();
  }, [posthog, commune, inseeCode, moduleId]);

  function onClick() {
    posthog?.capture("follow_waitlist_cta_clicked", {
      report_id: inseeCode,
      commune,
      module: moduleId,
      source: "end_of_module",
    });
  }

  return (
    <div ref={rootRef} className="mt-14">
      <div className="border-t border-white/[0.08] mb-10" />
      <div>
        <p
          className="italic text-[clamp(22px,2.2vw,30px)] leading-[1.3] text-label mb-5"
          style={{ fontFamily: "'Instrument Serif', serif" }}
        >
          Les données évoluent.<br />Le territoire aussi.
        </p>
        <p className="text-[15px] leading-[1.72] text-muted mb-3">
          Ce rapport est une photographie.
        </p>
        <p className="text-[15px] leading-[1.72] text-muted mb-7">
          Votre commune continuera d&apos;évoluer dans les années à venir. Le Suivi futur•e permettra bientôt d&apos;être informé automatiquement des évolutions importantes concernant votre territoire.
        </p>
        <a
          href={WAITLIST_URL}
          target="_blank"
          rel="noopener noreferrer"
          onClick={onClick}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-lg no-underline text-[14px] font-semibold"
          style={{
            background: "rgba(200, 184, 154, 0.12)",
            border: "1px solid rgba(200, 184, 154, 0.4)",
            color: "#c8b89a",
            fontFamily: "'Instrument Sans', sans-serif",
          }}
        >
          Être informé du lancement
          <span aria-hidden="true">→</span>
        </a>
      </div>
    </div>
  );
}
