# FUT-147 · Brief de revue indépendante (PR #104)

À confier à un relecteur qui n'a pas écrit le code. Lecture seule. Le rapport est à écrire au fil de l'eau dans `docs/rapports-agents/<relecteur>/2026-10-28-fut147-revue.md`. Ne pas se fier au rapport de l'auteur (`2026-10-28-fut147-bdiff.md`) : repartir des sources primaires et du diff `git diff 4d75603f...HEAD`.

## Questions à trancher, par ordre de gravité

1. **Les textes disent-ils vrai ?**
   - Aucune phrase ne doit dire qu'une surface a brûlé *dans* la commune, ni transformer une absence en sécurité.
   - Aucune ne doit opposer le passé à la projection DRIAS.
   - Vérifier sur `src/lib/incendies-observes.ts`, pour les quatre états, et sur `docs/audits/2026-10-28-fut147/recette-textes.json`.
   - Chercher les tournures que l'expression `PHRASES_INTERDITES` ne couvrirait pas.
2. **Rattachement.**
   - Rejouer 3 communes au choix hors des cas déjà testés : une fusionnée, une de Corse, une d'outre-mer.
   - Point de départ : le CSV brut (`node scripts/bdiff/telecharger.mjs`, cache hors dépôt) et la fiche `https://bdiff.agriculture.gouv.fr/incendie/{année}/{numéro}`.
3. **Non-régression.**
   - La capture de référence (`scripts/fut147/capturer-reference.mjs`, lancée sur 4d75603f) couvre-t-elle assez de cas ?
   - Un chemin du comparateur lit-il la table AVANT le classement ? Il ne doit pas.
   - La ligne du Dossier comparatif peut-elle influencer `themeLeaderInsee`, `resume`, `divergence`, `truncateComparaison` ?
4. **Cache des synthèses (C6).**
   - Un chemin met-il la mémoire des incendies dans le snapshot Territoire, dans sa projection ou dans un prompt ?
   - Le hub `/rapport` (préchauffage) est-il cohérent ?
5. **États incomplets.**
   - La distinction est-elle tenue entre campagne déclarée inconnue, limite générale avant 2020 hors aire méditerranéenne et résultat vide ?
   - La liste `AIRE_MEDITERRANEENNE` correspond-elle à celle des définitions du producteur ?
6. **Production.**
   - Le fichier est-il dans la trace de toutes les routes qui l'appellent (`next.config.ts`) ?
   - Que se passe-t-il si `data/bdiff-incendies.json` manque en production ?
   - Coût mémoire, poids client.
7. **Licence.** Le dossier présente-t-il la contradiction comme résolue quelque part ? Il ne doit pas.

## Hors périmètre

Autour, Logement, causes des feux, nouveau score, refonte des cartes.

## Verdict attendu

Pour chaque point : constat, preuve (fichier:ligne ou commande), gravité (bloquant, à corriger, remarque). Puis GO ou NON pour fusion.
