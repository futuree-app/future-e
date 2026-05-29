# TODO — cache des synthèses IA (Phase 2)

## Pourquoi

Les routes `/api/synthesize-quartier` (et bientôt `/api/synthesize-logement` une fois migrée) appellent Claude Sonnet 4.5 via Vercel AI Gateway à chaque visite de l'utilisateur. Aujourd'hui, sans cache :

- Coût payé pour chaque génération, même si la commune et l'horizon n'ont pas changé.
- Latence perçue : ~1,5 à 3 s avant le premier token, multiplié par chaque visite.
- Les coûts vont croître linéairement avec le volume — non scalable une fois les abonnements lancés.

Le prompt système est long et identique pour tous les utilisateurs, donc le prompt caching de Vercel AI Gateway le mettra en cache automatiquement (réduction ~90% du coût des tokens d'entrée du système après la première fois sur une fenêtre 5 min). Mais le coût des tokens de sortie reste plein, et la régénération du même contenu reste inutile.

## Clés de cache visées

| Module | Clé de cache |
|---|---|
| Quartier | `(insee_code, horizon)` — la même commune × le même horizon donne la même prose |
| Logement | `(ban_id, dpe_etiquette, hash_risques_geo)` — la prose change si l'adresse change, si le DPE change, ou si les risques Géorisques évoluent |

## Implémentation possible

**Option A — Vercel Runtime Cache (recommandé)**
- API : `unstable_cache` ou `cache` du runtime Vercel
- Ephémère per-région, invalidation par tag
- Tag par `commune:{insee}` pour invalider tout un coup quand une donnée publique change

**Option B — Table Supabase `synthesis_cache`**
- Colonnes : `cache_key text PRIMARY KEY`, `prose text`, `generated_at timestamptz`, `expires_at timestamptz`
- TTL côté requête (`expires_at > now()`)
- Re-stream depuis la base si hit, sinon regenerate
- Avantage : persistance illimitée, observable, simple à invalider

**Option C — Vercel Blob ou KV** (déprécié, ne plus utiliser per Vercel knowledge update)

## Stratégie d'invalidation

- TTL par défaut : 30 jours
- Invalidation manuelle quand une source publique majeure change (DRIAS annuel, Géorisques par commune, VigiEau quotidien)
- VigiEau étant dynamique (niveau de restriction peut changer de jour en jour), TTL Quartier réduit à 24 h tant qu'un arrêté est en cours

## Ce qui doit être fait avant le scale

1. Instrumenter le coût par requête (Vercel AI Gateway le fait nativement — vérifier dashboard)
2. Mesurer le hit rate théorique sur un échantillon réel : combien de visites partagent (insee × horizon) ?
3. Choisir option A ou B selon volumétrie
4. Migrer les routes `synthesize-*` derrière le cache
5. Mettre à jour `SOURCES_MODULES_MATRIX.md` pour mentionner que les synthèses sont cachées

## Statut

À faire après la mise en ligne de la Phase 1 (synthèse Quartier streamée par défaut), une fois qu'on a des données réelles de coût et de hit rate.

---

*Document futur·e · à supprimer une fois le cache implémenté.*
