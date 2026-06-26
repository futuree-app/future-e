# Rapport stratégique — Business Strategist (futur•e)
## Décision évaluée : pricing « Le Fil », 9 €/mois → ~49,99 €/an prépayé

> Rapport produit par le sous-agent `business-strategist` (read-only) lors de son test à blanc, 2026-06-26.
> Évaluation datée, pas de la doctrine (cf. `../_README.md`). Statut : verdict DIFFÉRER ; correctifs
> en attente du challenge ChatGPT du porteur (2026-06-26).
> Doctrine lue : `docs/vault/vision/modele-economique.md` (l.27-46, 67-78, 153-182),
> `docs/vault/arbitrages/pricing-abonnements-reportes.md`. Réel confronté :
> `src/app/(public)/le-fil/page.tsx` (bloc prix l.204-233, `noindex`).

---

### Décision
Remplacer, sur la page de pré-lancement `/le-fil` (liste d'attente, `noindex`, produit NON achetable), le tarif affiché « 9 €/mois · sans engagement · 30 jours offerts » par un **tarif annuel ~49,99 €/an payé en une fois**. Proposé par le porteur (direction confirmée 2026-06-25, déjà tracée dans l'arbitrage). Ce que ça change concrètement : un nombre affiché dans le hero d'une page de capture d'e-mails. Aucune transaction, aucun checkout Stripe, aucun produit livré derrière. La « décision » porte donc sur **l'ancre de prix montrée à une audience en amont**, pas sur une mécanique de vente.

### Effet sur le moteur
Le Fil EST le maillon « pourquoi il revient », explicitement « le plus faible aujourd'hui » (doctrine l.38-41). Son rôle dans le moteur : déplacer le « quand » du one-shot ponctuel vers **une présence dans la durée**.

Or l'annuel prépayé en une fois rapproche Le Fil d'un **one-shot annuel** plutôt que d'un récurrent au sens comportemental. Sur le fond du produit (veille climatique, valeur à basse fréquence, qu'on ne consulte pas avec urgence chaque mois), l'annuel est un cadrage **plus juste** que le mensuel : il n'invite pas le churn de J+1 et baisse le prix perçu (49,99/an ≈ 4,17 €/mois contre 9 €/mois, soit ~-54 % de prix effectif). Bonne intuition sur la nature de l'usage.

Mais au point de vente, un paiement de 49,99 € d'un coup est un **engagement initial plus lourd** que « 9 €/mois, sans engagement, annulable », même si l'annuel est moins cher au total (aversion à la perte). L'annuel améliore la LTV-par-converti et coupe le churn, mais peut **réduire le taux de conversion** au moment de la décision. Ce n'est pas neutre : on échange du volume d'apprentissage contre de la valeur par client.

### Effet sur le moat et les actifs
Côté actifs de connaissance, Le Fil nourrit la boucle d'apprentissage (décisions réelles observées **dans la durée**) et le capital de compréhension. Le passage mensuel→annuel ne change presque rien à cet apport, **sauf sur un point décisif** : la **rétention est elle-même un actif de connaissance**, et c'est l'actif que ce produit doit produire en priorité. Un cycle mensuel donne un signal de réabonnement tous les 30 jours ; un cycle annuel donne **un seul signal de rétention par an**. Pour le maillon le plus faible et le plus incertain du moteur, facturer à l'année **aveugle la cadence d'apprentissage** sur précisément la variable qu'on a le plus besoin de mesurer. C'est le coût stratégique caché de cette décision, et il est plus important que le gain de cash.

### Effet sur les boucles
Boucle d'apprentissage : voir ci-dessus, l'annuel ralentit le signal de rétention d'un facteur ~12. Boucle de prescription : non affectée par le mode de facturation. Aucune des deux n'est court-circuitée, mais la première est ralentie là où elle compte le plus.

### Niveau de preuve — le cœur
C'est ici que la discipline mord. La rétention du Fil est listée noir sur blanc parmi les **hypothèses non démontrées / les paris** (doctrine l.166-168), et le « pourquoi il revient » est qualifié de « hypothèse, pas une preuve » (l.41). Conséquence directe : **aucun prix de Le Fil n'est plus prouvé qu'un autre.** 49,99 €/an n'a pas plus de fondement empirique que 9 €/mois. Choisir un nombre précis (49,99) sur un produit qui n'existe pas, dont l'arbitrage dit explicitement « pricing n'est pas figé », « aucune décision verrouillée, ne graver aucun prix comme acté » (arbitrage l.18-19), c'est de la **fausse précision** : on grave une ancre qu'on devra défendre ou démentir plus tard, sur zéro donnée.

Le piège n'est pas la direction (annuel plutôt que mensuel : hypothèse assumée, légitime). Le piège est de **traiter 49,99 comme une décision** alors que c'est un pari déguisé en chiffre rond. Sur une page `noindex` de capture d'intention, le prix affiché ne convertit aucun paiement : son seul effet réel est de **créer une ancre** que l'audience mémorisera et que tu t'interdiras de bouger.

### Invariants et principes
- **n°8 (les preuves, pas les intérêts/espoirs)** : touché. Afficher un prix précis sur un produit non livré, non instrumenté, c'est avancer avec un espoir présenté comme un acquis. L'arbitrage l'a déjà anticipé ; la décision ne doit pas le contredire.
- **n°7 (indépendance), n°1/2 (on éclaire, pas de score)** : non touchés.
- **Légal (franchise en base)** : non bloquant aujourd'hui (la page n'affiche aucune mention TVA), mais dès qu'un prix réel + checkout existent, mention « TVA non applicable, art. 293 B du CGI » obligatoire, jamais « TVA incluse ».

### Risques structurants
- **#2 Paiement B2C non démontré** : Le Fil récurrent en est la pointe la plus aiguë (précédent CityScan parti en B2B faute de B2C). L'annuel ne l'aggrave ni ne l'atténue sur le fond, mais en **retardant le signal de rétention**, il retarde la levée de ce risque.
- **#5 Écart intention-action** : légèrement **aggravé** au point de vente (49,99 € d'un coup = ask plus engageant qu'un mensuel annulable). À surveiller à l'ouverture.

### Verdict : AJUSTER + DIFFÉRER
Deux objets distincts dans une même demande, à trancher séparément :

1. **La direction « annuel plutôt que mensuel » : POURSUIVRE comme hypothèse assumée.** Cohérente avec la nature basse-fréquence de la veille, et l'arbitrage la porte déjà. Mais à garder explicitement étiquetée « hypothèse », pas « décision ».

2. **Graver « 49,99 €/an » sur la page `/le-fil` maintenant : DIFFÉRER.** Sur une page de pré-lancement `noindex`, le prix affiché a une utilité de conversion **nulle** et un coût d'ancrage **réel**. Recommandation concrète : ne pas hard-coder 49,99. Soit **retirer le chiffre du hero** (une liste d'attente vend la promesse et capte l'e-mail, pas un prix), soit afficher une formulation directionnelle sans euro ferme (« tarif annuel », « pensé pour l'année »). Le mensuel « 9 €/mois » est de toute façon à retirer (en retard sur la doctrine), mais le remplacer par un autre nombre non prouvé ne résout rien : ça déplace l'ancre fausse, ça ne la supprime pas.

**Condition de preuve qui lèverait le report du chiffre** : trancher un prix ferme seulement quand (a) Le Fil est réellement instrumenté à l'ouverture T4 2026, et (b) le launch est conçu pour **apprendre la rétention** (ce qui plaide pour un premier cycle court/mensuel, ou un test mensuel↔annuel, avant de figer l'annuel pour optimiser la LTV). Optimiser le cash par l'annuel avant d'avoir prouvé la rétention, c'est optimiser la mauvaise variable au mauvais moment.

### Si report — formulé comme victoire stratégique (prêt à graver dans `arbitrages/`)
> **Dette de positionnement évitée.** On a refusé de graver un prix précis (49,99 €/an) sur la page de pré-lancement d'un produit non livré, non instrumenté, dont la doctrine reconnaît que la rétention est un pari non démontré. Afficher un nombre ferme sur une page `noindex` n'apporte aucune conversion et crée une ancre qu'on devrait ensuite défendre contre les données. On garde la **direction annuelle** comme hypothèse, on retire le prix ferme du hero, et on se réserve le droit de trancher le chiffre — et le rythme de facturation — en fonction de ce que le launch nous apprendra de la rétention, pas l'inverse. **On a aussi protégé la cadence d'apprentissage** : facturer à l'année aveugle le signal de rétention (un point par an) sur le maillon le plus faible du moteur ; ce choix-là doit être pris les yeux ouverts, pas par défaut d'optimisation de cash.

### Cohérence — tension non tranchée, posée à l'humain
Tension réelle entre deux objectifs du Fil, que je ne tranche pas :
- **Optimiser la valeur** (annuel prépayé : meilleur cash, moindre churn, prix perçu plus bas) ;
- **Optimiser l'apprentissage** (mensuel ou cycle court : signal de rétention rapide sur le pari le moins prouvé du modèle).

À ce stade du projet, où la rétention du Fil est le risque #2 incarné, l'apprentissage prime-t-il sur la valeur ? Ou le porteur assume-t-il l'annuel en acceptant d'apprendre la rétention lentement ? Choix de fond, à toi.

### Mise à jour de la doctrine (prêt à écrire par Claude principal)
- `arbitrages/pricing-abonnements-reportes.md` : ajouter que la direction annuelle reste **hypothèse non figée**, et acter que **la page `/le-fil` ne doit pas porter de prix ferme** tant que Le Fil n'est pas instrumenté ; noter le coût d'apprentissage de l'annuel (cadence de rétention) comme arbitrage explicite, pas comme détail.
- `vision/modele-economique.md` l.76 : remplacer « direction = tarif annuel (~49,99 €/an) » par « direction = tarif annuel (ordre de grandeur ~50 €/an, **non figé, non affiché en prod tant que non instrumenté**) ».
- Au moment du launch réel : mention franchise TVA art. 293 B sur tout prix affiché + checkout.
