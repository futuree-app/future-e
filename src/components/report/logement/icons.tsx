import React from "react";

// Petit jeu d'icônes AU TRAIT, discrètes, dans la sobriété du design system (aucune icône
// n'existait : on introduit un set minimal et restreint, jamais décoratif à outrance). Trait fin,
// `currentColor` (elles prennent la couleur du texte devant lequel elles se posent), aria-hidden.
// Usage : aérer certains sous-titres/labels (retour porteur 2026-07-08).
function Svg({ children, size }: { children: React.ReactNode; size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      style={{ flexShrink: 0, opacity: 0.8, display: "block" }}
    >
      {children}
    </svg>
  );
}

// Horloge — « à confirmer » (donnée datée / à vérifier).
export function IconClock({ size = 13 }: { size?: number }) {
  return <Svg size={size}><circle cx="8" cy="8" r="5.6" /><path d="M8 4.8V8l2.2 1.4" /></Svg>;
}

// Soleil — « dans le climat futur » (chaleur à venir).
export function IconSun({ size = 13 }: { size?: number }) {
  return (
    <Svg size={size}>
      <circle cx="8" cy="8" r="2.9" />
      <path d="M8 1.4v1.5M8 13.1v1.5M1.4 8h1.5M13.1 8h1.5M3.5 3.5l1.05 1.05M11.45 11.45l1.05 1.05M12.5 3.5l-1.05 1.05M4.55 11.45l-1.05 1.05" />
    </Svg>
  );
}

// Sols en couches qui se fissurent — retrait-gonflement des argiles.
export function IconStrata({ size = 13 }: { size?: number }) {
  return (
    <Svg size={size}>
      <path d="M2 5.4c2 1 4 1 6 0s4-1 6 0" />
      <path d="M2 10.6c2 1 4 1 6 0s4-1 6 0" />
      <path d="M8 6.4v3.6" />
    </Svg>
  );
}

// Ondes qui se propagent — sismicité.
export function IconSeismic({ size = 13 }: { size?: number }) {
  return (
    <Svg size={size}>
      <path d="M3.6 10.4a6 6 0 0 1 8.8 0" />
      <path d="M5.6 12a3.2 3.2 0 0 1 4.8 0" />
      <circle cx="8" cy="13.4" r="0.5" fill="currentColor" stroke="none" />
    </Svg>
  );
}
