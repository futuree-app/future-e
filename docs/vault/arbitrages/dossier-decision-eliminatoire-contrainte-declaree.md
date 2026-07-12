# « Éliminatoire » = incompatibilité avec une contrainte déclarée ; la couverture est déclarée

**Date** : 2026-07-11 · **Statut** : arbitré (porteur), branché slice 1.

Un point n'est « éliminatoire » que lorsqu'il contredit une contrainte non négociable que le lecteur
a lui-même déclarée. Le critère vient du lecteur ; futur•e constate la contradiction. Trois états,
jamais un verdict : incompatibilité établie / possible à vérifier / aucune incompatibilité établie
dans les données examinées.

Corollaire de couverture (v2) : « aucune incompatibilité » ne se dit QUE sur les contraintes
réellement examinées. Une contrainte déclarée qu'aucune règle ne sait encore évaluer est NOMMÉE comme
non couverte, jamais avalée en silence. Le moteur retourne des évaluations (satisfied / incompatible /
not_applicable / unknown…), pas seulement des faits, pour rendre la couverture observable.

Deux vides distincts : projet sans contrainte dure (`no_hard_constraint_declared`) n'est jamais
confondu avec données insuffisantes (`insufficient_evidence`) ni avec projet non structuré
(`project_not_structured`).

Implémentation : `src/lib/decision/materiality-rules.ts`, `src/lib/decision/decision-assembler.ts`,
`src/lib/decision/project-view.ts` (couverture). Spec :
`docs/superpowers/specs/2026-07-11-dossier-decision-materialite-design.md`.
