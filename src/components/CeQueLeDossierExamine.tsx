// CE QU'ON ACHÈTE, SUR L'ÉCRAN OÙ L'ON PAIE.
//
// POURQUOI CE BLOC EXISTE. `/checkout/dossier` ne portait que l'adresse et un montant. La
// qualification qui précède dit tout — les trois échelles, la matière trouvée, ce qui manquera —
// mais elle est derrière : un lien partagé arrive ici directement, et le parcours de création de
// compte y ramène après un détour par `/connexion`. Le lecteur pouvait donc payer devant un prix nu.
//
// POURQUOI C'EST UN COMPOSANT, ET PAS DU JSX DANS LA PAGE. Le seul chemin qui mène à cette page
// demande une session, une adresse vérifiée par la BAN et un devis serveur : le bloc n'était pas
// regardable avant d'être en production, sur la surface la plus sensible du produit. Il est donc
// prévisualisable en développement (`/dev/checkout-echelles`), à la manière de `/dev/conclusion`.
//
// CE QU'IL NE DIT PAS. La couverture propre à l'adresse (diagnostic, parcelle) n'est PAS répétée
// ici : elle se mesure, et cette page ne l'a pas mesurée. Répéter une promesse sans sa mesure est
// exactement ce que l'écran précédent existe pour éviter.
import {
  CE_QUE_LE_DOSSIER_REND, ECHELLES_DU_DOSSIER, libelleEchelle,
} from "@/lib/dossier-echelles";

export function CeQueLeDossierExamine({ city }: { city?: string | null }) {
  return (
    <div className="rounded-xl border border-[var(--border-2)] bg-[var(--bg-elev)] px-6 py-5 mb-5">
      <p className="font-mono text-[11px] tracking-[0.12em] uppercase text-ghost mb-4">
        Ce que ce dossier examine
      </p>
      <div style={{ display: "grid", gap: 18 }}>
        {ECHELLES_DU_DOSSIER.map((echelle) => (
          <div key={echelle.key}>
            <p className="text-[16px] text-label leading-snug mb-1.5">
              {libelleEchelle(echelle, city)}
            </p>
            <p className="text-[14px] text-muted leading-relaxed">{echelle.body}</p>
          </div>
        ))}
      </div>
      <p className="text-[14px] text-muted leading-relaxed mt-5 pt-4 border-t border-[var(--border-1)]">
        {CE_QUE_LE_DOSSIER_REND}
      </p>
    </div>
  );
}
