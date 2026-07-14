// LE SCORING CANONIQUE DES CRITÈRES DE MISMATCH, en lib PURE. Aucun server-only, aucun index chargé,
// aucun cache mutable : cette lib REÇOIT une commune et rend son rang brut, pour les 10 critères à
// distribution saine du chantier B (mismatch v1).
//
// POURQUOI PAS extraire subScore en entier : subScore couvre 28 critères, dont plusieurs (eviter_isolement,
// eviter_grandes_villes…) passent par tailleVille, qui lit uuPopCache, un cache module mutable de
// comparateur-vie (server-only). L'extraire ici rendrait cette lib impure et non importable par un script
// .mjs. Les 10 critères de mismatch, eux, n'utilisent QUE l'accès direct de champ (+ lerp/CALME pour
// cadre_calme) : ils sont extractibles proprement.
//
// LA GARANTIE ANTI-DIVERGENCE : mismatchRawScore doit rendre EXACTEMENT ce que signatureScore rend, pour
// que le rang du dossier ordonne comme le comparateur. Un test de parité (comparateur-scores.test.ts) le
// prouve sur données réelles. Toucher subScore lui-même serait plus risqué (28 critères, moteur de
// 3 000 lignes) : on fige la parité, on ne fusionne pas.
import type { IndexCommune, PreferenceKey } from "./comparateur-vie.ts";

// Les 10 critères de position à distribution saine, vérifiés sur 34 788 communes.
export const MISMATCH_RANK_KEYS: PreferenceKey[] = [
  "nature", "acces_ecoles", "acces_soins", "acces_culture", "acces_transports",
  "faible_dependance_auto", "croissance_demographique", "vie_locale", "cadre_calme", "viabilite_emploi",
];

type Anchors = [number, number][];
function lerp(anchors: Anchors, x: number | null | undefined): number | null {
  if (x == null) return null;
  if (x <= anchors[0]![0]) return anchors[0]![1];
  const last = anchors[anchors.length - 1]!;
  if (x >= last[0]) return last[1];
  for (let i = 1; i < anchors.length; i++) {
    if (x <= anchors[i]![0]) {
      const [x0, y0] = anchors[i - 1]!;
      const [x1, y1] = anchors[i]!;
      return y0 + ((y1 - y0) * (x - x0)) / (x1 - x0);
    }
  }
  return last[1];
}

// Copie FIDÈLE de l'ancre CALME de comparateur-vie. Le test de parité garantit qu'elles restent identiques.
const CALME: Anchors = [[0, 55], [30, 65], [80, 85], [150, 95], [400, 100], [800, 95], [1500, 80], [3000, 55], [6000, 30], [12000, 12], [30000, 3]];

// Le rang brut ORIENTÉ (0 = pire, 1 = meilleur, la direction est absorbée dans chaque cas), NULLABLE : une
// commune sans la donnée rend null (jamais un score de repli). C'est exactement signatureScore restreint
// aux 10 clés : les défauts ?? 0 / ?? 100 de subScore sont neutralisés (seul vie_locale en avait un).
export function mismatchRawScore(key: PreferenceKey, c: IndexCommune): number | null {
  switch (key) {
    case "nature":
      return c.nature?.score ?? null;
    case "acces_ecoles":
      return c.ecoles?.score ?? null;
    case "acces_soins":
      return c.vivpct?.apl == null ? null : c.vivpct.apl;
    case "acces_culture":
      return c.culture?.score ?? null;
    case "acces_transports":
      return c.transport?.desserte ?? null;
    case "faible_dependance_auto":
      return c.mobilite == null ? null : 100 - c.mobilite.dependance;
    case "croissance_demographique":
      return c.demographie?.croissance ?? null;
    case "vie_locale":
      // subScore replie `?? 0` ; on NE le replie PAS (comme signatureScore) : une vie locale non mesurée
      // n'est pas une vie locale nulle.
      return c.vieLocale?.score ?? null;
    case "cadre_calme":
      return lerp(CALME, c.densite);
    case "viabilite_emploi":
      return c.emploi == null ? null : 0.6 * c.emploi.taille + 0.4 * c.emploi.diversite;
    default:
      return null; // hors des 10 clés de mismatch : non couvert ici
  }
}
