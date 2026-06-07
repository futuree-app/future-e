# Paywall territoire (rapport 14 €) — refonte conviction

Date : 2026-06-07
Statut : design validé en brainstorming, prêt pour writing-plans
Branche cible : `feat/paywall-territoire` (merge ff-only sur main)

## 1. Contexte

La page `src/app/(public)/territoire/[insee]/debloquer/page.tsx` est atteinte quand l'utilisateur
clique « Découvrir ce territoire » sur une fiche du comparateur `/ou-vivre`. Elle débloque le
rapport d'une commune (14 €, paiement unique, rattaché au compte). C'est le point 9 de la roadmap.

État actuel : un checkout fonctionnel. Hero générique (« Le rapport complet de {commune} »), un
paragraphe, une liste de features génériques (`getCheckoutProduct("rapport-complet").features`,
qui parle de « 6 modules »), puis le panneau Stripe (`TerritoryUnlockPanel`). Aucun contexte
commune, aucune preuve de produit, aucune relance du désir. La page demande l'argent avant d'avoir
rallumé l'envie.

Au moment du clic, l'utilisateur n'est pas en mode « acheter un rapport », il est en mode « cette
commune m'intrigue, dis-m'en plus ». La page doit prolonger cette curiosité, pas afficher Stripe.

**Contrainte produit déterminante.** Les modules du rapport ne sont pas finis : module **Quartier**
bien avancé (niveau commune), **Logement** partiel et surtout lié à une adresse/bien précis, et
**métier / santé / mobilité / projets** pas encore construits. La page ne doit donc PAS promettre
de modules inexistants, ni flouter du faux. L'honnêteté joue dans les deux sens : survendre serait
la vraie trahison de l'esprit futur·e (et un risque de déception/remboursement après paiement).

## 2. Objectif

Transformer la paywall en **dernière étape de conviction** plutôt qu'en caisse : remettre
l'utilisateur dans le contexte de son clic, lui montrer une **preuve réelle** de ce que futur·e a
analysé sur cette commune (le seul module prêt et niveau commune : Quartier), expliquer ce qu'il
débloque et pourquoi c'est payant, et finir par un CTA en langage produit. Le tout honnête sur le
périmètre réellement livré aujourd'hui.

On vend la décision (« est-ce que cette commune est vraiment une bonne option pour mon projet ? »),
pas une liste de fonctionnalités.

## 3. Doctrine

- **Honnêteté absolue** : on ne montre que du vrai (extraits réels), on ne promet que ce qui est
  livré. Aucun faux aperçu, aucun module non construit annoncé.
- **Décrire, pas juger** ; **pas de chiffre dans l'aperçu** (cohérent partout dans futur·e).
- **Langage produit jusqu'au bout** : le CTA dit « Débloquer le rapport de {commune} », jamais
  « Payer ».
- **Frontière intrigue / réponse** : l'aperçu intrigue (le constat), le rapport répond (l'analyse,
  les compromis, les actions).
- Pas de tiret cadratin ; largeur de texte gouvernée par le conteneur de page.

## 4. Décisions de conception (validées)

- **Personnalisation hybride.** L'aperçu et la copie parlent de la commune en soi par défaut
  (fiable depuis le seul INSEE), ET ajoutent une touche personnalisée SI le projet de vie est
  disponible côté client. La page est serveur et n'a que l'INSEE + le nom ; le projet vit côté
  client. On le fait transiter via `localStorage` (libellés de préférences, déjà client-safe), lu
  par un composant client qui ajoute UNE ligne perso. Absent : rien de perso, l'aperçu commune
  suffit. Aucune donnée profonde ne transite.
- **Bloc preuve = aperçu des modules prêts uniquement.** En V1, l'aperçu tease le module
  **Quartier** (réel, niveau commune, le plus avancé). Logement n'entre pas dans l'aperçu V1 (lié à
  une adresse, pas previewable depuis l'INSEE seul). On ne mentionne pas les modules à venir.
- **Révéler / retenir.** On révèle la première phrase de **constat** réelle de chaque carte
  d'aperçu, puis fondu + cadenas avant l'analyse. Assez pour prouver la matière et créer la tension,
  pas assez pour répondre à la décision.
- **Mise à jour de l'offre.** La liste de features (`checkout-products`, « 6 modules ») est
  corrigée pour refléter le périmètre réel (le rapport quartier/territoire et ce qui s'enrichit),
  afin de ne pas survendre.

## 5. Architecture et flux de données

Tout reste server-first ; le perso est une petite surcouche client.

- `debloquer/page.tsx` (modifier) : orchestration. Récupère l'INSEE + nom (déjà fait), appelle la
  fonction d'aperçu, rend les sections, garde le `TerritoryUnlockPanel` Stripe et le flux
  connexion/inscription existants.
- **`getQuartierPreview(insee)`** (créer, serveur) : renvoie les données d'aperçu du module Quartier
  pour un INSEE : un petit ensemble de cartes `{ titre, constat }` où `constat` est une phrase
  déterministe et sans chiffre, GATÉE sur la présence réelle de la donnée (réutilise
  `gatherCommuneEnrichment(insee)`, déjà INSEE-based, et `deriveQuartierSources` pour les chips de
  sources réelles). **Garde-fou latence obligatoire** : une paywall doit rester rapide ; l'appel
  est plafonné (~1,2 s) par un `Promise.race` avec timeout, renvoie `null` au-delà ou en cas
  d'erreur, et ne bloque jamais le rendu. `null` = la page masque le bloc preuve (pas de vide).
- **`TerritoryUnlockPreview`** (créer, serveur) : présentation pure des cartes d'aperçu (titre +
  constat tronqué + fondu + cadenas). Aucune logique de données.
- **`PersonalTouch`** (créer, client) : lit `localStorage` (clé `futuree:projet:labels`), si présent
  affiche une ligne « Vu vos priorités : {labels} … » en tête de l'aperçu ; sinon ne rend rien.
- `OuVivreClient.tsx` (modifier) : avant de naviguer vers `debloquer` (handlers `onExplore`), écrit
  `localStorage["futuree:projet:labels"]` = libellés humains des préférences via
  `preferencesToLabels` (déjà client-safe, cf. `comparateur-labels`). Best-effort, jamais bloquant.
- `checkout-products` (modifier) : `features` du produit `rapport-complet` réécrites au périmètre
  réel.

Le contenu profond du rapport, le paiement, l'activation restent inchangés.

## 6. Structure de page

Ordre pensé pour convaincre AVANT de demander l'argent :

1. **Hero de continuité.** Eyebrow « Rapport de territoire · {commune} · 14 € une fois ». Titre type
   « Avant de choisir {commune}, regardez ce que les données racontent vraiment. » Sous-texte qui
   remet en contexte (« Vous avez vu pourquoi {commune} ressort. Le rapport va plus loin : … »).
2. **Ce que le rapport vous permet de vérifier.** 3 cartes, formulées sur ce qui existe réellement
   (comprendre le territoire / **situer les principaux compromis** / poser vos questions), sans
   lister de modules non construits. « Situer » et non « mesurer » : mesurer les compromis, c'est
   le Pack Décision 39 €, pas le rapport 14 €.
3. **Aperçu du rapport** (`TerritoryUnlockPreview`). Cartes Quartier avec extraits réels tronqués +
   fondu + cadenas. La ligne `PersonalTouch` s'insère en tête si un projet est en `localStorage`.
   Masqué entièrement si `getQuartierPreview` renvoie `null`.
4. **Poser vos questions (AskFuture par l'exemple).** 3 à 5 questions concrètes sur {commune}
   (« {commune} est-elle adaptée à mon projet ? », « Quels compromis surveiller ? », « Que vérifier
   avant d'acheter ou louer ? »). Vend l'usage, pas la fonctionnalité.
5. **Pourquoi 14 € + réassurance.** Bloc honnêteté (« vous ne payez pas la donnée publique, vous
   payez son croisement, sa mise en lisibilité et son application à votre projet ») + réassurance
   visible (« Aucun engagement. Acheter ce rapport n'ajoute pas {commune} comme commune de
   résidence. »).
6. **CTA paiement.** Le `TerritoryUnlockPanel` existant, précédé d'un titre de conviction en
   langage produit « Explorer le rapport de {commune} » (« explorer/lire », pas « débloquer » qui
   sonne SaaS). Le bouton de paiement lui-même (dans `PaymentWrapper`) peut rester « Payer 14 € »
   au moment de l'acte d'achat (réassurance bancaire). Flux compte/connexion inchangé.

## 7. Hors périmètre

- Le paywall du **Pack Décision 39 €** (comparaison complète + AskFuture pack + 3 pistes) : spec à
  part.
- **Finir les modules** du rapport (métier, santé, mobilité, projets, logement complet) : c'est le
  vrai levier de fond, mais c'est un autre chantier ; la paywall ne vend que ce qui existe.
- Aperçu du module **Logement** (lié à une adresse) : reporté.
- Un **exemple de rapport d'une autre commune** : écarté (l'utilisateur veut cette commune ; on lui
  montre cette commune en vrai).

## 8. Risques et points ouverts

- **Faisabilité de `getQuartierPreview(insee)`** : le module Quartier vit dans l'espace compte et
  peut dépendre d'un contexte utilisateur/commune sauvegardée. Extraire son contenu pour un INSEE
  arbitraire sur une page publique demandera peut-être d'isoler une fonction de données réutilisable.
  À confirmer/cadrer au plan ; repli propre = masquer le bloc preuve si indisponible.
- **Sobriété** : tant que le rapport est surtout « Quartier », l'aperçu sera sobre. C'est le prix de
  l'honnêteté, assumé.
- **localStorage** : clé `futuree:projet:labels`, valeur = tableau de libellés humains (client-safe).
  Best-effort, pas d'échec bloquant, pas de donnée sensible. Pas de correspondance stricte à
  l'INSEE (la ligne perso reste générique : « vu vos priorités … »).

## 9. Critères de succès

- La page remet en contexte (hero de continuité), montre une **preuve réelle** (aperçu Quartier
  tronqué) quand elle existe, explique ce qu'on débloque et pourquoi c'est payant, et finit par un
  CTA en langage produit.
- Aucun module non construit n'est promis ; la liste de features reflète le périmètre réel.
- Aucun faux extrait, aucun chiffre dans l'aperçu.
- La touche personnalisée apparaît quand le projet est disponible, et la page reste correcte et
  honnête quand il ne l'est pas.
- Paiement, activation et flux compte inchangés et fonctionnels.
