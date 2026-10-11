// FUT-87 · PROTOTYPE 1 · L'ACCUEIL. DEV UNIQUEMENT : 404 en production.
import Link from "next/link";
import { notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import { AccueilReleve } from "@/components/prototypes/fut87/AccueilReleve";
import { releve as s, BandeauPrototype } from "@/components/prototypes/fut87/primitives";

export default function PrototypeAccueil() {
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <main className={s.releve}>
      <Navbar />
      <BandeauPrototype>
        Prototype FUT-87 · direction « Le relevé » · textes de l&apos;accueil actuel, données DRIAS figées et testées ·{" "}
        <Link href="/">voir l&apos;accueil actuel</Link> · <Link href="/dev/fut87">index</Link>
      </BandeauPrototype>
      <AccueilReleve />
    </main>
  );
}
