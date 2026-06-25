# Mentions légales et commerciales

> Règle durable. Fiche miroir : `/memory/feedback_tva_franchise.md`.

## Franchise en base de TVA

Le porteur est en micro-entreprise, en **franchise en base de TVA** : il ne facture aucune
TVA. Ne jamais écrire « TVA incluse » sur un écran de vente (rapport 14 €, Pack 39 €,
checkout, `/merci`, factures et reçus).

- **Pourquoi** : afficher « TVA incluse » alors qu'aucune TVA n'est facturée est une
  incohérence juridique, repérée à l'audit du 2026-06-07 (paywall rapport et checkout).
- **Mention attendue** : « TVA non applicable, art. 293 B du CGI ». Forme courte « TVA non
  applicable » acceptable sur une puce étroite.
- **Corrigé sur `main`** : `debloquer/page.tsx` et `checkout/[product]/page.tsx`. Vérifier
  toute nouvelle surface de prix.

## Liens

Modules concernés : `modules/comparateur.md` (Pack Décision), paywall territoire.
