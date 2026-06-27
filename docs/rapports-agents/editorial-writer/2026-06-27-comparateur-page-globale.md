# Audit éditorial — Comparateur « mode choix » (page de résultat)

Date : 2026-06-27 · Branche `feat/comparateur-mode-choix` · État jugé : `main` (copy en place)
Agent : Editorial Writer (contre-pouvoir de la voix)
Terrain lu : `docs/vault/doctrine/editoriale.md` + code réel des fichiers ci-dessous.
Fichiers ouverts et cités : `src/app/(public)/comparateur/page.tsx`,
`ModeChoixSynthese.tsx`, `ThemeExplorer.tsx`, `src/lib/comparateur-vie.ts`,
`src/app/api/comparateur-vie/synthesize-choix/route.ts`.

Question-mère appliquée : chaque texte fait-il sentir que futur•e comprend que le lecteur
HÉSITE et doit TRANCHER, avant de parler d'elle-même, sans promettre au-delà de la preuve ?

Verdict d'ensemble : la page est très majoritairement DANS LA VOIX. Le hero, le « En un coup
d'œil », « Là où ça se joue » et l'ancre de valeur du paywall sont justes et créent la
confiance. Deux points méritent une retouche (jamais une réécriture lourde) : l'honnêteté de
la phrase d'arbitrage dans le cas TRIO, et deux fuites de langage-produit dans le paywall
(« palier », « référentiel »). Aucun texte « ne devrait pas exister ».

---

## 1. Phrase d'arbitrage (le point chaud)

**Texte** (généré, `comparateur-vie.ts` ~1384, rendu `ModeChoixSynthese.tsx` l.102-106) :
« Si les risques naturels comptent d'abord pour vous, Lorient prend l'avantage ; si vous
regardez surtout la mobilité, Rennes reprend la main. »
Moment : tête de la synthèse, avant le narratif IA. Émotion visée : donner la lecture du choix
sans décider à la place du lecteur.

**Où ça touche juste.** La forme conditionnelle est le bon geste, et il est réussi : le
critère reste explicitement au lecteur (« si … pour vous »), aucune commune n'est couronnée,
les deux pôles sont symétriques. Ce n'est NI condescendant NI prescriptif : ça ne dit pas quoi
choisir, ça rend lisible *sur quoi* se joue le choix. La variation des deux amorces (« comptent
d'abord pour vous » / « regardez surtout ») évite le tempo jumeau. C'est la phrase qui fait le
plus sentir que futur•e a compris l'hésitation. À ne pas casser.

**Ce qui mérite une retouche (deux points, par ordre d'importance).**

a) **Honnêteté en cas de TRIO.** Le code ne prend que `ordered[0]` et `ordered[1]`
(`inseeA`/`inseeB`) : quand le lecteur a nommé TROIS communes et que la troisième mène elle
aussi un thème, elle disparaît de la phrase la plus visible de la page. Le titre réduit alors
un choix à trois en opposition binaire. Le narratif et les cartes rattrapent les trois, mais
la *première* lecture ment par omission. C'est l'écart le plus sérieux (invariant n°5 : ne pas
affirmer au-delà de ce que montre la situation réelle — ici, trois options, pas deux).
→ Recommandation : quand `ordered.length >= 3` et qu'un 3e thème distinct existe, ajouter un
troisième pôle, ou basculer sur une formule qui n'oppose pas frontalement deux noms. Modèles
prêts :
  - 3 pôles : « Si les risques comptent d'abord, Lorient prend l'avantage ; si c'est la
    mobilité, Rennes ; si c'est le cadre de vie, Brest. »
  - repli neutre trio (si les leads ne sont pas nets) : « Chacune mène sur un terrain
    différent : à vous de dire lequel pèse le plus. »

b) **Monotonie du gabarit à l'échelle.** Le couple de verbes est figé : *toute* comparaison à
deux pôles produira « … prend l'avantage ; … reprend la main. » Sur une page isolée c'est
invisible ; pour un lecteur qui compare plusieurs trios, le moule se voit. « reprend la main »
est par ailleurs un idiome de jeu de cartes (léger registre de compétition) là où le reste de
la voix parle de *fit*, pas de match. Ce n'est pas un couronnement, donc pas bloquant.
→ Recommandation : tirer le second verbe d'un petit pool pour casser le moule, p. ex.
« Rennes passe devant » / « c'est Rennes » / « Rennes l'emporte sur ce terrain ». Garde le
premier « prend l'avantage » (sobre, juste).

**Verdict arbitrage : DANS LA VOIX, À RETOUCHER** (le (a) trio d'abord, le (b) cosmétique).

---

## 2. Paywall (second point demandé)

**Texte** (`page.tsx` l.190-201) :
P1 : « Vous voyez où chacune penche. Ce qui reste, c'est de savoir laquelle correspond à votre
façon d'habiter : le Pack reprend les sept thèmes critère par critère, le palier de chaque
commune et ce qui les départage vraiment, là où ça décide votre choix. »
P2 : « 39 €. Une décision de lieu de vie pèse des années : c'est peu pour la trancher les yeux
ouverts. Accès immédiat, rapport interactif que vous gardez. »
CTA : « Voir la comparaison complète · 39 € ».

**Où ça touche juste.** « Vous voyez où chacune penche » (continuité, reader-facing) et
« savoir laquelle correspond à votre façon d'habiter » sont un vrai gain sur l'ancien
« paiement unique, sans engagement » : on est passé de l'argument-produit à l'enjeu du lecteur.
« Une décision de lieu de vie pèse des années : c'est peu pour la trancher les yeux ouverts »
est un excellent ancrage de valeur, et « trancher les yeux ouverts » fait écho à « tranchez
sans deviner » (signature cohérente sur toute la page). « là où ça décide votre choix » est
juste.

**Ce qui trahit le ton.**
- **« le palier de chaque commune » = fuite de jargon interne.** Le prompt IA bannit lui-même
  « palier » comme terme technique ; il ne devrait pas surgir dans la phrase la plus
  commerciale de la page, où le lecteur n'a aucun contexte pour le décoder. Règle violée :
  glossaire des termes à traduire + « la page s'adresse au lecteur, pas à elle-même ».
- **P1 décrit la structure du produit** (« reprend les sept thèmes critère par critère, le
  palier de chaque commune ») : on bascule à mi-phrase de l'enjeu du lecteur vers
  l'architecture de la livraison. Tolérable sur un paywall (il faut dire ce qu'on reçoit),
  mais à alléger pour ne pas faire du lecteur le spectateur du format.
- **P2 « rapport interactif que vous gardez »** : langage de feature. Justifié (lève
  l'objection « est-ce que je garde l'accès ? »), à garder, mais c'est le fragment le plus
  produit de la page. Ne pas en ajouter.

**Réécriture proposée (P1, deux options).**
- Option A (proche, « palier » traduit) : « Vous voyez où chacune penche. Ce qui reste, c'est
  de voir laquelle colle à votre façon d'habiter : le Pack détaille les sept thèmes critère par
  critère, situe chaque commune et montre ce qui les départage vraiment, là où ça décide votre
  choix. » (« situe chaque commune » remplace « le palier de chaque commune ».)
- Option B (plus reader-centré, moins d'inventaire) : « Vous voyez où chacune penche. Reste à
  voir laquelle colle à votre façon d'habiter : le Pack vous donne les sept thèmes critère par
  critère et ce qui les départage vraiment, là où ça décide. »

Note : « savoir laquelle correspond » est à la limite (promesse d'une réponse « laquelle »).
Le « savoir/voir » reste au lecteur et c'est un *fit*, pas « la meilleure » : défendable. J'ai
remplacé par « voir laquelle colle » pour rester côté lecteur sans rien sur-promettre. Arbitrage
à toi : si tu veux zéro ambiguïté de promesse, garde « voir laquelle colle » ; si tu assumes la
promesse de clarté, « savoir laquelle correspond » tient.

P2 : garder tel quel. Juste, dans la voix, honnête. (TVA : page micro-entreprise, vérifier
qu'aucune mention « TVA incluse » ne traîne ailleurs dans le tunnel — non vu ici.)

**Verdict paywall : À RETOUCHER** (traduire « palier », alléger l'inventaire de P1 ; P2 intact).

---

## 3. Synthèse de thème sans gagnant

**Texte** (`comparateur-vie.ts` l.1305) : « Sur ce thème, les deux territoires se ressemblent :
il ne les départage pas. »

**Où ça touche juste.** Conclure au lieu de décrire est exactement la doctrine (« le silence
plus honnête que l'optimisme manufacturé ») : on dit franchement que le thème ne pèsera pas
dans le choix. Bon réflexe.

**Ce qui accroche.** L'anaphore « il » est bancale : son antécédent grammatical n'est pas
« ce thème » (qui est ici complément de lieu « Sur ce thème »), donc « il » flotte une demi-
seconde. Léger, mais ça sonne mécanique.
→ Réécriture : « Sur ce thème, les deux territoires se ressemblent : rien ne les départage
ici. » ou « Sur ce thème, les deux territoires se ressemblent : il ne fera pas la différence. »

**Verdict : DANS LA VOIX, retouche mineure de l'anaphore.**

---

## 4. Balayage du reste (rien à réécrire, sauf un mot)

- **Hero plein** (`page.tsx` l.61-65) : « Vous hésitez entre plusieurs communes ? Comparez-les,
  tranchez sans deviner. » + sous-titre « … ce que chacune vous fait gagner ou perdre. Aucun
  classement, aucun score. » → DANS LA VOIX, c'est le sommet de la page : il nomme l'hésitation
  du lecteur et promet la retenue (pas de score). Ne pas toucher.
- **Hero compact** (l.48-49) : cohérent, concis. OK.
- **« En un coup d'œil »**, placeholder **« futur•e regarde vos communes… »** : justes, chauds,
  dans la voix.
- **« Là où ça se joue »**, **« Dévoilez le thème qui compte pour vous »** : reader-facing,
  bons. OK.
- **Footer explorateur** (`ThemeExplorer.tsx` l.99-104) : instructif et un peu produit (« les
  autres se détaillent dans le Pack ») mais c'est un helper d'UI ; tolérable, pas prioritaire.
- **`fallbackSynthese`** (`ModeChoixSynthese.tsx` l.16-19) : « Aucune ne réunit tout : à vous de
  voir quel compromis vous ressemble le plus. » → dans la voix, honnête, le lecteur décide. OK.
- **État d'erreur** (`page.tsx` l.108-111) : « … situer ces communes dans notre référentiel. »
  → « référentiel » est du jargon interne. Remplacer par « dans nos données ». Reste (conseil
  Paris/Lyon/Marseille) : honnête et utile, à garder.
- **Prompt IA `synthesize-choix`** : remarquable garde-fou (interdit de couronner, ne prête
  aucun projet, ne récite pas les thèmes, interdits de forme alignés sur la doctrine). Rien à
  redire côté consigne ; je ne juge pas les sorties réelles (non capturées ici).

---

## Rythme et longueur

La page ne fatigue pas : labels mono courts qui scandent, phrases-enjeu brèves, un seul bloc
long (P1 paywall) qui gagnerait à l'allègement proposé. Pas d'idée répétée d'un bloc à l'autre
(« gagner ou perdre » revient hero plein / hero compact, mais ce sont deux états alternatifs,
jamais affichés ensemble : non redondant). Risque de fatigue UNIQUEMENT à l'échelle (gabarit
d'arbitrage identique d'un trio à l'autre, cf. §1b), pas sur une page seule.

## Honnêteté de la promesse

- Point dur : §1a (titre binaire pour un choix ternaire). À corriger en priorité.
- « savoir laquelle correspond » (paywall) : promesse de clarté à la limite, défendable ;
  arbitrage posé, non tranché.
- Pas de futur asséné, pas de chiffre inventé, pas d'optimisme fabriqué détectés dans la copy
  statique. Le « 39 € » et l'ancre de valeur sont honnêtes.

## Cohérence (à poser à l'humain, non tranché)

- Registre « prend l'avantage / reprend la main / passe devant » : vocabulaire de compétition
  léger, en tension douce avec la voix « fit, pas match ». Acceptable car conditionnel et
  symétrique ; à toi de dire si tu veux l'assumer comme registre, ou le neutraliser.

## Mise à jour de la doctrine (prête à écrire)

Deux règles stabilisées par cet audit, candidates à `editoriale.md` :
1. « **Pas de jargon de palier/score/référentiel dans la copy commerciale.** Un terme interne
   (palier, percentile, référentiel) ne doit jamais apparaître dans un paywall ou un hero :
   traduire (palier → "situe / où se situe", référentiel → "nos données"). »
2. « **Une phrase d'arbitrage doit couvrir toutes les options nommées.** Si le lecteur a nommé
   N communes, le titre de synthèse n'en oppose pas N−1 : il nomme les N pôles, ou adopte une
   formule neutre qui ne tranche pas par omission (invariant n°5). »

## Limites de mon regard (ce run)

- Je juge la copy STATIQUE et les phrases DÉTERMINISTES ; je n'ai PAS capturé les sorties
  réelles du narratif IA streamé (le prompt est solide, mais une génération peut déraper sur un
  trio précis : non vérifié ici).
- Je n'ai pas le rendu visuel : je ne mesure pas l'effet à l'écran du rythme, ni si le titre
  d'arbitrage domine bien le narratif (question Design Critic).
- Je ne vois ni la conversion ni l'A/B : « savoir laquelle correspond » vs « voir laquelle
  colle » est un arbitrage de voix, pas une preuve d'efficacité.
- Je n'ai pas rejoué le cas TRIO à 3 leads distincts en données réelles : je déduis l'omission
  de la lecture du code (`ordered[0]`/`ordered[1]`), pas d'une capture d'écran.
