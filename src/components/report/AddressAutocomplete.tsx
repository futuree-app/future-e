"use client";

import { useEffect, useId, useRef, useState } from "react";
import { autocompleteBanAddress, type BanAddressResult } from "@/lib/ban";

// Autocomplétion d'adresse : SEULE la sélection d'une suggestion (clic ou Entrée) déclenche
// l'analyse en amont. Le texte libre n'est jamais pris pour une adresse validée. Requête
// précédente annulée à chaque frappe ; réponses hors-ordre ignorées via un jeton de séquence.
export function AddressAutocomplete({
  onSelect, placeholder,
}: { onSelect: (a: BanAddressResult) => void; placeholder?: string }) {
  const [q, setQ] = useState("");
  const [items, setItems] = useState<BanAddressResult[]>([]);
  const [active, setActive] = useState(-1);
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "empty" | "error">("idle");
  const [selected, setSelected] = useState<BanAddressResult | null>(null);
  const seq = useRef(0);
  const abortRef = useRef<AbortController | null>(null);
  const listId = useId();

  // Requête trop courte / adresse déjà choisie : on ne touche pas au state (les résidus
  // éventuels sont masqués au rendu, gaté sur la longueur). Tous les setState vivent dans le
  // callback du timeout (asynchrone), jamais dans le corps de l'effet.
  useEffect(() => {
    if (selected || q.trim().length < 3) return;
    const my = ++seq.current;
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    const t = setTimeout(async () => {
      setStatus("loading");
      try {
        const res = await autocompleteBanAddress(q, ctrl.signal);
        if (my !== seq.current) return; // réponse hors-ordre
        setItems(res); setActive(-1); setOpen(true);
        setStatus(res.length === 0 ? "empty" : "idle");
      } catch (e) {
        if ((e as Error)?.name === "AbortError" || my !== seq.current) return;
        setStatus("error");
      }
    }, 250);
    return () => clearTimeout(t);
  }, [q, selected]);

  const queryReady = q.trim().length >= 3;

  function choose(a: BanAddressResult) {
    setSelected(a); setQ(a.label); setOpen(false); setItems([]);
    onSelect(a);
  }

  if (selected) {
    return (
      <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
        <span style={{ fontSize: 15, color: "var(--fg-hi)", fontWeight: 500 }}>{selected.label}</span>
        <span style={{ fontSize: 12, color: "var(--fg-4)", fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Adresse sélectionnée</span>
        <button type="button" onClick={() => { setSelected(null); setQ(""); }}
          style={{ fontSize: 12.5, color: "var(--accent-dim, #7a6e60)", textDecoration: "underline", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
          Modifier l&apos;adresse
        </button>
      </div>
    );
  }

  return (
    <div style={{ position: "relative" }}>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={placeholder ?? "Entrez une adresse"}
        role="combobox" aria-expanded={open} aria-controls={listId} aria-autocomplete="list"
        onKeyDown={(e) => {
          if (!open || items.length === 0) return;
          if (e.key === "ArrowDown") { e.preventDefault(); setActive((i) => Math.min(i + 1, items.length - 1)); }
          else if (e.key === "ArrowUp") { e.preventDefault(); setActive((i) => Math.max(i - 1, 0)); }
          else if (e.key === "Enter") { e.preventDefault(); if (active >= 0) choose(items[active]); }
          else if (e.key === "Escape") { setOpen(false); }
        }}
        style={{ width: "100%", padding: "12px 14px", fontSize: 15, background: "var(--bg-elev)", border: "1px solid var(--border-1)", borderRadius: 10, color: "var(--fg-1)" }}
      />
      {queryReady && status === "loading" && <div style={hint}>Recherche…</div>}
      {queryReady && status === "empty" && <div style={hint}>Aucune adresse trouvée.</div>}
      {queryReady && status === "error" && <div style={hint}>Recherche d&apos;adresse momentanément indisponible.</div>}
      {queryReady && open && items.length > 0 && (
        <ul role="listbox" id={listId} style={{ position: "absolute", zIndex: 40, left: 0, right: 0, margin: "6px 0 0", padding: 4, listStyle: "none", background: "var(--bg-elev)", border: "1px solid var(--border-1)", borderRadius: 10, maxHeight: 280, overflowY: "auto" }}>
          {items.map((a, i) => (
            <li key={a.id ?? i} role="option" aria-selected={i === active}
              onMouseDown={(e) => { e.preventDefault(); choose(a); }}
              onMouseEnter={() => setActive(i)}
              style={{ padding: "10px 12px", borderRadius: 8, cursor: "pointer", fontSize: 14, color: "var(--fg-1)", background: i === active ? "var(--bg-card, rgba(255,255,255,0.05))" : "transparent" }}>
              {a.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

const hint: React.CSSProperties = { fontSize: 12.5, color: "var(--fg-4)", marginTop: 6 };
