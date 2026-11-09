# FUT-183 · Territoire OSO : arrondis affichés et seuils des catégories

10/11/2026. Branche `bonjourfuturee/fut-183-territoire-oso-aligner-arrondis`, base `origin/main` e9158447 (FUT-175 et
FUT-177 inclus). Index réel `data/comparateur-index.json.gz` : 34 743 communes OSO lisibles.

## 1. Diagnostic

`land.category` (`src/lib/territoire/facts.ts`, `landCategory`, règle `land-category@2`) se lit sur des parts **au
dixième** (`readLandShares`, `round1`), dans cet ordre : urbanisé ≥ 50 → « Majoritairement urbanisé » ; naturel ≥ 45
→ « Forte présence naturelle » ; agricole ≥ 50 → « À dominante agricole » ; naturel < 20 → « Faible présence
d'espaces naturels » ; sinon « Occupation mixte ». Aucun autre seuil OSO dans Territoire.

Les surfaces arrondissaient à l'entier :

| Surface | Fichier | Avant |
|---|---|---|
| Carte « Espaces naturels » : titre du volet, sous-titre, ventilation, eau, secteur | `territory-identity.ts` (`buildTerritoryCards`), `QuartierClimatData.tsx` | `Math.round` |
| Texte déterministe (lecture immédiate, affichée sur chaque page) | `synthesis-deterministe.ts` | `frNum(x)` = entier |
| Projection envoyée au modèle | `synthesis-contract.ts` | déjà au dixième |
| Carte d'identité (`solDominant`) | `territory-identity.ts` | libellé seul, sans chiffre |

Hors Territoire, sans `land.category` : Où vivre (`comparateur-vie.ts`, ses propres seuils sur les parts du contour)
et Projet (`module-facts-map.ts`, boisement) relèvent de FUT-182 et ne sont pas touchés.

### Comptage national

Critère : un lecteur applique la règle, dans son ordre, aux **seuls chiffres affichés** ; l'incohérence existe quand
il trouve une autre catégorie que celle affichée.

**318 communes** à l'entier (0 au dixième) :

| Catégorie affichée | Les chiffres affichés donnent | Communes |
|---|---|---|
| Occupation mixte | Forte présence naturelle | 113 |
| Occupation mixte | À dominante agricole | 112 |
| À dominante agricole | Forte présence naturelle | 65 |
| Occupation mixte | Majoritairement urbanisé | 12 |
| Faible présence d'espaces naturels | Occupation mixte | 9 |
| Forte présence naturelle | Majoritairement urbanisé | 4 |
| Faible présence d'espaces naturels | À dominante agricole | 2 |
| Faible présence d'espaces naturels | Majoritairement urbanisé | 1 |

Seuils en cause : naturel 45 (163), agricole 50 (113), naturel 45 et agricole 50 (15), urbanisé 50 (16), naturel 20
(9), urbanisé 50 et naturel 45 (1), agricole 50 et naturel 20 (1).

Critère naïf (un entier affiché atteint un seuil que la valeur n'atteint pas, sans tenir compte de l'ordre des
règles) : 531 communes. L'écart vient surtout des 140 communes à 19,5-19,9 % de naturel que l'ordre range de toute
façon en agricole ou en urbanisé.

Le 252 annoncé par FUT-175 (§ 8.4) n'avait pas de définition écrite. Aucune des variantes testées ne le retrouve :
naturel seul, 189 ; composition seule, 146. Le 318 est figé par un test.

## 2. Règle retenue

**Toute part OSO s'affiche au dixième, virgule décimale, décimale nulle omise** (`pctOso`, `src/lib/territoire/oso-format.ts`) :
« 44,9 % », « 45 % », « 7,7 % ». Les faits portent déjà cette précision. La valeur affichée est donc exactement celle
qui a servi à classer : aucune contradiction possible, quelle que soit la commune ou la frontière.

Options écartées :
- **Décimale près des seuils seulement** : deux communes voisines s'afficheraient à deux précisions (« 44,9 % » et
  « 52 % ») ; la règle serait invisible et dépendrait d'une liste de seuils à tenir à jour à chaque nouvelle règle.
- **Arrondi orienté** (44,9 → 44) : le chiffre affiché ne serait plus la valeur arrondie, c'est-à-dire faux.

Le dixième vaut pour toutes les parts de la carte, eau et secteur compris : une seule précision par carte.
L'eau s'affiche dès 1 % réel (avant : dès 0,5 %, que l'arrondi transformait en « 1 % »).

## 3. Synthèses et caches

- **Texte déterministe** : recalculé à chaque affichage (`page.tsx`, `deterministicSynthesis`). Un repli
  déterministe en cache n'est jamais servi (`readSyntheses` ne rend que les origines modèle). Le passer au dixième ne
  demande donc **aucune montée de `SYNTHESIS_CONTRACT_VERSION`** : le contrat reste `territoire-synthese@7`, aucune
  invalidation, aucune régénération. Le prompt du modèle ne contient pas le texte déterministe.
- **Snapshots** : `facts.ts` n'est pas modifié ; valeurs, empreintes et `territoire-facts@2` restent identiques.
- **Synthèse du modèle : limite non corrigée.** La projection est au dixième, mais la consigne permet d'arrondir
  (« 38 % pour 37,9 »). Le modèle peut donc encore écrire « 45 % » pour Rochefort. Corriger la consigne ou les
  contrôles change la sortie et demande `@8` : une invalidation nationale, avec régénération à la consultation.
  Proposition : une consigne (« les parts d'occupation des sols se citent au dixième, telles qu'écrites ») et un
  contrôle de frontière, à joindre à la prochaine montée de contrat. Décision du porteur.

## 4. Échantillon (avant → après)

Naturel / urbanisé / agricole, en % des terres :

| Commune | Catégorie | Avant (entier) | Après |
|---|---|---|---|
| Rochefort (17299) | Occupation mixte | 45 / 48 / 8 | 44,9 / 47,7 / 7,6 |
| Brignais (69027) | Occupation mixte | 45 / 50 / 6 | 44,9 / 49,6 / 5,5 |
| Royan (17306) | Occupation mixte | 32 / 50 / 19 | 31,5 / 49,6 / 19 |
| Massieux (01238) | Faible présence d'espaces naturels | 20 / 45 / 35 | 19,8 / 44,9 / 35,4 |
| Feuquières-en-Vimeu (80308) | Faible présence d'espaces naturels | 20 / 31 / 50 | 19,6 / 30,6 / 49,7 |
| Lauraguel (11197) | Occupation mixte | 45 / 6 / 50 | 44,5 / 5,8 / 49,6 |
| Marlieux (01235) | Occupation mixte | 43 / 8 / 50 | 42,7 / 7,8 / 49,5 |
| Dompierre-sur-Chalaronne (01146) | Occupation mixte | 45 / 8 / 47 | 44,9 / 8,4 / 46,7 |
| Palavas-les-Flots (34192) | Forte présence naturelle | 49 / 49 / 2 | 48,9 / 49,2 / 1,9 |
| Sète (34301) | Majoritairement urbanisé | 34 / 50 / 16 | 33,8 / 50,4 / 15,8 |
| Châtelaillon-Plage (17094) | Occupation mixte | 36 / 49 / 14 | 36,4 / 49,3 / 14,3 |
| Carpiquet (14137) | Faible présence d'espaces naturels | 14 / 41 / 45 | 13,9 / 41,2 / 44,8 |
| Bony (02100) | À dominante agricole | 7 / 4 / 89 | 6,8 / 4,1 / 89 |

Catégories inchangées partout (FUT-175 et FUT-177 intacts). Rochefort, texte déterministe : « … : 47,7 % d'espaces
urbanisés, 7,6 % de cultures et 44,9 % d'espaces naturels sur ses terres. »

## 5. Tests

`src/lib/fut183-arrondis-oso.test.ts` (19 tests) :
- format de `pctOso` ;
- 13 frontières dans l'ordre réel des règles : 44,9/45 ; 19,9/20 ; urbanisé 49,9/50 ; agricole 49,9/50 ; et les
  croisements (urbanisé 50 et naturel 50, urbanisé 49,9 et naturel 45, naturel 44,9 et agricole 50, naturel 19,9
  et agricole 49,9 ou 50). Chacune vérifie la catégorie de la carte, puis la relecture des chiffres affichés par la
  carte et par le texte déterministe ;
- Rochefort complet (carte, ventilation, projection, texte) ;
- national : 318 à l'entier, 0 au dixième ; les 34 743 communes relues sur la carte et dans le texte, aucun écart ;
- garde : le composant formate chaque part par `pctOso` ; contrat toujours `@7`, valeurs du registre inchangées.

Contre-épreuve : sur le code de `main`, 11 de ces tests échouent (8 frontières, Rochefort, national, garde du
composant). Mis à jour pour le dixième : `fut175-oso-eau`, `fut177-conclusions-sols`, `fut178-portee-nature`,
`synthesis-deterministe` (valeurs attendues seulement).
