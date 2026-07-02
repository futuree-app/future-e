# Rapport Design Critic — Rapport Territoire, états résidence/découverte
Date : 2026-07-01. Sujet : `/rapport/quartier`, retouches du jour (déplacement QuartierWorkbook,
retrait « Sources mobilisées », correctifs de largeur).

## Écran
Fichiers : `src/app/(account)/rapport/quartier/page.tsx`, `src/components/report/QuartierSynthesis.tsx`,
`src/app/(account)/compte/QuartierWorkbook.tsx`, `src/components/report/ReportRelationBanner.tsx`,
`src/components/report/TerritoryIdentityCard.tsx`.
Moment du parcours : première lecture du module Territoire (payant), juste après le passeport
territorial. Décision éclairée : comprendre ce que devient la commune (climat, risques) et, selon
la relation (résident / prospectif), soit enrichir la lecture avec du vécu, soit orienter la
lecture avec ses priorités. C'est le cœur du produit : la synthèse IA qui transforme des données
en récit personnel.

## Ce qui fonctionne
- Le geste de fond est juste : une seule variable structurante (`relation`) pilote une posture de
  lecture différente, pas un habillage différent. C'est fidèle à la doctrine (« un écran raconte
  avant d'expliquer », « le chiffre est contextualisé »). Le garde-fou anti-contamination
  (`isResidence` bloque tout workbook hors résidence, y compris le snapshot localStorage) est un
  bon réflexe d'honnêteté : on ne laisse pas une observation vécue ailleurs polluer une commune
  qu'on découvre.
- `ReportRelationBanner` est un bon pattern : discret, sous le contenu d'identité (« jamais un
  gate » dit le commentaire), texte factuel non alarmiste, correction en 1 clic sans quitter la
  page. Conforme à l'esprit invariant n°1 (on éclaire, le lecteur corrige lui-même sa situation).
- Le retrait du `max-w-[440px]` / `max-w-[480px]` sur les deux paragraphes de re-synthèse est une
  correction juste et conforme à la règle gravée (`feedback_text_maxwidth`, `doctrine/interface.md`
  §1) : un texte dans un bloc `.glass` doit remplir le bloc. Bon retrait.
- Le bloc « Préciser cette lecture » est bien écrit dans l'esprit doctrine : il annonce lui-même
  qu'il oriente l'attention « sans rien inventer » — une promesse de non-fabrication qui rassure
  sans jargon.
- Mini-nav horizons (pills 2030/2050/2100) : sobre, mono, un seul badge « recommandé » discret.
  Rien à retirer.

## Ce qui peut disparaître (ou doit être requestionné)
1. **Le retrait de « Sources mobilisées » est le point le plus sérieux de cette critique, et je
   suis en désaccord partiel.** Ce bloc affichait des chips de sources (DRIAS, Géorisques, CatNat…)
   dépendant de l'horizon sélectionné, sous la synthèse. Doctrine `design.md` : « Sources visibles
   à chaque affirmation significative. Jamais d'affirmation chiffrée sans citation de source. »
   `inventaire-design.md` liste comme signature n°… (accordéon sources) : « c'est là, et seulement
   là, que vivent provenance, méthode et limites » — mais ce « là » doit exister quelque part sur
   l'écran qui porte l'affirmation chiffrée. Après ce retrait, la synthèse IA (le texte qui parle
   de +4°C, de sécheresse, de trajectoire) n'a **plus aucun renvoi de provenance visible sur cet
   écran**. Ce n'est pas anodin : c'est le panneau qui porte le plus d'affirmations chiffrées de
   toute la page. Si ce n'est pas un oubli involontaire du refactor `relation`, il faut se
   demander : cette page a-t-elle un bloc Sources ailleurs (bas de page, drawer des cartes plus
   bas) qui prend le relais ? J'ai vérifié : les cartes de la section « Les grands signaux du
   territoire » (`QuartierAside`) ont chacune leur propre drawer/accordéon sources — mais la
   synthèse IA en tête de page, elle, n'en a plus aucun. **Verdict : retrait à documenter comme un
   choix (pourquoi le bloc chips ne servait pas), pas à laisser silencieux.** Si le bloc était
   vraiment un ornement bruyant (chips redondantes, jamais cliquées), le retrait est bon — mais
   alors il faut un mot dans le vault pour ne pas le refaire sans y repenser. Si c'était un
   dommage collatéral du déplacement de `QuartierWorkbook`, il faut le restaurer, probablement en
   position plus modeste (une ligne inline sous le dernier paragraphe, pas un bloc de chips à
   accordéon).
2. **`QuartierWorkbook` fermé par défaut (`open = false`) dans son nouvel emplacement est
   probablement le mauvais état par défaut.** Avant, en bas de page, un bloc replié était acceptable
   (zone de contribution optionnelle, après la lecture complète). Maintenant il est **sous la
   synthèse IA**, avant les grands signaux, avant AskFuture : structurellement, c'est présenté
   comme faisant partie du corps de la lecture (même séparateur `border-t`, même retrait que le
   bloc « Préciser cette lecture » qui, lui, est toujours ouvert). Fermé par défaut, à cet
   emplacement, il devient un readonly quasi invisible : une ligne de texte grisé (« Complétez les
   données publiques avec votre expérience du territoire ») coincée entre deux séparateurs, que le
   lecteur scanne et saute. Le risque n'est pas seulement « il ne l'ouvre jamais » : c'est que la
   **promesse de personnalisation résidence** (le produit dit : vos observations affinent la
   lecture) devient invisible en pratique. Sur ce point, l'asymétrie avec le bloc découverte (2
   champs, toujours visibles, jamais de clic requis) est un vrai défaut de cohérence : à
   emplacement structurel identique, un lecteur en résidence doit faire un geste supplémentaire
   qu'un lecteur en découverte n'a pas à faire, pour la variante qui a pourtant le plus de valeur
   (du vécu réel, pas des intentions déclaratives).
3. **Le vocabulaire ne correspond pas entre les deux blocs jumeaux : « Vos repères de terrain »
   vs « Préciser cette lecture ».** Ce n'est pas un problème en soi (les contenus diffèrent
   réellement : questions à choix fermé vs deux champs libres), mais couplé au even-emplacement et
   au même séparateur, ça crée une **incohérence de niveau visible** : le lecteur qui bascule
   entre communes (une en résidence, une en découverte) voit deux blocs de forme différente à
   l'endroit exact où il s'attend, par apprentissage, à retrouver le même geste. Le porteur pose
   lui-même la question dans la consigne : « faut-il harmoniser le repliable/ouvert et le
   vocabulaire ? » — je recommande de trancher, pas de laisser l'asymétrie non assumée (voir
   Cohérence ci-dessous).
4. **La duplication de composant workbook.** `QuartierWorkbook.tsx` vit dans
   `src/app/(account)/compte/` mais est maintenant importé et rendu dans le rapport (`compte` =
   nom de dossier qui suggère une page de profil, pas un composant du rapport). Ce n'est pas un
   sujet de design pur, mais l'emplacement du fichier raconte encore l'ancien état des lieux
   (avant le déplacement d'aujourd'hui) : à renommer/déplacer vers `components/report/` pour que
   le code corresponde à ce que voit le lecteur (chantier Software Architect, je le signale en
   passant, hors mon mandat de trancher).

## Conformité aux patterns
- Le pattern « Sources visibles à chaque affirmation significative » (`doctrine/design.md`) est
  cassé sur cet écran précis depuis le retrait du jour — voir point 1 ci-dessus. C'est le seul
  écart de pattern verrouillé (pas une tension ouverte, un principe explicite).
- Le pattern « repliable après la lecture, geste de contribution » (l'ancien emplacement en bas de
  page) a changé de rôle en changeant de place, sans que son état par défaut ait été requestionné.
  C'est un écart silencieux, pas voulu comme tel je pense (le commentaire code dit « symétrie »
  mais ne tranche pas ouvert/fermé).
- Le bandeau `ReportRelationBanner` est un bon exemple du pattern « correction en place, jamais un
  gate », cohérent avec le reste du produit (le drawer qui ne quitte jamais la page).

## Honnêteté du signal
- **État résidence** : la synthèse affirme des faits chiffrés (horizon climatique, trajectoire)
  sans renvoi de source visible sur cet écran depuis le retrait du jour (cf. point 1). C'est la
  seule vraie fissure d'honnêteté du signal que je relève, et elle est nouvelle (introduite
  aujourd'hui).
- **État découverte** : le bloc « Préciser cette lecture » dit explicitement qu'il n'invente rien
  et se contente d'orienter l'attention — c'est une bonne discipline anti-fausse-certitude, il
  nomme sa propre limite au lecteur au lieu de la cacher.
- Pas de score global implicite détecté sur cet écran. Pas de précision décorative repérée dans le
  texte streamé (hors mon mandat de juger la prose elle-même).
- Le passeport territorial (`TerritoryIdentityCard`) affiche « Sources · INSEE / OSO » en petit,
  discret — bon exemple de source visible sans bruit.

## Incohérences visibles
- Aucune incohérence de radius/couleur/thème choquante à l'œil entre `QuartierWorkbook` (couleurs
  en dur, `style={{}}`) et le reste du panneau (`glass`, Tailwind) : les deux rendent la même
  palette sombre (`#060812`, bordures blanches à 8%, orange/bleu/vert identiques aux tokens), donc
  pas d'incohérence VISIBLE au sens de la doctrine — juste une différence de méthode, hors mandat
  (option A tranchée). Je le note seulement parce que le porteur demande explicitement d'y
  regarder : rien à signaler, la teinte est identique au pixel près.
- Le bouton toggle de `QuartierWorkbook` (pilule mono, `Compléter ▼` / `Réduire ▲`) est visuellement
  cohérent avec les pills d'horizon du composant parent (même famille mono/pilule), bon point.
- Rien à signaler sur la largeur après les deux correctifs du jour (620px et suppression du 480px).

## Signalements éditoriaux (sans réécrire)
- Aucun interdit visible (pas de tiret cadratin, pas d'exclamation, pas d'emoji) repéré dans les
  fichiers lus aujourd'hui.
- `QuartierWorkbook`, footer : « Les données racontent une partie de l'histoire. Ce que vous
  observez raconte le reste. » — jolie ligne, cohérente avec la doctrine « le texte porte le
  sens », rien à signaler comme défaut de forme.

## Verdict par état
- **Résidence : À AJUSTER.** Le fond est bon (garde-fou anti-contamination, posture correcte),
  mais deux défauts concrets pèsent sur la décision du lecteur : (a) perte du renvoi de source sur
  la synthèse elle-même (honnêteté du signal, le plus sérieux), (b) `QuartierWorkbook` fermé par
  défaut risque de rendre invisible la fonctionnalité qui fait la valeur différenciante de l'état
  résidence.
- **Découverte : CONFORME.** Le bloc « Préciser cette lecture » est propre, honnête sur sa propre
  limite, bien placé, largeur correcte après le correctif du jour. Rien à retirer.

## Cohérence (tensions à trancher par le porteur, pas par moi)
1. Harmoniser ou assumer l'asymétrie repliable/toujours-ouvert entre les deux blocs jumeaux. Les
   deux options sont défendables (le contenu diffère réellement en densité), mais aujourd'hui
   personne n'a tranché explicitement lequel des deux comportements est le bon état par défaut à
   cet emplacement précis (sous la synthèse, pas en bas de page).
2. Le vocabulaire « Vos repères de terrain » vs « Préciser cette lecture » : deux titres pour deux
   gestes qui, à l'usage, joueront le même rôle perçu (« la case pour personnaliser »). Nommer si
   c'est voulu ou à harmoniser reste au porteur.
3. Rentre dans la tension déjà ouverte n°4 de l'inventaire (largeur de lecture non auditée écran
   par écran) : les deux correctifs du jour (440→620, retrait du 480) la referment localement,
   bien.

## Mise à jour de l'inventaire proposée
À ajouter dans `inventaire-design.md`, section patterns d'écran ou tensions ouvertes (prêt à
copier) :
> **Sources visibles doit survivre aux refactors de posture.** Le retrait du bloc « Sources
> mobilisées » de `QuartierSynthesis` (2026-07-01, lors du refactor résidence/découverte) a
> laissé la synthèse IA du rapport Territoire sans renvoi de provenance visible sur son propre
> écran, alors que `doctrine/design.md` l'exige à chaque affirmation chiffrée significative. Point
> de vigilance générique pour tout futur refactor de ce panneau : si une source disparaît d'un
> écran, vérifier qu'un accordéon ou une ligne équivalente prend le relais ailleurs sur le MÊME
> écran, pas seulement dans un composant voisin (les drawers des cartes plus bas ne couvrent pas
> les affirmations de la synthèse elle-même).

## Version minimale (90% de la valeur, correction la plus simple)
Deux micro-ajustements, pas une refonte :
1. Remettre une ligne de provenance courte sous la synthèse (pas nécessairement le bloc de chips
   d'origine, une phrase mono discrète suffit : « Sources : DRIAS, Géorisques, CatNat » selon
   l'horizon, sans accordéon si le porteur juge que l'accordéon était le bruit). Résout le point 1
   sans réintroduire ce qui ne marchait pas.
2. Ouvrir `QuartierWorkbook` par défaut (`open = true`) uniquement dans son nouvel emplacement sous
   la synthèse (un prop `defaultOpen`), en laissant fermé par défaut si le composant est un jour
   réutilisé ailleurs en bas de page. Résout le point 2 sans toucher au contenu des 5 questions.

## Quand rouvrir ce sujet
- Si les événements PostHog `workbook_opened` / `workbook_completed` montrent un taux d'ouverture
  très faible en résidence après ce déplacement (comparé à l'ancien emplacement en bas de page) :
  confirme le risque du point 2, agir immédiatement (ouvrir par défaut).
- Si un utilisateur ou un test manuel signale un doute sur la fiabilité d'un chiffre de la
  synthèse (« d'où ça sort ? ») : confirme la fissure du point 1, prioriser la remise en visibilité
  d'une source.
- Si le porteur constate qu'aucun lecteur en résidence ne remplit jamais les repères de terrain
  malgré l'ouverture par défaut : alors le vrai problème n'est pas l'état ouvert/fermé mais la
  charge perçue des 5 questions à cet emplacement (à re-regarder, cette fois côté longueur/densité
  plutôt que côté visibilité).
