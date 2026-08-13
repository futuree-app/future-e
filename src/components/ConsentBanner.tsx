"use client";

import { useEffect, useRef, useState } from "react";

const STORAGE_KEY = "futuree-consent";

type ConsentValue = "granted" | "denied";

function updateGoogleConsent(value: ConsentValue) {
  if (typeof window === "undefined") return;
  window.gtag?.("consent", "update", {
    analytics_storage: value,
    ad_storage: value,
    ad_user_data: value,
    ad_personalization: value,
  });
}

export function ConsentBanner() {
  const [visible, setVisible] = useState(false);
  const banniere = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        setVisible(true);
      } else {
        updateGoogleConsent(stored as ConsentValue);
      }
    } catch {
      setVisible(true);
    }

    const handler = () => {
      try { localStorage.removeItem(STORAGE_KEY); } catch {}
      setVisible(true);
    };
    window.addEventListener("futuree:show-consent", handler);
    return () => window.removeEventListener("futuree:show-consent", handler);
  }, []);

  // ════════════════════════════════════════════════════════════════════════════════════════════
  // LE BANDEAU DIT SA HAUTEUR AU RESTE DE LA PAGE (13/08/2026).
  //
  // Il est fixé en bas, pleine largeur, en `z-index: 9999`. Tout ce qui flotte au-dessus du contenu
  // passait donc dessous : le panneau d'AskFuture ouvert (`z-index: 100`) devenait illisible tant
  // que le consentement n'avait pas été donné, c'est-à-dire exactement à la PREMIÈRE visite.
  //
  // La correction ne touche à aucun `z-index` : le consentement doit rester au-dessus, on ne le
  // recouvre pas pour faire de la place. Le bandeau publie sa hauteur, et ce qui flotte s'en
  // écarte. La mesure est observée, parce que la hauteur change au retour à la ligne des boutons
  // sur un écran étroit.
  useEffect(() => {
    const racine = document.documentElement;
    if (!visible || !banniere.current) {
      racine.style.setProperty("--consent-h", "0px");
      return;
    }
    const el = banniere.current;
    const mesurer = () => racine.style.setProperty("--consent-h", `${Math.round(el.getBoundingClientRect().height)}px`);
    mesurer();
    const ro = new ResizeObserver(mesurer);
    ro.observe(el);
    return () => {
      ro.disconnect();
      // Au démontage comme au consentement : ce qui flotte reprend sa place basse.
      racine.style.setProperty("--consent-h", "0px");
    };
  }, [visible]);

  function handleConsent(value: ConsentValue) {
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch {}
    updateGoogleConsent(value);
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      ref={banniere}
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        borderTop: "1px solid var(--border-1)",
        background: "rgba(6,8,18,0.96)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        padding: "14px 24px",
        display: "flex",
        alignItems: "center",
        gap: 16,
        flexWrap: "wrap",
      }}
    >
      <p
        style={{
          margin: 0,
          flex: 1,
          fontFamily: "var(--font-mono)",
          fontSize: 11,
          letterSpacing: "0.04em",
          color: "var(--fg-3, rgba(255,255,255,0.4))",
          minWidth: 200,
        }}
      >
        futur•e mesure son audience pour améliorer le service.{" "}
        <a
          href="/politique-confidentialite"
          style={{ color: "inherit", textDecoration: "underline", textUnderlineOffset: 3 }}
        >
          En savoir plus
        </a>
      </p>
      <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
        <button
          onClick={() => handleConsent("denied")}
          style={{
            padding: "6px 14px",
            borderRadius: 8,
            border: "1px solid var(--border-2)",
            background: "transparent",
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "var(--fg-3, rgba(255,255,255,0.4))",
            cursor: "pointer",
          }}
        >
          Refuser
        </button>
        <button
          onClick={() => handleConsent("granted")}
          style={{
            padding: "6px 14px",
            borderRadius: 8,
            border: "1px solid var(--border-hi)",
            background: "var(--bg-elev-3)",
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "var(--fg-1, rgba(255,255,255,0.85))",
            cursor: "pointer",
          }}
        >
          Accepter
        </button>
      </div>
    </div>
  );
}
