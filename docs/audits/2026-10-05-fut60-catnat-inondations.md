# FUT-60 : la contradiction sur les arrêtés d'inondation dans Territoire (05/10/2026)

## 1. Symptôme

Sur un dossier parisien (audit du 03/10), le module Territoire disait « reconnue 20 fois… surtout au
titre de : inondations » puis « dont 0 arrêté inondation depuis 1982 ».

## 2. Cas reproduit

- **Paris** (adresse dans un arrondissement, Territoire lu sur 75056).
- **Relevé direct GASPAR** sur 75056 : 20 lignes. La répartition donne Inondations 16, puis Sécheresse,
  Mouvements de terrain, Tempête et Grêle (1 chacun). Première reconnaissance : 1983.
- **Index** (`data/comparateur-index.json.gz`) sur 75111 : `inondation.catnat = 0`, `risque = 1`.
- **Chaîne** :
  - le dossier est généré à l'adresse (75111) ;
  - `moduleFacts.catnatInondation = 0` est figé dans l'artefact `{count: 0, insee: "75056", version: "catnat-1"}` ;
  - la page Territoire affiche ce compte figé sous le total direct ;
  - d'où « 20 … surtout inondations » au-dessus de « dont 0 ».

## 3. Source

Un seul fournisseur et un seul jeu : Géorisques `/api/v1/gaspar/catnat?code_insee=…`.

- **Catégorie** : `libelle_risque_jo`.
- **Dates** : `date_debut_evt` et `date_fin_evt` (événement), `date_publication_arrete`, `date_publication_jo`.
- **Commune** : `code_insee`.
- **Arrêté** : `code_national_catnat`.
- **Période** : toute l'histoire du régime (loi du 13/07/1982).

**Grain** : GASPAR ne connaît Paris, Lyon et Marseille qu'au code de la commune. 75111 et 75115
renvoient 0 ligne, 75056 en renvoie 20. `/gaspar/risques` a le même grain (75056 recense
l'inondation, 75111 ne répond rien). Le zonage sismique a le grain inverse (voir §12).

## 4. Taxonomie

Libellés réels relevés sur 13 communes (Paris, Lyon, Marseille, Brest, Nice, Nîmes, Toulouse,
Bordeaux, Chamonix, Châtelaillon, La Faute-sur-Mer, Attignat, Ornex) :

| Libellé source | Index (`is_flood`, Python) | Relevé direct (`simplifyCatnatRisk`) | Où |
|---|---|---|---|
| Inondations et/ou Coulées de Boue | inondation | Inondations | index, carte, synthèse |
| Inondations Remontée Nappe | inondation | Inondations | idem |
| Chocs Mécaniques liés à l'action des Vagues | exclu | Chocs liés aux vagues | idem |
| Sécheresse | non | Sécheresse des sols | carte, synthèse |
| Mouvement de Terrain / Glissement de Terrain | non | Mouvements de terrain | idem |
| Tempête, Grêle, Poids de la Neige, Avalanche, Secousse Sismique | non | leur famille | idem |

Sur ces libellés, les deux classifieurs concordent. **La taxonomie n'est pas la cause.**

## 5. Périodes

| Métrique | Début affiché | Fin | Données |
|---|---|---|---|
| Total direct (« 20 arrêtés depuis 1983 ») | année de la 1re reconnaissance | relevé du jour | complètes |
| Synthèse (« reconnue 20 fois depuis 1983 ») | idem | idem | idem |
| Compte inondation (« dont 16 depuis 1982 ») | origine du régime | date de l'index | complètes |

- Les données couvrent la même histoire ; seul le « depuis » différait.
- Après correction, les trois disent « depuis 1982 », et l'année de la première reconnaissance reste dans le volet.

## 6. Unité de comptage

- **Une ligne GASPAR** = un arrêté × un phénomène × un événement, pour une commune.
- **Les deux chemins comptent des lignes**, sans déduplication :
  - Paris : 20 lignes pour 16 arrêtés distincts ;
  - Nice : 83 lignes pour 57 arrêtés.
- **Exemples de lignes multiples** :
  - `INTE1831446A` couvre deux événements (2017 et 2018) ;
  - `NOR19830910` couvre inondation, tempête et grêle d'un même événement.
- **Les deux compteurs sont donc comparables entre eux.** Le mot « arrêté » est inexact (voir §12).

## 7. Cause racine

**Grain de la source.** `scripts/populate-inondation.py` (retiré, voir §13) interrogeait GASPAR avec le code de chaque
entrée de l'index. Or l'index stocke Paris, Lyon et Marseille par arrondissement.

- **Effet** : 45 arrondissements à `catnat: 0, risque: 1`, c'est-à-dire faussement parmi les communes les moins
  exposées de France.
- **Portée** :
  - la phrase du dossier ;
  - la règle de décision « exposition à l'inondation », qui concluait « exposition non notable » ;
  - le critère « faible risque inondation » du comparateur ;
  - la preuve figée.

Pages publiques : `getGasparCatnatSummary(<arrondissement>)` avait le même défaut, ainsi que `/gaspar/risques`.

## 8. Règle canonique

- **Grain** : un compte CatNat se lit au grain de GASPAR, la commune. Un arrondissement porte le
  compte de sa commune (`communeParent`).
- **Unité** : la ligne GASPAR, la même partout.
- **Période** : depuis 1982, la même partout.
- **Groupe « inondation »** : `Inondations et/ou Coulées de Boue` et `Inondations Remontée Nappe`. Les
  chocs mécaniques des vagues sont exclus, comme les autres phénomènes.
- **Dominante** : un aléa « domine » à partir de 55 % des reconnaissances. Ce seuil est celui du résumé
  existant, désormais partagé par la carte et la synthèse. En dessous, aucun « surtout » ; une égalité se
  dit comme telle.

## 9. Correction

1. **Source** : la collecte (§13) et `georisques.ts` interrogent `codeGaspar(insee)`, table propre à
   GASPAR, et non un helper PLM général (le zonage sismique fait l'inverse), pour
   `/gaspar/catnat` et `/gaspar/risques`.
2. **Données** : les 45 arrondissements de l'index reçoivent le compte de leur commune (relevé du
   05/10 : Paris 16, Lyon 19, Marseille 29), et le rang est recalculé avec la formule du script.
   - L'aller-retour de l'index est octet pour octet.
   - 73 autres communes bougent d'un point par arrondi ; aucune ne franchit le seuil de décision (66).
3. **Dossiers figés** :
   - convention `catnat-2` ;
   - `catnatFigeAffichable` refuse un compte `catnat-1` de Paris, Lyon ou Marseille, faux par
     construction. Le dossier n'est pas modifié : la carte retombe sur l'index courant.
4. **Territoire PLM** : l'instantané lit le compte de la commune sur son premier arrondissement.
5. **Texte** :
   - période alignée sur 1982 ;
   - dominante par `aleaDominant` et `resumeCatnat` (purs, `georisques-flags.ts`) ;
   - un relevé vide n'est plus présenté comme une panne.
6. L'agrégation des lignes GASPAR est déplacée telle quelle dans `georisques-flags.ts`, pour être
   testable.

## 10. Autres phénomènes vérifiés

- **Même cause, même correction** : sécheresse, mouvements de terrain, tempête et autres (le relevé
  direct d'un arrondissement les perdait tous).
- **Même mécanisme de dominante** : Châtelaillon passait de « surtout au titre de : sécheresse des sols,
  inondations et chocs liés aux vagues » (5 reconnaissances sur 14) à aucune dominante.
- **Synthèse IA** : elle ne reçoit que le relevé direct (`catastrophes_naturelles_reconnues`), jamais le
  compte d'index. Elle ne voyait donc pas deux faits contradictoires.

## 11. Tests

`src/lib/fut60-catnat.test.ts` (T1 à T8), sur les vraies lignes GASPAR
(`src/lib/__fixtures__/fut60-gaspar-catnat-05-10.json`) et le vrai index.

Mutations : l'ancien index fait échouer 4 tests, la dominante sans seuil 1, la période « première
année » 2.

## 12. Limites

- **Pastilles déjà vendues** : elles gardent « 7 arrêtés inondation » ; la carte qu'elles visent dit
  désormais « 7 reconnaissances liées aux inondations ». Même nombre, même unité, mot corrigé.
- **Zonage sismique** : grain inverse (75056 ne répond rien, 75111 oui). Le Territoire de Paris n'a
  donc pas de zone sismique. Hors de ce lot.
- **Décisions déjà vendues** : un dossier Paris, Lyon ou Marseille avec la priorité inondation a figé
  « exposition non notable » sur un faux zéro. Il n'est pas modifié (version moteur figée).
  Recensement : lecture de production, à lancer par le porteur.
- **Effet de taille** : le compte d'une grande commune s'applique à chaque arrondissement, comme pour
  toute grande commune non découpée (Toulouse, Nice). C'est le grain de la source, dit comme tel.

## Seconde passe (05/10/2026) : vocabulaire, grain visible, fraîcheur

### 13. Vocabulaire et grain

- **Le mot suit la donnée.** Le produit compte des lignes GASPAR, que le dictionnaire GASPAR décrit
  comme des reconnaissances (une commune, un événement, un risque). Les textes disent donc :
  - carte : « Tous risques · 20 reconnaissances depuis 1982 · Dont 16 reconnaissances liées aux
    inondations depuis 1982, à l'échelle de Paris » ;
  - preuve et constat : « 16 reconnaissances (de catastrophe naturelle) liées aux inondations… » ;
  - pages publiques, comparateur, AskFuture, libellés de source.

  « CatNat » reste hors de la phrase lue (règle existante), mais apparaît dans les libellés de source.
- **Le grain se dit.** À Paris, Lyon et Marseille, la phrase partagée ajoute « , à l'échelle de
  Paris ». Une page publique d'arrondissement écrit « À l'échelle de Paris (GASPAR ne publie pas
  les arrondissements), la ville a déjà été reconnue… ». Le comparateur n'affiche aucun compte, seulement
  un libellé de force (« peu de reconnaissances CatNat inondation »), jamais attribué à ces trois villes
  dont le rang est de 100.
- **Synthèse Logement (06/10, après le rebase sur FUT-13)** :
  - le champ du payload devient `reconnaissances_catnat_inondation_depuis_1982` ;
  - la consigne du prompt dit « nombre de reconnaissances », et n'écrit jamais « arrêtés » ;
  - le garde-fou interdit aussi « aucune reconnaissance de catastrophe ».

  Effet sur le cache :
  - **ce qui change** : la clé n'existe que pour une inondation sans sinistre indemnisé ET un compte
    connu, donc seul le `buildFactHash` de ces synthèses change (L2 : `f96dbb22` → `84079811`).
    Tout autre dossier garde son hash (`7e13aeb4` inchangé) ;
  - **ce que fait FUT-13** : à la prochaine ouverture, le cache est raté. La synthèse est régénérée
    (un appel au modèle), puis rangée par `rangementSynthese` en `nouvelle_version`, avec le même
    rapport, le même `report_hash` et le même `collected_at`. C'est légitime : même collecte, faits dits
    autrement ;
  - **pas de bump** de `SYNTHESIS_PROMPT_VERSION`, et le texte du prompt n'entre pas dans le hash.
- **Défaut d'intégration trouvé en revue (06/10)** : la route compare bien l'empreinte, mais la page
  ne la voyait pas.
  - `metaDe` jetait `syntheseHash`, et la page ne filtrait la synthèse enregistrée que sur le DPE.
  - `LogementSynthesis` la tenait pour valide sous l'empreinte COURANTE (`lastHashRef = factHash`).
  - Une synthèse écrite sous « arretes_* » aurait donc été réaffichée indéfiniment, sans régénération.
- **Correction** :
  - l'empreinte remonte dans `VersionMeta` jusqu'au module ;
  - le texte enregistré n'est réutilisé que si le DPE est compatible ET si l'empreinte est égale ;
  - une empreinte `null` vaut une incompatibilité ;
  - un texte qui n'a pas lu les faits courants ne s'affiche pas, même une fraction de seconde.
- **Piège évité** : l'empreinte du serveur inclut le signal climat (`deriveClimatProjete`), celle du
  navigateur ne l'avait pas. La page le dérive désormais comme la route (local, sans réseau) et le
  transmet : les deux empreintes sont égales (test E4). Sans cela, la comparaison aurait rejeté les
  synthèses des communes au signal climat émis (environ 10 à 12 %), et cassé le « 0 appel à
  l'ouverture » de FUT-13.
  - Le rafraîchissement de l'index (§17) change aussi la VALEUR du compte pour ces mêmes dossiers
    quand leur commune a reçu une reconnaissance : même périmètre.

### 14. Le cache d'avant : un stockage définitif

`populate-inondation.py` construisait `todo = [communes absentes du cache]` : une commune déjà en
cache n'était **jamais** réinterrogée. Le cache `{insee: compte}` ne portait aucune date. Relancer le
script ne rafraîchissait rien. Toulouse valait 19 dans l'index et 20 dans GASPAR (inondation du
08/02/2026, arrêté `INTE2623922A`).

### 15. Options de collecte étudiées (mesurées le 05/10/2026)

| Option | Mesure | Verdict |
|---|---|---|
| A. API v1, une commune par requête | 34 746 requêtes ; ~1 h 40 d'après la spec d'origine | trop de charge pour Géorisques |
| B. API v1, `code_insee` multiple | **20 codes au plus** (au-delà : « Le nombre de codes Insee à traiter ne doit pas dépasser 20 ») ; 1 738 requêtes ; 0,17 s médiane ; collecte complète en **498 s**, 0 échec ; comptes identiques à l'interrogation unitaire (6 témoins) | **retenue** |
| C. Export national `files.georisques.fr/GASPAR/gaspar.zip` | officiel (jeu GASPAR du ministère de la Transition écologique sur data.gouv.fr), 8 Mo, 247 140 lignes catnat. Fichier daté du jour, **mais contenu arrêté vers janvier 2026** : dernière modification 2026-01-28, manque `INTE2623922A` (Toulouse) et `INTE2609024A` (Bordeaux) | **écartée** : moins frais que l'API de plusieurs mois |
| D. API v2 | répond 401 sans jeton | non nécessaire |

Aucune page web n'est lue : seules l'API documentée et le fichier officiel ont été testés.

### 16. Mécanisme retenu : `scripts/gaspar/collecter-catnat.mts`

- **Modes explicites** :
  - `--nouvelle` : collecte complète, repart de rien ;
  - `--reprendre` : ne refait que ce qui manque à la collecte en cours ;
  - `--sans-publier` : collecte sans écrire l'index.

  Sans option, le script refuse de tourner.
- **Fichier de travail** : `data/.cache/gaspar-catnat-collecte.json` (non versionné), qui sert seulement à la
  reprise. Il est supprimé après publication. L'ancien cache `communes-inondation.json` n'est plus lu :
  aucune migration n'est nécessaire, puisqu'une collecte ne réutilise aucune valeur passée.
- **Panne totale** : chaque lot est réessayé 3 fois, puis laissé « à faire ». L'index n'est pas
  écrit et le script sort en erreur (code 1). L'index publié reste celui de la veille.
- **Panne partielle** : même règle. **Pas de mosaïque.** Garder la dernière valeur d'une commune non
  rafraîchie mélangerait deux dates dans le rang national. On préfère donc un instantané entier, ou rien.
  `--reprendre` complète le même instantané.
- **Atomicité** : le nouvel index est construit en mémoire, puis écrit à côté, relu (empreinte
  identique) et renommé. Le contrôle de structure (`assertIndexInvariants`) passe avant l'écriture.
- **Rang** : recalculé sur les comptes du seul instantané. Une hausse déplace des classes entières.
  Cette collecte en donne l'exemple : les communes à 1 reconnaissance passent de 15 à 14, celles à 5
  de 77 à 76 (8 253 communes, compte inchangé). C'est l'effet attendu, pas une anomalie. Les ~73
  communes de la première passe bougeaient pour la même raison.
- **Une seule taxonomie** : le compte de l'index est le groupe « Inondations » de `simplifyCatnatRisk`,
  celui de la carte. L'ancien classifieur Python ignorait « Coulée de Boue » et « Lave
  Torrentielle » (10 lignes en France).

### 17. Résultat de la collecte du 05/10/2026

- **Durée** : 17:14:39 → 17:22:56 UTC, 34 746 codes GASPAR, 0 échec.
- **Écarts** : 225 communes en hausse (220 de +1, 5 de +2), 0 baisse. Toulouse passe de 19 à 20.
- **Seuil de décision** : 29 communes passent la limite 66, toutes par une nouvelle reconnaissance qui
  leur est propre (aucune par simple glissement de rang).
- **Métadonnées** (`meta.sources.gaspar_catnat`) :
  - source, début et fin de collecte, statut `complete` ;
  - unité, codes interrogés et communes de l'index ;
  - lignes inondation, convention `catnat-2`.

  L'index n'a toujours pas de date de génération globale : le script de construction n'en écrit pas.

### 18. Afficher la fraîcheur

La date de collecte est dans l'index. La faire descendre jusqu'à « Source : Géorisques / GASPAR,
collecte futur•e du … » demande de la porter dans l'objet `CatnatInondation`. Cela change
l'empreinte des instantanés Territoire et des artefacts figés : c'est un chantier transverse, non fait ici.

### 19. Automatisation : conception (non implémentée)

- **Contrainte décisive** : depuis le 26/09/2026, Géorisques ne répond qu'aux IP françaises
  (mémoire `piege-georisques-france-seulement`). Les runners hébergés de GitHub Actions sont
  hors de France : la collecte y échouerait très probablement. À vérifier par un premier run.
- **Options** :
  - **runner auto-hébergé en France** : garde l'index dans le dépôt, mais dépend d'une machine
    allumée ;
  - **Vercel Cron en `cdg1`** : en France, mais la collecte (~500 s) frôle la durée maximale d'une
    fonction, et une fonction ne peut pas réécrire le dépôt. Il faudrait donc sortir ce champ de
    l'index, vers Supabase Storage (objet versionné) ou une table ;
  - **GitHub Actions + proxy français** : fragile, déconseillé.
- **PR automatique ou publication automatique** :
  - la donnée est dérivée, et la collecte se valide seule (complétude, invariants, relecture
    atomique) ;
  - la publication automatique est défendable, à quatre garde-fous : collecte complète ;
    `index:verify` ; diff limité à `inondation` et `meta.sources` ; plafond d'écart (par exemple
    aucune baisse, moins de 2 % de communes modifiées) ;
  - ce plafond est un **seuil à discuter** ;
  - le retour arrière se fait par simple revert du commit de données.
- **Cadence** :
  - quotidienne, possible par la charge : 1 738 requêtes, ~8 min, ~5 requêtes/s ;
  - GASPAR change au rythme des arrêtés publiés au Journal officiel, plutôt hebdomadaire ;
  - une collecte quotidienne garantit un retard d'un jour au plus sur l'API.
- **Surveillance** :
  - un run en échec est visible dans GitHub Actions ;
  - alerte si `meta.sources.gaspar_catnat.collecte_fin` a plus de 3 jours ;
  - un contrôle peut lire cette date dans l'index déployé.
- **Hors repo** :
  - Supabase Storage évite un redéploiement Vercel par jour et permet une collecte en `cdg1` ;
  - mais il ajoute une lecture réseau ou un cache au démarrage du comparateur, et sépare ce champ du
    reste de l'index ;
  - à décider dans un ticket séparé ; l'index reste statique ici.
