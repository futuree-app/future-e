// FUT-87 · LA PLANCHE DES TROIS DIRECTIONS, À CONTENU ÉGAL. DEV UNIQUEMENT : 404 en production.
import Link from "next/link";
import { notFound } from "next/navigation";
import { DirectionsPlanche } from "@/components/prototypes/fut87/DirectionsPlanche";
import { releve as s, BandeauPrototype } from "@/components/prototypes/fut87/primitives";

export default function PrototypeDirections() {
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <main className={s.releve}>
      <BandeauPrototype>Prototype FUT-87 · planche comparative des directions · <Link href="/dev/fut87">index</Link></BandeauPrototype>
      <DirectionsPlanche />
    </main>
  );
}
