# FUT-138 · Prix immobiliers : données corrigées et présence dans futur•e (02/11/2026)

Mesures brutes : `docs/audits/2026-11-02-fut138-effets-prix.json` (`scripts/fut138/mesurer-effets.mjs`).

## 1. Sources réellement utilisées

| | Source | Millésime | Grain |
|---|---|---|---|
| Achat | DVF (DGFiP), version géolocalisée Etalab, **livraison du 20/10/2026** (`static.data.gouv.fr/.../20261020-*`) | ventes **2022, 2023, 2024, 2025** (années civiles complètes) | commune actuelle ; sinon ville entière (arrondissement PLM) ; sinon EPCI |
| Location | Carte des loyers 2025 (ANIL), inchangée | annonces 2019-2025, biens mis en location au T3 2025 | commune (drapeau « estimée » si imputée) |

Les quatre fichiers DVF, la Carte des loyers et le COG 2026 sont **épinglés par empreinte SHA-256** dans `scripts/lib/logement-index.mjs` : un fichier d'une autre livraison est refusé, jamais mélangé en silence. Le premier semestre 2026 (`full-2026-s1`) n'est pas utilisé : la fenêtre reste quatre années civiles complètes, comme avant.

**Format du 20/10/2026.** Etalab replace désormais chaque vente dans la commune ACTUELLE par les coordonnées de sa parcelle (COG 2026) et met l'ancien code dans `ancien_code_commune`. Le COG 2026 et le COG 2025 de l'index ont **exactement les mêmes 34 875 communes** (aucun mouvement territorial au 01/01/2026, seulement des changements de nom) ; le script le vérifie et refuse sinon.

## 2. Corrections

1. **Rattachement géographique.** Code actuel de la livraison ; une vente sans coordonnées sous un code disparu suit les fusions du COG (`resolveurCog`, la règle unique du dépôt) ; sous le code d'une commune découpée APRÈS la vente (rétablissement), une vente non géocodée n'est attribuée à personne (3 ventes). Les ventes des DROM (36 965) sont hors index (métropole).
2. **Filtre multilots conservé, faux positifs corrigés.** `ef77afdd` écartait toute vente à plusieurs lignes « Maison/Appartement ». Or DVF **répète la ligne d'un même local pour chaque nature de culture** de sa parcelle (« sols » + « jardin ») : sur 2024, 67 334 des 115 266 ventes écartées étaient une seule maison. Désormais : même type, surface, parcelle, pièces et lots + cultures différentes ou même lot = un seul local ; lignes identiques sans lot = indiscernables, toujours écartées (46 557 ventes) ; vrais lots de plusieurs logements écartés (177 923).
3. **Arrondissements de Paris, Lyon, Marseille.** Le repli des maisons allait à l'EPCI : Paris 11e affichait la Métropole du Grand Paris (4 940 €/m²). Il va maintenant à la ville entière (Paris 12 557 €/m², 462 ventes), puis seulement à l'EPCI. Les prix « ville entière » (75056, 69123, 13055) sont calculés sur toutes les ventes, jamais en moyenne de médianes.
4. **Reproductibilité.** `node scripts/populate-logement.mjs --verifier` recalcule sans écrire : 0 commune différente, provenance identique (code de sortie 0).

## 3. Effets mesurés séparément (34 788 communes)

Rejeu de l'algorithme d'avant `ef77afdd` sur les caches d'avril 2026 : **0 écart avec `main`**. L'origine des 33 099 écarts du diagnostic est donc prouvée.

| Étape | Communes dont l'achat change | Écart médian (maisons / appart.) | Mailles |
|---|---|---|---|
| Filtre multilots `ef77afdd` tel quel | 33 082 | −3,0 % / −7,2 % | maisons commune→EPCI 3 468 ; appart. EPCI→aucune 3 374 |
| Lignes répétées d'un même local (FUT-138) | 30 742 | +2,2 % / 0 % | maisons EPCI→commune 2 861 |
| Livraison 20/10/2026, ventes 2022-2025 | 32 983 | +2,1 % / +3,1 % | maisons commune→EPCI 1 243, EPCI→commune 551 |
| Commune actuelle (fusions, rétablissements) | 708 | ciblé | 2 + 2 EPCI→commune |
| Repli ville des arrondissements | 15 | ciblé | maisons EPCI→ville 15 |
| **Total vs `main`** | **33 159** | +1,3 % / −4,4 % | maisons commune→EPCI 1 668, EPCI→commune 371 ; appart. EPCI→aucune 3 433 |

Couverture : 33 196 communes avec un prix d'achat avant et après (0 perte). Les 3 433 communes qui perdent un prix d'**appartement** l'avaient seulement par leur EPCI, calculé avec des ventes d'immeubles entiers : sans elles, l'EPCI a moins de 10 ventes d'un seul appartement en quatre ans. Le prix des maisons y reste publié.

## 4. Cas tests (index régénéré)

| Commune | `main` (appart. / maisons) | FUT-138 | Ce qui a changé |
|---|---|---|---|
| La Rochelle | 5 000 / 4 472 commune | 5 000 (3 707 ventes) / 4 507 (2 033) commune | millésimes ; filtre |
| Bazeilles (fusion 2024) | 2 706 / 1 429 commune | 1 100 EPCI / 1 568 commune (84) | La Moncelle comptée ; le « 2 706 » venait de ventes multilots |
| Orée d'Anjou (code 49126) | 1 745 / 1 758 EPCI | 1 591 EPCI / 2 182 **commune** (633) | ventes enfin sous son code actuel |
| Saint-Denis (fusion 2025) | 4 274 / 4 464 | 3 971 / 3 730 commune | Pierrefitte comptée (−3,4 % / −2,9 % pour la seule géographie) |
| L'Oie (rétablie 2024) | 2 068 / 1 880 EPCI | 1 764 EPCI / 1 735 **commune** (42) | ventes 2022-2023 replacées par la parcelle |
| Essarts-en-Bocage | 2 361 / 1 995 commune | 1 764 EPCI / 2 093 commune | ventes de L'Oie et Sainte-Florence retirées |
| Strasbourg, Metz | non disponible | non disponible, motif « hors DVF » (livre foncier) ; loyers 15,6 / 13,4 €/m² | raison nommée |
| Paris 11e | 10 556 / 5 063 EPCI | 10 237 / 12 557 **ville de Paris** | repli ville |

## 5. Présence dans le produit (une source : `src/lib/prix-immobiliers.ts`)

- **Territoire** : carte « Prix immobiliers » (prix médian du type dominant, volet avec appartements, maisons, loyers, maille, effectifs, limites, méthode).
- **Où vivre** et **comparateur** : une ligne factuelle par carte, posée après le classement (ventes 2022-2025 DVF, loyers ANIL). Aucun score, aucun tri, aucune sélection ne lit les prix (les gardes FUT-147 rejouent communes, scores et ordres à l'identique). Un budget tapé dans Où vivre ne reçoit plus « futur•e ne mesure pas ce sujet ».
- **Réponses du comparateur** : la route relit les prix dans l'index à partir du code INSEE (aucun chiffre venu du navigateur) ; la question de prix n'est plus renvoyée hors sujet.
- **AskFuture** : bloc « Prix immobiliers » dans le prompt, consignes (médiane, pas d'estimation d'un bien, pas de prix futur).
- **Dossier Logement** : section « Le marché immobilier de la commune », qui dit ne pas donner la valeur du logement.
- **Accueil** : la réponse à « Mon logement va-t-il perdre de la valeur ? » cite ce que le rapport montre, sans prédiction.
- Trait distinctif du comparateur : « le marché immobilier le plus accessible » devient « les prix de vente les plus bas » (fait, pas abordabilité).

Recette conversationnelle réelle (Sonnet 4.6, prompt exact d'AskFuture, 02/11) : « Quel est le prix moyen au m² ici ? » → médianes, période, échelle et source pour La Rochelle, L'Oie (EPCI nommée) et Strasbourg (absence expliquée) ; « Combien vaut une maison de 100 m² au 12 rue des Merciers ? » → refus d'estimer, médiane communale donnée comme ordre de grandeur.

## 6. Restant

- Le seuil de 10 ventes (inchangé) fait passer 1 668 communes de la commune à l'EPCI pour les maisons : à rediscuter si le porteur le souhaite, non modifié ici.
- Aucune ligne « prix » dans la matrice du Dossier comparatif payant (elle exige une dimension du moteur) : évolution distincte.
- Les synthèses rédigées (Territoire, Logement, comparateur) ne citent pas de chiffres de prix : aucune contradiction possible, pas d'ajout.
