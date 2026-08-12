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

- [ ] **Step 1: Retirer l'eyebrow, garder la date**

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

- [ ] **Step 2: Vérifier que rien d'autre ne dépendait de ce bloc**

Run: `grep -n "En une minute" -r src`
Expected: aucune occurrence dans le rendu (seuls des commentaires peuvent subsister).

Run: `npx tsc --noEmit`
Expected: aucune sortie.

- [ ] **Step 3: Commit**

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
  lieu, bienLabel, bienAlternatif, intent, reformulation, contenu,
}: {
  lieu: string;
  /** L'adresse du bien lu, ou `null` quand la lecture est communale. */
  bienLabel: string | null;
  /** Vrai s'il existe un autre bien à ouvrir : sans alternative, le lien n'apprend rien. */
  bienAlternatif: boolean;
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

5. Supprimer l'ancienne ligne « Bien lu / À défaut de choix » (lignes 462 à 481) : l'en-tête la porte désormais, et sans condition sur l'existence d'une alternative. La NUANCE de la raison du choix (« bien lu » contre « à défaut de choix, bien le plus récent ») se perd volontairement ici : elle sera rendue par le sélecteur de biens, dont c'est le sujet. Noter ce retrait dans le message de commit.

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

En mode NON payant, cette section reste EN TÊTE et garde son `<h1>` : c'est le hero commercial, et `contenuDuHero` rend alors `{ kind: "commercial" }`. Le rendu se branche sur ce discriminant :

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

`ConclusionRedigee` reçoit la même prop `titre` et la passe à ses QUATRE appels de `ConclusionBlock` (lignes 57, 86, 149, 152). `DossierDecisionSection` la reçoit également et la transmet aux deux branches (`pending` et `Suspense`). `/rapport` passe :

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

Vérifier dans le navigateur qu'il y a exactement un `<h1>` : `document.querySelectorAll("h1").length === 1`.

- [ ] **Step 5: Commit**

```bash
git add src/components/report/ConclusionBlock.tsx src/components/report/ConclusionRedigee.tsx src/components/report/DossierDecisionSection.tsx "src/app/(account)/rapport/page.tsx"
git commit -m "Promouvoir la balise laissait la réponse plus petite que les titres sous elle"
```

---

### Task 6 : Changer l'intention sans détruire les priorités

**Files:**
- Modify: `src/components/report/ProjectSummaryCard.tsx:7-11,36-84,131-187`

**Interfaces:**
- Produces: `ProjectSummaryCard` expose le choix d'intention et n'appelle le parseur que si le texte a changé.

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

Ajouter l'état `const [intent, setIntent] = useState<ProjectIntent | null>(initial?.intent ?? null);` et, dans le formulaire d'édition, le même groupe de boutons que les postures, sous le libellé qui suit l'objectif :

```tsx
      <p className="font-mono text-[10px] tracking-[0.1em] uppercase text-ghost mb-2.5">
        {posture === "habitant" ? "Envisagez-vous d'acheter ou de louer ce logement" : "Vous comptez"}
      </p>
```

- [ ] **Step 2: Rendre la sauvegarde non destructive**

Remplacer le corps de `save()` (lignes 36 à 54) par :

```tsx
    const raw = text.trim();
    if (!raw || !posture) return;
    setBusy(true);
    setError(null);
    // LE REPARSAGE NE SE DÉCLENCHE QUE SI LE TEXTE A CHANGÉ (12/08/2026).
    // ══════════════════════════════════════════════════════════════════════════════════════════
    // `parsed` était réinitialisé à `null` puis rempli seulement en cas de succès du parseur. Tant
    // qu'on ne sauvegardait qu'après avoir édité le texte, c'était tolérable. Depuis que cette carte
    // permet de changer la SEULE intention, un aller-retour « achat / location » un jour où le
    // parseur est indisponible enregistrerait le projet SANS ses priorités : le dossier retomberait
    // en « projet non structuré » alors que le lecteur n'a pas touché à son texte.
    const texteInchange = raw === (project?.rawText ?? "").trim();
    let parsed: UserProject["parsed"] = project?.parsed ?? null;
    if (!texteInchange) {
      let echecParse = false;
      try {
        const r = await fetch("/api/comparateur-vie/parse", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: raw }),
        });
        const data = r.ok ? ((await r.json()) as { parsed?: unknown }) : null;
        parsed = data?.parsed && typeof data.parsed === "object"
          ? (data.parsed as UserProject["parsed"])
          : null;
        echecParse = parsed == null;
      } catch {
        parsed = null;
        echecParse = true;
      }
      // UN ÉCHEC DE PARSE SE VOIT. Le texte est conservé (il est ce que le lecteur a écrit), mais on
      // ne laisse pas croire que ses priorités ont été comprises.
      if (echecParse) {
        setError("Votre texte est enregistré, mais nous n'avons pas pu en extraire vos priorités. Réessayez dans un instant pour une analyse complète.");
      }
    }
```

puis, dans l'appel à `/api/profile`, remplacer `intent: project?.intent ?? null` par `intent`.

- [ ] **Step 3: Vérifier à la main le cas qui motive la tâche**

Run: `npm run dev`. Sur `/rapport`, ouvrir l'éditeur, changer UNIQUEMENT l'intention, enregistrer. Puis, dans les DevTools, bloquer `/api/comparateur-vie/parse` (onglet Réseau, « Block request URL ») et refaire la même opération.

Expected : dans les deux cas, la reformulation reste affichée après rechargement, et le dossier ne bascule pas en « À préciser ».

- [ ] **Step 4: Vérifier le reste**

Run: `npx tsc --noEmit && npm run build`
Expected: aucune erreur.

- [ ] **Step 5: Commit**

```bash
git add src/components/report/ProjectSummaryCard.tsx
git commit -m "Changer d'intention un jour de panne du parseur effaçait les priorités"
```

---

### Task 7 : La relation au lieu, éditée là où l'on édite le projet

**Files:**
- Modify: `src/app/(account)/rapport/page.tsx` (chargement de `report_context`)
- Modify: `src/components/report/ProjectSummaryCard.tsx` (sous-contrôle « Pour {commune} »)

**Interfaces:**
- Consumes: `getReportContext`, `resolveRelation` (`src/lib/report-context.ts`), `PATCH /api/report-context`.
- Produces: `ProjectSummaryCard` accepte `relation?: { insee: string; commune: string; valeur: Relation } | null`.

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
              ? { insee: inseeCode, commune: displayName, valeur: contexteLecture.relation }
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

Les deux choix affichés sont ceux qui existent déjà côté route : `current_residence` (« J'y vis ») et `considering_living` (« J'envisage d'y vivre »).

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
const ACHAT = { intent: "achat", posture: null } as unknown as UserProject;
const LOCATION = { intent: "location", posture: null } as unknown as UserProject;
const RESIDE = { intent: null, posture: "habitant" } as unknown as UserProject;
```

puis remplacer les littéraux :

```bash
perl -pi -e 's/pointsAVerifier\(([^,]+), "achat"\)/pointsAVerifier($1, ACHAT)/g;
             s/pointsAVerifier\(([^,]+), "location"\)/pointsAVerifier($1, LOCATION)/g;
             s/pointsAVerifier\(([^,]+), "reside"\)/pointsAVerifier($1, RESIDE)/g;
             s/introPointsAVerifier\("achat"\)/introPointsAVerifier(ACHAT)/g;
             s/introPointsAVerifier\("location"\)/introPointsAVerifier(LOCATION)/g;
             s/introPointsAVerifier\("reside"\)/introPointsAVerifier(RESIDE)/g' src/lib/decision/logement-verifications.test.ts
```

Ajouter un test qui fixe le nouveau contrat :

```ts
test("un projet d'achat déclaré au COMPTE oriente la liste, sans sonde locale", () => {
  // Le compte connaît l'intention : la redemander à chaque ouverture du module était une question
  // dont on avait la réponse, et elle repartait à chaque visite sans être persistée.
  assert.notDeepEqual(pointsAVerifier(TOUT, ACHAT), pointsAVerifier(TOUT, RESIDE));
  // Sans projet, aucune posture n'est devinée : `bucketDuProjet` rend `neutre` et l'intro le dit.
  assert.match(introPointsAVerifier(null), /Votre projet permettra/);
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

Pour l'état 2, mettre temporairement `parsed` à `null` dans la base pour le compte de test, et le restaurer ensuite. Pour l'état 3, effacer `user_project`, puis le restaurer.

- [ ] **Step 2: Les invariants qui se vérifient à l'œil**

- Un seul `<h1>` : `document.querySelectorAll("h1").length === 1` sur les quatre états.
- Aucun débordement horizontal à 360 px : `document.documentElement.scrollWidth <= window.innerWidth`.
- La date de l'analyse n'apparaît QUE dans le bloc du dossier, jamais au-dessus.
- Sur un dossier d'adresse dont le projet a matériellement changé, le bandeau d'obsolescence et la ligne « Votre projet aujourd'hui » restent deux blocs distincts.

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
