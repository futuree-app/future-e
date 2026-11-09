# FUT-176 · Statuts urbains et interprétations Insee

Branche `bonjourfuturee/fut-176-statuts-urbains-insee`, base `origin/main` 51a493d0. 09/11/2026.

## 1. Source officielle et définitions

Base des unités urbaines 2020 de l'Insee, **publiée dans la géographie de l'index (COG au 01/01/2025)** :
`https://www.insee.fr/fr/statistiques/fichier/4802589/UU2020_au_01-01-2025.zip` (archive sha256 `bc43d62e67c5…be44840`,
xlsx `f2e14a9a…f8439772`, mise en ligne le 21/03/2025). L'ancien import lisait la version « géographie au 01/01/2023 ».

Statut de la commune (calculé par l'Insee sur la population 2017, onglet Documentation du fichier) :

| Statut | Définition Insee | Communes (géo 2025) |
|---|---|---|
| H hors unité urbaine | pas de zone de bâti continu (coupure ≤ 200 m) d'au moins 2 000 habitants | 27 279 |
| I ville isolée | unité urbaine d'**une seule** commune | 1 222 |
| C ville-centre | dans une agglomération de plusieurs communes : seule si > 50 % de la population, sinon toutes celles > 50 % de la plus peuplée | 1 496 (+ 45 arrondissements PLM) |
| B banlieue | les autres communes d'une agglomération de plusieurs communes | 4 746 |

« Hors unité urbaine » et « ville isolée » sont deux choses opposées : la seconde EST une agglomération.

## 2. Ce qui était faux

1. **Statut perdu à l'import** (`populate-unite-urbaine.py`) : seul le code `uu` survivait (H → null).
2. **Absence = hors UU** : une commune absente du fichier recevait `uu = null`, puis `hors_uu = true`. Croisement index / fichier 2023 : 11 communes nouvelles 2024-2025 dans ce cas, dont 4 à tort :
   - **Orée d'Anjou** (49126) : ville isolée (UU 49305), affichée « Commune isolée, hors agglomération » ;
   - **Porte des Pierres Dorées** (69114) : banlieue de Lyon ;
   - **L'Oie** (85165, B) et **Sainte-Florence** (85212, C) : nouvelle UU 85139 après le rétablissement d'Essarts en Bocage.
   Les 7 autres (Conques-en-Rouergue, Aurseulles, Celles, Chalinargues, Chavagnac, Sainte-Anastasie, Les Hauts-Talican) sont bien H.
3. **Rendu** : rôle `isolee` = « pas de code » ; rôle `pole` = « commune la plus peuplée de l'UU » (ville isolée comprise) ; « Ville » pour toute commune en UU ; phrases de rôle prêté.

Contrôle de couverture nationale après correction : **34 743 communes lues dans le fichier + 45 arrondissements = 34 788 entrées de l'index, 0 statut inconnu, 0 divergence de code** (test `couverture nationale`).

## 3. Avant / après des formulations

Carte d'identité Territoire (index réel, typologie « Intérieur » fixée pour comparer) :

| Commune | Statut | Avant | Après |
|---|---|---|---|
| Corte (2B096, 7 654 hab.) | I | Principal pôle urbain local · « Corte concentre les fonctions urbaines de son bassin de vie » | Forme à elle seule une agglomération · « Ville de l'intérieur, Corte forme à elle seule une agglomération. » |
| Bony (02100, 139 hab.) | H | Commune isolée, hors agglomération · « Bony structure la vie locale d'un territoire plus rural » | Hors agglomération : aucun ensemble bâti continu de 2 000 habitants · « Commune de l'intérieur, Bony se situe hors de toute agglomération. » |
| Mont-Dauphin (05082, 171 hab.) | B | Dans l'agglomération de Guillestre (3 258 habitants) · « **Ville** de l'intérieur, Mont-Dauphin s'inscrit… » | Commune de banlieue de l'agglomération de Guillestre (3 258 habitants) · « **Commune** de l'intérieur, Mont-Dauphin s'inscrit dans l'agglomération de Guillestre. » |
| Orée d'Anjou (49126, 17 162 hab.) | I | Commune isolée, hors agglomération · « structure la vie locale d'un territoire plus rural » | Forme à elle seule une agglomération · « Ville de l'intérieur, Orée d'Anjou forme à elle seule une agglomération. » |
| Chartres (28085, 38 447 hab.) | C | Principal pôle d'une agglomération de 88 891 habitants · « concentre les fonctions urbaines de son bassin de vie » | Ville-centre de l'agglomération de Chartres (88 891 habitants) · « Ville de l'intérieur, Chartres est au centre de son agglomération. » |
| Levallois-Perret (92044, 68 009 hab.) | B | Dans l'agglomération de Paris (10 893 507 habitants) · « **Ville**… s'inscrit dans l'agglomération de Paris » | Commune de banlieue de l'agglomération de Paris (10 893 507 habitants) · « **Commune** dense…, Levallois-Perret s'inscrit dans l'agglomération de Paris. » |
| Paris 1er (75101) | C (Paris) | Dans l'agglomération de Paris · « Ville… s'inscrit dans l'agglomération de Paris » | Arrondissement de Paris, ville-centre de son agglomération (…) · « Arrondissement de l'intérieur, Paris 1er Arrondissement appartient à Paris, ville-centre de son agglomération. » |
| Statut inconnu | — | Commune isolée, hors agglomération | aucune ligne de rôle · « Orée d'Anjou, commune de l'intérieur. » |

Règle du mot « Ville » : ville-centre ou ville isolée **et** au moins 2 000 habitants dans la commune (`peutDireVille`).

Synthèse Territoire (rôle transmis au modèle et patron déterministe) :

| Avant | Après |
|---|---|
| « commune isolée, hors agglomération » | « hors de toute agglomération (aucun ensemble bâti continu de 2 000 habitants) », sans nom d'agglomération |
| « principal pôle de son agglomération » | « au centre de son agglomération » (C) · « seule commune de son agglomération » (I) |
| « commune d'une agglomération » | « commune de banlieue de son agglomération » (B) |
| — | statut inconnu : aucun rôle transmis |

+ consigne : ne rien déduire du statut (services, commerces, animation, isolement, « pôle »), ne jamais écrire « isolée » ; + contrôle `interdit:statut-urbain-surinterprete` (« commune isolée », « principal pôle », « concentre les services », « structure la vie locale ») ; contrat **@5** (cache des anciennes synthèses invalidé : l'audit Châtelaillon en montre qui disent « n'est pas une commune isolée », « rôle d'appui », « bassin de vie dynamique »).

Comparateur et accueil :

| Où | Avant | Après |
|---|---|---|
| Identité « Pour une petite ville qui reste vraiment vivante. » | toute commune d'une UU de 2 000 à 100 000 hab. (Mont-Dauphin, 171 hab.) | exige aussi 2 000 habitants dans la commune |
| Identité « aux portes d'une grande ville, sans en habiter le centre » | 4 villes-centres Insee (Béthune, Bruay-la-Buissière, Nogent-sur-Oise, Audincourt) | réservée aux communes non centres |
| Dimension « Isolement » : paliers | Bassin de vie étendu / Bassin de proximité / Bassin de vie restreint | Grande agglomération / Agglomération moyenne / Petite agglomération ou commune |
| Aide | « La taille du bassin de vie qui dessert le territoire. » | « Le nombre d'habitants de l'agglomération, ou de la commune quand elle est hors agglomération. Il ne mesure pas à lui seul l'accès aux services ni aux transports. » |
| Raison favorable | au cœur d'un vaste bassin de vie / bassin de vie bien pourvu / bassin de vie de proximité | dans une grande agglomération / dans une agglomération de taille moyenne / dans une petite agglomération · commune hors agglomération |
| Compromis | bassin de vie réduit, plus isolé · bassin de proximité, plutôt qu'étendu | agglomération plus petite que souhaité · agglomération moyenne, plutôt que grande |
| Libellé du critère | Présence d'un bassin de vie offrant services et activités du quotidien. | Taille de l'agglomération (unité urbaine), ou de la commune quand elle est hors agglomération. Elle ne mesure pas à elle seule l'accès aux services. |
| Accueil, pastille taille | « Environ 10 893 507 habitants dans l'agglomération de Levallois-Perret. » | « … dans l'agglomération dont fait partie Levallois-Perret. » |

Aucun score, aucun classement, aucune commune des cinq projets et quatre trios de référence FUT-147 ne change (seuls les libellés ci-dessus).

## 4. Effets de données (assumés, mesurés)

- `uu` : 4 communes corrigées ; `uu_pop`/`uu_count` : 133 communes (UU de Lyon +4 185 hab., UU 85139 créée).
- `etudes_dyn` (FUT-135, rejoué à l'identique sur l'ancien index avant application) : 22 communes — UU de Mulhouse 68 → 67 (même palier), Chantonnay 31 → 30, Porte des Pierres Dorées null → 92 (valeur de Lyon).
- Millésimes de population (FUT-109) : UU 00760, 49305, 85139 réunissent désormais 2023 (`rafraichir-unites-urbaines.mjs`, contre-épreuve identique sur l'ancien index).
- Porte des Pierres Dorées est lue à la taille de l'agglomération de Lyon (classée « métropole » dans les critères de taille), comme Levallois-Perret à celle de Paris : c'est la convention existante appliquée au bon statut.

**Résiduel non traité (volontaire)** : les scores BPE (écoles, culture, études supérieures) de Porte des Pierres Dorées, L'Oie et Sainte-Florence gardent un rayon calculé avec leur population communale. Les recalculer déplace des rangs sur ~35 000 communes et dépend d'un parquet local qui diffère du fichier Insee republié (cf. FUT-141) : à traiter avec la prochaine mise à jour BPE. Le rayon affiché reste celui de la mesure : aucune phrase n'est fausse.

Hors périmètre, signalé : `labelForCategory` (FUT-8) dit « une ville moyenne » pour une agglomération de 25 000 à 100 000 habitants ; la phrase porte sur l'agglomération (« appartient à une ville moyenne »), pas sur la commune. Non modifié (décision de FUT-8).

## 5. Tests

`src/lib/fut176-statuts-urbains.test.ts` (19 tests) : statuts et incohérences, très petites communes, données manquantes, communes nouvelles et arrondissements, couverture nationale contre le fichier Insee (sautée sans le xlsx), surinterprétation sur tous les rôles × 5 tailles, contrôle de synthèse, compatibilité des snapshots et projections d'avant (`isolee` → inconnu, `pole`/`agglo` → « dans l'agglomération »), comparateur, accueil.
Tests mis à jour avec leur raison : FUT-147 (libellés, clé de cache, lignes admises), FUT-140 (1 781 périurbaines), FUT-141 (décalage Mulhouse, 5 556 mesurées), FUT-109 (Lyon [2021, 2023], L'Oie), PLM (rôle ville-centre).
