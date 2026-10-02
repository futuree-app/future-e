# FUT-33, phase 2B.2 D : ce que futur•e raconte de la mer (clôture)

Date : 02/10/2026. Base : `d986023f` (plan validé). Décisions : `docs/audits/2026-10-02-fut33-phase2b2d-plan.md`,
amendées par la relecture du 02/10 (A2, loi Littoral, distance plutôt que « En bord de mer », façade source).

## Ce qui change

| Surface | Avant | Maintenant |
|---|---|---|
| Préférence « la mer compte » au dossier | « dans ce que vous recherchez » si ≤ 15 km, écart si ≥ 100 km (convention calibrée sur l'ancien proxy) | examinée, aucun verdict ni carte, à toute distance (appréciation : « indéterminé ») ; confirmée en condition, la carte « à confirmer » dit la mesure, signal neutre. `coast-facts.ts` supprimé |
| « Il nous faut la mer », sans distance, confirmée | signal favorable / défavorable selon 15 / 100 km | signal neutre, la mesure dite |
| Phrases `nearSea` / `farFromSea` | « en deçà des 30 km au moins qu'indique votre projet » | « Cette adresse est à environ 24 km du rivage marin, plus près que les 30 km au moins que vous avez indiqués. » ; « … au-delà des 30 km que vous avez indiqués. » ; « … plus loin que les 10 km au plus … ». Au kilomètre au-delà de 10 km, au dixième en deçà |
| Tag `littoral` (accueil, questions de tension, humeur, signature) | ancienne distance ≤ 5 km | commune classée « Mer » (loi Littoral) : un angle de texte, jamais une preuve de risque |
| `littoral_atlantique` / `littoral_mediterranee` | département | façade officielle (`mer_facade`), traduite par `facade-editoriale-v1` : NAMO et SA → atlantique, MED → méditerranée, MEMN → aucune orientation |
| Repli hors index (`deriveCategories`) | littoral deviné par département | aucun littoral |
| Typologie Territoire (`place.typology`) | département, libellé « Littoral atlantique » | commune (loi Littoral), libellé « Littoral » ; la page relit le libellé figé dans le snapshot |
| Carte d'identité (passeport) | « En bord de mer » ≤ 2 km, « Proche du littoral » ≤ 8 km (ancien proxy) | « Rivage marin à 1,6 km » jusqu'à 8 km (repère de rendu), rien au-delà |
| Raison de carte de la recherche | « en bord de mer », « à deux pas du littoral », « à proximité du littoral » | « rivage marin à 0,7 km » |
| Dossier comparatif, dimension « Mer » | « En bord de mer / Proche du littoral / Loin de la mer » tirés des tranches du score (jusqu'à 51 km) | « Rivage marin · 0,7 km », « Rivage marin · 39 km » ; le score ne dit plus que qui est le plus près |
| Signature « Côte bretonne », « Côte méditerranéenne » | ancienne distance ≤ 15 km + région | commune littorale + nom d'usage de la région |
| Signature « Climat maritime » | déduite de la côte | supprimée (la facette climat vient des données climatiques) |
| Promesses « les pieds près de l'eau », « au bord de l'eau » | ancienne distance ≤ 15 km | commune littorale ET point de référence à 8 km au plus (Arles : littorale, centre à 13 km : aucune promesse) |
| Textes climat du Territoire | « le climat atlantique tempère encore les extrêmes », « sans l'amortisseur de l'océan », « loin de la mer » | aucune cause maritime ; la progression seule |
| Érosion (`littoral.ts`) | façade devinée par département à défaut de la liste officielle | façade de la liste officielle, ou aucune (« Littoral ») |
| Index | `distance_cote_km` | retiré (34 788 communes) ; `mer_facade` ajouté (855 communes classées « Mer » : NAMO 293, MED 231, MEMN 229, SA 102 ; 4 ambiguës du Marais poitevin, listées dans la provenance) |
| Construction de l'index | calcul du proxy (`COAST_ANCHORS`) | supprimé ; la vérité vient de `data/mer` |

## Façades : valeur source puis traduction

`scripts/mer/facades_communes.py` : pour chaque commune classée « Mer », point de référence → point de rivage marin
le plus proche → emprise de façade la plus proche (« Planification maritime », DGAMPA-Shom 2026, Licence Ouverte
2.0, citée dans `meta.mer.facade`). Contrôles : Brest NAMO, Saint-Malo NAMO, Lannion NAMO, Les Sables NAMO,
La Rochelle SA, Biarritz SA, Dunkerque / Calais / Dieppe MEMN, Marseille / Ajaccio / Narbonne / Arles MED,
Caen et Annecy sans façade.

## Projets et dossiers existants

Audit en lecture seule (porteur, 02/10) : 5 projets, aucun critère mer en contrainte, 1 préférence « proximité de la
mer » ; 48 dossiers figés sans contrainte mer. Rien à migrer. Les dossiers figés gardent leur texte (`engine-1/2`).

## Vérifications

- `src/lib/fut33-editorial-2b2d.test.ts` (7) : catégories et façades sur l'index réel (Lannion, La Rochelle, Arles,
  Dunkerque, Caen, Annecy, Rochefort), repli sans littoral, typologie, promesses, distance affichée partout, textes
  climat sans cause maritime, et plus AUCUN reliquat dans `src/` (ancien proxy, tables départementales de façade,
  libellés de palier) ni dans l'index et son script de construction.
- Tests existants réécrits : règle mer (neutre à toute distance), bout en bout côtier, FUT-7 (la taille de ville
  illustre désormais les signaux favorable / défavorable ; un test dédié vérifie que la mer reste neutre).
- Suite complète 1 959 / 1 959, typage propre, lint sans erreur ni avertissement sur les fichiers touchés.

## Ce qui reste hors FUT-33

- Une carte « mesure » neutre au dossier (A1), si le besoin se confirme.
- Une promotion de capacité (`nearSea` / `farFromSea` avec un nombre dit, à l'adresse) par décision FUT-7 / FUT-8.
- Les noms d'usage (« Côte bretonne ») restent tirés de la région, à dessein.
