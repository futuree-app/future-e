# FUT-50 · Version C affinée : trois états, une porte pour l'adresse, la place du Dossier Adresse

14 octobre 2026 · branche `feat/fut-50-accueil-decision` · **prototype seulement : aucun fichier de production modifié.**

Ce document complète `2026-10-14-fut50-version-c.md`. Il applique les décisions du 14 octobre (FUT-50, FUT-56, FUT-14).

À voir en local :

| Page | Adresse |
| --- | --- |
| Accueil C affiné, pastilles recommandées | `/dev/fut50/c` |
| Composition de comparaison, avec la mobilité | `/dev/fut50/c?pastilles=mobilite` |
| Storyboard du film du dossier | `/dev/fut50/storyboard` |

En production, ces trois pages et la route de lecture renvoient une page introuvable (vérifié).

Captures : `docs/audits/fut50-accueil/images/c2-*.jpg`. Vidéo du hero : `docs/audits/fut50-accueil/videos/c2-hero-commune-et-priorites.mp4`.

---

## 1. Le hero en trois états

| État | Ce qui s'affiche | Ce qui ne s'affiche jamais | Capture |
| --- | --- | --- | --- |
| **A · vierge** | Titre « Regardez une commune avec ce qui compte pour vous. », promesse courte, champ « Quelle commune vous intéresse ? », « Par exemple Nantes · Annecy · Guéret », porte « Vous avez déjà une adresse précise ? Examiner cette adresse » | aucun résultat, aucun exemple, rien à droite | `c2-etat-a-vierge-{1440,390,360}` |
| **B · commune** | Une coche se trace devant la commune, « Changer de commune », « Qu'est-ce qui compte pour vous ? », quatre priorités, « Choisissez-en une pour voir ce que disent les données. Rien n'est enregistré. » | aucun résultat, ni de cette commune, ni d'une autre ; aucun panneau vide | `c2-etat-b-commune-*` |
| **C · priorité** | Une seule lecture de la commune choisie : « Ce que disent les données » (avec source, horizon et grain), « Pour cette priorité », « Ce qu'il reste à vérifier », puis « Examiner une adresse à … » et « Décrire tout mon projet » | une lecture d'une autre commune | `c2-etat-c-priorite-*` |

**Composition sur ordinateur.**
- Le titre occupe toute la largeur. Dessous, la recherche et les priorités sont à gauche.
- La colonne de droite n'existe qu'à l'état C. Aux états A et B, elle reste vide : rien ne la remplit artificiellement.

**Sur mobile**, le premier écran montre le titre, la promesse et le champ. La porte de l'adresse arrive juste en dessous.

**Comportements vérifiés dans le parcours réel :**
- désélectionner la priorité retire la lecture (retour à l'état B) ;
- changer de commune efface toute lecture de la précédente : d'Annecy à Guéret, seule Guéret est lue ;
- les priorités cochées restent cochées, et leur lecture se refait pour la nouvelle commune.

---

## 2. Commune d'abord, adresse à part

- **Le champ principal ne cherche que des communes.** Il reprend l'autocomplétion de l'accueil actuel : géocodeur officiel, filtre « commune », codes INSEE, aide Paris / Lyon / Marseille. Un test interdit toute recherche d'adresse dans ce champ.
- **La porte de l'adresse est une ligne, sous la recherche** : « Vous avez déjà une adresse précise ? Examiner cette adresse », vers `/dossier`. C'est là que le parcours explique le périmètre et le prix. Testé : le clic mène bien à `/dossier`.
- **Aucun avertissement méthodologique.** C'est la séparation des deux gestes qui porte le sens.

---

## 3. Les quatre pastilles : recommandation

Le moteur a été interrogé sur un panel de 20 communes : Sète, Nîmes, Nice, Marseille, Nantes, Rennes, Brest, Vannes, Lille, Strasbourg, Annecy, Rodez, Guéret, Ahun, Albaret-le-Comtal, Allanche, Ageville, et d'autres.

| Pastille | Source | Ce qu'elle dit | Verdict |
| --- | --- | --- | --- |
| **Éviter les fortes chaleurs** | moteur + DRIAS | Défavorable : la trajectoire des jours chauds et des nuits tropicales, avec sa limite. Favorable : le nombre de jours au-dessus de 35 °C et « rien de défavorable n'apparaît ». | Gardée |
| **Avoir des hivers doux** *(nouvelle)* | moteur + DRIAS | La température moyenne de l'hiver (1976-2005), puis la position parmi les communes de France, avec la limite du moteur. Nantes : 5,8 °C, parmi les 20 % aux hivers les plus doux. Annecy : 1,1 °C, parmi les 10 % les moins doux. Lille : sans position marquée. | **Remplace « sans voiture »** |
| **Vivre dans une petite ville** *(reformulée)* | moteur, convention de taille | La population, dite simplement : « Environ 13 901 habitants dans l'agglomération de Guéret. » Puis la convention en clair, tirée des seuils du moteur : moins de 25 000 (petite ville), entre 25 000 et 100 000 (ville moyenne), plus de 100 000 (pas une petite ville). | Remplace « ville à taille humaine », trop subjectif |
| **Connaître les risques naturels** | Géorisques | La liste des risques recensés pour la commune entière, comme une **information**, jamais « favorable » ni « défavorable » | Gardée |

**Comparaison des deux compositions** (voir aussi `c2-composition-mobilite-1440.jpg`) :

| Critère | Recommandée (chaleur, hivers, petite ville, risques) | Avec la mobilité (chaleur, petite ville, sans voiture, risques) |
| --- | --- | --- |
| Compréhension | quatre questions simples, quatre réponses de même nature | la mobilité répond « Se lit à l'adresse » : utile pour comprendre les échelles, déroutante en première interaction |
| Utilité immédiate | chaque pastille donne un fait de la commune choisie | une pastille sur quatre ne donne aucun fait |
| Fidélité | quatre lectures réelles, vérifiées sur le panel | fidèle aussi, mais par un renvoi |

**Recommandation : la composition recommandée.** La mobilité garde sa place, mais dans la promesse du Dossier Adresse : « Autour de l'adresse », section Dossier et offres. C'est là qu'elle se mesure vraiment, et la porte « Examiner cette adresse » y mène.

**Écartées** :
- **services à proximité** : muet pour toutes les villes testées ;
- **trajectoire démographique** : fiable, mais un jugement « favorable » sur la croissance de la population est délicat pour une première interaction.

**Garanties** : aucune priorité présélectionnée, aucune génération IA (testé), rien n'est enregistré.

**Une phrase du moteur adaptée.** Il dit « concilier avec votre projet ». Sur l'accueil, la phrase devient « avec cette priorité », car aucun Projet n'est enregistré.

---

## 4. La place du Dossier Adresse

**Emplacement** : juste après « Trois échelles, de la commune à vos murs. », avant les offres. Ancre `#dossier-adresse`.

**Composition** (`c2-section-dossier-{1440,390}.jpg`) :

| Élément | Contenu |
| --- | --- |
| Titre | « Et à une adresse précise, qu'est-ce que ça change ? » |
| Chapô | « Le dossier d'adresse relie la commune, le voisinage et le logement à votre projet : ce qui correspond, ce qui coince, et ce qu'il faut vérifier avant de signer. » |
| Sur ordinateur, à gauche | le film, en 16:10 |
| Sur ordinateur, à droite | les quatre étapes en texte, qui sont aussi les sous-titres, puis le bouton « Ouvrir un dossier d'adresse · 39 € » |
| Sur mobile | le film en 4:5, les étapes dessous |
| Lien différé | « Voir un exemple de dossier » apparaîtra quand FUT-56 et FUT-14 seront livrés (`EXEMPLE_DOSSIER_URL`, nul aujourd'hui) |

**Aucun faux contenu.**
- **Dans le prototype**, le film est remplacé par un **repère de conception** : le cadre du plan 3, en formes grises, marqué « maquette · sans données », avec une note qui le dit et renvoie au storyboard.
- **Dans l'accueil public**, la section **n'existe pas** tant que `FILM_DOSSIER` est nul. Un test le vérifie, et vérifie aussi qu'aucun cadre ne contient de valeur.

### Le storyboard (`/dev/fut50/storyboard`, `c2-storyboard-*-page.jpg`)

| Plan | Temps | Ce que l'on comprend | Transition (grammaire FUT-75) | À lire dans la fixture FUT-56 |
| --- | --- | --- | --- | --- |
| 1 · Une adresse, un projet | 0–4 s | Le dossier porte sur une adresse précise et les priorités d'un projet | Arrivée sans déplacement (fondu, flou de 2 px, 180 ms) ; les priorités se posent une à une | commune de démonstration (adresse masquée) ; 2 à 4 priorités ; relation au lieu et objectif (FUT-10) |
| 2 · Trois échelles | 4–9 s | futur•e lit la commune, le voisinage, le logement | L'emblème se resserre du cercle au carré puis au losange, 240 ms par palier ; un fait arrive à côté de chaque glyphe | 1 fait Territoire (source, horizon) ; 1 fait Autour (distance depuis l'adresse) ; 1 fait Logement (diagnostic ou risque du bâti, daté) ; grains réels |
| 3 · Des faits à une lecture | 9–16 s | Les faits se rangent face au projet : correspond, correspond moins bien, arbitrage | Les faits glissent vers leur section (le repère bouge, la donnée reste) ; le verdict arrive ensuite, sans révélation magique | sections et ordre réels ; libellé et phrase du verdict ; au moins un compromis ou un écart, avec sa limite |
| 4 · Ce qu'il reste à vérifier | 16–20 s | Le dossier finit sur les vérifications avant de signer | Les gestes s'inscrivent ligne à ligne ; coche tracée en 260 ms | 1 ou 2 gestes prioritaires ; 1 limite ou inconnue visible |
| 5 · Le dossier d'adresse | 20–22 s | 39 €, ou 25 € après un dossier de territoire | Plan fixe ; arrêt sur ce cadre, avec « Revoir » | prix en vigueur ; lien vers l'exemple complet |

### La solution technique retenue (`FilmDossier.tsx`, prête)

**Production du film.**
- **Tournage** : une route de développement met en scène les **vrais composants « Le relevé »**, nourris par la fixture FUT-56. Playwright l'enregistre, ffmpeg l'encode, comme les vidéos d'audit de FUT-75 et de FUT-50. Aucune donnée n'est retouchée au montage.
- **Fichiers** : une vidéo native muette (H.264, 1280 px, environ 1,5 Mo), une version verticale 4:5 pour mobile, un poster, et des sous-titres WebVTT tirés des messages des plans.

**Comportement du lecteur.**
- **Chargement différé** : `preload="none"`, et la source n'est posée qu'à l'approche du champ de vision.
- **Lecture automatique encadrée** : muette, seulement quand la moitié du film est visible, et jamais en mouvement réduit. Pause dès qu'il sort du champ. Pas de boucle : il s'arrête sur son dernier plan.
- **Contrôles** : « Lire », « Pause », « Revoir ».
- **Sans regarder la vidéo** : les quatre étapes restent lisibles en texte à côté.
- **Mouvement réduit** : le poster et le texte, sans lecture automatique.

**Pourquoi une vidéo plutôt qu'une animation en direct dans la page** : poids et rendu prévisibles sur mobile, aucun calcul pendant la lecture. Et puisqu'elle est tournée à partir des composants réels, elle ne peut pas montrer ce que le dossier ne montre pas.

---

## 5. Finitions des autres sections

- **Pourquoi futur•e** : une phrase ajoutée sous le titre, sans second manifeste : « Une annonce décrit un bien. Elle dit peu de choses de ce qui l'entoure, de ce que deviendra le lieu, et de ce qu'il faut vérifier avant de signer. » Photographie, deux paragraphes existants et triptyque inchangés.
- **Trois échelles** : inchangées.
- **Offres** : prix et structure inchangés.
  - « Chercher un lieu » devient **« Chercher une commune »**. Son ancre `#lieu` ne visait plus rien après la refonte du hero : défaut trouvé et corrigé, un test vérifie désormais chaque ancre interne.
  - Emplacement prêt pour « Voir un exemple de dossier » sous le Dossier d'adresse (masqué jusqu'à FUT-56).
  - Le comparatif reste à revérifier avec FUT-32.
- **Savoir** : inchangé. Les trois hubs, l'ancre `#savoir`, et la liste `ETUDES_LOCALES_PUBLIEES` vide (aucune étude en préparation affichée).
- **« Vos questions sur votre commune »** : la logique métier reste entière dans `FutureELanding.tsx`, `lib/accueil/reponses.ts` et `qna.ts`. Ce que l'intégration devra faire, explicitement :
  1. **La réponse IA (`/qna`)** : une par session, contrôlée par `qna.ts`. Proposition : la garder, mais seulement derrière un geste explicite (« Poser une question sur cette commune »), jamais sur une pastille.
  2. **Le repli sans IA (`reponseDeRepli`)** : réutilisable tel quel. Les phrases chaleur et « se lit à l'adresse » en viennent déjà.
  3. **La question libre** : à conserver avec la réponse IA, au même endroit.

  **Emplacement proposé** : les pages de commune (`/chaleur/[insee]`, `/inondation/[insee]`), ou sous la lecture de l'accueil, derrière un lien discret. **Rien n'est supprimé** dans le code de production ; la décision est à prendre avant l'intégration.

---

## 6. Revue : appels à l'action, accessibilité, temps de réponse, erreurs

**Appels à l'action de la page**, tous vérifiés vers une route existante (test) :

| Où | Libellé | Destination |
| --- | --- | --- |
| Hero, action principale | champ « Quelle commune vous intéresse ? » | lecture sur place |
| Hero | « Examiner cette adresse » | `/dossier` |
| Lecture | « Examiner une adresse à … » (orange) · « Décrire tout mon projet » | `/dossier` · `/ou-vivre` |
| Pourquoi | « Pourquoi futur•e existe » | `/pourquoi` |
| Dossier Adresse | « Ouvrir un dossier d'adresse · 39 € » (orange) | `/dossier` |
| Offres | « Chercher une commune » · « Ouvrir un dossier de territoire · 14 € » · « Ouvrir un dossier d'adresse · 39 € » · « Comparer trois territoires » | `#lieu` · `/checkout/rapport-complet` · `/dossier` · `/ou-vivre` |
| Savoir | trois hubs, trois guides ou articles, trois liens « Aussi à lire » | hubs, `/agir/*`, `/savoir/*` |

Le haut de page n'a **qu'une** action principale : la recherche de commune. L'orange n'apparaît qu'après une lecture, et dans la section Dossier.

**Accessibilité :**
- champ en combobox ARIA (`listbox`, `aria-activedescendant`, flèches, Entrée, Échap) ;
- pastilles en `button aria-pressed` ;
- lecture annoncée (`aria-live`), chargement en `role="status"`, erreur en `role="alert"` ;
- focus visible ; au clavier, le champ s'atteint en 15 tabulations (menu et bandeau du prototype), la première priorité 2 tabulations après la commune ;
- mouvement réduit : 0 animation en cours après interaction ;
- aucun débordement horizontal à 1440, 390 et 360 px.

**Temps de réponse**, mesurés sur le serveur de développement :

| Situation | Temps |
| --- | --- |
| Lecture une fois les données chargées | 50 à 150 ms |
| **Première lecture à froid** | **2,5 à 3,3 s** |
| Recherche de commune | 250 ms de délai de frappe, puis le géocodeur |

Avant publication, il faudra une route publique mise en cache par commune et par pastille, et un préchauffage.

**États d'erreur :**
- géocodeur indisponible : « La recherche ne répond pas pour le moment. Réessayez dans un instant. » ;
- commune introuvable : « Aucune commune trouvée. Vérifiez l'orthographe. » ;
- lecture en échec : « La lecture n'a pas pu être chargée. » et un bouton « Réessayer » (`c2-erreur-lecture-1440.jpg`) ;
- donnée absente : « Une donnée absente n'est jamais une bonne nouvelle. » ;
- Géorisques muet : « Une absence de réponse ne dit pas qu'il n'y a pas de risque. »

---

## 7. Ce qui reste à valider avant l'intégration réelle

1. **La composition des pastilles** (§ 3) : la recommandée, ou celle avec la mobilité.
2. **Le libellé « Avoir des hivers doux »** et la phrase de convention « au sens de futur•e », à relire par l'Editorial Writer.
3. **« Vos questions sur votre commune »** : où déplacer la réponse IA et la question libre (§ 5).
4. **La route publique de lecture** : cache, préchauffage, et panel de communes rejoué avant mise en ligne.
5. **Le pré-remplissage `/dossier?adresse=`** : utile dès que l'adresse aura un champ sur l'accueil. Aujourd'hui, la porte mène au parcours, qui demande l'adresse lui-même.
6. **FUT-56** : choix et validation du dossier exemple. Ensuite seulement : tournage du film, activation de la section et du lien « Voir un exemple de dossier ».
7. **Le comparatif à 39 €** : texte à revérifier avec FUT-32.

---

## Annexe technique

**Fichiers ajoutés ou modifiés** (tous des prototypes, sous `src/components/prototypes/fut50/c/` et `src/app/dev/fut50/`) :

| Fichier | Rôle |
| --- | --- |
| `HeroLieu.tsx` | Trois états, commune seule, porte adresse, erreurs avec « Réessayer » |
| `pastilles.ts` | Deux compositions, pastilles hivers et petite ville, convention de taille lue dans le moteur |
| `PlansDossier.tsx` | Storyboard (`PLANS`) et cadres de maquette sans données |
| `FilmDossier.tsx` | Lecteur du futur film : différé, pause hors champ, contrôles, mouvement réduit, sous-titres |
| `SectionsC.tsx` | Section Dossier Adresse (absente sans film hors prototype), phrase Pourquoi, emplacement de l'exemple |
| `src/app/dev/fut50/c/page.tsx` | Prend `?pastilles=mobilite` |
| `src/app/dev/fut50/storyboard/page.tsx` | Storyboard (404 en production) |
| `src/app/dev/fut50/api/lecture/route.ts` | Lecture « hivers » (moteur + DRIAS) |
| `scripts/fut50/interactions-c.mjs` | Trois états, trois largeurs, changement de commune, composition, porte adresse, erreur, clavier, mouvement réduit, storyboard, vidéo |

**Vérifications du 14/10/2026 :**

- **Tests** :
  - suite complète : 2 577/2 577 ;
  - tests FUT-50 : 22/22, dont 16 propres à C.
- **Qualité du code** : `tsc` et `eslint` sans erreur ni avertissement.
- **Build de production** : `next build --webpack` réussi (290 pages).
- **Comportement en production** (`next start`) :
  - `/dev/fut50/c`, `/dev/fut50/storyboard` et `/dev/fut50/api/lecture` renvoient 404 ;
  - `/`, `/dossier`, `/ou-vivre` et `/checkout/rapport-complet` renvoient 200.
