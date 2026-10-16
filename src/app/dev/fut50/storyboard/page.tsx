// FUT-50 · LE STORYBOARD DU MINI-FILM « DOSSIER ADRESSE ». DEV UNIQUEMENT : 404 en production.
// Repère de conception pour la revue interne : aucune donnée, cinq plans, leurs durées, transitions et les champs
// à lire dans le dossier exemple réel de FUT-56.
import Link from "next/link";
import { notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import { releve as s, BandeauPrototype } from "@/components/releve/primitives";
import { PLANS, Cadre, DUREE_FILM } from "@/components/accueil/PlansDossier";
import c from "@/components/accueil/accueil.module.css";

export default function StoryboardDossier() {
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <main className={`${s.releve} ${c.page}`}>
      <Navbar />
      <BandeauPrototype>
        Storyboard FUT-50 · mini-film du dossier d&apos;adresse · maquette sans données · <Link href="/dev/fut50/c#dossier-adresse">voir dans l&apos;accueil C</Link>
      </BandeauPrototype>
      <div className={s.feuille} style={{ padding: "48px 0 96px", display: "grid", gap: 36 }}>
        <div style={{ display: "grid", gap: 12, maxWidth: 760 }}>
          <h1 className={c.sectionTitre}>Un dossier d&apos;adresse en {DUREE_FILM} secondes</h1>
          <p className={c.sectionChapo}>
            Muet, sans son, sans calcul simulé. Tourné à partir des vrais composants « Le relevé » nourris par le dossier
            exemple réel, anonymisé et versionné de FUT-56 ; la même fixture servira l&apos;aperçu avant paiement (FUT-14).
          </p>
        </div>
        <ol className={c.storyboard}>
          {PLANS.map((p, i) => (
            <li key={p.id} className={c.storyboardPlan}>
              <Cadre plan={p} numero={i + 1} />
              <dl className={c.storyboardNotes}>
                <dt>Transition</dt><dd>{p.transition}</dd>
                <dt>À lire dans la fixture FUT-56</dt><dd><ul>{p.donnees.map((d) => <li key={d}>{d}</li>)}</ul></dd>
              </dl>
            </li>
          ))}
        </ol>
      </div>
    </main>
  );
}
