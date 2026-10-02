// FUT-33 (2B.2 C) : AUDIT EN LECTURE SEULE des projets et dossiers qui portent un critère mer.
//
// Aucune écriture : uniquement des GET sur l'API REST de Supabase (clé de service lue dans le .env donné).
// Aucun identifiant de compte n'est imprimé. Avec --reparser, chaque texte d'origine d'un ancien
// `excludeSea: true` repasse dans le VRAI parseur actuel (scripts/mer/parseur-reel.mts), pour montrer ce
// qu'une nouvelle lecture changerait, sans rien enregistrer.
//
// Usage (racine du dépôt) : node scripts/mer/audit-anciens-projets.mts <.env> [--reparser]
import { readFileSync } from "node:fs";
import { parserReel } from "./parseur-reel.mts";

const envFile = process.argv[2];
const reparser = process.argv.includes("--reparser");
const env = readFileSync(envFile, "utf8");
const v = (k: string) => env.match(new RegExp(`^${k}=["']?([^"'\\n]+)`, "m"))?.[1];
const url = v("NEXT_PUBLIC_SUPABASE_URL"), cle = v("SUPABASE_SERVICE_ROLE_KEY");
if (!url || !cle) throw new Error("NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY introuvable");

async function lire<T>(chemin: string): Promise<T> {
  const r = await fetch(`${url}/rest/v1/${chemin}`, { method: "GET", headers: { apikey: cle!, Authorization: `Bearer ${cle}` } });
  if (!r.ok) throw new Error(`${r.status} ${await r.text()}`);
  return r.json() as Promise<T>;
}

type Mer = { excludeSea?: boolean; nearSea?: { active?: boolean; maxKm?: number | null }; farFromSea?: { active?: boolean } };
type Projet = { rawText?: string | null; parsed?: { hardConstraints?: Mer; preferences?: { key: string }[] } | null; conditions?: { criterion?: { key?: string } }[] };
const profils = await lire<{ user_project: Projet | null }[]>("user_profiles?select=user_project&user_project=not.is.null");
const projets = profils.map((p) => p.user_project).filter((p): p is Projet => p != null);
const hc = (p: Projet): Mer => p.parsed?.hardConstraints ?? {};
const conditionMer = (p: Projet) => (p.conditions ?? []).some((c) => /Sea$|_mer$/.test(c?.criterion?.key ?? ""));
const anciens = projets.filter((p) => hc(p).excludeSea === true);

console.log(JSON.stringify({
  projets: projets.length,
  excludeSea: anciens.length,
  excludeSea_avec_texte_d_origine: anciens.filter((p) => typeof p.rawText === "string" && p.rawText.trim()).length,
  excludeSea_confirme_comme_condition: anciens.filter((p) => (p.conditions ?? []).some((c) => c?.criterion?.key === "excludeSea")).length,
  nearSea: projets.filter((p) => hc(p).nearSea?.active).length,
  nearSea_avec_nombre: projets.filter((p) => typeof hc(p).nearSea?.maxKm === "number").length,
  farFromSea: projets.filter((p) => hc(p).farFromSea?.active).length,
  preference_proximite_mer: projets.filter((p) => (p.parsed?.preferences ?? []).some((x) => x.key === "proximite_mer")).length,
  une_condition_mer_confirmee: projets.filter(conditionMer).length,
}, null, 1));

const artefacts = await lire<{ engine_version: string | null; hc: Mer | null }[]>(
  "decision_artifact?select=engine_version,hc:payload->projectSnapshot->parsed->hardConstraints&status=eq.ready",
);
console.log(JSON.stringify({
  dossiers_figes: artefacts.length,
  avec_excludeSea: artefacts.filter((a) => a.hc?.excludeSea === true).length,
  avec_nearSea: artefacts.filter((a) => a.hc?.nearSea?.active).length,
  moteurs: [...new Set(artefacts.map((a) => a.engine_version))],
}, null, 1));

if (reparser) {
  for (const p of anciens) {
    if (!p.rawText?.trim()) { console.log("— sans texte d'origine : à reconfirmer auprès du lecteur"); continue; }
    const n = await parserReel(p.rawText, envFile);
    const h = n.hardConstraints ?? {};
    console.log(JSON.stringify({
      texte: p.rawText,
      aujourd_hui: { excludeSea: h.excludeSea ?? null, farFromSea: h.farFromSea ?? null, eloignement_mer: (n.preferences ?? []).find((x) => x.key === "eloignement_mer")?.weight ?? null },
    }));
  }
}
