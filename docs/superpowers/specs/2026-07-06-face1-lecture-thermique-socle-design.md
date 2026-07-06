# Spec — Face 1 Logement : socle « niveaux de preuve et lecture thermique »

**Date** : 2026-07-06 · **Module** : Logement, Face 1 « dedans » · **Statut** : design validé, prêt pour plan d'implémentation.

## Contexte et pourquoi

Audit du 2026-07-03 (`docs/audits/2026-07-03-dpe-confort-ete-couverture.md`) : le dataset plat `dpe03existant` que futur•e interroge déjà contient un bloc « confort d'été » exploitable (`indicateur_confort_ete`, `logement_traversant`, `protection_solaire_exterieure`, `type_ventilation`, `classe_inertie_batiment`, `isolation_toiture`, `presence_brasseur_air`, `qualite_isolation_*`). Mais sa disponibilité est **conditionnelle** :

- **~20 %** des adresses (chemin BAN réel) atteignent une lecture riche du logement (DPE individuel attribué à l'id BAN exact, bloc confort présent) ;
- **~34 %** n'ont qu'un DPE bâtimental (immeuble-généré) ou un DPE à proximité non certain ;
- **~44 %** n'ont aucun DPE attribuable à l'id exact.

Conséquence tranchée avec le porteur : le DPE n'est **pas** le socle central de la Face 1, c'est un **enrichissement conditionnel à dégradation propre**. La Face doit rester utile et valorisante dans tous les cas, en sachant exactement ce qu'elle connaît, d'où, et jusqu'où elle peut parler.

Ce spec couvre **le socle** : la lecture thermique en **lecture pure**, sur le pipeline d'attribution par **id BAN exact** existant. Il ne construit aucune écriture.

## Périmètre

**Dans le socle :**
- Une `ReportSection` « Faire face à la chaleur » dans la Face 1, après le Passeport du logement.
- Trois états de preuve : **A** (lecture riche du logement), **B1** (lecture du bâtiment), **C** (non qualifiable).
- Extension de la **lecture** DPE (nouveaux champs au `select` ADEME).
- Lib pure `thermal-evidence` (dérivation déterministe du niveau + facteurs + wording).
- Composant de rendu (ossature asymétrique + tiroir).
- Alimentation de la synthèse Logement, sous le verrou « DPE confirmé » existant.

**Hors socle → spec B « résolution, actualisation et vécu » :**
- `B2_NEARBY_UNCONFIRMED` et le repli `getDpeByCoordinates` (attribution par proximité).
- Toute action d'écriture / confirmation : `[Vérifier ou corriger]`, `[Décrire ce logement]`, question de vécu, persistance.
- Les deux confirmations distinctes : **actualité** (état A, « Toujours d'actualité ? ») et **identité** (état B2, « Est-ce le bon bâtiment ? »). Jamais fusionnées dans un composant générique.

**Règle de découpage gravée :** le socle affiche uniquement les données attribuées **avec certitude** à l'adresse, en distinguant logement et bâtiment. La spec B traite toute opération nécessitant une confirmation, une correction ou une attribution par proximité. Le socle ne rend **aucun contrôle actif** ; il réserve la place narrative de l'actualisation par un simple **statut**.

## Modèle d'état (contrat)

```ts
type ThermalEvidenceLevel =
  | "A_EXACT_UNIT"          // attribution exacte, méthode individuelle, bloc confort présent
  | "B1_EXACT_BUILDING"     // attribution exacte, lecture bâtimentale (voir règle)
  | "B2_NEARBY_UNCONFIRMED" // RÉSERVÉ spec B — le socle ne le produit jamais
  | "C_NO_DATA";            // aucun DPE résidentiel attribué à l'id exact

type ConfirmationState =
  | "NOT_AVAILABLE_YET"     // seul état produit par le socle (aucun contrôle actif)
  | "UNCONFIRMED" | "CONFIRMED" | "CORRECTED"; // RÉSERVÉS spec B
```

### Règle de dérivation du niveau (déterministe, ordonnée)

Le niveau est fonction de **(méthode du DPE × niveau d'attribution × champs disponibles)** — pas d'un champ unique. La **méthode prime sur la simple présence du champ** (doctrine : jamais présenter le DPE bâtiment comme propre au logement).

Entrées : `methode_application_dpe` (individuelle / immeuble-généré / autre), certitude d'attribution (socle = id BAN exact ⇒ certaine ; proximité ⇒ B2, hors socle), présence du bloc confort (`indicateur_confort_ete` renseigné).

Ordre d'évaluation, sur le DPE **attribué** (`auto_confirmed` / `user_confirmed`) :
1. Aucun DPE résidentiel attribué → **C_NO_DATA**.
2. Méthode **immeuble-généré** (quel que soit le contenu) → **B1_EXACT_BUILDING**, wording « caractéristiques de l'immeuble ».
3. Bloc confort **absent** (DPE individuel non renseigné) → **B1_EXACT_BUILDING**, wording « le diagnostic ne renseigne pas le confort d'été de ce logement » (JAMAIS « immeuble » : c'est faux).
4. Sinon (méthode individuelle **et** bloc confort présent) → **A_EXACT_UNIT**.

Cas limite couvert : un DPE immeuble-généré portant quand même le bloc confort ⇒ **B1** (règle 2 prime), car le confort y décrit la convention de l'immeuble, pas ce lot précis.

## Anatomie de la section (ossature asymétrique, constante ; profondeur variable)

Cinq temps ; trois **visibles en face** (la valeur), deux **dans le tiroir**. Le beat **climat futur** est présent dans les trois états (il ne dépend que de la commune), avec un texte adapté au niveau de preuve.

### Visible en face
1. **Conclusion + preuves** (varie par état).
2. **À confirmer** (état A uniquement, en **statut**, pas de bouton).
3. **Dans le climat futur** (les trois états, texte adapté, même place + même lien).

### Dans le tiroir « Comprendre cette lecture » (A et B1, fermé par défaut, un seul accordéon, deux sous-titres)
4. **D'où vient cette lecture ?** — diagnostic attribué au logement ou au bâtiment, date, méthode d'application, champs utilisés, source ADEME. En A : préciser que `bon/moyen/insuffisant` est l'indicateur **du DPE**, pas une catégorie calculée par futur•e. En B1 : préciser quels champs sont hérités du diagnostic immeuble.
5. **Ce qu'elle ne permet pas de conclure** — aucune température intérieure mesurée ; aucun contrôle de l'état actuel des équipements ; aucune prédiction du confort en 2030/2050/2100 ; aucune prise en compte du comportement réel des occupants.

## Contenu par état

### État A — lecture riche du logement

**Attaque par la donnée officielle** (le jugement est attribué au DPE, jamais à futur•e), texte **dynamique** selon `indicateur_confort_ete` :
- `bon` : « Le DPE classe l'indicateur réglementaire de confort d'été de ce logement comme **bon**. »
- `moyen` : « Le DPE classe l'indicateur réglementaire de confort d'été de ce logement comme **moyen**. »
- `insuffisant` : « Le DPE signale une capacité limitée à préserver le confort d'été dans ses conditions conventionnelles d'évaluation. »

Puis : « Plusieurs caractéristiques renseignées contribuent à cette évaluation. »

**Chips descriptives** (positives OU négatives, issues de la source, **max 4** ; le reste au tiroir). Exemples : `Logement traversant` / `Logement non traversant`, `Protections solaires renseignées`, `Inertie lourde` / `Inertie légère`, `VMC simple flux` / `Ventilation naturelle`. Jamais d'appréciation futur•e (`Très protecteur`, `Résilient`).

**À confirmer** (statut neutre, aucun bouton dans le socle) :
> Ces caractéristiques proviennent du DPE établi en {année}. Elles peuvent avoir changé depuis.

**Dans le climat futur** (texte individualisé) :
> Avec la progression des nuits chaudes à {commune}, les caractéristiques décrites ci-dessus, notamment {protections solaires / renouvellement d'air / …}, prendront davantage d'importance.
> › Voir la trajectoire climatique de {commune}

### État B1 — ce que le diagnostic décrit du bâtiment

**Titre** : « Ce que le diagnostic décrit du bâtiment ».

**Chips** (max 4, modalités ADEME exactes) : inertie, ventilation, isolation des murs, isolation des menuiseries (`Double vitrage` / `Isolation des menuiseries : moyenne`, jamais « correctes »). **`DPE : D` retiré** du bloc chaleur (la classe globale parle de consommation/émissions, hors sujet confort d'été).

**Limite visible**, wording selon la règle :
- méthode immeuble-généré : « Ce diagnostic reprend principalement des caractéristiques de l'immeuble. Elles ne permettent pas de qualifier précisément le confort d'été de cet appartement. »
- individuel sans bloc : « Ce diagnostic ne renseigne pas le confort d'été de ce logement. »

**Dans le climat futur** (grain bâtiment) :
> Avec la progression des nuits chaudes à {commune}, les caractéristiques thermiques du bâtiment compteront davantage. La capacité propre de cet appartement à évacuer la chaleur reste à documenter.
> › Voir la trajectoire climatique de {commune}

Pas de beat « À confirmer » (rien d'individuel à actualiser dans le socle).

### État C — non qualifiable, cadre noble

**Ligne principale** (couvre tous les sous-cas : aucun DPE / DPE aux champs manquants / non attribuable / bâtimental seul) :
> Les données publiques retrouvées ne permettent pas de qualifier le confort d'été de ce logement.

**Ce qui permettrait d'avancer** :
> La position sous toiture, les protections solaires et la capacité du logement à se rafraîchir la nuit permettraient d'affiner cette lecture.

Pas de CTA tant que l'intake n'existe pas. **Micro-info repliée** « Pourquoi cette information manque-t-elle ? » (2 phrases : aucun DPE attribuable ou suffisamment renseigné n'a été retrouvé), pour éviter l'interprétation « panne ».

**Dans le climat futur** :
> Avec la progression des nuits chaudes à {commune}, la capacité du logement à limiter puis évacuer la chaleur deviendra plus importante. Les données retrouvées ne permettent pas encore de la qualifier.
> › Voir la trajectoire climatique de {commune}

## Architecture technique

### Lecture DPE étendue — `src/lib/dpe.ts`
Ajouter à `SELECT_LOGEMENT`, `ApiRecord`, `DpeRecord`, `toRecord` : `indicateur_confort_ete`, `logement_traversant`, `protection_solaire_exterieure`, `type_ventilation`, `classe_inertie_batiment`, `inertie_lourde`, `isolation_toiture`, `presence_brasseur_air`, `qualite_isolation_murs`, `qualite_isolation_menuiseries`, `methode_application_dpe`. Lecture pure — pas d'écriture, légitime au socle. Le legacy (`toRecordLegacy`) laisse ces champs à `null`.

### Lib pure — `src/lib/thermal-evidence.ts`
Sans `server-only` (comme `dpe-attribution.ts`, car appelée aussi côté client). Export :
```ts
type ThermalFactor = { key: string; label: string; polarity: "favorable" | "defavorable" | "neutre" };
type ThermalEvidence = {
  level: ThermalEvidenceLevel;
  indicator: "bon" | "moyen" | "insuffisant" | null;   // indicateur_confort_ete, A seulement
  methodWording: "immeuble" | "individuel_sans_bloc" | null; // pilote le wording B1
  factors: ThermalFactor[];        // chips face, cappées à 4 par le composant
  drawerFields: ThermalFactor[];   // reste des champs, pour le tiroir
};
function deriveThermalEvidence(dpe: DpeRecord | null): ThermalEvidence;
```
Y vivent : la règle de dérivation ordonnée, le mapping des modalités ADEME (ventilation, inertie, menuiseries → libellés lisibles), la polarité des facteurs, la sélection des ≤4 chips prioritaires. Fonction **pure et testée**.

### Composant — `src/components/report/ThermalComfortSection.tsx`
Rend l'ossature asymétrique + tiroir, piloté par `level` et `indicator`. Entrées : `ThermalEvidence`, `communeName`, lien trajectoire Territoire, `dpeYear`. Aucun état interne d'écriture. Réutilise `ReportSection` / `GlassCard` et le pattern de tiroir des cartes climat.

### Intégration — `src/components/report/LogementModule.tsx`
Insère la section après le Passeport, alimentée par le **DPE attribué uniquement** (`dpeStatus ∈ {auto_confirmed, user_confirmed}` ⇒ `deriveThermalEvidence(selectedDpe)`) ; sinon `C_NO_DATA`. Réutilise la machine `dpeStatus` existante, aucun nouvel état.

### Synthèse — `src/app/api/synthesize-logement`
`thermal-evidence` alimente le prompt en **texte descriptif attribué au DPE**, sous le **même verrou** que l'existant (DPE confirmé seulement). Le prompt ne doit jamais transformer l'indicateur en verdict de vécu ni prédire une température.

### Climat futur
Phrase qualitative + lien vers la trajectoire Territoire de la commune. **Aucun chiffre DRIAS répété** (croisement, pas duplication). Icône discrète ou aucune ; **pas d'éclair**.

## Doctrine (garde-fous non négociables)
- Aucun score futur•e, aucun verdict global calculé (ADR-0001).
- Aucune température intérieure prédite ; aucun horizon 2030/2050/2100 chiffré dans la section.
- L'indicateur `bon/moyen/insuffisant` est **toujours attribué au DPE** (« réglementaire »), jamais à futur•e.
- Un DPE bâtiment n'est **jamais** présenté comme propre au logement.
- Chips descriptives issues de la source, positives ou négatives, jamais une appréciation.
- Aucun état vide dévalorisant ; aucun bouton sans action réelle.
- Étage / position sous toiture : **pas** une donnée publique fiable (audit : `numero_etage_appartement` 85 % = `0`, `nombre_niveau_immeuble` 9 %) ⇒ ne jamais déduire automatiquement ; devient une question utilisateur en spec B.

## Tests
Lib pure `thermal-evidence` en `node --test --experimental-strip-types` (comme `dpe-attribution.test.ts`) :
- A avec `bon` / `moyen` / `insuffisant` ; facteurs négatifs présents dans les chips.
- B1 immeuble-généré (wording « immeuble ») vs B1 individuel-sans-bloc (wording « ne renseigne pas »).
- Cas limite : immeuble-généré **avec** bloc confort ⇒ B1 (méthode prime).
- C (DPE null).
- Mapping des modalités ADEME (ventilation, inertie, menuiseries).
- Cap à 4 chips ; débordement vers `drawerFields`.
Pas de test de rendu (aligné sur l'existant). Vérification finale : `tsc` + `eslint` + `npm run build`.

## Séquence d'implémentation (indicative)
1. Étendre la lecture DPE (`dpe.ts` : select + types + `toRecord`).
2. Lib pure `thermal-evidence.ts` + tests.
3. Composant `ThermalComfortSection.tsx` (3 états + tiroir).
4. Intégration `LogementModule` (après Passeport, DPE attribué seulement).
5. Alimentation synthèse (sous verrou confirmé).
6. Vérifs `tsc` / `eslint` / `build`.

## Ce qui reste ouvert (noté, hors socle)
- Contrôle manuel API vs PDF (~20 cas) avant de figer certains libellés du niveau bâtiment (ventilation/inertie/menuiseries d'un DPE immeuble sont-elles propres au lot ou héritées ?). N'empêche pas de coder ; peut ajuster des libellés.
- Spec B « résolution, actualisation et vécu » : B2 proximité + mini-intake + persistance + vécu.
