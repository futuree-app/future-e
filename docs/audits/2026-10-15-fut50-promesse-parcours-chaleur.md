# FUT-50 · Promesse, continuité du parcours, lecture de la chaleur

15 octobre 2026 · branche `feat/fut-50-accueil-decision` · **prototype seulement : aucun fichier de production, aucun dossier utilisateur modifié.**

Captures `docs/audits/fut50-accueil/images/c4-*.jpg` (La Rochelle et Nîmes) et `c3-*.jpg` (états du hero).

---

## 1. Diagnostic des trois problèmes

| Problème | Cause précise |
| --- | --- |
| **La promesse ne dit pas ce que fait futur•e** | Le titre décrivait le geste (« voyez-la à travers vos priorités »), pas le service. Les quatre priorités du hero passaient pour le produit entier : rien ne disait qu'elles ne sont qu'un aperçu gratuit, ni que l'environnement et le logement s'examinent aussi. |
| **« Décrire tout mon projet » trompe sur sa destination** | Le lien mène à `/ou-vivre`, qui **cherche des communes** à partir d'un projet écrit. Il ne reprend ni la commune choisie, ni la priorité. Aucune porte existante ne le fait : ni `/ou-vivre` (sans paramètre), ni `/checkout/rapport-complet` (sans commune transmise), ni `/dossier` (adresse obligatoire). |
| **La chaleur se lit de façon asymétrique** | Pour une commune sous les seuils, l'accueil reprenait l'issue `favorable` du moteur et sa phrase de condition (« rien de défavorable n'apparaît »), avec les seuls jours au-dessus de 35 °C. Pour une commune au-dessus, il reprenait la phrase du moteur, qui ne raconte que **les axes ayant franchi le seuil**. Résultat : La Rochelle, dont les nuits tropicales passent d'environ 5 à 23 par an, était annoncée « Plutôt favorable », sans un mot sur ses nuits. |

## 2. Formulations retenues

| Élément | Retenu | Pourquoi |
| --- | --- | --- |
| Titre | **Un lieu où vivre en tête ? Regardez au-delà de l'annonce.** | Ta proposition, gardée telle quelle : elle dit la décision (un lieu où vivre) et la différence (au-delà de l'annonce). Elle tient en trois lignes à 1440, 390 et 360 px (trait d'union insécable dans « au-delà »). |
| Sous-titre | Climat futur, risques, services, mobilité, logement : futur•e rassemble les données publiques pour comprendre un lieu, le confronter à votre projet et savoir quoi vérifier avant de décider. | Les quatre idées demandées, sans promettre de tout savoir ni de décider à votre place (« pour comprendre », « savoir quoi vérifier »). |
| Champ | **Commencez par une commune** · premier aperçu gratuit | Dit que les priorités sont une **démonstration gratuite**, pas le produit complet. |
| Priorités | Qu'est-ce qui compte pour vous ? | Ta proposition. |
| Lien secondaire | **Chercher des communes selon mon projet** → `/ou-vivre` | Le libellé annonce maintenant ce que fait la destination. |
| Lien principal | Examiner une adresse à … → `/dossier` (inchangé) | |

**Cohérence avec « Pourquoi futur•e ».** La phrase « Une annonce décrit un bien… », ajoutée le 14/10, est retirée : le titre porte désormais cette idée, et le mot « annonce » serait revenu trois fois en deux écrans. Le titre de section (« Votre futur lieu de vie ne tient pas dans une annonce. ») et la signature restent inchangés.

## 3. Les portes du produit, et où elles mènent

```
Accueil
├─ champ « Commencez par une commune » ──► lecture gratuite sur place (4 priorités, rien d'enregistré)
│     ├─ « Examiner une adresse à X »        ──► /dossier : qualification d'adresse, dossier 39 € (Territoire + Autour + Logement)
│     └─ « Chercher des communes selon mon projet » ──► /ou-vivre : projet écrit → communes qui y répondent (sans compte)
├─ « Vous avez déjà une adresse précise ? »  ──► /dossier
└─ Offres
      ├─ Dossier de territoire 14 €           ──► /checkout/rapport-complet (aucune commune transmise aujourd'hui)
      ├─ Dossier d'adresse 39 € / 25 €        ──► /dossier
      └─ Dossier comparatif 39 €              ──► /ou-vivre
```

**Aucune de ces portes ne garde la commune ni la priorité choisies sur l'accueil.**

**Évolution proposée, à décider à part, sans persistance implicite :** un lien « Approfondir X avec votre projet » vers le dossier de territoire de **cette** commune, en transmettant le code INSEE dans l'adresse de la page (comme `?code=` sur `/dossier`). La priorité ne serait proposée qu'à la **saisie** du projet, jamais enregistrée d'office.

## 4. Chaleur : les données vérifiées

**Source** : `public/data_climat.json` (DRIAS-TRACC, médiane des modèles).
- **Valeurs** : colonnes `NORTX35D_yr` / `ATX35D_yr` (jours au-dessus de 35 °C) et `NORTR_yr` / `ATR_yr` (nuits tropicales).
- **Horizon** : palier `gwl20`, soit 2050 et +2,7 °C en France.
- **Référence 1976-2005** : reconstruite comme valeur projetée moins écart (`buildClimatFacts`).
- **Seuils de la règle du moteur** (`CLIMAT_METRICS`, seuils déclarés) : **8 jours** au-dessus de 35 °C ou **25 nuits** tropicales par an à l'horizon 2050. **Un seul axe atteint suffit** (`>=`, sur la valeur non arrondie).

| Commune (INSEE) | Jours > 35 °C · 2050 (réf.) | Nuits tropicales · 2050 (réf.) | Classification |
| --- | --- | --- | --- |
| La Rochelle (17300) | 2,8 (0,3) | **23,4 (5,1)**, à 1,6 du seuil | sous les seuils |
| Nîmes (30189) | 14,4 (2,6) | 69,1 (33,0) | défavorable, les deux axes |
| Nantes (44109) | 4,1 (0,5) | 11,1 (2,0) | sous les seuils |
| Pau (64445) | **7,1 (1,3)**, à 0,9 du seuil | 19,2 (4,2) | sous les seuils |
| Bordeaux (33063) | 6,3 (1,5) | 28,1 (7,4) | défavorable, nuits seules |

## 5. Avant / après

**La Rochelle**

| | Avant | Après |
| --- | --- | --- |
| Données | Jours au-dessus de 35 °C : 3 jours par an à l'horizon 2050, contre moins d'une sur 1976-2005. | **3** jours par an (au-dessus de 35 °C à l'horizon 2050, contre moins d'une journée sur 1976-2005) · **23** nuits tropicales (par an à l'horizon 2050, sans descendre sous 20 °C, contre 5 nuits sur 1976-2005) |
| Pour votre priorité | **Plutôt favorable** · À l'échelle de la commune, rien de défavorable n'apparaît pour des étés plus frais. | **Sous les seuils de signalement** · Les deux indicateurs restent sous les seuils de signalement de futur•e (8 jours au-dessus de 35 °C, ou 25 nuits tropicales par an), mais les nuits tropicales en sont proches (23 pour un seuil de 25). Ces seuils sont des conventions de lecture, pas des seuils sanitaires : cela ne veut pas dire que les étés resteront frais. |

**Nîmes**

| | Avant | Après |
| --- | --- | --- |
| Données | Phrase du moteur (deux trajectoires, parce que les deux axes franchissent) | **14** jours par an · **69** nuits tropicales, même gabarit que La Rochelle |
| Pour votre priorité | Plutôt défavorable · Des étés plus difficiles à concilier avec cette priorité | Plutôt défavorable · Des étés plus difficiles à concilier avec cette priorité : les jours au-dessus de 35 °C et les nuits tropicales atteignent le seuil de signalement de futur•e (8 jours au-dessus de 35 °C, ou 25 nuits tropicales par an). |

**Dans tous les cas :**
- **À vérifier** reprend la limite du moteur (« lue à l'échelle de la commune, pas de l'adresse ni du logement ») et ajoute ce qui dépend du quartier et du logement : orientation, étage, isolation, possibilité d'aérer la nuit.
- **« Sous les seuils de signalement »** a une teinte neutre, jamais celle de « favorable ».
- **Un axe « proche »** (au moins 80 % du seuil) est nommé.
- **Une valeur affichée ne franchit jamais un seuil qu'elle ne franchit pas** : 24,6 nuits sous un seuil de 25 s'affiche « 24,6 », pas « 25 ».

**Trois couches séparées**, prêtes pour une future route publique légère :

| Couche | Fonction |
| --- | --- |
| Données | `buildClimatFacts` |
| Classification | `classifyClimateComfort`, la fonction même de la règle `territoire.climat-chaleur` |
| Formulation | `lireChaleur` |

La chaleur n'a plus besoin de relancer tout le dossier.

## 6. Écarts relevés avec le moteur et le dossier Territoire

- **Classification** : identique sur tout le panel. Sous les seuils dans le prototype correspond à `favorable` dans le moteur ; défavorable correspond à `mismatch`.
- **Dossier Territoire payant, à traiter hors FUT-50** :
  - **Communes sous les seuils** (La Rochelle, Nantes, Pau) : avec la priorité chaleur, le dossier n'affiche **aucune carte**, et le registre compte la priorité comme **favorable**. Les 23 nuits de La Rochelle n'y apparaissent pas. C'est exactement l'asymétrie corrigée ici sur l'accueil.
  - **Bordeaux** : la carte ne parle que des nuits (28) et tait les jours au-dessus de 35 °C (6,3). La narration du moteur ne raconte que les axes qui franchissent le seuil.
- **Données outre-mer, à vérifier** : `data_climat.json` contient des lignes pour 97411 (Saint-Denis de La Réunion) et même pour 98714. Une référence de 33 nuits tropicales par an y paraît peu plausible. Je n'ai rien conclu : la couverture et l'origine de ces lignes méritent une vérification (Data Curator).
- **Page de paiement du dossier Territoire** : elle promet encore « vos réponses au wizard » (FUT-28).

## 7. Vérifications

**Tests** :
- tests FUT-50 : 28/28 ;
- suite complète : 2 583/2 583 ;
- `tsc` et `eslint` sans erreur ;
- build de production réussi (290 pages) ;
- en production, `/dev/fut50/c` et la route de lecture renvoient 404, `/`, `/ou-vivre` et `/dossier` renvoient 200.

**Ce que couvrent les nouveaux tests de chaleur** :
- valeurs réelles non arrondies pour La Rochelle, Nîmes, Bordeaux et Nantes ;
- frontières exactes : 7,99 / 24,99 sous les seuils, 8 et 25 au-dessus ;
- affichage qui ne franchit jamais le seuil (24,6 → « 24,6 ») ;
- données absentes ou incomplètes : jamais favorable.

**Navigateur (Chromium)** :

| Point | Résultat |
| --- | --- |
| Trois états | conformes à 1440, 390 et 360 px |
| Transition | inchangée (titre fixe, même champ, CLS 0,000) |
| Mobile | le titre de la lecture est sous l'en-tête fixe (108 px contre 65 px) |
| Onglets au clavier | flèches, Début, Fin ; un seul onglet tabulable ; panneau lié |
| Code inexistant | « indisponible » |
| Erreur de lecture | « Réessayer » |
| Mouvement réduit | 0 animation |

**Défauts trouvés et corrigés pendant la passe** :
- le focus des onglets ne suivait pas la flèche ;
- « 35 » et « °C » se séparaient en fin de ligne ;
- l'horizon 2050 était absent de la légende des grands chiffres.

**Outillage** : les captures sont désormais écrites hors du dépôt pendant le parcours, car le serveur de développement rechargeait la page quand une image arrivait dans `docs/`.

## 8. Limites, et ce qu'il faut tester avec de vrais utilisateurs

**Non vérifiable sans utilisateurs :**
- comprend-on en cinq secondes à quoi sert futur•e ?
- le « premier aperçu gratuit » se distingue-t-il du dossier payant ?
- « Sous les seuils de signalement » est-il compris comme « pas d'alerte selon nos conventions », et non comme « sans risque » ?

Protocole proposé : le test des cinq secondes, puis La Rochelle et Nîmes montrées côte à côte, avec la question « Laquelle a des étés plus chauds, et à quel point ? ».

**Non testé** : Safari, Firefox, un vrai lecteur d'écran, de vrais téléphones.

**Seuils inchangés** : aucun seuil ni aucune classification du moteur n'a été modifié.
