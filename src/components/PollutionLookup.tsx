'use client';

import { useState, useRef, useCallback } from 'react';

type Commune = {
  nom: string;
  code: string;
  codesPostaux?: string[];
  departement?: { nom: string };
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

const initialState = (): LookupState => ({
  inputValue: '',
  selectedCommune: null,
  dropdownOpen: false,
  suggestions: [],
  resultState: 'idle',
  resultHtml: '',
});

async function fetchCommunes(q: string): Promise<Commune[]> {
  if (q.length < 2) return [];
  try {
    const res = await fetch(
      `https://geo.api.gouv.fr/communes?nom=${encodeURIComponent(q)}&fields=nom,code,codesPostaux,departement&boost=population&limit=6`
    );
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

function useLookup(blockId: string) {
  const [state, setState] = useState<LookupState>(initialState);
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
    setState(s => ({
      ...s,
      inputValue: commune.nom,
      selectedCommune: commune,
      dropdownOpen: false,
      suggestions: [],
    }));
  }, []);

  const closeDropdown = useCallback(() => {
    setTimeout(() => setState(s => ({ ...s, dropdownOpen: false })), 200);
  }, []);

  const search = useCallback(async (commune: Commune) => {
    setState(s => ({ ...s, resultState: 'loading', resultHtml: '' }));

    try {
      let html = '';

      if (blockId === 'irep') {
        const res = await fetch(`/api/proxy/irep?insee=${encodeURIComponent(commune.code)}`);
        if (!res.ok) throw new Error(`Erreur ${res.status}`);
        const data = await res.json();
        const items: Record<string, string>[] = data.data ?? data.results ?? data ?? [];
        if (!items.length) {
          setState(s => ({ ...s, resultState: 'empty', resultHtml: 'Aucune installation classée recensée sur cette commune.' }));
          return;
        }
        html = items.slice(0, 12).map(it => {
          const nom = it.nom_ets ?? it.raisonSociale ?? it.nomEtablissement ?? 'Établissement';
          const regime = it.regime ?? it.etatActivite ?? '';
          const adresse = it.adresse ?? it.adresseL4 ?? '';
          const activite = it.activitePrincipale ?? '';
          const cls = regime === 'Autorisation' ? 'badge-alert' : regime === 'Enregistrement' ? 'badge-warn' : 'badge-neutral';
          return `<div class="lookup-result-item">
            <div class="result-name">${nom}${regime ? `<span class="result-badge ${cls}">${regime}</span>` : ''}</div>
            <div class="result-meta">${adresse}${activite ? ' · ' + activite : ''}</div>
          </div>`;
        }).join('');

      } else if (blockId === 'sis') {
        const res = await fetch(`/api/proxy/sis?insee=${encodeURIComponent(commune.code)}`);
        if (!res.ok) throw new Error(`Erreur ${res.status}`);
        const data = await res.json();
        const items: Record<string, string>[] = data.data ?? data.results ?? data ?? [];
        if (!items.length) {
          setState(s => ({ ...s, resultState: 'empty', resultHtml: 'Aucun site pollué ou ancien site industriel recensé sur cette commune dans les bases publiques.' }));
          return;
        }
        html = items.slice(0, 12).map(it => {
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

      } else if (blockId === 'atmo') {
        const res = await fetch(`/api/proxy/atmo?insee=${encodeURIComponent(commune.code)}`);
        if (!res.ok) throw new Error(`Erreur ${res.status}`);
        const data = await res.json();
        const indice = data?.indice_atmo;
        if (!indice) {
          setState(s => ({ ...s, resultState: 'empty', resultHtml: "Indice ATMO non disponible pour cette commune aujourd'hui." }));
          return;
        }
        const val = indice.valeur ?? indice.indice ?? indice.code_qual ?? 0;
        const label = indice.label ?? indice.lib_qual ?? '';
        const cls = val <= 2 ? 'badge-ok' : val <= 4 ? 'badge-warn' : 'badge-alert';
        const today = new Date().toISOString().slice(0, 10);
        const polluants: Record<string, string | number>[] = indice.polluants ?? [];
        html = `<div class="lookup-result-item">
          <div class="result-name">Indice ATMO · ${commune.nom} · ${today}<span class="result-badge ${cls}">${label || val + '/6'}</span></div>
          <div class="result-meta">${polluants.map(p => `${p.label ?? p.polluant} : ${p.valeur ?? p.indice}`).join(' · ') || 'Détail par polluant non disponible'}</div>
        </div>`;

      } else if (blockId === 'eau') {
        const res = await fetch(`/api/proxy/eau?insee=${encodeURIComponent(commune.code)}`);
        if (!res.ok) throw new Error(`Erreur ${res.status}`);
        const data = await res.json();
        const items: Record<string, string>[] = data.data ?? [];
        if (!items.length) {
          setState(s => ({ ...s, resultState: 'empty', resultHtml: "Aucun contrôle récent disponible pour cette commune dans Hub'Eau." }));
          return;
        }
        const seen = new Set<string>();
        const filtered = items.filter(it => {
          const key = it.date_prelevement;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        }).slice(0, 6);
        html = filtered.map(it => {
          const conforme = it.libelle_conclusion_conformite_prelevement?.toLowerCase().includes('conforme') ?? null;
          const cls = conforme ? 'badge-ok' : conforme === false ? 'badge-alert' : 'badge-neutral';
          const label = conforme ? 'Conforme' : conforme === false ? 'Non conforme' : 'En cours';
          return `<div class="lookup-result-item">
            <div class="result-name">${it.date_prelevement?.slice(0, 10) ?? '—'}<span class="result-badge ${cls}">${label}</span></div>
            <div class="result-meta">${it.libelle_parametre ? it.libelle_parametre + ' : ' + (it.resultat_numerique ?? '—') : ''}</div>
          </div>`;
        }).join('');
      }

      setState(s => ({ ...s, resultState: 'success', resultHtml: html }));
    } catch {
      setState(s => ({
        ...s,
        resultState: 'error',
        resultHtml: blockId === 'irep' || blockId === 'sis'
          ? 'Données temporairement indisponibles. Consultez directement georisques.gouv.fr'
          : blockId === 'atmo'
          ? "Indice ATMO indisponible pour cette commune. La couverture varie selon les régions."
          : 'Données temporairement indisponibles. Consultez directement hubeau.eaufrance.fr',
      }));
    }
  }, [blockId]);

  const onSearchClick = useCallback(() => {
    if (state.selectedCommune) search(state.selectedCommune);
  }, [state.selectedCommune, search]);

  return { state, onInput, onSelect, closeDropdown, onSearchClick };
}

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
            disabled={!state.selectedCommune}
            onClick={onSearchClick}
          >
            Rechercher
          </button>
        </div>

        {state.resultState !== 'idle' && (
          <div className={`lookup-results visible`}>
            {state.resultState === 'loading' && (
              <div className="lookup-loading">Chargement…</div>
            )}
            {state.resultState === 'empty' && (
              <div className="lookup-empty">{state.resultHtml}</div>
            )}
            {state.resultState === 'error' && (
              <div className="lookup-error">{state.resultHtml}</div>
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

export function PollutionLookup() {
  return (
    <>
      <LookupBlock
        blockId="irep"
        title="Installations industrielles à proximité"
        sub="Registre IREP · Géorisques · Rejets déclarés par substance"
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
        sub="ARS · Contrôles nitrates, pesticides, métaux"
        desc="L'ARS publie les résultats des contrôles sanitaires de l'eau potable par commune. Chaque prélèvement est daté et chiffré. Vous pouvez vérifier si des dépassements ont été signalés sur votre réseau de distribution dans les deux dernières années."
      />
    </>
  );
}
