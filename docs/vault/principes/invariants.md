# Les invariants de futur·e

> La couche la plus profonde du vault. Ce qui ne devrait quasiment jamais changer.

**Le test d'entrée.** Un principe n'entre ici que si (a) plusieurs ADR ou doctrines en
dérivent, et (b) tu refuserais de la croissance pour le préserver. Si une preuve nouvelle
pouvait te faire changer d'avis (« les scores triplent la conversion »), ce n'est pas un
invariant, c'est une doctrine ou une stratégie. Un invariant ne bouge pas quand on
*apprend* : il ne bouge que si futur·e décide de devenir un autre produit.

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

3. **Rien n'est affirmé sans source.**
   On distingue toujours l'observé, le modélisé, le projeté et l'interprété. La qualité
   d'écriture ne maquille jamais la faiblesse d'un fond.
   *(→ `vision/positionnement.md`, `doctrine/interface.md`)*

4. **La donnée raconte avant de convaincre.**
   Tout chiffre affiché doit aider un humain à décider. Jamais de donnée vraie mais inerte
   déguisée en caractéristique du lieu.
   *(→ `doctrine/editoriale.md` signature, `doctrine/interface.md` tooltips)*

5. **On lit le mouvement, pas la photo.**
   Les transformations comptent plus que les états. futur·e parle d'un monde qui change, pas
   d'un instantané.
   *(→ `doctrine/` gabarit climat, face = mouvement)*

6. **Chaque donnée à sa juste échelle.**
   On ne surpromet jamais la précision, on ne déguise jamais une position relative en
   caractéristique absolue. Question de contrôle : à quelle échelle cette affirmation est-elle
   vraie ?
   *(→ `doctrine/data.md` granularité, `doctrine/editoriale.md`)*

7. **On parle à une intelligence, pas à une peur.**
   Lucidité sans alarmisme, précision sans culpabilisation. futur·e existe contre l'amnésie,
   pas pour l'alarme permanente.
   *(→ `vision/manifeste.md`, `vision/positionnement.md`)*

---

**Usage.** Avant de graver une ADR ou une doctrine, vérifier qu'elle ne contredit aucun
invariant. Quand une décision *semble* bonne mais bute sur un invariant, c'est le signe d'un
arbitrage de fond, pas d'un détail : il remonte au porteur.
