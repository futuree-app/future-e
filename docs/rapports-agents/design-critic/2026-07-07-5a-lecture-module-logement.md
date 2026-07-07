# Design Critic — Chantier 5a : la lecture du module Logement

**Date** : 2026-07-07 · **Read-only.** Je ne modifie rien.
**Question-mère** : ces écrans servent-ils la décision du lecteur, dans la voix de futur•e, ou ajoutent-ils du bruit ?

**Lu avant de juger** : `docs/vault/recherches/inventaire-design.md`, `docs/vault/modules/logement.md`, le code réel de `LogementModule.tsx` (498 l., version REFACTORÉE post-board, pas la 1194 l. auditée), les 8 composants de `src/components/report/logement/` + `ThermalComfortSection.tsx`, `LogementSynthesis.tsx`, `PassportTiltScene.tsx`, `kit.tsx`, et les 4 rapports de board du 2026-07-07.

**Note de cadrage importante.** Le code que je juge n'est PAS celui du board : le hero est déjà réécrit (« Ce logement, lu à son adresse. Énergie, risques, entourage. » = exactement la reco de l'Editorial), l'aside « Les briques du module » a disparu, le bloc « Actions documentées » (les 4 cartes vers des 404) est retiré. Les bloquants 1/2/4 du board éditorial sont donc résolus. Il reste le sujet du chantier 5a : **l'ORDRE de lecture**, et il n'est pas encore celui de la colonne vertébrale validée.

---

## Écran

**Module Logement**, `src/components/report/LogementModule.tsx` (orchestrateur) + faces dans `src/components/report/logement/` + `ThermalComfortSection.tsx` + `LogementSynthesis.tsx`.
Moment du parcours : après avoir débloqué une commune, le lecteur tape une adresse et lit CE logement. Décision éclairée : « que dois-je engager sur ce bien ? » (acheter, négocier, rénover, provisionner, rester).

---

## Ce qui fonctionne (à préserver)

- **Le bas du module porte déjà la voix.** Statut réglementaire, Sinistralité, Autour, Synthèse : chacun suit le bon patron de divulgation progressive (phrase langage courant → faits en évidence → repli `<details>` méthode/sources). Le `kit.tsx` (`ReportSection` puce mono + `GlassCard` .glass) est bien la source unique ; aucun encart de résultat à coins droits dans ces blocs. Ne pas casser ça.
- **La sinistralité est un modèle d'honnêteté du signal** : Niveau 1 hors carte (« ne prédit ni un sinistre, ni le prix »), métriques traduites (‰ → « pour 1 000 »), comparaison factuelle des périls gatée sur des rangs strictement séparés. C'est la marque = l'auditable.
- **Le statut réglementaire colore le titre par sévérité réglementaire officielle** (ambre/orange/rouge), pas par un score inventé. Bon désamorçage d'ADR-0001.
- **Le passeport reprend l'effet 3D partagé** (`PassportTiltScene`) : conforme à la doctrine d'harmonisation (un passeport de module doit lire au même registre que Territoire).

---

## Question 1 — L'ordre trahit-il encore l'ordre de dev ?

**Verdict : OUI, franchement. C'est le cœur du chantier 5a.** L'ordre RENDU aujourd'hui (l.364-492) n'est pas la colonne vertébrale validée. Trois décrochages, tous des cicatrices de dev :

1. **Beat 3A est coupé en deux par la synthèse.** `ThermalComfortSection` (« Faire face à la chaleur », une PREUVE) est rendue **avant** la synthèse (l.376), tandis que son jumeau `EnergieSection` est rendu **après** (l.427). Le lecteur reçoit donc : une preuve thermique → la synthèse → l'autre moitié de la même preuve énergétique. « Le logement lui-même » est éclaté de part et d'autre du « qu'est-ce que je retiens ? ». C'est le décrochage le plus visible, et le plus clairement historique (le thermique a été branché tôt, il est resté en haut).

2. **La sonde projet est au sommet, pas à la sortie.** `ProjectProbe` (les 4 boutons) est rendue l.402, juste sous le thermique, **avant** la synthèse et toutes les preuves. Or c'est l'input du **beat 5** (« et moi, je fais quoi ? »). On demande au lecteur son projet avant qu'il ait rien compris du bien. La question arrive trop tôt : elle devrait ouvrir la sortie décisionnelle, pas l'analyse.

3. **« À vérifier » passe avant « Autour ».** `Face2Implication` (« Ce que cela mérite de vérifier », proto beat 5) est l.472, puis `Face3Block` (« Autour », beat 4) l.475. La sortie d'engagement est rendue AVANT le beat cartographique qui la précède dans la cible. Inversion.

**La bonne cible reste celle validée** (Identité courte → Synthèse → Preuves A puis B → Autour → À vérifier). Le travail de 5a est essentiellement un **ré-ordonnancement**, pas une réécriture. Concrètement : remonter la synthèse en position 2 (juste après le passeport), recoller Thermique + Énergie en beat 3A, descendre sonde + checklist tout en bas, et remettre Autour (beat 4) avant la checklist (beat 5).

**Un piège à nommer** : `Face2Implication` n'est PAS le beat 5 cible. Elle est scopée Face 2 uniquement (elle ne lit que `georisques` + `sinistralite`, l.177) et se présente comme une sous-conclusion de la famille risques. Le beat 5 validé est une **sortie GLOBALE par posture** (lib neuve, déterministe) qui doit aussi refléter l'énergie, le thermique et l'autour. Réutiliser `Face2Implication` telle quelle reconduirait le biais « conclusion de la Face 2 » au lieu de « conclusion du logement ».

---

## Question 2 — Beat 1 compact : garde-t-on le tilt 3D ?

**Verdict : ON GARDE LE TILT. Ne pas l'abandonner.**

L'argument « laisser la synthèse porter l'effet » repose sur une confusion de catégories. Le tilt et la synthèse ne sont pas deux « effets » qui se disputent l'ouverture : ils opèrent à deux beats différents et sur deux registres différents.
- Le tilt est **l'objet-identité** : « voici CE bien, à CETTE adresse ». Le mouvement dit « c'est une plaque réelle que tu touches ». Ce n'est pas de l'ornement, c'est la matérialisation du grain adresse (le moat). Un élément distinctif qui raconte le lieu, pas une donnée inerte.
- La synthèse est **la voix** : elle porte le SENS en prose. Elle n'a aucun « wow visuel » à donner ; lui confier « l'effet » reviendrait à attendre d'un paragraphe qu'il remplace une signature visuelle. Faux transfert.

Deux raisons dures de le garder :
1. **Harmonisation gravée.** L'inventaire-design (kit de cartes, corollaire 2026-07-03) impose qu'un passeport de module reprenne `PassportTiltScene`. Un passeport qui ne s'incline plus lirait « plus petit / plus carré » que Territoire : défaut d'harmonisation par construction.
2. **Le compactage ne tue pas le tilt.** Le tilt fonctionne sur 3 couches de profondeur (`passport-layer-name`, `passport-layer-seal`, la surface). Avec adresse (serif, couche nom) + sceau DPE (couche sceau) + une rangée de champs, la parallaxe a encore de quoi bouger. `PassportTiltScene` respecte déjà `prefers-reduced-motion` et neutralise le touch.

**Seule vigilance** : que le compactage laisse au moins deux couches de profondeur lisibles. Si on tombait à « adresse + DPE » sans aucun champ, la scène 3D aurait peu à animer — mais la cible (adresse, type, surface, DPE, parcelle) garde largement de quoi.

**En revanche, le CONTENU du passeport n'est pas compact aujourd'hui, et il fuit.** Voir « Honnêteté du signal » ci-dessous : deux des six champs sont exactement ceux que le brief demande de couper.

---

## Question 3 — Deux sous-familles : aident-elles ou re-segmentent-elles ?

**Verdict : elles aident, à UNE condition de niveau visuel — sinon elles re-segmentent.**

Le risque est réel. Chaque bloc a DÉJÀ son eyebrow puce-mono (`ReportSection` : « Énergie & rénovation », « Faire face à la chaleur », « Statut réglementaire à cette adresse »…). Si « Le logement lui-même » / « Les expositions à cette adresse » sont rendus eux aussi en puce-mono, on crée une **collision de niveau** : deux objets de même graphie pour deux rangs différents. Le lecteur ne saura plus lequel est le groupe et lequel est le bloc. Là, on aurait re-segmenté ce qu'on voulait fluidifier.

**Reco concrète** : le séparateur de sous-famille doit être d'un rang visuel **au-dessus** des eyebrows, et plus discret, pas plus fort. Deux options acceptables :
- Un **filet fin + label quiet** (serif petit ou sans-serif bas-de-casse, couleur `--fg-4`, sans puce), qui respire au-dessus du groupe. Il annonce la famille sans rivaliser avec les eyebrows.
- Ou **pas de titre du tout** : juste l'ordre + une respiration (espace vertical accru entre 3A et 3B). L'ordre porte déjà la distinction.

À NE PAS faire : réutiliser la puce-mono de `ReportSection` pour les groupes (collision), ni colorer ces groupes en rouge/orange (dramatisation).

**Tension à poser au porteur, sans la trancher** : le Product Strategist (board critique 3) plaide pour aller plus loin — **fusionner** Risques du bâti + Réglementaire + Sinistralité en UNE section « À quoi cette adresse est exposée », ordonnée par grain de preuve (le point est en zone réglementée → le point est cartographié → la commune a indemnisé). C'est un mouvement plus fort que des sous-titres, et c'est LA transformation (ADR-0002) que ni Géorisques ni un portail immo ne font. Mais 5a dit « on ne reconstruit pas entièrement ». Donc : pour 5a, les deux sous-familles en séparateur discret ; et je NOMME la fusion-par-grain-de-preuve comme le vrai chantier suivant (5b ?), à trancher hors 5a.

---

## Question 4 — « Risques du bâti » : minimum pour qu'il n'agresse plus

Le bloc (l.438-463) est la strate la plus ancienne et la plus anxiogène : `ReportSection tone="red"`, sous-tête administrative « Risques référencés », puis des chips **mono, rouges** (`rgba(168,74,58)`) portant les labels Géorisques verbatim, puis deux `Block` sismicité / RGA. C'est du résidu SIG : des tags administratifs en couleur d'alerte, zéro phrase, zéro glose. Il jure violemment avec ses voisins (sinistralité, réglementaire) qui, eux, glosent et cadrent. Le même RGA est glosé correctement 30 lignes plus bas en tooltip, et brut ici : le module a deux voix.

**Minimum pour 5a (sans reconstruire) :**
1. **Tuer le rouge.** `tone="red"` → neutre/accent. Les chips `rgba(168,74,58)` → registre sobre (`--fg-3` sur `--bg-elev`, bordure `--border-1`). Le rouge alarmiste viole l'invariant « l'émotion vient du récit, jamais des couleurs » et n°6 (intelligence, pas peur). L'exposition n'est pas un verdict.
2. **Supprimer les chips « Risques référencés ».** Les labels bruts `allRisks` sont inertes (une donnée vraie mais morte) et redondants : les PPRN sont déjà portés, structurés, par le bloc réglementaire ; RGA et sismicité sont déjà en `Block` glosés juste en dessous. Ce qui reste dans `allRisks` après retrait des PPRN n'a pas gagné sa place en tête d'un bloc. Retrait sans perte.
3. **Une phrase de tête en langage courant**, pour aligner le bloc sur le patron de ses voisins (« qu'est-ce que ça veut dire ? » avant les faits).
4. **Gloser RGA** ici comme ailleurs (« mouvements des sols argileux qui peuvent fissurer les maisons »).

Résultat : le bloc devient « à quoi le bâti est exposé » (sismicité + RGA glosés, sobres), entre bien dans la famille « expositions », et cesse d'être le pic anxiogène de la page. Ce sont ~4 retraits/atténuations, pas une refonte.

---

## Question 5 — Que montrer tant que la sonde n'est pas répondue ?

**Verdict : je VALIDE la proposition (checklist par défaut posture « résidence », qui se re-taille à la réponse), avec deux garde-fous.**

- **Ne jamais gater la checklist derrière la sonde.** Un écran qui dirait « réponds d'abord » créerait un beat mort à l'endroit exact où le lecteur attend sa sortie. La checklist doit être visible immédiatement, en posture par défaut.
- **« Résidence » est le bon défaut** : c'est la posture la moins présomptueuse (« j'y vis » n'impose pas un projet d'achat au lecteur), et la plus fréquente en consultation. La sonde s'installe alors comme un **raffineur discret au-dessus** de la checklist (« Vous envisagez d'acheter ? Ajustez cette liste »), pas comme un portail.
- **Honnêteté de cadrage** : ne pas présenter la liste par défaut comme LA vérité qu'on remplacera ensuite. La cadrer explicitement « par défaut, pour quelqu'un qui habite ici » — sinon on affiche une posture comme neutre alors qu'elle est un choix. La `ProjectProbe` disparaît déjà une fois répondue (return null) : bien, mais la checklist doit rester présente et se re-tailler, pas dépendre de la réponse pour exister.

Meilleur que la proposition ? Non, elle est juste. Le seul ajout est le cadrage honnête du défaut.

---

## Question 6 — Placement/visuel de la checklist : qu'elle lise comme une sortie d'engagement, pas une liste administrative

Le `Face2Implication` actuel est déjà sur la bonne piste (phrases en action : « demandez si des sinistres… », « surveillez l'évolution des fissures… ») : c'est le bon registre, à généraliser. Recos visuelles :

- **Chaque item est un geste, pas un champ.** Formulation actionnable (« Demandez au vendeur… », « Consultez le règlement de la zone… », « Conservez les justificatifs… »). Jamais un label/valeur administratif.
- **Registre de clôture distinct.** C'est le dernier beat, il doit se sentir comme un hand-off. Eyebrow accent taupe « À vérifier avant de décider », `GlassCard` (jamais coins droits, largeur = bloc). Un marqueur d'item **neutre** (tiret ou point sobre), surtout **pas** de coche verte (flatterie « c'est bon ») ni de croix rouge (alarme).
- **Zéro compteur.** Pas de « 5 points à vérifier » ni de badge de nombre : ce serait un score de complétude implicite (ADR-0001, fausse certitude). La liste est ce qu'elle est, sans totalisation.
- **Honnêteté d'étendue.** La cadrer « les points que cette lecture fait remonter », jamais « tout ce qu'il faut vérifier » (l'exhaustivité serait un mensonge).
- **Pas de re-dramatisation.** La checklist synthétise des blocs déjà lus ; elle ne réintroduit ni rouge ni « risque élevé ».

Placement : **tout en bas, beat 5**, après Autour (beat 4). La sonde juste au-dessus d'elle comme raffineur.

---

## Question 7 — Risque de rythme après compactage du beat 1 ?

**Verdict : le vrai risque n'est pas un creux, c'est une MONOTONIE au milieu.** Après compactage, la séquence est : passeport court (léger) → synthèse (le pic, la prose qu'on retient) → puis **cinq blocs de preuve structurellement identiques** (eyebrow → GlassCard → phrase → faits → `<details>`). Le danger est la répétition de gabarit sur 5 blocs, pas un trou.

Trois amortisseurs, déjà disponibles :
1. **Les deux sous-familles (Q3) chunkent le milieu en 2 + 3.** C'est leur meilleure justification rythmique : elles donnent deux respirations dans la longue descente de preuves.
2. **Autour (beat 4) est le palate cleanser.** Il est plus léger, cartographique, listes de distances : il casse le gabarit « phrase → faits → repli » juste avant la clôture. Le garder en beat 4 (avant la checklist) est aussi bon pour le rythme que pour la logique.
3. **Varier la densité à l'intérieur de 3B.** Réglementaire + Sinistralité sont deux blocs denses consécutifs « phrase → faits → disclosure ». Une fois « Risques du bâti » allégé (Q4), il fait office de bloc court d'entrée dans 3B, ce qui aide.

Ce qu'il ne faut PAS faire pour « animer » : ajouter un graphique ou un visuel décoratif entre les preuves. Le remède au gabarit répété est le chunking éditorial (sous-familles + Autour), pas l'ornement.

---

## Honnêteté du signal (constats spécifiques)

- **Passeport — deux champs inertes à couper** (`PropertyPassport.tsx` l.27-28). `Altitude {n} m NGF` est une donnée vraie mais inerte à une adresse de logement : c'est exactement le cas « altitude modérée = fuite de donnée » (`feedback_signature_identitaire`). Elle ne sert aucune décision d'engagement. `Commune · INSEE {code}` : le brief le demande explicitement, et il a raison — l'INSEE est de la plomberie analytique, la commune est déjà dans le label d'adresse. Les deux dégonflent le passeport sans perte, et rapprochent le beat 1 de sa cible compacte (adresse, type, surface, DPE, parcelle).
- **Répétition du DPE.** Le passeport porte le sceau DPE (identité, légitime) MAIS ajoute « Classé D au diagnostic énergétique. » (l.66) qui pré-empte et duplique `EnergieSection`. Le sceau suffit comme identité ; la phrase de classement appartient au beat 3A (Énergie). À retirer du passeport.
- **Bon point** : aucune affirmation chiffrée sans source dans les blocs de preuve (disclosures systématiques). Aucun score global. Synthèse posture-neutre conforme.

## Incohérences visibles

- **Deux voix sur le même risque** (déjà dit) : RGA brut rouge dans « Risques du bâti », RGA glosé sobre en tooltip dans Sinistralité. Sur une même page, l'œil voit deux traitements du même objet. Résolu par Q4.
- **Contraste de familles** : « Risques du bâti » en rouge à côté de « Statut réglementaire » qui, lui, réserve le rouge à la seule interdiction stricte. Deux échelles de rouge voisines qui ne veulent pas dire la même chose. Résolu par Q4 (dé-rougir le bloc bâti).

## Signalements éditoriaux (observations, je ne réécris pas)

- **Tiret cadratin visible** dans `RegulatorySection.tsx` l.57 : `zoneLabel` renvoie « Zone B2 — faiblement à moyennement exposée ». Le « — » est un tiret cadratin, rendu à l'écran. Interdit éditorial visible (zéro tiret cadratin). À remplacer par deux points ou une virgule. Défaut de forme, à confirmer par l'Editorial.
- **Sonde** : « Quel est votre projet sur ce logement ? » en serif italic — voix correcte, vouvoiement OK. Rien à signaler.
- **Rappel** : le hero est déjà corrigé (aligné sur la reco Editorial), ne pas rouvrir.

---

## Verdict global : À AJUSTER

Les briques individuelles sont, pour la plupart, de futur•e (patron de divulgation, sources, pas de score). Le défaut est **structurel et ordinal** : l'ordre rendu n'est pas la colonne vertébrale validée (beat 3A coupé par la synthèse, sonde au sommet, « à vérifier » avant « autour »), le beat 5 n'existe qu'en proto scopé Face 2, le passeport n'est pas encore compact et fuit deux données inertes, et « Risques du bâti » reste la cicatrice rouge à dé-dramatiser. Rien ici n'est une refonte ; tout est du ré-ordonnancement + du retrait.

**Hiérarchie de ce qui compte** :
1. (majeur) Ré-ordonner aux 5 beats — recoller Thermique+Énergie, remonter la synthèse en position 2, descendre sonde+checklist en fin, remettre Autour avant la checklist.
2. (majeur) Promouvoir `Face2Implication` en beat 5 global par posture (pas une conclusion de Face 2).
3. (moyen) Compacter le passeport : couper altitude, commune/INSEE, la phrase de classement DPE. Garder le tilt.
4. (moyen) Dé-dramatiser « Risques du bâti » : tuer le rouge, supprimer les chips brutes, une phrase de tête, gloser RGA.
5. (détail) Sous-familles en séparateur discret d'un rang au-dessus des eyebrows. Tiret cadratin l.57 à corriger.

---

## Cohérence / tensions ouvertes (je ne tranche pas)

- **Fusion par grain de preuve** (Product, board critique 3) vs sous-titres 5a : la vraie transformation différenciante est peut-être de fusionner les 3 blocs d'exposition en une section ordonnée par grain de preuve, pas de les sous-titrer. 5a dit « on ne reconstruit pas » : je pose la fusion comme chantier suivant, à trancher hors 5a.
- **Unité de persistance (user, insee)** (Product/Business, bloquant) : le modèle de données écrase l'artefact à chaque adresse d'une même commune, ce qui casse le cas payant « comparer 2-3 biens dans la même ville ». Hors mon mandat (plomberie/périmètre), mais ça conditionne le sens même du beat 5 (une checklist « pour ce bien » n'a de valeur d'arbitrage que si deux biens coexistent). Je le relaie, je ne le tranche pas.

## Mise à jour de l'inventaire-design (prêt à écrire par Claude principal)

Deux patterns stabilisés par 5a, candidats à `inventaire-design.md` :
1. **Le squelette 5-beats d'un module rapport** : Identité courte (passeport, tilt conservé) → Synthèse (voix) → Preuves (le bien lui-même / les expositions) → Autour → À vérifier (sonde + checklist par posture). Généralisable à Santé.
2. **La checklist de clôture** : sortie d'engagement en gestes (pas une liste admin), sans coche/croix colorée, sans compteur (score de complétude implicite = ADR-0001), cadrée « les points que la lecture fait remonter », jamais « tout ce qu'il faut vérifier ».

---

## Deux réflexes de clôture

**Version minimale (≈90 % de la valeur)** : le plus petit geste est le **ré-ordonnancement aux 5 beats** dans `LogementModule.tsx` — recoller Thermique à Énergie (beat 3A d'un seul tenant), remonter `LogementSynthesis` juste après le passeport (beat 2), descendre `ProjectProbe` + la sortie « à vérifier » tout en bas (beat 5), et remettre `Face3Block` (Autour, beat 4) avant elle. Ce seul déplacement de blocs, sans toucher à leur contenu, convertit « dossier d'inspection » en « comprendre puis documenter ». Le trim du passeport (couper altitude + commune/INSEE) et le dé-rougissement des chips sont les deux polissages qui montent à ~90 %.

**Quand rouvrir ce sujet ?**
- Si `logement_analyzed.relation_inferee` montre une majorité « j'y vis » (résidence) plutôt qu'achat/prospection : le beat 5 par défaut « résidence » est confirmé, mais la thèse « moment de vérité = arbitrage entre biens » (donc l'urgence de re-keyer sur l'adresse) tombe — re-prioriser.
- Si `logement_same_commune_multi` remonte souvent (≥2 adresses distinctes / commune / session) : le cas « comparer 2-3 biens » est réel → la checklist beat 5 doit évoluer vers une sortie comparative, et la fusion par grain de preuve devient prioritaire.
- Si un test humain au navigateur montre que le tilt sur passeport compacté a trop peu de couches pour animer proprement : rouvrir Q2 (garder le tilt mais revoir les couches de profondeur).
- Si la checklist beat 5, une fois livrée, se met à énumérer plus de ~5 items ou à répéter la synthèse : rouvrir Q6 (elle redevient une liste administrative).
- Le jour où une face « valeur » existe sur donnée réelle honnête : rouvrir le hero (le mot « valeur » pourra revenir dans un titre — pas avant).
