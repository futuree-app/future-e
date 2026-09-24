# Audit : les surfaces où l'on déclare son projet

24 septembre 2026. Audit en lecture seule, aucun code modifié. Commandé par le porteur avant
toute unification : retracer la chaîne entre **ce que l'utilisateur croit avoir déclaré** et **ce que
le moteur de décision reçoit**.

## En une phrase

Le moteur ne lit qu'un objet, `user_profiles.user_project`, et **une seule surface l'écrit
complètement** : la carte « Votre projet » en bas de `/rapport`. Les autres écrivent ailleurs, écrivent
partiellement, ou n'écrivent que si rien n'existe encore.

## Ce qui existe vraiment

On parlait de quatre surfaces. Il y en a trois qui écrivent, une qui affiche, et deux stockages
parallèles que personne n'avait comptés.

| | Formulaire d'accueil | Où vivre | Carte « Votre projet » (`/rapport`) | Bandeau Territoire |
|---|---|---|---|---|
| **Ce qu'elle demande** | Ville, type et âge du logement, secteur d'activité, sensibilités (pollen, asthme, chaleur, pathologie chronique), mobilité, projet (achat, retraite, déménagement, autre) | Un texte libre | L'objectif (chercher où vivre, étudier ce lieu, j'y habite), l'intention (acheter, louer), un texte facultatif. Et, pour la commune affichée : « J'y vis / J'envisage d'y vivre » | Rien : lecture seule depuis le 12/08, lien « Modifier le projet » |
| **Ce qu'elle produit** | `WizardAnswers` | `ParsedProject` (analyse du texte par le modèle) | `UserProject` complet ; la relation à la commune à part | — |
| **Où c'est rangé** | `user_profiles.wizard_answers` | `user_profiles.user_project`, via `user_project_if_empty` | `user_profiles.user_project` ; la relation dans `report_context` (autre table, autre route, aucune transaction commune) | — |
| **Valeurs ajoutées en chemin** | Aucune depuis le 19/09 (avant : réponses sautées remplacées par des valeurs inventées) | **Objectif forcé à « recherche », intention forcée à vide** | Aucune : objectif et intention sont choisis, jamais devinés | Relation **déduite** de la commune de résidence, et dite comme telle |
| **Écrit dans le projet canonique ?** | **Non.** Objet parallèle | Oui, **seulement pour l'amorcer** | Oui | Non |
| **Fusionne ou écrase ?** | Écrase ses propres réponses | **N'écrit rien si un projet existe déjà** | Écrase (voulu) | — |
| **Quand le dossier de décision le voit** | **Jamais** | À l'achat, si c'était le premier projet ; sinon jamais | Bandeau « Votre projet a changé » puis mise à jour demandée | La relation : **jamais** (elle ne règle que le ton de la synthèse Territoire) |
| **Ce qui est réaffiché ensuite** | La « première lecture » gratuite | La carte « Votre projet » | La reformulation du modèle | « Cette lecture s'adresse à quelqu'un qui… » |
| **Tests** | `teaser-signaux.test.ts` (les signaux affichés). Aucun lien vers le projet à tester : il n'existe pas | `user-project.test.ts` (validation). **Aucun test de `OuVivreProjectSync`** | `projet-edition.test.ts`, `user-project.test.ts` | — |

Les deux stockages parallèles :

- **La posture du dossier d'adresse** (`address_dossiers.posture`). La page Autour y écrit
  `"residence"` en dur à chaque ouverture. Plus personne ne la lit pour régler le ton : c'est une
  colonne morte qu'on continue d'alimenter.
- **Les informations collectées par l'assistant** (`health_flags`, `life_projects`, etc.). Elles ne
  servent qu'à l'assistant et à la page « Mémoire ». Le moteur ne les lit pas.

## Le cas témoin : ton propre projet

Ce que le moteur a enregistré, lu en base :

- Objectif : `recherche` · Intention : `achat`
- Texte : « J'achète ma résidence principale. **Ma priorité absolue est l'accès aux soins** […] Je veux
  être proche d'une montagne et vivre au calme. J'ai peur des pesticides. »
- **Condition non négociable** : la proximité du relief.
- **Préférences** : accès aux soins (poids 3), calme (2), faible pression agricole (3).
- Réponses d'accueil, jamais transmises : ville **Carpentras**, projet **achat**, **allergies au
  pollen**, secteur agricole, voiture. Ta commune de résidence enregistrée, elle, est **La Rochelle**.

La même intention, surface par surface :

| Surface | Ce que le moteur reçoit |
|---|---|
| **Formulaire d'accueil** | Rien. Ni les soins ni la montagne ne s'y expriment, et « Achat immobilier » coché n'arrive nulle part. Les allergies au pollen, qui correspondent à la préférence « air sain », non plus. |
| **Où vivre** | Le même texte donne la même analyse (même parseur), **mais l'achat disparaît** : l'intention est forcée à vide, donc les gestes du dossier parlent à un lecteur « neutre » et non plus « avant l'achat ». Et comme un projet existe déjà, **rien n'est écrit du tout**. |
| **Carte du rapport** | Tout : objectif, intention achat, texte, analyse. C'est le projet ci-dessus. |
| **Bandeau Territoire** | Rien. Il affiche « quelqu'un qui envisage de s'installer à Châtelaillon-Plage », déduit de ta résidence à La Rochelle. |

## Les trois drapeaux rouges

**1. Des valeurs inventées quand l'utilisateur n'a rien dit.**
- « Où vivre » impose l'objectif « je cherche où vivre » et efface l'intention, même quand le texte
  dit « j'achète ».
- La posture du dossier d'adresse vaut « résidence » en dur.
- (Corrigé le 19/09 : le formulaire d'accueil remplaçait les réponses sautées par des valeurs
  inventées.)

**2. Des déductions que l'utilisateur n'a pas faites.** C'est le constat le plus important.

Tu as écrit « ma **priorité absolue** est l'accès aux soins » et, plus loin, « je veux être proche
d'une montagne ». Le moteur a fait de la montagne une **condition non négociable**, et des soins une
simple préférence. L'inverse de ce que tu as dit.

Ce n'est pas un raté du modèle, c'est la règle écrite dans sa consigne : pour un lieu ou un relief,
« une mention nue sans marqueur est *hard* par défaut ». Et les soins **ne peuvent pas** devenir
une condition : la liste des conditions possibles ne contient que des critères géographiques
(départements, zones, montagne, relief, mer, taille de commune, lieux à portée). Un besoin de service,
même dit « absolu », ne peut être qu'une préférence.

Conséquence visible sur ton dossier : « **Condition non respectée** : la proximité du relief » en tête
de page, pour une envie formulée en passant. Et la reformulation affichée ne dit nulle part que la
montagne est éliminatoire.

**3. Des surfaces qui semblent modifier le projet sans toucher ce que le moteur utilise.**
- Le formulaire d'accueil, entièrement.
- « Où vivre » dès qu'un projet existe : l'utilisateur tape une nouvelle recherche, rien ne change dans
  son dossier, rien ne le lui dit.
- « J'y vis / J'envisage d'y vivre », posé **dans la même carte** que « J'y habite déjà » : deux
  réponses à la même question, rangées dans deux tables, qui pilotent deux écrans différents.

## Ce que je ne tranche pas

La cible architecturale se discute ensuite : un seul `UserProject`, et chaque surface comme un simple
adaptateur vers lui. Avant, il faudra décider, surface par surface, ce qu'on garde, ce qu'on branche et
ce qu'on supprime. Quelques questions que l'audit soulève sans y répondre :

- Le formulaire d'accueil doit-il nourrir le projet, ou rester une porte d'entrée sans mémoire ?
- « Où vivre » doit-il pouvoir modifier un projet existant, et si oui, en le disant comment ?
- « J'y vis » et « J'y habite déjà » sont-ils une seule question ?
- Qui décide qu'un critère est non négociable : les mots de l'utilisateur, ou la nature du critère ?
  Et un besoin de service peut-il l'être ?
- Laquelle de « Carpentras » ou « La Rochelle » est ta commune ?
