// FUT-6, D9 : la synthèse déterministe, premier niveau fiable et immédiat.
import test from "node:test";
import assert from "node:assert/strict";
import { buildTerritoireSnapshot, type TerritoireInputs } from "./facts.ts";
import { HORIZONS, projectForSynthesis } from "./synthesis-contract.ts";
import { deterministicSynthesis } from "./synthesis-deterministe.ts";
import { checkSynthesis } from "./synthesis-checks.ts";
import { chatelaillonInputs } from "./__fixtures__/chatelaillon.ts";

const T0 = "2026-09-28T00:00:00.000Z";
const projection = (i: TerritoireInputs = chatelaillonInputs(), h = "gwl20" as const) =>
  projectForSynthesis(buildTerritoireSnapshot(i, T0), h);

/** Le texte de référence, relu : c'est lui que la PR soumet à la relecture éditoriale. */
const CHATELAILLON_2050 = `Châtelaillon-Plage à l'horizon 2050

## Le territoire aujourd'hui

Châtelaillon-Plage compte 6 227 habitants, dans l'agglomération de La Rochelle. Sa densité, de 976 habitants au km², correspond à une densité intermédiaire, et ses sols mêlent espaces urbanisés, espaces naturels et cultures : 49 % d'espaces urbanisés, 21 % de prairies et 14 % de terres agricoles. Entre 2015 et 2021, sa population a progressé de 0,62 % par an, et 9,8 % de ses habitants vivaient ailleurs un an plus tôt. Les résidences secondaires représentent 38 % des logements, une part marquée.

## Ce qui évolue d'ici 2050

Dans le scénario France +2,7 °C, les projections pour 2050 décrivent, parmi les évolutions visibles, 19 jours au-dessus de 30 °C par an (+12 par rapport à 1976-2005), 25 nuits au-dessus de 20 °C (+19 par rapport à 1976-2005), un été moyen à 21,7 °C (+2 °C), 136 jours de sols secs par an, 5 jours de pluie intense par an et 5 jours de conditions météo favorables au feu. Ces jours sont répartis dans l'année : ils ne forment pas une saison continue. Le réchauffement a déjà commencé : +1,7 °C observés depuis 1961-1990, jusqu'en 2025. Aujourd'hui, des restrictions d'eau de niveau « crise » s'appliquent sur le territoire de gestion « Bassin de Charente-aval ».

## Ce que la commune a déjà connu

Châtelaillon-Plage a été reconnue 14 fois en état de catastrophe naturelle depuis 1982, surtout au titre de : sécheresse des sols, inondations et chocs liés aux vagues. La sécheresse des sols, déjà reconnue 5 fois, fait aussi partie des évolutions projetées. À l'échelle de la commune, des périmètres d'inondation et de submersion marine sont recensés. Le littoral est largement aménagé : l'érosion n'y est que partiellement mesurable, et classée « faible » là où elle l'est (observations 1937-2010). Elle est inscrite sur la liste nationale des communes concernées par le recul du trait de côte (loi Climat et Résilience). L'effet concret de ces évolutions dépend du quartier et du logement, qu'examinent les modules Autour de l'adresse et Logement.`;

test("Châtelaillon 2050 : le texte déterministe de référence", () => {
  assert.equal(deterministicSynthesis(projection(), "gwl20"), CHATELAILLON_2050);
});

test("stable : même snapshot, même texte", () => {
  assert.equal(deterministicSynthesis(projection(), "gwl20"), deterministicSynthesis(projection(), "gwl20"));
});

test("il passe ses propres contrôles, à chaque horizon", () => {
  for (const h of HORIZONS) {
    const p = projectForSynthesis(buildTerritoireSnapshot(chatelaillonInputs(), T0), h);
    assert.deepEqual(checkSynthesis(deterministicSynthesis(p, h), p), [], h);
  }
});

test("il ne déclare aucun phénomène dominant (pas de classement par percentile)", () => {
  const t = deterministicSynthesis(projection(), "gwl20");
  assert.doesNotMatch(t, /domine|pèse le plus|principal enjeu|avant tout|surtout la|le plus marquant/i);
  assert.match(t, /parmi les évolutions visibles/);
});

test("il ne convertit jamais des jours en mois", () => {
  assert.doesNotMatch(deterministicSynthesis(projection(), "gwl20"), /\bmois\b/);
});

test("données minimales : un texte digne, qui passe les contrôles", () => {
  const i: TerritoireInputs = {
    ...chatelaillonInputs(),
    entry: null, urbanRole: null, ademe: null, scenarios: null, georisques: null, catnat: null,
    catnatInondationIndex: null, vigieau: null, drought: null, littoral: null, era5: null,
    saisonnalitePct: null, distinctiveTrait: null,
  };
  const p = projection(i);
  const t = deterministicSynthesis(p, "gwl20");
  assert.match(t, /^Châtelaillon-Plage à l'horizon 2050/);
  assert.equal(t.split(/\n## /).length - 1, 3);
  assert.deepEqual(checkSynthesis(t, p), []);
});
