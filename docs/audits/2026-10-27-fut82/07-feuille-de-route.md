# FUT-82 · 7. Feuille de route par vagues et backlog proposé

> Une recommandation n'est pas une obligation de développer. Rien n'est ouvert dans Linear sans accord.

## Ordre pressenti par le ticket, et ce que la mesure en fait

| Rang pressenti | Candidate | Ce que l'audit a mesuré | Rang proposé |
|---|---|---|---|
| 1 | IREP détaillé | Le détail existe (registre 2024), mais 89 % « sous le seuil », CO₂ et ammoniac dominent, rejets ≠ air respiré | **Veille** (et corriger l'outil public) |
| 2 | BDIFF | Mémoire réelle, grain commune, **licence contradictoire** (usage commercial exclu à l'export) | **Vague B**, après accord du producteur |
| 3 | Bruit aérien | Fait réglementaire au point, effet légal, 90 ms, absent du produit | **Vague A** |
| 4 | Espaces protégés | 0 % des logements dans Natura 2000, 8 % en PNR ; valeur de voisinage | **Vague B** |
| 5 | Lignes électriques | 1 % des logements à moins de 100 m, interprétation sanitaire non concluante | **Veille** |
| (nouveau) | Débroussaillement (OLD) | 10 % des logements, obligation légale à l'adresse, compose avec le feu déjà lu | **Vague A** |
| (benchmark) | Nappes | 60 % des logements « sujets » : ne trie pas, sauf sous-sol | **Vague B**, conditionnelle |

## Vague A : forte valeur, faible risque (deux propositions)

### A1. Bruit aérien réglementaire (PEB + PGS) à l'adresse

- **Valeur attendue** : un fait que le vendeur devra fournir de toute façon, annoncé avant la visite, avec
  ses conséquences sur un Projet (extension, calme) et une aide possible (PGS).
- **Périmètre exact** : lecture au point et à la parcelle ; zone la plus exposée ; état `en_limite` ;
  section « Statut réglementaire » du Logement ; un point à vérifier. Ni carte, ni score, ni AskFuture,
  ni synthèse en V1.
- **Effort** : 1,5 à 2 jours, tests compris.
- **Risque** : faible ; le principal est éditorial (glisser vers « bruyant »).
- **Dépendances** : fusion de FUT-81 ; licence DGAC à confirmer.
- **Critère de réussite** : sur les points de référence (Villeneuve-le-Roi, Goussainville, Bouguenais, La
  Rochelle), le texte rendu dit la bonne zone, la date de l'arrêté, la portée et la vérification ; un
  dossier antérieur est inchangé.
- **Ce qui ferait abandonner** : licence restrictive de la DGAC, ou couche retirée de la Géoplateforme
  sans équivalent national.

### A2. Obligation légale de débroussaillement (OLD) à l'adresse

- **Valeur attendue** : passer d'un geste générique (« le débroussaillement pèse sur… ») à un fait de
  l'adresse, daté par l'arrêté, avec une charge concrète et une vérification ; composer ensuite avec le
  danger d'incendie déjà lu.
- **Périmètre exact** : lecture au point et à la parcelle du zonage diffusé ; `non_couvert` hors des
  45 départements ; section « Statut réglementaire » ; un point à vérifier. La composition feu (niveau 3)
  est une seconde étape.
- **Effort** : 1,5 jour (même patron que A1).
- **Risque** : faible à moyen : le zonage est informatif et parfois ancien (données sources de 2008 dans
  le Var) ; texte « selon le zonage publié ».
- **Dépendances** : FUT-81 (géométrie de parcelle) ; citation exacte du décret d'application.
- **Critère de réussite** : La Teste-de-Buch « en zone », Gonfaron bourg « hors zone » malgré la mémoire
  communale du feu, La Rochelle « non couvert » ou « hors zone » selon le département, panne lue
  « indisponible ».
- **Ce qui ferait abandonner** : constat que le zonage diffusé diverge de manière significative des
  arrêtés sur un échantillon de départements (contrôle à faire en revue).

**Pourquoi ces deux-là et pas d'autres.** Ce sont les deux seules candidates qui réunissent : un fait au
grain de l'adresse, un **effet légal ou financier** démontré, une source nationale publique rapide et
stable, l'**absence** de l'information dans le produit, et une restitution simple qui ne promet rien
au-delà du zonage. Elles servent trois moats : Incertitude actionnable (pièce à demander, vérification),
Projet (extension, maison), Composition (feu ; plus tard bruit × ventilation de FUT-21).

## Vague B : à préparer après le lancement

| Candidate | Valeur | Périmètre | Effort | Risque | Dépendances | Réussite | Abandon si |
|---|---|---|---|---|---|---|---|
| **BDIFF** (mémoire du feu, commune) | Nuance la projection DRIAS (1 198 communes à danger bas ont brûlé) | Fait communal daté, composé avec l'OLD ; import annuel ; table PLM | 2 jours | Moyen (grain, lecture abusive) | **Accord écrit du producteur** sur l'usage commercial ; certificat TLS | Gonfaron : « 6 832 ha en 2021 dans la commune », jamais « près de chez vous » | Refus ou silence du producteur |
| **Nappes** (conditionnelle) | Décisif pour une cave ou un sous-sol | Lecture au point, fiabilité moyenne ou forte, seulement si sous-sol déclaré (qualification ou Projet) | 2-3 jours (dont la question « sous-sol ») | Moyen (sur-alerte) | Un champ « sous-sol / cave » dans la qualification (FUT-143) ou le Projet | Règle Géorisques reproduite 25/25 ; aucune carte sans sous-sol déclaré | Le lecteur ne sait pas répondre à « le bien a-t-il un sous-sol ? » |
| **Espaces protégés** | Cadre de vie (voisinage), contraintes de travaux (cœur de parc, APB) | Fait de voisinage dans Autour ; intersection de parcelle au-delà d'un seuil pour le terrain | 2 jours | Moyen (« terrain protégé » abusif) | FUT-81 (seuils parcellaires), FUT-19 | Saintes-Maries, Agel corrects ; aucune ZNIEFF lue comme protection | Valeur de voisinage non perçue en test |
| **Réseaux de chaleur** | Option de rénovation, obligation de raccordement (PDP) | Logement, composé avec le DPE | 1 jour | Faible (« raccordable » abusif) | FUT-143 (DPE) | Grenoble 72 m, Metz PDP, La Rochelle hors seuil | Faible usage en rénovation |
| **PNR en signature territoriale** | Identité du lieu (« dans le PNR du Verdon ») | Territoire | 0,5 jour | Faible | Doctrine « distinctif et identitaire » | — | — |

## Vague C : expérimentations pour des Projets particuliers

| Candidate | Profil | Périmètre | Condition |
|---|---|---|---|
| **PVGIS** | Panneaux solaires, rénovation | Ordre de grandeur kWh/kWc, appel différé (0,9-4 s) | Projet « solaire » déclaré |
| **Potentiel solaire du bâti (Cerema)** | Idem | Seulement après rattachement RNB ↔ BD TOPO (FUT-80) | Mention « estimation simplifiée » |
| **Fibre ARCEP** | Télétravail rural | Import trimestriel d'un fichier national, lecture par immeuble | Projet « télétravail » déclaré ; coût d'ingestion accepté |

## Écartées ou en veille

| Candidate | Statut | Raison |
|---|---|---|
| IREP détaillé dans le dossier | Veille | Rejets déclarés ≠ exposition ; masses non comparables |
| Cartes de bruit stratégiques | Veille | Pas d'agrégat national |
| Lignes électriques | Veille | Rare, interprétation sanitaire non concluante |
| Piézométrie | Écartée à l'adresse | Station active médiane à 5 km |
| Rapport Géorisques au point | Écarté comme source | Instable (26/45) |
| ANFR antennes et mesures | Écartées | Présence ≠ exposition |
| ZNIEFF | Écartée | Inventaire sans effet juridique |
| SISPEA | Veille | Budget, pas décision |
| AZI / EAIP | Écartées | Redondantes avec la lecture inondation |
| Annuaire Éducation | Veille | La BPE suffit |
| IPS, SSMSI | Écartées | Décision éditoriale confirmée par la mesure |
| Fiscalité locale | Écartée | Non attribuable au bien |
| LCZ | Veille | L'ICU couvre le besoin là où il existe |
| IRVE, pollution lumineuse, couverture mobile | Écartées | Effet décisionnel faible ou source absente |
| ARIA | Veille | Non sondée en détail |

## Backlog proposé (rien n'est créé sans accord)

### Tickets à créer, au plus quatre

1. **« Bruit aérien réglementaire (PEB et PGS) à l'adresse »** (vague A1). À créer **après** la fusion de
   FUT-81. Lien : FUT-82, FUT-81, FUT-21.
2. **« Obligation légale de débroussaillement à l'adresse »** (vague A2). Même condition. Lien : FUT-82,
   FUT-81, FUT-85.
3. **« Outil pollutions invisibles : la phrase de vide IREP affirme une absence fausse »** (dette,
   petite correction indépendante : retirer la phrase ou passer au registre officiel). Peut être traité
   avant le lancement.
4. **« AskFuture : retirer ou documenter le champ `nombre_dincendies` sans provenance »** (dette ; à
   rattacher au fil AskFuture, FUT-142 étant fermé).

### Tickets existants à enrichir plutôt que dupliquer

| Ticket | Ajout proposé |
|---|---|
| **FUT-19** (carte autour de l'adresse) | Résultats mesurés pour ses cinq candidats ; la carte n'a pas besoin du PEB pour qu'il soit utile (le fait textuel suffit) ; protections et lignes = faits de voisinage éventuels |
| **FUT-21** (incertitude actionnable) | PEB comme entrée du pilote « dormir fenêtres ouvertes » ; « document de zone de bruit » et « information OLD » comme réponses de type *document vendeur* |
| **FUT-85** (composition) | Candidats V2 : OLD × danger d'incendie ; nappe × sous-sol déclaré ; PEB × Projet d'extension |
| **FUT-12** (provenance) | Exemple concret : arrêté PEB de 2007 lu en 2026 ; OLD avec données sources de 2008 et arrêté de 2025 |
| **FUT-81** | Coordination : PEB, servitude I4 et protections relèvent aussi du droit de la parcelle ; réutiliser `geometrie-parcelle.ts` |
| **FUT-118 / FUT-126** | Fiches « À retenir / Pour votre projet / À vérifier / Comprendre la donnée » de `06-architecture-vague-a.md` §11 |
| **FUT-83** (RNIC) | Aucune dépendance relevée |
