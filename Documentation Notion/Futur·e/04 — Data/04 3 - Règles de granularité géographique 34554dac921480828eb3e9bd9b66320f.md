# 04.3 - Règles de granularité géographique

futur·e croisera des données à des échelles très différentes. C’est normal. Le risque n’est pas d’avoir des granularités mixtes ; le risque est de faire croire qu’elles sont équivalentes.

Cette page fixe la doctrine de granularité du produit.

———

### **Principe général**

Chaque donnée doit conserver sa granularité native.

Toute agrégation, approximation ou correspondance doit être explicite, documentée et assumée dans la base comme dans la restitution éditoriale.

———

### **Règles**

***1. Ne jamais surpromettre la précision***

Si une donnée est communale, elle ne doit jamais être présentée comme une vérité à l’adresse.

Mauvais :

- “Votre immeuble sera exposé à…”

Correct :

- “Dans votre commune…”

- “Dans cette zone…”

- “Autour de votre localisation…”

———

***2. Conserver le niveau géographique d’origine***

Chaque valeur stockée doit porter son échelle réelle.

Exemples :

- DRIAS : grid_cell

- BAN : address / point

- Géorisques : commune ou zonage

- INSEE : commune, IRIS, département, etc.

- qualité de baignade : site

———

***3. Utiliser une hiérarchie géographique explicite***

Ordre de référence :

1. address

2. point

3. grid_cell

4. commune

5. iris

6. epci

7. department

8. region

Toutes les sources doivent être rattachées à cette hiérarchie.

———

***4. Séparer géocodage et interprétation***

Le fait qu’un utilisateur entre une adresse ne signifie pas que toutes les données deviennent précises à cette adresse.

Le moteur doit distinguer :

- ce qui vient d’un point géocodé

- ce qui vient d’une commune

- ce qui vient d’une maille climatique

- ce qui vient d’un zonage

- ce qui vient d’une station ou d’un site proche

———

***5. Documenter les règles de rattachement par source***

Exemples :

- BAN : adresse → coordonnées + code INSEE

- DRIAS : point utilisateur → maille de grille la plus proche

- Géorisques : code INSEE ou zonage selon couche

- ATMO : point utilisateur → station ou zone de référence

- qualité de baignade : point utilisateur → site balnéaire pertinent le plus proche

- Eaufrance : commune ou bassin selon disponibilité

———

***6. Préférer la cohérence à l’hyper-précision***

Quand deux sources ont des mailles incompatibles, il vaut mieux remonter à une échelle robuste plutôt que produire un croisement artificiellement précis.

———

***7. L’incertitude géographique doit apparaître dans le produit***

La narration doit expliciter les limites.

Exemples de formulations :

- “Cette projection repose sur la maille DRIAS la plus proche.”

- “Cet indicateur est disponible à l’échelle de la commune.”

- “Cette donnée traduit une tendance territoriale et non une mesure à l’adresse.”

- “Le signal présenté ici provient d’une station ou zone de référence proche.”

———

**Question de contrôle**

Le produit doit toujours pouvoir répondre à cette question :

**À quelle échelle cette affirmation est-elle vraie ?**

Si la réponse est floue, la donnée ne doit pas être utilisée telle quelle dans une restitution.

———

### **Bloc final**

***Doctrine de*** futur·e

Le produit gagne sa crédibilité non en promettant une précision absolue, mais en disant clairement ce qui est local, ce qui est territorial, ce qui est projeté, et ce qui reste incertain.