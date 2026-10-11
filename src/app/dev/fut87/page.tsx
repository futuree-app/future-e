// FUT-87 · INDEX DES PROTOTYPES DE DIRECTION ARTISTIQUE. DEV UNIQUEMENT : 404 en production.
import Link from "next/link";
import { notFound } from "next/navigation";
import { releve as s, Surtitre, GlypheGrain } from "@/components/releve/primitives";

const PAGES = [
  { href: "/dev/fut87/directions", titre: "Les trois directions", note: "Atlas, édition, strates, et la combinaison retenue, rendues sur le même contenu." },
  { href: "/dev/fut87/accueil", titre: "Prototype 1 · Accueil", note: "Avant : l'accueil actuel (/)." , avant: "/" },
  { href: "/dev/fut87/decision", titre: "Prototype 2 · Ma décision", note: "Dossier réel du moteur (Nîmes, projet de test). Paramètres insee, prefs, adresse et confirmer comme /dev/dossier. Cinq cas en tête de page : référence, condition sans compromis, nombreuses réserves, titre long, correspondance sans réserve.", avant: "/dev/fut87/avant/decision" },
  { href: "/dev/fut87/logement", titre: "Prototype 3 · Logement", note: "Logement témoin anonymisé, lu par les fonctions de production. Cinq cas : référence, sans diagnostic, appartement avec audit de l'immeuble, sources sans réponse, adresse très longue.", avant: "/dev/fut87/avant/logement" },
];

export default function IndexFut87() {
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <main className={s.releve}>
      <div className={s.feuille} style={{ padding: "56px 20px", display: "grid", gap: 28 }}>
        <Surtitre numero="FUT-87">Direction artistique · prototypes</Surtitre>
        <h1 className={s.display}>Le relevé</h1>
        <p className={s.chapo} style={{ maxWidth: 640 }}>
          Une proposition à évaluer, isolée du site public. Chaque prototype a sa page « avant » nourrie des mêmes données.
        </p>
        <ul className={s.liste} style={{ borderTop: "1px solid var(--r-filet-fort)" }}>
          {PAGES.map((p) => (
            <li key={p.href} style={{ paddingTop: 18 }}>
              <div className={s.rangee} style={{ alignItems: "baseline" }}>
                <span style={{ color: "var(--r-encre)" }}><GlypheGrain grain="batiment" /></span>
                <Link className={s.lien} href={p.href} style={{ fontSize: 19, fontWeight: 600 }}>{p.titre}</Link>
                {p.avant ? <Link className={s.lien} href={p.avant} style={{ fontSize: 14, color: "var(--r-discret)" }}>avant</Link> : null}
              </div>
              <p className={s.nuance} style={{ marginTop: 6 }}>{p.note}</p>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
