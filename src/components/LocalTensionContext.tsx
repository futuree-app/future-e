/**
 * LocalTensionContext — Server Component
 *
 * Requiert cette table Supabase :
 *
 *   communes_tension (
 *     id            uuid PRIMARY KEY,
 *     insee_code    text NOT NULL,
 *     nom_commune   text NOT NULL,
 *     code_postal   text NOT NULL,
 *     departement   text,
 *     slug          text NOT NULL,   -- ex: 'canicule', 'submersion', 'cadmium'
 *     score         integer NOT NULL DEFAULT 0,  -- score global 0–100
 *     ind_exposition    numeric,  -- exposition physique au risque
 *     ind_vulnerabilite numeric,  -- vulnérabilité socio-économique
 *     ind_adaptation    numeric,  -- capacité d'adaptation locale
 *     ind_occurrence    numeric,  -- fréquence historique d'occurrence
 *     updated_at    timestamptz DEFAULT now()
 *   )
 *   CREATE INDEX ON communes_tension (slug, score DESC);
 */

import { unstable_cache } from 'next/cache';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';

type CommuneTension = {
  insee_code: string;
  nom_commune: string;
  departement: string | null;
  score: number;
  ind_exposition: number | null;
  ind_vulnerabilite: number | null;
  ind_adaptation: number | null;
  ind_occurrence: number | null;
};

const fetchTopCommunesByRisk = unstable_cache(
  async (slug: string): Promise<CommuneTension[]> => {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    );

    const { data, error } = await supabase
      .from('communes_tension')
      .select(
        'insee_code, nom_commune, departement, score, ind_exposition, ind_vulnerabilite, ind_adaptation, ind_occurrence',
      )
      .eq('slug', slug)
      .order('score', { ascending: false })
      .limit(50);

    if (error) {
      console.error('[LocalTensionContext] Supabase error:', error.message);
      return [];
    }

    return data ?? [];
  },
  ['communes-tension-top50'],
  { revalidate: 86400, tags: ['communes-tension'] },
);

interface LocalTensionContextProps {
  slug: string;
  thematique: string;
  accent?: string;
  limit?: number;
}

export async function LocalTensionContext({
  slug,
  thematique,
  accent = '#f87171',
  limit = 50,
}: LocalTensionContextProps) {
  const allCommunes = await fetchTopCommunesByRisk(slug);
  const communes = allCommunes.slice(0, limit);

  if (communes.length === 0) return null;

  const accentSoft = accent + '1a';
  const accentBorder = accent + '40';

  const INDICATORS = [
    { key: 'ind_exposition', label: 'Exposition' },
    { key: 'ind_vulnerabilite', label: 'Vulnérabilité' },
    { key: 'ind_adaptation', label: 'Adaptation' },
    { key: 'ind_occurrence', label: 'Occurrence' },
  ] as const;

  return (
    <section
      className="bg-glass-card border-strong"
      style={{ margin: '56px 0', padding: '32px', borderRadius: '12px' }}
    >
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <div
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '11px',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: accent,
            marginBottom: '10px',
          }}
        >
          Territoires les plus exposés · Top {communes.length}
        </div>
        <h2
          style={{
            fontFamily: "'Instrument Serif', serif",
            fontSize: 'clamp(22px, 2.5vw, 30px)',
            fontWeight: 400,
            color: '#e9ecf2',
            margin: '0 0 8px',
            lineHeight: 1.2,
          }}
        >
          Les communes les plus exposées au risque{' '}
          <em style={{ fontStyle: 'italic', color: accent }}>{thematique}</em>
        </h2>
        <p
          style={{
            margin: 0,
            fontSize: '14px',
            color: '#6b7388',
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          Score de tension calculé sur 4 indicateurs · mise à jour quotidienne
        </p>
      </div>

      {/* Table header */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '2.5rem 1fr repeat(4, 56px)',
          gap: '8px',
          padding: '0 12px 10px',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          marginBottom: '6px',
        }}
      >
        <span />
        <span
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '10px',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: '#6b7388',
          }}
        >
          Commune
        </span>
        {INDICATORS.map((ind) => (
          <span
            key={ind.key}
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '10px',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: '#6b7388',
              textAlign: 'center',
            }}
          >
            {ind.label}
          </span>
        ))}
      </div>

      {/* Rows */}
      <div style={{ display: 'grid', gap: '2px' }}>
        {communes.map((commune, i) => {
          const isPodium = i < 3;
          return (
            <Link
              key={commune.insee_code}
              href={`/savoir/${slug}/${commune.insee_code}`}
              style={{
                display: 'grid',
                gridTemplateColumns: '2.5rem 1fr repeat(4, 56px)',
                alignItems: 'center',
                gap: '8px',
                padding: '12px',
                background: isPodium ? accentSoft : 'transparent',
                border: isPodium
                  ? `1px solid ${accentBorder}`
                  : '1px solid transparent',
                borderRadius: '6px',
                textDecoration: 'none',
                transition: 'background 0.15s, border-color 0.15s',
              }}
            >
              {/* Rank */}
              <span
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '12px',
                  color: isPodium ? accent : '#4a5468',
                  fontWeight: isPodium ? 600 : 400,
                  textAlign: 'right',
                }}
              >
                {String(i + 1).padStart(2, '0')}
              </span>

              {/* Commune info */}
              <div>
                <div
                  style={{
                    color: '#e9ecf2',
                    fontSize: '14px',
                    fontWeight: 500,
                    lineHeight: 1.3,
                  }}
                >
                  {commune.nom_commune}
                </div>
                <div
                  style={{
                    color: '#6b7388',
                    fontSize: '11px',
                    fontFamily: "'JetBrains Mono', monospace",
                    marginTop: '2px',
                  }}
                >
                  Dept. {commune.departement ?? commune.insee_code.slice(0, 2)}
                </div>
              </div>

              {/* 4 indicators */}
              {INDICATORS.map((ind) => {
                const val = commune[ind.key];
                return (
                  <div
                    key={ind.key}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '3px',
                    }}
                  >
                    {val != null ? (
                      <>
                        <div
                          style={{
                            width: '36px',
                            height: '3px',
                            background: 'rgba(255,255,255,0.08)',
                            borderRadius: '2px',
                            overflow: 'hidden',
                          }}
                        >
                          <div
                            style={{
                              width: `${Math.min(100, val)}%`,
                              height: '100%',
                              background: accent,
                              borderRadius: '2px',
                            }}
                          />
                        </div>
                        <span
                          style={{
                            fontFamily: "'JetBrains Mono', monospace",
                            fontSize: '11px',
                            color: '#9ba3b4',
                          }}
                        >
                          {Math.round(val)}
                        </span>
                      </>
                    ) : (
                      <span style={{ color: '#4a5468', fontSize: '11px' }}>—</span>
                    )}
                  </div>
                );
              })}
            </Link>
          );
        })}
      </div>

      {/* Footer */}
      <div
        style={{
          marginTop: '20px',
          paddingTop: '16px',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '8px',
        }}
      >
        <span
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '11px',
            color: '#4a5468',
            letterSpacing: '0.06em',
          }}
        >
          {communes.length} communes · Score de tension agrégé
        </span>
        <span
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '11px',
            color: '#4a5468',
          }}
        >
          Mis à jour toutes les 24h via ISR
        </span>
      </div>
    </section>
  );
}
