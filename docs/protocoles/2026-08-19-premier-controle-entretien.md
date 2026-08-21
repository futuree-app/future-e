# Protocole d'entretien — « quelle est la première chose que vous allez vérifier ? »

> **Nature** : protocole de test utilisateur. Il ne décide rien et ne modifie aucun code.
> **Date** : 2026-08-19. **Objet** : valider (ou infirmer) que le dossier laisse le lecteur avec
> UN premier contrôle qu'il sait nommer, et que ce contrôle est bien celui que le moteur a désigné.

## Pourquoi une question, et pas une mesure

Le dossier porte déjà un contrôle prioritaire déterministe (`priorityControl`), rendu sous le verdict
avec l'étiquette « À contrôler en priorité » ou « À contrôler ensuite ». Le moteur sait donc ce qu'il
a proposé. Ce qu'aucun événement ne peut dire, c'est si le lecteur **est reparti avec**.

Un clic mesure une curiosité, pas une intention. Deux personnes peuvent lire la même ligne, l'une en
faire son prochain appel au vendeur, l'autre ne pas la voir. Seule la question posée à froid sépare
les deux cas. Les événements `priority_control_shown` et `priority_control_activated`
(cf. `docs/analytics-posthog.md`) servent uniquement à **cadrer** l'entretien : ils disent sur quels
sujets la ligne tombe réellement, donc quels dossiers valent d'être testés.

## La question, et son moment

Elle se pose **après la lecture, sans le dossier sous les yeux**, et avant toute autre question :

> « Après avoir lu votre dossier, savez-vous quelle est la première chose que vous allez vérifier ? »

Puis, seulement si la personne répond quelque chose :

1. « Pourquoi celle-là d'abord ? »
2. « Où l'avez-vous lue ? » (ne pas montrer, laisser chercher de mémoire)
3. « Qu'est-ce que vous feriez concrètement, et auprès de qui ? »

Ne jamais reformuler la réponse avec les mots du produit. Si la personne dit « le truc du sol », on
note « le truc du sol », pas « le retrait-gonflement des argiles ».

## Ce qu'on note, et comment on le classe

Pour chaque session, une ligne, remplie **avant** de regarder ce que le moteur avait proposé :

| Champ | Valeurs |
|---|---|
| Réponse brute | verbatim, non corrigé |
| Réponse donnée ? | spontanée · après hésitation · aucune |
| Correspondance | **identique** au contrôle prioritaire · **autre carte du dossier** · **hors dossier** |
| Origine citée | verdict · carte · synthèse · ne sait plus |
| Geste nommé ? | oui (à qui / quoi) · non (intention vague) |

La correspondance est le résultat qui compte. Les trois cas ne disent pas la même chose :

- **identique** : le contrôle prioritaire a fait son travail ;
- **autre carte** : le dossier a produit une décision, mais la hiérarchie du moteur n'est pas celle du
  lecteur. C'est un signal sur le classement, pas sur la ligne ;
- **hors dossier** : le dossier n'a pas déplacé la personne. C'est le seul cas qui met en cause la
  promesse « ce qu'il reste à vérifier ».

## Combien de sessions avant de conclure

Aucun seuil de significativité : ce protocole ne mesure pas une fréquence. Il cherche des **causes**.
Trois sessions suffisent à révéler un défaut de formulation ; elles ne suffisent jamais à valider une
hiérarchie. Une décision produit fondée sur ce protocole doit nommer combien de sessions l'ont
motivée, et sur quels types de dossiers (avec ou sans signal aigu — le cas du 16/08/2026 à
Ciré-d'Aunis était un dossier sans signal aigu, celui où la question est la plus dure).

## Ce qui ne doit pas être fait

- **Ne pas stocker la réponse libre dans PostHog.** Le dépôt n'a aucune convention pour y conserver du
  verbatim, et une réponse peut contenir une adresse ou un élément de situation personnelle. Les
  verbatims vivent dans un journal de test versionné (`docs/rapports-agents/_sources/`), au même
  format que celui de Julien et Lisa : retour brut séparé de son interprétation.
- **Ne pas poser la question dans l'écran.** Une invite in-app transformerait la question en mesure de
  satisfaction, et elle contaminerait la lecture qu'on cherche justement à observer.
- **Ne pas montrer le contrôle prioritaire avant la réponse.** La question devient sinon une question
  de reconnaissance, dont la réponse est toujours « oui ».
