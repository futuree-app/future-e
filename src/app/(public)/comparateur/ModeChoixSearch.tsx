"use client";

import { useCallback, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import posthog from "posthog-js";

// Saisie « mode choix » : le lecteur NOMME 2 à 3 communes qu'il veut départager.
// Distincte du parcours /ou-vivre (qui PROPOSE un trio) : ici il n'y a pas de
// préférences, juste des communes connues. Autocomplétion BAN (citycode = INSEE).
// Navigue vers /comparateur?communes=I1,I2[,I3] ; la page serveur fait le reste.
// Piège PLM : « Paris/Lyon/Marseille » en municipality renvoie le code commune
// (75056/69123/13055) absent de l'index par arrondissement. On invite à choisir
// un arrondissement (« Paris 11e »), géré honnêtement côté page si le code passe.

type CommuneHit = {
  code: string;
  nom: string;
  codePostal: string | null;
  codeDepartement: string | null;
};

type BanFeature = {
  properties?: {
    citycode?: string;
    municipality?: string;
    city?: string;
    postcode?: string;
    depcode?: string;
  };
};

type Selected = { code: string; nom: string };

type SlotState = {
  value: string;
  selected: Selected | null;
  results: CommuneHit[];
  open: boolean;
  loading: boolean;
};

const EMPTY: SlotState = { value: "", selected: null, results: [], open: false, loading: false };

const MIN_SLOTS = 2;
const MAX_SLOTS = 3;

async function banSearch(query: string, limit: number): Promise<CommuneHit[]> {
  const res = await fetch(
    `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(query)}&limit=${limit}&type=municipality`,
  );
  const payload = await res.json();
  return Array.isArray(payload?.features)
    ? payload.features
        .map((f: BanFeature) => ({
          code: f.properties?.citycode ?? "",
          nom: f.properties?.municipality ?? f.properties?.city ?? "",
          codePostal: f.properties?.postcode ?? null,
          codeDepartement: f.properties?.depcode ?? null,
        }))
        .filter((h: CommuneHit) => Boolean(h.code && h.nom))
    : [];
}

export function ModeChoixSearch({ initial = [] }: { initial?: Selected[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const debounce = useRef<Array<ReturnType<typeof setTimeout> | undefined>>([]);

  // Au moins 2 slots ; on pré-remplit avec l'éventuelle sélection courante.
  const [slots, setSlots] = useState<SlotState[]>(() => {
    const base = Array.from({ length: MIN_SLOTS }, () => ({ ...EMPTY }));
    initial.slice(0, MAX_SLOTS).forEach((s, i) => {
      if (i >= base.length) base.push({ ...EMPTY });
      base[i] = { ...EMPTY, value: s.nom, selected: s };
    });
    return base;
  });

  const update = useCallback((i: number, updater: (prev: SlotState) => SlotState) => {
    setSlots((prev) => prev.map((s, j) => (j === i ? updater(s) : s)));
  }, []);

  const search = useCallback(
    async (i: number, query: string) => {
      if (query.trim().length < 2) {
        update(i, (s) => ({ ...s, loading: false, results: [], open: false }));
        return;
      }
      update(i, (s) => ({ ...s, loading: true }));
      try {
        const data = await banSearch(query, 8);
        update(i, (s) =>
          s.value.trim().toLowerCase() !== query.trim().toLowerCase()
            ? s
            : { ...s, loading: false, results: data, open: data.length > 0 },
        );
      } catch {
        update(i, (s) => ({ ...s, loading: false, results: [], open: false }));
      }
    },
    [update],
  );

  function handleChange(i: number, value: string) {
    update(i, (s) => ({
      ...s,
      value,
      selected:
        s.selected && s.selected.nom.toLowerCase() === value.trim().toLowerCase() ? s.selected : null,
    }));
    clearTimeout(debounce.current[i]);
    debounce.current[i] = setTimeout(() => void search(i, value), 220);
  }

  function handleSelect(i: number, hit: CommuneHit) {
    update(i, () => ({ value: hit.nom, selected: { code: hit.code, nom: hit.nom }, results: [], open: false, loading: false }));
  }

  async function resolve(i: number): Promise<Selected | null> {
    const s = slots[i];
    if (s.selected) return s.selected;
    if (s.value.trim().length < 2) return null;
    try {
      const data = await banSearch(s.value, 1);
      const first = data[0];
      if (!first) return null;
      handleSelect(i, first);
      return { code: first.code, nom: first.nom };
    } catch {
      return null;
    }
  }

  function addSlot() {
    setSlots((prev) => (prev.length >= MAX_SLOTS ? prev : [...prev, { ...EMPTY }]));
  }

  function removeSlot(i: number) {
    setSlots((prev) => (prev.length <= MIN_SLOTS ? prev : prev.filter((_, j) => j !== i)));
  }

  async function run() {
    const resolved = await Promise.all(slots.map((_, i) => resolve(i)));
    const picked = resolved.filter((r): r is Selected => r != null);
    // Dédoublonnage par code : comparer une commune à elle-même n'a pas de sens.
    const seen = new Set<string>();
    const uniq = picked.filter((p) => (seen.has(p.code) ? false : (seen.add(p.code), true)));
    if (uniq.length < MIN_SLOTS) return;

    posthog.capture("mode_choix_compared", {
      n: uniq.length,
      insees: uniq.map((p) => p.code),
      communes: uniq.map((p) => p.nom),
    });

    const params = new URLSearchParams();
    params.set("communes", uniq.map((p) => p.code).join(","));
    startTransition(() => router.push(`/comparateur?${params.toString()}`, { scroll: false }));
  }

  const readyCount = slots.filter((s) => s.selected || s.value.trim().length >= 2).length;
  const ready = readyCount >= MIN_SLOTS;

  return (
    <div className="glass rounded-2xl p-6 md:p-7">
      <div className="space-y-3">
        {slots.map((s, i) => (
          // z élevé sur le slot OUVERT : sinon la liste déroulante d'un champ passe
          // SOUS le champ suivant (qui est peint après dans le DOM).
          <div key={i} className={`relative ${s.open ? "z-30" : "z-0"}`}>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[11px] text-accent w-6 shrink-0">{String(i + 1).padStart(2, "0")}</span>
              <div className="relative flex-1">
                <input
                  type="text"
                  value={s.value}
                  onChange={(e) => handleChange(i, e.target.value)}
                  onFocus={() => s.results.length > 0 && update(i, (p) => ({ ...p, open: true }))}
                  onBlur={() => setTimeout(() => update(i, (p) => ({ ...p, open: false })), 150)}
                  placeholder={i < MIN_SLOTS ? "Nom d'une commune" : "Une 3e commune (facultatif)"}
                  className="w-full rounded-lg bg-white/[0.04] border border-white/[0.12] px-4 py-3 text-[15px] text-label placeholder:text-ghost outline-none focus:border-accent/60 transition-colors"
                  aria-label={`Commune ${i + 1}`}
                  autoComplete="off"
                />
                {s.open && s.results.length > 0 && (
                  <ul
                    className="absolute z-30 left-0 right-0 mt-1 rounded-lg border border-white/[0.12] overflow-hidden"
                    style={{ background: "#0b101c", boxShadow: "0 16px 40px rgba(0,0,0,0.5)" }}
                  >
                    {s.results.map((hit) => (
                      <li key={`${hit.code}-${hit.codePostal}`}>
                        <button
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            handleSelect(i, hit);
                          }}
                          className="w-full text-left px-4 py-2.5 hover:bg-white/[0.06] transition-colors"
                        >
                          <span className="text-[14px] text-label">{hit.nom}</span>
                          {hit.codePostal && <span className="text-[12px] text-muted ml-2">{hit.codePostal}</span>}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              {slots.length > MIN_SLOTS && (
                <button
                  type="button"
                  onClick={() => removeSlot(i)}
                  className="text-muted hover:text-label text-[18px] leading-none px-1.5 shrink-0"
                  aria-label="Retirer cette commune"
                >
                  ×
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3 mt-5">
        <button
          type="button"
          onClick={run}
          disabled={!ready || isPending}
          className="px-6 py-3 rounded-lg bg-accent text-canvas font-semibold text-[14px] disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
        >
          {isPending ? "Comparaison…" : "Comparer"}
        </button>
        {slots.length < MAX_SLOTS && (
          <button
            type="button"
            onClick={addSlot}
            className="font-mono text-[12px] tracking-[0.04em] text-muted hover:text-label transition-colors"
          >
            + ajouter une 3e commune
          </button>
        )}
      </div>
      <p className="mt-3 text-[12px] leading-[1.5] text-ghost">
        Pour Paris, Lyon ou Marseille, choisissez un arrondissement (« Paris 11e »).
      </p>
    </div>
  );
}
