import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { GEOCODEUR_BAN, urlRechercheBan, urlRechercheCommunes, urlReverseBan } from "./geocodeur-ban.ts";

// ════════════════════════════════════════════════════════════════════════════════════════════
// LA GARDE QUI EMPÊCHE LA DISPERSION DE REVENIR.
//
// Le 19/09/2026, l'ancien point d'entrée était écrit en dur à huit endroits. Le réparer une fois
// ne protège de rien : la prochaine autocomplétion recopiera l'URL du composant d'à côté, et le
// produit se retrouvera dans le même état sans que personne ne l'ait décidé.
//
// Ce test rend cette copie impossible en silence. Il échoue à l'écriture, pas le jour de la
// panne.
// ════════════════════════════════════════════════════════════════════════════════════════════

const ANCIEN = "api-adresse.data.gouv.fr";

/** Le commentaire qui documente le relevé de format y cite l'ancien service : c'est de l'histoire, pas un appel. */
const EXEMPTIONS = new Set(["src/lib/geocodeur-ban.ts", "src/lib/geocodeur-ban.test.ts"]);

function sources(racine: string): { chemin: string; src: string }[] {
  const out: { chemin: string; src: string }[] = [];
  const parcourir = (d: string): void => {
    for (const e of readdirSync(d)) {
      if (e === "node_modules" || e.startsWith(".")) continue;
      const p = path.join(d, e);
      if (statSync(p).isDirectory()) { parcourir(p); continue; }
      if (!/\.(ts|tsx|mjs|js)$/.test(e)) continue;
      out.push({ chemin: p, src: readFileSync(p, "utf8") });
    }
  };
  parcourir(racine);
  return out;
}

test("AUCUN appel au géocodeur déprécié ne subsiste dans le produit", () => {
  const fautifs: string[] = [];
  for (const racine of ["src", "scripts"]) {
    for (const { chemin, src } of sources(racine)) {
      if (EXEMPTIONS.has(chemin)) continue;
      // On ne cherche que les APPELS. Une mention en commentaire (« relevé le 25/07 sur
      // api-adresse ») documente une provenance et ne tombera jamais en panne.
      for (const ligne of src.split("\n")) {
        const nu = ligne.trim();
        if (!nu.includes(ANCIEN)) continue;
        if (nu.startsWith("//") || nu.startsWith("*") || nu.startsWith("/*")) continue;
        fautifs.push(`${chemin} : ${nu.slice(0, 110)}`);
      }
    }
  }
  assert.deepEqual(fautifs, [], `Appels au géocodeur déprécié :\n${fautifs.join("\n")}`);
});

// La SEULE copie tolérée. `scripts/admin/` tourne hors du build Next : pas d'alias `@/`, pas de
// résolution des `.ts`. Elle est donc recopiée, et ce test vérifie qu'elle reste alignée.
const SCRIPT_HORS_BUILD = "scripts/admin/replace-address-dossier.mjs";

test("l'adresse du géocodeur n'est écrite qu'une fois", () => {
  const porteurs: string[] = [];
  for (const racine of ["src", "scripts"]) {
    for (const { chemin, src } of sources(racine)) {
      // Ce fichier de test cite l'adresse pour vérifier qu'on n'est pas revenu en arrière.
      if (EXEMPTIONS.has(chemin) || chemin === SCRIPT_HORS_BUILD) continue;
      if (src.includes("data.geopf.fr/geocodage")) porteurs.push(chemin);
    }
  }
  assert.deepEqual(porteurs, [], `L'adresse du géocodeur est recopiée dans :\n${porteurs.join("\n")}`);
});

test("la copie du script d'administration reste alignée sur le module canonique", () => {
  // Une copie qui dérive est pire qu'une copie : le script viserait un service mort pendant que
  // le produit tourne, et le remplacement d'un dossier échouerait le jour où on en a besoin.
  const src = readFileSync(SCRIPT_HORS_BUILD, "utf8");
  assert.ok(
    src.includes(`const GEOCODEUR_BAN = "${GEOCODEUR_BAN}";`),
    `${SCRIPT_HORS_BUILD} ne porte plus la même adresse que geocodeur-ban.ts (${GEOCODEUR_BAN})`,
  );
});

test("les URL construites visent le bon service et portent leurs paramètres", () => {
  assert.ok(GEOCODEUR_BAN.startsWith("https://data.geopf.fr/"));

  const recherche = new URL(urlRechercheBan({ q: "1 rue de la Paix", limit: 5, autocomplete: 0 }));
  assert.equal(recherche.pathname, "/geocodage/search");
  assert.equal(recherche.searchParams.get("q"), "1 rue de la Paix");
  assert.equal(recherche.searchParams.get("limit"), "5");
  assert.equal(recherche.searchParams.get("autocomplete"), "0");

  const inverse = new URL(urlReverseBan({ lon: -1.5554, lat: 47.2184, limit: 6 }));
  assert.equal(inverse.pathname, "/geocodage/reverse");
  assert.equal(inverse.searchParams.get("lon"), "-1.5554");
});

test("la recherche de commune impose toujours le type, sinon une rue entre dans la liste", () => {
  const url = new URL(urlRechercheCommunes("nantes", 8));
  assert.equal(url.searchParams.get("type"), "municipality");
  assert.equal(url.searchParams.get("limit"), "8");
  assert.equal(url.searchParams.get("q"), "nantes");
});

test("les paramètres sont échappés, y compris les espaces et les accents", () => {
  // Les appels se construisaient par interpolation avec `encodeURIComponent` à la main : un oubli
  // cassait la requête sur « Saint-Étienne-du-Rouvray » ou sur une voie à espaces.
  const url = urlRechercheCommunes("Saint-Étienne du Rouvray", 6);
  assert.ok(!url.includes(" "), `espace non échappé : ${url}`);
  assert.equal(new URL(url).searchParams.get("q"), "Saint-Étienne du Rouvray");
});
