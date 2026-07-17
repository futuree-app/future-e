# Passation — chantier « composition narrative de faits liés », CODE TERMINÉ (6/6 tâches)

**Horodatage** : 2026-07-17 · **Branche** : `feat/composition-faits-lies` (6 commits feat + 1 docs
au-dessus de `main` ; spec + plan commités SUR `main` avant branchement : `203c7c8`, `084fa88`, `be58a0d`).
**Rien n'est poussé** (ni main ni la branche). Aucune PR ouverte.

## État : plan exécuté en entier

Les 6 tâches du plan `docs/superpowers/plans/2026-07-17-composition-faits-lies.md` sont commitées :

- `e5cadd0` Task 1 : types + patron `seasonal_climate_tradeoff` + validateur.
- `1207be6` Task 2 : patron `territory-size-multiple-consequences`.
- `5e59c03` Task 3 : assembleur (`DossierCard`, liste unique triée puis cappée, `absorbedFacts`).
- `2b85a46` Task 4 : plan narratif (`compositions_found`, lead tradeoff), prompt v11, sonde étendue.
- `0faa09f` Task 5 : rendu (`DecisionFactRenderParts`, `FactCompositionCard` 2 variantes + dépliable).
- `cf78a18` Task 6 : branchement `territory-facts.ts` + `DossierAvecLogement.tsx` + élision `deCommune`.

## Vérifications faites (Task 6)

- Suites complètes : 613/613 tests, `tsc` 0, `npm run build` vert.
- Vérification vivante sur DONNÉES RÉELLES par le vrai chemin `buildCommuneDossier` (script scratchpad,
  loader alias `@/` + stub `server-only`) :
  - Antibes 06004 (douceur 3 + chaleur 3) : composition tradeoff « Des hivers doux, avec une exposition
    estivale à arbitrer » dans « Ce qui départage vraiment », fait chaleur absorbé (0 fait, 1 compo,
    1 absorbé), action et limitation présentes.
  - Gouesnou 29061 (même projet) : AUCUNE composition, aucune carte.
  - Saint-Cirq-Lapopie 46256 (prefere_grande_ville 3 + eviter_isolement 2) : composition shared_evidence
    dans « Ce qui correspond moins bien », conséquences hiérarchisées (structuring puis secondary),
    limitation sous la conséquence isolement.
- Sonde `node --env-file=.env.local scripts/probe-conclusion.ts` : **65/65 blocs survivent**, dont les
  2 cas composés (lead tradeoff, registre composé) 5/5 tirages chacun.
- Correction au passage : élision « Les hivers d'Antibes » (helper local `deCommune`, voyelles seules).
  NOTE : le même défaut « de ${nom} » existe ailleurs (ex. `conclusion-plan.ts:256`), non traité.

## Reste à faire (décisions porteur)

1. **Merge dans `main`** : au moment du merge, reporter dans la spec l'écart assumé
   (`DossierSection.cards` remplace `facts`, cf. auto-revue du plan v2). Ne pas pousser `main` sans
   demande explicite (prod = push main).
2. Après merge : le bump prompt v11 invalide les artefacts narratifs existants (voulu).
3. Mémoire : fiche `/memory` sur les décisions de composition (vue hors DecisionFact, gates poids >= 2,
   lead tradeoff oui / shared_evidence jamais) + éventuel passage archiviste, une fois livré.

## Pièges connus (inchangés)

- `node --test` : jamais value-importer `comparateur-vie.ts` (server-only) depuis un fichier testé.
- `mismatchShown` (ConclusionPlanInput) = « cartes mismatch visibles » (fait simple + shared_evidence).
