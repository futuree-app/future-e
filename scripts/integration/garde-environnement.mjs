// ════════════════════════════════════════════════════════════════════════════════════════════
// FUT-10 · LE GARDE-FOU DES TESTS D'INTÉGRATION. Aucun test réel ne part sans lui.
//
// Il classe l'environnement en CATÉGORIES et n'affiche JAMAIS une valeur secrète (ni clé, ni URL
// complète, ni identifiant de projet). Il refuse si une seule condition manque :
//   - Stripe : clés de TEST uniquement (`sk_test_`, `pk_test_`), secret de webhook présent ;
//   - Supabase : une instance LOCALE (127.0.0.1, localhost), ou un projet de test explicitement déclaré
//     dans FUT10_SUPABASE_REF_TEST ; jamais un projet trouvé dans les fichiers `.env` de production
//     du poste (`.env.local`, `.env`, `.env.production*`), même s'il est déclaré « de test » ;
//   - E-mails : aucune vraie clé Resend (valeur factice `re_factice…` exigée : le webhook appelle Resend,
//     l'appel échoue en 401, il est journalisé et rien ne part) ;
//   - Mesure : aucun projet PostHog réel (jeton factice `phc_factice…` et hôte local exigés) ;
//   - Rédaction par modèle : `DOSSIER_NARRATIVE` éteint (aucun appel au modèle pendant les tests).
//
// Usage : node scripts/integration/garde-environnement.mjs   (avec l'environnement de test chargé)
// ════════════════════════════════════════════════════════════════════════════════════════════
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";

// LA PRODUCTION, INTERDITE EN DUR (référence publique, présente dans le code client de l'application),
// en plus des projets trouvés dans les fichiers `.env` de production du poste.
export const REFS_PRODUCTION_CONNUES = new Set(["xkewgsccadjmondzmjxj"]);

/**
 * Le projet auquel appartient une clé Supabase au format JWT (ancien format : la charge porte `ref`).
 * `null` pour les clés au nouveau format (`sb_secret_…`, `sb_publishable_…`), qui ne le disent pas.
 * Seule la charge publique du jeton est lue ; ni la clé ni sa signature ne sont affichées.
 */
export function refDeLaCle(cle) {
  const parties = (cle ?? "").split(".");
  if (parties.length !== 3) return null;
  try {
    const charge = JSON.parse(Buffer.from(parties[1].replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8"));
    return typeof charge.ref === "string" ? charge.ref : null;
  } catch { return null; }
}

const refDe = (url) => {
  try {
    const m = new URL(url).hostname.match(/^([a-z0-9]{20})\.supabase\.co$/);
    return m ? m[1] : null;
  } catch { return null; }
};

/** Les projets Supabase trouvés dans les fichiers d'environnement de production du poste. */
export function refsDeProduction(racine = ".") {
  const refs = new Set();
  let fichiers = [];
  try {
    fichiers = readdirSync(racine).filter((f) => f === ".env.local" || f === ".env" || f.startsWith(".env.production"));
  } catch { /* aucun fichier */ }
  for (const f of fichiers) {
    let contenu = "";
    try { contenu = readFileSync(`${racine}/${f}`, "utf8"); } catch { /* illisible */ }
    for (const m of contenu.matchAll(/https:\/\/([a-z0-9]{20})\.supabase\.co/g)) refs.add(m[1]);
  }
  return refs;
}

function categorieStripe(cle, test, live) {
  if (!cle) return "absente";
  if (cle.startsWith(test)) return "TEST";
  if (live.some((p) => cle.startsWith(p))) return "PRODUCTION (refusé)";
  return "inconnue (refusé)";
}

/**
 * Les NOMS des variables de `.env.local`. `next dev` les charge pour toute variable ABSENTE de
 * l'environnement : une seule oubliée dans le fichier de test, et sa valeur de production entre dans
 * l'application de test. Le garde-fou exige donc que chacune soit déclarée (au besoin vide).
 */
export function nomsDeEnvLocal(racine = ".") {
  try {
    return readFileSync(`${racine}/.env.local`, "utf8").split("\n")
      .map((l) => l.trim()).filter((l) => l && !l.startsWith("#") && l.includes("="))
      .map((l) => l.slice(0, l.indexOf("=")).replace(/^export\s+/, "").trim());
  } catch { return []; }
}

/** Le diagnostic, en catégories. `ok` faux dès qu'une condition manque. */
export function diagnostiquer(env, interditsDuPoste = new Set(), nomsEnvLocal = []) {
  const interdits = new Set([...REFS_PRODUCTION_CONNUES, ...interditsDuPoste]);
  const lignes = [];
  const verdict = (nom, ok, categorie) => lignes.push({ nom, ok, categorie });

  const sk = env.STRIPE_SECRET_KEY ?? "";
  const pk = env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "";
  verdict("Stripe, clé secrète", sk.startsWith("sk_test_"), categorieStripe(sk, "sk_test_", ["sk_live_", "rk_live_"]));
  verdict("Stripe, clé publique", pk.startsWith("pk_test_"), categorieStripe(pk, "pk_test_", ["pk_live_"]));
  verdict("Stripe, secret de webhook", (env.STRIPE_WEBHOOK_SECRET ?? "").startsWith("whsec_"),
    env.STRIPE_WEBHOOK_SECRET ? "présent" : "absent (`stripe listen` le donne)");

  const url = env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  let hote = "";
  try { hote = new URL(url).hostname; } catch { /* vide */ }
  const local = hote === "127.0.0.1" || hote === "localhost";
  const ref = refDe(url);
  const declareTest = ref != null && ref === env.FUT10_SUPABASE_REF_TEST;
  const interdit = ref != null && interdits.has(ref);
  verdict("Supabase", !interdit && (local || declareTest) && Boolean(env.SUPABASE_SERVICE_ROLE_KEY),
    interdit ? "PROJET DE PRODUCTION (refusé)"
      : !env.SUPABASE_SERVICE_ROLE_KEY && (local || declareTest) ? "projet de test déclaré, mais SUPABASE_SERVICE_ROLE_KEY absente (refusé)"
      : local ? "instance locale"
        : declareTest ? "projet de test déclaré (FUT10_SUPABASE_REF_TEST)"
          : url ? "projet distant non déclaré (refusé)" : "absent");

  // Les clés appartiennent-elles au projet déclaré ? Une clé de production collée avec l'URL de test
  // écrirait… en production.
  for (const [nom, cle] of [
    ["Supabase, clé service", env.SUPABASE_SERVICE_ROLE_KEY],
    ["Supabase, clé publique (publishable)", env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY],
    ["Supabase, clé publique (anon)", env.NEXT_PUBLIC_SUPABASE_ANON_KEY],
  ]) {
    if (!cle) continue;
    const refCle = refDeLaCle(cle);
    if (local) verdict(nom, true, "instance locale");
    else if (refCle == null) verdict(nom, true, "format sans projet lisible (sb_…) : cohérence non vérifiable");
    else if (interdits.has(refCle)) verdict(nom, false, "CLÉ DE PRODUCTION (refusé)");
    else verdict(nom, refCle === ref && declareTest, refCle === ref && declareTest ? "appartient au projet de test déclaré" : "AUTRE PROJET (refusé)");
  }

  // L'URL Postgres, seulement si elle est fournie (elle ne sert qu'à appliquer le schéma de test).
  if (env.FUT10_TEST_DATABASE_URL) {
    const u = env.FUT10_TEST_DATABASE_URL;
    const contientProd = [...interdits].some((r) => u.includes(r));
    const contientTest = Boolean(env.FUT10_SUPABASE_REF_TEST) && u.includes(env.FUT10_SUPABASE_REF_TEST);
    let hoteDb = "";
    try { hoteDb = new URL(u).hostname; } catch { /* vide */ }
    const dbLocale = hoteDb === "127.0.0.1" || hoteDb === "localhost";
    verdict("Postgres (schéma de test)", !contientProd && (contientTest || dbLocale),
      contientProd ? "BASE DE PRODUCTION (refusé)" : contientTest ? "projet de test déclaré" : dbLocale ? "instance locale" : "base non déclarée (refusé)");
  }

  const resend = env.RESEND_API_KEY ?? "";
  verdict("E-mails transactionnels", resend.startsWith("re_factice"),
    resend ? (resend.startsWith("re_factice") ? "factices (aucun envoi)" : "VRAIE CLÉ (refusé)")
      : "absente (le webhook échouerait : mettre re_factice_fut10)");

  // L'application lit la clé `publishable` ; sans elle, rien ne garantit qu'elle vise le projet de test.
  verdict("Supabase, clé publique présente", Boolean(env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY),
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ? "présente" : "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY absente (refusé)");

  const ph = env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN ?? "";
  let phHote = "";
  try { phHote = new URL(env.NEXT_PUBLIC_POSTHOG_HOST ?? "").hostname; } catch { /* vide */ }
  const phOk = ph.startsWith("phc_factice") && (phHote === "127.0.0.1" || phHote === "localhost");
  verdict("Mesure (PostHog)", phOk, phOk ? "factice, hôte local" : "projet réel ou hôte distant (refusé)");

  verdict("Rédaction par modèle", env.DOSSIER_NARRATIVE !== "true", env.DOSSIER_NARRATIVE === "true" ? "allumée (refusé)" : "éteinte");

  const oubliees = nomsEnvLocal.filter((n) => !(n in env));
  verdict("Fuite depuis .env.local", oubliees.length === 0,
    oubliees.length === 0 ? "toutes ses variables sont redéclarées" : `${oubliees.length} variable(s) non redéclarée(s) : ${oubliees.join(", ")} (refusé)`);
  return { ok: lignes.every((l) => l.ok), lignes };
}

export function afficher(diag) {
  for (const l of diag.lignes) console.log(`${l.ok ? "✔" : "✘"} ${l.nom} : ${l.categorie}`);
  console.log(diag.ok ? "Environnement isolé : tests autorisés." : "Environnement NON isolé : tests refusés.");
}

/** À appeler en tête de tout script d'intégration réelle. Sort du processus si l'environnement n'est pas sûr. */
export function exigerEnvironnementIsole(env = process.env) {
  const diag = diagnostiquer(env, refsDeProduction(), nomsDeEnvLocal());
  afficher(diag);
  if (!diag.ok) process.exit(2);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const diag = diagnostiquer(process.env, refsDeProduction(), nomsDeEnvLocal());
  afficher(diag);
  process.exit(diag.ok ? 0 : 2);
}
