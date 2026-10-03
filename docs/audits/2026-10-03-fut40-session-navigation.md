# FUT-40, phase 0 : la session après une navigation vers une page publique

> Reproduction instrumentée, audit de la chaîne d'authentification, proposition de correction.
> **Aucun code produit modifié.** Branche `bonjourfuturee/fut-40-session-navigation`, partie de `main`
> `0f609a8c`. Aucun fichier de FUT-33 ni de FUT-34 touché.
>
> Doctrine du ticket : **une navigation interne ne doit jamais être la cause de la perte d'une session
> Supabase valide.**

---

## 1. Résumé exécutif

**La navigation `/rapport/quartier → /pourquoi → /rapport` ne fait pas perdre la session serveur, ni par
un `<a>`, ni par un `<Link>`, ni par Back, reload, URL saisie ou nouvel onglet.** Démontré sur le HEAD,
en local, avec la vraie application et une session Supabase reproduite à l'identique (§3).

Deux mécanismes réels expliquent en revanche qu'un utilisateur connecté se voie **demander de se
reconnecter**, et un troisième peut **réellement** effacer sa session :

1. **🔴 (perçu) La Navbar ne connaît pas la session.** Sur toute page publique, un utilisateur connecté
   voit « SE CONNECTER » et « COMMENCER » (au lieu de « Mon compte »), quel que soit le mode de
   navigation (`<a>` comme `<Link>`, vérifié). C'est un composant client sans état d'auth : les pages du
   compte lui passent leurs boutons, les pages publiques non.
2. **🔴 (perçu) `/connexion` ne vérifie pas la session.** Un utilisateur déjà connecté qui y arrive voit le
   formulaire de mot de passe (« Votre dossier vous attend. ») au lieu d'être renvoyé vers son espace.
   Combiné au point 1, le site **demande de se reconnecter à quelqu'un qui l'est**. C'est l'explication
   démontrée la plus directe du symptôme rapporté ; elle ne dépend ni de l'environnement ni du temps.
3. **🟡 (réel, conditionnel) Course de refresh.** Quand le client Supabase du navigateur (monté sur toutes
   les pages par `PostHogProvider`) et le proxy rafraîchissent **le même** refresh token presque en même
   temps, le second refresh est une réutilisation. Avec la tolérance Supabase par défaut (10 s), elle est
   acceptée et rien ne se perd (démontré). **Si la réutilisation est refusée** (tolérance dépassée ou
   désactivée), le refresh du proxy échoue, `auth-js` supprime la session, et **la réponse du proxy efface
   le cookie du navigateur** : vraie perte de session, redirection vers `/connexion` (démontré). En local,
   une compilation `next dev` lente peut allonger l'écart au-delà de 10 s ; hypothèse plausible, **non
   démontrée**.

La piste `<a>` vs `<Link>` est **réfutée** comme cause de perte de session. La piste « le proxy transmet
aux Server Components un en-tête `cookie` périmé après refresh » est **réelle dans le code mais sans effet**
sur Next 16.2.4 (Next réinjecte les cookies posés par le proxy, démontré) : fragilité, pas cause.

**Correction minimale recommandée** : (a) `/connexion` (et `/inscription`) renvoient un utilisateur déjà
authentifié vers sa destination ; (b) la Navbar affiche l'entrée du compte quand une session existe ;
(c) en préventif justifié, rétablir le motif Supabase dans `proxy.ts` (cookies rafraîchis visibles en aval
sans dépendre d'un mécanisme interne de Next). Décisions à valider en §23.

## 2. Résultat de reproduction

| Question | Réponse |
|---|---|
| Perte de session serveur par la navigation du ticket | **Non reproduite** (6 modes de navigation, session valide ou expirée) |
| « Demande de reconnexion » perçue | **Reproduite** : Navbar « Se connecter » sur page publique + `/connexion` qui affiche le formulaire à un utilisateur connecté |
| Perte de session serveur réelle | **Reproduite** sous une condition : refresh concurrent + réutilisation du refresh token refusée |
| Code modifié depuis l'observation du 30/09 | Non : aucun commit sur Navbar, `(auth)`, `auth/`, `lib/supabase`, `proxy.ts`, `user-account.ts`, `PostHogProvider` depuis le 20/09 |

## 3. Environnements testés

- **Local, HEAD `0f609a8c`, `next dev` (Next 16.2.4, Turbopack), `@supabase/ssr` 0.10.2, `auth-js` 2.103.3.**
- **Faux GoTrue local** (`scripts/diagnostic/fut40/`) : la connexion par un vrai compte n'était pas
  possible dans ce cadre (identité Supabase distante ; aucune saisie d'identifiants réels). Le faux
  serveur émet des sessions au **format Supabase exact** (cookie `sb-<ref>-auth-token`, préfixe
  `base64-`), applique la **rotation** des refresh tokens et la **tolérance de réutilisation** (10 s ou
  refus), et journalise chaque appel avec son origine (serveur ou navigateur). Toute la chaîne de
  l'application (proxy, `createServerClient`, Server Components, `createBrowserClient`, guard) est la
  vraie.
- **Navigateur réel** (Chrome) pour `<a>`, `<Link>`, Back/Forward, reload, URL saisie, nouvel onglet ;
  **requêtes document scriptées** pour les cas déterministes.
- **Preview / Production : non testées.** Impossible sans compte réel ; aucune donnée utilisateur touchée.
  Procédure proposée en §13.

## 4. Architecture auth actuelle

```
navigateur ── cookie sb-<ref>-auth-token (path=/, SameSite=Lax, Max-Age 400 j, non httpOnly)
   │
   ├─ src/proxy.ts (matcher : tout sauf _next/static, _next/image, favicon, images)
   │     createServerClient(cookies = request) → auth.getUser()  [refresh si besoin]
   │     setAll → request.cookies.set + NextResponse.next({ request: { headers: requestHeaders } })
   │             + response.cookies.set(...)   → Set-Cookie vers le navigateur
   │
   ├─ Server Components / routes : src/lib/supabase/server.ts
   │     createServerClient(cookies = next/headers cookies()) ; setAll → cookieStore.set (sans try/catch)
   │     guard : src/lib/user-account.ts requireCurrentUser() → getUser() → redirect("/connexion") si null
   │
   └─ Client : src/lib/supabase/client.ts createBrowserClient (autoRefreshToken par défaut)
         PostHogProvider (layout racine, toutes les pages) : getUser() + onAuthStateChange
         RepriseRecherche : getSession()
```

## 5. Clients Supabase

| Client | Fichier | Lit | Écrit | Refresh |
|---|---|---|---|---|
| Proxy | `src/proxy.ts` | `request.cookies` | réponse (`Set-Cookie`) + requête aval | oui, à chaque requête si le jeton expire sous 90 s |
| Serveur | `src/lib/supabase/server.ts` | `cookies()` (avec les cookies posés par le proxy, §6) | `cookieStore.set` : **lève une erreur dans un Server Component** (pas de `try/catch`) | possible si le proxy ne l'a pas fait |
| Navigateur | `src/lib/supabase/client.ts` | `document.cookie` | `document.cookie` | **oui, minuterie automatique** (toutes les 30 s ; refresh sous 90 s) |

## 6. Proxy et refresh de session

`src/proxy.ts` construit `requestHeaders` **avant** le refresh, puis, dans `setAll`, recrée
`NextResponse.next({ request: { headers: requestHeaders } })`. L'en-tête `cookie` transmis aux Server
Components est donc **l'ancien**. Ce motif date du 12/08/2026 (`79d609ba`, ajout de `x-futuree-url`) ;
avant, le proxy suivait le motif Supabase `NextResponse.next({ request })`.

**Effet mesuré : aucun.** Next 16 pose `x-middleware-set-cookie` quand le proxy écrit un cookie sur la
réponse, et `request-store.js` (`mergeMiddlewareCookies`) le fusionne dans `cookies()`. Mesuré : session
expirée → **un seul** refresh (proxy), puis la page lit le **nouveau** jeton (`GET /user` avec le jeton
renouvelé, deux fois : proxy et page). 🟡 : correct par un mécanisme interne de Next, et contraire au
motif documenté par Supabase.

Le proxy tourne aussi sur les pages publiques (`/pourquoi`) : un refresh peut s'y produire et le cookie y
est correctement renouvelé (démontré, cas « parcours-expire-sur-public »).

## 7. Layouts `(account)` / `(public)`

- `layout.tsx` racine : unique `<html>`, `PostHogProvider` (client Supabase navigateur), consentement,
  analytics. **Commun à tous les groupes** : aucun remontage du layout racine entre groupes.
- `(account)/layout.tsx` : `children` + `AskFutureMount` (serveur). **Aucun guard** ici.
- `(public)/layout.tsx` : `children` seul. `(auth)/layout.tsx` : habillage de connexion.

Passer `(account) → (public) → (account)` change de layout de groupe, remonte `AskFutureMount`, **ne
change ni de client Supabase ni de cookie**. Aucune perte de session ne vient des groupes (démontré :
tous les modes de navigation restent authentifiés).

## 8. Guards et redirects

| Lieu | Source de vérité | Côté | Si refresh nécessaire | Si échec |
|---|---|---|---|---|
| `requireCurrentUser()` (`/rapport/*`, `/compte/*`, `/dossier/merci`, routes `rapport/*`) | `getUser()` serveur | serveur | normalement fait par le proxy ; sinon tenté dans le Server Component, où l'écriture du cookie lève une erreur | `redirect("/connexion")` |
| `AskFutureMount`, `AskFutureInlineMount` | `getUser()` serveur | serveur | idem | widget masqué |
| `/connexion`, `/inscription` | **aucune** | — | — | affiche le formulaire, même connecté (🔴 perçu) |
| Navbar | **aucune** (composant client sans état d'auth) | client | — | affiche « Se connecter » sur les pages publiques (🔴 perçu) |
| `PostHogProvider` | `getUser()` + `onAuthStateChange` navigateur | client | **refresh automatique** | identification analytics |

Trois vérités parallèles : le guard serveur (juste), la Navbar (toujours « déconnecté » hors compte), la
page de connexion (toujours « à connecter »).

## 9. Navbar et modes de navigation

Liens plats (« Où vivre », « Mon rapport », « Mes biens », « Comparateur », « Pourquoi futur•e ») : `<a>`,
donc **rechargement de document**. Menus déroulants et boutons d'appel : `<Link>`, donc **navigation
client**. Vérifié dans le navigateur (marqueur `window` conservé avec `<Link>`, perdu avec `<a>`). Les deux
chemins conservent la session ; les deux affichent « Se connecter » sur une page publique.

## 10. Chaîne exacte `/rapport/quartier → /pourquoi → /rapport`

Session expirée au départ (cas le plus exigeant), requêtes document :

| Étape | Statut | Auth (journal du faux GoTrue) | Cookie |
|---|---|---|---|
| `/rapport/quartier` | 200 (redirection applicative vers `/rapport` : compte de test sans territoire) | proxy : refresh `rt7 → rt8` ; `GET /user` ×2 avec le jeton renouvelé | présent, **renouvelé** (Set-Cookie) |
| `/pourquoi` | 200 | proxy : `GET /user` 200 | présent, inchangé |
| `/rapport` | 200 | proxy + page : `GET /user` 200 | présent, inchangé |

Variante « le jeton expire pendant la visite de `/pourquoi` » : refresh **sur la page publique**, cookie
renouvelé, `/rapport` authentifié.

## 11. Cookies avant / après

| Attribut | Valeur |
|---|---|
| Nom | `sb-<ref>-auth-token` (un seul cookie ; découpé en `.0`, `.1` au-delà de ~3 180 caractères) |
| Domaine | hôte courant (aucun `Domain`) |
| Path | `/` |
| SameSite | `Lax` |
| Secure | non posé par défaut (`@supabase/ssr`) |
| Expiration | `Max-Age` 400 jours (le cookie survit ; c'est le jeton qu'il contient qui expire, 1 h) |
| Écrit par | proxy (`Set-Cookie`), client navigateur (`document.cookie`) ; jamais par un Server Component (impossible) |
| Lu par | proxy, Server Components (`cookies()`), client navigateur |
| Rotation | à chaque refresh (nouveau refresh token, l'ancien devient « utilisé ») |

Dans tous les parcours du §12 : présent avant, présent après ; rotation seulement quand le jeton
approchait l'expiration. Seul le cas « réutilisation refusée » le fait disparaître (`Set-Cookie`
d'effacement émis par le proxy).

## 12. Matrice de reproduction

| Cas | Mode | Résultat |
|---|---|---|
| A — `/rapport/quartier` → « Pourquoi futur•e » (`<a>`) → « Mon rapport » (`<a>`) | document | ✅ authentifié ; Navbar « Se connecter » sur `/pourquoi` |
| B — `/rapport` → « Explorer > Chaleur » (`<Link>`) → Back | client (même document) | ✅ authentifié ; Navbar « Se connecter » sur `/chaleur` |
| C — `/rapport` → page publique → Back / Forward | historique | ✅ authentifié |
| D — page publique → saisie `/rapport` | document | ✅ authentifié |
| E — reload sur `/rapport` | document | ✅ authentifié |
| F — `/rapport` dans un nouvel onglet | document | ✅ authentifié |
| G — utilisateur connecté → `/connexion` | document | 🔴 formulaire de connexion affiché |
| H — refresh concurrent, réutilisation tolérée 10 s | document | ✅ authentifié (session enfant renvoyée) |
| I — refresh concurrent, réutilisation refusée | document | 🔴 cookie **effacé** par la réponse du proxy ; `/connexion` |

## 13. Local vs Preview / Production

- Le mécanisme 🔴 perçu (Navbar + `/connexion`) est **identique partout** : il ne dépend que du code.
- La course de refresh (I) dépend de la **tolérance de réutilisation** du projet Supabase de production
  (réglage Auth « Refresh token reuse interval », 10 s par défaut, et la détection des jetons compromis).
  Non vérifiable ici : à confirmer dans le tableau de bord Supabase (§23).
- Spécificité locale plausible, **non démontrée** : en `next dev`, la première requête d'une route compile
  le proxy et la page ; si le client navigateur fait un refresh pendant qu'une requête partie avec l'ancien
  jeton attend sa compilation plus de 10 s, la réutilisation est refusée et la session est effacée.
- **Procédure Production proposée** (non destructive, par toi, compte réel) : DevTools ouvert, onglet
  Application > Cookies ; se connecter ; `/rapport/quartier` ; clic « Pourquoi futur•e » ; noter si la
  Navbar dit « Se connecter » ; clic « Mon rapport » ; vérifier que `sb-…-auth-token` est présent avant et
  après chaque étape. Puis laisser l'onglet ouvert > 1 h et refaire le parcours.

## 14. Hypothèses testées

| # | Hypothèse | Verdict |
|---|---|---|
| 1 | `<a>` natif | **Réfutée** comme cause de perte ; `<a>` et `<Link>` se comportent pareil pour la session |
| 2 | Refresh mal réécrit par le proxy | Réfutée en pratique (fusion Next) ; **fragilité** de code (§6) |
| 3 | Cookies (domain, path, SameSite) | Réfutée : un cookie, `Path=/`, `Lax`, même hôte |
| 4 | Layouts `(account)` / `(public)` | Réfutée : layout racine et client Supabase communs |
| 5 | Guard qui redirige trop tôt | Réfutée sur la navigation ; le guard redirige seulement si `getUser()` échoue (cas I) |
| 6 | État client seulement | **Démontrée** (Navbar, `/connexion`) |
| 7 | Bug disparu depuis le 30/09 | Non : code inchangé depuis le 20/09 |
| + | Course de refresh navigateur / proxy | **Démontrée sous condition** (réutilisation refusée) |

## 15. Cause racine

- **Démontrée** : l'application **présente un utilisateur connecté comme déconnecté** hors de son espace
  (Navbar) et **lui redemande ses identifiants** s'il suit cette invite (`/connexion` sans contrôle de
  session). Confiance : élevée sur le mécanisme ; moyenne sur le fait que ce soit exactement ce qu'a vécu
  le rapporteur le 30/09 (le récit dit « retour vers /rapport », qui est authentifié dans toutes nos
  mesures).
- **Démontrée sous condition** : perte réelle de la session par refresh concurrent quand la réutilisation
  est refusée. Confiance : élevée sur le mécanisme ; **inconnue** sur sa fréquence en production (dépend
  du réglage Supabase).

## 16. Classement

| Élément | Statut |
|---|---|
| Cookie Supabase (nom, path, SameSite, durée) | ✅ |
| Refresh par le proxy sur toutes les routes, y compris publiques | ✅ |
| Guard `requireCurrentUser()` | ✅ |
| Groupes de routes et layouts | ✅ |
| `<a>` dans la Navbar (rechargement complet) | ✅ pour la session (⚪ pour la performance) |
| En-tête `cookie` périmé transmis par `proxy.ts` (`requestHeaders`) | 🟡 |
| `server.ts` : `setAll` sans `try/catch` (lève dans un Server Component) | 🟡 |
| Client navigateur en refresh automatique sur toutes les pages (`PostHogProvider`) en parallèle du proxy | 🟡 (course, §12 H/I) |
| Navbar sans état d'authentification | 🔴 (perçu) |
| `/connexion`, `/inscription` sans contrôle de session | 🔴 (perçu) |

## 17. Correction minimale recommandée

1. **`/connexion` et `/inscription`** : si `getUser()` renvoie un utilisateur, `redirect(next ?? "/rapport")`
   côté serveur. Une ligne de garde, aucun changement d'auth.
2. **Navbar** : lui donner l'état « connecté / non connecté » **décidé côté serveur**, et afficher l'entrée
   du compte (« Mon compte », « Mon rapport ») quand il y a une session. Le plus petit chemin : la page (ou
   un petit composant serveur) passe un booléen ; à défaut, `onAuthStateChange` du client navigateur,
   déjà instancié par `PostHogProvider`.
3. **Préventif justifié, `proxy.ts`** : après `setAll`, transmettre en aval les cookies **rafraîchis**
   (recopier l'en-tête `cookie` de `request` dans `requestHeaders`, ou poser `x-futuree-url` sur
   `request.headers` et revenir à `NextResponse.next({ request })`). Le code redevient correct par
   lui-même, et non grâce à la fusion interne de Next.

Non recommandé dans FUT-40 : remplacer les `<a>` par `<Link>` (ne change rien à la session ; à décider
pour la performance, ailleurs).

## 18. Alternatives rejetées

- **`<a>` → `<Link>`** : ne corrige ni la Navbar ni `/connexion` ; masquerait seulement des rechargements.
- **Désactiver le refresh automatique du client navigateur** : supprime la course mais casse les pages
  longtemps ouvertes (les appels client échoueraient après 1 h) ; changement d'architecture.
- **`try/catch` dans `server.ts` seul** : utile (motif Supabase documenté) mais ne traite pas le symptôme ;
  à envisager avec le point 3.
- **Augmenter la tolérance de réutilisation** : réglage Supabase, pas une correction de code ; à vérifier
  plutôt qu'à modifier.

## 19. Plan exact d'implémentation (proposé)

1. `src/app/(auth)/connexion/page.tsx`, `src/app/(auth)/inscription/page.tsx` : garde serveur
   (`getCurrentSessionUser()` de `user-account.ts`) → `redirect(getSafeNext(next) ?? "/rapport")`.
2. Navbar : prop `session` (booléen) ou lecture client de l'état ; afficher « Mon compte » / « Mon rapport »
   à la place de « Se connecter » / « Commencer » quand la session existe. Points de montage : pages
   publiques (29) via un composant serveur commun, ou lecture client.
3. `src/proxy.ts` : propagation explicite des cookies rafraîchis en aval (préventif).
4. Rien d'autre (pas de `<Link>`, pas de layout, pas de modèle de comptes).

## 20. Matrice de tests

| Test | Type | Contrat |
|---|---|---|
| Garde de `/connexion` | intégration serveur (fonction pure extraite : utilisateur présent → destination) | un utilisateur connecté n'y voit jamais le formulaire |
| Navbar | unitaire (rendu avec / sans session) | « Se connecter » n'apparaît jamais avec une session |
| Proxy | unitaire sur la fonction `proxy` avec un faux GoTrue (outil versionné) | après refresh, la requête aval porte le **nouveau** cookie ; un seul refresh |
| Parcours | E2E navigateur (Playwright, faux GoTrue) | connecté → `/rapport/quartier` → `/pourquoi` (`<a>` et `<Link>`) → `/rapport` : toujours authentifié ; Navbar cohérente |
| Course | E2E ou intégration | refresh navigateur puis requête avec l'ancien jeton : authentifié avec la tolérance par défaut |

## 21. Risques de régression

- Garde de `/connexion` : une boucle si `getUser()` et le guard divergent (ex. compte sans ligne
  `user_accounts`). La destination par défaut doit être une page qui n'exige que l'authentification.
- Navbar : un état client initial « déconnecté » puis « connecté » ferait clignoter les boutons ; une
  décision serveur l'évite.
- Proxy : toucher le refresh exige de vérifier `x-futuree-url` (AskFuture dans le layout du compte).

## 22. Problèmes hors périmètre découverts

- ⚪ Les liens plats de la Navbar rechargent tout le document (performance, perte d'état client).
- ⚪ `server.ts` ne suit pas le motif Supabase (`try/catch` dans `setAll`) : sans effet tant que le proxy
  rafraîchit avant les Server Components.
- ⚪ `getBaseUrl()` (`auth/actions.ts`) préfère `VERCEL_PROJECT_PRODUCTION_URL` à l'hôte local quand il
  existe : en local avec cette variable, l'e-mail de confirmation renvoie vers la production (autre jeu
  de cookies). Non testé.

## 23. Questions à valider

1. **Le symptôme du 30/09 est-il bien celui-ci ?** Sur `/pourquoi`, la Navbar affichait-elle « Se
   connecter », et le retour s'est-il fait par ce bouton (ou par `/rapport`) ?
2. **Réglage Supabase de production** : quelle est la tolérance de réutilisation des refresh tokens, et la
   détection des jetons compromis est-elle active ? (Conditionne la gravité de la course, §12 I.)
3. **Périmètre de la correction** : garde de `/connexion` + Navbar consciente de la session (recommandé),
   et le préventif `proxy.ts` dans le même ticket ou à part ?
4. **Navbar** : décision serveur (prop, plus robuste, plus de points de montage) ou client
   (`onAuthStateChange`, un seul fichier, risque de clignotement) ?
5. **Test E2E** : introduire Playwright (absent du dépôt) avec le faux GoTrue, ou s'en tenir aux tests
   unitaires et d'intégration ?
