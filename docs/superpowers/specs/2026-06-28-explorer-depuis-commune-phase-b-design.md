# Spec — « Explorer à partir d'une commune », Phase B (entrée guidée)

**Date** : 2026-06-28 · **Statut** : design validé, prêt pour plan d'implémentation
**Origine** : Pari #7 / § B du spec A (`2026-06-28-explorer-depuis-commune-design.md`)
**Prérequis** : Phase A livrée sur `main` (dérivation d'ancre déterministe, `matchProjects` inchangé).

## Intention

Rendre **visible et corrigeable** ce que la Phase A fait en coulisse : sur `/ou-vivre`, le
lecteur sans idée part d'**une commune qu'il aime**, voit les **traits lus**, en **retire**
ceux qu'il ne veut pas, puis lance. La sortie est le trio `/ou-vivre` habituel.

Doctrine (héritée de A, non négociable) : ANCRAGE, pas similarité ; mot « similaire » banni ;
aucun score entre communes ; **moteur inchangé** ; voix `/ou-vivre` (vouvoiement, pas de tiret
cadratin, pas de « résoudre votre choix »).

## But / Non-buts

**But** : qu'en partant d'une commune et en retirant éventuellement des traits, le lecteur
obtienne un trio porté par les traits **gardés**, honnêtement annoncé.

**Non-buts** :
- Pas d'**ajout** manuel de critères (décision porteur : option C, « retrait seul » ; ajouter =
  rôle du texte libre de la Phase A).
- **Mono-ancre** : une seule commune (le multi-ancre reste une capacité du texte libre).
- Pas de nouvelle page ni de nouveau moteur (aval `/ou-vivre` réutilisé tel quel).
- Pas sur l'accueil : uniquement l'écran idle de `/ou-vivre`.
- Pas de zone géographique en B → pas de conflit littoral/zone (`perimeterAllowsCoast` inutile ici).

## Forme retenue (décisions porteur)

- **Correction = retrait seul** (option C).
- **Placement = lien discret qui se déplie** (option A), sous les puces d'exemples de l'écran idle.

```
( exemple )  ( exemple )  ( exemple )

— ou —
Pas d'idée ? Partez d'une commune que vous aimez →
        ▼ (au clic, se déplie en place)
  [ ⌖  Saisissez une commune…            ]
  À Brest, ce qui ressort :
  (réseau de tram ✕) (vie locale ✕) (forte présence étudiante ✕)
  (bord de mer ✕) (~ taille de Brest ✕)
              [ Explorer dans cet esprit → ]
```

## Architecture — l'assemblage reste serveur

La dérivation (`deriveAnchorPreferences`) et la composition de reformulation
(`anchorReformulationSuffix`) vivent dans `comparateur-vie.ts`, en `import "server-only"` : non
importables côté client. Pour **ne pas dupliquer** la phraséologie FR ni l'assemblage du
`ParsedProject`, tout passe par **un seul endpoint**.

### Endpoint `POST /api/comparateur-vie/anchor`

**Entrée** : `{ insee: string, removedKeys?: string[] }`
**Sortie** : `{ found: boolean, nom: string, chips: { key: string; text: string }[], parsed: ParsedProject }`

Comportement :
1. `getCommuneEntry(insee)` ; si `null` (PLM par arrondissement, ou hors index) → `{ found:false, nom:"", chips:[], parsed:<vide> }`.
2. `deriveAnchorPreferences([entry])` → `AnchorDerivation { preferences, communeSize, traits:{key,text}[] }`.
3. **Retrait** : enlève les `removedKeys` des `preferences`, des `traits`, et du gabarit
   (`communeSize` retiré si `removedKeys` contient le sentinel `"__size"`).
4. **chips** = traits restants + (si `communeSize` non retiré) une puce taille
   `{ key:"__size", text:"~ taille de "+nom }`. Ordre : traits d'abord, puce taille en dernier.
5. **parsed** (assemblé serveur, prêt pour `/match`) :
   - `preferences` : préférences gardées.
   - `hardConstraints.communeSize` : le gabarit, sauf si retiré.
   - `hardConstraints.excludePlace` : `[{ label: nom }]` (l'ancre est exclue du trio).
   - `reformulation` : `anchorReformulationSuffix([nom], traitsGardés.map(t=>t.text))`.
   - `communeAncre: [{ label: nom }]` (traçabilité ; sans incidence sur le moteur).

Note : l'endpoint est **idempotent** et calcule tout à partir de `(insee, removedKeys)`. Le
client ne fait donc aucun assemblage ni aucune phrase ; il n'a qu'à afficher `chips` et, au
lancement, passer `parsed` à `/match`.

### Flux client (2 appels, aval inchangé)

1. **Sélection** d'une commune dans l'autocomplete → `POST /anchor { insee }` (removedKeys=[]) →
   afficher `chips` (retirables). Si `found:false` → message discret (cf. cas limites).
2. **Retrait** d'une puce → maj locale d'un `Set<string>` de clés retirées (aucun appel réseau).
3. **« Explorer dans cet esprit »** → `POST /anchor { insee, removedKeys:[...set] }` → on récupère
   `parsed` → `setParsed(parsed)` puis `runMatch()` : exactement le chemin post-`/parse` existant.
   Synthèse, AskFuture, sauvegarde de session : zéro changement.

`submittedText` (réutilisé pour la synthèse) = `"une ville comme " + nom`.

## Composants

### `CommuneSearch` — ajout d'un `onSelect` optionnel

Fichier : `src/components/CommuneSearch.tsx`. Ajouter une prop optionnelle
`onSelect?: (commune: { code: string; nom: string }) => void`. Dans `handleSelect`, **si
`onSelect` est fourni**, l'appeler (et fermer le menu, fixer la valeur) **au lieu** du
`router.push`. Sans la prop, comportement actuel **strictement inchangé** (territoires, chaleur,
inondation). `slug` devient optionnel quand `onSelect` est fourni (la navigation n'est pas utilisée).

### `AnchorAmorce` — l'amorce dépliante

Bloc rendu dans `OuVivreClient` sous les exemples (`phase === "idle"` seulement). États :
- `expanded: boolean` (lien → déplié).
- `selected: { code, nom } | null`, `chips`, `removed: Set<string>`, `loading`, `found`.

Rendu :
- Replié : ligne discrète « Pas d'idée ? Partez d'une commune que vous aimez → ».
- Déplié : `CommuneSearch` (avec `onSelect`), puis si `selected && found` : « À {nom}, ce qui
  ressort : » + chips retirables (puce avec un `✕`), puis bouton « Explorer dans cet esprit ».
- Voix `/ou-vivre`, `bindOrphans` sur les phrases, pas de tiret cadratin. Le bouton réutilise le
  style du bouton accent existant.

Le bloc peut être un sous-composant dans `OuVivreClient.tsx` ou un fichier
`src/app/(public)/ou-vivre/AnchorAmorce.tsx` (préféré : fichier dédié, le client est déjà à 1260
lignes). Il reçoit en props un callback `onLaunch(parsed: ParsedProject, nom: string)` que
`OuVivreClient` branche sur `setParsed` + `runMatch`.

## Cas limites

- **PLM / introuvable** (`found:false`) : message discret « Je n'ai pas pu lire cette commune ;
  décrivez plutôt ce que vous cherchez. » L'autocomplete filtre déjà les arrondissements
  (`isArrondissement`), mais Paris/Lyon/Marseille en code commune restent hors index → géré par
  `found:false`.
- **Tout retiré** : si `removed` couvre toutes les chips, bouton **désactivé** (rien à porter) ; le
  texte libre reste disponible au-dessus.
- **Commune à signature mince** (village inland, peu de traits ≥ seuil) : chips = éventuellement la
  seule puce taille ; lancement permis (trio porté par le gabarit + exclusion de l'ancre). Nominal.
- **Retrait de « bord de mer »** : retire `proximite_mer` des préférences → trio non contraint au
  littoral. **Retrait de la taille** (`__size`) : `communeSize` absent → pas de gabarit.

## Fichiers touchés

- **Create** : `src/app/api/comparateur-vie/anchor/route.ts` (endpoint).
- **Create** : `src/app/(public)/ou-vivre/AnchorAmorce.tsx` (bloc dépliant).
- **Modify** : `src/components/CommuneSearch.tsx` (prop `onSelect`, `slug` optionnel).
- **Modify** : `src/app/(public)/ou-vivre/OuVivreClient.tsx` (montre `AnchorAmorce` sous les
  exemples ; branche `onLaunch` sur `setParsed` + `runMatch` + `submittedText`).
- **Réutilisé sans modification** : `deriveAnchorPreferences`, `anchorReformulationSuffix`,
  `getCommuneEntry` (lib) ; `/api/comparateur-vie/match` ; tout l'aval (`/synthesize`, AskFuture, session).

## Vérification

Pas de framework (cohérent avec A) : route de debug + runtime sur le serveur de dev.
- **Endpoint** : `POST /anchor { insee: "<Brest>" }` → `found:true`, chips attendues (mobilité,
  vie locale, étudiant, bord de mer, taille), `parsed.hardConstraints.excludePlace=[{label:"Brest"}]`,
  reformulation sans « similaire ».
- **Retrait** : `removedKeys:["proximite_mer"]` → plus de `proximite_mer` dans `parsed.preferences`
  ni dans `chips` ni dans la reformulation. `removedKeys:["__size"]` → `parsed.hardConstraints.communeSize`
  absent.
- **PLM** : insee d'un arrondissement / code commune Paris → `found:false`.
- **Bout-en-bout UI** : déplier l'amorce, choisir Brest, retirer « bord de mer », lancer → trio
  non côtier porté par les traits gardés (mêmes résultats que le chemin texte « une ville comme
  Brest » moins la mer), aval (synthèse, AskFuture) fonctionnel.

## Décisions verrouillées (porteur)

- Correction = **retrait seul** (C), pas d'ajout manuel.
- Placement = **lien discret dépliant** (A), sous les exemples, écran idle de `/ou-vivre`.
- **Mono-ancre**.
- Assemblage **serveur** (endpoint unique `/anchor`), pas de duplication client de la phraséologie.
- Gabarit de taille = **filtre dur** (décision A confirmée), retirable par l'utilisateur en B.
