# Rapport éditorial — Editorial Writer (futur•e)
## Page B2B `/professionnels`

> Produit par l'agent **Editorial Writer** le 2026-06-26, en **test à froid de validation** de
> son mandat (premier run depuis sa création). Cible choisie pour exercer sa signature : une page
> qui *vend* (tension Product↔Editorial) et son pouvoir tranchant « ce texte ne devrait pas
> exister ». Read-only : l'agent propose, le porteur tranche, Claude principal applique.
> Trouvailles vérifiées contre le code réel (em-dashes, « dix dimensions », fausse citation L.179) :
> exactes, non hallucinées. Verdict de validation du mandat : **concluant**.

---

## Note de cadrage (ma lentille sur une page B2B)

Ma doctrine de positionnement dit « toute copy ouvre par le projet de vie, jamais par un danger », mais elle vise le **résident**. Ici le lecteur est le **pro**, et sa décision est commerciale, pas existentielle. Je n'applique donc pas l'interdit « ouvrir par le danger » avec la même rigueur : la peur du pro (perdre la main face au client, ne pas savoir répondre) est légitime à nommer. **Ce qui ne change pas d'un public à l'autre** : les marqueurs d'IA, les formules interdites, l'honnêteté de la promesse, la cohérence des chiffres et des sources, l'interdit du classement. C'est là que je tranche fort. Sur le reste, je signale et je laisse au porteur.

---

## FINDING 1 — Tirets cadratins partout (le marqueur d'IA n°1) → À RÉÉCRIRE, bloquant

**Texte** : six occurrences de `—` (em-dash), citations exactes :
- Ligne 7 (metadata) : `"DRIAS, Géorisques, INSEE, ANSES — toutes les données publiques…"`
- Ligne 78 (pitch CGP) : `"…la lecture territoriale à 2050 — ni la dimension sanitaire…"`
- Ligne 81 (bullet CGP) : `"qualité de l'air — facteurs de valorisation…"`
- Ligne 94 (bullet notaire) : `"Recherche par adresse précise — pas seulement par commune"`
- Ligne 186 (bloc tension) : `"…les bases publiques ne font pas — et que vous n'avez pas le temps…"`
- Ligne 274 (scène) : `"Avant — sans futur•e"`
- Ligne 179 (attribution citation) : `"— Un constat partagé par de nombreux professionnels"`

**Ce qui trahit le ton** : violation directe de `editoriale.md` (« Tirets cadratins (—) interdits dans tous les outputs produit : c'est le marqueur le plus reconnaissable des textes générés par IA ») et de `feedback_no_em_dash`. Sur une page qui vend la **crédibilité** à des notaires et CGP, le marqueur d'IA est doublement coûteux : il sape l'argument même de la page (« données publiques officielles, sérieuses »).

**Réécriture proposée** (remplacer chaque `—`) :
- L.7 : `"DRIAS, Géorisques, INSEE, ANSES : toutes les données publiques officielles…"`
- L.78 : `"…la lecture territoriale à 2050, ni la dimension sanitaire qui va peser sur l'attractivité."`
- L.81 : `"qualité de l'air : facteurs de valorisation ou de dépréciation à long terme"`
- L.94 : `"Recherche par adresse précise, pas seulement par commune"`
- L.186 : `"…que les bases publiques ne font pas, et que vous n'avez pas le temps de faire vous-même pour chaque dossier."`
- L.274 : `"Avant, sans futur•e"` (ou supprimer, voir Finding 6)
- L.179 : remplacer le tiret d'attribution par une autre marque, ex. `"Un constat que nous entendons de nombreux professionnels"` sans tiret initial (voir aussi Finding 5 sur la fausse citation).

**Verdict** : À RÉÉCRIRE. C'est l'écart le plus grave de la page et il est purement mécanique à corriger.

---

## FINDING 2 — « dix dimensions » : précision fabriquée et incohérente → À RETOUCHER, demande d'arbitrage

**Texte** : « dix dimensions » répété six fois (L.80, 166→« une lecture lisible », 189, 251, 252, 321), p.ex. L.189 : `"vous avez une lecture sur dix dimensions territoriales"` ; L.321 : `"dix dimensions distinctes, lisibles séparément."`

**Ce qui trahit le ton** : invariant n°5 (ne pas affirmer au-delà de la preuve) et `feedback_positionnement_compatibilite` (« près de 30 critères, jamais un nombre rond qui devient faux »). Le produit public annonce **près de 30 critères** (28 dans `PREFERENCE_KEYS`) répartis en **6 modules**. « Dix dimensions » ne correspond ni à l'un ni à l'autre : c'est un chiffre rond qui sonne juste mais que je ne retrouve nulle part dans la vérité du code. Répété six fois, il devient la colonne vertébrale de l'argument produit, donc une promesse centrale potentiellement fausse.

**Ce qui sonne juste à préserver** : l'idée « dimensions distinctes, lisibles séparément, pas un score moyen » est excellente et fidèle à l'invariant n°2. Ne pas la jeter.

**Cohérence (je ne tranche pas)** : quel est le nombre réel exposé côté Pro ? Si c'est l'inventaire complet, aligner sur « près de 30 critères » ou « six grands volets ». Si la vue Pro agrège en 10 thèmes maison, alors il faut une preuve traçable de ce 10. **À trancher par le porteur**, puis appliquer un chiffre unique et vrai partout.

**Verdict** : À RETOUCHER une fois le chiffre arbitré.

---

## FINDING 3 — Attribution des sources : ANSES et « cadmium » → honnêteté de la promesse, à vérifier

**Texte** :
- L.122 (bullet diagnostiqueur) : `"Qualité de l'air, cadmium, pesticides, sites ICPE : données ANSES, IREP, ATMO par commune"`
- L.316 (principe 01) : `"ANSES pour la qualité sanitaire"`
- L.7 / L.166 / L.183 : ANSES listée parmi les sources socles.

**Ce qui trahit le ton** : invariant n°3 (distinguer les sources, rien affirmé sans source juste). La liste canonique des sources de `editoriale.md` est : IGN, Géorisques, BRGM, ADEME, INSEE, DRIAS/Météo-France, Prométhée/DREAL, GisSol/RMQS, Agences de l'eau, ATMO. **ANSES n'y figure pas** comme fournisseur de données territoriales. Le cadmium et les sols relèvent de **GisSol/RMQS** (cf. mémoire `idee_sante_environnementale`, `exposition_industrielle`), l'air d'**ATMO**, les sites à risque de **Géorisques/IREP**. Attribuer ces données à l'ANSES, c'est exactement le type d'attribution fausse que la doctrine interdit, sur la page qui vend la traçabilité.

**Question de promesse** : le « cadmium dans les sols par commune » est-il réellement au moteur aujourd'hui, ou est-ce une promesse de roadmap (`idee_sante_environnementale` est marquée « à rebrainstormer ») ? Promettre à un diagnostiqueur une donnée non livrée = surpromesse.

**Réécriture proposée** (si les données existent) : `"Qualité de l'air, sols, sites ICPE à proximité : données ATMO, GisSol, IREP et Géorisques par commune"` et L.316 `"GisSol et ATMO pour la qualité environnementale"`. **Cohérence à trancher par le porteur** : ANSES est-elle vraiment une source intégrée ? Le cadmium est-il livré ? Aligner la copy sur la vérité du moteur, pas sur ce qui sonne bien.

**Verdict** : À RÉÉCRIRE après vérification data. Je ne tranche pas la liste exacte, c'est du ressort du Data Curator/porteur.

---

## FINDING 4 — « bien classée sur la canicule » contredit l'invariant n°2 → À RETOUCHER

**Texte** : L.321 : `"Une commune peut être bien classée sur la canicule et mal sur la submersion. C'est plus utile pour vous qu'un score moyen."`

**Ce qui trahit le ton** : la phrase défend l'absence de score… en réintroduisant un **classement** (« bien classée / mal classée »), ce que l'invariant n°2 interdit (« on révèle des compromis lisibles, jamais un classement absolu du lieu »). Contradiction interne : le paragraphe s'appelle « Aucun score synthétique opaque » et reclasse dans la phrase suivante.

**Ce qui sonne juste** : l'opposition canicule favorable / submersion défavorable est le bon exemple de compromis. C'est la formulation qui cloche, pas l'idée.

**Réécriture proposée** : `"Une commune peut être épargnée par la canicule et exposée à la submersion. Vous voyez les deux séparément, pas une moyenne qui efface l'écart."`

**Verdict** : À RETOUCHER.

---

## FINDING 5 — La fausse citation anonyme → « ce texte ne devrait pas exister »

**Texte** : L.176-179 :
> `"Nos clients nous posent des questions sur le risque climatique de leurs actifs immobiliers. Mais nous n'avons pas les outils pour leur répondre rapidement et sérieusement."`
> `— Un constat partagé par de nombreux professionnels`

**Ce qui trahit le ton** : une citation entre guillemets, en gros corps italique de citation, attribuée à personne (« un constat partagé par de nombreux professionnels »). C'est un **témoignage fabriqué** : la forme dit « quelqu'un a dit ça », l'attribution avoue que non. Sur une page dont tout l'argument est l'honnêteté et la traçabilité, mettre en scène un faux verbatim est l'optimisme/la preuve manufacturée que ma doctrine refuse (pilier « Données, pas opinions » ; invariant n°3). Un pro averti (notaire, CGP) repère immédiatement le procédé marketing.

**Correction** : soit une vraie citation sourcée (nom, cabinet, ou une étude France Assureurs/notariat citable), soit la **suppression** du dispositif guillemets-attribution. Le constat lui-même peut rester, mais en voix directe assumée par futur•e, sans déguisement en témoignage : `"Les questions sur le risque climatique des actifs immobiliers arrivent dans vos rendez-vous. Les outils pour y répondre vite et sérieusement, non."` Ça dit la même chose, sans faux témoin.

**Verdict** : À SUPPRIMER sous sa forme actuelle (le faux verbatim), à remplacer par une voix directe.

---

## FINDING 6 — La scène « Avant / Après » → À RETOUCHER (vente par la peur de la perte)

**Texte** : L.276-278, colonne « Avant » :
- `"Le client repart avec plus de questions que de réponses. Il consultera Google. Vous perdez la main."`
- `"Le client revient avec des informations contradictoires lues en ligne. Vous passez 30 minutes à les démêler."`

**Ce qui sonne juste** : le contraste avant/après est concret et parle de la situation du pro, pas du produit. C'est globalement dans la bonne intention B2B. La colonne « Après » est honnête (« Sources citées », « Vous expliquez les données ensemble »).

**Ce qui trahit le ton** : « Vous perdez la main » vend par la peur de la perte. Pour le résident, ce serait disqualifiant (invariant n°6). Pour un pro, le registre est plus admis, mais futur•e doit rester du côté de l'intelligence, pas de l'angoisse commerciale appuyée. C'est une retouche de dosage, pas une faute dure.

**Réécriture proposée** (L.278) : `"Le client repart avec plus de questions que de réponses, et il ira chercher ailleurs."` (retirer « Vous perdez la main », qui en fait trop).

**Honnêteté à vérifier** : « projection 2050 » (L.291) et « submersion, qualité air, vulnérabilité économique » affichés « en 10 s » avec « Sources citées » : conforme tant que la fiche Pro livre réellement ces axes pour Saint-Jean-de-Luz. À confirmer côté produit.

**Verdict** : À RETOUCHER (léger).

---

## FINDING 7 — « Préparez-vous à l'évolution réglementaire qui arrive » → À RÉÉCRIRE

**Texte** : L.125 (bullet diagnostiqueur) : `"Préparez-vous à l'évolution réglementaire qui arrive"`

**Ce qui trahit le ton** : affirme un futur réglementaire comme **certain** (« qui arrive ») sans source ni preuve. C'est un futur affirmé au lieu de projeté (pilier « Respect de l'intelligence du lecteur » : « les projections indiquent », pas « il fera »), doublé d'un ressort FUD. Si une évolution réglementaire précise existe (laquelle ? quelle échéance ?), il faut la nommer et la sourcer ; sinon, supprimer.

**Réécriture proposée** : si une réforme identifiée existe, la nommer (`"Anticipez l'extension de l'information environnementale à l'acte (réforme X)"`). Sinon : **supprimer le bullet**.

**Verdict** : À RÉÉCRIRE ou À SUPPRIMER selon existence d'une preuve.

---

## FINDING 8 — La section « Trois principes éditoriaux » → À RETOUCHER (la page se contemple)

**Texte** : L.307-326, titre `"Trois principes éditoriaux / Ce qui rend cet outil professionnellement utilisable."` ; L.321 `"Ce sont des artefacts éditoriaux qui simplifient à outrance."`

**Ce qui sonne juste** : chaque principe **referme sur le bénéfice du lecteur** (« Vous ne transmettez pas une opinion », « C'est plus utile pour vous », « la seule voix qu'un professionnel peut transmettre sans s'exposer à la contradiction »). C'est ce qui sauve la section : elle décrit le produit mais pour ce qu'il change pour le pro. À préserver.

**Ce qui trahit le ton** : le cadre lexical (« principes éditoriaux », « artefacts éditoriaux », « voix éditoriale ») parle de **futur•e à futur•e** — jargon interne de ma propre doctrine exposé au client (cf. `editoriale.md`, « la page s'adresse au lecteur, pas à elle-même »). Un CGP ne pense pas en « artefacts éditoriaux ». Le fond est bon, l'habillage parle du produit.

**Réécriture proposée** : retitrer `"Ce que vous pouvez transmettre sans risque"` ; remplacer « artefacts éditoriaux qui simplifient à outrance » par `"des raccourcis qui écrasent la nuance"`. Garder les trois corps tels quels.

**Verdict** : À RETOUCHER (habillage), le fond reste.

---

## FINDING 9 — « futur•e adapte son interface, son export et ses alertes » → À RETOUCHER

**Texte** : L.203 : `"futur•e adapte son interface, son export et ses alertes selon votre métier."`

**Ce qui trahit le ton** : phrase qui parle de l'**architecture du produit** (interface/export/alertes) plutôt que de ce que ça change pour le lecteur. Le titre juste au-dessus (L.199-200, « Pas le même besoin, pas le même livrable ») est lui parfait, centré lecteur.

**Réécriture proposée** : `"À chaque métier sa lecture, son livrable, ses alertes."` (garde l'info, retire la contemplation du produit).

**Verdict** : À RETOUCHER (léger).

---

## Ce qui sonne juste dans l'ensemble (à préserver explicitement)

- Les **quatre pitchs métier** (L.78, 92, 106, 120) ouvrent par la situation du pro (« Vos clients vous demandent… », « Votre devoir d'information s'étend », « Vos clients ne comprennent pas pourquoi leur prime augmente »). C'est exactement la question-mère respectée : le lecteur se sent compris avant qu'on parle du produit. Très bon.
- L.106 : « transforme une conversation défensive en conversation éducative » : juste, parle du pro.
- Le bloc « WHY NOW » (L.250-252) **source chaque chiffre** (France Assureurs 2024, INSEE/DRIAS/Géorisques, « Mesuré en conditions réelles »). Conforme à l'invariant n°3, à condition que le « 10 s » soit réellement mesuré (l'affirmer « mesuré » crée une obligation de preuve).
- `ProForm.tsx` : sobre, honnête (« sans engagement », « ne revend jamais ses listes », RGPD, pas de point d'exclamation, vouvoiement constant). Rien à redire côté voix. PASS sur le formulaire.

---

## Hors de mon mandat (renvois)

- **Émojis comme icônes métier** (📊 ⚖️ 🛡️ 🔍, L.74-119) : marqueur générique qui jure avec une page qui vend le sérieux à des notaires. C'est un choix **visuel** → **Design Critic**. Je le signale, je ne le tranche pas.
- Animations, orbes, layout : hors mandat.

---

## Verdict global

**À RÉÉCRIRE** avant publication. La page a une **bonne ossature de voix** (les pitchs parlent au pro, pas au produit), mais elle est plombée par trois fautes dures qui contredisent l'argument même qu'elle vend (la rigueur) :

1. **Tirets cadratins partout** (Finding 1) : bloquant, mécanique.
2. **Fausse citation anonyme** (Finding 5) : preuve manufacturée, à supprimer.
3. **« dix dimensions » non prouvé et incohérent** + **sources ANSES/cadmium douteuses** (Findings 2 et 3) : promesses au-delà de la preuve, à arbitrer avec le porteur/Data avant correction.

Le reste (Findings 4, 6, 7, 8, 9) est de la retouche.

---

## Cohérence (posée au porteur, je ne tranche pas)

1. **Chiffre de couverture** : « dix dimensions » vs « près de 30 critères » / « 6 modules » du site public. Quel est le nombre vrai exposé côté Pro ?
2. **Sources réelles** : ANSES est-elle une source intégrée ? Le « cadmium par commune » est-il livré ou roadmap ?
3. **« évolution réglementaire qui arrive »** : réforme identifiée et sourçable, ou FUD à retirer ?

## Mise à jour de la doctrine (prête à écrire par Claude principal)

Aucune nouvelle règle de fond : tout ce que cette page viole est **déjà** dans `editoriale.md` et les invariants. Une seule **précision** mériterait d'être ajoutée à `editoriale.md`, sous « Ce que futur•e ne fait pas » :

> **Pas de témoignage fabriqué.** Une citation entre guillemets exige un auteur réel et nommable. Une citation attribuée à « un professionnel », « un utilisateur » ou « beaucoup d'entre vous » est une preuve manufacturée : on la supprime ou on la passe en voix directe assumée. Vaut aussi pour les pages B2B.

Et un rappel de portée, en tête de la doctrine : **les règles de voix (tirets cadratins, formules interdites, honnêteté de la promesse, sources) s'appliquent aussi aux pages B2B**, même si l'interdit « ne pas ouvrir par le danger » s'y assouplit (le lecteur n'est plus le résident mais le professionnel).

Fichiers concernés : `src/app/(public)/professionnels/page.tsx`, `src/components/ProForm.tsx`, `docs/vault/doctrine/editoriale.md`.
