# FUT-83 · Sources et champs du RNIC

**Date** : 27/10/2026 · **Mesures** : `mesures/profil.json`, `mesures/millesimes.json` (scripts `scripts/fut83/profil_rnic.py`, `millesimes.py`).

Ce document répond à la question « que publie réellement le registre, et que peut-on en conclure ». Toutes les valeurs
viennent des fichiers téléchargés le 27/10/2026, sauf mention contraire.

---

## 1. Les sources, vérifiées

| Source | Ce qu'elle est | Accès vérifié le 27/10/2026 | Licence |
|---|---|---|---|
| **Jeu data.gouv « Registre national d'Immatriculation des Copropriétés »** (Anah), [`62da71c068871f4c54258c7c`](https://www.data.gouv.fr/fr/datasets/62da71c068871f4c54258c7c/) | CSV national, une ligne par copropriété | Ressource « RNIC - Actualisation quotidienne » (`3ea8e2c3-…`), 411 Mo, mise à jour le 27/10/2026 à 07 h 06 ; millésimes trimestriels de T3 2022 à T3 2025 | **Licence Ouverte 2.0** (réutilisation commerciale permise, avec mention de la source) |
| **API tabulaire data.gouv** sur la même ressource | Requêtes filtrées sur le CSV | Répond, mais **17 s** pour un numéro d'immatriculation et **504 (délai dépassé)** pour un filtre par commune ou par adresse. Inutilisable en production | idem |
| **Notice descriptive Anah** (PDF, octobre 2025) et **dictionnaire CSV** | Définitions des 72 colonnes | Lus en entier | — |
| **Annuaire public** [registre-coproprietes.gouv.fr/annuaire](https://www.registre-coproprietes.gouv.fr/annuaire) | Recherche par adresse, fiche par copropriété | Application web. Son code montre un bloc « Procédures administratives et judiciaires » (arrêté de mise en sécurité ou d'insalubrité, mandat ad hoc, ordonnance de carence). **Aucune API documentée** : les points d'accès internes (`api/public/annuaire/…`) ne sont pas un service ouvert. Deux appels de test seulement, sans résultat exploitable | Conditions du site, pas une licence de réutilisation |
| **BDNB** (CSTB), table `rel_batiment_groupe_rnc`, millésime 2026-02a | Rapprochement copropriété ↔ groupe de bâtiments, fait par le CSTB | 196 appels, quota restant 9 571 sur 10 000 par mois | Licence Ouverte |
| **DPE ADEME** (`dpe03existant`), champ `numero_immatriculation_copropriete` | Numéro saisi par le diagnostiqueur | Servi par l'API que futur•e appelle déjà, **non lu** aujourd'hui (absent de `SELECT_LOGEMENT`, `src/lib/dpe.ts:94`) | Licence Ouverte 2.0 |
| **Audits énergétiques ADEME** (`audit-opendata`), champ `n_immatriculation_copro` | Numéro saisi par l'auditeur | Lu depuis FUT-62 (`src/lib/audit-record.ts:116`) | Licence Ouverte 2.0 |

**Il n'existe ni API officielle de lecture du registre, ni identifiant RNB dans le registre.** L'intégration passerait
forcément par un import du fichier national.

---

## 2. Le cadre légal (Légifrance, consolidé au 27/10/2026)

| Texte | Version vérifiée le 27/10/2026 | Lien | Ce qu'il fonde dans ce dossier |
|---|---|---|---|
| L711-2 CCH | modifié par la loi du 09/04/2024, en vigueur depuis le 11/04/2024 | [LEGIARTI000049398053](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000049398053) | Ce que le registre contient, ce qui doit être public |
| R711-16 et R711-17 CCH | créés par le décret du 26/08/2016, en vigueur depuis le 29/08/2016 ; section consolidée au 10/02/2026 ; R711-16 modifié par le décret 2025-831, **non encore en vigueur** | [section](https://www.legifrance.gouv.fr/codes/id/LEGISCTA000033073021/) | Qui consulte quoi |
| L721-1 CCH | en vigueur depuis le 01/01/2022 | [LEGIARTI000039369572](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000039369572) | Mentions obligatoires de **l'annonce** |
| L721-2 CCH | modifié par la loi du 22/08/2021, en vigueur depuis le 01/01/2024 | [LEGIARTI000043977384](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000043977384) | **Documents remis** avant la promesse |
| 14-2 et 14-2-1 de la loi de 1965 | en vigueur depuis le 01/01/2023 | [14-2](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000043977289), [14-2-1](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000043967792) | Projet de plan de travaux, fonds de travaux |
| Service public F36760 | « vérifié le 08/06/2026 » | [fiche](https://www.service-public.gouv.fr/particuliers/vosdroits/F36760) | Obligation du projet de plan de travaux depuis le 01/01/2025, quelle que soit la taille |

Lecture : les pages Légifrance ont été lues par un outil de résumé, pas copiées mot à mot. Les citations entre
guillemets de ce dossier sont des extraits courts. L'article 5 du décret de 1967 (état daté) et les seuils du 2e
alinéa de l'article 14-3 n'ont **pas** été revérifiés.

- **L711-1 et L711-2 du CCH** : les syndicats de copropriétaires d'immeubles à usage total ou partiel d'habitation
  s'immatriculent. Le registre porte (II) le nom, l'adresse, la date de création, le nombre et la nature des lots, le
  nom du syndic ; **si une procédure est en cours** (articles 29-1 A et 29-1 de la loi de 1965, L615-6 CCH) ; **si un
  arrêté** du livre V, titre I, chapitre I (mise en sécurité, insalubrité) vise le syndicat. Il porte aussi (III) des
  données financières et techniques. Le IV prévoit que les informations du II sont « portées à la connaissance du
  public ». Le III n'est pas public.
- **R711-17** (version 2016, toujours affichée) : les informations du 1° du II sont librement consultables,
  « à l'exception du nom du syndic et du nombre de lots ». Le fichier ouvert publie pourtant les deux. L'écart vient
  sans doute de la loi de 2024 (IV de L711-2), mais nous ne l'avons pas tranché. **Non vérifié.**
- **Décret n° 2025-831 du 19/08/2025** ([JORF](https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000052120251)),
  **pas encore en vigueur**. Il entre en vigueur « dix-huit mois après sa publication » (JORF du 21/08/2025, donc
  vers le 21/02/2027 ; date calculée, non écrite dans le texte). Il ajoute au registre des données principales :
  nombre de bâtiments, d'étages et d'ascenseurs, performance énergétique, chauffage, ventilation, plan pluriannuel
  de travaux, diagnostic structurel, décisions de lutte contre l'habitat indigne, montant du fonds de travaux. Il
  élargit aussi l'accès des notaires (R711-16). Sa notice indique que le public accède librement aux données du II
  de L711-2, qui comprend les procédures et les arrêtés. **Rien ne dit encore si ces données entreront dans le
  fichier ouvert** : c'est le principal fait à surveiller.
- **Données déclaratives** : le représentant légal les saisit et doit les actualiser chaque année. Selon le
  [rapport du Sénat n° 736 (juillet 2024)](https://www.senat.fr/rap/r23-736-1/r23-736-16.html), l'Anah ne contrôle
  la qualité des données financières que « ponctuellement », et la fiabilité est plus faible pour les petites
  copropriétés.

---

## 3. Couverture

| Mesure | Valeur | Source |
|---|---|---|
| Copropriétés dans le fichier quotidien | **647 804** numéros distincts (656 037 lignes) | mesuré |
| Lignes répétées à l'identique | **8 233** numéros présents deux fois, sans aucune différence | mesuré (absent du millésime T3 2025) |
| Parc total estimé | 778 790 (FILOCOM 2019) à 887 855 (CoproFF 2023) | Sénat 2024 |
| Taux d'immatriculation | ~60 % en 2023 (Anah, cité par le Sénat). Par calcul, 647 804 / 887 855 ≈ **73 %**, mais les dates diffèrent et ce taux reste **approximatif** | estimé |
| Immatriculations nouvelles | 21 515 en 2026 (au 27/10), 27 393 en 2025 | mesuré |
| Copropriétés T3 2025 disparues du fichier quotidien | 114 | mesuré |

**Une absence du registre ne prouve donc rien.** Un quart à un tiers des copropriétés n'y sont pas, surtout parmi les
petites. Un immeuble absent peut aussi être une monopropriété, un bailleur social, ou une copropriété non immatriculée.

---

## 4. Les champs, un par un

Grain : **le syndicat de copropriétaires**, jamais le bâtiment ni le lot. Un syndicat peut couvrir plusieurs bâtiments
(une résidence) ou une partie seulement d'un bâtiment (syndicat secondaire, volume).

| Champ | Définition officielle | Rempli | Ce que la mesure montre | Conclusion autorisée |
|---|---|---|---|---|
| `numero_immatriculation` | Identifiant du syndicat | 100 % | Stable entre millésimes : 619 288 numéros sur 619 402 sont toujours là | « Cette copropriété est immatriculée sous le n° … » |
| `adresse_reference` | « 1re adresse figurant au règlement de copropriété » | 99,99 % | **53 287 (8,2 %) sans numéro de rue** (« RUE PABLO NERUDA 35700 RENNES »). Graphies libres (« 2-10 r … », « 136/140 av … »). 28 477 adresses réécrites entre T3 2025 et aujourd'hui, souvent en normalisant (« plt » devient « rue ») | Une adresse déclarée, pas une adresse BAN |
| `adresse_complementaire_1..3`, `nombre_adresses_complementaires` | Autres adresses du règlement, plages admises | 15,5 % en ont au moins une | Trois au plus publiées, alors que le nombre peut être supérieur (Promenade Pagnol à Bruz : 6 annoncées, 3 publiées) | Les autres entrées connues, jamais une liste complète |
| `nombre_total_lots` | Tous les lots (caves, parkings compris) | 100 % | « 46 lots » au Pagnol (Bruz) pour **18** logements. 2 738 copropriétés ont vu leur nombre de logements varier d'au moins 50 % depuis T3 2025 (« 93-93 bis rue de Montreuil » : de 3 à 37) | **Ne jamais afficher seul** : c'est le nombre de l'annonce (L721-1), pas le nombre de logements |
| `nombre_lots_habitation_bureaux_commerces` | Lots principaux | 100 % | 224 265 copropriétés (34,6 %) ont au moins un lot de bureaux ou de commerces | « Le registre déclare N lots de commerces ou bureaux », sans dire lesquels |
| `nombre_lots_habitation` | Lots à usage total ou partiel d'habitation, mixtes compris | 100 % | Le plus utile. 56,7 % des copropriétés en ont 10 ou moins, 0,5 % en ont 200 ou plus | « Environ N logements déclarés dans la copropriété », jamais dans le bâtiment |
| `nombre_lots_stationnement` | Tout stationnement | 100 % | — | idem |
| `periode_construction` | Classe de période | 81,9 % | **Deux nomenclatures incompatibles mélangées** depuis avril 2026 : `AVANT_1949`, `DE_1949_A_1960`… et « De 1949 à 1974 », « De 1983 à 1988 », « De 2013 à 2021 »… Valeurs vides, « Inconnue », « NON_CONNUE » coexistent. Paris, rue de la Fédération : le syndicat principal dit 1949-1960, son secondaire 1975-1977 | Inutilisable sans table de correspondance. Le DPE porte déjà l'année au bon grain |
| `date_immatriculation` | Première immatriculation | 99,98 % | Cohérente | « Immatriculée depuis le … » |
| `date_derniere_maj` | « Dernière mise à jour des informations » | 99,99 % | **Dominée par des traitements de masse** : 174 632 copropriétés datées du dimanche 24/08/2025, 105 069 des 3 et 4/10/2026. Dans le millésime T3 2025, 563 015 sur 619 402 tombent en août 2025 | **Ne dit pas quand le syndic a actualisé ses données.** Aucune fraîcheur n'en est tirée |
| `type_syndic` | Bénévole / professionnel / non connu | 56,1 % | « non connu » est devenu **vide** (200 285 cas). 56 577 « professionnel » sont devenus vides en dix mois. Pour les copropriétés de 5 logements ou moins, **67 %** sont vides | Seulement « syndic professionnel déclaré : X ». Un vide ne veut rien dire |
| `raison_sociale_representant_legal`, `siret_…` | Nom du syndic professionnel. Jamais publié pour un bénévole | 56 % / 49 % | — | Un interlocuteur, à vérifier auprès du vendeur |
| `mandat_en_cours` | Mandat en cours / pas de mandat / expiré sans ou avec successeur | 100 % | 40 % « pas de mandat en cours ». En dix mois, 48 292 passent de « en cours » à « pas de mandat », 60 903 dans l'autre sens, 16 655 deviennent « expiré sans successeur ». Le champ dit **ce qui a été déclaré au registre**, pas la situation | **Aucune conclusion de gestion.** Au plus : « le registre ne mentionne pas de mandat de syndic à jour », à faire vérifier |
| `syndicat_principal_ou_secondaire` | Principal ou secondaire | 100 % | Codé « oui » ou « non » (« non » = secondaire, 8 255 cas), pas « principal / secondaire » comme annoncé | Signale qu'un autre syndicat (le principal) existe au-dessus |
| `numero_immatriculation_syndicat_principal` | — | 0,33 % | — | Le lien vers le principal, quand il est donné |
| `nombre_asl`, `nombre_aful`, `nombre_unions_syndicats` | Rattachement à une association syndicale libre, une AFUL ou une union | ~90 % | **22 600** copropriétés rattachées à au moins une structure | Utile : une deuxième source de charges et de règles |
| `residence_service` | Résidence-service (article 41-1 de la loi de 1965) | 100 % | 7 678 « oui » | Utile : charges de services spécifiques |
| `syndicat_cooperatif` | Syndicat coopératif | 79,3 % | — | Faible intérêt pour l'acheteur |
| `reference_cadastrale_1..3`, `nombre_parcelles` | Parcelles du règlement | 67 % ont au moins une référence ; 33 % déclarent 0 parcelle | Paris : `75056102…` (ancien) devient `75102000…` (nouveau). Trois références au plus publiées | Un indice de rattachement, pas une preuve (voir `rattachement.md`) |
| `latitude`, `longitude` | Géolocalisation | 99,99 % | Point de l'adresse de référence | Jamais une preuve d'appartenance |
| `copro_aidee` | Subvention Anah engagée **depuis 2014** | 100 % | **15 630 passent de « oui » à « non »** entre T3 2025 et aujourd'hui, alors qu'un cumul depuis 2014 ne peut pas redescendre. 19 878 « oui » sont devenus 5 704 | **Contradictoire entre millésimes : inutilisable** |
| `code_qp_2015/2024`, `copro_dans_acv/pvd/pdp` | Quartier prioritaire, Action cœur de ville, Petites villes de demain, plan de sauvegarde | 4,6 % en QPV | Zonages publics, déjà connus par la géographie | Aucun apport propre au registre |

### Ce qui n'est PAS publié

- **Les procédures** (mandat ad hoc, administration provisoire, carence) et **les arrêtés** (péril, insalubrité,
  équipements communs). Le dictionnaire et la notice les décrivent, mais **aucun fichier ouvert ne les a jamais
  contenus** : vérifié sur les en-têtes de T1 2023, T1 2024, T1 2025, T3 2025 et du fichier quotidien. La notice est
  elle-même décalée : ses libellés « Nombre d'arrêtés… » sont placés en face d'autres identifiants de colonnes
  (stationnement, période, parcelle). L'annuaire public les affiche fiche par fiche, sans API.
- **Aucune donnée financière** : budget, charges, impayés, dettes fournisseurs, fonds de travaux. Elles existent au
  registre (III de L711-2) mais ne sont pas publiques.
- **Aucune donnée énergétique ni technique** : pas de DPE collectif, pas de DTG, pas de plan pluriannuel de travaux.
- **Aucun identifiant de bâtiment** (ni RNB, ni BDNB).

---

## 5. Fraîcheur et stabilité

- **Diffusion** : quotidienne depuis avril 2026. La notice d'octobre 2025 dit encore « trimestrielle ». Le passage au
  quotidien a changé les noms de colonnes (« modifications à la marge », selon l'Anah). Ce changement a déjà cassé une
  fois tout lecteur du format T3 2025.
- **Données** : déclaratives, actualisées en principe une fois par an par le syndic. La date publiée ne permet pas de
  savoir si c'est fait (section 4).
- **D'un millésime à l'autre** (619 288 copropriétés communes) : nombre de lots d'habitation modifié pour 10 808,
  référence cadastrale pour 5 946, adresse de référence pour 28 477, période pour 346 622 (surtout la nomenclature),
  type de syndic pour 334 100, mandat pour 138 409.
