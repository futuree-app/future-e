"use client";

// LES DÉMARCHES, RENDUES CLIQUABLES QUAND — ET SEULEMENT QUAND — LEUR CARTE EST À L'ÉCRAN.
//
// Le plan désigne la carte d'où vient chaque action, mais rien ne garantit qu'elle soit rendue : une
// section peut être vide, un fait absorbé par une composition. Un lien qui ne mène nulle part serait
// pire que pas de lien du tout.
//
// QUI LE SAIT ? La section qui rend les cartes, et elle seule. Une première version interrogeait le DOM
// après montage (`useEffect` + `useState`) : ça marchait, mais ça devinait côté client une information
// que le serveur possède déjà, au prix d'un rendu en deux temps et d'un état à maintenir. `renderedIds`
// descend donc depuis `DossierDecisionSection`. Le lien est rendu par le serveur, du premier coup.
//
// Ce composant reste client pour une seule raison : le geste de clic. Il ne porte aucun état.
//
// Ce n'est PAS une ancre `<a href="#…">` : le hash resterait dans l'URL d'une page qu'on ne partage pas
// par section, et le bouton dit mieux ce qui se passe (on déplace la lecture, on ne navigue pas).
import { dossierAnchorId } from "@/lib/decision/dossier-anchors";

function lowerFirst(s: string): string {
  return s.length === 0 ? s : s[0]!.toLowerCase() + s.slice(1);
}

// Le déplacement de lecture : on centre la carte, on lui donne le focus (sans quoi un lecteur d'écran
// resterait sur la ligne cliquée pendant que la page a bougé), puis on la signale brièvement.
//
// `prefers-reduced-motion` gouverne LES DEUX : le défilement animé et le halo. Un réglage système qui
// existe pour éviter le vertige ne se respecte pas à moitié.
//
// LE PLAN PORTE L'IDENTIFIANT MÉTIER, PAS L'ANCRE DOM (« inondation », pas « fait-inondation ») : le
// moteur de décision n'a pas à connaître la forme du document. La traduction se fait ici, par la même
// fonction que celle qui POSE l'ancre — c'est tout l'intérêt qu'elle soit partagée.
function goToCard(rawId: string) {
  const cible = document.getElementById(dossierAnchorId(rawId));
  if (!cible) return;
  const sobre = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  cible.scrollIntoView({ behavior: sobre ? "auto" : "smooth", block: "center" });
  cible.focus({ preventScroll: true });
  if (sobre) return;
  // `data-visee` plutôt qu'une classe : React réécrit `className` à la réconciliation (cf. globals.css).
  cible.setAttribute("data-visee", "");
  window.setTimeout(() => cible.removeAttribute("data-visee"), 1600);
}

export function PriorityControlActions({
  actions, renderedIds = [],
}: {
  actions: { label: string; anchorId: string }[];
  // Les identifiants des cartes RÉELLEMENT rendues sous le verdict. Vide par défaut : un appelant qui
  // ne rend pas les cartes (export, aperçu) n'obtient aucun lien, jamais un lien mort.
  renderedIds?: string[];
}) {
  const rendues = new Set(renderedIds);
  return (
    <>
      {actions.map((a, i) => {
        const texte = i === 0 ? a.label : `Puis ${lowerFirst(a.label)}`;
        const classes = "text-[15px] leading-[1.55] text-muted";
        return rendues.has(a.anchorId) ? (
          <p key={i} className={classes}>
            {/* Souligné DISCRET plutôt qu'une couleur de lien : la ligne reste une démarche à mener,
                pas un appel à cliquer. L'affordance suffit à dire qu'on peut aller voir. */}
            <button
              type="button"
              onClick={() => goToCard(a.anchorId)}
              className="text-left underline decoration-white/25 underline-offset-[3px] hover:decoration-white/60 focus-visible:outline-2 focus-visible:outline-offset-2 transition-colors"
              style={{ outlineColor: "var(--info)" }}
            >
              {texte}
            </button>
          </p>
        ) : (
          <p key={i} className={classes}>{texte}</p>
        );
      })}
    </>
  );
}
