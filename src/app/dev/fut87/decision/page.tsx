// FUT-87 · PROTOTYPE 2 · « MA DÉCISION ». DEV UNIQUEMENT : 404 en production.
//
// Depuis FUT-91, ce prototype rend le VRAI composant de production (`DossierDecisionSection`, puis
// `ControlesDuDossier`) en présentation « relevé » : il n'existe plus deux implémentations de cette
// mise en page. Le dossier est celui du moteur, pour une commune publique ou une adresse publique
// (`?lieu=`), et un projet décrit dans l'URL. Le banc complet des états est `/dev/fut91`.
import Link from "next/link";
import { notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import { DossierDecisionSection } from "@/components/report/DossierDecisionSection";
import { ControlesDuDossier } from "@/components/report/ControlesDuDossier";
import { releve as s, BandeauPrototype } from "@/components/releve/primitives";
import { CAS_DECISION, DEFAUT } from "../projet-de-test";
import { dossierDeTest } from "../dossier-de-test";

export const dynamic = "force-dynamic";

export default async function PrototypeDecision({ searchParams }: { searchParams: Promise<{ insee?: string; prefs?: string; adresse?: string; confirmer?: string; lieu?: string }> }) {
  if (process.env.NODE_ENV === "production") notFound();
  const sp = await searchParams;
  const t = await dossierDeTest(sp);
  if (!t) notFound();
  const requete = new URLSearchParams(Object.entries({ ...sp, prefs: sp.prefs ?? DEFAUT.prefs }).filter((x): x is [string, string] => Boolean(x[1]))).toString();
  return (
    <main className={s.releve}>
      <Navbar />
      <BandeauPrototype>
        Prototype FUT-87 · direction « Le relevé » · dossier réel du moteur,{" "}
        {t.adresse ? <>dossier d&apos;adresse ({t.adresse.label}){t.statutAdresse === "unavailable" ? ", lecture d'adresse indisponible : repli communal" : ""}</> : <>commune {t.insee}</>}
        , projet de test · <Link href={`/dev/fut91?${requete}`}>banc FUT-91 (états, avant / après)</Link> · <Link href="/dev/fut87">index</Link>
        <nav aria-label="Cas de test" className={s.cas}>
          {CAS_DECISION.map((c) => <Link key={c.nom} href={`/dev/fut87/decision?${c.requete}`}>{c.nom}</Link>)}
        </nav>
      </BandeauPrototype>
      <div className="max-w-[1100px] mx-auto px-5 sm:px-7 pb-24">
        <DossierDecisionSection presentation="releve" dossier={t.dossier} insee={t.insee} scopeKey="commune" espacement="mt-8"
          logementStatus={t.statutAdresse === "unavailable" ? "unavailable" : "pending"} />
        <ControlesDuDossier presentation="releve" dossier={t.dossier} />
      </div>
    </main>
  );
}
