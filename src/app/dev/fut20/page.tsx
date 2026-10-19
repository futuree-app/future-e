// FUT-20 · BANC CHALEUR × LOGEMENT × PROJET. DEV UNIQUEMENT : 404 en production.
//
// Le cas réel demande un compte payant, une adresse et un diagnostic attribué. Ici, les VRAIES données
// climatiques du dépôt (DRIAS, `loadClimatFacts`) et les logements témoins FUT-87 (fixtures anonymisées)
// passent par la MÊME chaîne que `assembleAddressDossier` (règles, conditions, compositions, assemblage),
// sans I/O réseau, puis par le MÊME composant que /rapport.
//
// Aucune donnée client, aucun appel au modèle : lancer le serveur avec `DOSSIER_NARRATIVE=false`.
import Link from "next/link";
import { notFound } from "next/navigation";
import { mapCommuneToModuleFacts } from "@/lib/decision/module-facts-map";
import { runRules } from "@/lib/decision/materiality-rules";
import { assembleDossier } from "@/lib/decision/decision-assembler";
import { composeFacts } from "@/lib/decision/fact-compositions";
import { buildConfirmation } from "@/lib/decision/conditions";
import { confortEteDepuisDpe } from "@/lib/decision/logement-facts";
import { loadClimatFacts } from "@/lib/decision/territory-facts";
import { hydrateHardConstraints } from "@/lib/hard-constraints-hydrate";
import { PRODUCT_CONVENTIONS_VERSION, type EvaluationContext } from "@/lib/hard-constraints";
import { normalizeUserProject, type UserProject } from "@/lib/user-project";
import type { IndexCommune } from "@/lib/comparateur-vie";
import type { Dossier, ModuleFacts } from "@/lib/decision/decision-fact";
import { casDeLogement, type CasLogement } from "@/components/prototypes/fut87/fixture-logement";
import { DossierDecisionSection } from "@/components/report/DossierDecisionSection";

export const dynamic = "force-dynamic";

const COMMUNES = {
  nimes: { insee: "30189", nom: "Nîmes", dept: "30", lat: 43.84, lon: 4.36, population: 148_000 },
  montpellier: { insee: "34172", nom: "Montpellier", dept: "34", lat: 43.61, lon: 3.88, population: 300_000 },
  larochelle: { insee: "17300", nom: "La Rochelle", dept: "17", lat: 46.16, lon: -1.15, population: 78_000 },
  briancon: { insee: "05023", nom: "Briançon", dept: "05", lat: 44.9, lon: 6.64, population: 11_000 },
} as const;

type Cas = {
  nom: string; titre: string; commune: keyof typeof COMMUNES; logement: CasLogement;
  chaleur: number; douceur?: boolean; confirme?: boolean; avant?: boolean;
};
const CAS: Cas[] = [
  { nom: "nimes-avant", titre: "Avant FUT-20 · Nîmes, logement témoin (A), chaleur au poids 3", commune: "nimes", logement: "temoin", chaleur: 3, avant: true },
  { nom: "nimes-a", titre: "A · Nîmes, diagnostic du logement (confort d'été insuffisant), chaleur au poids 3", commune: "nimes", logement: "temoin", chaleur: 3 },
  { nom: "nimes-b1", titre: "B1 · Nîmes, diagnostic généré à l'immeuble, chaleur au poids 3", commune: "nimes", logement: "immeuble", chaleur: 3 },
  { nom: "nimes-c", titre: "C · Nîmes, aucun diagnostic, chaleur au poids 3", commune: "nimes", logement: "sans-dpe", chaleur: 3 },
  { nom: "nimes-ambiant", titre: "A · Nîmes, chaleur non déclarée (constat non demandé)", commune: "nimes", logement: "temoin", chaleur: 0 },
  { nom: "nimes-compromis", titre: "A · Nîmes, hivers doux et étés supportables déclarés (compromis)", commune: "nimes", logement: "temoin", chaleur: 3, douceur: true },
  { nom: "nimes-condition", titre: "A · Nîmes, « des étés supportables » confirmé comme condition", commune: "nimes", logement: "temoin", chaleur: 3, confirme: true },
  { nom: "montpellier-a", titre: "A · Montpellier, déclenché par les seules nuits tropicales", commune: "montpellier", logement: "temoin", chaleur: 3 },
  { nom: "larochelle-a", titre: "Abstention · La Rochelle, sous le seuil (A, poids 3)", commune: "larochelle", logement: "temoin", chaleur: 3 },
  { nom: "briancon-a", titre: "Abstention · Briançon (A, poids 3)", commune: "briancon", logement: "temoin", chaleur: 3 },
];

async function dossierDuCas(c: Cas): Promise<Dossier> {
  const k = COMMUNES[c.commune];
  const entry = {
    ...k, region: "x", densite: 500, altitude: 50, clim: {}, pct: {},
    ...(c.douceur ? { rankBands: { douceur_climat: [8800, 9700] } } : {}),
  } as unknown as IndexCommune;
  const climat = await loadClimatFacts(k.insee);
  const fixture = casDeLogement(c.logement);
  const confortEte = confortEteDepuisDpe(fixture.dpe);
  const logement = {
    ...fixture.faits,
    confortEteInsuffisant: confortEte.niveau === "logement" && confortEte.indicateur === "insuffisant",
    ...(c.avant ? {} : { confortEte }),
  };
  const base = normalizeUserProject({
    posture: "recherche", intent: "achat", rawText: "…", updatedAt: "2026-09-01T00:00:00.000Z",
    parsed: {
      reformulation: "x", hardConstraints: {},
      preferences: [{ key: "acces_soins", weight: 2 }, { key: "faible_chaleur", weight: c.chaleur }, ...(c.douceur ? [{ key: "douceur_climat", weight: 3 }] : [])].filter((p) => p.weight > 0),
    },
  })!;
  const project: UserProject = c.confirme
    ? normalizeUserProject({ ...base, conditions: [buildConfirmation(base, { kind: "preference", key: "faible_chaleur" }, "2026-10-01T00:00:00.000Z")!] })!
    : base;
  const communeFacts = mapCommuneToModuleFacts(entry, {}, { hasAddress: true, tailleVille: k.population, tailleVilleSource: "commune", climat });
  const facts: ModuleFacts = { ...communeFacts, hasAddress: true, logement, relationAuLieu: { echelle: "adresse", relation: null } };
  const hard: EvaluationContext = {
    constraints: hydrateHardConstraints({}, { byName: () => null, plmByName: () => null }),
    point: { lat: k.lat, lon: k.lon, grain: "address", source: "address_geocoder", label: `Adresse témoin, ${k.nom}` },
    conventionsVersion: PRODUCT_CONVENTIONS_VERSION,
  };
  const run = runRules(facts, project, hard);
  return assembleDossier(run, project, "commune+adresse", facts.nom, composeFacts(run, facts, project), facts.relationAuLieu ?? null);
}

export default async function BancFut20({ searchParams }: { searchParams: Promise<{ cas?: string }> }) {
  if (process.env.NODE_ENV === "production") notFound();
  const sp = await searchParams;
  const cas = CAS.find((c) => c.nom === sp.cas) ?? CAS[1]!;
  const dossier = await dossierDuCas(cas);
  return (
    <main className="relative z-[2] max-w-[1100px] mx-auto px-5 sm:px-7 pt-10 pb-24">
      <p className="font-mono text-[11px] tracking-[0.14em] uppercase text-ghost mb-2">Banc FUT-20 · DRIAS réel, logements témoins, aucune donnée client</p>
      <h1 className="text-[22px] font-semibold text-label mb-4">{cas.titre}</h1>
      <nav aria-label="Cas" className="flex flex-wrap gap-3 mb-6 text-[13px]">
        {CAS.map((c) => (
          <Link key={c.nom} href={`/dev/fut20?cas=${c.nom}`} aria-current={c.nom === cas.nom ? "page" : undefined}
            className={c.nom === cas.nom ? "text-label underline" : "text-muted"}>{c.nom}</Link>
        ))}
      </nav>
      <DossierDecisionSection
        presentation="classique"
        dossier={dossier}
        logementStatus="done"
        insee={COMMUNES[cas.commune].insee}
        scopeKey="logement:dev-fut20"
        espacement="mt-4"
      />
    </main>
  );
}
