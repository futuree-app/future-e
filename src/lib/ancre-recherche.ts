// LES DÉRIVÉS D'ANCRE POUR LA RECHERCHE (FUT-8). Lib PURE : la résolution des communes reste dans
// comparateur-vie.ts (avecDerivesDAncre), la règle est ici, testable.
//
// « Une ville comme Brest » : ne pas reproposer Brest, et chercher des villes de taille proche. Ces
// deux règles servent la recherche ; elles ne sont jamais écrites dans `parsed`.
import type { HardConstraints } from "./hard-constraint-schema.ts";

type ParsedPourRecherche = {
  hardConstraints?: HardConstraints;
  preferences?: { key: string; weight: number; source?: "parse" | "ancre" }[];
  ancreSansTaille?: boolean;
};

const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

export function derivesDAncrePourRecherche<P extends ParsedPourRecherche>(
  parsed: P, ancres: { nom: string }[], taille: { min: number; max: number } | null,
): P {
  if (ancres.length === 0) return parsed;
  const hc: HardConstraints = { ...(parsed.hardConstraints ?? {}) };
  // Idempotent : un `parsed` ancien qui porte déjà l'exclusion ou la fourchette n'est pas doublé.
  const deja = new Set((hc.excludePlace ?? []).map((e) => norm(e?.label ?? "")));
  const exclues = ancres.filter((e) => !deja.has(norm(e.nom))).map((e) => ({ label: e.nom }));
  if (exclues.length > 0) hc.excludePlace = [...(hc.excludePlace ?? []), ...exclues];
  // L'explicite écrase le dérivé : une taille dite, ou une préférence de taille LUE DANS LE TEXTE.
  const tailleDite = (parsed.preferences ?? []).some(
    (p) => (p.source ?? "parse") === "parse" && (p.key === "eviter_grandes_villes" || p.key === "prefere_grande_ville"),
  );
  if (taille && !hc.communeSize && !hc.sizeRelativeTo && !tailleDite && !parsed.ancreSansTaille) hc.communeSize = taille;
  return { ...parsed, hardConstraints: hc };
}
