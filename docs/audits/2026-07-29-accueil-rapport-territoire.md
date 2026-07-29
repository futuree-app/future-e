# Audit comparatif : page d'accueil et Rapport Territoire

> 2026-07-29. Lecture seule, aucun fichier produit modifié. Objectif : séparer **ce qui existe**,
> **ce qui est intentionnel** et **ce qui doit être abandonné**, AVANT d'écrire `DESIGN.md`.
> Sources lues : `src/components/FutureELanding.tsx` (3615 l.), `src/app/(account)/rapport/page.tsx`,
> `src/components/report/*` (22 composants, 5441 l.), `src/app/globals.css`, `src/app/design-tokens.css`.

## Le constat qui domine tout le reste

Les deux surfaces ne sont pas deux dialectes du même langage visuel. Elles sont **deux langages** :

| | Page d'accueil | Rapport Territoire |
| --- | --- | --- |
| Technique de style | Objet `styles` JS + `<style>` injecté, ~1700 lignes | Tailwind + tokens CSS + `.glass` / `.card-verdict` |
| Couleur | Décorative : chaque plan tarifaire a sa teinte | Sémantique : la teinte EST l'information |
| Rapport aux tokens | Contourné (`'Instrument Sans', system-ui` en dur, `#c8b89a` hors palette) | Consommé (`var(--tone)`, `var(--info)`, `var(--ghost)`) |
| Responsive | 4 media queries, breakpoints 1024 / 768 / 480 | **Zéro. Aucun breakpoint dans les 22 composants.** |
| Traçabilité des décisions | Peu commentée | Chaque geste porte son « pourquoi » et ses essais écartés |

La conséquence pour `DESIGN.md` est nette : **l'autorité visuelle de futur•e est dans le rapport, pas dans l'accueil.** L'accueil est plus ancien, plus générique, et c'est lui qui porte l'essentiel des signatures d'interface générée.

---

# Surface 1 : la page d'accueil

## 1a. Ce qui est réellement cohérent avec futur•e

**La typographie de marque tient.** Instrument Serif en titres (poids 400, jamais bold, `letter-spacing` négatif), Instrument Sans en corps, JetBrains Mono réservé aux surtitres et métadonnées. Trois rôles, trois familles, aucune confusion. C'est la seule chose qui traverse les deux surfaces sans rupture.

**Le teaser sur vraie donnée.** Le panneau droit du hero calcule de vraies projections DRIAS pour la commune saisie (`getDriasCard`, `getPreviewCards`), avec narratifs par indicateur et par horizon. Ce n'est pas un mockup : c'est le produit qui se montre. Doctrine « distinctive ET identitaire » respectée.

**Le `HorizonSwitch`.** Trois horizons, avec sous-libellé de température et source affichée sous le contrôle. Il enseigne le référentiel TRACC au lieu de le supposer connu.

**La grille des trois échelles.** Le numéro d'ordre `01 · commune` porte la structure du produit dans la grille elle-même, et la copie assume que les échelles se contredisent (« un bon quartier ne fait pas un bon logement »). C'est de l'honnêteté structurelle, pas du remplissage.

**La section de clôture (`amnesie*`).** Prose longue, sans carte, sans puce, qui parle de l'asymétrie d'information entre celui qui vend et celui qui arrive. C'est la voix de futur•e à son meilleur endroit sur cette page.

## 1b. Signatures probables d'interface générée par IA

Elles sont nombreuses et concentrées.

1. **Les trois orbes floutés.** `orb1` / `orb2` / `orb3` : radiaux orange, améthyste, bleu, `blur(90-100px)`, en `position: fixed`, dont un suit la souris. C'est le cliché visuel dominant de la landing générée 2023-2025. Ils ne portent aucune information et **ils sont dupliqués à l'identique dans le rapport payant**.

2. **Le surtitre pastille + mono + `uppercase` + `letter-spacing: 0.12em`.** Compté sur cette seule page : hero, encart comparateur, CTA rapport, hub Savoir, modules, tarifs, clôture. Sept occurrences du même geste. Un surtitre qui apparaît sept fois cesse de hiérarchiser : il devient la texture de fond.

3. **La barre de sources qui défile** (`@keyframes scroll-x`, `SOURCES` dupliqué pour la boucle). C'est le carrousel de logos clients des landings SaaS, appliqué à des noms d'institutions. Le geste dit « regardez comme ils sont nombreux », pas « voici d'où vient ce chiffre ». Sur une marque dont l'argument est la traçabilité, une source qui défile trop vite pour être lue est un contresens.

4. **Le tableau de tarifs à trois colonnes avec `✓`, badges et couleur par plan.** Vert « Disponible maintenant », violet « Au bout du parcours », listes de features cochées, prix en très gros avec suffixe. C'est le patron pricing SaaS canonique. Deux problèmes de fond, pas de goût : la couleur y devient **décorative** (le vert et le violet ne signifient rien, alors que dans le rapport le vert signifie « favorable » et l'améthyste « non su »), et la page se met à parler d'elle-même par quantité de fonctionnalités, ce que la doctrine interdit.

5. **L'animation « machine à sous ».** `slot-spin` / `slot-settle` avec `filter: blur()` sur les valeurs de projection. Une donnée climatique qui arrive en tournant comme un jackpot fait de la projection un divertissement. `prefers-reduced-motion` est respecté, ce qui règle l'accessibilité, jamais le sens.

6. **Les emoji comme icônes de module.** Présents dans `MODULES` côté accueil et dans `MODULE_ICONS` côté rapport (🏘 🚶 🏠).

7. **`hero-right { display: none }` sous 768 px.** La preuve produit, seule chose vivante et vraie du hero, disparaît entièrement sur mobile. Il reste un titre, un sous-titre et deux boutons : exactement la landing générique dont on essaie de sortir.

## 1c. Problèmes de hiérarchie, de densité, de compréhension

- **Deux décomptes contradictoires sur la même page.** Ligne 2688 : « futur•e croise **plus de 50 indicateurs** ». Ligne 2803 : « **près de 30 critères** ». Le second est la formule validée par la doctrine (28 réels dans `PREFERENCE_KEYS`) ; le premier est une inflation non sourcée. C'est un manquement à l'invariant n°5, à l'endroit exact où le lecteur commence à décider s'il fait confiance.
- **L'ordre du parcours est conditionnel** (`order: commune ? 2 : 1`), donc la page raconte deux histoires différentes selon qu'une commune a été saisie. Défendable, mais aucune trace de doctrine ne dit laquelle est la bonne.
- **Trois appels à l'action concurrents** avant le premier tiers : « Trouver où vivre », « Analyser ma commune », « Créer mon rapport interactif ». Le lecteur qui ne sait pas encore ce qu'il cherche doit choisir sa porte avant d'avoir compris qu'il y en a trois.
- **Le CTA wizard promet ce que la page ne montre pas** : « ce qui entoure votre adresse et ce qui pèse sur votre logement », alors qu'Autour et Logement relèvent du Dossier Adresse, non commercialisé.
- **Densité en accordéon** : `padding` de section entre 56 et 80 px, cartes entre `p-6` et `52px 56px`, rayons entre 8 et 20 px sur la même page. Aucune échelle ne gouverne.

## 1d. À conserver

`HorizonSwitch` · le moteur de teaser sur vraie donnée (`getPreviewCards` et ses narratifs) · la grille des trois échelles avec numéro d'ordre · la section de clôture en prose · le trio typographique.

## 1e. À ne surtout pas faire entrer dans DESIGN.md

Les orbes flous · le surtitre pastille-mono comme geste par défaut · la barre de sources défilante · le tableau de tarifs coché à couleur par plan · l'animation slot-machine sur une donnée · les emoji d'icône · l'objet `styles` JS comme mode d'écriture du style · toute couleur qui ne porte pas d'information.

---

# Surface 2 : le Rapport Territoire

## 2a. Ce qui est réellement cohérent avec futur•e (et remarquablement)

**`ConclusionBlock` et `.card-verdict` sont le sommet du projet.** Le halo suit le **ton du verdict**, jamais l'accent de marque : un dossier bloqué ne s'auréole pas de vert. Le commentaire CSS explique pourquoi le lavis diffuse plutôt que de plaquer un gris, et pourquoi la teinte se dissout avant la mi-hauteur pour que le texte se lise sur du neutre. Les quatre tons sont quatre couleurs distinctes, après correction d'un cas où `caution` et `positive` rendaient la même. **Ici, la couleur est une donnée.**

**Les registres sont séparés par la teinte ET par une étiquette de nature.** Améthyste pour la condition non examinée (le non-savoir), bleu pour les contrôles à mener (des faits établis dont on contrôle les conséquences), rouge pour l'incompatibilité, vert pour l'alignement. Un lecteur peut apprendre ce vocabulaire en une lecture et s'en servir ensuite.

**Un seul traitement de signal complet par niveau de lecture.** Doctrine explicite et appliquée : le verdict garde halo + filet + lavis ; les cartes de section ont rendu leur filet coloré et ne gardent que la pastille ; le côté d'un compromis n'a plus qu'une teinte plate à 4 %. Il n'y a pas trois mini-héros sous le héros.

**L'anti-redondance est traitée comme un problème de design, pas de rédaction.** Le grain (« à cette adresse » / « à l'échelle de la commune ») ne s'affiche que si la section en mélange plusieurs, et alors une seule fois en intertitre de groupe. Une condition portée entièrement par le verdict fait disparaître sa section entière. Le décompte des réserves a été supprimé parce que les cartes en dessous le donnaient déjà.

**Les séparateurs plutôt que l'encadrement.** Un filet entre constats, explicitement préféré à des cartes dans des cartes.

**Le repère de renvoi (`[data-visee]`).** Un liseré posé en `box-shadow` pour ne prendre aucune place, ciblé par attribut parce que React réécrit `className` à l'hydratation, et qui s'effile après usage. C'est du travail d'artisan.

**La distinction preuve / conclusion / limite est structurellement portée** : `FactBody`, `EvidenceRow`, `MethodDetails`, chips de preuve avec valeur observée et lien, convention de signalement rangée avec la provenance. La donnée absente se rend à `opacity: 0.45` avec filet gris et mention explicite.

## 2b. Signatures probables d'interface générée par IA

Elles sont concentrées dans **l'enveloppe** de la page, presque jamais dans la substance.

1. **Les mêmes trois orbes flous**, en `fixed`, dans un produit payant qu'on lit pendant vingt minutes.
2. **La page hub du rapport est une landing page déguisée** : surtitre pastille, `<h1>` en `clamp(36px,4vw,54px)` avec une ligne en italique accent, deux boutons de CTA, puis trois cartes de module. Le lecteur a payé, il est à l'intérieur du produit, et l'écran continue de lui vendre l'entrée.
3. **Les emoji d'icône** (🏘 🚶 🏠) sur les cartes de module, dans un document qui se veut un dossier de décision.
4. **La pastille « Accessible » avec halo lumineux**, répétée sur les trois cartes de module. Une information affichée trois fois avec la même valeur n'est pas une information, et **elle réemploie le geste exact** (pastille colorée + `box-shadow: 0 0 6px`) qui, quinze centimètres plus bas, porte la sémantique de section. Le même signe veut dire « ceci est un alignement favorable » et « ceci existe ».
5. **Un pied de page à cinq liens morts** (`href="#"` : Manifeste, Méthodologie, Pages Savoir, Contact, Mentions légales), dans un produit payant. Les mentions légales n'y sont pas facultatives.
6. **Le CTA d'achat reste rendu pour qui a déjà payé** : `TrackedUpgradeLink` vers `/#pricing` (l. 415-418) n'est gardé par aucun `!fullReport`. Et il renvoie vers l'ancre tarifs de l'accueil, alors que `/territoire/[insee]/debloquer` est la page de conviction dédiée. Deux chemins de paywall, un seul argumenté.

## 2c. Problèmes de hiérarchie, de densité, de compréhension

- **Aucun breakpoint, nulle part.** 22 composants, `grep` sur `sm:` `md:` `lg:` `@media` : zéro. Les grilles sont figées : `grid-cols-[1fr_400px]` pour le hero, `grid-cols-3` pour les modules, **`grid-cols-4` pour les cartes climat**. Sur téléphone, une carte climat reçoit environ 80 px de large pour un libellé, une valeur, un sous-titre et une source. Le produit payant, celui qui porte la promesse, n'existe pas en mobile. C'est le défaut le plus grave des deux surfaces, et il est invisible dans une revue faite sur un écran large.
- **Contradiction de décompte interne** : le hero annonce « **six angles** », la section suivante s'intitule « **trois échelles** », la carte de module affiche « **Module 01** ». Trois systèmes de numération pour le même produit.
- **La largeur de lecture est un problème ouvert, documenté comme tel** dans `DossierDecisionSection` : la mesure de ligne reste trop longue sur desktop, une colonne de 860 px a été essayée puis retirée faute d'alignement avec le reste. À trancher **à l'échelle de la page**, ce qui est précisément un travail de `DESIGN.md`.
- **La densité n'a pas d'échelle** : `p-8` pour le verdict, `p-6` pour les sections, `p-7` pour l'aside, `px-4 py-3.5` pour les cartes climat, rayons `2xl` / `xl` / `lg` sans règle énoncée.
- **`fontFamily` en style inline, répété.** `"'Instrument Serif', serif"` et `"'Instrument Sans', sans-serif"` sont écrits en dur des dizaines de fois alors que `--font-serif` et `--font-sans` existent, avec leurs piles de repli complètes. Les occurrences inline **perdent les replis**.

## 2d. À conserver

`ConclusionBlock` + `.card-verdict` (le lavis de ton, les quatre tons, la structure en strates étiquetées) · le vocabulaire chromatique sémantique des cinq registres · `DossierDecisionSection` (règles d'anti-redondance, grain conditionnel, filet entre constats) · `FactBody` / `EvidenceRow` / `MethodDetails` / `Chip` · `[data-visee]` · le rendu de la donnée absente · `HorizonBar` · le tiret `—` comme marqueur « pas de donnée ».

## 2e. À ne surtout pas faire entrer dans DESIGN.md

Les orbes · le hero de landing en tête d'un produit payant · les emoji d'icône · toute pastille décorative réemployant le signe sémantique · la pastille d'état répétée à valeur constante · les grilles figées sans breakpoint · le `fontFamily` inline · le pied de page à liens morts · le double chemin de paywall.

---

# Comparaison des deux surfaces

**Ce qui traverse et doit être posé comme invariant.** Le trio typographique et ses rôles. Le fond bleu-nuit `#060812` avec surfaces en blanc transparent à 3-6 %. L'orange `#fb923c` comme accent unique de marque. Le mono pour toute métadonnée (source, échelle, convention).

**Ce qui traverse et doit disparaître.** Les orbes. Le surtitre pastille par défaut. Les emoji. Le `fontFamily` inline.

**La rupture de fond : le statut de la couleur.** Dans le rapport, une teinte est une affirmation vérifiable. Dans l'accueil, une teinte est un ornement de colonne tarifaire. Les deux régimes ne peuvent pas coexister : le second détruit la lisibilité du premier chez le même lecteur, qui traverse les deux en une session. **C'est l'arbitrage central que `DESIGN.md` doit rendre**, et il se rend en faveur du rapport.

**La seconde rupture : à qui l'écran parle.** L'accueil parle au visiteur, et le rapport aussi, alors qu'il ne devrait plus. Une page hub de produit payant construite comme une page d'acquisition est un problème de langage visuel avant d'être un problème de copy.

**Un accent orphelin.** `#c8b89a` (sable) apparaît en dur dans le `HorizonSwitch` (`rgba(200,184,154,…)`) et sur un bouton du hero, sans exister dans `design-tokens.css`. Soit c'est une quatrième couleur de marque et elle doit être nommée, soit c'est un accident et elle doit partir. Aujourd'hui elle est les deux.

---

# Trois directions visuelles communes

Compatibles avec `PRODUCT.md` : le lecteur y prend une décision résidentielle concrète, il valorise le compromis montré et l'aveu d'ignorance, il rejette ce qui paraît crédible sans l'être. Chacune conserve le trio typographique, l'accent orange unique et le régime sémantique de la couleur ; chacune supprime les orbes, les emoji et le pricing coché. Elles diffèrent sur **ce que futur•e doit évoquer**.

## Direction A — Le dossier d'instruction

**Le référent** : le rapport d'expertise que remet un géomètre ou un notaire avant une signature. Papier, marges généreuses, numérotation, pas d'effets.

**Ce que ça change concrètement** : le verre disparaît presque entièrement au profit du **filet et de la marge** comme unités de séparation. Une seule surface élevée subsiste dans tout l'écran, celle du verdict. La colonne de lecture est fixée autour de 68-72 caractères et **le reste de la page s'aligne sur elle**, ce qui résout la largeur laissée ouverte dans `DossierDecisionSection`. Les métadonnées (source, échelle, convention) passent en **marge latérale** plutôt qu'en pied de carte. La numérotation devient le système de repérage : `1.` `1.2` `1.2.a`, ce qui rend le dossier citable.

**Ce qu'elle gagne** : la crédibilité maximale, et la fin de la cardification. Un lecteur qui imprime ou transmet le document possède quelque chose qui ressemble à une pièce de dossier.

**Ce qu'elle coûte** : l'accueil doit renoncer à l'imagerie de landing. Le mode Persuade devra convaincre par la sobriété, ce qui est plus difficile et plus rare.

## Direction B — L'instrument de mesure

**Le référent** : le tableau de bord d'un instrument scientifique sérieux, ou une planche de relevé. Le fond nuit est assumé comme un fond d'écran d'instrument, pas comme une esthétique sombre.

**Ce que ça change concrètement** : une **grille de mesure visible** gouverne la page, et les valeurs s'y alignent verticalement au chiffre près (mono tabulaire). Le signal se porte par la **position et la longueur** (barre, échelle, position sur un axe) plutôt que par le fond de carte : une valeur projetée se lit sur une échelle qui montre aussi ce qui est normal, ce qui est extrême et **ce qui est inconnu**. La palette sémantique existante devient le code de lecture officiel, affiché une fois en légende plutôt que réexpliqué à chaque bloc.

**Ce qu'elle gagne** : c'est la direction qui rend le mieux la trajectoire et l'incertitude, donc le moat. Un intervalle, une absence de donnée, une projection à trois horizons se dessinent naturellement.

**Ce qu'elle coûte** : le risque de l'observatoire climatique, que la plateforme de marque interdit explicitement. Elle demande une discipline stricte : chaque graphique doit répondre à une décision, sinon elle produit exactement le « tableau de bord rempli d'indicateurs » refusé.

## Direction C — La lettre du territoire

**Le référent** : la revue imprimée ou la longue lettre éditoriale. Le texte mène, la donnée s'intercale comme une planche dans un article.

**Ce que ça change concrètement** : la colonne de prose devient la structure principale de l'écran, et les faits arrivent **dans le fil**, au moment où la phrase les appelle, avec la preuve en note plutôt qu'en chip. Les cartes ne disparaissent pas mais deviennent des **planches** : rares, larges, légendées, jamais en grille de quatre. La hiérarchie se porte par le corps de texte et le blanc, presque plus par la bordure.

**Ce qu'elle gagne** : c'est la direction la plus proche de la voix déjà écrite (les paliers d'horizon, la section de clôture de l'accueil, les gloses du dossier). Elle donne le sentiment que quelqu'un a lu le territoire pour vous, ce qui est exactement ce que le lecteur paie.

**Ce qu'elle coûte** : elle scanne mal. Un lecteur pressé qui veut « la minute » doit quand même traverser de la prose, et le dossier de décision perd en densité comparative. Elle demanderait de garder un bloc de tête franchement distinct du reste, en tension avec son propre principe.

## Ce que je recommanderais si la question m'était posée

**A comme charpente, B comme vocabulaire de la donnée, C comme registre du verdict et des gloses.** Les trois ne sont pas exclusives à parts égales : A tranche la structure et la largeur de lecture, ce qui est le problème le plus urgent et le plus documenté ; B fournit la manière de dessiner trajectoire et inconnu, seule chose que futur•e vend vraiment ; C existe déjà dans la voix et n'a pas besoin d'être conquise, seulement protégée. Le vrai risque serait de choisir C seule : la marque serait belle et le dossier de décision redeviendrait illisible.

---

# Ordre de travail suggéré

1. **Deux corrections de vérité, indépendantes du design** : « plus de 50 indicateurs » sur l'accueil, et les cinq liens morts du pied de page du rapport (dont les mentions légales).
2. **Le responsive du rapport payant.** C'est un défaut de livraison, pas un choix esthétique, et il ne doit pas attendre `DESIGN.md`.
3. **`DESIGN.md` prescriptif**, qui tranche : le régime sémantique de la couleur, quand une carte est légitime, quand un badge est légitime, la largeur de lecture à l'échelle de la page, la relation Territoire / Autour / Logement, la représentation de la preuve, de l'inconnu et de l'action, et les deux listes explicites de composants validés et dépréciés.
