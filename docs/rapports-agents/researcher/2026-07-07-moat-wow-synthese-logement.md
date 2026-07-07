# Researcher — Divergence : le « wow / moat » de la synthèse Logement
**2026-07-07 · NON VÉRIFIÉ · sortie d'OUVERTURE, à faire converger (humain + Editorial/Business) avant tout usage**

Agent d'ouverture : je génère, je ne filtre pas, je ne tranche pas, je ne désigne pas de gagnant.
Étiquettes = notes de passage pour la convergence, jamais un classement.

---

## Le problème, recadré en question créative

Le brief donné : « rendre la synthèse plus wow, plus moat ». La contrainte centrale, retournée en générateur :

> **Quelle interaction fait dire « comment ils savent ÇA sur MON logement ?! » sans un seul mot d'expert, et sans que l'IA se mette en avant ?**

La contrainte « pas de jargon » n'interdit rien : elle demande *quelle version PLAINE d'un détail hyper-spécifique reste hyper-spécifique ?* « Logement non traversant » → « l'air ne circule pas d'une façade à l'autre » : aussi précis, zéro jargon. La leçon du porteur n'est pas « enlève le détail », c'est « traduis le détail ». Ce sont deux instructions opposées, et **le prompt actuel a exécuté la mauvaise.**

### La tension centrale que je dépose sur la table (à trancher en convergence)
Le SYSTEM_PROMPT actuel pousse activement CONTRE le wow. Il ordonne :
- « préférez *un logement ancien, énergivore* à *une consommation de 320 kWh/m²* » ;
- « Vous n'énumérez JAMAIS les caractéristiques techniques (traversant ou non, type d'inertie, type de ventilation…) » ;
- « un chiffre n'apparaît que s'il éclaire une décision ».

Or « un logement ancien énergivore » est **exactement la phrase qu'un ChatGPT sans accès à l'adresse écrirait**. Le wow du porteur venait précisément des traits bannis (« non traversant, inertie légère, protections solaires »). Le prompt a confondu deux choses : **le jargon** (à bannir) et **la spécificité** (le moat). Il les a bannis ensemble. La divergence ci-dessous explore surtout comment **rétablir la spécificité en la gardant plaine.** `remet en cause l'hypothèse « sobriété = généralité »`

---

## Et si je jetais la question ?

1. **« Le wow doit-il vivre dans la prose IA ? »** Le moat gravé du produit = « l'auditable, pas l'IA en première ligne ». Peut-être que le wow doit vivre dans une **bande de faits assemblés auditables** (chips traduites, sourçables) et que la prose n'est que le liant. La question deviendrait : *quel dispositif NON-IA porte le « comment ils savent ça » ?*
2. **« Est-ce vraiment "wow" qu'on cherche, ou "reconnaissance" ? »** Le vrai frisson n'est peut-être pas la surprise (« je ne savais pas ») mais la reconnaissance (« je le pressentais sans savoir le dire, et eux l'ont nommé »). Cible alors : *faire nommer au lecteur ce qu'il vit déjà à cette adresse.* Ça déplace le travail vers l'intake (poser 1-2 questions) plutôt que vers le style.
3. **« Le wow est-il un problème de CONTENU ou d'ORDRE ? »** Peut-être que les bons faits sont déjà là, mais noyés dans une progression « logement → exposition → autour » qui enterre le fait le plus spécifique. La question deviendrait : *et si la première phrase était toujours le fait le plus inimitable, pas le DPE ?*

Ces reformulations s'AJOUTENT au menu ; elles ne le remplacent pas. Si la convergence retient (1), ça remonte au board (question mal posée), pas au Data Curator.

---

## Les paradigmes (la carte des idées)

- **A — « Le wow, c'est traduire le détail, pas le supprimer. »** Le prompt actuel a jeté le bébé (spécificité) avec l'eau du bain (jargon). On réautorise le détail granulaire à condition qu'il soit rendu en image plaine.
- **B — « Le croisement que le lecteur n'aurait jamais fait. »** Le moat n'est pas un fait, c'est l'assemblage de deux faits distants (sol × âge, altitude × sinistralité, air × chaleur). Relier EST le produit (ADR-0002).
- **C — « Le pivot d'attention. »** Vous regardez X (l'étiquette, le quartier), ce qui structure vraiment c'est Y. Nommer tôt et net l'écart entre le visible et le décisif.
- **D — « Le wow vit peut-être ailleurs que dans la prose. »** (espace des problèmes) Signature-ligne, bande auditable, dispositif de reconnaissance : l'IA n'est pas forcément la vitrine du moat.
- **E — « L'inimitable = ce qu'un ChatGPT ne pourrait pas dire. »** Un test négatif : si un assistant sans accès à cette adresse pourrait écrire la phrase, elle n'est pas le moat.

---

## Le menu (18 pistes)

### Paradigme A — Traduire le détail, pas le supprimer

**A1. Le lexique de traduction injecté dans le prompt.**
Fournir au modèle une table « terme DPE → image plaine » (non traversant → « l'air ne circule pas d'une façade à l'autre » ; inertie légère → « des murs qui retiennent peu la chaleur, se réchauffent et se refroidissent vite » ; VMC simple flux → « une ventilation qui extrait l'air sans le préchauffer » ; protections solaires renseignées → « des protections contre le soleil aux fenêtres »).
*Intéressant :* rend le détail spécifique DISPONIBLE au lieu de banni ; le wow revient sans le jargon.
*Hypothèse remise en cause :* « nommer un facteur technique = jargon » (faux si traduit).
*Étiquettes :* `dépend d'une donnée à valider` (la table doit couvrir toutes les valeurs ADEME).
*Contrainte aval :* réécrit la règle « vous n'énumérez JAMAIS » du prompt Editorial — arbitrage Editorial requis.

**A2. Autoriser UN détail concret, traduit, par phénomène.**
Remplacer l'interdit absolu (« jamais lister ») par un quota : « un seul trait concret, rendu en langage courant, autorisé s'il PORTE le phénomène ». On garde l'anti-inventaire, on rouvre la spécificité.
*Intéressant :* compromis fin entre sobriété et wow, sans tout rouvrir.
*Hypothèse remise en cause :* « la spécificité fait dériver vers l'inventaire » (un quota la borne).
*Étiquettes :* `contre-intuitive` (relâcher un interdit pour gagner en sobriété perçue).

**A3. La « signature thermique » en une phrase.**
Une phrase unique qui nomme les 1-2 traits concrets qui font que CE logement tient ou non la chaleur (« un logement où l'air ne traverse pas et dont les murs gardent peu l'inertie, ce qui compte surtout aux beaux jours »), sans le verdict « confort insuffisant » ni température prédite.
*Intéressant :* condense le fait le plus « comment ils savent ça » du payload (confortEte est le plus riche) en une ligne mémorable.
*Hypothèse remise en cause :* « le confort d'été doit rester une catégorie abstraite » (ChatGPT reprochait le côté vidé/abstrait).
*Contrainte aval :* ne jamais franchir la ligne « ressenti prédit ».

### Paradigme B — Le croisement que le lecteur n'aurait jamais fait

**B1. Année de construction × matière du bâti.**
« Un logement des années 1970 dont les murs retiennent peu la chaleur » croise `annee_construction` (dans le payload DPE, sous-exploité) et l'inertie. Le lecteur connaît l'année, connaît vaguement l'inertie, ne les a jamais reliés.
*Intéressant :* l'année est un fait que le lecteur POSSÈDE déjà ; le relier crée le « ah, c'est donc pour ça ».
*Hypothèse remise en cause :* « le DPE se lit comme une étiquette, pas comme une histoire du bâti ».

**B2. Sol (RGA à la parcelle) × type de bâti × âge.**
Le retrait-gonflement est un fait de PARCELLE (pas commune) : c'est déjà du grain adresse fort. Le croiser avec « maison individuelle » (plus exposée aux fissures qu'un appartement en étage) et l'âge du bâti donne une lecture que seul l'accès à la parcelle permet.
*Intéressant :* RGA parcelle = un des faits les plus inimitables du payload ; le type de bâti module l'enjeu.
*Hypothèse remise en cause :* « le sol est un aléa communal » (non, ici il est à la parcelle).
*Contrainte aval :* ne pas prédire « votre maison fissurera » (interdit ferme doctrine).

**B3. Altitude × sinistralité inondation, posées côte à côte SANS conclusion.**
ChatGPT a flaggé l'inférence actuelle (« invite à regarder si le bien bénéficie d'une protection ») comme risquée. Reframe génératif : juxtaposer les deux faits bruts (altitude modeste ; commune où l'inondation a été indemnisée) et s'arrêter là, laisser le lecteur relier.
*Intéressant :* le wow du croisement SANS le pas de trop ; l'ellipse fait le travail.
*Hypothèse remise en cause :* « relier = conclure » (on peut relier et se taire).
*Étiquettes :* `dépend d'une donnée à valider` (l'altitude est-elle discriminante à cette adresse ?).

**B4. Le bois à 40 m qui compte double pour un logement qui chauffe.**
Croiser `autour` (espace vert à distance précise, nature précisée) avec la lecture thermique : un logement qui tient mal la chaleur ET un grand espace planté tout près, c'est une information de décision, pas deux items de liste.
*Intéressant :* fait dialoguer Face 1 et Face 3, qui vivent aujourd'hui en silos.
*Hypothèse remise en cause :* « l'autour et le bien sont deux blocs séparés ».
*Contrainte aval :* ne pas verser dans le ressenti (« vous serez au frais »).

**B5. Nommer explicitement que « deux ou trois choses se parlent ».**
Une phrase-charnière qui pose l'assemblage comme l'objet : « Ce qui se joue ici tient à la rencontre de deux choses : le sol, et l'âge du bâti. » L'acte de RELIER devient visible, sobrement.
*Intéressant :* rend le moat (la transformation, ADR-0002) littéralement lisible.
*Hypothèse remise en cause :* « le liant doit rester invisible ».
*Étiquettes :* `dangereusement séduisante` (frôle l'auto-célébration du raisonnement — surveiller l'anti-auto-référence).

### Paradigme C — Le pivot d'attention

**C1. La première phrase = le fait le plus spécifique, jamais le DPE.**
Inverser l'ordre mental imposé (« le logement lui-même » = DPE d'abord). Ouvrir sur le fait le plus inimitable de CE cas (le sol, l'air qui ne traverse pas, le bois à 40 m), pas sur l'étiquette que tout le monde a déjà vue sur l'annonce.
*Intéressant :* le wow se joue dans les 8 premiers mots ou nulle part.
*Hypothèse remise en cause :* « la lecture doit commencer par l'enveloppe énergétique ».
*Contrainte aval :* la structure « logement → exposition → autour » du prompt à assouplir.

**C2. Le pivot « vous êtes venu pour X, ce qui décide c'est Y ».**
Rendre net l'écart entre ce qui attire l'œil (l'étiquette C, le quartier) et ce qui structure (le sol souterrain, l'exposition). L'exemple Rochefort le fait déjà en clôture (« l'enjeu est souterrain ») ; le remonter en tête.
*Intéressant :* c'est la mécanique de surprise la plus honnête (pas un tour de magie, un recentrage).
*Hypothèse remise en cause :* « le pivot est une conclusion » (il peut être une ouverture).
*Étiquettes :* `contre-intuitive` (mettre la chute au début).

**C3. Le pivot par posture (acheteur / résident).**
Le dédoublement acheteur/résident (déjà en doctrine, non instrumenté) module le pivot : l'acheteur vient pour la valeur → pivot vers ce qu'il devra documenter avant de s'engager ; le résident vient pour vivre → pivot vers ce qu'il pourra anticiper.
*Intéressant :* le même fait, deux « ce qui décide » — double le sentiment d'être lu personnellement.
*Hypothèse remise en cause :* « une seule lecture pour tous les projets ».
*Contrainte aval :* la posture n'entre pas dans le hash (déjà tranché) ; à faire vivre hors payload.

### Paradigme D — Le wow vit peut-être ailleurs que dans la prose (espace des problèmes)

**D1. La ligne « Signature de cette adresse ».**
Au-dessus de la prose, un one-liner façon trait distinctif Territoire : le fait le plus rare/spécifique de ce bien, nommé sec (« Sur cette parcelle, un sol argileux sous une maison des années 1970 »). La prose développe ensuite.
*Intéressant :* concentre le wow en un point saillant au lieu de le diluer dans un paragraphe.
*Hypothèse remise en cause :* « la synthèse est un bloc de prose homogène ».
*Contrainte aval :* doit rester descriptif, jamais un verdict (ADR-0001).

**D2. La bande de « faits assemblés » auditables (le wow sans IA).**
Une rangée de chips TRADUITES et sourçables sous la prose : « l'air ne traverse pas · sol argileux (parcelle) · bois à 40 m · inondation indemnisée dans la commune ». Le wow porté par les blocs auditables, la prose n'est que le liant.
*Intéressant :* aligne le wow sur le moat gravé (« l'auditable, pas l'IA en première ligne »).
*Hypothèse remise en cause :* « le wow doit être senti dans la prose ».
*Étiquettes :* `remet en cause l'hypothèse "l'IA est la vitrine du moat"`.
*Contrainte aval :* c'est une décision Design + Product, pas seulement Editorial.

**D3. Le dispositif « vous le saviez sans le savoir ».**
Cibler la reconnaissance plutôt que la surprise : faire nommer au lecteur ce qu'il pressent (« un logement qui chauffe côté après-midi »), en s'appuyant sur 1-2 questions d'intake. La donnée confirme l'intuition = frisson de justesse.
*Intéressant :* le wow le plus solide n'est pas « je ne savais pas » mais « ils ont mis des mots sur ce que je vivais ».
*Hypothèse remise en cause :* « le wow = information nouvelle » (parfois c'est la mise en mots).
*Étiquettes :* `dépend d'une donnée à valider` (nécessite intake, à mesurer avant de construire).
*Contrainte aval :* ne pas glisser vers le ressenti prédit (« il fait chaud chez vous »).

**D4. Le « saviez-vous » — angle franchement hors-marque.**
Un ton de trivia / fun-fact assumé (« Détail que peu remarquent à cette adresse : … »). Ce n'est PAS la voix futur•e, mais il isole la MÉCANIQUE de surprise à l'état pur, à retraduire ensuite dans le ton sobre.
*Intéressant :* nomme le mécanisme (révéler l'inaperçu) qu'on peut importer sans l'esthétique.
*Hypothèse remise en cause :* « la sobriété et la surprise sont incompatibles ».
*Étiquettes :* `éloignée de la marque`, `dangereusement séduisante`.

### Paradigme E — L'inimitable : ce qu'un ChatGPT ne pourrait pas dire

**E1. Le test anti-générique dans le prompt.**
Ajouter une règle : « Si un assistant sans accès aux diagnostics de CETTE adresse pouvait écrire cette phrase, retirez-la. » Filtre les banalités (« logement ancien énergivore ») en faveur du spécifique.
*Intéressant :* opérationnalise l'inimitabilité comme critère de rédaction.
*Hypothèse remise en cause :* « la sobriété se mesure au dépouillement » (ici elle se mesure à la spécificité).
*Étiquettes :* `contre-intuitive`.

**E2. Le plancher de spécificité.**
Exiger qu'au moins une phrase nomme un trait que seul l'accès aux données de cette adresse permet (un facteur de confort traduit, le RGA parcelle, la nature/distance exacte de l'autour). Anti-dérive vers le générique.
*Intéressant :* garantit qu'il reste toujours un « comment ils savent ça » dans chaque synthèse.
*Hypothèse remise en cause :* « toutes les synthèses peuvent se ressembler ».

**E3. L'ancrage concret parcelle / contenance / année.**
Utiliser les faits que le payload possède mais que la prose ignore (`surface`, `annee_construction`, et via l'artefact la parcelle/contenance) comme points d'ancrage tangibles (« sur cette parcelle », « pour un bien de cette surface »).
*Intéressant :* ces faits banals-mais-précis ancrent le « c'est bien MON logement, pas un logement type ».
*Hypothèse remise en cause :* « les métadonnées du bien ne servent pas le récit ».
*Contrainte aval :* la parcelle vit dans l'artefact serveur, pas encore dans le payload de synthèse — à câbler.

---

## Le test « sans écran »

- **B1/B2 (les croisements) — SURVIT.** Un conseiller humain qui dit « cet appartement des années 70, l'air ne traverse pas, et il est sur un sol argileux » survit intégralement en podcast, au téléphone, dans un livre. L'expérience ressentie (« ils ont vraiment regardé MON bien, pas un bien-type ») ne dépend d'aucun pixel. C'est un concept, pas une interface.
- **D1 (signature-ligne) — SURVIT.** Une phrase de révélation dite à voix haute garde sa force (« sur cette parcelle, un sol argileux sous une maison des années 70 »). C'est un concept.
- **D2 (bande de chips auditables) — DISPARAÎT sans écran.** La rangée de chips est une INTERFACE : au téléphone il faudrait les lire en liste, l'effet s'effondre. Ce qui survit de D2, c'est l'idée que « le wow tient aux faits eux-mêmes, pas au style » — ça, ça se dit. Signal : D2 est une bonne mise en forme d'un concept (B), pas un concept autonome.

Conclusion du test : le concept-noyau est **le croisement de faits granulaires à l'adresse, rendu en langage plain** (B + A). Les pistes D sont des véhicules ; E est une discipline de rédaction ; C est un ordre.

---

## Les pistes que je n'ose presque pas proposer

- **Laisser UN terme d'expert nu, puis le gloser en aside.** Le porteur a dit « trop technique ». Mais son wow initial VENAIT des mots d'expert (« non traversant, inertie légère ») : le jargon lui-même signalait « ils ont accès à un savoir pointu sur mon bien ». Peut-être que le problème n'était pas le mot, mais le mot NON EXPLIQUÉ. Hypothèse : « non traversant (l'air ne circule pas d'une façade à l'autre) » garde la crédibilité du terme expert ET la clarté. `dangereusement séduisante` (contredit frontalement la leçon telle qu'énoncée).
- **Le mode "l'analyste montre qu'il a lu le dossier".** Un ton légèrement « enquêteur qui a remarqué un détail » (« ce qui retient l'attention à cette adresse, c'est… »). Frôle l'auto-référence interdite, mais c'est peut-être là que se loge le « comment ils savent ça ». `remet en cause l'invariant anti-auto-référence`.
- **S'adresser à ce que le lecteur vit physiquement** (« si vous occupez la pièce côté ouest… »). Frôle le ressenti prédit interdit. Mais c'est le raccourci le plus court vers la reconnaissance (D3). À poser sur la table pour que la convergence tranche la ligne exacte.

---

## Réflexe de clôture — quand ré-explorer ce problème ?

Rouvrir et élargir si :
- **la convergence sèche** : Editorial et le porteur n'arrivent pas à réconcilier « spécificité » et « sobriété » (signal que la tension A est structurante et mérite un mini-board, pas un arbitrage de prompt) ;
- **l'intake devient réel** : si 1-2 questions au lecteur sont posées un jour (étage, orientation, pièce de vie), tout le paradigme D3 (reconnaissance) devient jouable et change la nature du wow ;
- **la parcelle entre dans le payload de synthèse** (aujourd'hui dans l'artefact, pas dans `buildSynthesisPayload`) : nouveaux croisements possibles (E3), à re-diverger ;
- **Santé naît** : quand pollution/bruit/industrie migrent hors Logement, le payload maigrit — re-vérifier que le wow ne reposait pas sur un fait qui part ;
- **une mesure du wow existe** : si un jour on instrumente « le lecteur a-t-il ressenti la spécificité ? », les pistes gagnantes/perdantes se départageront sur donnée, et la divergence pourra viser plus juste ;
- **un ChatGPT grand public sait lire une adresse** : si les assistants généralistes accèdent au DPE/Géorisques par adresse, le test E1 durcit et le moat doit se déplacer vers le croisement + l'auditable (D2), à re-explorer.

---

**Rappel de statut :** tout ce document est NON VÉRIFIÉ. Aucune piste n'est recommandée ni classée par qualité. La sélection appartient au Data Curator (sources/faisabilité) puis, pour la tension A (spécificité vs sobriété, qui touche le prompt Editorial gravé), au board / Editorial Writer. J'ai ouvert le champ ; je ne le referme pas.
