// ════════════════════════════════════════════════════════════════════════════════════════════
// FUT-10 · APPLIQUER LE SCHÉMA DE TEST (migrations 01 → 38) SUR LE PROJET SUPABASE DE TEST, ET LUI SEUL.
//
//   node scripts/integration/appliquer-schema-test.mjs                         → plan, rien n'est écrit
//   node scripts/integration/appliquer-schema-test.mjs --confirmer <référence> → application
//
// GARDE-FOUS, TOUS REQUIS :
//   - l'environnement isolé (`garde-environnement.mjs`), dont FUT10_TEST_DATABASE_URL qui doit désigner le
//     projet déclaré dans FUT10_SUPABASE_REF_TEST et jamais un projet de production ;
//   - `--confirmer` suivi de la référence EXACTE du projet de test (pas de valeur par défaut) ;
//   - une base VIERGE : si `public.address_dossiers` existe déjà, le script s'arrête (pas de rejeu sur
//     une base partiellement migrée, qui demanderait un examen à la main).
// Le SQL est celui de `schema-de-test.mjs` (deux adaptations de test dites). L'URL de connexion n'est
// jamais affichée. `psql` s'arrête à la première erreur (ON_ERROR_STOP).
// ════════════════════════════════════════════════════════════════════════════════════════════
import { spawnSync } from "node:child_process";
import { exigerEnvironnementIsole } from "./garde-environnement.mjs";
import { PREAMBULE, migrationsDeTest } from "./schema-de-test.mjs";

exigerEnvironnementIsole();

const url = process.env.FUT10_TEST_DATABASE_URL;
const ref = process.env.FUT10_SUPABASE_REF_TEST;
if (!url || !ref) {
  console.error("FUT10_TEST_DATABASE_URL et FUT10_SUPABASE_REF_TEST sont requis : rien n'est appliqué.");
  process.exit(2);
}
const migrations = migrationsDeTest();
console.log(`Projet visé : ${ref} (référence de test déclarée).`);
console.log(`Migrations : ${migrations.length} fichiers, de ${migrations[0].fichier} à ${migrations.at(-1).fichier} (02 omis, contrôle de la 25 neutralisé).`);

// SSL EXIGÉ entre le poste et Supabase (`sslmode=require` : pas de connexion en clair, jamais de repli).
// `FUT10_PSQL` désigne le binaire quand `psql` n'est pas dans le PATH (Homebrew : libpq n'y est pas lié).
const PSQL = process.env.FUT10_PSQL || "psql";
const psql = (args, entree) => spawnSync(PSQL, [url, "-X", "-v", "ON_ERROR_STOP=1", ...args], {
  input: entree, encoding: "utf8", env: { ...process.env, PGSSLMODE: "require", PGCONNECT_TIMEOUT: "15" },
});

const sonde = psql(["-tA", "-c", "select to_regclass('public.address_dossiers') is not null"]);
if (sonde.error) {
  console.error(`psql introuvable (${PSQL}) : définir FUT10_PSQL. Rien n'est appliqué.`);
  process.exit(2);
}
if (sonde.status !== 0) {
  console.error("Connexion impossible au projet de test (message de psql masqué : il peut contenir l'adresse).");
  process.exit(1);
}
if (sonde.stdout.trim() === "t") {
  console.error("La base n'est pas vierge (public.address_dossiers existe) : arrêt. Examiner à la main avant tout rejeu.");
  process.exit(1);
}
const idx = process.argv.indexOf("--confirmer");
if (idx === -1 || process.argv[idx + 1] !== ref) {
  console.log(`Base vierge confirmée. Aucune écriture faite. Pour appliquer : --confirmer ${ref}`);
  process.exit(0);
}

const sql = `${PREAMBULE}\n${migrations.map((m) => `-- ═══ ${m.fichier}\n${m.sql}`).join("\n")}`;
const r = psql(["-q"], sql);
if (r.status !== 0) {
  // La sortie d'erreur de psql cite le SQL fautif, jamais l'URL de connexion.
  console.error(`Échec de l'application :\n${(r.stderr ?? "").split("\n").slice(0, 8).join("\n")}`);
  process.exit(1);
}
const verif = psql(["-tA", "-c", "select string_agg(proname, ',' order by proname) from pg_proc where proname in ('purger_dossier_intents','intentions_a_reconcilier','etat_livraison_intention','dossiers_sans_intention')"]);
console.log(`Schéma de test appliqué. Fonctions de la migration 38 présentes : ${verif.stdout.trim()}`);
