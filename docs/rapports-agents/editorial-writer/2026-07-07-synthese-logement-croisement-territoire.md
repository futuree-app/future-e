# Croisement Logement × Territoire dans la synthèse Logement — règles éditoriales

Editorial Writer — 2026-07-07. Cible : `src/app/api/synthesize-logement/route.ts` (prompt v5,
constante `SYSTEM_PROMPT`). Read-only : je ne touche pas au code, je livre du texte prêt à coller
et le contrat du signal.

Fichiers lus : `synthesize-logement/route.ts` (v5), `synthesize-quartier/route.ts` (registre
Territoire, bloc `climat_projete`), `src/lib/drias-json.ts` (`getClimatDataCommune`, variables
NORTR_yr / NORTX30D_yr / NORSWI04_yr par gwl15/20/30), mémoire projet (`project_module_logement`,
`doctrine_referentiel_rechauffement_tracc`, `feedback_no_antithese`, `feedback_no_em_dash`).

---

## 1. Forme du signal `climat_projete` recommandée

**Je récuse la forme prose et je récuse `direction: "hausse"` comme donnée. Je recommande une
forme PLUS pauvre que celle pressentie.**

```ts
climat_projete: {
  horizon: "2050",
  chaleur: "marquee" | "notable" | null,        // intensité de la hausse de chaleur à l'horizon
  secheresse_sols: "marquee" | "notable" | null // intensité de l'assèchement des sols
} | null
```

Trois états par axe : `marquee` / `notable` / `null`. Rien d'autre. Le champ entier vaut `null`
si `getClimatDataCommune(insee)` renvoie `null` ou si les deux axes tombent à `null`.

**Pourquoi PAS de libellé-prose type « les nuits chaudes deviennent plus fréquentes ».** Un
fragment de prose pré-écrit est ce qui protège le MOINS. Deux raisons :
1. Le modèle le colle verbatim → récitation, exactement ce qu'on veut fermer.
2. Ce fragment a le climat pour sujet grammatical (« les nuits chaudes deviennent… »). Le lui
   donner tout fait, c'est LUI TENDRE la dérive de sujet qu'on vient de fermer en v5. Il n'aura
   qu'à recopier une phrase à sujet-commune.

Un code abstrait (`marquee`) n'est ni citable ni copiable : le modèle est FORCÉ de le
reformuler et de le greffer sur une phrase dont le logement est déjà le sujet. L'abstraction du
signal est la protection. C'est contre-intuitif (« donne-lui de la belle prose ») mais c'est le
bon geste ici.

**Pourquoi collapser `direction`.** `direction: "hausse"` est vrai partout sous TRACC, donc
c'est une CONSTANTE, pas une donnée. La sortir dans le payload invite le modèle à l'affirmer
telle quelle (« la chaleur augmente ici ») — une phrase Territoire, sujet-climat. La hausse est
toujours vraie : elle vit dans les RÈGLES du prompt (« l'axe monte toujours ; votre seul travail
est de décider s'il vaut d'être croisé »), pas dans le JSON. Le modèle infère « les étés se
réchauffent » de l'appariement, sans jamais recevoir une assertion climatique brute.

**Contrat de calcul (pour `buildSynthesisPayload`, à implémenter par Claude principal, hors mon
périmètre) :**
- `chaleur` dérivé du gwl20 : NORTR_yr (nuits tropicales) + NORTX30D_yr (jours >30 °C), seuil
  prudent v1, `null` sous le plancher. Combiner les deux en une seule intensité (max des deux
  classes, p. ex.).
- `secheresse_sols` dérivé du gwl20 NORSWI04_yr (jours de sols secs), seuil prudent v1.
- **Aucun chiffre brut ne transite jamais.** Le modèle ne reçoit que le label.
- **Les seuils numériques sont l'affaire du Data Curator, pas la mienne.** Règle éditoriale
  unique : en cas de doute, `null`. Un axe incertain vaut silence, jamais un « notable » tiède.
- Le champ entre naturellement dans `buildFactHash` (c'est un FAIT déterministe de l'adresse,
  stable, horizon fixe, aucune posture). Aucun traitement spécial : il DOIT être dans le hash.

---

## 2. Bloc de règles à insérer VERBATIM dans le prompt v5

À insérer après la section `LA CHALEUR` (elle en pose le vocabulaire du bâti) et avant
`RÈGLES DE FOND`. Style aligné (titre MAJUSCULES + puces + « se dit / ne se dit pas »).

```
LE CROISEMENT AVEC LE CLIMAT À VENIR
Le payload peut porter un champ climat_projete (horizon 2050). Il ne contient aucun chiffre :
seulement, pour deux axes, une intensité de tendance (marquee, notable, ou rien). Ces deux axes
n'existent dans votre texte que pour DONNER DU POIDS à un trait du logement déjà posé, jamais
pour eux-mêmes. L'axe monte toujours (les étés se réchauffent, les périodes sèches s'allongent) :
votre seul travail est de décider s'il vaut d'être croisé, et avec quoi.
- Un seul appariement par axe, aucun autre. chaleur n'éclaire QUE le confort d'été (l'air qui
  traverse ou non, ce que les murs font de la chaleur, les protections aux fenêtres). Elle ne se
  croise qu'avec un logement qui tient MAL la chaleur ; sur un logement bien armé contre la
  chaleur, vous n'en dites rien, vous ne promettez ni fraîcheur ni protection. secheresse_sols
  n'éclaire QUE le retrait-gonflement des argiles à l'adresse. Elle ne se croise que si l'adresse
  est dans un secteur exposé ; sans exposition, elle n'a rien à éclairer et n'apparaît pas.
- Le climat n'est JAMAIS le sujet. Il tient dans une subordonnée qui ajoute du poids à un fait du
  logement : « ce logement garde mal la fraîcheur, ce qui pèse davantage à mesure que les étés se
  réchauffent ». Le sujet reste le logement ; l'axe dit qu'une caractéristique PREND PLUS DE POIDS
  ou DEVIENT PLUS DÉCISIVE, jamais un ressenti daté.
- Vous ne prédisez aucune température intérieure, aucun vécu, aucune conséquence sur le bâti
  (« invivable en 2050 », « vous aurez trop chaud », « le sol se rétractera et fissurera » sont
  interdits). Vous ne dites pas non plus « selon les projections », « les scénarios », « le
  réchauffement climatique » : vous nommez la tendance concrète, au présent, et vous vous arrêtez
  là. L'horizon 2050 peut situer la tendance une seule fois (« d'ici 2050 »), jamais dater un
  vécu (« en 2050, ce logement… »).
- Croisez seulement si LES DEUX conditions tiennent : le trait du logement est présent et porte
  une fragilité, ET l'intensité de l'axe vaut au moins notable. Si l'une manque, le climat
  n'apparaît pas. Un confort d'été sans fragilité et un axe chaleur faible ou absent ne produisent
  aucune phrase : le silence est la bonne réponse, jamais un paragraphe de remplissage.
- Dosage : notable ne vaut qu'une demi-phrase greffée à un fait déjà écrit ; marquee peut porter
  une phrase pleine, dont le sujet reste le logement. Au plus une phrase pleine de croisement dans
  tout le texte ; un second axe, s'il se qualifie, reste une demi-phrase.
Se dit : « Cet appartement ne traverse pas et le diagnostic indique une inertie légère, une
combinaison qui pèse davantage à mesure que les étés se réchauffent. » (le logement reste le
sujet, l'axe chaleur ajoute du poids, aucun chiffre, aucun ressenti daté.)
Ne se dit pas : « D'ici 2050, les nuits chaudes se multiplient dans cette commune. » (le sujet a
glissé sur la commune, c'est une lecture Territoire, une récitation.)
Se dit : « L'adresse est dans un secteur fortement exposé au retrait-gonflement des argiles, une
exposition qui devient plus décisive à mesure que les périodes sèches s'allongent. »
Ne se dit pas : « Avec la sécheresse qui s'aggrave, le sol de cette parcelle finira par fissurer
la maison. » (mécanisme et conséquence fabriqués, prédiction interdite.)
```

Notes de cohérence :
- Le registre « ce qui compte davantage à mesure que les étés se réchauffent » existe DÉJÀ dans
  la section `LE SUJET` (l'exemple sanctionné du prompt v5). Ce bloc ne le contredit pas, il le
  formalise et le GATE. Harmonie voulue.
- « retrait-gonflement des argiles » est déjà glosé dans le dico du prompt (section détail) :
  pas de jargon neuf.
- Anti-antithèse et anti-em-dash respectés (aucun « ce n'est pas X, c'est Y », aucun tiret
  cadratin dans les exemples).

**Asymétrie assumée (tension posée au porteur, je ne tranche pas).** Le croisement chaleur
n'ajoute du poids qu'à une FRAGILITÉ ; sur un logement bien armé, silence. Raison d'honnêteté :
l'indicateur de confort d'été est conventionnel, il ne garantit pas le vécu (le prompt le dit
déjà), donc on ne peut pas transformer un bon confort en « protection qui gagne de la valeur »
sans glisser vers la réassurance interdite. Le silence sur le bon cas est de l'honnêteté, pas un
biais alarmiste (on décrit le bâti au neutre, le climat n'ajoute qu'un poids, jamais une alarme).
Si le porteur juge cette asymétrie trop négative, l'alternative serait d'autoriser une mention
neutre « une caractéristique qui compte de plus en plus » sur le bon cas — mais je la déconseille :
elle rouvre la porte à la promesse. À lui de trancher.

---

## 3. Ajustement de la CLÔTURE

La clôture v5 rechute : sur une adresse calme, le modèle couronne un fait communal en enjeu. Le
climat NOURRIT cette tentation (il donne une vraie donnée à couronner). La correction ne l'aggrave
pas, elle la RÉSOUT si on borne explicitement le climat hors du siège de l'enjeu.

Ajouter à la fin de la section `CLÔTURE` (après « …ne fabriquez pas une seconde priorité pour
faire poids. ») :

```
Le climat ne se couronne jamais comme lieu de l'enjeu. L'enjeu se concentre toujours sur un fait
du logement ; un axe climatique peut expliquer pourquoi ce fait mérite l'attention, il n'est
jamais l'enjeu à lui seul, et la commune encore moins. Si aucun fait du logement ne porte
d'enjeu, la trajectoire du climat n'en fabrique pas un : dites que l'adresse est calme, et
arrêtez-vous là.
```

Effet : la clôture d'une adresse calme ne peut plus emprunter au climat/à la commune un enjeu de
substitution. Le climat n'est admis en clôture que subordonné à un fait de bâti déjà couronné.

---

## 4. Seuil éditorial de déclenchement

Conjonction stricte, évaluée par axe :

| intensité | forme autorisée | condition supplémentaire |
|---|---|---|
| `null` | l'axe n'existe pas dans le texte | — |
| `notable` | demi-phrase subordonnée, greffée à un fait de bâti déjà écrit pour une autre raison | le fait de bâti apparié est présent ET porte une fragilité |
| `marquee` | une phrase pleine, sujet = le logement, le climat en subordonnée décisive | idem + au plus UNE phrase pleine de croisement dans tout le texte |

- GATE dur = (intensité ≥ notable) ET (fait de bâti apparié présent) ET (ce fait est une
  fragilité, pas une force à rassurer). Une condition qui tombe → silence total sur l'axe.
- Deux axes qualifiés à la fois : une phrase pleine au plus (le plus décisif), le second reste
  demi-phrase. Le plafond v5 « trois phénomènes structurants » reste le plafond global ; le climat
  ne s'y ajoute pas en surnombre, il PONDÈRE un phénomène de bâti déjà compté.
- `climat_projete === null` (donnée DRIAS absente, cas Paris/Lyon/Marseille via fallback inclus,
  ou sous les planchers) → aucune mention climatique, aucune excuse.

---

## Justification synthétique

Le moat de cette phrase (« qu'aucun site immo ni climat ne peut produire seul ») tient
précisément à la CONJONCTION : la phrase n'existe QUE quand un fait grain-adresse (confort d'été
mal armé / exposition RGA) ET un axe climatique projeté coexistent. Le gate n'est donc pas une
prudence, c'est ce qui FABRIQUE la valeur : hors conjonction, il n'y a pas de croisement à
produire, seulement du bruit à taire. Le signal appauvri (codes, pas de prose, pas de direction)
force la reformulation à sujet-logement et ferme les deux dérives v5 (culture générale communale
hallucinée ; enjeu volé à la commune) au lieu de les rouvrir.

## Cohérence / doctrine

- Rien à porter dans `editoriale.md` à ce stade : les règles vivent dans le prompt, pas dans la
  doctrine transverse. Si le croisement se généralise à d'autres modules (Santé × Territoire),
  la règle « le signal externe arrive en code abstrait, jamais en prose pré-écrite, pour forcer
  la reformulation à sujet-module » mériterait d'être gravée. À rouvrir à ce moment-là.

## Version minimale (~90 % de la valeur)

Si on ne devait garder qu'UNE chose : **le signal en codes (`marquee`/`notable`/`null`), pas en
prose**, plus la règle « le climat vit en subordonnée d'un fait de bâti, jamais comme sujet ».
Ces deux gestes seuls ferment la récitation et la dérive de sujet. Le reste (dosage, clôture,
asymétrie) affine mais ne change pas la nature.

## Quand rouvrir ce sujet

- Générations réelles où le modèle sort quand même un chiffre ou une phrase à sujet-climat malgré
  le code abstrait → durcir le gate ou retirer le champ `horizon` du payload.
- Si « d'ici 2050 » produit une fausse précision perçue à l'usage → retirer l'autorisation de
  nommer l'horizon (garder seulement le présent de tendance).
- Si le Data Curator ne trouve pas de seuil prudent défendable sur SWI04 (distribution large,
  100+ jours) → `secheresse_sols` reste `null` par défaut jusqu'à calibration, on ne livre que
  l'axe chaleur en v1.
- Si l'asymétrie « fragilité seulement » est jugée trop négative en lecture d'ensemble → arbitrage
  porteur sur la mention neutre du bon cas (que je déconseille).

## Limites de mon regard (ce run)

- Je juge la prose et la structure du prompt, PAS le comportement réel du modèle : je n'ai pas
  lancé de génération. L'efficacité du gate en code abstrait est une hypothèse forte fondée sur
  le patron Territoire, pas une mesure. Le premier lot de générations réelles est le vrai juge.
- Je n'ai pas le rendu visuel de la synthèse dans le module (session payante) : je ne vois pas
  comment la demi-phrase climatique s'insère dans le rythme d'ensemble à l'écran.
- Je ne fixe pas les seuils numériques (NORTR/NORTX30D/NORSWI04 → marquee/notable) : c'est le
  Data Curator. Une mauvaise calibration ferait apparaître le climat trop souvent (bruit) ou
  jamais (moat inerte), et ma règle « en doute, null » ne suffit pas à la garantir seule.

---

## Révision v2 — symétrie + trois niveaux (décisions porteur, 2026-07-07)

La v1 est conservée au-dessus pour la trace. Trois changements tranchés par le porteur :
1. **Asymétrie « fragilité seulement » REJETÉE → symétrie sans valence.** Le silence sur le bon
   cas se lit « le modèle n'a rien trouvé » (fuite d'info en comparaison de deux logements) et
   casse la stabilité d'archi (le jour où la phrase climat s'enrichit d'ICU/étage/protections
   vérifiées, on la veut partout). Doctrine qui remplace « ne jamais réassurer » : **le climat
   ne change jamais le diagnostic, il change seulement le POIDS de certaines caractéristiques.**
   Le climat n'a AUCUNE valence propre ; il amplifie le poids de ce que le diagnostic a déjà dit,
   faiblesse OU force. Le lecteur tire la valence du diagnostic, jamais du climat.
2. **Gate repensé en registre ÉDITORIAL, pas statistique** : `absent` / `intégré` / `développé`.
   Le risque assumé n'est plus la fréquence (~70 % de présence acceptée) mais la RÉPÉTITION.
3. **Règle anti-formule explicite** (le vrai problème) : le gate règle la structure, pas la
   sameness. Un LLM recolle la même queue partout → tapisserie par formule. La nuance climat
   réutilise le vocabulaire du fait précis qu'elle colore et VARIE sa charnière.

Contraintes conservées : signal en codes (pas de prose, pas de `direction`) ; climat = subordonnée,
jamais sujet ; aucun chiffre / « selon les projections » / prédiction de vécu ; « d'ici 2050 »
une fois. **v1 = axe CHALEUR seulement** ; `secheresse_sols` = `null` en v1 (pas de seuil
défendable sur SWI absolu), la règle sécheresse→RGA reste écrite dans le bloc mais aucun exemple
ne l'utilise.

### Bloc `LE CROISEMENT AVEC LE CLIMAT À VENIR` — version v2 (verbatim, prêt à coller)

```
LE CROISEMENT AVEC LE CLIMAT À VENIR
Le payload peut porter un champ climat_projete (horizon 2050). Il ne contient aucun chiffre :
seulement, pour deux axes, une intensité de tendance (marquee, notable, ou rien). Ces axes
n'existent dans votre texte que pour changer le POIDS d'une caractéristique du logement déjà
posée, jamais pour eux-mêmes. Le climat ne change jamais le diagnostic, il change seulement ce
qui, dans ce logement, compte davantage à l'avenir. Il n'a aucune valence propre : il n'annonce
ni un mieux ni un pire, il pèse sur ce que le diagnostic a déjà dit, que ce soit une faiblesse
ou une force. La faiblesse pèse plus lourd, la force compte davantage : le lecteur tire le sens
du diagnostic, jamais du climat.
- Un seul appariement par axe, aucun autre. chaleur ne colore QUE le confort d'été (l'air qui
  traverse ou non, ce que les murs font de la chaleur, les protections aux fenêtres), qu'il soit
  bien ou mal armé. secheresse_sols ne colore QUE le retrait-gonflement des argiles à l'adresse,
  et seulement si l'adresse est dans un secteur exposé.
- Le climat n'est JAMAIS le sujet grammatical. Il tient dans une subordonnée qui pèse sur un fait
  du logement déjà écrit. Le sujet reste le logement ; l'axe dit qu'une caractéristique PREND PLUS
  DE POIDS ou COMPTE DAVANTAGE, jamais un ressenti daté, jamais une promesse.
- Vous ne prédisez aucune température intérieure, aucun vécu (« invivable en 2050 », « vous aurez
  trop chaud », « vous serez au frais » sont interdits), aucune conséquence mécanique sur le bâti.
  Vous ne dites pas « selon les projections », « les scénarios », « le réchauffement climatique » :
  vous nommez la tendance concrète (les étés qui se réchauffent, les nuits qui restent chaudes),
  au présent. L'horizon 2050 peut situer la tendance une seule fois (« d'ici 2050 »), jamais
  dater un vécu.

TROIS NIVEAUX D'EXPRESSION, selon l'intensité reçue
- absent (rien) : aucune mention du climat.
- integre (notable) : le climat COLORE une phrase de bâti déjà écrite pour sa propre raison. Une
  nuance greffée sur un fait existant, jamais une phrase neuve, jamais une idée neuve, jamais un
  paragraphe. Juste une teinte sur une phrase qui existait déjà. C'est ce niveau qui permet une
  présence fréquente sans jamais alourdir.
- developpe (marquee) : le climat mérite sa propre phrase pleine, dont le sujet reste le logement,
  sans valence. Au plus une phrase de ce genre dans tout le texte.

PAS DE FORMULE TYPE
La nuance climat n'a AUCUNE formulation canonique. Ne recollez jamais la même queue d'un rapport
à l'autre. Chaque fois, la nuance repart du VOCABULAIRE du fait précis qu'elle colore (l'air qui
ne traverse pas, l'inertie légère, les protections solaires du diagnostic) et VARIE sa charnière.
La répétition d'une même tournure d'un logement à l'autre est le défaut à éviter, autant que la
récitation de chiffres. Les exemples ci-dessous emploient à dessein des charnières et un
vocabulaire tous différents : c'est la variété qui est attendue, pas l'une de ces phrases.
Se dit (faiblesse colorée) : « Cet appartement ne traverse pas et le diagnostic indique une
inertie légère, un trait qui prendra du poids à mesure que les nuits d'été restent chaudes. »
Se dit (force colorée) : « Les protections solaires que renseigne le diagnostic continueront de
compter lorsque les fortes chaleurs se prolongeront. »
Se dit (force colorée, autre charnière) : « Cette ventilation traversante gagne en importance à
l'approche d'étés plus chauds. »
Se dit (niveau développé) : « Ce logement garde mal la fraîcheur, une caractéristique qui devient
plus décisive dans une trajectoire où les étés se réchauffent, d'ici 2050. »
Ne se dit pas : « D'ici 2050, les nuits chaudes se multiplient dans cette commune. » (le sujet a
glissé sur la commune, lecture Territoire, récitation.)
Ne se dit pas : « Bien ventilé, ce logement vous gardera au frais malgré la hausse des chaleurs. »
(promesse de vécu, valence prêtée au climat, interdit.)
```

### Table de gate révisée (v2)

| intensité | niveau | forme autorisée | condition |
|---|---|---|---|
| `null` | absent | aucune mention | — |
| `notable` | intégré | nuance greffée sur une phrase de bâti déjà écrite ; aucune phrase ni idée neuve | le fait de bâti apparié est présent (faiblesse OU force, sans filtre de valence) |
| `marquee` | développé | une phrase pleine, sujet = le logement, sans valence | idem + au plus UNE phrase développée dans tout le texte |

- La condition d'apparition n'est plus « une fragilité » mais « une caractéristique appariée
  existe à colorer » (symétrie). Plus de filtre de valence.
- Deux axes qualifiés : une seule phrase développée au plus (v1 : sans objet, chaleur seule).
- `climat_projete === null` (DRIAS absent, fallbacks Paris/Lyon/Marseille inclus, sous plancher,
  ou `secheresse_sols` en v1) → absent.

### Clôture — mise à jour v2 (symétrie)

Le texte v1 de clôture tenait par « le climat n'est jamais l'enjeu à lui seul ». La symétrie ne
le change pas sur le fond (le climat reste subordonné), mais il faut retirer la connotation
« fragilité ». Version à ajouter en fin de section CLÔTURE :

```
Le climat ne se couronne jamais comme lieu de l'enjeu. L'attention se concentre toujours sur une
caractéristique du logement ; le climat peut dire qu'elle pèsera davantage, il n'est jamais
l'enjeu à lui seul, et la commune encore moins. Si le logement ne porte pas d'enjeu marquant, la
trajectoire du climat n'en fabrique pas un : dites que l'adresse est calme, et arrêtez-vous là.
```

### Note de vigilance (limite de mon regard, v2)

La règle anti-formule est une consigne, pas une garantie : un LLM sous température basse peut
converger malgré tout vers une charnière dominante sur un gros volume. Le seul vrai contrôle est
de lire 10-15 générations réelles côte à côte et de compter les charnières répétées. Si une
tournure revient sur plus d'un tiers des rapports, il faudra soit élargir la liste d'exemples,
soit imposer une rotation par un signal externe (peu élégant). C'est le signal de réouverture
principal de ce sujet.
