# Décision Face 4 — valeur immobilière parquée, engagement documenté déparqué

> **Statut : DÉCISION TRANCHÉE (2026-07-03).** Trace d'un aller-retour porteur ↔ ChatGPT ↔ Claude
> sur « faut-il déparquer la dimension financière du module Logement ? ». La décision de fond est
> gravée dans `docs/vault/modules/logement.md`. Ce document préserve le raisonnement et le protocole
> de spike, pour que la reprise du chantier Face 2 étendue ne reparte pas de zéro.

## Question de départ

La doctrine disait « valeur immobilière prédite : parquée (pas de donnée de marché honnête) ».
Le porteur a voulu challenger ce parking.

## Ce qui a été établi (accord des trois voix)

1. **La formule « pas de donnée de marché honnête » était imprécise.** DVF (transactions réelles,
   open data) et la valeur verte notariale sont des données honnêtes. Ce qui manque, c'est le
   passage vers *la valeur de CE logement*. Reformulation gravée dans le vault.
2. **La valeur immobilière individuelle reste parquée** (estimation du bien, prix cible, décote
   climatique, trajectoire de valeur, label résilient/fragilisé, % de valeur verte appliqué,
   DVF en bloc de comparaison). Deux raisons : doctrinale (ADR-0001, supposition = note interdite)
   et positionnement (DVF « arme le portail immo », hors moat climat).
3. **L'engagement financier et réglementaire documenté se déparque**, sous un autre nom et une autre
   promesse : « ce que ce logement vous engage à prévoir » (acheteur) / « ce qu'il peut vous conduire
   à adapter, vérifier ou anticiper » (résident).
4. **Une incohérence doctrinale a été trouvée et corrigée** : « le coût futur que le marché ignore
   encore » supposait de savoir ce que le marché a intégré. Remplacé par « le coût qu'un acquéreur
   doit documenter avant de s'engager ».

## Le débat technique (PPRI) et sa résolution

ChatGPT a d'abord proposé une brique « marge de manœuvre » (ce que le PPRI autorise/interdit :
extensions, surélévations, prescriptions). Claude a objecté que la donnée structurée ne porte pas
le règlement (seulement le zonage). ChatGPT a répondu, à juste titre, que « data-bloquée » forçait
le trait : le standard **COVADIS** normalise un `typeReg` national à 6 catégories (prescriptions /
interdiction / interdiction stricte / délaissement / expropriation), et Géorisques restitue souvent
le régime + code + libellé de zone au point.

**Résolution (vérifiée dans le code) :**
- Le projet appelle `/api/v2/gaspar/pprn` (`src/lib/georisques.ts:283`), la **base GASPAR des
  procédures**. Son sous-objet `zonageReglementaire.listTypeReg` existe au schéma mais n'est pas
  garanti rempli au point.
- Le `typeReg` COVADIS fiable vit dans la **couche de zonage cartographique** (celle qu'exploite le
  `rapport_pdf` v1 / le WFS des DDT), que le projet **n'appelle pas aujourd'hui**. Les exemples
  riches de ChatGPT venaient de cet endpoint.
- Accès v2 = **401 sans inscription** (testé en direct le 2026-07-03) : le spike passe par la clé
  du projet.

**Vocabulaire calé** : la piste n'est pas « data-bloquée », elle est **documentairement accessible
mais non industrialisée**. Restituable de façon générique = le **statut** (en zone réglementée
oui/non, régime si présent, code + libellé local, date d'approbation) + renvoi au règlement.
Non industrialisable sans lire un PDF communal hétérogène = les **prescriptions concrètes**
(extension jusqu'à X m², cote de plancher, surélévation interdite…).

## Décision de build

- Nouveau morceau à construire = **statut réglementaire localisé, en Face 2** (exposition). Pas de
  Face 4 autonome : ~60 % du volet financier (audit, coût DPE conventionnel, échéances passoires)
  est déjà affiché en Face 1, et la conclusion actionnable relève de la sortie transverse
  « À vérifier avant de décider » (le vrai levier payant).
- NE PAS construire maintenant : synthèse des droits à construire, verdict de marge de manœuvre,
  éligibilité Barnier « pour ce bien », DVF/repères de marché, Face 4 dupliquant l'énergétique.

## Premier ticket (spike de reconnaissance, PAS du build)

Mesurer, avec la clé Géorisques du projet, sur **50-100 adresses en zone PPRI** réparties (PPRI
anciens/récents ; littoral/fleuves/crues torrentielles ; métropoles/petites communes ; prescriptions/
interdiction ; mono-aléa/multirisques), ce que renvoie réellement chaque appel. Pour chaque point :

| Champ | À vérifier |
| --- | --- |
| PPR affectant l'adresse | oui/non |
| Identifiant GASPAR | rempli |
| Type réglementaire standardisé (`typeReg`) | rempli/absent |
| Code local (`codeZone`) | rempli/opaque |
| Libellé local | rempli/opaque |
| Fiche PPR / règlement PDF disponible | oui/non |
| URL de règlement attachée à la zone | oui/non |

Sortie du spike : décider si `/api/v2/gaspar/pprn` suffit, ou s'il faut ajouter l'appel à la couche
de zonage cartographique, pour caler le niveau de récit honnêtement restituable.

## Discipline maintenue

PPRI = information **réglementaire**, pas une probabilité de sinistre. **Absence d'intersection ≠
absence de risque** → « non déterminé », jamais « cette adresse n'est pas exposée ». Même
« interdiction » n'implique pas que tous les travaux sont impossibles (exceptions sous prescriptions
strictes selon le règlement local).
