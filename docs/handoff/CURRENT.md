# Passation — reprise de session

> Brief de reprise (commande `/handoff`). Une session neuve, éventuellement sur un autre
> compte Claude (même machine), reprend ici. La connaissance durable est déjà dans le vault
> (`docs/vault/`) et `/memory` (`MEMORY.md` + fiches) : ce fichier ne capture que l'état vivant.

- **Horodatage** : 2026-06-26
- **Branche courante** : `main` (propre, à jour). Aucune PR ouverte.

## Objectif en cours
Construction et durcissement de l'**équipe d'agents IA** de futur•e et de son architecture. Cette
session a complété le roster (8 personas + Researcher), l'a harmonisé sur un gabarit commun, créé
le 8e agent (Discoverability Strategist) et posé la **doctrine « poste de travail »** (agents +
outils métier déterministes). Prochaine grande étape restée en attente : la **mission d'audit de
l'Archiviste** (transformer les débats en mémoire, détecter la dette documentaire).

## Fait dans cette session
- **Researcher v2 « agent de rupture »** (PR #15, mergé) : explore l'espace des PROBLÈMES (recadre
  la question), « hypothèse remise en cause » au lieu d'auto-critique, test sans-écran, paradigmes.
- **Roster complété** (PR #16, mergé) : **Editorial Writer** (protège la voix ; pouvoir « ce texte
  ne devrait pas exister ») et **Software Architect** (protège le futur du code ; question-mère
  « temps de reprise » du fondateur solo). Tous deux v2 après challenge ChatGPT (« Limites de mon
  regard » obligatoire, etc.). Rapports de test à froid archivés (`/professionnels`, `comparateur-vie.ts`).
- **Cadre « contre-pouvoirs »** gravé (addendum ADR-0006) : on définit un agent par la tension
  qu'il incarne ; gabarit « contre-pouvoir card » à 7 champs ; **test d'admission** d'un futur agent.
- **Harmonisation** (PR #17, mergé) : les 5 mandats antérieurs (Archiviste, Data Curator, Design
  Critic, Business, Product) portent désormais la carte à 7 champs. Les 8 agents sont homogènes.
- **Discoverability Strategist** (PR #18, mergé), 8e persona, 1er admis par le test d'admission :
  protège la découvrabilité (SEO + GEO), se subordonne à l'Editorial sur la voix, porte le levier
  programmatique 35k communes. v2 « intentions, pas pages » après challenge ChatGPT. Test à froid
  sur `/inondation` archivé (verdict ANGLE MORT : double verrou robots, sitemap, zéro JSON-LD).
- **1er outil métier + doctrine « poste de travail »** (dans PR #18) : `scripts/agents/discoverability/audit.mjs`
  (inventaire SEO/GEO déterministe, fonctionne : 38 routes publiques, 25 hors sitemap, 37 sans
  canonical, 38 sans JSON-LD). Addendum ADR-0006 ter : modèle poste de travail + 4 règles
  (déterministe→script, `scripts/agents/<agent>/`, admission « la question apparaît deux fois »,
  pas de structure spéculative) + corollaires (« le script ne conclut jamais » ; « un outil réduit
  le coût d'un fait, jamais celui de penser » ; extracteurs vs vérificateurs ; contrat AgentFinding différé).

## Décisions prises (porteur, gravées dans le vault sauf mention)
- Roster à **8 personas + Researcher** ; le **test d'admission** est le garde-fou anti-prolifération.
- Cadre **contre-pouvoirs** + gabarit 7 champs adopté pour tous les agents.
- Discoverability nommé ainsi (pas « SEO/GEO Strategist ») pour intégrer le recadrage ; se
  subordonne à l'Editorial sur la voix.
- Doctrine **poste de travail** et ses 4 règles + corollaires (addendum ADR-0006 ter).
- **API SERP différée** (manque apparu une seule fois) ; **dossiers d'outils vides refusés** (pas
  de structure spéculative). Outils métier des autres agents : à créer sous la règle des deux fois.
- Outils niveaux 2-4 (Search Console, crawler, SERP) = décision d'infra séparée, hors mandat tant
  qu'ils n'existent pas (sinon l'agent promet des mesures qu'il n'a pas).

## État git
- Branche `main`, **working tree propre**, tout poussé. Dernier commit : `d4d8481` (merge PR #18).
- PR #15, #16, #17, #18 mergées et branches supprimées. **Aucune PR ouverte.**
- Mémoire `/memory` à jour (fiches researcher v2, editorial_writer, software_architect,
  discoverability_strategist, orchestration enrichie + index), hors-repo.

## Prochaine étape immédiate
Deux options claires, au choix du porteur :
1. **Mission d'audit de l'Archiviste** (la finalité du handoff précédent, toujours en attente) :
   détection de dette documentaire dans le vault, read-only, rapport d'incohérence ; séparer
   (a) vocabulaire/staleness grep-able de (b) sémantique (« cette ADR viole l'invariant X ») +
   pages orphelines. Cadrage déjà tranché (fiche `project_archiviste_vault`).
2. **Backlog SEO de lancement** révélé par le test Discoverability (matière prête, non appliquée) :
   lever le double verrou robots page par page, ajouter `/inondation` au `sitemap.ts`, JSON-LD
   schema.org, maillage inter-communes, canonical anti-cannibalisation, vérifier le CTA
   « 14 jours gratuits » (`src/app/(public)/inondation/[insee_code]/page.tsx:456`).

## À lire d'abord à la reprise
1. `MEMORY.md` (index) + fiches `project_agent_orchestration` (doctrine poste de travail +
   corollaires), `project_discoverability_strategist`, `project_editorial_writer`,
   `project_software_architect`, `project_researcher`, `project_archiviste_vault`.
2. `docs/vault/adr/ADR-0006-architecture-equipe-ia.md` (3 addenda : contre-pouvoirs, 8e persona,
   poste de travail) et `ADR-0009` (orchestration). `.claude/agents/` (les 9 mandats).
3. `docs/rapports-agents/` (les 3 tests à froid de cette session : editorial-writer,
   software-architect, discoverability-strategist).
4. `docs/handoff/AUTO-SNAPSHOT.md` pour vérifier la fraîcheur.

## Pièges / fils ouverts
- **Agents jamais re-testés en v2** : Editorial, Software Architect et Discoverability ont vu leur
  mandat évoluer APRÈS leur test à froid (sections « Limites de mon regard », intentions, etc.).
  Les nouvelles sections obligatoires ne sont pas encore prouvées en run réel.
- **Outils des autres agents** : la doctrine poste de travail est posée mais un seul outil existe
  (Discoverability). Ne PAS créer d'outils par anticipation : attendre que la question apparaisse
  deux fois (règle gravée). Famille « vérificateurs » (vault↔code, pricing↔Stripe) encore à ouvrir.
- **Backlog SEO = pré-lancement** : le double verrou robots (`public/robots.txt` Disallow + noindex
  hérité de `src/app/layout.tsx`) est probablement volontaire (site pas ouvert). À lever page par
  page au lancement, pas à l'aveugle.
- **CTA « 14 jours gratuits »** sur la page inondation commune : promesse peut-être fausse (le
  modèle décrit du one-shot 14/39 €, pas d'essai). À vérifier Product/Business avant indexation.
- **Décisions produit antérieures toujours en attente d'action** (rapports d'agents non appliqués) :
  module **Métier** (verdict REFORMULER), correctifs **Le Fil**, trouvailles /ou-vivre (Design Critic).
- **Researcher** : carte de France reste un problème OUVERT ; territoires-jumeaux = piste forte à
  creuser (session Researcher dédiée « oublie la carte »). Pistes Researcher = NON VÉRIFIÉES.
- Réserve ancienne : Run 3 (conv PostHog), pages `modules/` ×6, correctifs SITE (`/le-fil` prix,
  taxonomie `/professionnels` que l'Editorial a aussi pointée).
