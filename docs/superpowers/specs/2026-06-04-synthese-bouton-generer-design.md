# Synthèse IA derrière un bouton « Générer » (flag) — design

Date : 2026-06-04
Statut : design validé (porteur), prêt pour plan d'implémentation.

## Intention

Pendant la phase de test (plateforme non indexée), deux synthèses Claude se déclenchent
**automatiquement** et consomment des tokens (donc de l'argent) à chaque test, sans action :

1. **Synthèse comparateur** (`/ou-vivre`) → `POST /api/comparateur-vie/synthesize`, auto-déclenchée
   par un `useEffect` après chaque recherche réussie (`OuVivreClient.tsx:312`).
2. **Synthèse quartier** (rapport) → `POST /api/synthesize-quartier`, auto-déclenchée par un
   `useEffect` à l'ouverture du rapport et à chaque changement d'horizon (`QuartierSynthesis.tsx:201`).

Objectif : mettre ces deux générations **derrière un bouton « Générer la synthèse »**, réversible
en un geste au lancement.

(Pour mémoire, déjà manuels ou hors sujet : synthèse Logement = déjà un bouton ; AskFuture et ask
comparateur = déclenchés par une question ; `parse` comparateur = acte de recherche, conservé.)

## Le flag

Helper partagé, client-safe :

```ts
// src/lib/auto-synthesis.ts
// Auto-déclenchement des synthèses Claude (comparateur + quartier). Par défaut OFF :
// le défaut sûr pendant la phase de test est « ne dépense pas ». L'auto ne s'active que
// si NEXT_PUBLIC_AUTO_SYNTHESIS vaut explicitement "true" (à poser au lancement, côté Vercel).
export const AUTO_SYNTHESIS = process.env.NEXT_PUBLIC_AUTO_SYNTHESIS === "true";
```

- `NEXT_PUBLIC_` : lisible côté client, inliné au build (par environnement sur Vercel).
- **Défaut (variable absente)** : `false` → bouton, jamais d'appel auto (« fail-closed » sur la dépense).
- **Lancement** : poser `NEXT_PUBLIC_AUTO_SYNTHESIS=true` → comportement auto d'origine.
- Un seul flag pour les deux points.

## Comportement

| `AUTO_SYNTHESIS` | Synthèse comparateur | Synthèse quartier |
|---|---|---|
| `true` | auto (inchangé) | auto (inchangé) |
| `false` (défaut) | bouton « Générer la synthèse », clic → génère | bouton « Générer la synthèse », clic → génère |

La **régénération** reste possible après une première génération manuelle (le bouton « régénérer »
du quartier existe déjà ; le comparateur peut re-cliquer). Le streaming, le firewall de données et
le contenu des prompts ne changent pas : on ne touche QUE le déclencheur.

## Points d'implémentation

### 1. `src/lib/auto-synthesis.ts` (créer)
La constante `AUTO_SYNTHESIS` ci-dessus.

### 2. `OuVivreClient.tsx` (synthèse comparateur)
- Le `useEffect` (~l.312) n'appelle `streamSynthesis(...)` automatiquement que si `AUTO_SYNTHESIS`.
- Sinon : on ne déclenche rien ; on expose un handler `generateSynthesis()` qui rejoue le corps
  actuel (recalcul de `top` depuis `matchOutcome.results` + `outcomeMeta`) et appelle
  `streamSynthesis(...)`.
- Dans la zone de synthèse, quand `phase === "results"`, `!synthesizing`, `!synthesis` et
  `!AUTO_SYNTHESIS` : afficher le bouton « Générer la synthèse » (`onClick={generateSynthesis}`).

### 3. `QuartierSynthesis.tsx` (synthèse quartier)
- Le `useEffect` (~l.201) n'appelle `fetchSynthesis(workbook, false)` que si `AUTO_SYNTHESIS`
  (la garde `inseeCode/communeName` reste).
- Quand `!AUTO_SYNTHESIS` et `synthState === "idle"` : afficher le bouton « Générer la synthèse »
  (`onClick={() => fetchSynthesis(workbook, false)}`), au même emplacement que le texte de synthèse.

## Vérification (pas de runner de test, cf. AGENTS.md)

1. `npx tsc --noEmit` + `npm run lint` (aucune erreur sur les fichiers touchés).
2. **Défaut (flag absent), sur le dev** :
   - `/ou-vivre` : lancer une recherche → les cartes s'affichent, **aucun** appel `synthesize`
     auto ; un bouton « Générer la synthèse » est présent ; au clic, la synthèse stream.
   - Rapport quartier : à l'ouverture, **aucun** appel `synthesize-quartier` auto ; bouton présent ;
     au clic, la synthèse stream ; changer d'horizon ne relance pas tout seul.
   - Témoin réseau : confirmer l'absence d'appel auto (onglet réseau navigateur, ou logs dev).
3. **Flag activé** (`NEXT_PUBLIC_AUTO_SYNTHESIS=true`, redémarrer le dev) : comportement auto
   d'origine restauré aux deux endroits (pas de bouton, génération au montage / après recherche).

## Hors périmètre

- `parse` (comparateur), Logement (déjà manuel), AskFuture / ask comparateur (déclenchés par
  question) : inchangés.
- Aucun changement de prompt, de firewall de données, de streaming ni de scoring.
- Pas de persistance d'un choix utilisateur (le flag est une bascule d'environnement, pas une
  préférence par utilisateur).

## Notes doctrine

Cf. [[synthesis_model_routing]] (routing Anthropic direct aujourd'hui ; ce flag est orthogonal,
il gate le DÉCLENCHEMENT, pas le routing). [[feedback_no_em_dash]].
