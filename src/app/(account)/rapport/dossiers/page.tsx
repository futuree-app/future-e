export const dynamic = "force-dynamic";

import Link from "next/link";
import Navbar from "@/components/Navbar";
import { requireCurrentUser } from "@/lib/user-account";
import { isAdminDossierCreator } from "@/lib/server/admin-dossier";
import { AdminDossierCreator } from "@/components/report/AdminDossierCreator";
import { chargerVosLieux } from "@/lib/server/vos-lieux";
import { VosLieux } from "@/components/vos-lieux/VosLieux";
import { releve as s } from "@/components/releve/primitives";

// ════════════════════════════════════════════════════════════════════════════
// « VOS LIEUX », DANS MA DÉCISION (FUT-41, premier lot). Remplace « Mes biens ».
//
// Chaque lieu accessible au compte, une ligne : le bien ou la commune, les échelles réellement
// examinées, la conclusion de son dossier TELLE QU'ELLE A ÉTÉ FIGÉE (jamais recomposée), sa date et
// sa version, si elle répond encore au Projet, et l'accès au dossier. La décision de ce qu'une ligne
// a le droit de montrer vit dans `lib/decision/vos-lieux.ts` (pur, testé) ; le chargement, groupé et
// filtré par compte, dans `lib/server/vos-lieux.ts`.
//
// Cette page existe toujours parce qu'on refuse de deviner : deux appartements d'un même immeuble
// sont deux dossiers légitimes, et chacun garde ici sa propre conclusion.
//
// AUCUN BOUTON PAYANT, AUCUNE GÉNÉRATION. Elle rouvre ce qui est possédé ; le prix d'un nouveau bien
// appartient au parcours de qualification, seul à connaître l'adresse et le tarif applicable.
// Une simple visite ne modifie rien : le lieu lu ne change qu'au clic sur « Ouvrir le dossier ».
// ════════════════════════════════════════════════════════════════════════════

export default async function VosLieuxPage() {
  const { supabase, user } = await requireCurrentUser();
  const lieux = await chargerVosLieux(supabase, user.id);
  const canCreate = isAdminDossierCreator(user.email);
  const aDesBiens = lieux.some((l) => l.type === "adresse");

  return (
    // Le fond du Relevé (`--r-fond`), qui suit le thème ; `bg-canvas` est une couleur figée, sombre en thème clair.
    <div className={s.releve} style={{ position: "relative", overflow: "hidden" }}>
      <Navbar ctas={{ secondary: { href: "/compte", label: "Mon compte" }, primary: { href: "/rapport", label: "Mon rapport" } }} />
      <main className={`${s.releveSection} ${s.feuille}`} style={{ position: "relative", zIndex: 2, paddingBottom: 96 }}>
        <VosLieux lieux={lieux} />

        {canCreate && <AdminDossierCreator />}

        {/* AJOUTER UN BIEN. Le prix n'est pas annoncé ici : il vaut 39 € ou 25 € selon que le
            territoire du bien est déjà payé, et seul le parcours de qualification le sait. */}
        <section className={s.mouvement} aria-label="Analyser une autre adresse">
          <p className={s.dense}>
            {aDesBiens
              ? "Un autre bien à examiner ? Chaque dossier porte une adresse précise, et ouvre les trois échelles de sa commune."
              : "Un dossier porte une adresse précise : ce qu'elle a autour d'elle, et ce que dit le bâtiment lui-même."}
          </p>
          <p style={{ marginTop: 16 }}>
            <Link href="/dossier" className={s.bouton}>{aDesBiens ? "Analyser une autre adresse" : "Analyser une adresse"}</Link>
          </p>
        </section>
      </main>
    </div>
  );
}
