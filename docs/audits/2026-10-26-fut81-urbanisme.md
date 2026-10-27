# FUT-81 : le plan d'urbanisme de la parcelle, ce qui est établi et ce qu'il faut vérifier

**Date** : 26/10/2026 · **Ticket** : [FUT-81](https://linear.app/future-e/issue/FUT-81) · **Base** : `origin/main` `2af75b87` (FUT-80 livré)

**Mesure rejouable** : `scripts/research/fut81-urbanisme-parcelle.mjs` (11 cas choisis, puis `--aleatoire 20 --graine 81`).
Résultats bruts dans `2026-10-26-fut81-urbanisme/mesure-cas.json` et `mesure-aleatoire.json`. Réponses brutes rejouées
par les tests et le banc : `src/lib/__fixtures__/fut81/` (capture : `scripts/research/fut81-capture-fixtures.mjs`).
Rendu réel : `2026-10-26-fut81-urbanisme/rendu/`.

> **Deuxième revue indépendante du 27/10/2026 (`e73ec075`) : NO GO, aire d'intersection fausse près des
> limites ; corrigée.** Calcul confié à Clipper, confronté à GEOS, projection corrigée : section 11. Les surfaces en
> m² citées ci-dessous sont celles du code corrigé (+0,7 % environ ; Besançon et Mérignac plus encore).
>
> **Revue indépendante du 27/10/2026 (`992af92f`) : NO GO, cinq blocages, tous corrigés.** Le détail, les
> reproductions avant et après et les tests qui les rejouent sont à la section 10. Les chiffres des sections 3, 4,
> 6, 7 et 8 sont ceux du code corrigé : le calcul de surface est désormais exact, au lieu d'une grille de points.
> Le texte du bloc reste jugé trop long et trop technique par le porteur : sa vulgarisation est l'objet de
> [FUT-144](https://linear.app/future-e/issue/FUT-144).

---

## Décision : GO pour une V1 limitée aux faits publiés et aux liens officiels

1. **Intégré** au module Logement, dans la section existante « Statut réglementaire à cette adresse », sous le
   patrimoine protégé : le document d'urbanisme applicable, la ou les zones **qui couvrent** la parcelle, les
   prescriptions cartographiées **sur elle** quand elles changent une vérification d'acheteur, le lien vers le
   règlement de la zone, et ce qu'il faut vérifier avant d'acheter ou de faire des travaux.
2. **États tenus** : confirmé, ambigu (parcelle rattachée par proximité ou sur une limite, vigueur du document
   non vérifiée, document hors vigueur, plusieurs documents, aucune zone lue, géométrie illisible), non trouvé
   (aucun document publié, commune hors RNU), RNU (régime national, affirmé comme tel), indisponible (panne), et
   rapport antérieur (champ absent, dit à l'écran).
3. **Non intégré, délibérément** : toute lecture du règlement écrit, toute capacité constructible, les
   destinations autorisées (`destoui`/`destcdt`/`destnon` vides ou absents sur les cinq PLU relevés en brut), les informations surfaciques
   (droit de préemption, archéologie, taxe d'aménagement), les servitudes non patrimoniales.
4. **Pourquoi GO** : 25 adresses sur 27 ont un document publié et en vigueur ; la zone de la parcelle est établie
   dans 24 cas sur 25 (dont 5 conditionnelles, la parcelle ayant été rattachée par proximité) ; l'API est publique,
   sans clé, rapide (médiane 0,4 s) ; et l'information change une vérification réelle dans au moins trois cas
   (section 6).
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
| Parcelle résolue | 27/27 (22 au point, 5 par repli, à 0,2 à 9,9 m : lecture **conditionnelle**, dite avant les zones) |
| Ambiguïté adresse → parcelle | 2 à 4 parcelles à moins de 5 m du point dans 13 cas sur 27 : la lecture porte sur **une** parcelle et le dit |
| Document publié | 25/27 (PLU, PLUi, PSMV, CC), vigueur **établie** pour les 25 (`APPROVED` + `EN_VIGUEUR`) ; 1 RNU ; 1 non trouvé |
| Statut de la lecture | 21 confirmées, 5 ambiguës (toutes par rattachement de proximité), 1 non trouvée |
| Zone établie | 24/25 zone(s) retenue(s) ; 1 carte communale (secteur) |
| Plusieurs zones réelles | 2/25 (Mérignac 62/38 %, Sucy-en-Brie 53/45/2,3 %) |
| Zone voisine « touchée » sans couvrir | **12/25** ; aire exacte de 0 à 4,5 m², sauf un liseré de 43 m² sur 5,5 ha à Sucy-en-Brie (dit comme bordure) — chiffres refaits en section 11 |
| Prescription nommée sur la parcelle | 10/25 (emplacement réservé 3, patrimoine ou paysage 8, constructibilité limitée 2) ; 13 prescriptions qui ne font que toucher la limite, sur 5 parcelles, écartées et comptées |
| Règlement écrit | présent parmi les pièces et servi (redirection 302) pour les 24 PLU, PLUi et PSMV ; la carte communale n'en a pas, par nature ; à La Rochelle, le fichier que désigne la zone n'est pas parmi les pièces (dit à l'écran) |
| Temps GPU (sept couches en parallèle + détail) | médiane 0,42 s, p90 1,4 s ; un pic à 9,3 s à Lyon le 27/10 (délais de 8 s par appel en production, dépassement dit `non_verifiee` ou `indisponible`) ; cadastre médiane 47 ms |
| Calcul de la lecture (aire exacte) | 323 ms au pire, sur la plus lourde réponse de l'échantillon |

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
| **C. Calcul dérivé** | aire exacte de l'intersection, arrondie, présentée comme ordre de grandeur ; sert surtout à écarter les zones voisines | « Emplacement réservé · sur environ 14 % de la parcelle (≈ 519 m²) » ; « ce sont des ordres de grandeur, qui ne mesurent pas ce qui peut être bâti » |
| **D. Hypothèse ou interprétation** | **jamais produite** ; renvoyée au règlement, à la mairie, au certificat d'urbanisme | « Ce zonage ne dit pas, à lui seul, ce qui est autorisé. […] faites confirmer le projet par le service urbanisme de la mairie. » |

Seuils (conventions de lecture, jamais des exemptions réglementaires, nommés et versionnés `fut81-3` (seuils inchangés depuis `fut81-2`) dans
`urbanisme-parcelle.ts`) :
- une **prescription** couvre la parcelle au-delà de **2 %** ou de **25 m²** d'aire exacte (bandes de 30 et 50 m² de la
  revue, emplacement réservé de voirie de 71 m² à Mérignac). En deçà, elle est **affichée comme marginale**, à vérifier
  sur le plan ; seul un contact sans recouvrement (aire < 0,05 m²) est écarté, et compté ;
- une **zone** couvre la parcelle au-delà de **2 %** seulement. Les zones pavent le territoire : toute parcelle touche
  ses voisines, et l'écart de tracé laisse des liserés (de 0 à 4,5 m² sur l'échantillon, 43 m² sur une parcelle de
  5,5 ha). Un liseré de 25 m² ou plus est **dit à l'écran** comme une bordure à vérifier, pas comme une zone de la
  parcelle. La plus petite part réelle relevée est de 2,3 % (1 265 m², Sucy-en-Brie) ;
- une prescription linéaire ou ponctuelle n'est retenue que si elle passe **à l'intérieur** de la parcelle ; posée
  sur sa limite, quel que soit le côté, c'est un contact (elle peut être celle du voisin).

Prescriptions **nommées par sous-code et type de document** (tables CNIG PLU v2024 rév. 2025-06 et PSMV v2022 rév.
2025-12) : espaces boisés classés (01-00 à 03), constructibilité interdite ou conditionnée (02-00 à 02), démolition ou
reconstruction (03-00 à 03, et 03-50/51 en PSMV seulement), emplacements réservés par destination (05-00 à 08 : voie,
ouvrage, installation, espace vert, **logement social**, servitude de localisation, **secteur en attente de projet**,
relocalisation littorale), patrimoine protégé du PLU (07-00 à 05) et du PSMV (07-50 à 64), éléments **non protégés**
du PSMV (07-65 à 69), terrain non bâti protégé (08-00), changement de destination, extension ou STECAL en zone A ou N
(16-01 à 03), voies à créer ou modifier (24-01 à 03), espaces remarquables du littoral (31-xx). Un sous-code propre au
PSMV ou à la carte communale ne vaut rien dans un autre document. Un sous-code inconnu d'un code qui compte (01, 02,
03, 05, 07, 08, 31) est nommé **sans effet énoncé** (« son effet se lit dans le règlement »). Le contrat conserve le
code, le sous-code, le document et son type. Les autres familles (stationnement, hauteur, mixité sociale, OAP…) sont
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
   **emplacement réservé couvre environ 14 % du terrain** (≈ 519 m²). Rien d'autre dans futur•e ne le montrait. Pour
   un acheteur qui projette une piscine, une annexe ou une division, la vérification change : demander en mairie
   l'objet et le bénéficiaire de la réserve avant de s'engager, cette partie ne pouvant accueillir une construction
   contraire à sa destination.
2. **Mérignac, 14 avenue Ariane.** La parcelle est **partagée entre deux zones** (US7 ≈ 62 %, US9 ≈ 38 %), avec un
   emplacement réservé de voirie de ≈ 71 m² et un bois protégé de ≈ 38 m² en bordure intérieure. Un projet ne se lit
   pas dans un seul chapitre du règlement.
3. **Lyon 4e, 10 rue d'Austerlitz.** Ce que la V1 **n'affiche pas** compte autant : le GPU rend pour cette parcelle
   une zone UCe3-p et un « élément bâti à préserver » qui appartiennent au voisin (0 % de la parcelle). Une lecture
   naïve aurait attribué au logement une protection patrimoniale qui n'est pas la sienne.
4. **La Rochelle, rue du Palais.** Zone de secteur sauvegardé dont le règlement n'est pas publié au GPU : la V1 le
   dit et renvoie au service urbanisme, au lieu de lier le règlement du PLUi, qui ne s'y applique pas.
5. **Besançon, 10 rue des Granges (revue du 27/10).** Le plan de sauvegarde distingue sur la même parcelle un
   immeuble **protégé en totalité** (≈ 47 % ; l'ancien calcul disait 35 %, cf. section 11) et un immeuble **non protégé** soumis à des dispositions particulières
   (≈ 11 %). La première version lisait les deux comme « protégés ». La parcelle est rattachée par proximité (0,7 m) :
   la lecture est conditionnelle et le dit d'abord.

---

## 7. Intégration V1

| Fichier | Rôle |
| --- | --- |
| `src/lib/geometrie-parcelle.ts` | lib **pure** : aire exacte d'intersection (Green, trous, multipolygones, bords communs), contacts symétriques, distance point–parcelle, validation des géométries |
| `src/lib/urbanisme-parcelle.ts` | lib **pure** : contrat `UrbanismeParcelle`, nomenclatures CNIG par sous-code et type de document, rattachement, vigueur en trois états, choix du règlement, statuts |
| `src/lib/gpu.ts` | `fetchUrbanismeParcelle` : géométrie validée avant envoi, sept couches en `POST` parallèles, détail et pièces (8 s chacun), **ne lève jamais** |
| `src/lib/cadastre.ts` | `findCadastreParcelWithGeometry` : repli sur la parcelle la plus proche **mesurée**, point sur une limite détecté ; `findCadastreParcelByPoint` délègue |
| `src/app/api/georisques-logement/route.ts` | l'urbanisme attend la parcelle (~50 ms) puis part en parallèle du reste |
| `src/lib/logement-report-types.ts` | champ `urbanisme?` (absent = rapport antérieur) ; `parcel.rattachement` typé |
| `src/lib/logement-report-version.ts` | sous-sources `urbanisme`, `urbanisme_prescriptions`, `urbanisme_vigueur`, `urbanisme_pieces` ; `pertesUrbanisme` compare les deux rapports |
| `src/components/report/logement/UrbanismeBlock.tsx` | rendu, dans `RegulatorySection.tsx` (même carte, sous le patrimoine) |
| `src/app/dev/fut81/page.tsx` | banc du vrai module sur les réponses réelles (`?cas=…`, dont `besancon`, `sucy`, `vigueur`, `incertaine`, `panne`, `ancien`) |

Versions et dossiers payants :
- La lecture **appartient à la version** (elle entre dans le rapport, donc dans son empreinte) et ne change plus.
  Aucun horodatage dans la lecture : deux collectes identiques donnent la même empreinte, pas de version fantôme.
- Un dossier antérieur s'ouvre tel quel, sans appel : l'écran dit « collecté avant la lecture du plan d'urbanisme.
  Une actualisation des données l'ajoutera. » Son empreinte ne bouge pas.
- Actualisation : une version N+1 qui lit l'urbanisme est écrite ; N reste intacte. Si N+1 **perd** une capacité de
  lecture que N avait (lecture entière, prescriptions, vigueur des documents, pièces), l'actualisation est
  **refusée** et N reste affichée. Une évolution légitime n'est pas une perte : prescription retirée, document
  remplacé ou devenu hors vigueur ont été **lus**.
- La comparaison porte sur les deux rapports, pas sur la liste enregistrée : un dossier **antérieur** à FUT-81
  n'avait aucune lecture, il ne perd rien quand le Géoportail tombe pendant son actualisation (le reste de sa
  collecte s'actualise). Le bâtiment (FUT-80) garde sa règle, non modifiée ici.
- Aucune migration, aucune écriture sur les dossiers existants, aucun appel Anthropic : la synthèse et le moteur de
  décision ne lisent pas encore l'urbanisme (aucune empreinte de faits ne change).

---

## 8. Contrôles

| Contrôle | Résultat |
| --- | --- |
| Tests ciblés `src/lib/fut81-urbanisme-parcelle.test.ts` | 28/28 (dont 10 tests des cinq blocages de la revue) |
| Tests liés (15 fichiers : versions, sources bornées, FUT-80, FUT-127, Sitadel, qualification…) | 227/227 |
| Suite complète, lancée seule, deux fois | **3 513 / 3 513** après intégration de `main` (`06e043d0`, FUT-143), 0 échec, 0 ignoré ; `main` seule : 3 485, stable sur deux exécutions ; 3 485 + 28 = 3 513. Une première exécution de `main` avait rendu 3 478 (un fichier omis sans échec) : compte écarté |
| TypeScript `tsc --noEmit` | 0 erreur |
| Lint des fichiers modifiés | 0 problème |
| Lint `eslint src` | 14 diagnostics, **identiques ligne à ligne** à la base exacte : `2af75b87` avant intégration, puis `06e043d0` après (checkouts détachés), aucun dans FUT-81 |
| `npm run lint` | échoue comme sur `main` (plugin `react` non défini dans la config) |
| `npm run index:verify` | « Index vérifié. » |
| `npm run build` | réussi avant et après intégration de `main`, avec la **configuration Supabase réelle** (URL, clé publiable, clé de service ; aucune clé Anthropic, Stripe ni Resend) : compilation, 281/281 pages statiques, aucune erreur. Sans clé de service, le build échoue sur `/api/dossier/relation` (client créé au chargement), comme sur `main` |
| Recette du vrai module (`/dev/fut81`) | bureau 1 512 px, fenêtre 500 px, cadre 360 px ; cas confirmés, ambigus, repli, vigueur non vérifiée, prescription incertaine, ancien dossier ; captures `rendu/revue-*.jpg` |

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

---

## 10. Revue indépendante du 27/10/2026 : les cinq blocages et leurs corrections

Revue de Work sur `992af92f`, décision NO GO. Ses contre-épreuves (`audit-fut81-repro.mjs`) ont été rejouées sur ce
SHA **avant** toute correction : les cinq échouaient comme décrit. Elles ont été rejouées après, sur les mêmes
entrées, par la sortie métier et par le texte rendu. Le script adapté (seules les deux fonctions supprimées sont
remplacées par la sortie de `lireUrbanisme`) et les deux jeux de résultats sont dans `2026-10-26-fut81-urbanisme/revue-2026-10-27/`.

| # | Blocage | Reproduction sur `992af92f` | Correction | Après |
| --- | --- | --- | --- | --- |
| 1 | Bandes étroites perdues, limites asymétriques | bandes de 50 et 30 m² mesurées **0**, prescription supprimée ; point/ligne sur le bord ouest retenus, sur le bord est rejetés ; `Polygon` vide lu « à la parcelle » ; coordonnées nulles : exception | `geometrie-parcelle.ts` : aire exacte d'intersection (bords des deux polygones, trous, multipolygones, bords communs comptés une fois), tolérance de contact identique dans toutes les directions, géométrie validée avant tout calcul. Prescription illisible gardée `incertaine` ; zone illisible dite | 50 et 30 m² retenus (49,7 et 29,8 m²) ; contacts nuls sur les quatre bords, comptés ; 1 m² dit « très faible surface » ; géométrie invalide → lecture au point |
| 2 | Repli : la plus petite, présentée comme confirmée | parcelle voisine de 100 m² retenue, `confirme`, réserve cachée dans « Comprendre » | repli sur la plus proche **mesurée** (`distanceRepliM`), point sur une limite détecté (`candidatsAuPoint`) ; `rattachement` dans le contrat ; ambiguïté `parcelle_incertaine` ; réserve **visible avant** zones et prescriptions ; « La parcelle retenue est… » | la grande parcelle collée au point retenue, `ambigu`, réserve en tête ; « à moins d'un mètre » quand la distance est nulle |
| 3 | Vigueur inconnue présentée comme confirmée | `details = null` → `confirme`, `enVigueur: null` ; statut légal absent → `true` ; objet vide → `false` | vigueur en trois états (`etablie`, `hors_vigueur`, `non_verifiee`), `legalStatus` documenté (APPROVED, PARTIALLY_ANNULLED, ANNULLED, HISTORICAL) ; délai du détail porté de 4 à 8 s ; titre « D'après le document publié, … » et réserve visible | panne, objet vide, statut absent, annulation partielle → `non_verifiee`, `ambigu` ; hors vigueur et annulé → `hors_vigueur` ; Besançon et Sucy-en-Brie rejoués sans détail ni pièces |
| 4 | Effet juridique déduit du code principal | Besançon 07-67 « non protégé » lu « protégé » ; 05-05 et 05-07 expliqués comme voie ou équipement public | catégories par **sous-code et type de document**, sur les tables CNIG ; 07-65 à 69 non protégés ; 05-05, 05-06, 05-07, 05-08 avec leur propre libellé ; sous-code inconnu sans effet énoncé ; code, sous-code et document conservés dans le contrat | Besançon réel : 07-67 « Immeuble bâti non protégé, soumis à des dispositions particulières », 07-50 protégé ≈ 47 % (35 % avant la section 11) ; Toulouse : 07-68 non protégé |
| 5 | Perte partielle de source acceptée | `prescriptions.surface = null` → `nouvelle_version` | sous-sources nommées (`urbanisme_prescriptions`, `urbanisme_vigueur`, `urbanisme_pieces`) et `pertesUrbanisme` comparant N et N+1 | refusée, N intacte et affichée ; prescription retirée, document remplacé ou annulé : acceptés ; dossier antérieur sans lecture : rien perdu |

Défauts trouvés en corrigeant, corrigés aussi :
- deux zones **superposées** (zone du PSMV et périmètre du site patrimonial, chacune à 100 % à Besançon) étaient
  annoncées comme une parcelle « partagée » ; elles sont dites superposées ;
- le calcul exact a fait apparaître des liserés de zone de plus de 25 m² sur les très grandes parcelles (38 m² sur
  5,5 ha) : d'où la règle propre aux zones (section 4) ;
- quand aucune zone n'était lisible, les prescriptions n'étaient pas rendues ; elles le sont dans tous les états ;
- bruit binaire dans les surfaces (`3725.1000000000004`), qui aurait rendu l'empreinte instable.

Cas positifs préservés et rejoués : Moissy (zone unique), Mérignac (deux zones, emplacement réservé), Sucy-en-Brie
(trois zones dont une de 2,3 %), Lyon (zone et élément patrimonial du voisin écartés), Six-Fours (emplacement réservé),
La Rochelle (règlement de la zone PSMV non publié, jamais remplacé), Vauquois (carte communale), Châtelard (RNU),
Grandvals (sans document). Liens de règlement vérifiés en réel : Besançon `25056_reglement_20260615.pdf`, HTTP 200,
`application/pdf`, après redirection officielle vers `data.geopf.fr`.

Limites résiduelles :
- `effectiveStatus` n'est pas documenté dans le schéma du GPU ; s'il disparaissait, toutes les vigueurs deviendraient
  `non_verifiee` (lecture prudente, jamais fausse).
- Un liseré réel de moins de 2 % d'une zone voisine n'est pas présenté comme une zone de la parcelle ; au-delà de
  25 m², il est dit comme bordure à vérifier.
- La tolérance de contact (1 cm) traite un linéaire tracé à quelques centimètres à l'intérieur de la limite comme
  traversant la parcelle.
- Le rattachement multi-parcelles (jardin, copropriété sur plusieurs parcelles) reste hors V1 (FUT-83).
- Le texte du bloc est jugé trop long et trop technique par le porteur : [FUT-144](https://linear.app/future-e/issue/FUT-144).

---

## 11. Deuxième revue indépendante du 27/10/2026 : l'aire d'intersection près des limites

Revue de Work sur `e73ec075`, décision NO GO, un blocage : `aireIntersection` attribuait à la parcelle une
prescription qui ne faisait que la border. Preuves rejouables dans `2026-10-26-fut81-urbanisme/revue-2026-10-27b/`.

### Reproduction, avant toute correction

| Entrée (mètres) | GEOS | `e73ec075` | Corrigé |
| --- | --- | --- | --- |
| A = [0,100]², B = [100 ; 100,004] × [0,100] (frontière commune, B hors de A) | A∩B = B∩A = 0 | A∩B = **5 000**, B∩A = **5 000,2** | 0 et 0 |
| Variante : B = [99,998 ; 100,002] × [0,100] (0,2 m² réels) | 0,2 et 0,2 | **5 000** et **5 000,1** | 0,2 et 0,2 |
| Même bande en GeoJSON, via `lireUrbanisme` | — | emplacement réservé « couvre », **50 %**, 5 000 m², `confirme` | aucune prescription, 1 contact compté |
| Variante en GeoJSON | — | « couvre », 50 % | « marginale », 0,2 m², « très faible surface (moins d'1 m²) » |

(`repro-revue.mjs`, `repro-avant-e73ec075.json`, `repro-apres.json`.)

### Cause racine

L'aire était intégrée sur le bord de A ∩ B (formule de Green), chaque morceau d'arête étant classé « dedans »,
« dehors » ou « sur le bord » à `TOLERANCE_M` = 1 cm près. Ce classement n'est pas topologiquement cohérent : une bande
plus étroite que deux tolérances a **ses deux bords** à moins d'1 cm de la limite de la parcelle. Pour le bord est de la
parcelle, `classer` retenait la première arête de B trouvée dans la tolérance, ici le bord extérieur de la bande, de
même sens : l'arête entière de la parcelle était comptée comme bord commun (+5 000 m²). L'ordre des arguments
changeait les arêtes testées, d'où l'asymétrie 5 000 / 5 000,2. Aucune valeur de tolérance ne répare le défaut : il
existe toujours une bande plus étroite que deux fois elle. Le défaut touchait aussi des cas réels (ci-dessous).

### Correctif retenu

- **Clipper 6.4.2** (`clipper-lib`, Angus Johnson, licence Boost, sans dépendance, 220 Ko, figé depuis 2017, environ
  280 000 téléchargements par mois). Algorithme de Vatti sur coordonnées **entières** : prédicats exacts (arithmétique
  128 bits), aucune tolérance. Sommets arrondis au **micromètre** (`MAILLE_M`). Deux frontières ne se confondent que si
  elles sont à moins d'1 µm, ce qui est 10 000 fois plus fin que le centimètre de la revue.
  Candidats écartés, sur le même corpus confronté à GEOS :
  - `polygon-clipping` (flottants) : exact quand il répond, mais **lève une erreur sur 3 des 335 paires** quasi
    dégénérées ;
  - `clipper2-ts` : aussi juste que Clipper 6, mais en préversion, maintenue par une seule personne.
- **Repli explicite** : `aireIntersection` rend `null` au lieu d'un nombre douteux dans trois cas.
  - **Polygone invalide** : l'aire de ses anneaux orientés diffère de la surface qu'ils recouvrent (anneaux qui se
    croisent, qui se recouvrent, trou hors de son contour).
  - **Invariant violé** : aire non finie, négative, plus grande que l'une des deux régions, ou différente selon
    l'ordre des arguments.
  - **Échec de Clipper**, ou coordonnées hors de sa plage.

  `lireUrbanisme` lit `null` comme une géométrie non mesurable : la prescription devient `incertaine`, la zone est
  dite non mesurable, une parcelle invalide passe en lecture au point. Une mesure non garantie n'alimente donc jamais
  une attribution confirmée. Le contrat et l'affichage existants portent déjà ces états.
- **Fenêtre** : la zone est d'abord découpée à la boîte de la parcelle, plus 1 m (Sutherland-Hodgman). Ce découpage
  conserve exactement l'appartenance de chaque point à la zone, donc A ∩ B. Une zone de 20 000 sommets s'étendant
  sur 30 km se mesure ainsi en **8 ms**, contre 7,5 s sans découpage.
- **Projection** : l'oracle a montré que la projection sous-estimait toutes les aires de **0,7 %**. Elle utilisait
  des constantes sphériques prises à l'équateur (111 320 et 110 574 m par degré) ; le commentaire annonçait
  « moins de 0,5 % ». Elle prend désormais les rayons de courbure de GRS80 à la latitude de la parcelle. L'écart avec
  une projection équivalente de Lambert (pyproj) est au plus de 0,04 % sur les relevés réels, et de 0,01 % au-delà
  d'1 m². Les parts (%) n'en dépendaient pas, contrairement aux m² affichés.
- **Bundle** : l'écran (`UrbanismeBlock`, rendu dans `LogementModule`, composant client) importait ses libellés
  depuis `urbanisme-parcelle.ts`, ce qui aurait embarqué Clipper (25 Ko compressés) dans le JavaScript du rapport. Les
  seuils et nomenclatures passent dans `urbanisme-nomenclature.ts`, sans dépendance et réexporté à l'identique.
  Vérifié après build : Clipper n'apparaît dans aucun fichier de `.next/static`.
- **Affichage** : une surface inférieure à 1 m² s'affiche « moins d'1 m² », et non plus « ≈ 1 m² » (0,2 m² était
  arrondi au quintuple).

### Oracle indépendant et invariants

`scripts/research/fut81-oracle-geos.py` (GEOS 3.14.1, Shapely 2.2.0, pyproj 3.8.0, graine 81) écrit
`src/lib/__fixtures__/fut81/oracle-geos.json`, lu par `src/lib/fut81-geometrie-oracle.test.ts` (14 tests, sans
Python). Le corpus comprend :
- **449 paires synthétiques**, toutes les contre-épreuves demandées : rectangles de Work dans les deux ordres ; bande
  séparée de 1 mm ; frontière exactement commune ; coin commun ; chevauchements de 2 mm, 4 mm et 2 cm ; 0,2 m²
  réels ; bandes de 30 et 50 m² ; zones partagées ; zone concave, avec trou, multipolygone ; 12 cas obliques ;
  4 grandes zones de 2 000 sommets ; 4 géométries invalides ; 400 paires aléatoires aux frontières décalées de 0 à 2 cm ;
- **58 surfaces et 3 lignes réelles** des relevés (GeoJSON brut, projection de production), avec en plus leur aire
  dans une projection équivalente de Lambert.

Pour chaque mesure, les tests vérifient :
- aire finie et positive ;
- au plus l'aire de chaque région ;
- A∩B = B∩A ;
- concordance avec GEOS dans les deux ordres ;
- valeur analytique quand elle existe (0,2 / 0,4 / 2 / 30 / 50 / 4 000 / 6 000 m², 0 pour un contact).

Les invariants restent vrais après une translation de 40 km, qui fait passer Clipper dans sa plage 128 bits. Une
géométrie invalide n'est jamais mesurée.

**Tolérances justifiées** :
- **Contre GEOS, même projection** : `ecartAdmis(a, b)` = 2δ(Pa + Pb), avec δ la demi-diagonale de la maille. Arrondir
  chaque sommet d'au plus δ déplace chaque arête d'au plus δ, donc l'aire d'au plus δ × le périmètre. C'est vrai pour
  les deux entrées comme pour le résultat. Écart maximal mesuré : 2,4 × 10⁻⁴ m², pour une borne de 10⁻³ environ.
- **Contre la projection de Lambert** : 2 × 10⁻⁴ en relatif, soit le double de l'erreur d'échelle mesurée.
- **Lignes** : 2 cm, soit deux fois la tolérance de contact des lignes.

**Contre-épreuve de l'oracle** : appliqué à l'ancien calcul, il rejette **132 des 445 paires valides**, dont les 2 de
Work, les 7 microchevauchements et les 12 cas obliques. Écart maximal : 5 000,45 m². Fichiers
`oracle-contre-ancien.mjs` et `oracle-contre-ancien-e73ec075.json`.

### Bout en bout, et cas réels

Six tests « Deuxième revue » de `fut81-urbanisme-parcelle.test.ts` font passer les contre-épreuves en GeoJSON par
toute la chaîne : `regionDe` → `aireIntersection` → `lireUrbanisme` → rapport → texte rendu → versions. Ils vérifient
que :
- une bande voisine (commune ou à 1 mm) n'est attribuée **ni comme prescription ni comme zone**, et n'apparaît pas à
  l'écran ;
- un microchevauchement garde sa surface vraie, est dit « très faible surface » et n'est jamais « couvre », sans part
  affichée ;
- une bande intérieure de 4 mm (0,4 m²) est dite, et les bandes de 30 et 50 m² sont retenues ;
- un nœud papillon rend la prescription `incertaine` (« position non vérifiable »), la zone non mesurable et la
  parcelle lue au point.

Sur les relevés réels, l'ancien calcul **se trompait déjà** sans aucune contre-épreuve artificielle
(`reels-avant-apres.json`) :

| Cas | Avant | Après | GEOS (Lambert) |
| --- | --- | --- | --- |
| Besançon, immeuble protégé en totalité (07-50) | 121,1 m² (35 %) | 162,5 m² (47 %) | 162,5 m² |
| Mérignac, bois protégé | 35,0 m² | 37,9 m² | 37,9 m² |
| Sucy-en-Brie, liseré UILC… | 39,0 m² | 43,4 m² | 43,4 m² |
| Six-Fours, liseré UF | 0,18 m² | 0,44 m² | 0,44 m² |

Après correction, l'écart maximal avec GEOS est de 0,039 % sur 52 surfaces de plus de 0,05 m².

Mesure réelle rejouée sur les 31 adresses de la section 3 (API publiques, lecture seule, même volume) :
- **aucun statut, aucune zone, aucune catégorie, aucune étendue ne change**, et aucune mesure ne devient incertaine ;
- seules changent les surfaces (+0,7 %) et quelques liserés de moins de 5 m².

Fichiers : `mesure-cas-apres.json`, `mesure-aleatoire-apres.json`, `comparer-mesures.mjs`.

### Contrat et versions

- La forme du contrat ne change pas : les états `incertaine`, `zonesNonMesurables` et `geometrie_non_mesurable`
  existaient déjà.
- `URBANISME_CONVENTION` passe à **`fut81-3`** : le calcul et les m² changent, les seuils restent ceux de `fut81-2`.
- Un dossier lu sous `fut81-2` n'est jamais réécrit. Son actualisation crée une nouvelle version : corriger une mesure
  n'est pas perdre une source (`pertesUrbanisme` = []). Une mesure devenue incertaine ne bloque pas non plus
  l'actualisation. Deux collectes identiques gardent la même empreinte.
- La PR n'étant pas fusionnée, aucun dossier de production ne porte encore de lecture `fut81-2`.

### Limites résiduelles

- **Résolution** : deux frontières à moins d'1 µm l'une de l'autre sont confondues, et une aire est exacte à
  2δ × périmètres près (10⁻³ m² pour une parcelle courante). Les seuils de lecture (0,05 m² de contact, 25 m² et 2 %)
  restent très au-dessus de cette résolution.
- **Validité** : la validité d'une zone est jugée sur sa partie proche de la parcelle (fenêtre d'1 m). Un défaut de
  tracé loin de la parcelle ne la rend pas non mesurable, ce qui est sans effet sur A ∩ B.
- **Lignes et points** : ils gardent la tolérance de contact d'1 cm. Une ligne tracée à moins d'1 cm de la limite,
  dedans ou dehors, est un contact. Cette tolérance peut écarter une ligne, jamais en attribuer une.
- **Dépendance** : `clipper-lib` n'est plus maintenue. Elle est épinglée en version exacte, et ses résultats sont
  gardés par les invariants et l'oracle. Clipper2 deviendra un remplacement possible quand son portage TypeScript
  sera stable.
