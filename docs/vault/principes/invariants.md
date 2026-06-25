# Les invariants de futur•e

> La couche la plus profonde du vault. Ce qui ne devrait quasiment jamais changer.

**Le test d'entrée.** Un principe n'entre ici que si (a) plusieurs ADR ou doctrines en
dérivent, et (b) tu refuserais de la croissance pour le préserver. Si une preuve nouvelle
pouvait te faire changer d'avis (« les scores triplent la conversion »), ce n'est pas un
invariant, c'est une doctrine ou une stratégie. Un invariant ne bouge pas quand on
*apprend* : il ne bouge que si futur•e décide de devenir un autre produit.

**L'expérience de pensée.** Si je reconstruisais futur•e de zéro dans dix ans, avec d'autres
technologies, quels principes resteraient intouchables ? Ce qui ne survit pas à cette question
est une excellente doctrine, pas un invariant.

**Cette page doit rester courte.** Sa force est inversement proportionnelle à sa longueur.
Si elle s'allonge, c'est qu'on y fait entrer des préférences déguisées en invariants.

---

1. **On éclaire, on ne décide jamais à la place du lecteur.**
   Ce que ça interdit : recommander un choix de vie, trancher ce qui relève de l'intime.
   *(→ `vision/manifeste.md`, `adr/ADR-0001`)*

2. **Une décision vaut mieux qu'une note.**
   Pas de score synthétique. On révèle des compromis lisibles, jamais un classement absolu
   du lieu ou de la personne.
   *(→ `adr/ADR-0001`, `doctrine/positionnement.md`)*

3. **Rien n'est affirmé sans source, et on montre aussi ce qu'on ignore.**
   On distingue toujours l'observé, le modélisé, le projeté et l'interprété, et on rend
   visibles les limites de ce qu'on sait. La qualité d'écriture ne maquille jamais la faiblesse
   d'un fond ; l'incertitude se montre, elle ne se cache pas.
   *(→ `vision/positionnement.md`, `doctrine/data.md`, `doctrine/interface.md`)*

4. **Une donnée n'a de valeur que si elle aide une décision.**
   Tout ce qu'on affiche doit servir un choix réel ; jamais de donnée vraie mais inerte
   déguisée en caractéristique du lieu. *Qu'elle raconte avant de convaincre* est la traduction
   éditoriale de cet invariant, pas l'invariant lui-même.
   *(→ principe n°1, `doctrine/editoriale.md`)*

5. **On n'affirme jamais au-delà de ce que permet la preuve.**
   Vaut pour la donnée, l'analyse, le comparateur, l'IA. On ne surpromet jamais la précision,
   on ne déguise jamais une position relative en caractéristique absolue. Question de contrôle :
   à quelle échelle, avec quelle certitude, cette affirmation est-elle vraie ?
   *(→ `doctrine/data.md` granularité, `doctrine/editoriale.md`)*

6. **On parle à une intelligence, pas à une peur.**
   Lucidité sans alarmisme, précision sans culpabilisation. futur•e existe contre l'amnésie
   d'un monde qui change, pas pour l'alarme permanente : il donne à voir les transformations,
   pas un instantané figé.
   *(→ `vision/manifeste.md`, `vision/positionnement.md`, `doctrine/` gabarit climat)*

7. **L'indépendance ne se monétise pas.**
   Ni publicité, ni vente de leads, ni affiliation immobilière, ni recommandation sponsorisée,
   ni placement territorial payé, ni score pondéré par un intérêt commercial. La confiance est
   un actif, jamais une variable d'ajustement.
   *(→ `vision/modele-economique.md`, `adr/ADR-0001`)*

8. **futur•e évolue avec les preuves, jamais avec les intérêts.**
   Toute preuve nouvelle peut faire changer le produit ; aucun intérêt commercial ne le peut.
   futur•e apprend, il ne prétend jamais avoir définitivement raison : les ADR se remplacent, la
   doctrine évolue, les données s'enrichissent. C'est la jonction de la boucle d'apprentissage
   et de l'indépendance (n°7).
   *(→ `adr/ADR-0006` équipe IA, `vision/modele-economique.md`, `recherches/inventaire-sources.md`)*

---

**Usage.** Avant de graver une ADR ou une doctrine, vérifier qu'elle ne contredit aucun
invariant. Quand une décision *semble* bonne mais bute sur un invariant, c'est le signe d'un
arbitrage de fond, pas d'un détail : il remonte au porteur.
