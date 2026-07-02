# Rapport éditorial — bloc « Ce que le passé assurantiel dit » (Logement, Face 2)

Fichier jugé : `src/components/report/LogementModule.tsx`, composants `PerilLine`
(l. 259-279) et `SinistraliteBlock` (l. 281-299). Texte réel cité, pas paraphrasé.

Doctrine mobilisée : `docs/vault/doctrine/editoriale.md` (piliers du ton, « la page
s'adresse au lecteur pas à elle-même », tirets cadratins interdits, glossaire des termes à
traduire), `docs/vault/modules/logement.md` (assurance documentée jamais prédite, « les biens
assurés » jamais « les maisons d'ici », toujours l'échelle), invariants n°3 (source/limites),
n°5 (ne pas affirmer au-delà de la preuve), n°6 (intelligence pas peur). Fiches `/memory` :
`feedback_no_em_dash`, `feedback_no_antithese`.

Question-mère : le lecteur achète/habite un bien précis et se demande ce que le risque a
*réellement coûté ici*. Le bloc lui fait-il sentir qu'on comprend ça AVANT de parler de la
donnée, sans promettre au-delà de la preuve ?

---

## Le constat transverse (avant d'entrer état par état)

Le bloc est **honnête et discipliné** : il ne prédit rien, respecte « les biens assurés »,
« répertorié », l'échelle commune, la période 1995-2021, et surtout il refuse l'optimisme
fabriqué (« un historique vide n'exclut pas une exposition future »). C'est du bon futur•e sur
le fond.

Mais il a un défaut de **posture d'entrée** : il ouvre sur le mécanisme administratif de la
donnée (« les sinistres indemnisés au titre des catastrophes naturelles ont eu… »), pas sur la
question du lecteur (« combien le risque a-t-il vraiment coûté, ici ? »). Le SectionLabel « Ce
que le passé assurantiel dit » désigne une abstraction (« le passé assurantiel ») qui « dit »
quelque chose, au lieu de nommer l'enjeu concret du lecteur : de l'argent, ici, déjà dépensé.

Et il porte **une violation dure et non négociable** : un tiret cadratin dans l'attribution.

---

## SectionLabel — « Ce que le passé assurantiel dit »

**Où ça touche juste** : le mot « passé » est exact et protège contre la prédiction (on ne
promet pas le futur). C'est cohérent avec la doctrine « documentée, jamais prédite ».

**Ce qui tiède** : sujet abstrait (« le passé assurantiel ») qui se personnifie (« dit »). Le
lecteur ne se reconnaît pas dans « le passé assurantiel » ; il se reconnaît dans « ce que ça a
coûté, ici ». Le titre parle de la nature de la donnée, pas de son enjeu.

**Réécriture proposée** :
- Option A (recommandée) : **« Ce que le risque a déjà coûté ici »** — concret, argent + lieu,
  reste au passé (« déjà coûté »), reste honnête.
- Option B (plus sobre) : **« Ce que ce risque a coûté, ici »**.

**Verdict** : À RETOUCHER. Ce titre porte à lui seul la posture « lecteur d'abord » de tout le
bloc ; le changer permet de laisser les lignes factuelles rester factuelles.

---

## État « lecture » (représentativité suffisante)

**Texte** : « Sur 1995-2021, les sinistres {mecanisme} indemnisés au titre des catastrophes
naturelles ont eu, pour les biens assurés de cette commune, un coût moyen de {cout} et une
fréquence de {frequence}. Échantillon des assureurs (CCR) couvrant ici {representativite} du
marché. »

**Où ça touche juste** : la donnée utile (coût, fréquence) est là, bornée par la
représentativité affichée dans la foulée. C'est de la preuve, pas de l'affirmation. Les classes
verbatim en `<strong>` se lisent comme des jetons : bien.

**Ce qui trahit le ton** :
1. **Ouverture administrative.** « les sinistres indemnisés au titre des catastrophes
   naturelles ont eu… » : c'est le vocabulaire de l'assureur, pas la question de l'acheteur. Le
   lecteur attend « ce que ça a coûté ici » ; on lui sert la mécanique du régime. Contraire à
   « la page s'adresse au lecteur, pas à elle-même » (ici : pas au dispositif).
2. **Redondance juridique.** « au titre des catastrophes naturelles » est déjà porté par le
   titre du bloc ET par la pédagogie CatNat juste dessous. Répété, il alourdit sans informer.
3. **Rythme.** Une longue phrase dense (34 mots avant le point) puis une clause technique
   coupée (« Échantillon des assureurs (CCR) couvrant ici… », sans verbe). L'info-clé est
   enfouie au milieu de la longue phrase.

**Réécriture proposée** (garde-fous respectés : classes verbatim intactes, « les biens assurés
de cette commune », échelle + période, {mecanisme}/{cout}/{frequence}/{representativite}
préservés) :

- Version tighter (recommandée, le titre porte le CatNat) :
  « Sur 1995-2021, les sinistres {mecanisme} indemnisés pour les biens assurés de cette commune
  ont eu un coût moyen de {cout} et une fréquence de {frequence}. Établi sur l'échantillon CCR,
  qui couvre ici {representativite} du marché. »

- Version minimale (garde « au titre des catastrophes naturelles » par prudence, ne réordonne
  que la clause d'échantillon) :
  « Sur 1995-2021, les sinistres {mecanisme} indemnisés au titre des catastrophes naturelles
  ont eu, pour les biens assurés de cette commune, un coût moyen de {cout} et une fréquence de
  {frequence}. Chiffres établis sur l'échantillon CCR, qui couvre ici {representativite} du
  marché. »

**Verdict** : À RETOUCHER (pas à réécrire de fond : le contenu est juste, c'est l'entrée et le
rythme qui pèsent).

---

## État « aucun »

**Texte** : « Aucun sinistre CatNat {peril} répertorié par la CCR pour les biens assurés de
cette commune sur 1995-2021. L'échantillon couvre environ la moitié du marché : un historique
vide n'exclut pas une exposition future. »

**Où ça touche juste** : c'est le meilleur état du bloc. « répertorié » (pas « aucun sinistre »
sec) est respecté. Et la seconde phrase — « un historique vide n'exclut pas une exposition
future » — est du pur futur•e : elle refuse l'optimisme fabriqué (doctrine « le silence est
plus honnête que l'optimisme manufacturé ») et montre l'incertitude au lieu de la masquer
(invariant n°6, pilier « respect de l'intelligence du lecteur »). À NE PAS CASSER.

**Ce qui tiède (mineur)** : « CatNat » sec, alors que l'état « lecture » développe
« catastrophes naturelles ». Petite incohérence de registre entre les deux états.

**Réécriture proposée** (optionnelle, cosmétique) :
« Aucun sinistre {peril} indemnisé au titre des catastrophes naturelles n'est répertorié par la
CCR pour les biens assurés de cette commune sur 1995-2021. L'échantillon couvre environ la
moitié du marché : un historique vide n'exclut pas une exposition future. »

**Verdict** : DANS LA VOIX (retouche cosmétique facultative pour homogénéiser « CatNat »).

---

## État « faible_repr »

**Texte** : « Des sinistres {peril} sont répertoriés, mais l'échantillon assurantiel local est
trop mince (représentativité {representativite}) pour en tirer une lecture fiable. »

**Où ça touche juste** : honnêteté sur la limite de la donnée, respect de l'intelligence du
lecteur (on ne feint pas une précision qu'on n'a pas — invariant n°3, `doctrine/data.md`).
« répertoriés » respecté. Le « mais » ici est une vraie concession logique, pas l'antithèse
rhétorique bannie (« c'est X, pas Y ») : conforme à `feedback_no_antithese`.

**Ce qui tiède (mineur)** : « trop mince » est un cran familier ; « échantillon assurantiel
local » est un peu technique. Rien de bloquant.

**Réécriture proposée** (optionnelle) :
« Des sinistres {peril} sont répertoriés ici, mais l'échantillon assurantiel local est trop
réduit (représentativité {representativite}) pour en tirer une lecture fiable. »

**Verdict** : DANS LA VOIX.

---

## Pédagogie du régime CatNat (`SinistraliteBlock`)

**Texte** : « Le régime CatNat finance ces indemnisations par une surprime légale, aujourd'hui
uniforme au niveau national (portée à 20 % au 1ᵉʳ janvier 2025) : ce passé local ne fixe pas le
prix de votre assurance. Un débat en cours (rapport Langreney) pose la question d'une modulation
selon l'exposition locale. »

**Où ça touche juste** : « ce passé local ne fixe pas le prix de votre assurance » est le
garde-fou éditorial le plus important du bloc. Il coupe court à l'inférence individuelle que le
lecteur ferait sinon (« j'ai vu des sinistres, donc je serai surprimé »). C'est exactement la
frontière « documentée, jamais prédite » de `modules/logement.md`. Le débat Langreney est
décision-pertinent (si l'uniformité tombe, un bien très exposé pourrait voir sa prime bouger) :
il gagne sa place.

**Ce qui tiède** : le passage enterre son message-clé en milieu de phrase, après deux clauses
de mécanique (régime, surprime, uniformité, 20 %). Le lecteur reçoit la plomberie avant le
« et pour vous, ça veut dire… ». Dense pour un pied à fontSize 11.

**Réécriture proposée** (réordonner pour mener par l'enjeu lecteur ; 20 % et Langreney exacts
conservés) :
« Aujourd'hui, ce passé local ne fixe pas le prix de votre assurance : le régime CatNat finance
ces indemnisations par une surprime légale uniforme partout en France (portée à 20 % au
1ᵉʳ janvier 2025). Un débat en cours (rapport Langreney) pose la question d'une modulation selon
l'exposition locale. »

**Verdict** : À RETOUCHER (réordonnancement, pas réécriture ; le fond est juste et nécessaire).

---

## Attribution (pied)

**Texte** : « ONRN (État / CCR / Mission Risques Naturels), via Géorisques — sinistres
indemnisés 1995-2021, biens assurés particuliers et professionnels. »

**Ce qui trahit le ton** : **tiret cadratin (—)**. Violation dure et non négociable de
`feedback_no_em_dash` et de la doctrine éditoriale (« le marqueur le plus reconnaissable des
textes générés par IA »). L'exception « — comme marqueur pas-de-donnée » ne s'applique pas : ici
c'est une ponctuation de phrase.

**Réécriture proposée** (remplacer « — » par un point ; attribution et période exactes
conservées) :
« ONRN (État / CCR / Mission Risques Naturels), via Géorisques. Sinistres indemnisés 1995-2021,
biens assurés particuliers et professionnels. »

**Verdict** : À RETOUCHER — obligatoire, c'est le seul manquement dur du bloc.

---

## Faut-il supprimer / fusionner un état ?

Non. Les trois états `PerilLine` (lecture / aucun / faible_repr) portent chacun une information
décisionnelle distincte et honnête ; aucun n'est du « texte de trop ». La pédagogie CatNat n'est
pas contemplative : elle protège le lecteur d'une inférence fausse, elle mérite d'exister.
L'attribution est nécessaire (source + limites, invariant n°3). Rien à supprimer ici — la bonne
réponse est la retouche, pas le silence.

---

## Rythme et longueur

L'état « lecture » est le seul point de fatigue (une phrase de 34 mots + une clause coupée sans
verbe). Les réécritures ci-dessus rétablissent un rythme à deux temps (fait, puis borne de
preuve). Le reste du bloc respire bien.

## Honnêteté de la promesse

Solide. Aucune affirmation ne dépasse la preuve, aucun futur individuel n'est affirmé,
l'incertitude est montrée (« n'exclut pas une exposition future », « pour en tirer une lecture
fiable »). Le seul risque était l'inférence « sinistres passés → ma prime », désamorcé par la
pédagogie CatNat. Bien tenu.

---

## Cohérence (tensions posées à l'humain, non tranchées)

1. **Terme technique dans {mecanisme}.** La valeur interpolée « sécheresse (retrait-gonflement
   des argiles) » contient un terme que le glossaire éditorial demande de traduire
   (« mouvements des sols argileux qui peuvent fissurer les maisons »). Le garde-fou verrouille
   {mecanisme} ; je ne le réécris donc pas, mais je pose la tension : soit la valeur source est
   mise à jour vers une glose lisible, soit on assume le terme technique entre parenthèses. À
   arbitrer côté data-curator/porteur, pas par moi.
2. **Registre « CatNat » vs « catastrophes naturelles ».** Deux graphies coexistent selon
   l'état. Homogénéiser (proposé ci-dessus) ou assumer l'abréviation une fois le régime nommé.

## Mise à jour de la doctrine (prête à écrire)

Aucune règle nouvelle à graver : le bloc ne révèle rien qui ne soit déjà couvert par
`feedback_no_em_dash`, « documentée jamais prédite » et la posture « lecteur d'abord ». Si une
formulation devait être retenue comme modèle, c'est « ce passé local ne fixe pas le prix de
votre assurance » (bon patron de désamorçage d'inférence individuelle), citable dans
`modules/logement.md` comme exemple.

## Limites de mon regard (ce run)

- Je juge la prose, pas l'effet réel à l'écran : je n'ai pas le rendu (fontSize 11/9, densité
  visuelle du pied), donc je ne mesure pas si la pédagogie CatNat *fatigue* visuellement ou
  passe. Le Design Critic tranchera la charge de l'écran.
- Je n'ai pas vu les valeurs verbatim réellement injectées ({cout}/{frequence}/
  {representativite}) sur une commune concrète : je juge la structure de phrase, pas le rendu
  « coût moyen de Entre 10 et 20k€ », dont la grammaire peut heurter selon la classe.
- Je n'ai pas parcouru les Faces 1/3/4 du module : je ne sais pas si l'ouverture « lecteur
  d'abord » que je réclame ici est déjà portée en amont dans le module (auquel cas mon retitrage
  serait redondant).
- Aucune mesure d'usage : je ne sais pas si le lecteur lit ou saute ce pied ; mon jugement de
  rythme est doctrinal, pas observé.

## Version minimale (~90 % de la valeur)

Deux gestes suffisent :
1. **Supprimer le tiret cadratin** dans l'attribution (obligatoire, doctrine dure).
2. **Retitrer le bloc** en « Ce que le risque a déjà coûté ici » : ce seul mot d'entrée fait
   basculer tout le bloc du côté du lecteur, sans toucher les trois lignes factuelles.

Le reste (réordonner « lecture » et la pédagogie CatNat) est du raffinement de second rang.

## Quand rouvrir ce sujet

- Si une mesure d'usage montre que le lecteur saute le pied CatNat : re-questionner sa longueur
  (candidat à compression, pas à suppression).
- Si la valeur {mecanisme} est un jour glosée à la source : retirer la tension n°1.
- Si le débat Langreney aboutit (modulation locale votée) : la phrase « aujourd'hui uniforme »
  devient fausse et doit être réécrite d'urgence — c'est une phrase datée par construction.
- Si les Faces 1/3/4 adoptent déjà une entrée « lecteur d'abord » forte : réévaluer si le
  retitrage reste nécessaire ou devient redondant.
