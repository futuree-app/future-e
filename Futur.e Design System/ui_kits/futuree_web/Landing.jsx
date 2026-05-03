/* global React */
const { useState } = React;

const TENSIONS = [
  { id: 'acheter_littoral', label: 'Faut-il acheter sur le littoral ?', sub: 'Submersion, assurance, DPE', tone: 'orange',
    verdict: 'À acheter avec les yeux ouverts.',
    detail: "La Rochelle présente un risque de submersion en hausse de +31 % en scénario médian 2050 (DRIAS, Géorisques). Les Minimes et Aytré sont en zone PPRi modérée. L'achat reste viable à condition de choisir le bon quartier et d'étudier la DPE.",
    cta: 'Voir le rapport complet sur La Rochelle' },
  { id: 'enfants_sante', label: 'Mes enfants sont-ils exposés ?', sub: 'Cadmium, pollens, canicule', tone: 'violet',
    verdict: 'Trois signaux méritent votre attention.',
    detail: "Les sols charentais sont naturellement chargés en cadmium (GisSol/RMQS). La saison pollinique s'est allongée de 28 jours en Nouvelle-Aquitaine. Les jours de canicule à La Rochelle passent de 5 à 34 par an en 2050. Rien d'irrémédiable, mais autant le savoir tôt.",
    cta: 'Voir le module Santé' },
  { id: 'retraite_ici', label: 'Ma retraite ici, lisible ?', sub: 'Chaleur, mobilité, santé', tone: 'blue',
    verdict: 'Oui, avec deux ajustements à anticiper.',
    detail: "Le confort d'été devient un vrai sujet : 34 nuits tropicales projetées en 2050. L'accès aux soins et la mobilité restent bons sur La Rochelle intra-muros. La question centrale est l'isolation thermique du logement.",
    cta: 'Voir le module Logement' },
  { id: 'metier_general', label: 'Mon métier tient-il le coup ?', sub: 'Secteur, exposition, futur', tone: 'green',
    verdict: "Ça dépend du secteur. Certains gagnent, d'autres perdent.",
    detail: "Le secteur associatif et de l'ESS sera peu exposé aux risques physiques directs. Les métiers liés à l'adaptation climatique sont en forte croissance. Les secteurs à exposition extérieure (BTP, agriculture) sont les plus vulnérables.",
    cta: 'Voir le module Métier' },
];

// Resolve a tone keyword to its currently-themed CSS variable
const tone = (t) => `var(--${t})`;

const SOURCES = ['DRIAS / Météo-France','Géorisques / BRGM','ANSES','Santé publique France','GisSol / RMQS','INSEE / Ecolab','RNSA','EFSA','ADEME','Copernicus','ACPR','INRAE'];

window.Nav = function Nav({ onAuth, onDashboard }) {
  return (
    <nav style={{ position: 'sticky', top: 0, zIndex: 50, backdropFilter: 'blur(var(--blur-md))', background: 'var(--bg-card)', borderBottom: '1px solid var(--border-1)' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 28px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Brandmark size={22} />
        <div style={{ display: 'flex', gap: 32 }}>
          {['Produit','Modules','Tarifs'].map(l => <span key={l} style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--fg-3)', cursor: 'pointer' }}>{l}</span>)}
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Button variant="navSec" onClick={onAuth}>Connexion</Button>
          <Button variant="navCta" onClick={onDashboard}>S'inscrire</Button>
        </div>
      </div>
    </nav>
  );
};

window.SourcesBar = function SourcesBar() {
  return (
    <div style={{ borderTop: '1px solid var(--border-1)', borderBottom: '1px solid var(--border-1)', background: 'var(--bg-card)', overflow: 'hidden', padding: '14px 0', position: 'relative', zIndex: 2 }}>
      <div style={{ display: 'flex', gap: 48, whiteSpace: 'nowrap', animation: 'marquee 25s linear infinite' }}>
        {[...SOURCES, ...SOURCES].map((s,i) => <span key={i} style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-2)', fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase', flexShrink: 0 }}>{s}</span>)}
      </div>
      <style>{`@keyframes marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }`}</style>
    </div>
  );
};

window.TensionGrid = function TensionGrid({ active, onSelect }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
      {TENSIONS.map(t => {
        const isActive = active?.id === t.id;
        const c = tone(t.tone);
        return (
          <button key={t.id} onClick={() => onSelect(t)} style={{
            background: 'var(--bg-elev-2)', backdropFilter: 'blur(var(--blur-sm))',
            border: `1px solid ${isActive ? c : 'var(--border-1)'}`,
            boxShadow: isActive ? `0 0 0 1px ${c}, var(--shadow-card-hover)` : 'none',
            borderRadius: 'var(--radius-lg)', padding: '20px 22px', cursor: 'pointer', textAlign: 'left',
            transition: 'all 0.2s ease', color: 'var(--fg-1)',
          }}>
            <div style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 17, color: 'var(--fg-hi)', lineHeight: 1.3, marginBottom: 6 }}>{t.label}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-4)', letterSpacing: '0.04em' }}>{t.sub}</div>
            <span style={{ fontSize: 14, color: c, marginTop: 10, display: 'block' }}>→</span>
          </button>
        );
      })}
    </div>
  );
};

window.AnswerBox = function AnswerBox({ tension }) {
  if (!tension) return null;
  const c = tone(tension.tone);
  return (
    <div style={{ background: 'var(--bg-elev-2)', backdropFilter: 'blur(var(--blur-sm))', borderRadius: 'var(--radius-lg)', padding: '28px 32px', border: `1px solid ${c}`, marginTop: 20 }}>
      <p style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 22, lineHeight: 1.3, color: 'var(--fg-hi)', margin: '0 0 16px', paddingBottom: 16, borderBottom: '1px solid var(--border-1)' }}>{tension.verdict}</p>
      <p style={{ fontSize: 16, lineHeight: 1.72, color: 'var(--fg-3)', margin: '0 0 24px' }}>{tension.detail}</p>
      <a style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '12px 24px', borderRadius: 'var(--radius-sm)', background: 'var(--orange)', color: '#060812', fontWeight: 600, fontSize: 11, fontFamily: 'var(--font-mono)', letterSpacing: '0.08em', textTransform: 'uppercase', textDecoration: 'none', cursor: 'pointer' }}>{tension.cta} →</a>
    </div>
  );
};

window.Landing = function Landing({ onAuth, onDashboard }) {
  const [commune, setCommune] = useState('La Rochelle');
  const [active, setActive] = useState(null);

  return (
    <div style={{ fontFamily: 'var(--font-sans)', background: 'var(--bg)', color: 'var(--fg-1)', minHeight: '100vh', position: 'relative', overflowX: 'hidden' }}>
      <Orbs />
      <Nav onAuth={onAuth} onDashboard={onDashboard} />

      <section style={{ position: 'relative', zIndex: 2, maxWidth: 1100, margin: '0 auto', padding: '100px 28px 80px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center' }}>
        <div>
          <div style={{ marginBottom: 20 }}><Kicker dot>PROJECTION CLIMATIQUE PERSONNELLE</Kicker></div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontWeight: 400, fontSize: 'clamp(42px,5vw,68px)', lineHeight: 1.06, letterSpacing: '-0.03em', margin: '0 0 24px', color: 'var(--fg-hi)' }}>
            Le climat, <span style={{ fontStyle: 'italic', color: 'var(--orange)' }}>chez vous</span>, pas en général.
          </h1>
          <p style={{ fontSize: 18, lineHeight: 1.65, color: 'var(--fg-3)', margin: '0 0 40px', maxWidth: 480 }}>
            futur•e croise données climatiques publiques et profil utilisateur pour donner une lecture située du changement climatique. Pas des généralités : votre situation, dans {commune}.
          </p>
          <div style={{ position: 'relative', maxWidth: 480 }}>
            <span style={{ position: 'absolute', left: 18, top: 17, color: 'var(--fg-4)', fontSize: 16 }}>⌕</span>
            <input value={commune} onChange={e => setCommune(e.target.value)} style={{
              width: '100%', padding: '16px 20px 16px 52px', borderRadius: 'var(--radius-md)',
              background: 'var(--bg-elev-2)', border: '1px solid var(--orange-ring)',
              color: 'var(--fg-hi)', fontSize: 16, fontFamily: 'var(--font-sans)',
              outline: 'none', boxSizing: 'border-box', boxShadow: 'var(--shadow-focus)',
            }} placeholder="Votre commune" />
            <div style={{ marginTop: 12, fontSize: 13, color: 'var(--fg-4)', fontFamily: 'var(--font-mono)' }}>API BAN · data.gouv.fr</div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[
            { label: 'Chaleur à La Rochelle', val: '34 jours > 30°C/an', tn: 'red', src: 'DRIAS · +2,7°C' },
            { label: 'Submersion à La Rochelle', val: '+31 % en 2050', tn: 'blue', src: 'Géorisques / BRGM' },
            { label: 'Cadmium sols / La Rochelle', val: 'Signal sanitaire à confirmer', tn: 'orange', src: 'GisSol / RMQS' },
            { label: 'Saison pollinique', val: '+28 jours depuis 2000', tn: 'green', src: 'RNSA / Copernicus' },
          ].map(c => {
            const col = tone(c.tn);
            return (
              <div key={c.label} style={{ background: 'var(--bg-elev)', backdropFilter: 'blur(var(--blur-sm))', border: '1px solid var(--border-1)', borderRadius: 'var(--radius-lg)', padding: '20px 22px', display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: col, boxShadow: `0 0 8px ${col}`, flexShrink: 0, marginTop: 4 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--fg-hi)', marginBottom: 4 }}>{c.label}</div>
                  <div style={{ fontSize: 12, color: 'var(--fg-4)', lineHeight: 1.5 }}>{c.val}</div>
                  <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 4, background: `var(--${c.tn}-tint)`, border: `1px solid ${col}`, fontSize: 11, color: col, fontFamily: 'var(--font-mono)', marginTop: 6 }}>{c.src}</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <SourcesBar />

      <section style={{ position: 'relative', zIndex: 2, maxWidth: 860, margin: '0 auto', padding: '80px 28px' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--fg-4)', marginBottom: 8 }}>· QUATRE ANGLES DE LECTURE ·</div>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontWeight: 400, fontSize: 'clamp(28px,3.5vw,40px)', margin: '0 0 8px', color: 'var(--fg-hi)' }}>
          Les tensions à <span style={{ fontStyle: 'italic', color: 'var(--orange)' }}>{commune}</span>
        </h2>
        <p style={{ fontSize: 16, color: 'var(--fg-3)', margin: '0 0 36px', lineHeight: 1.6 }}>Quatre angles de lecture pour comprendre ce que le climat change concrètement ici.</p>
        <TensionGrid active={active} onSelect={setActive} />
        <AnswerBox tension={active} />
      </section>
    </div>
  );
};
