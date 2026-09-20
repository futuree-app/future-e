# scripts/admin

Opérations manuelles sur des données réelles. Chacune tourne avec la clé de service, depuis un
poste, jamais depuis le site. **Toutes sont en lecture seule par défaut** : rien ne s'écrit sans
`--apply`.

Les variables viennent de `.env.local` (`NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`).
Lancer les commandes **depuis la racine du projet**, sinon les dépendances ne se résolvent pas.

---

## Ouvrir un dossier d'adresse sans paiement

Pour se montrer le produit à soi-même dans les conditions où il est vendu, et pour préparer une
démonstration.

**Voir ce qui serait créé, sans rien écrire :**

```bash
node scripts/admin/creer-dossier-demonstration.mjs \
  --address "5 Rue du Palais 17000 La Rochelle" \
  --user bonjourfuturee@gmail.com
```

**Créer réellement le dossier :**

```bash
node scripts/admin/creer-dossier-demonstration.mjs \
  --address "5 Rue du Palais 17000 La Rochelle" \
  --user bonjourfuturee@gmail.com \
  --apply
```

Le script affiche à la fin l'identifiant du dossier et le lien à ouvrir.

### Ce qu'il faut savoir

**L'ordre compte.** Renseigner le PROJET avant d'ouvrir le dossier (bas de `/rapport`). La
première ouverture fige une version à partir du projet du moment ; ensuite, une nouvelle version
se demande par un bouton, elle ne se refait plus toute seule. Pour une démonstration à un
professionnel de l'acquisition, penser à mettre l'intention sur **achat** : sinon les conseils
s'adressent à un locataire.

**Ce n'est pas un faux paiement.** La base admet deux états et une contrainte le vérifie : dossier
acheté (trois champs Stripe renseignés) ou dossier administratif (les trois à null). Ces dossiers
n'entrent pas dans le comptage des ventes, qui se fait sur `purchased_at`, et n'émettent aucune
facture.

**L'adresse doit être numérotée**, comme à la vente. Une rue ou une commune sont refusées. Quand
plusieurs adresses correspondent, le script les affiche toutes avant de retenir la première :
vérifier que c'est la bonne, une démonstration sur le bien du voisin est pire que pas de
démonstration.

**Un seul dossier par point.** Si le compte en a déjà un sur cette adresse, le script l'affiche et
s'arrête plutôt que de créer un doublon indiscernable dans la liste.

---

## Échanger l'adresse d'un dossier payé

Geste exceptionnel, à la demande d'un client. Révoque l'ancien droit, crée le dossier de
remplacement et émet la facture rectificative dans une seule transaction.

```bash
node scripts/admin/replace-address-dossier.mjs \
  --invoice FE-2026-0005 \
  --address "204 Route de Catussou 47300 Villeneuve-sur-Lot" \
  --reason "Échange d'adresse demandé par le client" \
  --apply
```

---

## Une règle commune

Les deux scripts recopient l'adresse du géocodeur, parce qu'ils tournent hors du build Next et ne
peuvent pas importer `src/lib/geocodeur-ban.ts`. Un test (`src/lib/geocodeur-ban.test.ts`) vérifie
que ces copies restent alignées : si l'adresse du service change, les scripts échouent à la
compilation des tests plutôt qu'en pleine opération.
