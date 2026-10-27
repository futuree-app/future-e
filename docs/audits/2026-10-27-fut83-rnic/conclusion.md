# FUT-83 · Conclusion

**Décision du porteur, 27/10/2026 : reporter l'intégration du RNIC (option C).** Pas d'investigation ni de
développement RNIC supplémentaire.

## Pourquoi les autres options ne sont pas retenues

- **Intégration ciblée (A)** : 5 à 6 jours de travail pour afficher des faits que l'annonce donne déjà en partie
  (nombre de lots, procédures, L721-1). Le bloc ne serait présent que pour environ 42 % des adresses d'immeuble
  collectif, et il désignerait la copropriété voisine environ une fois sur 25, même parmi les réponses uniques.
- **Usage technique seulement (B)** : environ 3 jours d'import et de rapprochement, sans gain visible. FUT-80 regroupe
  déjà les diagnostics par bâtiment, et la phrase sur la copropriété de l'audit est déjà conditionnelle et juste.
- **Variantes écartées en cours d'audit** : relever les procédures dans l'annuaire en ligne (pas d'API, pas de
  licence de réutilisation) ; lire seul le numéro de copropriété saisi sur le DPE (1 % des DPE d'appartement, utile
  seulement si un bloc copropriété existe un jour).

## Quand réexaminer le RNIC

1. L'Anah publie les procédures et les arrêtés en données ouvertes ou par une API documentée. À regarder dès
   l'entrée en vigueur du décret n° 2025-831, vers le 21/02/2027.
2. Le registre porte un identifiant de bâtiment (RNB) ou d'adresse (BAN).
3. Une recherche utilisateur montre que la taille ou la gestion de la copropriété pèse dans le choix avant la visite.

## Piste indépendante retenue

[FUT-150](https://linear.app/future-e/issue/FUT-150) : guider l'acheteur d'un appartement en copropriété vers les
documents à demander et les points à vérifier. Elle repose sur la loi (L721-2) et le projet du lecteur, pas sur le
registre.

## Contenu du dossier

`synthese.md` (5 minutes) · `sources-et-champs.md` · `rattachement.md` · `scenarios-acheteur.md` · `arbitrage.md` ·
`mesures/` (données et `LISEZMOI.md` pour reproduire) · scripts en lecture seule dans `scripts/fut83/`.
