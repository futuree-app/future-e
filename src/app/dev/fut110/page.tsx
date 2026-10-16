// FUT-110 · BANC DES CONDITIONS CONFIRMÉES. DEV UNIQUEMENT : 404 en production.
//
// Le défaut se voyait sur un dossier d'ADRESSE : une condition confirmée (« accès aux soins »), une commune
// parmi les plus favorables, un médecin à 550 m, et une carte « Ouverte · plutôt défavorable ». Le
// reproduire par le parcours réel demande un compte payant, une adresse et un voisinage calculé. Ici, des
// fixtures passent par la MÊME chaîne que `assembleAddressDossier` (règles, conditions, compositions,
// assemblage), sans I/O, puis par le MÊME composant que /rapport.
//
// Aucune donnée client, aucun appel au modèle : la conclusion rédigée retombe sur le déterministe quand
// `DOSSIER_NARRATIVE` n'est pas posé (lancer le serveur avec `DOSSIER_NARRATIVE=false`).
import Link from "next/link";
import { notFound } from "next/navigation";
import { mapCommuneToModuleFacts } from "@/lib/decision/module-facts-map";
import { runRules } from "@/lib/decision/materiality-rules";
import { assembleDossier } from "@/lib/decision/decision-assembler";
import { composeFacts } from "@/lib/decision/fact-compositions";
import { buildConfirmation } from "@/lib/decision/conditions";
import { buildAutourFacts } from "@/lib/decision/autour-facts";
import { buildSecteurFacts } from "@/lib/decision/secteur-facts";
import { hydrateHardConstraints } from "@/lib/hard-constraints-hydrate";
import { PRODUCT_CONVENTIONS_VERSION, type EvaluationContext } from "@/lib/hard-constraints";
import { normalizeUserProject, type UserProject } from "@/lib/user-project";
import type { IndexCommune, PreferenceKey } from "@/lib/comparateur-vie";
import type { ConditionCheckFact, Dossier, ModuleFacts } from "@/lib/decision/decision-fact";
import type { Face3Snapshot } from "@/lib/logement-autour-types";
import { DossierDecisionSection } from "@/components/report/DossierDecisionSection";

export const dynamic = "force-dynamic";

// Une commune FICTIVE au nom réel (Châtelaillon-Plage, celle du cas d'origine) : les rangs sont posés à
// la main, aucune valeur ne vient de l'index.
const COMMUNE = {
  insee: "17094", nom: "Châtelaillon-Plage", dept: "17", region: "Nouvelle-Aquitaine", lat: 46.07, lon: -1.08,
  population: 6000, densite: 900, altitude: 5, clim: {}, pct: {},
} as unknown as IndexCommune;

const FAVORABLE: [number, number] = [8500, 9000];
const NEUTRE: [number, number] = [4500, 5500];
const DEFAVORABLE: [number, number] = [1000, 1500];

function snapshot(categories: unknown[]): Face3Snapshot {
  return {
    center: { lat: 46.07, lon: -1.08 },
    bpe: { categories },
    osm: { potentiallyNoisyInfrastructure: [], nearestMappedGreenSpace: null, bboxRadiusMeters: 1500 },
    sourceStatus: { bpe: "complete", osmInfrastructure: "complete", osmGreenSpaces: "complete" },
    sources: { bpeVersion: "face3-2026-07-08e", osmFetchedAt: null, osmQueryVersion: "v1", bpeMillesime: "2025" },
    computedAt: "2026-09-21T10:00:00.000Z",
  } as unknown as Face3Snapshot;
}
const MEDECIN = snapshot([{ category: "sante", nearest: { distanceMeters: 553, typeLabel: "Médecin généraliste" }, searchCapMeters: 5000, withinWalkCount: 1 }]);
const GARE = snapshot([{ category: "transports", nearest: { distanceMeters: 600, typeLabel: "Gare" }, searchCapMeters: 5000, withinWalkCount: 1 }]);
const MOINS_MOTORISE = buildSecteurFacts({ kind: "secteur", share: 45, communeShare: 70, irisCode: "170940101" });

type Cas = { nom: string; titre: string; cle: PreferenceKey; rang: [number, number]; faits: Partial<ModuleFacts> };
const CAS: Cas[] = [
  { nom: "soins", titre: "S1 · soins : commune favorable, médecin à 550 m", cle: "acces_soins", rang: FAVORABLE, faits: { autour: buildAutourFacts(MEDECIN) } },
  { nom: "gare", titre: "S1 · transports : commune favorable, gare à 600 m", cle: "acces_transports", rang: FAVORABLE, faits: { autour: buildAutourFacts(GARE) } },
  { nom: "auto", titre: "S1 · voiture : commune favorable, secteur moins motorisé", cle: "faible_dependance_auto", rang: FAVORABLE, faits: { secteur: MOINS_MOTORISE } },
  { nom: "soins-defavorable", titre: "Contre-exemple · soins : commune défavorable, médecin à 550 m", cle: "acces_soins", rang: DEFAVORABLE, faits: { autour: buildAutourFacts(MEDECIN) } },
  { nom: "soins-neutre", titre: "Contre-exemple · soins : commune neutre, médecin à 550 m", cle: "acces_soins", rang: NEUTRE, faits: { autour: buildAutourFacts(MEDECIN) } },
];

function dossierDuCas(c: Cas): Dossier {
  const entry = { ...COMMUNE, rankBands: { [c.cle]: c.rang } } as unknown as IndexCommune;
  const base = normalizeUserProject({
    posture: "recherche", intent: null, rawText: "…", updatedAt: "2026-09-01T00:00:00.000Z",
    parsed: { reformulation: "x", hardConstraints: {}, preferences: [{ key: c.cle, weight: 3 }] },
  })!;
  const project: UserProject = normalizeUserProject({
    ...base, conditions: [buildConfirmation(base, { kind: "preference", key: c.cle }, "2026-10-01T00:00:00.000Z")!],
  })!;
  const communeFacts = mapCommuneToModuleFacts(entry, {}, { hasAddress: true, tailleVille: 6000, tailleVilleSource: "commune", climat: null });
  const facts: ModuleFacts = { ...communeFacts, hasAddress: true, relationAuLieu: { echelle: "adresse", relation: null }, ...c.faits };
  const hard: EvaluationContext = {
    constraints: hydrateHardConstraints({}, { byName: () => null, plmByName: () => null }),
    point: { lat: 46.07, lon: -1.08, grain: "address", source: "address_geocoder", label: "1 rue de test, Châtelaillon-Plage" },
    conventionsVersion: PRODUCT_CONVENTIONS_VERSION,
  };
  const run = runRules(facts, project, hard);
  return assembleDossier(run, project, "commune+adresse", facts.nom, composeFacts(run, facts, project), facts.relationAuLieu ?? null);
}

export default async function BancFut110({ searchParams }: { searchParams: Promise<{ cas?: string }> }) {
  if (process.env.NODE_ENV === "production") notFound();
  const sp = await searchParams;
  const cas = CAS.find((c) => c.nom === sp.cas) ?? CAS[0]!;
  const dossier = dossierDuCas(cas);
  const carte = dossier.sections.flatMap((s) => s.cards).flatMap((c) => (c.kind === "fact" ? [c.fact] : []))
    .find((f): f is ConditionCheckFact => f.role === "condition_check");
  return (
    <main className="relative z-[2] max-w-[1100px] mx-auto px-5 sm:px-7 pt-10 pb-24">
      <p className="font-mono text-[11px] tracking-[0.14em] uppercase text-ghost mb-2">Banc FUT-110 · fixtures, aucune donnée client</p>
      <h1 className="text-[22px] font-semibold text-label mb-4">{cas.titre}</h1>
      <nav aria-label="Cas" className="flex flex-wrap gap-3 mb-6 text-[13px]">
        {CAS.map((c) => (
          <Link key={c.nom} href={`/dev/fut110?cas=${c.nom}`} aria-current={c.nom === cas.nom ? "page" : undefined}
            className={c.nom === cas.nom ? "text-label underline" : "text-muted"}>{c.nom}</Link>
        ))}
      </nav>
      {carte ? (
        <section className="glass rounded-2xl p-5 mb-8 text-[13px] font-mono text-muted flex flex-col gap-1.5">
          <p>signal · <span className="text-label">{carte.signal}</span></p>
          <p>status · <span className="text-label">{carte.status}</span></p>
          <p>whyNotDecided · <span className="text-label">{carte.whyNotDecided}</span></p>
          <p>consequence · <span className="text-label">{carte.consequence}</span></p>
          <p>verdict · <span className="text-label">{dossier.narrativePlan.verdictLabel}</span></p>
        </section>
      ) : null}
      <DossierDecisionSection
        presentation="classique"
        dossier={dossier}
        logementStatus="done"
        insee={COMMUNE.insee}
        scopeKey="logement:dev-fut110"
        espacement="mt-4"
      />
    </main>
  );
}
