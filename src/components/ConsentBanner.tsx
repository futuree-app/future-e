"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { EVENEMENT_CHANGEMENT_CONSENTEMENT } from "@/lib/mesure-audience-regles";

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

// FUT-181 : la bannière écrit le choix, SEULE source de vérité ; PostHog le relit
// (`@/lib/mesure-audience-regles`, même clé, liée par un test). Ce signal prévient seulement que le
// choix a changé dans cet onglet (les autres onglets reçoivent l'événement `storage`).
function annoncerChangement() {
  try { window.dispatchEvent(new Event(EVENEMENT_CHANGEMENT_CONSENTEMENT)); } catch {}
}

// CE QUE LE NAVIGATEUR A DÉJÀ RETENU, lu sans effet (FUT-121). Le serveur ne connaît pas le
// stockage du navigateur : il rend le bandeau masqué (`SERVEUR`), et React relit la valeur réelle
// juste après l'hydratation. C'est la séquence qu'assurait l'ancien affichage déclenché dans un
// effet, sans le rendu en cascade. Stockage illisible : traité comme « aucun choix », donc bandeau
// affiché, comme avant.
const SERVEUR = "serveur";
const AUCUN_CHOIX = "";
function lireChoixStocke(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? AUCUN_CHOIX;
  } catch {
    return AUCUN_CHOIX;
  }
}
// Rien à écouter : dans cet onglet, les changements passent par les décisions ci-dessous.
const sansAbonnement = () => () => {};

export function ConsentBanner() {
  const choixStocke = useSyncExternalStore(sansAbonnement, lireChoixStocke, () => SERVEUR);
  // Une DÉCISION de cette page (accepter, refuser, rouvrir) prime sur le stockage. Elle tient même
  // quand le stockage refuse l'écriture : le bandeau se ferme au clic, comme avant.
  const [decision, setDecision] = useState<"afficher" | "masquer" | null>(null);
  const visible = decision !== null ? decision === "afficher" : choixStocke === AUCUN_CHOIX;
  const banniere = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) updateGoogleConsent(stored as ConsentValue);
    } catch {}

    const handler = () => {
      try { localStorage.removeItem(STORAGE_KEY); } catch {}
      // Rouvrir les préférences efface le choix : la mesure s'arrête jusqu'au prochain clic. Google
      // aussi (contre-revue FUT-181) : sans choix enregistré, il revient au refus par défaut, comme PostHog.
      updateGoogleConsent("denied");
      annoncerChangement();
      setDecision("afficher");
    };
    // FUT-181 : un choix fait dans un AUTRE onglet s'applique aussi à Google dans celui-ci. PostHog
    // écoute le même événement de son côté (`PostHogProvider`). Même règle que PostHog : seule la valeur
    // exacte « granted » ouvre ; un choix effacé (préférences rouvertes, `key` nulle d'un `clear()`) ou
    // inconnu vaut refus.
    const autreOnglet = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY && e.key !== null) return;
      updateGoogleConsent(e.key !== null && e.newValue === "granted" ? "granted" : "denied");
    };
    window.addEventListener("futuree:show-consent", handler);
    window.addEventListener("storage", autreOnglet);
    return () => {
      window.removeEventListener("futuree:show-consent", handler);
      window.removeEventListener("storage", autreOnglet);
    };
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
    // PostHog relit le stockage : une écriture refusée (stockage bloqué) laisse donc la mesure
    // éteinte, même après « Accepter ». Google, lui, reçoit le choix de la page, comme avant.
    annoncerChangement();
    setDecision("masquer");
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
