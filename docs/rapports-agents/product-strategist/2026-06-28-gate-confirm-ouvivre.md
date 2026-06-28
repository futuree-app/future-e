# Le gate « confirm » de /ou-vivre : valeur ou friction ?

> Rapport Product Strategist — 2026-06-28. Read-only. Déclencheur : un primo-utilisateur réel
> (ami du porteur) bute sur l'écran de confirmation bloquant après « Explorer mes possibilités ».

## L'idée à trancher

Le parcours /ou-vivre s'arrête aujourd'hui sur une phase bloquante `confirm` : après le parse du
texte libre, on affiche l'interprétation (reformulation + critères en chips + périmètre gradué +
« ce qui reste ouvert ») et on attend un second clic (« Lancer l'analyse ») avant tout résultat.
Question posée : garder ce gate bloquant, ou fusionner « interprétation visible » et « résultats »
en un seul clic (calcul direct, interprétation affichée AU-DESSUS des résultats, corrigeable sur
place) ? Y a-t-il une troisième voie ?

L'idée arrive sous forme de solution (« fusionner » / « afficher autrement »). Je remonte au besoin.

## Le vrai besoin (deux besoins distincts, à ne pas confondre)

1. **Besoin du lecteur** : voir ses possibilités. Le moment déclencheur est « je tape mon projet,
   je clique Explorer, je veux des communes ». Modèle mental dominant : un clic = un résultat. Le
   gate viole ce contrat (« on me redemande, je dois recliquer »).
2. **Besoin du produit (doctrine)** : l'HONNÊTETÉ de l'interprétation. futur•e rend visible ce
   qu'il a compris, y compris le relief « jadis silencieusement ignoré » et les ambiguïtés
   reformulées en hypothèses (jamais en questions). C'est un mécanisme délibéré, lié au moat
   (« on ne ment pas sur ce qu'on n'a pas compris »). Réel, à protéger.

Le piège est de croire que ces deux besoins exigent un **écran bloquant**. Ils n'exigent que
**l'interprétation soit visible et corrigeable**. « Visible » ≠ « barrière avant tout résultat ».
C'est la confusion centrale du gate actuel.

## Constat décisif : l'argument économique du gate est largement vide (en config par défaut)

Vérifié dans le code, pas supposé :
- `runParse` appelle `/api/comparateur-vie/parse` = **LLM, coûteux**. Il tourne AVANT le gate.
- `runMatch` appelle `/api/comparateur-vie/match` = **déterministe, pas de LLM** (la route n'est
  pas dans la liste des routes qui appellent un modèle). Coût quasi nul.
- La synthèse (`/synthesize`, LLM coûteux) est **déjà derrière un bouton manuel** : `AUTO_SYNTHESIS`
  vaut `false` par défaut (`src/lib/auto-synthesis.ts`), donc « Générer la synthèse » est un clic
  explicite de l'utilisateur.

Conséquence : le gate `confirm` se situe APRÈS l'opération coûteuse (parse) et AVANT une opération
bon marché (match déterministe). Il ne protège pas le LLM. L'autre LLM coûteux (synthèse) est déjà
protégé par son propre bouton. **L'économie réelle du gate ≈ un appel déterministe.** L'argument
« le gate évite de calculer sur un mauvais parse » tient pour le match déterministe, pas pour les
tokens. Le coût qu'il fait porter au lecteur (un écran + un clic + rupture du modèle mental) est
disproportionné par rapport à ce qu'il économise.

## Le gate valide À L'AVEUGLE — la fusion valide AVEC PREUVE

Argument produit le plus fort, souvent inversé par intuition. Le gate demande « est-ce bien tes
critères ? » dans l'abstrait, sans montrer ce que ces critères PRODUISENT. Or un primo-utilisateur
ne sait pas juger une chip « reliefs à proximité » dans le vide. Il sait juger quand il voit
arriver trois communes de montagne alors qu'il voulait la mer : « ah, il a cru que je voulais la
montagne » → il corrige. **Montrer les résultats rend l'erreur de parse PLUS visible, pas moins.**
Le gate prétend qualifier le parse mais le valide moins bien que ne le feraient les résultats
eux-mêmes. C'est un contrôle qualité qui retire la preuve dont l'utilisateur a besoin pour
contrôler.

## Verdict : REFORMULER (fusionner), pas REFUSER l'interprétation

On ne supprime PAS l'interprétation visible. On supprime la **barrière**. Troisième voie, meilleure
que les deux options binaires :

**Click « Explorer » → parse → dès le retour du parse, rendre l'en-tête d'interprétation ET lancer
le match déterministe dans la foulée → les résultats s'affichent sous l'interprétation.** Pas de
clic intermédiaire. La synthèse reste manuelle (coût préservé). C'est exactement le court-circuit
que le code SAIT déjà faire : `launchFromAnchor` saute `confirm` et enchaîne `runMatch`. On
généralise ce comportement au chemin texte.

### Ce qu'on GARDE (intégralement)
- Le bloc d'interprétation complet : reformulation, **critères en chips + ChipTooltip**, périmètre
  gradué (dur/idéalement/ouvert à/hors), relief + glose, et surtout **« ce qui reste ouvert »**
  (ambiguïtés en hypothèses, hors-mesure). C'est l'honnêteté/le moat. Rien ne disparaît.
- L'affordance de correction (« Affiner » / « Modifier ma demande »).
- La synthèse derrière son bouton manuel.

### Ce qu'on DÉPLACE
- Aujourd'hui les résultats (lignes 1027-1058) ne montrent qu'un rappel DISCRET de la reformulation
  + les `appliedZones`. Les chips de critères et les ambiguïtés ne vivent QUE dans le gate. La
  fusion exige de **remonter le bloc d'interprétation riche en EN-TÊTE des résultats** (au-dessus
  des cartes). Garder la distinction utile : le gate montrait l'INTENTION (zones du parse) ; les
  résultats montrent ce qui a été RÉELLEMENT appliqué (`outcome.appliedZones`). Conserver les deux
  registres dans l'en-tête fusionné (« compris » vs « appliqué »).

### Ce qui change dans la machine à états
- `Phase` perd `confirm` comme état BLOQUANT. `runParse` enchaîne directement `runMatch`
  (`parsing` → `matching` → `results`), comme `launchFromAnchor`.
- Variante recommandée pour préserver le sentiment « il m'a compris » sans bloquer : afficher
  l'en-tête d'interprétation dès le retour du parse, pendant que le match (rapide) calcule, puis
  faire apparaître les cartes dessous. L'interprétation précède visuellement les résultats sans
  les barrer. (Si on ne veut pas ce raffinement, simple enchaînement parse→match→render groupé.)
- `refine` reste : édition du texte → re-parse + re-match (chemin coûteux, explicite, assumé).

## Pièges (concrets)
1. **Résultats sur un parse erroné** : non aggravant, voir « validation avec preuve ». L'en-tête
   au-dessus rend l'erreur lisible en contexte. Garde-fou : garder « Affiner » très visible en tête.
2. **Re-run au moindre ajustement** : ne PAS introduire ici une suppression de chip inline qui
   re-déclenche le match en boucle (scope creep). L'édition de TEXTE passe par re-parse (LLM) —
   donc explicite et rare. Une future correction au niveau chip (sans re-parse, match seul, comme
   le retrait de trait de Phase B / `suppressNarrativeKeys`) est un chantier séparé, à ne pas
   embarquer dans cette décision.
3. **Cas vide** : l'état `empty` s'affichera sans pré-validation ; mitigé par l'en-tête
   d'interprétation au-dessus du message « élargissez un critère ».
4. **Coût** : non régressif. Match déterministe ; synthèse toujours manuelle.

## Cohérence vision / invariants
- « La décision, pas la compréhension » : la fusion sert MIEUX la décision (résultats plus vite,
  honnêteté en contexte). Conforme.
- Invariant n°1 (on éclaire, on ne décide pas) : intact. Invariant n°4 (donnée utile = aide une
  décision) : l'interprétation reste, mais devient utile EN CONTEXTE des résultats.
- Aucun arbitrage existant ne protège le gate bloquant (vérifié `arbitrages/` : wizard-non-universel,
  loisirs, app-native, comparateur-retrograde, mode-foyer… aucun ne couvre ce point). La doctrine
  d'interface (`doctrine/interface.md`) dit même : « ce moment sert à VALIDER que la demande a été
  comprise » — la validation par la preuve (résultats) honore cet objectif mieux que la barrière.

## Différenciation / moat
La barrière bloquante n'est PAS le moat ; un concurrent générique mettrait un écran de plus sans y
penser. Le moat est l'INTERPRÉTATION HONNÊTE (relief jadis ignoré rendu visible, ambiguïtés en
hypothèses). La fusion préserve exactement la partie différenciante et jette la partie banale
(friction). Elle rend futur•e plus difficile à copier (l'honnêteté en contexte) sans le rendre
juste plus lourd.

## L'hypothèse porteuse (la croyance non dite sur laquelle repose mon verdict)
**Je crois que l'interprétation est plus convaincante comme PREUVE EN CONTEXTE (au-dessus de
résultats réels) que comme point de contrôle abstrait, et que le modèle mental « clic Explorer =
voir les communes » domine chez le primo-utilisateur.** Si, au contraire, le gate fonctionne comme
un « moment d'être compris » que les utilisateurs savourent AVANT les résultats (et qui amorce
l'engagement vers le rapport payant), le retirer perdrait quelque chose. Le signal terrain appuie
ma croyance, mais n = 1.

## Transformation
La fusion ne change pas la façon de décider du lecteur (ni en bien ni en mal sur ce plan) ; elle
retire un obstacle entre lui et le moment où il commence à arbitrer entre des territoires qui « ne
racontent pas la même histoire ». Le gate, lui, retardait ce moment de transformation.

## Ce qu'on ne sait pas (à tester AVANT de graver)
Les événements PostHog existent DÉJÀ — les lire avant de construire :
- `life_parse_succeeded` (gate affiché) → `life_project_confirmed` (gate validé) : mesurer le
  drop-off. S'il est notable, le gate est une fuite quantifiée.
- `life_project_refine` : taux de retour arrière depuis le gate.
- Idéalement A/B derrière un flag (le code sait déjà court-circuiter via `launchFromAnchor`) :
  gate vs fusion sur (a) complétion parse→results, (b) time-to-results, (c) taux d'affinage,
  (d) conversion downstream vers le rapport payant.

## Tension avec le Business Strategist (nommée, non tranchée)
- Lui défendra : (1) économie de calcul / qualification avant de « dépenser » ; (2) le gate comme
  rampe d'ENGAGEMENT (un « oui » intermédiaire augmente l'investissement psychologique et la
  conversion vers le payant).
- Ma réponse honnête : (1) s'effondre largement en config par défaut (le coûteux est upstream ou
  déjà manuel) ; (2) est une vraie hypothèse de conversion que je ne peux pas réfuter à n = 1 —
  c'est précisément ce que l'A/B doit départager. Si la donnée montre que le gate augmente la
  conversion payante sans trop de fuite, sa lentille doit primer sur la mienne ici. Matériau de
  /board.

## Verdict synthétique
REFORMULER → fusion (troisième voie : interprétation en en-tête, match déterministe enchaîné,
synthèse toujours manuelle, correction par « Affiner »). On supprime la barrière, jamais
l'interprétation. **Confiance : élevée** sur « le gate bloquant doit sauter » et « garder
l'interprétation visible » ; **moyenne** sur les mécaniques exactes de la troisième voie ; à
sécuriser par lecture PostHog + A/B court avant de graver, à cause de l'hypothèse de conversion du
Business.

## Les quatre questions de clôture
1. **Reconstruirait-on ça à zéro ?** L'interprétation visible : oui. Le second clic bloquant : non.
2. **Qu'est-ce qu'on perd en le supprimant ?** Le « moment d'être compris » isolé (hypothèse de
   conversion Business) et un garde-fou contre le calcul d'un match déterministe sur mauvais parse.
   Peu, et compensé par la validation-avec-preuve. À mesurer côté conversion.
3. **Version 10× plus simple ?** C'est précisément la fusion : zéro écran en plus, l'interprétation
   devient un en-tête des résultats au lieu d'un module-étape.
4. **Plus dur à copier, ou juste plus riche ?** La fusion garde le différenciant (honnêteté en
   contexte) et jette le banal (friction). Plus dur à copier, pas juste plus riche.

## Si j'étais le gardien du produit
Je supprimerais le gate bloquant et je remonterais l'interprétation honnête en en-tête des
résultats, calcul direct au clic — MAIS je lirais d'abord le drop-off `life_parse_succeeded →
life_project_confirmed` dans PostHog (24h de travail), et si possible je shipperais la fusion
derrière un flag A/B pour trancher l'hypothèse de conversion du Business avant de la rendre
définitive.

## Quand rouvrir ce sujet
- Si `AUTO_SYNTHESIS` passe à `true` par défaut, ou si le match devient un appel LLM : l'argument
  économique du gate redevient sérieux — réévaluer.
- Si l'A/B montre que le gate augmente la conversion payante de façon nette (> bruit) sans fuite
  excessive : la lentille Business prime, garder une forme d'étape d'engagement.
- Si le taux d'affinage post-fusion explose (les gens corrigent sans cesse face à des résultats
  surprenants) : signe que la validation-avant-calcul avait une valeur ; envisager une correction
  au niveau chip (re-match sans re-parse).
- Si l'on ajoute une édition de critères inline : rouvrir la question du re-run/coût.
