# Audit UI/UX, parcours /ou-vivre, rapport complet et Pack Decision

Date : 2026-06-07  
Perimetre : `/ou-vivre` -> resultats -> comparaison -> paywall rapport 14 euros -> Pack Decision 39 euros  
Methode : inspection code + captures runtime Chrome headless desktop/mobile.

## Captures runtime

Les captures sont stockees ici :

- `.tmp-audit-screenshots/01-ou-vivre-idle-desktop.png`
- `.tmp-audit-screenshots/02-debloquer-rapport-desktop.png`
- `.tmp-audit-screenshots/03-pack-decision-desktop.png`
- `.tmp-audit-screenshots/04-ou-vivre-idle-mobile.png`
- `.tmp-audit-screenshots/05-debloquer-rapport-mobile.png`
- `.tmp-audit-screenshots/06-pack-decision-mobile.png`

Note : l'automatisation headless a capture fidelement les pages d'entree et de paywall. Les etats resultats/comparaison ont ete audites par inspection code, car l'automatisation navigateur restait bloquee sur l'etat parsing alors que les API `/parse` et `/match` repondaient correctement en appel direct.

## Verdict

Le parcours gratuit est solide. Il installe une progression claire : l'utilisateur decrit un projet, futur-e reformule, propose trois territoires, puis ouvre une vue de comparaison qui cree le bon doute avant les paywalls.

Les paywalls sont credibles, surtout le rapport 14 euros. Le Pack Decision est comprehensible et bien positionne comme arbitrage entre trois communes. Les principaux risques se situent au moment critique : retour auth, redirection paiement, lisibilite mobile et perception de la valeur apres achat.

## Synthese priorisee

### P0, bloquant avant lancement large

1. Corriger le retour auth du Pack Decision.

Dans `PackConvictionView`, les liens inscription/connexion utilisent `next=${returnUrl}` avec une URL absolue. Les pages auth n'acceptent que les chemins relatifs. Un utilisateur non connecte risque donc de ne pas revenir au Pack apres connexion.

Correction recommandee : passer deux valeurs distinctes :

- `returnUrl` absolue pour Stripe.
- `returnPath` relatif pour auth.

2. Verifier `STRIPE_PACK_PRICE_ID` en production.

Le code attend `STRIPE_PACK_PRICE_ID` dans `src/app/api/stripe/create-payment-intent/route.ts`. La liste Vercel Production vue pendant l'audit montrait `STRIPE_RAPPORT_PRICE_ID`, mais pas `STRIPE_PACK_PRICE_ID`.

Impact : le paiement peut encore fonctionner via le montant direct, mais la metadata `stripePriceId` du pack sera vide, ce qui complique debug, compta et suivi.

3. Corriger la redirection post-paiement du rapport 14 euros.

`PaymentForm` utilise `/merci` par defaut quand Stripe impose une redirection. Cette page dit que le rapport sera envoye par email, alors que le produit promet un acces immediat.

Correction recommandee : passer un `returnUrl` specifique au rapport, par exemple vers `/rapport`, ou creer une page merci coherente avec le produit.

### P1, conversion et confiance

4. Remonter ou repeter le CTA du rapport sur mobile.

Sur mobile, le paywall rapport est convaincant mais tres long avant l'action. Le CTA arrive apres le hero, les cartes, l'apercu, AskFuture, l'explication du prix et le reassurance.

Option pragmatique : ajouter un CTA sticky discret ou un rappel prix/action apres le hero.

5. Ajouter un vrai moment de succes apres achat Pack.

La vue debloquee affiche directement les boutons rapports puis la matrice. Il manque un message explicite :

- Pack Decision debloque.
- Vos 3 rapports sont accessibles.
- Vos 9 questions AskFuture sont incluses.
- La comparaison complete est prete.

6. Rendre AskFuture 9 questions plus visible apres achat.

La promesse est vendue dans le Pack, mais la vue debloquee ne montre pas clairement ou utiliser les 9 questions. Ajouter un bloc court pres des liens rapports.

7. Desactiver l'achat Pack tant que le trio nomme n'est pas charge.

Dans `PackConvictionView`, le paiement peut apparaitre quand `parsed` existe, meme si l'apercu/trio nomme n'est pas encore charge. Le fallback peut produire des noms vides.

Condition recommandee : activer `PackPaymentPanel` seulement si `apercu?.trio.length === 3`.

### P2, finition UI

8. Harmoniser le CTA "Explorer cette option".

Dans la vue comparaison, le bouton dit "Explorer cette option" mais mene au paywall 14 euros. Sur la vue resultats, le prix est annonce.

Libelle recommande : "Explorer le rapport · 14 €".

9. Corriger le dernier `var(--accent)`.

Un bloc "Comparer" dans `OuVivreClient` utilise encore `var(--accent)` en style inline, alors que la doctrine indique que ce token n'existe pas. Utiliser `var(--orange-ring)` ou une classe Tailwind existante.

10. Reduire l'impact du bandeau cookies sur mobile.

Le bandeau est tres visible sur toutes les captures et mange beaucoup d'espace utile sur mobile, notamment pres des zones de conversion.

## Analyse par ecran

## /ou-vivre, entree desktop

Points forts :

- Hero clair, premium, avec une proposition de valeur comprehensible.
- Le champ texte est le centre naturel de l'ecran.
- Les exemples donnent une bonne aide au demarrage.
- Le CTA principal est visible et correctement place.

Points a surveiller :

- Le placeholder anime peut etre vu en phrase partielle. Sur capture, il affiche "Je cherche une petite ville vivan..." avec curseur. Ce n'est pas grave fonctionnellement, mais l'ecran initial peut paraitre moins stable.
- Le bandeau cookies est tres present en bas.

Recommandations :

- Eventuellement ralentir le placeholder ou demarrer par une phrase complete statique pendant 1 a 2 secondes.
- Verifier que le bouton reste bien lisible quand le champ contient un texte long.

## /ou-vivre, entree mobile

Points forts :

- L'ecran reste lisible.
- Le menu mobile et le switch theme ne surchargent pas.
- La promesse reste comprehensible dans le premier viewport.

Points faibles :

- Le bouton dans le champ prend beaucoup d'espace.
- Le bandeau cookies reduit fortement la zone utile.
- Les chips d'exemple passent bien, mais elles allongent vite l'ecran.

Recommandations :

- En mobile, envisager un CTA pleine largeur sous le textarea plutot qu'integre dans le bloc.
- Reduire la hauteur du bandeau cookies mobile ou le rendre moins intrusif.

## Resultats /ou-vivre

Audit par code.

Points forts :

- La sequence confirmation -> analyse -> resultats est excellente pour la confiance.
- Les cartes evitent les chiffres bruts et restent qualitatives.
- Le bloc "Comparer ces territoires" arrive au bon moment, juste apres les trois options.
- AskFuture gratuit est positionne comme aide a comprendre, pas comme gadget.

Risques :

- L'utilisateur a plusieurs suites possibles : rapport, comparer, AskFuture. La hierarchie doit rester claire.
- Le bloc "Comparer" utilise encore `var(--accent)`.

Recommandations :

- Garder la priorite actuelle : cartes -> comparer -> AskFuture.
- Ne pas ajouter d'autre bloc entre cartes et comparaison.

## Vue comparaison

Audit par code.

Points forts :

- Le concept est bon : identite, deux forces, un compromis.
- La vue cree naturellement le besoin du Pack Decision.
- Le CTA Pack est clair : "Comparer en profondeur".

Point faible :

- Le CTA rapport "Explorer cette option" ne rappelle pas le prix, contrairement aux cartes resultats.

Recommandation :

- Renommer en "Explorer le rapport · 14 €" ou ajouter une micro-ligne sous le bouton.

## Paywall rapport 14 euros, desktop

Points forts :

- C'est l'ecran le plus convaincant du parcours.
- Le hero nomme la commune et relie bien le rapport a la decision.
- Les trois cartes "Comprendre / Identifier / Poser" sont claires.
- L'apercu reel renforce la preuve.
- Le prix et le paiement unique sont explicites.
- Le bloc paiement est bien encadre visuellement.

Points faibles :

- Le bandeau cookies reste visible pres de la zone de paiement.
- Si l'utilisateur n'est pas connecte, le CTA compte est bon, mais l'ecran pourrait mieux rappeler que le paiement vient juste apres.

Recommandation :

- Conserver la structure desktop.
- Ajouter eventuellement un micro-rappel "Paiement a l'etape suivante" sous "Creer mon compte puis debloquer".

## Paywall rapport 14 euros, mobile

Points forts :

- Le contenu reste lisible.
- L'apercu reel est convaincant.
- La page garde son ton editorial.

Points faibles :

- Le CTA arrive tres bas.
- Le bouton "CREER MON COMPTE PUIS DEBLOQUER" est serre et casse en plusieurs lignes.
- Le bandeau cookies gene en bas de page.

Recommandations :

- Remonter un CTA apres le hero ou ajouter un sticky bottom compact.
- Simplifier le bouton : "Creer mon compte" puis sous-texte "puis debloquer le rapport".
- Tester un sommaire plus court avant l'apercu sur mobile.

## Pack Decision, desktop

Points forts :

- Le trio est nomme dans le hero, ce qui donne une excellente continuite.
- La promesse "Tranchez, sans deviner" est nette.
- L'apercu tronque est credible et ne donne pas trop.
- Le prix 39 euros est visible.
- Les quatre benefices sont comprehensibles.

Points faibles :

- Beaucoup de vide sous le contenu dans la capture desktop.
- Le bloc achat est bon, mais la page manque d'une section "apres achat" ou "ce qui se passe ensuite".
- Pour les utilisateurs non connectes, le retour auth est probablement casse par l'URL absolue.

Recommandations :

- Ajouter un bloc court sous le bundle : "Apres achat, vous revenez ici avec la comparaison complete, les 3 rapports et les 3 pistes."
- Corriger `next` auth.
- Ne pas densifier avec trop de contenu marketing : le premier ecran fonctionne deja.

## Pack Decision, mobile

Points forts :

- La lecture mobile est bonne.
- L'ordre est logique : hero -> apercu -> benefices -> justification prix -> achat.
- Le prix et le CTA sont visibles dans le bloc final.

Points faibles :

- Le CTA arrive apres tous les arguments. C'est defendable, mais pas optimal pour conversion.
- Le bas de capture contient beaucoup de vide apres le bloc achat.
- Le bandeau cookies est encore tres present.

Recommandations :

- Tester un bouton sticky "Debloquer le pack · 39 €" apres quelques secondes de scroll.
- Ou remonter le bloc prix juste apres l'apercu, avant les quatre cartes de benefices.
- Ajouter reassurance courte pres du CTA : "Paiement unique, acces immediat."

## Paiement

Points forts :

- Le composant Stripe est centralise.
- Les erreurs de creation PaymentIntent sont affichees.
- Le Pack utilise maintenant une URL absolue pour Stripe.

Risques :

- `PaymentForm` fallback vers `/merci` n'est pas adapte au rapport.
- Pour le rapport 14 euros, en cas de redirection bancaire, l'utilisateur peut sortir du flux immediat `/rapport`.
- Les messages d'erreur Stripe sont affiches, mais pas contextualises en francais produit.

Recommandations :

- Passer `returnUrl` au rapport 14 euros.
- Adapter `/merci` ou ne plus l'utiliser pour ce produit.
- Garder le texte d'erreur Stripe, mais ajouter un preambule court si besoin : "Le paiement n'a pas abouti."

## Auth

Points forts :

- Le compte requis est explique.
- Les pages auth acceptent un `next` relatif, ce qui protege contre les redirections ouvertes.

Risque critique :

- Le Pack passe un `next` absolu, donc incompatible avec cette protection.

Recommandation :

- Corriger le Pack avec `returnPath` relatif.
- Optionnel : adapter les pages auth si `next` contient `/comparateur/pack-decision`, avec un copy plus contextuel.

## Checklist actionnable

- [ ] Pack Decision : utiliser `returnPath` relatif pour inscription/connexion.
- [ ] Pack Decision : conserver `returnUrl` absolu uniquement pour Stripe.
- [ ] Vercel Production : ajouter/verifier `STRIPE_PACK_PRICE_ID`.
- [ ] Rapport 14 euros : passer un `returnUrl` explicite a `PaymentWrapper`.
- [ ] `/merci` : corriger le copy ou sortir ce produit de ce fallback.
- [ ] Pack debloque : ajouter un bandeau de succes post-achat.
- [ ] Pack debloque : rappeler ou utiliser explicitement AskFuture 9 questions.
- [ ] Pack paiement : attendre `apercu.trio.length === 3` avant activation.
- [ ] Vue comparaison : renommer "Explorer cette option" avec le prix.
- [ ] `/ou-vivre` : remplacer le dernier `var(--accent)`.
- [ ] Mobile rapport : remonter ou repeter le CTA.
- [ ] Mobile : reduire l'impact du bandeau cookies pres des zones achat.

