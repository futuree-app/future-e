// FUT-87 · PROTOTYPE 2 · « MA DÉCISION ». DEV UNIQUEMENT : 404 en production.
//
// Le dossier est le VRAI dossier du moteur (`buildCommuneDossier`, mêmes données et mêmes règles que
// `/dev/dossier`), pour une commune publique et un projet décrit dans l'URL. Aucun appel au modèle :
// la conclusion est le texte déterministe du plan. Seule la mise en page change.
import Link from "next/link";
import { notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import { buildCommuneDossier } from "@/lib/decision/territory-facts";
import { lireDossier } from "@/components/prototypes/fut87/lecture-dossier";
import { DecisionReleve } from "@/components/prototypes/fut87/DecisionReleve";
import { releve as s, BandeauPrototype } from "@/components/prototypes/fut87/primitives";
import { DEFAUT, CAS_DECISION, projetDeTest } from "../projet-de-test";

export const dynamic = "force-dynamic";

export default async function PrototypeDecision({ searchParams }: { searchParams: Promise<{ insee?: string; prefs?: string; adresse?: string; confirmer?: string }> }) {
  if (process.env.NODE_ENV === "production") notFound();
  const sp = await searchParams;
  const insee = (sp.insee ?? DEFAUT.insee).trim();
  const prefs = sp.prefs ?? DEFAUT.prefs;
  const hasAddress = sp.adresse !== "0";
  const confirmer = sp.confirmer ?? "";
  const { projet, libelles } = projetDeTest(prefs, confirmer);
  const resultat = await buildCommuneDossier(insee, projet, { hasAddress });
  if (!resultat) notFound();
  const requete = `insee=${encodeURIComponent(insee)}&prefs=${encodeURIComponent(prefs)}&adresse=${hasAddress ? "1" : "0"}${confirmer ? `&confirmer=${encodeURIComponent(confirmer)}` : ""}`;
  return (
    <main className={s.releve}>
      <Navbar />
      <BandeauPrototype>
        Prototype FUT-87 · direction « Le relevé » · dossier réel du moteur, commune {insee}, projet de test ·{" "}
        <Link href={`/dev/fut87/avant/decision?${requete}`}>voir le rendu actuel</Link> · <Link href="/dev/fut87">index</Link>
        <nav aria-label="Cas de test" className={s.cas}>
          {CAS_DECISION.map((c) => <Link key={c.nom} href={`/dev/fut87/decision?${c.requete}`}>{c.nom}</Link>)}
        </nav>
      </BandeauPrototype>
      <DecisionReleve lecture={lireDossier(resultat.dossier)} projet={libelles} lienAvant={`/dev/fut87/avant/decision?${requete}`} />
    </main>
  );
}
