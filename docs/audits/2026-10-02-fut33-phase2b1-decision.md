# FUT-33, phase 2B.1 : ce que la recherche CHOISIT avec la vérité littorale

Date : 02/10/2026. Base : `01f9e4c2` (phase 2A). Périmètre : uniquement ce qui décide dans « Où vivre » (filtres,
classement, contraintes de Recherche, dérivations d'ancre). Rien de ce qui est raconté n'est touché.
Comparaison chiffrée complète : `scripts/mer/fixtures/comparaison-2b1.json` (`node scripts/mer/comparer-2b1.mts`).

## 1. Cartographie des consommateurs (lecteurs de `distance_cote_km` et des tables côtières)

| Consommateur | Question réellement posée | Décision ou éditorial | Vérité cible | Phase |
|---|---|---|---|---|
| `scorePreference` « proximite_mer » (comparateur-vie) | à quelle distance de la mer vit-on dans cette commune ? | décision (classement) | `mer_centre_km` | **2B.1** |
| bonus d'exploration `near_sea_radius` | même question, rampe de classement | décision (classement) | `mer_centre_km` | **2B.1** |
| `evaluateNearSea` côté recherche | « à moins de N km de la mer » | décision (filtre dur) | `mer_centre_km <= N` | **2B.1** |
| `evaluateExcludeSea` côté recherche | « pas le littoral » | décision (filtre dur) | `loi_effective` contient Mer | **2B.1** |
| `deriveFromEntry` ancre → `proximite_mer` | la ville de référence est-elle littorale ? | décision (suggestion) | D5 : Mer ET centre ≤ 5 km | **2B.1** |
| `perimeterAllowsCoast` | le périmètre dur contient-il du littoral ? | décision (garde de l'ancre) | même règle D5 | **2B.1** |
| libellé « non appliqué » d'excludeSea | nommer la contrainte au lecteur | texte de la décision | « l'exclusion des communes littorales » | **2B.1** |
| `evaluateNearSea/ExcludeSea` côté dossier (`decision/*`, `module-facts-map`) | verdict du dossier | décision du dossier | adresse → rivage 5 m ; loi | 2B.2 / ticket dossier |
| `PRODUCT_CONVENTIONS.excludeSeaMinKm`, `conventions.ts` « au moins 15 km », `hard-constraint-rules.ts:217` | convention affichée au dossier | texte du dossier | D4 | 2B.2 (avec le dossier) |
| `decision/coast-rules.ts`, `condition-rules.ts`, `coast-facts.ts` | faits côtiers du dossier | dossier | adresse / loi | 2B.2 |
| catégories `littoral` / `littoral_mediterranee` (≤ 5 km + DEPT_MEDITERRANEE) | narratif climat, landing | éditorial | contact + façade (D6) | 2B.2 |
| `buildSignature` / bloc ligne 1026 (≤ 15 km) | traits distinctifs | éditorial | à définir | 2B.2 |
| paliers « En bord de mer / Proche du littoral » (ligne 2079), `territory-identity.ts` | identité Territoire | éditorial | contact / centre | 2B.2 |
| `territoire/facts.ts`, `territoire-snapshot.ts` | passeport Territoire | éditorial | à définir | 2B.2 |

## 2. Question → vérité

| Question | Ancienne vérité | Nouvelle vérité |
|---|---|---|
| « près de la mer » (préférence) | `distance_cote_km` (proxy faux) | `mer_centre_km`, courbe graduée |
| « à moins de N km de la mer » (recherche) | `distance_cote_km <= N` | `mer_centre_km <= N`, N tel quel |
| « pas le littoral » (recherche) | `distance_cote_km >= 15` | commune classée Mer (`loi_effective`) |
| ancre littorale | `distance_cote_km <= 15` (poids 3 si ≤ 5) | Mer ET `mer_centre_km <= 5`, poids 2 |

## 3. Changements implémentés

- `src/lib/mer-recherche.ts` (nouveau, pur) : `scoreProximiteMer`, `bonusMer`, `communeLittoraleMer`, `ancreLittorale`.
- `commune-attributes.ts` : la recherche transmet `merCentreKm` et `communeLittoraleMer`.
- `hard-constraints.ts` : `evaluateNearSea` / `evaluateExcludeSea` prennent ces champs quand ils sont fournis ;
  sinon (dossier, `decision/module-facts-map.ts`, non migré) l'ancien chemin est conservé tel quel.
- `comparateur-vie.ts` : préférence, bonus, ancre, périmètre ; `ANCRE_COAST_KM = 15` supprimé.
- `hard-constraints-filter.ts` : libellé de la contrainte non appliquée.

## 4. Préférence qualitative

Courbe conservée (linéaire, 100 au rivage, 0 à 150 km) : elle n'a pas de seuil historique, seulement une pente ; la
recopier sur la vraie mesure ne réintroduit rien d'arbitraire. Aucun rejet. Le centre, pas le territoire : Arles
(territoire 0, centre 13,4 km) obtient 91 et pas 100 ; Lacanau (8,5 km) 94 ; Carcans (11,9 km) 92.

## 5. Contraintes numériques (communes satisfaites sur 34 788)

| N | avant | après | entrants (plus peuplés) | sortants |
|---|---|---|---|---|
| 2 km | 36 | 546 | Dunkerque, Marseille 8e, Antibes, Ajaccio, Narbonne | Caen, Saint-Brieuc, Agde, Abbeville |
| 5 km | 156 | 1 132 | Marseille 8e/9e/15e, Antibes, La Seyne, Narbonne | Caen, Quimper, Abbeville, Hérouville |
| 10 km | 559 | 1 944 | Montpellier, Narbonne, Martigues, Aubagne, Istres | Quimper, Abbeville, Solliès-Pont, Ifs |
| 15 km | 1 082 | 2 673 | Montpellier, Aix, Béziers, Arles, Martigues | Cuers, Thue et Mue, Verson |
| 30 km | 3 289 | 4 539 | Nîmes, Pessac, La Roche-sur-Yon, Saintes | Brignoles, Flixecourt, Auxi-le-Château |

L'ancien proxy ratait l'essentiel des communes riveraines (36 à 2 km). Le nombre du lecteur s'applique au centre de
la commune. Un dossier n'est pas concerné : sa capacité reste « apprécier » (aucune promotion).

## 6. Hors communes littorales

Acceptées : 33 827 avant, 33 933 après. Basculent : Lannion, Perros-Guirec, Morlaix, Arles, Lacanau, Carcans
deviennent écartées (classées Mer) ; Caen devient acceptée (non classée). Inchangées : Annecy (Lac) et Rochefort
(Estuaire) acceptées, Bordeaux, Nantes, Montpellier acceptées, Marseille (héritage 13055), Brest, Narbonne, Vannes
écartées.

**Problème documenté, non corrigé en silence** : le parseur n'a qu'un champ (`excludeSea`, « ne veut PAS le
littoral ») ; une phrase « loin de la mer » peut y atterrir et sera désormais lue comme « hors communes littorales »,
ce qui n'est pas la même intention (D4). Séparer les deux chemins (un `farFromSea` numérique sans seuil inventé)
touche le parseur et le schéma : à trancher en 2B.2.

## 7. Ancres

| Ancre | avant | après |
|---|---|---|
| Brest, La Rochelle, Vannes | proximite_mer poids 3 | suggestion « proximité du littoral », poids 2 |
| Lannion | rien (proxy 58 km) | suggestion |
| Narbonne | poids 2 | suggestion (étang de Bages ; jamais « plage ») |
| Caen | poids 3 | rien (non classée Mer, centre 9,2 km) |
| Arles, Lacanau, Carcans, Bordeaux, Annecy | rien | rien |

National : 1 082 communes déclenchaient la dérivation, 810 désormais. Le poids passe à 2 partout : une suggestion
douce n'a pas à peser comme une préférence dite (3). La dérivation reste une suggestion de source « ancre » :
adoption, rejet durable et primauté du texte explicite (FUT-8) inchangés, aucune condition créée.

## 8. Cas limites

- `mer_centre_km` absent (fixture ancienne) : préférence `null`, bonus 0 ; filtres sur l'ancien chemin.
- `loi_effective` null : pas Mer (Bordeaux). Lac seul, Estuaire seul : pas Mer.
- Lacanau / Carcans / Parentis : Lac + Mer = Mer.

## 9. Tests

`src/lib/fut33-recherche-2b1.test.ts` (7) : distance (Lannion, Châtelaillon, Bordeaux, Caen), qualitatif sans
seuil, numérique 5 / 10 km sur `merCentreKm`, loi (Annecy, Rochefort, Arles, Marseille, Bordeaux), ancres, grain
et capacité (dossier non migré, capacité « apprécier » inchangée aux deux grains), legacy (blocs migrés sans
`distance_cote_km`). `fut33-mer-index.test.ts` : liste fermée des fichiers qui lisent les champs mer.

## 10. Legacy restant

Voir le tableau §1, lignes « 2B.2 ». `distance_cote_km` reste dans l'index tant que cette liste n'est pas vide.

## 11. Plan 2B.2

1. Dossier : `module-facts-map` transmet la loi ; `excludeSea` du dossier sur la loi, retrait d'`excludeSeaMinKm`
   et des textes « au moins 15 km » (conventions.ts, hard-constraint-rules.ts) ; nearSea du dossier reste
   « apprécier » jusqu'au calcul adresse (point → rivage 5 m), puis éventuelle promotion par ticket séparé.
2. Parseur : séparer « pas le littoral » de « loin de la mer ».
3. Éditorial : identité Territoire (paliers), traits distinctifs (`buildSignature`), catégories `littoral*`,
   faits Territoire, textes climat ; façades (D6) avec la planification maritime, jamais les départements.
4. Puis retrait de `distance_cote_km`.
