# FUT-41, deuxième lot : la mémoire multi-biens

**Date :** 8 novembre 2026. **Base lue :** `origin/main` à `4c0ebc5b` (après FUT-140 et FUT-12), plus le diff de la PR #131 (FUT-27).
**Nature :** audit et conception. Aucun code modifié, aucune migration écrite dans `supabase/`, rien fusionné ni déployé.

---

## 0. En bref

**Verdict : GO avec réserves** pour développer un premier lot, derrière une activation par compte.

Ce que la personne pourra faire avec ce lot :

1. Dans « Vos lieux », sous ses dossiers, elle ajoute un bien qu'elle envisage. Elle donne un nom (« T3 Talensac »), une commune et, si elle les a, l'adresse et le lien de l'annonce. Rien n'est payé et rien n'est analysé.
2. Elle retrouve ses biens à chaque visite. Pour chacun, elle change le statut (à étudier, à visiter, visité) et garde une note « À vérifier ».
3. Quand elle écarte un bien, elle écrit pourquoi. futur•e garde cette raison et l'état de son projet à ce moment. Si le projet change ensuite, la fiche le dit : « Écarté le 3 novembre : "trop loin de la gare". Votre projet a changé depuis. »
4. Si elle fait analyser l'adresse plus tard, elle rattache le dossier payé à son bien en un clic. futur•e le lui propose quand l'adresse correspond, mais ne le fait jamais seul.

Ce qui ne bouge pas : le premier dossier reste en haut de la page, le paiement d'un dossier ne passe pas par cette liste, et une fiche de bien ne montre aucun contenu payant.

Le lot sert **un projet d'achat comme un projet de location** (§ 2.4). Dans ce document, « payé » désigne toujours le dossier futur•e réglé par la personne, jamais l'achat du logement.

Les **réserves** (§ 10) portent surtout sur trois points :
- aucune base de test n'existe pour vérifier la sécurité des nouvelles tables avant la production ;
- huit conventions doivent être tranchées par le porteur avant le code (§ 9) ;
- l'ordre de fusion avec la PR #131 doit être respecté.

---

## 1. Cartographie technique de l'existant

### 1.1 Les objets en base

| Objet | Table | Qui écrit | Ce que la ligne signifie | Réutilisable pour un bien envisagé ? |
|---|---|---|---|---|
| Dossier d'adresse | `address_dossiers` (mig. 25, 29, 31, 36) | **Service role uniquement** (webhook, `address-dossier-write.ts`). `insert/update/delete/truncate` révoqués pour `authenticated`. | **L'existence de la ligne EST le droit payé.** La contrainte `address_dossiers_provenance_ck` n'admet que deux provenances : acheté (triplet Stripe) ou administratif. La RLS de lecture exclut `access_revoked_at`. | **Non.** Une ligne fictive ouvrirait Autour, Logement et le Territoire de la commune (`territory-claims.ts`, `kind: "dossier"`). C'est l'interdit explicite de la mission. On ne fait que **pointer** vers elle. |
| Droit territorial | `report_grants` (mig. 12) | Service role (webhook) | Un Territoire acheté (14 €) | Non. Une commune « à explorer » relève d'un autre objet (§ 3.1). |
| Conclusion figée | `decision_artifact` (mig. 28) | Serveur, cycle `generating → ready` ; versions immuables | Ce qui a été vendu, daté, versionné, avec `projectSnapshot` | **Oui, en lecture indirecte seulement.** La fiche du bien n'en lit rien : la conclusion reste sur la ligne du dossier dans « Vos lieux ». |
| Projet | `user_profiles.user_project` (jsonb, mig. 17) | Le lecteur (`/api/profile`, `/api/project/from-search`, `ecrireProjetSiInchange`) | **Un seul projet, sans identifiant ni historique, réécrit sur place** | **Oui, comme source du cliché.** On en copie l'état au moment d'un événement, sans jamais l'écrire. |
| Bien actif | `user_profiles.active_dossier_id` (mig. 29) | Route `ouvrir` (GET à effet de bord) | Une préférence de lecture, pas un droit | Non concerné. Le lot ne doit pas l'écrire. |
| Repères de terrain | `terrain_observations` (mig. 11) | Lecteur (RLS « own ») | Une observation courante par (compte, commune, module) | **Non**, mais c'est le patron RLS à suivre. La clé unique par commune interdit deux biens dans une même commune. |
| Intention d'achat | `dossier_intents` (mig. 26, 38) | Service role | L'adresse canonique avant paiement, **purgée à 30 jours** | Non. Mais la doctrine qu'elle porte s'applique ici (§ 3.8) : « le lieu que quelqu'un envisage d'habiter » est une donnée sensible. |

**Constat confirmé, déjà posé au cadrage du 20/10 :** aucun objet « bien envisagé » n'existe, ni en base, ni dans `localStorage`. La recherche (`shortlist|favori|candidat_|saved_places`) ne trouve rien. Aucune piste territoriale n'est persistée côté serveur non plus (rappel FUT-27).

### 1.2 Le code de « Vos lieux » (FUT-130, PR #75)

| Fichier | Rôle | Ce que le lot en fait |
|---|---|---|
| `src/lib/decision/vos-lieux.ts` | Assembleur **pur** : biens, territoires, résidence, artefacts et projet actuel donnent une `LieuAffiche[]`. Ne recompose ni ne génère aucune conclusion. | **Intact.** Le lot réutilise les `cle: "bien:<id>"` qu'il produit pour savoir quels dossiers sont accessibles. |
| `src/lib/decision/vos-lieux-lecture.ts` | Quatre lectures groupées, filtrées par `user_id`. `listDossiers` exclut déjà les révoqués. | **Intact.** |
| `src/lib/server/vos-lieux.ts` | Branchement `server-only` | Intact |
| `src/app/(account)/rapport/dossiers/page.tsx` | Page serveur : `VosLieux` puis « Analyser une adresse » vers `/dossier` | **Modifié** : on charge et on affiche la section des biens envisagés entre les deux. |
| `src/components/vos-lieux/VosLieux.tsx` | Présentation pure, liens `<a>` natifs (jamais `<Link>`, les cibles écrivent) | Intact. Une **ancre** `id` par ligne de dossier serait utile (§ 4). C'est le seul ajout envisagé, et il est facultatif. |
| `src/app/(account)/rapport/dossiers/ouvrir/route.ts` | GET à effet de bord, il pose le territoire et le bien actifs | **Intact.** On n'y fait aucun lien préchargé. |
| `src/components/releve/activation.ts` | Bascule `DECISION_RELEVE` + liste de comptes par UUID | **Patron à copier** pour l'activation par compte (§ 4.3). |

### 1.3 Les briques réutilisables

- **`projetAChangeMateriellement(snapshot, actuel)`** et **`signatureDecisionnelle`** (`src/lib/decision/projet-materiel.ts`). Elles disent déjà si un projet a changé *pour la décision* en ignorant les retouches de texte. Elles servent à « Vos lieux » pour les artefacts. Elles serviront telles quelles pour un bien écarté. On n'ajoute aucune seconde définition du changement.
- **`normalizeUserProject`** (`src/lib/user-project.ts`) : relecture tolérante d'un cliché ancien.
- **`normaliserCodeCommune`, `communeDuReferentiel`, `nomDuReferentiel`** (`src/lib/commerce/referentiel-communes.ts`) : le nom de la commune vient du référentiel, jamais du navigateur (leçon FUT-119).
- **`communeParent`** (`src/lib/plm.ts`) : regroupement au grain commune pour Paris, Lyon et Marseille.
- **`CommuneSearch.tsx`** et **`report/AddressAutocomplete.tsx`** : saisie de la commune et de l'adresse BAN.
- **`lireCorpsBorne`** (`src/lib/server/corps-borne.ts`, FUT-155) : borne des corps de requête.
- **`getDossier`** (`address-dossier-store.ts`) : vérification de propriété d'un dossier (RLS + `user_id` + non révoqué), pour le rattachement.

### 1.4 Les dépendances

| Ticket | État | Lien avec ce lot |
|---|---|---|
| **FUT-27** (PR #131, tête `6158720b`, non fusionnée) | En revue | Voir § 6. Aucun fichier en commun si le périmètre est tenu. |
| **FUT-22** (comparaison) | Backlog. `comparaison-candidats.ts` existe mais son en-tête dit qu'**aucune surface ne doit le rendre** tant que trois questions ne sont pas tranchées. | **Hors lot.** Aucune comparaison, aucun rangement. |
| **FUT-49** (Pass) | Backlog, hypothèse non décidée | **Hors lot.** Le lot ne crée aucun droit. Il donne au futur Pass l'objet qui lui manque (un bien rattaché à une recherche) sans en présumer le contrat. |
| **FUT-122** (actualisation groupée) | Backlog, décision du 21/10 : aucune génération autorisée | **Hors lot.** Aucune génération, aucun bouton de mise à jour sur un bien. |
| **FUT-21** (vérifier, répondre, réévaluer) | Non lu en détail | La note « À vérifier » reste **du texte libre du lecteur**. Elle n'entre pas dans le registre des contrôles officiels. Ne pas fabriquer une seconde structure de vérifications avant FUT-21. |

---

## 2. Le MVP recommandé

### 2.1 Le parcours, étape par étape

| Étape de la mission | Ce que fait le lot | Ce qu'il ne fait pas |
|---|---|---|
| 1. J'ai trouvé une annonce, parfois sans adresse | Bouton « Ajouter un bien » dans « Vos lieux ». Champs : **nom du bien** (obligatoire), **commune** (obligatoire, autocomplétion), **adresse** (facultative, BAN), **lien de l'annonce** (facultatif), **à louer ou à vendre** (facultatif, D9). | Aucune lecture du lien. Aucun aperçu de l'annonce, aucune collecte automatique. Aucune analyse lancée. |
| 2. Je l'ajoute avec un libellé, une commune, l'URL | Création côté serveur. Le nom de commune vient du référentiel. Le lien est normalisé et ses doublons sont détectés (§ 3.6). | Pas de champ prix, surface ou photo. |
| 3. J'y reviens, je change le statut, je note une vérification | Statut : **À étudier · À visiter · Visité · Écarté** (D1). Une note **« À vérifier »** modifiable, 500 caractères au plus. | Pas de liste de tâches. Pas de rappel ni d'e-mail. |
| 4. Je l'écarte, je garde la raison et le contexte du projet | « Écarter » demande une raison courte (D3). Le serveur fige le **projet tel qu'en base** à cet instant. Les écartés se replient sous « Biens écartés (n) ». Un écarté peut être **repris**. | Aucune affirmation sur *quelle condition* a causé l'abandon : la raison est le texte du lecteur, citée telle quelle. |
| 5. Je fais analyser l'adresse, je retrouve le dossier | Un bien sans dossier propose « Analyser cette adresse » (lien simple vers `/dossier`). Une fois le dossier payé, la fiche du bien propose « Rattacher un dossier ». Quand l'adresse BAN correspond, futur•e le suggère. | **Aucun rattachement automatique**, aucune modification du webhook ni de `/dossier`. Pas de pré-remplissage de l'adresse dans `/dossier` (lot ultérieur, § 7). |

### 2.2 Le test à trois biens

Situation jouée dans les tests et la recette :
- projet : **location**, gare à 20 minutes au plus ;
- **A**, « T3 Talensac », Nantes, annonce de location sur Le Bon Coin, sans adresse, *À visiter*, note « Demander la date de ravalement » ;
- **B**, « Maison Rezé », Rezé, **annonce de vente** (la personne hésite encore entre louer et acheter), adresse BAN connue, *Visité*, puis un Dossier d'adresse payé ;
- **C**, « Duplex Chantenay », Nantes, *Écarté* le 3/11 pour « trop loin de la gare » ; le projet passe ensuite à 30 minutes.

Ce que la page montre, de haut en bas :

1. **« Vos lieux »**, inchangé : le dossier de Rezé avec sa conclusion figée, sa date et son état face au projet.
2. **« Les biens que vous envisagez »** (titre en D4), dans l'ordre d'ajout, sans aucun rang :
   - A : Nantes · T3 Talensac · *À visiter* · « À vérifier : Demander la date de ravalement » · lien « leboncoin.fr » (le domaine seul est affiché) ;
   - B : Rezé · Maison Rezé · *Visité* · « Analysé : voir son dossier » (ancre vers la ligne du dossier, **aucune conclusion recopiée**) ;
   - « Biens écartés (1) », replié. Une fois ouvert : C · « Écarté le 3 novembre : "trop loin de la gare". Votre projet a changé depuis. » · bouton « Reprendre ».
3. « Analyser une adresse », inchangé.

**Ce que ce test vérifie de la valeur.** Sans le lot, A et C n'existent nulle part dans futur•e, et la raison de l'abandon de C est perdue. Avec le lot, la personne retrouve ses trois annonces, sa vérification en attente et la trace de son abandon, en un écran, sans avoir payé pour A ni C.

**Ce que ce test ne prouve pas.** Il ne dit pas que des gens s'en serviront. D'où l'activation par compte et le protocole Y7, encore non mené (§ 2.5).

### 2.3 Limites assumées du premier lot

- Le texte dit seulement « votre projet a changé depuis ». Il ne nomme pas encore le changement (« vous acceptiez 20 min, vous acceptez 30 min »). Le cliché est stocké pour le permettre plus tard (§ 7, extension 2c).
- On ne rattache pas un Rapport de territoire à un bien : seul un Dossier d'adresse peut l'être.
- Pas d'entrée « Suivre ce bien » depuis un dossier ou depuis `/ou-vivre`.
- Pas de piste territoriale (« explorer Angers »).
- Pas d'historique affiché au-delà du dernier abandon. Le journal existe en base mais n'est pas montré.
- Aucune vérification que l'annonce est encore en ligne.

### 2.4 Achat ou location : rien n'est présumé

Le projet porte `intent: "achat" | "location" | null` (`src/lib/user-project.ts`), et une même personne peut hésiter entre louer et acheter. Le lot en tient compte de quatre façons :

- **La nature du bien est une donnée du bien, jamais du projet.** Un champ facultatif « À louer / À vendre », sans réponse par défaut (D9). Un projet de location n'empêche pas de garder une annonce de vente, et inversement. On ne le déduit jamais de `intent`, conformément à la doctrine « on ne devine jamais ».
- **Statuts et textes communs aux deux cas.** « À étudier, À visiter, Visité, Écarté » valent pour une location comme pour une vente. Aucun mot du lot ne suppose une offre d'achat, un compromis, un prêt ou un prix d'achat. Les étapes propres à la location (candidature déposée, réponse du bailleur) et à l'achat (offre, compromis) restent hors lot, et la note « À vérifier » couvre ces cas en attendant (D1).
- **Le passage de l'un à l'autre se voit.** `intent` fait partie de ce que `projetAChangeMateriellement` compare. Un bien écarté quand la personne cherchait à louer, alors qu'elle cherche maintenant à acheter, affiche donc « Votre projet a changé depuis ». L'extension 2c pourra le nommer : « Écarté quand vous cherchiez une location. »
- **Les annonces de location vivent moins longtemps.** La règle du § 3.6 suffit : futur•e date l'ajout et ne prétend jamais que l'annonce est encore en ligne.

### 2.5 Mesurer la valeur sans trahir la vie privée

- **Activation par compte** d'abord (patron `activation.ts`) : le porteur et deux ou trois personnes en recherche réelle (protocole `protocole-test-trois-personnes.md` du 20/10).
- Instrumentation PostHog **sans aucun contenu** : `bien_envisage_ajoute { avec_adresse, avec_lien }`, `bien_envisage_statut { de, vers }`, `bien_envisage_rattache`. **Jamais** le nom, le lien, la commune, la note ni la raison.
- Question de sortie du test : la personne est-elle **revenue** après une visite ou une nouvelle annonce ? C'est le critère de FUT-41 (30/09, § 1).

---

## 3. Modèle de données et droits

### 3.1 Trois objets à ne pas confondre

| Objet | Où il vit | Ouvre un droit ? |
|---|---|---|
| **Bien envisagé** (ce lot) | `property_candidates` | **Jamais** |
| **Commune à explorer** (piste territoriale) | Rien aujourd'hui. Lot ultérieur, objet distinct (FUT-41, 30/09, § 3 ; FUT-27 : la recherche reste jetable). | Jamais |
| **Dossier payé** | `address_dossiers` / `report_grants` | Oui, par l'existence de la ligne |

Un bien envisagé **pointe** éventuellement vers un dossier (`dossier_id`). L'inverse n'existe pas : le dossier ignore le bien.

### 3.2 Schéma proposé (non appliqué)

Fichiers à créer : `supabase/39_property_candidates.sql` et `supabase/39_property_candidates_down.sql`. Le SQL ci-dessous est une esquisse pour la contre-revue. Il n'est **pas** dans `supabase/`.

```sql
begin;

-- Défense en profondeur pour le rattachement : un bien ne peut désigner qu'un dossier DU MÊME
-- compte, même si une route l'oubliait. `id` est déjà unique : cet index ne change rien au sens
-- de la table qui porte les droits, il rend seulement la clé composée référençable.
create unique index if not exists address_dossiers_id_user_key
  on public.address_dossiers (id, user_id);

create table public.property_candidates (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  label          text not null check (length(btrim(label)) between 1 and 120),
  -- Code local (arrondissement admis) ; le regroupement se fait par communeParent à la lecture.
  insee          text not null check (insee ~ '^([0-9]{5}|2[AB][0-9]{3})$'),
  -- Nom issu du référentiel, côté serveur (FUT-119), jamais du navigateur.
  commune        text not null check (length(commune) between 1 and 120),
  ban_id         text check (ban_id is null or length(ban_id) <= 64),
  address_label  text check (address_label is null or length(address_label) <= 200),
  listing_url    text check (listing_url is null or (length(listing_url) <= 2048 and listing_url ~* '^https?://')),
  listing_url_key text check (listing_url_key is null or length(listing_url_key) <= 2048),
  -- À louer ou à vendre, déclaré par le lecteur ; null = non précisé, jamais déduit du projet (D9).
  offer_kind     text check (offer_kind is null or offer_kind in ('location', 'vente')),
  status         text not null default 'a_etudier'
                 check (status in ('a_etudier', 'a_visiter', 'visite', 'ecarte')),
  -- La raison du DERNIER changement de statut ; l'historique vit dans le journal.
  status_reason  text check (status_reason is null or length(status_reason) <= 500),
  to_check       text check (to_check is null or length(to_check) <= 500),
  dossier_id     uuid,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  check ((ban_id is null) = (address_label is null)),
  check (status <> 'ecarte' or status_reason is not null),          -- si D3 = raison obligatoire
  foreign key (dossier_id, user_id)
    references public.address_dossiers (id, user_id) on delete set null (dossier_id)
);

create index property_candidates_user_idx on public.property_candidates (user_id, created_at desc);
-- Même annonce deux fois : refusé. Même immeuble (ban_id) : admis, deux appartements y coexistent.
create unique index property_candidates_user_listing_key
  on public.property_candidates (user_id, listing_url_key) where listing_url_key is not null;
-- Un dossier ne se rattache qu'à un seul bien.
create unique index property_candidates_user_dossier_key
  on public.property_candidates (user_id, dossier_id) where dossier_id is not null;

-- LE JOURNAL : insertion seule, écrite par un trigger, jamais par une route.
create table public.property_candidate_events (
  id               uuid primary key default gen_random_uuid(),
  candidate_id     uuid not null references public.property_candidates(id) on delete cascade,
  user_id          uuid not null references auth.users(id) on delete cascade,
  status_from      text,              -- null à la création
  status_to        text not null,
  reason           text,
  -- user_profiles.user_project TEL QU'EN BASE à cet instant ; null = aucun projet enregistré.
  project_snapshot jsonb,
  created_at       timestamptz not null default now()
);
create index property_candidate_events_candidate_idx
  on public.property_candidate_events (candidate_id, created_at desc);

-- Le cliché est lu EN BASE, dans la même transaction que le changement de statut : le navigateur
-- ne peut ni le choisir ni l'omettre, et deux écritures ne peuvent pas diverger.
create or replace function public.property_candidate_journal() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' or new.status is distinct from old.status then
    insert into public.property_candidate_events (candidate_id, user_id, status_from, status_to, reason, project_snapshot)
    values (new.id, new.user_id, case when tg_op = 'UPDATE' then old.status end, new.status, new.status_reason,
            (select p.user_project from public.user_profiles p where p.user_id = new.user_id));
  end if;
  return null;
end $$;
create trigger property_candidates_journal
  after insert or update of status on public.property_candidates
  for each row execute function public.property_candidate_journal();

-- updated_at, et le plafond de biens actifs (D2), en trigger `before`.

alter table public.property_candidates enable row level security;
alter table public.property_candidate_events enable row level security;
create policy property_candidates_select_own on public.property_candidates
  for select to authenticated using (auth.uid() = user_id);
create policy property_candidate_events_select_own on public.property_candidate_events
  for select to authenticated using (auth.uid() = user_id);
revoke insert, update, delete, truncate on public.property_candidates from authenticated, anon;
revoke insert, update, delete, truncate on public.property_candidate_events from authenticated, anon;
revoke all on function public.property_candidate_journal() from public, anon, authenticated;

commit;
```

### 3.3 Pourquoi ces choix

- **Écritures par le serveur seulement** (service role, filtre explicite `user_id`), lecture RLS « own ». C'est le patron de `address_dossiers` (`address-dossier-write.ts`). Un bien envisagé n'ouvre aucun droit. Mais si on laissait l'écriture directe par PostgREST, on pourrait y inscrire une commune inexistante, un nom de commune inventé ou un lien `javascript:`. Les contraintes SQL couvrent le format, et le serveur vérifie le référentiel.
- **Un journal en insertion seule.** Un bien écarté, repris puis écarté de nouveau garde ses deux raisons et ses deux clichés. Sans journal, le second abandon effacerait le premier : on réécrirait le passé, ce que FUT-41 interdit.
- **Le cliché complet plutôt que la seule signature.** La signature suffit pour dire « a changé ». Le cliché permettra demain de dire *quoi* (extension 2c) sans nouvelle migration. Le coût : quelques kilo-octets par événement.
- **Le trigger plutôt qu'une fonction appelée par la route.** Une seule écriture applicative, et le journal ne peut pas être oublié.

### 3.4 Changement de projet et décisions passées

- Le projet reste unique. Les biens appartiennent **au compte** et vivent sous le projet courant. Il n'y a pas d'identifiant de projet : le cadrage du 20/10 recommandait d'en créer un, mais ce lot n'en a pas besoin, et ajouter `project_id` plus tard n'invalidera rien.
- Quand le projet est remplacé (`from-search` écrit un projet neuf, FUT-27), **les biens survivent**, et leur journal garde le projet d'alors.
- La lecture compare `normalizeUserProject(event.project_snapshot)` au projet actuel avec **`projetAChangeMateriellement`**. Quatre états, quatre phrases, chacun testé sur le texte rendu :

| Cliché à l'abandon | Projet actuel | Phrase |
|---|---|---|
| présent | même signature | *(aucune phrase : rien à signaler)* |
| présent | signature différente | « Votre projet a changé depuis. » |
| absent | présent | « Vous n'aviez pas encore enregistré de projet. » |
| présent ou absent | absent | *(aucune phrase)* |

On ne fusionne **jamais** un bien avec `user_project` : on n'y écrit rien, on ne le lit qu'au moment d'un changement de statut.

### 3.5 Biens sans adresse précise

C'est le cas par défaut. Seuls `label` et `insee` sont obligatoires. L'adresse s'ajoute plus tard avec l'autocomplétion BAN existante, et `ban_id` et `address_label` vont toujours ensemble (contrainte). Une zone approximative (« quartier Talensac ») tient dans le nom du bien. On ne crée pas de champ « zone », qui demanderait un référentiel.

### 3.6 Liens d'annonce : normalisation, doublons, péremption

- **Normalisation côté serveur** (`listing_url_key`) : `http(s)` seulement, hôte en minuscules, sans fragment ni barre finale. La requête est conservée : certains sites l'exigent (D6).
- **Jamais suivi** par le serveur : pas de requête vers l'annonce, donc aucun risque SSRF ni aucune collecte. Jamais envoyé à PostHog, à un modèle ou dans un journal applicatif.
- **Affichage** : le domaine seul (« leboncoin.fr »), lien `target="_blank" rel="noopener noreferrer nofollow"`.
- **Péremption** : futur•e ne sait pas si l'annonce existe encore, et le dit par la forme : « Annonce ajoutée le 2 novembre ». On n'écrit jamais « annonce en ligne ».
- **Doublon** : la même annonce ajoutée deux fois est refusée par l'index unique. La route répond 409, l'écran dit « Ce bien est déjà dans votre liste » et désigne la fiche existante. Deux biens d'un même immeuble restent admis.

### 3.7 Suppression, abandon, compte

- **Écarter** garde la fiche, sa raison et son journal. C'est le geste proposé.
- **Supprimer** efface la fiche et son journal (`on delete cascade`). C'est un geste secondaire, avec une confirmation **dans la page** (jamais `window.confirm`). Il sert à corriger une erreur de saisie ou à exercer le droit d'effacement.
- **Suppression du compte** : `on delete cascade` depuis `auth.users` sur les deux tables.
- **Dossier révoqué ou remplacé** (mig. 31) : la clé étrangère reste en place, mais la lecture ne montre le lien que si le dossier figure dans les dossiers accessibles (les `bien:<id>` de `assemblerVosLieux`, révoqués déjà exclus). Sinon : « Le dossier rattaché n'est plus disponible. »

### 3.8 Confidentialité

- **Entre comptes** : la RLS de lecture « own », des écritures filtrées par `user_id`, et la clé étrangère composée `(dossier_id, user_id)` qui interdit en base de rattacher le dossier d'un autre compte.
- **Contenu payant** : la section des biens ne lit **aucun** `decision_artifact`. Elle n'affiche ni conclusion ni échelle, seulement un lien vers la ligne du dossier, qui garde ses propres règles.
- **Sensibilité** : la migration 26 purge les intentions à 30 jours parce qu'elles disent où quelqu'un envisage de vivre. Ici, c'est la personne qui choisit de garder ces lieux, et elle peut les supprimer. La **politique de confidentialité** doit pourtant le dire : sa liste des données collectées ne mentionne aujourd'hui ni les adresses analysées, ni les biens suivis, ni les notes (D7).
- **Bornes** : corps de requête limité à 4 Kio avec `lireCorpsBorne`. Texte trop long : refus explicite, jamais une coupe silencieuse (doctrine FUT-155). Plafond de biens actifs (D2).

---

## 4. Composants et routes

### 4.1 À créer

| Fichier | Contenu |
|---|---|
| `supabase/39_property_candidates.sql` + `_down.sql` | § 3.2 |
| `src/lib/decision/biens-envisages.ts` | **Pur.** `normaliserSaisieBien` (valide, refuse, ne coupe jamais), `cleDAnnonce`, `domaineAffiche`, `transitionPermise`, `etatProjetALAbandon` (les quatre états du § 3.4), `rattachementsProposes(biens, dossiersAccessibles)` (même `ban_id`, jamais d'écriture), `assemblerBiensEnvisages(...)`, qui rend des fiches d'affichage. |
| `src/lib/server/biens-envisages-store.ts` | `server-only`. `listerBiens` (client de session, RLS, `user_id`), `dernierAbandon` (journal), `creerBien`, `modifierBien`, `supprimerBien` (service role, `eq("user_id")` systématique). |
| `src/app/api/biens/route.ts` | `POST` : création. Pas de `GET` : la page lit en serveur. |
| `src/app/api/biens/[id]/route.ts` | `PATCH` : statut et raison, note, adresse, lien, rattachement (`dossierId` vérifié par `getDossier`). `DELETE`. |
| `src/components/vos-lieux/BiensEnvisages.tsx` | Composant client : liste, formulaire d'ajout replié, changement de statut, note, « Écarter » avec raison, écartés repliés. Aucun brouillon en `localStorage` (§ 6). |
| `src/components/vos-lieux/biens-envisages.module.css` | Grammaire du Relevé, jetons existants. |
| `src/lib/decision/activation-biens.ts` | `biensEnvisagesPour(userId, env)` : `BIENS_ENVISAGES=true` ou `BIENS_ENVISAGES_COMPTES=<uuid>…`. Copie du patron `activation.ts`, éteint par défaut. |

### 4.2 À modifier

| Fichier | Modification |
|---|---|
| `src/app/(account)/rapport/dossiers/page.tsx` | Si l'activation est ouverte : charger les biens en parallèle de `chargerVosLieux`, calculer les dossiers accessibles à partir des `lieux`, puis rendre `<BiensEnvisages>` entre `<VosLieux>` et « Analyser une adresse ». |
| `src/components/vos-lieux/VosLieux.tsx` | *(Facultatif)* `id={l.cle}` sur chaque `<li>`, pour l'ancre « voir son dossier ». Une ligne. |
| `src/app/(public)/politique-confidentialite/page.tsx` | Une puce dans « Données collectées » (texte en D7). |

### 4.3 À ne pas toucher

`address_dossiers` (hors l'index du § 3.2), le webhook Stripe, `/dossier` et la qualification, la route `ouvrir`, `/ou-vivre`, `RepriseRecherche`, la purge de session, `compte/page.tsx`, `comparaison-candidats.ts`, `/api/dossier/actualiser`, le moteur.

---

## 5. Tests indispensables

Règle d'AGENTS.md : « la fiche apparaît » et « la fiche dit vrai » sont deux assertions distinctes. Chaque état est testé **sur le texte rendu**.

**Lib pure (`node --test`)**
1. Saisie : nom vide, nom trop long, commune hors référentiel, adresse sans `ban_id`, lien `javascript:` ou `ftp:`. Chaque cas donne un **refus nommé**, jamais une valeur coupée.
2. `cleDAnnonce` : hôte en majuscules, fragment, barre finale. Deux liens équivalents donnent la même clé, deux annonces distinctes deux clés.
3. Les quatre états du § 3.4, avec **la phrase exacte** pour chacun. Un projet qui ne change que `rawText` donne « aucune phrase ». C'est le contrat de `projetAChangeMateriellement`, revérifié ici.
4. Écarté, repris, écarté de nouveau : la fiche affiche la **dernière** raison et le **dernier** cliché, et le journal en garde deux.
5. Rattachement : un dossier accessible donne le lien. Un dossier révoqué ou absent de la liste donne « n'est plus disponible ». Le dossier d'un autre compte ne s'affiche pas.
6. `rattachementsProposes` : même `ban_id`, une suggestion. Un `ban_id` différent n'en donne aucune. Un dossier déjà rattaché à un autre bien n'en donne aucune. La fonction ne rend jamais d'écriture.
7. **Les trois biens du § 2.2 de bout en bout**. L'ordre suit l'ajout, et aucun champ numérique ne peut servir à trier (même garde que `comparaison-candidats.ts`).
8 bis. **Achat ou location** : un projet de location accepte un bien « À vendre » et inversement. `offer_kind` reste nul si le lecteur ne l'a pas dit, quelle que soit l'intention du projet. Un bien écarté sous `intent: "location"` puis relu sous `intent: "achat"` affiche « Votre projet a changé depuis ». Aucun texte rendu ne contient « achat », « offre », « compromis » ni « acquéreur » (assertion sur le rendu des trois biens, dans les deux intentions).
8. **Aucune fuite payante** : `assemblerBiensEnvisages` n'accepte pas d'artefact dans son entrée, ce que le type et un test sur la source vérifient. Le rendu d'un bien rattaché ne contient pas le texte de la conclusion du dossier.

**Routes (stockage simulé, patron `enregistrerRelationAdresse`)**
9. Sans session : 401. Le bien d'un autre compte : 404, jamais 403 (on ne confirme pas son existence).
10. Corps au-delà de 4 Kio : 413. Doublon d'annonce : 409 avec l'id existant. Plafond atteint : refus nommé.
11. `PATCH dossierId` : `getDossier` est appelé avec l'utilisateur de la session, et un dossier révoqué est refusé.
12. Aucune route n'écrit `user_profiles` (test sur la source, comme FUT-26).

**SQL (lecture du fichier de migration, patron des tests existants)**
13. RLS activée sur les deux tables, `revoke` des écritures pour `authenticated` et `anon`, clé étrangère composée, cascade, fonction du trigger non exécutable par `authenticated`.

**Page**
14. Activation éteinte : la page est **identique** à aujourd'hui (aucune section, aucune requête vers les nouvelles tables).
15. Activation ouverte, zéro bien : la liste des dossiers reste en tête, l'ajout est un bouton replié et la page n'affiche pas d'état vide envahissant.

**Recette manuelle (sur accord, compte de test, jamais un vrai compte)**
16. 1440, 390 et 360 px, sombre et clair, clavier. Les trois biens du § 2.2.
17. RLS réelle : avec le JWT du compte A, tenter de lire ou d'écrire les lignes du compte B par PostgREST. Elle **exige une base non productive** (réserve R1).

---

## 6. Risques de conflit avec FUT-27 (PR #131)

**Fichiers touchés par la PR #131 :** `compte/FormulaireDeconnexion.tsx`, `compte/page.tsx`, `PackConvictionView.tsx`, `ou-vivre/*`, `PersonalTouch.tsx`, `api/project/from-search/route.ts`, `app/layout.tsx`, `FutureELanding.tsx`, `interaction/EcoutePurgeRecherche.tsx`, `interaction/purge-recherche-navigateur.ts`, `report/RepriseRecherche.tsx`, `comparateur/session-ou-vivre.ts`, `decision/recherche-vers-projet.ts`, `purge-recherche.ts`, `reprise-recherche.ts` et leurs tests.

**Recouvrement de fichiers avec ce lot : aucun**, si la liste du § 4.3 est tenue. Les risques sont de sens, pas de texte :

1. **Déconnexion.** FUT-27 purge le navigateur à la déconnexion, pour qu'une recherche ne passe pas au compte suivant. Les biens vivent en base et ne sont pas concernés. Mais un **brouillon de formulaire** en `localStorage` ou `sessionStorage` recréerait la fuite que la contre-revue Work a bloquée. Règle : aucun stockage navigateur dans `BiensEnvisages.tsx`. Si un brouillon devient nécessaire un jour, il doit entrer dans `purge-recherche-navigateur.ts`.
2. **Remplacement du projet** (`from-search` écrit un projet neuf). Comportement voulu : les biens restent, et leur journal garde l'ancien projet. Un test le fixe (le n° 3, cliché présent et signature différente).
3. **« La recherche reste jetable. »** Ne créer aucun bien depuis `/ou-vivre` ni depuis une session de recherche dans ce lot. C'est le domaine de FUT-27, et une commune n'est pas un bien.
4. **Ordre de fusion.** Brancher le lot sur `main` **après** la fusion de #131, ou le réaligner avant sa revue. Les deux PR touchent la même zone conceptuelle, le projet. La revue doit lire le lot avec la purge de FUT-27 déjà en place.

Autres coordinations : **FUT-118** (styles du Relevé partagés, `vos-lieux.module.css` reste intact), **FUT-86** (les routes de lieu par URL viendront plus tard, et les liens du lot n'en dépendent pas), **PR #132 / FUT-170** (accueil, aucun recouvrement).

**Hors lot, signalé en passant :** la RLS de `decision_artifact` (mig. 28) permet à `authenticated` d'insérer, modifier et supprimer **ses propres** artefacts par PostgREST. Un compte pourrait donc réécrire la conclusion figée de son propre dossier. Cela ne touche aucun tiers, mais contredit « une version prête ne se modifie jamais ». C'est à instruire à part et à ne pas mêler à ce lot.

---

## 7. Découpage

### PR 1 (ce lot) : « Les biens que vous envisagez », derrière activation

Contenu : § 3.2, § 4.1, § 4.2 et les tests du § 5. Taille estimée : environ 1 200 lignes, tests compris (migration ~130, lib ~250, store et routes ~300, composant et CSS ~350, tests ~450).

S'il faut plus petit : une **PR 1a**, avec la migration, la lib pure, le store, les routes et leurs tests (aucune surface, activation sans objet), puis une **PR 1b** avec le composant et la page. La 1a se relit sur le fond (droits, journal), la 1b sur l'écran.

### Extensions ultérieures, dans l'ordre recommandé

- **2a. Retrouver le dossier depuis le paiement.** `/dossier?bien=<id>` pré-remplit l'adresse. Le bien est porté par l'intention, puis rattaché **après** confirmation du lecteur sur la page de remerciement. Cela touche le parcours de paiement : revue Stripe et intention complète.
- **2b. « Suivre ce bien » depuis un dossier**, et l'adresse d'un bien qui devient analysée.
- **2c. Dire ce qui a changé** : « Écarté quand vous acceptiez 20 min ; vous acceptez maintenant 30 min. » Il faut un différentiel par critère, en langage du lecteur, à partir des clichés déjà stockés (réutiliser le vocabulaire de FUT-8, étape 8).
- **2d. Communes à explorer** : un objet distinct, articulé avec FUT-27.
- **2e. Le journal visible** (« ce qui a bougé depuis votre dernière visite », direction C du cadrage).
- Ensuite seulement : FUT-21 (vérifications structurées), FUT-22 (comparaison), FUT-122 (actualisation groupée), FUT-49 (droits du Pass, rattachés à ces biens et à un futur identifiant de projet).

---

## 8. Instruction directement exploitable par Claude Code

> À donner **après** les décisions du § 9 et la fusion de la PR #131.

```
Ticket : FUT-41, deuxième lot, PR 1 « Les biens que vous envisagez ».
Référence de conception : docs/audits/2026-11-08-fut41-memoire-multi-biens.md (§ 2 à 5, décisions § 9 telles que tranchées).

Préalables
- Relire FUT-41 et ses commentaires dans Linear (version à jour) ; vérifier que la PR #131 est fusionnée, sinon s'arrêter et le signaler.
- Branche depuis origin/main à jour, au nom Linear du ticket ; worktree dédié.
- Lire node_modules/next/dist/docs/ pour les Route Handlers et les composants serveur avant d'écrire une route (AGENTS.md).

Périmètre (rien d'autre)
1. supabase/39_property_candidates.sql et _down.sql selon § 3.2, avec les valeurs de D1, D2, D3, D9.
   Achat ET location : aucun texte, statut ni exemple ne suppose un achat (§ 2.4) ; tests 8 bis.
   NE PAS appliquer la migration : ni en local (.env.local pointe sur la production), ni en production.
2. src/lib/decision/biens-envisages.ts (pur) et ses tests, d'abord en échec puis verts : tests 1 à 8 du § 5.
3. src/lib/server/biens-envisages-store.ts ; src/app/api/biens/route.ts (POST) ; src/app/api/biens/[id]/route.ts (PATCH, DELETE). lireCorpsBorne à 4 Kio ; écritures service role filtrées par user_id ; dossierId vérifié par getDossier ; tests 9 à 12 avec stockage simulé.
4. src/lib/decision/activation-biens.ts, copie du patron src/components/releve/activation.ts, éteint par défaut.
5. src/components/vos-lieux/BiensEnvisages.tsx et son module CSS (grammaire du Relevé) ; branchement dans src/app/(account)/rapport/dossiers/page.tsx entre <VosLieux> et « Analyser une adresse », seulement si l'activation est ouverte.
6. Politique de confidentialité : la puce validée en D7.
7. Test SQL sur le texte de la migration (test 13) ; tests de page 14 et 15.

Interdits
- Aucune ligne address_dossiers créée ou modifiée ; aucun decision_artifact lu dans la section des biens ; aucune écriture de user_profiles.
- Aucun score, aucun tri autre que l'ordre d'ajout, aucune comparaison, aucune génération, aucun paiement.
- Aucun présupposé d'achat : textes, statuts et exemples valent pour une location ; la nature du bien n'est jamais déduite du projet (D9).
- Aucun stockage navigateur (localStorage, sessionStorage) dans le composant.
- Ne pas toucher : webhook Stripe, /dossier, qualification, rapport/dossiers/ouvrir, /ou-vivre, RepriseRecherche, purge FUT-27, compte/page.tsx, comparaison-candidats.ts, actualiser.
- Liens vers des routes qui écrivent : <a> natifs, jamais <Link>.
- Lien d'annonce : jamais suivi par le serveur, jamais envoyé à PostHog, à un modèle ou dans un journal ; affiché par son domaine.
- Texte : « projet » en minuscule ; pas de tiret cadratin ; espaces insécables (bindOrphans) sur les phrases d'état.

Vérifications avant push
- npm test (suite complète), tsc, lint ciblé, build.
- Recette visuelle sur un banc /dev/biens-envisages à fixtures (404 en production, patron /dev/vos-lieux) : 1440, 390, 360 px, sombre et clair, clavier, les trois biens du § 2.2.
- Pousser la branche ; ne pas ouvrir, fusionner ni déployer. Compte rendu : ce qui est vérifié, ce qui ne l'est pas (RLS réelle, compte connecté), risques.
```

---

## 9. Décisions à prendre avant le code

| # | Question | Recommandation |
|---|---|---|
| D1 | Les statuts | **À étudier, À visiter, Visité, Écarté.** « Choisi » et « En course » attendent le test : « Choisi » clôt une recherche, ce que ce lot ne sait pas encore accompagner. |
| D2 | Le plafond de biens actifs par compte | **30** (les écartés ne comptent pas). C'est une borne de sûreté, pas une offre : FUT-49 la reprendra. |
| D3 | La raison d'abandon : obligatoire ? | **Oui, 1 à 500 caractères.** C'est la valeur du geste. Sans raison, « Écarté » ne mémorise rien. |
| D4 | Le titre et la place de la section | « **Les biens que vous envisagez** », **sous** les dossiers et au-dessus de « Analyser une adresse ». |
| D5 | L'activation | **Par compte** d'abord (porteur et deux ou trois personnes, protocole Y7), puis générale sur décision. |
| D6 | La requête des liens d'annonce | **La garder** (certains sites en ont besoin). On n'affiche que le domaine, et le lien ne sort jamais du compte. |
| D7 | La politique de confidentialité | Ajouter : « Les biens que vous choisissez de suivre (nom, commune, adresse, lien d'annonce, notes), conservés dans votre espace jusqu'à ce que vous les supprimiez. » |
| D8 | L'application de la migration | Sur une base **non productive** d'abord (branche Supabase ou projet temporaire) pour le test RLS n° 17, puis en production par le porteur après contre-revue du SQL. |
| D9 | La nature du bien (à louer, à vendre) | **Un champ facultatif**, sans valeur par défaut, jamais déduit de l'intention du projet. Il permet une recherche qui hésite entre louer et acheter, et un test du § 5 le verrouille. |

---

## 10. Conclusion : GO avec réserves

**Pourquoi GO.** Le besoin est le premier prototype que FUT-41 demande depuis le 30/09 : quelques biens, un statut, une vérification, un motif d'abandon, un ajout facile. Les fondations existent : le cliché de projet comparé par `projetAChangeMateriellement`, le référentiel de communes, l'autocomplétion BAN, la vérification de propriété d'un dossier et le patron d'activation par compte. Le lot ajoute un objet **sans droit**, à côté des objets payants, sans rien toucher du parcours de paiement. La seule modification en base de `address_dossiers` est un index sur une clé déjà unique.

**Réserves**

- **R1. Aucune base de test.** La RLS des deux nouvelles tables ne peut être éprouvée qu'en production, puisque `.env.local` pointe sur la production. Il faut une branche Supabase ou un projet temporaire pour le test n° 17 avant toute application (D8).
- **R2. Les décisions D1 à D9** doivent être tranchées avant le code (doctrine : une convention chiffrée se présente avant d'être codée).
- **R3. Fusion de la PR #131 d'abord**, ou réalignement avant la revue (§ 6).
- **R4. La valeur n'est pas prouvée.** Le lot reste derrière l'activation par compte jusqu'à un retour du test à trois personnes. Il ne s'annonce pas publiquement et ne s'associe à aucune offre.
- **R5. L'étape 5 de la mission n'est couverte qu'à moitié.** Le dossier se retrouve depuis le bien par un rattachement proposé, mais le paiement d'un dossier ne part pas encore de la fiche (extension 2a, qui touche le parcours de paiement).
