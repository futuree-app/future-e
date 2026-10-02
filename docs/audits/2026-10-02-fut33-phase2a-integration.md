# FUT-33, phase 2A : la vérité littorale entre dans l'index (sans aucun changement de comportement)

Date : 02/10/2026. Suite de la phase 1.5 (`dd861ce4`).

## Ce qui est fait

- `data/mer/mer-communes.json` (1,3 Mo) : pour chaque commune de l'index, `mer_centre_km`, `mer_territoire_km`,
  `loi_littoral`, `loi_effective`, `loi_source_commune` (10 m près). Publié par `scripts/mer/publier_mer.py`.
- `data/mer/rivage-5m.f32.gz` (2,3 Mo) : rivage marin simplifié à 5 m, pour le futur calcul à l'adresse.
- `data/mer/provenance.json` : sources, millésimes, méthode (`mer-v2`), attribution, limites, compteurs.
- `data/comparateur-index.json.gz` : les cinq champs ajoutés à chaque commune et `meta.mer`, par
  `scripts/mer/injecter-index.mjs`, qui prouve que tous les champs existants sont identiques octet pour octet.
  `scripts/build-comparateur-index.mjs` passe par la même fonction (`scripts/lib/mer-index.mjs`) pour les
  prochaines reconstructions.
- `IndexCommune` déclare les champs ; **aucun consommateur ne les lit** (test dédié).
- `distance_cote_km` est inchangé et marqué « ancien proxy, ne pas utiliser pour du neuf ».

## Décisions figées (porteur et revue, 02/10/2026)

| # | Décision |
|---|---|
| D2 | Rivage canonique = LimTM coupée aux LTM, lagunes et bassins compris, sans convention morphologique. La donnée ne se traduit jamais en « plage », « océan », « ville balnéaire » (Narbonne : 1,6 km du rivage marin par l'étang de Bages). |
| D9 | Géométrie adresse simplifiée à **5 m** (2,3 Mo, erreur au plus 5 m, p95 0,45 ms). |
| D10 | **Aucun seuil universel.** Un nombre dit par le lecteur est appliqué tel quel ; « près de la mer » reste une préférence qualitative, ordonnée par la distance, sans verdict dur silencieux ; une condition passe par une définition acceptée (FUT-8). Les distributions servent à comprendre les conventions, pas à en choisir une. |
| D4 | L'ancien seuil implicite de 15 km disparaît. « Pas dans une commune littorale » : convention transparente « commune classée Mer (loi Littoral) », tranchable si le lecteur l'accepte. « Loin de la mer » : un nombre ou une définition acceptée. Dans « Où vivre », filtre visible et supprimable « Hors communes littorales · classement loi Littoral ». |
| D5 | « Mer et centre ≤ 5 km » utilisable comme **signal d'ancre souple** (« Inspiré de Brest : proximité du littoral »), jamais comme vérité générale de « au bord de la mer », ni préférence adoptée, ni condition. |
| Licence | Décision du porteur : la mention « Limite terre-mer © Shom-IGN, 2021, http://dx.doi.org/10.17183/LIMTM » suffit ; pas de logos. Risque connu : le descriptif Shom les dit obligatoires pour une « représentation sur site internet ». |

## Phase 2B (prochaine)

Pour chaque consommateur de `distance_cote_km` et des tables départementales (cartographie : audit phase 0, §3) :
quelle question pose-t-il réellement (centre, territoire, loi, adresse) → le remplacer → tester le texte rendu.
`nearSea`, `excludeSea`, ancres, traits distinctifs, identité Territoire, catégories, textes climat.
