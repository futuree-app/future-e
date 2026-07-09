# De quoi un « rapport vivant » vivrait-il ? Les 28 critères passés au crible

> Audit de données, 2026-07-09. Suite de `2026-07-09-le-fil-icpe-verdict-spike.md`.
> Reproductible : `scripts/research/rapport-vivant-matiere.mjs`, `scripts/research/sup-sis-*.mjs`.
> Échantillon : 120 communes tirées au prorata de la population (donc représentatives d'un lecteur,
> pas d'une commune). Aucun PDF lu, aucun LLM appelé.

## La question

Si Le Fil devient « le diff du rapport », alors un rapport ne bouge que si un critère bouge.
Combien des 28 critères de futur•e peuvent bouger sur un **événement daté**, et non sur la
republication d'un référentiel ?

## La réponse

**Deux sur vingt-huit.** Et la donnée la plus décisive pour un acheteur, la servitude d'utilité
publique, n'est portée par **aucun** critère, donc reste invisible à un moteur de diff.

## Le tableau

| Nature | Critères | Ce qui les fait bouger | Fréquence |
|---|---|---|---|
| **Événement daté** | `faible_risque_inondation` | arrêté CatNat (Gaspar) | **20 à 38 % des communes par an** |
| **Événement daté** | `faible_exposition_industrielle` | création ou extension d'ICPE | **3,9 % des communes par an** |
| Millésime annuel | `acces_soins`, `acces_services`, `acces_ecoles`, `acces_culture`, `vie_etudiante` | BPE (INSEE) | toutes les communes, le même jour |
| Millésime annuel | `croissance_demographique`, `viabilite_emploi`, `eviter_isolement`, `eviter_grandes_villes`, `prefere_grande_ville`, `cadre_calme`, `faible_dependance_auto` | recensement INSEE | toutes les communes, le même jour |
| Millésime pluriannuel | `faible_chaleur`, `douceur_climat`, `faible_secheresse`, `faible_risque_feu`, `faible_precip_extremes` | DRIAS / TRACC | ~5 à 10 ans |
| Millésime | `ensoleillement_recherche` | ERA5 (moyenne 30 ans) | imperceptible |
| Millésime | `nature` | OSO (occupation des sols) | ~3 ans |
| Millésime | `air_sain` | modélisation PM2.5 / NO2 | annuel |
| Millésime | `faible_pression_agricole` | RPG | annuel |
| Diff de référentiel | `calme_sonore`, `mobilite_quotidienne`, `vie_locale` | OpenStreetMap, RNA | continu, bruité, non attribuable |
| Diff de référentiel | `acces_transports` | référentiel gares SNCF | rare, non daté |
| Immuable | `proximite_mer` | géographie | jamais |

## Ce que les mesures ajoutent

### La latence de CatNat interdit de dire « rien n'a changé »

Sur 958 arrêtés (70 communes), le délai entre l'événement et la publication de son arrêté :

- **médiane : 99 jours**
- p75 : 324 jours, **p90 : 640 jours**

Et il dépend du risque. Une inondation soudaine est actée en 22 à 31 jours (2024-2026). Une
sécheresse demande 367 à 444 jours (2022-2023), le temps de caractériser l'année entière.

C'est pourquoi 2025 et 2026 semblent calmes (6,7 % des communes) alors que 2018-2024 tournent entre
20 et 38 % : **les arrêtés de sécheresse 2025 ne sont pas encore publiés.**

Conséquence directe pour le rapport vivant : à tout instant, une part inconnue des événements de
l'année écoulée n'est pas encore publiée. Un écran qui affiche « depuis votre dernière visite »
suivi de rien **affirme une absence qui n'est pas établie**. La doctrine éditoriale l'interdit déjà
pour Le Fil (`editorial-writer/2026-07-09-le-fil-classe-b-grammaire.md`, §5). Elle s'applique ici.

### La matière réelle, mesurée sur 120 communes, 12 mois

Sept sources testées : créations ICPE, servitudes SIS/SUP, PPR (prescription, approbation,
abrogation), mouvements de terrain, CatNat, restrictions d'eau (Vigieau), non-conformités de l'eau
potable (Hub'Eau, ARS).

| | Communes | Lecteurs |
|---|---:|---:|
| Au moins un **mouvement** (durable) | 22 / 120 | **33 %** |
| Au moins un **état** (temporaire) | 78 / 92 | 74 % |

**Deux pièges de mesure, corrigés :**

1. **Vigieau renvoie l'état en cours**, pas un décompte sur douze mois. Les 78 communes en
   restriction sont 78 communes en restriction *un 9 juillet*. Mesuré en janvier, le chiffre
   s'effondrerait. Une saison n'est pas un changement.
2. **« Non conforme » ne veut pas dire dangereux.** Sur six communes et douze mois, sur 15
   prélèvements non conformes, **zéro l'est aux limites sanitaires** : douze le sont aux
   *références* de qualité (turbidité, aspect, goût). Le vocabulaire de l'ARS fabriquerait de
   l'alarmisme à lui seul.

**Un biais assumé :** 28 communes sur 120 ont échoué (délais dépassés sur les PPR). Leur population
moyenne est de 62 000 habitants contre 32 700 pour les autres. L'échantillon survivant penche vers
les petites communes. Le chiffre de 33 % est calculé hors PPR, sur les deux sources en local, donc
sur les 120 communes sans exclusion.

## Le paradoxe que ce tableau met au jour

Le principal pourvoyeur de matière est la **servitude** (10 communes touchées sur 12 mois, contre 4
pour les créations d'ICPE et 2 pour les PPR).

Or aucun critère de futur•e ne porte les servitudes. Un moteur de diff des critères ne les verrait
jamais.

**Le rapport vivant, tel que défini (« on publie quand un critère bouge »), serait aveugle à la
seule donnée vraiment décisive au grain adresse.** Il ne verrait que l'inondation et l'industrie,
et bougerait pour environ 28 % des lecteurs par an.

L'ordre des travaux en découle, et il est contre-intuitif : **il faut créer le critère avant de
construire le moteur de diff**, sans quoi le moteur tourne à vide sur la donnée qui compte.

## Ce que ce tableau décide

1. **Le diff se calcule sur des valeurs absolues, jamais sur des percentiles.** 23 critères sur 28
   sont des percentiles nationaux : ils bougent quand les *autres* communes bougent. Notifier
   « votre lecture a changé » serait faux.
2. **Les millésimes se datent, ils ne s'annoncent pas.** « Recalculé avec la BPE 2027 » est honnête.
   « Votre commune a changé » ne l'est pas.
3. **Deux critères seulement portent un flux.** L'inondation (abondante, latente) et l'industrie
   (rare, immédiate).
4. **Le vide doit être écrit.** Nommer les sources surveillées et la date de dernière vérification.
   Ne jamais affirmer qu'il ne s'est rien passé, puisque le p90 de publication est à 640 jours.
5. **Le mouvement et l'état ne sont pas deux gravités, mais deux produits.** Le mouvement est rare,
   durable, il sert celui qui choisit. L'état est saisonnier, répétitif, il sert celui qui habite.
   Un état a une date de fin (l'arrêté de La Rochelle expire le 31 octobre 2026) : le rapport vivant
   du résident doit donc **oublier**, ce qu'un diff, qui empile, ne sait pas faire.

## La source qui manquait : les logements neufs livrés (DPE, ADEME)

Un DPE « logement neuf » est émis à l'achèvement. C'est donc un **logement livré, daté, géolocalisé
à l'adresse BAN**. Le jeu compte 1 394 020 lignes, et l'API accepte `geo_distance`.

Mesuré sur les mêmes 120 communes, fenêtre de 12 mois :

| | Communes | Lecteurs |
|---|---:|---:|
| au moins 1 logement neuf livré | 96 / 120 | **98 %** |
| au moins 10 logements neufs livrés | 60 / 120 | **91 %** |

Médiane : 10 logements neufs par commune. Normalisé par la population, le taux médian est de
**1,3 logement neuf pour 1 000 habitants et par an** (p75 : 2,9 ; p90 : 5,5), ce qui en fait un
signal discriminant : Le Plessis-Robinson atteint 29,4 ‰, soit 859 logements pour 29 228 habitants.

À l'adresse, la requête fonctionne : onze logements neufs livrés dans un rayon d'un kilomètre autour
d'un point rochelais sur douze mois, zéro à moins de 300 mètres.

**Trois réserves, à porter dans la doctrine avant tout usage.**

1. **Le DPE dit le passé, pas l'avenir.** Il est établi à l'achèvement. Un lecteur qui veut savoir si
   le champ d'en face deviendra un lotissement l'apprendra une fois le lotissement construit. Seul
   un permis de construire (Sitadel) anticiperait, et Sitadel n'a pas d'API.
2. **Le signal est ambivalent.** Des logements neufs valent dynamisme pour l'un, bétonisation pour
   l'autre. La doctrine `croissance_demographique` s'applique : décrire, jamais juger.
3. **Aucun critère ne le porte.** Comme les servitudes.

## Ce que l'exploration élargie conclut

Les trois sources qui feraient réellement vivre un rapport sont les **servitudes** (opposables,
décisives, 16 % des adresses à 500 m), les **logements neufs livrés** (91 % des lecteurs) et, loin
derrière, les **arrêtés CatNat** et les **créations d'ICPE**.

Elles ont un point commun que ni Le Fil ni le rapport vivant n'avaient anticipé : **elles se lisent
au grain ADRESSE**, et deux d'entre elles n'ont aucun critère pour les porter.

Le rapport vivant n'est donc pas un produit du module Territoire (grain commune). C'est un produit
du module **Logement** (grain adresse), là où se trouve déjà le moat. Et la Face 3 « Autour de cette
adresse » existe, avec son snapshot figé (`logement-store.ts`, `SOURCES_VERSION`), ce qui rend le
diff possible sans architecture nouvelle : il suffit de conserver l'ancien snapshot au lieu de
l'invalider.

## Ce qui reste ouvert

- **Sitadel** (permis de construire) : la seule source qui dirait ce qui *va* se construire. Pas
  d'API trouvée. Piste non vérifiée.
- **Restrictions d'eau historiques** : Vigieau expose l'état courant. L'historique reste à trouver
  pour transformer une saison en série.
- **Obligations légales de débroussaillement** (`/api/v1/old`) : booléen communal, sans date ni
  géométrie. Charge légale réelle pour un propriétaire, aucun critère ne la porte. Statique, donc
  hors rapport vivant, mais candidate pour le module Logement.
- **La création d'un critère « servitudes »** au grain adresse, qui ferait exister dans le produit
  la donnée que le spike a désignée comme la plus décisive.
