import ProjectionsIndisponibles from "@/components/ProjectionsIndisponibles";

// Rendu (statut 404) quand la page appelle `notFound()` : code ultramarin, hors de la couverture DRIAS (hotfix FUT-104).
export default function NotFound() {
  return <ProjectionsIndisponibles retour="/inondation" libelleRetour="← Inondation et submersion, toutes les communes" />;
}
