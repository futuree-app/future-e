"use client";

import { useEffect, useState } from "react";

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
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        borderTop: "1px solid rgba(255,255,255,0.07)",
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
          fontFamily: "var(--font-mono, monospace)",
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
            border: "1px solid rgba(255,255,255,0.10)",
            background: "transparent",
            fontFamily: "var(--font-mono, monospace)",
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
            border: "1px solid rgba(255,255,255,0.15)",
            background: "rgba(255,255,255,0.06)",
            fontFamily: "var(--font-mono, monospace)",
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
