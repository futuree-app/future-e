# Arbitrage : le récurrent B2C est épisodique, pas mensuel

- **Date** : 2026-07-11, tranché par le porteur après la session de mesures sur Le Fil et une note
  de cadrage (Claude Fable) que le porteur juge juste, en particulier sur la phase de recherche.
- **Source** : `docs/vault/arbitrages/le-fil-veille-evenementielle-ecartee.md` (les mesures qui ont
  fermé la veille), `docs/rapports-agents/researcher/2026-07-09-recurrence-relation-territoire.md`.
  Prolonge `ADR-0008` (B2B en relais 2027) et `arbitrages/pricing-abonnements-reportes.md`.

## Le changement de cadre à acter

Cesser de chercher « le produit récurrent » de futur•e en B2C. Il n'existe pas, et il ne peut pas
exister, pour une raison structurelle qu'il faut nommer une fois pour toutes.

**Deux récurrences, à ne jamais confondre :**

- **Récurrence inter-utilisateurs.** À tout instant, de l'ordre de 10 % des Français sont en mobilité
  résidentielle. Il y a *toujours* quelqu'un dans un moment de vie. C'est un moteur d'**acquisition
  permanent**, et le levier programmatique (~35 000 communes, une page par intention de vie) est
  l'outil exact pour le capter.
- **Récurrence intra-utilisateur.** Le *même* individu ne rouvre la question du lieu que tous les 5
  à 15 ans (4 à 6 transitions résidentielles dans une vie). **Aucun abonnement mensuel ne survit à
  cela.** Ce que cette rareté permet, ce n'est pas du MRR, c'est de la **réactivation** : un compte
  gratuit dormant, critères du foyer sauvegardés, réveillé au moment de vie suivant. C'est du CRM,
  pas de l'abonnement.

**Conséquence gravée : en B2C, le revenu de futur•e est épisodique à forte valeur, jamais récurrent
à faible valeur.** Toute piste qui prétend le contraire doit prouver une fréquence d'usage que ni le
territoire (mesuré immobile), ni la personne (revient tous les 5-15 ans), ni le climat vécu (2-4
pics/an) ne fournissent.

## Le moteur de récurrence réel : la recherche elle-même

La récurrence de futur•e ne vient pas d'un flux à surveiller. Elle vient de ce que **la recherche
d'un lieu de vie est naturellement itérative** : 2 à 10 sessions par semaine pendant 3 à 9 mois,
puis zéro. Ce zéro n'est pas un échec de rétention, c'est la **fin normale du projet**. L'accepter,
au lieu de le combattre, est le cœur de cet arbitrage.

## Ce qui en découle, par ordre de priorité

1. **Le pass de recherche (3 / 6 mois), pas l'abonnement mensuel.** C'est la formalisation honnête de
   ce que futur•e est déjà. Le mensuel invite au churn dès le premier mois et communique « petit
   outil » ; le pass communique « ça accompagne votre projet ». Ordre de grandeur évoqué, non figé :
   29-49 € (3 mois), 49-79 € (6 mois). La valeur payante est la **comparaison multi-communes + la
   personnalisation aux critères du foyer**, jamais la donnée brute (publique : Géorisques, DRIAS,
   ClimaDiag).
2. **Le climat vécu change de fonction : de produit à canal.** « Cet été, votre commune a vécu son été
   le plus chaud, la projection que vous aviez lue » n'est pas un produit (Météo-France fait le vécu
   gratuitement, l'intérêt est saisonnier). C'est le **meilleur carburant d'acquisition et de
   réactivation** vers le pass : chaque canicule est une campagne gratuite, branchée sur le levier
   programmatique. Contrainte : ne jamais en faire une newsletter (invariant du board).
3. **L'accompagnement, upsell opportuniste, jamais la stratégie.** Forfait de conseil (ordre de
   grandeur 290-790 €) au-dessus du pass. Ne scale pas (le temps du porteur devient le produit),
   marché adjacent déjà tenu (chasseurs, relocation). À tester passivement (une page, un prix, un
   Calendly), pas à construire.

## Le B2B : réel, mais pas maintenant, et pas par la techno

Le seul vrai MRR est B2B (rapport portefeuille en marque blanche pour agences / CGP, puis
banques-assureurs à 18 mois). Il est acté comme **relais**, pas comme pilier (`ADR-0008`), et pour
une raison que la note de cadrage nomme crûment : il exige **un muscle commercial de vente sortante
que le projet n'a pas encore démontré**, et « mourra non pas sur le marché mais sur l'exécution » si
le porteur solo n'est pas prêt à prospecter. La donnée est publique, des acteurs spécialisés existent
déjà (Callendar par adresse pour les pros ; Namr, Kermap autour). La différenciation devra être le
packaging décisionnel et le prix, pas la donnée. **Position du porteur (2026-07-11) : adhésion
faible au B2B**, priorité au pass B2C. Ne pas y investir de développement tant que le pass n'est pas
validé.

## Le test qui tranche, avant tout développement

**A/B sur le paywall existant : pass 3 mois contre abonnement mensuel**, sur la même page. L'infra de
plans existe déjà (`user_accounts`, `PaywallGate`, Stripe). Si le pass ne convertit pas nettement
mieux que le mensuel sur quelques semaines de trafic, la thèse « les gens paient pour une phase »
tombe. Coût : quelques jours. C'est le test le moins cher pour la question la plus fondamentale du
modèle B2C.

## Ce qui rouvrirait le sujet

- Le pass validé : instrumenter alors la **réactivation** (compte dormant réveillé au moment de vie
  suivant) comme second moteur de revenu répété.
- Un porteur (ou un associé) prêt à la vente sortante : le B2B portefeuille redevient actionnable.
- Une preuve que le climat vécu convertit en canal (test de 3 pages saisonnières pendant une
  canicule) : industrialiser le levier.
