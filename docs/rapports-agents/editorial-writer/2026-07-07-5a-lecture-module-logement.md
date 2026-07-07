# Rapport éditorial — 5a, la lecture du module Logement (ordre des 5 beats)

**Date** : 2026-07-07 · **Agent** : Editorial Writer (voix) · **Read-only.**

**Terrain lu (fichiers ouverts, texte cité verbatim)** :
`src/components/report/LogementModule.tsx` (orchestrateur + hero + notes),
`src/components/report/LogementSynthesis.tsx`,
`src/components/report/logement/{ProjectProbe,PropertyPassport,EnergieSection,RegulatorySection,SinistraliteSection,AutourSection,posture}.tsx`,
`docs/vault/modules/logement.md`, `docs/vault/doctrine/editoriale.md`,
ma passe précédente `docs/rapports-agents/editorial-writer/2026-07-07-synthese-logement-prompt.md`.

Colonne vertébrale jugée : 1. Identité courte · 2. Synthèse posture-neutre · 3. Preuves en
2 familles · 4. Autour · 5. « À vérifier avant de décider » (sonde + checklist par posture).

---

## Q1 — Nomme-t-on les beats ? Eyebrows et sous-titres des 2 familles

**Réponse courte : oui pour la synthèse et pour les 2 familles du beat 3 ; non pour un chapeau
« Ce qu'il faut retenir ».**

### Le chapeau « Ce qu'il faut retenir » est INTERDIT ici
La doctrine module le grave (`logement.md`, § divulgation progressive) : « **pas de chapeau
"ce qu'il faut retenir" global (redondant avec la synthèse IA)** ». La synthèse EST le retenir.
Un tel titre au-dessus d'elle serait un doublon, et au-dessus des preuves il ferait passer la
lecture détaillée pour un résumé. À bannir sous toutes ses variantes (« L'essentiel »,
« En bref », « Ce qui compte »).

### Beat 2 (synthèse) : garder l'eyebrow actuel « Lecture de ce logement »
Code actuel : `LogementSynthesis.tsx` L73, `eyebrow="Lecture de ce logement"`. Il tient. Il
localise sans résumer et ne dit pas « retenir ». **Micro-réserve** : « Lecture » nomme l'acte de
futur•e (léger biais méta). Non bloquant, l'usage est établi et discret. Si on voulait purger le
méta : supprimer l'eyebrow et laisser la prose ouvrir seule (elle attaque déjà par le bien, cf.
ma passe synthèse). **Verdict : DANS LA VOIX, garder tel quel.**

### Beat 3 : les 2 familles ONT besoin d'un sous-titre (structure aujourd'hui absente)
Constat de code : après la synthèse, `LogementModule.tsx` enchaîne cinq `ReportSection`
(`Énergie & rénovation`, `Risques du bâti`, `Statut réglementaire à cette adresse`,
`Sinistres indemnisés dans la commune`, puis `Autour…`) **sans aucun groupement**. Le
regroupement en 2 familles est donc du texte NEUF à poser. Sans lui, le lecteur voit cinq blocs
de même niveau et perd la distinction « propriété du bien » vs « exposition ».

- Famille A : **« Le logement lui-même »** → garder. Parle du bien du lecteur, honnête, sobre.
  (Le module écrit « le bien lui-même » ; « logement » est plus chaud et cohérent avec le reste
  de la page. Garder « logement ».)
- Famille B : **« Les expositions à cette adresse »** → fonctionnel mais légèrement clinique
  (pluriel abstrait). **Arbitrage que je pose, je ne tranche pas** :
  - Option B1 (garde le terme-frontière du module) : **« Les expositions à cette adresse »**.
  - Option B2 (plus lecteur, forme verbale) : **« Ce à quoi cette adresse est exposée »**.
  B2 est plus chaud et évite le mot « exposition » nu ; B1 est plus court pour un eyebrow et
  aligné sur le vocabulaire de frontière `logement.md`. Ma préférence légère : **B2** (la voix
  privilégie la phrase-pensée sur l'étiquette), mais B1 est parfaitement défendable si le Design
  Critic veut un eyebrow court.

**Tension frontière Design Critic (je la nomme)** : que ces 2 sous-titres soient rendus en
*eyebrow*, en *séparateur* ou en *intertitre* est SON arbitrage (structure de l'écran). Moi je
livre le texte des labels ; je ne décide pas de leur forme visuelle. Je signale seulement que
sans marqueur visible de groupe, les labels ne feront pas leur travail.

**Note anti-doublon** : les 5 eyebrows de section existants (Énergie & rénovation, Risques du
bâti, etc.) restent ; les 2 familles se posent AU-DESSUS d'eux, pas à leur place. Ne pas
retitrer les sections.

---

## Q2 — Bloc « À vérifier avant de décider » (le plus sensible)

Ce beat fusionne deux blocs de code existants : `ProjectProbe` (aujourd'hui tout en haut,
L402) et `Face2Implication` (aujourd'hui au milieu, eyebrow « Ce que cela mérite de vérifier »).

**Anti-doublon de titre** : si le beat s'intitule **« À vérifier avant de décider »**, l'eyebrow
interne actuel `Face2Implication` « Ce que cela mérite de vérifier » devient redondant. Le
supprimer : un seul titre pour ce beat.

### (a) Phrase d'intro — pose « votre projet change ce qu'il vaut la peine de regarder »
La bonne matière existe déjà dans `Face2Implication` L189 : « *cela oriente ce qu'il vaut la
peine de regarder* ». Je la remonte en tête de beat et je la nettoie de son ouverture
produit (« Ce logement relève d'au moins une zone réglementée… » = attaque par l'architecture).

- **Option 1 (deux phrases, ma préférée)** :
  « Ce que vous comptez faire de ce logement change ce qu'il vaut la peine de vérifier. Voici les
  points à documenter en priorité, selon votre situation. »
- **Option 2 (une phrase, plus sèche)** :
  « Selon ce que vous prévoyez pour ce logement, ces points méritent d'être vérifiés avant de
  vous engager. »

Aucune ne culpabilise, aucune ne prescrit, aucune ne parle du produit.

### (b) Principe de formulation des points par posture
Règle de voix, à graver :
- **Verbe de VÉRIFICATION toujours**, jamais un verbe qui décide ni qui alarme.
  - Acheteur (posture `prospection`) : **demander, exiger, obtenir les pièces, consulter,
    faire chiffrer, se renseigner**.
  - Résident (posture `residence`) : **surveiller, conserver, documenter, repérer, vérifier
    avant travaux**.
- **Jamais** : un montant en euros ; « vous devriez » / « il faut » / « pensez à » ; un futur
  prédit (« votre maison fissurera », « vous serez surprimé ») ; un point d'exclamation ;
  un tiret cadratin.
- **Toujours dire l'échelle** quand le fait est communal (sinistralité).
- Ne jamais conclure à la place de Santé/Territoire (pas de pollution, pas de valeur du bien).

### (b bis) 5 points rédigés, version ACHETEUR et version RÉSIDENT (prêts à poser)

**1. Sol argileux (retrait-gonflement)**
- Acheteur : « Demandez si des fissures ou des sinistres liés à la sécheresse ont déjà été
  déclarés, et faites examiner l'état des murs et des fondations avant de vous engager. »
- Résident : « Surveillez l'apparition de fissures sur les murs et les façades, et conservez les
  constats et les justificatifs de travaux. »

**2. Zone réglementée (plan de prévention au point)**
- Acheteur : « Consultez le règlement de la zone en mairie avant tout projet de travaux ou
  d'extension : lui seul dit ce qui est autorisé à cette adresse. »
- Résident : « Vérifiez le règlement de la zone avant d'engager une extension ou une rénovation
  lourde. »

**3. Étiquette énergétique basse (F / G)**
- Acheteur : « Demandez le DPE complet et, s'il existe, l'audit énergétique : la classe
  conditionne la mise en location et le calendrier des travaux. »
- Résident : « Rassemblez le DPE et l'audit énergétique s'il existe : ils situent les travaux qui
  pèseront sur une future mise en location. »

**4. Confort d'été à surveiller**
- Acheteur : « Renseignez-vous sur le comportement du logement en été (orientation, isolation de
  la toiture, protections solaires) : le diagnostic ne dit pas ce qu'on y ressent. »
- Résident : « Repérez les pièces les plus exposées à la chaleur d'été : c'est là que se jouera le
  confort lors des prochaines canicules. »

**5. Sinistralité active dans la commune**
- Acheteur : « Demandez au vendeur l'état des risques et l'historique des sinistres du bien : la
  commune en a connu, sans que cela concerne forcément ce logement. »
- Résident : « Conservez les déclarations de sinistres et d'indemnisation : elles documentent
  l'exposition réelle du bien, au-delà de la statistique communale. »

Ces points ne franchissent aucune ligne rouge du module (assurance non prédite, échelle dite,
DPE lu comme photographie datée et non comme dette, aucun euro).

**Où le texte de `Face2Implication` touche déjà juste** (à ne pas casser) : la phrase « Rien
n'est certain pour ce bien, mais cela oriente ce qu'il vaut la peine de regarder » désamorce
l'inférence sans éteindre l'utilité. Le couple demander/consulter (acheteur) vs
surveiller/conserver/vérifier (résident) est déjà exactement le bon registre. On l'étend, on ne
le refait pas.

---

## Q3 — La sonde projet : le libellé tient-il en beat 5 ?

Code actuel (`ProjectProbe.tsx` L16) : « **Quel est votre projet sur ce logement ?** » +
4 boutons (J'y vis / J'envisage d'acheter / Je loue ou vais louer / Autre).

**Verdict : À RETOUCHER (léger).** « projet **sur** ce logement » est une tournure un peu
possessive et froide. Juste avant la checklist, l'amorce doit ouvrir la personnalisation
naturellement.

- **Reformulation proposée** : « **Que comptez-vous faire de ce logement ?** »
  (plus direct, part du lecteur, enchaîne sur les verbes d'action de la checklist).
- Boutons : **inchangés**, ils sont justes (« J'y vis » / « J'envisage d'acheter » / « Je loue ou
  vais louer » / « Autre »).

Ne PAS ajouter d'amorce du type « pour ajuster ces points à votre cas » : ça décrirait le
mécanisme du produit. La phrase d'intro (a) porte déjà le « pourquoi on vous demande ». La sonde
reste une simple question.

**Coup de projecteur sur le déplacement (cohérent avec la doctrine gravée)** : la sonde descend
du haut vers le beat 5. C'est doctrinalement JUSTE : « la personnalisation par posture vit
UNIQUEMENT dans la checklist, jamais dans la synthèse ». La synthèse (beat 2) se génère donc
posture-neutre, avant que la sonde soit répondue. Le code le supporte déjà (`requestAutour`
part sur `"residence"` par défaut, `POSTURE_FOR_PROJET`), et la synthèse est gatée sur les FAITS,
pas sur la posture (`buildFactHash`). Rien à corriger côté voix, je le note pour l'implémenteur.

---

## Q4 — Identité courte (beat 1) : garde-t-on « Classé {X} au diagnostic énergétique. » ?

Code : `PropertyPassport.tsx`. Dans la même carte, le DPE apparaît **trois fois** :
1. le sceau `DpeBadge` (glyphe coloré, L52),
2. la caption « **DPE {X}** » sous le sceau (L54),
3. la phrase « **Classé {X} au diagnostic énergétique.** » sous l'adresse (L66).

**Verdict : garder la PHRASE (3), c'est elle l'identité honnête.** La lettre seule est un glyphe ;
la phrase est la lecture en clair du sceau, celle qu'un humain prononce (« c'est un F »). Elle est
distinctive et identitaire : le DPE fait partie de l'identité d'un bien, comme sur toute annonce.
Elle ne verdict pas (elle nomme une classification, elle ne dit ni « dette » ni « mauvais »).

**Ce qui est de trop, c'est la caption (2) « DPE {X} »** : redondante avec le sceau juste
au-dessus ET avec la phrase juste en dessous. Trois occurrences dans un carré de 6 cm, c'est le
sceau qui se répète en texte. **Recommandation : supprimer la caption « DPE {X} » (L54)**, garder
sceau + phrase. *Frontière Design Critic* : la caption est un élément visuel du badge ; je signale
le doublon, la coupe est son geste. Moi je tranche que **la phrase, elle, reste**.

Sur « le DPE revient dans les preuves » (Énergie, beat 3) : ce n'est PAS un doublon gênant. Beat 1
porte l'identité (une lettre + une phrase) ; beat 3 porte le détail décisionnel (conso, GES,
audit, échéance). La lettre qui réapparaît est normale, tant que le beat 1 ne pré-empte pas la
lecture (il ne le fait pas : une phrase neutre).

---

## Q5 — Sinistralité : cadrer pour qu'elle ne soit jamais lue « ce logement a déjà coûté »

Bloc `SinistraliteSection.tsx`, eyebrow « **Sinistres indemnisés dans la commune** » (L105).

**Ce qui touche déjà juste** : l'eyebrow dit « dans la commune » (échelle honnête d'entrée), et
la phrase N1 (L108-109) est bonne : « *Ces chiffres ne prédisent ni un sinistre pour ce logement,
ni le prix de son assurance.* » Le titre concret « Sinistres indemnisés » est meilleur que
« Sinistralité » (plus lisible, moins jargon) : garder « Sinistres indemnisés dans la commune ».

**Le vrai risque n'est pas le titre, c'est la COLLISION D'ÉCHELLE avec la famille B.** Placer un
bloc au grain COMMUNE (« dans la commune ») à l'intérieur d'une famille intitulée « à cette
adresse », à côté de deux blocs réellement au point (Risques du bâti à la parcelle, Statut
réglementaire au point géocodé), c'est exactement ce que `logement.md` interdit : « ne jamais
faire passer une classe communale pour votre adresse ». Le lecteur peut agréger mentalement le
gros nombre (« 10 000 à 20 000 € ») à SON logement.

**Deux corrections de prose (je ne touche pas au layout)** :

1. **Durcir la phrase N1 pour qu'elle mène par l'échelle ET tranche le lien au bien** (remplace
   L108-109) :
   « À l'échelle de la commune, voici ce que les assureurs ont indemnisé par le passé. Ces
   montants ne disent rien de ce logement en particulier, ni du prix de son assurance. »
   (Attaque par l'échelle, sépare explicitement « ce logement », évite l'empilement de doubles
   négations « ni… ni… » de la version actuelle.)

2. **Ré-ancrer l'échelle sur le NOMBRE lui-même**, là où l'inférence se fait. Caption du coût
   (L67) : « coût moyen d'un sinistre indemnisé » → « **coût moyen d'un sinistre indemnisé dans la
   commune** ». Le mot d'échelle voyage alors avec le chiffre, pas seulement dans le chapeau.

**Tension que je pose (frontière Design Critic + Architecte du beat)** : la vraie solution serait
peut-être de **ne pas ranger la sinistralité communale comme pair des blocs adresse** dans la
famille B, mais de la marquer visiblement « contexte communal » (un cran en retrait, ou une
mini-transition d'échelle « On élargit ici à la commune : à l'adresse, aucune donnée d'assurance
n'existe. »). Le texte de transition, si on le veut, je le fournis ; le choix de la traiter comme
pair ou comme contexte est un arbitrage de structure que je ne tranche pas seul.

---

## Q6 — Liaisons manquantes et textes de trop

### Liaisons MANQUANTES
- **Beat 2 → beat 3** : le passage synthèse → preuves est aujourd'hui abrupt (5 sections nues).
  La liaison, c'est le sous-titre de famille « Le logement lui-même » (Q1). Une fois posé, aucune
  phrase de transition supplémentaire n'est nécessaire.
- **Beat 4 → beat 5** : c'est LE saut de registre, de la description à l'action. La liaison
  obligatoire est la phrase d'intro (a) de Q2. C'est la seule transition vraiment nécessaire de
  tout le parcours.
- **Beat 3-fam.B → beat 4** : « Les expositions à cette adresse » puis « Autour de cette
  adresse » se ressemblent (les deux disent « à cette adresse »). Risque de confusion
  exposition/agrément. Non bloquant si la famille B prend l'option B2 « Ce à quoi cette adresse
  est exposée » (Q1) : le contraste avec « Autour » redevient net.

### Textes de TROP (à supprimer / réécrire)

1. **Hero sub (L286-288)** — À RÉÉCRIRE. « *Vous y lisez la performance énergétique du bien, son
   exposition aux risques naturels, ce que les sinistres ont déjà coûté à assurer dans la commune,
   et ce qui entoure la porte.* » Deux fautes : (i) c'est une **énumération du contenu du module**
   (architecture, `editoriale.md` « la page s'adresse au lecteur, pas à elle-même ») ; (ii)
   « **ce que les sinistres ont déjà coûté à assurer** » est EXACTEMENT la lecture « ça a déjà
   coûté » que le bloc sinistralité passe sa vie à désamorcer. Le hero contredit le bloc.
   - Réécriture : « Une adresse suffit. Vous lisez ce qui pèse vraiment sur ce logement : sa
     performance énergétique, ce à quoi son adresse est exposée, et ce qui l'entoure. »

2. **Intro de la 2e section (L308-310)** — À SUPPRIMER (doublon). « *Entrez une adresse pour lire
   ce logement précis : sa performance énergétique, les risques du bâti, ce que le passé a coûté à
   assurer, et ce qui se trouve autour.* » C'est la **même énumération** que le hero, à quelques
   mots près, et elle reporte « ce que le passé a coûté à assurer ». Deux énumérations du contenu
   à 20 lignes d'écart = texte de trop. Garder le titre « Analyser un logement précis. » et une
   consigne d'action nue (« Entrez une adresse. »), sans re-lister les modules.

3. **Note inter-commune (L385-399)** — À RETOUCHER. « *Les modules Territoire et Santé peuvent
   rester calés sur votre commune principale, {defaultCommune}.* » Parle de l'**architecture en
   modules** au lecteur (spectateur du produit). Réécrire côté lecteur : « Cette analyse porte sur
   ce bien à {city}. Votre commune principale reste {defaultCommune}. » (le fait, sans nommer les
   modules).

4. **RegulatorySection, note multi-plans (L147)** — À RETOUCHER (léger). « *Leur ordre sert la
   lecture.* » décrit le choix d'affichage de l'UI (architecture). Couper la demi-phrase :
   « Ces zonages peuvent concerner des phénomènes ou des règlements différents. » suffit.

### Ce qui est DÉJÀ sobre et juste (ne pas toucher)
- `AutourSection` intro « Les équipements et repères cartographiés les plus proches du
  logement. » : sobre, honnête sur OSM, part du lieu. Garder.
- `SinistraliteSection` rappel assurance « La surprime CatNat est fixée nationalement. » : exact,
  non prédictif. Garder.
- Les états A/B/C du statut réglementaire (« Cela ne signifie pas que le logement est exempt de
  tout risque. ») : honnêteté d'incertitude exemplaire. Garder.

---

## Verdict global du beat-map

| Beat | Élément | Verdict |
| --- | --- | --- |
| 1 | Passeport, phrase « Classé {X}… » | DANS LA VOIX (garder) ; caption « DPE {X} » = À SUPPRIMER |
| 2 | Synthèse, eyebrow « Lecture de ce logement » | DANS LA VOIX |
| 3 | Familles « Le logement lui-même » / famille B | À CRÉER (texte neuf) ; arbitrage B1/B2 posé |
| 3 | Sinistralité, N1 + caption coût | À RETOUCHER (échelle sur le nombre) |
| 4 | Autour | DANS LA VOIX |
| 5 | Intro + sonde + checklist posture | À CRÉER (intro + points fournis) ; eyebrow interne « Ce que cela mérite de vérifier » À SUPPRIMER (doublon du titre de beat) |
| Hero + intros | énumérations du contenu | À RÉÉCRIRE / À SUPPRIMER (product-speak) |

---

## Cohérence (tensions posées, non tranchées)
- **Titre du beat 5 « À vérifier avant de décider »** : compatible avec « futur•e ne décide pas »
  (le verbe « décider » reste au lecteur, cf. « Tranchez sans deviner »). OK pour moi. Je le
  signale seulement pour que personne ne le lise comme une injonction.
- **Famille B nommée B1 vs B2** : arbitrage de goût + frontière Design Critic (forme du sous-titre).
- **Sinistralité pair vs contexte** dans la famille B : arbitrage de structure (Architecte du beat
  + Design Critic). Je fournis le texte dans les deux cas.

## Mise à jour de la doctrine (prête à écrire par Claude principal)
Deux règles stabilisées cette passe, candidates à `editoriale.md` (ou `logement.md`) :
1. **« Ne jamais énumérer le contenu d'un module dans un hero ou une intro. »** Le hero et la 2e
   intro du Logement listent tous deux « énergie, risques, ce que ça a coûté, alentours » :
   architecture affichée au lecteur, et « ce que ça a coûté » contredit le désamorçage
   sinistralité. Généralisable : un hero nomme l'enjeu pour le lecteur, jamais l'inventaire des
   blocs.
2. **« L'échelle voyage avec le chiffre, pas seulement dans le chapeau. »** Quand un grand nombre
   communal est affiché dans une zone « à cette adresse », le mot d'échelle doit figurer dans la
   caption du nombre lui-même, là où l'inférence se produit.

## Version minimale (~90 % de la valeur)
Si on ne fait qu'UNE chose : **poser les 2 sous-titres de famille au beat 3** (« Le logement
lui-même » / « Ce à quoi cette adresse est exposée ») **et la phrase d'intro du beat 5** (« Ce que
vous comptez faire de ce logement change ce qu'il vaut la peine de vérifier. »). Ces deux gestes
créent les deux seules articulations que l'ordre seul ne porte pas (groupement des preuves +
bascule description→action). Le reste (checklist rédigée, coupes de product-speak) est de
l'amélioration, pas de la structure manquante.

## Quand rouvrir ce sujet
- **Aux premières sessions payantes réelles** : si des lecteurs lisent la sinistralité communale
  comme « ce logement a déjà coûté » (support, verbatim, hésitation à l'achat), durcir jusqu'à
  sortir le bloc de la famille « à cette adresse » (le traiter en contexte communal explicite).
- **Si la checklist par posture génère des demandes de gestes précis** (« combien ça coûte de
  reprendre les fondations ? ») : signal que les verbes de vérification glissent vers du conseil
  chiffré interdit ; resserrer sur demander/consulter/surveiller.
- **Si le beat 5 fait décrocher** (taux de réponse à la sonde bas) : revoir l'amorce, peut-être
  déclencher la checklist en posture neutre par défaut avant même la réponse.
- **Quand le module Santé existera** : les points « pollution/industrie » ne doivent jamais
  apparaître dans cette checklist Logement ; re-vérifier la frontière à ce moment.
- **Quand le Design Critic tranchera la forme des sous-titres de famille** : revalider que le
  texte des labels tient dans le format qu'il choisit (eyebrow court → B1 ; intertitre → B2).

## Limites de mon regard (ce run)
- Je juge la PROSE et l'ORDRE sur le code lu, pas le rendu à l'écran : je ne vois pas si les
  2 familles « respirent » visuellement, ni si la sinistralité communale « saute » ou non à côté
  des blocs adresse. L'effet réel de la collision d'échelle est en partie visuel (Design Critic).
- Je n'ai pas lu `ThermalComfortSection.tsx` (Chaleur, famille A) en entier ce run : je place son
  eyebrow dans la famille « Le logement lui-même » par déduction, sans avoir vérifié son texte mot
  à mot.
- Je juge la checklist sur cinq cas types (RGA, zone, F/G, confort d'été, sinistralité). Je n'ai
  pas la matrice complète des combinaisons de faits que le déterministe produira : un cas rare
  (plusieurs zonages + deux périls actifs + passoire) peut empiler trop de points et fatiguer ;
  ça ne se verra qu'à l'intégration, avec des adresses réelles.
- Je ne mesure ni conversion ni A/B : je protège la justesse de la voix, pas la performance.
