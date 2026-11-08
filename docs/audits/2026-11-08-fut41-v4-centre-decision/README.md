# FUT-41 · FUT-22 · Le centre de décision multi-logements de futur•e : audit de convergence et prototype V4

8 novembre 2026 · branche `explore/fut-41-v4-centre-decision` (depuis `main` b818ba5c, qui contient FUT-27 #131 et FUT-170 #132) · **exploration, sans production**.

Aucun moteur, paiement, droit, migration ou donnée de production n'a été modifié. Aucune génération payante ni aucun appel de modèle n'a eu lieu, et aucun compte réel n'a été utilisé. Rien n'est fusionné ni déployé, et aucun ticket Linear n'a été créé. La V3.3 historique (`explore/fut-41-centre-decision`) n'est pas touchée.

---

## 0. En bref

**Ce que contient cette passe.**

- **Un prototype interactif**, écrit en React avec les primitives de production du Relevé. Il tourne sur une route de développement, `/dev/centre-decision`, qui renvoie une erreur 404 en production.
- **Douze scénarios** de données fictives.
- **Une recette navigateur automatisée et rejouable** :
  - 84 captures (14 vues × 3 largeurs × 2 thèmes) ;
  - 24 gestes sur 24 ;
  - clavier et mouvement réduit conformes ;
  - aucun débordement et aucune erreur console.
- **23 tests du modèle**. Ils vérifient l'état produit, et aussi la phrase affichée.

**La thèse de la V4.** Le centre de décision est **un seul espace, Ma décision**. Il répond à trois questions successives :

1. **Où en est ma recherche ?** C'est Ma décision.
2. **Que vaut ce logement pour mon Projet ?** C'est la fiche.
3. **Qu'est-ce qui départage vraiment mes logements ?** C'est la comparaison.

Le Relevé reste la profondeur d'un logement analysé. La comparaison est le cœur : elle dit d'abord ce qui contredit une condition sans compromis, puis ce qui départage, puis ce qui pourrait départager après une vérification. Elle explique toujours pourquoi elle rapproche deux éléments, ou pourquoi elle refuse de le faire.

**Verdict de convergence : GO avec réserves.** L'expérience complète est conçue et jouable, et la construction peut commencer **par lots**. Trois réserves :

1. **La comparaison réelle est bloquée** par le contrat critère par critère (FUT-22). Il impose d'ajouter au schéma de l'artefact le grain, les sources et les millésimes de chaque critère, et une table des règles touchées par version. Il impose aussi l'immutabilité des conclusions figées (FUT-173).
2. **La valeur multi-logements n'est pas mesurée.** Il faut mener le protocole à trois personnes sur le prototype avant d'ouvrir la comparaison à tous.
3. **Le Pass Recherche reste une hypothèse** (FUT-49). Le prototype en montre l'expérience, sans prix ni quota décidés.

**Lancer le prototype en local**

```
cd .claude/worktrees/fut41-v4        # ou la branche explore/fut-41-v4-centre-decision
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:9 NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=cle-fictive \
  npx next dev --webpack -p 3041
# puis http://localhost:3041/dev/centre-decision  (scénarios : ?s=s1 … ?s=s8, ?s=vide, ?s=un)
```

Ces deux variables pointent vers une base fictive, injoignable : aucun accès réel n'est possible. Si `node_modules` est un lien symbolique, Turbopack refuse de démarrer, d'où l'option `--webpack`.

---

## 1. Mini-audit de convergence

### 1.1 Cartographie

| Capacité | État | Où | Remarque |
|---|---|---|---|
| « Vos lieux » : lieux payés, conclusion citée, date, Projet changé | **En production** (21/10, PR #75, FUT-124/130) | `src/lib/decision/vos-lieux.ts`, `vos-lieux-lecture.ts`, `server/vos-lieux.ts`, `components/vos-lieux/VosLieux.tsx`, `/rapport/dossiers` | Lieux **payés** seulement. Recette sur un compte réel non faite (FUT-41, 21/10). |
| Relevé dans Ma décision | **Développé sous drapeau** (`DECISION_RELEVE` éteint) | `components/releve/`, FUT-91 | Base visuelle canonique (FUT-118). Activation = décision X1 de la V3.2. |
| Primitives du Relevé (Ligne, Marge, Registre, Plaque, Emblème, Sélecteur) | **En production** (accueil, Ma décision sous drapeau) | `components/releve/primitives.tsx` | Réutilisées telles quelles par la V4. L'emblème n'est pas sûr à l'hydratation dans un composant client (§ 11.1). |
| Mise à jour d'un dossier avec le Projet actuel | **En production**, gratuite pour un dossier acquis | `/api/dossier/actualiser`, FUT-66/93 | Crée une version n+1, l'ancienne reste lisible. La mise à jour groupée relève de FUT-122 (Backlog). |
| Péremption du dossier quand le Projet change | **En production**, au niveau global | `projet-materiel.ts` (`signatureDecisionnelle`, `projetAChangeMateriellement`) | Un simple changement de poids déclare tout le dossier périmé (constat du 21/10). |
| Comparaison de deux candidats | **Moteur partiel**, non rendable | `comparaison-candidats.ts` | Cadre global (moteur, conventions, signature, échelle) ; ne vérifie pas les millésimes ; deux adresses d'une commune sont lues comme deux lectures ; « aucune surface ne doit le rendre ». |
| Contrat critère par critère, lecture partagée | **Conception décidée côté produit, non tranchée** (X8, Y4) | `note-fut22-comparabilite.md` (V3.2) | Le prototype V4 l'implémente **sur fixtures** (`modele.ts`). Rien dans le moteur. |
| Grain, sources, millésimes par critère dans l'artefact | **Absent** | `DecisionArtifactV1` | Le grain se retrouve par les `ruleIds`. Certaines issues n'ont aucun constat. FUT-12 structure la provenance (PR #130, en revue). |
| Immutabilité des conclusions figées | **Défaut connu** | RLS de `decision_artifact` (FUT-173, High) | Un compte peut réécrire ses artefacts `ready`. C'est un préalable à toute comparaison opposable. |
| Logement envisagé sans paiement | **Conception (lot 2), non codée** | `annexe-lot2-memoire-multi-biens.md` (`property_candidates` + journal) | D1 à D9 en attente. FUT-27 est désormais fusionné : la dépendance R3 est levée. |
| Statuts, raison d'abandon, contexte du Projet | **Conception (lot 2), prototype V4** | annexe § 3 ; `etat.ts` | La V4 garde un **contexte minimal**, comme demandé par la réserve Linear du 08/11 : la révision et la seule condition invoquée avec sa valeur. |
| Vérification, puis réponse, puis réévaluation | **Prototype V4 seulement** (FUT-21 Backlog) | `Fiche.tsx` | Effets écrits à la main dans les fixtures. En production, la liste et ses effets doivent venir du moteur. |
| « Faire le point » | **Prototype** (V3 à V4), contrat de validité écrit | `note-fut41-validite-point.md`, `modele.ts` | Recalculé à chaque ouverture, sans cache et sans IA (X9). |
| « Et si mon Projet changeait ? » | **Prototype V4 seulement** | `EtSi.tsx`, `simuler()` | Ne dit « pourrait changer » que si une mesure est figée dans l'analyse. Sinon : « seule une analyse mise à jour le dirait ». |
| Tri explicable | **Prototype V4 seulement** | `trier()`, `examinerMaintenant()` | Un tri par dimension, et des règles dans un ordre fixe. Aucun score. |
| Ajout assisté (texte collé) | **Prototype V4 seulement** | `extraireAnnonce()` | Lecture locale d'un texte fourni par la personne ; chaque valeur montre l'extrait qui la fonde. Aucune récupération distante. |
| Pass Recherche | **Hypothèse** (FUT-49) | aucun | 59 €/90 j (B2C) et 69 €/mission (B2B) **à tester** ; rien n'est décidé. |
| Partage avec un client (chasseur) | **Absent** | aucun | Préalable bloquant du pilote B2B (FUT-49, 05/11). |

### 1.2 Branches et documents relus

- `explore/fut-41-centre-decision` (8 commits, du 20 au 21/10) contient :
  - le cadrage : `README.md` ;
  - les prototypes V1, V2, V3, V3.1, V3.2 et V3.3, avec leurs README et leurs captures ;
  - la note de comparabilité FUT-22 et la note de validité du point ;
  - le protocole à trois personnes ;
  - le dossier `2026-10-21-fut41-fut86-articulation/`, qui contient l'audit de navigation, la confrontation au moteur réel en lecture seule, le parcours `tour33.cjs` et les mesures du premier écran.
- `feat/fut-41-vos-lieux`, fusionnée (#75).
- L'audit du lot 2 du 08/11 n'était suivi par git sur aucune branche. Il est joint ici en annexe (`annexe-lot2-memoire-multi-biens.md`), pour qu'il puisse être relu.

### 1.3 Tickets et doublons

- **FUT-41**, In Progress, porte le centre de décision. La réorientation du 08/11 en fait un espace de décision complet.
- **FUT-22**, Backlog, porte la comparaison. **FUT-131** (cadrage V3 à V3.3) et **FUT-130/124** (« Vos lieux ») sont des lots clos.
- **FUT-21** porte la boucle « vérifier, répondre, réévaluer ». **FUT-49** porte le Pass. **FUT-122** porte la mise à jour groupée.
- **FUT-86** porte la navigation par tâches. **FUT-118** porte la grammaire visuelle. **FUT-9** porte le Projet durable. **FUT-173** porte l'immutabilité des artefacts.

**Aucun doublon** n'est à créer : chaque lot du § 9 a déjà son ticket. Deux tickets pourraient manquer ; je les soumets au porteur sans les créer :

1. « Rendre l'emblème sûr à l'hydratation », qui peut entrer dans le premier lot (§ 11.1).
2. « Partage d'un dossier à un client final », que FUT-49 nomme comme préalable.

### 1.4 Décisions déjà prises, que la V4 respecte

- Ma décision est l'espace, et la recherche en est un état (Y2).
- Le lieu est porté par l'URL (Y3).
- Le face-à-face se fait sans ligne entre les marques (Y4).
- « Se compare / Ne se compare pas » (V3.3).
- Un accord obtenu sous deux cadres ne se dit pas « en commun » (règle 4 de la note FUT-22).
- Une condition sans compromis n'est jamais compensée.
- La conclusion d'un dossier est citée mot pour mot, avec sa date (X7, E).
- Le point est recalculé à chaque ouverture (X9).
- Le Relevé est le langage visuel canonique (FUT-118).
- `offer_kind` n'est jamais déduit de l'intention (D9).

---

## 2. Vision fonctionnelle complète

### 2.1 A · Ma décision, l'espace de la recherche

Elle s'adapte à la maturité de la recherche, sans changer de page.

| Moment | Ce que montre Ma décision |
|---|---|
| **Aucun logement** | Le Projet, et l'invitation à garder un logement (« une annonce, un lien ou quelques mots suffisent »). |
| **Un logement** | Le titre est « {logement}, le logement que vous étudiez ». On voit sa conclusion citée, ou ce que déclare son annonce, et son prochain pas. Aucun vocabulaire de comparaison. |
| **Deux logements ou plus** | Le titre est « Votre recherche », avec une phrase de situation. On voit les hésitations (Faire le point en raccourci), les logements rangés selon une dimension choisie, la sélection pour comparer, les écartés avec leur raison, et l'accès. |

Sur chaque ligne :

- l'emblème des trois échelles (cercle, carré, losange), dont le trait dit ce qui a été lu ;
- le nom, la commune, le statut et l'état de connaissance (enregistré, commune analysée, analysé) ;
- la conclusion du dossier entre guillemets, ou ce que déclare l'annonce, marqué comme tel ;
- l'alerte d'une condition sans compromis non tenue ;
- le prochain pas ;
- en marge, la date du dossier et le Projet auquel il répond.

### 2.2 B · Comparer mes logements, le cœur du produit

Deux lectures d'un même contrat :

- **Vue d'ensemble, de 2 à N logements.**
  1. Ce qui contredit vos conditions sans compromis : toujours en tête, jamais compensé.
  2. Ce qui les départage : une phrase par condition, dans l'ordre du Projet, qui nomme les logements et l'échelle (« Le calme départage 12 rue des Sternes (compromis aux abords) et 5 allée des Goélands (correspond aux abords) »). Viennent ensuite « pourrait départager » et « ne se compare pas encore ».
  3. Condition par condition : une matrice condition × logement, avec la marque de l'issue (trait de registre et glyphe du grain), « = » pour une lecture communale partagée et « ancien » pour une valeur de condition dépassée. **Choisir une condition** déplie les paires, leur état et leur raison.
  4. Pour les départager : les vérifications ouvertes qui portent sur une condition qui « pourrait départager ».
  5. L'ordre des colonnes suit une dimension choisie (ordre d'ajout, montant déclaré, surface, trajet mesuré), avec ses groupes et ses notes.
- **Face-à-face, deux logements** (V3.3).
  - Les en-têtes et les emblèmes.
  - « Se compare / Ne se compare pas » par échelle.
  - Une phrase d'entrée qui cite exactement les conditions des lignes.
  - Puis cinq sections : ce qui les distingue, vos conditions sans compromis, pas encore établi (avec « Quoi vérifier »), ne se compare pas (avec chaque motif), en commun (replié).
  - Chaque piste a un « Pourquoi ? ».

### 2.3 C · Comprendre un logement, sa fiche de décision

Quatre provenances, jamais mêlées : la conclusion du dossier, le fait public et sa preuve, la déclaration (annonce, vendeur, agence) et l'observation personnelle.

1. **Statut** (À étudier, À visiter, Visité) et **Écarter**.
   - La raison est obligatoire.
   - La condition qui en est la cause est facultative.
   - Le contexte gardé est affiché avant validation.
   - Un logement écarté se remet en course.
2. **Ce que conclut son dossier.** La conclusion est citée et datée, avec la version et le Projet auquel elle répond, et « répond à votre Projet du 12 sept. : une gare à moins de 30 min (aujourd'hui : une gare à moins de 20 min) » quand c'est le cas. Gestes : ouvrir le Relevé, mettre à jour avec le Projet actuel. Si seule la commune est analysée, la fiche le dit et propose d'analyser l'adresse.
3. **Face à votre Projet.**
   - Les conditions sont groupées : contredit une condition sans compromis, correspond, compromis, reste à établir.
   - Chacune porte son constat, sa marge de preuve (grain, mesure, source, millésime, date de l'analyse), la mention « établi sous… » si la valeur a changé, et les observations liées.
4. **À vérifier avant de décider**, par moment : avant la visite, sur place, avant de vous engager. Une réponse affiche trois colonnes, « avant votre réponse », « ce que votre réponse change » et « ce qui reste inconnu », puis rappelle que la preuve publique ne change pas.
5. **L'annonce, telle qu'elle est déclarée.**
   - Nature, montant, surface et pièces s'affichent avec la mention « déclaré ».
   - Si la nature diffère de l'intention du Projet, la fiche le signale sans en tirer de conclusion.
   - Le lien est gardé (`noopener noreferrer nofollow`), et futur•e n'en lit rien.
6. **Vos notes et observations** : « ce que j'ai observé », « ce qu'on m'a dit », « un document », éventuellement rattachées à une condition.
7. **Historique de cette décision** : ajout, analyses et versions, statuts, réponses, écarts avec la révision et la condition d'alors. Si le Projet a changé depuis, l'historique le dit (« votre Projet a changé depuis »).
8. **Comparer avec un autre logement** : ce qui se compare est dit pour chacun, et le geste n'est proposé que si quelque chose se compare.

### 2.4 Le Pass Recherche dans l'expérience

C'est un droit temporaire, rattaché à **un Projet**. Il permet d'analyser plusieurs adresses pendant une recherche. Hypothèse de référence : 90 jours, sans quota décidé.

| Geste | Sans Pass (à l'unité) | Avec Pass (hypothèse) | Coût variable |
|---|---|---|---|
| Garder un logement, noter, statut, écarter | gratuit | inclus | stockage seul |
| Lectures gratuites (aperçu commune, rang national) | gratuites | incluses | faible (index) |
| Analyse complète d'une adresse | 39 € | décompte (ex. 10 adresses) | moteur et sources ; IA si la lecture rédigée est activée |
| Rapport d'une commune | 14 € | décompte (ex. 20 communes) | faible |
| Comparer, Faire le point, Et si | **gratuit sur les dossiers déjà acquis** (proposé) | inclus | nul (déterministe) |
| Mise à jour avec le Projet actuel | gratuite pour un dossier acquis (en production) | incluse | moteur, IA éventuelle |
| Mise à jour groupée (FUT-122) | à décider | incluse | à mesurer |
| Lecture après expiration | conservée | conservée | stockage |

**Principe proposé.** La comparaison vaut sur ce que l'on possède déjà, et gagne en valeur à mesure que l'on possède des analyses comparables. Cela répond au doute du 06/10 sur le Comparatif à 39 € (FUT-49, § 3 bis), sans le trancher.

**Chasseurs immobiliers.** Le même produit sert, avec **un Projet par mission client**, des droits cloisonnés par Projet et un partage en lecture. Il n'y a ni second moteur ni seconde interface. Le prototype ne montre pas le mode mission (§ 12, Z9).

---

## 3. Architecture de navigation, parcours location et achat

```
Barre (cible FUT-86) : Où vivre · Explorer · Ma décision        [Analyser une adresse] · Compte

Ma décision  (#/decision)                 ← l'espace ; s'adapte à 0, 1, N logements
 ├─ Fiche d'un logement  (#/lieu/{id})    ← la décision sur un logement
 │    └─ Relevé  (#/releve/{id})          ← la profondeur d'un logement analysé (FUT-91)
 ├─ Comparer  (#/comparer/{ensemble|face}/{ids}[/{condition}])
 ├─ Faire le point  (#/point)
 └─ Et si… ?  (panneau, sans adresse : une simulation ne se partage pas)
```

- **Le lieu et la sélection sont dans l'URL.** Le bouton retour, un signet et un rafraîchissement rouvrent le même logement et la même comparaison : c'est vérifié par la recette, avec le bouton retour depuis le Relevé. En production, les routes deviendraient `/rapport?lieu=…`, `/rapport/comparer?…` (lot 2 de FUT-86).
- **Pas de seconde destination.** « Mes biens », « Comparateur » et « Ma recherche » ne sont pas des pages : ce sont des états de Ma décision.

**Location et achat.**

- L'intention est déclarée dans le Projet (`intention: "location" | "achat"`).
- La nature de chaque annonce (`à louer`, `à vendre`, `non précisé`) est indépendante de l'intention.
- Le tri par montant ne range jamais un loyer avec un prix de vente.
- Le texte système ne présume aucun achat. Un test le verrouille.
- Le moment d'engagement se dit « avant de vous engager », pour couvrir le bail et le compromis.
- Une recherche qui hésite entre louer et acheter garde ses deux natures d'annonce, signalées sans conclusion (scénario S1).

---

## 4. Le prototype V4

### 4.1 Ce qu'il est

C'est une **composition React** branchée sur les composants de production. Elle réutilise `EmblemeEchelles`, `GlypheGrain`, `Ligne`, `Marge`, `Registre`, `Plaque`, `Selecteur`, `CoupeEchelles`, `BandeauPrototype`, les classes de `releve.module.css` et les jetons `--r-*`, `--reg-*` et `--m-*`. Les gestes fonctionnent sur des données fictives, structurées selon les contrats réels (`CriterionOutcome`, `projectSnapshot`, `engineVersion`, `conventionsVersion`, `scope`), plus le `CadreDuCritere` proposé par la note FUT-22.

| Fichier | Rôle |
|---|---|
| `src/app/dev/centre-decision/page.tsx` | Route de développement, 404 en production, `noindex`. |
| `src/components/prototypes/fut41-v4/modele.ts` | **Le contrat proposé**, pur et testé : `comparerCritere`, `ceQuiDepartage`, `conditionsNonTenues`, `trier`, `examinerMaintenant`, `simuler`, `faireLePoint`, `extraireAnnonce`. |
| `…/modele.test.ts` | 23 tests, dont les phrases rendues. |
| `…/scenarios.ts` | Les données fictives (communes 99xxx inexistantes) et 12 scénarios. |
| `…/etat.ts` | Le réducteur des gestes et l'URL de la vue. |
| `…/CentreDecision.tsx` | Le cadre : bande de démonstration, barre, routage, thème, annonces accessibles. |
| `…/vues/MaDecision.tsx`, `Fiche.tsx`, `Comparer.tsx`, `FaireLePoint.tsx`, `Releve.tsx` | Les cinq vues. |
| `…/EtSi.tsx`, `AjoutLogement.tsx`, `communs.tsx`, `v4.module.css` | Le panneau, l'ajout, les formes partagées, les compositions. |

### 4.2 Scénarios (bande « Démonstration », ou `?s=`)

| | Scénario | Ce qu'il montre |
|---|---|---|
| ★ | Toute la recherche | 7 logements : 3 dossiers d'adresse, 1 rapport de territoire, 2 annonces sans adresse, 1 écarté. Projet révisé le 8 oct. (gare 30 → 20 min). |
| 0 | Avant tout logement | L'espace vide, l'ajout ouvert. |
| 1 | Un seul logement | Utile dès un logement, sans vocabulaire de comparaison. |
| S1 | Location, dont un logement à vendre | Un logement analysé, une commune analysée **à vendre**, une annonce. Aucune déduction. |
| S2 | Deux adresses d'une même commune | « Une seule lecture de Port-Anvel » : la mer et le médecin ne départagent pas ; les abords et le logement, si. |
| S3 | Trois communes différentes | Vue d'ensemble : départage, pourrait départager, ne se compare pas encore. |
| S4 | Un analysé, deux annonces | « Information indisponible » : l'annonce n'est jamais une conclusion. |
| S5 | Condition sans compromis non tenue | Le studio remis en course : sa gare ne tient pas, aucun point favorable ne le relève. |
| S6 | Projet modifié entre deux analyses | Seule la gare sort du cadre ; « mesuré à 26 min, au-delà de votre limite actuelle de 20 min ; la mettre à jour le confirmerait ». |
| S7 | Données non comparables | Moteur engine-5 contre engine-6 (règle touchée : les nuits), BPE 2024 contre 2025, commune contre abords : chaque motif est nommé. |
| S8 | Plusieurs inconnues de visite | 4 vérifications en 3 moments, et ce que chaque réponse change. |

### 4.3 Gestes jouables

- **Naviguer.** Ma décision, une fiche, la comparaison, Faire le point et le Relevé, avec le fil d'Ariane et le bouton retour.
- **Ajouter un logement.** Par lien, texte collé (« Essayer avec un exemple ») ou saisie, avec commune, adresse facultative et nature.
- **Passer d'un à plusieurs logements** : le titre et les sections changent.
- **Comparer.** Cocher deux logements ouvre le face-à-face ; en ajouter un troisième fait passer à la vue d'ensemble ; on peut aussi choisir une condition.
- **Voir les preuves.** La marge d'une fiche et le « Pourquoi ? » d'une piste.
- **Répondre à une vérification** et en voir la réévaluation ; recliquer retire la réponse.
- **Ajouter une note**, avec sa nature et sa condition.
- **Écarter, puis remettre en course**, avec la raison et le contexte gardés.
- **Simuler une modification du Projet** (gare, mer, calme, budget), puis l'adopter après confirmation : une révision de plus.
- **Analyser une adresse**, simulé sur 4 impasse du Lavoir, à l'unité ou sur le Pass.
- **Mettre à jour une analyse ancienne**, simulé sur Kervily : la gare tombe et la version 1 reste.
- **Basculer les droits** (à l'unité ou Pass) et le thème.

### 4.4 Recette (`outils/recette.cjs`, résultats dans `recette.json`)

**Environnement.** Chrome système piloté par Playwright. Le serveur de développement tourne avec une base factice injoignable. **Toute requête hors de localhost est bloquée**, car le layout racine charge la mesure d'audience de production (§ 11.2).

| Contrôle | Résultat |
|---|---|
| 14 vues × 1440, 390, 360 px × sombre et clair | **84 captures**, **aucun débordement horizontal**, **aucune erreur console** |
| Gestes de bout en bout | **24 sur 24** : ajout depuis un texte (l'extrait est cité), passage de 1 à 2 logements, face-à-face (URL et « Ne se compare pas »), passage à trois et condition choisie (paires et raisons), refus de la gare par le Projet, réponse et réévaluation (avant, change, reste, preuve publique inchangée), note avec sa nature, écart avec raison, remise en course avec historique conservé, « Et si » (simulation dite, Échap ferme et rend le focus, Projet intact, adoption en révision 4), Faire le point (provenance), Relevé (conclusion identique mot pour mot, retour à la même fiche, bouton retour du navigateur), analyse simulée (trois échelles), mise à jour simulée (la condition tombe, version 2) |
| Clavier | 24 arrêts de tabulation, **tous avec un contour visible** ; lien d'évitement ; focus posé sur le titre à chaque vue ; le panneau « Et si » rend le focus au déclencheur |
| Mouvement réduit | Animation d'entrée `none`, jetons `--m-*` à 0 ms |
| TypeScript, ESLint ciblé | Sans erreur |
| Tests du modèle | 23 sur 23 |

**Non vérifié** :

- Safari ou WebKit (seul Chrome a été piloté) ;
- un lecteur d'écran réel ;
- un téléphone physique ;
- le parcours sur un compte connecté (rien n'est branché à la base) ;
- **la compréhension par des personnes réelles** (protocole V3.3 prêt, non mené).

`npm test` complet donne 4 063 réussites et 71 échecs. Ces échecs viennent de l'environnement de cette copie : le `node_modules` lié n'a pas `clipper-lib` ni `react-test-renderer`. Aucun ne touche les fichiers du prototype.

**Défauts trouvés et corrigés pendant la passe.** Chacun est une leçon pour la production :

1. **« En commun » à tort.** La gare était classée « en commun » alors que Kervily avait été analysé sous 30 min. Une paire hors cadre à issue égale doit refuser l'accord (règle 4). Un test a été ajouté.
2. **« Et si » muet sur Kervily** quand la gare passait à 40 min : la simulation lisait l'issue de l'analyse ancienne au lieu de la limite actuelle. Un test a été ajouté.
3. **Parcours manquant.** La fiche d'un logement dont seule la commune est analysée ne proposait pas d'analyser l'adresse.
4. **Erreurs de langue.** « au lieu de une gare » ; une majuscule après deux-points ; un double point après « oct. ».
5. **Séparateur de milliers invisible** : l'espace fine insécable ne s'affiche pas avec la police servie. C'est désormais une espace insécable.
6. **Recette contaminée.** Une ancre seule ne recharge pas la page : chaque étape repart d'un état neuf.
7. **Erreurs console** dues aux captures écrites dans le dépôt pendant la recette. Le surveillant de fichiers poussait une mise à jour à chaud : les captures sont désormais écrites hors du dépôt, puis copiées.
8. **Antithèses retirées** du texte de l'interface (doctrine éditoriale).

### 4.5 Captures (`captures/`)

Nom : `{n°}-{vue}-{largeur}-{sombre|clair}.png`.

- `01` à `14` : la matrice des vues.
- `20` : l'ajout assisté.
- `21` : le face-à-face à deux.
- `22` : la vue d'ensemble à trois, avec la condition « Le calme » dépliée.
- `23` : la fiche, avec une réponse et une note.
- `24` : la fiche écartée.
- `25` : « Et si », gare à 40 min.
- `26` : la mise à jour de Kervily.

---

## 5. De la V3.3 à la V4

| | Élément | Pourquoi |
|---|---|---|
| **Conservé** | Ma décision comme espace unique ; le Relevé comme profondeur | Validé (Y1, Y2) ; continuité FUT-91 |
| | Face-à-face sans ligne, filet vertical, marques aux bords | Y4 ; une ligne suggérait une distance |
| | « Se compare / Ne se compare pas » | La V3.3 l'a validé ; c'est la phrase qui protège de l'asymétrie de connaissance |
| | Faire le point en plaque : rangée par ordre d'ajout, hésitations, pour avancer, ce que futur•e ne mesure pas, provenance | Composition signature de la V3.2 et de la V3.3 |
| | Emblème des trois échelles par lieu, en trois états de trait | Convention FUT-118 § 6.3 |
| | Conclusion citée mot pour mot et datée ; « répond à votre Projet du … » avec les valeurs d'alors | X7 et correction E de la V3.3 |
| | Explications repliées (« Que disent ces formes ? », « Pourquoi ? ») | Correction B de la V3.3 |
| **Modifié** | **La règle hors cadre** passe de globale (V3.3 : une révision différente rend tout hors cadre) à **critère par critère**, avec motifs nommés | La V3.3 ne l'implémentait pas, pour ne pas laisser croire qu'elle existait. La V4 la rend jouable **sur fixtures**, en le disant partout, pour qu'on l'arbitre (X8) |
| | **Lieu → logement.** On garde un logement (avec ou sans adresse, avec annonce) et plus seulement un lieu payé | Réorientation du 08/11 et lot 2 : un logement existe avant tout paiement |
| | « Comparer » proposé seulement si quelque chose se compare, désormais **à N** | La V3.3 comparait deux lieux ; la V4 lit 2 à N sans additionner les paires |
| | Le Projet en bande avec « Et si… ? » | La V3.3 montrait le Projet ; la V4 permet de le faire varier sans le modifier |
| | Rangée « Faire le point » en liste sous 560 px | Correction B (mobile) reprise et généralisée |
| **Abandonné** | Les pistes en ligne (variante V3.2) | Y4 tranché en faveur du face-à-face |
| | L'aperçu gratuit comme état de connaissance comparable | Il n'a pas d'artefact, donc pas de cadre : la V4 garde « enregistré / commune analysée / analysé » |
| | La version rédigée (IA) de Faire le point | W6 : hors interface tant que le contrat déterministe n'est pas en production |
| | Les sections « lentilles » de la V2 | La lentille devient « choisir une condition » dans la matrice : un seul geste, plus lisible |
| **Ajouté** | Vue d'ensemble condition × logement, avec dépliage des paires et de leurs raisons | Cœur demandé : 2 à N, et pourquoi |
| | Tri explicable (dimension choisie ; « à examiner maintenant » par règles) | Piste différenciante n° 2 |
| | Vérifications par moment, réponse avec provenance, trois colonnes avant, change, reste | FUT-21 dans la fiche |
| | Annonce déclarée, nature indépendante de l'intention, ajout assisté par texte collé | Location et achat ; ajout facile |
| | Écarter avec contexte minimal, remettre en course, historique | Mémoire de la décision (FUT-41, 30/09 et 11/10) |
| | Panneau « Et si… ? » à certitude graduée, adoption confirmée | Piste différenciante n° 3 |
| | Accès : à l'unité ou Pass (hypothèse) | Logique du Pass dans l'expérience |

---

## 6. Contrat de données et de comparabilité

### 6.1 Les états, et ce que chacun permet de dire

| État | Quand | Ce que l'interface dit | Ce qu'elle s'interdit |
|---|---|---|---|
| **Même lecture** | Établi des deux côtés, même cadre, même issue | « … des deux côtés, aux abords » (dans « En commun ») | De le compter comme un avantage |
| **Différence démontrée** | Établi des deux côtés, même cadre, issues différentes | « Le calme départage A (compromis aux abords) et B (correspond aux abords) » | D'en déduire un gagnant ou un total |
| **Différence possible** | Établi d'un seul côté | « Pourrait départager : reste à vérifier pour A » | De traiter le côté non établi comme favorable |
| **À vérifier des deux côtés** | Établi d'aucun côté | « Établi pour aucun de vos logements » | De les départager |
| **Ne se compare pas** | Cadre différent pour ce critère (Projet, moteur, millésime, grain), **même à issue égale** ; ou lecture communale partagée | Chaque motif, nommé (« Votre condition a changé : 20 min pour A, 30 min pour B ») ; « une seule lecture de Port-Anvel » | De dire « en commun » |
| **Information indisponible** | Pas d'analyse d'un côté (annonce), ou critère examiné d'un seul côté | « A n'est pas analysé : ce que dit son annonce n'est pas une conclusion de futur•e » ; « Un seul est examiné ici » | D'utiliser la déclaration comme une preuve |

### 6.2 La règle, dans l'ordre (`comparerCritere`)

1. Pas d'analyse d'un côté : **information indisponible**.
2. Critère examiné d'un seul côté : **information indisponible** (« un seul est examiné »).
3. Même commune, établi à la commune des deux côtés, mêmes millésimes : **lecture partagée** (ne se compare pas).
4. Non établi des deux côtés : **à vérifier**. Non établi d'un côté : **différence possible**.
5. Cadre du critère : même empreinte (nature et valeur, depuis `projectSnapshot`), règles non touchées entre les moteurs, mêmes millésimes des sources lues, même grain. Une seule différence suffit : **ne se compare pas**, avec un motif par différence.
6. Sinon : **même lecture** ou **différence démontrée**.

**À N** (`ceQuiDepartage`), la règle est construite sur les paires sans les additionner :

- une seule paire démontrée suffit à dire « départage » ;
- une seule paire hors cadre (hors lecture partagée) suffit à refuser « en commun » ;
- les écartés ne sont jamais lus.

**Conditions sans compromis** (`conditionsNonTenues`) :

- `incompatible` dans une analyse à jour s'affiche en tête, sans compensation ;
- dans une analyse ancienne, l'interface dit « ne tenait pas votre condition d'alors » ;
- une mesure figée qui dépasse la valeur actuelle est dite **possible**, jamais conclue (« la mettre à jour le confirmerait »).

### 6.3 Ce qui existe, et ce qu'il faut développer

| Composante | Existe | À développer | Lot |
|---|---|---|---|
| Empreinte d'un critère (valeur canonique) | `valeurDecisionnelle`, `canonique` (FUT-7) | L'exposer par critère dans l'artefact, **produite par le moteur** (paramètres réellement lus, règles croisées comprises) | C |
| Grain par critère | Le moteur le connaît (`criterionCapability`), les faits le portent | Le figer dans le registre (`CadreDuCritere.grain`) | C |
| Sources et millésimes par critère | Absent (seul `dataSnapshot.catnatInondation`) | `CadreDuCritere.sources[{id, millesime}]`, en s'appuyant sur la provenance FUT-12 | C (après FUT-12) |
| Règles touchées entre versions du moteur | Absent | Table `REGLES_TOUCHEES` versionnée avec le moteur ; sans elle, tout est hors cadre | C |
| Lecture communale partagée | Absent : deux artefacts identiques par hasard | Reconnaître la même lecture communale (même INSEE, même empreinte, mêmes millésimes) ; idéalement un artefact communal unique réutilisé (X4) | C |
| Immutabilité des artefacts servis | Défaut (FUT-173) | RLS en lecture seule pour l'utilisateur ; écriture par le service seul | **préalable** |
| Logement envisagé, statut, journal | Conception lot 2 | Tables `property_candidates` et `property_candidate_events` (annexe § 3), avec un **contexte minimal** au lieu d'une copie du Projet | A |
| Observations avec provenance | Absent (`terrain_observations` : une ligne par commune et module) | Table d'observations par logement et par critère, nature (observation, déclaration, document), date | B |
| Vérifications et effets | Contrôles du dossier (`ControlesDuDossier`, `priorityControl`) | Liste produite par le moteur ; effets **calculés** (FUT-21) ; réponse avec provenance, sans modifier le fait source | E |
| Rétrocompatibilité | aucun | Un artefact sans `CadreDuCritere` retombe sur le contrat global actuel, et l'écran le dit | C |

### 6.4 Risques

| Risque | Conséquence | Garde-fou |
|---|---|---|
| L'interface déduit l'empreinte d'un critère | Une règle croisée (transports × chaleur) rendrait comparable ce qui ne l'est pas | Empreinte produite par le moteur seul ; test « règle croisée » (note FUT-22, test 2) |
| Une différence de millésime présentée comme une différence de lieu | Conclusion fausse, présentée comme démontrée | Millésime par critère, ou hors cadre par défaut |
| La lecture partagée oubliée | Avantage communal compté deux fois pour deux voisins | Règle 3 et test S2 |
| Le texte dit plus que l'état | Le défaut du 25/07 | Tests de phrases, comme dans `modele.test.ts` |
| Un artefact modifié après coup | Comparaison et mémoire non opposables | FUT-173 avant le lot D |

---

## 7. Les fonctionnalités différenciantes

| Piste | Valeur distinctive | Preuves nécessaires | Limites | Coût | Complexité | Recommandation |
|---|---|---|---|---|---|---|
| **Comparaison intelligente** (ce qui départage d'abord) | Personne d'autre ne dit pourquoi deux lieux se comparent ou non ; c'est le moat « composition » | Contrat critère par critère, grain, millésimes | Beaucoup de « ne se compare pas encore » tant que les analyses ont des cadres différents | Nul à l'usage | Forte (moteur et schéma) | **Oui, cœur** ; lots C et D |
| **Tri explicable** | Ranger sans noter : le lecteur choisit la dimension | Mesures figées (trajet), déclarations marquées | Une dimension déclarée n'est jamais vérifiée | Nul | Faible | **Oui** ; tri par dimension dans le lot A, « à examiner maintenant » dans le lot F |
| **Et si… ?** | Voir l'effet d'un changement de Projet avant de le faire, sans réécrire le passé | Mesures figées par critère | Hors des conditions à seuil, seule une mise à jour le dit | Nul (simulation) ; moteur si on adopte puis met à jour | Moyenne | **Oui, après C** ; certitude graduée obligatoire |
| **Mémoire de la décision** | « Écarté quand votre limite était 20 min ; elle est aujourd'hui 40 » | Contexte minimal à l'écart | Ne pas copier tout le Projet (RGPD, minimisation) | Stockage | Faible | **Oui, lot A** |
| **Vérifications actionnables** | Transformer une inconnue en geste, puis montrer ce que la réponse change et ce qui reste inconnu | Liste et effets produits par le moteur (FUT-21) | Une observation ne prouve pas tout (une soirée calme ne fait pas des nuits calmes) | Faible | Moyenne à forte | **Oui, lot E** ; commencer par le pilote « dormir fenêtre ouverte » |
| **Ajout assisté** | Garder une annonce en dix secondes | Le texte que la personne colle | Lecture approximative : tout est proposé, rien n'est retenu sans confirmation | Nul en local | Faible | **Oui, texte collé** (lot A ou I). **Non** au scraping et à la récupération d'URL (voir ci-dessous) |
| **Capture d'écran d'annonce** | Ajout sur mobile | OCR, éventuellement par un modèle | Coût IA, erreurs de lecture, données personnelles visibles sur la capture | Variable | Moyenne | **Plus tard**, avec confirmation champ par champ ; ne pas stocker l'image |
| **Comparaison entre échelles** | Ne jamais compter deux fois un avantage communal ; dire « une adresse contredit sa commune » | Grain par critère, lecture partagée | Le moteur doit porter la notion | Nul | Moyenne | **Oui, dans C** |

**Ajout par lien ou par scraping : non, pour l'instant.**

- Les conditions d'utilisation des grands sites d'annonces **interdisent en général l'extraction automatisée**.
- En 2021, la cour d'appel de Paris a reconnu à Leboncoin la **protection de sa base d'annonces au titre du droit des producteurs de bases de données** (affaire Entreparticuliers). Référence exacte et portée à **vérifier par un juriste** avant toute décision.
- Techniquement, les pages sont protégées contre les robots et changent souvent.
- Le prototype garde donc le lien comme **repère personnel**, jamais ouvert par futur•e. Il propose le **texte collé par la personne**, lu localement, avec chaque valeur proposée et l'extrait qui la fonde.
- Un partenariat ou un flux autorisé (partage depuis l'application du site, interface publique d'un portail) serait la seule voie automatique défendable.

---

## 8. La logique du Pass Recherche

Voir le § 2.4 pour la grille des gestes. Points d'architecture :

1. **Le droit appartient au Projet.** Une mission de chasseur est un Projet. Le Pass porte `project_id`, `debut`, `fin` et des compteurs par type d'analyse. Les droits déjà acquis (`address_dossiers`, `report_grants`) restent intacts, et la montée en gamme les déduit pendant une courte période (FUT-49, § 5).
2. **On ne compte jamais ce qui a échoué.** Pas de décompte sur une erreur technique, une adresse introuvable ou une mise à jour d'un dossier déjà acquis.
3. **On ne promet pas l'illimité.** Les quotas sont visibles en phrase (« Vous pouvez encore analyser 7 adresses jusqu'au 18 janv. »). L'offre n'est jamais le sujet de la phrase (doctrine).
4. **Coûts variables à mesurer avant le prix** : génération de dossier (sources externes, moteur), lecture rédigée par IA si activée, stockage, mises à jour groupées (FUT-122), support.
5. **Comparer, Faire le point et Et si sont déterministes** : coût marginal nul. Ils peuvent être inclus partout sans risque économique.

---

## 9. Plan de réalisation par lots, sur les tickets existants

**Préalables.**

- **FUT-173** : immutabilité de `decision_artifact`.
- **Une base Supabase non productive** pour éprouver la RLS (réserve R1 du lot 2).
- Le protocole à trois personnes sur le prototype V4, mené **en parallèle** du lot A.

| Lot | Contenu | Ticket | Dépendances | Migration ? | Ce que la personne gagne |
|---|---|---|---|---|---|
| **A** ★ | **Vos logements** : garder un logement avec ou sans adresse (lien, nature, montant et surface déclarés), statut, écarter avec raison et contexte minimal, remettre en course, journal ; dans Ma décision sous les lieux payés ; ajout par texte collé ; tri par dimension ; activation par compte ; politique de confidentialité ; emblème sûr à l'hydratation | FUT-41 | FUT-173 conseillé ; base de test | **Oui** (n° 39, deux tables) | Sa recherche entière en un endroit, avant tout paiement |
| **B** | **Fiche logement** : route `/rapport/logements/[id]`, conclusion citée du dossier rattaché (sans doublon, rattachement explicite et vérifié), annonce déclarée, notes avec provenance, historique, ouverture du Relevé et retour | FUT-41 (et FUT-86 pour l'URL) | A | Oui (observations) | La décision sur un logement, et sa mémoire |
| **C** | **Contrat critère par critère** dans `src/lib/decision/` : `CadreDuCritere` dans l'artefact (schéma v2), table des règles touchées, lecture partagée, `comparerCritere` et `ceQuiDepartage` en production, phrases testées ; rétrocompatibilité | FUT-22 (millésimes avec FUT-12) | FUT-12 (provenance), FUT-173 | Non (schéma de l'artefact versionné) | La condition de vérité de D, sans écran propre |
| **D** | **Comparer** : face-à-face et vue d'ensemble sur les dossiers acquis, sous drapeau, puis pour tous | FUT-22 | C ; protocole à trois | Non | Le cœur : ce qui départage vraiment |
| **E** | **Vérifier, répondre, réévaluer** : vérifications produites par le moteur, réponses avec provenance, effet recalculé, ce qui reste inconnu | FUT-21 | B | Oui (réponses) | Une inconnue devient un geste et une lecture plus juste |
| **F** | **Faire le point, Et si, « à examiner maintenant »** (déterministes) | FUT-41 | C, D | Non | Savoir quoi faire ensuite, essayer un Projet |
| **G** | **Mise à jour groupée, « mettre au même cadre »** | FUT-122 | C | Non | Rendre comparables d'un geste des analyses anciennes |
| **H** | **Pass Recherche** : droits par Projet, compteurs, montée en gamme ; puis mode mission (B2B) et partage client | FUT-49 | Pilote et décision de prix ; partage sécurisé | Oui | Analyser plusieurs adresses sans repayer chaque hypothèse |
| **I** | **Navigation par tâches** : barre « Ma décision », lieu dans l'URL, fin des GET qui écrivent | FUT-86 | A conseillé | Non | Une seule maison pour chaque lieu |

Chaque lot fait progresser l'expérience complète. A et B donnent l'espace et la fiche, C et D le cœur, E, F et G la profondeur, et H et I l'économie et la navigation. La comparaison est un lot à part entière (D), au même rang que l'espace et la fiche.

---

## 10. Prompt du premier lot de production (à valider avant usage)

> **Mission Claude Code : FUT-41, lot A « Vos logements » (implémentation, une PR, sans fusion ni déploiement).**
>
> **Contexte.**
> - Lire `docs/audits/2026-11-08-fut41-v4-centre-decision/README.md` (§ 2, 3, 6, 9) et son annexe `annexe-lot2-memoire-multi-biens.md` (§ 3 à 8).
> - Le prototype `/dev/centre-decision` (`src/components/prototypes/fut41-v4/`) sert de référence d'interface et de texte. Le code de production s'écrit dans `src/lib/decision/` et `src/components/`, à partir de cette référence.
> - FUT-27 est fusionné.
>
> **Préalables à vérifier, et s'arrêter s'ils manquent.**
> - Une base Supabase non productive est disponible.
> - Les décisions Z1 à Z5 du § 12 sont tranchées.
> - FUT-173 est fusionné, ou son absence est acceptée explicitement.
>
> **À construire.**
> 1. **Migration 39** (fichier seulement, non appliquée en production) : `property_candidates` et `property_candidate_events`, selon l'annexe § 3, avec deux changements.
>    - Le journal garde un **contexte minimal** à l'écart : `revision`, `criterion_key`, `criterion_value`, `criterion_label`. Il ne garde pas une copie de `user_project`.
>    - `offer_kind in ('location','vente')` est nullable et n'est jamais déduit de l'intention.
>    - RLS en lecture « own », écritures par le service seul, clé étrangère composée vers `address_dossiers`.
>    - Plafond de 30 logements actifs (D2).
> 2. **Lib pure `src/lib/decision/logements-envisages.ts`** : validation (URL en http(s), au plus 500 caractères ; raison de 1 à 500 caractères ; nature), transitions de statut, contexte minimal à l'écart, `trier()` par dimension (montant groupé par nature, surface, ordre d'ajout), `extraireAnnonce()` repris du prototype avec ses tests.
> 3. **Store serveur et routes** : `POST`, `PATCH` et `DELETE` sur `/api/logements` et `/api/logements/[id]`, avec corps borné (`lireCorpsBorne`), compte vérifié, activation par compte (patron `activation.ts`). Aucune lecture d'artefact, aucune ouverture de contenu payant.
> 4. **Interface** : section « Vos logements » dans `/rapport/dossiers`, sous les lieux payés, en Relevé (primitives existantes), composée comme `vues/MaDecision.tsx` : ligne, emblème, statut, déclaré, prochain pas, écartés repliés avec leur raison, ajout par lien, texte collé ou saisie.
> 5. **Emblème** : arrondir les coordonnées trigonométriques de `EmblemeEchelles` (graduations), pour qu'il soit sûr à l'hydratation dans un composant client. Une empreinte visuelle avant et après doit montrer un rendu identique.
> 6. **Politique de confidentialité** (D7).
>
> **Tests exigés.**
> - Ceux de l'annexe § 5, plus le contexte minimal (aucun champ du Projet hors de la condition invoquée).
> - Aucun texte système ne présume un achat.
> - Le tri ne range jamais un loyer avec un prix.
> - Un logement sans dossier n'affiche aucune conclusion.
> - RLS sur la base non productive, avec deux comptes.
> - **Phrases rendues** testées, et pas seulement leur apparition.
>
> **Recette.** Chrome et WebKit, 1440, 390 et 360 px, thèmes sombre et clair, clavier, mouvement réduit. Toute requête hors localhost bloquée. Captures hors du dépôt pendant la recette.
>
> **Interdits.** Ne pas modifier le moteur, les paiements ni les droits existants. Ne pas appliquer de migration en production. Aucune comparaison (lot D). Aucun appel IA, aucune récupération d'URL d'annonce. Ne pas fusionner ni déployer. Ne pas créer de ticket sans vérifier l'existant.

---

## 11. Constats hors périmètre

1. **L'emblème casse l'hydratation dans un composant client.** `EmblemeEchelles` calcule ses 48 graduations en trigonométrie non arrondie. Le serveur et le navigateur divergent à la 15e décimale, ce qui provoque une erreur d'hydratation React. C'est le piège connu, déjà documenté pour d'autres SVG. Sans effet en production aujourd'hui (rendu par des composants serveur), mais **bloquant pour toute interface interactive** du centre. Le prototype contourne en ne rendant qu'après montage. Correctif proposé dans le lot A.
2. **La mesure d'audience part depuis les pages de développement.** Le layout racine charge Google Analytics (`G-MLT5Y4TC6W`), en mode consentement refusé par défaut, et des appels Clarity ont été observés. En local, les premières captures de cette passe ont envoyé des signaux sans cookie vers ces comptes, avec des URL `localhost` et sans aucune donnée personnelle. La recette bloque désormais toute requête externe.
   - **Suggestion** : ne pas charger la mesure hors production (`NODE_ENV`, domaine).
   - Je n'ai pas vérifié si Clarity respecte le refus ; c'est à confirmer par un audit du consentement.
3. **Suite de tests de cette copie.** Les 71 échecs viennent de paquets absents du `node_modules` lié. Il faudra relancer `npm test` dans une copie à jour avant le lot A.
4. **FUT-173** (déjà ouvert, High) devient un préalable au lot D.

---

## 12. Décisions qui vous reviennent

| # | Décision | Recommandation |
|---|---|---|
| **Z1** | Adopter la V4 comme base d'expérience (Ma décision, fiche, comparaison) pour la construction | Oui, sous réserve du protocole à trois personnes, mené sur le prototype V4 |
| **Z2** | Lots A à I et leur ordre ; A en premier | Oui. C et D avant E, F et G |
| **Z3** | D1 à D9 du lot 2, avec le **contexte minimal** au lieu d'une copie du Projet (réserve Linear du 08/11) | Oui |
| **Z4** | « Vos logements » sous les lieux payés, dans Ma décision (pas de page séparée) | Oui |
| **Z5** | Ajout assisté par **texte collé** dans le lot A ; aucun scraping ni récupération d'URL | Oui ; avis juridique avant toute voie automatique |
| **Z6** | Contrat critère par critère et `CadreDuCritere` dans le schéma de l'artefact (X8), avec la lecture partagée | Oui, en deux temps : la règle et le schéma, puis l'interface |
| **Z7** | Comparer, Faire le point et Et si gratuits sur les dossiers acquis ; le Comparatif à 39 € réexaminé dans FUT-49 | Oui, à confirmer avec le pilote FUT-49 |
| **Z8** | « Et si » à certitude graduée : « pourrait changer » seulement avec une mesure figée | Oui |
| **Z9** | Mode mission (chasseurs) : même produit, un Projet par mission ; pas de prototype dédié avant un signal commercial | Oui |
| **Z10** | Couper la mesure d'audience hors production (§ 11.2) | Oui ; petit ticket à ouvrir sur votre accord |
| **Z11** | Pousser la branche d'exploration sur le dépôt public pour la relecture (raw.githack) | À votre choix : rien n'est poussé pour l'instant |

---

## 13. Fichiers

- Compte rendu : `docs/audits/2026-11-08-fut41-v4-centre-decision/README.md`, ce fichier.
- Annexe : `annexe-lot2-memoire-multi-biens.md` (audit du lot 2, 08/11).
- Recette : `outils/recette.cjs`, `outils/apercu.cjs`, `recette.json`.
- Captures : `captures/` (91 fichiers).
- Prototype : `src/app/dev/centre-decision/page.tsx`, `src/components/prototypes/fut41-v4/` (modèle, tests, scénarios, état, vues, styles).
