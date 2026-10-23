# FUT-127 · Correctifs P0 : l'inondation lue à l'adresse, sans fausse absence ni fausse réassurance

Branche `bonjourfuturee/fut-127-rendre-les-controles-georisques-complementaires-a-lanalyse`, depuis `main` 3af53c3c.
Audit d'origine : branche `docs/fut-127-audit-risques-naturels`, `docs/audits/2026-10-22-fut127-risques-naturels.md`.
Arbitrages du porteur du 22/10/2026 appliqués tels quels (option A, paliers, correction des pages existantes).

## Ce qui change pour le lecteur

| Situation | Avant (`engine-6`) | Après (`engine-7`) |
|---|---|---|
| Charron, Dossier Adresse, acheteur, zone rouge Rs2 « zones submersibles » | « Bonne correspondance » ; module : « Aucun plan de prévention des inondations ne réglemente ce point » | « Correspondance à nuancer · Le principal point à contrôler à Charron : le zonage inondation de l'adresse » ; carte « Zone d'interdiction » qui nomme la zone, le plan, sa date d'approbation, le phénomène, le régime, et un geste ciblé : « Demandez l'état des risques et vérifiez qu'il indique la zone Rs2 » |
| Charron, inondation confirmée comme condition | « Ouverte · plutôt favorable » | « plutôt défavorable » à l'adresse ; « ouverte », sans sens, au grain communal |
| La Rochelle, dossier communal | « L'exposition de la commune à l'inondation ressort élevée. Consultez l'état des risques (Géorisques) » | « À La Rochelle, un plan de prévention des risques littoraux, « PPR La Rochelle », approuvé le 26 février 2019, réglemente la submersion marine », l'historique CatNat en contexte, ce que ces faits ne disent pas, et le geste qui lève l'inconnue |
| La Rochelle, Quai Duperré (zone Os1 d'un plan qui réglemente aussi le recul du trait de côte) | Renvoi Géorisques en premier contrôle ; module : « aucun plan des inondations » | Zone dite, phénomène « à confirmer » (la donnée ne dit pas lequel fonde Os1), aucune conclusion favorable, geste ciblé vers l'état des risques |
| Point et parcelle en désaccord (Châtelaillon Rs3 / Os ; Minimes Bs1 / Bs2 sur parcelle de repli) | La parcelle seule, sans le dire | « futur•e ne tranche pas entre les deux lectures », état prudent, non orientant |
| Hors zone (rue du Palais) | Rien, ou le renvoi communal | « Cette adresse n'est dans aucune zone réglementée pour l'inondation », avec « Ce n'est pas une garantie » ; examiné **neutre**, jamais favorable |
| Géorisques muet | Renvoi communal | « Le zonage de cette adresse n'a pas pu être lu », faits communaux, et ici seulement le renvoi vers l'état des risques et « Mes risques » |
| Analyse figée avant la correction | Inchangée, sans contexte | Inchangée, précédée d'un avertissement visible (« version antérieure de la lecture des inondations ») dans les deux présentations |

## Les quatre correctifs

- **P0-A, classification des plans.** `pprn-zonage.ts` : aléas et date d'approbation lus dans le détail du plan (`/api/v2/gaspar/pprn/{idGaspar}`, appel mis en cache, panne = `null`), `natureInondation` (inondation / autre / **inconnue**), `zoneLieeALInondation`. `inondation-lecture.ts` : état `zonage_alea_inconnu`, plus jamais « aucun plan des inondations » sans aléas connus. Bloc réglementaire : risque concerné, approbation, vrai grain (point ou parcelle).
- **P0-B, la règle lit l'adresse.** `zonage-inondation.ts` (pur) confronte point et parcelle (rattachement par repli cadastral exposé par `cadastre.ts`) ; deux règles dans `materiality-rules.ts` : `territoire.inondation-exposition` (orientante : zone liée explicitement à l'inondation, rattachement fiable ; `decision_critical` pour les régimes d'interdiction, `structuring` pour les prescriptions) et `territoire.inondation-lecture` (non orientante : zone à confirmer, aléa inconnu, hors zone, commune). Aucune ne rend `satisfied`. La carte « plan applicable » se tait quand la carte inondation porte le même plan, et nomme sinon zone et régime.
- **P0-C, plus de rang CatNat.** Carte communale déclenchée par un plan de prévention des inondations approuvé, appliqué par anticipation ou prescrit (`data/gaspar-pprn-inondation.json`, extrait de l'export GASPAR du 05/10/2026 par `scripts/gaspar/extraire-pprn-inondation.mts` : 12 042 communes, 13 748 plans) ; états administratifs distingués ; CatNat cité comme historique. Source « submersion marine exclue » retirée (fausse).
- **P0-D, la portée.** « Cette lecture prépare celle de l'état des risques sans la remplacer : c'est ce document, remis par le vendeur ou le bailleur, qui fait foi pour le bien. » Une seule source (`PORTEE_ETAT_DES_RISQUES`), sur les cartes d'adresse et dans le bloc réglementaire du module.
- **Versionnement.** `ENGINE_VERSION` = `engine-7`. Aucun artefact réécrit ; contextualisation reconnue au contenu (`inondation-anterieure.ts`, composant `AvertissementInondationAnterieure`).

## Preuves

- `npm test` : **2 985 tests, 0 échec** après la passe du 23/10. Avec la PR #82 (FUT-126) fusionnée à blanc : 2 997 tests, 0 échec, aucun conflit. `npx tsc --noEmit` et `eslint` sur les fichiers touchés : propres.
- `src/lib/fut127-inondation-adresse.test.ts` (22 tests) : la vraie chaîne sur l'index réel, la table GASPAR et les relevés Géorisques réels figés dans `src/lib/__fixtures__/fut127/`. Cas couverts : Charron ; La Rochelle (commune, Os1, Minimes, rue du Palais) ; Châtelaillon ; Géorisques muet ; aléas non lus ; chaque modèle de plan ; quatre postures ; poids 1 ; priorité non déclarée ; liste « à vérifier » du module ; parité classique / Relevé ; bloc réglementaire rendu ; analyses figées relues à l'identique et contextualisées. Les textes des trois niveaux y sont figés.
- `src/lib/fut127-georisques-appels.test.ts` (5 tests) : le nombre d'appels et le chronométrage, sur le vrai `georisques.ts` (voir « Performances »).
- Captures : `captures/`, rendues par `/dev/fut127` (relevés réels, composants de production, aucune donnée client, `DOSSIER_NARRATIVE=false`, aucune clé). Script : `scripts/fut127/capturer.mjs` (`--deplier` ouvre « Données et limites »), puis conversion en WebP. Aucun débordement horizontal à 1440, 390 et 360 px.

## Ce qui n'est pas fait (hors P0, conformément à l'arbitrage)

- Le **comparateur** garde son score `faible_risque_inondation = 100 - rang` et la phrase « Peu d'inondations recensées à ce jour » sous le rang 66 (`comparateur-vie.ts:2256`). C'est un classement : non modifié ici, à arbitrer.
- La carte Territoire « Inondation fluviale » et la synthèse déterministe (« périmètres… recensés ») : P1-3 de l'audit.
- Payload de la synthèse Logement (champs morts), commune multiple en `latlon`, PPRT au point, statuts du rapport « Mes risques » : P1 et P2, non lancés.
- Aucun appel Anthropic, aucune donnée utilisateur, aucune fusion, aucun déploiement.

## À surveiller en recette

- Le détail des plans ajoute un appel Géorisques par plan distinct (mis en cache par process) à la construction d'un rapport Logement et d'un Dossier Adresse.
- `data/gaspar-pprn-inondation.json` (2,7 Mo) est ajouté à la trace des routes `/rapport`, `/rapport/quartier`, `/api/dossier/actualiser`, `/api/stripe/webhook`. Fichier absent = règle `uncertain`, jamais « aucun plan ».

---

# Passe de revue du 23/10/2026 : des textes plus simples, le verdict, les performances

Demande du porteur : rester scientifiquement rigoureux, et devenir immédiatement compréhensible pour quelqu'un qui envisage d'acheter un logement. Aucun fait, seuil ou palier n'a changé. Les textes, eux, ont été réécrits.

## 1. Trois niveaux de lecture

Chaque carte inondation se lit désormais ainsi :

1. **Constat** (face, première phrase) : ce qu'est l'adresse ou la commune, en mots courants, sans code de zone, sans sigle, sans le mot « régime ».
2. **Conséquence pour le projet** (face, phrase suivante) : ce que cela change pour la priorité déclarée.
3. **Preuves et limites** (« Données et limites », champ `signalConvention`, rendu par les deux présentations) : nom officiel du plan, zone, date d'approbation, régime officiel, nom local de la zone, historique des reconnaissances avec ce qu'il ne dit pas, portée de la lecture face à l'état des risques.

La face garde une seule ligne de limite, celle qui empêche le contresens, et les pastilles de preuve (« zone Rs2 · PPR Charron », « 3 reconnaissances… »). Rien n'a disparu : chaque élément de l'ancienne carte est au niveau 3, et les tests le vérifient.

### Avant / après des principales phrases

| Où | Avant | Après |
|---|---|---|
| Verdict, Charron | « Le principal point à contrôler à Charron : le zonage inondation de l'adresse. » | « Le principal point à contrôler à Charron : la zone réglementée pour l'inondation où se trouve l'adresse. » |
| Carte, zone établie (Charron) | « Cette adresse est en zone Rs2 du plan de prévention « PPR Charron », approuvé le 10 août 2021, qui réglemente la submersion marine et le recul du trait de côte. Le plan la décrit ainsi : « … ». Le plan range cette zone sous un régime d'interdiction : … À l'échelle de la commune, 3 reconnaissances… » | « Cette adresse est dans une zone réglementée pour la submersion marine. Certaines constructions et certains travaux y sont interdits. Cela va à l'encontre de votre priorité : un faible risque d'inondation. » Le reste figure au niveau 3, mot pour mot. |
| Limite, zone établie | « Ce régime encadre les projets de construction et de travaux ; il ne dit pas que le logement existant ne peut pas être habité. Le zonage et les reconnaissances ne disent pas si… Cette lecture prépare celle de l'état des risques… » | « Le plan encadre les constructions et les travaux : il ne rend pas le logement existant inhabitable, mais peut lui imposer des aménagements. Il ne dit pas si ce logement a déjà été inondé. » La portée descend au niveau 3. |
| Divergence point / parcelle (Châtelaillon) | « Le point géocodé de cette adresse tombe en zone Rs3, la parcelle rattachée en zone Os, au regard du plan… futur•e ne tranche pas entre les deux lectures. » | « Les données ne désignent pas la même zone pour cette adresse, et l'une des deux interdit certaines constructions et certains travaux. Tant que la zone du bien n'est pas confirmée, rien ne permet de dire que cette adresse répond à votre priorité : un faible risque d'inondation. » L'explication point / parcelle est au niveau 3. |
| Phénomène non identifié (Quai Duperré) | « Cette adresse est en zone Os1 du plan… La donnée reçue ne dit pas lequel de ces phénomènes fonde cette zone. Le plan range cette zone sous un régime d'interdiction… » | « Cette adresse est dans une zone d'un plan qui réglemente la submersion marine et le recul du trait de côte, sans que la donnée dise lequel de ces risques la concerne. Certaines constructions et certains travaux y sont interdits. Tant que ce point n'est pas éclairci, rien ne permet de dire… » |
| Hors zone (rue du Palais) | « Le zonage lu à la parcelle de cette adresse n'est dans aucune zone d'un plan de prévention des inondations. La commune est couverte… » | « Cette adresse n'est dans aucune zone réglementée pour l'inondation. » Limite : « Ce n'est pas une garantie : un plan ne couvre que les phénomènes qu'il a étudiés, et ne dit pas si ce logement a déjà été inondé. » |
| Commune (La Rochelle) | « À La Rochelle, un plan de prévention des risques littoraux, « PPR La Rochelle », approuvé le 26 février 2019, réglemente la submersion marine. À l'échelle de la commune, 7 reconnaissances… Ces faits portent sur la commune : ils ne disent pas si une adresse… » | « À La Rochelle, un plan de prévention réglemente certaines zones pour la submersion marine. Selon l'adresse, un bien peut se trouver dans l'une de ces zones, ou en dehors. » Limite : « Ces faits portent sur la commune : ils ne disent rien d'une adresse en particulier. » |
| Plan seulement prescrit | « …est en cours d'élaboration depuis le … pour … : il n'a pas encore de zonage opposable. » | « À X, un plan de prévention est en préparation pour … : ses zones ne sont pas encore fixées. Un bien de la commune pourra être concerné une fois le plan approuvé. » |
| Géorisques muet | « Le zonage de cette adresse n'a pas pu être lu : le service de l'État n'a pas répondu lors de la préparation du dossier. » | « La zone de cette adresse n'a pas pu être lue : le service de l'État n'a pas répondu. … Avant de vous engager, vérifiez dans quelle zone se trouve le bien. » |
| Statuts | « Phénomène à confirmer », « Hors zone d'un plan inondation », « Commune couverte par un plan », « Plan en cours d'élaboration », « Zone de prescriptions », « Zone à régime particulier » | « Risque concerné à confirmer », « Hors zone inondation réglementée », « Plan inondation sur la commune », « Plan inondation en préparation », « Constructible sous conditions », « Zone à règles particulières ». « Zone d'interdiction » est conservé, et la phrase qui suit dit ce qui est interdit. |
| Geste (achat, zone établie) | « Demandez-le dès la première visite. Une zone différente de celle lue ici appelle une explication. Demandez aussi quels sinistres indemnisés… » | « Le vendeur doit le remettre dès la première visite. S'il indique une autre zone, demandez pourquoi. Demandez aussi si le logement a déjà été inondé, et ce que le règlement du plan impose aux logements existants en zone Rs2. » |
| Module Logement, « Ce que disent les sources » | « Un plan de prévention des inondations réglemente ce point : PPR Charron (submersion marine). » | « Cette adresse est dans une zone réglementée pour la submersion marine (PPR Charron). » |
| Analyse figée (avertissement) | « Cette analyse a été produite avec une version antérieure de la lecture des inondations. Elle qualifiait l'exposition… » (3 phrases longues) | « Cette analyse date d'une version antérieure de futur•e : sa lecture des inondations n'est plus celle que nous appliquons. » Suivent le pourquoi, sans sigle, puis « L'analyse ci-dessous reste celle qui vous a été remise. » |

## 2. Le verdict de Charron

**Ce que fait le moteur.** La zone d'interdiction pèse `decision_critical`. Le registre la classe « réserve » au palier critique. Le verdict la **nomme dans son titre** et la carte passe en tête des contrôles. Le moteur fonctionne donc. Le défaut était éditorial : le titre disait « le zonage inondation de l'adresse » sans dire qu'une zone réglementée avait été lue, et la carte ne disait pas que cela va contre la priorité. Les deux sont corrigés.

**Ce qui reste faible, et ce que je soumets à arbitrage, sans l'avoir appliqué :**
- **L'étiquette.** « Correspondance à nuancer » est la même pour une zone d'interdiction que pour une réserve ordinaire. Proposition : « Réserve majeure » (ton inchangé) quand une réserve `decision_critical` est affichée. Mesure faite par prototype, puis annulé : 0 test sur 2 985 ne change. Aujourd'hui, seule la zone inondation établie produit une réserve critique (les incompatibilités ont leur propre étiquette, « Condition non respectée »). Le changement ne toucherait donc que ce cas.
- **L'ordre des sections.** Quand une autre priorité est favorable (cas simulé : zone Rs2 et accès aux soins favorable), la section « Ce qui correspond à votre projet » s'affiche **au-dessus** de la carte de la zone d'interdiction, dans les deux présentations. Le verdict reste celui des réserves (« Ces points pèsent dans votre décision. Par ailleurs, l'accès aux soins répond bien à votre projet. »). Proposition : faire passer les contrôles avant les correspondances quand une réserve critique est affichée. Ordre commun à tout le dossier : non modifié.

## 3. Performances

**Mesuré** sur le vrai `georisques.ts`, avec un `fetch` simulé qui sert les réponses Géorisques réelles après une latence choisie (`fut127-georisques-appels.test.ts`) :

| Situation | Appels Géorisques | Durée de la lecture (latence simulée 200 ms par appel) |
|---|---|---|
| Avant FUT-127 | 8 (4 au point, 4 à la parcelle, en parallèle) | ≈ 200 ms (un aller-retour) |
| Premier dossier d'une commune (process neuf) | 9 : + 1 détail par plan distinct, **partagé** entre point et parcelle (pas de doublon) | ≈ 430 ms : **un aller-retour de plus**, parce que le détail attend la liste des plans |
| Dossier suivant, même plan, même process | 8, le détail vient du cache | ≈ 200 ms : identique à avant |
| Même adresse relue (second rendu, actualisation) | 0 | immédiat |
| Détail en panne | aléas inconnus, donc lecture prudente ; l'échec n'est pas mis en cache | inchangée |
| Table GASPAR des plans communaux | 0 appel, fichier local de 2,7 Mo | 37 ms, une fois par process |

**Défaut trouvé et corrigé.** La lecture de l'adresse est coupée à 10 s à l'affichage (`fetchLogementDecisionDataWithTimeout`). Au-delà, **toute** l'analyse du logement passe « indisponible ». Le détail, en série, héritait du délai commun de 8 s. Un service lent pouvait donc faire perdre l'analyse entière : par exemple 1,5 s de liste plus 8 s de détail, plus le cadastre qui les précède. Le détail a maintenant son propre délai de 3 s. Mesure : avec un détail simulé à 9 s, la lecture rend en 4,5 s, aléas inconnus, lecture prudente. Ce délai est une valeur technique, modifiable (`PLAN_DETAIL_TIMEOUT_MS`).

**Où cela compte.** La consultation du dossier (`/rapport`, augmentation adresse streamée : la lecture communale s'affiche d'abord) et la génération (`generate-decision-artifact`) passent par la même lecture. Le surcoût est d'un aller-retour Géorisques au premier dossier d'un plan donné, par instance. Le cache vit en mémoire du process : il se perd à chaque démarrage à froid d'une fonction Vercel, où le premier dossier paie l'aller-retour.

**Non mesuré.** La latence réelle de Géorisques. Le service refusait toute connexion depuis le poste de mesure, y compris l'API publique sans jeton (« HTTP/2 stream was not closed cleanly »), et le jeton n'a pas été utilisé. À mesurer en recette, depuis une IP française : durée de `/api/v2/gaspar/pprn/{id}`.

**Écarté.** Remplacer l'appel par la table GASPAR embarquée. Elle ne contient que les aléas d'inondation, pas « recul du trait de côte ». Or c'est cette information qui empêche aujourd'hui de classer à tort la zone Os1 du Quai Duperré en exposition établie. Pas de mécanisme supplémentaire sans preuve de nécessité.

## 4. Comparateur gratuit

Ticket P0 distinct, lié à FUT-127 : **FUT-129**. 1 721 communes couvertes par un plan inondation approuvé ou anticipé y ressortent « Risque d'inondation faible » ou « peu de reconnaissances CatNat inondation ». Ce ticket contient le recensement des surfaces touchées, la solution recommandée, les arbitrages et les critères d'acceptation. Rien n'est modifié dans le comparateur par cette PR.

## 5. Vérifications de la passe

- **Classique / Relevé.** Les mêmes trois niveaux. Le niveau 3 passe par `signalConvention`, rendu par `MethodDetails` (classique) et par `lecture-dossier.ts` (Relevé). Test de parité vert.
- **Mobile.** Rendu vérifié à 390 et 360 px, aucun débordement.
- **Répétitions.** Le verdict nomme la carte, et la ligne « À contrôler » ne la répète pas (`dejaNommes`). La carte ne redit plus le verdict. L'historique des reconnaissances ne figure plus qu'une fois sur la face (sa pastille), avec sa limite au niveau 3.
- **FUT-126 / PR #82.** Aucun de ses fichiers touché. Fusion à blanc sans conflit, 2 997 tests verts.
- **Analyses historiques.** Relues à l'identique, avertissement reformulé, tests verts.
- **Garde-fou CatNat.** `/dev/fut127` réécrivait la phrase du compte : le test `la phrase du compte n'est écrite QUE dans catnat-evidence` échouait déjà sur le commit précédent de cette PR, contrairement à ce que j'avais annoncé (« 0 échec »). La page passe désormais par `phraseConstatCatnatInondation`.
- **Captures.** 32 PNG (11 Mo) remplacés par 17 WebP (3,6 Mo) : les cas représentatifs, dont Charron à 1440, 390 et 360 px, Charron avec les preuves dépliées, Châtelaillon à 390 et 360 px, et les analyses figées. Les deux captures « avant » communales (`main`) sont conservées. Les anciennes PNG restent dans l'historique du commit précédent ; une fusion en « squash » ne les ferait pas entrer dans `main`.
