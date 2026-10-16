# Essai Codex : Angers, premier jet contre premier jet (15/10/2026)

Une seule rédaction Codex d'Angers (49007), comparée à la **première** rédaction Claude du lot `2026-10-lot-01` (`../2026-10-lot-01/49007/generation/redaction.md`, avant relecture, correction et retouches). Rien n'a été relu, corrigé ni publié ; le lot 01 et ses articles ne sont pas modifiés. Lecture : `http://localhost:3155/dev/lot`, lot « 2026-10-lot-01-essai-codex ».

## Protocole

**Identique à la rédaction Claude, vérifié par empreinte** (`lancer_essai.py` refuse de partir sinon) :
- consignes : `redaction/PROMPT_REDACTION.md` au commit `21968244`, empreinte `7dc2ca0c244ec27a`, celle de `redaction.json` Claude ;
- dossier et message : `dossier.md` au commit `834de6d8`, message complet avec la mention des pièces, empreinte `47175bc2cd29cbd6`, celle de `redaction.json` Claude ;
- pièces : `complement.json` (empreinte `015fbae26d0ef794`, celle dont le dossier a été construit), `comparaison_voiture.json`, fiche du réseau Irigo, prises au commit `834de6d8`. Ni la fiche brute ni `dossier.json` ;
- une seule rédaction, aucune relecture ni correction, aucune recherche web ;
- aucun accès aux articles, critiques ou bilans. Sur la machine, la lecture est limitée au dossier de session ; le dépôt, `~/.codex`, l'écriture et le réseau sont refusés, testé avant l'appel avec `codex sandbox`.

**Différences de protocole :**
1. **Place des consignes.** Claude les a reçues en prompt système, qui remplaçait celui de Claude Code. `codex exec` n'a pas de prompt système séparé : les consignes et le dossier partent dans un seul message, par-dessus les instructions de base de Codex. C'est la convention déjà prévue par `outil/lot.py`.
2. **Accès aux pièces.** Claude avait les outils Read et Glob limités à `./pieces`. Codex a son terminal, en lecture seule. Aucun des deux n'a ouvert une pièce : 0 appel d'outil côté Claude, 0 commande côté Codex.
3. **Modèle.** Claude Opus 5.5 en effort « high », contre gpt-6.1-sol en raisonnement « high ». gpt-6.1-sol est le modèle le plus récent proposé par l'abonnement ; les deux échelles de raisonnement ne sont pas équivalentes.
4. **Contrôle.** Les deux jets passent par le contrôle actuel (étiquette `mobilite-lot-01-reference`). Celui enregistré à l'époque pour Claude relevait 13 anomalies, toutes des faux positifs corrigés depuis dans l'outil.
5. **Visuels.** Ceux d'Angers sont repris du lot 01 sans être régénérés. Les barres ne dépendent pas du texte. La carte, elle, porte les repères numérotés de l'article Claude : Europe y figure, mais pas Croix Blanche, que Codex cite.

## Mesures disponibles

| | Claude (14/10, 14 h 59 UTC) | Codex (14/10, 23 h 39 UTC) |
|---|---|---|
| Authentification | abonnement claude.ai (`apiKeySource: none`) | abonnement ChatGPT (`auth_mode: chatgpt`, aucune clé API) |
| Modèle | `claude-opus-5-5` demandé et confirmé par la réponse | `gpt-6.1-sol` demandé ; **modèle effectif non renvoyé** par `codex exec --json` |
| Raisonnement | effort `high` | `model_reasoning_effort = high` |
| Durée de l'appel | 185,1 s | 149,2 s |
| Jetons d'entrée | 43 318 (37 702 écrits en cache, 5 614 lus en cache) | 36 252 (0 en cache) |
| Jetons de sortie | 20 318, dont 13 097 de réflexion | 5 304, dont 2 835 de raisonnement |
| « Équivalent API » | 0,71 $ (calcul local de Claude Code) | non rapporté |

Les jetons et l'« équivalent API » ne mesurent **pas** la consommation du quota de l'abonnement, ni d'un côté ni de l'autre. Aucun des deux outils ne dit quelle part du quota un appel a consommée. Codex lit ses limites d'usage dans son application, mais ni avant ni après l'essai : aucune mesure de quota n'existe donc. Rien n'a été facturé.

## Contrôle déterministe

`outil/controle_article.py`, version de l'étiquette : **0 anomalie** pour Codex (`49007/generation/redaction.controle.json`), **0 anomalie** pour le premier jet Claude.

## Comparaison des deux premiers jets

**Erreurs bloquantes**
- **Claude : 2**, relevées par la relecture du lot et corrigées depuis.
  - Population : « 69 % des actifs y vont travailler en voiture » (Europe, Vauban) se lit comme un lieu de travail.
  - Raisonnement : « et pourtant » laisse entendre que les équipements proches devraient réduire l'usage de la voiture.
- **Codex : aucune.** Chaque chiffre vaut la valeur du dossier, chaque population est nommée exactement (« les actifs qui y résident »), et le piège de la proximité est désamorcé (« deux observations à examiner »).

**Défauts non bloquants, à revoir**
- **Claude**, relevés par la relecture : horaires du tram sans période de validité, Nantes présentée comme « l'exception », « on fixe en même temps la façon de la parcourir », « pas significatifs », règle du repère incomplète dans la méthode.
- **Codex** (cet essai n'a pas eu de relecture) :
  - « Le dossier mesure la proximité… » : vocabulaire de production dans le texte publié.
  - « Voltaire mérite d'être regardé » pour qui veut laisser sa voiture : une pratique observée glisse vers une possibilité, avec précaution.
  - La méthode ne dit ni pourquoi ces six communes, ni le seuil de 300 actifs, ni le millésime de la BPE (2025).
  - Le chapeau n'est pas en gras : l'index ne l'affiche pas.

**Préférences éditoriales**
- **Sélection des chiffres.** Codex est plus sobre : 8 pourcentages contre 25, 811 mots contre 952 hors méthode. C'est plus proche de la consigne « un repère et quelques exemples ». En contrepartie, il écarte le carburant, que le dossier propose comme accroche datée, ainsi que le stationnement et le cas de Nantes.
- **Fluidité.** Claude avance par faits ; Codex par conseils. Codex compte 22 verbes de consigne (« regardez », « examinez », « vérifiez »…) contre 4 chez Claude. La section « Ce qu'une visite doit permettre de vérifier » ne contient aucune donnée.
- **Intérêt local.** Avantage net à Claude : Nantes à 61 % en transports en commun, le vélo à Brisepotière, le stationnement à Voltaire, le réseau Irigo, le prix du gazole. Codex ne garde que trois secteurs. Son titre est une question sans découverte, et une bonne part de son texte vaudrait pour n'importe quelle ville.
- **Conclusion.** Les deux partent du projet du lecteur. Celle de Claude s'achève sur une liste de thèmes (mobilité, services, chaleur, risques) qui frôle l'inventaire ; celle de Codex est plus sobre, un peu commerciale (« Avec futur•e, explorez… »).

**En bref.** Codex a écrit plus vite, avec quatre fois moins de jetons de sortie, et son premier jet ne contient aucune erreur bloquante, quand celui de Claude en avait deux. Il est en revanche plus générique et plus prescriptif, et apprend moins de choses sur Angers au lecteur. Un seul essai sur une commune ne départage pas les deux outils.
