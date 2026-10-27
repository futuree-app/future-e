# FUT-82 · 4. Contre-épreuves et risques d'interprétation

> Leçon de FUT-81 appliquée dès l'audit : une donnée officielle devient trompeuse par son
> **traitement**. Chaque cas ci-dessous a été **provoqué et observé**, pas supposé. Mesures :
> `mesures/sondes-adresses.json`, `mesures/discrimination-logements.json`,
> `mesures/contre-epreuves.json`. Script : `scripts/research/fut82/contre-epreuves.mjs`.

## 1. Les fausses absences rencontrées pendant l'audit (toutes silencieuses)

| # | Piège | Où | Ce qu'on obtient si on ne le voit pas | Parade |
|---|---|---|---|---|
| 1 | **Projection native de la couche** | Natura 2000, parcs, réserves (Patrinat, EPSG:3857) ; débroussaillement et potentiel solaire (EPSG:2154) | « Aucun site protégé » en pleine forêt de Fontainebleau, HTTP 200 | Lire la projection native dans les capacités WFS, convertir le point (`lib.mjs`, `pointCql`), test de non-régression sur un site connu |
| 2 | **Échelle d'affichage d'une couche WMS** | Nappes (BRGM) | « Aucune zone » sous ±0,01° de fenêtre, partout | Lecture vectorielle (WFS) et point-dans-polygone |
| 3 | **Tolérance de clic** | Nappes (WMS) | Trois classes différentes « au point » à Abbeville et Paris, emprises toutes contenantes | Idem : ne jamais déduire la classe d'une emprise |
| 4 | **Exception servie en HTTP 200** | Masques de la carte des nappes ajoutés à la requête | Corps XML d'exception lu comme « vide » | Tester le corps (`ServiceException`, `ExceptionReport`), pas seulement le statut |
| 5 | **Grain administratif agrégé** | BDIFF (Marseille en 13055), GASPAR (FUT-60) | « Aucun feu » pour un arrondissement de Marseille ; 217 feux à l'échelle de la ville | Table PLM explicite, comme FUT-43 |
| 6 | **Périmètre implicite d'un export** | BDIFF 2025 : 21 141 feux sans filtre de date, 2 541 avec (forêt seule) | Un compteur multiplié par huit | Lire la ligne « Critères de sélection » de chaque export et la vérifier |
| 7 | **Source tronquée prise pour un registre** | IREP : extrait ADEME 2019 de 1 495 établissements | « Aucune installation… dans 10 km » à Metz, où le registre 2024 en compte 25 dans le même rayon (aussi Montlouis-sur-Loire, Abbeville, Saint-Amand-Montrond, Guéret) | Lire la source primaire ; jamais de phrase d'absence sur un extrait |
| 8 | **Couverture géographique partielle** | Nappes (outre-mer non couvert) ; LCZ (Toulouse seule sur la Géoplateforme) ; OLD (45 départements) ; CBS (Ardennes seules) | « Pas de nappe » à Saint-Denis de La Réunion | Déclarer la couverture par source ; hors couverture = « non couvert », jamais « absent » |
| 9 | **Source instable** | Rapport Géorisques au point : 26 réponses sur 45, médiane 3,3 s | Une absence à chaque coupure | Délai borné, état `indisponible` distinct, jamais « rien à signaler » |

## 2. Cas négatifs exigés par la mission

| Cas | Constat | Règle de restitution proposée |
|---|---|---|
| **Aucune donnée disponible** | Nappe en outre-mer ; OLD hors des 45 départements ; PEB hors des 224 aérodromes | « La carte ne couvre pas ce territoire » / « aucun zonage publié pour ce département », jamais « non concerné » |
| **Source indisponible** | Rapport Géorisques (42 % d'échecs) ; ANFR en maintenance (HTTP 503 le 27/10) ; BRGM : un appel à 27 s | État `indisponible`, cache court, aucune conclusion ; jamais rangé avec « hors zone » |
| **Réponse vide** | Pièges 1 à 4 ci-dessus | Test de non-régression sur un point connu « en zone » par source, à chaque déploiement |
| **Réponse partielle ou tronquée** | WFS paginés (`COUNT`) ; export BDIFF à périmètre implicite | Lire `numberMatched` ; vérifier les critères de l'export ; troncature = pas de réponse (doctrine `iris-scope.ts`) |
| **Données périmées** | PEB de Roissy : arrêté de 2007 ; OLD : données sources de 2008 dans le Var ; IREP lu en 2019 | Dire la date de l'arrêté ou du millésime à côté du fait ; seuil d'alerte interne au-delà de N ans |
| **Adresse proche de deux objets** | Voir stabilité ci-dessous : Villeneuve-le-Roi passe de la zone B à la zone A **à 50 m** | Si la parcelle croise une autre zone que le point : « en limite de zone » + la plus exposée (règle légale du PEB) |
| **Coordonnées approximatives** | Sur les 45 points de sonde, **7** seulement sont géocodés au numéro ; 31 le sont à la **rue**, 3 au **lieu-dit**, 4 au **centre de commune** (repli quand aucune adresse n'est proche du point tiré). Toutes les sources ont pourtant rendu une classe, sans signaler l'imprécision. (Limite de l'audit lui-même : les points ciblés décrivent donc un secteur ; les 200 adresses de logements, issues des DPE, sont géocodées plus finement.) | N'autoriser une lecture « à l'adresse » qu'avec un géocodage au numéro (`housenumber`) ; sinon « à proximité » (appliqué dans le POC) |
| **Géométrie touchant seulement une limite** | Parcelles en bord de zone OLD (La Teste : hors zone à 100 m dans 3 directions sur 8) | Intersection parcelle avec seuil nommé (comme FUT-81 : 2 % ou 25 m²) avant de dire « le terrain est concerné » |
| **Parcelle mal identifiée** | Relève de FUT-81 (multi-parcelles, copropriété) | Réutiliser la parcelle retenue par FUT-81, ne pas la recalculer |
| **Valeurs contradictoires entre producteurs** | Nappe : carte BRGM « sujet, fiabilité faible » contre rapport Géorisques « Risque inconnu » ; incendies : champ ADEME absent pour Joannas, **11** feux BDIFF | Reprendre la règle du producteur le plus prudent (Géorisques pour la nappe) ; ne pas exposer un champ sans provenance |
| **Mesure communale lue à l'adresse** | BDIFF : Gonfaron a brûlé sur 6 832 ha en 2021, le bourg testé est hors zone OLD | Un fait communal reste communal dans le texte (« dans la commune »), jamais « près de chez vous » |
| **Modèle présenté comme observation** | Nappe (sensibilité modélisée) ; PEB (prévision de trafic) ; potentiel solaire « méthode simplifiée » | Verbe et nature dans la phrase : « la carte classe », « le plan prévoit », « estimation simplifiée » |
| **Infrastructure prise pour une exposition** | Lignes à 225 kV à 71 m (Fos) ; IREP (rejets déclarés) ; antennes | Ne pas restituer ces faits avec un vocabulaire sanitaire ; fait de paysage au mieux |

## 3. Stabilité au voisinage (mesurée)

Pour chaque point « en zone », 8 points à 25, 50 et 100 m (N, NE, E, SE, S, SO, O, NO). Nombre de
directions où la réponse diffère du centre :

| Point | Lecture | Centre | 25 m | 50 m | 100 m | Valeurs à 100 m |
|---|---|---|---|---|---|---|
| Goussainville | PEB | C | 0/8 | 1/8 | 3/8 | B et C, C |
| Villeneuve-le-Roi | PEB | B | **1/8** | **3/8** | 3/8 | B, A et B, A |
| Bouguenais | PEB | D | 0/8 | 1/8 | 3/8 | D, aucune |
| La Teste-de-Buch | OLD | zone | 0/8 | 0/8 | 3/8 | zone, hors zone |
| Landiras | OLD | zone | 0/8 | 0/8 | 0/8 | zone |
| Serres-Gaston | OLD | zone | 0/8 | 0/8 | 0/8 | zone |
| 12 points nappe | Nappe | divers | 0/8 partout | 1/8 (Montlouis) | 4/8 (Montlouis), 0 ailleurs | Montlouis : 0, 1 et 2 (fiabilité faible) |

**Lecture.** Les zones réglementaires sont nettes mais leurs **bords** sont proches de beaucoup
d'adresses : à Villeneuve-le-Roi, l'adresse est à moins de 50 m de la zone A. Le géocodage BAN se trompe
couramment de 10 à 30 m (point de rue, entrée de parcelle). Conclusion : la lecture « à l'adresse » doit
croiser le **point** et la **parcelle** et dire « en limite » quand ils divergent. La nappe, à maille de
250 m, est stable au voisinage, sauf là où la fiabilité est faible (Montlouis), ce qui confirme la règle
« fiabilité faible = ne pas conclure ».

## 4. Les assertions interdites, et ce qu'on peut dire à la place

| Interdit | Admissible | Pourquoi |
|---|---|---|
| « Aucun incendie ici » | « Aucun feu de forêt n'est recensé dans la commune depuis 2006 dans la base nationale (BDIFF) » | Couverture et grain |
| « Logement bruyant » | « L'adresse est en zone C du plan d'exposition au bruit de Roissy (arrêté de 2007) » | Zonage, pas mesure |
| « Eau dangereuse » | (rien sur une observation non attribuable au réseau) | Hub'Eau suit des unités de distribution |
| « Exposition aux ondes » | (rien) | Présence ≠ exposition |
| « Terrain protégé » | « Le terrain est dans le site Natura 2000 X » (seulement si la parcelle y est au-delà d'un seuil nommé) | Intersection marginale |
| « Fibre disponible » | « L'immeuble est déclaré raccordable à la fibre par les opérateurs (ARCEP, T2 2026) » | Déploiement ≠ abonnement ≠ débit |
| « Risque de remontée de nappe » (fiabilité faible) | « La carte ne permet pas de conclure ici » | Règle de Géorisques |
| « Raccordable au réseau de chaleur » | « Un réseau de chaleur passe à 72 m ; seul son gestionnaire peut dire si le raccordement est possible » | Documentation FCU |

## 5. Les deux dettes découvertes dans le produit (hors périmètre, non corrigées)

1. **`PollutionLookup` (page publique `/agir/pollutions-invisibles`)** : sur un extrait IREP 2019
   incomplet, depuis le centre de la commune, la phrase de vide affirme qu'**aucune installation classée
   ICPE** n'existe à 10 km. Fausse réassurance mesurée à Metz (25 établissements déclarants dans le
   registre 2024), Montlouis-sur-Loire (23), Abbeville (7), Saint-Amand-Montrond (6), Guéret (5).
2. **`nombre_dincendies` (ADEME) dans le prompt AskFuture** (« Incendies récents (nombre) ») : provenance
   et période non documentées, présent pour 4 831 communes seulement, absent pour des communes à 9-11 feux
   BDIFF. Le libellé « récents » promet une période que personne ne connaît.

Aucune des deux n'est corrigée ici (mission d'audit). Elles sont proposées au journal d'arbitrage.
