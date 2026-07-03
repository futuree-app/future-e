# Précision de l'adresse et du logement — design

- **Date** : 2026-07-03
- **Module** : Logement
- **Statut** : validé (porteur), prêt pour plan d'implémentation
- **Fichiers pivots** : `src/components/report/LogementModule.tsx`, `src/lib/ban.ts`,
  `src/lib/dpe.ts`, `src/lib/logement-store.ts`, `src/app/api/georisques-logement/route.ts`,
  `src/app/api/synthesize-logement/route.ts`, table Supabase `logement`.

## Problème

Le module Logement promet une lecture **au grain adresse** de CE logement (le moat). Deux
maillons trahissent cette promesse aujourd'hui :

1. **Saisie floue.** Champ texte libre + bouton « Analyser ». Le serveur géocode via la BAN
   avec `limit=1` et prend le premier résultat. L'utilisateur ne voit ni ne valide l'adresse
   réellement retenue.
2. **Attribution DPE arbitraire.** `getDpeByBanId` prend le DPE **le plus récent** parmi tous
   ceux rattachés à l'identifiant BAN. Dans une résidence, tous les logements partagent le même
   identifiant BAN : on affiche donc un appartement au hasard. Cas réel constaté : 30 m² affiché
   pour un logement de 60 m².

Presque tout le reste du rapport (risques, PPRN, sinistralité, environnement immédiat) est au
grain **adresse / parcelle / commune**, indépendant du logement précis. Le seul élément vraiment
**propre au logement** est le **DPE**. Donc « le mauvais logement » = « le mauvais DPE » :
l'autocomplétion règle le bon **bâtiment**, le sélecteur règle le bon **DPE**.

## Objectifs

- Sélectionner l'adresse **avec précision** (autocomplétion BAN, sélection explicite).
- **Ne jamais** attribuer un DPE au logement sans fondement : soit convergence forte, soit
  confirmation de l'utilisateur.
- Rester **honnête** quand on ne peut pas identifier le logement (absence assumée, repère
  bâtiment prudent, jamais un faux par défaut).
- **Persister** le choix DPE dans l'artefact `logement` (le rapport payé doit avoir une identité
  énergétique stable et datée).
- Garder les risques / PPRN / sinistralité / autour **indépendants** du choix DPE.

## Non-objectifs (hors périmètre, parqués)

- **Édition manuelle de champs** par l'utilisateur (corriger soi-même les m², l'étage…). Chantier
  distinct, lié à la personnalisation du module et aux questions posées. Consigné, pas ici.
- Refonte des Faces 1/4, du parcours posture, ou de la synthèse au-delà du strict nécessaire au DPE.
- Détection exhaustive des DPE remplacés/successifs : on fait du best-effort conservateur
  (cf. § Attribution), jamais une fusion agressive qui écraserait deux logements distincts.

---

## 1. Parcours utilisateur (figé)

### Étape 1 — Adresse
L'utilisateur tape ; une liste de suggestions BAN apparaît ; il **sélectionne** la sienne
(clic ou Entrée). L'analyse démarre **immédiatement** au point choisi : risques, PPRN,
sinistralité, environnement immédiat, **et** recherche des DPE. Un état de confirmation reste
affiché : `12 rue X, 17000 La Rochelle · Adresse sélectionnée · Modifier`.

Le bouton « Analyser » disparaît. **Seule** la sélection d'une suggestion (clic/Entrée) déclenche
l'analyse ; le texte libre n'est **jamais** pris pour une adresse validée.

### Étape 2 — DPE
Selon le résultat de la recherche DPE (cf. machine à états) :

- **Aucun résultat** → « Aucun DPE retrouvé dans la base ouverte pour cette adresse. » +
  « Cela ne signifie pas nécessairement qu'aucun diagnostic n'existe. »
- **Un résultat, convergence forte (maison individuelle)** → affiché, formulé
  « Un DPE a été retrouvé pour cette adresse », avec « Ce n'est pas le bon diagnostic ».
- **Un résultat, logement collectif / type inconnu / ambigu** → confirmation requise :
  « Un diagnostic a été retrouvé à cette adresse. Est-ce celui du logement ? »
- **Plusieurs candidats** → « Plusieurs diagnostics sont rattachés à cette adresse. Sélectionnez
  celui qui correspond au logement. »
- **Aucun ne correspond** (« Mon logement n'est pas dans cette liste ») → le logement reste
  analysable ; le DPE individuel passe en **non identifié** ; repère bâtiment sous conditions.

Chaque candidat affiche : **classe · surface · type · étage (si dispo) · date · complément
d'adresse (si dispo)**.

---

## 2. Machine à états DPE

État explicite porté par `LogementModule`, dérivé après la recherche DPE :

```ts
type DpeStatus =
  | "loading"
  | "not_found"          // 0 candidat
  | "selection_required" // ≥1 candidat sans convergence forte, ou ≥2 candidats
  | "auto_confirmed"     // 1 candidat + convergence forte (maison indiv. + BAN précise)
  | "confirmed"          // l'utilisateur a choisi un DPE (ou confirmé l'auto)
  | "rejected"           // « mon logement n'est pas dans la liste »
  | "error";
```

Tant que le statut est `selection_required` :
- Face 2 et Face 3 fonctionnent normalement (indépendantes du DPE) ;
- la section Énergie **demande le choix** (elle n'affiche aucune classe comme « la vôtre ») ;
- toute synthèse utilisant le DPE affiche « non déterminé » ou attend ;
- **aucune classe DPE n'entre dans les prompts IA** comme appartenant au logement.

Après `confirmed` :
- persistance du DPE choisi (cf. § 6) ;
- mise à jour des blocs dépendants (passeport, Énergie) ;
- éventuelle **régénération ciblée** de la synthèse Logement (pas de tout le rapport).

`auto_confirmed` est affiché mais **révocable** (« Ce n'est pas le bon diagnostic » → repasse en
`selection_required` ou `rejected`).

---

## 3. Attribution : « un candidat » ≠ « son DPE »

### Constitution de la liste de candidats
1. **Dédup par `numero_dpe`.**
2. **Collapse conservateur des DPE d'un même logement** *lorsque la donnée le permet* : si deux
   diagnostics décrivent manifestement la **même unité** (même `complement_adresse_logement` +
   même `numero_etage_appartement` + même `surface_habitable_logement`), ne garder que le plus
   récent. En cas de doute, **garder les deux** (mieux vaut un sélecteur qu'une fusion fausse).
3. Ce qui reste = **candidats plausibles distincts**.

### Règle de déclenchement du sélecteur
Le sélecteur dépend du **nombre de logements plausibles restants**, PAS d'une différence de
surface. S'il reste **plusieurs** candidats distincts après dédup+collapse → sélecteur, **même si
deux surfaces sont identiques** (étages/chauffages/dates peuvent différer).

### Convergence forte (seul cas d'`auto_confirmed`)
Tous réunis :
- **1 seul** candidat après dédup+collapse ;
- **maison individuelle** (`type_batiment` ≈ « maison », et **aucun** signal collectif :
  aucun candidat « appartement »/« immeuble ») ;
- **adresse BAN précise** (feature BAN de `type === "housenumber"`) ;
- candidat récent et exploitable (classe présente).

Sinon → `selection_required`, y compris pour **1 seul** candidat en collectif / type inconnu.

Formulation même en `auto_confirmed` : « **Un DPE a été retrouvé pour cette adresse** », jamais
« Voici le DPE de votre logement ».

---

## 4. « Diagnostics retrouvés à cette adresse » (ex-« repère bâtiment »)

Renommé **« Diagnostics retrouvés à cette adresse »** (la BAN ne garantit pas un bâtiment unique).
Affiché **uniquement** en `rejected` ou `not_found`-partiel, et **seulement si** au moins **3
diagnostics résidentiels distincts et cohérents** existent :

> **DPE retrouvés à cette adresse : 4**
> Les classes observées vont de D à F. Elles ne permettent pas de qualifier votre logement.

Sinon (moins de 3, ou hétérogènes : tertiaire mêlé, écarts d'époque, etc.) :

> D'autres diagnostics existent à cette adresse, mais ils sont trop peu nombreux ou trop
> hétérogènes pour constituer un repère utile.

Jamais présenté comme « votre » DPE ni comme une photographie représentative de l'immeuble.

---

## 5. Wording (honnêteté)

- Absence totale : « **Aucun DPE retrouvé dans la base ouverte pour cette adresse.** » +
  « Cela ne signifie pas nécessairement qu'aucun diagnostic n'existe. » (couverture, identifiant
  BAN, adresse mal rattachée, donnée non interrogée).
- Après « mon logement n'est pas dans la liste » : « **Aucun des diagnostics retrouvés n'a été
  attribué à ce logement.** » (jamais « DPE absent » : il peut exister sans avoir été identifié).

---

## 6. Persistance (artefact `logement`, V1)

Migration Supabase (nouveau fichier `supabase/<prochain-numéro>_logement_dpe_selection.sql`).
Colonnes ajoutées à `logement`, reflétées dans `LogementRow` :

```ts
dpe_selection_status:
  | "auto_confirmed" | "user_confirmed" | "not_in_list" | "not_found" | "pending";
selected_dpe_id: string | null;
selected_dpe_snapshot: DpeRecord | null;   // figé à la date de génération
selected_dpe_at: string | null;            // ISO
```

**Correspondance runtime → persisté** (le `DpeStatus` de §2 est l'état vivant, le
`dpe_selection_status` est sa projection stockée) : `auto_confirmed`→`auto_confirmed` ;
`confirmed` (par l'utilisateur)→`user_confirmed` ; `rejected`→`not_in_list` ;
`not_found`→`not_found` ; `loading`/`selection_required`→`pending` (rien de définitif à stocker) ;
`error`→ ne persiste rien.

Le **snapshot** est conservé parce que la base DPE peut évoluer : le rapport payé doit pouvoir
expliquer quelle donnée il a utilisée à sa date. Persisté à la confirmation (ou à
l'`auto_confirmed`). Relu au chargement pour restaurer l'état sans re-demander.

---

## 7. Contrat serveur : adresse sélectionnée atomique

Le client transmet un **objet unique** (pas trois champs désynchronisables) :

```ts
type SelectedBanAddress = {
  banId: string;
  label: string;
  housenumber?: string;
  street?: string;
  postcode: string;
  city: string;
  citycode: string;   // = insee
  latitude: number;
  longitude: number;
};
```

Le même objet sert à : sauvegarder l'adresse, lancer les risques au point, chercher les DPE,
générer le snapshot autour. **Validation serveur** : schéma complet ; coordonnées valides ;
`citycode` cohérent avec la commune du rapport ; valeurs raisonnables ; **aucun mélange** d'un
ancien `banId` avec de nouvelles coordonnées. Le géocodage `limit=1` **reste** comme repli (saisie
sans sélection possible), mais **n'écrase jamais** une sélection BAN explicite.

---

## 8. Changements par fichier

- **`src/lib/ban.ts`** : ajout `autocompleteBanAddress(query, { signal }): Promise<BanAddressResult[]>`
  (appelle `/search?q=…&autocomplete=1&limit=6`, renvoie plusieurs features avec leur `type`).
  `geocodeBanAddress` (limit=1) conservé comme repli.
- **`src/lib/dpe.ts`** : `getDpeByBanId` → `getDpeCandidatesByBanId(banId): Promise<DpeRecord[]>`
  (liste, tri `-date`, dédup+collapse conservateur) ; `DpeRecord` enrichi de `etage`
  (`numero_etage_appartement`) et `complement` (`complement_adresse_logement`) ; helper
  `deriveAddressDpeContext(candidates)` (fourchette classes + compte, sous garde-fou ≥3).
- **`src/app/api/georisques-logement/route.ts`** : accepte un `SelectedBanAddress` (POST) en plus
  de `q` (repli GET) ; renvoie `dpeCandidates: DpeRecord[]` (au lieu de `dpe`) + `banFeatureType`
  (pour la règle de convergence).
- **`src/lib/logement-store.ts`** : `LogementRow` + colonnes DPE ; helpers de lecture/écriture du
  choix DPE.
- **`src/app/api/synthesize-logement/route.ts`** : n'accepte une classe DPE dans l'entrée que si
  `dpe_selection_status ∈ {auto_confirmed, user_confirmed}` ; sinon DPE = « non déterminé ».
- **`src/components/report/LogementModule.tsx`** : intègre `AddressAutocomplete` et `DpeSelector`,
  porte `dpeStatus` et `selectedDpe`, lit `selectedDpe` (pas `result.dpe`) dans le passeport et la
  section Énergie.

### Nouveaux composants (isolés, testables)
- **`AddressAutocomplete`** : input + dropdown. Debounce ~250 ms ; `AbortController` (annule la
  requête précédente) ; ignore les réponses hors-ordre ; navigation clavier (↑ ↓ Entrée Échap) ;
  distinction nette **texte tapé** vs **adresse sélectionnée** ; état « aucune adresse trouvée » ;
  repli si BAN indisponible ; après sélection, résumé + lien **Modifier l'adresse**.
- **`DpeSelector`** : liste de candidats (classe/surface/type/étage/date/complément) + « c'est le
  mien » + « mon logement n'est pas dans la liste ». Rendu conditionné par `dpeStatus`.

---

## 9. Tests (libs pures, `node --test`)

- `ban.ts` : parsing autocomplétion (plusieurs features, `type` housenumber/street), tri, champs.
- `dpe.ts` : `getDpeCandidatesByBanId` (dédup par `numero_dpe`, collapse conservateur même
  unité, non-collapse de deux unités de même surface/étages différents), mapping `etage`/`complement`.
- `dpe.ts` : `deriveAddressDpeContext` (fourchette + garde-fou ≥3 diagnostics, cas hétérogène).
- Règle de convergence : `auto_confirmed` seulement si (1 candidat + maison + BAN housenumber),
  `selection_required` pour 1 candidat en collectif.

UI (dropdown, sélecteur) : non couverte en unitaire, vérifiée en session payante (rendu derrière
`canAccessCompleteReport`).

---

## 10. Rappel du parcours cible

> Adresse sélectionnée avec précision → analyse immédiate au point → attribution du DPE confirmée
> lorsque nécessaire → choix sauvegardé → reste du rapport indépendant si aucun DPE ne peut être
> attribué.
