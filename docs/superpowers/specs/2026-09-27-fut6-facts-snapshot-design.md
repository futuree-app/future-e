# FUT-6 : proposition d'architecture avant implémentation

27 septembre 2026. **Proposition à valider, rien n'est codé.** Référence produit : ticket FUT-6 (décisions
D1 à D11 révisées, exigence de cache). Audit : `docs/audits/2026-09-27-fut6-cartographie-territoire.md`.

Hors périmètre, conformément au ticket : FUT-33 (distance à la côte, typologie littorale), FUT-34 (trait
distinctif partagé du comparateur), FUT-35 (rôle du vieillissement), les autres synthèses, la future
« Lecture pour votre projet ».

> **Addendum du 28/09/2026, décisions intégrées à l'implémentation.** Ce qui suit remplace les passages
> contraires du document.
>
> - **La synthèse Territoire est générique.** Elle ne reçoit ni relation au lieu, ni repères de terrain, ni
>   attentes de découverte. La clé de cache devient `SHA-256(empreinte | horizon | version du contrat)`, sans
>   `user_id` ni contexte (§3.1 et §3.2 caducs pour le contexte personnel). Le bloc de repères de terrain, le
>   bloc « Vos priorités pour cette commune » et le bandeau « Cette lecture s'adresse à… » quittent l'écran
>   Territoire. Leurs données et leurs routes restent en place.
> - **Préchauffage** dans `after()`, au plus tôt : le hub `/rapport` (commune et droit connus), puis la page
>   Territoire si l'horizon par défaut n'est pas prêt. Une génération en cours réserve sa clé (bail de 150 s) :
>   pas de double facture.
> - **Affichage** : la synthèse déterministe tout de suite ; la lecture enrichie depuis le cache, ou préparée
>   en arrière-plan. Elle arrive par une transition si le lecteur n'a pas commencé à lire, sinon par un signal
>   « Lecture enrichie prête ». Jamais de texte streamé.
> - **D8** : les contrôles visent une assertion et sa polarité (négations et tournures de contraste admises).
>   « rural » et « station balnéaire » sont refusés faute de fait dédié. La **conversion jours → mois est
>   refusée**, comme les ratios (« x fois plus »). Les nombres sont typés par unité (%, °C, jours, nuits,
>   habitants, mm). Un nombre sans unité n'a droit qu'à l'exact, à l'arrondi, ou à la borne entière la plus
>   proche.
> - **D9** : aucun phénomène n'est déclaré dominant. Ordre éditorial fixe, et « parmi les évolutions
>   visibles ». Les intitulés du déterministe sont « Le territoire aujourd'hui », « Ce qui évolue d'ici
>   {année} » et « Ce que la commune a déjà connu ».
> - **D11** : la projection porte aussi les **valeurs de référence 1976-2005**, que le volet des cartes affiche
>   déjà (« ≈ 7 → 19 jours »). Le modèle les cite ; il ne les recalcule plus.
> - Migration : `supabase/34_territoire_facts.sql` et son retour arrière `34_territoire_facts_down.sql`.
>
> **Corrections du 28/09 (après générations réelles et revue).**
> - **Sens du nombre** : chaque valeur de la projection porte sa nature (`valeur`, `ecart`, `reference`).
>   Un nombre présenté comme un écart (« +12 », « 12 de plus », « une hausse de 12 », « 1,7 °C de
>   réchauffement ») ne se valide que sur un écart ; une valeur jamais sur un écart. « 19 jours
>   supplémentaires » (écart réel +12) est refusé. Les taux en % ne sont pas concernés.
> - **Arrivants récents** : la projection sépare l'évolution (2015-2021) et la part d'arrivants (une année,
>   définition explicite). Une règle refuse toute association de cette part à une période pluriannuelle,
>   sauf si la phrase précise « un an plus tôt ».
> - **CatNat « sécheresse » ≠ jours de sols secs** : raccord retiré du déterministe, interdit à l'IA
>   (règle + consigne).
> - **Budget** : réservé avant CHAQUE appel au modèle ; cache touché = 0 réservation.
> - **Limite par adresse** : après la lecture du cache ; jamais sur un GET ni sur un cache touché. Côté
>   client, toute réponse d'erreur (401, 403, 404, 429, 503) est terminale.
> - **Déterministe raccourci** : 3 informations, 3 évolutions dans un ordre éditorial fixe, 2 faits puis le
>   passage vers Autour et Logement. Plus d'affirmation sur la répartition des jours dans l'année.

---

## 1. Architecture `Fact → DerivedFact → FactsSnapshot`

### 1.1 Deux modules

**Contrat générique**, `src/lib/facts/contract.ts`. Pur, sans rien de propre à Territoire. Il définit :

```ts
type FactScale = "commune" | "radius_15km" | "urban_unit" | "department" | "point";

type FactSource = { producer: string; dataset: string; field: string };

type CardPolicy =
  | { card: string }                                   // la carte qui l'affiche
  | { noCard: { reason: NoCardReason; note?: string } };
type NoCardReason = "redundant" | "context_only" | "too_granular" | "low_standalone_value" | "other";

type SynthesisPolicy =
  | { include: true }
  | { include: false; reason: string };               // D11 : exclusion motivée, dans le code

type Fact<V = unknown> = {
  key: string;                 // "land.composition", "population.density"…
  value: V | null;
  unit: string | null;
  scale: FactScale;
  source: FactSource;
  vintage: string | null;      // « 2023 », « 2015-2021 » ; null = inconnu, et dit comme tel
  observedAt: string | null;   // sources vivantes (VigiEau, GASPAR) ; HORS de l'empreinte
  status: "ok" | "missing" | "source_unavailable";
  limits?: string;
  card: CardPolicy;
  synthesis: SynthesisPolicy;
};

type DerivedFact<V = string> = {
  key: string;                 // "land.category", "density.category"…
  value: V;                    // code stable : "mixed", "intermediate"…
  label: string;               // texte affiché : « Occupation mixte »
  from: string[];              // clés des Facts utilisés
  rule: string;                // "land-category@1" : identifiant ET version de la règle
  card: CardPolicy;
  synthesis: SynthesisPolicy;
};

type FactsSnapshot = {
  scope: { kind: string; id: string };   // { kind: "commune", id: "17094" }
  registryVersion: string;               // version du registre et des règles
  hash: string;                          // empreinte (voir §2.4)
  builtAt: string;                       // HORS de l'empreinte
  facts: Fact[];
  derived: DerivedFact[];
};
```

Le même module porte deux fonctions pures : `snapshotHash(snapshot)` et `project(snapshot)` (la projection
de synthèse, qui ne garde que les faits `include: true`).

**Registre Territoire**, `src/lib/territoire/facts.ts`. Il construit le snapshot à partir de ce que la page
lit déjà (index du comparateur, enrichissement, saisonnalité, ERA5, compte CatNat du dossier). Toutes les
règles déterministes y sont réunies, **en réutilisant les seuils existants** (aucun nouveau seuil) :

| DerivedFact | Règle existante reprise | Consommateurs |
|---|---|---|
| `land.category` | face de carte actuelle : bâti ≥ 50, naturel ≥ 45, agricole ≥ 50, naturel < 20, sinon mixte (D4) | face de carte, **carte d'identité** (remplace la grille à 40 %), synthèse |
| `density.category` | 1 500 / 150 (D3) | carte d'identité, phrase d'identité, synthèse |
| `demography.category` | récit existant (±0,15 %/an ; arrivants ≥ tercile haut), **libellés reformulés en observation** (D7) | carte, synthèse |
| `seasonality.category` | 40 / 20 / 8 de la carte | carte, synthèse (même grille des deux côtés) |
| `climate.*` | anomalies DRIAS déjà fournies par la source (pas de seuil) | cartes, synthèse |

### 1.2 Ce qui change à l'écran (et seulement cela)

- **Carte d'identité, « Occupation des sols »** : prend le libellé `land.category`. À Châtelaillon, elle
  passe de « Dominante urbaine » à « Occupation mixte », comme la carte (D4).
- **Volet « Espaces naturels »** : le sous-titre qualificatif (grille 75 / 50 / 25) disparaît. Il garde les
  chiffres et la composition (D4).
- **Carte « Logements inoccupés »** : garde le chiffre ; « Perte d'attractivité », « Tension sur le
  logement » et « Marché équilibré » disparaissent (D5). Les seuils 13 / 8 ne sont pas documentés, donc
  aucune qualification ne les remplace dans FUT-6.
- **Carte démographie** : le récit « gagne des habitants et attire de nouveaux arrivants » devient une
  observation, par exemple « gagne des habitants, avec une part d'arrivants récents parmi les plus élevées
  (tercile haut national) » (D7). Formulations exactes à relire dans la PR.
- **Tout le reste des cartes est inchangé** : elles lisent le snapshot au lieu des objets bruts, avec le
  même rendu.

### 1.3 Projection de synthèse (D11)

Chaque fait porte sa politique `synthesis`. Projection prévue :

| Inclus | Exclus, avec la raison écrite dans le registre |
|---|---|
| nom, population, densité + `density.category` | trait distinctif (D2 : « change d'échelle et de définition ») |
| typologie, rôle dans l'agglomération | vieillissement (D6 : « champ ambigu, rôle en cours de clarification, FUT-35 ») |
| composition OSO, part naturelle communale, `land.category` | boisement ADEME **quand OSO existe** (D1 : « définition non documentée, concurrence la source canonique ») |
| démographie : taux, part d'arrivants, `demography.category` | part naturelle dans un rayon de 15 km (« autre échelle, source de la confusion Châtelaillon ») |
| saisonnalité + `seasonality.category` | |
| vacance : **chiffre seul** (D5) | |
| climat de l'horizon : absolus **et anomalies** (ce que montrent les cartes) | |
| pluie intense : nombre de jours (face) et hauteur (volet) | |
| inondation, submersion, CatNat, érosion du littoral, VigiEau, ONDE, tendance ERA5 | |

Si OSO manque, le boisement ADEME entre dans la projection, avec sa source et la limite « définition non
documentée » (D1, repli explicite).

---

## 2. D10 : une seule photo des données

### 2.1 Où le snapshot est construit

**Une seule fois, dans la page serveur** `/rapport/quartier` : `buildTerritoireSnapshot(insee)` remplace
les lectures dispersées actuelles (`gatherCommuneEnrichment`, `getTerritoryContext`,
`getResidencesSecondairesPct`, `getEra5Trend`).

### 2.2 Comment les cartes y accèdent

La page passe **le snapshot** (ou des props dérivées de lui par un adaptateur pur,
`cardsFromSnapshot(snapshot)`) à `TerritoryIdentityCard` et `QuartierAside`. Aucune carte ne lit plus une
source directement.

### 2.3 Comment la synthèse y accède

1. La page **persiste** le snapshot dans une table technique `territory_facts_snapshot`, clé = son empreinte,
   écrite côté serveur uniquement (service role, comme `reachability_artifact`). Insertion idempotente : si
   l'empreinte existe déjà, rien ne s'écrit.
2. La page transmet au composant client **l'empreinte**, et rien d'autre.
3. Le client appelle `/api/synthesize-quartier` avec `{ snapshotHash, horizon, relation, workbook?, discovery? }`.
4. La route **relit ce snapshot-là** par son empreinte. Elle ne recontacte **aucune** source et ne
   reconstruit rien.
5. La route vérifie le droit d'accès sur `snapshot.scope.id` (la commune du snapshot, jamais une commune
   envoyée par le client).

C'est donc littéralement le même objet : celui que la page a rendu et écrit. Il n'y a ni reconstruction ni
comparaison après coup.

### 2.4 Identité et version

- Empreinte = SHA-256 de la sérialisation stable (`stableStringify`, déjà présent) de `{ scope,
  registryVersion, facts sans observedAt, derived }`.
- `observedAt` et `builtAt` restent **hors** de l'empreinte. Sinon, la date de lecture de VigiEau (cache
  d'une heure) changerait l'empreinte toutes les heures, sans qu'aucune valeur ne change.
- Une valeur qui change (nouvel arrêté VigiEau, nouveau millésime) donne une nouvelle empreinte, donc une
  nouvelle synthèse. Un changement de règle se fait en montant `registryVersion`.
- Le client ne peut désigner qu'un snapshot **existant**, et seulement d'une commune à laquelle il a droit.

### 2.5 Si l'écriture échoue (table absente, base indisponible)

La page affiche quand même les cartes depuis le snapshot en mémoire, et transmet `snapshotHash: null`. Le
composant affiche alors la **synthèse déterministe** (D9), calculée côté serveur depuis le même snapshot et
passée en props. Aucune génération IA sans snapshot persisté.

---

## 3. Cache de synthèse

### 3.1 Clé

```
cacheKey = SHA-256( snapshotHash | horizon | SYNTHESIS_CONTRACT_VERSION | contextKey )
```

- `SYNTHESIS_CONTRACT_VERSION` couvre ensemble le prompt, la projection, le modèle et les contrôles D8 :
  toute modification de l'un d'eux la fait monter.
- `contextKey` ne contient que ce qui entre **réellement** dans le texte :
  - la relation (`current_residence` | `considering_living`) ;
  - le workbook normalisé, **seulement en résidence et s'il est rempli** (c'est déjà la règle
    anti-contamination de la route) ;
  - les attentes de découverte, **seulement hors résidence et si elles sont remplies**.

### 3.2 Stockage

Table `territory_synthesis`, écrite en service role :
`cache_key` (PK), `snapshot_hash`, `insee_code`, `horizon`, `contract_version`, `user_id` (voir ci-dessous),
`text`, `origin` (`model` | `model_retry` | `fallback`), `rejections` (jsonb, motifs des contrôles D8),
`created_at`.

- **Contexte générique** (sans workbook ni attentes) : `user_id` null. La synthèse est **mutualisée**
  entre lecteurs de la même commune, même horizon, même relation. C'est là que se fait l'essentiel de
  l'économie.
- **Contexte personnel** (workbook ou attentes remplis) : `user_id` entre dans la clé et dans la ligne.
  Un texte nourri de la note libre de quelqu'un n'est jamais servi à quelqu'un d'autre.

### 3.3 Flux

1. Si la clé existe : le texte stocké est renvoyé, **sans appel au modèle ni réservation de budget**.
2. Sinon : réservation du budget, génération, contrôles D8, au besoin une régénération puis le fallback
   (§5). Le résultat est stocké **avec son origine et ses motifs de rejet** (journal demandé par D8).
3. Un fallback stocké est lui aussi réutilisé : sans cela, une commune qui fait toujours échouer le modèle
   le rappellerait à chaque visite.

### 3.4 Ce que le cache ne fait pas

Il ne verrouille pas deux premières générations strictement simultanées sur deux instances. Les deux
produisent un texte, et la seconde écriture est ignorée. C'est la même limite, assumée, que
`reachability_artifact`.

Un nettoyage des snapshots anciens (plus de 90 jours et plus référencés) peut venir plus tard. La volumétrie
est d'une ligne par commune lue et par changement de valeur.

---

## 4. D8 : conventions proposées (À VALIDER, NON CODÉES)

Les contrôles portent sur la **projection** envoyée au modèle. Une règle ne s'applique que si le fait
qu'elle vérifie est présent dans le snapshot.

### 4.1 Catégories incompatibles

Chaque ligne donne : si le `DerivedFact` vaut X, alors la synthèse ne doit pas contenir ces formulations.
Correspondance insensible à la casse et aux accords, sur des expressions, pas sur des mots isolés.

| Fait | Valeur | Formulations refusées (liste proposée) |
|---|---|---|
| `land.category` | mixte, forte présence naturelle, dominante agricole | « (presque / quasi) entièrement (bâti / urbanisé) », « très urbanisé », « majoritairement (bâti / urbanisé) », « le béton et le bitume (couvrent / dominent) », « très peu d'espaces (verts / naturels / ouverts) », « (presque / quasi) pas de (nature / verdure / végétation) », « parmi les (communes / villes) les plus (urbanisées / bâties / minérales) » |
| `land.category` | majoritairement urbanisé | « forte présence naturelle », « (largement / majoritairement) naturel(le) », « très verte » |
| `land.category` | faible présence d'espaces naturels | « forte présence naturelle », « (largement / majoritairement) naturel(le) » |
| `density.category` | intermédiaire | « très dense », « densément (bâti / peuplé) », « (ville / commune) dense », « peu dense », « faiblement peuplé » |
| `density.category` | dense | « peu dense », « faiblement peuplé », « rural(e) » |
| `density.category` | peu dense | « (très) dense », « densément » |
| `demography.category` | croissance | « perd des habitants », « (en) déclin », « se dépeuple », « stagne » |
| `demography.category` | recul | « gagne des habitants », « (en) croissance démographique », « se peuple » |
| `demography.category` | stable | « gagne des habitants », « perd des habitants », « déclin », « croissance démographique » |
| `seasonality.category` | faible, modérée | « très touristique », « (forte / très marquée) saisonnalité », « station balnéaire » |
| `seasonality.category` | forte | « peu touristique », « (peu / pas) marqué(e) par le tourisme » |
| `risk.flood` | non recensé | « (zone / périmètre / territoire) inondable », « exposé(e) aux crues » |
| `risk.flood` | recensé | « (aucun / sans) risque d'inondation », « épargné(e) par les crues » |
| `risk.marine_submersion` | non concerné | « submersion » |
| `risk.marine_submersion` | concerné | « (aucun / sans) risque de submersion » |

### 4.2 Vocabulaire interdit quel que soit le snapshot (faute de fait dédié)

| Notion | Formulations refusées | Décision d'origine |
|---|---|---|
| Attractivité | « attire », « attractif / attractive / attractivité », « recherché(e) », « prisé(e) », « lieu de vie convoité » | D7 |
| Marché du logement | « tension (sur le / du) logement », « marché tendu », « peu de biens disponibles », « perte d'attractivité » | D5 |
| Imperméabilisation | « les sols absorbent mal », « sols peu absorbants », « imperméabilis* », « béton et bitume », « ruisselle sans s'infiltrer » | aucune donnée ne la mesure (audit, R8) |
| Classement national | « parmi les (communes / villes) les plus … de France », « l'une des (communes / villes) les plus … » | D2, et absence de donnée comparative |

**Corollaire** : la consigne actuelle du prompt « Si un sol est imperméabilisé, dites "les sols absorbent
mal l'eau" » (`route.ts:57`) est retirée. Elle suggérait précisément une formulation interdite ici.

### 4.3 Contrôle des nombres

- Chaque nombre écrit **en chiffres** dans la synthèse doit correspondre à une valeur de la projection,
  après une transformation admise (§4.4).
- Toujours admis : l'année de l'horizon, les années d'un fait (première et dernière reconnaissance CatNat,
  période INSEE, période ERA5), et le scénario (« +2,7 °C »).
- **Non contrôlés en V1** : les nombres écrits en lettres (« quatorze », « trois mois »). Les contrôler
  demande un analyseur dédié, et le risque est plus faible, les nombres principaux s'écrivant en chiffres.
  Limite assumée et dite.
- Un nombre non reconnu est un rejet, avec le nombre et sa phrase dans le motif.

### 4.4 Transformations numériques admises

| Transformation | Exemple (Châtelaillon) |
|---|---|
| Arrondi à l'entier ou à une décimale | 37,9 % → « 38 % » ; 36,5 % → « 36 % » ou « 37 % » |
| Arrondi à 2 chiffres significatifs, précédé de « environ », « près de », « plus de » ou « moins de » cohérent avec le sens | 975,76 → « près de 1 000 habitants au km² » ; 6 227 → « environ 6 200 habitants » |
| Anomalie DRIAS signée, arrondie comme ci-dessus | « +9 nuits » |
| Jours convertis en mois, arrondi au demi-mois (seulement pour les jours secs et les jours chauds) | 136 jours → « 4,5 mois » |

Tout autre calcul (différence entre deux horizons, ratio, multiplication « trois fois plus ») est refusé en
V1, **sauf** s'il figure comme fait dans la projection.

### 4.5 Journal

Chaque rejet enregistre `{ règle, fait, extrait }` dans `territory_synthesis.rejections`, et une ligne de
log serveur. C'est la matière pour ajuster les listes.

---

## 5. Régénération et synthèse déterministe (D8, D9)

### 5.1 Chaîne

Génération → contrôles → si rejet : **une** régénération, avec la liste des violations ajoutée au message →
contrôles → si nouveau rejet : **synthèse déterministe**. Tout est stocké (§3.3).

### 5.2 Synthèse déterministe

Même forme que la synthèse IA : un titre « {Commune} à l'horizon {année} » et trois blocs aux mêmes
intitulés, plus courts. Tout est fait de patrons écrits à l'avance, alimentés par des `DerivedFact`, et la
sortie **passe elle-même les contrôles D8** (vérifié par test).

| Bloc | Règle de sélection | Patron (exemple de forme, textes finaux dans la PR) |
|---|---|---|
| Ce qui domine | Le phénomène climatique de l'horizon au **percentile national le plus élevé** parmi chaleur, nuits tropicales, sols secs, pluie intense et feu. Les percentiles existent déjà dans l'index : c'est un rang, pas un nouveau seuil. Puis le décor en une phrase. | « À {commune}, le phénomène qui pèse le plus à l'horizon {année} est {phénomène} : {fait chiffré}. » + phrase d'identité |
| Ce qui tient, ce qui se tend | Atout : la catégorie du couvert, puis la démographie ; compromis : risque recensé (submersion, inondation), sinon saisonnalité forte ou marquée | « {Atout observé}. En regard, {risque recensé}, que la commune a déjà connu {n} fois depuis {année}. » |
| Ce qu'on sous-estime ici | Le second phénomène climatique par percentile, seulement s'il se distingue du premier ; sinon une phrase de lecture d'ensemble | « Moins visible, {phénomène 2} : {fait chiffré}. L'effet concret dépend du quartier et du logement, examinés dans les modules Autour de l'adresse et Logement. » |

C'est plus court et moins nuancé que la synthèse IA, comme le prévoit D9. Il n'y a ni génération libre ni
inférence nouvelle.

---

## 6. Tests prévus

**Châtelaillon-Plage (17094), de bout en bout, sur fixtures** : entrée d'index réelle et ligne ADEME réelle
figées dans le dépôt, sans réseau.
1. Snapshot : `land.category` = mixte, `density.category` = intermédiaire.
2. **La carte d'identité et la face de carte donnent le même libellé.**
3. Projection : la composition OSO est présente ; le boisement ADEME, le trait distinctif, le
   vieillissement et le rayon de 15 km sont absents, **chacun avec sa raison**.
4. **Les 5 synthèses réellement générées pendant l'audit** deviennent des fixtures : chacune doit être
   **rejetée**, pour les motifs attendus (couvert, densité, imperméabilisation, attractivité, classement
   national, « moins de 2 % » non reconnu).
5. Un texte conforme de référence passe.
6. La synthèse déterministe de Châtelaillon est stable (même snapshot, même texte), lisible (texte de
   référence relu), et passe ses propres contrôles.

**Doubles vérités**
7. Pour une grille de compositions limites (bâti 45 % : l'identité disait « Dominante urbaine », la carte
   « mixte »), l'identité et la carte donnent toujours le même libellé.
8. Le volet ne porte plus de qualification ; la carte vacance ne contient plus « Tension », « attractivité »
   ni « Marché » ; le récit démographique ne contient plus « attire ».
9. Si OSO manque : le boisement ADEME entre dans la projection avec sa limite ; si OSO existe : jamais.

**Snapshot, route et cache**
10. Empreinte stable si seul `observedAt` change ; nouvelle empreinte si une valeur change.
11. La route n'appelle aucune source : on vérifie qu'elle ne lit que le snapshot persisté.
12. Snapshot inconnu : refus. Snapshot d'une commune sans droit : 403.
13. Clé de cache : change avec l'horizon, la relation, un workbook rempli (en résidence), des attentes
    (hors résidence) ; ne change pas avec un workbook fourni hors résidence. Contexte personnel : clé liée
    à l'utilisateur.
14. Chaîne de génération (générateur simulé) : valide du premier coup = 1 appel ; invalide puis valide =
    2 appels ; invalide deux fois = fallback, motifs journalisés ; cache touché = 0 appel.

**Non-régression** : les tests existants de la page, du comparateur et de la parité restent verts.

---

## 7. Écarts et points à trancher avant de coder

1. **Le texte n'apparaîtra plus mot à mot pendant la génération (écart UX).** Contrôler un texte suppose de
   l'avoir en entier, alors qu'aujourd'hui il s'affiche au fil de la génération. Au premier affichage d'une
   clé, sans cache, le lecteur attendrait donc 15 à 25 secondes au lieu de voir le texte s'écrire. Options :
   - (a) afficher « lecture en cours » puis le texte validé ;
   - (b) **afficher d'emblée la synthèse déterministe**, puis la remplacer par la synthèse IA une fois
     validée ;
   - (c) afficher au fil de l'eau et remplacer après coup si le contrôle échoue : le lecteur aurait vu un
     texte faux, ce que D8 veut éviter.

   Recommandation technique : (b). Après le premier lecteur, le cache sert le texte instantanément.
2. **Migration de base** : deux tables (`territory_facts_snapshot`, `territory_synthesis`), en service role
   et sans lecture par le client. Elle doit être appliquée **avant** le déploiement. Sans elle, la page
   reste fonctionnelle et affiche la synthèse déterministe (§2.5).
3. **Récit démographique partagé** : `RECIT_DEMOGRAPHIE` sert aussi au comparateur. FUT-6 crée des
   libellés propres à Territoire (D7) et **ne modifie pas** le comparateur, qui garde donc « attire ». À
   rattacher à un ticket existant ou nouveau, selon votre choix.
4. **Autres lectures du même écran, non migrées** : l'assistant (AskFuture) et le dossier de décision
   (filets des cartes) gardent leurs propres lectures. Ce sont d'autres synthèses, hors FUT-6.
5. **Nombres écrits en lettres** non contrôlés en V1 (§4.3).
6. **Formulations exactes** (récit démographique, patrons du fallback) : proposées dans la PR, à relire à
   l'écran. Seules les **conventions D8** attendent une validation avant d'être codées.
