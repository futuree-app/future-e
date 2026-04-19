# future-e

Site de futur•e.

## Développement local

```bash
npm install
npm run dev
```

Puis ouvrir `http://localhost:3000`.

## Variables d'environnement

Le projet utilise actuellement :

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `ANTHROPIC_API_KEY` pour l'étape 10 du module Q&R
- `ANTHROPIC_MODEL` optionnel, sinon `claude-sonnet-4-6`
