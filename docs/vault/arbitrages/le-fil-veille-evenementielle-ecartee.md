# Arbitrage : Le Fil comme veille événementielle est écarté

- **Date** : 2026-07-09, tranché par le porteur après une session de mesures.
- **Source** : `docs/audits/2026-07-09-SYNTHESE-spike-le-fil-et-sources.md` (point d'entrée des
  trois audits), `docs/rapports-agents/researcher/2026-07-09-recurrence-relation-territoire.md`,
  branche `spike/le-fil-mesures`. Tous les chiffres ci-dessous sont reproductibles par les scripts
  de `scripts/research/`.

## Contexte

Le Fil devait être la couche temporelle de futur•e : une veille territoriale continue, alimentée
d'abord par un pipeline qui aurait fait lire des rapports d'inspection ICPE à un LLM. La question de
départ était l'architecture de ce pipeline. Le board de juillet 2026 avait déjà écarté l'abonnement
mensuel, par intuition. Les mesures du 9 juillet ont tranché la question de fond.

## Décision

**futur•e ne construit pas de veille événementielle territoriale.** Ni comme produit, ni comme
newsletter, ni comme abonnement, ni comme fil d'actualité.

La page de pré-lancement `/le-fil`, qui vend une newsletter mensuelle et un tableau de bord, promet
ce que la matière ne permet pas. Elle doit être recadrée ou retirée.

## Pourquoi : les quatre flux, tous qualifiés

| Flux | Verdict, avec sa mesure |
|---|---|
| **Événements territoriaux** | Trop rares. 87 % des communes n'ont aucun événement décisionnel sur douze mois ; la commune médiane en connaît un tous les sept ans. L'ICPE produit 614 créations d'usines par an en France, soit une commune touchée tous les 57 ans. |
| **Millésimes de référentiel** (BPE, INSEE, DRIAS) | Synchrones. Ils changent toutes les communes le même jour. 26 critères sur 28 ne bougent que par eux. |
| **Prix** (le seul critère mobile) | Bruit, ou mouvement national. Variation annuelle médiane du prix communal : 5,8 %, alors que le bruit d'échantillonnage pur vaut 6 à 9 %. Quand le prix bouge vraiment (2023-2024, ‑4,1 %), 69 % des communes baissent ensemble. |
| **Climat qui se réalise** (ERA5) | Continu, honnête, sans latence. Mais c'est un fait au passé, et on paie mal un fait au passé. |

Trois raisons de fond s'ajoutent au volume.

**La latence interdit le silence.** Le p90 de publication d'un arrêté CatNat est à **640 jours**
(médiane 99 jours). À tout instant, une part inconnue des événements de l'année n'est pas publiée. Un
écran qui affiche « rien n'a changé depuis votre visite » affirme une absence qu'il ne peut pas
établir. La règle est déjà écrite dans la grammaire éditoriale du Fil (classe B, §5).

**Les mises en demeure mesurent le contrôle, pas le danger.** Une commune dont les usines sont
inspectées et sanctionnées est mieux protégée qu'une commune que personne ne visite. Publier les
mises en demeure ferait paraître dangereuses les communes bien contrôlées. C'est le même biais de
détection que celui corrigé sur `calme_sonore` (mesurer le bruit à la station la plus proche punissait
les métropoles bien instrumentées).

**Lire les PDF n'a pas d'objet.** Seules 7 % des inspections ICPE débouchent sur un acte préfectoral
sous six mois. Le pipeline OCR plus LLM qui motivait le chantier aurait passé 14 834 documents à la
machine pour anticiper de quelques semaines un arrêté qui arrive nommé et daté, en manquant quand même
un tiers des vrais événements (ceux qui naissent d'une plainte ou d'un accident).

## Ce qui reste vrai, et qui remplace Le Fil

**Le territoire ne bouge pas. Le lecteur, si.** À données strictement constantes, entre 57 % et 73 %
du classement des communes change selon le moment de vie (étudiant, jeune actif, famille, retraite),
autour d'un noyau stable. Un enfant qui naît déplace plus le rapport de quelqu'un que dix ans
d'arrêtés préfectoraux.

Trois moteurs de récurrence survivent aux mesures :

1. **La personne qui change.** Le cycle de vie re-classe les 28 critères sur un territoire immobile.
   Cadence naturelle : l'événement de vie, tous les trois à sept ans, avec une phase d'usage intense
   de six à neuf mois. Ce n'est pas un abonnement mensuel, c'est un revenu récurrent par cycles.
2. **Le débit d'inconnus.** Le goulot déjà nommé en mémoire. Un revenu récurrent existe sans qu'aucune
   personne ne revienne, porté par une population qui traverse, comme un site d'emploi.
3. **Le produit qui grandit.** futur•e livre des critères en continu (`calme_sonore`, puis
   `faible_exposition_industrielle`, les servitudes ensuite). Notre lecture d'une commune s'enrichit
   quand la commune est immobile. C'est le seul flux que futur•e contrôle.

## Deux distinctions à retenir

**Mouvement et état sont deux produits, pas deux gravités.** Le mouvement (une servitude instituée,
une usine autorisée) est rare, durable, mesurable en delta ; il sert celui qui **choisit**. L'état
(l'eau restreinte, un arrêté de catastrophe naturelle) est saisonnier, il a une date de fin ; il sert
celui qui **habite**. Un rapport vivant de résident doit **oublier** ; un diff, par nature, empile.

**Un fait qui compte et ne déplace aucun critère est une demande de critère manquant.** C'est ce qui
est arrivé aux servitudes, à la zone du PLU, aux logements neufs livrés. Le Fil, en cherchant quoi
raconter, a désigné ce qu'il restait à mesurer.

## Conséquences

- **Recadrer ou retirer `/le-fil`** (action sans regret, déjà recommandée par le Product en juillet).
- **L'ICPE alimente un critère, pas un fil.** Les créations et extensions rafraîchissent
  `faible_exposition_industrielle`.
- **Ne jamais écrire « rien n'a changé ».** Nommer les sources surveillées, dater la dernière
  vérification.
- **Créer le critère avant le moteur.** Le principal pourvoyeur de matière est la servitude, et aucun
  critère ne la porte : un moteur de diff des critères serait aveugle à la donnée la plus décisive au
  grain adresse.
- Cet arbitrage **contredit** le prévisionnel inscrit dans `arbitrages/pricing-abonnements-reportes.md`
  (« Le Fil » abonnement annuel ~49,99 €, T4 2026). Ce prévisionnel tombe.

## Ce qui rouvrirait le sujet

- Une **API de permis de construire** (Sitadel) : la seule source qui dirait ce qui *va* se
  construire, plutôt que ce qui est déjà livré. Elle n'existe pas aujourd'hui.
- Un **historique des restrictions d'eau** (Vigieau n'expose que l'état courant), qui transformerait
  une saison en série.
- Une **preuve de propension à payer** pour un fait au passé (le bilan de saison sur ERA5), à tester
  d'abord en rétention gratuite.
- Un **pivot B2B portefeuille**, où la rareté s'agrège (200 dossiers produisent une douzaine
  d'événements par an). Voir `ADR-0008` : B2B en relais 2027, après la preuve B2C.
