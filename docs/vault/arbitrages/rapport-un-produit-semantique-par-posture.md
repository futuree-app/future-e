# Un seul produit structurel, sémantique par posture

**Date** : 2026-07-11 · **Statut** : arbitré (porteur), branché slice 1.

Le dossier garde UNE structure canonique en cinq sections pour toutes les postures. Seuls les titres,
le verbe d'engagement et certaines phrases changent. `intent === "achat"` seul déclenche la logique
acquéreur : analyser une adresse n'est pas acheter.

- `recherche` / `adresse` / intent `achat` : « avant de vous engager ».
- `habitant` : « ce que ces données invitent à comprendre ou surveiller », jamais « avant de vous
  engager » ni « décider de rester » (le cas habitant peut seulement chercher à comprendre).
- `recherche_quartier` : réservée, retombe sur `recherche`.

Le moteur est identique ; la posture ne change que la couche de libellés et la formulation des faits.
Séparation éventuelle en deux produits : attend le test miroir du lancement (cf.
`docs/vault/arbitrages/moat-assemblage-largeur-en-tunnel.md`).
Spec : `docs/superpowers/specs/2026-07-11-dossier-decision-materialite-design.md`.
