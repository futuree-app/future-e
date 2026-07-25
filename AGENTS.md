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
