# Schéma cible : le projet, la recherche, le lieu, et ce que futur•e sait trancher

25 septembre 2026. **Proposition, rien n'est codé.** Suite de l'audit
`docs/audits/2026-09-24-surfaces-du-projet.md`, et des échanges du porteur avec ChatGPT.

## Le problème, en deux

L'audit visait un problème de **persistance** : quatre surfaces, un seul objet lu par le moteur, une
seule surface qui l'écrit vraiment. Il en a révélé un second, plus profond, de **sens** :

> « Ma priorité absolue est l'accès aux soins » est devenu une préférence.
> « Je veux être proche d'une montagne » est devenu une condition éliminatoire.

Deux causes. Le champ `hardConstraints` confond **ce que la personne juge non négociable** et **ce
que futur•e sait transformer en filtre** : seuls des critères géographiques peuvent y entrer. Et une
même analyse du texte sert **deux usages** : filtrer une recherche dans « Où vivre », et rendre un
verdict sur un lieu précis dans le dossier. Un filtre peut être large ; un verdict doit être
exactement ce que la personne a dit.

Unifier les surfaces sans régler le sens ne ferait que propager l'erreur plus proprement.

## Quatre objets, quatre questions

| Objet | La question | Vie | Où il vit |
|---|---|---|---|
| **Projet** | Que cherchez-vous, et qu'est-ce qui compte pour vous ? | Durable, modifié volontairement | Le compte |
| **Recherche** | Où chercher, cette fois-ci ? | Ponctuelle, jetable | La session de « Où vivre » |
| **Relation au lieu** | Quel est votre lien avec **ce** lieu ? | Une par commune, une par adresse | La commune ou le dossier regardé |
| **Capacité** | Que sait trancher futur•e sur ce critère, à cette échelle ? | Fixe, écrite dans le code | Un registre du moteur |

### 1. Le projet

Ce qu'il porte :

- **L'objectif** : chercher où vivre, étudier un lieu, j'y habite déjà.
- **L'intention** : acheter, louer, ou rien de déclaré.
- **Le texte** de la personne, conservé tel quel.
- **Les critères**, chacun avec :
  - son **poids** (1, 2, 3), qui sert à classer, comme aujourd'hui ;
  - un drapeau **non négociable**, vrai **seulement si la personne l'a dit** avec des mots qui le
    disent (« absolument », « non négociable », « indispensable », « priorité absolue », « il faut »).

Ce qu'il ne porte plus : la relation à un lieu particulier, ni les filtres d'une recherche.

**Pourquoi un drapeau et pas un poids 3 renommé.** Aujourd'hui, le poids 3 veut dire « essentiel »,
et l'analyse l'attribue largement : « j'ai peur des pesticides » reçoit un 3. Faire de chaque 3 une
condition non négociable produirait des verdicts éliminatoires que personne n'a demandés. Le poids
dit l'ordre des priorités ; le drapeau dit ce qui élimine. Ce sont deux informations.

**Une mention sans nuance n'est plus non négociable par défaut.** « Je veux être proche d'une
montagne » devient un critère de poids 2 ou 3, sans drapeau. C'est l'inverse de la consigne actuelle
pour les lieux et le relief.

### 2. La recherche

Ce que tape la personne dans « Où vivre ». Elle **peut** utiliser des filtres stricts pour
explorer : « en Bretagne » peut écarter tout ce qui n'est pas breton, **dans cette recherche**.
Ces filtres ne s'inscrivent jamais seuls dans le projet.

Un geste explicite fait le pont : **« Utiliser cette recherche pour mon projet »**. Il montre ce qui
va changer avant de l'écrire.

Aujourd'hui, « Où vivre » n'écrit rien dès qu'un projet existe, sans le dire. Demain, il n'écrit
rien sans qu'on le lui demande, et il le dit.

### 3. La relation au lieu

Une par commune regardée, une par adresse :

- **Commune** : j'y vis, j'envisage d'y vivre, je la découvre.
- **Adresse** : je visite ce bien, j'y habite, j'en suis propriétaire.

Chacune garde son **origine** : déclarée par la personne, ou déduite (de la commune de résidence,
par exemple), et dite comme telle, comme aujourd'hui.

Elle remplace deux stockages actuels : la relation par commune (`report_context`) et la posture du
dossier d'adresse (`address_dossiers.posture`, écrite « résidence » en dur, lue par personne).

**Ce qui reste à trancher** : l'objectif du projet « j'y habite déjà » et la relation « j'y vis »
se recouvrent. Proposition : l'objectif dit **pourquoi** on utilise futur•e, la relation dit le
**lien avec ce lieu-ci**. Quelqu'un qui habite La Rochelle et cherche à acheter à Châtelaillon a
pour objectif « chercher où vivre », et pour relations « j'y vis » à La Rochelle, « j'envisage d'y
vivre » à Châtelaillon.

### 4. La capacité

Pour chaque critère, et à chaque échelle, ce que futur•e sait faire :

- **Trancher** : une mesure absolue répond à la question. La distance à la mer, l'altitude, le
  département, un temps de trajet.
- **Apprécier** : une donnée éclaire sans conclure. Un rang parmi les communes, un équipement
  recensé, une exposition moyenne.
- **Ne pas mesurer** : aucune donnée ne répond aujourd'hui.

C'est un registre fixe, écrit dans le code, pas une donnée de l'utilisateur. Il existe déjà en
partie : le moteur sait si un critère a été examiné. Il ne sait pas encore dire s'il **peut** être
tranché.

## La règle du verdict

> **Seul un critère déclaré non négociable, et que futur•e sait trancher, peut produire
> « Condition non respectée ».**

| La personne a dit | futur•e sait… | Le dossier dit |
|---|---|---|
| Non négociable | trancher, et c'est rempli | Condition remplie |
| Non négociable | trancher, et ce n'est pas rempli | **Condition non respectée** |
| Non négociable | seulement apprécier | **Point non négociable à confirmer** : toujours visible en tête, jamais éliminatoire, toujours accompagné de sa vérification |
| Non négociable | ne pas mesurer | Point non négociable que futur•e ne sait pas encore évaluer, dit comme tel |
| Important ou secondaire | trancher ou apprécier | Correspond, ou correspond moins bien, comme aujourd'hui. **Jamais éliminatoire.** |

Sur ton projet, cela donnerait :

> **Point non négociable à confirmer**
> L'accès aux soins est central dans votre projet. Les données sont favorables à l'échelle de la
> commune, et un médecin généraliste et une pharmacie se trouvent à environ 550 m, mais rien ne
> permet d'établir la disponibilité d'un médecin.

Et la montagne, dite sans nuance, deviendrait « correspond moins bien », avec l'altitude de
référence en mètres, au lieu de « Condition non respectée » en tête de page.

## Les surfaces, réduites à des portes vers ces objets

| Surface | Écrit | Comment |
|---|---|---|
| Carte « Votre projet » (`/rapport`) | Le projet, et la relation au lieu regardé | L'éditeur de référence. Les deux parties séparées visuellement, puisque ce sont deux objets. |
| « Où vivre » | Une recherche | Le projet seulement sur « Utiliser cette recherche pour mon projet », après avoir montré ce qui change. |
| Formulaire d'accueil | **À trancher** | Soit une vraie amorce du projet, enregistrée volontairement ; soit une porte d'entrée assumée qui ne prétend rien enregistrer. |
| Bandeau Territoire | Rien | Affiche la relation, renvoie vers la carte. Inchangé. |

## Cas limites

| Situation | Aujourd'hui | Demain |
|---|---|---|
| « Priorité absolue : les soins » | Préférence de poids 3 | Poids 3, **non négociable**, capacité « apprécier » → point à confirmer |
| « Je veux être proche d'une montagne » | Condition éliminatoire | Poids 2 ou 3, sans drapeau → correspond ou non, jamais éliminatoire |
| « Il nous faut absolument la mer » | Condition éliminatoire | Non négociable, capacité « trancher » (distance) → peut être « non respectée » |
| « En Bretagne » tapé dans « Où vivre » | Filtre, et s'inscrit dans le projet si c'est le premier | Filtre **de cette recherche** ; ne touche pas le projet |
| Une nouvelle recherche alors qu'un projet existe | Ignorée en silence | Proposée : « Utiliser cette recherche pour mon projet » |
| Locataire qui achète son logement | Objectif « j'y habite » + intention « achat » | Inchangé : objectif, intention et relation restent distincts |
| Commune de résidence et ville de l'accueil divergent (La Rochelle, Carpentras) | Deux « où j'habite » coexistent | Une seule commune de résidence ; l'accueil ne la crée pas en parallèle |
| Critère non négociable qu'aucune donnée ne mesure | N'existe pas | Dit comme non évaluable, visible, jamais passé sous silence |

## Les projets déjà enregistrés

Les conditions « dures » actuelles ont été posées par la consigne, pas forcément par la personne.
Impossible de savoir, après coup, lesquelles ont été dites avec force. Deux options :

- **A.** Les convertir toutes en critères sans drapeau, et laisser la personne cocher « non
  négociable » elle-même. Rien d'éliminatoire ne survit sans avoir été confirmé.
- **B.** Les garder non négociables, mais afficher une fois : « Ces points sont-ils vraiment non
  négociables ? »

Je recommande **A** : c'est la seule qui ne laisse aucun verdict éliminatoire reposer sur une
déduction. Les versions figées des dossiers, elles, ne bougent pas.

## Les tests qui garantiront l'ensemble

- **Une même analyse, passée par chaque surface, aboutit au même projet enregistré** quand la
  personne choisit de l'enregistrer. L'analyse est une donnée de test fixe : on ne teste pas la
  stabilité du modèle, on teste les portes.
- **Aucun verdict éliminatoire** sans drapeau non négociable **et** capacité « trancher ».
- **Aucun drapeau non négociable** sans un marqueur de force dans le texte (test de contrat de la
  consigne d'analyse, séparé).
- **Une recherche n'écrit jamais le projet** sans le geste explicite.

## L'ordre de réalisation proposé

1. Le registre des **capacités** et la **règle du verdict**. C'est ce qui corrige ton dossier, sans
   toucher aux surfaces.
2. Le **drapeau non négociable** dans le projet, et la consigne d'analyse qui ne le pose que sur des
   mots explicites. Migration des projets existants.
3. La **relation au lieu**, qui remplace les deux stockages actuels.
4. **« Où vivre »** en recherche, avec le geste d'enregistrement.
5. Le **formulaire d'accueil**, selon la décision prise.
6. Suppression des reliquats (`address_dossiers.posture`).

## Ce qu'il faut trancher avant la première ligne

1. Drapeau non négociable séparé du poids : d'accord ?
2. Projets existants : conversion A ou B ?
3. Objectif « j'y habite » et relation « j'y vis » : la distinction proposée tient-elle ?
4. Formulaire d'accueil : amorce du projet, ou porte d'entrée sans mémoire ?
5. Une recherche peut-elle garder des filtres stricts (« en Bretagne » qui écarte le reste) ?
