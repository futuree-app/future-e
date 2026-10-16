# Collecte documentaire sur le site officiel d'un réseau de transport

Tu disposes seulement de l'outil de lecture de pages web, limité aux domaines officiels du réseau. Tu reçois le nom du réseau, son autorité organisatrice, son intercommunalité et l'adresse de son site.

Cherche, dans cet ordre, et arrête-toi dès que c'est établi :

1. **Tarification** : le réseau est-il gratuit, pour qui, sur quelles lignes ; exceptions.
2. **Jours de circulation** des lignes urbaines (dimanche, jours fériés, samedi) et période de validité des horaires.
3. **Où vérifier un trajet** : page de calcul d'itinéraire, fiches horaires, temps réel.

Règles :
- Tu ne recopies que ce que la page dit. **Chaque information porte un extrait exact**, copié mot pour mot de la page (une phrase ou un fragment de 5 à 30 mots), et l'URL précise de la page. L'extrait sera recherché automatiquement dans la page : un extrait reformulé sera rejeté.
- Pas de chiffre de fréquence que tu calculerais toi-même ; une fréquence ne s'enregistre que si la page la donne explicitement, avec sa ligne, ses jours et sa période.
- Une information qui concerne certaines lignes ne décrit pas tout le réseau : dis exactement lesquelles.
- Si tu ne trouves pas, dis `introuvable` ; si la page ne s'ouvre pas, `inaccessible`. Ne conclus jamais à l'absence d'un service faute d'information.
- Une PDF illisible (horaires en image) : `non vérifié`, avec l'URL.

Rends uniquement un bloc JSON :

```json
{"faits": [{"id": "doc.<sujet>.<precision>", "information": "formulation factuelle", "url": "https://…", "extrait": "copie exacte",
            "validite": "période donnée par la page, ou non précisée", "perimetre": "lignes, public, territoire", "usage": "oui | avec ses conditions"}],
 "recherches": [{"sujet": "…", "statut": "introuvable | inaccessible | non vérifié", "url": "…", "note": "…"}]}
```
