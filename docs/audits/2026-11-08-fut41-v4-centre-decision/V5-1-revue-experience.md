# FUT-41 · FUT-22 · V5.1 : simplifier l'expérience sans simplifier les décisions

9 novembre 2026 · branche `explore/fut-41-v51-experience` (partie de la V5 `ea96f6de`) · prototype de revue, données fictives.
Aucun changement du moteur, des règles de comparaison FUT-22, des droits, de Stripe, de Supabase ni des pages de production.

## 0. En bref

**La question.** Une personne de 60 à 70 ans qui découvre futur•e comprend-elle en quelques secondes où elle en est, ce qui compte pour sa décision et ce qu'elle peut faire ensuite ?

**Le diagnostic de la V5.** Les règles sont justes et la structure tient (Vue d'ensemble, Comparer, Mon Projet). Mais la V5 demande trop de lecture : le même arbitrage est raconté jusqu'à quatre fois, une même justification se répète sous chaque condition, le suivi personnel et l'état de l'analyse se confondent, et une partie des textes décrit la méthode plutôt que la situation.

**L'intention de la V5.1.** Chaque écran dit d'abord ce qu'il faut retenir, puis pourquoi, puis le détail et les sources. Une seule plaque par écran (« À retenir »), cinq rôles d'information traités toujours de la même façon (constat, conséquence, incertitude, action, preuve), et deux dimensions séparées pour chaque logement (votre suivi, ce que futur•e en sait).

**Ce que ça donne, mesuré.** Sur téléphone (390 px), la comparaison d'arbitrage passe de 5 339 à 3 019 px de page ; la comparaison à trois logements inégalement analysés, de 5 069 à 3 114 px. La fiche d'un logement non analysé ne répète plus quatre fois qu'elle parle de la commune. La recette automatisée passe (47 vérifications sur 47, contraste minimal 5,18) ; **aucune personne réelle n'a encore utilisé la V5.1**.

**Recommandation.** Garder la V5.1 comme base de présentation pour la production, après un test court avec trois à cinq personnes (§ 7) qui compare V5 et V5.1 sur les mêmes situations. Les règles FUT-22 et le modèle V5 restent la référence ; la V5.1 ne les modifie pas.

---

## 1. Revue indépendante de la V5 (phase A)

Neuf parcours rejoués sur la V5 `ea96f6de`, à 1 440, 390 et 360 px, en clair et en sombre (captures `captures-v5/`). Je distingue ce qui est **observé** (constaté à l'écran, mesurable) de ce qui est une **hypothèse** (probable, à vérifier avec des personnes).

### 1.1 Ce qui fonctionne et doit rester

| Élément | Pourquoi le garder |
|---|---|
| Trois entrées : Vue d'ensemble, Comparer, Mon Projet | Claires, stables depuis la V5 ; aucune revue ne les a contestées |
| Le titre-question (« Nantes ou Rennes ? ») | On entre par la question de la personne, pas par le produit |
| Le panneau avant tout geste payant (« Ce que vous saurez », « Ce qu'elle ne dira pas ») | Honnête, et il ne promet pas ce que l'analyse ne fera pas |
| Les questions de visite et leurs réponses (« Ce que cela change pour vous », « Ce qui reste inconnu ») | Le meilleur lien entre analyse et action réelle |
| Essayer, puis adopter (« Et si… ? ») | La distinction est juste ; la continuité a été réparée dans la V5 |
| Mesures sur une règle, limite en pointillé | Le seuil se voit sans phrase |
| La comparaison des communes | Bien construite : deux écarts nets (nuits, calme), une limite d'année de données expliquée. Elle n'est pas moins réussie que celle des logements ; ses défauts sont les mêmes (répétition, vocabulaire) |

### 1.2 Problèmes observés, par importance

| # | Problème observé | Où | Effet |
|---|---|---|---|
| O1 | **Le même arbitrage est dit quatre fois** : « En bref », « Ce qui change votre choix », « Ce que chacun apporte », « Le détail » | Comparer | Il faut lire quatre blocs pour comprendre qu'ils disent la même chose |
| O2 | **La même justification se répète sous chaque condition** : « La donnée de Nantes vaut pour ces logements : elle ne les distingue pas » (×5), « Étudié pour 1 sur 2… Analyser l'adresse le lirait » (×4) | Comparer, détail | 5 069 px de page sur téléphone pour trois logements dont un seul est analysé |
| O3 | **« Dit pour la commune ; ce logement reste à lire depuis son adresse » quatre fois** | Fiche non analysée | Une information vraie, dite une fois de trop par condition |
| O4 | **Le suivi et l'analyse se confondent** : « À étudier » (mon suivi) et « Commune étudiée · adresse pas encore analysée » (ce que futur•e sait) dans la même petite typographie | Accueil, fiche | On ne sait pas quel mot dépend de soi et lequel dépend de futur•e |
| O5 | **Métadonnées en chasse fixe, petites et grises** (« rapport de Nantes du 2 oct. », « Tout est étudié · 2 à vérifier », « déclaré ») partout | Tous les écrans | Effet « rapport technique » ; ces mentions attirent l'œil sans être utiles en première lecture |
| O6 | **Sur téléphone, les deux sélecteurs côte à côte tronquent les noms** (« T4 rue de la Convent… ») | Comparer à trois logements | On ne sait plus exactement ce que l'on compare |
| O7 | **Mots de méthode en première lecture** : « Pas assez étudié », « Même donnée », « Inconnu partout », « Les distingue », « Pourrait les distinguer » | Comparer | Les étiquettes du moteur s'affichent comme des verdicts |
| O8 | **Ajouter un logement part de l'adresse** ; le lien d'annonce est un champ facultatif parmi cinq ; la photo s'ajoute à la main | Ajout | Le geste le plus courant (j'ai une annonce) n'est pas l'entrée principale |
| O9 | **Le mot « Relevé » désigne une page** (« Ouvrir le Relevé complet ») | Fiche, fiche commune | Un nom de direction artistique utilisé comme destination |

### 1.3 Hypothèses (à vérifier avec des personnes)

| # | Hypothèse | Pourquoi je la crois probable |
|---|---|---|
| H1 | Une personne peu habituée aux écrans lit « En bref » et s'arrête : elle ne descend pas jusqu'au tableau | Le bloc est long et ressemble à une conclusion |
| H2 | « Repéré » se comprend mieux que « À étudier » comme statut personnel | « À étudier » ressemble à une tâche confiée à futur•e |
| H3 | Les trois paliers (commune, adresse, analyse) se lisent sans légende | Forme simple, mot à côté ; à confirmer |
| H4 | Le geste orange en tête suffit à savoir quoi faire ensuite | Un seul bouton coloré par écran |
| H5 | Le fond sombre n'est pas ce qui rend l'outil froid ; ce sont la typographie mono et la densité | Le thème clair de la V5 souffre des mêmes défauts |

---

## 2. L'intention de conception de la V5.1

**Une phrase : « Voici ce que nous savons de vos possibilités. Voici ce qui compte pour votre choix. Et voici comment avancer. »**

### 2.1 La progression de chaque écran

1. **À retenir** : la seule plaque de l'écran. Quatre lignes au plus, chacune avec son signe : la condition sans compromis, ce qui distingue, ce qui peut encore changer le choix, ce qui manque. Puis **le geste le plus utile**, seul bouton orange.
2. **Pourquoi** : les valeurs côte à côte, condition par condition, rangées en « Ce qui les distingue », « Ce qui reste à savoir », « Ce qui ne les distingue pas ».
3. **Le détail et les sources** : repliés, complets, jamais supprimés.

Une catégorie vide disparaît. Quand rien n'est établi, la plaque le dit (« Avec ce qui est étudié aujourd'hui, rien ne les distingue encore ») et le signe est celui de l'incertitude.

### 2.2 La grammaire visuelle (cinq rôles)

| Rôle | Traitement | Exemple |
|---|---|---|
| Constat | texte plein, la valeur concrète en clair | « Quai très circulé : 65 à 70 dB le jour. » |
| Conséquence | la condition nommée en tête, avec le poids que vous avez déclaré | « Le calme · compte pour vous » |
| Incertitude | cercle en pointillé avec « ? », et le mot | « Ce qui peut encore changer votre choix » |
| Action | un verbe sur un bouton, une flèche ; un seul bouton orange par écran | « Voir les questions → » |
| Preuve | repliée, en petit : « D'où viennent ces informations » | « Cerema, cartes de bruit, 2022 · dossier du 15 oct. » |

Aucune nouvelle couleur : le registre des issues reste celui de la V5. Pas d'encadré autour de chaque information : une plaque par écran, des filets et de l'espace pour le reste.

### 2.3 Typographie et lisibilité

- Une seule famille (Archivo) : les métadonnées ne sont plus en chasse fixe. C'est le changement qui retire le plus l'impression de rapport technique.
- Texte courant à 16,5 px, textes secondaires à 15 px et plus contrastés (gris secondaire remonté d'un cran) ; contraste minimal mesuré **5,18** sur tous les écrans recettés, clair et sombre.
- Cibles tactiles de 44 px au moins pour les sélections, les fermetures, les annulations.
- Ces réglages valent **pour le prototype seulement** : les jetons de production ne changent pas (FUT-118 en décide).

### 2.4 Deux dimensions pour chaque logement

| Votre suivi (ce que vous décidez) | Ce que futur•e en sait (ce qui est étudié) |
|---|---|
| Repéré · Visite envisagée · Visite le 14 nov. · Visité · Écarté | trois paliers (commune, adresse, analyse) et un mot : Adresse inconnue · Adresse connue, pas encore analysée · Adresse analysée · Analyse à actualiser |
| icône et mot ; on le change soi-même | forme et mot ; il change par une adresse, une analyse ou une mise à jour |

Aucune transition de statut nouvelle : « Repéré » est le libellé de `a_etudier`, « Visite envisagée ou prévue » celui de `a_visiter` (avec la date si elle existe). « Analyse à actualiser » est le cas existant d'une analyse écrite sous un ancien Projet.

---

## 3. Ce qui change, écran par écran

### 3.1 Ma décision (accueil)

| Avant (V5) | V5.1 | Pourquoi |
|---|---|---|
| Statut en petite chasse fixe à côté du nom ; « Commune étudiée · adresse pas encore analysée » en gris | Deux dimensions sur une ligne, chacune avec son signe et son mot | O4 |
| Entrées « + Une commune · + Un logement » à égalité, discrètes | « + Ajouter une annonce » en bouton, « + Une commune » à côté | O8 |
| Recherche vide : « J'ai une adresse ou une annonce » en second | « Ajouter une annonce » en premier | O8 |
| Le reste (titre-question, une phrase, « Comprendre », un geste prioritaire, gestes sous chaque lieu) | inchangé | déjà corrigé en V5 |

La page n'est pas plus courte (1 797 → 1 892 px à 1 440) : la ligne des deux dimensions ajoute une hauteur par logement. Les lieux restent dans le premier écran.

### 3.2 Comparer

| Avant (V5) | V5.1 | Ce qui a changé de place |
|---|---|---|
| Titre, sous-titre, choix du mode, puces de sélection, sélecteurs mobiles | « Vous comparez T3 quai de la Fosse et T4 rue de la Convention » collé en haut, et « Changer » | la sélection se replie ; le mode passe dans « Changer » |
| « En bref » (plaque) | **À retenir** (même plaque, mêmes phrases V5), et le geste le plus utile dedans | le geste n'est plus en bas de page |
| « Ce qui change votre choix » | **Ce qui les distingue** : seulement les écarts établis, sans le mot du verdict | les écarts « possibles » partent dans « Ce qui reste à savoir » |
| « Ce que chacun apporte, et ce qu'il demande » (bilan en colonnes) | **supprimé** : ses éléments sont rangés une fois, dans les écarts, les incertitudes ou les gestes | O1 |
| — | **Ce qui reste à savoir** : une ligne par logement pour ce qui n'est pas étudié, avec la raison ; puis le tableau des incertitudes avec les questions dans la case | O2 : « pas encore étudié pour les nuits fraîches, le calme et la vie de quartier (adresse pas encore analysée) », dit une fois |
| — | **Ce qui ne les distingue pas** : une ligne par condition | |
| « Le détail, condition par condition » ouvert | **Tout le détail, avec les sources** : replié, complet (cinq conditions, preuves, carte des communes) | la preuve reste à un clic |
| Sélecteurs mobiles côte à côte, noms tronqués | « À gauche » et « À droite », un par ligne, noms entiers, collés en haut | O6 |

Entre deux logements de communes différentes, la différence communale s'intitule **« Entre leurs communes »**, avec sa réserve (« cela s'étudie à l'adresse : c'est fait pour T3 quai de la Fosse seulement »). Elle n'est jamais présentée comme un écart entre les logements.

Le geste prioritaire **débloque la comparaison** quand il manque quelque chose (renseigner l'adresse, analyser) ; quand tout est étudié, ce sont les questions de visite.

### 3.3 Fiche logement

| Avant (V5) | V5.1 | Pourquoi |
|---|---|---|
| Grande vignette avec « Ajouter une photo » et sa note en tête | Vignette de 72 px ; l'ajout de photo passe en option | la photo n'est pas l'information principale |
| « Votre suivi » en onglets, puis « Où il en est » | **Votre suivi** et **Ce que futur•e en sait**, côte à côte et nommés | O4 |
| Conclusion du dossier dans une plaque séparée | **À retenir** : la conclusion citée mot pour mot, datée ; ou, sans analyse, « Ce que nous savons » et « Ce qui manque » ; le geste utile dedans | une seule plaque |
| « Face à votre Projet » : deux couches par condition, « Dit pour la commune… » répété | **Une ligne par condition**, la lecture la plus précise disponible, et son échelle à côté (« à l'échelle de Nantes, pas encore à l'adresse ») ; la phrase d'explication **une seule fois** en tête | O3, sans perdre la garde S7 |
| Sources sous chaque lecture | « D'où viennent ces informations », replié | O5 |
| Formulaire de note toujours ouvert | « Ajouter une note » ; le formulaire s'ouvre au clic | allège la fin de page |
| « Ouvrir le Relevé complet » | « Voir l'analyse complète » | O9 |

**Une décision de vérité, prise en cours de route.** J'avais d'abord retiré l'échelle sous chaque lecture communale, pour ne la dire qu'une fois. À l'écran, « Correspond · Une gare TGV et TER dans la commune » sous « Une gare à moins de 20 min » se lisait comme une promesse sur le logement. J'ai remis une mention courte sur chaque ligne (« à l'échelle de Nantes, pas encore à l'adresse ») : la phrase longue est dite une fois, la garde reste attachée à chaque fait.

### 3.4 Ajouter une annonce

Le parcours part du **lien**. Quatre situations, toutes prototypées sans ouvrir aucune page :

| Situation | Ce que voit la personne |
|---|---|
| Lien reconnu, informations et miniature disponibles | les valeurs proposées (nom, prix, surface, pièces, commune), chacune marquée « lu dans l'annonce », à vérifier ; un cadre « Miniature de l'annonce » : « Montrée seulement si le site d'annonces l'autorise. Dans ce prototype, aucune image n'est récupérée. » |
| Lien reconnu, pas de miniature | un repère neutre (nombre de pièces) : « Le logement sera repéré par son nom ; vous pourrez ajouter votre propre photo. » |
| Lien illisible | « Lien gardé. Ce site ne permet pas à futur•e d'en lire les informations. Indiquez ce que vous savez, ou collez le texte de l'annonce : rien n'est deviné. » |
| Pas de lien | saisie directe |

Les valeurs restent « déclarées ». La V5.1 ne développe aucune récupération réelle. Ce qu'il faudrait trancher pour la production est au § 6.

### 3.5 L'analyse complète (ex-« Relevé »)

Le mot « Relevé » ne désigne plus une page. « Voir l'analyse complète » ouvre la conclusion (citée mot pour mot, datée, avec le Projet de son époque), puis quatre onglets : **Synthèse · Territoire · Autour de l'adresse · Logement** (deux pour une commune seule). On revient à la fiche, ou l'on compare ce logement avec un autre ; le bouton retour du navigateur ramène à l'analyse. Le cadrage de l'intégration avec les pages de production est dans `FUT-86-articulation-decision.md`.

---

### 3.6 Longueur des pages, mesurée (thème clair)

| Situation | 1 440 px, V5 → V5.1 | 390 px, V5 → V5.1 |
|---|---|---|
| Ma décision, référence | 1 797 → 1 892 | 3 048 → 3 131 |
| Ma décision, dix logements | 2 476 → 2 586 | 4 242 → 4 443 |
| Comparer, arbitrage établi | 3 869 → 2 145 | 5 339 → 3 019 |
| Comparer, trois logements inégaux | 4 814 → 2 429 | 5 069 → 3 114 |
| Comparer, deux communes | 3 792 → 2 232 | 4 981 → 3 211 |
| Comparer, même commune | 4 290 → 2 674 | 5 488 → 3 656 |
| Fiche, non analysée | 2 934 → 2 254 | 3 876 → 3 168 |
| Fiche, analyse ancienne | 3 479 → 2 355 | 4 527 → 3 212 |
| Fiche, après visite | 4 033 → 3 016 | 5 202 → 3 952 |

Les pages de Comparer et des fiches raccourcissent de 20 à 50 %, sans rien retirer : le détail et les sources sont repliés. L'accueil s'allonge de 3 à 5 % (la ligne des deux dimensions par logement).

## 4. Arbitrages : retenus et rejetés

| Proposition | Décision | Raison |
|---|---|---|
| Trois cartes « établi / incertain / action » sur chaque comparaison | **Rejetée telle quelle** | La mission la donnait comme direction, pas comme gabarit. Trois cartes vides ou presque seraient plus lourdes que des lignes ; la V5.1 garde des lignes avec un signe, et une catégorie vide disparaît |
| Plus de couleurs ou d'icônes pour distinguer les rôles | **Rejetée** | Quatre signes suffisent, chacun avec son mot ; une nouvelle couleur sémantique se confondrait avec le registre des issues |
| Supprimer le bilan « apporte / demande d'accepter » | **Retenue** | Ses éléments sont tous rangés ailleurs, une fois ; vérifié dans les trois situations (arbitrage, inégale, communes) |
| Garder le verdict du moteur (« Les distingue », « Pas assez étudié ») dans les tableaux de première lecture | **Rejetée** | Le titre de la section dit déjà le verdict ; le mot reste dans « Tout le détail » |
| Dire une seule fois que la fiche parle de la commune | **Retenue avec correction** | La phrase longue une fois ; une mention courte d'échelle reste sur chaque ligne (S7, § 3.3) |
| « Repéré » au lieu de « À étudier » | **Retenue comme hypothèse** | À confirmer par le test (H2) ; aucune donnée ne change |
| Photo générique quand l'annonce n'en a pas | **Rejetée** | Interdit par la mission et par la décision V4.1 ; repère neutre |
| Récupérer la miniature de l'annonce | **Prototypée, non développée** | Dépend d'une voie autorisée (§ 6) |
| Réduire toutes les marges pour raccourcir | **Rejetée** | Le gain vient de la suppression des redites, pas de la compression |
| Modifier les jetons de production (contraste, chasse fixe) | **Hors périmètre** | Fait dans le prototype pour juger l'effet ; à porter dans FUT-118 |

---

## 5. Recette (automatisée, pas un test utilisateur)

Outil : `outils/recette51.cjs` (Chrome, Playwright, requêtes externes bloquées). Résultats : `recette-v51.json`. Mêmes situations et mêmes noms de vues que la recette V5, pour comparer deux à deux.

| Volet | Résultat |
|---|---|
| Vues capturées | 78 (13 vues × 1 440 / 390 / 360 px × clair / sombre), aucun débordement horizontal, aucune erreur de console |
| Parcours vérifiés | 47 sur 47 : accueil, comparaison établie, comparaison inégale, communes, fiche non analysée, analyse ancienne, visite, analyse complète et ses échelles, ajout d'annonce (quatre situations), essai transmis à Mon Projet et retour |
| Vérité éditoriale | aucun « meilleur », « gagnant », « recommandé », « score », « au total » sur aucune vue ; aucune différence annoncée quand rien n'est établi ; chaque lecture communale garde son échelle ; une conclusion ancienne reste « écrite sous votre Projet d'alors » ; aucune image dans l'ajout d'annonce |
| Contraste | minimum mesuré **5,18** sur tous les textes visibles, clair et sombre, 1 440 et 390 px (seuil 4,5) |
| Clavier | 47 arrêts de tabulation sur deux écrans, tous avec un contour visible |
| Téléphone (390 et 360 px) | sélecteurs « À gauche / À droite » nommés, noms entiers, barre « Vous comparez » visible en descendant, changement de logement pris en compte |
| Mouvement réduit | aucune animation |
| Tests unitaires | 68 sur 68 (7 nouveaux pour la première lecture V5.1, dont un balayage de toutes les paires de la situation à dix logements) |
| Non-régression V5 | recette V5 rejouée : 65 sur 65 |

**Défaut trouvé par la recette, corrigé.** Le sélecteur de commune de l'ajout d'annonce était lu « Commune Choisir Nantes Rennes Angers » par un lecteur d'écran (le libellé enveloppait les options). Corrigé dans la V5.1 ; **le même motif existe dans la V5 et en production** (`v.champ`) : à signaler dans FUT-118.

**Un piège de méthode, noté pour la suite.** Écrire les captures dans le dépôt pendant la recette fait recharger le serveur de développement en pleine page (scripts tronqués, « Invalid or unexpected token » sur des vues au hasard). La recette s'exécute donc hors du dépôt, puis ses résultats y sont recopiés ; la version statique, contrôlée à part sur ses 26 vues, n'a aucune erreur.

**Ce que la recette ne prouve pas.** Qu'une personne comprend. Qu'un lecteur d'écran restitue bien l'ordre de lecture. Le rendu sur un vrai téléphone, Safari iOS compris.

---

## 6. Ajouter une annonce : ce qu'il faudrait pour la production

| Voie | Ce qu'elle permet | Condition |
|---|---|---|
| La personne colle le texte de l'annonce (existe en V5) | prix, surface, pièces proposés, à confirmer | aucune ; lu sur l'appareil |
| Un accord ou un flux d'un site d'annonces | valeurs et miniature | contrat ; licence d'affichage des images |
| Les métadonnées que la page publie elle-même pour le partage | titre, parfois une image | à faire valider juridiquement : conditions d'utilisation de chaque site, droit d'auteur des photos ; ne pas le supposer libre |
| La photo de la personne (capture, photo de visite) | une vignette | existe ; elle reste sur l'appareil |

Dans tous les cas : les valeurs restent « déclarées », la miniature n'est jamais remplacée par une image générique, et un lien illisible ne bloque rien.

---

## 7. Protocole de test avec des personnes

**Qui.** Trois à cinq personnes qui ne connaissent pas futur•e, dont au moins une peu habituée aux applications. Pas de membre de l'équipe.

**Comment.** 30 minutes, en présentiel ou en visio avec partage d'écran. La moitié commence par la V5, l'autre par la V5.1 (mêmes situations). On ne montre rien, on n'explique rien ; on demande de penser à voix haute. La personne a le droit de dire « je ne sais pas ».

**Consigne d'entrée.** « Vous cherchez à acheter un logement entre Nantes et Rennes. Voici l'outil où vous suivez votre recherche. »

| Tâche | Situation | Réussite sans aide si… |
|---|---|---|
| 1. Où en est cette recherche ? | `ref`, accueil | elle cite les deux communes, et qu'un seul logement est analysé |
| 2. Qu'est-ce qui différencie ces deux appartements ? | `arbitrage`, Comparer | elle cite le calme et la vie de quartier, chacun du bon côté, sans désigner de gagnant |
| 3. Que manque-t-il avant de décider ? | `ref`, Comparer à trois | elle cite l'analyse de la Convention ou l'adresse du Thabor |
| 4. Préparez votre visite du quai de la Fosse | `ref` | elle arrive aux questions de visite en moins de trois gestes |
| 5. Ajoutez cette annonce (lien donné) | `vide` | elle garde un logement avec un prix vérifié, et comprend qu'aucune image n'est récupérée |
| 6. Pourquoi l'analyse de Saint-Félix ne vaut-elle pas pour aujourd'hui ? | `ancien` | elle dit que l'analyse a été faite avec une autre limite pour la gare |

**Ce qu'on note.** Réussite sans aide (oui, avec hésitation, non). Le temps jusqu'au premier geste utile. Les erreurs d'interprétation, en particulier : croire qu'un logement est « meilleur » ; prendre une donnée de la commune pour celle du logement ; prendre un statut personnel pour un état de l'analyse. La reformulation en ses mots de « ce qui compte pour votre choix ».

**Questions de fin, ouvertes.** « Qu'est-ce qui vous a aidé ? » « À quel moment avez-vous hésité ? » « Qu'auriez-vous fait ensuite ? » Puis, en dernier seulement : « Laquelle des deux versions préférez-vous, et pourquoi ? »

Aucune recette automatisée ni simulation de persona ne remplace ce test.

---

## 8. Avis critique sur la V5.1

**Ce qui marche mieux.** La comparaison se lit en une fois : la plaque dit l'essentiel, les tableaux montrent les valeurs, le détail attend. La fiche d'un logement non analysé est plus honnête et plus courte. Les deux dimensions d'un logement se distinguent au premier regard. L'ajout d'une annonce part du geste réel.

**Ce qui ne marche pas encore.**

1. **La plaque « À retenir » reste textuelle.** Ses phrases viennent du modèle V5 ; elles sont exactes mais longues (« Pour les nuits fraîches l'été, qui comptent beaucoup pour vous : T4 rue de la Convention y répond dans le logement ; à vérifier pour T3 quai de la Fosse avant de trancher (deux questions prêtes pour la visite) »). Une personne âgée pourrait encore trouver cela dense. Piste : des phrases plus courtes, générées par le même modèle, à tester.
2. **Les noms des logements restent longs** et se répètent dans les phrases. Des noms courts (« quai de la Fosse ») aideraient, mais touchent toutes les phrases ; non fait.
3. **L'accueil n'a presque pas changé.** Il était déjà corrigé en V5 ; la ligne des deux dimensions l'allonge un peu.
4. **Mon Projet et la fiche commune** sont ceux de la V5 (à un libellé près) : ils n'ont pas reçu la même passe.
5. **Les tableaux de comparaison** gardent la structure V5 (couches, cellules partagées). Ils sont plus courts parce qu'ils sont triés, pas parce qu'ils sont plus simples.
6. **« Repéré » et les trois paliers** ne sont pas validés : ce sont des hypothèses.

---

## 9. Fichiers

| Quoi | Où |
|---|---|
| Prototype V5.1 (code) | `src/components/prototypes/fut41-v51/` : `lecture51.ts` (première lecture, sans règle nouvelle), `communs51.tsx` (grammaire), `vues51/` (accueil, Comparer, fiche, analyse, fiche commune), `Ajout51.tsx`, `v51.module.css` |
| Route de développement | `/dev/centre-decision-v51` (404 en production) ; chaque écran a « Voir cette situation en V5 » |
| Tests | `fut41-v51/lecture51.test.ts` (7) |
| Recette | `outils/recette51.cjs`, `recette-v51.json`, captures `captures-v51/` |
| Avant / après | `avant-apres-v51/` : 5 écrans × 1 440 / 390 px × clair / sombre (20 planches), V5 à gauche, V5.1 à droite |
| Version statique | `prototype-v51/` (`outils/statique/construire.sh v51`) |
| V5 | inchangée dans son comportement ; cinq blocs exportés pour être réutilisés, une option `sansVerdict` ajoutée à la confrontation (sans effet sur la V5), un libellé « Lu sous… » devenu « Étudié sous… » |
