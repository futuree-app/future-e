# Board Logement, revue critique — Software Architect (2026-07-07)

Question canonique : si le porteur reprend ce code dans six mois sans mémoire, le comprend-il
et peut-il le faire évoluer ? Doctrine lue : ADR-0004 (stack), AGENTS.md (Next à breaking
changes, doc vérifiée dans `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/after.md`),
invariants. Code lu : LogementModule.tsx (1194 l.), LogementSynthesis.tsx, ThermalComfortSection.tsx,
synthesize-logement/route.ts, synthesize-quartier/route.ts, georisques-logement/route.ts,
logement-autour/route.ts, logement-store.ts, logement-synthesis-cache.ts, logement-autour-types.ts,
thermal-evidence.ts, supabase/17 + 20, page.tsx du module, auto-synthesis.ts.

## Périmètre

- **Entrée** : `src/app/(account)/rapport/logement/page.tsx` (gate serveur `canAccessCompleteReport`,
  puis rend `LogementModule`).
- **Client** : `LogementModule.tsx` orchestre tout (fetch `/api/georisques-logement`, machine à
  états DPE, fetch `/api/logement-autour`, gating et déclenchement de `LogementSynthesis` qui
  poste `/api/synthesize-logement`).
- **Serveur** : `georisques-logement` (fan-out ~10 API externes, stateless), `logement-autour`
  (snapshot Face 3, cache tuile OSM service-role, upsert table `logement`), `synthesize-logement`
  (cache par hash, streamText Sonnet 4.6, persistance `after()`), `logement-dpe` (non relu ce run).
- **Persistance** : table `logement`, PK `(user_id, insee)`, colonnes snapshot + DPE figé + synthèse.

## Ce qui est sain (à préserver)

1. **Le cache de tuile OSM mutualisé service-role** (`logement-autour`) : donnée partagée entre
   utilisateurs, timeout court + réchauffage `after()`, retry unique côté client. C'est le choix
   le plus robuste du module et il est **réutilisable tel quel** par Santé/Mobilité au grain adresse.
2. **Les libs pures** : `thermal-evidence.ts` (dérivation ordonnée, la méthode prime, commentée),
   `logement-synthesis-cache.ts` (deux fonctions pures, testables), `logement-autour-types.ts`
   (foyer canonique des types, anti-imports en avant). Un futur-moi les relit en cinq minutes.
3. **La doctrine dans le code** : les commentaires portent le POURQUOI (ADR-0001 sur le verdict
   retiré, « jamais prédictif », frontière Santé). C'est exactement ce qui réduit le temps de reprise.
4. **`after()` pour la persistance post-stream** : usage conforme à la doc installée (route
   handler, exécution après réponse). Le principe est bon ; c'est le *contenu* persisté qui a
   une faille (voir critique 2c).
5. **Le probe du premier chunk → 502 franc** : bon patron, le client bascule proprement en erreur.
6. **ThermalComfortSection extraite dans son fichier** : c'est le gabarit de ce que chaque face
   devrait être.

---

## Critiques majeures

### 1. La clé `(user_id, insee)` de la table `logement` est une impasse produit — BLOQUANT

- **Problème** : la PK est la commune, pas l'adresse (`supabase/17_logement.sql` l.27). Le
  commentaire du fichier dit pourtant « l'adresse analysée devient un ARTEFACT ».
- **Pourquoi c'est grave** : le cas nominal de la posture *prospection* (le cœur payant du
  module) est **comparer deux ou trois biens dans la même ville**. Aujourd'hui :
  - la 2e adresse analysée **écrase** l'artefact de la 1re (`upsertLogement` onConflict user,insee) ;
  - l'écrasement est **incohérent** : la route « autour » écrase `address_label/lat/lon/snapshot`
    SANS toucher aux colonnes DPE (par design anti-clobber, logement-store.ts l.74-81) → la ligne
    devient une **chimère** : DPE figé de l'adresse A, snapshot de l'adresse B, synthèse de
    l'une ou l'autre selon la course ;
  - le flip-flop A↔B **régénère la synthèse LLM à chaque bascule** (le hash inclut lat/lon,
    donc miss systématique) : coût direct, artefact jamais stable.
- **Impact** : dette qui se paie deux fois : aujourd'hui en données incohérentes silencieuses,
  demain en migration douloureuse quand la table aura des données réelles. Bloque aussi la
  vision « synthèse par défaut au lancement » (quel logement recharger ?).
- **Volontaire ou subie** : subie. Le patron `(user, insee)` a été copié de `report_context`
  (grain utilisateur↔commune) vers un objet dont le grain est utilisateur↔adresse.
- **Recommandation** : migration 21 MAINTENANT (la table ne porte que des données de test) :
  PK `(user_id, logement_id)` avec `logement_id` = BAN id (ou hash lat/lon 5dp en repli),
  `insee` en simple colonne indexée. Tous les chemins d'écriture (autour, dpe, synthèse)
  prennent le même identifiant. C'est ~1/2 journée aujourd'hui, une semaine dans un an.

### 2. Le hash de faits ne hash pas les faits — DETTE À TRAITER (trois défauts concrets)

`buildFactHash = lat(5dp):lon(5dp):dpeId:SOURCES_VERSION:PROMPT_VERSION`. C'est une clé
d'**identité + versions manuelles**, pas une clé de **contenu**. Trois conséquences réelles :

- **(a) Course avec le snapshot « autour », déjà présente.** `synthesisReady` s'allume dès
  `result && dpeTerminal` (LogementModule l.838-839) ; `autour` est souvent encore `null` ou
  `pending` à cet instant (Overpass 3,5 s de timeout + retry à 4,5 s). Le texte est généré
  SANS la section « autour », persisté avec le hash. Quand le snapshot arrive, `data` change
  mais le hash non → `lastHashRef` bloque côté client, le cache bloque côté serveur :
  **le texte sans « autour » est figé pour toujours**.
- **(b) Sources amont invisibles.** Un changement Géorisques/ONRN/sinistralité ne bump rien.
  Pire, couplage caché : `SOURCES_VERSION` est la version **Face 3** (`face3-2026-07-03c`,
  logement-store.ts l.6) réutilisée comme version « des sources de la synthèse ». Bump Face 3
  → invalidation de toutes les synthèses (coût LLM surprise) ; changement ONRN → rien. Un
  futur-moi ne devinera jamais ce couplage.
- **(c) Persistance d'un texte tronqué.** La doc Next installée est explicite : « `after` will
  be executed even if the response didn't complete successfully ». Le composant client
  **aborte** le fetch à chaque re-run (`abortRef.current?.abort()`) ; l'abort casse le pompage,
  `full` est partiel, et `after()` **persiste le texte tronqué avec un hash valide** → servi
  comme artefact définitif à toutes les visites suivantes.
- **Volontaire ou subie** : le choix « position+dpe+versions » est documenté (lisible,
  déterministe) donc à moitié volontaire ; (a) et (c) sont subies.
- **Recommandation** : hash = SHA-256 d'une sérialisation stable de `buildSynthesisPayload(data)`
  + `PROMPT_VERSION` (le payload EST le contrat : s'il change, le texte doit changer ; s'il ne
  change pas, cache). Gater `synthesisReady` sur `autour` terminal (complete/failed). Dans la
  route : flag `completed = true` posé après la sortie propre de la boucle, `after()` ne
  persiste que si `completed`. Supprime d'un coup (a), (b) partiellement et (c) entièrement.
- **Détail révélateur** : le bouton « Régénérer » ment : après persistance, re-POST → hash
  identique → cache hit → même texte, mot pour mot. Il n'existe pas de paramètre `force`. Soit
  l'assumer (renommer l'intention : retry d'erreur seulement), soit le câbler.

### 3. Le serveur croit `body.data` — DETTE À TRAITER (intégrité + coût)

- **Problème** : `/api/synthesize-logement` accepte les « faits » du client tels quels et les
  donne au modèle. Le hash est forgeable (lat+0,00001 → génération neuve).
- **Pourquoi** : racine architecturale, pas une paresse : `georisques-logement` calcule les
  faits côté serveur puis les **jette** (route stateless) ; on fait ensuite confiance au client
  pour les rapporter. La donnée fait un aller-retour client pour revenir au serveur.
- **Impact** : (1) intégrité : un utilisateur payant peut faire écrire n'importe quoi à la voix
  futur•e et le faire persister comme « lecture de ce logement » (payload = vecteur d'injection) ;
  (2) coût : générations LLM illimitées, aucun rate-limit, aucun plafond par utilisateur.
- **Bloquant ?** Secondaire tant que la plateforme est fermée et non indexée ; bloquant avant
  ouverture publique.
- **Recommandation structurelle** (à graver) : la ligne `logement` devient la **source des
  faits**. `georisques-logement` (ou un endpoint d'analyse) persiste les faits dans la ligne ;
  `synthesize-logement` ne reçoit du client qu'un identifiant de logement, reconstruit le
  payload depuis la base, hash les faits stockés. Le client ne transporte plus jamais les faits.
  Version minimale en attendant : plafond de générations par (user, jour) + validation Zod du body.

### 4. Asymétrie d'auth entre routes jumelles — révélateur d'une doctrine non factorée

- **Fait vérifié** : `synthesize-logement` et `logement-autour` contrôlent
  `canAccessCompleteReport` côté serveur ; **`synthesize-quartier` et `georisques-logement`
  n'ont AUCUN contrôle** (seule la page les gate). Pas de middleware dans le repo.
- **Impact** : `georisques-logement` (fan-out ~10 API externes dont Géorisques avec token) et
  `synthesize-quartier` (Sonnet 4.6, streaming) sont curlables anonymement. À 10 000
  utilisateurs ou au premier crawler agressif : facture Anthropic, bannissement possible par
  les API amont (le token Géorisques est un actif).
- **Pourquoi** : la doctrine d'accès n'existe qu'en copier-coller ; chaque route la réapplique
  (ou l'oublie).
- **Bloquant ?** Bloquant avant tout dé-noindex / lancement.
- **Recommandation** : un helper unique `requirePaidUser()` (401/403 + `{supabase, user}`)
  appliqué mécaniquement à toute route coûteuse. Trois lignes par route, doctrine en un seul
  endroit.

### 5. LogementModule.tsx, god component : oui, mais dette à trier — À AJUSTER

1194 lignes qui concentrent : le type `ApiResponse` écrit À LA MAIN (60 lignes de contrat
recopié depuis la route, aucune source partagée → toute évolution de `georisques-logement`
dérive silencieusement), 12 composants de présentation (Passeport, ONRN, PPRN, Face 3,
implication, actions…), 6 tables de constantes doctrinales, la machine à états DPE, trois
orchestrations fetch, le gating synthèse, et le hero marketing de la page.

- **Tri volontaire/subie** :
  - *Volontaire et sain en solo* : les petits composants purs colocalisés, les constantes à
    côté de leur usage, les commentaires doctrine. Ne pas « nettoyer » ça pour le principe.
  - *Subie* : (1) le contrat `ApiResponse` non partagé avec la route (le vrai couplage caché
    du fichier) ; (2) l'impossibilité de tester quoi que ce soit (aucune logique extraite) ;
    (3) le coût de reprise : toucher UNE face = recharger 1200 lignes en tête ; (4) spec 1b
    (réordonnancement complet) devra traverser tout le fichier.
- **Spec 1b : facile ou douloureux ?** L'ordre des sections lui-même est facile (ce sont déjà
  des composants, réordonner le JSX du return). Ce qui sera douloureux : (a) « synthèse par
  défaut au lancement » exige une **rehydratation de l'artefact qui n'existe pas** (voir 6) ;
  (b) les blocs encore inline (états DPE Énergie, « Adresse hors commune », ActionCards) ;
  (c) tout conflit git/IA sur un fichier de cette taille.
- **À extraire AVANT 1b** (dans cet ordre) :
  1. `src/lib/logement-report-types.ts` : le type de réponse de `georisques-logement`, importé
     PAR la route ET par le client (une seule vérité).
  2. Une face = un fichier : `SinistraliteSection` (+ constantes ONRN), `RegulatorySection`
     (+ REGIME_GLOSS/HAZARD_LABEL), `AutourSection` (+ labels Face 3), `EnergieSection`
     (états DPE), `PropertyPassport`, `ActionsSection`. Gabarit : ThermalComfortSection.
  3. `LogementModule` ne garde que : états, fetches, machine DPE, gating synthèse, composition.
     Cible ~300 lignes. Le réordonnancement 1b devient alors un déplacement de lignes.

### 6. L'artefact n'a pas de chemin de lecture — le vrai chantier structurel de 1b

La table `logement` persiste tout (snapshot, DPE figé, synthèse, posture) mais le module démarre
toujours `result = null` : au retour, l'utilisateur **ressaisit l'adresse**, re-déclenche le
fan-out complet, et seuls les caches (snapshot, synthèse) court-circuitent. La page a la forme
d'une page de recherche, pas d'une page d'artefact. La vision parquée (« épine dorsale
synthèse→identité→preuves ; synthèse auto = défaut au lancement ») est architecturalement
impossible sans un chemin serveur « charge le(s) logement(s) sauvegardé(s) et rends la page
depuis la ligne ». C'est la 2e raison (avec la clé, critique 1) de traiter la table AVANT 1b :
le re-key et la rehydratation se conçoivent ensemble.

### 7. Duplication du patron synthèse Quartier/Logement : à moitié saine — À AJUSTER

- **Duplication SAINE (ne pas factoriser)** : les prompts. Ce sont deux doctrines éditoriales
  distinctes (périmètres, clôtures, gardes différents). Une abstraction « règles de voix
  partagées » créerait le pire couplage du produit : modifier la voix Territoire casserait
  Logement en silence. Le coût de la double maintenance est réel mais assumé ; c'est le prix
  de la précision éditoriale.
- **Duplication SUBIE (factoriser au 3e usage, qui est déjà annoncé)** : la plomberie transport,
  ~50 lignes verbatim dans les deux routes (probe premier chunk → 502, repompage ReadableStream,
  headers). Santé et Mobilité la re-paieront. Un helper `lib/stream-llm.ts` :
  `probeAndStream(result, { onComplete(fullText) }) → Response` absorbe aussi le flag
  `completed` de la critique 2c. Les composants clients ne sont PAS jumeaux (QuartierSynthesis
  622 l. avec fallback statique vs LogementSynthesis 104 l.) : les laisser.

## Ce qui peut disparaître

- Les champs `zfe`, `irep`, `cartofriches`, `audit` transitent dans `ApiResponse` alors que la
  doctrine les a déplacés (ZFE → Mobilité, pollution → Santé) ; seul `cartofriches.sol_pollue`
  sert encore une ActionCard. Chaque analyse paie ces appels API externes pour presque rien.
  Trancher : soit les retirer du fan-out, soit documenter la carte d'usage.
- Le `GET ?q=` de `georisques-logement` (géocodage libre de repli) : le client ne l'utilise
  plus (POST atomique seulement). Route non authentifiée en plus. À supprimer ou à protéger.
- Le bouton « Régénérer » dans son état actuel (il ne régénère pas, cf. 2).

## Performance

Seulement le structurel :
- **Overpass** : mutualisé par cellule, timeout, réchauffage `after()` : tient à 10 000
  utilisateurs. RAS.
- **LLM** : ~1 génération par adresse (2-5 k tokens in, ~400 out) : coût nominal négligeable.
  Ce qui explose n'est pas le volume nominal mais les trois fuites : flip-flop (user,insee)
  (critique 1), hash forgeable sans rate-limit (critique 3), routes non authentifiées
  (critique 4).
- **Fan-out `georisques-logement`** : ~10 appels externes séquencés en 3 vagues par analyse,
  dont 2 Géorisques en série après les Promise.all. Acceptable ; le `Cache-Control s-maxage`
  posé sur une réponse POST n'est pas honoré par le CDN (donnée re-payée à chaque analyse de la
  même adresse par des utilisateurs différents). Non mesurable aujourd'hui : à instrumenter
  avant d'optimiser.

## Conformité à la stack

- `after()` : conforme à la doc installée (route handler, post-réponse, waitUntil Vercel). Le
  défaut est le contenu persisté, pas l'API.
- `streamText` + `providerOptions.anthropic { effort, thinking }` : conforme à la politique du
  memory synthesis_model_routing (payant/long = Sonnet 4.6 medium, thinking off).
- Écart mineur : `synthesize-logement` ne déclare ni `runtime` ni `maxDuration` alors que
  `synthesize-quartier` pose `maxDuration = 60`. Sur Vercel, la durée par défaut peut tronquer
  un stream lent, et `after()` vit dans la même enveloppe. Aligner.
- ADR-0004 (coût <50 €/mois) : tenu aujourd'hui UNIQUEMENT parce que AUTO_SYNTHESIS est OFF et
  la plateforme fermée. Les critiques 3 et 4 sont les deux trous de la coque.

## Ce que cette architecture rend FACILE / DIFFICILE à changer

**Facile** :
- Réordonner les sections affichées (composants internes, JSX de composition).
- Changer un libellé, une glose PPRN, un label BPE (constantes localisées, commentées).
- Changer le modèle LLM ou l'effort (une ligne, doctrine dans le memory).
- Faire évoluer le prompt (versionné, invalidation propre par PROMPT_VERSION).
- Ajouter une catégorie BPE (TYPEQU_LABEL sans régénérer les shards : bien conçu).
- Réutiliser le cache de tuile OSM et thermal-evidence dans un autre module.

**Difficile** :
- Deux adresses dans la même commune (PK + tous les chemins d'écriture + hash : critique 1).
- Rouvrir la page sur l'artefact sauvegardé (aucun chemin de lecture : critique 6).
- Faire confiance au texte persisté (tronquable, forgeable : critiques 2c et 3).
- Tester quoi que ce soit du module (logique enchâssée dans 1200 lignes de client).
- Déplacer une face vers un autre module (types soudés dans ApiResponse manuscrit).
- Savoir ce qui invalide une synthèse (SOURCES_VERSION Face 3 recyclée, versions amont muettes).

## Les paris de l'architecture, et leurs seuils de bascule

1. **« Un utilisateur n'analyse qu'une adresse par commune. »** Faux dès le premier acheteur
   qui compare deux biens dans la même ville : seuil déjà atteint par le cas d'usage annoncé
   de la posture prospection. C'est le pari le plus fragile du module.
2. **« Position + dpeId + versions manuelles identifient les faits. »** Casse dès qu'une source
   amont change sans bump, et casse DÉJÀ sur la course « autour » (texte figé incomplet).
3. **« Le client est honnête et raisonnable. »** Tient tant que la plateforme est fermée ;
   casse le jour du dé-noindex / de la vente.
4. **« after() voit toujours un stream complet. »** Faux (doc Next : s'exécute même en échec) ;
   casse au premier abort en cours de stream.
5. **« Un fichier de 1200 lignes reste pilotable en solo avec Claude Code. »** Seuil : spec 1b.
   Au-delà, chaque session re-paie la lecture du monolithe et les diffs deviennent risqués.
6. **« La plomberie de streaming se copie-colle. »** Seuil : le 3e module à synthèse
   (Santé/Mobilité, déjà annoncés).
   
Je nomme ces paris comme risques techniques ; savoir si « comparer deux biens dans la même
commune » est bien la direction produit appartient au Product Strategist.

## Verdict : DETTE À TRAITER (ciblée, pas une refonte)

Hiérarchie : (1) la clé (user, insee) et (2) le contrat de cache sont des erreurs de conception
au sens du board : elles contredisent la promesse centrale du module (« l'adresse devient un
artefact ») et se paieront au carré. (3) faits client-crus et (4) auth asymétrique sont les deux
conditions non remplies pour l'ouverture publique. (5) le god component est une dette de
reprise réelle mais mécanique à résorber, et partiellement volontaire. Le reste (libs pures,
cache OSM, doctrine commentée) est au-dessus de la moyenne du genre : ce module n'est pas
malade, il est bâti sur une clé fausse.

Et un endroit où la bonne réponse est PLUS de complexité : le cache de synthèse mérite un vrai
contrat (hash de contenu + complétude + invalidation par source), pas moins de code.

## Cohérence (tensions non tranchées, posées à l'humain)

- **Prompts dupliqués vs futur à 6 modules** : je défends la duplication éditoriale, mais à 6
  modules la double-maintenance des règles transverses (tirets, antithèses, sources) pèsera.
  Le porteur devra choisir entre discipline de relecture croisée et un socle de voix partagé
  minimal (quelques lignes réellement invariantes seulement).
- **`(user, logement_id)` multiplie les lignes par utilisateur** : combien d'adresses garder ?
  Une limite (3 ? 5 ?) est une décision produit/business, pas architecture.

## Décision à graver (prête pour un ADR ou une note vault)

« **L'artefact logement est identifié par l'adresse, pas par la commune, et il est la source
unique des faits de sa synthèse.** Table `logement` re-keyée (user_id, logement_id BAN) avec
insee en colonne ; les faits de l'analyse sont persistés dans la ligne au moment de l'analyse ;
`synthesize-logement` reconstruit le payload depuis la ligne (le client n'envoie qu'un
identifiant) ; le hash de cache est le hash du payload canonique + version de prompt ; la
persistance n'écrit que les streams complets. »

## La version minimale (~90 % de la valeur, ~1 journée)

1. Migration 21 : re-key `(user_id, logement_id)` (BAN id), `insee` en colonne (table quasi vide
   aujourd'hui : le moment n'existera plus jamais à ce prix).
2. Hash = SHA-256 du payload canonique + PROMPT_VERSION ; `synthesisReady` attend `autour`
   terminal ; flag `completed` avant la persistance `after()`.
3. `requirePaidUser()` appliqué à `synthesize-quartier` et `georisques-logement` (et suppression
   du GET `?q=`).
L'extraction des faces et la source serveur des faits suivent, mais ces trois gestes ferment
les impasses ; tout le reste est du refactoring réversible.

## Ce que je conserverais absolument / reconstruirais / 3 décisions à 12 mois

**Conserver** : cache de tuile OSM mutualisé ; libs pures (thermal-evidence,
logement-synthesis-cache, logement-autour-types) ; doctrine commentée dans le code ; prompts
séparés par module ; probe premier chunk → 502 ; patron snapshot figé + sourceStatus.

**Reconstruire** : la clé et le cycle de vie de l'artefact logement (re-key + faits persistés
serveur + chemin de rehydratation) ; le contrat de cache de synthèse ; le contrat de type
client/serveur d'ApiResponse.

**3 décisions à plus fort impact sur 12 mois** :
1. **Re-keyer la table logement sur l'adresse maintenant** : chaque semaine d'attente augmente
   le coût de migration et corrompt des artefacts réels.
2. **Faire de la ligne logement la source des faits de synthèse** (serveur ne croit plus le
   client ; hash = faits stockés ; persistance gardée par complétude) : ferme intégrité, coût
   et péremption d'un seul mouvement, et ouvre « synthèse au chargement » pour 1b.
3. **Factoriser la doctrine transverse avant le 3e module au grain adresse** : `requirePaidUser()`,
   helper de streaming, types de réponse partagés. C'est ce qui décide si Santé/Mobilité coûtent
   trois semaines ou trois jours chacun.

## Désaccords probables avec les autres sièges

- **Product Strategist** : voudra livrer le réordonnancement 1b immédiatement (valeur lecteur
  visible). Je soutiens que re-key + extraction des faces AVANT 1b coûtent 2-3 jours et que
  1b sur le monolithe coule le béton au mauvais endroit.
- **Business Strategist** : « re-keyer une table vide = zéro revenu ». Mon contre : le cas
  bloqué (comparer deux biens dans la même ville) est précisément le moment payant du module ;
  et les routes non authentifiées sont un risque de coût direct sur SA contrainte de 50 €/mois.
- **Editorial Writer** : pourrait vouloir un socle de voix partagé entre les prompts Quartier
  et Logement. Je m'y oppose au niveau code : la duplication des prompts est le seul endroit où
  je défends la duplication, parce que le couplage éditorial inter-modules serait invisible et
  se paierait en régressions de voix silencieuses.
- **Contre la caricature de mon propre rôle** : je ne demande PAS le démontage complet du god
  component ; les composants colocalisés et les constantes doctrinales à côté de leur usage sont
  un bon choix solo. Seules l'extraction par face et le contrat de type partagé sont dus.

## Limites de mon regard

- **Je n'ai rien exécuté ni mesuré** : la course « autour vs synthèse » et la persistance d'un
  texte tronqué sur abort sont établies par lecture du code et de la doc Next installée, pas
  reproduites en runtime. L'ordre réel des événements (latences Overpass, timing after() sur
  Vercel) peut adoucir ou aggraver ces fenêtres.
- **Je n'ai pas lu** `/api/logement-dpe`, `logement-bpe.ts`, `logement-osm.ts`,
  `dpe-attribution.ts` ni `QuartierSynthesis.tsx` en entier : mes affirmations sur leurs
  contrats (anti-clobber DPE, non-gémellité des composants clients) reposent sur leurs appelants
  et leurs commentaires.
- **Le diff exact de la branche** (route synthèse modifiée non commitée) n'a pas été comparé à
  HEAD : je juge l'état du fichier sur disque.
- **Les coûts LLM sont des ordres de grandeur raisonnés**, pas une facture mesurée ; la critique
  « ce qui explose à 10k » vaut pour la structure, pas pour un chiffre.

## Quand rouvrir ce sujet

- **Signal PostHog** : un même user avec `logement_analyzed` sur 2 adresses distinctes du même
  `insee` (le flip-flop existe en vrai) → le re-key devient urgent, plus « avant 1b ».
- **Spec 1b validée par le porteur** → déclencher l'extraction des faces et le chemin de
  rehydratation dans la même passe.
- **Décision de dé-noindexer / vendre** → critiques 3 et 4 passent de « dette » à « bloquant
  jour J » (rate-limit, auth, validation).
- **3e module au grain adresse mis en chantier** → factoriser stream + auth + types AVANT
  d'écrire sa première route, pas après.
- **Facture Anthropic ou quota Géorisques anormal** → preuve que le hash forgeable ou les
  routes ouvertes sont exploités ; traiter en priorité absolue.
- **Si le porteur tranche « une seule adresse par commune, assumé »** (décision produit) :
  la critique 1 tombe, mais il faut alors rendre l'écrasement COHÉRENT (purger les colonnes
  DPE et synthèse dans le même upsert) et l'écrire dans la doctrine du module.
