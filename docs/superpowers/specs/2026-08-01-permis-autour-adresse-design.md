# Les permis de construire autour de l'adresse

**Date** : 2026-08-01 · **Statut** : socle vérifié et première brique livrée ; le reste est spécifié
et non construit. · **Chantier 3 de la liste « Autour »** (1 et 2 livrés le 01/08).

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

### 1. Le périmètre : quelles parcelles sont « à côté » ?

Le produit résout déjà la parcelle de l'adresse (`findCadastreParcelByPoint`, avec repli par carrés
de 3, 8 puis 15 m). Il faut les parcelles **voisines**. `apicarto/cadastre/parcelle` accepte une
géométrie : un carré autour du point, comme `buildSquareAroundPoint` le fait déjà, à un rayon plus
grand.

**Question ouverte, à mesurer avant de coder** : à quel rayon ? À 100 m en ville, on couvre
l'îlot ; à 200 m on couvre la rue. Le rayon doit être **nommé et affiché**, comme les 500 m du
comptage et les 15 points de l'écart de secteur.

### 2. Le coût, et le cache

Un appel par dossier, filtré par commune, sur un CSV de quelques centaines de kilo-octets. Le
snapshot Autour est **figé** : les permis devraient y entrer comme les autres faits, donc être
gelés à la création du dossier. À trancher : un dossier de six mois affichera-t-il des permis de
six mois ? Le champ doit être optionnel, comme `withinWalkCount`, pour que les dossiers antérieurs
n'affichent pas une absence.

### 3. La mesure qui décide si ça vaut le coup

**Combien d'adresses verraient quelque chose ?** 1 091 permis sur treize ans pour une commune de
75 000 habitants, c'est rare à l'échelle d'une parcelle. Si 95 % des dossiers affichent un bloc
vide, la fonctionnalité coûte un appel pour rien.

À mesurer sur les 800 adresses de `docs/audits/mesure-dpe-2026-07-31-adresses.json`, qui sont déjà
tirées uniformément : part des adresses avec au moins un permis non achevé à moins de N mètres,
par strate. **Cette mesure conditionne tout le reste.**

### 4. La forme

Un bloc du module Autour, sur le patron des « abords de l'adresse » : les faits, puis la limite. La
limite ici : un permis autorisé peut ne jamais être construit, et le jeu est mensuel, donc un
dossier déposé le mois dernier n'y est pas encore.

## Ce qui a été écarté

**La jointure par adresse de terrain.** `ADR_LIBVOIE_TER` est du texte libre saisi en mairie
(« AVENU CARNOT »). Un rapprochement flou attribuerait des permis à la mauvaise rue, et c'est
exactement la classe d'erreur que le produit refuse depuis le DPE du voisin.
