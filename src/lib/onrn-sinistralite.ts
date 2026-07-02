// Sinistralité assurantielle passée (ONRN/CCR via Géorisques), millésime 2025,
// période 1995-2021. Deux périls : sécheresse (RGA) et inondation (tous types).
// Classes catégorielles verbatim, gatées par la représentativité communale.
// Doctrine : docs/vault/modules/logement.md + data-curator 2026-07-02.

export type OnrnRaw = { c: string; f: string; r: string };

export type PerilState =
  | { kind: "lecture"; cout: string; frequence: string; representativite: string }
  | { kind: "aucun" }
  | { kind: "faible_repr"; representativite: string }
  | { kind: "indispo" };

export type OnrnSinistralite = { secheresse: PerilState; inondation: PerilState };

// Gate doctrine : ne raconter le coût/fréquence que si la représentativité ≥ "Entre 30 et 50%".
const GATE_REPR = new Set(["Entre 30 et 50%", "> 50%"]);
const NO_SINISTRE = "Pas de sinistre répertorié à CCR";

export function classify(raw: OnrnRaw | undefined): PerilState {
  if (!raw) return { kind: "indispo" };
  if (raw.r === NO_SINISTRE) return { kind: "aucun" };
  if (GATE_REPR.has(raw.r)) {
    return { kind: "lecture", cout: raw.c, frequence: raw.f, representativite: raw.r };
  }
  return { kind: "faible_repr", representativite: raw.r };
}
