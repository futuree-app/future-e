# Lot 03 : Quimper, Amiens, Besançon, Valence, Pau (15/10/2026)

Cinq articles mobilité préparés avec la chaîne existante (`outil/lot.py`). Codex rédige, Claude relit une seule fois, Codex corrige au plus une fois. Ni publication, ni fusion, ni modification des routes publiques ; lot 01, essai Angers et lot 02 inchangés. Lecture : `http://localhost:3155/dev/lot`, lot « 2026-10-lot-03-codex ».

Avec les 10 articles du lot 01 et les 3 du lot 02, **18 articles sont préparés** sur les vingt visés.

## Articles

| Commune | Article retenu | Relecture Claude | Correction Codex | Visuels |
|---|---|---|---|---|
| Quimper (29232) | `redaction.md` | 1 niveau 2 | aucune | carte, 3 secteurs repérés |
| Amiens (80021) | `correction.md` | 2 niveaux 2 | une, déclenchée par un faux positif du contrôle | carte, 3 secteurs |
| Besançon (25056) | `redaction.md` | 2 niveaux 2 | aucune | carte (2 secteurs) et barres |
| Valence, Drôme (26362) | `correction.md` | **1 niveau 1** | une, erreur corrigée | carte, 3 secteurs |
| Pau (64445) | `correction.md` | 3 niveaux 2 | une, déclenchée par un faux positif du contrôle | carte, 2 secteurs |

Les fichiers sont dans `<insee>/generation/` : relecture dans `relecture.md` et `relecture.anomalies.json`, corrections dans la section E de `correction.md`. Les visuels sont dans `<insee>/visuels/`, et les cinq cartes s'affichent sur /dev/lot.

## Erreurs réelles corrigées

- **Valence, niveau 1 (raisonnement) :** « Si votre projet consiste à moins conduire, Gare mérite ainsi votre attention » faisait des pratiques des habitants une recommandation de secteur. Codex a supprimé le passage ; l'écart chiffré et le renvoi à la carte restent.
- Aucune autre erreur de niveau 1. Contrôle déterministe final : 0 anomalie sur les cinq articles.

Au passage de la correction, Codex a aussi traité quelques points de niveau 2 en quelques mots, comme le permet sa consigne :
- Amiens : un intertitre ambigu sur la population, et « le dossier permet » devenu « on peut » ;
- Pau : le millésime 2025 de la Base permanente des équipements ajouté.

Points de niveau 2 restés en l'état, sans nouvelle génération :
- Quimper : « Les écarts entre secteurs donnent des pistes » ;
- Besançon : la méthode ne donne pas la règle de choix des six communes de travail, et une phrase sur Montrapon contredit l'ouverture ;
- Pau : « Ces contrastes donnent une raison de regarder précisément où se trouve chaque annonce » (relevée par Claude, écartée par Codex, qui s'en explique en section E), et la règle des six communes de travail.

À l'appréciation du porteur, non retouché : le titre de Valence (« quel secteur regarder pour utiliser moins la voiture ? ») garde la forme d'une recommandation de secteur, alors que le passage visé a été retiré du corps.

## Blocage rencontré : faux positifs du contrôle

À Amiens et Pau, le contrôle déterministe a pris le numéro d'un nom de secteur (« Amiens Nord 3 », « Pau Centre 2 ») pour une valeur chiffrée. Il a donc déclenché deux corrections sans erreur réelle. Codex a écarté ces anomalies avec raison (section E).

Le contrôle ignore désormais les noms de secteurs du dossier (`outil/controle_article.py`). Les lots 01, 02 et 03 repassent tous à 0 anomalie avec cette version.

## Collecte

- Collecte bornée habituelle (Claude Code, Sonnet 5.5) : 5 informations vérifiées pour Qub (Quimper), Ginko (Besançon) et Idelis (Pau).
- Ametis (Amiens) et Citéa (Valence) : aucun site officiel joignable selon transport.data.gouv.fr. Le complément documentaire est omis.

## Durées et compteurs

| | Quimper | Amiens | Besançon | Valence | Pau |
|---|---|---|---|---|---|
| Préparation | 46,1 s | 47,7 s | 31,3 s | 26,9 s | 42,2 s |
| Rédaction Codex | 121,5 s | 160,1 s | 112,1 s | 101,9 s | 123,2 s |
| Relecture Claude | 42,2 s | 22,9 s | 35,2 s | 19,1 s | 32,7 s |
| Correction Codex | aucune | 39,9 s | aucune | 31,9 s | 66,9 s |

Totaux :
- Collecte : 3 appels, 128,6 s.
- Rédaction : 5 appels Codex, 618,8 s.
- Relecture : 5 appels Claude, 152,1 s.
- Correction : 3 appels Codex, 138,7 s.

Jetons par appel : `<insee>/generation/*.json` et `depenses.jsonl`. Pour Codex : environ 33 000 à 35 000 en entrée, 3 000 à 5 000 en sortie pour une rédaction. Codex ne renvoie pas le modèle effectivement utilisé.

« Équivalent API » calculé localement par Claude Code : 1,82 $ pour les relectures et 0,15 $ pour la collecte. Ni facture, ni mesure du quota. Les jetons ne mesurent pas non plus le quota des abonnements. Aucune clé API n'a été utilisée : `apiKeySource: none` côté Claude, `auth_mode: chatgpt` côté Codex. Aucun refus, aucune suspension.

**Temps du terminal pilote sur les textes du lot 03 :** aucune retouche. Hors texte, le pilote a corrigé les faux positifs du contrôle et vérifié les visuels et l'affichage.
