# Exclusion ville générique + taille relative (UU INSEE)

Date : 2026-06-03
Statut : design validé, prêt pour plan d'implémentation
Roadmap : item #4 (V1 = A + B ; C différé)

## Contexte

Constat QA externe (Cowork), deux failles du comparateur :
- « quitter Lyon / Bordeaux / Lille » ne filtre RIEN. Les exclusions résolvent des jetons de
  zone fermés (`geo-zones.ts`, `resolveExclusions`) ; seuls `paris` / `idf` existent dans
  `EXCLUSION_EXTRA`. Une ville hors liste → jeton inconnu → ignoré.
- la taille est la population BRUTE de la commune (`communeSize {min,max}`, filtre dur lignes
  ~709-710 de `comparateur-vie.ts`), d'où « Saint-Jacques-de-la-Lande (banlieue de Rennes)
  traitée comme petite ».

Les trois sous-problèmes du #4 (exclusion de ville, taille relative, commune-vs-agglo)
convergent sur une donnée manquante : l'unité urbaine (UU2020) par commune.

## Décisions validées (porteur)

V1 = **A + B**, **C différé** :
- **A. Exclusion de ville** par UNITÉ URBAINE INSEE : « quitter Lyon » exclut toutes les
  communes de l'UU de Lyon (Villeurbanne, Vénissieux…), pas le département, pas seulement la
  commune-centre.
- **B. Taille relative** : « plus petit / plus grand que {ville} » filtre par taille, relative
  à la ville citée. **Comparaison sur population COMMUNALE** (réf et candidat). Limite V1
  assumée et documentée (voir plus bas).
- **C différé** : on ne modifie PAS encore la sémantique « petite ville / calme / isolé » pour
  l'asseoir sur l'agglo. La donnée UU posée ici en sera la fondation.
- « quitter Paris » reste sur le cas spécial existant (`EXCLUSION_EXTRA.paris` = petite
  couronne curatée 75/92/93/94), plus fin que l'UU de Paris (~400 communes). Paris reste
  l'exception assumée.

### Limite V1 de B (à documenter dans le code)

> « plus petit que Lyon » filtre sur la taille COMMUNALE, pas encore sur la taille
> d'AGGLOMÉRATION. Une commune périphérique d'une autre métropole peut donc encore passer.
> Sera corrigé au chantier C, quand l'unité urbaine pilotera la sémantique petite ville /
> calme / isolé.

## Architecture

```
Table d'appartenance INSEE (commune → UU2020), petit fichier
        │  scripts/populate-unite-urbaine.mjs  (nouveau)
        │  patche l'index : c.uu = "<code UU2020>" | null (null = hors unité urbaine)
        ▼
data/comparateur-index.json
        │  loadIndex() (inchangé) ; nameIndex() (label ville → commune) déjà existant
        ▼
comparateur-vie.ts
   A. excludePlace : label → commune (nameIndex) → son uu → exclure toutes les communes
      de ce uu (ou la seule commune si hors-UU). Robuste aux labels inconnus.
   B. sizeRelativeTo : label → population communale de référence → pose communeSize.max
      (smaller) ou .min (larger). Filtre candidat = population communale (mécanisme existant).
        ▲
parse/route.ts
   hardConstraints.excludePlace?: { label }[]            ← « quitter / fuir {ville} »
   hardConstraints.sizeRelativeTo?: { label, direction } ← « plus petit / grand que {ville} »
   (le parse n'émet QUE le label ; le moteur résout population/UU. « quitter Paris » → excludeZones)
        │
        ▼
outcome / appliedZones → « exclusion de l'agglomération de Lyon », « communes plus petites
   que Bordeaux » (gate + contexte périmètre transmis à synthèse / AskFuture)
```

## 1. Données — `scripts/populate-unite-urbaine.mjs`

- Source : table d'appartenance géographique des communes INSEE (commune → UU2020 + libellés).
  URL/format exacts confirmés au plan (comme pour BPE24). Petit fichier (~35k lignes).
- Patche `comparateur-index.json` : `c.uu = "<code UU2020>"` par commune ; `null` si la commune
  est hors unité urbaine (code sentinelle INSEE, souvent `"00000"`, normalisé en `null`).
- On ne stocke QUE le code UU. Pas de population d'UU (inutile pour A+B). Le libellé d'agglo à
  l'affichage vient du nom de ville tapé par l'utilisateur, pas de la table.

## 2. Moteur — `comparateur-vie.ts`

- Type `IndexCommune` : ajouter `uu?: string | null`.
- Type `HardConstraints` : ajouter
  - `excludePlace?: { label: string }[]`
  - `sizeRelativeTo?: { label: string; direction: "smaller" | "larger" } | null`
- **A. Exclusion par UU** (dans `matchProjects`, à la résolution des contraintes dures) :
  pour chaque `excludePlace.label`, résoudre via `nameIndex()` → commune → `uu`. Construire
  l'ensemble des codes UU à exclure. Filtrer : une commune candidate est exclue si son `uu`
  non nul est dans cet ensemble. Si la ville de référence est hors-UU, exclure seulement sa
  commune (par INSEE). Labels non résolus : ignorés + signalés (comme `unknown` des zones).
- **B. Taille relative** : pour `sizeRelativeTo`, résoudre `label → population` de la commune
  de référence via `nameIndex()`. `direction:"smaller"` → `communeSize.max = popRef` ;
  `"larger"` → `communeSize.min = popRef`. Réutilise le filtre `communeSize` existant
  (lignes ~709-710). Si déjà un `communeSize` explicite, prendre le plus contraignant
  (min le plus haut, max le plus bas). Label non résolu : ignoré + signalé.
- Garde-fous doctrine : aucune pénalité de score (ce sont des filtres durs explicites,
  voulus par l'utilisateur) ; on ne pénalise jamais le rural par défaut (rien ne s'active
  sans expression).

## 3. Parse — `parse/route.ts`

- Schéma : ajouter `excludePlace` (array d'objets `{ label }`) et `sizeRelativeTo`
  (`{ label, direction: "smaller"|"larger" }`) à `hardConstraints`.
- Prompt :
  - « quitter / fuir / ne plus vivre à / partir de {VILLE} » → `excludePlace:[{label:"{VILLE}"}]`,
    SAUF Paris / région parisienne qui restent `excludeZones:["paris"|"idf"]` (cas spécial).
  - « plus petit que {VILLE} », « pas plus grand que {VILLE} », « une ville plus petite que
    {VILLE} » → `sizeRelativeTo:{label:"{VILLE}", direction:"smaller"}` ; « plus grand que
    {VILLE} » → `direction:"larger"`.
  - Le parse fournit le LABEL brut de la ville, jamais une population ni un code. Le moteur
    résout. Ne pas confondre avec `nearPlace` (proximité positive) ni une ancre de zone.

## 4. Affichage / outcome

- `outcome` (et `appliedZones` ou équivalent) doit refléter en clair les contraintes
  appliquées : « exclusion de l'agglomération de Lyon », « communes plus petites que
  Bordeaux ». Surfacé au gate et transmis comme contexte de périmètre à synthèse / AskFuture
  (cohérent avec la doctrine périmètre existante : un cadre CHOISI, jamais une limite subie).
- Si un `excludePlace` ou `sizeRelativeTo` ne résout pas (ville inconnue), ne rien afficher
  pour lui (et ne pas filtrer) : pas de message d'erreur trompeur.

## 5. Vérification (pas de runner de test, cf. AGENTS.md)

1. `npx tsc --noEmit` + `npm run lint` (fichiers touchés propres).
2. Exécuter `populate-unite-urbaine.mjs` puis contrôler témoins :
   - Lyon (69123) → un code UU ; Villeurbanne / Vénissieux partagent ce code ;
   - une petite ville isolée (ex. Mende) → `uu` null ou code d'UU mono-commune ;
   - compter les communes avec `uu` non nul (proche du nombre de communes urbaines INSEE).
3. `curl /parse` :
   - « je veux quitter Lyon, idéalement plus petit que Lyon » → `excludePlace:[{label:"Lyon"}]`
     + `sizeRelativeTo:{label:"Lyon",direction:"smaller"}` ;
   - « quitter Paris » → reste `excludeZones:["paris"]` (pas `excludePlace`) ;
   - « plus grand que Niort » → `sizeRelativeTo:{label:"Niort",direction:"larger"}`.
4. `curl /match` :
   - exclusion Lyon : vérifier que Lyon, Villeurbanne, Vénissieux n'apparaissent pas, mais
     qu'une ville indépendante hors UU de Lyon reste éligible ;
   - taille « plus petit que Lyon » : aucune commune de population communale > Lyon ;
   - ville inconnue (« quitter Trifouillis ») : aucune erreur, aucun filtre appliqué.

## Hors périmètre (différé)

- **C** : sémantique « petite ville / calme / isolé » asseyée sur l'agglo (cadre_calme,
  eviter_isolement, communeSize agglo-aware). Réutilisera `c.uu` + population d'UU.
- Taille relative B sur taille d'AGGLOMÉRATION (relève de C).
- Aire d'attraction des villes (AAV) comme grain alternatif.
- Unifier « quitter Paris » avec le mécanisme UU (Paris reste le cas curaté petite couronne).
