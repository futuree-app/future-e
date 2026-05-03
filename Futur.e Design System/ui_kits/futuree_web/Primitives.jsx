/* global React */
const { useState } = React;

// Brandmark · wordmark "futur•e" — uses fg-hi so it adapts to mode
window.Brandmark = function Brandmark({ size = 22 }) {
  return (
    <span style={{
      fontFamily: 'var(--font-serif)',
      fontSize: size,
      fontStyle: 'italic',
      color: 'var(--fg-hi)',
      letterSpacing: '-0.02em',
      lineHeight: 1,
      display: 'inline-flex',
      alignItems: 'baseline',
    }}>
      futur<span style={{ color: 'var(--orange)', fontStyle: 'normal', padding: '0 1px' }}>•</span>e
    </span>
  );
};

window.Kicker = function Kicker({ children, muted, dot }) {
  return (
    <div style={{
      fontFamily: 'var(--font-mono)',
      fontSize: 11,
      letterSpacing: '0.12em',
      textTransform: 'uppercase',
      color: muted ? 'var(--fg-3)' : 'var(--orange)',
      display: 'inline-flex',
      alignItems: 'center',
      gap: 10,
    }}>
      {dot && <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--orange)', boxShadow: 'var(--glow-orange)' }} />}
      {children}
    </div>
  );
};

// Orbs — tints defined at token level so light mode gets gentler opacity via CSS var
window.Orbs = function Orbs() {
  return (
    <>
      <div className="fe-orb fe-orb-1" style={{ position: 'fixed', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, var(--orb-orange, rgba(251,146,60,0.45)) 0%, transparent 70%)', top: -180, left: -150, filter: 'blur(100px)', opacity: 'var(--orb-opacity, 1)', pointerEvents: 'none', zIndex: 0 }} />
      <div className="fe-orb fe-orb-2" style={{ position: 'fixed', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, var(--orb-violet, rgba(167,139,250,0.4)) 0%, transparent 70%)', bottom: -150, right: -120, filter: 'blur(100px)', opacity: 'var(--orb-opacity, 1)', pointerEvents: 'none', zIndex: 0 }} />
      <div className="fe-orb fe-orb-3" style={{ position: 'fixed', width: 380, height: 380, borderRadius: '50%', background: 'radial-gradient(circle, var(--orb-red, rgba(248,113,113,0.3)) 0%, transparent 70%)', top: '50%', left: '60%', filter: 'blur(80px)', opacity: 'var(--orb-opacity, 1)', pointerEvents: 'none', zIndex: 0 }} />
    </>
  );
};

window.Button = function Button({ variant = 'primary', children, onClick, style }) {
  const styles = {
    primary: { background: 'var(--orange)', color: '#060812', fontWeight: 600, padding: '12px 24px', borderRadius: 8, border: 'none', fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase' },
    ghost:   { background: 'var(--bg-elev-3)', color: 'var(--fg-hi)', padding: '12px 22px', borderRadius: 8, border: '1px solid var(--border-1)', fontWeight: 600 },
    pill:    { background: 'var(--orange)', color: '#060812', fontWeight: 600, padding: '0 22px', minHeight: 54, borderRadius: 999, border: 'none' },
    navCta:  { background: 'var(--orange)', color: '#060812', fontWeight: 600, fontSize: 11, padding: '8px 20px', borderRadius: 6, border: 'none', fontFamily: 'var(--font-mono)', letterSpacing: '0.08em', textTransform: 'uppercase' },
    navSec:  { background: 'rgba(127,127,127,0.02)', color: 'var(--fg-1)', padding: '8px 14px', borderRadius: 999, border: '1px solid var(--border-1)', fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' },
  };
  return <button onClick={onClick} style={{ fontFamily: 'var(--font-sans)', fontSize: 14, cursor: 'pointer', ...styles[variant], ...style }}>{children}</button>;
};

window.Chip = function Chip({ children, tone = 'neutral', style }) {
  const tones = {
    neutral: { background: 'var(--bg-elev-3)', color: 'var(--fg-2)', borderColor: 'var(--border-1)' },
    orange:  { background: 'var(--orange-tint)', color: 'var(--orange)', borderColor: 'var(--orange-ring)' },
    blue:    { background: 'var(--blue-tint)', color: 'var(--blue)', borderColor: 'var(--blue)' },
    green:   { background: 'var(--green-tint)', color: 'var(--green)', borderColor: 'var(--green)' },
    red:     { background: 'var(--red-tint)', color: 'var(--red)', borderColor: 'var(--red)' },
  };
  return <span style={{ display: 'inline-flex', alignItems: 'center', padding: '6px 14px', borderRadius: 999, fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', border: '1px solid', ...tones[tone], ...style }}>{children}</span>;
};

// Theme toggle pill — flips document root data-theme
window.ThemeToggle = function ThemeToggle() {
  const [theme, setTheme] = useState(() => document.documentElement.dataset.theme || 'dark');
  const flip = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    setTheme(next);
  };
  return (
    <button onClick={flip} title={theme === 'dark' ? 'Passer en mode jour' : 'Passer en mode nuit'} style={{
      width: 36, height: 36, borderRadius: 999, border: '1px solid var(--border-1)', background: 'var(--bg-elev-2)',
      color: 'var(--fg-1)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 15,
    }}>
      {theme === 'dark' ? '◐' : '◑'}
    </button>
  );
};
