# Rapport éditorial · FUT-157 « Sols pollués sur ce terrain » (30/10/2026)

Lu : `~/Documents/futuree-fut157/textes-rendus.md` (17 adresses réelles, 3 cas construits) ; `src/lib/sites-sols-texte.ts` (en entier) ; `src/components/report/logement/SitesSolsSection.tsx` ; `src/lib/sites-sols-etat.ts` ; `src/lib/sites-sols-terrain.ts` (l. 285-330, la règle des 2 m) ; `docs/vault/doctrine/editoriale.md` (l. 1-80) ; la mémoire « Textes : vulgariser » ; `LogementModule.tsx` (libellé du bouton « Actualiser les données », l. 797-830).

## Synthèse

Ce bloc est solide sur les deux points les plus risqués. « Concerné » ne se dit qu'après la preuve des 2 m. Les obligations des SIS ne sont jamais prêtées aux servitudes ni aux sites suivis par l'administration dans le texte du premier niveau. « Aucun » est toujours suivi de « ce n'est pas la preuve d'un sol sans pollution ». Je ne vois rien à refondre.

Il reste deux fautes bloquantes, toutes deux sur ce qu'un lecteur pressé retient en 30 secondes. D'abord, le surtitre affirme une pollution sur tous les dossiers, y compris ceux où rien n'est trouvé. Ensuite, l'état `terrain_non_situe` commence par « Aucun ». Viennent ensuite une dizaine de retouches importantes : du vocabulaire technique (« emprise », « instruction », « s'impose aux autorisations d'urbanisme »), un locataire oublié dans les conseils, une prudence qui cache une information forte (une fiche publiée à l'adresse même du logement), et deux phrases du dépliable qui se contredisent ou mélangent les inventaires.

## Grille du porteur, en bref

| Question | Verdict | Où ça coince |
|---|---|---|
| 1. « concerné » = la preuve géométrique, sans plus | Tenu | Les titres de `concerne` disent « Cette adresse » (point à plus de 2 m) ou « La parcelle de cette adresse » (recoupement de plus de 2 m), et « en partie » quand c'est le cas. Seule réserve : `parcelle_bordure` dit « le plus souvent un simple écart », ce qui rassure sans preuve (I7). |
| 2. Les obligations SIS jamais prêtées aux SUP / ex-BASOL | Tenu au premier niveau | Une faute dans le dépliable : « Une servitude d'utilité publique **y** restreint des usages » place la servitude à l'intérieur du SIS (B3). |
| 3. Terrain / parcelle / adresse / bâtiment | Plutôt tenu | Rien ne dit que le point de l'adresse n'est pas le bâtiment (M6). « Ce terrain » est employé quand le terrain n'est justement pas connu (B2). |
| 4. « aucun » ≠ sol sain, et seulement après lecture complète | Tenu pour `aucun` | Mais `terrain_non_situe` commence par « Aucun » (B2), et le surtitre affirme « Sols pollués » au-dessus d'une absence (B1). |
| 5. Utile, pas anxiogène, pas de prudence excessive | À retoucher | Locataire oublié (I3). Fiche publiée à l'adresse même, présentée en « peut-être » (I6). `incomplet` dit « rien ne peut être conclu » alors que deux inventaires sur trois ont été lus (I8). La phrase « ne mesurent pas l'exposition » est cachée dans le dépliable (I9). Le recours de l'acheteur ou du locataire n'est pas dit (I10). |
| 6. L'essentiel compris dans futur•e | Plutôt tenu | Pour une adresse sans numéro, le geste le plus utile (refaire la recherche avec le numéro) n'est pas proposé (I11). Le contenu d'une servitude ou d'un SIS reste dans la fiche officielle (voir « Cohérence »). |

---

## BLOQUANT

### B1. Le surtitre affirme ce que le bloc ne démontre pas
- **Texte** : `Sols pollués sur ce terrain` (`SitesSolsSection.tsx` l. 24), affiché dans les six états.
- **Problème** : au-dessus de « Aucun secteur d'information sur les sols… » (98 bd Solidarité, 10 rue de Rivoli), le lecteur pressé lit une affirmation : *ce terrain a des sols pollués*. Même chose pour `terrain_non_situe`, `incomplet` et `indisponible`. Le bloc voisin, « Fibre à cette adresse », nomme un sujet ; celui-ci énonce un constat. Cela contredit l'invariant n°5 (ne pas affirmer au-delà de la preuve) et la question 4.
- **Réécriture** (arbitrage de ton, je ne tranche pas) :
  - A (sujet neutre, sur le modèle de la fibre) : `Pollution des sols sur ce terrain`
  - B (dit la source, donc la limite) : `Sols pollués : ce que l'État recense ici`
  - C (le plus sobre) : `Pollution des sols`
  Je penche pour A : même grammaire que « Fibre à cette adresse », et « pollution des sols » désigne un sujet, pas un fait.

### B2. `terrain_non_situe` : le titre commence par « Aucun »
- **Texte** : `Aucun de ces périmètres ne contient le point de l'adresse, mais le terrain lui-même n'a pas pu être situé.` (titreDe, l. 246), suivi de la limite `L'adresse n'est connue qu'à la voie : ce n'est donc pas une absence vérifiée pour le terrain.`
- **Problème** : (a) le lecteur qui s'arrête au premier mot retient « aucun », alors que l'état existe justement parce que l'absence n'est pas vérifiée ; (b) « ces périmètres » n'a pas d'antécédent, aucune liste ne précède ; (c) pour une adresse sans numéro, « le point de l'adresse » est en fait celui de la rue ; (d) « pas une absence vérifiée » est dit deux fois, dans le titre (par le « mais ») et dans la limite.
- **Réécriture, titre** (l. 246) :
  `Le terrain n'a pas pu être situé : rien ne peut être conclu pour lui. Seul le point de l'adresse a été comparé aux inventaires de sols pollués, et aucun ne le contient.`
- **Réécriture, limite** (l. 294) : ne garder que la raison, sans répéter la conclusion :
  `${Raison}.`, par exemple `L'adresse n'est connue qu'à la rue, pas au numéro.` / `Aucune parcelle cadastrale n'a été trouvée à ce point.` / `Le tracé de la parcelle n'a pas pu être lu.` / `La parcelle est trop étendue pour être lue en une recherche.`
  (Dans `RAISON_NON_SITUE.adresse_sans_numero`, préférer « à la rue » à « à la voie », plus courant.)

### B3. Le dépliable met la servitude à l'intérieur du SIS (question 2)
- **Texte** (savoirPlus[0], l. 310) : `Un secteur d'information sur les sols est arrêté par le préfet sur des terrains où l'État connaît une pollution des sols. Une servitude d'utilité publique y restreint des usages par arrêté. Un site suivi par l'administration (ancienne base BASOL) est un terrain où elle est intervenue pour une pollution suspectée ou avérée.`
- **Problème** : « y » renvoie aux terrains du SIS. Le lecteur comprend qu'une servitude est une couche *à l'intérieur* d'un SIS. Or ce sont deux régimes distincts (L. 125-6 et L. 515-12). C'est précisément le mélange que le porteur veut éviter. « elle » (l'administration) est lui aussi ambigu.
- **Réécriture** :
  `Un secteur d'information sur les sols est arrêté par le préfet sur des terrains où l'État connaît une pollution des sols. Une servitude liée à une pollution est une autre mesure, prise elle aussi par arrêté du préfet : elle limite certains usages d'un terrain pollué. Un site suivi par l'administration (ancienne base BASOL) est un terrain où l'administration est intervenue pour une pollution suspectée ou avérée.`

---

## IMPORTANT

### I1. « site pollué suivi par l'administration » en dit plus que l'inventaire
- **Texte** : `UN.instructions = "un site pollué suivi par l'administration"` (l. 32), `PLURIEL.instructions = "sites pollués suivis par l'administration"` (l. 43), titre `aucun` (l. 244). Rendu : `Un site pollué suivi par l'administration touche peut-être ce terrain` (62 et 56 rue Paul Cazeneuve).
- **Problème** : le dépliable dit lui-même « pollution suspectée **ou** avérée ». Écrire « site pollué » affirme ce que l'inventaire ne dit pas toujours, surtout pour une instruction clôturée. C'est l'invariant n°5.
- **Réécriture** :
  - `UN.instructions` : `"un site suivi par l'administration pour une pollution des sols"`
  - `PLURIEL.instructions` : `"sites suivis par l'administration pour une pollution des sols"`
  - Titre `aucun` : voir M1.

### I2. « Si c'est le cas » : le lecteur a perdu de quoi on parle
- **Texte** (CHANGE_SI, l. 154-155) : `Si c'est le cas, le vendeur ou le bailleur doit vous en informer par écrit, et un projet…` / `Si c'est le cas, la servitude limite…`
- **Problème** : « c' » renvoie au titre, séparé de cette phrase par toute la liste des sites. Quand un SIS et une servitude sont tous deux à vérifier, deux « Si c'est le cas » se suivent.
- **Réécriture** :
  - sis : `Si le terrain est bien dans ce secteur, le vendeur ou le bailleur doit vous en informer par écrit. Et pour construire ou lotir ici avec un permis, il faudra l'attestation d'un bureau d'études certifié (voir I4).`
  - sup : `Si le terrain est bien sous cette servitude, certains usages ou travaux y sont limités : l'arrêté du préfet dit lesquels, et tout permis doit le respecter.`

### I3. Le locataire est oublié dans les conseils
- **Textes** :
  - VERIFIER.sis (l. 159) : `Demandez au vendeur l'information écrite…`
  - VERIFIER.instructions (l. 161) : `…demandez au vendeur les études de sols…`
  - VERIFIER_EMPRISE (l. 178) : `…demandez au vendeur ou au notaire si celui-ci en fait partie.`
  - CHANGE.instructions (l. 142) : `…d'obligation pour l'acheteur.`
- **Problème** : CHANGE.sis parle bien de « vente ou location », de « vendeur ou bailleur », mais les gestes proposés ne visent que l'acheteur. Le module sert aussi à louer. Dans VERIFIER_EMPRISE, « celui-ci » est ambigu (le terrain visé ? le vendeur ?).
- **Réécriture** :
  - VERIFIER.sis : `Demandez au vendeur ou au bailleur l'information écrite sur ce secteur, et ce qu'il sait du terrain : études de sols déjà faites, travaux de dépollution.`
  - VERIFIER.instructions : `Demandez au vendeur ou au bailleur les études de sols déjà réalisées et les éventuelles restrictions d'usage.` (on retire « Lisez la fiche du site » : sur les deux adresses Cazeneuve, la ligne précédente, VERIFIER_EMPRISE, dit déjà « Lisez la fiche ». Deux « Lisez la fiche » de suite, c'est du texte de trop.)
  - VERIFIER_EMPRISE : `Lisez la fiche : elle décrit le terrain visé. Demandez au vendeur, au bailleur ou au notaire si le logement en fait partie.`
  - CHANGE.instructions : `Cette inscription, à elle seule, n'impose rien de particulier à la vente ou à la location.`

### I4. Le permis et l'étude de sols : phrase juste, mais écrite pour un instructeur
- **Texte** (CHANGE.sis[1], l. 136) : `Un projet de construction ou de lotissement soumis à permis devra comporter l'attestation d'une étude de sols par un bureau d'études certifié.`
- **Problème** : celui qui achète un appartement à Paris ne voit pas en quoi cela le concerne, et ne sait pas ce qu'atteste l'attestation. C'est le registre que FUT-81 a refusé.
- **Réécriture** (fidèle à L. 556-2 : l'attestation garantit que l'étude a été faite et que le projet en tient compte) :
  `Pour construire ou lotir ici avec un permis, il faudra joindre l'attestation d'un bureau d'études certifié : elle garantit qu'une étude des sols a été faite et que le projet en tient compte.`

### I5. La servitude : jargon, et le titre répété
- **Texte** (CHANGE.sup, l. 139) : `Une servitude d'utilité publique limite certains usages du terrain ou certains travaux ; elle s'impose aux autorisations d'urbanisme. Son contenu est fixé par un arrêté du préfet.`
- **Problème** : le titre vient de dire « certains usages du terrain y sont limités ». La phrase le répète, puis ajoute du jargon (« s'impose aux autorisations d'urbanisme »). Ce que le lecteur a besoin d'apprendre ici : *lesquels*, et *où le lire*.
- **Réécriture** (arbitrage) :
  - A, sobre (le contenu n'est jamais résumé, comme le prévoit l'en-tête du code) : `Lesquels : c'est l'arrêté du préfet qui le dit, à lire depuis la fiche. Tout permis de construire ou de travaux doit le respecter.`
  - B, illustrée (plus parlante, mais elle donne des exemples qui ne viennent pas de *cet* arrêté) : `Selon l'arrêté du préfet, à lire depuis la fiche, il peut s'agir par exemple d'un potager, d'un puits ou de certains travaux. Tout permis doit le respecter.`
  Je recommande A : B donne au lecteur une image qui n'est peut-être pas celle de son terrain.

### I6. Une fiche publiée à l'adresse même du logement : la prudence cache le fait
- **Textes** :
  - Titre `a_verifier` (l. 242) rendu au 56 rue Paul Cazeneuve : `Un site pollué suivi par l'administration touche peut-être ce terrain : c'est à vérifier.`
  - adresse_publiee (l. 100) : `Cette fiche est publiée à l'adresse « 56 RUE PAUL CAZENEUVE », mais elle n'est située que par un point : son emprise réelle n'est pas connue.`
  - localisation_ponctuelle (l. 95) : `Cette fiche n'est située que par un point, qui tombe dans la parcelle CI 78 ; son emprise réelle n'est pas publiée.`
- **Problème** : un site suivi qui est déclaré *au numéro même* du logement, ou dont le point tombe *dans sa parcelle*, ce n'est pas un vague « peut-être ». C'est un fait établi ; seule son étendue est inconnue. Le titre générique noie ce fait (question 5). Et « emprise » est un mot de géomètre.
- **Réécriture, titre** : ajouter une variante quand toutes les fiches de l'inventaire en tête sont `adresse_publiee` ou `localisation_ponctuelle` :
  - adresse_publiee : `Un site suivi par l'administration pour une pollution des sols est déclaré à cette adresse. On ne sait pas jusqu'où il s'étend : c'est à vérifier.`
  - localisation_ponctuelle : `Le repère d'un site suivi par l'administration pour une pollution des sols tombe dans la parcelle de cette adresse. On ne sait pas jusqu'où il s'étend : c'est à vérifier.`
- **Réécriture, situations** :
  - adresse_publiee (point) : `Ce site est déclaré à l'adresse « 56 RUE PAUL CAZENEUVE », mais il n'est repéré sur la carte que par un point : on ne sait pas jusqu'où il s'étend.`
  - adresse_publiee (aucune) : `Ce site est déclaré à l'adresse « … », mais il n'est pas repéré sur la carte : on ne sait pas jusqu'où il s'étend.`
  - localisation_ponctuelle : `Ce site n'est repéré sur la carte que par un point, qui tombe dans la parcelle CI 78 ; ses limites réelles ne sont pas publiées.`

### I7. `parcelle_bordure` : « le plus souvent » rassure sans preuve
- **Texte** (l. 85) : `…(moins d'un mètre carré) : c'est le plus souvent un simple écart entre deux cartes, mais cela ne se vérifie pas d'ici.`
- **Problème** : « le plus souvent » est une fréquence que personne n'a mesurée, et elle tire vers le rassurant (optimisme fabriqué en petit). « d'ici » parle de l'outil, pas du lecteur.
- **Réécriture** : `Ce périmètre ne touche la parcelle BZ 244 que sur une bande étroite le long de sa limite (moins d'un mètre carré). Ce peut n'être qu'un écart entre deux cartes, qui ne se superposent pas au mètre près : la carte seule ne permet pas de trancher.`

### I8. `incomplet` : « rien ne peut être conclu » efface ce qui a été lu (arbitrage)
- **Texte** (l. 248) : `Une partie des inventaires de sols pollués n'a pas pu être lue : rien ne peut être conclu sur ce terrain.`
- **Problème** : dans le cas construit, les SIS et les sites suivis ont été lus en entier, sans résultat ; seules les servitudes manquent. Pour un acheteur, l'absence de SIS est l'information qui engage une obligation. « Rien ne peut être conclu » la cache derrière une prudence plus large que la panne. Mais conclure sur une partie seulement est un choix de doctrine, pas de style (le code applique cette logique à `concerne`, pas à l'absence). **Je pose la question, je ne tranche pas.**
- **Réécriture, si le porteur accepte une absence partielle** (seulement quand la parcelle est attribuée) :
  - titre : `Les servitudes liées à une pollution des sols n'ont pas pu être lues : la lecture de ce terrain est incomplète.`
  - limite : `Les autres inventaires ont été lus en entier : aucun secteur d'information sur les sols ni aucun site suivi par l'administration ne concerne la parcelle de cette adresse.`
- **Sinon** : garder le titre actuel, en remplaçant « rien ne peut être conclu » par `ce terrain n'a pas pu être vérifié en entier`, plus exact et moins sombre.

### I9. La phrase qui rassure honnêtement est cachée (arbitrage)
- **Texte** (savoirPlus[4]) : `Ces inventaires disent ce que l'administration sait d'un sol ; ils ne mesurent pas ce à quoi les occupants sont exposés.`
- **Problème** : après « l'État y connaît une pollution des sols », la première question de l'acheteur est « est-ce dangereux d'y vivre ? ». La réponse honnête existe déjà, mais au fond du dépliable. La remonter dans `limites` pour `concerne` et `a_verifier` rendrait le bloc moins anxiogène sans rien promettre. Elle ne dit pas « sain » ; elle dit ce que l'inventaire ne mesure pas.
- **Proposition** : la poser en limite visible (classe `nuance`) dans ces deux états, telle quelle ou ainsi : `Ces inventaires disent ce que l'administration sait du sol, pas ce à quoi les occupants sont exposés.`

### I10. Le recours prévu par L. 125-7 n'est pas dit (à valider juridiquement)
- **Constat** : la loi ne s'arrête pas à l'obligation d'informer. Si le vendeur ou le bailleur ne l'a pas fait et qu'une pollution rend le terrain impropre à l'usage prévu au contrat, l'acheteur ou le locataire peut, dans les deux ans suivant la découverte, demander l'annulation du contrat, une partie du prix ou une baisse du loyer (L. 125-7, alinéa 3, de mémoire : **à faire vérifier avant de publier**). C'est l'information la plus utile à un particulier, et elle est absente.
- **Proposition, dans le dépliable, SIS concerné ou à vérifier** : `Si cette information écrite n'a pas été donnée et qu'une pollution rend ensuite le terrain impropre à l'usage prévu au contrat, l'acheteur ou le locataire peut, dans les deux ans, demander l'annulation, une partie du prix ou une baisse du loyer.`

### I11. Adresse sans numéro : le geste le plus utile est dans futur•e, et il manque (question 6)
- **Texte** (l. 295) : `Demandez au notaire si le terrain est situé dans un secteur d'information sur les sols, ou vérifiez-le sur la carte de Géorisques.`
- **Problème** : (a) quand la raison est `adresse_sans_numero`, le meilleur conseil est de refaire la recherche avec le numéro, sans quitter futur•e ; (b) les servitudes sont oubliées ; (c) « ou vérifiez-le sur la carte de Géorisques » répète le lien posé juste en dessous.
- **Réécriture** :
  - si `adresse_sans_numero`, en premier : `Si vous connaissez le numéro, refaites la recherche avec l'adresse complète : le terrain pourra être situé.`
  - puis : `Demandez au notaire ou au bailleur si le terrain est dans un secteur d'information sur les sols ou sous une servitude liée à une pollution.`

### I12. Le dépliable contredit le cas du 62 rue Paul Cazeneuve
- **Texte** (savoirPlus, l. 317) : `Une fiche sans emprise publiée (localisée par un simple point, ou pas du tout) ne se situe pas : seule son adresse publiée est comparée à celle du logement, numéro et voie. Ces fiches sont lues dans la commune de l'adresse (avec ses arrondissements et ses anciens codes), pas dans les communes voisines.`
- **Problème** : au 62 rue Paul Cazeneuve, une fiche localisée par un point *est* comparée à la parcelle (`localisation_ponctuelle`). La méthode affichée ne décrit pas la méthode appliquée (la règle d'AGENTS.md : « la carte dit vrai »). « Emprise » et « anciens codes » sont du jargon.
- **Réécriture** : `Un site qui n'est repéré que par un point, ou pas du tout, ne peut pas être délimité. On regarde seulement si son point tombe dans la parcelle du logement, et si l'adresse qu'il déclare est la même (numéro et rue). Ces sites sont cherchés dans la commune de l'adresse, y compris ses arrondissements et ses anciennes communes, pas dans les communes voisines.`

---

## MINEUR

- **M1. Titre `aucun`, trois négations en 30 mots** (l. 244). Réécriture : `Aucun des trois inventaires de sols pollués consultés ne concerne la parcelle de cette adresse.` (« consultés » rappelle la limite ; les trois noms sont déjà dans le dépliable). La limite « ce n'est pas la preuve d'un sol sans pollution » reste telle quelle juste en dessous.
- **M2. Fiches de la commune sans emprise** (phraseSansEmprise, l. 206-207). Réécriture : `9 sites de la commune ne sont repérés que par un point, ou pas du tout : on ne sait pas jusqu'où ils s'étendent. Aucun n'est déclaré à cette adresse.` (pour `aucun` seulement, on peut ajouter `ni repéré dans sa parcelle`, ce que le code a vérifié). Singulier : `Un site de la commune n'est repéré que par un point, ou pas du tout : on ne sait pas jusqu'où il s'étend.`
- **M3. verifierLimite** (l. 172-173). Le lecteur n'a pas encore « l'acte de vente » et ce n'est pas lui qui reçoit « l'avis de taxe foncière ». Réécriture de la parenthèse : `(son numéro figure sur la promesse de vente, ou sur l'avis de taxe foncière du propriétaire)`. Quand plusieurs sites sont listés (14 avenue Tony Garnier), « La fiche officielle » ne dit pas laquelle : `La fiche officielle de CHIMICOLOR liste…` (nom des fiches non démontrées).
- **M4. VERIFIER `aucun`** (l. 298) : « aussi » ne renvoie à rien. Réécriture : `Le certificat d'urbanisme, à demander à la mairie, indique en plus si le terrain figure sur la carte des anciennes activités industrielles et de services.` (Gratuité du certificat d'information : à vérifier avant de l'écrire.)
- **M5. `incomplet` / `indisponible`** (l. 289, 291) : `Actualisez les données plus tard, ou consultez la carte de Géorisques.` correspond bien au bouton « Actualiser les données ». Mais la deuxième moitié répète le lien posé juste en dessous. Réécriture : `Réessayez plus tard avec « Actualiser les données », en haut du dossier.` Le lien Géorisques suffit pour le reste.
- **M6. Adresse ≠ bâtiment** (question 3) : ajouter dans le dépliable, après la phrase sur la part : `Le point de l'adresse situe l'adresse, pas un bâtiment ni un logement précis.`
- **M7. Le mot « instruction »** dans l'étiquette `Site suivi par l'administration (instruction en cours / clôturée)` (l. 121) est administratif. Proposition : `(suivi en cours)` / `(suivi terminé)`. Par ailleurs, quand un site clôturé est aussi un SIS (18 et 14 avenue Tony Garnier, 64 rue de Grenelle), l'explication « clôturée ne veut pas dire sans pollution » n'est pas dite. Acceptable, parce que le titre SIS dit déjà que l'État y connaît une pollution ; à surveiller.
- **M8. `indisponible`** (l. 250) : « lors de la collecte » parle du produit. Réécriture : `Les inventaires de sols pollués n'ont pas répondu quand ce dossier a été préparé : ce terrain n'a pas pu être vérifié.`
- **M9. « Le point de l'adresse ne tombe dans aucune parcelle »** (parcelle_incertaine, l. 92) : « point de l'adresse » est une notion de géocodage. Variante : `Sur le plan cadastral, l'adresse ne tombe dans aucune parcelle. La plus proche, à 2 m, est entièrement dans ce périmètre, mais rien ne garantit que ce soit celle du logement.` (La deuxième phrase est très bonne, à garder.)
- **M10. savoirPlus[2]** : `même une bande d'un mètre carré` alors que l'écran affiche « moins d'un mètre carré ». Mettre `même une bande de moins d'un mètre carré`.

---

## Ce qui doit rester tel quel, et pourquoi

- **`Ces inventaires ne recensent que les pollutions connues de l'État : ce n'est pas la preuve d'un sol sans pollution.`** C'est la phrase qui protège « aucun ». Courte, sans détour, sans peur. À ne pas affaiblir.
- **`L'adresse et toute la parcelle BZ 240 sont dans ce périmètre.`** / **`L'adresse est dans ce périmètre, qui couvre 95 % de la parcelle CH 371.`** / **`Toute la parcelle BP 85 de l'adresse est dans ce périmètre.`** Chaque phrase dit exactement le grain prouvé. C'est le cœur de la confiance du bloc.
- **`…mais rien ne garantit que ce soit celle du logement.`** Le doute est montré sans dramatiser.
- **`En cas de vente ou de location, le vendeur ou le bailleur doit vous en informer par écrit, et l'acte doit le mentionner.`** Parfaite : elle s'adresse au lecteur, dit son droit, et ne tombe pas dans le piège de « figure dans l'état des risques ».
- **`Lisez l'arrêté de servitude depuis la fiche, et demandez à la mairie un certificat d'urbanisme : il liste les servitudes qui s'appliquent au terrain.`** Un geste concret, qui engage, et un document que le lecteur peut obtenir.
- **`Si elle n'y est pas, la liste peut être antérieure à un redécoupage du cadastre`** : l'honnêteté sur un silence qui ne prouve rien, appuyée sur une mesure (358 numéros disparus sur 2 559).
- **`Une instruction clôturée veut dire que l'administration a terminé son suivi, pas que le sol est sans pollution`** : exactement la bonne lucidité.
- **`La part indiquée est celle de la parcelle, qui peut être bien plus grande que le logement.`**
- Le « peut-être » des titres `a_verifier`, *sauf* dans les cas d'I6.

## Rythme et longueur

Le premier niveau tient en 30 secondes pour `concerne` et `aucun`. Le dépliable, lui, aligne 8 à 9 paragraphes de méthode au même tempo, et il est identique d'un état à l'autre. Il est lisible parce qu'il est replié, mais il redit en partie le premier niveau (« pas la preuve », « ne se superposent pas »). Après les réécritures B3, I12 et M6, une coupe possible : fusionner savoirPlus[1] et [2] en une seule phrase de méthode. Sur `a_verifier` avec SIS (Sotrameuse), la suite titre → situation → « Si c'est le cas » → vérification → vérification → lien enchaîne quatre phrases au conditionnel ; I2 et la coupe de I3 retirent la plus lourde.

## Honnêteté de la promesse

Aucune affirmation au futur sur l'état du sol, aucune distance présentée comme un danger, aucune étude « obligatoire » sans condition : les interdits de l'en-tête sont tenus. Les seuls dépassements sont « site pollué » pour un inventaire qui mêle pollutions suspectées et avérées (I1) et « le plus souvent un simple écart » (I7). À l'inverse, la prudence est excessive en I6 et I8.

## Verdict : À RETOUCHER

Dans l'ordre : B1, B2, B3 avant le merge ; puis I1, I6, I3, I4 (ce que voit le lecteur) ; puis I12 (la méthode affichée doit décrire la méthode appliquée). Le reste peut suivre.

## Cohérence (tensions posées à l'humain, non tranchées)

1. **Absence partielle** (I8) : la doctrine du module garde un résultat attesté malgré une panne (`concerne`). Faut-il faire de même pour une absence attestée inventaire par inventaire ?
2. **SIS recoupé en partie** (`parcelle_recoupe` avec une part inférieure à 100 %) : les obligations y sont dites sans condition. Un SIS est arrêté sur une liste de parcelles. Si la parcelle n'est pas dans la liste de la fiche, l'obligation existe-t-elle ? Faut-il ajouter alors la vérification par la liste (verifierLimite), comme pour les cas non démontrés ? C'est une question juridique et de règle, pas de style.
3. **Question 6** : le contenu d'une servitude, ou ce que l'État sait du SIS (polluant, ancienne activité), reste dans la fiche officielle. Si la fiche publie une description courte, l'afficher rendrait l'essentiel lisible dans futur•e. C'est à décider par le Product et l'Architecte, pas par moi.
4. **I10** : le recours prévu par L. 125-7 est une information à forte valeur, mais elle relève du droit ; à faire valider avant de l'écrire.

## Mise à jour de la doctrine (prête à écrire dans `editoriale.md`)

> **Un surtitre nomme un sujet, il n'énonce pas un constat.** Un surtitre de section s'affiche dans tous les états, y compris l'absence et la panne. Il ne doit donc jamais pouvoir se lire comme un fait sur le lieu du lecteur (« Sols pollués sur ce terrain » au-dessus d'« aucun »). On écrit le sujet (« Pollution des sols sur ce terrain », « Fibre à cette adresse »), jamais le résultat.
>
> **Le premier mot porte l'état.** Quand un résultat n'est pas une absence vérifiée, la phrase ne commence pas par « Aucun ». L'incertitude vient d'abord, le fait partiel ensuite.

## Limites de mon regard

- Je juge à partir de `textes-rendus.md`, du markdown, pas du rendu écran. Je n'ai donc vu ni le poids visuel réel du surtitre, ni celui de la marge (« concerné · 2 inventaires »), ni l'effet de `nuance` sur les limites. B1 peut sembler moins grave à l'écran si le surtitre est très discret. Je ne le crois pas, mais je ne l'ai pas vu.
- Les points de droit (L. 125-7 alinéa 3, gratuité du certificat d'urbanisme d'information, application de L. 556-2 à une extension) sont cités de mémoire, pas vérifiés dans le texte en vigueur. Je propose des formulations, je ne garantis pas le droit.
- Je n'ai pas relu les blocs voisins du module (PPRN, patrimoine, énergie) pour comparer le registre, comme le demande la mémoire « vulgariser » ; seulement le surtitre de la fibre.
- Les cas `point_en_limite` et `geometrie_illisible` n'apparaissent dans aucune des 20 sorties : je n'ai jugé leurs phrases que dans le code (elles me paraissent justes).
- Je juge la prose, pas la façon dont un acheteur réel la comprend : aucun test lecteur.

## Version minimale (~90 % de la valeur)

1. Surtitre : `Pollution des sols sur ce terrain`.
2. Titre `terrain_non_situe` : `Le terrain n'a pas pu être situé : rien ne peut être conclu pour lui. Seul le point de l'adresse a été comparé aux inventaires de sols pollués, et aucun ne le contient.`
3. Dans savoirPlus[0] : remplacer `Une servitude d'utilité publique y restreint des usages par arrêté.` par `Une servitude liée à une pollution est une autre mesure, prise par arrêté du préfet : elle limite certains usages d'un terrain pollué.`
4. Partout : `vendeur` → `vendeur ou bailleur` dans les VERIFIER.

## Quand rouvrir ce sujet

- Si la recette montre que le surtitre retenu se lit encore comme un constat au-dessus d'un état `aucun` (test sur 3 à 5 lecteurs non spécialistes), choisir l'option C (« Pollution des sols »).
- Si un juriste ou un notaire infirme ma lecture de L. 125-7 alinéa 3 ou de L. 556-2, retirer I10 ou corriger I4.
- Si la part des états `incomplet` dépasse quelques pour cent des dossiers (pannes Géorisques récurrentes), I8 devient prioritaire : la prudence globale coûterait alors trop d'information.
- Si les fiches officielles publient une description courte et exploitable, revoir la question 6 (afficher l'essentiel dans futur•e).
- Si la règle des 2 m (`TOLERANCE_TRACE_M`) ou la liste des situations change, relire tous les titres et la méthode du dépliable : I12 montre que le texte de méthode décroche déjà de la règle appliquée.
