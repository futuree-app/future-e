// FUT-127 · BANC INONDATION × ADRESSE × PROJET. DEV UNIQUEMENT : 404 en production.
//
// Les VRAIES données : l'entrée de l'index, la table GASPAR des plans de prévention, et les réponses
// Géorisques relevées le 22/10/2026 sur des adresses publiques (`src/lib/__fixtures__/fut127/`). Elles
// passent par la MÊME chaîne que `assembleAddressDossier` (règles, conditions, compositions, assemblage)
// et par les MÊMES composants que /rapport et le module Logement. Ce qui est simulé : le projet.
//
// Aucune donnée client, aucun réseau, aucun appel au modèle : lancer le serveur avec `DOSSIER_NARRATIVE=false`.
import Link from "next/link";
import { readFileSync } from "node:fs";
import path from "node:path";
import { notFound } from "next/navigation";
import { mapCommuneToModuleFacts } from "@/lib/decision/module-facts-map";
import { runRules } from "@/lib/decision/materiality-rules";
import { assembleDossier } from "@/lib/decision/decision-assembler";
import { composeFacts } from "@/lib/decision/fact-compositions";
import { buildConfirmation } from "@/lib/decision/conditions";
import { buildLogementFacts } from "@/lib/decision/logement-facts";
import { deriveLogementCoverage } from "@/lib/decision/logement-coverage";
import { construireLectureInondation, zonageInondationDepuisPlans } from "@/lib/decision/inondation-lecture";
import { catnatInondationDepuisIndex, phraseConstatCatnatInondation } from "@/lib/decision/catnat-evidence";
import { getCommuneEntry } from "@/lib/comparateur-vie";
import { getPlansInondationCommune } from "@/lib/gaspar-pprn-commune";
import { getOnrnSinistralite } from "@/lib/onrn-sinistralite";
import { avecDetail, buildRegulatoryPlans, detailDuPlan, type RegulatoryPlan } from "@/lib/pprn-zonage";
import { hydrateHardConstraints } from "@/lib/hard-constraints-hydrate";
import { PRODUCT_CONVENTIONS_VERSION, type EvaluationContext } from "@/lib/hard-constraints";
import { normalizeUserProject, type UserProject } from "@/lib/user-project";
import type { Dossier, ModuleFacts } from "@/lib/decision/decision-fact";
import type { LogementReport } from "@/lib/logement-report-types";
import { DossierDecisionSection } from "@/components/report/DossierDecisionSection";
import { ControlesDuDossier } from "@/components/report/ControlesDuDossier";
import { RegulatoryStatusBlock } from "@/components/report/logement/RegulatorySection";
import { InondationLectureBlock } from "@/components/report/logement/InondationSection";

export const dynamic = "force-dynamic";

type Lieu = "charron" | "lr-duperre" | "lr-minimes" | "lr-palais" | "chatel";
const LIEUX: Record<Lieu, { fichier: string; insee: string }> = {
  charron: { fichier: "charron-num", insee: "17091" },
  "lr-duperre": { fichier: "lr-quai-duperre-num", insee: "17300" },
  "lr-minimes": { fichier: "lr-minimes-num", insee: "17300" },
  "lr-palais": { fichier: "lr-rue-palais", insee: "17300" },
  chatel: { fichier: "chatel-num", insee: "17094" },
};

type Cas = {
  nom: string; titre: string; insee: string; adresse: Lieu | null; muet?: boolean;
  intent?: "achat" | "location" | null; confirme?: boolean; ancien?: boolean;
};
const CAS: Cas[] = [
  { nom: "charron-adresse", titre: "Charron · Dossier Adresse, acheteur · zone rouge Rs2 « zones submersibles »", insee: "17091", adresse: "charron" },
  // Cas d'essai (arbitrage du 23/10) : le relevé réel de Charron lu sur une commune où l'accès aux soins est
  // favorable. Il montre une réserve majeure à côté d'une correspondance ; ce n'est pas une adresse réelle.
  { nom: "reserve-favorable", titre: "Cas d'essai · zone rouge Rs2 (relevé de Charron) avec une priorité favorable (accès aux soins, commune de La Rochelle)", insee: "17300", adresse: "charron" },
  { nom: "charron-condition", titre: "Charron · Dossier Adresse · inondation confirmée comme condition", insee: "17091", adresse: "charron", confirme: true },
  { nom: "charron-commune", titre: "Charron · dossier communal, acheteur", insee: "17091", adresse: null },
  { nom: "lr-commune", titre: "La Rochelle · dossier communal, acheteur", insee: "17300", adresse: null },
  { nom: "lr-duperre", titre: "La Rochelle · Quai Duperré · zone Os1 d'un plan littoral à deux aléas", insee: "17300", adresse: "lr-duperre" },
  { nom: "lr-minimes", titre: "La Rochelle · rue de la Désirée · Bs1 au point, Bs2 à la parcelle de repli", insee: "17300", adresse: "lr-minimes" },
  { nom: "lr-palais", titre: "La Rochelle · 12 rue du Palais · hors zone", insee: "17300", adresse: "lr-palais" },
  { nom: "lr-location", titre: "La Rochelle · Quai Duperré · futur locataire", insee: "17300", adresse: "lr-duperre", intent: "location" },
  { nom: "chatel", titre: "Châtelaillon-Plage · 10 bd de la Mer · Rs3 au point, Os à la parcelle", insee: "17094", adresse: "chatel" },
  { nom: "muet", titre: "La Rochelle · Géorisques sans réponse à l'adresse", insee: "17300", adresse: "lr-duperre", muet: true },
  { nom: "ancien", titre: "Analyse figée avant FUT-127 (engine-6, « exposition élevée ») · contextualisée", insee: "17300", adresse: null, ancien: true },
];

const DETAILS = ["17DDTM20100006", "17DDTM20100014", "17DDTM20100008"];
const fixture = (nom: string) =>
  JSON.parse(readFileSync(path.join(process.cwd(), "src/lib/__fixtures__/fut127", `${nom}.json`), "utf8"));

function plans(content: unknown, insee: string): RegulatoryPlan[] {
  return buildRegulatoryPlans(content as never).map((p) =>
    avecDetail(p, p.gasparId && DETAILS.includes(p.gasparId) ? detailDuPlan(fixture(`pprn-detail-${p.gasparId}`), insee) : null));
}

async function casMonte(c: Cas): Promise<{ dossier: Dossier; georisques: LogementReport["georisques"] | null; facts: ModuleFacts }> {
  const entree = (await getCommuneEntry(c.insee))!;
  const plansInondation = await getPlansInondationCommune(c.insee);
  const adresse = c.adresse != null;
  const base = mapCommuneToModuleFacts(entree, {}, { hasAddress: adresse, tailleVille: entree.population ?? null, tailleVilleSource: "commune", climat: null, plansInondation });
  let georisques: LogementReport["georisques"] | null = null;
  let facts: ModuleFacts = { ...base, hasAddress: adresse };
  if (adresse) {
    const r = c.muet ? null : fixture(LIEUX[c.adresse!].fichier);
    const rga = (b: { content?: { exposition?: string }[] }) => (b.content?.[0] ? { label: b.content[0].exposition ?? null } : null);
    const point = r ? { regulatoryPlans: plans(r.v2_pprn_point.body.content, c.insee), rga: rga(r.v2_rga_point.body) } : null;
    const parcelle = r?.v2_pprn_parcelle_formatApp ? { regulatoryPlans: plans(r.v2_pprn_parcelle_formatApp.body.content, c.insee), rga: rga(r.v2_rga_parcelle_formatApp.body) } : null;
    georisques = { address: point, parcel: parcelle, commune: null } as unknown as LogementReport["georisques"];
    const cov = deriveLogementCoverage({
      georisquesAddress: point, georisquesParcel: parcelle, cavites: [], heritage: { items: [], sourceStatus: "ok" },
      // La sinistralité ONRN embarquée du dépôt (lecture de fichier, aucun réseau).
      sinistralite: await getOnrnSinistralite(c.insee), parcelleParRepli: Boolean(r?.cadastre?.repli),
    });
    const logement = buildLogementFacts({ ...cov, fetchedAt: "2026-10-22T00:00:00.000Z" }, null, r?.adresse?.label ?? "Adresse de test");
    facts = { ...facts, logement, relationAuLieu: { echelle: "adresse", relation: null } };
  }
  let project: UserProject = normalizeUserProject({
    posture: "recherche", intent: c.intent === undefined ? "achat" : c.intent, rawText: "…", updatedAt: "2026-10-22T00:00:00.000Z",
    parsed: { reformulation: "x", hardConstraints: {}, preferences: [{ key: "acces_soins", weight: 2 }, { key: "faible_risque_inondation", weight: 3 }] },
  })!;
  if (c.confirme) project = normalizeUserProject({ ...project, conditions: [buildConfirmation(project, { kind: "preference", key: "faible_risque_inondation" }, "2026-10-22T00:00:00.000Z")!] })!;
  const hard: EvaluationContext = {
    constraints: hydrateHardConstraints({}, { byName: () => null, plmByName: () => null }),
    point: adresse
      ? { lat: entree.lat, lon: entree.lon, grain: "address", source: "address_geocoder", label: "Adresse de test" }
      : { lat: entree.lat, lon: entree.lon, grain: "commune_reference", source: "commune_centroid", label: entree.nom },
    conventionsVersion: PRODUCT_CONVENTIONS_VERSION,
  };
  const run = runRules(facts, project, hard);
  let dossier = assembleDossier(run, project, adresse ? "commune+adresse" : "commune", facts.nom, composeFacts(run, facts, project), facts.relationAuLieu ?? null);
  if (c.ancien) {
    // Ce qu'un artefact engine-6 portait, tel qu'il a été vendu : seule la phrase de la carte change ici.
    dossier = JSON.parse(JSON.stringify(dossier)) as Dossier;
    for (const s of dossier.sections) for (const card of s.cards) {
      if (card.kind === "fact" && card.fact.ruleId === "territoire.inondation-lecture" && card.fact.role === "verification") {
        // Le compte vient de catnat-evidence (garde-fou : la phrase n'est écrite qu'à un endroit).
        const compte = catnatInondationDepuisIndex({ insee: facts.insee, inondation: facts.catnatInondation != null ? { catnat: facts.catnatInondation } : null });
        card.fact.statement = "L'exposition de la commune à l'inondation ressort élevée. Consultez l'état des risques avant de vous engager."
          + (compte ? ` La commune a connu ${phraseConstatCatnatInondation(compte)} (comptage administratif, pas une probabilité).` : "");
      }
    }
  }
  return { dossier, georisques, facts };
}

export default async function BancFut127({ searchParams }: { searchParams: Promise<{ cas?: string; vue?: string }> }) {
  if (process.env.NODE_ENV === "production") notFound();
  const sp = await searchParams;
  const cas = CAS.find((c) => c.nom === sp.cas) ?? CAS[0]!;
  const presentation = sp.vue === "releve" ? "releve" : "classique";
  const { dossier, georisques, facts } = await casMonte(cas);
  const g = georisques?.parcel ?? georisques?.address;
  const lecture = cas.adresse
    ? construireLectureInondation({
        zonage: zonageInondationDepuisPlans(g ? (g.regulatoryPlans ?? []) : null),
        catnat: catnatInondationDepuisIndex({ insee: facts.insee, inondation: facts.catnatInondation != null ? { catnat: facts.catnatInondation } : null }),
        onrn: (await getOnrnSinistralite(cas.insee)).inondation,
      })
    : null;
  return (
    <main className="relative z-[2] max-w-[1100px] mx-auto px-5 sm:px-7 pt-10 pb-24">
      <p className="font-mono text-[11px] tracking-[0.14em] uppercase text-ghost mb-2">Banc FUT-127 · relevés Géorisques réels du 22/10/2026, aucune donnée client</p>
      <h1 className="text-[22px] font-semibold text-label mb-4">{cas.titre}</h1>
      <nav aria-label="Cas" className="flex flex-wrap gap-3 mb-6 text-[13px]">
        {CAS.map((c) => (
          <Link key={c.nom} href={`/dev/fut127?cas=${c.nom}&vue=${presentation}`} aria-current={c.nom === cas.nom ? "page" : undefined}
            className={c.nom === cas.nom ? "text-label underline" : "text-muted"}>{c.nom}</Link>
        ))}
        <Link href={`/dev/fut127?cas=${cas.nom}&vue=${presentation === "releve" ? "classique" : "releve"}`} className="text-accent">
          {presentation === "releve" ? "→ présentation classique" : "→ Relevé"}
        </Link>
      </nav>
      <div id="fut127-dossier">
        <DossierDecisionSection
          presentation={presentation}
          dossier={dossier}
          logementStatus={cas.adresse ? "done" : "none"}
          logement={cas.adresse ? { href: "/rapport/logement", label: "Voir le module Logement" } : null}
          insee={cas.insee}
          scopeKey="logement:dev-fut127"
          espacement="mt-4"
          controles={<ControlesDuDossier dossier={dossier} presentation={presentation} />}
        />
      </div>
      {georisques ? (
        <div id="fut127-module" className="mt-16">
          <p className="font-mono text-[11px] tracking-[0.14em] uppercase text-ghost mb-4">Module Logement · mêmes relevés</p>
          <RegulatoryStatusBlock georisques={georisques} heritage={{ items: [], sourceStatus: "ok" }} />
          {lecture ? <div className="mt-8"><InondationLectureBlock lecture={lecture} /></div> : null}
        </div>
      ) : null}
      <div id="fut127-fin" />
    </main>
  );
}
