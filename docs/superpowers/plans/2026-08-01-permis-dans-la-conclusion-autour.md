# La charnière temporelle des permis dans la conclusion Autour

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `buildAutourConclusion` rend une charnière temporelle quand au moins un permis non achevé est retenu, pour que la conclusion du module cesse d'ignorer le bloc rendu juste au-dessus d'elle.

**Architecture:** Un champ `mouvement: string | null` s'ajoute à `AutourConclusion`, assemblé par une fonction pure locale à partir de `s.permis` (déjà présent dans le `Face3Snapshot` reçu). Aucune signature ne change, aucun appel réseau, aucune source nouvelle. Le rendu ajoute un paragraphe dans le bloc de conclusion déjà en place.

**Tech Stack:** TypeScript, `node --test` sur les `.ts` directement, React 19 / Next App Router pour le rendu.

**Spec :** `docs/superpowers/specs/2026-08-01-permis-dans-la-conclusion-autour-design.md`

## Global Constraints

- **Le rayon vient du snapshot** : toute phrase écrit `p.rayonMeters`, jamais la constante `RAYON_PERMIS_M`.
- **Le modal est obligatoire** : la charnière s'ouvre toujours par « Cette configuration peut encore changer : ».
- **Le verbe est « changer »**, jamais « évoluer » (mélioratif en français).
- **Aucun futur, aucune ampleur** : ni « va », ni « futur », ni « d'ici », ni « dense », ni un volume de logements.
- **L'année n'apparaît qu'au singulier**, même si tous les dossiers portent le même millésime.
- **Aucune antithèse** de la forme « c'est X, pas Y » dans la prose rendue, et **aucun tiret cadratin** nulle part (règle projet).
- Les commentaires de code sont en français et gravent le POURQUOI, comme le reste de `src/lib/decision/`.

---

### Task 1 : le silence, avant la parole

Les trois façons dont `mouvement` vaut `null`. C'est la moitié de la doctrine, et c'est ce qui doit être vrai avant qu'une seule phrase soit écrite.

**Files:**
- Modify: `src/lib/decision/autour-conclusion.ts`
- Test: `src/lib/decision/autour-conclusion.test.ts`

**Interfaces:**
- Consumes: `Face3Snapshot.permis?: PermisSnapshot` (`src/lib/logement-autour-types.ts:112`), `PermisRetenu = { annee: number; etat: Exclude<EtatAutorisation, "sans_date"> }` (`src/lib/sitadel-selection.ts:65`).
- Produces: `AutourConclusion.mouvement: string | null`, consommé par la Task 4.

- [ ] **Step 1 : écrire les fixtures de permis dans le fichier de test**

D'abord étendre l'import existant de la ligne 4, **sans ajouter une seconde ligne d'import du même
module** (`no-duplicate-imports`) :

```ts
import type { Face3Cat, Face3Snapshot, PermisSnapshot } from "../logement-autour-types.ts";
```

Puis, sous le helper `snap` existant (ligne 20), sans le modifier :

```ts
/**
 * Un snapshot de permis GELÉ. Le rayon est un paramètre, jamais la constante : c'est exactement
 * ce que les tests doivent pouvoir faire varier pour prouver qu'un dossier ancien décrit le
 * périmètre qui l'a réellement sélectionné.
 */
function permis(
  liste: { annee: number; etat: "acheve" | "chantier_ouvert" | "autorise_non_commence" }[],
  rayonMeters = 50,
): PermisSnapshot {
  return {
    permis: liste,
    rayonMeters,
    ancienneteMaxAns: 3,
    anneeReference: 2026,
    consulteLe: "2026-08-01T00:00:00.000Z",
  };
}

/** Le CAPITOLE, avec un registre consulté. */
function snapAvecPermis(p: PermisSnapshot | undefined, bpe: "complete" | "failed" = "complete"): Face3Snapshot {
  return { ...snap(CAPITOLE, bpe), ...(p ? { permis: p } : {}) };
}
```

- [ ] **Step 2 : écrire les trois tests de silence**

```ts
// ── La charnière temporelle des permis : le silence d'abord ─────────────────────────────────

test("registre NON CONSULTÉ : aucune charnière", () => {
  // Un dossier antérieur au 01/08/2026, ou une API muette. Le bloc des permis disparaît pour
  // cette raison, et la conclusion doit se taire pour la même : un registre non consulté ne se
  // lit jamais comme un voisinage stable.
  const c = buildAutourConclusion(snapAvecPermis(undefined));
  assert.equal(c?.mouvement, null);
});

test("consulté, RIEN trouvé : aucune charnière", () => {
  // L'absence est déjà dite par le bloc au-dessus, bornée et vérifiable. La répéter coûterait une
  // phrase sur trois dossiers sur quatre pour ne rien ajouter.
  const c = buildAutourConclusion(snapAvecPermis(permis([])));
  assert.equal(c?.mouvement, null);
});

test("QUE DES ACHEVÉS : aucune charnière", () => {
  // Un achevé ne signale plus une transformation à venir au moment de l'analyse. Il reste dans le
  // bloc factuel, il n'entre pas dans la charnière temporelle. Ce que le registre établit de lui
  // s'arrête là : une autorisation sélectionnée est passée à l'état achevé, et rien n'assure que
  // son effet soit visible à la visite.
  const c = buildAutourConclusion(snapAvecPermis(permis([
    { annee: 2024, etat: "acheve" },
    { annee: 2023, etat: "acheve" },
  ])));
  assert.equal(c?.mouvement, null);
});

test("BPE en échec : pas de conclusion du tout, même avec un chantier ouvert", () => {
  // « Cette configuration peut encore changer » n'a pas de référent quand aucune configuration
  // n'a été décrite. L'information n'est pas perdue : le bloc des permis reste affiché au-dessus.
  const s = snapAvecPermis(permis([{ annee: 2025, etat: "chantier_ouvert" }]), "failed");
  assert.equal(buildAutourConclusion(s), null);
});
```

- [ ] **Step 3 : lancer les tests, vérifier qu'ils échouent**

Run: `node --test src/lib/decision/autour-conclusion.test.ts`
Expected: FAIL. Les trois premiers sur `mouvement` absent du type (erreur TypeScript) ou `undefined !== null`. Le quatrième PASSE déjà, puisque le garde BPE existe : c'est voulu, il verrouille un comportement acquis contre une régression future.

- [ ] **Step 4 : ajouter le champ et le silence**

Dans `src/lib/decision/autour-conclusion.ts`, étendre l'import existant (ligne 24), qui importe
aussi une valeur et doit le rester :

```ts
import {
  BPE_WALK_RADIUS_M,
  type Face3Cat,
  type Face3Snapshot,
  type PermisSnapshot,
} from "../logement-autour-types.ts";
```

Étendre le type exporté :

```ts
export type AutourConclusion = {
  /** La configuration du secteur, en une ou deux phrases. */
  lead: string;
  /**
   * LA CHARNIÈRE TEMPORELLE. `null` quand aucun permis non achevé n'est retenu.
   *
   * Le bloc des permis, rendu juste au-dessus, porte déjà toute la charge factuelle : présence ou
   * absence, périmètre, objet du registre, année, état, date de consultation. Ce que ces faits ne
   * disent pas, et que la conclusion pose : la configuration décrite est celle observée lors de
   * l'analyse, et elle n'était peut-être pas stabilisée.
   *
   * ── CE CHAMP NE SE SUFFIT PAS À LUI-MÊME ─────────────────────────────────────────────────
   * La phrase peut porter l'année de DÉPÔT du dossier, jamais la date de CONSULTATION du
   * registre, qui est celle qui borne l'état observé. « Peut encore changer » n'est au présent
   * que parce que le lecteur voit, sur la même surface, à quelle date le registre a été consulté.
   *
   * Toute réutilisation de `AutourConclusion` hors de `AutourModule` (un PDF, un partage, une
   * synthèse qui en cite le texte) doit donc afficher cette date quelque part, sans quoi un
   * lecteur de 2028 lira au présent une possibilité constatée en 2026.
   */
  mouvement: string | null;
  /** Ce qui est absent du périmètre cherché. Vide si tout a été trouvé. */
  absences: string[];
  /** Ce que ces nombres ne disent pas. Toujours présent. */
  limite: string;
};
```

Ajouter la fonction, au-dessus de `buildAutourConclusion` :

```ts
/**
 * LA CHARNIÈRE TEMPORELLE DES PERMIS.
 *
 * Elle ne dit qu'une chose : ce qui est décrit au-dessus n'est peut-être pas stabilisé. Jamais la
 * nature du changement, jamais son ampleur, jamais sa date.
 *
 * NON ACHEVÉ SEULEMENT. Un achevé ne signale plus une transformation à venir au moment de
 * l'analyse. L'absence, elle, est déjà dite par le bloc au-dessus, où elle est bornée par le
 * périmètre et l'objet du registre ; la répéter ici coûterait une phrase sur trois dossiers sur
 * quatre pour ne rien ajouter.
 *
 * LE MODAL EST OBLIGATOIRE. Une autorisation EST une permission de changer, elle ne prouve pas que
 * le changement aura lieu. « Peut encore changer » est donc plus faible que la donnée elle-même,
 * ce qui est exactement le but. Le verbe est « changer » et non « évoluer », qui penche vers
 * l'amélioration en français, sur une phrase dont tout l'enjeu est de ne rien qualifier.
 */
function buildMouvement(p: PermisSnapshot | undefined): string | null {
  if (!p) return null;
  const retenus = p.permis.filter((x) => x.etat !== "acheve");
  if (retenus.length === 0) return null;
  return "Cette configuration peut encore changer.";
}
```

Et la brancher dans le retour de `buildAutourConclusion` :

```ts
  return {
    lead,
    mouvement: buildMouvement(s.permis),
    absences,
    limite:
```

La phrase de la Step 4 est **provisoire** et la Task 2 la remplace entièrement. Elle existe pour que le silence soit prouvé avant qu'une forme soit écrite.

- [ ] **Step 5 : lancer les tests, vérifier qu'ils passent**

Run: `node --test src/lib/decision/autour-conclusion.test.ts`
Expected: PASS, y compris les 14 tests préexistants.

- [ ] **Step 6 : commit**

```bash
git add src/lib/decision/autour-conclusion.ts src/lib/decision/autour-conclusion.test.ts
git commit -m "La conclusion se tait sur les permis avant de savoir en parler"
```

---

### Task 2 : les cinq formes

**Files:**
- Modify: `src/lib/decision/autour-conclusion.ts`
- Test: `src/lib/decision/autour-conclusion.test.ts`

**Interfaces:**
- Consumes: `buildMouvement(p: PermisSnapshot | undefined): string | null` de la Task 1.
- Produces: rien de nouveau. La Task 3 teste la même fonction.

- [ ] **Step 1 : écrire les cinq tests de forme**

```ts
// ── Les cinq formes ─────────────────────────────────────────────────────────────────────────

test("un chantier ouvert seul : l'année est dite, rattachée au DÉPÔT", () => {
  // Le point-virgule porte un fait : 2025 est l'année de dépôt, jamais celle de l'ouverture du
  // chantier. Un complément collé au verbe laisserait les deux dates se contaminer.
  const c = buildAutourConclusion(snapAvecPermis(permis([{ annee: 2025, etat: "chantier_ouvert" }])));
  assert.equal(
    c?.mouvement,
    "Cette configuration peut encore changer : un chantier de logements est déclaré ouvert " +
      "à moins de 50 m ; le dossier a été déposé en 2025.",
  );
});

test("une autorisation non commencée seule : l'ouverture manquante est dite, puis l'année", () => {
  const c = buildAutourConclusion(snapAvecPermis(permis([{ annee: 2024, etat: "autorise_non_commence" }])));
  assert.equal(
    c?.mouvement,
    "Cette configuration peut encore changer : une autorisation créant des logements est " +
      "recensée à moins de 50 m, sans ouverture de chantier déclarée ; le dossier a été déposé " +
      "en 2024.",
  );
});

test("plusieurs, tous ouverts : pluriel, AUCUNE année", () => {
  const c = buildAutourConclusion(snapAvecPermis(permis([
    { annee: 2025, etat: "chantier_ouvert" },
    { annee: 2024, etat: "chantier_ouvert" },
  ])));
  assert.equal(
    c?.mouvement,
    "Cette configuration peut encore changer : deux chantiers de logements sont déclarés " +
      "ouverts à moins de 50 m.",
  );
});

test("plusieurs, aucun ouvert : pluriel, AUCUNE année", () => {
  const c = buildAutourConclusion(snapAvecPermis(permis([
    { annee: 2025, etat: "autorise_non_commence" },
    { annee: 2024, etat: "autorise_non_commence" },
    { annee: 2024, etat: "autorise_non_commence" },
  ])));
  assert.equal(
    c?.mouvement,
    "Cette configuration peut encore changer : trois autorisations créant des logements sont " +
      "recensées à moins de 50 m, sans ouverture de chantier déclarée.",
  );
});

test("états mixtes : le total, puis les ouverts, sans compter les autres", () => {
  // Le total permet de déduire les non commencées. Les compter séparément produirait une phrase
  // de registre administratif là où on attend une lecture.
  const c = buildAutourConclusion(snapAvecPermis(permis([
    { annee: 2025, etat: "chantier_ouvert" },
    { annee: 2025, etat: "chantier_ouvert" },
    { annee: 2024, etat: "autorise_non_commence" },
    { annee: 2023, etat: "acheve" },
  ])));
  assert.equal(
    c?.mouvement,
    "Cette configuration peut encore changer : trois autorisations créant des logements sont " +
      "recensées à moins de 50 m, dont deux chantiers déclarés ouverts.",
  );
});

test("mixte avec UN SEUL chantier ouvert : l'accord suit", () => {
  const c = buildAutourConclusion(snapAvecPermis(permis([
    { annee: 2025, etat: "chantier_ouvert" },
    { annee: 2024, etat: "autorise_non_commence" },
  ])));
  assert.equal(
    c?.mouvement,
    "Cette configuration peut encore changer : deux autorisations créant des logements sont " +
      "recensées à moins de 50 m, dont un chantier déclaré ouvert.",
  );
});

test("même millésime au pluriel : l'année reste TUE", () => {
  // Règle éditoriale assumée, pas un raccourci : l'année n'apparaît que lorsque la conclusion
  // mentionne une seule autorisation. L'ajouter au pluriel rapprocherait la charnière de
  // l'inventaire que le bloc précédent rend déjà.
  const c = buildAutourConclusion(snapAvecPermis(permis([
    { annee: 2025, etat: "chantier_ouvert" },
    { annee: 2025, etat: "chantier_ouvert" },
  ])));
  assert.ok(!c?.mouvement?.includes("2025"));
});

test("au-delà de neuf, le nombre passe en chiffres", () => {
  const dix = Array.from({ length: 10 }, () => ({ annee: 2025, etat: "chantier_ouvert" as const }));
  const c = buildAutourConclusion(snapAvecPermis(permis(dix)));
  assert.equal(
    c?.mouvement,
    "Cette configuration peut encore changer : 10 chantiers de logements sont déclarés ouverts " +
      "à moins de 50 m.",
  );
});
```

- [ ] **Step 2 : lancer les tests, vérifier qu'ils échouent**

Run: `node --test src/lib/decision/autour-conclusion.test.ts`
Expected: FAIL sur les huit, tous avec la phrase provisoire « Cette configuration peut encore changer. » en valeur reçue.

- [ ] **Step 3 : écrire les cinq formes**

Remplacer le corps de `buildMouvement` après les deux gardes, en gardant le commentaire d'en-tête de la Task 1 :

```ts
/**
 * Les nombres de la charnière, EN TOUTES LETTRES et en minuscules.
 *
 * Table locale plutôt que partagée avec `autour-permis.ts` : là-bas les nombres ouvrent une phrase
 * et portent donc une majuscule, ici ils sont au milieu d'une proposition. Deux besoins
 * différents, deux tables, aucune ne dépend de l'autre.
 *
 * Au-delà de neuf, le chiffre. À 50 m sur trois ans, dix dossiers est déjà une grosse opération
 * découpée, et « quatorze » en toutes lettres au milieu d'une phrase se lit moins bien que 14.
 */
const NOMBRE = ["", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf"];

const enToutesLettres = (n: number): string => (n < NOMBRE.length ? NOMBRE[n] : String(n));
```

Puis, dans `buildMouvement`, après `if (retenus.length === 0) return null;` :

```ts
  const total = retenus.length;
  const ouverts = retenus.filter((x) => x.etat === "chantier_ouvert").length;
  const perimetre = `à moins de ${p.rayonMeters} m`;

  let corps: string;

  if (total === 1) {
    // L'ANNÉE N'APPARAÎT QU'ICI. Elle ne se dit que si elle peut être attribuée à tout ce que la
    // phrase désigne, donc au singulier seulement, y compris quand plusieurs dossiers partagent
    // le même millésime. Au pluriel, prendre la plus récente ferait paraître l'ensemble aussi
    // récent qu'elle, et la plus ancienne produirait le biais inverse.
    //
    // Le POINT-VIRGULE rattache l'année au DÉPÔT et à lui seul : « déclaré ouvert en 2025 » serait
    // faux, 2025 étant l'année de dépôt du dossier et non celle de l'ouverture du chantier.
    // `retenus[0]` sans garde : `total === 1` vient d'être établi, et `noUncheckedIndexedAccess`
    // n'est pas activé (le tsconfig n'a que `strict`), donc l'index compile. Le fichier utilise
    // déjà ce motif ligne 123. Un garde ici serait du code mort qu'aucun test ne peut atteindre.
    const annee = retenus[0].annee;
    corps = ouverts === 1
      ? `un chantier de logements est déclaré ouvert ${perimetre} ; le dossier a été déposé en ${annee}.`
      : `une autorisation créant des logements est recensée ${perimetre}, sans ouverture de ` +
        `chantier déclarée ; le dossier a été déposé en ${annee}.`;
  } else if (ouverts === total) {
    corps = `${enToutesLettres(total)} chantiers de logements sont déclarés ouverts ${perimetre}.`;
  } else if (ouverts === 0) {
    corps =
      `${enToutesLettres(total)} autorisations créant des logements sont recensées ${perimetre}, ` +
      `sans ouverture de chantier déclarée.`;
  } else {
    // LE TOTAL, PUIS LES OUVERTS. Le nombre établit que ce n'est pas un dossier isolé, et c'est la
    // seule mesure d'ampleur que la source autorise : ni volume de logements, ni nature de
    // l'opération ne sont gelés. L'état nommé est le plus certain des deux, un chantier ouvert
    // étant constaté là où une autorisation non commencée peut ne jamais l'être. Les non
    // commencées ne sont pas comptées séparément : le total permet de les déduire.
    corps =
      `${enToutesLettres(total)} autorisations créant des logements sont recensées ${perimetre}, ` +
      `dont ${enToutesLettres(ouverts)} chantier${ouverts > 1 ? "s" : ""} ` +
      `déclaré${ouverts > 1 ? "s" : ""} ouvert${ouverts > 1 ? "s" : ""}.`;
  }

  return `Cette configuration peut encore changer : ${corps}`;
```

- [ ] **Step 4 : lancer les tests, vérifier qu'ils passent**

Run: `node --test src/lib/decision/autour-conclusion.test.ts`
Expected: PASS sur les 26 tests du fichier.

- [ ] **Step 5 : commit**

```bash
git add src/lib/decision/autour-conclusion.ts src/lib/decision/autour-conclusion.test.ts
git commit -m "Ce que le permis apporte à une conclusion est une lecture temporelle"
```

---

### Task 3 : les trois verrous de doctrine

Ces tests ne vérifient pas un comportement, ils empêchent une dérive. « La conclusion mentionne le permis » et « la conclusion dit vrai du permis » sont deux assertions distinctes, et la seconde ne se déduit jamais de la première.

**Files:**
- Test: `src/lib/decision/autour-conclusion.test.ts`

**Interfaces:**
- Consumes: `buildMouvement` via `buildAutourConclusion`, inchangé.
- Produces: rien. Aucune ligne de production n'est modifiée par cette tâche, et c'est le résultat attendu : si un de ces tests échoue, c'est la Task 2 qui est fausse.

- [ ] **Step 1 : écrire les trois verrous**

```ts
// ── Les verrous de doctrine ─────────────────────────────────────────────────────────────────

test("AUCUNE TRANSFORMATION TENUE POUR ACQUISE : une autorisation n'est pas un bâtiment", () => {
  // Le nom compte : la charnière parle bel et bien d'un possible futur (« peut encore changer »).
  // Ce que ce verrou interdit, c'est d'affirmer une conséquence, de la dater ou de la qualifier.
  // LES LIMITES DE MOT NE SONT PAS OPTIONNELLES. Cherché en sous-chaîne, « va » frappe « travaux »
  // et « évaluation », deux mots parfaitement légitimes ici : le test échouerait sur une phrase
  // juste, et finirait désarmé plutôt que corrigé.
  const INTERDITS = [/\bva\b/i, /\bvont\b/i, /\bsera\b/i, /\bfutur/i, /\bd'ici\b/i, /\bdens/i, /\bprévu/i];
  for (const liste of [
    [{ annee: 2025, etat: "chantier_ouvert" as const }],
    [{ annee: 2024, etat: "autorise_non_commence" as const }],
    [{ annee: 2025, etat: "chantier_ouvert" as const }, { annee: 2024, etat: "autorise_non_commence" as const }],
  ]) {
    const m = buildAutourConclusion(snapAvecPermis(permis(liste)))?.mouvement ?? "";
    for (const interdit of INTERDITS) {
      assert.ok(!interdit.test(m), `« ${interdit} » trouvé dans : ${m}`);
    }
  }
});

test("AUCUN VOLUME de logements, en chiffres comme en lettres", () => {
  // La charnière écrit ses nombres en toutes lettres, donc un test sur /\d+\s+logements/ seul
  // laisserait passer « deux logements ». L'interdit porte sur le VOLUME de logements, jamais sur
  // le nombre d'autorisations, qui est légitime et attendu.
  const VOLUME = /(\d+|un|une|deux|trois|quatre|cinq|six|sept|huit|neuf)\s+logements/i;
  const m = buildAutourConclusion(snapAvecPermis(permis([
    { annee: 2025, etat: "chantier_ouvert" },
    { annee: 2024, etat: "autorise_non_commence" },
  ])))?.mouvement ?? "";
  assert.ok(!VOLUME.test(m), `un volume de logements a été écrit : ${m}`);
  assert.ok(m.includes("deux autorisations"), "le nombre d'autorisations, lui, doit être dit");
});

test("LE RAYON VIENT DU SNAPSHOT, jamais de la constante du jour", () => {
  // Un dossier créé sous un ancien rayon doit continuer de décrire le périmètre qui l'a réellement
  // sélectionné. Une phrase bâtie sur RAYON_PERMIS_M mentirait sur tous les dossiers antérieurs au
  // prochain changement de rayon.
  const c = buildAutourConclusion(snapAvecPermis(permis([{ annee: 2025, etat: "chantier_ouvert" }], 80)));
  assert.ok(c?.mouvement?.includes("à moins de 80 m"));
  assert.ok(!c?.mouvement?.includes("50 m"));
});
```

- [ ] **Step 2 : lancer les tests**

Run: `node --test src/lib/decision/autour-conclusion.test.ts`
Expected: PASS immédiatement, les trois. Un échec ici veut dire que la Task 2 a écrit une phrase fausse, et c'est elle qu'il faut corriger, jamais le verrou.

- [ ] **Step 3 : commit**

```bash
git add src/lib/decision/autour-conclusion.test.ts
git commit -m "Trois verrous : aucun futur, aucun volume, le rayon du snapshot"
```

---

### Task 4 : le rendu

**Files:**
- Modify: `src/components/report/AutourModule.tsx:355-377` (le bloc de conclusion)

**Interfaces:**
- Consumes: `AutourConclusion.mouvement: string | null` des Tasks 1 et 2.
- Produces: rien.

- [ ] **Step 1 : ajouter le paragraphe**

Dans le bloc `buildAutourConclusion` déjà en place, entre le paragraphe du `lead` et la boucle des `absences` :

```tsx
                      {c.mouvement && (
                        <p style={{ fontSize: 15, color: "var(--fg-1)", lineHeight: 1.65, margin: 0 }}>
                          {c.mouvement}
                        </p>
                      )}
```

Aucun encadré, aucune couleur d'alerte, aucun style nouveau : la charnière est une phrase de la conclusion. La taille descend juste d'un demi-point sous le `lead`, comme les `absences` le font déjà, pour marquer qu'elle vient après lui et non à sa place.

Ajouter au-dessus du bloc, dans le commentaire existant qui commence par « CE QU'IL FAUT EN RETENIR » :

```tsx
                L'INVARIANT DE RENDU : `mouvement` peut porter l'année de DÉPÔT du dossier, jamais
                la date de CONSULTATION du registre, qui est celle qui borne l'état observé. Il
                s'appuie pour cela sur le « Registre national des autorisations d'urbanisme,
                consulté le … » du bloc des permis, rendu juste au-dessus. Cette phrase ne doit
                jamais être affichée sur une surface qui ne porte pas cette date quelque part :
                reprise seule dans un PDF, un partage ou une synthèse, elle ferait lire au présent
                une possibilité constatée des années plus tôt.
```

- [ ] **Step 2 : vérifier les types et le lint**

Run: `npx tsc -p tsconfig.json --noEmit`
Expected: aucune sortie.

Run: `npx eslint src/components/report/AutourModule.tsx src/lib/decision/autour-conclusion.ts`
Expected: aucune sortie.

- [ ] **Step 3 : lancer la suite complète**

Run: `node --test src/lib/**/*.test.ts 2>&1 | tail -8`
Expected: `fail 0`, et **quinze tests de plus que le commit de base du lot**, mesurés et non
supposés. Le total absolu n'est pas un invariant : deux sessions travaillent sur le même arbre
`main`, et un test ajouté à côté rendrait un nombre figé faux sans que rien soit cassé.

Pour mesurer sans se fier à sa mémoire :

```bash
git stash && node --test src/lib/**/*.test.ts 2>&1 | grep "^ℹ pass" && git stash pop
```

- [ ] **Step 4 : build**

Run: `npm run build`
Expected: code de sortie 0.

- [ ] **Step 5 : commit**

```bash
git add src/components/report/AutourModule.tsx
git commit -m "La charnière se lit sous la configuration qu'elle date"
```

---

## Vérification finale, avant de déclarer le lot fini

- [ ] `node --test src/lib/**/*.test.ts` : `fail 0`, et quinze tests de plus que le commit de base
      du lot (mesuré, jamais un total figé : deux sessions travaillent sur le même arbre).
- [ ] `npx tsc -p tsconfig.json --noEmit` : muet.
- [ ] `npx eslint` sur les deux fichiers touchés : propre.
- [ ] `npm run build` : code 0.
- [ ] `grep -n "—" src/lib/decision/autour-conclusion.ts src/components/report/AutourModule.tsx` : aucune occurrence ajoutée.
- [ ] Marquer le point 2 comme CORRIGÉ dans `docs/superpowers/specs/2026-08-01-permis-autour-adresse-design.md` et dans le fil ouvert n° 6 de `docs/handoff/CURRENT.md`, en nommant le commit.

### La vérification à l'écran, qu'aucun test pur ne remplace

Les quinze tests prouvent la fonction, jamais son insertion. Sur `/rapport/logement`, en local puis
en production, **deux adresses** :

- [ ] **Une adresse avec un chantier ouvert** (La Rochelle centre en portait un au 01/08/2026, cf.
      les trois points vérifiés en réel de la spec des permis). Attendu : la charnière apparaît
      **après** le `lead` et **avant** les absences, dans le même bloc, et la date de consultation
      est lisible dans le bloc des permis juste au-dessus. C'est l'invariant de rendu, et il ne se
      vérifie qu'à l'œil.
- [ ] **Une adresse sans permis non achevé** (Paris 12e, un village de la Creuse). Attendu : aucun
      paragraphe vide, aucun espacement résiduel dans la grille, le bloc de conclusion strictement
      identique à ce qu'il était avant le lot.

Aucun Playwright pour ce lot : le projet n'en a pas l'usage, et deux ouvertures d'écran coûtent
moins qu'une dépendance de test à maintenir.

## Ce que ce plan ne fait pas

Les permis n'entrent toujours pas dans le `REGISTRY` : aucun `DecisionFact`, aucune règle, aucun grain déclaré, donc ils restent absents du verdict, de la minute et de `ControlesDuDossier`. C'est le point 1 des quatre restes, et c'est un chantier d'une autre nature.
