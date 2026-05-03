'use client';

import { useTheme } from '@/lib/useTheme';

export function ThemeToggle() {
  const { theme, toggle } = useTheme();

  return (
    <button
      onClick={toggle}
      title={theme === 'dark' ? 'Passer en mode jour' : 'Passer en mode nuit'}
      style={{
        width: 36,
        height: 36,
        borderRadius: 999,
        border: '1px solid var(--border-1)',
        background: 'var(--bg-elev-2)',
        color: 'var(--fg-1)',
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 15,
        flexShrink: 0,
        transition: 'border-color var(--dur-base) var(--ease), background var(--dur-base) var(--ease)',
      }}
    >
      {theme === 'dark' ? '◐' : '◑'}
    </button>
  );
}
