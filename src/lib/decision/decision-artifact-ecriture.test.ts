import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { reserverPlace, figerVersion, marquerEchec, AucunePlaceEnCours } from "./decision-artifact-ecriture.ts";
import type { DecisionArtifactV1 } from "./decision-artifact.ts";

// ════════════════════════════════════════════════════════════════════════════════════════════
// FUT-173 · LES ÉCRITURES DE L'ARTEFACT, CÔTÉ CODE. La garde est en base (migration 40, éprouvée par
// scripts/integration/fut173-decision-artifact-postgres.mjs) ; ces tests verrouillent ce que le code
// doit faire de son côté : ne viser que les places en cours, refuser un UPDATE à zéro ligne, et
// n'écrire qu'avec le service role.
// ════════════════════════════════════════════════════════════════════════════════════════════

type Appel = { op: "insert" | "update"; valeurs: Record<string, unknown>; filtres: [string, unknown][] };

/** Un client à la forme de supabase-js, qui journalise et rend ce qu'on lui dit. */
function clientSimule(reponse: { data?: unknown[] | null; error?: { code?: string; message: string } | null }) {
  const journal: Appel[] = [];
  const sb = {
    from(table: string) {
      assert.equal(table, "decision_artifact");
      return {
        insert(valeurs: Record<string, unknown>) {
          journal.push({ op: "insert", valeurs, filtres: [] });
          return Promise.resolve({ error: reponse.error ?? null });
        },
        update(valeurs: Record<string, unknown>) {
          const appel: Appel = { op: "update", valeurs, filtres: [] };
          journal.push(appel);
          const b = {
            eq(col: string, val: unknown) { appel.filtres.push([col, val]); return b; },
            select() { return Promise.resolve({ data: reponse.data ?? null, error: reponse.error ?? null }); },
          };
          return b;
        },
      };
    },
  };
  return { sb: sb as never, journal };
}

const ARTEFACT = { schemaVersion: 1, engineVersion: "e", generatedAt: "2026-11-10T10:00:00.000Z" } as unknown as DecisionArtifactV1;

test("figer et marquer l'échec ne visent QUE la place en cours (status = generating), sur l'identité complète", async () => {
  for (const ecrire of [
    (sb: never) => figerVersion(sb, "u", "17300", "commune", ARTEFACT, 2),
    (sb: never) => marquerEchec(sb, "u", "17300", "commune", 2),
  ]) {
    const { sb, journal } = clientSimule({ data: [{ version: 2 }] });
    await ecrire(sb);
    assert.deepEqual(journal[0]!.filtres, [
      ["user_id", "u"], ["insee_code", "17300"], ["scope_key", "commune"], ["version", 2], ["status", "generating"],
    ]);
  }
});

test("un UPDATE qui ne touche aucune ligne n'est pas un succès : il lève", async () => {
  const { sb } = clientSimule({ data: [] });
  await assert.rejects(figerVersion(sb, "u", "17300", "commune", ARTEFACT, 1), AucunePlaceEnCours);
  await assert.rejects(marquerEchec(sb, "u", "17300", "commune", 1), AucunePlaceEnCours);
  const { sb: nul } = clientSimule({ data: null });
  await assert.rejects(marquerEchec(nul, "u", "17300", "commune", 1), AucunePlaceEnCours);
});

test("une erreur de la base remonte telle quelle (le trigger de la migration 40 refuse : 23514)", async () => {
  const { sb } = clientSimule({ error: { code: "23514", message: "decision_artifact : la version 1 est « ready »" } });
  await assert.rejects(marquerEchec(sb, "u", "17300", "commune", 1), (e: { code?: string }) => e.code === "23514");
});

test("figer écrit le contenu, sa date et ses versions ; échouer n'écrit que le statut", async () => {
  const a = clientSimule({ data: [{ version: 1 }] });
  await figerVersion(a.sb, "u", "17300", "commune", ARTEFACT, 1);
  assert.deepEqual(Object.keys(a.journal[0]!.valeurs).sort(), ["engine_version", "generated_at", "payload", "schema_version", "status"]);
  assert.equal(a.journal[0]!.valeurs.status, "ready");
  const b = clientSimule({ data: [{ version: 1 }] });
  await marquerEchec(b.sb, "u", "17300", "commune", 1);
  assert.deepEqual(b.journal[0]!.valeurs, { status: "failed" });
});

test("réserver : une place naît generating et vide ; 23505 (rejeu) rend false ; toute autre erreur lève", async () => {
  const ok = clientSimule({});
  assert.equal(await reserverPlace(ok.sb, "u", "17300", "commune", 1), true);
  assert.deepEqual(ok.journal[0]!.valeurs, { user_id: "u", insee_code: "17300", scope_key: "commune", version: 1, status: "generating" });
  assert.equal(await reserverPlace(clientSimule({ error: { code: "23505", message: "dup" } }).sb, "u", "17300", "commune", 1), false);
  await assert.rejects(reserverPlace(clientSimule({ error: { code: "42501", message: "permission denied" } }).sb, "u", "17300", "commune", 1));
});

// ── QUI ÉCRIT : le service role, dans le store, et nulle part ailleurs ─────────────────────────
test("le store écrit avec son propre client service role, jamais avec celui de l'appelant", () => {
  const src = readFileSync("src/lib/server/decision-artifact-store.ts", "utf8");
  assert.match(src, /SUPABASE_SERVICE_ROLE_KEY/);
  for (const f of ["claimArtifactSlot", "completeArtifact", "failArtifact"]) {
    const sig = src.slice(src.indexOf(`export function ${f}(`), src.indexOf("{", src.indexOf(`export function ${f}(`)));
    assert.ok(sig.length > 0, `${f} introuvable`);
    assert.doesNotMatch(sig, /SupabaseClient/, `${f} ne doit plus recevoir de client`);
  }
  assert.doesNotMatch(src, /export function client|export \{ client/, "le client service role ne sort pas du module");
});

test("aucun autre fichier de l'application n'écrit dans decision_artifact", () => {
  const fichiers: string[] = [];
  const parcourir = (d: string) => {
    for (const n of readdirSync(d)) {
      const p = join(d, n);
      if (statSync(p).isDirectory()) parcourir(p);
      else if (/\.(ts|tsx)$/.test(n) && !/\.test\.ts$/.test(n)) fichiers.push(p);
    }
  };
  parcourir("src");
  const ecrivains = fichiers.filter((f) => {
    const s = readFileSync(f, "utf8");
    return /from\("decision_artifact"\)[\s\S]{0,200}?\.(insert|update|upsert|delete)\(/.test(s);
  });
  assert.deepEqual(ecrivains, ["src/lib/decision/decision-artifact-ecriture.ts"]);
});
