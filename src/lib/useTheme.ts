'use client';

import { useCallback, useSyncExternalStore } from 'react';

type Theme = 'dark' | 'light';

// LE THÈME VIT DANS LE DOM, PAS DANS UN ÉTAT REACT. Le script inline de `layout.tsx` pose
// `data-theme` sur <html> avant la première peinture ; ce hook ne fait que le lire et le suivre.
//
// `useSyncExternalStore` remplace l'ancien « useState + useEffect qui relit le DOM » (FUT-121) :
// - pendant l'hydratation, React rend la valeur serveur (`dark`, celle du HTML servi), puis la valeur
//   réelle du DOM : même séquence qu'avant, sans le rendu en cascade d'un setState dans un effet ;
// - tous les composants qui lisent le thème suivent le même attribut, observé : un changement fait
//   par l'un d'eux atteint les autres (avant, chacun gardait sa copie locale).
const SERVEUR: Theme = 'dark';

function readTheme(): Theme {
  return (document.documentElement.dataset.theme as Theme) || 'dark';
}

function subscribe(onChange: () => void): () => void {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  return () => observer.disconnect();
}

export function useTheme() {
  const theme = useSyncExternalStore(subscribe, readTheme, () => SERVEUR);

  const setTheme = useCallback((next: Theme) => {
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem('futuree-theme', next); } catch {}
  }, []);

  const toggle = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  }, [theme, setTheme]);

  return { theme, setTheme, toggle };
}
