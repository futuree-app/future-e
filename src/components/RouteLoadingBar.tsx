// Écran d'attente de navigation.
//
// Affiché via les fichiers `loading.tsx` des segments lourds. Next.js le montre instantanément au clic
// pendant que le server component charge ses données : le lecteur sait que son clic a été pris.
//
// SERVER COMPONENT PUR, ET ÇA CONDITIONNE TOUTE LA MÉCANIQUE. La séquence est en CSS, sans une ligne
// de JS et sans état : un `Math.random()` ou un `setInterval` rendrait ce fallback dynamique, donc plus
// lent à apparaître, ce qui lui retirerait sa seule raison d'être. La variété entre écrans vient du
// SEGMENT (un jeu par contexte, cf. `loading-messages.ts`), celle dans le temps vient de l'ATTENTE
// RÉELLE. Personne ne lit un message qui s'en va avant d'avoir été lu.
//
// UN SEUL TEXTE À LA FOIS. Une version précédente empilait un statut en mono et une phrase en serif
// simultanément : deux registres pour dire une seule chose, et un statut générique qui se répétait
// d'un état à l'autre. Ici les états se succèdent, et le registre suit la nature du texte, ce qui
// donne une progression lisible du concret vers le sens : la MATIÈRE en mono, ce qui est réellement
// chargé, puis les PHRASES en serif, ce que cette lecture permet de comprendre, puis le délai.
//
// Réutilise le keyframe global `wizard-loading-bar` (sweep indéterminé) de globals.css.

import {
  LOADING_MESSAGES,
  D_APPARITION,
  D_SORTIE,
  instantDeLEtat,
  type LoadingMessages,
} from "@/lib/loading-messages";

const EASE_OUT = "cubic-bezier(0.16, 1, 0.3, 1)";

// La chaîne `animation` d'un état selon sa place. Chacun apparaît à son instant ; tous sortent à
// l'arrivée du suivant, sauf le dernier qui reste. Calculée côté serveur, sans aucune valeur non
// déterministe, pour que ce fallback demeure prérendable, donc instantané.
function animationDeLEtat(index: number, total: number): string {
  const entree = `future-loading-in ${D_APPARITION}s ${EASE_OUT} ${instantDeLEtat(index)}s forwards`;
  if (index === total - 1) return entree;
  const sortie = `future-loading-out ${D_SORTIE}s ease-in ${instantDeLEtat(index + 1)}s forwards`;
  return `${entree}, ${sortie}`;
}

export function RouteLoadingBar({
  label,
  messages = LOADING_MESSAGES.rapport,
}: {
  /** Libellé fixe. Remplace toute la séquence : l'appelant sait ce qu'il fait attendre. */
  label?: string;
  messages?: LoadingMessages;
}) {
  // La matière d'abord, puis les phrases. Un libellé imposé tient tout seul.
  const etats = label ? [label] : [messages.matiere, ...messages.suites];

  return (
    <div
      className="min-h-screen bg-canvas"
      style={{ fontFamily: "var(--font-sans)" }}
    >
      {/* Barre indéterminée fixée en haut de page */}
      <div
        aria-hidden
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          overflow: "hidden",
          zIndex: 9999,
          background: "rgba(127,127,127,0.10)",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            height: "100%",
            background: "var(--orange)",
            boxShadow: "0 0 10px var(--orange)",
            animation: "wizard-loading-bar 1.1s ease-in-out infinite",
          }}
        />
      </div>

      <div
        role="status"
        aria-live="polite"
        style={{
          position: "fixed",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 20,
          padding: "0 28px",
          pointerEvents: "none",
        }}
      >
        {/* UN SEUL texte pour les lecteurs d'écran. Les états visuels sont aria-hidden : sans ça, la
            synthèse vocale lirait toute la séquence d'un coup, dont des lignes invisibles. */}
        <span className="future-loading-sr">{label ?? "Chargement"}</span>

        <span aria-hidden className="future-loading-dot" />

        {/* Les états se superposent dans la même cellule de grille : la cellule prend la hauteur du
            plus grand, donc aucune bascule ne déplace quoi que ce soit. */}
        <span aria-hidden style={{ display: "grid", alignItems: "center", justifyItems: "center" }}>
          {etats.map((texte, i) => (
            <span
              key={texte}
              className={i === 0 ? "future-loading-matiere" : "future-loading-phrase"}
              style={{
                gridArea: "1 / 1",
                animation: animationDeLEtat(i, etats.length),
              }}
            >
              {texte}
            </span>
          ))}
        </span>
      </div>

      <style>{`
        .future-loading-sr {
          position: absolute;
          width: 1px; height: 1px;
          margin: -1px; padding: 0;
          overflow: hidden;
          clip-path: inset(50%);
          white-space: nowrap;
          border: 0;
        }

        .future-loading-dot {
          width: 7px; height: 7px;
          border-radius: 50%;
          background: var(--orange);
          flex-shrink: 0;
          animation: future-route-pulse 1s ease-in-out infinite;
        }

        /* Les deux registres. Tous les états démarrent invisibles, y compris la matière : rien ne
           s'affiche avant son instant, ce qui évite le flash sur une navigation instantanée. */
        .future-loading-matiere,
        .future-loading-phrase {
          opacity: 0;
          text-align: center;
          margin: 0;
        }

        .future-loading-matiere {
          font-family:var(--font-mono);
          font-size: 12px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--fg-3);
          max-width: 30ch;
          line-height: 1.7;
        }

        .future-loading-phrase {
          font-family:var(--font-serif);
          font-size: clamp(19px, 2.4vw, 25px);
          line-height: 1.28;
          letter-spacing: -0.4px;
          color: var(--fg-2);
          max-width: 34ch;
        }

        @keyframes future-route-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%      { opacity: 0.3; transform: scale(0.7); }
        }
        @keyframes future-loading-out {
          to { opacity: 0; }
        }
        @keyframes future-loading-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }

        /* Sans mouvement : la puce cesse de battre et la matière est là d'emblée. Une bascule de texte
           sans transition serait un saut, donc la séquence ne démarre jamais et les états suivants
           restent à l'opacité 0 que porte leur classe. */
        @media (prefers-reduced-motion: reduce) {
          .future-loading-dot,
          .future-loading-matiere,
          .future-loading-phrase { animation: none; }
          .future-loading-matiere { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
