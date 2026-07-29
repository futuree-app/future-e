# Sonde — RNB comme couche de rattachement bâtimentaire pour le DPE

**Date** : 2026-07-30 · **Origine** : piste soulevée en brainstorming (session checkout dossier), en
réponse au taux de ~44 % d'adresses sans DPE à moins de 50 m
(`docs/audits/2026-07-03-dpe-confort-ete-couverture.md`, résultat 6).

**Statut** : sonde de faisabilité, trois appels réels. Aucune ligne de code produite. Chantier de
données du module Logement, **hors** de la spec de qualification / checkout.

---

## L'hypothèse examinée

Remplacer l'attribution du DPE « par proximité de 50 m » par un rattachement au **bâtiment** :
adresse BAN → bâtiment du Référentiel National des Bâtiments → DPE rattachés à ce bâtiment. Le gain
attendu n'est pas seulement de couverture, il est de fiabilité : un cercle de 50 m traverse une rue,
une cour, plusieurs maisons ou plusieurs cages d'un même ensemble.

L'hypothèse portait une affirmation précise : « l'identifiant RNB est déjà diffusé dans la base
ouverte des DPE ».

## Ce que les sondes disent

**1. Les DPE ne portent aucun identifiant RNB.** Vérifié sur les deux identifiants du jeu ADEME :
l'alias que futur•e interroge (`dpe03existant`) et le jeu canonique
(`meg-83tjwtg8dyz4vv7h1dqe`, « DPE Logements existants depuis juillet 2021 »). 145 champs dans les
deux cas, aucun ne contient `rnb`. Les seuls champs bâtimentaux sont `classe_inertie_batiment`,
`complement_adresse_batiment`, `type_batiment`.

**L'affirmation est donc fausse au 30/07/2026** sur l'API que nous consommons. Elle décrit une
finalité annoncée par le RNB, pas un champ livré.

**2. Le RNB ne porte pas les DPE non plus.** `GET /api/alpha/buildings/{rnb_id}/` rend
`addresses`, `ext_ids`, `is_active`, `point`, `shape`, `status`, `validated_by`. Aucun diagnostic.
Le croisement n'existe donc dans aucun des deux sens : il resterait à fabriquer.

**3. Ce qui fonctionne, gratuitement et sans token.** `GET /api/alpha/buildings/?cle_interop_ban=…`
rend le bâtiment correspondant à une adresse BAN. Éprouvé sur `44109_2300_00002` (2 rue Crébillon,
Nantes) : un bâtiment, `rnb_id = 74SQZQX5GJQ2`, avec son **empreinte au sol** en MultiPolygon et ses
adresses rattachées. L'API exige un filtre parmi `bbox`, `insee_code` ou `cle_interop_ban` ; notre
`ban_id` est exactement une clé d'interopérabilité BAN, donc l'entrée est déjà dans nos mains.

## La forme sous laquelle la piste survit

Le rattachement par identifiant partagé est mort. Le rattachement **géométrique** est ouvert :

```
DPE candidat (coordonnee_cartographique_x_ban / y_ban, Lambert 93)
  tombe-t-il DANS l'empreinte RNB du bâtiment de l'adresse ?
```

Ce test remplace un cercle de 50 m par un bâtiment réel. Il ne demande ni partenariat, ni
authentification, ni donnée modélisée : une requête RNB et un point-en-polygone, deux gestes que le
code fait déjà ailleurs (`findCadastreParcelByPoint`).

Hiérarchie d'attribution qu'il permettrait, du plus sûr au moins sûr :

1. numéro de DPE fourni par le lecteur (clé exacte, donnée réglementaire retrouvée) ;
2. `identifiant_ban` exact ;
3. DPE dont le point tombe dans l'empreinte RNB du bâtiment de l'adresse ;
4. DPE sur la même parcelle cadastrale, bâtiment non confirmé ;
5. DPE à moins de 50 m, bâtiment non confirmé.

Les niveaux 4 et 5 cessent alors d'être présentés comme un contexte de bâtiment : ils deviennent des
**candidats à confirmer**, ce qui est le rôle de la spec B (« résolution, actualisation et vécu »).

## Ce que ça change au chiffre de couverture

Rien, tant que ce n'est pas mesuré, et c'est le point honnête à retenir : **les ~34 % de DPE
« à moins de 50 m » ne sont pas tous attribuables au bon bâtiment.** La couverture honnête est donc
possiblement inférieure aux 55 % annoncés, et le rattachement par empreinte pourrait simultanément
en retirer (des voisins pris pour le bâtiment) et en ajouter (des DPE hors bbox mais dans l'empreinte
d'un bâtiment long).

Le script de mesure de l'audit du 03/07 n'a jamais été committé (`scripts/` n'en contient aucun).
Le prochain devrait mesurer les cinq niveaux ci-dessus séparément, sur un échantillon stratifié par
rural / périurbain / urbain et par type de feature BAN, plutôt que par reverse-géocodage qui tire
près des centres-bourgs et sur-représente les adresses bien diagnostiquées.

## Sur la BDNB, précision utile

Refuser toute la BDNB parce qu'elle contient des performances simulées est trop large. La distinction
qui tient : une **performance modélisée** ne remplace jamais un diagnostic réel dans le dossier ; une
**couche de rapprochement** (géométrie, groupe de bâtiments, rattachement d'adresses) répond à une
question d'identité, pas de performance. Le champ `source: "bdnb"` apparaît d'ailleurs déjà dans les
adresses rendues par le RNB. Cette nuance ne lève aucun interdit pour le lancement : aucune
performance modélisée sur la face Logement.

## Pourquoi ce n'est pas fait maintenant

La variable dominante reste le délai jusqu'au premier euro encaissé
(`docs/rapports-agents/business-strategist/2026-07-29-dossier-adresse-39e.md`). L'absence de DPE ne
bloque aucune vente : elle est nommée avant le paiement et le module Logement est déjà conçu autour
de sa dégradation en trois états également nobles. Améliorer l'attribution améliore un produit que
personne ne peut encore acheter.

À rouvrir avec la spec B, ou dès qu'un acheteur se plaint d'un diagnostic qui n'est pas le sien.
