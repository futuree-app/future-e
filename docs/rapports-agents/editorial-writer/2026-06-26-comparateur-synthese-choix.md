# Stress-test éditorial — Synthèse du comparateur « mode choix » (départage)

**Agent :** Editorial Writer (contre-pouvoir voix)
**Date :** 2026-06-26
**Branche :** feat/comparateur-mode-choix
**Statut :** rapport pré-implémentation (la synthèse n'existe pas encore ; je juge le prompt à écrire, pas un texte en prod)

Fichiers lus : `docs/superpowers/specs/2026-06-26-comparateur-synthese-explorateur-design.md` (§2.3 en priorité),
`src/app/api/comparateur-vie/synthesize/route.ts` (prompt /ou-vivre de référence),
`src/lib/comparateur-vie.ts` (~742-810 identité, ~1188-1358 thèmes/divergence/domine, ~1484-1563 compromis),
`docs/vault/doctrine/editoriale.md`, invariant n°2 (pas de score / pas de couronnement).

---

## Cadrage : ce qui change entre /ou-vivre et le mode choix

La route /ou-vivre a une colonne vertébrale qui n'existe PAS ici : **le projet**. Tout son prompt
tourne autour de « ce que le projet révèle », « les critères demandés », « le miroir ». En mode
choix, **le lecteur n'a donné que 2-3 noms de communes**. Il n'y a ni projet, ni préférences, ni
critères pondérés. L'entrée réelle (cf. moteur) :

- par commune : `nom`, `region`, `identite` (ex. « Pour vivre en montagne, au grand air. »),
  `compromis` (ex. « En échange, des services moins accessibles qu'à Annecy. »), `distinctive`
  (trait relatif au trio, parfois `null`) ;
- `themes` : 7 synthèses déterministes (« Annecy se distingue par… ») — **c'est l'explorateur, pas
  la synthèse** ;
- `divergence` : `domine` (booléen) + `dominatorInsee` quand une commune mène presque tous les thèmes.

Conséquence sur la voix : **le miroir n'est plus « j'ai compris votre projet », c'est « j'ai compris
votre hésitation »**. Le lecteur doit se sentir compris dans le fait qu'il balance entre CES communes
précises, sans qu'on lui prête des motivations qu'il n'a pas exprimées. C'est le piège n°1, traité
plus bas.

---

## 1. Le risque de dérapage — couronnement

C'est le point chaud. Une prose générée sur 2-3 communes nommées glisse mécaniquement vers le
classement, parce que comparer SANS hiérarchiser est contre-intuitif pour un modèle de langage
(et parce que le moteur lui-même lui sert des `themes` où untel « se distingue » / « prend
l'avantage »). Les dérapages les plus probables, par ordre de fréquence attendue :

**a) Le couronnement frontal** (le plus grave, viole l'invariant n°2)
- ✘ « Annecy est la plus équilibrée des trois. »
- ✘ « Le meilleur compromis reste Chambéry. »
- ✘ « Valence offre le meilleur cadre de vie. »
- ✘ « Annecy l'emporte sur les deux autres. »
- ✘ « Si vous deviez choisir, Annecy a tout pour vous convaincre. »
- ✘ « Notre préférence va à… » / « Le choix le plus sûr est… »

**b) Le couronnement déguisé en arithmétique** (sournois : se présente comme neutre)
- ✘ « Annecy coche le plus de cases. »
- ✘ « C'est Chambéry qui réunit le plus d'atouts. »
- ✘ « Sur l'ensemble, Valence ressort en tête. »
- ✘ « Globalement, Annecy s'impose. » (en plus, « globalement » est une formule interdite).

**c) Le faux-équilibre couronné** (piège spécifique au mode choix : couronner « le juste milieu »)
- ✘ « Chambéry est le bon compromis entre les deux extrêmes. »
- ✘ « Valence se situe idéalement entre les trois. »
  → couronner une commune comme « le milieu raisonnable » EST un verdict. Le moteur a un repli
  honnête « se situe plutôt comme un compromis entre les options » ; il devient interdit dès qu'on y
  ajoute « idéalement », « le bon », « le plus malin ».

**d) Le classement par énumération** (l'ordre devient un palmarès)
- ✘ « D'abord Annecy, ensuite Chambéry, enfin Valence. »
- ✘ « En premier lieu Annecy pour son cadre, puis… »
  → l'ordre de citation ne doit jamais coïncider avec un mérite. À surveiller : citer les communes
  dans l'ordre d'affichage, ou par thème, jamais « par qualité ».

**e) Le miroir inventé** (spécifique mode choix, viole « ne pas attribuer un critère non formulé »)
- ✘ « Vous cherchez la tranquillité d'une petite ville… » → il n'a rien cherché, il a tapé 3 noms.
- ✘ « Votre priorité semble être le climat. »
  → en l'absence de projet, **toute supposition sur les motivations du lecteur est une fabrication**.
  La synthèse décrit les OPTIONS, jamais la psyché du lecteur. C'est l'erreur la plus facile à
  commettre parce que le prompt /ou-vivre y invite (« ce que le projet révèle ») — il faut la
  désactiver explicitement.

**f) La prescription douce** (le verbe qui décide passe côté futur•e — viole la doctrine
« le verbe qui décide reste côté lecteur »)
- ✘ « Vous ne vous tromperez pas avec Annecy. »
- ✘ « Autant partir sur Chambéry. »
- ✘ « Le bon choix penche clairement vers… »

---

## 2. Le cas `domine` — où passe la ligne exacte

Rappel du moteur (~1340) : `domine` est vrai quand une commune mène au moins `themes.length - 1`
thèmes. La spec (§2.3) autorise à le **décrire** (« ressort sur presque tous les plans, peu
d'arbitrage réel ») mais **jamais à le prescrire**.

**La ligne, formulée comme règle :** la synthèse peut dire **qu'il y a peu à arbitrer** et **pointer
la seule dimension où une AUTRE commune mène** (exactement ce que fait déjà le moteur : `chosen`
cherche un candidat divergence `leaderInsee !== dominator`). Elle ne peut PAS dire au lecteur **quoi
en conclure** (choisir, se rassurer, ne pas hésiter). Critère opérationnel : **décrire la
configuration mesurée = autorisé ; donner au lecteur la conséquence de cette configuration sur sa
décision = interdit.**

**Formulation maximale acceptable :**
> « Entre ces deux villes, l'écart penche nettement d'un côté. Sur la plupart des plans que nous
> regardons, Rennes ressort devant, et l'arbitrage se resserre autour d'un seul point : Saint-Malo
> vous met au bord de la mer, ce que Rennes ne peut pas offrir. La question n'est donc pas laquelle
> réunit le plus, mais si la proximité du littoral compte assez pour primer sur le reste. »

Pourquoi c'est encore dans la voix : on décrit l'écart, on **rend immédiatement la main** en
recadrant sur la dimension où l'autre mène, et on **reformule en question** (« si la mer compte
assez pour vous »). Le verbe qui décide reste au lecteur.

**Première formulation de trop** (le mot qui fait basculer) :
> ✘ « …Rennes ressort devant : il y a finalement peu à hésiter. »
> ✘ « …Rennes ressort devant, c'est le choix le plus sûr / vous ne prenez pas de risque. »
> ✘ « …sauf si la mer prime, Rennes s'impose naturellement. »

« peu à hésiter », « le plus sûr », « s'impose », « naturellement » : tous tirent la conclusion
décisionnelle à la place du lecteur. Le test mental : si je peux remplacer la phrase par « donc
prenez celle-là », elle est de trop.

**Garde-fou supplémentaire à inscrire dans le prompt :** même en cas de `domine`, **ne jamais
employer un superlatif absolu** (« la meilleure », « la plus complète »). « ressort devant sur la
plupart des plans » est descriptif et relatif au duo/trio ; « la plus complète » est un verdict.

---

## 3. Que doit dire la synthèse pour faire sentir « futur•e comprend ma situation »

La situation, ici, c'est : **j'hésite entre ces communes parce que je ne sais pas ce que chacune me
fait gagner et perdre.** Faire sentir qu'on comprend, c'est :

1. **Nommer que ces communes ne proposent pas la même vie** (à partir des `identite`) — pas les
   noter, les caractériser. Le lecteur doit se reconnaître dans « oui, c'est bien entre ÇA que
   j'hésite ».
2. **Nommer honnêtement le compromis de chacune** (à partir des `compromis`) — ce que chacune coûte,
   sobrement. C'est là que naît la confiance : futur•e ne vend aucune des trois.
3. **Reformuler l'hésitation en arbitrage**, pas en classement : « votre choix tient à ce que vous
   acceptez de perdre ». On déplace le lecteur de « laquelle est la meilleure ? » (mauvaise question)
   vers « quel compromis me ressemble ? » (sa vraie question).
4. **Pointer vers l'explorateur sans l'inventorier** : « les thèmes ci-dessous montrent où chacune
   prend l'avantage ». La synthèse reste au niveau de l'ensemble, elle ne récite pas les 7 thèmes
   (ce serait voler son rôle à l'explorateur — vigilance §6 de la spec).
5. **Rendre la décision au lecteur**, explicitement, à la fin.

Ce qu'elle ne doit PAS faire : prêter un projet au lecteur, promettre au-delà du mesuré, épuiser le
sujet, citer un chiffre, couronner.

### Exemple A — 3 communes, pas de `domine` (~135 mots)

> Vous hésitez entre trois communes qui ne proposent pas la même vie. Annecy vous met au bord du
> lac avec les services d'une vraie ville, mais c'est aussi la plus tendue sur le logement.
> Chambéry garde un quotidien aux portes des Alpes, à un rythme plus posé, au prix d'une offre
> culturelle un peu plus réduite. Valence joue la vallée du Rhône, plus ensoleillée, mais aussi
> plus exposée à la chaleur l'été. Aucune ne réunit tout, et c'est normal : votre choix tient
> autant à ce que vous acceptez de perdre qu'à ce que vous gagnez. Les thèmes ci-dessous montrent
> où chacune prend l'avantage et où elle cède du terrain. À vous de voir lequel de ces arbitrages
> vous ressemble le plus.

Pourquoi ça tient : aucune commune couronnée ; chaque commune a une identité ET un compromis nommé ;
« prend l'avantage » est relatif et par thème (pas un classement global) ; la décision est rendue ;
on ne prête aucun projet au lecteur (« ces communes ne proposent pas la même vie », pas « vous
cherchez »).

### Exemple B — 2 communes, `domine` (~120 mots)

> Entre ces deux villes, l'écart penche nettement d'un côté. Sur la plupart des plans que nous
> regardons, Rennes ressort devant, et l'arbitrage se resserre autour d'un seul point : Saint-Malo
> vous met au bord de la mer, ce que Rennes ne peut pas offrir. La vraie question n'est donc pas
> laquelle réunit le plus, mais si la proximité du littoral compte assez pour vous pour primer sur
> le reste. C'est un choix de priorité, pas de comptage. Les thèmes ci-dessous détaillent où se
> creuse l'écart et où Saint-Malo garde son avantage. Vous seul savez quel poids donner à la mer.

### Cas-limite à prévoir — communes très proches (le moteur renvoie « très proches »)

Quand `divergence` est faible / `resume` dit « très proches », la synthèse doit le **dire
honnêtement**, sans fabriquer une divergence : « Ces communes se ressemblent plus qu'elles ne
s'opposent. L'arbitrage ne se joue pas sur de grands écarts, mais sur des nuances : … ». Interdit de
forcer un contraste pour faire du spectacle (optimisme/drame manufacturé, doctrine éditoriale).

---

## 4. SYSTEM prompt — garde-fous adaptés au DÉPARTAGE

Partir du squelette /ou-vivre (la plomberie `streamText`/probe/502 est réutilisable telle quelle,
cf. spec). Mais le SYSTEM est **réécrit**, pas adapté à la marge : sa colonne vertébrale (le projet)
disparaît.

### Ce qu'on RETIRE du prompt /ou-vivre
- Tout le bloc « ce que le projet révèle » / « le miroir » (point 1 de la STRUCTURE).
- « CRITÈRES EXPLICITEMENT DEMANDÉS (couverture obligatoire) » — il n'y a pas de critères demandés.
- « PÉRIMÈTRE ET ORIENTATION GÉOGRAPHIQUES » — pas de zone choisie en mode choix.
- La déduction de critères (« ne pas être isolé pour un projet familial ») — pas de projet.
- Les gloses `PREF_LABELS` / `preferences` — inutiles ici.
- Les frontières conditionnelles liées à une préférence demandée (inondation/calme/industrie
  gatées sur `preferences`) — en mode choix ces nuances ne s'introduisent pas (pas de demande qui
  les autorise). **Décision à poser au porteur** (cf. Cohérence).

### Ce qu'on GARDE (esprit transposé)
- « Le moteur a DÉJÀ décidé : vous INTERPRÉTEZ, vous ne classez pas, vous n'ajoutez aucune commune. »
- « NE COMMENTEZ QUE CE QUI A ÉTÉ MESURÉ » (anti-rationalisation) — ne pas inventer un verdict sur une
  dimension absente des `themes`/`identite`/`compromis`/`distinctive`.
- FRONTIÈRE AVEC LE RAPPORT : qualitatif uniquement, aucun chiffre/pourcentage/horizon daté, jamais
  d'inventaire.
- Bloc TRAIT DISTINCTIF (différence relative, jamais un avantage absolu) — toujours pertinent ici.
- INTERDITS : « top / meilleures / classement / numéro 1 », jamais prescriptif, vouvoiement, AUCUN
  tiret cadratin, AUCUN point d'exclamation, pas de termes techniques.
- TON : simple, direct, phrases courtes, pas d'aphorismes ni d'antithèses « ce n'est pas X c'est Y ».

### Ce qu'on AJOUTE (spécifique départage)
- **OBJECTIF recadré :** « Le lecteur a nommé 2 ou 3 communes entre lesquelles il hésite. Votre rôle :
  lui faire sentir que vous comprenez son hésitation, en nommant l'arbitrage réel entre CES communes,
  honnêtement, sans en désigner aucune comme la meilleure. »
- **INTERDIT DE COURONNER (renforcé, invariant n°2) :** lister explicitement les formes interdites
  (cf. §1 : « la plus équilibrée », « le meilleur compromis », « coche le plus de cases », « ressort
  en tête », « le juste milieu idéal », classement par énumération). Le verbe qui décide reste
  TOUJOURS au lecteur.
- **NE PRÊTEZ AUCUN PROJET AU LECTEUR :** il n'a donné que des noms de communes. Ne supposez jamais
  ses motivations, ses critères ou ses priorités (« vous cherchez… », « votre priorité semble… »
  sont interdits). Décrivez les options, jamais l'intention du lecteur.
- **CAS `domine` :** « Si le champ `domine` est vrai, vous POUVEZ décrire qu'une commune ressort sur
  la plupart des plans mesurés et que l'arbitrage se réduit à un point (la dimension où une autre
  commune mène). Vous ne dites JAMAIS au lecteur d'en choisir une, ni que c'est "le choix le plus
  sûr", ni qu'il y a "peu à hésiter". Décrivez la configuration, rendez la main. » + interdit du
  superlatif absolu même ici.
- **CAS communes proches :** « Si les profils se ressemblent, dites-le simplement et situez
  l'arbitrage sur les nuances. N'inventez jamais une divergence pour dramatiser. »
- **NE RÉCITEZ PAS LES 7 THÈMES :** l'explorateur sous la synthèse fait le détail. Restez au niveau
  de l'arbitrage d'ensemble. Pas d'inventaire thème par thème (anti-redite, spec §6).
- **STRUCTURE (110-170 mots, 1-2 paragraphes) :** (1) ces communes ne proposent pas la même vie,
  caractérisez chacune ; (2) le compromis honnête de chacune ; (3) reformulez l'hésitation en
  arbitrage (« ce que vous acceptez de perdre »), pas en classement ; (4) renvoyez vers les thèmes
  sans les inventorier ; (5) rendez la décision au lecteur.
- **FORMULES INTERDITES** (ajouter au prompt, doctrine) : « en résumé », « globalement », « en
  somme », « pour conclure », « à l'heure où ».

### Donnée d'entrée à passer (payload `synthesize-choix`)
Sobre, sans chiffre : par commune `{ nom, region, identite, compromis, distinctive }` + `divergence`
réduit à `{ domine, dominatorInsee }` (le label de la dimension divergente peut aider la phrase
domine, mais reste qualitatif). **Ne pas** passer les 7 `themes.synthese` au LLM si on veut empêcher
la récitation : les garder côté explorateur déterministe. À trancher au plan (les passer aide la
justesse mais augmente le risque d'inventaire) — voir Cohérence.

---

## Rythme et longueur

110-170 mots / 1-2 paragraphes est le bon calibre : assez pour 3 identités + 3 compromis + le
recadrage, assez court pour ne pas voler le détail à l'explorateur. Vigilance rythme : à 3 communes,
la structure « identité, mais compromis » répétée trois fois de suite crée un tempo mécanique
(« X fait A, mais B. Y fait C, mais D. Z fait E, mais F. »). Demander au prompt de **varier la
construction** de la 3e phrase pour casser la litanie. La synthèse doit créer une question, pas
épuiser : la dernière phrase ouvre (« lequel de ces arbitrages vous ressemble »), elle ne referme pas.

## Honnêteté de la promesse

Deux points de vigilance au-delà du couronnement :
- **Le mesuré vs l'absent.** En mode choix sans projet, le risque est d'affirmer un verdict sur une
  dimension que le moteur n'a pas servie dans `identite`/`compromis`/`distinctive`. Le garde-fou
  « ne commenter que ce qui est mesuré » est aussi critique ici qu'en /ou-vivre.
- **Le futur affirmé.** Si une nuance climatique passe (chaleur l'été, exposition), garder le
  registre « plus exposée », jamais « il fera plus chaud » ni un horizon daté (invariant n°5,
  doctrine data mesuré/projeté).

## Verdict

**À RÉÉCRIRE depuis zéro** (le SYSTEM, pas la plomberie). Le prompt /ou-vivre ne peut pas être
adapté à la marge : sa colonne vertébrale (le projet, les critères demandés, le miroir) est absente
du mode choix, et le réutiliser tel quel produirait le dérapage n°1e (miroir inventé). Les garde-fous
ci-dessus sont, à mon sens, nécessaires et suffisants pour tenir la voix. Le point de rupture unique
à surveiller en test : le couronnement déguisé (§1b) et le cas `domine` (§2).

---

## Cohérence (tensions à poser au porteur, je ne tranche pas)

1. **Passer ou non les 7 `themes.synthese` au LLM ?** Les passer améliore la justesse de l'arbitrage
   mais augmente le risque d'inventaire thème par thème (redite avec l'explorateur, spec §6). Ma
   préférence éditoriale : ne passer que `identite`/`compromis`/`distinctive` + `divergence`, et
   laisser le détail à l'explorateur. À arbitrer avec le Product (justesse vs redite).
2. **Les nuances gatées (inondation/calme/industrie/démographie/littoral).** En /ou-vivre elles ne
   s'affichent que si la préférence est demandée. En mode choix il n'y a pas de demande. Faut-il les
   couper toutes (synthèse plus pauvre mais sûre), ou les autoriser si elles portent un `distinctive`
   réel (plus riche, risque d'introduire une alarme non sollicitée) ? Tension honnêteté/richesse :
   à poser au porteur. Ma lentille penche pour couper par défaut (ne pas introduire un risque que le
   lecteur n'a pas évoqué), sauf via le canal `distinctive` qui est déjà relatif et sobre.
3. **« prend l'avantage » dans la prose.** Le moteur l'emploie déjà (`resume`). C'est acceptable au
   niveau d'un thème (relatif), mais répété il peut sonner comme un classement. À surveiller en test.

## Mise à jour de la doctrine (prêt à écrire par Claude principal)

Si ce chantier se confirme, une règle stabilisée mérite d'entrer dans `editoriale.md` (section
« La page s'adresse au lecteur ») :

> **Comparer sans prêter de projet.** Quand le lecteur n'a donné que des noms (mode choix, départage),
> la synthèse décrit les OPTIONS et l'arbitrage entre elles, jamais les motivations du lecteur.
> « Vous cherchez… », « votre priorité semble… » sont interdits en l'absence de critères formulés :
> on ne prête pas une intention pour faire un miroir. Le miroir, ici, c'est l'hésitation reconnue,
> pas un projet deviné.

Et un ajout au registre des formules de couronnement interdites (lié à l'invariant n°2) : « coche le
plus de cases », « ressort en tête », « le juste milieu idéal », « peu à hésiter », « le choix le
plus sûr ».

## Limites de mon regard (ce run)

- Je juge la **prose et le prompt**, pas la conversion réelle ni un éventuel A/B : je ne sais pas si
  une synthèse plus avare convertit moins vers le Pack. C'est l'angle du Product/Business.
- **La synthèse n'existe pas encore** : je stress-teste un prompt à écrire et des sorties que
  j'imagine, pas un texte généré observé. Les vrais dérapages de Sonnet/Haiku « effort low » peuvent
  différer de ma liste ; il faudra re-juger 10-15 générations réelles avant de figer.
- Je n'ai **pas le rendu visuel** : l'effet du rythme de la synthèse streamée à l'écran (apparition
  progressive, place sous le hero) m'échappe ; c'est l'angle du Design Critic.
- Je n'ai pas relu **tout le parcours mode choix** (accueil réécrit, AskFuture, CTA Pack) : je juge
  la synthèse isolément, alors que sa justesse dépend aussi de ce que le hero a déjà promis juste
  au-dessus.
