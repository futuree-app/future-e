'use client';

import { useState, useRef, useCallback } from 'react';

// ── Types ────────────────────────────────────────────────────────────────────

type Commune = {
  nom: string;
  code: string;
  codesPostaux?: string[];
  departement?: { nom: string };
  centre?: { type: string; coordinates: [number, number] }; // [lon, lat]
};

type ResultState = 'idle' | 'loading' | 'success' | 'empty' | 'error';

type LookupState = {
  inputValue: string;
  selectedCommune: Commune | null;
  dropdownOpen: boolean;
  suggestions: Commune[];
  resultState: ResultState;
  resultHtml: string;
};

// ── Commune autocomplete ──────────────────────────────────────────────────────

async function fetchCommunes(q: string): Promise<Commune[]> {
  if (q.length < 2) return [];
  try {
    const res = await fetch(
      `https://geo.api.gouv.fr/communes?nom=${encodeURIComponent(q)}&fields=nom,code,codesPostaux,departement,centre&boost=population&limit=6`
    );
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

// ── IREP — installations industrielles ───────────────────────────────────────

type IrepInstallation = {
  id: number;
  nom: string;
  distanceM: number;
  nombre_polluants: number;
  milieu_emission: string | null;
};

async function searchIrep(commune: Commune): Promise<string> {
  const coords = commune.centre?.coordinates;
  if (!coords) throw new Error('Coordonnées non disponibles pour cette commune.');

  const [lon, lat] = coords;
  const res = await fetch(`/api/proxy/irep?lat=${lat}&lon=${lon}`);
  if (!res.ok) throw new Error(`Erreur ${res.status}`);

  const data = (await res.json()) as { installations?: IrepInstallation[]; count?: number };
  const items = data.installations ?? [];

  if (!items.length) return '__empty__Aucune installation industrielle classée ICPE recensée dans un rayon de 10 km autour de cette commune selon les données ADEME.';

  return items.map(it => {
    const dist = it.distanceM < 1000
      ? `${it.distanceM} m`
      : `${(it.distanceM / 1000).toFixed(1)} km`;
    const polluants = it.nombre_polluants > 0
      ? `${it.nombre_polluants} polluant${it.nombre_polluants > 1 ? 's' : ''} déclaré${it.nombre_polluants > 1 ? 's' : ''}`
      : '';
    const milieu = it.milieu_emission ?? '';
    const meta = [dist, polluants, milieu].filter(Boolean).join(' · ');
    return `<div class="lookup-result-item">
      <div class="result-name">${it.nom}</div>
      <div class="result-meta">${meta}</div>
    </div>`;
  }).join('');
}

// ── SIS / Basol — sites pollués ───────────────────────────────────────────────

async function searchSis(commune: Commune): Promise<string> {
  const res = await fetch(`/api/proxy/sis?insee=${encodeURIComponent(commune.code)}`);
  if (!res.ok) throw new Error(`Erreur ${res.status}`);

  const data = (await res.json()) as {
    data?: Array<Record<string, string>>;
    results?: Array<Record<string, string>>;
  };
  const items = data.data ?? data.results ?? [];

  if (!items.length) return '__empty__Aucun site pollué ou ancien site industriel recensé sur cette commune dans les bases Basias/Basol.';

  return items.slice(0, 12).map(it => {
    const nom = it.nom ?? it.raisonSociale ?? it.nomSite ?? 'Site';
    const statut = it.statut ?? it.etatSite ?? '';
    const adresse = it.adresse ?? it.commune ?? '';
    const type = it.baseDonnees ?? (it.sitePollue ? 'Basol' : 'Basias');
    const cls = statut?.toLowerCase().includes('traité') ? 'badge-ok' : statut ? 'badge-warn' : 'badge-neutral';
    return `<div class="lookup-result-item">
      <div class="result-name">${nom}<span class="result-badge badge-neutral">${type}</span>${statut ? `<span class="result-badge ${cls}">${statut}</span>` : ''}</div>
      <div class="result-meta">${adresse}</div>
    </div>`;
  }).join('');
}

// ── ATMO — qualité de l'air ──────────────────────────────────────────────────

type AtmoLevel = { value: number; label: string; color: string };
type AtmoData = {
  inseeCode: string;
  date: string;
  index: AtmoLevel;
  pollutants: { pm25: AtmoLevel | null; pm10: AtmoLevel | null; no2: AtmoLevel | null; o3: AtmoLevel | null };
};

const ATMO_LABELS: Record<string, string> = { pm25: 'PM2.5', pm10: 'PM10', no2: 'NO₂', o3: 'O₃' };

async function searchAtmo(commune: Commune): Promise<string> {
  const res = await fetch(`/api/atmo/${commune.code}`);
  if (res.status === 404 || res.status === 500) return "__empty__Indice ATMO non disponible pour cette commune aujourd'hui. La couverture du réseau ATMO varie selon les régions — les grandes agglomérations sont mieux couvertes.";
  if (!res.ok) throw new Error(`Erreur ${res.status}`);

  const data = (await res.json()) as AtmoData;
  const idx = data.index;
  const cls = idx.value <= 2 ? 'badge-ok' : idx.value <= 3 ? 'badge-warn' : 'badge-alert';

  const polluantLines = (Object.entries(data.pollutants) as [string, AtmoLevel | null][])
    .filter(([, v]) => v !== null)
    .map(([k, v]) => `${ATMO_LABELS[k] ?? k} <span class="result-badge ${v!.value <= 2 ? 'badge-ok' : v!.value <= 3 ? 'badge-warn' : 'badge-alert'}">${v!.label}</span>`)
    .join('&ensp;·&ensp;');

  return `<div class="lookup-result-item">
    <div class="result-name">
      Indice ATMO <span class="result-badge ${cls}">${idx.label}</span>
      <span style="font-size:11px;font-weight:400;color:var(--fg-4);font-family:var(--font-mono);margin-left:8px;">${data.date}</span>
    </div>
    <div class="result-meta">${polluantLines || 'Détail par polluant non disponible'}</div>
  </div>`;
}

// ── EAU POTABLE ───────────────────────────────────────────────────────────────

type EauData = {
  empty?: boolean;
  conformBacterio?: string | null;
  conformPhysicoChem?: string | null;
  lastSampleDate?: string | null;
  highlights?: Array<{ label: string; value: number; unit: string; threshold?: number; warn?: number }>;
};

function eauConformBadge(val: string | null | undefined): string {
  if (val === 'Conforme') return '<span class="result-badge badge-ok">Conforme</span>';
  if (val === 'Non conforme') return '<span class="result-badge badge-alert">Non conforme</span>';
  return '<span class="result-badge badge-neutral">Non renseigné</span>';
}

async function searchEau(commune: Commune): Promise<string> {
  const res = await fetch(`/api/proxy/eau?insee=${encodeURIComponent(commune.code)}`);
  if (!res.ok) throw new Error(`Erreur ${res.status}`);

  const data = (await res.json()) as EauData;
  if (data.empty) return "__empty__Aucun contrôle d'eau potable récent disponible pour cette commune dans Hub'Eau (ARS).";

  const date = data.lastSampleDate ?? '—';

  const conformLines = [
    `<div class="result-meta">Bactériologique ${eauConformBadge(data.conformBacterio)}&ensp;·&ensp;Physico-chimique ${eauConformBadge(data.conformPhysicoChem)}</div>`,
  ].join('');

  let highlightLines = '';
  if (data.highlights?.length) {
    highlightLines = data.highlights.map(h => {
      const bad = h.threshold != null && h.value > h.threshold;
      const warn = !bad && h.warn != null && h.value > h.warn;
      const cls = bad ? 'badge-alert' : warn ? 'badge-warn' : 'badge-ok';
      const note = bad ? ` — dépasse la norme (${h.threshold} ${h.unit})` : warn ? ` — zone de vigilance (> ${h.warn} ${h.unit})` : '';
      return `<div class="result-meta" style="margin-top:4px;">${h.label} : <strong style="color:var(--fg-1)">${h.value} ${h.unit}</strong><span class="result-badge ${cls}" style="margin-left:6px;">${bad ? 'Dépassement' : warn ? 'Vigilance' : 'Normal'}</span>${note}</div>`;
    }).join('');
  }

  return `<div class="lookup-result-item">
    <div class="result-name">Dernier contrôle · ${date}</div>
    ${conformLines}
    ${highlightLines}
    <div class="result-meta" style="margin-top:8px;font-size:12px;color:var(--fg-4);">Source : ARS via Hub'Eau · Les nitrates au-delà de 50 mg/L, le plomb au-delà de 10 µg/L et l'arsenic au-delà de 10 µg/L constituent des dépassements réglementaires.</div>
  </div>`;
}

// ── Hook ─────────────────────────────────────────────────────────────────────

function useLookup(blockId: string) {
  const [state, setState] = useState<LookupState>({
    inputValue: '',
    selectedCommune: null,
    dropdownOpen: false,
    suggestions: [],
    resultState: 'idle',
    resultHtml: '',
  });
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onInput = useCallback((value: string) => {
    setState(s => ({ ...s, inputValue: value, selectedCommune: null }));
    if (timer.current) clearTimeout(timer.current);
    if (value.trim().length < 2) {
      setState(s => ({ ...s, suggestions: [], dropdownOpen: false }));
      return;
    }
    timer.current = setTimeout(async () => {
      const communes = await fetchCommunes(value.trim());
      setState(s => ({ ...s, suggestions: communes, dropdownOpen: communes.length > 0 }));
    }, 280);
  }, []);

  const onSelect = useCallback((commune: Commune) => {
    setState(s => ({ ...s, inputValue: commune.nom, selectedCommune: commune, dropdownOpen: false, suggestions: [] }));
  }, []);

  const closeDropdown = useCallback(() => {
    setTimeout(() => setState(s => ({ ...s, dropdownOpen: false })), 200);
  }, []);

  const onSearchClick = useCallback(async () => {
    setState(s => {
      if (!s.selectedCommune) return s;
      return { ...s, resultState: 'loading', resultHtml: '' };
    });

    setState(s => {
      if (!s.selectedCommune) return s;
      const commune = s.selectedCommune;

      const searchFn =
        blockId === 'irep' ? searchIrep :
        blockId === 'sis'  ? searchSis  :
        blockId === 'atmo' ? searchAtmo :
        searchEau;

      searchFn(commune).then(html => {
        if (html.startsWith('__empty__')) {
          setState(ss => ({ ...ss, resultState: 'empty', resultHtml: html.slice(9) }));
        } else {
          setState(ss => ({ ...ss, resultState: 'success', resultHtml: html }));
        }
      }).catch(() => {
        const fallback =
          blockId === 'irep' || blockId === 'sis'
            ? 'Données temporairement indisponibles. Consultez directement <a href="https://georisques.gouv.fr" target="_blank" rel="noopener noreferrer" style="color:var(--accent)">georisques.gouv.fr</a>'
            : blockId === 'atmo'
            ? "Indice ATMO indisponible pour cette commune. La couverture nationale est partielle."
            : "Données temporairement indisponibles. Consultez directement <a href='https://hubeau.eaufrance.fr' target='_blank' rel='noopener noreferrer' style='color:var(--accent)'>hubeau.eaufrance.fr</a>";
        setState(ss => ({ ...ss, resultState: 'error', resultHtml: fallback }));
      });

      return s;
    });
  }, [blockId]);

  return { state, onInput, onSelect, closeDropdown, onSearchClick };
}

// ── Block component ───────────────────────────────────────────────────────────

type LookupBlockProps = {
  blockId: string;
  title: string;
  sub: string;
  desc: string;
};

function LookupBlock({ blockId, title, sub, desc }: LookupBlockProps) {
  const { state, onInput, onSelect, closeDropdown, onSearchClick } = useLookup(blockId);

  return (
    <div className="lookup-block">
      <div className="lookup-header">
        <div>
          <div className="lookup-title">{title}</div>
          <div className="lookup-sub">{sub}</div>
        </div>
      </div>
      <div className="lookup-body">
        <p className="lookup-desc">{desc}</p>
        <div className="lookup-form">
          <div className="commune-wrap">
            <input
              className="lookup-input"
              type="text"
              placeholder="Nom de commune…"
              autoComplete="off"
              value={state.inputValue}
              onChange={e => onInput(e.target.value)}
              onBlur={closeDropdown}
              onKeyDown={e => { if (e.key === 'Escape') closeDropdown(); }}
            />
            {state.dropdownOpen && (
              <div className="commune-dropdown open">
                {state.suggestions.map(c => (
                  <div
                    key={c.code}
                    className="commune-opt"
                    onMouseDown={e => { e.preventDefault(); onSelect(c); }}
                  >
                    {c.nom}
                    <span className="commune-opt-meta">
                      {c.codesPostaux?.[0] ?? ''} · {c.departement?.nom ?? ''}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <button
            className="lookup-btn"
            disabled={!state.selectedCommune || state.resultState === 'loading'}
            onClick={onSearchClick}
          >
            {state.resultState === 'loading' ? '…' : 'Rechercher'}
          </button>
        </div>

        {state.resultState !== 'idle' && (
          <div className="lookup-results visible">
            {state.resultState === 'loading' && (
              <div className="lookup-loading">Chargement…</div>
            )}
            {state.resultState === 'empty' && (
              <div className="lookup-empty">{state.resultHtml}</div>
            )}
            {state.resultState === 'error' && (
              <div className="lookup-error" dangerouslySetInnerHTML={{ __html: state.resultHtml }} />
            )}
            {state.resultState === 'success' && (
              <div dangerouslySetInnerHTML={{ __html: state.resultHtml }} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Public export ─────────────────────────────────────────────────────────────

export function PollutionLookup() {
  return (
    <>
      <LookupBlock
        blockId="irep"
        title="Installations industrielles à proximité"
        sub="Registre IREP · ADEME · Rejets déclarés par substance"
        desc="Les installations classées ICPE déclarent annuellement leurs rejets dans l'air, l'eau et les sols. Ce registre recense ce que les exploitants ont l'obligation de déclarer — pas nécessairement tout ce qui est émis, mais c'est le point de départ documenté."
      />
      <LookupBlock
        blockId="sis"
        title="Anciens sites industriels et sites pollués"
        sub="Bases Basias & Basol · Géorisques"
        desc="Basias recense les anciens sites industriels susceptibles d'avoir engendré une pollution des sols. Basol recense les sites dont la pollution est avérée et fait l'objet d'une procédure administrative. Beaucoup de zones pavillonnaires et de jardins sont construits sur d'anciens terrains industriels dont l'histoire est oubliée."
      />
      <LookupBlock
        blockId="atmo"
        title="Qualité de l'air aujourd'hui"
        sub="Indice ATMO · PM2.5, PM10, NO₂, O₃"
        desc="L'indice ATMO intègre les principaux polluants atmosphériques. Il est utile pour les épisodes de pollution, moins pour comprendre l'exposition chronique de fond — qui est plus déterminante sur le long terme que les pics ponctuels."
      />
      <LookupBlock
        blockId="eau"
        title="Qualité de l'eau potable"
        sub="ARS · Contrôles nitrates, pesticides, plomb, arsenic"
        desc="L'ARS publie les résultats des contrôles sanitaires de l'eau potable par commune. Vous pouvez vérifier la conformité bactériologique et physico-chimique, ainsi que les teneurs en nitrates, plomb et arsenic si des analyses récentes sont disponibles."
      />
    </>
  );
}
