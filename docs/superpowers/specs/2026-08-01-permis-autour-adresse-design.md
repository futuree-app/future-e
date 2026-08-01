# Les permis de construire autour de l'adresse

**Date** : 2026-08-01 · **Statut** : **EN COURS**, pas complet. Socle vérifié, doctrine tranchée,
périmètre mesuré, appel, gel dans le snapshot et écran livrés — mais le chantier reste ouvert.
⚠ Ce document s'est déclaré COMPLET le 01/08 ; **le porteur a démenti le même jour**. Reste connu :
le module Autour produit sa prose **hors du `REGISTRY`** (ni `DecisionFact`, ni règle, ni grain
déclaré), et la pagination DiDo pour les très grandes communes n'est pas tranchée (voir §2).
· **Chantier 3 de la liste « Autour »** (1 et 2 livrés le 01/08).

## Ce que ça répond

La seule question qu'aucune visite ne peut trancher : **ce qui va se construire à côté**. On visite
un dimanche matin, on ne voit pas le terrain voisin autorisé depuis six mois.

## La source, vérifiée le 01/08/2026

`data.statistiques.developpement-durable.gouv.fr`, API DiDo, jeu SDES « Liste des autorisations
d'urbanisme créant des logements ».

- **1 905 937 autorisations**, millésime `2026-07`, mise à jour mensuelle.
- Filtrable par commune : `…/datafiles/8b35affb-55fc-4c1f-915b-7750f974446a/csv?COMM=eq:17300`.
  Réponse en CSV point-virgule, 94 colonnes.
- **Volume par commune tenable** : 1 091 lignes pour La Rochelle depuis 2013.
- Le paramètre `pageSize` est **refusé** (400). La pagination DiDo se fait autrement, à vérifier
  pour les très grandes communes.
- **Pas de latitude/longitude.** Le rattachement passe par la **parcelle cadastrale**
  (`SEC_CADASTRE1`/`NUM_CADASTRE1`, jusqu'à trois parcelles par dossier) ou par l'adresse du terrain
  (`ADR_NUM_TER`, `ADR_LIBVOIE_TER`), qui est du texte libre et mal orthographié
  (« AVENU CARNOT » relevé tel quel).
- 128 des 129 dépôts depuis 2024 portent une parcelle : **la jointure par parcelle est viable**.

## Ce qui est déjà livré

`src/lib/sitadel-etat.ts` (+ 8 tests). L'état d'une autorisation se déduit de **ses trois dates**,
jamais de la colonne `ETAT_DAU`.

Mesuré sur les 1 091 lignes de La Rochelle : `ETAT_DAU=4` recouvre **deux états différents**
(90 « autorisé non commencé » et 7 « chantier ouvert »). La nomenclature n'accompagne pas le
fichier. Les dates, elles, ne se contredisent jamais.

| État déduit | Effectif | Ce qu'on écrit |
|---|---|---|
| achevé | 617 | travaux déclarés achevés |
| chantier ouvert | 178 | chantier déclaré ouvert |
| autorisé, non commencé | 289 | autorisé, travaux non commencés à cette date |

## La doctrine, tranchée

**Un permis autorisé n'est pas un bâtiment.** Il peut n'être jamais construit, être annulé, ou
périmer faute de travaux commencés. Le vocabulaire colle donc à l'acte constaté : « autorisé » n'est
pas « prévu », « chantier ouvert » n'est pas « en construction jusqu'en 2027 ». Un test verrouille
l'absence de « sera livré », « futur », « d'ici 2027 ».

**Les achevés sont CONSERVÉS**, contrairement à une première intuition. Un immeuble achevé l'an
dernier juste à côté explique une vue, une ombre, un voisinage qui vient de changer : c'est
exactement ce qu'un acheteur veut savoir. C'est l'ancienneté qui décide de la pertinence, pas
l'état.

**Un dossier sans aucune date n'est jamais montré** : il n'établit rien de constatable, et
l'afficher ferait passer un enregistrement administratif pour un projet.

## Ce qui reste à construire

### 1. Le périmètre : TRANCHÉ par la mesure du 01/08/2026

`scripts/mesure-permis-autour.mjs`, sur 160 adresses tirées uniformément dans la BAN (les mêmes
que la mesure DPE, donc sans nouveau biais). Résultats dans
`docs/audits/mesure-permis-2026-08-01.json`.

| Rayon | Au moins un permis | dont non achevé | dont déposé depuis 3 ans |
|---|---|---|---|
| 50 m | 55,0 % | 43,1 % | **24,4 %** |
| 100 m | 80,6 % | 71,3 % | 46,9 % |
| 200 m | 95,6 % | 91,9 % | 67,5 % |

**Le problème n'était pas la rareté, c'était le bruit.** À 200 m, 95,6 % des adresses ont un permis
à côté : une information que presque tout le monde reçoit ne distingue plus rien, et elle
occuperait un bloc du dossier pour dire « comme partout ». À 100 m, plus des deux tiers en ont un
non achevé : encore trop banal.

**Retenu : 50 m, filtré aux dépôts des trois dernières années.** Le signal concerne alors une
adresse sur quatre. Assez rare pour vouloir dire quelque chose quand il apparaît, assez fréquent
pour valoir la peine d'être construit. Le rayon sera NOMMÉ dans le texte, comme les 500 m du
comptage.

**Réserve de méthode** : 4 listes de parcelles sur 160 ont été tronquées à 1 000 entrées au rayon
de 200 m. Sans effet sur le rayon retenu (50 m n'approche jamais la limite), mais les chiffres à
200 m sont des minorants.

### 2. Le coût, et le gel : TRANCHÉ ET LIVRÉ

**Le coût s'est effondré à la mesure du 01/08.** Deux paramètres DiDo non documentés dans la
première exploration, tous deux vérifiés :

| Requête | Poids |
|---|---|
| CSV brut, 94 colonnes, La Rochelle depuis 2013 | 538 Ko |
| `columns=` (10 colonnes) | 31 Ko |
| `columns=` + `AN_DEPOT=gte:2023` | **9 Ko** |
| idem, Paris entier | 20 Ko |

Le filtre d'ancienneté est donc appliqué **par la source**, avec la règle exacte de
`permisAMontrer`, qui la ré-applique ensuite : la sélection reste vraie si le filtre distant change
de sens. Aucun cache n'est nécessaire.

**Deux pièges d'API en plus, mesurés le 01/08 :**

- **Sitadel ne connaît que les communes-mères.** `COMM=eq:75101` répond 400 ; il faut `75056`. Une
  adresse parisienne étant géocodée sur son arrondissement, sans `communeParent` le bloc serait
  vide pour tout Paris, Lyon et Marseille, et vide se lirait « rien ne se construit » dans les
  trois villes où c'est le plus faux.
- **Un `400 « Le fichier est vide »` n'est pas une panne** : c'est zéro ligne pour le filtre.
  Vérifié sur `17300` avec `AN_DEPOT=gte:2050`, qui répond comme un code inexistant. Le traiter en
  échec ferait disparaître le bloc partout où l'absence est justement l'information.

**Le gel : les permis entrent dans le snapshot, avec leur périmètre et leur date de consultation.**
Le champ est optionnel comme `withinWalkCount`. Absent veut dire « registre non consulté » (dossier
antérieur, ou API muette), et le bloc **disparaît** ; présent et vide veut dire « consulté, rien
trouvé », et le bloc **dit l'absence**.

La question « un dossier de six mois affichera-t-il des permis de six mois ? » est tranchée par
l'affichage : oui, et **la date de consultation est écrite sous le bloc**. Le rayon et la fenêtre
sont gelés **avec** les permis qu'ils ont sélectionnés, et toutes les phrases se construisent à
partir de ces valeurs-là, jamais des constantes du jour : le jour où le rayon change, un dossier
ancien continue de décrire le périmètre qui a réellement servi.

Les dossiers antérieurs au 01/08/2026 sont **rattrapés une fois**, à leur prochaine ouverture,
sans recalculer le reste du snapshot : bumper `SOURCES_VERSION` pour un champ optionnel aurait
coûté un recalcul complet à chaque dossier existant.

### 3. Deux pièges de jointure, déjà payés

Ils ont produit **zéro permis sur huit adresses** au premier essai, ce qui aurait fermé le chantier
sur un faux verdict.

- **Le numéro de parcelle est complété à quatre chiffres par le cadastre** (« 0300 ») et rendu brut
  par Sitadel (« 300 »). Sans normalisation, la clé ne correspond jamais.
- **`_limit=200` sur `apicarto/cadastre/parcelle` était atteint PILE** à 200 m en ville. Les
  parcelles disparaissaient en silence, et la mesure aurait sous-compté précisément les secteurs
  denses, ceux où il y a des permis. Limite portée à 1 000, troncature comptée et affichée.

### 4. La forme : LIVRÉE

Un bloc du module Autour, « Ce qui est autorisé autour », sur le patron des « abords de
l'adresse » : la phrase d'ouverture, les faits, la limite, la date de consultation.

**L'absence est affichée**, contrairement aux abords (où le silence est plus honnête qu'un
satisfecit). La différence tient à ce qui est nommé : les abords cherchent trois types d'objets
dans un rayon, et « rien trouvé » y ressemblerait à une promesse de calme. Ici le périmètre et
l'objet du registre sont dits dans la phrase même, donc l'absence est bornée et vérifiable. Elle
concerne trois adresses sur quatre : la taire reviendrait à ne rien répondre à la majorité des
lecteurs.

**Le registre ne recense que les autorisations CRÉANT DES LOGEMENTS.** Un entrepôt, un commerce,
une extension sans logement nouveau n'y figurent pas. La phrase le porte toujours, présence comme
absence, et un test le verrouille : « aucune autorisation » tout court promettrait un quartier
immobile que la source ne permet pas d'affirmer.

Les lignes sont regroupées par (année, état), avec leur nombre. À 50 m sur trois ans il y a au plus
trois années et trois états, donc **neuf lignes au maximum** : aucune troncature, donc aucune
troncature silencieuse. Dans une année, l'ordre va de ce qui reste à venir à ce qui est révolu.

### 5. Le code livré

| Fichier | Rôle |
|---|---|
| `src/lib/sitadel-etat.ts` | l'état déduit des trois dates (+ 8 tests) |
| `src/lib/sitadel-selection.ts` | périmètre, ancienneté, clé de jointure, limite (+ 11 tests) |
| `src/lib/sitadel-csv.ts` | lecture du CSV DiDo, `null` si le format a changé (+ 7 tests) |
| `src/lib/decision/autour-permis.ts` | la lecture affichée, depuis le snapshot gelé (+ 11 tests) |
| `src/lib/server/sitadel-permis.ts` | les deux appels réseau, et rien d'autre |
| `src/app/api/logement-autour/route.ts` | gel à l'analyse, rattrapage une fois pour les anciens |
| `src/components/report/AutourModule.tsx` | le bloc |

Un permis retenu porte son **état**, jamais sa phrase : le libellé se calcule au rendu. Écrire la
phrase dans le snapshot figerait la formulation du jour de l'analyse, et deux dossiers voisins
diraient deux choses de la même situation le jour où le texte est réécrit.

Vérifié en réel le 01/08/2026 sur trois points : La Rochelle centre (1 permis, chantier ouvert
2025), Paris 12e (0), un village de la Creuse (0), avec 62 / 18 / 7 parcelles jointes.

## Ce qui a été écarté

**La jointure par adresse de terrain.** `ADR_LIBVOIE_TER` est du texte libre saisi en mairie
(« AVENU CARNOT »). Un rapprochement flou attribuerait des permis à la mauvaise rue, et c'est
exactement la classe d'erreur que le produit refuse depuis le DPE du voisin.
