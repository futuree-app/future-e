// FUT-159 et FUT-161 · LES BLOCS GASPAR DES PAGES /inondation ET /chaleur, PHRASES RÉELLEMENT AFFICHÉES.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { etatBlocGaspar, GASPAR_INDISPONIBLE, phraseReconnaissancesCatnat } from "./gaspar-pages-publiques.ts";

const PAGES = [
  "src/app/(public)/inondation/[insee_code]/page.tsx",
  "src/app/(public)/chaleur/[insee_code]/page.tsx",
];

test("FUT-161 · le nombre et « fois » restent liés par une espace insécable, avec 1 et plusieurs reconnaissances", () => {
  assert.equal(phraseReconnaissancesCatnat(1, "Niort", null), "Niort a déjà été reconnue 1\u00a0fois en état de catastrophe naturelle");
  assert.equal(phraseReconnaissancesCatnat(17, "Metz", null), "Metz a déjà été reconnue 17\u00a0fois en état de catastrophe naturelle");
  assert.equal(
    phraseReconnaissancesCatnat(16, "Paris 11e Arrondissement", "Paris"),
    "À l'échelle de Paris (GASPAR ne publie pas les arrondissements), la ville a déjà été reconnue 16\u00a0fois en état de catastrophe naturelle",
  );
  assert.doesNotMatch(phraseReconnaissancesCatnat(17, "Metz", null), /\dfois/);
});

test("FUT-161 · aucune des deux pages ne compose plus la phrase en JSX, là où l'espace se perdait", () => {
  for (const page of PAGES) {
    const source = readFileSync(page, "utf8");
    assert.doesNotMatch(source, /\} fois en état/, page);
    assert.match(source, /phraseReconnaissancesCatnat\(/, page);
  }
});

test("FUT-159 · trois états par bloc : panne, source lue sans fait, contenu", () => {
  assert.equal(etatBlocGaspar(null, 0), "indisponible");
  assert.equal(etatBlocGaspar(null, 3), "indisponible");
  assert.equal(etatBlocGaspar({ riskLabels: [] }, 0), "vide");
  assert.equal(etatBlocGaspar({ total: 0 }, 0), "vide");
  assert.equal(etatBlocGaspar({ total: 17 }, 17), "disponible");
});

test("FUT-159 · la phrase de panne nomme la source et ne dit rien du risque", () => {
  const p = GASPAR_INDISPONIBLE.phrase("les arrêtés de catastrophe naturelle pour inondation");
  assert.equal(GASPAR_INDISPONIBLE.libelle, "Donnée temporairement indisponible");
  assert.equal(
    p,
    "Lors de la dernière mise à jour de cette page, la base GASPAR (Géorisques) n'a pas répondu : les arrêtés de catastrophe naturelle pour inondation n'ont pas pu être lus. Rien n'en est déduit ici. Vous pouvez les consulter sur georisques.gouv.fr.",
  );
  assert.match(p, /les arrêtés de catastrophe naturelle pour inondation n'ont pas pu être lus/);
  assert.doesNotMatch(p, /aucun|pas de risque|0 /i);
});

test("FUT-159 · la phrase date la panne de la dernière génération de la page, gardée 24 h, jamais de la visite", () => {
  const p = GASPAR_INDISPONIBLE.phrase("les risques officiels");
  assert.match(p, /^Lors de la dernière mise à jour de cette page, /);
  assert.doesNotMatch(p, /chargement|à l'instant|en ce moment|actuellement/i);
  for (const page of PAGES) {
    assert.match(readFileSync(page, "utf8"), /export const revalidate = 86400/, `${page} : si le cache change, revoir la phrase`);
  }
});

test("FUT-159 · chaque page affiche les deux blocs selon leur état, jamais selon le seul compte", () => {
  for (const page of PAGES) {
    const source = readFileSync(page, "utf8");
    assert.equal((source.match(/=== 'indisponible' && \(\s*<GasparIndisponible/g) ?? []).length, 2, page);
    assert.equal((source.match(/etat(Risques|Catnat) === 'disponible' && \(/g) ?? []).length, 2, page);
    assert.doesNotMatch(source, /\{(floodRisks|heatRisks)\.length > 0 && \(/, page);
    assert.doesNotMatch(source, /\{(catnatInond|catnatSecheresse) > 0 && \(/, page);
  }
});
