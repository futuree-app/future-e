// Barre de chargement de navigation.
//
// Affichée via les fichiers `loading.tsx` des segments lourds (rapport, modules,
// dashboard, compte). Next.js la montre instantanément au clic pendant que le
// server component charge ses données (DRIAS, Géorisques, VigiEau…), ce qui
// donne un retour visuel immédiat : l'utilisateur sait que son clic a été pris.
//
// Server component pur (aucun JS client) : réutilise le keyframe global
// `wizard-loading-bar` (sweep indéterminé) déjà défini dans globals.css.

export function RouteLoadingBar({ label = "Chargement…" }: { label?: string }) {
  return (
    <div
      className="min-h-screen bg-canvas"
      style={{ fontFamily: "'Instrument Sans', sans-serif" }}
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
          background: "rgba(255,255,255,0.06)",
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

      {/* Indice central discret */}
      <div
        role="status"
        aria-live="polite"
        style={{
          position: "fixed",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
          pointerEvents: "none",
        }}
      >
        <span
          aria-hidden
          style={{
            width: 7,
            height: 7,
            borderRadius: "50%",
            background: "var(--orange)",
            animation: "future-route-pulse 1s ease-in-out infinite",
          }}
        />
        <span
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 12,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "#9ba3b4",
          }}
        >
          {label}
        </span>
      </div>

      <style>{`
        @keyframes future-route-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%      { opacity: 0.3; transform: scale(0.7); }
        }
      `}</style>
    </div>
  );
}
