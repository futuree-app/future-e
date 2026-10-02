// FUT-16, étape 1 : CARACTÉRISATION du `system` envoyé à Anthropic par AskFuture, sur des communes
// réelles (__fixtures__/communes.json). Ces assertions décrivent l'état AVANT correction : les scores de
// `communes_tension` entrent dans le prompt. L'étape suivante les retourne.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { construireReferentiel, construireSystemPrompt } from "./system-prompt.ts";
import { deriveCategories } from "../commune-categories.ts";

type Commune = { nom: string; categorization: { commune_name: string; categories: string[] } | null; tensions: never[]; enrichment: never };
const F = JSON.parse(readFileSync(new URL("./__fixtures__/communes.json", import.meta.url), "utf8")).communes as Record<string, Commune>;

function systemDe(insee: string): string {
  const c = F[insee];
  const categories = c.categorization?.categories?.length ? c.categorization.categories : deriveCategories(insee);
  const referentiel = construireReferentiel({ insee, nomCommune: c.categorization?.commune_name ?? null, categories, tensions: c.tensions });
  return construireSystemPrompt({ communeName: c.nom, communeInsee: insee, referentiel, enrichment: c.enrichment, profile: null });
}

test("caractérisation : Bourg-en-Bresse reçoit la ligne corrompue « feux : score 75 (exposition 100 …) »", () => {
  const s = systemDe("01053");
  assert.match(s, /Tensions territoriales \(table communes_tension, scores et indicateurs sur 100\)/);
  assert.match(s, /- feux : score 75 \(exposition 100, vulnérabilité 1, adaptation 99, occurrence 100\)/);
  assert.match(s, /Jours risque feu \(IFM > 40\) : 3\.5 j/); // et la mesure qui la contredit
});

test("caractérisation : Chamonix (sans ligne) reçoit deux fois l'absence de scores", () => {
  const s = systemDe("74056");
  assert.match(s, /Pas de scores de tension détaillés disponibles dans futur•e/);
  assert.match(s, /\(Pas de scores de tension détaillés en base interne pour cette commune\.\)/);
});
