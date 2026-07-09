# Cadrage stratégique — « Le Fil » · lentille Product Strategist

Date : 2026-07-09 · Lentille : valeur réelle pour le lecteur vs complexité, cohérence vision.
Read-only. Ce rapport est ma seule sortie ; il doit permettre de décider sans rejouer ma réflexion.

## Ce que j'ai lu (je peux le citer)
- `vision/archetype-lecteur.md` — le lecteur paie « la continuité d'un suivi qui fait que le climat de sa vie n'est plus un sujet oublié entre deux canicules » ET « la tranquillité de décider sans l'impression d'avoir oublié ». Le Fil est doctrinalement nommé ici.
- `vision/positionnement.md` — « la décision, pas la compréhension » ; « pas un assistant climat, pas une app green » ; « un dashboard qui respire » est exactement le registre contre lequel la marque se construit.
- `vision/modele-economique.md` — Le Fil = maillon « pourquoi il revient », désigné comme « le maillon le plus faible aujourd'hui », hypothèse non prouvée (rétention).
- `principes/invariants.md` — n°1 (on éclaire, on ne décide pas), n°2 (pas de score), n°4 (une donnée n'a de valeur que si elle aide une décision).
- `project_frontiere_savoir_agir.md` — TRANCHÉ : Le Fil ne doit JAMAIS être la clé qui déverrouille du contenu statique (deadlock). Il vend sa propre valeur nouvelle.
- `project_tension_gratuit_payant.md` — GOULOT dominant = débit d'inconnus qualifiés devant le payant ; le B2C payant n'est pas prouvé.
- `arbitrages/pricing-abonnements-reportes.md` — Le Fil ≠ Mode Foyer ; pricing non figé, direction tarif annuel ; page live en retard.
- `project_module_logement.md` — « Mémoire des biens » déjà parquée comme vraie promesse produit (liste de biens suivis) ; **bug PLM** = fuite de monétisation vive (Paris/Lyon/Marseille ne peuvent analyser aucun logement de leur propre ville).
- `src/app/(public)/le-fil/page.tsx` — la page live vend « un dashboard qui respire », « alertes ciblées », « newsletter mensuelle personnalisée ».

---

## L'idée
Le Fil = la couche vivante/temporelle de futur•e, greffée au rapport déjà acheté. Un moteur de veille national (événements qualifiés, tags géographiques réutilisables) → 34 000 lectures locales activées par abonnement. Il ne parle que si un signal franchit un seuil d'admission (« courage de se taire »). MVP : 4 flux (CatNat, restrictions Propluvia, air Atmo, diffs Géorisques), objet central = le dossier threadé qui vit dans le temps.

Elle arrive largement **pré-tranchée** (segment, cadence, objet, MVP). Mon travail n'est pas de re-litiger, mais de tester si l'objet créé de la valeur décisionnelle ou une surface de plus, et de nommer la forme la plus simple.

## Le vrai besoin
La demande est formulée en solution (« un fil », « un dashboard », « des alertes »). Je remonte au besoin.

Le besoin réel n'est PAS « suivre » (suivre = regarder = contemplation, le piège SIG/app-green). C'est : **« ma décision a un angle mort temporel »**. J'ai décidé sur un instantané ; ce que je crains, c'est que l'instantané pourrisse sans que je le sache — une reconnaissance CatNat, un régime de restriction d'eau qui s'installe, une révision de PPRN change ce que j'aurais conclu. Le besoin décisionnel exact = **protéger la validité de ma décision dans le temps**, ne pas être pris par surprise sur un lieu où j'ai engagé ma vie pour vingt ans.

Ce besoin est **doctrinalement endossé** : l'archétype liste explicitement « la continuité d'un suivi » comme l'un des trois bénéfices fonctionnels payés, et « la tranquillité de décider » comme le bénéfice émotionnel-mère. Donc je ne peux pas dire « le besoin n'existe pas ». Il existe.

Mais il est **asymétrique par segment**, et c'est le cœur de mon analyse :
- **Résident (a déjà acheté, y vit)** : valeur marginale FAIBLE. Il vit les événements (la canicule, la restriction d'eau se vivent, elles ne se découvrent pas par une app). Être *prévenu* d'un fait déjà ressenti n'ajoute presque rien.
- **Prospect (« avant d'habiter »)** : valeur PLUS FORTE — il ne vit pas encore le lieu, l'app comble un vrai angle mort. Mais c'est une fenêtre TRANSITOIRE (les mois entre décision et emménagement) ; après l'emménagement elle s'effondre dans le cas résident. Ce n'est pas une rétention durable, c'est un besoin de transition.
- **Le dossier threadé (cycle de vie CatNat)** : c'est LÀ qu'est la valeur durable et décisionnelle. Pas « un fait est survenu » mais « voici ce que cette situation en cours signifie pour vous, et quoi faire ensuite ». Décisionnel, consequentiel (argent, assurance, revente), difficile à copier.

**Ma signature s'applique partiellement : le besoin est réel, la surface autonome ne l'est pas encore.** Le besoin de continuité ne porte pas, aujourd'hui, un produit récurrent vendu seul en B2C pour la majorité des lecteurs. Il porte une **couche** sur l'artefact déjà possédé, et un **dossier** pour la minorité de lieux qui ont réellement une situation vivante.

## Valeur pour le lecteur : les trois promesses candidates
Question 1 du porteur. Laquelle tient, laquelle sur-promet ?

- **« Suivre ce lieu dans le temps »** → SUR-PROMET et mal-cadre. « Suivre » implique une présence constante, exhaustive → c'est le dashboard qui respire, le SIG vivant, la couverture continue de tout. Elle rend le silence intenable (si vous promettez de « suivre », 40 semaines de silence = promesse trahie) et elle tire vers la *compréhension* contre laquelle la marque se construit. À rejeter.
- **« Être prévenu si un signal important apparaît »** → la plus HONNÊTE vis-à-vis de l'architecture (événementiel + seuil d'admission + courage de se taire). Le silence y est cohérent (pas de signal = rien à dire, c'est normal). MAIS elle penche « alerte », registre anxiogène, contre la doctrine (`doctrine/positionnement.md` : ouvrir par le projet de vie, jamais par le danger ; arbitrage pricing : « promesse large, pas anxiogène »).
- **« La mémoire vivante d'un lieu déjà analysé »** → la plus DIFFÉRENCIANTE et la moins anxiogène. « Mémoire » dit : le rapport que vous avez payé reste vrai, ne pourrit pas. Elle se rattache à l'artefact déjà acheté (cohérence parcours), colle à « le climat de sa vie n'est plus un sujet oublié », et rejoint la « Mémoire des biens » déjà parquée côté Logement. Elle sous-promet la valeur d'alerte, mais c'est un défaut sûr.

**Ma recommandation de promesse : le cadre de #3 (mémoire vivante) porté par le mécanisme de #2 (et vous prévient quand un signal mérite votre attention).** « La veille qui garde votre rapport vivant. » Le produit vendu est la **vigilance tranquille**, pas le flux d'alertes. Ce glissement de mot n'est pas cosmétique : il décide si le silence est un succès ou un échec (voir ci-dessous).

**À corriger MAINTENANT (no-regret) :** la page live `/le-fil` vend l'inverse de ce qui a été tranché — « newsletter mensuelle » (périodique, alors que la cadence événementielle a été décidée) et « dashboard qui respire » (le registre app-green banni). C'est une promesse que le porteur a déjà décidé de ne PAS tenir, affichée en prod. Recadrer la copy waitlist vers la vigilance ; retirer « newsletter mensuelle » et « dashboard qui respire ».

## Le silence comme fonctionnalité
Question 3. 40 semaines sur 52 de silence : valeur ou déception ?

Verdict : **le silence n'est une valeur que sous le cadre « vigilance », jamais sous le cadre « alertes/dashboard ».** Un produit d'alertes qui se tait = « à quoi je paie ? » = churn. Un produit de vigilance qui se tait = « on veille, tout va bien » = exactement la paix que l'archétype achète. Le brief l'admet lui-même : silence acceptable en B2B, problématique en B2C vendu seul. La résolution n'est pas de forcer du bruit, c'est de rendre la vigilance FELT sans événement :

1. **Le « point de calme » déterministe** (trimestriel, pas hebdo) : « Depuis mars, aucun signal n'a franchi le seuil sur {commune}. Voici ce que nous surveillons pour vous. » Convertit l'absence en service ressenti. Cheap, déterministe, honnête. C'est la traduction produit de « courage de se taire » : on ne se tait pas en disparaissant, on se tait en montrant la garde.
2. **Le dossier ouvert persistant** : un dossier « sécheresse 2026 en cours de reconnaissance » reste visible entre deux mises à jour → l'objet paraît vivant même au repos.

Sans ces deux mécanismes, le silence est une absence, pas une discipline. Le nom « courage de se taire » est éditorialement juste mais commercialement fragile tant qu'il n'est pas incarné en réassurance active.

## Coût de complexité
Ce que Le Fil, dans sa forme pleine, alourdit :
- **Une cinquième surface** (moteur de veille national, tags, abonnement, moteur d'emails, dashboard) là où le lecteur a déjà Territoire + Logement + Pack + exploration. « Un parcours, pas un couteau suisse. »
- **Une promesse de présence dans la durée** à tenir sur 34 000 lieux, alors que 3 des 4 flux ne parleront presque jamais pour la plupart des communes.
- **Une infra récurrente** (abonnement, cycle de vie, churn, support) construite pour un maillon — la rétention — alors que la cohorte à retenir n'existe pas encore (le débit d'inconnus qualifiés est le goulot ; le paiement B2C one-shot n'est pas prouvé).

**Ce qui pourrait NE PAS exister sans que le lecteur y perde :** le dashboard, la newsletter mensuelle, le flux Atmo, l'abonnement autonome, et le moteur de veille national complet à 4 flux. Ce qui doit rester : une seule strand « depuis votre rapport » sur l'artefact déjà possédé, et le dossier CatNat.

**Ma coupe la plus tranchée, DANS le MVP déjà décidé : le flux Atmo (qualité de l'air).** Un indice de qualité d'air épisodique/quotidien est un feed météo-like : il montre sans aider à arbitrer une décision de vie (viole l'invariant n°4), il tire vers le dashboard-qui-respire, et par la frontière modules, l'air appartient à Santé, pas au Fil. Je le retirerais du MVP, ou le restreindrais à un signal STRUCTUREL franchissant un seuil durable (une dégradation installée), jamais un index du jour. CatNat + Propluvia (au grain PATTERN, pas événement quotidien) + diffs Géorisques suffisent, et sont tous décisionnels.

## Cohérence avec la vision
- **« La décision, pas la compréhension »** : le feed d'événements = compréhension/contemplation. Le dossier avec charge décisionnelle (« ce que la reconnaissance CatNat change pour votre assurance et votre revente, ce qu'il faut vérifier ») = décision. Le Fil n'est aligné QUE dans sa version dossier-à-payload.
- **Invariant n°4** : chaque flux doit justifier son existence par une valeur décisionnelle. CatNat ✓, Géorisques diffs ✓, Propluvia au niveau pattern ✓, Atmo ✗.
- **Invariants n°1/n°2** : pas de menace (le Fil ne recommande pas de partir), pas de score de vitalité/risque agrégé du fil. À surveiller à la construction, pas bloquant au cadrage.
- **`project_frontiere_savoir_agir`** (déjà tranché) : Le Fil ne déverrouille pas de contenu statique. Confirmé, ne pas relitiger.
- **`arbitrages/pricing-abonnements-reportes`** : Le Fil ≠ Foyer, pricing non figé. Ma reco n'y touche pas.

Aucun arbitrage n'est contredit. Un arbitrage `atmo-hors-fil` et un `le-fil-vigilance-pas-alerte` seraient à graver.

## Intégration au reste (question 4)
- **Territoire / Logement** : Le Fil doit être la **couche temporelle des MÊMES artefacts**, pas une nouvelle destination. Les mises à jour apparaissent SUR le rapport déjà possédé (une strand « depuis votre rapport »), pas dans un dashboard séparé. C'est le geste anti-complexité décisif : Le Fil = une **propriété** du rapport (il reste vivant), pas un module de plus. Un dashboard autonome violerait « un parcours, pas un couteau suisse ».
- **Pack décision** : tension. Suivre les 3 communes comparées rouvrirait une décision close. Le Fil suit le lieu CHOISI ou la résidence, pas les 3 à perpétuité.
- **Exploration (« une ville comme X »)** : pas de lieu engagé → Le Fil ne s'y greffe pas. Ne pas forcer.
- **Frontière Savoir/Agir** : déjà résolue (valeur propre, jamais un verrou). Confirmé.

Verdict d'intégration : Le Fil **renforce** le parcours s'il est une couche sur l'artefact possédé ; il **ajoute une surface** s'il est un dashboard autonome. La page live pointe vers la surface — à corriger.

## Différenciation et moat
Un concurrent crédible le ferait-il ? (hypothèses, à vérifier WebFetch le moment venu)
- Un **feed d'alertes climat** (portail immo qui ajoute un score, assureur, app météo) est TRIVIAL à copier. Il rend futur•e plus riche, pas plus difficile à copier.
- Le **dossier threadé** (cycle CatNat → indemnisation → récidive) attaché à un rapport personnel, avec retenue éditoriale (silence discipliné) et charge décisionnelle, relève de l'accumulation + de la voix = difficile à copier proprement.

Conclusion moat : construire le **dossier**, pas le **feed**. Le feed est un poids ; le dossier est un actif. Cela confirme la coupe d'Atmo et la reformulation de Propluvia en pattern.

## L'hypothèse porteuse (la croyance non dite sous mon verdict)
Mon DIFFÉRER repose sur : **« le retour du lecteur est déclenché par un changement qui menace sa décision, pas par une habitude de consultation. »** Si au contraire le lecteur veut une relation HABITUELLE avec son territoire (comme consulter la météo), alors le dashboard/feed EST le produit, le silence est un défaut, et ma frame « vigilance, silence-OK » est fausse. C'est l'hypothèse à tester avant de construire — pas la conclusion qu'il faut contester, celle-ci.

## Transformation
Change-t-elle la façon de décider ? Le dossier, oui : il apprend au lecteur que sa décision est datée et révisable, il installe la lecture-trajectoire au-delà de l'achat (« un territoire se lit comme une trajectoire », archétype). Le feed d'alertes, non : il ajoute une capacité de surveillance, pas une façon de penser. Encore une fois : la valeur transformationnelle est dans le dossier, pas le flux.

## Ce qu'on ne sait pas (à tester avant de construire)
- **Le « 90 % ont acheté un rapport et veulent suivre »** est ASSERTÉ, non mesuré. Test : PostHog sur les acheteurs — reviennent-ils au rapport ? le régénèrent-ils ? + une sonde in-rapport « voulez-vous être prévenu si un signal important apparaît sur {commune} ? ».
- **Habitude vs surprise** (l'hypothèse porteuse) : mesurer si la strand « depuis votre rapport » génère du re-open et de l'engagement quand elle a quelque chose à dire vs quand elle est calme.
- **Consentement à payer la récurrence** : le pari central du modèle, non prouvé. Ne pas construire l'abonnement avant un signal de retour réel.

## Verdict : DIFFÉRER (le produit récurrent), avec une version minimale no-regret et un recadrage

Ce n'est PAS un REFUSER : le besoin est réel et doctrinalement endossé. C'est l'idée juste dont le produit n'est pas prêt → on GARDE le besoin au vault comme hypothèse parquée, avec déclencheur de réévaluation. C'est aussi partiellement CONSTRUIRE, mais une version dix fois plus simple que le moteur national à 4 flux + abonnement.

**La forme la plus simple qui capture l'essentiel (10× plus simple) :**
- **Une seule strand déterministe sur le rapport déjà possédé : « Depuis votre rapport ».** Au ré-ouverture, elle dit pour la commune possédée si une NOUVELLE reconnaissance CatNat ou un régime de restriction d'eau est apparu depuis la date du rapport. Zéro abonnement, zéro moteur d'emails, zéro dashboard. Vous appelez déjà Géorisques/Propluvia. C'est le MVP « mémoire vivante », quasi gratuit.
- Elle teste l'hypothèse-cœur (le lecteur revient-il ? valorise-t-il « c'est toujours vrai » ?) SANS construire le produit récurrent. Instrumentée. Si le re-open + l'engagement sont réels → construire l'abonnement et le dossier threadé. Sinon → tout le build Le Fil est économisé.
- **Le no-regret immédiat** : recadrer la page live `/le-fil` (retirer « newsletter mensuelle » + « dashboard qui respire », passer à la vigilance). Aligne la promesse publique sur ce qui a été décidé.
- **Coupe dans le MVP** : Atmo hors du Fil (ambient, frontière Santé) ; Propluvia au grain pattern, pas événement.

Ordre : recadrage page (immédiat) → strand « depuis votre rapport » (cheap, teste le besoin) → mesurer → PUIS, sur preuve de retour, le dossier CatNat threadé et l'abonnement.

## Si refus/report rédigé comme victoire produit (prêt pour `arbitrages/`)
> **On ne construit pas le moteur de veille national à 4 flux ni l'abonnement Le Fil aujourd'hui.** On a évité : une cinquième surface (dashboard) contre « un parcours, pas un couteau suisse » ; une promesse de présence continue sur 34 000 lieux intenable et anxiogène ; une infra de rétention bâtie avant qu'une cohorte à retenir existe (le goulot est le débit d'inconnus, pas la rétention). On garde le besoin — la continuité, endossée par l'archétype — sous forme d'une strand « depuis votre rapport » quasi gratuite qui le teste. Fausse bonne idée écartée : le feed d'alertes (copiable, contemplation), au profit du dossier threadé (moat, décision) — construit seulement sur preuve de retour.

## Tension avec le Business (matériau /board, non tranché)
- Le Business veut Le Fil pour le **revenu récurrent** (MRR, le maillon « pourquoi il revient » désigné comme le plus faible). Ma lentille : le récurrent est prématuré, et sa version feed est de faible valeur et anxiogène. Construire la strand mémoire d'abord, prouver le retour, PUIS monétiser.
- Le Business dira « on a besoin de MRR pour prouver le modèle / lever ». Je tiens : du MRR sur une cohorte non retenue est un revenu vanité ; et le goulot (mémoire `project_tension_gratuit_payant`) est en amont (débit d'inconnus, paiement B2C non prouvé), pas dans la rétention. Bâtir la rétention avant l'acquisition prouvée inverse l'ordre.
- Point d'accord probable : le no-regret (recadrage page) et la strand cheap ne coûtent rien au Business et dérisquent son pari.
- Là où je pourrais avoir tort : si le porteur juge que Le Fil est d'abord un produit B2B (veille de portefeuille, où le silence est acceptable et le récurrent naturel), alors ma lentille B2C-valeur-lecteur est la mauvaise à pondérer, et la question bascule vers le Business + ADR-0008. Je le signale.

## Mise à jour de la doctrine (prêt à écrire par Claude principal)
- Nouvel `arbitrages/le-fil-vigilance-pas-alerte.md` : promesse = mémoire vivante + vigilance tranquille ; silence = discipline incarnée (point de calme trimestriel + dossier ouvert), jamais absence ; feed d'alertes rejeté (copiable, anxiogène, contemplation).
- Nouvel `arbitrages/atmo-hors-le-fil.md` (ou note frontière) : la qualité de l'air épisodique n'entre pas dans Le Fil (ambient, invariant n°4, frontière Santé).
- `vision/modele-economique.md` : préciser que le maillon « pourquoi il revient » se teste par une strand gratuite sur l'artefact possédé avant tout abonnement.
- Corriger `src/app/(public)/le-fil/page.tsx` (retirer newsletter mensuelle + dashboard qui respire).
- `project_module_logement.md` « Mémoire des biens » : noter que la strand « depuis votre rapport » en est le socle transverse (Territoire ET Logement).

---

## Mes quatre questions de clôture
1. **Si on reconstruisait futur•e de zéro aujourd'hui, construirait-on encore ça ?** Le dossier threadé CatNat, oui — c'est la trajectoire d'une décision, cœur de la vision. Le dashboard/feed/newsletter mensuelle, non — c'est la richesse app-green contre laquelle la marque se construit.
2. **Qu'est-ce qu'on perd si on la supprime ?** Si on supprime TOUT : le maillon « pourquoi il revient » et la promesse de continuité de l'archétype — une perte réelle, d'où DIFFÉRER et non REFUSER. Si on supprime seulement le feed/dashboard : on ne perd rien qu'un concurrent ne referait, et on gagne la cohérence vision.
3. **Existe-t-il une version 10× plus simple ?** Oui : une strand déterministe « depuis votre rapport » (CatNat + restriction d'eau apparues depuis la date du rapport) sur l'artefact déjà possédé, zéro abonnement, sur des API déjà appelées. Elle teste le besoin avant tout build.
4. **Rend-elle futur•e plus difficile à copier, ou seulement plus riche ?** Le feed : plus riche (copiable). Le dossier threadé attaché au rapport personnel + retenue éditoriale : plus difficile à copier. Construire le second, pas le premier.

## Si j'étais le gardien du produit
Je ne construirais pas Le Fil récurrent maintenant. Je recadrerais la page live vers la vigilance dès cette semaine, je poserais une strand « depuis votre rapport » quasi gratuite sur le rapport déjà acheté, et je ne construirais l'abonnement et le dossier threadé qu'une fois prouvé que les acheteurs reviennent. Et je couperais Atmo du Fil.

## Quand rouvrir ce sujet
Rouvrir pour **construire enfin** l'abonnement/dossier si : la strand « depuis votre rapport » génère un re-open mesurable des acheteurs (PostHog), la sonde in-rapport « voulez-vous être prévenu » dépasse un seuil de consentement franc, ET le paiement B2C one-shot est prouvé (le goulot amont levé). Rouvrir pour **re-prioriser vers le B2B** si le porteur décide que la veille de portefeuille (notaires/CGP/assureurs) est le vrai premier client de Le Fil — alors ma lentille B2C n'est plus la bonne à pondérer, cap sur ADR-0008. Rouvrir pour **abandonner** si, strand livrée et instrumentée, les acheteurs ne reviennent pas et la sonde reste faible : le besoin de continuité serait alors un confort déclaré non agi, et on classe l'hypothèse morte. Rouvrir aussi si un concurrent (portail immo, assureur) sort un suivi climat par adresse : re-vérifier le moat du dossier vs leur feed (WebFetch).
