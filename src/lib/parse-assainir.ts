// CE QUE LE PARSEUR A LE DROIT D'ÉCRIRE DANS `parsed` (FUT-8). Lib PURE.
//
// Le modèle de langue propose ; ce module garde ce qui a été DIT, et seulement cela. `null` = non dit.
// Une métrique, une unité, un périmètre inconnus restent `null` : le moteur ne les devine jamais.
import type { ParsedProject, PreferenceKey } from "./comparateur-vie.ts";
import type { CriterionRef } from "./user-project.ts";
import { normalizeName } from "./hard-constraints-resolve.ts";

const UNITES = new Set(["commune", "unite_urbaine"]);
const unite = (v: unknown) => (UNITES.has(v as string) ? (v as "commune" | "unite_urbaine") : null);
const texte = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);

// Un nombre RATTACHÉ à une population : « 20 000 habitants », « 20k hab », « moins de 5000 âmes ». Un
// chiffre ailleurs dans le texte (« 3 chambres », « à 30 minutes ») ne fonde aucune borne de taille.
export const POPULATION_CHIFFREE = /\d[\d\s\u00a0\u202f.,]*\s*(k|000|mille)?\s*(habitants?|hab\b|hab\.|âmes)/i;

// FUT-33 : un nombre RATTACHÉ à des kilomètres (« 30 km », « 20 kilomètres »). Sans lui, « loin de la mer »
// n'a aucun seuil, et un `minKm` ne peut venir que d'une convention que le modèle aurait inventée.
export const KILOMETRES_CHIFFRES = /\d[\d\s\u00a0\u202f.,]*\s*(km\b|kilom)/i;

export function assainirParsed(parsed: ParsedProject, rawText: string): ParsedProject {
  const hc = { ...(parsed.hardConstraints ?? {}) };

  // Une taille chiffrée n'existe que si le texte chiffre une POPULATION. « Petite ville » n'en chiffre
  // aucune, « 3 chambres » non plus : des bornes ne peuvent alors venir que d'une convention que le
  // modèle aurait appliquée de lui-même. Elles tombent.
  if (hc.communeSize) {
    const dit = POPULATION_CHIFFREE.test(rawText ?? "");
    hc.communeSize = dit ? { min: hc.communeSize.min ?? null, max: hc.communeSize.max ?? null, unit: unite(hc.communeSize.unit) } : null;
    if (hc.communeSize && hc.communeSize.min == null && hc.communeSize.max == null) hc.communeSize = null;
  }
  if (hc.nearPlace) {
    const metric = hc.nearPlace.metric === "vol_oiseau" || hc.nearPlace.metric === "route" ? hc.nearPlace.metric : null;
    // Une métrique ne qualifie que des kilomètres.
    hc.nearPlace = { ...hc.nearPlace, metric: hc.nearPlace.maxKm != null ? metric : null };
  }
  // FUT-33 : une distance minimale à la mer n'est une CONTRAINTE qu'avec un nombre dit en kilomètres. Sans lui,
  // l'intention reste, mais comme préférence graduée (eloignement_mer), jamais comme condition.
  let eloignementSansNombre = false;
  if (hc.farFromSea) {
    const km = hc.farFromSea.minKm;
    const dit = hc.farFromSea.active === true && typeof km === "number" && km > 0 && KILOMETRES_CHIFFRES.test(rawText ?? "");
    if (!dit && hc.farFromSea.active === true) eloignementSansNombre = true;
    hc.farFromSea = dit ? { active: true, minKm: km } : null;
  }
  if (hc.sizeRelativeTo) hc.sizeRelativeTo = { ...hc.sizeRelativeTo, unit: unite(hc.sizeRelativeTo.unit) };
  if (Array.isArray(hc.excludePlace)) {
    hc.excludePlace = hc.excludePlace.filter((e) => texte(e?.label)).map((e) => ({ label: e.label, scope: unite(e.scope) }));
  }
  const tokens = new Set(hc.excludeZones ?? []);
  const dits = (Array.isArray(hc.excludeZonesDits) ? hc.excludeZonesDits : [])
    .filter((d) => tokens.has(d?.token) && texte(d?.said))
    .map((d) => ({ token: d.token, said: d.said.trim() }));
  if (dits.length > 0) hc.excludeZonesDits = dits;
  else delete hc.excludeZonesDits;
  // Champs de la valeur effective : jamais écrits par le parseur.
  delete hc.excludeZonesPerimetres;
  delete hc.zonesConventions;

  // FUT-45 : UN BUDGET DIT NE SE PERD JAMAIS. Le prompt range le prix hors périmètre, et le modèle le jette parfois
  // au lieu de le garder hors mesure (« un budget de 300 000 €… » : disparu deux fois sur deux, le 03/10/2026). Il
  // reste alors une demande sans réponse que la lecture finale doit nommer : on la rattrape ici, avec les mots du
  // lecteur, si aucune demande hors mesure ne la porte déjà.
  const horsMesure = budgetRattrape(parsed.horsMesure, rawText);
  const preferences = (parsed.preferences ?? []).map((p) => ({ key: p.key, weight: p.weight, source: "parse" as const }));
  if (eloignementSansNombre && !preferences.some((p) => p.key === "eloignement_mer")) {
    preferences.push({ key: "eloignement_mer", weight: 2, source: "parse" as const });
  }
  // « Loin de la mer » et « près de la mer » ne se cumulent pas : le refus l'emporte, il est le plus spécifique.
  if (preferences.some((p) => p.key === "eloignement_mer")) {
    const i = preferences.findIndex((p) => p.key === "proximite_mer");
    if (i >= 0) preferences.splice(i, 1);
  }
  const sizeWord = parsed.sizeWord === "petite" || parsed.sizeWord === "moyenne" || parsed.sizeWord === "grande" ? parsed.sizeWord : null;

  const out: ParsedProject = { ...parsed, hardConstraints: hc, preferences, sizeWord, ...(horsMesure ? { horsMesure } : {}) };
  const marqueurs = forceMarkersValides(out, parsed.forceMarkers);
  if (marqueurs.length > 0) out.forceMarkers = marqueurs;
  else delete out.forceMarkers;
  return out;
}

// Un mot fort n'est retenu que s'il désigne un critère DÉCLARÉ, et l'élément exact pour une famille
// multiple (la ville, le jeton). Sinon, il ne suggère rien.
function forceMarkersValides(p: ParsedProject, raw: unknown): { criterion: CriterionRef; quote: string }[] {
  if (!Array.isArray(raw)) return [];
  const hc = p.hardConstraints ?? {};
  const out: { criterion: CriterionRef; quote: string }[] = [];
  for (const m of raw) {
    const quote = texte(m?.quote);
    const c = m?.criterion;
    if (!quote || !c || typeof c.key !== "string") continue;
    if (c.kind === "preference") {
      if ((p.preferences ?? []).some((x) => x.key === c.key)) out.push({ criterion: { kind: "preference", key: c.key as PreferenceKey, instance: null }, quote });
      continue;
    }
    if (c.kind !== "hard") continue;
    if (c.key === "excludePlace") {
      const ville = (hc.excludePlace ?? []).find((e) => normalizeName(e.label) === normalizeName(String(c.instance ?? "")));
      if (ville) out.push({ criterion: { kind: "hard", key: "excludePlace", instance: normalizeName(ville.label) }, quote });
      continue;
    }
    if (c.key === "excludeZones") {
      if ((hc.excludeZones ?? []).includes(String(c.instance))) out.push({ criterion: { kind: "hard", key: "excludeZones", instance: String(c.instance) }, quote });
      continue;
    }
    const v = (hc as Record<string, unknown>)[c.key];
    const declare = Array.isArray(v) ? v.length > 0 : v != null && v !== false && !(typeof v === "object" && "active" in (v as object) && !(v as { active: boolean }).active);
    if (declare) out.push({ criterion: { kind: "hard", key: c.key as CriterionRef["key"], instance: null } as CriterionRef, quote });
  }
  return out;
}

// Un budget ou une somme dits par le lecteur : « budget 250 000 € », « 300 000 euros », « 250k€ ».
const BUDGET_DIT = /budget[^,.;!?\n]*|\d[\d\s\u00a0\u202f.,]*\s*(?:k\s*€|k€|€|euros?\b|k\s*euros?)/i;

export function budgetRattrape(
  horsMesure: ParsedProject["horsMesure"], rawText: string,
): ParsedProject["horsMesure"] {
  const m = (rawText ?? "").match(BUDGET_DIT);
  if (!m) return horsMesure;
  const deja = (horsMesure ?? []).some((h) => /budget|€|euro|prix|\d/i.test(h?.term ?? ""));
  if (deja) return horsMesure;
  const terme = m[0].trim().replace(/\s+/g, " ");
  return [...(horsMesure ?? []), { term: terme, kind: "autre" }];
}
