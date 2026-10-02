# FUT-33, phase 2B.2 D : plan et décisions avant code

Date : 02/10/2026. Base : `f14e2410`. Aucun code modifié par ce document.

## Audit des anciens projets (lancé par le porteur, lecture seule)

5 projets : aucun `excludeSea`, aucun `nearSea`, aucun `farFromSea`, aucune condition mer confirmée ; 1 projet avec la
préférence `proximite_mer`. 48 dossiers figés (`engine-1`, `engine-2`) : aucun `excludeSea` ni `nearSea`. Rien à
migrer, aucun mécanisme de reconfirmation ni de « analyse plus précise disponible » à construire.

## Cartographie de ce qui reste

| Consommateur | Ce qu'il fait | Lit aujourd'hui |
|---|---|---|
| `coast-rules.ts` (dossier) | préférence « la mer compte » : carte « dans ce que vous recherchez » (≤ 15 km) ou écart (≥ 100 km) | `mer_centre_km` + seuils 15 / 100 |
| `deriveCategoriesFromEntry` (comparateur-vie) | tag `littoral` (accueil, questions de tension) + `littoral_atlantique` / `_mediterranee` | ancienne distance ≤ 5 km + **département** |
| `deriveCategories` (commune-categories, repli hors index) | idem, sans aucune donnée communale | **département seul** |
| `territory-mood.ts` → `QuartierClimatData.tsx` | type de territoire → textes climat (« le climat atlantique tempère encore les extrêmes ») | catégories ci-dessus |
| `FutureELanding.tsx` | phrases d'accueil (« tensions côtières », submersion) | catégories `littoral*` |
| `TerritoryIdentityCard.tsx` | pictogramme | type de territoire |
| `buildSignature` / `buildIdentiteCandidates` (comparateur-vie) | « Côte bretonne », « Côte méditerranéenne », promesse « côtière » | ancienne distance ≤ 15 km + **région** |
| raison de carte `proximite_mer` | « en bord de mer » ≤ 2, « à deux pas du littoral » ≤ 8, sinon « à proximité du littoral » | ancienne distance |
| paliers du Dossier comparatif « Mer » | « En bord de mer / Proche du littoral / Loin de la mer » | tranches 66 / 34 du **score** (courbe) |
| `territory-identity.ts` (passeport Territoire) | « En bord de mer » ≤ 2, « Proche du littoral » ≤ 8 | ancienne distance |
| `territoire/facts.ts`, `server/territoire-snapshot.ts` | fait « position » figé dans le Territoire | ancienne distance |
| `metrics.distance_cote_km` (résultats de recherche) | champ exposé au client | ancienne distance |
| `littoral.ts` `FACADE_BY_DEPT` | façade d'une commune connue par l'érosion côtière | **département** |
| formulations `nearSea` / `farFromSea` | « en deçà des 30 km au moins qu'indique votre projet » | – |

## Décisions à valider

### D-1. La préférence « la mer compte », sans distance, au dossier

Choix A validé : montrer la distance comme un fait, sans « dans ce que vous recherchez » ni écart. **Découverte** :
le dossier n'a aucun type de carte « fait neutre » pour une préférence (les rôles sont incompatibilité, écart,
correspondance, à confirmer, à vérifier, inconnue, compromis ; « neutre » veut dire silencieux, par doctrine).

- **A1, une carte « mesure » nouvelle** : nouveau rôle de fait, son rendu dans le dossier, l'export, le récit et la
  validation. Un vrai chantier d'interface, hors du périmètre « nettoyage ».
- **A2, recommandé pour fermer FUT-33** : la règle n'émet plus ni correspondance ni écart ; le critère est examiné,
  silencieux (couverture acquise). La distance reste lisible là où elle vit déjà : la fiche Territoire (passeport,
  migré en D-3) et, si le lecteur confirme la mer comme condition, la carte « à confirmer » qui montre déjà la mesure
  (« Le point de référence de Bordeaux se situe à environ 39 km du rivage marin »). A1 devient un ticket séparé si
  le besoin se confirme. Conséquence : la convention `coast-proximity-v2` (15 / 100 km) disparaît du dossier.

### D-2. Ce qu'est une « commune littorale » dans les textes

Un seul critère éditorial pour le tag `littoral` (accueil, questions de tension, humeur, signature, identité) :
**commune classée « Mer » au titre de la loi Littoral** (`loi_effective`). C'est officiel, communal, et c'est la
bonne maille pour des tensions comme la submersion ou l'érosion (Arles, Lacanau en sont). Aucun kilomètre inventé.

| Commune | Aujourd'hui (proxy ≤ 5 km) | Avec la loi Littoral |
|---|---|---|
| Lannion, Perros-Guirec, Morlaix | non littorale | littorale |
| Arles, Lacanau | non littorale | littorale |
| Caen | littorale | non littorale |
| Annecy (Lac), Rochefort (Estuaire) | non | non |

### D-3. Les libellés de position (« En bord de mer », « Proche du littoral »)

Passeport Territoire, raison de carte, paliers du Dossier comparatif. Recommandé : **mêmes seuils, vraie mesure**,
comme la v2 de la règle côtière : « En bord de mer » si le point de référence est à 2 km au plus du rivage marin,
« Proche du littoral » à 8 km au plus, rien au-delà (jamais « Loin de la mer » sur un score). Les paliers du Dossier
comparatif cessent de dériver des tranches du score et lisent ces mêmes définitions ; au-delà de 8 km, la
dimension dit la distance (« à 39 km du rivage marin »). Pas de nouveau seuil.

### D-4. Les façades (Atlantique, Manche, Méditerranée)

Aujourd'hui tirées du département ou de la région. Trois voies :
- **F1, recommandée** : façade officielle par commune littorale, depuis la planification maritime DGAMPA-Shom déjà
  étudiée en phase 1 (`facades_test.py`), injectée dans l'index comme les champs mer (`mer_facade`), par le même
  pipeline que la 2A, et testée de la même façon.
- F2 : retirer toute façade (plus de `littoral_atlantique` / `_mediterranee`, textes climat par grand type seulement).
- F3 : garder la région comme convention dite (« Côte bretonne » est vrai pour une commune littorale bretonne), mais
  plus jamais le département seul.

Recommandation : F1 pour `littoral_atlantique` / `_mediterranee` et `littoral.ts` ; F3 pour les noms de côte de la
signature (« Côte bretonne », « Côte d'Opale »), qui sont des noms d'usage, pas des façades.

### D-5. Les textes climat (`QuartierClimatData`)

Ils affirment une cause sans donnée (« le climat atlantique tempère encore les extrêmes », « sans l'amortisseur de
l'océan »). Recommandé : réécrire les quatre familles sans causalité maritime, en gardant ce qui est daté par DRIAS
(la progression), relu par l'Editorial Writer. Le type de territoire suit D-2 / D-4.

### D-6. Repli hors index (`deriveCategories`)

Une commune absente de l'index n'a aucune donnée littorale : plus de tag `littoral*` déduit du département.

### D-7. Formulations du dossier (validées)

« Cette adresse est à environ 24 km du rivage marin, plus près que les 30 km au moins que vous avez indiqués. » ;
« … à environ 42 km du rivage marin, au-delà des 30 km que vous avez indiqués. » ; « … à environ 12 km du rivage
marin, plus loin que les 10 km au plus que vous avez indiqués. » Distance arrondie au km.

### D-8. Retrait du legacy

Quand plus rien ne le lit : `distance_cote_km` sort de l'index, d'`IndexCommune`, de `metrics`, des faits et du
snapshot Territoire (les snapshots déjà figés gardent leur champ ; les nouveaux portent `mer_centre_km`).
