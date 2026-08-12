# Premier écran du dossier de décision : plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal :** Recomposer `/rapport` pour que la conclusion achetée soit la première chose lue, et faire de cet écran la seule surface où l'on modifie le cadrage de l'analyse.

**Architecture :** Aucune donnée nouvelle. Un sélecteur PUR décide du contenu du haut de page (quatre états), la page rend l'identité stable au-dessus du `Suspense`, et le composant streamé garde les métadonnées de la version qu'il lit (date, grain, obsolescence). Côté édition, la carte projet gagne l'intention et la relation communale, et les pages de résultat cessent de poser des questions.

**Tech Stack :** Next.js 16 (App Router, RSC + `Suspense`), React 19, TypeScript strict, Supabase, `node --test` avec type stripping.

**Spec :** `docs/superpowers/specs/2026-08-12-premier-ecran-decision-design.md` (à lire avant de commencer).

## Global Constraints

- **Aucune métadonnée d'analyse hors de l'analyse.** La date de la version servie, le grain et le bandeau d'obsolescence restent dans le composant streamé. Ne jamais les remonter dans `page.tsx` : la page ne connaît que l'artefact COMMUNAL, et les afficher au-dessus d'un verdict d'adresse les rendrait faux.
- **Un seul `<h1>` par écran, jamais zéro.**
- **Aucune posture n'est devinée.** Une seule fonction dérive la posture du projet : `bucketDuProjet` (`src/lib/decision/logement-gestes.ts:37`). Ne pas en écrire une seconde.
- **Aucune sauvegarde annoncée sans confirmation serveur.** Deux tables, deux confirmations.
- **Modifier un champ n'en détruit aucun autre.** Changer l'intention ne reparse pas le texte.
- **Style de code** : commentaires en français, qui disent le POURQUOI et le défaut corrigé. Jamais de tiret cadratin (`—`) : virgule ou deux points. Jamais la tournure « c'est X, pas Y ».
- **Largeur de texte** : ne pas plafonner un paragraphe avec un `max-w-[NNNpx]` plus étroit que le bloc qui l'entoure. L'exception admise est le titre de hero mesuré en espace ouvert (`max-w-[540px]` sur le headline).
- **Tests** : `node --test "src/**/*.test.ts"`. Typecheck : `npx tsc --noEmit`. Build : `npm run build`.
- **Aucun `vercel deploy` en CLI** (il téléverserait `CHARTE/`, 92 Mo non suivis). Le déploiement se fait par `git push`.

---

## Structure des fichiers

| Fichier | Responsabilité |
|---|---|
| `src/lib/decision/premier-ecran.ts` (créé) | Décide, sans I/O, quel contenu porte le haut de page parmi quatre états. |
| `src/lib/decision/premier-ecran.test.ts` (créé) | Les quatre états, dont « aucun projet », qui ne doit lire aucun plan. |
| `src/components/report/EnTeteDossier.tsx` (créé) | L'identité stable du hero : lieu lu, bien lu, projet actuel, gestes. Aucun accès base. |
| `src/app/(account)/rapport/page.tsx` | Le nouvel ordre, le chargement de `report_context`, l'ancre `#projet`. |
| `src/components/report/DossierDecisionSection.tsx` | Perd son eyebrow, garde date, grain, obsolescence, états d'augmentation. |
| `src/components/report/ConclusionBlock.tsx` | Niveau et taille de titre reçus en props. |
| `src/components/report/ConclusionRedigee.tsx` | Propage ces props à ses quatre appels. |
| `src/lib/decision/projet-edition.ts` (créé) | Décide, sans I/O, quand reparser et ce que la sauvegarde porte dans `parsed`. |
| `src/lib/decision/projet-edition.test.ts` (créé) | Le changement d'intention seul, et le parseur indisponible. |
| `src/components/report/ProjectSummaryCard.tsx` | Intention, relation communale, sauvegarde non destructive. |
| `src/components/report/ReportRelationBanner.tsx` | Devient une ligne qui dit, sans contrôle. |
| `src/app/(account)/rapport/logement/page.tsx` | Charge et normalise `user_project`. |
| `src/components/report/LogementModule.tsx` | Transmet le projet, perd la sonde. |
| `src/lib/decision/logement-verifications.ts` | `pointsAVerifier` accepte un `UserProject`, l'adaptateur de sonde disparaît. |
| `src/components/report/logement/ProjectProbe.tsx` | Supprimé. |

---

### Task 1 : Le sélecteur de contenu du hero

**Files:**
- Create: `src/lib/decision/premier-ecran.ts`
- Test: `src/lib/decision/premier-ecran.test.ts`

**Interfaces:**
- Consumes: `UserProject` (`src/lib/user-project.ts`).
- Produces: `type Geste = { label: string; href: string }`, `type ContenuHero`, `function contenuDuHero(input: { fullReport: boolean; project: UserProject | null; commune: string | null }): ContenuHero`, et `const ANCRE_PROJET = "projet"`.

- [ ] **Step 1: Write the failing test**

Créer `src/lib/decision/premier-ecran.test.ts` :

```ts
import test from "node:test";
import assert from "node:assert/strict";
import { contenuDuHero, ANCRE_PROJET } from "./premier-ecran.ts";
import type { UserProject } from "../user-project.ts";

const projetStructure = {
  posture: "recherche", intent: "achat", rawText: "au calme",
  parsed: { reformulation: "Un lieu calme.", hardConstraints: {}, preferences: [] },
  updatedAt: "2026-08-05T09:00:00.000Z",
} as unknown as UserProject;

const projetSansStructure = {
  posture: "recherche", intent: null, rawText: "au calme", parsed: null,
  updatedAt: "2026-08-05T09:00:00.000Z",
} as unknown as UserProject;

test("payant, projet structuré : le bloc verdict porte le titre, aucun geste ajouté", () => {
  const c = contenuDuHero({ fullReport: true, project: projetStructure, commune: "La Rochelle" });
  assert.equal(c.kind, "verdict");
  assert.equal(c.kind === "verdict" ? c.geste : "absent", null);
});

test("payant, projet présent mais non structuré : le plan porte le titre, la page ajoute le geste", () => {
  // `conclusion-plan.ts` produit déjà le label « À préciser » et un headline qui invite. Il ne
  // manquait que le geste : sans lui, l'écran dit quoi faire sans donner par où.
  const c = contenuDuHero({ fullReport: true, project: projetSansStructure, commune: "La Rochelle" });
  assert.equal(c.kind, "verdict");
  assert.deepEqual(c.kind === "verdict" ? c.geste : null, {
    label: "Décrire mon projet", href: `/rapport#${ANCRE_PROJET}`,
  });
});

test("payant SANS AUCUN PROJET : la page porte le titre, sans jamais lire un plan", () => {
  // Sans `userProject`, `rapport/page.tsx` n'appelle même pas `buildCommuneDossier` : il n'existe
  // aucun dossier, donc aucun plan, donc aucun headline à lire. Confondre cet état avec
  // `project_not_structured` ferait déréférencer un objet nul.
  const c = contenuDuHero({ fullReport: true, project: null, commune: "La Rochelle" });
  assert.equal(c.kind, "invite");
  assert.equal(
    c.kind === "invite" ? c.titre : "",
    "Dites ce que vous cherchez, et La Rochelle se lira à cette aune.",
  );
  assert.deepEqual(c.kind === "invite" ? c.geste : null, {
    label: "Décrire mon projet", href: `/rapport#${ANCRE_PROJET}`,
  });
});

test("payant sans projet et sans commune connue : la phrase reste juste", () => {
  const c = contenuDuHero({ fullReport: true, project: null, commune: null });
  assert.equal(
    c.kind === "invite" ? c.titre : "",
    "Dites ce que vous cherchez, et ce territoire se lira à cette aune.",
  );
});

test("non payant : le hero commercial, quel que soit le projet", () => {
  for (const project of [null, projetStructure, projetSansStructure]) {
    assert.equal(contenuDuHero({ fullReport: false, project, commune: "La Rochelle" }).kind, "commercial");
  }
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test src/lib/decision/premier-ecran.test.ts`
Expected: FAIL, `Cannot find module './premier-ecran.ts'`.

- [ ] **Step 3: Write minimal implementation**

Créer `src/lib/decision/premier-ecran.ts` :

```ts
import type { UserProject } from "../user-project.ts";

// ════════════════════════════════════════════════════════════════════════════════════════════
// QUEL CONTENU PORTE LE HAUT DE PAGE.
//
// ── POURQUOI QUATRE ÉTATS ET NON TROIS ───────────────────────────────────────────────────────
// « Projet présent mais non structuré » et « aucun projet » se ressemblent à l'écran et ne se
// ressemblent pas dans le code. Le premier est un état du PLAN (`project_not_structured`), donc un
// texte que le moteur produit et que le bloc verdict affiche déjà. Le second est l'absence de tout
// plan : sans `userProject`, la page n'appelle même pas `buildCommuneDossier`, le dossier vaut
// `null`, et chercher un headline dedans déréférencerait un objet nul.
//
// PUR, sans I/O : c'est la seule façon de tester les quatre états sans monter une page.
// ════════════════════════════════════════════════════════════════════════════════════════════

/** L'ancre de l'éditeur de projet. Toute invitation à préciser son cadrage mène ICI. */
export const ANCRE_PROJET = "projet";

export type Geste = { label: string; href: string };

export type ContenuHero =
  // Le bloc verdict streamé porte le titre. `geste` n'est posé que si le plan invite à préciser.
  | { kind: "verdict"; geste: Geste | null }
  // Aucun plan n'existe : la page porte elle-même le titre.
  | { kind: "invite"; titre: string; geste: Geste }
  // Non payant : le hero commercial, inchangé.
  | { kind: "commercial" };

const DECRIRE: Geste = { label: "Décrire mon projet", href: `/rapport#${ANCRE_PROJET}` };

export function contenuDuHero(input: {
  fullReport: boolean;
  project: UserProject | null;
  commune: string | null;
}): ContenuHero {
  if (!input.fullReport) return { kind: "commercial" };
  if (!input.project) {
    // Le lieu se nomme s'il est connu. « ce territoire » vaut mieux qu'un nom inventé ou qu'un
    // trou dans la phrase.
    const lieu = input.commune ?? "ce territoire";
    return { kind: "invite", titre: `Dites ce que vous cherchez, et ${lieu} se lira à cette aune.`, geste: DECRIRE };
  }
  // `parsed` nul est exactement ce que lit `isStructured`, donc ce qui produit
  // `project_not_structured` dans le plan. On ne recalcule pas l'état, on lit la même chose.
  return { kind: "verdict", geste: input.project.parsed == null ? DECRIRE : null };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test src/lib/decision/premier-ecran.test.ts`
Expected: PASS, 5 tests.

- [ ] **Step 5: Commit**

```bash
git add src/lib/decision/premier-ecran.ts src/lib/decision/premier-ecran.test.ts
git commit -m "Un écran sans projet du tout n'a aucun plan où lire son titre"
```

---

### Task 2 : La section rend le dossier, la page rend son cadre

**Files:**
- Modify: `src/components/report/DossierDecisionSection.tsx:159-177`

**Interfaces:**
- Consumes: rien de nouveau.
- Produces: `DossierDecisionSection` sans l'eyebrow « En une minute ». Elle CONSERVE `generatedAt`, `projetAChange`, `logementStatus` et le grain : ce sont les métadonnées de la version qu'elle lit.

- [ ] **Step 1: Rapprocher la section de l'en-tête**

`DossierDecisionSection` ouvre sur `className="mt-14"` (ligne 150), soit 56 px. Cet écart était juste
quand la section arrivait après une carte projet ; il couperait en deux le bloc de tête que ce
chantier prétend former. L'espacement devient une prop, avec le comportement actuel par défaut :

```tsx
  /** L'air AU-DESSUS de la section. `mt-14` quand elle suit d'autres blocs (comportement
   *  historique), resserré quand elle est la suite immédiate de l'en-tête du dossier : le lecteur
   *  doit y voir un seul bloc de tête, identité puis réponse. */
  espacement = "mt-14",
```

et `/rapport` passe `espacement="mt-6"` aux trois points de montage. Mesure à l'écran : l'identité et
le verdict doivent se lire comme un groupe, sans que le verdict paraisse collé à la ligne du projet.

- [ ] **Step 2: Retirer l'eyebrow, garder la date**

Dans `DossierDecisionSection.tsx`, remplacer le bloc `<div className="mb-7">` (lignes 159 à 177) par :

```tsx
      {/* L'EYEBROW « EN UNE MINUTE » A DISPARU (12/08/2026) : il nommait une section au milieu d'une
          page, or cette section est devenue la page. Le cadre (« Dossier », le bien lu, le projet
          actuel) est porté par `EnTeteDossier`, au-dessus du `Suspense`.

          LA DATE, ELLE, RESTE ICI, ET C'EST STRUCTUREL. Elle qualifie la version SERVIE, qui n'est
          connue qu'après la lecture de l'artefact de CE scope. La page ne connaît que l'artefact
          communal : remonter cette date daterait un verdict d'adresse avec la date d'un autre
          artefact. Même raison pour le bandeau d'obsolescence juste dessous. */}
      {generatedAt && dateFr(generatedAt) ? (
        <p className="mb-5 font-mono text-[11px] text-ghost">
          Analyse générée le {dateFr(generatedAt)}
        </p>
      ) : null}
```

- [ ] **Step 3: Vérifier que rien d'autre ne dépendait de ce bloc**

Run: `grep -n "En une minute" -r src`
Expected: aucune occurrence dans le rendu (seuls des commentaires peuvent subsister).

Run: `npx tsc --noEmit`
Expected: aucune sortie.

- [ ] **Step 4: Commit**

```bash
git add src/components/report/DossierDecisionSection.tsx
git commit -m "Le titre nommait une section au milieu de la page qu'il est devenu"
```

---

### Task 3 : L'en-tête d'identité, stable et hors streaming

**Files:**
- Create: `src/components/report/EnTeteDossier.tsx`
- Modify: `src/app/(account)/rapport/page.tsx` (autour des lignes 452 à 542)

**Interfaces:**
- Consumes: `ContenuHero` et `ANCRE_PROJET` (Task 1).
- Produces: `<EnTeteDossier bienLabel bienHref projet contenu />`, composant serveur pur, sans accès base.

- [ ] **Step 1: Créer le composant**

Créer `src/components/report/EnTeteDossier.tsx` :

```tsx
import Link from "next/link";
import type { ContenuHero } from "@/lib/decision/premier-ecran";
import { ANCRE_PROJET } from "@/lib/decision/premier-ecran";

// ════════════════════════════════════════════════════════════════════════════════════════════
// L'IDENTITÉ DE CE QUI EST LU, AU-DESSUS DE LA RÉPONSE.
//
// ── CE QUI EST ICI, ET POURQUOI ELLES SEULES ─────────────────────────────────────────────────
// Le lieu lu, le bien lu, et le projet ACTUEL du compte. Ces trois valeurs ne dépendent d'AUCUN
// artefact : elles sont connues sans attendre la moindre lecture externe, donc elles se rendent
// immédiatement et ne clignotent pas quand l'augmentation Adresse arrive.
//
// ── CE QUI N'EST PAS ICI, ET SURTOUT PAS ─────────────────────────────────────────────────────
// La date de l'analyse, son grain, son obsolescence. Elles qualifient la version SERVIE, connue
// seulement après la lecture de l'artefact du scope. La page ne connaît que l'artefact communal :
// les afficher ici daterait un verdict d'adresse avec la date d'un autre artefact.
//
// ── « VOTRE PROJET AUJOURD'HUI » EST DATÉ DU PRÉSENT, ET C'EST LE MOT QUI COMPTE ──────────────
// Cette ligne décrit le projet du compte à l'instant. Le verdict, lui, répond au projet figé dans
// l'artefact acheté. Sans cette précision, le lecteur lirait le projet d'aujourd'hui comme le
// cadrage de la réponse d'hier, ce que le bandeau d'obsolescence existe précisément pour éviter.
// ════════════════════════════════════════════════════════════════════════════════════════════

const INTENT_LABEL: Record<string, string> = { achat: "Achat", location: "Location" };

export function EnTeteDossier({
  lieu, bienLabel, bienAlternatif, choixParDefaut, intent, reformulation, contenu,
}: {
  lieu: string;
  /** L'adresse du bien lu, ou `null` quand la lecture est communale. */
  bienLabel: string | null;
  /** Vrai s'il existe un autre bien à ouvrir : sans alternative, le lien n'apprend rien. */
  bienAlternatif: boolean;
  /**
   * Le bien affiché a été DEVINÉ (`choixDossier.raison === "repli_plus_recent"`), non ouvert par le
   * lecteur. La distinction décide s'il doit aller vérifier, et elle n'existe nulle part ailleurs
   * dans le produit : `/rapport/dossiers` ne la montre pas.
   */
  choixParDefaut: boolean;
  intent: string | null;
  /** La reformulation du projet, ou son texte brut. `null` quand aucun projet n'est renseigné. */
  reformulation: string | null;
  contenu: ContenuHero;
}) {
  return (
    <div className="pt-14 lg:pt-20">
      <div className="flex items-center gap-2.5 font-mono text-[11px] tracking-[0.12em] uppercase text-accent mb-4">
        <span className="w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
        Dossier
      </div>

      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-[15px] mb-1.5">
        <span className="text-label">{bienLabel ? `${bienLabel}, ${lieu}` : lieu}</span>
        {choixParDefaut && bienAlternatif ? (
          <span className="text-[13px] text-ghost">À défaut de choix, le bien le plus récent</span>
        ) : null}
        {bienAlternatif ? (
          <Link
            href="/rapport/dossiers"
            className="text-[13.5px] text-accent underline underline-offset-2 decoration-[var(--border-2)] hover:decoration-current"
          >
            Changer de bien
          </Link>
        ) : null}
      </div>

      {reformulation ? (
        <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-[13.5px] text-muted">
          <span>
            Votre projet aujourd&apos;hui
            {intent && INTENT_LABEL[intent] ? ` · ${INTENT_LABEL[intent].toLowerCase()}` : ""} :{" "}
            <span className="text-label">{reformulation}</span>
          </span>
          <Link
            href={`#${ANCRE_PROJET}`}
            className="text-accent underline underline-offset-2 decoration-[var(--border-2)] hover:decoration-current"
          >
            Modifier
          </Link>
        </p>
      ) : null}

      {/* LE GESTE N'EST RENDU ICI QUE POUR L'INVITE. Dans l'état « projet présent mais non
          structuré », le titre est porté par le bloc verdict, qui est rendu PLUS BAS par le
          composant streamé : son bouton doit donc le suivre, pas le précéder. La page s'en charge
          (cf. `heroContenu.kind === "verdict" && heroContenu.geste`). */}
      {contenu.kind === "invite" ? (
        <>
          <h1
            className="mt-6 font-[var(--weight-display)] text-[length:var(--text-display)] leading-[1.12] tracking-[-0.8px] text-label max-w-[540px]"
            style={{ fontFamily: "var(--font-serif)" }}
          >
            {contenu.titre}
          </h1>
          <Link
            href={contenu.geste.href}
            className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-accent text-canvas font-semibold text-[14px] no-underline"
          >
            {contenu.geste.label}
          </Link>
        </>
      ) : null}
    </div>
  );
}
```

- [ ] **Step 2: Brancher l'en-tête et remonter le dossier**

Dans `src/app/(account)/rapport/page.tsx` :

1. Ajouter les imports :

```tsx
import { EnTeteDossier } from "@/components/report/EnTeteDossier";
import { contenuDuHero, ANCRE_PROJET } from "@/lib/decision/premier-ecran";
```

2. Après le calcul de `logementForCommune` et avant le rendu, calculer le contenu :

```tsx
  // LE CONTENU DU HAUT DE PAGE, décidé par une fonction pure et testée (quatre états). La page ne
  // rejoue pas la règle : elle la consomme.
  const heroContenu = contenuDuHero({
    fullReport, project: userProject, commune: displayName,
  });
```

3. Déplacer le bloc `{dossier && communeResult && inseeCode ? ( … ) : null}` (lignes 484 à 542) pour qu'il suive immédiatement `<EnTeteDossier />`, et insérer avant lui :

```tsx
        {fullReport ? (
          <EnTeteDossier
            lieu={displayName}
            bienLabel={logementForCommune?.address_label ?? null}
            bienAlternatif={choixDossier.autres.length > 0}
            intent={userProject?.intent ?? null}
            reformulation={userProject?.parsed?.reformulation ?? userProject?.rawText ?? null}
            contenu={heroContenu}
          />
        ) : null}
```

4. Rendre le geste de l'état « projet non structuré » JUSTE APRÈS le bloc du dossier, puisque le
   titre qu'il accompagne est porté par le bloc verdict, rendu par le composant streamé :

```tsx
        {heroContenu.kind === "verdict" && heroContenu.geste ? (
          <Link
            href={heroContenu.geste.href}
            className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-accent text-canvas font-semibold text-[14px] no-underline"
          >
            {heroContenu.geste.label}
          </Link>
        ) : null}
```

5. Supprimer l'ancienne ligne « Bien lu / À défaut de choix » (lignes 462 à 481) : l'en-tête la porte
   désormais, et sans condition sur l'existence d'une alternative.

   **LA RAISON DU CHOIX NE SE PERD PAS.** `choixDossier.raison` (`repli_plus_recent`) existe
   précisément pour distinguer « le bien que vous avez ouvert » de « celui que nous avons choisi pour
   vous », et c'est cette différence qui décide si le lecteur doit aller vérifier. `/rapport/dossiers`
   ne la montre pas : la laisser tomber ici la ferait disparaître du produit, et le hub servirait à
   nouveau un bien sans dire qu'il l'a deviné. Elle est donc passée à `EnTeteDossier` :

```tsx
            choixParDefaut={choixDossier.raison === "repli_plus_recent"}
```

   et rendue quand il existe une alternative (sans alternative, il n'y a rien à départager) :

```tsx
        {choixParDefaut && bienAlternatif ? (
          <span className="text-[13px] text-ghost">À défaut de choix, le bien le plus récent</span>
        ) : null}
```

- [ ] **Step 3: Vérifier**

Run: `npx tsc --noEmit && npm run build`
Expected: aucune erreur, build complet.

Run: `npm run dev`, ouvrir `/rapport` avec un compte payant et un bien, vérifier que le bien et le projet s'affichent AVANT le verdict et que la date reste dans le bloc du dossier.

- [ ] **Step 4: Commit**

```bash
git add src/components/report/EnTeteDossier.tsx "src/app/(account)/rapport/page.tsx"
git commit -m "Le lecteur voyait la promesse avant la réponse qu'il avait payée"
```

---

### Task 4 : Retirer l'horizon du hub, descendre le cadrage climat

**Files:**
- Modify: `src/app/(account)/rapport/page.tsx` (hero climat lignes 352 à 434, `HorizonBar` lignes 444 à 450, `ProjectSummaryCard` lignes 452 à 455)

**Interfaces:**
- Consumes: `ANCRE_PROJET` (Task 1).
- Produces: la page ne rend plus `HorizonBar` ; `ProjectSummaryCard` est rendue dans une section portant `id="projet"`.

- [ ] **Step 1: Retirer la barre d'horizon**

Supprimer le bloc :

```tsx
        <div id="horizon">
          <HorizonBar communeName={displayName} locked={!fullReport} inseeCode={inseeCode} />
        </div>
```

et l'import `HorizonBar`. Aucun lien interne ne pointe vers `#horizon` (vérifié : `grep -rn "#horizon" src` ne rend rien).

Poser à la place, dans le commentaire du fichier, la raison :

```tsx
        {/* LA BARRE D'HORIZON A QUITTÉ LE HUB (12/08/2026). `useHorizon` n'est consommé que par
            `QuartierSynthesis` et `QuartierClimatData`, donc par le module Territoire. Le clic n'était
            pas sans effet (il persiste la préférence, que Territoire relit), mais RIEN ne bougeait
            sous les yeux du lecteur, et le réglage occupait la place de ce qu'il avait acheté.
            Territoire porte son propre sélecteur inline : le choix n'est pas perdu. */}
```

- [ ] **Step 2: Descendre le cadrage climat et le panneau des échelles**

Déplacer la `<section>` du hero climat (lignes 352 à 434) APRÈS le bloc du dossier et après l'éditeur de projet, juste avant la section `#modules`. Transformer son `<h1>` en `<h2>` :

```tsx
              <h2 className="font-[var(--weight-title)] text-[length:var(--text-title)] leading-[1.18] tracking-[-0.5px] mb-6 text-label" style={{ fontFamily: "var(--font-serif)" }}>
                {displayName} en 2030, 2050, 2100.<br />
                <span className="italic text-accent">Ce que ça change pour vous.</span>
              </h2>
```

**LE TEXTE NE SURVIT PAS AU DÉPLACEMENT TEL QUEL.** Le paragraphe dit « Choisissez un horizon »
(ligne 368), alors que la tâche vient de retirer le sélecteur : la phrase donnerait une consigne
impossible à suivre. Le réécrire, sans rien promettre de plus que ce que la section ouvre :

```tsx
              <p className="text-[17px] leading-[1.72] text-muted mb-9">
                Ce que le changement climatique fait concrètement à votre quotidien ici, à trois
                horizons. Les données s&apos;adaptent quand c&apos;est possible.
              </p>
```

(le `max-w-[500px]` tombe : dans sa nouvelle position, ce paragraphe n'a plus de voisin de ligne, et
la doctrine de largeur interdit de plafonner un texte plus étroit que le bloc qui l'entoure.)

**LE PANNEAU COMPACT DES ÉCHELLES EST SUPPRIMÉ.** L'`<aside>` (lignes 393 à 433) répète le mot
« Dossier » que l'en-tête porte désormais, et liste les modules trois centimètres au-dessus de la
section `#modules`, qui les liste déjà avec plus de contexte. Déplacé, il deviendrait un doublon
visible ; il disparaît donc, et la section `<section>` perd sa grille à deux colonnes
(`grid-cols-[1fr_400px]`) pour redevenir une colonne pleine. Le lien « Voir mes trois échelles »
pointe toujours vers `#modules` et suffit à la navigation.

En mode NON payant, cette section reste EN TÊTE, garde son `<h1>`, son paragraphe actuel ET son
panneau : rien n'y est redondant, puisqu'il n'y a ni en-tête de dossier ni section de modules
ouverte. `contenuDuHero` rend alors `{ kind: "commercial" }`, et le rendu se branche sur ce
discriminant :

```tsx
        {heroContenu.kind === "commercial" ? (
          /* Le bloc <section> des lignes 352 à 434, déplacé sans autre modification : son <h1>
             reste un <h1>, puisque aucun verdict ne le lui dispute dans cet état. */
        ) : null}
```

et la version descendue (en `<h2>`) ne se rend que si `heroContenu.kind !== "commercial"`.

- [ ] **Step 3: Poser l'ancre de l'éditeur**

```tsx
        {/* L'ÉDITEUR DE PROJET EST UNE DESTINATION. Tout geste qui renvoie au cadrage pointe vers
            `/rapport#projet` : le « modifier » de l'en-tête, le bouton des états sans verdict, et le
            lien du module Territoire. `scroll-mt-24` évite que l'ancre passe sous la navbar, comme
            pour les ancres de cartes du dossier. */}
        <div id={ANCRE_PROJET} className="scroll-mt-24 mt-14">
          <ProjectSummaryCard initial={userProject} />
        </div>
```

- [ ] **Step 4: Vérifier**

Run: `npx tsc --noEmit && npm run build`
Expected: aucune erreur.

Run: dans le navigateur, `/rapport#projet` doit déposer sur l'éditeur, sous la navbar.

- [ ] **Step 5: Commit**

```bash
git add "src/app/(account)/rapport/page.tsx"
git commit -m "Un réglage qui ne règle rien sur la page où il s'affiche"
```

---

### Task 5 : La promotion du titre, mesurée avant d'être choisie

**Files:**
- Modify: `src/components/report/ConclusionBlock.tsx:100-108`
- Modify: `src/components/report/ConclusionRedigee.tsx:57,86,149,152`
- Modify: `src/components/report/DossierDecisionSection.tsx` (les deux appels au verdict)
- Modify: `src/components/report/DossierAvecLogement.tsx:131` (le chemin ADRESSE)
- Modify: `src/app/(account)/rapport/page.tsx` (les trois points de montage : `fallback`, chemin adresse, chemin commune seule)

**Interfaces:**
- Produces: `ConclusionBlock` accepte `titre?: { niveau: "h1" | "h2"; classe: string }`, par défaut `{ niveau: "h2", classe: "text-[length:var(--text-section)] font-[var(--weight-section)]" }`.

- [ ] **Step 1: Ajouter la prop dans `ConclusionBlock`**

```tsx
/** LE NIVEAU DE TITRE EST UNE PROP, ET NON UNE CONSTANTE (12/08/2026).
 *  Ce bloc est rendu par la page `/rapport` (où il est LE titre de l'écran), par les quatre
 *  chemins de `ConclusionRedigee`, et par la galerie `/dev/conclusion`, qui en affiche plusieurs.
 *  Le figer en `h1` ferait apparaître plusieurs titres de page dans la galerie. Le défaut reste
 *  donc le comportement actuel, et seule la page qui SAIT qu'il est son titre le promeut. */
const TITRE_DEFAUT = { niveau: "h2" as const, classe: "text-[length:var(--text-section)] font-[var(--weight-section)] tracking-[-0.4px]" };
```

Dans le corps, remplacer le `<h2>` de la ligne 103 par :

```tsx
      {(() => {
        const T = titre.niveau;
        return (
          <T
            className={`${titre.classe} leading-[1.2] text-label max-w-[540px]`}
            style={{ fontFamily: "var(--font-serif)" }}
          >
            {bindOrphans(plan.verdict.headline.text)}
          </T>
        );
      })()}
```

- [ ] **Step 2: Propager depuis `ConclusionRedigee` et la section**

`ConclusionRedigee` reçoit la même prop `titre` et la passe à ses QUATRE appels de `ConclusionBlock` (lignes 57, 86, 149, 152). `DossierDecisionSection` la reçoit également et la transmet aux deux branches (`pending` et `Suspense`).

**LA CHAÎNE DOIT ALLER JUSQU'AU BOUT DU CHEMIN ADRESSE.** `DossierAvecLogement` rend lui aussi une
`DossierDecisionSection` (ligne 131). L'oublier produirait le pire résultat possible : le repli
communal s'afficherait en grand `<h1>`, puis le verdict d'adresse, celui qui a été payé, reviendrait
en petit `<h2>` au moment où le streaming se résout. La prop traverse donc les TROIS points de
montage de `/rapport` (le `fallback`, le chemin adresse, le chemin commune seule) et
`DossierAvecLogement`.

`/rapport` passe :

```tsx
titre={{ niveau: "h1", classe: "text-[length:var(--text-display)] font-[var(--weight-display)] tracking-[-0.8px]" }}
```

- [ ] **Step 3: Mesurer avant de figer**

Run: `npm run dev`, ouvrir `/dev/conclusion`, relever le headline déterministe LE PLUS LONG du corpus, puis l'afficher dans `/rapport` à 360 px de large (DevTools, iPhone SE).

Décision inscrite dans le commit :
- 5 lignes ou moins : garder `--text-display` partout ;
- plus de 5 lignes : ajouter `max-sm:text-[length:var(--text-title)]` à la classe passée par `/rapport`, et noter la mesure.

- [ ] **Step 4: Vérifier**

Run: `npx tsc --noEmit && npm run build && node --test "src/**/*.test.ts"`
Expected: aucune erreur, 1400+ tests au vert.

Vérifier dans le navigateur qu'il y a exactement un `<h1>`, **DEUX FOIS sur un dossier d'adresse** :
pendant le repli communal (couper le réseau après le premier octet, ou recharger en 3G lente), puis
une fois le streaming résolu. `document.querySelectorAll("h1").length === 1` dans les deux instants,
et la taille du titre ne doit pas changer entre les deux.

- [ ] **Step 5: Commit**

```bash
git add src/components/report/ConclusionBlock.tsx src/components/report/ConclusionRedigee.tsx src/components/report/DossierDecisionSection.tsx "src/app/(account)/rapport/page.tsx"
git commit -m "Promouvoir la balise laissait la réponse plus petite que les titres sous elle"
```

---

### Task 6 : Changer l'intention sans détruire les priorités

**Files:**
- Create: `src/lib/decision/projet-edition.ts`
- Test: `src/lib/decision/projet-edition.test.ts`
- Modify: `src/components/report/ProjectSummaryCard.tsx:7-11,36-84,131-187`

**Interfaces:**
- Produces: `doitReparser(texteSaisi: string, projet: UserProject | null): boolean`, `parsedASauvegarder(input: { reparse: boolean; parsedRecu: UserProject["parsed"] | null; projet: UserProject | null }): { parsed: UserProject["parsed"] | null; avertir: boolean }`, et un `ProjectSummaryCard` qui expose le choix d'intention.

- [ ] **Step 1: Ajouter les options d'intention**

```tsx
// L'INTENTION ÉTAIT INATTEIGNABLE (12/08/2026). Cette carte envoyait `intent: project?.intent ?? null` :
// elle recopiait indéfiniment ce que le wizard ou /ou-vivre avait posé. Or le moteur la LIT (elle
// change les gestes proposés) et `signatureDecisionnelle` la compte comme matérielle. Quelqu'un qui
// passe d'un achat à une location ne pouvait pas le dire à l'endroit même où le dossier prétend lire
// son projet.
//
// « NI L'UN NI L'AUTRE » EST UN CHOIX, pas une absence de réponse : il écrit `null`. C'est ce qui
// rend possible le cas réel du locataire qui achète son logement (posture habitant + intention
// achat) sans laisser traîner une intention périmée après un changement d'objectif.
const INTENT_OPTIONS: { value: ProjectIntent | null; label: string }[] = [
  { value: "achat", label: "Acheter" },
  { value: "location", label: "Louer" },
  { value: null, label: "Ni l'un ni l'autre" },
];
```

Renommer au passage l'option de posture `adresse`, dont le libellé annonce une question désormais
posée juste en dessous :

```tsx
  { value: "adresse", label: "J'étudie ce lieu" },   // était : « J'étudie ce lieu pour acheter ou louer »
```

Ajouter l'état `const [intent, setIntent] = useState<ProjectIntent | null>(initial?.intent ?? null);` et, dans le formulaire d'édition, le même groupe de boutons que les postures, sous le libellé qui suit l'objectif :

```tsx
      <p className="font-mono text-[10px] tracking-[0.1em] uppercase text-ghost mb-2.5">
        {posture === "habitant" ? "Envisagez-vous d'acheter ou de louer ce logement" : "Vous comptez"}
      </p>
```

- [ ] **Step 2: Extraire la règle en fonction PURE et la tester**

La décision « faut-il reparser, et que sauvegarde-t-on » ne peut pas vivre uniquement dans un
composant client : elle ne serait vérifiable que par un blocage réseau à la main, donc jamais en
intégration continue. Créer `src/lib/decision/projet-edition.ts` :

```ts
import type { UserProject } from "../user-project.ts";

// ════════════════════════════════════════════════════════════════════════════════════════════
// CE QU'ON SAUVEGARDE QUAND LE LECTEUR MODIFIE SON PROJET.
//
// Le défaut corrigé : `save()` reparse SYSTÉMATIQUEMENT et repart de `parsed = null`. Tant qu'on ne
// sauvegardait qu'après avoir édité le texte, c'était tolérable. Depuis que l'écran permet de
// changer la SEULE intention, un aller-retour « achat / location » un jour où le parseur est
// indisponible enregistrerait le projet sans ses priorités, et le dossier retomberait en « projet
// non structuré » alors que le lecteur n'a pas touché à son texte.
// ════════════════════════════════════════════════════════════════════════════════════════════

/** Le texte a-t-il changé ? Comparaison sur le texte TAILLÉ : une espace en fin de zone de saisie
 *  n'est pas une modification de projet. */
export function doitReparser(texteSaisi: string, projet: UserProject | null): boolean {
  return texteSaisi.trim() !== (projet?.rawText ?? "").trim();
}

/**
 * Ce que la sauvegarde doit porter dans `parsed`, et s'il faut avertir le lecteur.
 *
 * `parsedRecu` vaut `null` quand le parseur a échoué OU refusé. Dans ce cas on n'écrit PAS l'ancien
 * `parsed` : il décrit l'ancien texte, et l'attacher au nouveau ferait répondre l'analyse à des
 * priorités que le lecteur vient de retirer. On écrit `null` et on le DIT.
 */
export function parsedASauvegarder(input: {
  reparse: boolean;
  parsedRecu: UserProject["parsed"] | null;
  projet: UserProject | null;
}): { parsed: UserProject["parsed"] | null; avertir: boolean } {
  if (!input.reparse) return { parsed: input.projet?.parsed ?? null, avertir: false };
  return { parsed: input.parsedRecu, avertir: input.parsedRecu == null };
}
```

Et son test, `src/lib/decision/projet-edition.test.ts` :

```ts
import test from "node:test";
import assert from "node:assert/strict";
import { doitReparser, parsedASauvegarder } from "./projet-edition.ts";
import type { UserProject } from "../user-project.ts";

const PARSED = { reformulation: "Un lieu calme.", hardConstraints: {}, preferences: [{ key: "cadre_calme", weight: 3 }] };
const projet = {
  posture: "recherche", intent: "achat", rawText: "au calme, près de la mer",
  parsed: PARSED, updatedAt: "2026-08-05T09:00:00.000Z",
} as unknown as UserProject;

test("changer la SEULE intention ne reparse rien et ne perd rien", () => {
  // Le cas qui motive tout : sans cette règle, un aller-retour achat / location un jour de panne du
  // parseur effacerait les priorités du lecteur, sans qu'il ait touché à son texte.
  assert.equal(doitReparser("au calme, près de la mer", projet), false);
  assert.deepEqual(
    parsedASauvegarder({ reparse: false, parsedRecu: null, projet }),
    { parsed: PARSED, avertir: false },
  );
});

test("une espace de plus n'est pas une modification", () => {
  assert.equal(doitReparser("  au calme, près de la mer  ", projet), false);
});

test("texte modifié et parseur disponible : le nouveau parsed gagne", () => {
  const neuf = { reformulation: "Autre chose.", hardConstraints: {}, preferences: [] } as unknown as UserProject["parsed"];
  assert.equal(doitReparser("je veux la montagne", projet), true);
  assert.deepEqual(
    parsedASauvegarder({ reparse: true, parsedRecu: neuf, projet }),
    { parsed: neuf, avertir: false },
  );
});

test("texte modifié et parseur indisponible : on n'attache PAS les anciennes priorités au nouveau texte", () => {
  // Les garder ferait répondre l'analyse à des priorités que le lecteur vient de retirer. On écrit
  // null, et l'écran le dit.
  assert.deepEqual(
    parsedASauvegarder({ reparse: true, parsedRecu: null, projet }),
    { parsed: null, avertir: true },
  );
});

test("premier projet, aucun texte antérieur : on reparse", () => {
  assert.equal(doitReparser("au calme", null), true);
});
```

Run: `node --test src/lib/decision/projet-edition.test.ts`
Expected: FAIL puis PASS après création du module.

- [ ] **Step 3: Rendre la sauvegarde non destructive dans la carte**

La carte CONSOMME les deux fonctions ci-dessus, elle ne réécrit pas la règle. Remplacer le corps de
`save()` (lignes 36 à 54) par :

```tsx
    const raw = text.trim();
    if (!raw || !posture) return;
    setBusy(true);
    setError(null);
    setAvertissement(null);

    // DEUX ÉTATS DISTINCTS, ET LA DISTINCTION EST TOUT (revue du 12/08/2026).
    // ══════════════════════════════════════════════════════════════════════════════════════════
    // `error` dit « ce n'est PAS enregistré » et garde l'éditeur ouvert. `avertissement` dit « c'est
    // enregistré, mais vos priorités n'ont pas pu être comprises ». Les confondre produisait le pire
    // des deux : un message posé AVANT l'appel de sauvegarde, donc prématuré, puis effacé par la
    // fermeture de l'éditeur en cas de succès, donc invisible.
    const reparse = doitReparser(raw, project);
    let parsedRecu: UserProject["parsed"] | null = null;
    if (reparse) {
      try {
        const r = await fetch("/api/comparateur-vie/parse", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: raw }),
        });
        const data = r.ok ? ((await r.json()) as { parsed?: unknown }) : null;
        parsedRecu = data?.parsed && typeof data.parsed === "object"
          ? (data.parsed as UserProject["parsed"])
          : null;
      } catch {
        parsedRecu = null;
      }
    }
    const { parsed, avertir } = parsedASauvegarder({ reparse, parsedRecu, projet: project });
```

puis, dans l'appel à `/api/profile`, remplacer `intent: project?.intent ?? null` par `intent`, et
poser l'avertissement APRÈS la confirmation serveur, jamais avant :

```tsx
      setProject(data.project); // uniquement le projet confirmé par le serveur
      setEditing(false);
      // L'AVERTISSEMENT SURVIT À LA FERMETURE DE L'ÉDITEUR : il concerne ce qui vient d'être
      // enregistré, et il se lit sur la carte fermée. Le poser avant l'appel l'aurait rendu
      // prématuré ; le poser dans `error` l'aurait fait disparaître avec l'éditeur.
      if (avertir) {
        setAvertissement("Votre texte est enregistré. Nous n'avons pas pu en extraire vos priorités : rouvrez l'éditeur et enregistrez à nouveau pour une analyse complète.");
      }
      router.refresh();
```

L'état `avertissement` est déclaré à côté de `error` (`const [avertissement, setAvertissement] = useState<string | null>(null);`) et rendu dans la vue « projet présent », sous la reformulation, dans la teinte du non-su (`var(--reg-non-su)`), jamais dans celle d'une erreur.

- [ ] **Step 4: Vérifier à la main le cas qui motive la tâche**

Run: `npm run dev`. Sur `/rapport`, ouvrir l'éditeur, changer UNIQUEMENT l'intention, enregistrer. Puis, dans les DevTools, bloquer `/api/comparateur-vie/parse` (onglet Réseau, « Block request URL ») et refaire la même opération.

Expected : dans les deux cas, la reformulation reste affichée après rechargement, et le dossier ne bascule pas en « À préciser ».

- [ ] **Step 5: Vérifier le reste**

Run: `npx tsc --noEmit && npm run build`
Expected: aucune erreur.

- [ ] **Step 6: Commit**

```bash
git add src/lib/decision/projet-edition.ts src/lib/decision/projet-edition.test.ts src/components/report/ProjectSummaryCard.tsx
git commit -m "Changer d'intention un jour de panne du parseur effaçait les priorités"
```

---

### Task 7 : La relation au lieu, éditée là où l'on édite le projet

**Files:**
- Modify: `src/app/(account)/rapport/page.tsx` (chargement de `report_context`)
- Modify: `src/components/report/ProjectSummaryCard.tsx` (sous-contrôle « Pour {commune} »)

**Interfaces:**
- Consumes: `getReportContext`, `resolveRelation` (`src/lib/report-context.ts`), `PATCH /api/report-context`.
- Produces: `ProjectSummaryCard` accepte `relation?: { insee: string; commune: string; valeur: Relation; source: RelationSource } | null`.

- [ ] **Step 1: Charger le contexte dans la page**

```tsx
  // LA RELATION AU LIEU SE LIT ICI DEPUIS LE 12/08/2026, parce que c'est ici qu'on la modifie
  // désormais. Elle reste attachée à la COMMUNE (table `report_context`), et non au projet :
  // quelqu'un peut habiter Lorient et envisager La Rochelle. On affiche la valeur EFFECTIVE
  // (`resolveRelation`), celle que la synthèse utilisera, plutôt qu'une valeur déclarée qui n'existe
  // peut-être pas encore.
  const contexteLecture = fullReport && inseeCode
    ? resolveRelation(territory.isResidence, await getReportContext(supabase, user.id, inseeCode))
    : null;
```

et passer à la carte :

```tsx
          <ProjectSummaryCard
            initial={userProject}
            relation={contexteLecture && inseeCode
              ? {
                  insee: inseeCode, commune: displayName,
                  valeur: contexteLecture.relation,
                  // L'ORIGINE VOYAGE AVEC LA VALEUR (revue du 12/08/2026). Sans elle, l'écran ne
                  // peut pas distinguer une réponse DÉCLARÉE d'une relation DÉDUITE du domicile, et
                  // afficherait une déduction comme un choix du lecteur.
                  source: contexteLecture.source,
                }
              : null}
          />
```

- [ ] **Step 2: Ajouter le sous-contrôle, avec sa PROPRE sauvegarde**

Dans `ProjectSummaryCard`, sous l'éditeur de projet :

```tsx
{/* DEUX SOUS-CONTRÔLES, DEUX SAUVEGARDES, ET C'EST DÉLIBÉRÉ (12/08/2026).
    Le projet vit dans `user_profiles.user_project`, la relation dans `report_context` : deux
    tables, deux routes, aucune transaction. Un bouton « Enregistrer » unique pourrait donc réussir
    à moitié et laisser l'écran incapable de dire lequel des deux il montre. Le lecteur modifie tout
    au même endroit ; on refuse seulement de prétendre à une atomicité que le stockage ne donne pas. */}
```

avec un état `relationBusy` / `relationError` distinct de `busy` / `error`, et l'appel :

```tsx
    const res = await fetch("/api/report-context", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ insee: relation.insee, relation: next }),
    });
    if (!res.ok) { setRelationError("Enregistrement impossible pour le moment. Réessayez."); return; }
    router.refresh();
```

Les deux choix affichés sont ceux qui existent déjà côté route : `current_residence` (« J'y vis ») et
`considering_living` (« J'envisage d'y vivre »).

**L'ORIGINE SE DIT, ET LES DEUX AUTRES VALEURS NE SE PERDENT PAS.** `Relation` compte quatre valeurs :
`information_only` et `unknown` existent en base, ne sont proposées par aucun écran, et
`synthesisRelation` les traite comme `considering_living`. Deux règles de rendu :

- `source === "inferred"` : la valeur est présentée comme une DÉDUCTION, jamais comme une réponse.
  Sous les deux boutons, une ligne : « Déduit de votre commune de résidence. Corrigez si besoin. »
  `source === "confirmed_by_user"` n'affiche rien de tel : le lecteur a répondu, le lui rappeler
  serait du bruit.
- `valeur` hors des deux choix proposés (`information_only`, `unknown`) : aucun bouton n'est marqué
  actif, et la ligne dit ce qui s'appliquera : « Aucune relation déclarée pour cette commune :
  l'analyse s'adresse à quelqu'un qui envisage de s'y installer. » Marquer « J'envisage d'y vivre »
  comme actif serait afficher comme déclaré ce qui n'est qu'un repli de la synthèse.

- [ ] **Step 3: Vérifier le cas multi-communes**

Run: `npm run dev`. Avec un compte dont la résidence est une commune A et qui possède un dossier dans une commune B :
1. Lire A, poser « J'y vis ». Recharger : la valeur tient.
2. Ouvrir B. Le sous-contrôle doit dire « Pour B », proposer la valeur inférée (`considering_living`), et NON celle de A.
3. Poser « J'envisage d'y vivre » sur B, revenir sur A : la valeur de A doit être intacte.
4. Le projet (posture, intention, texte) doit être identique tout du long.

- [ ] **Step 4: Commit**

```bash
git add "src/app/(account)/rapport/page.tsx" src/components/report/ProjectSummaryCard.tsx
git commit -m "Une posture, deux relations : habiter Lorient et envisager La Rochelle"
```

---

### Task 8 : Territoire dit le cadrage, il ne le demande plus

**Files:**
- Modify: `src/components/report/ReportRelationBanner.tsx`

**Interfaces:**
- Produces: composant sans état ni fetch, qui rend la phrase et un lien vers `/rapport#projet`.

- [ ] **Step 1: Retirer le sélecteur**

Remplacer tout le corps interactif (les états `open` / `saving`, la fonction `choose`, la constante `CHOICES` et les boutons) par :

```tsx
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-muted">
      <span className="inline-flex items-center gap-2">
        <span className="w-1 h-1 rounded-full bg-info/70 shrink-0" />
        {label(relation, communeName)}
      </span>
      {/* LE CADRAGE SE DIT ICI, IL SE MODIFIE AILLEURS (12/08/2026). Un rapport payé restitue une
          analyse ; il ne recommence pas son onboarding en bas de page. L'édition vit au seul endroit
          qui porte le projet, et ce lien y mène directement. */}
      <Link
        href="/rapport#projet"
        className="underline underline-offset-2 text-muted hover:text-label transition-colors"
      >
        Modifier le projet
      </Link>
    </div>
  );
```

Le composant n'a plus besoin de `"use client"`, de `useState`, de `useRouter` ni de `usePostHog`. Retirer aussi la prop `insee` si plus aucun appelant ne l'utilise (vérifier `rapport/quartier/page.tsx:231`).

- [ ] **Step 2: Vérifier**

Run: `npx tsc --noEmit && npm run build`
Expected: aucune erreur. Si `insee` devient inutilisée, la retirer de la prop ET de l'appelant.

Run: `grep -rn "report_relation_corrected\|report_relation_selector_opened" src`
Expected: aucune occurrence. Ces deux événements PostHog disparaissent avec le sélecteur ; le noter dans le message de commit pour que la baisse à zéro dans les tableaux de bord ne soit pas lue comme une panne.

- [ ] **Step 3: Commit**

```bash
git add src/components/report/ReportRelationBanner.tsx "src/app/(account)/rapport/quartier/page.tsx"
git commit -m "Un rapport payé restitue une analyse, il ne redemande pas qui vous êtes"
```

---

### Task 9 : Le Logement lit le projet du compte

**Files:**
- Modify: `src/lib/decision/logement-verifications.ts:61-90,117-121`
- Modify: `src/lib/decision/logement-verifications.test.ts`
- Modify: `src/components/report/logement/DecisionChecklist.tsx:13-19`
- Modify: `src/components/report/LogementModule.tsx:80,463-478`
- Modify: `src/app/(account)/rapport/logement/page.tsx`
- Delete: `src/components/report/logement/ProjectProbe.tsx`

**Interfaces:**
- Consumes: `bucketDuProjet` (`src/lib/decision/logement-gestes.ts:37`), `normalizeUserProject` (`src/lib/user-project.ts`).
- Produces: `pointsAVerifier(logement: LogementFacts, project: UserProject | null)` et `introPointsAVerifier(project: UserProject | null)`.

- [ ] **Step 1: Adapter le test AVANT le code**

En tête de `src/lib/decision/logement-verifications.test.ts`, ajouter :

```ts
import type { UserProject } from "../user-project.ts";

// LE MODULE LIT LE PROJET DU COMPTE, PLUS UNE RÉPONSE DE SONDE (12/08/2026). La sonde locale
// demandait « Que comptez-vous faire de ce logement ? » à chaque visite sans rien persister, alors
// que le compte connaît déjà la réponse. La dérivation reste celle de `bucketDuProjet`, seule.
// Des projets VALIDES, pas des objets maquillés : `UserProject` exige une `posture`. Les fixtures
// décrivent donc trois lecteurs réels, et le cast ne sert qu'à omettre les champs d'affichage.
const projet = (over: Partial<UserProject>): UserProject => ({
  posture: "adresse", intent: null, rawText: null, parsed: null, updatedAt: null, ...over,
} as UserProject);
const ACHAT = projet({ intent: "achat" });
const LOCATION = projet({ intent: "location" });
const RESIDE = projet({ posture: "habitant" });
```

puis remplacer les littéraux. Le motif porte sur le DERNIER argument, qui est toujours la chaîne :
un motif `([^,]+)` s'arrêterait sur les virgules internes des objets étalés comme
`pointsAVerifier({ ...RIEN, dpe: "passoire" }, "achat")`, et laisserait plusieurs appels inchangés.

```bash
perl -pi -e 's/, "achat"\)/, ACHAT)/g; s/, "location"\)/, LOCATION)/g; s/, "reside"\)/, RESIDE)/g;
             s/\("achat"\)/(ACHAT)/g; s/\("location"\)/(LOCATION)/g; s/\("reside"\)/(RESIDE)/g' \
  src/lib/decision/logement-verifications.test.ts
grep -n '"achat"\|"location"\|"reside"' src/lib/decision/logement-verifications.test.ts
```

Le `grep` final doit être VIDE : s'il reste une occurrence, la corriger à la main plutôt que d'élargir
le motif.

Ajouter deux tests qui fixent le nouveau contrat :

```ts
test("un projet d'achat déclaré au COMPTE oriente la liste, sans sonde locale", () => {
  // Le compte connaît l'intention : la redemander à chaque ouverture du module était une question
  // dont on avait la réponse, et elle repartait à chaque visite sans être persistée.
  assert.notDeepEqual(pointsAVerifier(TOUT, ACHAT), pointsAVerifier(TOUT, RESIDE));
  // Sans projet, aucune posture n'est devinée : `bucketDuProjet` rend `neutre` et l'intro le dit.
  assert.match(introPointsAVerifier(null), /Votre projet permettra/);
});

test("HABITANT QUI ACHÈTE : l'intention gagne, et c'est la règle de bucketDuProjet", () => {
  // Le locataire qui achète le logement où il vit est un cas réel. L'écran permet de poser les deux,
  // et une seule fonction arbitre : `bucketDuProjet` teste l'intention avant la posture. Ce test
  // existe pour que personne ne « corrige » cet ordre en croyant réparer une incohérence.
  const habitantQuiAchete = projet({ posture: "habitant", intent: "achat" });
  assert.deepEqual(pointsAVerifier(TOUT, habitantQuiAchete), pointsAVerifier(TOUT, ACHAT));
  assert.notDeepEqual(pointsAVerifier(TOUT, habitantQuiAchete), pointsAVerifier(TOUT, RESIDE));
});
```

- [ ] **Step 2: Lancer le test pour le voir échouer**

Run: `node --test src/lib/decision/logement-verifications.test.ts`
Expected: FAIL (le code attend encore une chaîne).

- [ ] **Step 3: Changer la signature et supprimer l'adaptateur**

Dans `logement-verifications.ts`, ajouter l'import `import { bucketDuProjet } from "./logement-gestes.ts";`
(il n'y est pas : c'est `projetDepuisLaSonde` qui servait d'intermédiaire), supprimer
`projetDepuisLaSonde` (lignes 55 à 66) et écrire :

```ts
/**
 * LE PROJET VIENT DU COMPTE, PLUS D'UNE SONDE LOCALE (12/08/2026).
 *
 * `projetDepuisLaSonde` reconstruisait un `UserProject` depuis la réponse d'une sonde qui ne
 * persistait rien et se reposait à chaque visite. Le compte porte déjà l'objectif et l'intention :
 * on les lit. La dérivation de posture reste celle de `bucketDuProjet`, appelée par les règles, et
 * ce module n'en écrit aucune seconde.
 */
export function pointsAVerifier(
  logement: LogementFacts, project: UserProject | null,
): PointAVerifier[] {
  const facts = faitsMinimaux(logement);
  const projet = project ?? ({ intent: null, posture: null } as UserProject);
  // … le reste du corps est inchangé, `projet` remplaçant `project`
```

et :

```ts
export function introPointsAVerifier(project: UserProject | null): string {
  // `neutre` est le seul cas où l'on ne sait rien : on le dit, sans deviner une posture.
  return bucketDuProjet(project ?? {}) !== "neutre"
    ? "Voici les points que la lecture de ce logement fait remonter, à documenter selon votre projet."
    : "Ces points viennent de la lecture du logement. Votre projet permettra de les rendre plus précis.";
}
```

- [ ] **Step 4: Vérifier le test**

Run: `node --test src/lib/decision/logement-verifications.test.ts`
Expected: PASS.

- [ ] **Step 5: Brancher la page et le module, supprimer la sonde**

1. `rapport/logement/page.tsx` : lire le projet et le passer.

```tsx
import { normalizeUserProject } from "@/lib/user-project";

  // LE PROJET DU COMPTE ENTRE DANS LE MODULE (12/08/2026), à la place de la sonde locale.
  const { data: profileProjet } = await supabase
    .from("user_profiles")
    .select("user_project")
    .eq("user_id", user.id)
    .maybeSingle();
  const userProject = normalizeUserProject(
    (profileProjet as { user_project?: unknown } | null)?.user_project ?? null,
  );
```

puis `<LogementModule … project={userProject} />`.

2. `LogementModule.tsx` : ajouter la prop `project: UserProject | null`, supprimer `const [projet, setProjet] = useState<string | null>(null);`, supprimer l'import et le rendu de `ProjectProbe`, et passer `project` à `DecisionChecklist`.

3. `DecisionChecklist.tsx` : la prop devient `project: UserProject | null`, et les deux appels
   suivent :

```tsx
export function DecisionChecklist({ facts, project }: { facts: LogementFacts; project: UserProject | null }) {
  const items = pointsAVerifier(facts, project);
  // … puis, dans le rendu : {introPointsAVerifier(project)}
```

4. Supprimer le fichier :

```bash
git rm src/components/report/logement/ProjectProbe.tsx
```

- [ ] **Step 6: Vérifier l'ensemble**

Run: `npx tsc --noEmit && node --test "src/**/*.test.ts" && npm run build`
Expected: aucune erreur, tous les tests au vert.

Run: `grep -rn "ProjectProbe\|projetDepuisLaSonde\|logement_projet_declare" src`
Expected: aucune occurrence. L'événement PostHog `logement_projet_declare` disparaît : le noter dans le commit.

- [ ] **Step 7: Commit**

```bash
git add -A src/lib/decision/logement-verifications.ts src/lib/decision/logement-verifications.test.ts src/components/report/logement src/components/report/LogementModule.tsx "src/app/(account)/rapport/logement/page.tsx"
git commit -m "Le module redemandait à chaque visite une réponse que le compte connaissait"
```

---

### Task 10 : Recette et captures

**Files:** aucun (vérification).

- [ ] **Step 1: Les quatre contenus du hero**

Sur `npm run dev`, produire une capture desktop ET mobile (360 px) de chacun :
1. payant, projet structuré (verdict) ;
2. payant, projet présent mais `parsed` nul (« À préciser » plus bouton) ;
3. payant, aucun projet (invite écrite par la page) ;
4. non payant (hero commercial).

**Ne pas mutiler un compte réel à la légère.** Deux des quatre états demandent un projet dégradé, et
le compte de recette porte des achats réels.

Ordre de préférence :

1. **Un compte jetable** : créer un compte, lui poser un droit sur une commune à la main
   (`insert into report_grants …` selon le patron existant), et le supprimer après. Aucun état à
   restaurer, donc rien à oublier de restaurer.
2. À défaut, sur le compte de recette, avec sauvegarde EXACTE et vérification finale :

```sql
-- 1. Sauvegarder le JSON exact, dans une table temporaire de session
create temp table sauvegarde_projet as
  select user_id, user_project from user_profiles where user_id = '<id>';
select user_project from sauvegarde_projet;  -- copier aussi le résultat hors de la base

-- 2. État « projet présent, parsed nul »
update user_profiles set user_project = user_project - 'parsed' where user_id = '<id>';
-- … capture …

-- 3. État « aucun projet »
update user_profiles set user_project = null where user_id = '<id>';
-- … capture …

-- 4. Restaurer, puis PROUVER que la restauration est exacte
update user_profiles p set user_project = s.user_project
  from sauvegarde_projet s where p.user_id = s.user_id;
select (p.user_project = s.user_project) as identique
  from user_profiles p join sauvegarde_projet s on s.user_id = p.user_id;
-- doit rendre `t`. Si `f` ou aucune ligne : restaurer depuis la copie prise à l'étape 1.
```

L'état NON payant ne se produit pas en dégradant le compte de recette : il se lit avec un compte sans
droit sur la commune (un second compte, ou une session privée sur un compte neuf). Retirer un droit
payé pour faire une capture serait la seule manipulation vraiment irréversible de cette liste.

- [ ] **Step 2: Les invariants qui se vérifient à l'œil**

- Un seul `<h1>` : `document.querySelectorAll("h1").length === 1` sur les quatre états, et **deux
  fois sur un dossier d'adresse** : pendant le repli communal, puis après résolution du stream. La
  taille du titre doit être la même aux deux instants.
- Les deux grains sont couverts explicitement : une commune SEULE (aucun bien d'adresse) et une
  commune AVEC adresse. Ce sont deux chemins de rendu distincts, pas deux variantes d'un même.
- Aucun débordement horizontal à 360 px : `document.documentElement.scrollWidth <= window.innerWidth`.
- La date de l'analyse n'apparaît QUE dans le bloc du dossier, jamais au-dessus.
- Sur un dossier d'adresse dont le projet a matériellement changé, le bandeau d'obsolescence et la
  ligne « Votre projet aujourd'hui » restent deux blocs distincts.
- Le module Logement n'affiche PLUS la sonde « Que comptez-vous faire de ce logement ? », et la
  checklist est bien orientée par le projet du compte (changer l'intention sur `/rapport` doit
  changer la liste).
- Depuis Territoire, le lien « Modifier le projet » dépose sur l'éditeur, sous la navbar.
- `npm run lint` ne signale aucune erreur nouvelle (l'avertissement `account` de `rapport/page.tsx`
  est préexistant).

- [ ] **Step 3: Le cas multi-communes, en entier**

Rejouer les quatre étapes de la Task 7, Step 3, et vérifier en base :

```sql
select insee, relation, relation_source from report_context where user_id = '<id>' order by insee;
```

Expected: une ligne par commune, aucune écrasée par l'autre.

- [ ] **Step 4: Commit des captures et de la note de recette**

```bash
git add docs/audits/2026-08-12-premier-ecran-recette.md
git commit -m "La recette du premier écran, ses quatre états et sa mesure mobile"
```

---

## Ce que ce plan ne fait pas

- La fusion des stockages (`user_project` et `report_context`) et le modèle projet → candidats.
- L'ordre interne de la minute, le contenu des cartes, les registres et leurs teintes.
- Le sélecteur d'horizon sur Territoire, qui reste tel quel.
- Le déplacement de l'édition du projet hors de `/rapport`.
