# Spec — « Explorer à partir d'une commune »

**Date** : 2026-06-28 · **Statut** : design validé, prêt pour plan d'implémentation
**Origine** : Pari #7 du vault (`docs/vault/paris.md`) · **Porte** : amorce de `/ou-vivre` (découverte)

## Intention

Permettre au lecteur de **partir d'une commune qu'il connaît / aime** plutôt que d'une page
blanche, pour exprimer ce qu'il cherche. Ex. : « une ville comme Brest ou Lorient, mais dans le
Sud et moins chère ».

Doctrine (non négociable, Pari #7 + board carte-de-France) :
- C'est de l'**ANCRAGE**, pas de la **similarité**. Le mot « similaire » est **banni en sortie**
  (reformulation), même si l'utilisateur l'emploie en entrée.
- **Pas de score de similarité caché** entre communes (violerait l'invariant n°2 / ADR-0001).
  L'ancre est traduite en **préférences nommées et explicites**, que le moteur conforme consomme.
- **Le moteur ne change pas, seule l'amorce change.** On n'ajoute aucun moteur ; on ajoute de la
  compréhension en amont du parse, et une fonction de dérivation déterministe.

## But / Non-buts

**But** : qu'« une ville comme {commune} [+ autres contraintes] » produise un trio `/ou-vivre`
pertinent, porté par les **traits de vie** de la commune-ancre, honnêtement annoncé.

**Non-buts** :
- Pas de nouveau moteur, pas de nouvelle page de résultats (sortie = trio `/ou-vivre` habituel).
- Pas de carte d'exploration nationale (écartée par le board, `arbitrages/carte-nationale-ecartee`).
- Pas de calcul de distance/similarité entre communes.
- B (entrée guidée explicite) n'est PAS dans la première passe (cf. § B).

## Flux

```
texte libre  ──►  /api/comparateur-vie/parse  ──►  ParsedProject  ──►  matchProjects()  ──►  trio
                  (extrait communeAncre)            (+ préférences        (moteur conforme,
                                                     dérivées de l'ancre)  INCHANGÉ)
```

Deux ajouts en amont, le reste inchangé :
1. **Extraction** : le LLM du parse reconnaît une commune-ancre (`communeAncre`).
2. **Dérivation déterministe, DANS la route parse, APRÈS le LLM** : `communeToPreferences(entry)`
   transforme l'ancre en préférences pondérées, fusionnées dans le `ParsedProject` retourné.

**Où tourne quoi (important pour l'honnêteté de la reformulation)** : le LLM extrait seulement
l'ancre (le label). La dérivation des traits est **déterministe et tourne dans la route parse**,
après l'appel LLM, avant de renvoyer le `ParsedProject`. Ainsi la reformulation peut nommer
EXACTEMENT les traits dérivés (cf. A.4). `matchProjects` reste **totalement inchangé** : il reçoit
un `ParsedProject` déjà enrichi (préférences + exclusion de l'ancre), il ne sait même pas qu'une
ancre existait.

## A — Première passe (le socle)

### A.1 Extraction de l'ancre (parse)

Fichier : `src/app/api/comparateur-vie/parse/route.ts` (+ type `ParsedProject` dans
`src/lib/comparateur-vie.ts`).

Nouveau champ : `communeAncre?: { label: string }[]` (tableau : gère « comme Brest **ou Lorient** »).

Règles ajoutées au `SYSTEM` / `TOOL_INPUT_SCHEMA` :
- Déclencheurs → `communeAncre` : « comme {ville} », « dans le genre de {ville} », « le même
  esprit que {ville} », « j'aime {ville}, je veux retrouver ça ailleurs », « une ville à la {ville} ».
- **Distinguer des champs voisins existants** (risque de confusion) :
  - `nearPlace` = être *près* de la ville (proximité géographique) — PAS l'ancre.
  - `excludePlace` = *quitter* la ville — PAS l'ancre.
  - `sizeRelativeTo` = sa *taille* relative — PAS l'ancre.
  - `communeAncre` = « me faire le même effet ».
- Polarité : « surtout pas comme {ville} » n'est pas une ancre positive (ne pas gérer le négatif
  en première passe ; l'ignorer proprement).

### A.2 Dérivation ancre → préférences (le cœur)

Nouvelle fonction déterministe `communeToPreferences(entry: IndexCommune): Preference[]` dans
`src/lib/comparateur-vie.ts` (server-only, lit l'index déjà chargé). Appelée par la route parse,
après résolution du label d'ancre en entrée d'index (réutiliser le résolveur nom→commune existant ;
seuil de « distinction » = percentile à fixer dans le plan, p.ex. ≥ 70).

- **Signature** : sélectionne les **3-4 critères où la commune se distingue au national**
  (percentile élevé sur les sous-scores de l'index : vie_locale, calme_sonore, nature,
  mobilite_quotidienne, acces_transports, vie_etudiante, croissance_demographique,
  faible_exposition_industrielle…). Pondération : le plus saillant → poids 3, les suivants → poids 2.
  (Réutilise la logique de lecture de percentiles déjà présente, cf. `getCommuneDistinctive`.)
- **Faits identitaires évidents** :
  - au bord de la mer (`distance_cote_km` faible) → `proximite_mer`.
  - **taille d'agglo** de l'ancre → fourchette `communeSize` autour (« une ville comme Brest »
    ≈ même gabarit). Utiliser la taille d'UU (cf. `tailleVille`), pas la commune seule.
- **N'hérite PAS de la région** (décision porteur). La géographie reste pilotée par les `zones`
  explicites de l'utilisateur. → « comme Brest mais dans le Sud » est cohérent.
- **Climat NON hérité** (décision porteur) : on ne dérive pas faible_chaleur / douceur_climat de
  l'ancre. Le climat reste piloté par ce que l'utilisateur dit explicitement. → évite le conflit
  « comme Brest (doux) mais dans le Sud (chaud) ».
- **Plusieurs ancres** (« Brest ou Lorient ») → garder les traits que les ancres **PARTAGENT**
  (intersection des signatures), pas l'union. Plus honnête : « ce que ces deux-là ont en commun ».
  La taille → fourchette englobant les ancres.

### A.3 Fusion dans le ParsedProject (dans la route parse)

- Les préférences dérivées se **fondent** avec les préférences explicites.
- **L'explicite gagne sur le dérivé** (décision porteur) : « comme Brest mais une grande ville »
  → `prefere_grande_ville` explicite écrase la taille moyenne dérivée de Brest. Règle de fusion :
  pour une même `key`, garder la préférence explicite ; pour `communeSize`/taille, l'explicite
  (`sizeRelativeTo`/`communeSize`) écrase la fourchette dérivée.
- Les `zones` restent celles de l'utilisateur (l'ancre n'en produit pas).

### A.4 Transparence (voix)

- La `reformulation` **dit ce qu'elle a lu**. La partie « ancre » de la phrase est composée
  **déterministement** à partir des traits réellement dérivés (pas par le LLM, qui ne les calcule
  pas) : on l'**append** à la reformulation LLM. Ex. : « Vous aimez Brest pour son accès à la mer,
  sa vie locale et son calme. Voici des communes qui partagent cela, dans le Sud. » Les traits
  nommés == exactement ceux injectés en préférences (pas de promesse au-delà du dérivé).
- **Jamais** le mot « similaire ». **Jamais** de score affiché. Voix `/ou-vivre` (vouvoiement,
  pas de tiret cadratin, pas de « résoudre votre choix »).

### A.5 Cas limites

- **Ancre exclue du trio** : on ne propose pas Brest en réponse à « comme Brest ». Implémenté en
  **ajoutant l'ancre à `excludePlace`** dans la route parse (réutilise l'exclusion d'agglo existante
  du moteur, rien à coder côté `matchProjects`).
- **Ancre introuvable / arrondissement** (Paris/Lyon/Marseille par code commune, absents de
  l'index) : ignorer l'ancre, ne rien inventer, le dire dans la reformulation (« je n'ai pas pu
  lire {ville} ; dites-moi plutôt ce qui compte »).
- **Ancre seule** (« comme Brest ») : trio dérivé entièrement de la signature de Brest. Nominal.

## B — Phase 2 (habillage guidé, discret, NON construit en première passe)

Une fois A solide : point d'entrée **discret** sur `/ou-vivre` (pas l'accueil) : « Pas d'idée ?
Partez d'une commune que vous aimez. » Champ commune en autocomplete → afficher les **traits lus**
(« à Brest, ce qui ressort : … ») que l'utilisateur peut **retirer/ajuster** avant de lancer.
B = rendre visible et corrigeable ce que A fait déjà en coulisse. Spécifié ici, construit plus tard.

## Vérification

- **`communeToPreferences` (unitaire, déterministe)** : Brest → contient {proximite_mer, vie_locale,
  taille ≈ moyenne} ; un village rural → {nature, cadre_calme, calme_sonore} ; pas de bruit.
- **Parse (extraction)** : « comme Brest » → `communeAncre:["Brest"]` et PAS `nearPlace` ;
  « près de Brest » → `nearPlace` (non-régression) ; « comme Brest ou Lorient dans le Sud » →
  2 ancres + zone sud, **sans** Bretagne.
- **Bout en bout** : « une ville comme Brest mais dans le Sud et moins chère » → trio méditerranéen
  portant les traits de vie de Brest, ancre exclue, reformulation honnête sans « similaire ».

## Fichiers touchés

- `src/lib/comparateur-vie.ts` : type `ParsedProject` (+ `communeAncre`), `communeToPreferences`,
  résolveur nom→entrée si pas déjà exposé. `matchProjects` **inchangé**.
- `src/app/api/comparateur-vie/parse/route.ts` : champ `communeAncre` au schéma + règles SYSTEM ;
  après le LLM, résolution de l'ancre, `communeToPreferences`, fusion des préférences, ajout à
  `excludePlace`, append de la phrase d'ancre à la reformulation.
- (Phase B, plus tard) `src/app/(public)/ou-vivre/OuVivreClient.tsx` : amorce discrète.

## Décisions verrouillées (porteur)

- Intention = (c) confirmer/lire ce qu'on aime à l'ancre → proposer des lieux qui le portent.
- Forme = A (magie dans le parse) d'abord, B (guidé discret) ensuite si utile.
- Dérivation = Approche 1 (signature distinctive + faits identitaires), pas tous les points forts.
- L'ancre **n'hérite pas de la région**.
- Le **climat n'est pas hérité** de l'ancre.
- L'**explicite écrase le dérivé** en cas de conflit.
- Plusieurs ancres → **intersection** des signatures.
