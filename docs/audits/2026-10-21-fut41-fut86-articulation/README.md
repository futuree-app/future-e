# FUT-41 · FUT-86 · Le Relevé, les dossiers achetés et Ma décision

21 octobre 2026 · branche `explore/fut-41-centre-decision` · passe d'articulation produit, **sans
implémentation**. Aucun changement du moteur, des paiements, des droits, de la base ni des prix ; aucun
achat, aucune génération payante, aucun appel IA ; `main` et les branches FUT-118 / FUT-91 / FUT-119 ne
sont pas touchées ; `DECISION_RELEVE` n'est pas activé.

## 0. En bref

**Le parcours cible.** Une personne achète un dossier, lit son Relevé, puis trouve dans **Ma décision**
le lieu qu'elle vient de payer, avec la conclusion exacte de son dossier, sa date et son état (« à jour »
ou « votre Projet a changé »). De là, elle rouvre le même Relevé, ajoute d'autres lieux, et compare ce
qui se compare vraiment. « Mon rapport », « Mes biens » et « Mes dossiers » disparaissent comme
destinations distinctes : il n'y a plus qu'un espace, **Ma décision**, et la profondeur d'un lieu, **son
Relevé**.

**Ce que les données réelles ont montré** (moteur de `main` exécuté en local sur des communes et des
bâtiments publics, § 4) :

1. le produit sait déjà dire, pour chaque lieu acheté, sa conclusion exacte, sa date et si elle répond
   encore au Projet : **le premier lot ne demande ni migration ni changement du moteur** ;
2. **une adresse peut contredire sa commune** : à Nîmes, l'accès aux soins est « favorable » à la
   commune et « compromis » à l'hôtel de ville. Le moteur refuse déjà de porter un résultat communal sur
   une adresse : l'interface doit faire de même (correction A) ;
3. **changer un seul poids du Projet rend aujourd'hui toute une comparaison « hors cadre »**, alors que
   les cinq issues restent identiques : la règle critère par critère de FUT-22 est nécessaire, pas
   seulement souhaitable ;
4. le registre des conditions ne porte **ni l'échelle ni la source** de chaque issue ; elles se
   retrouvent par les règles (`ruleIds`), et **certaines issues n'ont aucun constat** (non établi,
   ou établi sans fait) : la fiche doit le dire, pas l'inventer.

**Le plus petit parcours implémentable** (lot 1, § 8) : transformer la page « Mes biens »
(`/rapport/dossiers`) en **« Vos lieux » de Ma décision** : chaque lieu acheté (bien ou commune seule)
avec son emblème d'échelles, la conclusion de son dossier citée mot pour mot, sa date, son état
d'actualisation et le lien vers son Relevé. Données existantes, aucune table, aucune règle nouvelle.

## 1. La navigation actuelle (audit de `main`, 3da725e3)

### 1.1 Ce que voit la personne

| Situation | Barre de navigation | Boutons de la barre |
| --- | --- | --- |
| Visiteur | Où vivre · Explorer · Mon rapport · Mes biens · Comparateur · Pourquoi futur•e | Se connecter · Commencer |
| Connecté (pages publiques) | idem | Mon compte · Mon rapport |
| `/rapport` (hub) | idem | page par page |
| Territoire, Autour, Logement | idem | Mon rapport · Analyser une adresse |
| `/rapport/dossiers` | idem | Mon compte · Mon rapport |
| `/dossier/merci` (après achat d'une adresse) | idem | Mes biens |
| `/merci` (après achat d'un territoire, cas 3-D Secure) | aucune | lien « Ouvrir mon dossier » |
| `/compte` | idem | Analyser une adresse · Mon rapport ; section « Mes biens analysés » |
| En-tête du Relevé (sous `DECISION_RELEVE`) | | « Dossier · Ma décision » |

**Six noms pour deux choses** : « Mon rapport », « Mes biens », « Mes biens analysés », « Ouvrir mon
dossier », « Mon compte » et, dans le Relevé, « Ma décision ». Le même espace s'appelle « rapport »
dans la barre et « décision » dans la page.

### 1.2 Les routes et la façon dont elles choisissent le lieu

| Route | Ce qu'elle affiche | Comment le lieu est choisi |
| --- | --- | --- |
| `/rapport` | le hub : verdict, cartes, contrôles de la commune lue, et du bien retenu | **l'état du compte** : `user_profiles.active_insee_code` (sinon la résidence), puis `choisirDossierActif` (le bien actif s'il est dans la commune, sinon le plus récent). **L'adresse de la page ne dit pas quel lieu** |
| `/rapport/quartier` (Territoire) | le module communal | même état ; renvoie à `/rapport` sans droit |
| `/rapport/autour`, `/rapport/logement` | les modules à l'adresse | `?dossierId=` dans l'URL ; sans lui, repli sur le bien actif ou unique ; après affichage, `POST /api/dossier/actif` pose le triplet commune / nom / bien |
| `/rapport/dossiers` (« Mes biens ») | les biens, puis les territoires achetés sans bien | liens vers les routes ci-dessous |
| `/rapport/dossiers/ouvrir?id=&vers=` | | **GET à effet de bord** : pose le triplet, puis redirige (`dossier` → `/rapport`, `commune` → `/rapport/quartier`, `autour`, `logement`) |
| `/rapport/territoire?insee=&nom=` | | **GET à effet de bord** : vérifie le droit, pose la commune et **le nom tel que l'URL le donne**, efface le bien actif |
| `/rapport/residence` | | GET : remet la résidence |
| Achat d'un territoire | `/territoire/[insee]/debloquer` → paiement → `/api/territoire/activer` → `/rapport` | (périmètre FUT-119, lu sans modification) |
| Achat d'une adresse | `/dossier` → `/checkout/dossier` → `/dossier/merci` → « Mes biens » | le webhook Stripe pose le triplet |
| Visiteur sur `/rapport*` | | `requireCurrentUser` renvoie à la connexion |

### 1.3 Peut-on afficher silencieusement le mauvais lieu ?

Le code a déjà fermé plusieurs cas (bien actif ignoré s'il est dans une autre commune, triplet posé d'un
seul geste, lieu nommé à l'écran, échec d'écriture journalisé et rendu). Il reste quatre risques :

| # | Risque | Scénario | Gravité | Proposition |
| --- | --- | --- | --- | --- |
| R1 | **Même adresse de page, lieux différents** | onglet A sur le hub de Nantes ; onglet B ouvre le logement de La Rochelle ; on rafraîchit A : il affiche La Rochelle. Idem pour un signet ou le bouton retour | moyenne : le nom du lieu est affiché, mais rien ne dit qu'il a changé | porter le lieu **dans l'URL** (`/rapport?lieu=…`), l'état du compte devenant un simple repli ; si l'URL et l'état divergent, l'URL gagne |
| R2 | **Liens GET qui écrivent** | un futur `<Link>` posé sans `prefetch={false}` changerait le lieu au seul survol | faible aujourd'hui, piège pour demain | disparaît avec R1 (l'URL suffit) |
| R3 | **Nom libre dans `/rapport/territoire`** | `nom=` est écrit tel quel dans `active_commune` ; même classe de défaut que FUT-119 | faible (propre compte, lien fabriqué) | relevé ici, non modifié ; à rattacher à FUT-119 si vous le décidez (je n'ai pas commenté ce ticket) |
| R4 | **Deux vocabulaires** | « Mon rapport » mène à une page titrée « Ma décision » (sous le Relevé) | confusion, pas d'erreur | lot 0 (FUT-86) |

## 2. L'architecture cible

```
AUJOURD'HUI                                         CIBLE
─────────────────────────────────────────────       ─────────────────────────────────────────────
Barre : Où vivre · Explorer · Mon rapport ·         Barre : Où vivre · Explorer · Ma décision
        Mes biens · Comparateur · Pourquoi                  + « Analyser une adresse » · Compte

Mon rapport (/rapport)  ── lieu = état caché        Ma décision (/rapport, URL conservée)
  ├─ Territoire (/rapport/quartier)                   ├─ Vos lieux        (ex-« Mes biens »)
  ├─ Autour (/rapport/autour?dossierId)               │    un lieu = emblème, conclusion citée,
  └─ Logement (/rapport/logement?dossierId)           │    date, à jour ou non → son Relevé
                                                      ├─ Comparer         (dès deux lieux analysés)
Mes biens (/rapport/dossiers)                         ├─ Faire le point   (dès deux lieux)
  ├─ ouvrir (GET, écrit l'état)                       └─ Votre Projet
  └─ territoire (GET, écrit l'état)
                                                    Le Relevé d'un lieu (/rapport?lieu=…)
Comparateur (/comparateur, global)                    Synthèse · Territoire · Autour · Logement
Compte (/compte : biens analysés, plan, CTA)          fil : Ma décision / le lieu / l'échelle
                                                      retour : « Retrouver ce lieu dans Ma décision »

                                                    Compte : e-mail, achats et factures, données
                                                    Comparateur public : dans Où vivre (FUT-86)
```

Règles qui découlent de l'audit :

1. **Ma décision est l'espace ; Ma recherche n'est pas une page.** Avec un seul lieu, Ma décision montre
   ce lieu et ouvre son Relevé ; dès deux lieux, elle montre « Vos lieux » et propose de comparer. Le
   mot « recherche » n'apparaît que lorsque la personne cherche (plusieurs lieux).
2. **Le Relevé est la profondeur d'un lieu**, jamais un second espace. On y entre depuis un lieu, on en
   ressort vers ce lieu.
3. **Le lieu affiché est toujours dans l'URL** (R1). L'état du compte ne sert qu'à rouvrir le dernier
   lieu quand l'URL n'en désigne aucun, et l'écran le dit (« le dernier lieu que vous avez ouvert »).
4. **« Mes dossiers » n'est plus une destination** : les achats et factures vont dans le Compte ; les
   lieux achetés sont dans Ma décision. Aucun lieu n'a deux maisons.

## 3. La matrice des parcours

| | Visiteur | Premier achat Territoire | Achat d'une adresse | Plusieurs dossiers | Résident, sans recherche |
| --- | --- | --- | --- | --- | --- |
| **Entrée** | Où vivre, ou « Analyser une adresse » | page de déblocage de la commune | `/dossier` | Ma décision | Ma décision |
| **Aujourd'hui, après paiement** | | `/rapport` (hub de la commune) | `/dossier/merci` puis « Mes biens » | | rapport partiel gratuit de sa commune |
| **Cible, après paiement** | | le Relevé de la commune ; en bas, « Retrouver ce lieu dans Ma décision » | le Relevé de l'adresse (trois échelles), même pont | | |
| **Aujourd'hui, au retour** | | « Mon rapport » rouvre le dernier lieu posé, sans le dire | « Mes biens » ou « Mon rapport », deux portes | le hub rouvre le dernier lieu ; changer passe par « Mes biens » (GET qui écrit) | « Mon rapport » |
| **Cible, au retour** | | Ma décision : un lieu, sa conclusion, son état | idem | **Vos lieux** : chaque lieu, sa conclusion, son état ; un clic ouvre son Relevé, l'URL le désigne | Ma décision titrée « Port-Anvel, où vous habitez » ; aucun comparer ni point ; « Envisager un autre lieu » |
| **Comparer** | Comparateur dans Où vivre | non proposé (un lieu) | non proposé | dès deux lieux analysés, sur ce qui se compare | non proposé |
| **Compte** | | e-mail, achats, factures | idem | idem | idem |

## 4. Confronter la V3.2 au moteur réel

### 4.1 Méthode

Le moteur de `main` est exécuté **en local, en lecture seule**, par un script
(`outils/confrontation.ts`) qui appelle les fonctions de production : `buildCommuneDossier`,
`assembleAddressDossier`, `calculerVoisinage`, `fetchPermisAutour`, `buildDecisionArtifact`,
`comparerDeuxCandidats`, `signatureDecisionnelle`, `projetAChangeMateriellement`. Les sources ouvertes
(BAN, DRIAS, Géorisques, OSM, IGN, Sitadel) sont interrogées en direct ; **la base est remplacée par
une adresse factice injoignable**, de sorte qu'aucune lecture ni écriture de production n'est possible.
Lieux : Nîmes (30189), Montpellier (34172), l'hôtel de ville et la place de la Maison Carrée à Nîmes,
bâtiments publics. Résultat complet : `confrontation-moteur-reel.json`.

**Ce que je n'ai pas fait.** Aucun compte réel n'a été lu : vérifier le parcours connecté sur un compte
(achat de test, plusieurs dossiers) demanderait une autorisation et un compte de test, que je n'ai pas
utilisés. Les adresses de test n'ont **pas de diagnostic de performance énergétique choisi** : l'échelle
du logement y est partielle. La version « engine-5 » est simulée en changeant la seule étiquette.

### 4.2 Les six situations

| # | Situation | Ce que dit le moteur | Conséquence pour la V3.2 |
| --- | --- | --- | --- |
| 1 | **Territoire seul** (Nîmes, Projet P1) | verdict « Nîmes répond moins bien à une de vos priorités : des étés supportables. » (le même que les captures FUT-91) ; 5 conditions : chaleur `mismatch`, vie locale et soins `favorable`, nature `indeterminate`, inondation `reserve` | la conclusion se cite telle quelle (`narrativePlan.verdict.headline.text`, `verdictLabel`, `generatedAt`) |
| 2 | **Adresse, trois échelles** (hôtel de ville, abords calculés) | même verdict, périmètre `commune+adresse` ; abords calculés (9 champs, permis lus) | l'emblème peut dire les échelles examinées à partir du périmètre |
| 3 | **Deux adresses dans la même commune** (avec calme, transports, soins, mer) | même cadre ; soins `reserve` **à l'adresse**, alors que la commune dit `favorable` ; transports `reserve` établis **à l'adresse** ; calme `favorable` à la commune mais **non examiné** à l'adresse | **une adresse ne peut pas hériter de sa commune** ; le moteur le fait déjà pour le calme (« un satisfied communal porté sur une adresse est un mensonge silencieux », `materiality-rules.ts`) |
| 3 bis | Adresse contre commune seule | « pas la même échelle » : toute différence devient hors cadre | une condition établie à la commune des deux côtés se compare pourtant (FUT-22) |
| 4 | Lieu enregistré sans analyse | n'existe pas en production | état à créer (décision de stockage, § 7) |
| 5 | **Deux versions du Projet** | un poids passé de 2 à 3 : **les cinq issues restent identiques**, mais la comparaison est déclarée « ne répondent pas au même projet » ; une condition confirmée : **une seule** issue change (chaleur `mismatch` → `to_confirm`) | preuve réelle que la règle critère par critère (note FUT-22) est nécessaire |
| 5 bis | Deux versions du moteur | tout hors cadre | conforme à la note FUT-22 tant que la table des règles touchées n'existe pas |
| 6 | **Dossier ancien** | `projetAChangeMateriellement` vrai pour le changement de poids, alors qu'aucune issue ne change ; la mise à jour (`/api/dossier/actualiser`) crée une version n+1, l'ancienne reste lisible, **sans achat** | la fiche peut dire « répond à votre Projet du … » ; elle ne peut pas dire si la mise à jour changerait quelque chose sans la lancer |

### 4.3 Les écarts entre la V3.2 et le réel

| # | La V3.2 supposait | Le réel | Correction |
| --- | --- | --- | --- |
| E1 | chaque condition a une valeur, une échelle et une source | le registre ne porte que l'issue ; l'échelle et la source sont dans les **faits** du dossier, reliés par `ruleIds` (vérifié : chaleur dans une composition, inondation dans une vérification, soins dans une carte) | la fiche lit les faits par `ruleIds`, pas le registre seul |
| E2 | chaque condition a un constat | « nature » : `indeterminate`, aucun fait ; « calme » communal : `favorable`, **aucun fait** | la fiche dit « établi sans constat détaillé » ou « non établi », sans source inventée |
| E3 | une ligne par échelle (commune, abords, logement) | **une seule issue par condition**, la plus fine ; les faits gardent leurs échelles (`commune`, `adresse`) | la fiche montre l'issue retenue et, en marge, les échelles des faits ; le détail par échelle reste au Relevé |
| E4 | deux adresses d'une commune partagent un socle « dit une fois » | le moteur compare et compte `meme_lecture` sur les conditions communales, comme deux lectures | l'interface dit « une seule lecture de la commune » ; le moteur n'a pas la notion (à ajouter avec FUT-22) |
| E5 | la conclusion de la fiche est composée | elle existe, figée, dans l'artefact | citée mot pour mot (correction E) |
| E6 | « Mettre à jour » est une simulation | c'est une vraie route, gratuite, qui garde l'ancienne version | conforme ; à brancher tel quel |
| E7 | un lieu enregistré, un aperçu | n'existent pas | inchangé : propositions, décision X3 de la V3.2 |

## 5. Les corrections de la V3.3

Prototype `prototype-v3-3.html` (dans le dossier de la V3.2), données fictives ; V1 à V3.2 intactes.

| | Retour de la revue | Ce que fait la V3.3 |
| --- | --- | --- |
| **A** | une adresse seulement enregistrée propose « Comparer avec » | le geste **n'est proposé que si quelque chose se compare** (échelles lues des deux côtés, hors lecture partagée) ; sinon une phrase dit pourquoi (« même commune, et l'adresse de ce lieu n'est pas analysée ») ; « Comparer … à l'échelle de la commune » quand seule la commune se compare. La comparaison s'ouvre sur **« Se compare / Ne se compare pas »** ; une échelle lue d'un seul côté ne devient plus une piste. La fiche d'une adresse enregistrée titre « Ce que dit la commune de Port-Anvel » et précise que ces résultats ne portent pas sur l'adresse |
| **B** | « Faire le point » trop long sur mobile | la situation d'abord, en une ou deux phrases ; puis la rangée des lieux, **en liste compacte** sur mobile ; l'explication des formes est **repliée** (« Que disent ces formes ? ») ; puis hésitations, actions, provenance |
| **C** | la ligne entre les deux issues suggère une distance | variante **face-à-face** : aucune ligne, deux marques aux bords, un filet vertical au milieu ; la ligne V3.2 reste disponible pour comparer (« Pistes » dans la bande) |
| **D** | 10 px de marge à 360 px, trop fragile | mesuré sur 6 formats × 4 moments, avec et sans noms longs (`mesure-pli-v3-3.txt`) ; au lieu de resserrer les espaces, **le Projet passe en une ligne sur téléphone dès deux lieux**, et la seconde phrase d'accueil (redite par la tuile) n'est plus affichée sur mobile. Sans la bande de démonstration (donc comme dans le produit) : premier lieu visible avec **au moins 158 px de marge à 360 × 780**, au moins 18 px à 360 × 640 avec des noms longs ; **à 320 × 568, le premier lieu reste sous le pli** (le geste principal, lui, est visible) |
| **E** | retrouver la conclusion exacte du Relevé, datée et actualisée | la fiche cite **la conclusion de son dossier**, produite par la même fonction que le Relevé, avec sa date et « à jour » ou « répond à votre Projet du 8 sept. » ; une conclusion ancienne garde **les valeurs de son Projet** (« une gare à moins de 20 min »), jamais celles d'aujourd'hui ; « Ouvrir le Relevé complet » mène au même lieu, à la même version, et le fil ramène à la fiche. Une adresse enregistrée dit « Aucun dossier ne conclut encore sur cette adresse » |
| **F** | terminologie | « Votre Projet » pour l'objet, partout (rapport compris) ; « projet » au sens courant ; « À vérifier » pour une vérification courante (voir § 6) |

Et pour la navigation : la barre du prototype devient « Où vivre · Explorer · Ma décision » ; le fil
commence par « Ma décision » ; le Relevé d'un lieu s'ouvre depuis sa fiche et y ramène. Une situation
« résidence » montre la personne qui lit sa commune sans chercher ailleurs.

## 6. Conventions à soumettre à FUT-118

Formulées ici, **non inscrites dans FUT-118** :

1. **« Votre Projet »**, avec majuscule, quand le mot désigne l'objet du produit (ce que la personne a
   déclaré chercher) ; « projet » en minuscule au sens courant (« votre projet de déménagement »). Cela
   change le Relevé de production, qui écrit « votre projet » : « Ce qui correspond à votre projet »,
   « Votre projet face au lieu », le verdict.
2. **« À vérifier »** pour ce que la personne peut vérifier elle-même (appeler un cabinet, visiter le
   soir) ; **« Contrôle officiel »** réservé aux démarches réglementaires qui ont un document de
   référence (état des risques ERRIAL, règlement de zone, avis de l'Architecte des Bâtiments de
   France). Le Relevé de production, qui titre « À contrôler » pour les deux, se scinderait ainsi.
3. **L'emblème d'un lieu en petit** (32 à 64 px), avec ses trois états de trait, pour toute liste de
   lieux.
4. **La marge en ligne sous 900 px** (une ligne mono, sans filet pointillé).
5. **Une « explication repliée »** (`+ Que disent ces formes ?`) plutôt qu'une légende permanente.

## 7. Le parcours de référence

Bande « Démonstration » du prototype V3.3 : **« Depuis un rapport : commune »**.

1. **Achat ou ouverture d'un rapport Territoire** : le Relevé de Port-Anvel, daté (« Version du 9 oct. »).
   *(Le paiement lui-même n'est pas rejoué : il relève des routes existantes et de FUT-119.)*
2. **Lecture du Relevé** : plaque, emblème, balance, marges.
3. **« Retrouver ce lieu dans Ma décision »** : le lieu apparaît, « vient de votre dossier du 9 oct. ».
4. **Retour au même Relevé** : la fiche cite la conclusion ; « Ouvrir le Relevé complet » rouvre le même
   lieu, la même version ; le fil « Ma décision / Port-Anvel / Relevé » ramène à la fiche (vérifié par
   test : même lieu, même texte de conclusion).
5. **Enregistrer un deuxième lieu** : Ploubrec, « enregistré · rien n'est encore lu ».
6. **Aperçu, puis analyse** : aperçu gratuit (trois conditions à la commune), puis analyse simulée.
7. **Comparer ce qui se compare** : « Se compare : la commune » (deux communes).
8. **Faire le point, puis retour aux preuves.**

**Depuis un Dossier Adresse** (« adresse ») : même chemin ; l'emblème et chaque marge gardent les trois
échelles. **Ajouter une deuxième adresse dans la même commune** : elle est « adresse enregistrée,
commune analysée » ; **« Comparer » n'est pas proposé**, la fiche dit pourquoi ; après analyse,
« Se compare : les abords et le logement · Ne se compare pas : la commune (une seule lecture) ».

**La personne qui lit seulement sa commune de résidence** (« résidence ») : Ma décision s'ouvre sur
« Port-Anvel, où vous habitez », la conclusion de son dossier et « Lire le Relevé de Port-Anvel ».
Aucun « Comparer », aucun « Faire le point », aucun vocabulaire de recherche ; « Envisager un autre
lieu » reste discret. C'est la même page : elle devient une recherche le jour où un deuxième lieu
arrive.

## 8. Le cadrage d'implémentation

| Lot | Contenu | Ticket | Dépendances | Fichiers | Risques |
| --- | --- | --- | --- | --- | --- |
| **0** | Libellés : « Mon rapport » → « Ma décision » (barre, boutons de session, pages du compte) ; « Mes biens » et « Comparateur » quittent la barre ; « Analyser une adresse » explicite | FUT-86 | aucune | `src/config/navigation.ts`, `src/lib/navbar-session.ts`, les `ctas` de `rapport/quartier`, `rapport/dossiers`, `LogementModule`, `AutourModule`, `compte`, `compte/memoire`, `dossier/merci` | faible ; tests de `navbar-session` |
| **1** ★ | **« Vos lieux » de Ma décision** : `/rapport/dossiers` liste chaque lieu acheté (bien ou commune seule) avec emblème (périmètre), conclusion citée (dernière version prête de l'artefact), date, état (`projetAChangeMateriellement`), « Ouvrir le Relevé » (routes `ouvrir` existantes) ; le Relevé gagne le lien retour | FUT-41 | lot 0 conseillé, pas obligatoire | `rapport/dossiers/page.tsx` ; un module pur `src/lib/decision/lieux-possedes.ts` (assemble une ligne par lieu, testé) ; lecture par `decision-artifact-store` (une requête par compte, pas une par lieu) ; `EmblemeEchelles` existant | performance de lecture des artefacts (à grouper) ; dossiers sans artefact (antérieurs au 05/08) : « conclusion indisponible », jamais recomposée |
| **2** | **Le lieu dans l'URL** (`/rapport?lieu=`), l'état du compte en repli ; fil « Ma décision / lieu / échelle » ; fin des GET qui écrivent | FUT-86 (navigation) avec FUT-41 | lot 1 | `rapport/page.tsx`, `rapport/quartier/page.tsx`, `lib/active-territory.ts`, `lib/dossier-actif.ts`, `rapport/dossiers/ouvrir/route.ts`, `rapport/territoire/route.ts` | moyen : nombreux tests existants sur le lieu actif à garder verts |
| **3** | Activer le Relevé dans Ma décision (`DECISION_RELEVE`) | FUT-91 / FUT-118 | revue du porteur (X1) | drapeau seulement | Safari et thème clair non vérifiés (FUT-118 § 2.4) |
| **4** | Comparer deux lieux possédés, sur la règle critère par critère et la notion de lecture partagée | FUT-22 | contrat FUT-22 adopté | `comparaison-candidats.ts`, schéma de l'artefact (version) | moteur et schéma : décision séparée |
| **5** | Lieux enregistrés et aperçu | FUT-41 | décision de stockage (X3) | à définir | migration si table |
| **6** | « Faire le point » | FUT-41 | lots 1, 4, 5 | | |

**Pourquoi le lot 1 d'abord.** Il sert dès aujourd'hui les acheteurs réels (14 dossiers payés mesurés en
septembre) sans rien supposer : chaque ligne vient d'une donnée existante, la conclusion est citée et
datée, l'état d'actualisation existe déjà. Il remplace une page (« Mes biens ») plutôt que d'en ajouter
une, et il pose l'objet « lieu » sur lequel tout le reste s'appuie.

## 9. Qui porte quoi

| Ticket | Responsabilité dans ce chantier |
| --- | --- |
| **FUT-86** | la barre et les mots de la navigation (lot 0), le lieu dans l'URL et le fil (lot 2), le compte ramené à ses fonctions |
| **FUT-41** | Ma décision comme espace : « Vos lieux » (lot 1), états de connaissance (lot 5), « Faire le point » (lot 6), le pont Relevé ↔ Ma décision |
| **FUT-22** | la comparaison : contrat critère par critère, lecture partagée, comparaison de lieux possédés (lot 4) |
| **FUT-118** | la grammaire visuelle et les conventions partagées (§ 6), sans composant métier du centre |
| **FUT-91** | l'activation du Relevé dans le hub (lot 3) |
| **FUT-119** | l'identité nom / INSEE au déblocage ; R3 (`/rapport/territoire?nom=`) relève de la même classe de défaut (décision Y8) |

## 10. Contrôles

**Parcours automatique V3.3** (`outils/tour33.cjs`, Chrome) : 14 situations, 5 largeurs (1440, 1024,
820, 390, 360). **Résultat : aucune erreur.** En plus des contrôles de la V3.2 (marges fidèles aux
données, états de connaissance, aucun bouton d'achat, débordement, vocabulaire, clavier, mouvement
réduit), il vérifie que :

- **A** : aucune piste n'est dessinée hors des échelles qui se comparent ; le geste « Comparer » n'est
  proposé que si quelque chose se compare ; une adresse enregistrée dans la même commune ne propose pas
  « Comparer » et titre « Ce que dit la commune » ; le périmètre « Se compare : la commune » est dit
  pour deux communes ;
- **C** : en face-à-face, aucune ligne n'est dessinée ;
- **B** : l'explication des formes est repliée par défaut dans « Faire le point » ;
- **E** : pour chaque lieu analysé, la conclusion de la fiche est **exactement** celle du Relevé, le
  Relevé ouvert est celui du même lieu, et le fil ramène à la même fiche ; la conclusion d'un dossier
  ancien est datée (« répond à votre Projet du 8 sept. ») et ne contient pas la valeur actuelle
  (« 30 min ») ;
- **résidence** : le geste ouvre le Relevé ; ni « Faire le point » ni « Comparer » ne sont proposés.

**Premier écran mobile** : mesuré séparément (`mesure-pli-v3-3.txt`), § 5 D.

**Confrontation au moteur réel** : § 4 ; script rejouable.

**Non vérifiés** : un parcours connecté sur un vrai compte (décision Y9) ; Safari ; lecteur d'écran ;
écran non Retina ; la compréhension par des personnes réelles (protocole prêt, non mené).

**Défauts trouvés et corrigés pendant la passe** : une conclusion ancienne était réécrite avec la valeur
actuelle du Projet (« 30 min » au lieu de « 20 min ») ; la fiche d'une adresse enregistrée présentait les
résultats de la commune sous « Ce qu'il faut retenir » ; une phrase « Même commune » répétait le
périmètre ; un lien en fin de phrase laissait un point seul sur une ligne à 360 px ; le test de la
V3.2 supposait encore qu'un aperçu se compare.

## 11. Décisions qui vous reviennent

| # | Décision | Recommandation |
| --- | --- | --- |
| **Y1** | Le lot 1 (« Vos lieux ») comme premier lot à implémenter | oui |
| **Y2** | « Ma recherche » n'est pas une page : Ma décision est l'espace, la recherche une de ses vues | oui |
| **Y3** | Le lieu porté par l'URL (lot 2), l'état du compte en repli | oui |
| **Y4** | Pistes face-à-face (sans ligne) | oui, sous réserve du test à trois personnes |
| **Y5** | Sur téléphone, le Projet en une ligne dès deux lieux | oui |
| **Y6** | « Votre Projet » / « projet », « À vérifier » / « Contrôle officiel » : à soumettre à FUT-118 | oui |
| **Y7** | Mener le protocole à trois personnes avant le lot 1 ou en parallèle | en parallèle : le lot 1 ne dépend pas de ses réponses |
| **Y8** | Rattacher R3 (`/rapport/territoire` écrit le nom de la commune depuis l'URL) à FUT-119 | oui |
| **Y9** | Vérifier le parcours connecté sur un compte de test (achat de test, deux dossiers), ce qui demande votre autorisation | oui, avant le lot 2 |

## 12. Fichiers

- `prototype-v3-3.html` (dossier `2026-10-20-fut41-centre-de-decision/`), lien raw.githack dans
  `pour-chatgpt/LISEZ-MOI.md` ;
- `confrontation-moteur-reel.json` et `outils/confrontation.ts` (avec `alias.mjs`, `register.mjs`) : la
  confrontation, rejouable depuis une copie de `main` ;
- `mesure-pli-v3-2.txt`, `mesure-pli-v3-3.txt`, `outils/pli.cjs` : le premier écran mobile, avant et
  après ;
- `outils/tour33.cjs` : le parcours de test ;
- `protocole-test-trois-personnes.md` ;
- `captures/` : `01` à `04` le parcours depuis le Relevé (commune), `05` à `07` ce qui se compare, `08`
  « Faire le point » (mobile et ordinateur), `09` le dossier ancien (fiche et Relevé), `10` la
  résidence, `11` le premier écran mobile (360 × 640, noms longs, 320 × 568), `12` le Relevé d'une
  adresse, `13` le thème clair, `pistes-*` le face-à-face et la ligne (deux communes, deux adresses,
  sombre et clair, 1440 et 360).
