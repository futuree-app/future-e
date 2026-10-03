# Diagnostic FUT-40 : session et navigation

Outil de reproduction **sans aucune donnée réelle** : un faux GoTrue local émet des sessions fictives au
format Supabase (rotation des refresh tokens, réutilisation tolérée 10 s ou refusée) et journalise chaque
appel, avec son origine (serveur ou navigateur).

```bash
# 1. Faux GoTrue (REUSE=allow10s, défaut Supabase, ou REUSE=reject)
INST=a REUSE=allow10s node scripts/diagnostic/fut40/mock-gotrue.mjs > /tmp/mock.log 2>&1 &

# 2. L'application, branchée sur le faux GoTrue (valeurs fictives uniquement)
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54399 NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=mock \
SUPABASE_SERVICE_ROLE_KEY=mock NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN=phc_mock \
NEXT_PUBLIC_POSTHOG_HOST=http://127.0.0.1:9 STRIPE_SECRET_KEY=sk_test_mock ANTHROPIC_API_KEY=mock \
npx next dev -p 3140

# 3. Scénarios (le 1er argument est le dossier qui contient mock.log)
node scripts/diagnostic/fut40/scenario.mjs /tmp <cas>
#   doc-valide | doc-expire | parcours-doc | parcours-expire-sur-public | course
```

Le scénario n'affiche jamais une valeur de cookie : seulement sa présence, sa longueur et une empreinte.
Le cookie s'appelle `sb-127-auth-token` parce que le faux GoTrue écoute sur 127.0.0.1.
