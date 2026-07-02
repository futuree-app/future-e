# Face 2 du module Logement : matérialité assurantielle passée (sinistralité ONRN)

> Spec de design, 2026-07-03. Branche le premier bloc de la **Face 2** (risques du bâti /
> financier) du module Logement : la **gravité en euros du passé assurantiel** pour deux
> périls, **sécheresse (RGA)** et **inondation (tous types)**, à partir des indicateurs ONRN
> (coût moyen + fréquence), gatés par la représentativité communale.
>
> Doctrine amont : `docs/vault/modules/logement.md`, `/memory/project_module_logement.md`,
> et les deux rapports Data Curator du 2026-07-02
> (`data-curator/2026-07-02-sinistralite-onrn-ccr.md` = doctrine d'usage,
> `2026-07-02-fix-csv-secheresse-onrn.md` = correction de la donnée sécheresse).

## Problème / valeur

Rien dans tout l'inventaire risques de futur•e ne dit ce qu'un aléa a **coûté**. GASPAR dit
« N arrêtés CatNat », le RGA Géorisques dit une classe d'exposition, les scores inondation/
submersion disent l'aléa. Aucun ne dit la **matérialité en euros** des sinistres réellement
indemnisés. C'est exactement ce que portent les indicateurs ONRN **coût moyen** et
**fréquence** : ils distinguent la commune aux 12 arrêtés sans dégâts notables de celle aux
5 arrêtés où les biens ont réellement fissuré / été inondés et coûté cher. Pour un ménage qui
achète, c'est décisionnel (pondérer, provisionner des travaux, poser les bonnes questions au
vendeur). C'est le grain « matérialité » qui fonde la Face 4 (assurance documentée).

## Périmètre

**Intègre :** coût moyen + fréquence, pour **sécheresse (RGA)** et **inondation (tous types :
coulée de boue, remontée de nappe, submersion marine)**, à l'échelle **commune**, en
**classes verbatim**, **gaté** par la représentativité communale.

**Exclut (doctrine Data Curator, ne pas revenir dessus) :**
- **S/P (sinistres/primes)** : dénominateur non ventilé par péril, inférence assurantielle
  individuelle indéfendable. Jamais surfacé côté lecteur.
- **Reconnaissances (Reco_*)** : doublon pur de GASPAR/CatNat déjà en place.
- **Coût cumulé / par habitant / par TRI** : taille-dépendants, redondants.
- **Tout scoring `/ou-vivre`**, toute **tendance inter-millésimes**, tout **chiffre inventé**
  au milieu d'une classe.
- **DOM** (absents des fichiers), **arrondissements PLM** (Paris/Lyon/Marseille = 1 ligne).

## Données (dé-risquées le 2026-07-03)

Deux jeux ONRN Géorisques, millésime 2025, période **1995-2021**, 34 839 communes métropole.

| Péril | Fichiers source | État |
|---|---|---|
| Sécheresse | `ONRN_CoutMoyen_SECH_9521.xlsx` (+ Représentativité), `ONRN_Frequence_SECH_9521.xlsx` | **corrigé** (coût désaligné, reconstruit 100 %, cf. rapport fix). Consolidé : `data/source/onrn/onrn_secheresse_consolide.json`. |
| Inondation | `ONRN_CoutMoyen_INON_9521.xlsx` (+ Représentativité), `ONRN_Frequence_INON_9521.xlsx` | **sain** (coût⟺représentativité = 100,000 %, aucune corruption). Re-téléchargé + consolidé le 2026-07-03 (script `consolider-inondation.py`). |

**Classes (identiques aux deux périls) :**
- `cout_moyen` ∈ { `Pas de sinistre répertorié à CCR`, `Entre 0 et 2,5 k€`, `Entre 2,5 et 5 k€`,
  `Entre 5 et 10 k€`, `Entre 10 et 20k€`, `Plus de 20 k€` }
- `frequence` ∈ { `Pas de sinistre ou de risque répertoriés à CCR`, `Entre 0 et 1 ‰`,
  `Entre 1 et 2 ‰`, `Entre 2 et 5 ‰`, `Entre 5 et 10 ‰`, `Plus de 10 ‰` }
- `representativite` ∈ { `Pas de sinistre répertorié à CCR`, `< 15%`, `Entre 15 et 30%`,
  `Entre 30 et 50%`, `> 50%` }

**Couverture du gate** (représentativité ≥ `Entre 30 et 50%`) : sécheresse **29,7 %** des
communes (10 359), inondation **40,7 %** (14 187). Ailleurs : silence soigné.

### Fichiers runtime produits

Deux JSON **allégés** (sans le champ `nom`, l'adresse le fournit), keyés par INSEE :
`data/onrn-secheresse.json`, `data/onrn-inondation.json`, forme :

```json
{ "31555": { "c": "Entre 10 et 20k€", "f": "Entre 2 et 5 ‰", "r": "> 50%" } }
```

Les artefacts d'audit (xlsx bruts, JSON consolidés avec `nom`, scripts `reconstruire-*.py` /
`consolider-inondation.py`) restent dans `data/source/onrn/` (reproductibilité, convention
`_README` des rapports).

## Logique de gating (par péril, indépendante)

Ordre d'évaluation pour un INSEE donné :

1. **Commune absente du jeu** (107 fusions 2021→courant, ou hors métropole) → état `indispo`.
2. `representativite === "Pas de sinistre répertorié à CCR"` (⟺ coût = même valeur, couplage
   100 %) → état `aucun` (« aucun sinistre répertorié »).
3. `representativite ∈ { "< 15%", "Entre 15 et 30%" }` → état `faible_repr` (échantillon trop
   mince).
4. `representativite ∈ { "Entre 30 et 50%", "> 50%" }` → état `lecture` (récit gaté complet).

Le mapping **INSEE 2021 → courant** pour les 107 communes fusionnées n'est **pas** codé en v1
(ambigu pour les fusions : quel ancien code pour la nouvelle commune ?). Ces communes tombent
en `indispo`. Limite documentée, réouvrable.

## Rédaction (draft — passe Editorial Writer avant commit)

Placeholders `[COUT]`, `[FREQ]`, `[REPR]` = classes **verbatim**.

**État `lecture` (sécheresse) :**
> Sur 1995-2021, les sinistres sécheresse (retrait-gonflement des argiles) indemnisés au titre
> des catastrophes naturelles ont eu, pour les biens assurés de cette commune, un coût moyen de
> **[COUT]** et une fréquence de **[FREQ]**. Échantillon des assureurs (CCR) couvrant ici
> **[REPR]** du marché.

**État `lecture` (inondation)** : idem, « les sinistres inondation (tous types : coulée de
boue, remontée de nappe, submersion marine) ».

**État `aucun` :**
> Aucun sinistre CatNat [sécheresse / inondation] répertorié par la CCR pour les biens assurés
> de cette commune sur 1995-2021. L'échantillon couvre environ la moitié du marché : un
> historique vide n'exclut pas une exposition future.

**État `faible_repr` :**
> Des sinistres [péril] sont répertoriés, mais l'échantillon assurantiel local est trop mince
> (représentativité **[REPR]**) pour en tirer une lecture fiable.

**État `indispo`** : la ligne du péril n'est pas rendue (pas de bruit), sauf si les DEUX périls
sont `indispo` → une ligne unique « Données de sinistralité indisponibles pour cette commune
(référentiel INSEE 2021) ».

**Pédagogie CatNat (sous le bloc, 2 phrases) :**
> Le régime CatNat finance ces indemnisations par une surprime légale, aujourd'hui **uniforme
> au niveau national** (portée à 20 % au 1ᵉʳ janvier 2025) : ce passé local ne fixe donc pas le
> prix de votre assurance. Un débat en cours (rapport Langreney) pose la question d'une
> modulation selon l'exposition locale.

**Attribution (pied du bloc)** : « ONRN (État / CCR / Mission Risques Naturels), via Géorisques
— sinistres indemnisés 1995-2021, biens assurés particuliers et professionnels. »

## Garde-fous éditoriaux (invariants, gravés dans le composant)

- Classe **verbatim**, jamais un chiffre au milieu.
- « les **biens assurés** de cette commune », jamais « les maisons d'ici » (périmètre inclut
  les professionnels).
- « **répertorié** », jamais « aucun sinistre » sec.
- Aucune inférence future individuelle (« vous serez surprimé / refusé », « votre maison
  fissurera »).
- Aucune tendance inter-millésimes, aucun scoring.
- Toujours nommer l'échelle (commune) et la période (1995-2021).

## Architecture

Découpage en unités à responsabilité unique, calqué sur `src/lib/baignade.ts`.

### 1. `src/lib/onrn-sinistralite.ts` (nouveau)
- Charge paresseusement les deux JSON runtime (cache module-scope, `fs.readFile`,
  `path.join(process.cwd(), "data", …)`, try/catch → vide si absent).
- Types :
  ```ts
  type OnrnClasses = { cout: string; frequence: string; representativite: string };
  type PerilState =
    | { kind: "lecture"; cout: string; frequence: string; representativite: string }
    | { kind: "aucun" }
    | { kind: "faible_repr"; representativite: string }
    | { kind: "indispo" };
  type OnrnSinistralite = { secheresse: PerilState; inondation: PerilState };
  ```
- `getOnrnSinistralite(insee: string): Promise<OnrnSinistralite>` : encapsule TOUT le gating
  (la fonction pure `classify(classes | undefined): PerilState`). Le rendu ne voit jamais une
  classe brute non gatée.

### 2. Câblage API — `src/app/api/georisques-logement/route.ts`
- Ajouter `getOnrnSinistralite(address.citycode)` au `Promise.all` existant (source locale, pas
  d'appel réseau, `.catch(() => null)`).
- Ajouter `sinistralite` au payload JSON.

### 3. Rendu — `src/components/report/LogementModule.tsx`
- Étendre le type `ApiResponse` avec `sinistralite`.
- Nouveau composant `SinistraliteBlock` (dans le fichier, comme `PropertyPassport`).
- Monté en **section sœur DISTINCTE juste après « Risques du bâti »** (choix porteur), même
  gabarit `SectionLabel` + carte. **Condition de rendu** : le bloc s'affiche dès qu'au moins un
  péril n'est pas `indispo`. L'état `aucun` EST rendu (il est informatif : « aucun sinistre
  répertorié » est une lecture, pas un vide). Le bloc entier n'est masqué que si les deux
  périls sont `indispo` (commune hors jeu / fusionnée).

### 4. Déploiement — `next.config.ts`
- Ajouter à `outputFileTracingIncludes`, clé `"/api/georisques-logement"` :
  `["./data/onrn-secheresse.json", "./data/onrn-inondation.json"]` (sinon : marche en local,
  fichiers introuvables en prod serverless).

### 5. Script de génération runtime
- `data/source/onrn/build-runtime-json.py` : lit les deux JSON consolidés, retire `nom`,
  écrit `data/onrn-secheresse.json` + `data/onrn-inondation.json`. Re-exécutable.

## Flux de données

`adresse` → BAN `citycode` → `getOnrnSinistralite(citycode)` (lib, cache mémoire) →
`classify` par péril → `sinistralite` dans le payload → `SinistraliteBlock` rend l'état de
chaque péril. Aucune donnée ne transite non gatée jusqu'au rendu.

## Tests / vérification

- **Unité (gating)** : `classify` sur les 5 classes de représentativité + absence → 4 états
  attendus ; couplage `aucun` cohérent coût/représentativité.
- **Intégration** : 3 adresses réelles couvrant les états — une commune argileuse à forte
  représentativité sécheresse (état `lecture`), une commune littorale/inondable (`lecture`
  inondation), une commune sans sinistre (`aucun`). Vérifier le rendu au navigateur
  (méthode déjà en place : route dev jetable + chrome-headless-shell, cf. session).
- **Garde-fous** : grep du composant rendu — aucune occurrence de « votre maison », « vous
  serez », d'un « € » hors classe verbatim, présence de l'attribution ONRN et de « 1995-2021 ».

## Fichiers touchés

- **Nouveau** `src/lib/onrn-sinistralite.ts`
- **Nouveau** `data/onrn-secheresse.json`, `data/onrn-inondation.json` (runtime lean)
- **Nouveau** `data/source/onrn/onrn_inondation_consolide.json` + xlsx bruts INON +
  `consolider-inondation.py` + `build-runtime-json.py` (audit)
- **Modifié** `src/app/api/georisques-logement/route.ts`
- **Modifié** `src/components/report/LogementModule.tsx`
- **Modifié** `next.config.ts`
- **Modifié** `docs/vault/modules/logement.md` (Face 2 : « branchée sécheresse+inondation »),
  `docs/vault/recherches/inventaire-sources.md` (ONRN inondation ligne active),
  `docs/vault/paris.md` (pari #9 : donnée branchée), `/memory/project_module_logement.md`.

## Différé / hors périmètre (documenté, pas oublié)

- **Mapping INSEE 2021 → courant** (107 communes fusionnées) : état `indispo` en v1.
- **Passe Editorial Writer** sur la rédaction avant commit.
- **Harmonisation visuelle** (3e coupe Design Critic, `.glass` sur les cartes détail) : chantier
  séparé.
- **Face 4 (assurance)** : ce bloc en est la graine ; la pédagogie CatNat pose le pont.
- **Millésime 2026** : re-vérifier la stabilité des classes avant reconduction (le producteur
  prévient qu'elles bougent).
