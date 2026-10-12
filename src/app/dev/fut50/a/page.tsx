// FUT-50 · DIRECTION A · LE PROJET D'ABORD. DEV UNIQUEMENT : 404 en production.
import Link from "next/link";
import { notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import { releve as s, BandeauPrototype } from "@/components/releve/primitives";
import { AccueilProjet } from "@/components/prototypes/fut50/AccueilProjet";

export default function PrototypeAccueilA() {
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <main className={s.releve}>
      <Navbar />
      <BandeauPrototype>
        Prototype FUT-50 · direction A « Le Projet d&apos;abord » ·{" "}
        <Link href="/dev/fut50/b">direction B</Link> · <Link href="/">accueil actuel</Link> · <Link href="/dev/fut50">index</Link>
      </BandeauPrototype>
      <AccueilProjet />
    </main>
  );
}
