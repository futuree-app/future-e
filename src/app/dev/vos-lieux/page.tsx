// FUT-41 · LE BANC « VOS LIEUX ». DEV UNIQUEMENT : 404 en production.
//
// Rend le composant de production `VosLieux` sur des lieux FICTIFS et anonymisés, assemblés par la
// fonction de production `assemblerVosLieux` : chaque état d'une ligne (territoire acheté, adresse à
// trois échelles, deux adresses d'une commune, conclusion dépassée par le Projet, sans conclusion,
// en préparation, illisible, Paris, résidence gratuite, dossier ouvert par futur•e). Aucun compte,
// aucune base, aucun appel de modèle.
import { notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import { VosLieux } from "@/components/vos-lieux/VosLieux";
import { releve as s, BandeauPrototype } from "@/components/releve/primitives";
import { assemblerVosLieux, cleArtefact } from "@/lib/decision/vos-lieux";
import { etatArtefact, type StoredArtifact } from "@/lib/decision/decision-artifact";
import { projetDeTest } from "@/lib/decision/projet-de-test";

export const dynamic = "force-dynamic";

const P1 = projetDeTest("faible_chaleur:3,vie_locale:2,acces_soins:2").projet;
const P2 = projetDeTest("faible_chaleur:3,vie_locale:3,acces_soins:2").projet;

function artefact(texte: string, o: { label?: string; tone?: string; scope?: string; projet?: unknown; date?: string } = {}) {
  return {
    schemaVersion: 1, generatedAt: o.date ?? "2026-10-09T10:00:00.000Z", engineVersion: "engine-6", conventionsVersion: "conv",
    projectSnapshot: o.projet ?? P2,
    dossier: {
      scope: o.scope ?? "commune", conclusion: "", conclusionState: "ok", sections: [], controlesTitle: "", compositions: [], absorbedFacts: [],
      narrativePlan: { verdictLabel: o.label ?? "Arbitrage", verdictTone: o.tone ?? "caution", verdict: { headline: { text: texte } } },
    },
  };
}
const servi = (payload: unknown, version = 1, tete?: "generating"): StoredArtifact => etatArtefact([
  ...(tete ? [{ version: version + 1, status: tete, generatedAt: null, createdAt: null, payload: null }] : []),
  { version, status: "ready" as const, generatedAt: null, createdAt: null, payload },
])!;

const ID = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const bien = (n: number, insee: string, label: string, city: string, cree: string, paye = true) =>
  ({ id: ID(n), insee, address_label: label, city, created_at: cree, stripe_payment_intent_id: paye ? "pi_test" : null });

export default function BancVosLieux({ searchParams }: { searchParams: Promise<{ cas?: string }> }) {
  if (process.env.NODE_ENV === "production") notFound();
  void searchParams;
  const biens = [
    bien(1, "30189", "12 rue des Sternes 30000 Nîmes", "Nîmes", "2026-10-09T09:00:00.000Z"),
    bien(2, "30189", "5 allée des Goélands 30000 Nîmes", "Nîmes", "2026-10-08T09:00:00.000Z"),
    bien(3, "34172", "31 route de Kervily 34000 Montpellier", "Montpellier", "2026-09-19T09:00:00.000Z"),
    bien(4, "75118", "8 rue d'Exemple 75018 Paris", "Paris", "2026-09-12T09:00:00.000Z", false),
    bien(5, "13055", "4 quai des Thoniers 13002 Marseille", "Marseille", "2026-08-02T09:00:00.000Z"),
  ];
  const artefacts = new Map<string, StoredArtifact>([
    [cleArtefact("30189", `logement:${ID(1)}`), servi(artefact("12 rue des Sternes répond à votre projet, avec un compromis : le calme aux abords.", { scope: "commune+adresse" }), 2)],
    [cleArtefact("30189", `logement:${ID(2)}`), servi(artefact("5 allée des Goélands répond à votre projet.", { scope: "commune+adresse", label: "Correspondance", tone: "positive" }), 1, "generating")],
    [cleArtefact("34172", `logement:${ID(3)}`), servi(artefact("31 route de Kervily répond à votre projet, avec un compromis : une gare à moins de 20 min aux abords.", { scope: "commune+adresse", projet: P1, date: "2026-09-19T10:00:00.000Z" }))],
    [cleArtefact("75118", `logement:${ID(4)}`), servi(artefact("8 rue d'Exemple ne tient pas votre condition sans compromis : des étés supportables.", { scope: "commune", label: "Condition non tenue", tone: "critical" }))],
    [cleArtefact("2A004", "commune"), servi(artefact("Ajaccio répond moins bien à une de vos priorités : des étés supportables."))],
  ]);
  const lieux = assemblerVosLieux({
    biens,
    territoires: [
      { insee: "2A004", commune: "Ajaccio", createdAt: "2026-09-30T09:00:00.000Z" },
      { insee: "56260", commune: "Vannes", createdAt: "2026-09-01T09:00:00.000Z" },
      { insee: "30189", commune: "Nîmes", createdAt: "2026-08-01T09:00:00.000Z" },
    ],
    residence: { insee: "17300", commune: "La Rochelle" },
    artefacts,
    projetActuel: P2,
  });
  return (
    <div className={s.releve}>
      <Navbar ctas={{ secondary: { href: "/compte", label: "Mon compte" }, primary: { href: "/rapport", label: "Mon rapport" } }} />
      <main className={`${s.releveSection} ${s.feuille}`} style={{ paddingBottom: 96 }}>
        <BandeauPrototype>Banc FUT-41 · « Vos lieux » · lieux fictifs, assemblés par la fonction de production</BandeauPrototype>
        <VosLieux lieux={lieux} />
      </main>
    </div>
  );
}
