# Lot 02 Codex : Caen, Brest, Nîmes (15/10/2026)

Trois articles mobilité rédigés, relus et, si nécessaire, corrigés par Codex avec la chaîne existante (`outil/lot.py`), pour juger si Codex convient à la production courante. Rien n'a été retouché à la main depuis le terminal pilote : les textes sont ceux que la chaîne a produits. Ni publication ni fusion. Le lot 01 et l'essai Angers sont inchangés. Lecture : `http://localhost:3155/dev/lot`, lot « 2026-10-lot-02-codex ».

Articles retenus par la chaîne :
- Caen (14118) : `14118/generation/redaction.md` (aucune correction demandée) ;
- Brest (29019) : `29019/generation/correction.md` (une correction) ;
- Nîmes (30189) : `30189/generation/redaction.md` (aucune correction : l'anomalie relevée est « à revoir », sous le seuil de correction).

Relectures : `*/generation/relecture.md` et `relecture.anomalies.json`. Contrôles déterministes : `*.controle.json`.

## Protocole

- **Consignes actuelles**, avec deux ajouts demandés par le porteur avant le lot :
  - rédaction (`redaction/PROMPT_REDACTION.md`, étape 4) : « Quand les faits sélectionnés sont peu nombreux, écrire plus court. Ne pas remplacer les chiffres retirés par des conseils génériques ou répétés. » ;
  - relecture (`redaction/RELECTURE.md`) : une pratique des habitants ne doit pas devenir une recommandation de quartier (point 5) ; millésimes conservés et groupes de communes comparés expliqués dans la méthode (point 7, catégorie `methode`) ; ne pas signaler les simples préférences stylistiques.
- **Rédaction, relecture, correction : Codex**, réglages de l'essai Angers : `gpt-6.1-sol`, raisonnement `high`, `codex-cli 0.160.0`. Abonnement ChatGPT vérifié avant chaque appel (`auth_mode: chatgpt`, aucune clé API, variables de clé retirées de l'environnement) ; l'appel est refusé sinon. Chaque appel part d'une session vierge et éphémère. Codex ne lit que le dossier de session (dossier de la commune et pièces autorisées, en lecture seule) : pas d'écriture, pas de réseau, pas de recherche web, ni configuration utilisateur, plugins, mémoire ou sous-agents. Aucun article précédent n'est accessible. Codex n'a lancé aucune commande.
- **Collecte documentaire : la collecte bornée habituelle (Claude Code, Sonnet 5.5, abonnement claude.ai).** Codex ne sait pas limiter la lecture web au domaine officiel du réseau, condition de la collecte bornée : elle est donc restée sur l'outil habituel.
  - Bibus (Brest) : 2 faits vérifiés (calculateur d'itinéraire, prochains passages) ; tarifs inaccessibles (erreur du site), donc omis.
  - Tango (Nîmes) : 3 faits (gratuité dès 70 ans, validité des guides 2026-2027 dès le 30 août 2026, guides en PDF).
  - Caen : aucun jeu de données de réseau urbain couvrant l'agglomération sur transport.data.gouv.fr. Le réseau est omis, rien n'est inventé.
- **Une rédaction, une relecture, au plus une correction** par commune, sans nouvel essai automatique. Aucun refus ni interruption : la reprise n'a pas servi.

## Erreurs relevées par la chaîne

| Commune | Contrôle déterministe | Relecture Codex | Correction |
|---|---|---|---|
| Caen | 0 anomalie | 0 anomalie | non |
| Brest | 0 (rédaction et correction) | 2 bloquantes : « Saint-Martin constitue une piste à examiner si vous souhaitez réduire la place de la voiture » (pratique devenue recommandation de secteur) ; méthode sans la règle de choix des six communes de travail | oui, les deux corrigées |
| Nîmes | 0 anomalie | 1 à revoir : « Le dossier ne croise pas… » (vocabulaire interne dans la méthode) | non (sous le seuil) |

Tous les chiffres des trois articles ont la valeur du dossier, avec la bonne population :
- Caen : 42 % et 72 % ; 35 % et 95 % ;
- Brest : 42 % et 87 % ; 56 % et 80 % ; 100 %, 98 % et 79 % ;
- Nîmes : 32 % et 95 % ; 77 % ; 60 % ; 100 %.

## Défauts que la relecture n'a pas relevés (lecture du pilote, non corrigés)

À juger par le porteur. Les deux premiers enfreignent une règle du lot.
1. **Caen : recommandation de quartier implicite**, le critère ajouté au point 5 de la relecture. « Le Bas Vaucelles présente le profil inverse… Votre recherche peut donc s'orienter différemment selon les déplacements que vous souhaitez changer » et « Aux Coutures, accordez une attention particulière au trajet professionnel » font des pratiques des habitants une orientation de recherche par secteur. La relecture de Caen est aussi très brève (514 jetons de sortie contre 1 000 à 1 300 ailleurs).
2. **Caen : conseils génériques malgré la nouvelle précision.** Deux faits seulement sont retenus ; la section de visite les complète par des conseils valables partout (« vérifiez également l'école dont dépend l'adresse auprès de la collectivité », passages piétons et traversées). La phrase du chapeau « Cette observation aide le lecteur à examiner… » parle du lecteur à la troisième personne.
3. **Brest, après correction : glissement résiduel.** « Lambezellec offre ainsi une piste à examiner pour rapprocher ces équipements du logement » reprend la tournure corrigée pour Saint-Martin, sur la proximité des équipements cette fois. « le dossier repère les adresses » est du vocabulaire de production.
4. **Nîmes : « Le dossier ne croise pas… »** est resté, puisqu'un « à revoir » ne déclenche pas de correction.

## Défauts de la chaîne corrigés pendant le lot (outillage, pas les textes)

- Domaine du réseau lu avec son port (`bibus.fr:443`) : la collecte bornée refusait le site officiel. Le port est retiré.
- Repères de la carte : un secteur cité par l'article à travers la valeur extrême `iris.voiture.min/max` n'était pas numéroté (Kervao-Rural Nord à Brest). Ces secteurs sont maintenant repérés.
- `/dev/lot` : la ligne « Tableau accessible » affichait une seconde carte, elle mène désormais au tableau des secteurs. Les appels Codex s'affichent comme « non mesurés » en coût, au lieu de 0 $.
- Génération des visuels de Brest restée bloquée plusieurs heures dans le rendu Chrome sans navigateur : arrêtée et relancée.

## Durées et compteurs

| Étape | Caen | Brest | Nîmes |
|---|---|---|---|
| Préparation du dossier | 32,1 s | 43,4 s | 43,4 s |
| Collecte (Claude, abonnement) | aucun réseau | 98,3 s | 49,5 s |
| Rédaction | 109,2 s | 98,4 s | 64,6 s |
| Relecture | 15,7 s | 30,5 s | 26,3 s |
| Correction | aucune | 35,3 s | aucune |

Jetons rapportés par `codex exec --json` (entrée / dont en cache / sortie / dont raisonnement) :
- Caen : rédaction 34 328 / 32 512 / 2 774 / 1 387 ; relecture 32 397 / 0 / 514 / 501.
- Brest : rédaction 35 197 / 0 / 3 743 / 1 872 ; relecture 35 368 / 0 / 1 280 / 1 029 ; correction 34 875 / 0 / 2 458 / 304.
- Nîmes : rédaction 35 069 / 0 / 3 404 / 1 726 ; relecture 35 056 / 7 680 / 1 047 / 941.

Codex : 8 appels, 413 s au total. Collecte : 2 appels Claude, 0,04 $ et 0,05 $ en « équivalent API » calculé localement.

Ces jetons ne mesurent **pas** la consommation du quota de l'abonnement ChatGPT, et l'équivalent API de Claude ne mesure pas celle du quota claude.ai. Aucun outil n'expose la part de quota consommée ; rien n'a été facturé. **Le modèle effectivement utilisé n'est pas renvoyé** par Codex : seuls le modèle et le raisonnement *demandés* sont attestés (`modele_effectif_renvoye: false`).

## Verdict

- **Rédaction : apte.** Codex est rapide (1 à 2 minutes) et exact sur les chiffres et les populations. Aucune erreur factuelle, aucun écart au contrôle déterministe.
- **Relecture : insuffisante seule.** Elle a repéré deux vraies erreurs à Brest, mais a laissé passer la recommandation implicite de Caen, précisément le critère ajouté pour ce lot, ainsi que des tournures de production. Sur deux articles sur trois, un défaut que le porteur jugerait bloquant serait parti en relecture humaine.
- **Style : défauts persistants.** On retrouve ceux d'Angers : un texte plus prescriptif que factuel et des conseils génériques quand les faits sont rares, malgré la consigne ajoutée.

Codex convient pour produire des premiers jets courants. La chaîne Codex seule ne suffit pas encore à livrer des articles prêts à publier : une relecture humaine, ou une relecture par un autre modèle, reste nécessaire. Trois communes ne suffisent pas à trancher le choix d'outil.
