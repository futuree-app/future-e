# FUT-155 · Garde-fou de sortie pour `/synthesize` : proposition, non implémentée

29/10/2026 · décision séparée demandée par le porteur.

## Ce qui existe

- `/ask` contrôle sa réponse avant de la rendre. `affirmationsNonEtablies` (`garde-ask.ts`) repère une proposition qui proclame un gagnant ou une sécurité que le mode de lecture n'établit pas. La réponse est alors remplacée par un repli déterministe. C'est possible parce que la réponse arrive d'un bloc (tool use).
- `/synthesize` diffuse le texte au fil de l'eau. La route attend le premier morceau (pour renvoyer un vrai 502 si le fournisseur est en panne), puis transmet chaque morceau tel quel. Rien ne relit le texte.

## Pourquoi on ne peut pas brancher le garde tel quel

1. **La diffusion.** Une phrase affichée ne se retire pas. Un contrôle qui la rattrape après coup arrive trop tard : le lecteur l'a déjà lue.
2. **Le vocabulaire.** Le garde de `/ask` vise les palmarès (« le meilleur choix », « devant »). La synthèse a d'autres interdits, posés par FUT-109 et FUT-151 : « correspondent », « répondent », « conviennent », « le moins de compromis » quand la couverture n'est pas complète, ou un critère demandé présenté comme point fort d'une commune sans priorité favorable. Il faut une famille de motifs propre à la synthèse, avec ses tests.
3. **Le mode.** Il faut en déduire un pour la synthèse, à partir de `exploration_sans_classement` et `couverture_des_priorites` (même règle que `lectureDuContexte`).

## Options

| Option | Effet pour le lecteur | Latence ajoutée | Travail |
|---|---|---|---|
| A. Tout retenir, contrôler, puis envoyer (ou le repli) | Plus de texte qui s'écrit ; un bloc d'un coup | Toute la génération (quelques secondes pour 110 à 170 mots ; non mesuré ici, aucun appel réel) | Faible côté route ; la page lit déjà un flux, un seul morceau suffit |
| B. Diffuser phrase par phrase, contrôler chaque phrase avant de l'émettre | Le texte s'écrit par phrases au lieu de mots | Environ une phrase | Moyen : découpage côté route, et un signal « remplacer par le repli » que la page doit comprendre si une phrase échoue après d'autres |
| C. Diffuser comme aujourd'hui, contrôler à la fin, remplacer | Le texte fautif s'affiche puis disparaît | Nulle | Faible ; peu de valeur, puisque le lecteur a déjà lu |
| D. Contrôler hors affichage (journal du taux de phrases interdites) | Aucun | Nulle | Faible ; mesure sans protéger |

## Recommandation

**D tout de suite, B si le taux mesuré n'est pas nul.** D ne coûte ni latence ni refonte. Il dit si le problème existe en production avec le prompt actuel, qui interdit déjà ces formulations. B est le seul choix qui protège sans afficher de texte fautif et sans perdre l'écriture progressive. C'est toutefois une refonte de la diffusion (route et page), à traiter dans un ticket séparé, avec la famille de motifs de la synthèse. A est un repli acceptable si l'écriture progressive n'est pas jugée essentielle.

## Réserves de la passe 2 (hors de ce PR)

- **Longueur d'une question AskFuture.** La page ne la borne pas. Mesures de cette passe (corps légitimes, borne de 32 768 octets) : parcours gratuit 13 968 o ; historique plein après effacement du cookie 22 010 o ; le même entièrement en caractères accentués 37 822 o, refusé en 413. Le lecteur voit alors « Cette réponse n'a pas pu être générée ». Proposition : `maxLength` de 1 000 caractères sur le champ de question, comme le champ du projet (2 000).
- **`/api/comparateur-vie/synthesize-choix`** (gardée en place, réversible) n'a pas reçu la borne : hors du périmètre demandé.
