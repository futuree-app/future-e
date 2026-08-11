# Sprint de confiance pré-bêta : dossier de revue

> Écrit pour être relu par quelqu'un qui n'a pas suivi la soirée. Il porte **dix-sept commits**,
> dont trois déjà en production et **quatorze non poussés**. Chaque étape dit ce qu'elle garantit,
> ce qu'elle ne garantit pas, et où je soupçonne mon propre travail.
>
> Le contexte : la vente à quelques proches doit avoir lieu avant le 20/08 (activité conservée au
> CSP). Objectif du sprint : qu'un testeur ne rencontre aucune affirmation ni aucune preuve
> trompeuse. Le cap de fond est dans `docs/vault/vision/objet-central-dossier-de-decision.md`.

## Vérifier l'ensemble

```bash
git log --oneline 243d1bb..HEAD
npx tsc --noEmit
node --test $(find src -name "*.test.ts" -o -name "*.test.tsx" | tr '\n' ' ')   # 1344 tests
npm run build
```

État au moment d'écrire : `tsc` exit 0, **1344 tests, 0 échec**, build exit 0.

---

## Ce qui est DÉJÀ EN PRODUCTION (poussé hier soir)

| Commit | Ce qu'il corrige |
|---|---|
| `08d6d44` | Le verdict annonçait « trois points » en comptant une matérialité que rien à l'écran ne permet de dénombrer. Il compte désormais les contrôles que la minute montre, et dit combien figurent plus bas. |
| `32a2861` | L'artefact était figé au webhook avec `savedDpe: null` ; le diagnostic choisi ensuite n'entrait dans aucune décision. `artefactPerimeParLeDpe` compare la date du choix à celle du figement et produit une version 2. |
| `f0ed8b1` | Deux promesses d'export PDF au présent sur `/professionnels`. |

Hors code : `RESEND_API_KEY` et `FUTUREE_ADMIN_EMAILS` posées en production. Sans elles, le webhook
Stripe levait **avant** d'écrire le dossier : paiement encaissé, rien livré.

---

## Étape 1 : les narrations libres

### `3b9b345` — l'altitude sort du payload

Le prompt interdisait en toutes lettres d'en tirer un signal, et le payload la transmettait quand
même. **Trois synthèses stockées sur trois** portaient la déduction interdite. Textes exacts :
`docs/audits/2026-08-11-syntheses-logement-fautives.md`.

- **Garantit** : deux des trois fautes deviennent structurellement impossibles, le modèle ne
  recevant plus la donnée.
- **Ne garantit pas** : la faute de Nantes (« l'adresse ne porte aucune exposition ») vient d'un
  payload correct.
- **Effet de bord assumé** : `buildFactHash` dérive du payload, donc les synthèses en cache se
  régénèrent.

### `b268d8c` puis `1c495ef` — le validateur qui refuse

Le verrou ne se posait que si une dimension manquait ; un dossier entièrement lu partait en
streaming, sans aucun contrôle. Et au second échec, le texte **passait**.

- **Garantit** : contrôle sur tous les chemins, refus au second échec (422, message dédié, rien de
  persisté), streaming retiré parce qu'une prose ne se vérifie pas après avoir été lue.
- `1c495ef` corrige trois défauts trouvés en revue : le désamorçage lisait une fenêtre de caractères
  (une phrase honnête couvrait la fautive), « rue de la Digue » était refusée comme protection, et
  **le cache contournait entièrement le contrôle**.
- **Orchestration testable** : `lib/synthesis-run.ts`, sept tests, dont « un fournisseur muet APRÈS
  un refus reste un refus ».
- **Ne garantit pas** : le filet est une liste de motifs. Une causalité inventée qu'aucun motif ne
  décrit passe. `synthesize-quartier` et Territoire n'ont **toujours aucun** contrôle d'assertions.
- **À surveiller** : le taux de refus est inconnu. Les logs portent la famille et le nombre d'essais,
  jamais le texte.

---

## Étape 2 : la chaîne de preuve

### `f73ecd0`, `ca99e58`, `8dce4dd` — la source d'une preuve

`logement-rules.ts` posait `label: l.addressLabel` : « Données et limites » affichait cinq fois
« Source : 29 Rue de l'Evescot 17000 La Rochelle ». L'adresse est ce qu'on examine.

Les trois commits se corrigent l'un l'autre, sous revue :

1. attribution par famille, mais sous le mot « producteur » ;
2. le mot retiré (une chaîne d'accès compte jusqu'à quatre acteurs), la CCR rétablie, l'IGN requalifié
   en opérateur d'API Carto ;
3. « 1995-2021 » est la **période couverte**, pas le millésime (mise à jour 2025) ; la sinistralité
   cesse de se déclarer `live_fetch` alors qu'elle est lue dans des JSON du dépôt.

- **Garantit** : les huit règles du module portent un libellé exact, **recopié à la main dans le
  test** (l'importer rendait le test circulaire).
- **Ne garantit pas** : la source d'une preuve **portant une valeur** reste invisible (`factSources`
  exclut les références à `observedValue`). La carte DPE n'affiche donc aucune provenance. Corriger
  en une ligne exposerait les libellés vagues du Territoire (« Territoire · Toulouse ») : la bonne
  séquence est d'ajouter un champ de provenance distinct de `label`, puis de migrer les deux modules.
- **Perdu** : `fetchedAt` et `observedAt` existent et ne sont renseignés nulle part ; le millésime
  ONRN vit dans le libellé, contournement assumé.

### `4fce2b3`, `9b71b2d`, `20d55f7`, `b7af782` — le lien qui doit démontrer

Une pastille portait deux affirmations (« exposition élevée · 7 arrêtés »), et son lien menait à une
carte qui n'en démontrait aucune.

1. **`4fce2b3`** scinde. Le compte vise la carte « Mémoire des catastrophes » par une clé nouvelle
   `risk.catnat` ; l'exposition perd sa valeur, « élevée » venant d'un seuil interne.
2. **`9b71b2d`** : les deux comptes ne se superposaient pas (inondation/index contre tous
   risques/direct).
3. **`20d55f7`** : trois défauts de mon propre correctif, dont une **régression** (la référence sans
   valeur rendait « Source : Territoire · La Rochelle » en perdant son lien) et un harnais mort.
4. **`b7af782`** : l'objet partagé. `catnat-evidence.ts` porte la fabrique et les libellés ; la règle
   et la carte les consomment. Le sous-titre de la carte affiche la phrase de la pastille, mot pour
   mot, sans ouvrir de volet.

- **Garantit** : trois verrous. Un test relie les deux mondes que rien ne fait se rencontrer ; un
  second interdit d'écrire la phrase ailleurs dans `src/` en lisant les sources ; le troisième laisse
  ce droit aux tests, parce que recopier une sortie éditoriale est ce qui la fige.
- **Ne garantit pas** : le volet ne s'ouvre pas automatiquement sur la ligne visée, et le total tous
  risques reste le titre de la carte. En cas de panne GASPAR, la carte affiche « — » pendant que la
  pastille garde son chiffre : **ce cas n'est pas traité**.

### `a246b71` — un indice interne n'est plus une preuve

« 80/100 » s'affichait en pastille dans le compromis transport × chaleur. Le même geste avait été
retiré à l'inondation deux mois plus tôt, sans garde pour l'empêcher de revenir.

- **Garantit** : `assertFactValid` refuse toute référence `scores.*` portant une valeur visible, pour
  toutes les règles, présentes et futures.
- **Choix assumé** : aucune mesure de remplacement n'est inventée. Les mesures DRIAS existent mais ne
  sont pas portées par cette règle, et une distance à la gare ne démontre pas une desserte.

---

## Étape 3 : la capitalisation

`d438b23`, `faa1224`, `cfff9a4` portent la thèse des audits dans le vault
(`vision/objet-central-dossier-de-decision.md`) : l'objet central, les quatre niveaux avec leurs
cardinalités, « un prompt n'est pas une frontière de sûreté », la distinction intégrité/conversion,
huit invariants vérifiables, l'ordre du prochain chantier, et deux paris nouveaux au registre.

---

## Ce que je soumets en priorité au relecteur

1. **Le cas de la panne GASPAR** : pastille chiffrée pointant vers une carte en « — ». Identifié, non
   traité.
2. **La source invisible quand la preuve porte une valeur** : le défaut le plus large de la chaîne,
   reporté pour une raison de séquence.
3. **`synthesize-quartier` et Territoire sans aucun garde-fou d'assertions**, alors que la même faute
   y est possible.
4. **Le taux de refus des synthèses**, inconnu, mesurable seulement en production.
5. **Rien n'a été vu dans un navigateur**, sur aucune des dix-sept étapes.
6. **`sub` de la carte CatNat** : j'y ai mis la phrase partagée et fait descendre la répartition
   dominante. C'est un arbitrage d'affichage que personne n'a validé à l'écran.
