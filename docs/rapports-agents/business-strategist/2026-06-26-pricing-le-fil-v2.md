# Rapport stratégique — Business Strategist (futur•e), MANDAT V2
## Décision évaluée : pricing « Le Fil », 9 €/mois → ~49,99 €/an prépayé

> Re-test du même cas après refonte du mandat (allocateur de ressources rares). À comparer au
> rapport v1 (`2026-06-26-pricing-le-fil.md`) : même décision, mandat différent. 2026-06-26.
> Évaluation datée, pas de la doctrine (cf. `../_README.md`).

---

**Décision.** Remplacer, sur la page de pré-lancement `/le-fil` (`noindex`, liste d'attente, non achetable), le tarif affiché « 9 €/mois · sans engagement · 30 jours offerts » par un tarif annuel d'environ **49,99 €/an payé en une fois**. Conforme à la direction porteur du 2026-06-25 actée dans `arbitrages/pricing-abonnements-reportes.md`. Concrètement : un changement de copie sur une page hors index, sur un produit ni construit ni vendable, le maillon « pourquoi il revient » le plus faible du moteur.

**La vraie question.** Ce n'est pas le bon sujet, et voici pourquoi. La variable dominante de futur•e n'est pas le prix du Fil : c'est le **consentement à payer B2C**, classé « pari central, hypothèse non démontrée » et « la variable à instrumenter EN PREMIER » dans la hiérarchie de preuve. Ce pari se teste sur les **deux produits réellement livrés** (14 € et 39 €), pas sur une page qui ne prend pas de carte. Choisir 9 €/mois vs 49,99 €/an, c'est arbitrer le prix d'un revenu qui n'existe pas, ne peut pas exister avant T4 2026, et repose sur une rétention jamais observée. On optimise une variable secondaire d'un étage non construit pendant que la variable primaire de l'étage construit n'est pas instrumentée.

Pire : l'annuel payé d'avance est un **tell stratégique**. Le Fil est censé prouver la rétention. L'annuel-upfront encaisse 12 mois *avant* d'avoir prouvé que quiconque veut le mois 2. Il transforme un pari de rétention en vente one-shot et masque la question que Le Fil devait répondre. Bon réflexe de cash-flow peut-être ; pas une preuve de récurrence.

**Marché et coût.** Le coût n'est pas le levier ici, et il faut le dire : marge brute ~91 %, coût IA négligeable, aucun coût marginal tant que non livré. La seule question marché qui compte, **en hypothèse pas en fait** : les inscrits d'une liste d'attente « veille climat » sortiront-ils leur carte pour un abonnement, eux qui ne sont peut-être venus que pour un one-shot ? L'arbitrage le rappelle : le visiteur arbitre « 14 € ou 39 € ? », pas « est-ce que je m'abonne ? ».

**Effet sur le moteur.** Nul à court terme. À terme, l'intuition annuelle est défendable sur un produit de veille (climat lent, charge cognitive d'un « est-ce que je garde mon abo ? » mensuel élevée). Donc *si* Le Fil est construit, annuel > mensuel est probablement juste. Mais aucun CA déplacé aujourd'hui.

**Effet sur le moat et les actifs.** Aucun. Un prix sur une page `noindex` ne compose rien. Optionalité : graver un prix maintenant **ferme** une option (ancre à renier) ; ne pas l'afficher la garde ouverte.

**Effet sur les boucles.** L'annuel-upfront **court-circuite la boucle d'apprentissage** sur le point clé : encaisser 12 mois prive du signal de ré-abonnement mensuel, la donnée la plus précieuse pour valider « pourquoi il revient ».

**Niveau de preuve.** Repose sur des paris empilés : (1) un public d'abonnement B2C existe, (2) il a une rétention suffisante, (3) le récurrent est le bon levier (vs la prescription). Aucun mesuré.

**Invariants et principes.** Tension douce avec **n°8** : choisir le prix d'une rétention jamais observée, et l'encaisser d'avance pour ne pas la prouver, c'est avancer avec l'espoir. Note exécution : franchise en base, jamais « TVA incluse ».

**Risques structurants.** Aggrave à la marge le risque n°1 (positionnement) : afficher un prix « ferme » puis le renier entame la confiance sur la seule page publique où Le Fil existe.

**Coût d'opportunité et pourquoi maintenant.** Le cœur. Pendant qu'on débat 9/49,99, on n'**instrumente pas le paywall → paiement sur le Pack 39 € et le rapport 14 €** (les seuls produits vivants, le test direct du pari central). Le modèle est explicite : la disposition à payer est « la variable à instrumenter EN PREMIER ». « Pourquoi maintenant ? » : rien n'est mûr (produit non construit, rétention non observable, consentement non mesuré). La seule action légitime : corriger l'écart prod (la page affiche un prix abandonné) — et la bonne correction est de **retirer le prix**, pas d'en écrire un autre.

**Le vrai pari.** « **Il existe des gens qui paieront pour rester abonnés à une veille climatique, et qui resteront.** » Tant que ce pari n'est pas testé, son prix est une décoration.

**Si c'était mon argent.** Non. Cette décision ne mérite pas une semaine du porteur, ni un après-midi. Elle mérite **10 minutes** pour retirer le prix périmé. La semaine doit aller à instrumenter PostHog sur les CTA payants et le tunnel paywall → paiement du Pack 39 €. Le seul travail qui déplace la variable dominante, dû depuis le 10 juin.

**Verdict : DIFFÉRER** (la décision de pricing), avec une action minimale immédiate distincte.
- **Maintenant (10 min, non bloquant)** : retirer l'affichage « 9 €/mois » de `/le-fil` (ne pas le remplacer par 49,99 €/an). La page reste une capture de leads sans prix gravé.
- **Condition de levée** : trancher le prix *après* (a) consentement à payer B2C mesuré sur 14/39 € (≥ 1 000 sessions instrumentées) et (b) appétit d'abonnement validé. Avant : « plutôt annuel que mensuel » reste une note d'intention, pas un prix affiché.

**Si report — victoire stratégique.** *Dilution d'attention évitée, fausse ancre non posée, revenu-vanité déguisé en rétention écarté.* L'annuel-upfront encaisse avant de prouver et masque le maillon « pourquoi il revient » au lieu de le valider. Le temps reste sur la variable dominante.

**Cohérence (non tranchée, posée au porteur).**
1. Annuel-upfront (cash-flow, churn-decision réduite) vs observabilité de la rétention (le mensuel donne le signal). Si annuel, instrumenter le renouvellement autrement.
2. Le Fil comme réponse au « pourquoi il revient » vs la **prescription** que le modèle désigne aussi. Avant d'investir dans le récurrent, tester d'abord que les satisfaits prescrivent ?

**Mise à jour de doctrine (prête à écrire, si report retenu).** `arbitrages/pricing-abonnements-reportes.md` : « écart prod résolu par *retrait* du prix, pas par affichage de l'annuel ; aucun prix du Fil affiché tant que le consentement à payer B2C n'est pas mesuré sur 14/39 €. Direction annuelle = note d'intention révisable. » `modele-economique.md`, maillon « pourquoi revient-il » : « un encaissement annuel d'avance ne prouve pas la rétention ; instrumenter le renouvellement reste requis. »
