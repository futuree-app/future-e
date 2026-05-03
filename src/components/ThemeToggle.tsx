'use client';

import { useTheme } from '@/lib/useTheme';

export function ThemeToggle() {
  const { theme, toggle } = useTheme();

  return (
    <button
      onClick={toggle}
      title={theme === 'dark' ? 'Passer en mode jour' : 'Passer en mode nuit'}
      suppressHydrationWarning
      style={{
        width: 36,
        height: 36,
        borderRadius: 999,
        border: '1px solid var(--border-2)',
        background: 'var(--bg-elev-3)',
        color: 'var(--fg-2)',
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 16,
        flexShrink: 0,
        boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
        transition: 'border-color var(--dur-base) var(--ease), background var(--dur-base) var(--ease)',
      }}
    >
      {theme === 'dark' ? '◐' : '◑'}
    </button>
  );
}
