// FUT-50 · DIRECTION B · UNE DÉCISION ÉCLAIRÉE PAR LES PREUVES. DEV UNIQUEMENT : 404 en production.
import Link from "next/link";
import { notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import { releve as s, BandeauPrototype } from "@/components/releve/primitives";
import { AccueilPreuves } from "@/components/prototypes/fut50/AccueilPreuves";

export default function PrototypeAccueilB() {
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <main className={s.releve}>
      <Navbar />
      <BandeauPrototype>
        Prototype FUT-50 · direction B « Une décision éclairée par les preuves » ·{" "}
        <Link href="/dev/fut50/a">direction A</Link> · <Link href="/">accueil actuel</Link> · <Link href="/dev/fut50">index</Link>
      </BandeauPrototype>
      <AccueilPreuves />
    </main>
  );
}
