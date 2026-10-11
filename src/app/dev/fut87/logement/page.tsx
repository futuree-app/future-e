// FUT-87 · PROTOTYPE 3 · LE MODULE LOGEMENT. DEV UNIQUEMENT : 404 en production.
// Données : un logement témoin anonymisé (`fixture-logement.ts`), lu par les fonctions de production.
// `?cas=` choisit la situation : référence, sans diagnostic, immeuble, sources sans réponse, titre long.
import Link from "next/link";
import { notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import { LogementReleve } from "@/components/prototypes/fut87/LogementReleve";
import { releve as s, BandeauPrototype } from "@/components/releve/primitives";
import { CAS_LOGEMENT, LIBELLE_CAS, casDeLogement, casDepuisUrl } from "@/components/prototypes/fut87/fixture-logement";

export default async function PrototypeLogement({ searchParams }: { searchParams: Promise<{ cas?: string }> }) {
  if (process.env.NODE_ENV === "production") notFound();
  const cas = casDepuisUrl((await searchParams).cas);
  return (
    <main className={s.releve}>
      <Navbar />
      <BandeauPrototype>
        Prototype FUT-87 · direction « Le relevé » · logement témoin anonymisé (adresse fictive) ·{" "}
        <Link href={`/dev/fut87/avant/logement?cas=${cas}`}>voir le rendu actuel</Link> · <Link href="/dev/fut87">index</Link>
        <nav aria-label="Cas de test" className={s.cas}>
          {CAS_LOGEMENT.map((c) => (
            <Link key={c} href={`/dev/fut87/logement?cas=${c}`} aria-current={c === cas ? "page" : undefined}>{LIBELLE_CAS[c]}</Link>
          ))}
        </nav>
      </BandeauPrototype>
      <LogementReleve cas={casDeLogement(cas)} />
    </main>
  );
}
