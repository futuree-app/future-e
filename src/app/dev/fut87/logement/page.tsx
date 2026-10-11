// FUT-87 · PROTOTYPE 3 · LE MODULE LOGEMENT. DEV UNIQUEMENT : 404 en production.
// Données : le logement témoin anonymisé (`fixture-logement.ts`), lu par les fonctions de production.
import Link from "next/link";
import { notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import { LogementReleve } from "@/components/prototypes/fut87/LogementReleve";
import { releve as s, BandeauPrototype } from "@/components/prototypes/fut87/primitives";

export default function PrototypeLogement() {
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <main className={s.releve}>
      <Navbar />
      <BandeauPrototype>
        Prototype FUT-87 · direction « Le relevé » · logement témoin anonymisé (valeurs d&apos;un audit public, adresse fictive) ·{" "}
        <Link href="/dev/fut87/avant/logement">voir le rendu actuel</Link> · <Link href="/dev/fut87">index</Link>
      </BandeauPrototype>
      <LogementReleve />
    </main>
  );
}
