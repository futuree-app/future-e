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
