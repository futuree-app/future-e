# ADR-0004 : Stack technique

- **Statut** : accepté
- **Date** : 2026-04-17
- **Source** : `Documentation Notion/.../02 7 — Journal des décisions produit`.

## Contexte

Projet solo, micro-entreprise, contrainte de coût forte au démarrage. Besoin d'un socle qui
porte du rendu éditorial, de la donnée géographique, du paiement et de la synthèse IA sans
infrastructure lourde.

## Décision

- **Front / app** : Next.js (App Router), déployé sur **Vercel**.
- **Base et auth** : **Supabase**.
- **Paiement** : **Stripe**.
- **Synthèse IA** : **Claude API** (routing modèle détaillé dans
  `/memory/synthesis_model_routing.md`).
- **Emailing** : **Buttondown** (newsletter) et **Resend** (transactionnel).
- **Contrainte** : tenir sous ~50 €/mois les 6 premiers mois.

## Pourquoi

Stack managé, peu d'ops, coût marginal proche de zéro à faible volume, et chaînes déjà
maîtrisées par le porteur.

## Conséquences et points de vigilance

- `AGENTS.md` signale que cette version de Next.js porte des **breaking changes** par
  rapport au Next.js « connu » : lire `node_modules/next/dist/docs/` avant d'écrire du code.
- Le routing de modèle Claude est une décision vivante à part (voir le memory dédié), pas
  figée ici.

## Liens

`architecture/`, `/memory/synthesis_model_routing.md`, `adr/ADR-0005-direction-artistique.md`.
