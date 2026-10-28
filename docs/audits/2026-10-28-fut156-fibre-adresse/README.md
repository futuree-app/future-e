# FUT-156 · La fibre à l'adresse dans Logement

> 28/10/2026. Suite du POC FUT-148 (`docs/fut-148-poc-fibre-adresse`, commit `bcd758c0`). Données Arcep du
> T2 2026 (au 30 juin 2026), BAN du 28/10/2026. Rien n'est écrit en production ; aucune fusion, aucun déploiement.

## Ce que le lecteur obtient

Un bloc « Fibre à cette adresse » dans Logement (famille « Le logement lui-même », après le confort thermique),
dans la grammaire du Relevé : deux réponses distinctes, puis la limite et la vérification.

| Lecture | Exemple de phrase |
|---|---|
| État du bâtiment | « Selon l'Arcep, la fibre est indiquée comme déployée pour le bâtiment associé à cette adresse, au 30 juin 2026. » |
| Nombre d'opérateurs | « 5 opérateurs déclarent une offre fibre pour ce bâtiment. » · « Selon le bâtiment, 4 à 5 opérateurs… » · « Aucun opérateur ne déclare encore d'offre fibre… » (zéro prouvé) · « …n'est pas établi. » |
| À vérifier | « Raccordement à vérifier : les données disponibles ne permettent pas de déterminer avec certitude le statut de cette adresse. » + le motif |
| Panne de lecture | « Fibre non vérifiée… Ce n'est pas une absence de fibre. » |

Toujours : « C'est l'état du bâtiment, pas celui d'un logement précis » et la vérification sur Ma connexion
internet puis chez un opérateur (lien). Méthode, sources et définitions dans « En savoir plus ». Aucun nom
d'opérateur, débit ou prix ; jamais « éligible » dit du logement, ni « 0 opérateur » faute de donnée (testé).

Un rapport écrit avant FUT-156, ou une lecture non activée, n'affiche rien. Pas de score, pas d'appel IA ;
l'empreinte de la synthèse rédigée ignore la fibre (testé).

## La règle de lecture

1. **Rattachement** : identifiant BAN de l'adresse = `addr_code` de `base_imb` ; sinon, pour les seuls
   immeubles fibre sans clé BAN, libellé exact (commune, numéro, indice, voie normalisée). Jamais la proximité.
2. **État** : `imb_etat` du fichier cartefibre `Immeuble`, joint par le code IPE. Plusieurs immeubles d'états
   différents : à vérifier. Un immeuble sans état publié (ou publié deux fois avec deux états) : à vérifier.
3. **Doute géographique** : un immeuble rattaché à plus de 150 m du point BAN rend l'adresse « à vérifier ».
   La distance retire une conclusion, elle n'en ajoute jamais (elle ne choisit pas un bâtiment parmi plusieurs).
4. **Opérateurs** : codes distincts des lignes `FO` de `eligibilite/actuel` pour l'immeuble (les lignes d'un
   même opérateur ne comptent qu'une fois). Pseudo-opérateurs (`CCC`, `CCCC` « données en cours de collecte »,
   `??`, `FORM`, `ARCEP`) : nombre non établi. Immeuble absent de `actuel` : non établi. Présent sans ligne
   `FO` : zéro prouvé. Comptes différents selon les immeubles : une plage, jamais un nombre unique.

Code de l'index et décodage : `src/lib/fibre-adresse.ts` (partagé par le pipeline et l'application).

## Mesures nationales (T2 2026, 103 départements, 26 020 323 adresses BAN)

| | Adresses | Part |
|---|---|---|
| Rattachées (clé BAN 20 938 193 · libellé 746 581) | 21 684 774 | 83,3 % |
| **Avec un état** | 21 336 051 | **82,0 %** |
| dont déployé | 20 898 797 | 80,3 % |
| dont non déployé (sur demande, en cours, études) | 437 254 | 1,7 % |
| À vérifier : bâtiment à plus de 150 m | 187 253 | 0,72 % |
| À vérifier : états divergents | 19 648 | 0,08 % |
| À vérifier : aucun immeuble fibre sous la clé | 141 817 | 0,55 % |
| À vérifier : état non publié | 5 | 0,00 % |
| Non rattachées | 4 335 549 | 16,7 % |

Parmi les adresses avec un état : **nombre d'opérateurs établi 97,85 %** (unique), plage 0,05 %, non établi
0,007 % (`CCCC` sur 3 252 lignes), zéro prouvé 446 809 (dont 9 555 bâtiments « déployés » sans offre déclarée).
Distribution : 5 opérateurs 11,4 M · 6 : 7,8 M · 4 : 0,93 M · 7 : 0,45 M · 3 et moins : 0,28 M.
Aucun doublon de ligne `FO`, aucun opérateur hors référentiel, aucun code IPE contradictoire.

**Ne pas généraliser un département** : de 13 % (Saint-Martin) et 17 à 28 % (Mayotte, Guadeloupe, Martinique)
à 91 % (Loiret, Bas-Rhin). Corse : 55,6 % (2A) et 66,4 % (2B), uniquement par le libellé (l'Arcep n'y pose
aucune clé BAN, et la BAN écrit `2a001_…` en minuscules). Charente-Maritime : 80,0 % (80,9 % au POC, l'écart est
exactement la règle des 150 m).

## Preuves

- **Contre-épreuve indépendante** (`scripts/fibre-adresse/contre_epreuve.py`, autre langage, extraction
  cartefibre du POC) : Charente-Maritime **435 586 / 435 586** adresses identiques, Moselle **381 931 / 381 931**,
  Paris 152 622 / 152 625. Les 3 écarts parisiens sont des lignes cartefibre dont un champ entre guillemets
  contient une virgule (« BATI 3_ESC 1,2 et 4 ») : l'extracteur du POC les ignore, le pipeline les lit.
- **55 adresses réelles** (`src/lib/__fixtures__/fut156/17.json`, lignes officielles brutes) rejouées par les
  tests : les 49 du POC et des contre-épreuves.
  - 10 place Blair : raccordable sur demande, aucun opérateur ; 11 place Blair : déployé, 5 opérateurs.
  - 3 allée de l'Albatros : « cible » à 3 m et « déployé » à 178 m sous la même clé : à vérifier.
  - 13 route de l'Ilate : un immeuble à 856 m : à vérifier.
  - 3 adresses à plusieurs immeubles de comptes 4 et 5 : « 4 à 5 opérateurs selon le bâtiment ».
  - bis, ter, indices et identifiants récents sans immeuble : non rattachés, jamais un voisin.
  - « Rue de l’Hospice » (apostrophe typographique) : rattachée par le libellé (le POC la manquait).
- **Les 34 adresses (43 immeubles) vérifiées sur cartefibre au POC** : 29 gardent exactement leur état ; les
  quatre ambiguës restent sans état ; une seule « fiable » est retirée : 28 c rue du Petit Coudret, dont le point
  BAN est un milieu de voie (« segment ») à 299 m de l'immeuble. Prix assumé de la règle des 150 m.
- **Lecture réelle depuis Supabase Storage** (projet `future-e-test`) par le module serveur de l'application :
  55 / 55 adresses identiques au code publié.

## Stockage : Supabase Storage Free, bucket privé `fibre-adresse`

| | Lots de communes (retenu) | Un objet par commune |
|---|---|---|
| Objets par millésime | 1 306 | 34 577 |
| Taille totale | 74,2 Mo | 75,6 Mo |
| Envoi d'un millésime | 31 s mesurées avant ajout des relectures SHA-256 (durée complète à remesurer) | ≈ 16 min (12,7 s pour les 462 communes du 17) |
| Lu par analyse | médiane 51 Ko, p95 111 Ko, max 310 Ko (77 Ko en moyenne sur les 55 cas) | ≈ 2 Ko |
| Latence d'une lecture (Paris → eu-west-2) | médiane 81 ms, p90 253 ms ; 692 ms à froid (pointeur + manifeste + lot) | médiane 197 ms |
| Commune absente | réponse (« non rattachée ») | indistinguable d'un fichier manquant |

**Quotas Free (par organisation : test ET production les partagent)** : 1 Go de stockage, 5 Go d'egress non
mis en cache par mois. Deux millésimes en production ≈ 150 Mo (15 %). À 77 Ko par analyse, 5 Go couvrent environ
65 000 analyses d'adresse par mois, des ordres de grandeur au-dessus du volume actuel de dossiers. Si le volume
venait à s'en approcher, `--lot-brut` réduit la taille des lots (au prix de plus d'objets).

**Coût Vercel** : nul en pratique. Aucun fichier ajouté à une fonction (trace vérifiée au build), une requête
HTTP de quelques dizaines de Ko par analyse, en parallèle des ~14 sources existantes ; le résultat est figé
dans le rapport, une réouverture ne relit rien. Aucun téléchargement Arcep au build, aucune tâche planifiée.

**Accès** : bucket privé ; lecture serveur par la clé de service déjà présente côté serveur
(`SUPABASE_SERVICE_ROLE_KEY`), rien dans le navigateur (vérifié dans `.next/static`). Activation par
`FIBRE_ADRESSE_BUCKET=fibre-adresse` ; sans elle, rien n'est lu ni affiché.

**Pilote** : sur `future-e-test` seulement. Faute de clé serveur du projet de test en local, l'envoi s'est fait
avec la clé publique et quatre politiques RLS temporaires limitées au bucket, retirées ensuite (vérifié : la
clé publique et l'accès anonyme reçoivent HTTP 400). Reste en test : `2026T2` (1 307 objets, 74,2 Mo) et le
pointeur. Le millésime `2026T1` (Charente-Maritime) et les 462 objets de la variante par commune ont été effacés.

## Coûts de collecte

| Par trimestre | Volume |
|---|---|
| `base_imb` (103 fichiers départementaux) | 1,273 Go |
| `eligibilite/actuel` départemental (le national pèse 1,87 Go) | 1,448 Go |
| `Immeuble` cartefibre (ZIP national, lu en flux, jamais écrit) | 0,835 Go |
| BAN départementale | ≈ 0,94 Go |
| **Total** | ≈ 4,5 Go (≈ 3,05 Go sans le nombre d'opérateurs) |

Poids du nombre d'opérateurs dans l'index : **+1,3 Mo (+1,8 %)**. Calcul : 25 minutes sur le poste du porteur
(dont 2 min pour `Immeuble`), disque de pointe ≈ 0,3 Go (un département à la fois, sources effacées après usage).
Il n'existe pas de collecte plus légère : aucune API documentée, et `Immeuble` n'est publié qu'en national.

## Procédure trimestrielle

1. **Déclencheur** : la surveillance ChatGPT signale une nouvelle publication. Attendre que les TROIS jeux
   soient au même trimestre : `base_imb` et `eligibilite` (pages `data.arcep.fr/fixe/maconnexioninternet/…/last/`)
   et `<millésime>-Immeuble` sur data.gouv.fr. La construction refuse sinon.
2. **Construire** (poste local, hors dépôt) :
   `node scripts/fibre-adresse/construire.mjs --cache <cache> --sortie <sortie> --precedent <sortie>/<précédent>/rapport.json`
   Elle s'arrête sur : millésimes différents, taille ou SHA-1 différents de la publication, valeur inconnue
   (état, source d'immeuble, technologie), jointure IPE < 99,5 %, part d'adresses avec un état qui varie de plus
   de 5 points dans un département (`--accepter-ecarts` après examen). Relancer reprend où elle s'est arrêtée.
3. **Contre-épreuve** sur au moins deux départements (`contre_epreuve.py`), dont un nouveau à chaque trimestre.
4. **Envoyer**, sans effet sur l'application : `publier.mjs envoyer --cible production --confirmer-production --source <sortie>/<millésime>`
   (variables `FIBRE_SUPABASE_URL`, `FIBRE_SUPABASE_CLE`, jamais dans le dépôt).
5. **Basculer** : `publier.mjs basculer --cible production --confirmer-production --millesime <nouveau>`
   (relit chaque lot et vérifie sa taille ET son SHA-256 avant d'écrire le pointeur ; l'application le lit sous dix minutes).
6. **Retour arrière** : `basculer --millesime <précédent>`. **Purge** : `purger --garder 2`.
7. Les dossiers déjà écrits gardent leur millésime ; une actualisation demandée par le lecteur prend le nouveau.

**Intégrité (revue indépendante)** : le manifeste porte désormais les tailles et SHA-256 des lots calculés à
la construction. `envoyer` compare chaque fichier local à ces empreintes, puis relit et vérifie les objets
distants, y compris ceux de même taille lors d'une reprise. Une discordance bloque la publication du
manifeste ; aucun lot existant n'est écrasé. `basculer` refuse un manifeste sans empreintes et ne touche pas
au pointeur si un seul lot est absent ou altéré. Pour l'index T2 déjà construit, `envoyer` récupère les
empreintes des bilans `_departements/*.json` existants : **aucun recalcul des 26 millions d'adresses**.
Les relectures ajoutent environ 74,2 Mo à l'envoi et 74,2 Mo à la bascule ; ce coût ponctuel et leur durée
s'ajoutent aux mesures du pilote initial. Contre-épreuve : objet altéré de même taille, refus en reprise
et en bascule (`scripts/fibre-adresse/publication.test.mjs`).

## Ce qui n'est pas couvert

- 16,7 % des adresses ne sont rattachées à aucun immeuble (indices, adresses récentes, libellés différents) :
  « à vérifier », jamais le voisin. Un troisième barreau plus souple n'est pas retenu sans épreuve dédiée.
- La règle des 150 m écarte aussi quelques rattachements justes quand le point BAN est approximatif
  (positions « segment ») : 0,72 % des adresses au total, choix prudent assumé.
- La BAN est l'instantané du jour de construction, pas celle du trimestre Arcep.
- Le bâtiment n'est pas le logement : aucun statut au niveau de l'appartement n'existe dans les sources.
- Le banc Logement complet (`/dev/fut156?vue=logement`) s'élargit à plusieurs milliers de pixels : défaut
  antérieur du banc (même mesure sur `/dev/fut146`), sans rapport avec le bloc ; la recette visuelle se fait sur
  `?vue=section`.
