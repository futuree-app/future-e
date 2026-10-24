// ════════════════════════════════════════════════════════════════════════════════════════════
// SUR QUOI PORTE UN DIAGNOSTIC : UN LOGEMENT, OU L'IMMEUBLE ENTIER (FUT-74, 24/10/2026).
//
// ── POURQUOI CE MODULE EXISTE ────────────────────────────────────────────────────────────────
// Le grain d'un DPE se lisait par `isCollective(methode_dpe)`, qui cherche le mot « immeuble »
// dans la méthode. Ce mot figure dans DEUX méthodes de grains opposés :
//   - « dpe immeuble collectif » : le diagnostic de l'immeuble entier (413 041 lignes) ;
//   - « dpe appartement généré à partir des données DPE immeuble » : le diagnostic d'UN
//     appartement (4 211 200 lignes, 26,6 % du jeu des logements existants).
// Le second est, selon le dictionnaire de données de l'ADEME, un « DPE logement utilisant la
// méthode de génération des DPE à l'appartement à partir du DPE immeuble ». Mesuré le 24/10/2026
// sur des immeubles réels : chaque appartement généré porte sa propre étiquette, sa propre
// consommation (156 à 191 kWh/m² dans un même immeuble) et sa propre surface. Le traiter comme
// « Immeuble entier » était donc faux, et 26 % des diagnostics de logement se présentaient sous
// le grain de l'immeuble.
//
// ── LE CHAMP QUI FAIT FOI ────────────────────────────────────────────────────────────────────
// `type_batiment`, énuméré par l'ADEME (« appartement », « maison », « immeuble ») et défini
// comme le type de bâtiment du diagnostic. Il est en correspondance un pour un avec la méthode
// sur les 17,3 millions de lignes des deux jeux depuis juillet 2021 : aucune contradiction
// observée. La méthode ne sert qu'à le suppléer quand il manque (un snapshot ancien), et une
// contradiction entre les deux rend le grain INDÉTERMINÉ plutôt que de choisir l'un.
//
// ── LA RÈGLE QUI GOUVERNE LE FICHIER ─────────────────────────────────────────────────────────
// Seul un diagnostic au grain `logement` peut devenir « le diagnostic de ce logement ». Un
// diagnostic d'immeuble reste une information sur le BÂTIMENT ; un grain indéterminé n'est
// attribué à rien. Aucune déduction par libellé libre, surface ou complément d'adresse : ces
// champs sont saisis à la main, et un diagnostic d'immeuble porte parfois `typologie_logement`
// ou `complement_adresse_logement` (« 2-DPE-1-LogZone », vu le 24/10/2026).
//
// Pur, sans `server-only` : appelé côté client et serveur, testé sous `node --test`.
// ════════════════════════════════════════════════════════════════════════════════════════════

import type { DpeRecord } from "./dpe-attribution.ts";

export type GrainDpe = "logement" | "immeuble" | "indetermine";

type ChampsDeGrain = Pick<DpeRecord, "type_batiment" | "methode_dpe">;

function norm(s: string | null | undefined): string {
  return (s ?? "").normalize("NFC").trim().toLowerCase();
}

/**
 * Le grain lu sur `type_batiment`. Les deux dernières valeurs sont celles du jeu d'avant juillet
 * 2021 (`tr002_type_batiment_description`), que `toRecordLegacy` recopie telles quelles.
 */
function grainDuType(t: string): GrainDpe | null {
  if (t === "appartement" || t === "maison") return "logement";
  if (t === "immeuble") return "immeuble";
  if (t === "logement" || t === "maison individuelle") return "logement";
  if (t.startsWith("bâtiment collectif")) return "immeuble";
  return null;
}

/**
 * Le grain lu sur la méthode. L'ordre des tests compte : « généré à partir des données DPE
 * immeuble » contient « immeuble » et décrit pourtant un appartement.
 */
function grainDeLaMethode(m: string): GrainDpe | null {
  if (!m) return null;
  if (m.includes("dpe immeuble collectif") || /bâtiment\s*:\s*immeuble/.test(m)) return "immeuble";
  if (m.includes("appartement") || m.includes("maison")) return "logement";
  return null;
}

export function grainDpe(d: ChampsDeGrain): GrainDpe {
  const parType = grainDuType(norm(d.type_batiment));
  const parMethode = grainDeLaMethode(norm(d.methode_dpe));
  if (parType && parMethode && parType !== parMethode) return "indetermine";
  return parType ?? parMethode ?? "indetermine";
}

/** Le seul grain qui puisse être retenu comme « le diagnostic de ce logement ». */
export function attribuableAuLogement(d: ChampsDeGrain): boolean {
  return grainDpe(d) === "logement";
}

/**
 * UN DIAGNOSTIC DE LOGEMENT ÉTABLI À PARTIR DES DONNÉES DE L'IMMEUBLE. Il reste au grain
 * `logement` (étiquette, consommation et surface propres) ; ce qui vient de l'immeuble, ce sont
 * les caractéristiques du bâti et des équipements collectifs. C'est ce que lit, à juste titre, la
 * dérivation thermique (`thermal-evidence.ts`) : le confort d'été n'y est renseigné que sur 7,7 %
 * des lignes, contre 93,7 % des diagnostics d'appartement individuels.
 */
export function issuDesDonneesDeLImmeuble(d: Pick<DpeRecord, "methode_dpe">): boolean {
  return norm(d.methode_dpe).includes("généré à partir des données dpe immeuble");
}

export type RepartitionParGrain<T> = { logements: T[]; immeubles: T[]; indetermines: T[] };

/** Range les diagnostics d'une adresse par grain, sans en retirer ni en réordonner aucun. */
export function repartirParGrain<T extends ChampsDeGrain>(candidats: T[]): RepartitionParGrain<T> {
  const r: RepartitionParGrain<T> = { logements: [], immeubles: [], indetermines: [] };
  for (const c of candidats) {
    const g = grainDpe(c);
    (g === "logement" ? r.logements : g === "immeuble" ? r.immeubles : r.indetermines).push(c);
  }
  return r;
}
