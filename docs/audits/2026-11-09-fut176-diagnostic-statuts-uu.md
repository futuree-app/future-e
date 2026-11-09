# FUT-176 · Diagnostic des statuts urbains (étape 1, avant correction)

Branche `bonjourfuturee/fut-176-statuts-urbains-insee`, worktree `.claude/worktrees/fut176`, base `origin/main` 51a493d0.
Aucun code modifié à ce stade.

## Source officielle (data/uu2020.xlsx du checkout principal, non versionné)
Insee UU2020, mise en ligne le 21/03/2025, **géographie au 01/01/2023**. 34 945 communes.
STATUT_COM_UU (calculé sur la population 2017) : H hors UU 27 369 · C ville-centre 1 532 · B banlieue 4 779 · I ville isolée 1 265.
- Ville isolée = UU constituée d'une seule commune (TYPE_UU2020 = 1).
- Ville-centre / banlieue : UU multicommunale ; une commune > 50 % de la pop. est seule ville-centre, sinon toutes celles > 50 % de la plus peuplée.
- Hors UU = pas de continuité du bâti de 2 000 hab. Ce n'est PAS une « ville isolée ».

## Constats
1. `scripts/populate-unite-urbaine.py` ne garde que le code `uu` (H -> null) : **le statut C/B/I est perdu**.
2. Une commune absente du fichier reçoit `uu = null`, et `populate-uu-pop.mjs` en fait `hors_uu = true` : **absence de donnée = hors UU**.
3. Croisement index (34 788, COG 2025) / fichier : 0 divergence de code UU ; 56 absents = 45 arrondissements PLM (traités par la commune parente) + **11 communes nouvelles post-2023**, toutes classées hors UU sans preuve :
   - 12218 Conques-en-Rouergue <- 12076 H ; 14581 Aurseulles <- 14011 H (le statut des prédécesseurs confirme H)
   - **49126 Orée d'Anjou <- 49069 statut I (ville isolée, UU 49305)** : aujourd'hui affichée « Commune isolée, hors agglomération » à tort
   - **69114 Porte des Pierres Dorées <- 69159 statut B (banlieue de Lyon, UU 00760)** : à tort hors UU
   - 15031 Celles, 15035 Chalinargues, 15047 Chavagnac, 15171 Sainte-Anastasie, 60694 Les Hauts-Talican, 85165 L'Oie, 85212 Sainte-Florence : prédécesseur non trouvé par `successeurs-cog2026.json` (inverse de `rattaches`) — à résoudre par les mouvements COG, sinon statut « inconnu », jamais H.
4. Rendu (`src/lib/territory-identity.ts`, `comparateur-vie.ts` getTerritoryContext, `territoire/synthesis-contract.ts` ROLE_TEXT, `synthesis-deterministe.ts` l.81) :
   - role `isolee` = `!entry.uu` -> « Commune isolée, hors agglomération » (confusion avec la ville isolée Insee) et « structure la vie locale d'un territoire plus rural » (surinterprétation).
   - role `pole` = commune la plus peuplée de l'UU -> « Principal pôle urbain local » / « concentre les fonctions urbaines de son bassin de vie » (surinterprétation ; une ville isolée Insee comme Corte tombe ici).
   - `summaryHead` : « Ville » pour toute commune en UU (Mont-Dauphin, 171 hab., banlieue d'une UU de 3 258 hab.).
5. Exemples (index actuel) : Bony 02100 139 hab. hors UU · Mont-Dauphin 05082 171 hab. UU 05104 (3 258 hab., 3 communes) · Chartres 28085 UU 28501 (88 891) · Corte 2B096 UU 2B202 monocommunale (ville isolée) · Orée d'Anjou 49126 uu null (faux, cf. 3) · Levallois-Perret 92044 UU 00851 Paris (banlieue).

## Plan restant
- Import : conserver `uu_statut` (C/B/I/H) ; communes nouvelles via prédécesseurs (statut unique -> repris ; mixte ou introuvable -> `null` = inconnu) ; distinguer `null` inconnu de H.
- Rôles : `hors_uu` / `ville_isolee` / `ville_centre` / `banlieue` / `inconnu` ; textes neutres (« hors de toute unité urbaine : pas d'agglomération bâtie continue de 2 000 habitants »), « commune » sauf statut + taille justifiant « ville » ; supprimer les phrases de rôle local.
- Grep exhaustif des citations (`isolee`, `ROLE_TEXT`, `hors_uu`, `populationKind: "isolated_commune"`, `eviter_isolement`) — règle AGENTS.md sur les valeurs devenues conditionnelles.
- Tests déterministes (statuts, très petites communes, données manquantes, codes, non-surinterprétation, anciens snapshots `role: "isolee"`), contrôle national, PR.
