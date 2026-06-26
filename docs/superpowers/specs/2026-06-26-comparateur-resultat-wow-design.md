# Comparateur mode choix — refonte de la partie résultat (effet « wow »)

Date : 2026-06-26
Statut : design validé sur la direction (face-à-face complet), en attente de relecture porteur.

## Problème

La partie résultat gratuite de `/comparateur` (mode choix : le lecteur nomme 2-3 communes)
est **plate, sans effet wow**. Diagnostic convergent de trois agents (design-critic, editorial,
product) : la cause n'est pas la mise en page, c'est le bloc **« En résumé »**.

Ce bloc agrège les leaderships par thème en une phrase « {commune} prend l'avantage sur le climat,
les risques, la nature… » (`buildComparaisonComplete`, bloc `resume`, `comparateur-vie.ts` ~l.1254-1276).
C'est :
- **un score global déguisé** (classement sans le chiffre) → viole l'invariant n°2 / ADR-0001 ;
- la **cause directe de la platitude** : quand une commune rafle tout, il n'y a aucune tension,
  donc rien qui donne envie d'en savoir plus ;
- **à côté du besoin** : en mode choix le lecteur connaît déjà ses communes ; sa question est
  « qu'est-ce que je perds en choisissant A plutôt que B, y a-t-il un piège dans ma préférée ? ».
  Il veut la **tension/divergence**, pas un palmarès.

Le mot « En résumé » est en plus une formule explicitement bannie par `doctrine/editoriale.md`.

## Principe de la refonte

**Pivot : ne plus montrer QUI gagne, montrer OÙ ça se joue.** Le wow vient de l'arbitrage rendu
visible (« aucune ne gagne sur tout »), pas d'un classement. Le gratuit prouve qu'il existe une
vraie décision à prendre et que le moteur voit la faille ; le Pack donne la carte complète.

Direction validée (porteur) : **le face-à-face complet** — colonnes de communes face à face,
comme le produit payant, gaté par le **contenu** (un thème dévoilé, le reste verrouillé), jamais
par un design appauvri.

## L'écran résultat gratuit (de haut en bas)

1. **La ligne de fracture** (nouveau, moteur). En tête, LE point où les communes divergent le
   plus, en grand : « C'est sur {dimension} que vos communes s'écartent le plus : {A} {palier
   favorable}, {C} {palier défavorable}. » Honnête (divergence réelle relative au trio), pas de
   score. C'est l'ouverture qui crée la tension.

2. **Les communes en colonnes face à face** (réemploi). 2-3 colonnes, nom en Instrument Serif +
   numéro mono accent (grammaire de `ComparaisonCompleteView`). Sous chaque colonne, **deux
   lignes réutilisant des champs DÉJÀ calculés** par `seedComparaison` :
   - `identite` (ce que la commune offre, déjà unique dans le trio via `assignIdentite`) ;
   - `compromis` (ce qu'elle demande d'accepter, déjà unique via `assignCompromis`).
   Cette structure **force une signature + un revers par commune** : il devient structurellement
   impossible qu'« une commune rafle tout ». Le problème produit disparaît par construction.

3. **Un thème entièrement dévoilé** (réemploi). Le thème qui porte la fracture (ou le 1er),
   rendu exactement comme le payant : paliers absolus par commune, « Avantage X » / « À égalité »,
   cellule leader en accent. Le lecteur **goûte le vrai produit** sur un thème réel.

4. **Les thèmes restants, verrouillés** (réemploi + voile). Titre du thème + libellés des critères
   **visibles** (le squelette réel), verdict/paliers **voilés** (icône cadenas, valeur masquée).
   Garde-fou honnêteté : on voile **une conclusion réelle**, on n'invente jamais de faux contenu
   flouté pour simuler de la richesse.

5. **AskFuture** (réemploi adapté). Le composant group-aware de `/ou-vivre` (2 questions gratuites,
   `/api/comparateur-vie/ask`, gating 402 inchangé), placé **juste avant le paywall** (curiosité
   maximale). Voir section dédiée.

6. **CTA Pack** (existant, ajusté). L'amorce prend le relais de la tension : « Vous voyez où chacune
   penche. Le Pack vous donne les 7 thèmes critère par critère… ».

## Le seul morceau de moteur NEUF : `buildDivergence`

Fonction déterministe (hors score), calculée dans `seedComparaison` (et disponible aussi pour le
trio `/ou-vivre` si on veut, mais hors scope ici). Sur les `bands` déjà calculées par dimension :

- Candidats = dimensions **directionnelles** où au moins une commune est au **meilleur** palier (band 0)
  et au moins une au **pire** (band 2) → écart maximal (spread = 2). À défaut, plus grand spread présent.
- Départage déterministe : priorité aux dimensions de **risque** (plus décisives), puis ordre des thèmes.
- Sortie : `{ dimension, label, gagnantInsee, gagnantPalier, exposeInsee, exposePalier }` →
  une phrase descriptive, relative au trio, jamais un absolu inventé.
- Cas « une commune domine vraiment » (pas de vraie divergence) : sortie honnête « ce ne sont pas
  vraiment des compromis : {A} domine, et voici la seule raison qui ferait encore pencher pour {B} »
  (la meilleure dimension d'une autre commune).

Le bloc `resume` (leaderboard) **n'est plus utilisé** dans le résultat gratuit du mode choix.

## AskFuture en mode choix

Réutiliser le mécanisme de `/ou-vivre` (FREE_ASK = 2, `/api/comparateur-vie/ask`, gating serveur).
Différences à gérer (mode choix n'a pas de `parsed`/préférences) :
- **Contexte** : construit depuis le trio de `seedComparaison` (les narratifs qualitatifs scellés
  déjà présents : `identite`, `compromis`, `distinctive`, `signaux`, `logement`, `littoral`,
  `heritageIndustriel`…). `reformulation`/`criteres` → vides ou un libellé générique « départage de
  communes nommées ». Le firewall (que du qualitatif scellé) est préservé.
- **Pool de suggestions** : NOUVEAU, propre au mode choix (comparatif / risque / horizon), templaté
  sur les communes nommées. Ex. « Entre {A} et {B}, laquelle tient le mieux face aux canicules ? ».
  Retirer les questions « pourquoi le moteur a choisi/écarté » (vides de sens ici).
- FREE_ASK reste à **2** (« le même » qu'`/ou-vivre`, demande porteur). Instrumenter l'usage
  (PostHog) pour savoir s'il nourrit ou cannibalise le Pack ; bridage à 1 = décision ultérieure.

## Réemploi / refactor

- **`ComparaisonCompleteView`** : extraire le rendu d'une ligne/d'un thème (aujourd'hui `LigneRow`
  interne) en un sous-composant réutilisable, pour le thème dévoilé du gratuit. Pas de duplication.
- **Colonnes nommées** : même gabarit Serif + numéro que la vue payante.
- **`identite` / `compromis`** : déjà sur `MatchResult` (seedComparaison les remplit). Zéro calcul neuf.

## Hors scope (signalé, à trancher séparément)

- **Le `resume`-leaderboard GLOBAL** : les trois agents le jugent non conforme partout (il alimente
  aussi la vue payante `/ou-vivre` et `PackConvictionView`). Le refondre globalement touche le parcours
  payant → chantier distinct, à valider à part. Ici on ne fait que **cesser de l'utiliser** dans le
  gratuit mode choix.
- **Bug à corriger en passant** : `page.tsx` l.12, la `description` metadata contient deux tirets
  cadratins (interdits, `feedback_no_em_dash`) → virgule/deux-points.

## Bugs déjà corrigés (cette session, hors refonte)

- Menu déroulant de saisie qui passait sous le champ suivant (z-index du slot ouvert).
- Retours à la ligne « pour rien » du hero (`text-wrap: balance` + espaces insécables).

## Critères de réussite

- Plus aucun classement/leaderboard dans le résultat gratuit (conformité invariant n°2 / ADR-0001).
- Une commune ne peut plus « rafler tout » : signature + revers par commune (structurel).
- Le lecteur voit une vraie tension (fracture + offre/compromis) et un échantillon réel du produit
  (1 thème dévoilé), le reste honnêtement verrouillé.
- AskFuture branché (2 questions, contexte mode choix, suggestions adaptées).
- `tsc` + `eslint` propres ; `/ou-vivre` et le parcours payant inchangés (réemploi non destructif).

## Décisions tranchées (porteur, 2026-06-26)

1. **Thème dévoilé = celui de la fracture** (le plus parlant). Le thème qui contient la dimension
   de divergence maximale est entièrement révélé ; l'échantillon montre donc toujours une vraie tension.
2. **Voile = libellés seuls, verdict masqué.** Les 6 thèmes restants montrent titres + noms de
   critères (squelette réel), paliers/avantages voilés (cadenas). On NE montre PAS la `synthese`
   des thèmes verrouillés (protège le Pack, garde le mystère).
3. **`resume`-leaderboard global = plus tard, chantier séparé.** Ici on cesse seulement de l'utiliser
   dans le gratuit mode choix. Le nettoyage global (vue payante + `/ou-vivre`) sera validé à part.
