# Passation — journée du 25/07 : faux positifs fermés, la MINUTE devient une sélection, six sources sous contrat

**Horodatage** : 2026-07-25 (fin de session) · **Branche** : `main` = `d6a5335` (poussé, 24 commits depuis
la dernière passation). **Tree propre** côté code : deux non suivis à NE JAMAIS committer —
`Futur.e Design System.zip` et `src/app/dev/` (les harnais, voir plus bas).

**864 tests · tsc 0 · lint propre sur les fichiers touchés.**

---

## 1. CE QUI DÉCLENCHE TOUT : un dossier ouvert au bon moment

Le porteur ouvre Lège-Cap-Ferret **pendant que la commune brûle**, sur un projet qui demande d'être
« à l'abri des risques d'incendie ». Le dossier affiche **« Bonne correspondance »**. Douze correctifs
en sont sortis, tous de la même famille :

> **Le moteur était exact localement, et le dossier devenait faux par COMPOSITION.**

Aucun fait n'était mal calculé. C'est leur assemblage qui mentait — une preuve attachée au mauvais
constat, une intro de section qui requalifiait, un verdict qui niait la carte du dessous, une sortie
précoce qui rendait une branche inatteignable. **Aucun des ~800 tests ne pouvait le voir.**

### Les bugs de données (les plus graves, silencieux depuis des mois)
- `flags.wildfire` cherchait « feux de foret » AU PLURIEL ; GASPAR écrit « Feu de forêt » au SINGULIER.
  Le drapeau valait `false` **pour toutes les communes de France** (`5674613`).
- `eaufrance` lisait `libelle_observation` ; le champ Hub'Eau s'appelle `libelle_ecoulement`. `isDry`
  valait toujours faux : **un cours d'eau à sec n'a jamais pu être signalé** (`d40cb1f`).

Même signature : une valeur d'API jamais confrontée à la source, et une logique enfermée dans un module
`server-only` donc intestable. Même correction : extraire la fonction pure, figer le corpus réel, tester.

### Le feu, de bout en bout
`risquesDeclares` entre dans le socle (`498a66b`) ; le risque recensé devient un **mismatch** avec un
fondement propre `declared_hazard` (`ee13539`) ; il reste **visible à poids 1** en `secondary`, sans
réécrire le verdict (`8b15f5e`) ; le **boisement** (≥ 70 % = 9,4 % des communes) interdit de conclure
« satisfait » là où l'État n'a rien recensé, sans jamais affirmer un risque (`47d40a8`).

---

## 2. « EN UNE MINUTE » EST DEVENU UNE SÉLECTION (`4bbbac0`, `b9138cb`)

C'était un dossier RACCOURCI : six plafonds par section (2+3+3+3+3+4), chaque rubrique optimisant son
volume sans regarder le total. Le bloc grossissait donc avec le nombre de priorités déclarées —
**mesuré : 3 minutes pour un projet à 15 critères contre 81 s pour un projet à 2**. Celui qui avait le
plus réfléchi à ce qu'il cherchait était le plus mal servi.

Désormais : **plafond GLOBAL de 4 cartes**, tri LEXICOGRAPHIQUE (jamais un score — chaque inclusion se
raconte en une phrase), une **place réservée au contrepoids** quand le dossier arbitre.

**Mesuré à l'écran, projet à 15 priorités : 87-95 s** (contre 116-181 avant).

- **Ce qui ne trie PAS** : la matérialité et le lien à une priorité sont d'excellents critères
  d'ÉLIGIBILITÉ mais de mauvais critères de SÉLECTION — sur un projet riche, tous les faits sont
  `structuring` ET rattachés à une priorité. Ils s'aplatissent là où on en aurait besoin.
- **Le rôle se lit PAR RAPPORT À L'ORIENTATION** : dans un dossier favorable les correspondances
  FONDENT le verdict (3 places) ; ailleurs, une seule.
- **La sélection vit dans le PLAN**, pas dans la vue : le verdict en dépend (il annonce le nombre de
  contrôles visibles). Circularité levée par **deux passes** — un premier verdict dont seul le héros est
  retenu, la sélection, puis le verdict définitif avec son périmètre.
- Le détail dit les **deux périmètres** : « Un constat reste par ailleurs à contrôler. Un autre constat
  figure dans le dossier complet. »

**« En une minute » reste le nom** — décision du porteur : c'est un titre éditorial, pas un chronomètre,
et 1 min 45 est la borne. Ne pas rouvrir.

---

## 3. LES CONTRATS DE DONNÉES EXTERNES (`d40cb1f`, `d6a5335`)

`src/lib/fixtures-sources-externes.ts` fige des valeurs **OBSERVÉES**, recopiées telles que les sources
les renvoient. **Toute valeur ajoutée doit avoir été relevée**, avec sa date : une valeur écrite de
mémoire réintroduit le défaut (le commentaire d'ONDE en était la démonstration — il listait des accents
que la source n'écrit pas).

| Source | Nature du risque | Comment on le teste |
|---|---|---|
| GASPAR risques | libellé littéral | 10 libellés réels, aucun faux positif croisé |
| GASPAR catnat | repli en jargon | aucun libellé réel ne tombe dans le repli |
| ADEME / BAN | décision d'attribution DPE | 3 types, 7 classes, 4 précisions, défaut sûr |
| ONDE | nom de champ | 6 écoulements réels, « Observation impossible » ni sec ni humide |
| DRIAS | DÉCALAGE de colonnes | **invariants physiques** (35 006 communes, 0 violation) |
| BPE | deux tables en deux langages | shards réels : tout code a un libellé, aucun orphelin |

---

## 4. LES ÉCHELLES TERRITOIRE / QUARTIER / LOGEMENT (`c0f9a9d`, `12087e1`)

Premier pas du reclassement, **métadonnées seulement, aucune présentation touchée**.

`echelles.ts` dérive l'échelle du GRAIN de la preuve. **Un fait n'appartient pas à un module** : le champ
`module` dit d'où VIENT la donnée, pas ce qu'elle DÉCRIT, et il est binaire.

**Ce que la mesure a montré, et c'est le contenu du chantier** : sur un projet à 12 priorités, les six
faits émis sont TOUS à l'échelle du territoire. **Zéro quartier, zéro logement.** Le grain `secteur`
n'est émis par AUCUNE règle — un test le documente et tombera quand ce sera faux.

⚠ **LIMITE INSCRITE DANS LE CONTRAT** : `grain` dit l'ANCRE du calcul, pas le SUPPORT du constat. Ils
coïncident pour une surface (grand-IRIS) et un attribut du bâtiment (DPE) ; ils DIVERGENT pour une
distance (« la gare est à 8 min » se mesure depuis l'adresse mais décrit l'environnement). À résoudre
AVANT de faire entrer l'Autour dans le moteur, et **surtout pas** par une exception « telle règle va
dans Quartier ».

---

## 5. LES HARNAIS (locaux, NON commités — décision du porteur)

**`/dev/dossier` — LA BOUCLE DE VÉRIFICATION, à utiliser en premier.** Un code INSEE + des priorités
(`cle:poids`) et le VRAI dossier apparaît : mêmes données, mêmes règles, même composant. Aucun LLM.
**Sa table « Ce que chaque règle a conclu » est le cœur de l'outil** — c'est là qu'on aurait lu
`satisfied` en deux secondes. Une campagne sur 11 dossiers a trouvé 2 défauts en quelques minutes.

**`/dev/conclusion`** — six variantes du bloc de verdict côte à côte, pour le rendu.

---

## Doctrine (à ne pas re-litiger)
- **LE SILENCE EST UN MENSONGE quand il porte sur une priorité.** Un `satisfied` muet sur un risque
  nommé produit une affirmation invérifiable. Vaut aussi à poids 1 pour un risque RECENSÉ (binaire),
  pas pour un écart gradué.
- **Le poids décide si un écart TRANCHE, pas s'il a le droit d'EXISTER à l'écran.**
- **Le rôle d'un fait suit sa NATURE pour le lecteur, jamais la forme de sa preuve.**
- **AVANT D'AJOUTER UN SIGNAL, MESURER SA FRÉQUENCE.** Feu recensé 6/14 (discriminant) ; inondation
  **12/14**, mouvement de terrain **11/12** (universels — les croiser produirait du bruit) ; boisement
  ≥ 70 % = 9,4 %. **NE PAS étendre le croisement GASPAR à l'inondation** : notre score est gradué là où
  le drapeau est binaire, le croisement DÉGRADERAIT le signal.
- **Un croisement avec une source externe ne vaut que si elle SAIT ce que notre indicateur ne peut pas
  voir.** Vrai pour le feu (indice météo aveugle au massif). Faux ailleurs.
- **Un budget de lecture se mesure SUR L'ÉCRAN**, jamais sur le texte des faits : une simulation sur les
  `statement` annonçait 67-94 s là où le rendu réel en faisait 101-123.
- **Une bascule verification → mismatch FAIT PERDRE l'action** : sans composition pour la restaurer,
  c'est une régression pour le lecteur.
- **Une action = une seule source de vérité** ; **ce bloc n'est PAS généré par le LLM** ; **la gate ne
  compte que les registres GÉNÉRABLES** ; **pas de bump manuel du hash** pour un champ du plan.
- **Un repère posé hors de React se pose en `data-`, jamais en classe.**
- Sonde `probe-conclusion.ts` : **NE PAS lancer** (45 appels LLM facturés).

## La suite
1. **Le DOSSIER COMPLET** (les 3 modules) — chantier de plusieurs semaines, prévu AVANT le lancement.
   Deux dettes l'attendent : le verdict promet déjà « le dossier complet » qui n'existe pas, et les
   plafonds de l'assembleur (2/3/3/3/3/4) le borneraient à 18 cartes.
2. **Le grain QUARTIER dans le moteur** — l'îlot de chaleur (CSTB, grand-IRIS) est le premier candidat :
   donnée déjà intégrée, maille réellement intermédiaire, priorité existante (`faible_chaleur`). Il sera
   le patron des preuves SURFACIQUES ; celui des distances demande d'abord de trancher ancre/support.
3. **La sécheresse** : seuil trouvable (150 j/an = 10,4 % des communes) mais axe PEU discriminant
   (médiane 115) et « 150 jours de sol sec » ne parle pas. Décision produit en attente.
4. **La submersion marine** : discriminante (2/12, littoral), recensée mais AUCUN critère déclarable.

## Pièges
- `tsconfig.json` exclut `**/*.test.ts` du typecheck ; **eslint les ignore aussi** — un lint vert ne dit
  rien d'eux.
- Un commentaire JSX `{/* … */}` DANS un ternaire y met deux enfants et casse le build.
- Chrome **headless** : mesurer un halo de 2 s après `networkidle` le rate. Attendre l'ÉTAT
  (`waitForFunction`), pas une durée.
- Le hook pre-commit lance `index:verify` (OK). Push direct sur `main`, pas de PR.
