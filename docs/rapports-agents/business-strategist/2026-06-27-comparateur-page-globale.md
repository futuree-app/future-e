# Audit business — Page comparateur « mode choix » + paywall Pack 39 €
Date : 2026-06-27 · État : main @99ab154 · Branche de travail : feat/comparateur-mode-choix
Terrain lu : vision/modele-economique.md, ADR-0007 (bundle), ADR-0008 (B2B relais),
arbitrages/pricing-abonnements-reportes.md. Code : comparateur/page.tsx (CTA Pack),
ModeChoixSynthese.tsx, ThemeExplorer.tsx, pack-decision/page.tsx, ChoixConvictionView.tsx.

## Le goulot aujourd'hui
La disposition à payer B2C, non mesurée. C'est écrit noir sur blanc dans la doctrine :
« la disposition à payer est la variable à instrumenter EN PREMIER (clic CTA payants, taux
paywall → paiement), avant toute dépense d'acquisition » (modele-economique.md, hiérarchie de
preuve). Tout se lit à travers ça.

## Constat décisif (la vraie question)
Le débat porté ici — « visibilité de la valeur > prix », retrait du « sans engagement »,
cannibalisation de la phrase d'arbitrage — optimise une variable que **personne ne peut lire**.

Vérifié dans le code : le funnel payant n'est PAS instrumenté.
- `posthog`/`capture` présents dans `ModeChoixSearch.tsx` et `ModeChoixAsk.tsx` (haut de funnel),
- **ABSENTS** de `comparateur/page.tsx` (le clic CTA Pack · 39 €),
- **ABSENTS** de tout `pack-decision/` (page de conviction choix, `PackPaymentPanel`).

Autrement dit : les deux événements qui MESURENT le goulot — clic CTA payant et paywall →
paiement — sont aveugles. On réécrit la copy d'un paywall dont on ne mesure ni le taux de clic,
ni le taux de conversion. C'est l'inversion exacte de l'invariant n°8 (les preuves, pas les
intérêts/espoirs).

**Mauvaise question, donc.** La variable dominante n'est pas « quelle copy convertit le mieux »,
c'est « pose les 3 `capture()` qui rendent le goulot visible ». Tant qu'ils manquent :
- l'analyse ChatGPT (« problème de visibilité, pas de prix ») est une hypothèse, asséné comme un
  diagnostic. Plausible, mais non fondée. Elle peut être vraie, fausse, ou hors-sujet (le goulot
  pouvant être en amont : le gratuit qui répond déjà à « laquelle ? »).
- le retrait de « sans engagement » est un pari échangé contre un autre pari, illisible.
- la cannibalisation de la phrase d'arbitrage est l'hypothèse la plus inquiétante, et elle aussi
  invisible.

## Réponses aux trois questions posées

(a) « Visibilité de la valeur > prix » est-il la bonne variable dominante ?
Non, pas la PREMIÈRE. C'est peut-être la deuxième. La première est l'instrumentation. Et il
existe un candidat-goulot plus en amont que la visibilité : **le gratuit en montre peut-être
trop pour un usage de départage**. En mode choix, le job-to-be-done est binaire — « laquelle ? ».
Or le gratuit livre déjà : la synthèse IA streamée + la **phrase d'arbitrage déterministe**
(`ModeChoixSynthese`, qui nomme la divergence et qui domine) + identité/compromis par commune +
1 thème en matrice complète + 1 thème au choix du lecteur + 2 questions AskFuture. Pour
quelqu'un qui veut juste savoir laquelle pencher, ça peut **suffire**. Le Pack vend alors « le
détail critère par critère » là où le lecteur a déjà sa réponse. Ce n'est pas un problème de
visibilité de la valeur du Pack : c'est que la valeur décisionnelle a peut-être déjà été donnée.
Hypothèse, à mesurer — pas un fait.

(b) Le retrait de « sans engagement / paiement unique » aide-t-il ou nuit-il ?
Indéterminable en l'état, mais mon biais : **prudence sur le retrait**. Raison psychologique
(hypothèse) : à 39 € pour une marque inconnue, la peur n'est pas « est-ce trop cher » mais « dans
quoi je m'engage ». Surtout que l'écosystème futur•e contient un abonnement (« Le Fil ») : retirer
« paiement unique » réintroduit l'ambiguïté « est-ce que ça va me reprélever ? ». « Paiement
unique » n'est pas une rassurance de risque faible, c'est une **désambiguïsation anti-abonnement**.
Le remplacer par « savoir laquelle correspond à votre façon d'habiter » échange un réducteur de
friction contre un cadrage de valeur. Les deux peuvent coexister ; ce n'est pas l'un OU l'autre.
Mais trancher sans mesure = deviner. C'est une variante A/B, coût quasi nul, à lire APRÈS
instrumentation.

(c) La phrase d'arbitrage gratuite cannibalise-t-elle ?
C'est le vrai risque stratégique de la page, plus que la copy du CTA. La phrase de
hiérarchisation déterministe + la synthèse donnent la **lecture du choix** avant le paywall.
Pour créer l'envie, il faut révéler une TENSION non résolue, pas la trancher. Aujourd'hui la
page oscille : elle veut l'effet wow (donner) ET vendre la suite (retenir). Si la mesure montre
un fort taux de clic CTA mais une faible conversion sur la page de conviction → la valeur est
visible, c'est ailleurs. Si le clic CTA lui-même est faible → le gratuit a rassasié. Cette seule
distinction, qu'aucune copy ne tranchera, oriente toute la suite. Elle coûte 1-2 h à instrumenter.

## Marché et coût
Qui paie : le ménage en départage actif (2 offres d'emploi, une mutation), haute intention,
moment d'engagement long. Bon segment, cohérent avec la thèse. Ce qu'il achète vraiment :
probablement une **tranquillité d'esprit** (« je ne me suis pas trompé »), pas 27 dimensions.
Le coût n'est pas le levier ici : marge ~91 %, 39 € face à l'ancre « coût d'une commune mal
choisie ». L'ancre valeur est juste. Le levier est la lisibilité de la conversion, pas le prix
ni la marge.

## Effet sur le moteur
Les retouches de copy n'améliorent ni qui paie, ni pourquoi, ni quand, ni pourquoi il revient.
Elles ajustent un revenu ponctuel sans déplacer le « quand » vers la durée. Impact moteur : faible
et, surtout, non observable. L'instrumentation, elle, alimente directement la mesure du goulot.

## Effet sur le moat et les actifs
Une copy qui change ne compose pas : c'est un one-shot, rien ne s'accumule. L'instrumentation du
funnel, à l'inverse, alimente le **capital de compréhension** (comment les gens convertissent) —
un actif de connaissance au sens de la doctrine, qu'aucun concurrent ne télécharge. Même par la
lentille moat, instrumenter > réécrire.

## Effet sur les boucles
La copy ne nourrit ni l'apprentissage ni la prescription. L'instrumentation nourrit la boucle
d'apprentissage (décisions réelles observées → meilleure doctrine de conversion). C'est le cœur
circulaire du modèle, pas un détail technique.

## Niveau de preuve
- Pari traité comme fait n°1 : « problème de visibilité, pas de prix » (ChatGPT). Non fondé.
- Pari traité comme fait n°2 : retirer « sans engagement » améliore la conversion. Non fondé.
- Pari traité comme fait n°3 : la phrase d'arbitrage gratuite crée l'envie sans cannibaliser.
  Non fondé, et le plus risqué.
Tous reposent sur le pari central non démontré : le consentement à payer B2C.

## Invariants et principes
- n°8 (preuves > intérêts) : directement touché. Décider la copy sans mesurer le funnel viole
  l'esprit de l'invariant.
- n°1 / n°2 (on éclaire, pas de score, le verbe qui tranche reste au lecteur) : RESPECTÉS.
  « Tranchez sans deviner », « aucun classement, aucun score » sont fidèles.
- Rejet des badges « centaines d'indicateurs » : DÉCISION CORRECTE. C'était du revenu vanité de
  positionnement (gonfler la preuve), contraire à « près de 30 critères, jamais un rond faux »
  (feedback_positionnement_compatibilite) et à n°8. Victoire défensive, à conserver.

## Risques structurants
- Risque n°2 (paiement B2C non démontré) : la décision ne l'atténue PAS tant que le funnel est
  aveugle ; l'instrumentation, oui.
- Risque n°1 (catégorie mal comprise) : le retrait du compteur et la voix « façon d'habiter »
  vont plutôt dans le bon sens (intelligence territoriale > comparateur de plus).
- Risque n°5 (écart intention-action) : la cannibalisation possible du gratuit l'aggrave (on
  satisfait la réflexion gratuitement).

## Coût d'opportunité et pourquoi maintenant
Pendant qu'on débat « sans engagement » vs « façon d'habiter », on n'écrit pas les 3 `capture()`
qui éclaireraient le goulot officiel du projet. Effort comparable (heures), payoff incomparable :
la copy donne une opinion de plus, l'instrumentation donne la première donnée réelle sur le pari
central. Pourquoi maintenant : précisément parce qu'on s'apprête à itérer la copy — itérer à
l'aveugle est le pire moment. Instrumenter d'abord rend chaque itération suivante lisible.

## Le vrai pari
Le pari n'est pas le prix ni le wording. C'est : « le lecteur en départage, à qui le gratuit a
déjà nommé laquelle pencher, paiera quand même 39 € pour le détail critère par critère. » Nommer
ce pari change toute la lecture : la question n'est pas comment mieux vendre le détail, c'est si
le détail vaut 39 € une fois la réponse donnée. Seule la mesure tranche.

## Vue extérieure (investisseur)
Un investisseur regardant cette page dirait : « Vous avez construit un funnel payant complet et
vous ne mesurez pas le clic d'achat ni la conversion ? Montrez-moi le taux paywall → paiement
avant de me montrer une nouvelle copy. » C'est l'évidence que la vue interne rate.

## Verdict
- Copy du CTA / retrait « sans engagement » / phrase d'arbitrage : **DIFFÉRER** le débat.
  Condition de levée : funnel instrumenté + ~200-300 sessions de départage observées (clic CTA,
  vue conviction, clic paiement, succès). Alors on lit, alors on tranche par la donnée.
- Action prioritaire immédiate : **POURSUIVRE** sur l'instrumentation (3 events).
- Rejet des badges gonflés : **POURSUIVRE / GRAVER** (bon refus).
- Recommandation latérale forte : remettre « paiement unique » comme désambiguïsation
  anti-abonnement (pas comme rassurance de risque), à tester en variante, pas à trancher à l'opinion.

## Si refus/report — formulé comme victoire
Dilution évitée : on n'a pas brûlé une semaine de porteur à peaufiner une copy dont l'effet est
illisible. Dette évitée : on n'a pas gravé « problème de visibilité » comme diagnostic acquis
alors que le goulot pouvait être en amont (gratuit trop généreux). Pari prématuré écarté :
réécrire un paywall non mesuré, c'est optimiser une variable hors goulot.

## Cohérence (tension non tranchée, posée à l'humain)
Tension réelle avec le Product Strategist : lui défend l'effet wow du gratuit (synthèse +
arbitrage = valeur lecteur immédiate, simplicité) ; moi je signale que ce même wow est le suspect
n°1 de cannibalisation. Ni lui ni moi ne tranchons : seule la mesure (clic CTA faible = wow
rassasie ; clic fort + conversion faible = valeur Pack mal vue) départage. À l'humain de décider
s'il instrumente avant d'itérer.

## Mise à jour de doctrine (prêt à écrire)
Dans modele-economique.md, hiérarchie de preuve : noter que le funnel Pack mode choix (clic CTA,
paywall → paiement) n'est PAS encore instrumenté au 2026-06-27, donc la conversion du tunnel
reste un pari non mesuré ET non mesurable en l'état — instrumentation = pré-requis P0 avant toute
itération de copy ou dépense d'acquisition.

## Table d'allocation
| | |
|---|---|
| Goulot actuel | Disposition à payer B2C, non mesurée — et le funnel Pack est aveugle |
| Variable dominante | L'instrumentation (clic CTA + paywall → paiement), pas la copy |
| Temps à investir | 1-2 h : 3 `capture()` (CTA page.tsx, vue ChoixConvictionView, clic PackPaymentPanel) |
| Impact attendu | Fort (rend le goulot officiel du projet visible pour la 1re fois) |
| Temps à NE PAS investir | Le débat « sans engagement » vs « façon d'habiter » et la chasse à la copy parfaite, tant que c'est aveugle |
| Priorité suivante | Après mesure : trancher cannibalisation du gratuit (clic CTA faible ?) vs visibilité du Pack (conversion faible ?) |
| Sujet à rouvrir | La copy du paywall, après ~200-300 sessions départage instrumentées |

Si j'étais CEO : j'arrête tout débat de copy ce soir, je câble les 3 events demain matin, et je
ne rouvre pas le wording du paywall avant d'avoir lu le taux clic-CTA et le taux paywall →
paiement sur quelques centaines de départages.
