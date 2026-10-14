// FUT-93 · LA POSITION DE LECTURE, À TRAVERS UN RECHARGEMENT DE SECOURS (voir `relire-la-page.ts`).
import {
  CLE_MEMOIRE_SECOURS, choisirAncre, lireMemoireSecours, type MemoireSecours,
} from "@/lib/interaction/relecture-secours";

const cheminCourant = () => location.pathname + location.search;

/**
 * Un élément peut-il servir d'ancre ? Pas un identifiant généré par React (`useId` : instable d'un
 * rendu à l'autre), ni un élément sans boîte, ni un élément fixe ou collant : toujours en haut de
 * l'écran, il ne dit rien de ce que lit le lecteur (mesuré : la barre de navigation, à 0 px).
 */
function ancrable(el: HTMLElement): boolean {
  if (/^(_r|«r|:r)/i.test(el.id)) return false;
  if (el.getClientRects().length === 0) return false;
  for (let n: HTMLElement | null = el; n; n = n.parentElement) {
    const position = getComputedStyle(n).position;
    if (position === "fixed" || position === "sticky") return false;
  }
  return true;
}

/** Mémorise la position avant de recharger. `false` si le stockage est indisponible. */
export function memoriserLaPosition(): boolean {
  const candidats = [...document.querySelectorAll<HTMLElement>("[id]")]
    .filter(ancrable)
    .map((el) => ({ id: el.id, haut: el.getBoundingClientRect().top }));
  const memoire: MemoireSecours = {
    chemin: cheminCourant(), y: Math.round(window.scrollY), le: Date.now(),
    ...choisirAncre(candidats, window.innerHeight),
  };
  try {
    window.sessionStorage.setItem(CLE_MEMOIRE_SECOURS, JSON.stringify(memoire));
    // Le navigateur restaurerait SA position (absolue) à la fin du chargement, après la nôtre.
    window.history.scrollRestoration = "manual";
    return true;
  } catch {
    return false;
  }
}

/**
 * Rend la position mémorisée. Une première fois dès le chargement (la page arrive sans la section du
 * bien, servie plusieurs secondes après) ; une dernière, `definitive`, quand le témoin de la section
 * est validé : la mémoire est alors effacée et la restauration du navigateur rétablie.
 */
export function rendreLaPosition(definitive: boolean): void {
  let brut: string | null = null;
  try { brut = window.sessionStorage.getItem(CLE_MEMOIRE_SECOURS); } catch { return; }
  if (!brut) return;
  if (definitive) {
    try { window.sessionStorage.removeItem(CLE_MEMOIRE_SECOURS); } catch { /* sans effet */ }
    window.history.scrollRestoration = "auto";
  }
  const m = lireMemoireSecours(brut, cheminCourant(), Date.now());
  if (!m) return;
  const ancre = m.ancre ? document.getElementById(m.ancre) : null;
  if (ancre && m.decalage !== undefined) window.scrollBy({ top: ancre.getBoundingClientRect().top - m.decalage, behavior: "instant" });
  else window.scrollTo({ top: m.y, behavior: "instant" });
}
