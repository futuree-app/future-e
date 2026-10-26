# FUT-81 : le plan d'urbanisme de la parcelle, ce qui est établi et ce qu'il faut vérifier

**Date** : 26/10/2026 · **Ticket** : [FUT-81](https://linear.app/future-e/issue/FUT-81) · **Base** : `origin/main` `2af75b87` (FUT-80 livré)

**Mesure rejouable** : `scripts/research/fut81-urbanisme-parcelle.mjs` (11 cas choisis, puis `--aleatoire 20 --graine 81`).
Résultats bruts dans `2026-10-26-fut81-urbanisme/mesure-cas.json` et `mesure-aleatoire.json`. Réponses brutes rejouées
par les tests et le banc : `src/lib/__fixtures__/fut81/` (capture : `scripts/research/fut81-capture-fixtures.mjs`).
Rendu réel : `2026-10-26-fut81-urbanisme/rendu/`.

---

## Décision : GO pour une V1 limitée aux faits publiés et aux liens officiels

1. **Intégré** au module Logement, dans la section existante « Statut réglementaire à cette adresse », sous le
   patrimoine protégé : le document d'urbanisme applicable, la ou les zones **qui couvrent** la parcelle, les
   prescriptions cartographiées **sur elle** quand elles changent une vérification d'acheteur, le lien vers le
   règlement de la zone, et ce qu'il faut vérifier avant d'acheter ou de faire des travaux.
2. **États tenus** : confirmé, ambigu (plusieurs documents, document non donné en vigueur, aucune zone lue),
   non trouvé (aucun document publié, commune hors RNU), RNU (régime national, affirmé comme tel), indisponible
   (panne), et rapport antérieur (champ absent, dit à l'écran).
3. **Non intégré, délibérément** : toute lecture du règlement écrit, toute capacité constructible, les
   destinations autorisées (`destoui`/`destcdt`/`destnon` vides ou absents sur les cinq PLU relevés en brut), les informations surfaciques
   (droit de préemption, archéologie, taxe d'aménagement), les servitudes non patrimoniales.
4. **Pourquoi GO** : 25 adresses sur 27 ont un document publié et en vigueur ; la zone de la parcelle est établie
   dans 24 cas sur 25 sans ambiguïté après filtrage ; l'API est publique, sans clé, rapide (médiane 0,3 s) ; et
   l'information change une vérification réelle dans au moins trois cas (section 6).
5. **Pourquoi limité** : la nomenclature nationale ne dit pas ce qu'un règlement autorise ; les prescriptions
   locales foisonnent (jusqu'à 21 sur une parcelle) ; un tiers des parcelles « touchent » une zone voisine qui ne
   les concerne pas. Toute conclusion au-delà des faits publiés serait une interprétation juridique.

---

## 1. Ce que futur•e savait déjà, et ce qui manquait

| Brique | Fichier | Ce qu'elle établit | Grain | État avant FUT-81 |
| --- | --- | --- | --- | --- |
| Servitudes patrimoniales | `src/lib/gpu.ts`, `gpu-servitudes.ts` | AC1 (abords MH), AC2 (sites), AC4 (SPR), binaire | point | intégré, inchangé |
| Plan de prévention des risques | `src/lib/georisques.ts`, `pprn-zonage.ts` | zone réglementaire PPRN, régime, plan, date | parcelle puis point | intégré, inchangé |
| Parcelle cadastrale | `src/lib/cadastre.ts` | identifiant, contenance, rattachement point ou repli | parcelle | géométrie lue puis **jetée** |
| Permis autour | `src/lib/server/sitadel-permis.ts`, `decision/autour-permis.ts` | autorisations **créant des logements** autour de l'adresse (Sitadel × cadastre) | parcelles voisines | intégré au module Autour, inchangé |
| Document d'urbanisme, zone, prescriptions | — | — | — | **absent** |
| Script de recherche | `scripts/research/gpu-servitudes-adresse.mjs` | couverture GPU au point (10 adresses) | point | exploration, jamais branchée |

Ce qui manquait réellement : le **document applicable** et la **zone de la parcelle** (pas du point), les
**prescriptions** de la parcelle, le **règlement** à lire. Rien de cela ne duplique GPU-patrimoine (SUP, autre
couche) ni Sitadel (autorisations obtenues, pas règles applicables).

Un défaut de l'existant, corrigé ici : l'état « aucun PPRN ni patrimoine » s'intitulait **« Aucune règle de
construction particulière à cette adresse »**. C'était déjà inexact (toute parcelle relève d'un PLU, d'une carte
communale ou du RNU) et serait devenu contradictoire à côté du plan d'urbanisme. Il dit désormais ce qu'il a
vérifié : « Ni plan de prévention des risques ni périmètre patrimonial à cette adresse ». L'état « non déterminé »
nomme de même son objet. Points de citation repris (règle AGENTS.md) : `RegulatorySection.tsx`, la copie du
prototype `fut87/LogementReleve.tsx`, l'assertion de `logement-report-version.test.ts`. `inondation-lecture.ts`
cite l'ancienne phrase comme trace historique d'un défaut : laissé tel quel.

---

## 2. Les sources officielles

| Source | Point d'accès | Usage | Licence, quota |
| --- | --- | --- | --- |
| BAN (Géoplateforme) | `data.geopf.fr/geocodage` via `geocodeur-ban.ts` | adresse → point | Licence ouverte, sans clé |
| Cadastre (API Carto IGN) | `apicarto.ign.fr/api/cadastre/parcelle` | point → parcelle + **géométrie** | Licence ouverte, sans clé |
| GPU (API Carto IGN) | `apicarto.ign.fr/api/gpu/{municipality,document,zone-urba,secteur-cc,prescription-surf,prescription-lin,prescription-pct}` | régime RNU, documents, zones, secteurs de carte communale, prescriptions | Licence ouverte, sans clé ; aucun 429 observé sur ~450 appels |
| GPU (site) | `geoportail-urbanisme.gouv.fr/api/document/{id}/details` et `/files` | statut juridique (`legalStatus`, `effectiveStatus`), date de publication, producteur, liste des pièces dont le règlement écrit | sans clé ; fichiers servis par redirection 302 |
| Standard CNIG PLU v2024-01 | cnig.gouv.fr | nomenclature nationale des zones (U, AUc, AUs, A, N) et des prescriptions (`typepsc`/`stypepsc`) | — |
| Standard CNIG carte communale | COVADIS / CNIG | secteurs 01 ouvert, 02 activités, 03 non ouvert, 99 non couvert | — |

Le chemin testé : **adresse BAN → parcelle cadastrale (au point, sinon repli 3/8/15 m comme en production) → GPU
interrogé avec la géométrie de la parcelle → documents → zones et prescriptions → détail du document → règlement**.

Constats techniques :

- Les couches GPU acceptent `POST {geom}` : une parcelle aux nombreux sommets ne dépasse jamais une longueur d'URL.
- Elles rendent toujours la **géométrie entière** des zones et prescriptions intersectées. Cas le plus lourd :
  6,2 Mo de prescriptions à Cesson-Sévigné (Rennes Métropole), 2,3 s. Médiane des réponses : 35 Ko.
- La date d'approbation se lit dans l'identifiant CNIG du document (`<SIREN>_PLUi_20260326`) ; la date de
  publication dans le détail.
- `nomfic` de la zone nomme le fichier de **son** règlement. À La Rochelle, la zone « PSMV » du PLUi renvoie à
  `241700434_psmv_20260305.pdf`, **absent** des pièces du PLUi. On ne le remplace pas par le règlement du PLUi.
- Cache : une lecture appartient à la version du dossier (immuable, cf. section 7). Pas de cache partagé ajouté.

---

## 3. L'échantillon et la mesure

**31 adresses** : 11 choisies pour couvrir le cahier FUT-81, 20 tirées au hasard (communes pondérées par leur
population, point décalé de quelques centaines de mètres du centre, graine 81). 4 tirages n'ont pas d'adresse BAN
dans le rayon du géocodage inverse (dont Wallis-et-Futuna, hors BAN) : échec de l'échantillonnage, pas du chemin.
**27 adresses mesurées.**

| Cas choisi | Adresse | Parcelle | Document | Zone(s) retenue(s) | Ce qu'il montre |
| --- | --- | --- | --- | --- | --- |
| Centre, PLUi + secteur sauvegardé | 12 rue du Palais, La Rochelle | repli | PLUi | PSMV | règlement de la zone **non publié** au GPU |
| Centre, PSMV | 14 rue des Francs-Bourgeois, Paris 3e | point | PSMV | US | 21 prescriptions brutes |
| Résidentiel, PLUi-H | 8 av. des Pins, Blagnac | point | PLUi | UM4-4 | 11 prescriptions, dont 3 en bordure |
| Résidentiel, IDF | 15 av. du Général Leclerc, Bourg-la-Reine | repli | PLUi | U2b | polygone voisin de même zone en bordure |
| PLUi métropolitain | 12 rue de la Chalotais, Cesson-Sévigné | point | PLUi | UC2 | réponse de 6,2 Mo |
| Prescriptions patrimoniales | 10 rue d'Austerlitz, Lyon 4e | point | PLUi | UCe1a | zone voisine UCe3-p et « élément bâti à préserver » **du voisin** à 0 % |
| Montagne | 48 rue de l'Hôtel de Ville, Chamonix | point | PLU | Ua | deux polygones Ua-h en bordure |
| Bourg rural | 3 rue de la Paix, Bonnat | point | PLUi | Ua | deux zones voisines à 0 % |
| Carte communale | 1 rue d'Orléans, Vauquois | repli | CC | secteur C (01) | aucun règlement propre |
| RNU | 3 impasse du bois d'Ardon, Châtelard | point | — | — | `is_rnu: true` |
| Sans document | rue de l'École, Grandvals | point | — | — | hors RNU, rien publié : **non trouvé** |

Synthèse sur les 27 adresses :

| Mesure | Résultat |
| --- | --- |
| Parcelle résolue | 27/27 (22 au point, 5 par repli) |
| Ambiguïté adresse → parcelle | 2 à 4 parcelles à moins de 5 m du point dans 13 cas sur 27 : la lecture porte sur **une** parcelle et le dit |
| Document publié | 25/27 (PLU, PLUi, PSMV, CC), tous `APPROVED` + `EN_VIGUEUR` ; 1 RNU ; 1 non trouvé |
| Zone établie | 24/25 zone(s) retenue(s) ; 1 carte communale (secteur) |
| Plusieurs zones réelles | 2/25 (Mérignac 61/39 %, Sucy-en-Brie 46/52/2,4 %) |
| Zone voisine « touchée » sans couvrir | **12/25** (0 à 0,1 % de la parcelle) |
| Prescription qui change une vérification | 10/25 (emplacement réservé 3, patrimoine ou paysage 9, constructibilité limitée 3), d'après la mesure : même seuil surfacique, lignes non filtrées |
| Règlement écrit | présent parmi les pièces et servi (redirection 302) pour les 24 PLU, PLUi et PSMV ; la carte communale n'en a pas, par nature ; à La Rochelle, le fichier que désigne la zone n'est pas parmi les pièces (dit à l'écran) |
| Temps GPU (sept couches en parallèle + détail) | médiane 0,32 s, p90 0,70 s, max 2,3 s ; cadastre médiane 47 ms |
| Calcul de la lecture | 58 ms sur 3,9 Mo de prescriptions (Rennes) |

**La méthode est vérifiée hors des exemples positifs** : le tirage aléatoire reproduit les mêmes phénomènes que
les cas choisis (zones voisines en bordure dans 9 tirages sur 16, emplacements réservés à Mérignac, Sucy-en-Brie,
Six-Fours), et les tests portent aussi sur des cas synthétiques adverses (deux parcelles d'une même adresse de part
et d'autre d'une limite de zone, URL de producteur piégée, document annulé, pannes partielles).

---

## 4. Doctrine de fiabilité appliquée

| Catégorie | Ce que la V1 en fait | Exemple à l'écran |
| --- | --- | --- |
| **A. Fait réglementaire publié** | affiché, sourcé, daté | « Cette parcelle est en zone UCe1a du plan local d'urbanisme intercommunal (PLUi). » |
| **B. Observation** | grain et rattachement dits | « Le point de l'adresse ne tombait dans aucune parcelle : la plus proche a été retenue. Elle peut être celle d'un voisin. » |
| **C. Calcul dérivé** | part de parcelle, arrondie, présentée comme ordre de grandeur ; sert surtout à écarter les zones voisines | « Emplacement réservé · sur environ 13 % de la parcelle » ; « ce sont des ordres de grandeur, qui ne mesurent pas ce qui peut être bâti » |
| **D. Hypothèse ou interprétation** | **jamais produite** ; renvoyée au règlement, à la mairie, au certificat d'urbanisme | « Ce zonage ne dit pas, à lui seul, ce qui est autorisé. […] faites confirmer le projet par le service urbanisme de la mairie. » |

Seuils (calcul dérivé, nommés et versionnés `fut81-1` dans `urbanisme-parcelle.ts`) : une zone ou une prescription
surfacique **couvre** la parcelle si elle en occupe au moins **2 %** ou **25 m²** estimés. Les bordures mesurées
vont de 0 à 0,1 % ; la plus petite part réelle relevée est 2,4 % (1 300 m²) ; le second seuil garde un emplacement
réservé de voirie de 45 m² sur 5 000 m² (0,9 %). Une prescription linéaire ou ponctuelle n'est retenue que si elle
passe **à l'intérieur** de la parcelle : un linéaire posé sur la limite peut être celui du voisin.

Prescriptions **nommées** (familles CNIG qui changent une vérification) : espace boisé classé (01), constructibilité
limitée pour risque ou environnement (02), démolition ou reconstruction encadrée (03), emplacement réservé (05),
patrimoine ou paysage protégé (07), terrain non bâti protégé (08), changement de destination, extension d'une
habitation ou STECAL en zone A ou N (16-01, 16-02, 16-03), voie à créer ou modifier (24-01 à 03), espace remarquable
du littoral (31). Chaque note dit l'effet que le code de l'urbanisme donne à la famille, puis la vérification ; aucune
ne conclut sur le projet du lecteur. Les autres familles (stationnement, hauteur, mixité sociale, OAP…) sont
**citées** et renvoyées au règlement ; le code 99 (« autre ») est compté, pas nommé.

Garde-fous testés sur le texte rendu de tous les cas réels : jamais « constructible » (hors « inconstructible »),
« droit à construire », « vous pouvez construire/agrandir », « est/sera autorisé », « aucune règle/contrainte » ;
toujours la limite du zonage et la vérification en mairie quand une zone est lue ; jamais futur•e présenté comme un
certificat d'urbanisme.

---

## 5. Articulation avec les données existantes

- **GPU urbanisme (nouveau)** : la règle applicable. **GPU servitudes (existant)** : patrimoine au point, inchangé.
  Même hôte, deux couches distinctes, aucun doublon.
- **Cadastre** : identité et géométrie. La géométrie sert à la lecture, elle n'entre pas dans le rapport.
- **Sitadel (module Autour)** : autorisations **créant des logements** autour. La V1 le rappelle dans sa méthode :
  « Règle applicable n'est pas autorisation obtenue ». Aucun mélange des deux.
- **Géorisques / PPRN** : déjà traité ; les prescriptions 02 « risque » du PLU s'affichent comme prescriptions du
  PLU, sans prétendre décrire le PPRN.
- **RNB (FUT-80)** : non utilisé. Un bâtiment peut chevaucher plusieurs parcelles ; la lecture reste à la parcelle
  rattachée à l'adresse.
- **FUT-83 (copropriété)** : une copropriété peut s'étendre sur plusieurs parcelles ; la V1 dit qu'elle lit une
  parcelle. Le rattachement « toutes les parcelles du lot » relèverait de FUT-83.

---

## 6. Où l'urbanisme change une vérification ou un arbitrage

1. **Six-Fours-les-Plages, 1682 avenue du Brusc.** Parcelle de 3 764 m² en zone UE (habitat individuel). Un
   **emplacement réservé couvre environ 13 % du terrain** (≈ 490 m²). Rien d'autre dans futur•e ne le montrait. Pour
   un acheteur qui projette une piscine, une annexe ou une division, la vérification change : demander en mairie
   l'objet et le bénéficiaire de la réserve avant de s'engager, cette partie ne pouvant accueillir une construction
   contraire à sa destination.
2. **Mérignac, 14 avenue Ariane.** La parcelle est **partagée entre deux zones** (US7 ≈ 61 %, US9 ≈ 39 %), avec un
   emplacement réservé de voirie de ≈ 45 m² et un bois protégé de ≈ 30 m² en bordure intérieure. Un projet ne se lit
   pas dans un seul chapitre du règlement.
3. **Lyon 4e, 10 rue d'Austerlitz.** Ce que la V1 **n'affiche pas** compte autant : le GPU rend pour cette parcelle
   une zone UCe3-p et un « élément bâti à préserver » qui appartiennent au voisin (0 % de la parcelle). Une lecture
   naïve aurait attribué au logement une protection patrimoniale qui n'est pas la sienne.
4. **La Rochelle, rue du Palais.** Zone de secteur sauvegardé dont le règlement n'est pas publié au GPU : la V1 le
   dit et renvoie au service urbanisme, au lieu de lier le règlement du PLUi, qui ne s'y applique pas.

---

## 7. Intégration V1

| Fichier | Rôle |
| --- | --- |
| `src/lib/urbanisme-parcelle.ts` | lib **pure** : contrat `UrbanismeParcelle`, nomenclatures CNIG, part de parcelle (grille de points), choix du règlement, statuts |
| `src/lib/gpu.ts` | `fetchUrbanismeParcelle` : sept couches en `POST` parallèles (8 s), détail et pièces (4 s), **ne lève jamais** |
| `src/lib/cadastre.ts` | `findCadastreParcelWithGeometry` ; `findCadastreParcelByPoint` inchangé pour ses autres appelants |
| `src/app/api/georisques-logement/route.ts` | l'urbanisme attend la parcelle (~50 ms) puis part en parallèle du reste |
| `src/lib/logement-report-types.ts` | champ `urbanisme?` (absent = rapport antérieur) ; `parcel.rattachement` typé |
| `src/lib/logement-report-version.ts` | `urbanisme` compte comme source absente **seulement** sur `indisponible` |
| `src/components/report/logement/UrbanismeBlock.tsx` | rendu, dans `RegulatorySection.tsx` (même carte, sous le patrimoine) |
| `src/app/dev/fut81/page.tsx` | banc du vrai module sur les réponses réelles (`?cas=…`, dont `panne` et `ancien`) |

Versions et dossiers payants :
- La lecture **appartient à la version** (elle entre dans le rapport, donc dans son empreinte) et ne change plus.
  Aucun horodatage dans la lecture : deux collectes identiques donnent la même empreinte, pas de version fantôme.
- Un dossier antérieur s'ouvre tel quel, sans appel : l'écran dit « collecté avant la lecture du plan d'urbanisme.
  Une actualisation des données l'ajoutera. » Son empreinte ne bouge pas.
- Actualisation : une version N+1 qui lit l'urbanisme est écrite ; N reste intacte. Si N avait l'urbanisme et que
  le GPU est en panne, l'actualisation est **refusée** et N reste affichée.
- Limite assumée, identique à FUT-80 pour le bâtiment : actualiser un dossier **antérieur** pendant une panne GPU
  est refusé (la nouvelle collecte a une source absente que N n'avait pas déclarée). Le lecteur garde N.
- Aucune migration, aucune écriture sur les dossiers existants, aucun appel Anthropic : la synthèse et le moteur de
  décision ne lisent pas encore l'urbanisme (aucune empreinte de faits ne change).

---

## 8. Contrôles

| Contrôle | Résultat |
| --- | --- |
| Tests ciblés `src/lib/fut81-urbanisme-parcelle.test.ts` | 21/21 |
| Tests liés (`logement-report-version`, `fut127-inondation-adresse`, `gpu-servitudes`, `logement-sources-bornees`, `geocodeur-ban`) | verts |
| Suite complète, lancée seule | **3 465 / 3 465**, 0 échec (3 444 avant + 21) |
| TypeScript `tsc --noEmit` | 0 erreur |
| Lint des fichiers modifiés | 0 problème |
| Lint `eslint src` | 6 erreurs, 8 avertissements : **identiques à `main`**, aucune dans FUT-81 |
| `npm run lint` | échoue comme sur `main` (plugin `react` non défini dans la config) |
| `npm run index:verify` | « Index vérifié. » |
| `npm run build` | réussi |
| Recette du vrai module (`/dev/fut81`) | bureau 1 512 px, fenêtre 500 px, cadre 360 px ; tous les états ; captures dans `rendu/` |

Deux défauts **préexistants** relevés pendant la recette, hors FUT-81, non corrigés ici :
- Sur les bancs `/dev/fut80` et `/dev/fut81`, la synthèse reçoit une page d'erreur HTML (pas de backend) et
  l'affiche en texte brut : la grille du module s'élargit à 3 800 px. Artefact de banc.
- À 360 px, l'intertitre « Ce à quoi cette adresse est exposée » impose 378 px à la grille du module, qui déborde
  de 20 px. Visible aussi sans FUT-81 (cas `ancien`). Relève de l'ergonomie mobile (FUT-143).

---

## 9. Limites et suites

- **Couverture GPU** : excellente sur l'échantillon (25/27), mais une commune peut avoir un document non versé
  (Grandvals) ou un document versé en retard sur une procédure. La V1 dit la date et renvoie à la mairie.
- **Écart de tracé plan / cadastre** : le seuil de 2 % / 25 m² écarte les bordures mesurées ; une zone voisine
  réelle et minuscule serait écartée elle aussi (elle reste citée dans la méthode, « à confirmer sur le plan »).
- **Destinations** (`destoui`, `destcdt`, `destnon`) : vides ou absentes sur les PLU relevés. À rebrancher seulement si un producteur
  les renseigne.
- **Suites candidates** (non engagées) : informations surfaciques utiles à l'acheteur (droit de préemption
  urbain, zone de saisine archéologique) ; prescriptions dans la synthèse et les « à vérifier » du moteur de
  décision ; lien vers la carte du GPU centrée sur la parcelle ; lecture multi-parcelles avec FUT-83.
- **À ne pas faire** : moteur de lecture du règlement écrit, capacité constructible, ingestion nationale.
