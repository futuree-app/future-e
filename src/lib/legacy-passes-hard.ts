// TÉMOIN DE NON-RÉGRESSION, GELÉ. Copie fidèle de l'ancien `passesHard` (comparateur-vie.ts) ET de la
// résolution que `matchProjects` faisait en amont, rendue pure (elle reçoit les attributs et un annuaire).
//
// Il porte SES DÉFAUTS INTACTS : `(relief ?? 0)`, `nearSea.maxKm ?? 30`, `nearPlace.maxKm ?? 50`, la
// mutation de `communeSize` par `sizeRelativeTo`, et le fait de SAUTER `nearPlace` quand le label ne
// résout pas. C'est toute sa valeur : il est l'ANCIEN comportement, exactement.
//
// NE JAMAIS L'« AMÉLIORER ». Le jour où on le corrige, il cesse d'être un témoin, et le test de
// non-régression qui s'appuie sur lui ne prouve plus rien.
//
// À SUPPRIMER à la fin du lot 2, avec son test.
import { resolveZoneAnchors, resolveExclusions } from "./geo-zones.ts";
import { montagnosite, haversineKm, type CommuneAttributes } from "./hard-constraints.ts";
import { normalizeName, type PlaceDirectory } from "./hard-constraints-resolve.ts";
import type { HardConstraints } from "./hard-constraint-schema.ts";

const POP_FLOOR = 1500;
const RELIEF_PROCHE_HARD = 50;

export function legacyPassesHard(
  c: CommuneAttributes,
  hcInput: HardConstraints,
  dir: PlaceDirectory,
): boolean {
  const hc: HardConstraints = { ...hcInput }; // l'ancien code MUTAIT hc : on protège l'appelant

  // ── la résolution que matchProjects faisait en amont ──
  let placePoint: { lat: number; lon: number; maxKm: number } | null = null;
  if (hc.nearPlace?.label) {
    const hit = dir.byName(normalizeName(hc.nearPlace.label));
    if (hit) placePoint = { lat: hit.lat, lon: hit.lon, maxKm: hc.nearPlace.maxKm ?? 50 };
    // sinon : placePoint reste null, et la contrainte est SAUTÉE. C'est le défaut d'origine.
  }
  const excludeUU = new Set<string>();
  const excludeInsee = new Set<string>();
  for (const ep of hc.excludePlace ?? []) {
    const key = normalizeName(ep?.label ?? "");
    if (!key) continue;
    const plm = dir.plmByName(key);
    if (plm) {
      excludeUU.add(plm.uu);
      continue;
    }
    const hit = dir.byName(key);
    if (!hit) continue; // ville inconnue : IGNORÉE, sans un mot
    if (hit.uu) excludeUU.add(hit.uu);
    else excludeInsee.add(hit.insee);
  }
  if (hc.sizeRelativeTo?.label) {
    const key = normalizeName(hc.sizeRelativeTo.label);
    const refPop = dir.byName(key)?.tailleVille ?? null;
    if (refPop != null) {
      const cs = { ...(hc.communeSize ?? {}) };
      if (hc.sizeRelativeTo.direction === "smaller") cs.max = Math.min(cs.max ?? Infinity, refPop - 1);
      else cs.min = Math.max(cs.min ?? 0, refPop + 1);
      hc.communeSize = cs; // LA MUTATION D'ORIGINE
    }
  }
  const zone = resolveZoneAnchors(hc.zones);
  const exclusion = resolveExclusions(hc.excludeZones);

  // ── passesHard, à l'identique ──
  if (c.population == null || c.population < POP_FLOOR) return false;
  if (hc.departements?.length && (c.dept == null || !hc.departements.includes(c.dept))) return false;
  if (zone.hardDepartements && (c.dept == null || !zone.hardDepartements.has(c.dept))) return false;
  if (c.dept != null && exclusion.departements.has(c.dept)) return false;
  if (c.uu && excludeUU.has(c.uu)) return false;
  if (excludeInsee.has(c.insee)) return false;
  if (hc.montagne?.strength === "hard") {
    const m = montagnosite(c.altitude);
    if (m == null || m < 50) return false;
  }
  if (hc.reliefProche?.strength === "hard") {
    if ((c.reliefProximite ?? 0) < RELIEF_PROCHE_HARD) return false; // LE ?? 0 D'ORIGINE
  }
  if (hc.nearSea?.active && (c.distanceCoteKm ?? 0) > (hc.nearSea.maxKm ?? 30)) return false; // LE ?? 30
  if (hc.excludeSea && (c.distanceCoteKm ?? 0) < 15) return false;
  if (hc.communeSize) {
    const t = c.tailleVille;
    if (hc.communeSize.min != null && (t ?? 0) < hc.communeSize.min) return false;
    if (hc.communeSize.max != null && (t ?? Infinity) > hc.communeSize.max) return false;
  }
  if (placePoint && c.lat != null && c.lon != null) {
    if (haversineKm(c.lat, c.lon, placePoint.lat, placePoint.lon) > placePoint.maxKm) return false;
  }
  return true;
}
