<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Largeur du texte : ne pas couper une phrase au milieu d'un bloc

La largeur de lecture est gouvernée par le **conteneur de page** (`max-w-[920px]` / `max-w-[1100px]` `mx-auto`). Ne plafonne **pas** un paragraphe de texte avec un `max-w-[NNNpx]` arbitraire **plus étroit que le bloc qui l'entoure** : la phrase wrappe à mi-bloc et laisse un vide à droite (effet « coupée en plein milieu »).

Règle :
- Texte dans une **carte / section bordée large** (`.glass`, fond, bordure) : il **remplit** le bloc, aucun `max-w` propre.
- Un `max-w-[NNNpx]` sur du texte n'est légitime que pour : le conteneur de page (`mx-auto`), un sous-titre de hero **mesuré en espace ouvert** sous un grand H1, ou un texte en **flex-row** qui partage sa ligne avec un autre élément (bouton, image).
- Robustesse typo FR : sur les phrases importantes, lier les petits mots (`le, les, leur, et, à, de…`) au mot suivant par une espace insécable (cf. `bindOrphans` dans `OuVivreClient.tsx`). `text-wrap: pretty` ne suffit pas (Safari l'ignore).

# Interface : une seule grammaire visuelle (le Relevé), une seule grammaire du mouvement (FUT-75)

`DESIGN.md` v3.0 : **le Relevé définit le langage visuel, FUT-75 définit le comportement dans le temps.**
Une seule grammaire ne veut pas dire un seul répertoire. Trois niveaux :

- **Primitives visuelles partagées** (ligne et marge, plaque, registre, grain, sélecteur, tableau,
  champ…) : `src/components/releve/`, sans connaissance d'un domaine, avec leurs tests.
- **Composants métier** (Logement, Territoire, comparaison, paiement…) : dans leur domaine. Ils
  composent les primitives et consomment les jetons `--r-*` / `--r-t-*` (`src/app/design-tokens.css`) ;
  ils ne créent ni couleur, ni taille de texte, ni rayon hors jetons.
- **Compositions de parcours** (pages, routes) : assemblent librement primitives et composants métier.

Un composant devient une primitive quand il exprime la grammaire sans savoir de quel domaine il parle,
et que deux domaines au moins en ont besoin.

- **Mouvement** : `src/lib/motion.ts` et les jetons `--m-*` sont la seule source (niveaux geste, état,
  structure ; le repère bouge, la donnée reste ; mouvement réduit = aucun déplacement ni ressort, état
  final immédiat). Aucune durée ni courbe nouvelle sans passer par eux. Attention au vocabulaire : un
  « mouvement » de page, dans le Relevé, est une **section de lecture**, pas une animation.
- Ne pas employer : `.glass`, `GlassCard`, `ReportSection` (`report/kit.tsx`, déprécié), capitales mono
  espacées, titre à suite en italique d'accent, emoji, couleur propre à une échelle ou à un module.
  Le test-cliquet `src/components/releve/canon.test.ts` (K1) échoue si un fichier en gagne. C'est un
  garde-fou approximatif, pas un juge esthétique : un faux positif se déclare dans
  `heritage-exceptions.json`, avec son motif ; la référence ne se modifie jamais à la main (une
  remontée sous le plafond n'est pas détectée par les tests : elle se refuse en revue).
- **Typographie** : Archivo en largeur normale. Aucun réglage `wdth` (la police servie n'a pas cet axe ;
  test K6).
- Les règles marquées **hypothèse** dans `DESIGN.md` (notamment la forme de la comparaison, § 13) se
  suivent par défaut et s'écartent en le justifiant ; les règles **stables** s'appliquent.
- Un lot censé ne rien changer à l'écran le prouve : `scripts/fut118/empreinte-visuelle.mjs` avant et
  après, puis `scripts/fut118/comparer-empreintes.mjs`. Cette preuve ne remplace pas les contrôles
  requis avant d'activer une surface (Safari, thème clair, vraie session, mouvement réduit).

# Sous-agents : ne jamais perdre leur travail si la session coupe

Le résultat d'un sous-agent ne vit que dans le transcript de la session. Une coupure (limite de session) pendant qu'il tourne, ou juste après son retour mais avant relais, fait perdre tout son calcul (des dizaines de milliers de tokens). Deux protections **systématiques** pour tout lancement de 2 sous-agents ou plus (audits, fan-out) :

1. **Persistance disque, dans la consigne de l'agent.** Demander à chaque agent d'**écrire son rapport final dans `docs/rapports-agents/<agent>/AAAA-MM-JJ-<sujet>.md` via son outil Bash, AVANT de rendre la main** (les agents read-only ont tous Bash ; convention détaillée dans `docs/rapports-agents/_README.md`). Le fichier survit à n'importe quelle coupure ; la session suivante n'a qu'à le relire.
2. **Lancement en arrière-plan.** Lancer les agents avec `run_in_background: true` : ils tournent détachés, ne bloquent pas, et la notification de fin re-déclenche le relais.

Au retour, l'orchestrateur relit `docs/rapports-agents/` plutôt que de se fier au transcript. Repartir de zéro n'est jamais nécessaire si les fichiers existent.

# Un seuil qui devient conditionnel rend conditionnel tout ce qui le cite

Le 25/07/2026, le seuil de signalement du climat a été dédoublé : un seuil pour répondre à une priorité **déclarée**, un plus exigeant pour un constat **non demandé**. Le paramètre a été branché au point de décision — la carte apparaissait bien aux bons seuils. Mais le TEXTE de la carte se construisait toujours avec `axe.notable`, figé sur le seuil déclaré, et la convention affichée annonçait ce même ancien seuil. Sur 31 % des communes concernées, la carte racontait un axe qu'elle n'avait pas retenu, sous une convention qu'elle n'appliquait pas.

Les tests passaient : ils vérifiaient qu'une carte **apparaît**, jamais ce qu'elle **raconte**.

Règle : quand une valeur qui gouvernait une décision devient conditionnelle (un paramètre, un mode, une exigence), chercher **tous** ses points de citation avant de committer — le point de décision, le texte rendu, les preuves jointes, la convention ou le seuil affichés au lecteur, les messages d'erreur. La liste se fait par `grep` sur la constante ET sur les champs dérivés (`notable`, `threshold`, un booléen pré-calculé au moment de construire les faits), pas de mémoire.

Corollaire : un champ pré-calculé en amont (`notable = projete >= seuil`) est un seuil figé qui se déguise en donnée. Dès qu'un seuil se dédouble, tout champ dérivé de l'ancien devient un piège — il continue de répondre à une question qu'on ne pose plus.

Corollaire de test : « la carte apparaît » et « la carte dit vrai » sont deux assertions distinctes. La seconde ne se déduit jamais de la première.
