# Rapport éditorial — module Territoire, relation résidence/découverte

Date : 2026-07-01
Fichiers lus : `src/app/(account)/rapport/quartier/page.tsx`, `src/components/report/ReportRelationBanner.tsx`,
`src/components/report/QuartierSynthesis.tsx`, `src/app/(account)/compte/QuartierWorkbook.tsx`,
`src/app/api/synthesize-quartier/route.ts`, `docs/vault/doctrine/editoriale.md`.

## Constat principal (à traiter en premier)

Un même défaut de construction grammaticale se répète à **quatre endroits distincts** dans le
parcours : le sujet de la phrase est **« la lecture »** (le produit, son output) au lieu du
**lecteur**. C'est exactement ce que `editoriale.md` interdit sous « La page s'adresse au
lecteur, pas à elle-même » (lignes 47-61), même si l'exemple canonique de la doctrine porte sur
l'architecture ("modules") plutôt que sur ce cas-ci ("adapté à"). Le motif syntaxique est
identique : une phrase où futur•e décrit ce qu'ELLE fait, plutôt que ce que le lecteur vit.

Occurrences :
1. `ReportRelationBanner.tsx:14` — `"Lecture adaptée à votre commune de résidence"`
2. `ReportRelationBanner.tsx:15` — `"Lecture adaptée à une commune que vous envisagez"`
3. `QuartierSynthesis.tsx:380` — `"La lecture sera adaptée à vos priorités, sans rien inventer."`
4. `QuartierSynthesis.tsx:436` — `"Lecture adaptée à vos priorités."` (confirmation après clic sur
   « Adapter la lecture »)

Isolée, chacune de ces phrases est mineure (ce sont des microcopies fonctionnelles, pas de la
prose marketing). Répétée quatre fois avec la même construction, c'est un **pattern**, pas un
accident, et il mérite un correctif unique qui les traite toutes ensemble plutôt que quatre
retouches séparées.

---

## Texte 1 — Bandeau relation (`ReportRelationBanner.tsx`)

**Texte** : labels statiques `LABEL[relation]`, affichés en haut de page juste après l'identité
du territoire, avant la synthèse. Sert à signaler au lecteur quelle posture de lecture s'applique
et lui permettre de la corriger.

```
current_residence:    "Lecture adaptée à votre commune de résidence"
considering_living:    "Lecture adaptée à une commune que vous envisagez"
information_only/unknown: "Lecture d'une commune que vous explorez"
```
Boutons de correction : `"J'y vis"` / `"J'envisage d'y vivre"`.

**Où le texte touche juste** : les deux boutons de choix (`J'y vis` / `J'envisage d'y vivre`)
sont réussis. Ce sont des phrases à la première personne, dans les mots exacts qu'un lecteur
emploierait pour se décrire lui-même : pas de jargon produit, pas de « résidence principale »
administratif. C'est le bon registre pour une affordance de self-identification (différent du
registre "vous" habituel de futur•e qui s'adresse au lecteur : ici, c'est le lecteur qui parle
de lui, donc le "je" est juste).

**Ce qui trahit le ton** : le label statique au-dessus (`LABEL[relation]`) a pour sujet
grammatical « la lecture », pas le lecteur. Il décrit un comportement du produit
(« la lecture [que futur•e produit] est adaptée à… ») plutôt que la situation du lecteur. C'est
un registre d'interface système (« affichage : mode adapté »), pas la voix de futur•e. Sur un
premier contact avec le module (avant même la synthèse), c'est le tout premier texte que le
lecteur rencontre en dehors du hero : le ton y compte double.

**Réécriture proposée** (options, arbitrage de ton à poser) :

- Option A, minimale, garde la structure factuelle mais met le lecteur en sujet :
  - `current_residence` : « Vous vivez à {commune} : la lecture parle de votre quotidien. »
  - `considering_living` : « Vous envisagez {commune} : la lecture parle de ce qui vous
    attend. »
  - `information_only/unknown` : « Vous explorez {commune}. »
- Option B, plus courte, reprend le vocabulaire des boutons (cohérence label/bouton) :
  - `current_residence` : « Vous y vivez déjà. »
  - `considering_living` : « Vous envisagez d'y vivre. »
  - `information_only/unknown` : « Vous explorez cette commune. »

Je recommande l'option B : elle est la plus courte (moins de bruit dans un bandeau secondaire),
et elle fait écho mot pour mot aux boutons de correction juste à côté (« J'y vis » → « Vous y
vivez déjà »), ce qui rend le lien label/correction plus lisible sans changer le layout.

**Rythme et longueur** : bon, c'est une ligne courte, pas de fatigue.

**Honnêteté de la promesse** : rien à redire, c'est un statut, pas une promesse.

**Verdict** : À RETOUCHER (pas à réécrire en profondeur : un seul changement de sujet
grammatical par état).

---

## Texte 2 — Bloc « Préciser cette lecture » (`QuartierSynthesis.tsx:371-403`)

**Texte exact** :
```
Préciser cette lecture

Dites-nous ce que vous recherchez ou ce qui vous fait hésiter dans cette commune.
La lecture sera adaptée à vos priorités, sans rien inventer.

Qu'est-ce qui compte le plus pour vous dans cette commune ?
[textarea] placeholder: "Aidez futur•e à mettre en avant ce qui est utile à votre recherche."

Qu'est-ce qui pourrait vous faire hésiter ?
[textarea] placeholder: "Une inquiétude ou un point que vous souhaitez examiner avec attention."

[bouton] Adapter la lecture
[confirmation] Lecture adaptée à vos priorités.
```
Affiché uniquement en `considering_living`, sous la synthèse déjà générée, avant régénération.

**Où le texte touche juste** :
- La première phrase, « Dites-nous ce que vous recherchez ou ce qui vous fait hésiter dans cette
  commune. », est une bonne ouverture : impératif adressé au lecteur, sujet = « vous », registre
  conversationnel et pas administratif.
- Les deux labels de question, « Qu'est-ce qui compte le plus pour vous dans cette commune ? »
  et « Qu'est-ce qui pourrait vous faire hésiter ? », sont exactement dans la voix : concrets,
  seconde personne, aucune trace de jargon produit.
- Le placeholder du champ « hésitation », « Une inquiétude ou un point que vous souhaitez
  examiner avec attention. », est correct : il reste au niveau du lecteur, ne prescrit rien.
- « sans rien inventer » est une bonne clause de discipline de preuve, courte, sans emphase.

**Ce qui trahit le ton** :
1. Deuxième phrase du texte d'intro : « La lecture sera adaptée à vos priorités » — sujet
   « la lecture », voir constat principal ci-dessus.
2. Placeholder du champ « priorité » : **« Aidez futur•e à mettre en avant ce qui est utile à
   votre recherche. »** C'est la faute la plus nette du corpus lu aujourd'hui : la phrase fait du
   lecteur un assistant du produit (« aidez futur•e »ό) au lieu de faire du produit un outil au
   service du lecteur. C'est l'inversion exacte que `editoriale.md` proscrit (« la page s'adresse
   au lecteur, pas à elle-même ») — ici, pire encore, elle demande au lecteur de servir la page.
   À corriger en priorité absolue sur ce lot de textes.
3. Confirmation après clic, « Lecture adaptée à vos priorités. » — même défaut que le constat
   principal.
4. Titre du bloc, « Préciser cette lecture » : voir arbitrage de vocabulaire ci-dessous.

**Réécriture proposée** :
```
Vos priorités pour cette commune

Dites-nous ce que vous recherchez ou ce qui vous fait hésiter dans cette commune.
Vos priorités orientent ce qui suit, sans rien inventer.

Qu'est-ce qui compte le plus pour vous dans cette commune ?
placeholder: "Le calme, les écoles, le budget, l'exposition aux risques : ce qui pèse le plus
pour vous."

Qu'est-ce qui pourrait vous faire hésiter ?
placeholder: "Une inquiétude ou un point que vous souhaitez examiner avec attention."   [inchangé]

[bouton] Adapter la lecture   [inchangé, l'impératif garde le lecteur acteur]
[confirmation] Vos priorités sont prises en compte.
```
Le placeholder proposé pour le champ priorité donne des exemples concrets (registre
« TERRITOIRE VÉCU » de la doctrine) plutôt que de demander au lecteur d'« aider » le produit.

**Arbitrage de vocabulaire — « Repères de terrain » (résidence) vs « Préciser cette lecture »
(découverte)** : les deux blocs jouent le même rôle fonctionnel (donner au lecteur un moyen
d'affiner la synthèse avec ce qu'il sait/veut), mais leurs titres n'appartiennent pas au même
niveau de langage :
- « Vos repères de terrain » nomme ce que le lecteur POSSÈDE (une connaissance vécue). Sujet
  implicite = le lecteur.
- « Préciser cette lecture » nomme une ACTION SUR LE PRODUIT (l'objet grammatical est « cette
  lecture », c'est-à-dire le texte que futur•e produit). Sujet implicite = futur•e / le texte.

Ce sont deux philosophies de nommage différentes pour la même fonction, et la deuxième est celle
qui viole la doctrine. Je recommande d'unifier sur le modèle du premier : renommer le titre du
bloc découverte en **« Vos priorités pour cette commune »** ou, plus court, **« Ce qui compte
pour vous »**. Cela crée une vraie symétrie lexicale entre les deux états (« Vos repères de
terrain » / « Vos priorités ici ») au lieu d'une asymétrie accidentelle qui donne l'impression
que ce sont deux fonctionnalités différentes alors que c'est la même intention produit déclinée
selon la relation.

**Rythme et longueur** : le bloc est court, pas de fatigue de lecture. Rien à couper.

**Honnêteté de la promesse** : « sans rien inventer » est la bonne limite, elle est cohérente
avec le prompt (voir Texte 5, « ATTENTES DU LECTEUR »). Rien à corriger ici.

**Verdict** : À RETOUCHER. Le placeholder « Aidez futur•e… » est la seule pièce de ce rapport
qui mérite le mot « faute » plutôt que « nuance de ton » ; le reste du bloc est solide.

---

## Texte 3 — Bloc « Repères de terrain » (résidence, `QuartierSynthesis.tsx` + `QuartierWorkbook.tsx`)

**Texte exact** (sélection) :
- Bandeau de changement : « Vos repères de terrain ont changé. La lecture peut être affinée avec
  vos observations. » (`QuartierSynthesis.tsx:343`)
- Titre : « Vos repères de terrain » (`QuartierWorkbook.tsx:433`)
- Résumé replié : « Complétez les données publiques avec votre expérience du territoire. »
  (`QuartierWorkbook.tsx:471`)
- 4 questions à choix (heat/water/shelter/change) + note libre « Ce que vous avez déjà vu
  changer », placeholder : « Les nuits sont devenues plus lourdes, certains arbres souffrent
  davantage, l'eau manque plus souvent, les rues se vident plus tôt l'été... »
  (`QuartierWorkbook.tsx:507-513`)
- Note de bas de bloc : « Les données racontent une partie de l'histoire. Ce que vous observez
  raconte le reste. » (`QuartierWorkbook.tsx:542`)

**Où le texte touche juste** : c'est la meilleure prose du corpus lu aujourd'hui.
- Les quatre questions (« L'été, comment tenez-vous déjà dans votre quartier ? »,
  « L'eau est-elle déjà devenue un sujet dans votre quartier ? », etc.) sont concrètes, dans le
  vécu, jamais abstraites ; elles interrogent une sensation avant une donnée, exactement le
  registre « TERRITOIRE VÉCU » du prompt de synthèse (`route.ts:62-68`).
- Le placeholder de la note libre est le meilleur texte du lot : « Les nuits sont devenues plus
  lourdes, certains arbres souffrent davantage, l'eau manque plus souvent, les rues se vident
  plus tôt l'été... » — il montre au lecteur, par l'exemple, à quel niveau de langage écrire, sans
  jamais lui dicter un contenu. C'est un placeholder qui enseigne le ton par imitation plutôt que
  par instruction.
- La phrase de clôture, « Les données racontent une partie de l'histoire. Ce que vous observez
  raconte le reste. », est juste : elle honore la doctrine « données, pas opinions » tout en
  donnant une vraie place à l'expérience du lecteur, sans jamais suggérer que son ressenti
  remplace la donnée. C'est une phrase qui *comprend* pourquoi le lecteur pourrait hésiter à
  remplir un formulaire (« à quoi ça sert, la donnée ne suffit pas déjà ? ») et y répond en une
  ligne, sans jargon.

**Ce qui trahit le ton** : rien de grave. Une seule nuance : le résumé replié, « Complétez les
données publiques avec votre expérience du territoire. », a pour objet « les données publiques »
(terme un peu technique/administratif) plutôt que de rester au niveau du lecteur. Mineur, à
juger PASS ou retouche facultative :
- Option : « Ajoutez votre expérience du quartier à ce que montrent déjà les données. » (sujet
  = « vous », complément plus concret que « les données publiques »).

**Sur le déplacement du bloc sous la synthèse (question posée par le mandat)** : la clôture
« Les données racontent une partie de l'histoire. Ce que vous observez raconte le reste. » reste
juste dans son nouvel emplacement (sous la synthèse déjà écrite) : c'est une phrase à portée
générale qui justifie pourquoi remplir le bloc a un intérêt, peu importe qu'elle arrive avant ou
après une première lecture. Elle ne prétend rien sur ce qui vient d'être lu.

En revanche, il y a désormais une **redondance de contenu** entre deux phrases proches dans le
même flux visuel :
1. « Vos repères de terrain ont changé. La lecture peut être affinée avec vos observations. »
   (juste au-dessus du bloc, si le lecteur a déjà rempli quelque chose ailleurs)
2. « Les données racontent une partie de l'histoire. Ce que vous observez raconte le reste. »
   (en bas du même bloc, une fois ouvert)

Les deux phrases disent la même chose (la donnée seule ne suffit pas, votre observation complète
la lecture), à quelques centaines de pixels d'écart, dans le même panneau. Ce n'est pas la même
situation que l'exemple des paliers d'horizon dans la doctrine (répétition d'idée entre deux
blocs éloignés), mais le principe est identique : *jamais la même idée répétée d'un bloc à
l'autre*. Je recommande de garder la phrase la plus incarnée (« Les données racontent une partie
de l'histoire… ») et de réduire la phrase de changement à sa seule fonction actionnable :
« Vos repères ont changé. » (sans re-justifier pourquoi, ce qui est déjà fait plus bas).

**Rythme et longueur** : ce bloc est le plus long du corpus (4 questions + note libre + aide),
mais il est replié par défaut (`open` state), donc le coût de lecture n'est payé que par le
lecteur qui choisit d'ouvrir. Pas de fatigue imposée. Bon compromis.

**Honnêteté de la promesse** : rien à redire, aucune promesse ici, seulement une invitation à
observer.

**Verdict** : DANS LA VOIX, avec une seule retouche mineure recommandée (redondance des deux
phrases « vos observations complètent les données », et objet « données publiques » dans le
résumé replié).

---

## Texte 4 — Prompt de synthèse (`src/app/api/synthesize-quartier/route.ts`)

**Ce que je juge** : pas la génération elle-même (invisible pour moi), mais la QUALITÉ des
consignes de posture données au modèle, notamment la section « RELATION À LA COMMUNE — POSTURE »
(lignes 73-76) et « ATTENTES DU LECTEUR » (lignes 78-83).

**Où le texte touche juste** : c'est un prompt d'une rigueur inhabituelle, et il applique déjà
correctement la doctrine du contre-pouvoir éditorial mieux que la plupart des textes UI qui
l'entourent :
- La consigne de posture est explicite et sans ambiguïté sur le point le plus sensible :
  « Ne lui prêtez JAMAIS d'observations vécues ni de connaissance du terrain, ne dites jamais
  "vos étés ici". Aucun repère de terrain n'est fourni dans ce cas, n'en inventez pas. » C'est
  exactement l'invariant n°5 (ne pas affirmer au-delà de la preuve) appliqué à un risque
  spécifique et réel (le modèle pourrait, par défaut, halluciner un vécu à partir du nom de la
  commune). Bien vu, bien formulé.
- « Ce sont des ATTENTES, jamais des faits ni des observations » (ligne 79) reprend la même
  discipline pour le second champ (priorité/hésitation) : le prompt distingue explicitement les
  trois régimes de contenu (fait mesuré / observation du lecteur / attente du lecteur) et
  interdit qu'ils se contaminent. C'est une application fine de `doctrine/data.md`
  (mesuré/projeté/modélisé/interprété), étendue ici à une quatrième catégorie non couverte par la
  doctrine écrite : le souhait/l'attente du lecteur. Je le note en « mise à jour de la doctrine »
  plus bas.
- « Ne confirmez JAMAIS une inquiétude sans preuve. Si les données ne permettent pas d'y
  répondre, dites-le simplement. » est une clause anti-optimisme-fabriqué ET anti-fausse-alerte
  bien équilibrée : elle interdit de rassurer à vide autant que d'alarmer à vide.
- Le glossaire JARGON INTERDIT (lignes 53-56) est plus complet et plus strict que le glossaire de
  `editoriale.md` : il couvre des termes absents de la doctrine écrite (« bassin versant »,
  « étiage », « minéralisé », « artificialisé »…). C'est une divergence positive (le prompt est en
  avance sur la doctrine), à faire remonter dans `editoriale.md` (voir plus bas).
- La règle sur la vacance de logements (ligne 101, « se garde NEUTRE… cela appartient au module
  Logement, arrêtez-vous avant ») applique concrètement le corollaire doctrinal « on ne décrit
  jamais ce qu'on ne fait pas » sans jamais énumérer les modules absents dans le texte final : la
  discipline est mise dans le PROMPT (invisible pour le lecteur), pas dans le texte affiché. C'est
  la bonne place pour ce genre de contrainte.

**Ce qui trahit le ton / faille potentielle** :
- Aucune formule interdite retrouvée (pas de tiret cadratin, pas d'antithèse creuse hors
  l'exception documentée, pas de « il convient de »).
- Une seule zone grise : le prompt autorise « Vous pouvez vous adresser à son vécu ("vos étés",
  "le quotidien ici")" en résidence, mais rien n'encadre le cas où le workbook est VIDE en
  résidence (lecteur qui vit sur place mais n'a rien rempli). Le prompt dit alors implicitement
  que l'IA peut *quand même* s'adresser au vécu générique du lecteur (« vos étés ») sans aucune
  observation fournie, en s'appuyant seulement sur le fait qu'il réside là. C'est cohérent avec
  la doctrine (poser une question au vécu générique n'est pas une invention de fait), mais le
  prompt ne le dit pas explicitement, ce qui laisse un peu de place à l'interprétation du modèle.
  Je ne peux pas vérifier l'effet réel (voir Limites), donc je pose la question plutôt que de
  trancher : faut-il ajouter une ligne « Si aucun repère de terrain n'est fourni en résidence,
  restez sur l'adresse générique ("vos étés", "le quotidien ici") sans supposer un ressenti
  précis » ? Cohérence à trancher côté humain.

**Réécriture proposée** : aucune nécessaire dans l'immédiat ; ce prompt est le texte le plus
solide du lot. Une seule ligne à envisager pour combler la zone grise ci-dessus, si jugée utile :
« Si aucun repère de terrain n'est fourni en résidence, adressez-vous au vécu générique ("vos
étés", "le quotidien ici") sans jamais supposer un ressenti ou une observation précise que
l'utilisateur n'a pas donnée. »

**Verdict** : DANS LA VOIX (le plus abouti des cinq textes du corpus).

---

## Cohérence (tensions non tranchées, posées à l'humain)

1. **Le titre du bloc découverte** (« Préciser cette lecture » → proposition « Vos priorités
   pour cette commune ») change un peu la promesse implicite : « préciser » suggère qu'on peut
   affiner un flou, « vos priorités » suggère qu'on hiérarchise du connu. Les deux sont vrais
   fonctionnellement (le prompt fait bien les deux : hiérarchiser selon la priorité, examiner
   l'hésitation), donc aucun des deux titres ne ment. Le choix relève d'un arbitrage de ton pur,
   je le pose à l'humain plutôt que de trancher.
2. **Zone grise du prompt en résidence sans workbook rempli** (ci-dessus) : je ne peux pas savoir
   si le modèle dérive déjà vers un vécu halluciné dans ce cas précis sans lire des générations
   réelles. Signal à surveiller plutôt qu'à corriger aujourd'hui.

## Mise à jour de la doctrine proposée

À faire remonter dans `docs/vault/doctrine/editoriale.md`, prêt à écrire :

> **« La lecture » n'est jamais le sujet d'une phrase adressée au lecteur.** Une microcopie qui
> dit « la lecture est adaptée à… », « la lecture sera affinée… » fait du produit le sujet
> grammatical au lieu du lecteur, même dans une UI fonctionnelle courte (labels, confirmations).
> Reformuler avec le lecteur en sujet (« vous vivez ici », « vos priorités sont prises en
> compte ») plutôt que le texte produit en sujet. Cas détecté (2026-07-01) : bandeau de relation
> et bloc « Préciser cette lecture » du rapport Territoire.

> **Un placeholder ne demande jamais au lecteur d'aider futur•e.** « Aidez futur•e à… » inverse
> le rapport de service (le produit sert le lecteur, pas l'inverse). Préférer un placeholder qui
> montre par l'exemple ce qu'on attend, sans nommer le produit comme bénéficiaire de la réponse.

> **Glossaire JARGON INTERDIT du prompt Territoire** (`synthesize-quartier/route.ts`, lignes
> 53-56) est plus complet que celui d'`editoriale.md` : « bassin versant », « recharge des
> nappes », « contrainte hydrique », « résilience territoriale », « évapotranspiration »,
> « artificialisé/artificialisation », « façade urbaine », « tissu urbain », « frange
> littorale », « étiage », « minéralisé », « non bâti », avec leur traduction. À fusionner dans
> le glossaire central pour que les futurs prompts (Logement, Santé…) en héritent sans le
> redécouvrir.

## Limites de mon regard

- Je juge la prose statique et les consignes du prompt, jamais le texte réellement généré par
  le modèle : je ne peux pas vérifier si la posture « considering_living » est effectivement
  respectée à l'exécution (le prompt peut être parfait et la génération dériver quand même). Un
  échantillon de synthèses réelles (résidence avec/sans repères, découverte avec/sans attentes)
  serait nécessaire pour clore ce point.
- Je n'ai pas le rendu visuel : je ne sais pas si la répétition que je signale entre le bandeau
  de changement et la note de bas de bloc (Texte 3) est perçue comme redondante à l'écran, ou si
  l'espacement/la hiérarchie visuelle (font-mono vs corps de texte) la rend suffisamment distincte
  pour ne pas fatiguer. C'est une question à trancher avec le Design Critic si l'écran est en
  cause plus que la prose.
- Je n'ai pas testé le parcours réel (bandeau → correction → régénération) : je juge le texte
  affiché dans le code, pas l'enchaînement vécu (latence de régénération, ce que voit le lecteur
  pendant les quelques secondes où l'ancien texte reste affiché).
- Je ne juge pas si le choix lexical « repères de terrain » vs « priorités » est le bon compromis
  produit (fréquence d'usage attendue en résidence vs découverte) : c'est une question Product,
  pas éditoriale au sens strict.

## La version minimale (90 % de la valeur, un seul changement)

Si un seul correctif doit être fait aujourd'hui : remplacer le placeholder
**« Aidez futur•e à mettre en avant ce qui est utile à votre recherche. »** par un exemple
concret centré sur le lecteur, par exemple **« Le calme, les écoles, le budget, l'exposition aux
risques : ce qui pèse le plus pour vous. »** C'est la seule phrase du corpus qui inverse
frontalement qui sert qui ; tout le reste (le pattern « lecture adaptée à », l'asymétrie de
vocabulaire des deux titres) est une nuance de ton, pas une faute de doctrine.

## Quand rouvrir ce sujet

- Si un lot de synthèses générées réelles (10-20, réparties résidence/découverte,
  avec/sans repères ou attentes) est disponible : relire pour vérifier que la posture du prompt
  est bien tenue en sortie, notamment le risque de vécu halluciné en résidence sans workbook
  rempli.
- Si le taux de remplissage du bloc « Préciser cette lecture » (découverte) est mesuré et
  qu'il est nettement plus bas que celui du workbook résidence à exposition égale : possible
  signal que le titre/l'intro du bloc découverte n'engage pas assez (revoir alors le titre en
  priorité, au-delà de la retouche de placeholder).
- Si un nouveau module (Logement, Santé) reprend le même pattern relation résidence/découverte :
  vérifier qu'il n'hérite pas du pattern « lecture adaptée à » plutôt que de le corriger module
  par module.
