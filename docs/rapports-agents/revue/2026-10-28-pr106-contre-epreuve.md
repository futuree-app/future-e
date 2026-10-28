# PR #106 — revue indépendante ciblée, 28 octobre 2026

**Verdict : GO sur `60409a97cb630b0cb43fcb819dd16f6c5b14a76c`. Aucun défaut bloquant trouvé.** Passage de Draft à Ready for review justifié. Aucun accord de fusion ou déploiement n'est donné par cette revue.

## Périmètre et indépendance

Relecteur distinct de l'auteur de la PR et de l'audit initial. Worktree détaché propre `review106`, tête vérifiée par Git. Base : `4d75603f0839c73962cce4ba1a169a31bc827531`.

Les instructions AGENTS.md et la documentation `node_modules/next/dist/docs/01-app/03-api-reference/05-config/01-next-config-js/output.md` ont été lues. Aucune nouvelle exploration générale Vercel, aucune mutation distante, aucune suppression de déploiement et aucun appel modèle payant.

Le diff applicatif contient **un seul fichier**, `src/lib/onrn-sinistralite.ts` : type du nom borné aux deux valeurs réellement appelées et deux chemins littéraux. La classification métier, le contenu des tables, les caches, le comportement d'erreur et tous les consommateurs demeurent identiques. `next.config.ts`, `vercel.json`, routes et composants n'ont pas été modifiés par #106.

## Vérifications et résultats

| Exigence | Contre-épreuve | Résultat |
|---|---|---|
| Ne plus embarquer tout `data/` | Comparaison de 163 traces réelles de la base et 163 traces d'un nouveau build de la tête | Neuf traces de données changent ; aucun include/exclude global ajouté |
| Présence des deux JSON ONRN | Inspection des chemins réels de chaque `.nft.json` consommateur ; lecture et copie des fichiers effectivement tracés | Les deux JSON sont présents dans les neuf consommateurs, et identiques octet pour octet à la base |
| Packaging isolé | Extraction et exécution de la fonction ONRN **minifiée réellement émise par le build**, sans retranspiler le lecteur pour cette contre-épreuve | Neuf dossiers temporaires isolés, chacun ne contenant que les deux données ONRN issues de la trace concernée ; seules ces deux lectures disque sont observées |
| Pas d'`indispo` silencieux pour une commune normalement disponible | Assertion que les 34 839 codes réels de l'union des deux tables sont disponibles, puis comparaison du résultat dans chaque paquet | Aucun code réel ne devient `indispo` ; les deux seuls états `indispo` correspondent aux deux périls du code sentinelle inconnu |
| Consultation, génération, actualisation | Traces de `/api/georisques-logement`, `/rapport`, `/api/stripe/webhook`, `/api/dossier/actualiser` ; consommateurs et chemins d'appel inchangés ; tests aval | Tables présentes, données conservées et tests ciblés verts |
| Métier strictement inchangé | Fonction ONRN compilée de la base contre fonction compilée de la tête, chaque code, dans chacun des neuf paquets | **313 560 comparaisons strictement égales** : 34 839 codes réels + 1 inconnu × 9 paquets |
| Aucune hypothèse non vérifiée de partage des bundles | Mesure des octets des fichiers explicitement listés dans chaque trace, avec répétitions | Le résultat est un cumul de traces ; aucune conversion en espace Vercel facturé ou économie garantie |

La fonction minifiée est chargée depuis le chunk SSR émis, avec une petite interface du chargeur Turbopack reproduisant uniquement l'interop des deux imports natifs (`fs/promises`, `path`), l'enregistrement des exports et `process.cwd()`. Aucun autre import n'est autorisé par le harnais. Son corps est exécuté sans réécriture. La fonction compilée de la base est chargée selon la même méthode. Le build de la tête est neuf ; l'artefact de référence de la base, sur son worktree propre au SHA contrôlé, est réutilisé pour ne pas recommencer l'audit.

Cette contre-épreuve va plus loin que le test ajouté par l'auteur : ce dernier trace le lecteur seul après transpilation ; ici les paquets proviennent des `.nft.json` des vraies entrées Next et le lecteur testé provient de la sortie minifiée.

## Mesures reproduites après build local

Tailles en octets de données tracées, hors code et dépendances :

| Entrée | Fichiers avant → après | Octets avant | Octets après |
|---|---:|---:|---:|
| `/rapport` | 2 313 → 2 230 | 300 701 408 | 131 141 583 |
| `/api/dossier/actualiser` | 2 313 → 10 | 300 701 408 | 91 175 919 |
| `/api/georisques-logement` | 2 313 → 3 | 300 701 408 | 20 537 198 |
| `/api/stripe/webhook` | 2 313 → 10 | 300 701 408 | 91 175 919 |
| `/dev/fut127` | 2 313 → 7 | 300 701 408 | 23 928 908 |
| `/dev/fut87/decision`, `/dev/fut91`, `/dev/fut92`, `/dev/fut93` | 2 313 → 10 chacun | 300 701 408 chacun | 91 175 919 chacun |
| **Cumul neuf traces** | | **2 706 312 672** | **722 663 203** |

Réduction reproduite : **73,297 %** des octets de données cumulés de ces neuf traces. Les nombreux shards BPE dans `/rapport` demeurent parce que d'autres lecteurs en ont besoin. Aucun retrait aveugle de ces données n'a été proposé. Les 154 autres traces n'ont pas de différence de leurs listes de données.

Résultats par paquet, sur les 69 680 valeurs de péril des 34 840 codes testés : 41 554 `aucun`, 3 578 `faible_repr`, 24 546 `lecture`, 2 `indispo` (sentinelle inconnue). Deux lectures disque par processus isolé, puis cache.

## Tests et build

- `npm run build` : **réussi, code de sortie 0**, prébuild, compilation, TypeScript et génération de 282 pages inclus. Next 16.2.4, Node 24.22.1. Build ID local : `TlXviY564wGqPM-lQnM2R`.
- Build avec variables factices Supabase/Stripe : aucune clé ni donnée de production utilisée. Les avertissements de connexion Supabase pour ERA5 sont attendus avec ce contexte de build ; ils ne concernent pas la lecture ONRN et n'empêchent pas le build.
- `node --test scripts/vercel/onrn-file-tracing.test.mjs src/lib/onrn-sinistralite.test.ts` : **9/9**.
- `node --test src/lib/decision/logement-coverage.test.ts src/lib/decision/logement-rules.test.ts src/lib/decision/inondation-lecture.test.ts src/lib/fut127-georisques-appels.test.ts src/lib/fut127-inondation-adresse.test.ts src/lib/logement-report-version.test.ts` : **110/110**.
- Harnais indépendant `node docs/rapports-agents/revue/pr106-contre-epreuve.cjs` : **313 560 égalités**, neuf paquets, contrôles de présence et de lecture OK.
- ESLint ciblé et `git diff --check` : sans erreur.

## Limites et défauts restants

**Aucune régression démontrée.** Le `catch` historique retourne toujours `{}` si un fichier réel manque ou est illisible : la PR ne crée ni ne résout ce comportement. Un contrôle négatif supprime volontairement le seul JSON sécheresse dans un paquet ; il produit `secheresse: indispo` et conserve `inondation: lecture` pour Toulouse, résultat identique avant/après. Les paquets complets ne rencontrent pas ce cas et ne masquent aucune commune réelle disponible.

Les contrats de génération et actualisation sont vérifiés par dépendances, présence des données et tests ciblés ; aucun paiement ni session réelle de production n'a été exécuté. Cette revue ciblée du lecteur ne se substitue pas à la recette du lot final sur Territoire, Où vivre, Dossier et Logement. Elle ne justifie aucun nouveau build Vercel de mesure.

La baisse cumulée de traces ne présume ni la compression Vercel, ni les groupes/déduplications internes, ni le délai de libération des anciens déploiements. Les montants 5,62 $ et 1,76 $ restent des scénarios de rétention, sans garantie de cette revue.

## Pièces de contre-épreuve

- `pr106-contre-epreuve.cjs` : harnais indépendant reproductible, échec si table requise absente, erreur de lecture ou divergence métier.
- `2026-10-28-pr106-mesures.json` : mesures des 163 traces, neuf paquets et résultats agrégés.
- Logs locaux : `/tmp/review106-build.log`, `/tmp/review106-tests.log`, `/tmp/review106-consumers.log`, `/tmp/review106-harness.log`, `/tmp/review106-lint.log`.

**Décision recommandée : passer #106 à Ready for review et l'inclure dans la PR de regroupement après validation des deux autres têtes. Ne pas fusionner ni déployer sans GO explicite du porteur.**
