#!/usr/bin/env node
// ════════════════════════════════════════════════════════════════════════════════════════════
// LE LIVRE DES RECETTES, EXPORTÉ DEPUIS LES FACTURES.
//
// Obligation de tenue pour un micro-entrepreneur : un registre chronologique des encaissements,
// avec la date, la référence de la pièce, l'identité du client, la nature de la prestation et le
// mode de règlement.
//
// LA SOURCE EST `invoices`, PAS `payments`. Une facture n'existe que si un encaissement a été
// confirmé, elle porte son propre numéro chronologique, et ses champs sont FIGÉS : c'est
// exactement ce qu'un registre demande. `payments` porte des lignes techniques dont le montant
// est un flottant et dont rien ne garantit la continuité.
//
// LECTURE SEULE, AUCUNE ÉCRITURE. Ce script n'invente ni ne corrige rien : ce qu'il rend est ce
// que la base contient. Un trou dans la numérotation apparaîtrait ici comme un trou, et c'est
// voulu : c'est le seul endroit où on le verrait.
//
// Usage :
//   node scripts/livre-des-recettes.mjs                 -> l'année en cours, sur la sortie
//   node scripts/livre-des-recettes.mjs 2026 > livre.csv
//
// Exige SUPABASE_URL (ou NEXT_PUBLIC_SUPABASE_URL) et SUPABASE_SERVICE_ROLE_KEY dans
// l'environnement. Le fichier `.env.local` est lu s'il existe.
// ════════════════════════════════════════════════════════════════════════════════════════════

import { readFileSync, existsSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

if (existsSync(".env.local")) {
  for (const line of readFileSync(".env.local", "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) {
      process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  }
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont requis.");
  process.exit(1);
}

const year = Number.parseInt(process.argv[2] ?? String(new Date().getFullYear()), 10);
const supabase = createClient(url, key);

const { data, error } = await supabase
  .from("invoices")
  .select("number, seq, issued_at, buyer_name, designation, amount_cents, currency")
  .eq("year", year)
  .order("seq", { ascending: true });

if (error) {
  console.error("Lecture impossible :", error.message);
  process.exit(1);
}

// Une valeur CSV : guillemets doublés, champ toujours entouré. Les désignations portent des
// virgules (une adresse en contient), donc l'échappement n'est pas optionnel.
const q = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
// Montant en euros avec un POINT décimal : c'est ce qu'attend un tableur ou un comptable qui
// réimporte. La virgule française est une typographie d'affichage, pas un format d'échange.
const euros = (cents) => (cents / 100).toFixed(2);

const lignes = [
  ["Date", "Numero", "Client", "Nature", "Montant EUR", "Reglement"].map(q).join(","),
];
let total = 0;
let attendu = 1;
const trous = [];

for (const r of data ?? []) {
  if (r.seq !== attendu) trous.push(`${attendu} -> ${r.seq}`);
  attendu = r.seq + 1;
  total += r.amount_cents;
  lignes.push([
    r.issued_at.slice(0, 10),
    r.number,
    r.buyer_name,
    r.designation,
    euros(r.amount_cents),
    "Carte bancaire",
  ].map(q).join(","));
}

lignes.push(["", "", "", "TOTAL", euros(total), ""].map(q).join(","));
console.log(lignes.join("\n"));

// Sur stderr : ne pollue pas le CSV redirigé dans un fichier, et se voit quand même.
console.error(`\n${(data ?? []).length} encaissement(s) en ${year}, total ${euros(total)} EUR.`);
if (trous.length) {
  console.error(`ATTENTION, la numerotation saute : ${trous.join(", ")}.`);
  console.error("Un trou dans une numerotation de facture est une non-conformite. A investiguer.");
}
