#!/usr/bin/env node
// ════════════════════════════════════════════════════════════════════════════════════════════
// OUVRIR UN DOSSIER D'ADRESSE SANS PAIEMENT, POUR SE MONTRER LE PRODUIT À SOI-MÊME.
//
// ── POURQUOI CE SCRIPT (19/09/2026) ─────────────────────────────────────────────────────────
// Le produit payé n'était atteignable que par la caisse. Vérifier ce qu'un client reçoit vraiment,
// ou préparer une démonstration professionnelle, demandait un paiement Stripe à chaque fois. Le
// porteur ne pouvait donc pas regarder son propre produit dans les conditions où il est vendu.
//
// ── CE SCRIPT N'EST PAS UN FAUX PAIEMENT ────────────────────────────────────────────────────
// La base admet DEUX états, et c'est écrit dans une contrainte (`address_dossiers_provenance_ck`,
// migration 25) : un dossier ACHETÉ porte ses trois champs Stripe, un dossier ADMINISTRATIF les
// porte tous les trois à null. On écrit le second. Le droit de lecture, lui, est l'existence de
// la ligne : aucun écran ne vérifie un paiement.
//
// Conséquence utile : ces dossiers ne comptent pas dans les ventes (elles se comptent sur
// `purchased_at`), et aucune facture n'est émise.
//
// ── L'ADRESSE EST VALIDÉE COMME DANS LE PARCOURS NORMAL ─────────────────────────────────────
// Même géocodeur, et surtout même exigence : un `housenumber`. Le parcours de vente refuse une
// voie ou une commune, parce qu'un dossier vendu sur une rue n'aurait pas d'objet. Un dossier de
// démonstration ouvert sur une adresse approximative montrerait le bien du voisin.
//
// ── L'ORDRE COMPTE, ET IL N'EST PAS INTUITIF ────────────────────────────────────────────────
// À la première ouverture de /rapport, si un PROJET est renseigné, la version figée du dossier
// part en génération d'arrière-plan et prend le relais au rechargement suivant. Ensuite, une
// nouvelle version se DEMANDE par un bouton, elle ne se refait plus toute seule.
//
// Donc, pour une démonstration :
//   1. saisir le projet du client (bas de /rapport),
//   2. créer le dossier avec ce script,
//   3. l'ouvrir.
// Dans l'autre ordre, la version figée retient un projet vide ou l'ancien.
//
// (Sans aucun projet renseigné, rien n'est figé et le dossier se réassemble à chaque ouverture :
// pratique pour bricoler, mais ce n'est pas ce que reçoit un client.)
//
// ── USAGE ───────────────────────────────────────────────────────────────────────────────────
//   node scripts/admin/creer-dossier-demonstration.mjs \
//     --address "5 Rue du Palais 17000 La Rochelle" \
//     --user quentin@exemple.fr            # e-mail du compte, ou --user-id <uuid>
//
// Lecture seule par défaut : ajouter --apply pour écrire.
// ════════════════════════════════════════════════════════════════════════════════════════════

import { existsSync, readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

// L'ADRESSE DU GÉOCODEUR EST CELLE DE `src/lib/geocodeur-ban.ts`, recopiée ici parce que ce script
// tourne hors du build Next (pas d'alias `@/`, pas de résolution .ts). Le test
// `geocodeur-ban.test.ts` connaît cette exception et vérifie que les deux restent alignées.
const GEOCODEUR_BAN = "https://data.geopf.fr/geocodage";

if (existsSync(".env.local")) {
  for (const line of readFileSync(".env.local", "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

const args = new Map();
for (let i = 2; i < process.argv.length; i += 1) {
  const key = process.argv[i];
  if (key === "--apply") args.set(key, true);
  else if (key.startsWith("--") && process.argv[i + 1]) args.set(key, process.argv[++i]);
}

const adresse = args.get("--address");
const email = args.get("--user");
const userIdArg = args.get("--user-id");
const apply = args.get("--apply") === true;

if (!adresse || (!email && !userIdArg)) {
  console.error(`
Ouvre un dossier d'adresse sans paiement (état « administratif » prévu par le schéma).

  --address "5 Rue du Palais 17000 La Rochelle"   l'adresse, qui doit être NUMÉROTÉE
  --user    email@exemple.fr                      le compte, par e-mail
  --user-id <uuid>                                ou directement par identifiant
  --apply                                         écrit (sans lui : simulation)
`);
  process.exit(1);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont requis (.env.local).");
  process.exit(1);
}
const sb = createClient(url, key, { auth: { persistSession: false } });

// ── 1. L'adresse, validée comme le parcours de vente la valide ──────────────────────────────
const recherche = new URL(`${GEOCODEUR_BAN}/search`);
recherche.searchParams.set("q", adresse);
recherche.searchParams.set("limit", "5");
const res = await fetch(recherche, { headers: { accept: "application/json" } });
if (!res.ok) {
  console.error(`Géocodeur indisponible (${res.status}).`);
  process.exit(1);
}
const { features = [] } = await res.json();
const numerotees = features.filter((f) => f?.properties?.type === "housenumber");

if (numerotees.length === 0) {
  console.error(`Aucune adresse NUMÉROTÉE pour « ${adresse} ».`);
  if (features.length > 0) {
    console.error("Le géocodeur a proposé, sans numéro :");
    for (const f of features.slice(0, 5)) {
      console.error(`   ${f.properties.label}  (${f.properties.type})`);
    }
    console.error("\nUn dossier ne s'ouvre que sur une adresse numérotée, comme à la vente.");
  }
  process.exit(1);
}

const p = numerotees[0].properties;
const [longitude, latitude] = numerotees[0].geometry.coordinates;

// AMBIGUÏTÉ SIGNALÉE, JAMAIS TRANCHÉE EN SILENCE. Une adresse mal orthographiée résout vers une
// autre voie sans prévenir : le dossier porterait alors sur le bien d'à côté, et la démonstration
// se ferait sur le mauvais logement.
if (numerotees.length > 1) {
  console.log("Plusieurs adresses numérotées correspondent :");
  numerotees.slice(0, 5).forEach((f, i) => {
    console.log(`   ${i === 0 ? "→" : " "} ${f.properties.label}`);
  });
  console.log("   La première est retenue. Précisez la requête si ce n'est pas la bonne.\n");
}

// ── 2. Le compte ────────────────────────────────────────────────────────────────────────────
let userId = userIdArg;
if (!userId) {
  // L'API d'administration n'offre pas de recherche par e-mail : on pagine, le volume est petit.
  let page = 1;
  while (!userId && page <= 20) {
    const { data, error } = await sb.auth.admin.listUsers({ page, perPage: 200 });
    if (error) { console.error(`Lecture des comptes impossible : ${error.message}`); process.exit(1); }
    const trouve = (data?.users ?? []).find((u) => (u.email ?? "").toLowerCase() === email.toLowerCase());
    if (trouve) userId = trouve.id;
    if (!data?.users?.length || data.users.length < 200) break;
    page += 1;
  }
  if (!userId) { console.error(`Aucun compte pour « ${email} ».`); process.exit(1); }
}

// ── 3. Un dossier existe-t-il déjà sur ce point, pour ce compte ? ───────────────────────────
const { data: existants } = await sb
  .from("address_dossiers")
  .select("id, address_label, purchased_at, created_at")
  .eq("user_id", userId)
  .eq("ban_id", p.id)
  .is("access_revoked_at", null);

if (existants?.length) {
  console.log("Ce compte a déjà un dossier sur cette adresse :");
  for (const d of existants) {
    const origine = d.purchased_at ? `acheté le ${d.purchased_at.slice(0, 10)}` : "administratif";
    console.log(`   ${d.id}  (${origine})`);
    console.log(`   → ${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/rapport/dossiers/ouvrir?dossierId=${d.id}`);
  }
  console.log("\nRien à créer. Un second dossier sur le même point ferait deux biens indiscernables.");
  process.exit(0);
}

// ── 4. La ligne ─────────────────────────────────────────────────────────────────────────────
const ligne = {
  user_id: userId,
  ban_id: p.id,
  insee: p.citycode,
  address_label: p.label,
  city: p.city ?? p.municipality ?? null,
  postcode: p.postcode ?? null,
  latitude,
  longitude,
  // Les trois champs Stripe restent absents : c'est ce qui fait l'état « administratif », et la
  // contrainte de provenance l'exige (tous les trois, ou aucun).
};

console.log("\nDossier à ouvrir");
console.log(`   adresse   ${ligne.address_label}`);
console.log(`   commune   ${ligne.city} (${ligne.insee})`);
console.log(`   point     ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
console.log(`   identité  ${ligne.ban_id}`);
console.log(`   compte    ${email ?? userId}`);
console.log(`   provenance administratif (aucun paiement, aucune facture, hors comptage des ventes)`);

if (!apply) {
  console.log("\nSimulation. Rien n'a été écrit. Ajoutez --apply pour ouvrir ce dossier.");
  process.exit(0);
}

const { data: cree, error } = await sb.from("address_dossiers").insert(ligne).select("id").single();
if (error) { console.error(`\nÉchec : ${error.message}`); process.exit(1); }

const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
console.log(`\nDossier ouvert : ${cree.id}`);
console.log(`   ${base}/rapport/dossiers/ouvrir?dossierId=${cree.id}`);
console.log(`
Avant d'ouvrir : vérifiez que le PROJET est renseigné (bas de /rapport). La première ouverture
fige une version du dossier à partir du projet du moment ; ensuite, une nouvelle version se
demande par le bouton, elle ne se refait plus toute seule.`);
