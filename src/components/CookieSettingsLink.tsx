"use client";

export function CookieSettingsLink({ style }: { style?: React.CSSProperties }) {
  return (
    <button
      onClick={() => window.dispatchEvent(new Event("futuree:show-consent"))}
      style={{
        background: "none",
        border: "none",
        padding: 0,
        cursor: "pointer",
        fontFamily: "inherit",
        fontSize: "inherit",
        color: "inherit",
        textDecoration: "underline",
        textUnderlineOffset: 3,
        ...style,
      }}
    >
      Gestion des cookies
    </button>
  );
}
