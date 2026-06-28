# Rapport Editorial Writer — Upsell : tension gratuit→payant du comparateur

Date : 2026-06-28
Périmètre : 3 textes d'upsell recadrés (nommer l'inconnu décisif + trajectoire, pas une quantité de critères).
Méthode : lecture de `docs/vault/doctrine/editoriale.md` + texte exact dans le code.

## Constat factuel sur la présence des textes

- L'arête trajectoire « Le gratuit vous montre… » n'apparaît **qu'une seule fois** dans le code,
  dans `comparateur/page.tsx` (l.217). Le grep sur `OuVivreClient.tsx` ne trouve aucune
  occurrence de « Le gratuit ». Sur `/ou-vivre`, l'idée de trajectoire est portée **autrement**,
  intégrée au texte 3 (« ce qu'elles deviennent, pas seulement ce qu'elles sont aujourd'hui »).
  Donc : la tournure proscrite n'est à corriger **qu'à un seul endroit**. La consigne « présente
  deux fois » ne se vérifie pas dans l'état actuel du code — à confirmer côté porteur (peut-être
  une occurrence supprimée depuis, ou attendue ailleurs).

---

## Texte 1 — Lede d'upsell généré (`comparateur/page.tsx`, `upsellLede`, l.145-148, affiché l.214)

### Texte
Cas nominal :
« Vos communes se départagent d'abord sur {thème}, vous venez de le voir. Restent {liste} :
c'est là, critère par critère, que se joue le reste de votre choix, là où vous ne les avez pas
encore départagées. »
Repli :
« Vous voyez où chacune penche. Ce qui reste, c'est de savoir laquelle correspond à votre façon
d'habiter : le Pack situe chaque commune critère par critère, là où ça décide votre choix. »

Moment du parcours : bloc CTA, juste après le face-à-face et l'explorateur, sert la décision
« est-ce que je débloque la comparaison complète ? ».

### Où ça touche juste
Le cas nominal est la meilleure des deux. « vous venez de le voir » crée la confiance : il part
de ce que le lecteur a SOUS LES YEUX, pas de l'offre. Nommer le thème de divergence puis les
thèmes restants (« Restent {liste} ») nomme l'inconnu décisif au lieu de vanter une quantité :
c'est exactement le recadrage demandé. Le verbe « se joue » garde la décision côté lecteur.

### Ce qui trahit le ton
- **« critère par critère »** : c'est un marqueur de quantité/granularité (le découpage du
  produit), pas de la situation du lecteur. Présent dans les DEUX branches. Contre l'esprit du
  recadrage (« ne plus vendre une quantité ») et la règle « la page s'adresse au lecteur, pas à
  elle-même ».
- **Cas nominal, fin de phrase** : « que se joue le reste de votre choix, là où vous ne les avez
  pas encore départagées » dit deux fois la même idée (le reste = là où ce n'est pas tranché).
  Rythme dilué, quatre clauses dans une phrase déjà longue.
- **Repli** : « le Pack situe chaque commune » fait du produit le sujet de la phrase (proscrit,
  même famille que « Le gratuit »). « là où ça décide votre choix » est bancal (c'est le lecteur
  qui décide, pas « ça »).

### Réécriture proposée (phrase à trous, {thème}/{liste} conservés)
Cas nominal — option A (resserrée) :
« Vos communes se départagent d'abord sur {thème}, vous venez de le voir. Restent {liste} :
c'est là que se joue le reste de votre choix, et vous ne les y avez pas encore vues s'écarter. »

Cas nominal — option B (plus sèche, deux temps) :
« Vos communes se départagent d'abord sur {thème}, vous venez de le voir. {liste} : c'est là
que le reste de votre choix se décide. »

Repli — option A (centrée lecteur) :
« Vous voyez où chacune penche. Reste à savoir laquelle colle à votre façon d'habiter, et c'est
dans le détail que ça se tranche. »

Repli — option B :
« Vous voyez où chacune penche. Reste l'essentiel : laquelle correspond à votre façon d'habiter,
au jour le jour. »

Raison : on garde l'ancrage « vous venez de le voir » et le nommage des thèmes (l'inconnu
décisif), on retire « critère par critère » et le produit-sujet, on dégraisse la redondance
finale.

### Verdict : À RETOUCHER (le squelette est bon, surtout le cas nominal).

---

## Texte 2 — Arête trajectoire (`comparateur/page.tsx`, l.217)

### Texte
« Le gratuit vous montre ce que ces communes sont aujourd'hui ; le Pack ajoute ce qu'elles
deviennent, leur trajectoire, là où se joue une décision qui vous engage des années. »

Moment : deuxième paragraphe du bloc CTA, juste sous le texte 1.

### Où ça touche juste
L'opposition aujourd'hui / ce qu'elles deviennent est la bonne arête honnête : la trajectoire
EXISTE dans le Pack (climat DRIAS, « Vie locale & trajectoires »), donc la promesse est tenable.
« une décision qui vous engage des années » dit l'enjeu réel sans grandiloquence ni peur. Le mot
« trajectoire » en apposition est juste et sobre.

### Ce qui trahit le ton
- **« Le gratuit vous montre… ; le Pack ajoute… »** : structure entièrement bâtie sur le
  découpage commercial du produit. Deux fois le produit-sujet. C'est précisément la tournure que
  le porteur rejette, et elle contredit « la page s'adresse au lecteur, pas à elle-même ».
- Point-virgule + « ajoute » : registre un peu mécanique, le rythme d'une fiche produit.

### Réécriture proposée
Option A (recommandée, lecteur-sujet) :
« Vous avez vu ce que ces communes sont aujourd'hui. Reste ce qu'elles deviennent : leur
trajectoire, là où se joue une décision qui vous engage des années. »

Option B (sans répéter « vous avez vu » si le texte 1 l'a déjà dit juste au-dessus) :
« Ces communes, vous les voyez telles qu'elles sont aujourd'hui. Ce qu'elles deviennent, leur
trajectoire, est là où se joue une décision qui vous engage des années. »

Raison : on supprime « Le gratuit » et « le Pack ajoute », on repart du lecteur (« vous avez
vu »), on garde l'arête trajectoire et l'enjeu temporel. Note rythme : le texte 1 se termine
sur « se joue / se décide » et le texte 2 reprend « là où se joue » — sur la version A du
texte 1 (option B « se décide »), l'écho est atténué ; sinon préférer l'option B du texte 2.

### Verdict : À RÉÉCRIRE (l'idée reste, la tournure produit-sujet doit disparaître).

---

## Texte 3 — Upsell `/ou-vivre` (`OuVivreClient.tsx`, l.1298-1302)

### Texte
« Les trois côte à côte là où elles se départagent vraiment, et ce qu'elles deviennent, pas
seulement ce qu'elles sont aujourd'hui. Vos questions, et des pistes supplémentaires pour le même
projet. »

Moment : sous-titre du bloc Pack Décision, après les 3 fiches, sous le titre « Comparer les
trois en profondeur. »

### Où ça touche juste
Déjà conforme au recadrage : pas de « Le gratuit », pas de quantité de critères. « là où elles
se départagent vraiment » nomme l'inconnu décisif ; « ce qu'elles deviennent, pas seulement ce
qu'elles sont aujourd'hui » pose la trajectoire honnêtement. C'est le meilleur des trois au
départ.

### Ce qui trahit le ton
- Seconde phrase : « Vos questions, et des pistes supplémentaires pour le même projet » glisse
  vers l'énumération de fonctionnalités (AskFuture + communes en plus). « des pistes
  supplémentaires » est vague et un peu produit. Mineur, mais c'est le seul endroit où le texte
  parle de la fonctionnalité plutôt que de la situation.

### Réécriture proposée
Option A (retouche de la 2e phrase seulement) :
« Les trois côte à côte là où elles se départagent vraiment, et ce qu'elles deviennent, pas
seulement ce qu'elles sont aujourd'hui. Vos questions trouvent une réponse, avec d'autres
communes à comparer pour le même projet. »

Option B (plus resserrée) :
« Les trois côte à côte là où elles se départagent vraiment, et ce qu'elles deviennent, pas
seulement ce qu'elles sont aujourd'hui. Vos questions, d'autres communes pour le même projet. »

Raison : on garde la première phrase intacte (elle est juste), on rend la seconde un peu moins
catalogue. Acceptable de la GARDER telle quelle si on préfère ne pas y toucher.

### Verdict : À RETOUCHER (légère) — quasi DANS LA VOIX.

---

## Rythme et longueur (vue d'ensemble du bloc CTA comparateur)

Textes 1 et 2 sont empilés (l.214 puis l.217), deux paragraphes longs de suite. Sur le cas
nominal, le texte 1 d'origine finit par une 4e clause redondante : combiné au texte 2, ça fait
deux pavés. Les réécritures resserrent le texte 1 (3 clauses → 2) et raccourcissent le texte 2 :
le bloc respire mieux. Vérifier que « se joue / se décide » n'apparaisse pas en cascade sur les
deux paragraphes (voir note rythme du texte 2).

## Honnêteté de la promesse

Rien ne dépasse la preuve : la trajectoire est réellement dans le Pack (DRIAS + vie locale).
« une décision qui vous engage des années » est un fait sur le projet de vie, pas une promesse
produit. Aucun futur affirmé comme certain. Conforme aux invariants n°5 et n°6.

## Cohérence (à poser au porteur, non tranché)

- « critère par critère » : je le retire car il sonne quantité/produit. Si le porteur tient à
  signaler la granularité réelle du Pack (vraie valeur perçue), c'est un arbitrage de tension
  Product↔voix : à trancher par lui. Ma lentille dit « nomme l'inconnu, pas le découpage ».

## Mise à jour de la doctrine (prête à coller dans editoriale.md, section « La page
s'adresse au lecteur, pas à elle-même »)

> Corollaire upsell : ne jamais faire de l'offre le sujet de la phrase (« Le gratuit montre… »,
> « le Pack ajoute… », « le Pack situe… »). On part de ce que le lecteur a sous les yeux (« vous
> venez de voir… », « vous avez vu… »), puis on nomme ce qui reste à trancher et la trajectoire.
> On ne vend pas une quantité (« tous les critères », « critère par critère », « les 7 thèmes ») :
> on nomme l'inconnu décisif.

## Limites de mon regard (ce run)

- Je juge la prose, pas la conversion : je ne sais pas si « critère par critère » performe à
  l'achat. Si l'A/B montrait que la granularité convertit, c'est un arbitrage à rouvrir.
- Je n'ai pas le rendu visuel : l'effet de rythme du bloc CTA empilé (deux paragraphes) est
  estimé sur le code, pas vu à l'écran. La taille 16.5px/15px et le bindOrphans peuvent changer
  la perception de longueur.
- Le {liste} est injecté dynamiquement (joinFr) : je n'ai pas vérifié tous les cas (1, 2, 3
  thèmes, ou liste vide → branche repli). « {liste} : c'est là que… » suppose une liste non vide,
  ce que la condition `autresDivergents.length > 0` garantit. OK sous cette garde.
- Constat « présent deux fois » non reproduit : une seule occurrence trouvée pour le texte 2.

## Version minimale (90 % de la valeur)

- Texte 2 : remplacer « Le gratuit vous montre … ; le Pack ajoute … » par « Vous avez vu … Reste
  ce qu'elles deviennent : … ». C'est LE changement qui répond à la demande du porteur.
- Texte 1 : retirer les deux occurrences de « critère par critère » et, au repli, remplacer
  « le Pack situe chaque commune » par une formule lecteur. Le reste est secondaire.
- Texte 3 : peut rester tel quel ; la retouche est cosmétique.

## Quand rouvrir

- Funnel instrumenté : si le taux de déblocage chute après retrait de « critère par critère »,
  rouvrir l'arbitrage granularité (la quantité rassurait peut-être sur la valeur du prix).
- Si une 2e occurrence réelle de l'arête trajectoire apparaît (ou est retrouvée), appliquer la
  même réécriture pour cohérence inter-pages.
- Si le Pack gagne/perd des thèmes à trajectoire (DRIAS, vie locale), réévaluer la promesse
  « ce qu'elles deviennent » (honnêteté de la preuve).
