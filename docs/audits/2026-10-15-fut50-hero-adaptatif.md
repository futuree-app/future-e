# FUT-50 · Hero adaptatif et passe éditoriale

15 octobre 2026 · branche `feat/fut-50-accueil-decision` · **prototype seulement : aucun fichier de production modifié.**

À voir sur `/dev/fut50/c` en local (`npm run dev`). Captures `docs/audits/fut50-accueil/images/c3-*.jpg`, vidéo `docs/audits/fut50-accueil/videos/c3-hero-adaptatif.mp4`.

**Note de séquence.** Le brief part de `61629561`. La branche était à `c27356ef`, où la lecture avait été alignée sur le titre à la demande du 15/10 au matin. Ce passage la remplace : composition centrée aux états 1 et 2, deux colonnes à l'état 3 seulement. Rien n'a été perdu : A, B, C et C affinée restent dans l'historique.

---

## 1. Les trois états et la transition

| État | Ordinateur | Mobile |
| --- | --- | --- |
| **1 · arrivée** | Un bloc de 560 px centré dans toute la largeur : titre, promesse, champ, « Par exemple Nantes · Annecy · Guéret », porte de l'adresse. Aucun panneau, aucun espace réservé. | Vertical, le champ dans le premier écran |
| **2 · commune** | Même bloc, toujours centré : coche, « Changer de commune », « À quoi tenez-vous ? », quatre priorités | Vertical |
| **3 · priorité** | La grille s'ouvre en deux colonnes : le même bloc glisse à gauche, la planche de lecture se déploie à droite | La lecture s'affiche sous les priorités, amenée en vue en douceur si besoin |

### Comment fonctionne le geste (CSS seul, aucune dépendance)

1. **Une seule grille, toujours deux colonnes.** Aux états 1 et 2 : `minmax(0, 1fr) minmax(0, 0fr)`, donc la seconde colonne ne mesure rien. À l'état 3 : `minmax(0, 1fr) minmax(0, 0.85fr)`. Les deux formes restent en `fr`, ce qui permet au navigateur d'interpoler la grille : transition de 420 ms, courbe `--m-releve` de FUT-75.
2. **Le même bloc, jamais recréé.** Le bloc de recherche garde sa largeur (560 px) et reste centré dans sa colonne. Quand la colonne se resserre, il glisse naturellement vers la gauche. Aucun texte ne se recompose.
3. **La planche se déploie** (inspiration Prompt Motion, « shape morphing through UI states », traduite dans FUT-75) :
   - **à 280 ms** : la planche s'ouvre depuis son bord gauche, dans le sens de la colonne qui s'ouvre (découpage animé, micro-ressort, environ 2 % de dépassement au plus) ;
   - **de 420 à 620 ms** : le contenu arrive dans l'ordre où il se lit (titre, donnée, lecture, vérification, suite), en fondu sans déplacement, 50 ms d'écart ;
   - **à 640 ms** : les deux repères de coin de la planche se posent.
4. **Une seule fois.** L'ouverture ne se joue qu'à l'entrée dans l'état 3. Changer ensuite de priorité ne renouvelle que le contenu (180 ms). Désélectionner referme la grille dans l'autre sens.
5. **Mouvement réduit** : aucune transition ni animation, le changement est immédiat (mesuré : 0 animation en cours).

**Écarté** : faire « devenir » la pastille cliquée la planche de lecture. Le trajet traverse la page et n'apporte rien à la compréhension.

**Aucune valeur n'est animée.** Le chiffre arrive entier, comme le reste du texte.

### Mesuré dans le navigateur (Chromium, 1440 × 900)

| Contrôle | Résultat |
| --- | --- |
| Position verticale du titre, état 2 → 3 | 173 → 173 px : **aucun saut** |
| Position du champ, état 2 → 3 | 489 → 247 px : glissement horizontal, **même élément** avant et après |
| Focus après le clic | reste sur « Avoir des hivers doux » |
| Désélection | le champ revient à 489 px (centré) |
| « Changer de commune » | retour à l'état 1, focus dans le champ, priorités retirées |
| Décalage de mise en page cumulé (CLS) | 0,025 sur tout le parcours (seuil « bon » : 0,1) |
| Débordement horizontal | 0 px à 1440, 390 et 360 px, dans les trois états |

**Images du geste** : `c3-transition-{120,300,480,700}ms-1440.jpg`, avec des décalages de 50 à 100 ms dus au temps de capture. Elles montrent le bloc qui glisse, la planche qui s'ouvre depuis son bord, puis le contenu dans l'ordre.

---

## 2. Réécriture éditoriale (accueil seulement)

**Principe** : alterner questions, phrases nominales et affirmations courtes, et nommer les choses (chaleur, hivers, quartier, bâti) plutôt que la méthode. La signature « Ce que nous savons. Ce que cela change pour vous. Ce qu'il reste à vérifier. » est **gardée telle quelle**. Le paragraphe juste au-dessus ne l'imite plus.

### Haut de page

| Avant | Après |
| --- | --- |
| Regardez une commune avec ce qui compte pour vous. | **Une commune en tête ? Voyez-la à travers vos priorités.** |
| Choisissez une commune, puis ce qui vous importe : futur•e vous montre ce que disent les données publiques, et ce qu'il reste à vérifier. | Chaleur, hivers, taille de la ville, risques naturels : choisissez une priorité, et les données publiques de la commune prennent un sens, limites comprises. |
| Qu'est-ce qui compte pour vous ? | À quoi tenez-vous ? |
| Choisissez-en une pour voir ce que disent les données. Rien n'est enregistré. | Choisissez-en une : la lecture s'affiche aussitôt. Rien n'est enregistré. |

### Lecture

| Avant | Après |
| --- | --- |
| Ce que disent les données | **À Nantes** (ou « Agglomération de Guéret » quand la mesure porte sur l'agglomération) |
| Pour cette priorité | Pour votre priorité |
| Ce qu'il reste à vérifier | À vérifier |

### Pourquoi futur•e

| Avant | Après |
| --- | --- |
| Une annonce décrit un bien. Elle dit peu de choses de ce qui l'entoure, de ce que deviendra le lieu, et de ce qu'il faut vérifier avant de signer. | Une annonce décrit un bien. Rarement ses alentours, l'avenir du lieu, ou les vérifications à faire avant de signer. |
| futur•e rassemble ce qui est connu, rend visibles les angles morts et vous aide à savoir ce qu'il reste à vérifier avant de vous engager. | futur•e rassemble les données connues, éclaire les angles morts et vous aide à préparer les vérifications avant de vous engager. |

### Trois échelles

| Avant | Après |
| --- | --- |
| Territoire : Ce qui structure la vie ici et ce qui la transforme : les services, la population, la nature, et la trajectoire du climat. | Services, population, nature et climat : le portrait d'une commune, et la façon dont elle change. |
| Autour : Ce qui se trouve à proximité, ce qui manque, et ce qui distingue ce secteur du reste de la commune. | Commerces, école, santé, transports, espaces verts : le quotidien à quelques minutes de la porte. |
| Logement : Ce que son diagnostic établit, ce à quoi son adresse l'expose, et ce qu'il reste à demander avant de signer. | Diagnostic, exposition du bâti, sol de la parcelle : le bien lui-même, et les questions à poser avant de signer. |
| …, et un bon quartier ne fait pas un bon logement. | …, ni un bon quartier un bon logement. |

### Dossier Adresse

| Avant | Après |
| --- | --- |
| Et à une adresse précise, qu'est-ce que ça change ? | **Et pour votre adresse ?** |
| … : ce qui correspond, ce qui coince, et ce qu'il faut vérifier avant de signer. | … Il dit où cela correspond, où cela coince, et quoi vérifier avant de signer. |
| Étape 1 : Le dossier porte sur une adresse précise et sur les priorités d'un projet. | Un lieu précis, et les priorités qui comptent pour vous. |
| Étape 2 : futur•e lit la commune, puis le voisinage de l'adresse, puis le logement. | La commune, puis le voisinage, puis le logement. |
| Étape 3 : Les faits se rangent face au projet : ce qui correspond, ce qui correspond moins bien, l'arbitrage. | Chaque fait trouve sa place face au projet : il correspond, il coince, ou il demande un arbitrage. |
| Étape 4 : Ce qu'il reste à vérifier. Le dossier se termine par les vérifications à faire avant de signer. | **Avant de signer.** Les vérifications utiles, dans l'ordre où les mener. |

### Savoir

| Avant | Après |
| --- | --- |
| Des articles et des guides gratuits, fondés sur des données publiques, pour savoir quoi regarder dans votre décision. | Articles et guides gratuits, sourcés, pour savoir où porter le regard avant de décider. |

**Restent volontairement inchangés :**
- les intitulés réels du dossier reproduits dans la maquette (« Ce qui correspond à votre projet », « Ce qui correspond moins bien ») : ce sont les mots du produit vendu ;
- les phrases écrites par le moteur dans les lectures.

---

## 3. La donnée principale mise en avant

Quand une mesure pertinente existe, la lecture la montre en grand, **jamais seule** : la valeur, son unité, puis une légende avec son libellé, sa période et son contexte. La phrase complète reste lue par les lecteurs d'écran. Toutes les priorités n'ont pas de mesure ; aucune n'est forcée dans ce gabarit.

| Priorité | Mesure en grand | Légende | Sans mesure quand… |
| --- | --- | --- | --- |
| Hivers doux | **5,8 °C** | température moyenne de l'hiver (décembre à février), période de référence 1976-2005 | la donnée DRIAS est absente |
| Petite ville | **677 080 habitants** | dans l'agglomération de Nantes (ou « à X » pour une population communale) | la population est absente |
| Fortes chaleurs, lecture favorable | **4 jours par an** | au-dessus de 35 °C à l'horizon 2050 (+2,7 °C en France), contre moins d'une journée sur 1976-2005 | moins d'un jour par an : un grand « 0 » se lirait comme une absence de chaleur |
| Fortes chaleurs, lecture défavorable | non | la phrase du moteur porte déjà deux trajectoires (jours et nuits) : en extraire un chiffre en isolerait un seul | toujours |
| Risques naturels | non | une liste de risques recensés n'est pas une valeur | toujours |

**Les sources restent sous la donnée** (« à l'échelle de la commune · DRIAS · Météo-France… »). **Aucune valeur n'est calculée** pour l'affichage : toutes viennent du moteur ou des fonctions existantes de l'accueil (`formatTemperature`, `formatCompte`).

---

## 4. Vérifications

| Contrôle | Résultat |
| --- | --- |
| 1. Ordinateur, état vierge | bloc centré, aucun panneau ni espace réservé (`c3-etat-a-vierge-1440`) |
| 2. Ordinateur, commune choisie | toujours centré, aucune lecture (`c3-etat-b-commune-1440`) |
| 3. Ordinateur, priorité choisie | ouverture en deux colonnes, bande d'images `c3-transition-*`, état final `c3-etat-c-priorite-1440` |
| 4. Changement de priorité | contenu renouvelé sans rejouer l'ouverture (`c3-changement-priorite-1440`) |
| 5. Changement ou suppression de commune | désélection : retour au centre ; « Changer de commune » : retour à l'état 1, focus dans le champ ; aucune lecture de l'ancienne commune ne subsiste (`c3-changement-commune-1440`) |
| 6. Mobile 390 et 360 | vertical dans les trois états, aucun débordement (`c3-etat-{a,b,c}-*-{390,360}`) |
| 7. Clavier, focus, lecteurs d'écran | champ en combobox ARIA (flèches, Entrée, Échap), priorités en `aria-pressed`, lecture en `aria-live`, erreur en `role="alert"`. Focus conservé pendant le geste, focus visible partout. Le champ s'atteint en 15 tabulations (menu et bandeau du prototype). |
| 8. Mouvement réduit | 0 animation en cours après interaction |
| 9. Chargement, indisponibilité, erreur | ligne d'état de chargement ; erreur simulée (réponse 500) : « La lecture n'a pas pu être chargée. » et « Réessayer » ; données absentes : textes d'indisponibilité testés |
| 10. Moteur et parcours | suite complète au vert (voir ci-dessous), porte « Examiner cette adresse » vers `/dossier` |

**Tests et build :**
- tests FUT-50 : 24/24, dont la mesure (présente, absente, jamais un « 0 ») et le hero (une seule grille, un seul champ, rien en mouvement réduit) ;
- suite complète : 2 579/2 579 ;
- `tsc` et `eslint` : sans erreur ;
- build de production : `next build --webpack` réussi (290 pages) ;
- en production, `/dev/fut50/c`, `/dev/fut50/storyboard` et `/dev/fut50/api/lecture` renvoient 404 ; `/`, `/dossier` et `/ou-vivre` renvoient 200.

**Non testé :**
- **Safari / WebKit et Firefox** : la transition de `grid-template-columns` y est prise en charge selon la documentation, mais seul Chromium est installé ici. Sans interpolation, le changement serait simplement immédiat, comme en mouvement réduit.
- **Un vrai lecteur d'écran** (VoiceOver, NVDA) : la structure ARIA a été vérifiée, pas l'écoute réelle.
- **Des appareils mobiles réels et le tactile** : seules les largeurs ont été émulées.

## 5. Limites techniques

- **La première lecture d'une commune peut prendre 2,5 à 7 s** sur le serveur de développement ; ensuite, 70 à 270 ms. Analyse séparée : `2026-10-15-fut50-lecture-performance.md`.
- **Animer la grille recalcule la mise en page à chaque image pendant 420 ms**, sur une zone limitée au hero. Le décalage mesuré reste bon (CLS 0,025). Sur un appareil très lent, le geste pourrait perdre des images sans bloquer la lecture.
