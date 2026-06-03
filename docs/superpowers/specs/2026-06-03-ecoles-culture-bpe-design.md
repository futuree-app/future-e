# Écoles & culture en critères BPE

Date : 2026-06-03
Statut : design validé, prêt pour plan d'implémentation
Roadmap : item #2

## Contexte

Aujourd'hui, « écoles » et « culture » sont des notions HORS-MESURE du comparateur :
le parse les route vers `horsMesure` (`comparateur-labels.ts` → `HORS_MESURE_PHRASES`),
avec une phrase honnête « pas encore un critère mesuré ». Constat QA externe (Cowork) :
ces attentes sont « avalées en silence » jusqu'à ce qu'une donnée publique les porte.

La BPE (Base Permanente des Équipements, INSEE) permet précisément de mesurer l'ACCÈS
(présence/proximité) à des équipements, sans rien dire de leur QUALITÉ. On en fait donc
deux vrais critères opt-in, calqués sur le pipeline `nature` (percentile national d'un
rayon autour du centroïde).

Doctrine cadre (non négociable) :
- accès / présence, JAMAIS la qualité (la qualité scolaire = biais social, exclue) ;
- ne jamais pénaliser un choix (rural) par défaut → critères OPT-IN, aucun plancher ;
- vocabulaire « accès à une offre culturelle », jamais « vie culturelle » ;
- le scoring ne passe jamais par l'IA ; l'IA ne fait que parser (amont) et synthétiser (aval).

## Décisions validées (porteur)

1. **Deux critères séparés** : `acces_ecoles` et `acces_culture`. Pas de critère combiné.
2. **Métrique** : accès par rayon (~15 km autour du centroïde), percentile national.
   Calque `populate-nature.py`. Brut conservé pour un futur rapport. Aucun appel runtime.
3. **Écoles** = collèges + lycées (général/techno + pro). Primaire EXCLU (quasi universel,
   peu discriminant).
4. **Culture** = bibliothèque/médiathèque + cinéma + théâtre/musée, ÉLARGI au spectacle
   vivant et à la pratique artistique s'ils existent dans la nomenclature BPE (salles de
   spectacle, salles de concert, scènes conventionnées, conservatoires, écoles de musique,
   équipements culturels comparables). On mesure l'ACCÈS à une offre, pas la vitalité.
5. **Opt-in strict** : aucun effet si l'utilisateur ne demande rien.
6. **Déduction famille → écoles uniquement, poids 1 max** :
   - mention explicite (écoles / collège / lycée / scolarité) → poids NORMAL ;
   - déduction depuis « famille avec enfants à scolariser » (sans le mot école) → poids 1 max,
     présentée comme la lecture du moteur, jamais comme la demande de l'utilisateur ;
   - JAMAIS de déduction pour culture.
7. **Gloses visibles obligatoires** (verbatim porteur) :
   - écoles : « Mesure l'accès aux collèges et lycées autour, pas la qualité des établissements. »
   - culture : « Mesure la présence d'équipements culturels accessibles autour, pas l'animation ni la qualité de l'offre. »
8. **Hors-mesure recadré, pas supprimé** (cf. section dédiée).

## Architecture

```
BPE INSEE géolocalisée (équipements + TYPEQU + coords, fichier local)
        │  scripts/populate-bpe.py  (calque populate-nature.py)
        │  pour chaque centroïde de l'index : compte/présence des équipements
        │  pertinents dans ~15 km → percentile national
        ▼
data/comparateur-index.json   (patch --write-index)
   commune.ecoles  = { score, brut, ... }
   commune.culture = { score, brut, ... }
        │  loadIndex() (inchangé)
        ▼
comparateur-vie.ts
   PREFERENCE_KEYS += acces_ecoles, acces_culture
   scoring : case "acces_ecoles" → c.ecoles?.score ?? null ; idem culture
   REASON_POS / REASON_NEG : libellés dédiés
        ▲
parse/route.ts
   "écoles/collège/lycée/scolarité" (accès) → préférence acces_ecoles
   "famille avec enfants à scolariser" (sans le mot) → acces_ecoles poids 1
   "cinéma/théâtre/musée/médiathèque/spectacle/conservatoire" → acces_culture
   "qualité/réputation/options scolaires" → horsMesure ecoles (recadré qualité)
   "ambiance/programmation/vie associative/sociabilité" → horsMesure culture (recadré vitalité)

comparateur-labels.ts
   PREFERENCE_LABELS + PREFERENCE_INTERPRETATIONS (gloses visibles)
   HORS_MESURE_PHRASES : ecoles/culture RECADRÉS (qualité/vitalité), affectif conservé
```

## 1. Données — `scripts/populate-bpe.py`

Nouveau script Python calqué sur `populate-nature.py` :
- lit les centroïdes (`lat`/`lon`) depuis `data/comparateur-index.json` ;
- lit la BPE géolocalisée (équipements avec coordonnées et code `TYPEQU`) ;
- pour chaque commune, compte/présence des équipements pertinents dans un rayon ~15 km
  (grille spatiale comme nature) ;
- normalise en **percentile national** → `score` 0-100 ; conserve un brut (comptage ou
  densité) pour un futur rapport ;
- `--write-index` patche `comparateur-index.json` : ajoute `ecoles` et `culture` par commune
  (forme `{ score, brut, ... }`, exactement comme `nature`).

Ensembles d'équipements (codes `TYPEQU` à CONFIRMER dans le plan contre la doc du millésime BPE) :
- **écoles** : collège, lycée général/technologique, lycée professionnel ;
- **culture** : bibliothèque/médiathèque, cinéma, théâtre, musée, + spectacle vivant /
  pratique artistique présents dans la nomenclature (salle de spectacle, salle de concert,
  scène conventionnée, conservatoire, école de musique).

### Points à vérifier dans le plan (porteur)

- codes `TYPEQU` exacts du millésime BPE retenu ;
- qualité des coordonnées (équipements sans géoloc à écarter ou rabattre sur le chef-lieu ?) ;
- risque de surpondération des communes touristiques pour théâtre/musée (contrôle témoins) ;
- effet de bord du rayon dur : un équipement juste hors rayon. Mitigations possibles :
  rayon un peu plus large, pondération décroissante avec la distance, ou comptage souple.
  V1 : rayon dur comme nature, documenter le choix ; affiner si les témoins le justifient.

## 2. Moteur — `comparateur-vie.ts`

- `PREFERENCE_KEYS` += `"acces_ecoles"`, `"acces_culture"`.
- Type `IndexCommune` : ajouter `ecoles?: { score: number; ... } | null` et
  `culture?: { score: number; ... } | null` (forme alignée sur `nature`).
- Scoring (fonction `score`, près de `case "nature"`) :
  - `case "acces_ecoles": return c.ecoles?.score ?? null;`
  - `case "acces_culture": return c.culture?.score ?? null;`
- `REASON_POS` :
  - `acces_ecoles: "collège et lycée accessibles à proximité"`
  - `acces_culture: "accès à une offre culturelle à proximité"`
- `REASON_NEG` :
  - `acces_ecoles: "établissements du secondaire plus éloignés"`
  - `acces_culture: "offre culturelle accessible plus limitée"`
- Opt-in : aucun plancher, aucune pénalité par défaut. Le rural non-demandeur n'est jamais
  pénalisé (la clé n'est tout simplement pas présente dans les préférences).

## 3. Parse — `parse/route.ts`

- Conserver `ecoles`, `culture`, `affectif` dans l'enum `horsMesure` mais RECADRER leur usage
  (voir section 4).
- Routage ACCÈS → préférence :
  - « écoles / école / collège / lycée / scolarité / scolariser » → `acces_ecoles` (poids normal) ;
  - « culture / cinéma / théâtre / musée / médiathèque / bibliothèque / spectacle / concert /
    conservatoire / sorties culturelles » → `acces_culture` (poids normal).
- Déduction famille → `acces_ecoles` poids 1 max, UNIQUEMENT si le projet exprime clairement
  une famille avec enfants à scolariser sans le mot « école ». Jamais pour culture.
- Garde-fou vocabulaire : reformulation en « accès à une offre culturelle », jamais « vie
  culturelle ».
- Mettre à jour les lignes HORS-MESURE du prompt en conséquence (l'accès n'est plus hors-mesure).

## 4. Hors-mesure RECADRÉ — `comparateur-labels.ts`

On ne supprime pas `ecoles`/`culture` du hors-mesure : on les recadre sur la facette NON
mesurée, pour ne jamais absorber en silence la qualité/vitalité.

- `acces_ecoles`/`acces_culture` mesurent l'ACCÈS. Restent hors-mesure et honnêtes :
  qualité des écoles, réputation, options scolaires (bilingue, latin…), ambiance culturelle,
  programmation, vie associative, sociabilité locale.
- `HORS_MESURE_PHRASES` recadrées :
  - `ecoles` : « La qualité, la réputation et les options des établissements ne sont pas
    mesurées par futur•e ; seul l'accès aux collèges et lycées l'est. »
  - `culture` : « L'animation culturelle, la programmation et la vie associative locale ne
    sont pas mesurées par futur•e ; seul l'accès aux équipements culturels l'est. »
  - `affectif` : conservée à l'identique.
- Le parse n'émet le `kind` hors-mesure que si l'intention de qualité/vitalité est exprimée
  (« bonnes écoles », « établissement réputé », « ville animée culturellement », « scène
  locale »…), distincte de l'intention d'accès.
- Un même projet peut donc produire À LA FOIS la préférence (accès, mesuré) ET le hors-mesure
  (qualité/vitalité, honnête). C'est voulu.

## 5. Glose visible — `comparateur-labels.ts`

`PREFERENCE_INTERPRETATIONS` (glose affichée au gate) pour les deux clés, verbatim porteur :
- `acces_ecoles` : « Mesure l'accès aux collèges et lycées autour, pas la qualité des établissements. »
- `acces_culture` : « Mesure la présence d'équipements culturels accessibles autour, pas l'animation ni la qualité de l'offre. »

Ces gloses sont obligatoires (contiennent un caveat méthodo assumé) : elles évitent le
contresens « critère présent = bonnes écoles / vie culturelle riche ».

`PREFERENCE_LABELS` :
- `acces_ecoles` : « l'accès aux collèges et lycées »
- `acces_culture` : « l'accès à une offre culturelle »

## 6. Vérification (pas de runner de test, cf. AGENTS.md)

1. `npx tsc --noEmit` + `npm run lint` (fichiers touchés propres).
2. Exécuter `populate-bpe.py` sur un échantillon (quelques départements) puis en national.
3. Contrôle du percentile sur communes témoins :
   - une métropole (accès écoles ET culture élevés) ;
   - une sous-préfecture moyenne (intermédiaire) ;
   - un village proche d'un pôle (accès correct grâce au rayon) ;
   - un village vraiment isolé (accès faible, NON pénalisé si non demandé) ;
   - une petite commune touristique (vérifier la surpondération culture).
4. `curl` sur `/parse` :
   - « je cherche un coin pour ma famille, avec enfants à scolariser » → `acces_ecoles`
     poids faible, pas de mention explicite ;
   - « proche d'un bon lycée » → `acces_ecoles` poids normal + horsMesure ecoles (qualité) ;
   - « j'aime le cinéma, les musées, une médiathèque » → `acces_culture` ;
   - « une ville avec une vraie vie culturelle, des assos, une scène locale » → `acces_culture`
     (accès) + horsMesure culture (vitalité).
5. `curl` sur `/match` : vérifier que le rural non-demandeur n'est pas pénalisé, et que les
   reasons/gloses s'affichent correctement.

## Hors périmètre

- Qualité/réputation des écoles, vitalité culturelle réelle (programmation, festivals,
  associations) : non mesurables, restent hors-mesure honnêtes.
- Temps d'accès routier (distancier) : sur-ingénierie pour la V1.
- Module rapport écoles/culture (cartes, drawer) : plus tard ; on conserve le brut pour ça.
- Primaire/maternelle : exclus (peu discriminants).
- Mobilité (roadmap #3) et palette distinctive étendue (roadmap #6) : chantiers distincts.
