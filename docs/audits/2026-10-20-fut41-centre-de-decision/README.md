# FUT-41 / FUT-22 : concevoir le centre de décision résidentielle

20 octobre 2026. **Cadrage, rien n'est codé.** Aucune migration, aucune table, aucun moteur, aucun
droit ni prix touchés. Base examinée : `main` à `bdf3fd4a` (FUT-17, `engine-6`), worktree
`explore/fut-41-centre-decision`.

Documents de ce dossier :

- `README.md` : ce document (livrables A à F) ;
- `prototype.html` : la maquette navigable des trois directions, sur données de démonstration
  explicitement fictives, construites sur la forme réelle des artefacts (`criteria.registry`).
  Fichier local uniquement : s'ouvre directement dans un navigateur.

---

## En une minute

**Ce qu'on veut construire.** Un endroit où une personne retrouve son Projet, les lieux qu'elle
envisage, ce qui les départage vraiment, ce qu'il lui reste à vérifier, et le chemin parcouru.

**Ce que le code permet déjà, et c'est beaucoup.** Les analyses vendues sont figées et versionnées
(`decision_artifact`). Le Projet a une signature décisionnelle qui dit quand il a changé pour la
décision (`signatureDecisionnelle`). Un moteur pur compare deux analyses sans note ni gagnant, et
refuse de rapprocher deux analyses produites dans des cadres différents
(`comparaison-candidats.ts`). La mise à jour explicite d'une analyse existe déjà
(`/api/dossier/actualiser`), et produit une version nouvelle sans effacer l'ancienne.

**Ce qui manque, et qui empêche tout le reste.** Il n'existe pas d'objet « candidat ». Le dossier
d'adresse payé tient lieu à la fois de lieu, de candidat et de droit commercial ; une commune
examinée n'existe que comme droit (`report_grants`). Rien ne porte un état dans la recherche, un
motif d'abandon, une vérification ou une observation. Le Projet n'a pas d'identité ni d'historique :
il est réécrit en place.

**Ce que je recommande.**

1. Direction d'expérience : **le dossier de décision vivant** (direction A), qui emprunte deux
   gestes précis aux deux autres : *rapprocher* deux possibilités (B) et *depuis la dernière fois*
   (C).
2. Modèle : **donner au Projet une identité et un historique, sans le multiplier.** Un Projet actif
   par compte, comme aujourd'hui pour le lecteur ; mais un identifiant stable et des révisions
   successives, pour que candidats, abandons et droits futurs s'y rattachent.
3. Une règle de comparaison au cœur : **comparer au grain commun le plus fin, et montrer
   l'excédent de profondeur comme tel**, jamais comme un avantage.
4. Un geste nouveau, simple, qui débloque la comparaison honnête : **« mettre au même cadre »**,
   c'est-à-dire réactualiser explicitement les analyses comparées au même moment, sous le même
   Projet et le même moteur, avec les anciennes versions conservées.
5. Première tranche : un prototype de développement sur de vraies analyses (les vôtres), avant toute
   table, à tester avec 5 à 10 personnes en recherche active.

Neuf arbitrages vous reviennent (section F.6).

---

## A. Diagnostic de l'existant

### A.1 Le Projet

**Source canonique.** `user_profiles.user_project`, une colonne `jsonb` par compte
(`supabase/17_add_user_project.sql`), typée `UserProject` (`src/lib/user-project.ts`). Forme v3
depuis FUT-8 :

| Champ | Ce qu'il porte | Écrivain |
|---|---|---|
| `posture`, `intent` | objectif (chercher, étudier une adresse, j'y habite) et intention (achat, location) | lecteur |
| `rawText` | le texte du lecteur, conservé tel quel | lecteur |
| `parsed` | sortie du parseur : `hardConstraints`, `preferences` (clé + poids 1/2/3), `horsMesure`, reformulation | parseur, remplacé en entier à chaque reparse |
| `conditions[]` | conditions sans compromis confirmées (FUT-7), épinglées à une empreinte de valeur | lecteur seul (`source: "user"`) |
| `definitions[]` | précisions de sens (« 20 km à vol d'oiseau », « unité urbaine ») (FUT-8) | lecteur |
| `adoptions[]`, `rejets[]` | critères proposés par une ancre, repris ou refusés (FUT-8) | lecteur |
| `updatedAt`, `schemaVersion` | estampilles serveur | serveur |

**Ce qui est solide.**

- La confirmation est un acte, épinglée à une empreinte (`criterionFingerprint`) : « la Bretagne »
  confirmée ne vaut pas pour « la Normandie ». C'est exactement le mécanisme dont un motif
  d'abandon aura besoin (« écarté quand votre limite était 30 min »).
- `signatureDecisionnelle` (`src/lib/decision/projet-materiel.ts:82`) réduit le Projet à ce que le
  moteur lit : posture, intention, structure, contraintes, préférences et poids, conditions
  valides. **C'est déjà, de fait, un identifiant de version décisionnelle du Projet**, calculé et
  non stocké.
- `projetAChangeMateriellement` dit, pour chaque analyse figée, si le Projet courant en diffère
  pour la décision. L'écran le dit et propose une mise à jour (`DossierAvecLogement.tsx:238`,
  `rapport/page.tsx:268`).

**Ce qui manque pour porter plusieurs candidats dans la durée.**

| Manque | Conséquence pour le centre de décision |
|---|---|
| Pas d'identité | Les candidats ne peuvent se rattacher qu'au **compte**. Une seconde recherche, deux ans plus tard, héritera de tous les candidats de la première. |
| Pas d'historique | Un état antérieur du Projet n'est récupérable que s'il a été figé dans un artefact (`projectSnapshot`) ou une intention d'achat (`dossier_intents.project_snapshot`). Un Projet modifié sans achat entre-temps est perdu. On ne peut pas dire « ce qui a changé depuis le 3 novembre ». |
| Pas de lien Projet → analyses | On sait qu'une analyse répond à un **autre** Projet ; on ne sait pas à **quelle révision**. |
| `horsMesure` sans importance (FUT-55) | « surtout un budget de 200 000 € » perd le « surtout » : dans un comparatif, la demande principale non mesurée disparaîtrait derrière dix préférences mesurées. |

**Sources concurrentes encore présentes** (FUT-29, non traité) :

- `decision_packs.parsed_snapshot` : un `ParsedProject` figé à l'achat d'un Dossier comparatif,
  ancien format, sans conditions ni définitions ;
- `wizard_answers` (migration 14) et les champs de profil lus par `/compte/memoire`
  (`age_band`, `health_flags`, `life_projects`, `presence_enfants`…) : un « profil » que le moteur
  ne lit pas ;
- `report_context.discovery_workbook` et `terrain_observations` (module quartier) : des réponses du
  lecteur, rangées par commune, que le moteur ne lit pas ;
- la session « Où vivre » : FUT-27 n'est pas fait, la recherche et le Projet ne sont pas encore
  séparés par un geste explicite.

**Verdict.** Un JSON unique par compte suffit à **lire** un Projet. Il ne suffit pas à rattacher des
candidats, à dater des abandons, ni plus tard à borner un Pass « à une recherche ». La section D.2
instruit l'arbitrage.

### A.2 Les lieux et leurs analyses

Les cinq objets que la cible doit distinguer, et où ils vivent aujourd'hui :

| Objet | Commune | Adresse |
|---|---|---|
| 1. Lieu géographique | code INSEE (normalisé par `communeParent` pour Paris, Lyon, Marseille) | `address_dossiers.ban_id`, `address_label`, `insee` |
| 2. Candidat étudié | **n'existe pas** | **n'existe pas** (tenu par la ligne `address_dossiers`) |
| 3. Analyse | `decision_artifact`, `scope_key = 'commune'`, versions immuables | `decision_artifact`, `scope_key = 'logement:<dossier_id>'` + `logement_report_versions` (immuables) |
| 4. Statut dans la recherche | **n'existe pas** | **n'existe pas** |
| 5. Droit d'accès commercial | `report_grants` (unique par `user_id, insee`) | l'existence de la ligne `address_dossiers` non révoquée (RLS) |

**Le défaut de structure : `address_dossiers` confond quatre objets.** Une même ligne porte le lieu
(`ban_id`, `address_label`), des éléments de candidat (`place_relation`, `place_objective`,
`selected_dpe_snapshot`, le voisinage gelé `snapshot`), le droit (`stripe_payment_intent_id`,
`amount_paid_cents`, `access_revoked_at`) et le lien de remplacement (`replacement_for_dossier_id`).
C'était juste pour vendre un dossier. Pour une recherche, trois cas cassent :

- **un candidat sans droit** : une annonce encore sans adresse, une commune explorée gratuitement ;
- **un droit sans candidature** : le dossier du logement où l'on vit déjà (`place_relation =
  lives_here`) est un **point de référence**, pas une possibilité ; un dossier acheté pour une
  recherche close n'est plus candidat de la recherche suivante ;
- **un candidat qui change de profondeur** : une commune devient une adresse, une annonce reçoit son
  adresse exacte.

**Ce qui est déjà juste et se réutilise tel quel.**

- `decision_artifact` : version immuable, `projectSnapshot`, `engineVersion` (`engine-6`),
  `conventionsVersion` (`hc-conv-3`), `generatedAt`, `contexteDuBien` (FUT-10), `dataSnapshot`
  partiel. La péremption est **calculée**, jamais stockée (vault, `objet-central`).
- Plusieurs adresses dans une même commune : chaque dossier a son artefact `logement:<id>`, et
  partage l'artefact `commune` de sa commune (clé `user_id, insee, scope_key`). C'est la bonne
  structure : **deux biens d'une même commune partagent leur lecture territoriale par
  construction.**
- Commune sans adresse : `report_grants` + artefact `commune`. Fonctionne, mais n'apparaît dans
  « Mes biens » que depuis le 13/08 (`listTerritoiresSansBien`).
- `active_dossier_id` (migration 29) : une **préférence de lecture**, jamais un droit
  (`dossier-actif.ts`). À garder comme telle ; ce n'est pas un statut de candidat.
- La relation au lieu (FUT-26, `relation-au-lieu.ts`) : séparée du Projet, une par commune
  (`report_context`) et une par adresse (`address_dossiers.place_relation`), jamais déduite.
- `canAccessTerritory` (grant OU dossier) : le droit se résout au moment de lire, partout.

**Conservation et actualisation.** Les artefacts sont générés **à l'achat** (webhook,
`planifierArtefact`), rattrapés à la première ouverture s'ils manquent (`rapport/page.tsx:236`),
et réactualisés **sur demande explicite** (`/api/dossier/actualiser`, version n+1). Le cycle
d'interface de cette mise à jour est encore défaillant (FUT-66 : le bandeau reste affiché après
succès). Un dépôt de diagnostic recalcule seul ; un changement de Projet se demande. C'est la
doctrine, et le centre de décision doit la garder.

**L'artefact commune d'une adresse.** L'achat d'une adresse fige l'artefact `logement:<id>` ; l'artefact
`commune` de la même commune n'est produit qu'au rattrapage, à la première ouverture de `/rapport`.
Les deux peuvent donc avoir été figés à des dates, et sous des Projets, différents. À vérifier par
candidat, jamais à supposer.

### A.3 La comparaison existante

`src/lib/decision/comparaison-candidats.ts` (244 lignes, 13 tests), spec
`docs/superpowers/specs/2026-08-19-comparaison-deux-candidats-design.md`.

**Réutilisable dès maintenant.**

| Acquis | Pourquoi il compte |
|---|---|
| Lecture de deux **artefacts figés**, sans recalcul ni I/O | La comparaison dit ce que chaque dossier a conclu, telle qu'il a été vendu. |
| Axe = **critères déclarés et leur issue**, jamais les valeurs mesurées | Évite de comparer deux chiffres de grain ou de millésime différents. |
| `FaceCandidat` : verdict verbatim, correspond / contredit / compromis / inconnues / contrôles prioritaires / couverture / version | C'est déjà la « fiche » d'une possibilité. |
| `to_confirm`, `indeterminate`, `unexamined` ⇒ `indetermine_ici` | **La protection contre l'asymétrie de connaissance est déjà codée** : un candidat moins documenté ne gagne jamais une ligne par absence. |
| `criteresNonPartages` nommés | Rien n'est écarté en silence. |
| `comparabilite.reserves` : moteur, conventions, Projet (même signature que la péremption), échelle | Un écart hors cadre commun devient `difference_hors_cadre_commun`, phrase par phrase. |
| Ordre = registre de A puis propres à B, jamais trié | Aucune hiérarchie de critères inventée. |

**Ce qui bloque, cas par cas.**

| Cas | Comportement actuel | Bloquant ? |
|---|---|---|
| Même Projet, même moteur, même échelle | `difference_dans_le_meme_cadre` | Non, sauf millésimes (ci-dessous). |
| Projets différents | Réserve + toutes les différences hors cadre | Non bloquant techniquement, **inutilisable en pratique** : le lecteur qui modifie son Projet entre deux achats ne peut plus rien comparer. Débloqué par « mettre au même cadre » (D.5). |
| Moteurs différents (`engine-4` contre `engine-6`) | Réserve | Idem. |
| Millésimes des sources | **Non vérifié.** L'artefact ne porte aucun manifeste de données (FUT-12). | **Oui**, pour toute affirmation « ce lieu diffère ». Contournement partiel : deux analyses produites au même moment lisent le même index déployé (D.5). |
| Commune seule contre adresse | Réserve d'échelle, toutes les différences hors cadre | **Oui.** Il faut une règle de grain commun (D.4). |
| Données manquantes d'un côté | `indetermine_ici` | Non, c'est le bon comportement. |
| Versions historiques figées | Lisibles, comparables avec réserves | Non. |
| Droits d'accès | Hors du module (vérifiés en amont) | Non pour deux dossiers possédés. **Ouvert** pour une commune non débloquée (F.6, arbitrage 3). |
| Deux candidats à plusieurs | Fonction binaire uniquement | **Oui.** Les relations par paires ne composent pas une lecture à N : il faut une lecture **par critère** sur l'ensemble (D.4). |
| Poids du critère | Absent du registre ; présent dans `projectSnapshot.parsed.preferences` | Non, récupérable. |
| Grain du critère | Absent du registre (le grain vit dans les évaluations) | Oui pour la règle de grain commun : à exposer. |

**Conclusion.** Le moteur est bon et **ne doit pas être refait**. Il doit être **généralisé** (N
candidats, lecture par critère), **complété** (grain du critère, empreinte des données lues), et
**alimenté** par des analyses mises au même cadre. Aucune de ces trois opérations ne touche les
règles de décision.

### A.4 Ce qui ne convient pas à la cible

1. **La navigation expose des objets** (« Mon rapport », « Mes biens », « Comparateur ») au lieu de
   l'état de la décision (FUT-86).
2. **« Mes biens » liste des achats.** Une page de reprise, pas un espace de recherche
   (`rapport/dossiers/page.tsx` : « Cette page existe parce qu'on refuse de deviner »).
3. **Le Dossier comparatif figé (`decision_packs`)** porte son propre Projet (`parsed_snapshot`),
   pour trois communes fixées à l'achat. Il ne peut pas suivre une recherche qui change ; il n'est
   pas la base du centre de décision. Son sort relève de FUT-49.
4. **Les observations existantes** (`terrain_observations`, unique par `user_id, insee, module`)
   sont rangées par commune, une seule par module, sans auteur typé ni sujet : un précédent utile,
   pas un modèle réutilisable.
5. **Le Relevé est livré sous drapeau** (`DECISION_RELEVE`, FUT-91) et n'est pas activé : le centre
   de décision doit naître dans cette grammaire (FUT-118, règle de la phase A).

---

## B. Vision produit

### B.1 La définition

> Le centre de décision est l'endroit où une personne retrouve **ce qu'elle cherche**, **les lieux
> qu'elle envisage**, **ce qui les départage pour elle**, **ce qu'il lui reste à apprendre**, et
> **ce qui a changé depuis la dernière fois**.

Il ne remplace pas les dossiers : chaque dossier reste la profondeur documentaire d'un lieu
(Territoire, Autour, Logement). Le centre est la **lecture transversale**, au même titre que la
synthèse d'un dossier relie ses trois échelles au Projet.

Ce qu'il sait dire, et que personne d'autre ne dit :

- « Seules deux de vos cinq possibilités tiennent votre condition sur l'accès à la mer. »
- « Ces deux appartements sont dans la même commune : ce qui les départage se joue à l'adresse et
  dans le logement, pas dans le territoire. »
- « Votre condition sur les soins pourrait départager Vannes et Lorient, mais elle reste à
  vérifier pour les deux. »
- « Cette différence tient à la profondeur de l'analyse : Auray n'a été examinée qu'à la commune. »
- « Écarté le 3 novembre quand votre limite de trajet était 30 minutes. Votre Projet accepte
  maintenant 45 minutes. »

Et ce qu'il ne dira jamais : un score, un rang, « le meilleur choix », « 82 % compatible ».

### B.2 Le modèle conceptuel

```text
Projet (identité stable)
 ├── Révisions du Projet (append-only : ce que la personne cherchait, à chaque date)
 ├── Point de référence (facultatif : le logement où l'on vit, pour dire « par rapport à aujourd'hui »)
 └── Possibilités (candidats)
       ├── Lieu : une commune, ou un bien (adresse exacte, ou annonce encore sans adresse)
       ├── Relation au lieu (FUT-26) et objectif (FUT-10)
       ├── Niveau d'examen  ← CALCULÉ à partir des analyses et des droits, jamais stocké
       ├── Analyses : versions figées existantes (decision_artifact), jamais copiées
       ├── Vérifications : issues de l'analyse (contrôles, conditions ouvertes) + ajoutées
       ├── Observations : ce que la personne a constaté, demandé, reçu (origine typée)
       └── Journal : ajouté, examiné, visite prévue, visité, en course, écarté (motif), repris, retenu
                     chaque entrée épinglée à la révision du Projet et à la version d'analyse du moment

Comparaison  ← CALCULÉE à la lecture, jamais stockée (sauf relevé figé demandé, horizon 3)
Décision     ← un événement du journal (« retenu »), avec son contexte complet
```

**À qui appartient quoi.**

| Information | Appartient à | Exemple | Change quand |
|---|---|---|---|
| Ce qui compte, conditions, poids, précisions | **Projet** (révision) | « mer à moins de 10 km, sans compromis » | le lecteur modifie son Projet |
| Le lien avec ce lieu, l'objectif | **Candidat** | « je visite ce bien pour l'acheter » | le lecteur le déclare |
| Faits, preuves, règles, conclusion | **Analyse figée** | « à 6,2 km du rivage, favorable » | jamais : une nouvelle version se produit |
| Ce que le lecteur a vu, entendu, reçu | **Observation** | « rue calme un mardi à 22 h » | le lecteur l'ajoute ; jamais réécrite en fait |
| Ce qu'il reste à apprendre | **Vérification** | « fenêtres ouvrables la nuit, côté rue ? » | ouverte, faite (avec réponse), abandonnée |
| Où en est ce lieu dans la recherche | **Journal** | « écarté : trop loin de la gare » | chaque geste ajoute une entrée |
| Ce que futur•e peut montrer | **Droit** (hors centre) | dossier adresse acheté, territoire débloqué | achat, révocation ; lu, jamais copié |

### B.3 Les principes de lecture

1. **Le lecteur ordonne, futur•e range.** L'ordre des possibilités est celui du lecteur (ajout, ou
   ordre qu'il choisit). L'ordre des critères est celui de son Projet, conditions sans compromis
   d'abord, puis poids déclaré. Aucun tri par nombre de points favorables.
2. **Ce qui départage passe avant ce qui se ressemble.** Un critère où toutes les possibilités
   disent la même chose se replie.
3. **L'inconnu est montré au même niveau que le favorable.** Une ligne « pourrait départager, reste
   à vérifier » vaut une ligne « départage ».
4. **Grain commun le plus fin.** Deux possibilités se comparent au grain qu'elles partagent ; la
   profondeur en plus d'un côté se montre comme profondeur, jamais comme avantage ni défaut.
5. **Même cadre, ou réserve dite.** Une différence produite par des Projets, des moteurs ou des
   données différents se nomme comme telle, avec le geste qui la résout.
6. **Le passé ne se réécrit pas.** Un abandon garde le Projet et l'analyse de son moment. Le présent
   peut le **réinterroger** : « votre Projet a changé depuis sur ce point ».
7. **Ce que vous avez constaté reste à vous.** Une observation porte son auteur, sa date, son
   contexte ; elle n'entre jamais dans la marge de preuve sous la forme d'une source publique.
8. **Utile dès la première possibilité.** Avec un seul lieu, le centre est le dossier de ce lieu, et
   rien de plus. Il émerge quand la deuxième possibilité arrive, jamais comme sas vide.

### B.4 Les sept cas

**Cas 1. Exploration territoriale : cinq communes, aucune adresse.**
Cinq possibilités de type commune. Niveaux d'examen différents : deux débloquées (artefact
`commune`), trois explorées gratuitement. Ce qui départage se lit au grain commune, sur les
critères que les cinq partagent. Pour les trois non débloquées, le centre montre ce que le gratuit
montre déjà (le triptyque : une correspondance, une contradiction, une inconnue) et le dit :
« lecture partielle, commune non examinée ». Il ne fabrique aucun départage à partir d'une lecture
partielle. Transition naturelle : « examiner cette commune » (14 €), ou « explorer d'autres pistes
pour ce point » (FUT-42, recherche jetable dérivée du Projet).

**Cas 2. Recherche immobilière : six annonces, dont deux dans la même commune.**
Six possibilités de type bien. Certaines n'ont pas encore d'adresse exacte : elles existent avec
une commune, un libellé, un lien d'annonce saisi par la personne, et un niveau d'examen « commune
seulement ». Les deux biens d'une même commune sont **groupés sous leur commune** : la lecture
territoriale est commune aux deux, et le centre le dit (« ce qui les départage se joue à
l'adresse et dans le logement »). Cette phrase est la règle de grain de FUT-42 appliquée à la
comparaison : on ne laisse jamais entendre qu'un problème d'adresse se règle en changeant de
commune, ni qu'un territoire départage deux biens qui le partagent.

**Cas 3. Candidats mixtes : deux communes et trois adresses.**
Lecture en deux étages.
- **Étage territoire**, au grain commun : les cinq se comparent par l'artefact `commune` de leur
  commune (pour une adresse : celui de sa commune). Les trois adresses, si deux partagent une
  commune, ne font que quatre colonnes territoriales.
- **Étage adresse et logement**, entre les seules adresses : les deux communes y apparaissent
  « non examinées à cette échelle », jamais comme « sans défaut ».
Chaque écart purement dû à la profondeur est étiqueté : « tient à la profondeur de l'analyse ».

**Cas 4. Le Projet évolue après plusieurs visites.**
Une révision nouvelle du Projet s'ajoute (la précédente reste lisible). Le centre affiche un
encart « Ce que ce changement déplace » :
- pour chaque possibilité, si son analyse répond désormais à une version antérieure
  (`projetAChangeMateriellement`, déjà calculé) ;
- pour chaque abandon, si le motif portait sur un critère dont la valeur a changé (comparaison des
  empreintes `valeurDecisionnelle`) : « écarté quand votre limite était 30 min ; votre Projet
  accepte maintenant 45 min » ;
- une proposition explicite : « mettre ces analyses au même cadre » (n versions nouvelles, les
  anciennes conservées). Tant que le lecteur ne l'a pas fait, la comparaison reste hors cadre
  commun, et le dit.

**Cas 5. Dossiers historiques de moteurs ou de données différents.**
Chaque possibilité affiche la version et la date de son analyse. Une comparaison qui mêle
`engine-4` et `engine-6` porte la réserve existante. Le geste « mettre au même cadre » s'applique
aux dossiers possédés ; aucun dossier n'est régénéré sans demande. La version achetée reste
consultable à côté de la version actualisée.

**Cas 6. Recherche longue : écarter, ajouter, revenir.**
Écarter ajoute une entrée au journal (motif libre, critères éventuellement désignés, révision du
Projet, version d'analyse). Un mois plus tard, une nouvelle possibilité arrive : elle se compare
aux possibilités en course. Revenir sur le premier logement ajoute une entrée « repris » ; son
motif d'abandon reste visible, avec ce qui a changé depuis (Projet, analyse, observations). Le
centre propose de mettre son analyse au cadre courant s'il le faut.

**Cas 7. Informations personnelles après visite.**
« Bruit ressenti », « isolation selon le vendeur », « trajet réellement effectué en 38 min » sont
trois **observations** d'origines différentes (observation du lecteur, déclaration du vendeur,
mesure du lecteur). Elles s'affichent sous la vérification qu'elles renseignent, avec auteur, date
et contexte (« un mardi à 8 h 10 »). En version fiable, elles **ne modifient aucune issue** : la
ligne dit « vous avez constaté… ; l'analyse publique reste… ». La réévaluation déterministe d'une
issue par une réponse structurée (FUT-21) vient ensuite, critère par critère, avec une règle écrite
et testée pour chacun.

---

## C. Trois directions d'expérience

La maquette `prototype.html` rend les trois directions sur la même recherche fictive (un couple
qui quitte Nantes pour le Morbihan : quatre communes, trois biens, un Projet révisé une fois).

### Direction A : le dossier de décision vivant

**Idée.** Une seule page éditoriale, dans la grammaire du Relevé : des énoncés à gauche, leur preuve
dans la marge. La page répond, dans l'ordre, aux questions du lecteur (FUT-86).

**Hiérarchie de l'information.**

1. *Depuis votre dernière visite* : ce qui a changé (Projet, analyses, observations). Une à trois
   lignes, absent s'il n'y a rien.
2. *Ce que vous cherchez* : le Projet en phrase de lecteur, conditions sans compromis nommées, une
   tension éventuelle (« deux de vos priorités tirent en sens contraire sur la taille de ville »).
3. *Ce qui départage vos possibilités* : énoncés déterministes, un par critère qui départage,
   ordonnés comme le Projet. Chaque énoncé nomme les possibilités concernées, et sa marge montre
   l'issue de chacune, son grain (cercle, carré, losange) et la date de l'analyse.
4. *Ce qui pourrait encore changer votre avis* : les départages possibles non documentés et les
   conditions sans réponse partout, chacun avec sa vérification.
5. *Vos possibilités* : un registre compact (une ligne par lieu : état, niveau d'examen, verdict
   vendu, prochaine action). Les écartés en dessous, repliés, avec leur motif.
6. *Le chemin parcouru* : le journal, replié.

**Interactions distinctives.**
- Toucher un nom de possibilité dans un énoncé le surligne partout dans la page.
- « Rapprocher » deux possibilités (emprunt de B) ouvre une coupe où seules les lignes qui diffèrent
  restent dépliées.
- Chaque énoncé hors cadre porte son bouton « mettre au même cadre ».

**1, 2, 5, 10 possibilités.**
- 1 : la page est le dossier du lieu (le hub actuel) ; le bloc 3 n'existe pas.
- 2 : énoncés binaires (« Vannes tient, Lorient non »).
- 5 : énoncés groupés (« trois sur cinq tiennent… : Vannes, Auray, Ploërmel »).
- 10 : les énoncés ne nomment plus que la minorité (« seules Auray et Séné ne tiennent pas… ») ; le
  registre du bloc 5 se groupe par commune.

**Place du Projet.** En tête, en phrase, modifiable en place ; chaque énoncé y renvoie.
**Conditions et preuves.** Dans la marge : issue par possibilité, grain, version. Un clic ouvre la
carte du dossier concerné (le lien « Preuve » existant).
**Mobile.** Naturel : une colonne, la marge passe sous l'énoncé (règle déjà codée dans
`releve.module.css`).
**Risques.** La page s'allonge ; les énoncés doivent être des **gabarits déterministes**
(aucune phrase générée) et testés sur ce qu'ils racontent, pas seulement sur leur présence
(leçon du 25/07 dans `AGENTS.md`).
**Ce qui la rend mémorable.** La première phrase qui nomme exactement ce qui sépare deux lieux pour
*ce* Projet. Personne d'autre ne peut l'écrire, parce que personne d'autre ne tient le registre.

### Direction B : l'atelier des possibilités

**Idée.** Une table de relevé manipulable. Les possibilités sont des fiches posées dans trois zones
(*en course*, *de côté*, *écartées*) et sur une carte. On les rapproche, on les écarte, on
passe une condition comme une lentille.

**Hiérarchie.** La table d'abord, le Projet en bandeau, la lecture comparée à la demande.

**Interactions distinctives.**
- **Rapprocher** : poser deux fiches l'une contre l'autre plie les lignes identiques et ne laisse
  voir que les différences.
- **La lentille** : choisir une condition du Projet assombrit les possibilités qui ne la tiennent
  pas et marque celles où elle reste inconnue. C'est un **filtre**, sans classement.
- **« Et si je lâchais cette condition ? »** : la lentille inversée montre quelles possibilités
  écartées reviendraient. C'est une recherche jetable sur le Projet (FUT-27), qui n'écrit rien.
- **Glisser pour écarter**, avec motif demandé.

**1, 2, 5, 10.** 1 : une fiche seule n'a pas de sens, l'atelier ne s'ouvre pas. 2 à 6 : la table
respire. 10 : la carte et le groupement par commune deviennent indispensables.
**Place du Projet.** Un bandeau ; les conditions sont des outils (lentilles) plutôt qu'un texte.
**Mobile.** Difficile : les zones deviennent des onglets, le rapprochement une feuille modale. Le
geste spatial se perd.
**Risques.** Le plus fort des trois : **la position spatiale se lit comme un rang**, la fiche
devient une carte de dashboard, la lentille invite à « compter ». Il faut interdire tout axe
signifiant et toute couleur de fond par fiche.
**Ce qui la rend mémorable.** La lentille « et si je lâchais cette condition ». C'est l'arbitrage
rendu tangible, sans que futur•e arbitre.

### Direction C : la trajectoire de décision

**Idée.** La recherche comme une ligne de temps (la Règle du temps du Relevé, appliquée aux
semaines de la recherche). Chaque révision du Projet ouvre une époque ; chaque possibilité a sa
ligne de vie (ajout, examen, visite, écart, reprise) ; les observations s'y posent.

**Hiérarchie.** Le présent en haut (« où vous en êtes »), puis la trajectoire, puis les possibilités
à l'instant choisi.

**Interactions distinctives.**
- **Revenir à une date** : la page se recompose avec le Projet et les analyses de ce jour-là.
  « Le 3 novembre, vous cherchiez… et vous avez écarté… pour… »
- **Comparer deux époques** : ce qui a changé dans le jugement, entre deux révisions du Projet.
- **Le fil d'une possibilité** : tout ce qui lui est arrivé, et pourquoi.

**1, 2, 5, 10.** 1 et 2 : presque vide les premiers jours (risque de démarrage à froid). 5 et 10 :
la trajectoire devient précieuse, mais dense.
**Place du Projet.** Comme une suite de révisions, ce qui est juste et fragile : le Projet du jour
doit rester lisible sans parcourir l'historique.
**Mobile.** Une ligne de temps verticale se lit bien ; la comparaison d'époques, non.
**Risques.** Dépend entièrement d'un historique riche (révisions, journal, observations) : la
direction n'a de valeur qu'après plusieurs semaines d'usage. Risque de journal narcissique qui
raconte l'usage au lieu d'aider à décider.
**Ce qui la rend mémorable.** « Voici ce que vous saviez quand vous avez écarté ce bien. » C'est le
moat 4 (continuité) rendu visible.

### Comparaison des trois directions sur la valeur décisionnelle

| Question du lecteur | A, dossier vivant | B, atelier | C, trajectoire |
|---|---|---|---|
| Qu'est-ce que je cherche ? | **Fort** (phrase en tête) | Moyen (bandeau) | Moyen (révisions) |
| Quels lieux sont en course ? | Fort (registre) | **Fort** (zones) | Moyen |
| Qu'est-ce qui les départage ? | **Fort** (énoncés + preuve) | Fort (rapprocher, lentille) | Faible |
| Qu'est-ce qui pourrait changer mon avis ? | **Fort** (bloc dédié) | Moyen (lentille inverse) | Moyen |
| Qu'ai-je appris depuis la dernière fois ? | Moyen (bloc 1) | Faible | **Fort** |
| Pourquoi ai-je écarté ce bien ? | Moyen | Moyen | **Fort** |
| Utile avec une seule possibilité | **Oui** (dossier) | Non | Non |
| Mobile | **Bon** | Faible | Moyen |
| Risque de lecture « classement » | Faible | **Élevé** | Faible |
| Coût de données préalables | Moyen | Moyen | **Élevé** (historique) |
| Accord avec le Relevé | **Natif** (énoncé + marge) | À inventer | Partiel (Règle du temps) |

---

## D. Proposition d'architecture

### D.1 Les objets métier et leurs sources canoniques

| Objet | Source canonique (cible) | Existe ? | Remarque |
|---|---|---|---|
| Projet (identité) | `projects` : `id`, `user_id`, `status` (actif, clos), `created_at` | Non | Un seul actif par compte en V1 (contrainte d'unicité partielle). |
| Révision du Projet | `project_revisions` : `id`, `project_id`, `content` (forme `UserProject` v3), `signature` (`signatureDecisionnelle`), `created_at`, `cause` | Non | Append-only. `user_profiles.user_project` devient la tête, écrite par **le même et seul écrivain**, puis lecture migrée. |
| Lieu | valeur : `{commune: insee}` ou `{adresse: ban_id, label, insee}` | Oui (dispersé) | Pas de table en V1 : un lieu n'a pas d'état propre. |
| Possibilité (candidat) | `candidates` : `id`, `project_id`, `kind` (commune, bien), `insee`, `ban_id` nul possible, `label`, `listing_url` nul possible, `address_dossier_id` nul possible, `created_at`, `position` | Non | Lien vers le dossier payé, **jamais copie** de l'analyse ni du droit. |
| Niveau d'examen | **calculé** : aucune lecture, lecture gratuite, commune examinée, adresse examinée | Calculable | Dérivé des artefacts et des droits ; jamais stocké. |
| Analyse | `decision_artifact`, `logement_report_versions` | **Oui** | Inchangé, sauf deux champs ajoutés (D.5). |
| Journal | `candidate_events` : `candidate_id`, `kind`, `payload` (motif, critères visés), `project_revision_id`, `artifact_ref` (id, version), `created_at` | Non | Append-only. L'état courant se calcule depuis le dernier événement d'état. |
| Vérification | **dérivée** de l'artefact (`priorityControl`, `openConditions`, contrôles) + `verification_states` : `candidate_id`, `verification_key` (ancre stable), `status`, `observation_id` | Partiel | La liste vient du moteur ; seul l'état est stocké. |
| Observation | `observations` : `candidate_id`, `subject` (critère ou ancre de contrôle), `origin` (lecteur, document, vendeur ou agent, mesure, professionnel), `content`, `observed_at`, `context` | Non | Ne modifie aucun fait. `terrain_observations` reste en place, non migrée en V1. |
| Point de référence | une possibilité de `kind` bien avec `place_relation = lives_here`, marquée référence | Partiel | Permet « par rapport à aujourd'hui ». |
| Droit | `report_grants`, `address_dossiers` (et plus tard un droit de Pass) | **Oui** | Lu par un résolveur ; jamais dupliqué sur la possibilité. |
| Comparaison | **calculée** | Partiel (2 candidats) | Jamais stockée en V1. |

### D.2 L'arbitrage central : Projet unique ou Projet avec identité

**Option 1. Garder le JSON unique, rattacher les candidats au compte.**
Les candidats portent `user_id` ; chaque événement fige une copie du Projet.
- Pour : zéro migration du Projet, rien à réconcilier.
- Contre : une seconde recherche (deux ans plus tard, ou un investissement locatif en parallèle)
  hérite des candidats de la première ; « ce qui a changé dans mon Projet » n'a pas d'historique
  hors des copies ; un Pass ne peut se borner qu'au compte ; chaque copie dans un événement est une
  vérité de plus à garder cohérente.
- Coût de sortie : le jour où il faut une identité, il faut **rétro-attribuer** tous les candidats,
  événements et droits à un Projet, sans savoir à quelle recherche ils appartenaient.

**Option 2. Identité et révisions, un seul Projet actif.** *(recommandée)*
`projects` + `project_revisions`. Le lecteur voit toujours **son** Projet, un seul. Sous le capot,
le Projet a un identifiant stable et un historique.
- Pour : les candidats, le journal et les droits futurs ont une ancre qui n'est ni le compte (trop
  large) ni le contenu (qui change). Un abandon référence une révision au lieu d'en copier une. Le
  « Projet au moment de la décision » devient une jointure, plus un JSON recopié.
  « Ce qui a changé » se calcule entre deux révisions. Une seconde recherche, si elle vient un
  jour, est un second identifiant, sans migration.
- Contre : une table et une écriture de plus à chaque modification du Projet ; une période de
  transition où `user_profiles.user_project` et la tête des révisions doivent rester identiques.
  Mitigation : un seul écrivain (`PATCH user_project`), transaction unique, test de parité.
- Garde-fou FUT-41 respecté : « le Projet reste unique ; comparer ne crée pas de versions
  implicites ». Les révisions sont **explicites** : une révision naît d'un geste du lecteur, jamais
  d'une comparaison ni d'une recherche.

**Option 3. Plusieurs Projets actifs dès maintenant.**
Rejetée : aucune demande observée, et l'interface devrait choisir un Projet avant tout, ce qui
recrée le sas que FUT-41 interdit.

**Pourquoi décider maintenant, et pas plus tard.** La clé étrangère d'une possibilité se choisit le
jour où la table `candidates` est créée. L'ajouter à ce moment ne coûte qu'une colonne ; la changer
après coûte une reprise de toutes les lignes. **C'est la seule décision d'architecture du centre
qui se paie cher si on la diffère.** Le reste (observations, relevés figés, Pass) s'ajoute.

**Tension avec le vault à signaler.** `docs/vault/vision/objet-central-dossier-de-decision.md` pose
« Projet : plusieurs par personne » ; FUT-41 pose « le Projet reste unique ». L'option 2 les
réconcilie (identité sans multiplicité) ; l'arbitrage doit être gravé dans un ADR.

### D.3 Le niveau d'examen, calculé

| Niveau | Condition | Ce que le centre peut dire |
|---|---|---|
| `piste` | possibilité sans aucune lecture (annonce sans commune résolue) | son nom, son lien, rien d'autre |
| `lecture_libre` | commune non débloquée | le triptyque gratuit, dit comme partiel ; **aucun départage** |
| `commune_examinee` | artefact `commune` prêt et droit valide | registre complet au grain commune |
| `adresse_examinee` | artefact `logement:<id>` prêt et droit valide | registre complet, grain adresse et bâtiment inclus |

Un dossier révoqué (`access_revoked_at`) ramène la possibilité à `lecture_libre`, et le journal le
dit.

### D.4 La lecture « ce qui départage », à N possibilités

Une fonction pure, `ceQuiDepartage(possibilites, projetCourant)`, construite **au-dessus** de
`face()` et `relation()` du moteur existant, sans les modifier.

Pour chaque critère déclaré du Projet, dans l'ordre du Projet (conditions confirmées d'abord, puis
poids 3, 2, 1, puis ordre du texte) :

1. Partitionner les possibilités par **issue établie** (`favorable`, `reserve`, `mismatch`,
   `incompatible`) et **non établie** (`to_confirm`, `indeterminate`, `unexamined`, absent du
   registre, ou non examiné à ce niveau).
2. Classer la ligne :

| Classe | Condition | Énoncé type |
|---|---|---|
| `departage` | au moins deux issues établies différentes, même cadre | « Vannes et Auray tiennent votre condition ; Lorient non. » |
| `departage_possible` | issues établies identiques, au moins une possibilité non établie | « Pourrait départager : reste à vérifier pour Séné. » |
| `sans_reponse` | aucune issue établie | « Aucune de vos possibilités ne permet encore de le dire. » |
| `effet_de_profondeur` | l'écart n'existe qu'entre niveaux d'examen différents | « Tient à la profondeur de l'analyse : Auray n'est examinée qu'à la commune. » |
| `hors_cadre` | écart entre analyses de cadres différents | « Écart non interprétable : analyses produites sous deux Projets. » + geste |
| `accord` | même issue établie partout | replié : « ne départage pas » |

3. **Grain commun le plus fin.** Pour une paire commune contre adresse, la ligne se calcule sur
   l'artefact `commune` des deux ; la lecture d'adresse s'affiche à part, comme profondeur.
   Exige d'exposer le grain d'établissement par critère (aujourd'hui dans les évaluations, pas dans
   le registre).

**Ce que la fonction ne rend jamais** : un total, une moyenne, un tri des possibilités, un
« nombre de points favorables » utilisable comme rang. Les seuls comptes affichés sont des
longueurs de liste recomptables à l'écran (invariant 8 du vault).

**Ce que la maquette a déjà appris.** La première version de la règle, exécutée sur les données de
démonstration, rangeait chaque ligne dans la bonne classe, et trois énoncés racontaient pourtant
faux : une commune non débloquée transformait deux accords en « pourrait départager » ; une annonce
sans adresse était dite « à vérifier » alors qu'elle n'est simplement pas examinée à ce niveau ; et
la grammaire cassait (« correspond à le calme »). Classe juste, phrase fausse : c'est le défaut du
25/07 consigné dans `AGENTS.md`, reproduit en une heure sur une maquette.

**Tests à écrire avant l'interface** (leçon du 25/07) : pour chaque classe, une assertion sur
**l'énoncé rendu** et pas seulement sur la classe ; un test qu'un candidat moins documenté ne
passe jamais en `departage` favorable ; un test que deux biens d'une même commune ne produisent
aucune ligne territoriale `departage`.

### D.5 La comparabilité, et le geste « mettre au même cadre »

Le moteur compare déjà moteur, conventions, Projet et échelle. Deux compléments, minimes, rendent
la comparaison défendable.

**1. L'empreinte des données lues dans l'artefact.** Ajouter à l'artefact, à la génération :
- `dataBuild` : l'empreinte de l'index de communes chargé (hash du fichier compressé déjà servi) ;
- à terme (FUT-12), un manifeste `jeu de données → millésime` pour les sources lues.
Deux analyses de même `dataBuild` ont lu les mêmes millésimes pour toutes les données issues de
l'index. Les sources vivantes (VigiEau, GASPAR) et les pièces gelées par candidat (voisinage,
diagnostic) restent à part et se disent par leur date.

**2. « Mettre au même cadre ».** Un geste explicite du lecteur : « Actualiser ces 3 analyses pour
les comparer sous votre Projet actuel ». Il appelle la route existante (`/api/dossier/actualiser`)
pour chaque possibilité, **au même moment** : même moteur, mêmes conventions, même Projet, même
`dataBuild` par construction. Les versions antérieures restent lisibles ; l'écran dit lesquelles
ont changé et en quoi (diff d'issues par critère, calculé).

Règles :
- jamais déclenché par l'affichage, toujours demandé ;
- la liste des analyses qui changeront est montrée avant ;
- une analyse dont le dossier est révoqué n'est pas actualisée ;
- si l'une échoue, la comparaison garde la réserve pour celle-ci.

**Question ouverte** (F.6, arbitrage 2) : l'actualisation est gratuite aujourd'hui. Le rester dans
une recherche à dix dossiers a un coût (génération, synthèses) que FUT-49 doit chiffrer.

### D.6 Les droits, sans en créer

Le centre ne pose aucun droit. Il lit un résolveur unique, à écrire au-dessus de l'existant :
`niveauDExamen(possibilite)` ← `canAccessTerritory`, `address_dossiers` non révoqués, artefacts prêts.

| Situation | Ce que le centre fait |
|---|---|
| Achats unitaires existants | Chaque dossier possédé peut devenir une possibilité (proposé, jamais automatique). |
| Commune non débloquée | Possibilité en `lecture_libre`, triptyque gratuit, aucun départage ; « examiner cette commune ». |
| Adresse examinée | Lecture complète. |
| Futur Pass | Une source de droit de plus dans le résolveur, rattachée au **Projet** (identifiant de D.2). Rien d'autre ne change dans le centre. |
| Dossiers déjà achetés | Restent possédés et lisibles, avec ou sans centre. |
| Recherche terminée | Le Projet passe `clos` ; ses possibilités et son journal restent consultables en lecture. Les dossiers restent ceux du compte. |

### D.7 Ce qui ne doit pas être construit

- Une seconde copie des faits ou des issues dans `candidates` : le centre lit les artefacts.
- Un statut « obsolète » stocké : il se calcule (vault).
- Une comparaison stockée : elle se calcule, sauf relevé figé explicitement demandé (horizon 3).
- Un modèle de langage qui choisit ce qui départage, rédige un énoncé de départage ou lit une
  observation pour changer une issue.
- Un objet « recherche » persistant qui doublerait le Projet : la recherche reste jetable (FUT-27).

---

## E. Plan de développement

Ordres de grandeur pour un porteur seul avec Claude, en semaines de travail effectif. Ils
supposent les dépendances levées et sont des estimations, pas des engagements.

### Horizon 1 : prototype immédiat

**Inclus.**
- La maquette `prototype.html` (livrée avec ce cadrage) : trois directions, données fictives.
- Une route de développement `/dev/fut41` qui lit **les vrais artefacts** d'un compte (le vôtre, puis
  des comptes de test volontaires), et calcule `ceQuiDepartage` en lib pure, sur la base de
  `comparaison-candidats.ts`. Rendu direction A, avec « rapprocher ». Possibilités choisies à la
  main dans l'URL ; journal et motifs simulés dans l'état local.
- Un protocole de test : 5 à 10 personnes en recherche active (FUT-21 en partage le panel).

**Exclu.** Toute table, toute écriture, tout droit, tout prix, toute activation publique.
**Dépendances.** Aucune bloquante ; idéalement FUT-118 phase A pour les primitives.
**Risques.** Tester sur des données trop propres ; confondre « joli » et « utile ».
**Critères de réussite.**
- Sur au moins 3 personnes, une phrase « ce qui départage » est reconnue comme juste et nouvelle.
- Au moins 2 personnes disent ce qu'elles vérifieraient ensuite, sans aide.
- Aucune ne lit un classement là où il n'y en a pas.
**Effort.** Maquette : faite. Route de développement sur vrais artefacts : 1 à 1,5 semaine (la lib
N-aire et ses tests en sont la moitié).

### Horizon 2 : première version fiable

**Inclus.**
- ADR Projet (identité + révisions), puis `projects`, `project_revisions`, un seul écrivain.
- `candidates`, `candidate_events` (ajouté, en course, écarté avec motif, repris, retenu ; visite
  prévue, visité), `verification_states`.
- `ceQuiDepartage` en production, avec le grain par critère et la règle de grain commun.
- `dataBuild` dans l'artefact ; « mettre au même cadre » sur la route existante (après FUT-66).
- Écran « Ma décision » en direction A, dans le Relevé, desktop et mobile ; navigation FUT-86.
- Ajout d'une possibilité : depuis un dossier possédé, depuis une commune, depuis une annonce saisie
  (libellé, lien, commune).
- Abandon avec motif et rappel « votre Projet a changé depuis sur ce point ».

**Exclu.** Observations qui modifient une issue, trajectoire datée, lentille « et si », Pass,
assistance conversationnelle, plusieurs Projets actifs, partage avec un proche.
**Dépendances.** FUT-29 (doubles vérités), FUT-66 (cycle de mise à jour fiable), FUT-55
(importance des demandes non mesurées), FUT-27 pour l'ajout depuis « Où vivre », FUT-118 phase A.
**Risques.** La transition `user_project` vers révisions (double écriture) ; le coût des
actualisations groupées ; des énoncés qui racontent faux (tests sur le rendu).
**Critères de réussite.**
- Un lecteur avec 3 possibilités ou plus retrouve en moins de 30 secondes ce qui les départage et ce
  qu'il lui reste à vérifier.
- Un abandon relu un mois plus tard dit pourquoi, et sous quel Projet.
- Aucune comparaison affichée sans réserve hors cadre commun ; zéro départage fondé sur une absence
  (test de propriété).
**Effort.** 5 à 8 semaines : ADR et Projet 1 à 1,5 ; possibilités et journal 1,5 à 2 ; lib et
comparabilité 1 à 1,5 ; écran et mobile 1,5 à 2 ; recette et parité 0,5 à 1.

### Horizon 3 : vision ambitieuse

**Inclus, par ordre de valeur probable.**
1. Observations et réévaluation déterministe, critère par critère (FUT-21) : la réponse de visite
   change une issue `to_confirm` en « confirmé par vous, le 12 novembre », avec la règle écrite.
2. La lentille « et si je lâchais cette condition » (B), sur recherche jetable dérivée (FUT-27).
3. Les pistes territoriales depuis un point de friction de grain commune (FUT-42).
4. La trajectoire (C) : revenir à une date, comparer deux révisions du Projet.
5. Le relevé d'arbitrage figé : la comparaison d'un jour, datée, exportable pour la visite ou le
   notaire (la place naturelle d'une offre de comparaison, si FUT-49 en garde une).
6. Le Pass (FUT-49) branché sur le résolveur.
7. AskFuture qui **interroge** le registre (FUT-51), jamais qui rédige un départage.
8. Une recherche partagée à deux.

**Exclu.** Score, classement, recommandation de « meilleur lieu », abonnement par défaut.
**Dépendances.** FUT-12 complet (manifeste de millésimes), FUT-21 pilote concluant, FUT-49 décidé.
**Risques.** L'inflation fonctionnelle ; un historique qui devient un journal d'usage ; des
observations qui glissent en faits.
**Critères de réussite.** Des retours répétés pendant une recherche de plusieurs semaines ; des
vérifications faites et réinjectées ; une décision dont le lecteur dit qu'elle est « la sienne ».
**Effort.** Plusieurs mois, item par item, chacun décidé sur l'usage mesuré à l'horizon 2.

---

## F. Recommandation

### F.1 Direction UX privilégiée

**A, le dossier de décision vivant**, avec deux emprunts : **rapprocher** (B) comme seule
interaction comparative, et **depuis votre dernière visite** (C) comme premier bloc.

Pourquoi : elle répond le plus fort aux deux questions qui font la valeur (« qu'est-ce qui les
départage ? », « qu'est-ce qui pourrait changer mon avis ? ») ; elle est utile dès une possibilité ;
elle est native dans le Relevé (énoncé + marge de preuve) ; elle tient sur mobile ; elle a le plus
faible risque de lecture « classement ». B et C restent des réserves d'idées pour l'horizon 3, en
particulier la lentille.

### F.2 Modèle métier conseillé

Projet avec identité et révisions, un seul actif (D.2, option 2). Possibilités qui **référencent**
les analyses et les droits sans les copier. Niveau d'examen et comparaison **calculés**. Journal
append-only épinglé aux révisions et aux versions. Observations séparées des faits.

### F.3 Première tranche à développer

La route de développement `/dev/fut41` sur vrais artefacts, avec la lib pure `ceQuiDepartage` et
ses tests sur le rendu, **avant toute table**. Elle valide en une à deux semaines ce que les tables
coûteraient à défaire.

### F.4 Tickets à traiter avant l'horizon 2

| Ticket | Pourquoi avant |
|---|---|
| FUT-29 | Ajouter des possibilités qui référencent le Projet sur des doubles vérités les propagerait. |
| FUT-66 | « Mettre au même cadre » repose sur un cycle de mise à jour fiable et visible. |
| FUT-55 | Un comparatif ferait disparaître la demande principale non mesurée. |
| FUT-118 phase A | Le centre doit naître dans le Relevé, avec des primitives stabilisées. |
| FUT-12 (partie `dataBuild`) | Sans empreinte des données, aucune différence ne s'attribue au lieu. |

### F.5 Tickets qui avancent en parallèle

- **FUT-21** (pilote « dormir fenêtres ouvertes », un bien) : il éprouve le modèle d'observation et
  de vérification que l'horizon 2 stocke.
- **FUT-49** : chiffrer le coût d'une actualisation groupée, tester le Pass.
- **FUT-86** V1 : « Ma décision » remplace « Mon rapport », « Mes biens » quitte le header.
- **FUT-27** : la recherche jetable, prérequis de la lentille et des pistes.
- **FUT-116 / FUT-118** : indépendants, n'attendent pas ce chantier.

**Changements de périmètre que je vous propose, sans les appliquer** :
- FUT-22 : remplacer « passer de 2 à N » par « écrire `ceQuiDepartage` (lecture par critère, à N) et
  la règle de grain commun », avec la table de classes de D.4 comme critère de sortie.
- Créer, sous FUT-41 : « ADR Projet : identité et révisions » ; « Possibilités et journal » ;
  « Mettre au même cadre ».
- Créer, sous FUT-12 : « Empreinte de l'index lu (`dataBuild`) dans l'artefact ».

### F.6 Points soumis à votre arbitrage

1. **Projet** : identité et révisions avec un seul actif (recommandé), ou JSON unique conservé ?
   À graver dans un ADR qui réconcilie le vault et FUT-41.
2. **« Mettre au même cadre »** : gratuit et illimité sur les dossiers possédés, plafonné, ou
   rattaché au futur Pass ? (coût à chiffrer dans FUT-49)
3. **Commune non débloquée dans le centre** : triptyque gratuit seulement (recommandé), conditions
   sans compromis seulement, ou rien ?
4. **Annonce sans adresse** comme possibilité (libellé + lien saisis par le lecteur, aucune
   récupération automatique d'annonce) : oui ?
5. **Point de référence** (« par rapport à mon logement actuel ») : à l'horizon 2, ou plus tard ?
6. **Observations à l'horizon 2** : affichées sans effet sur les issues (recommandé), ou attendre
   la conclusion du pilote FUT-21 pour les introduire ?
7. **Vocabulaire des états** : *à considérer, en course, écarté, retenu* + événements *visite
   prévue, visité* (recommandé), ou la liste plus longue de FUT-41 ?
8. **Dossier comparatif à 39 €** : le centre n'en dépend pas. Faut-il le laisser en maintenance
   jusqu'à la décision FUT-49 (recommandé) ?
9. **Ordre** : lancer la route `/dev/fut41` avant la fin de FUT-118 phase A, sur les primitives
   actuelles, ou attendre ?

---

## Annexe : références

- Code : `src/lib/user-project.ts`, `src/lib/decision/projet-materiel.ts`,
  `src/lib/decision/comparaison-candidats.ts`, `src/lib/decision/decision-artifact.ts`,
  `src/lib/decision/criteria-registry.ts`, `src/lib/relation-au-lieu.ts`, `src/lib/dossier-actif.ts`,
  `src/lib/active-territory.ts`, `src/lib/server/generate-decision-artifact.ts`,
  `src/app/api/dossier/actualiser/route.ts`, `src/app/api/stripe/webhook/route.ts`,
  `src/app/(account)/rapport/page.tsx`, `src/app/(account)/rapport/dossiers/page.tsx`,
  `src/lib/facts/contract.ts`, `src/components/releve/`.
- Schéma : migrations 11, 12, 13, 15, 16, 17, 25, 28, 29, 31, 35, 36, 37.
- Specs : `2026-08-19-comparaison-deux-candidats-design.md`, `2026-09-25-schema-cible-projet-design.md`,
  `2026-10-11-relation-au-lieu-contrat-fut10.md`.
- Vault : `vision/objet-central-dossier-de-decision.md`, `adr/ADR-0001-pas-de-score-synthetique.md`,
  `adr/ADR-0007-pack-decision-bundle.md`.
- Linear : FUT-41, FUT-22, FUT-9, FUT-12, FUT-21, FUT-27, FUT-28, FUT-29, FUT-42, FUT-49, FUT-55,
  FUT-66, FUT-86, FUT-118.
