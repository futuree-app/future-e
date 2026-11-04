import { lireVentesAutour } from "@/lib/server/prix-autour-tuiles";
import type { TypeDuLogement } from "@/lib/prix-autour-texte";
import { VentesAutourBloc } from "@/components/report/VentesAutourBloc";

// FUT-138 · LA LECTURE DES VENTES À PROXIMITÉ, côté serveur, ISOLÉE DANS SA PROPRE FRONTIÈRE DE SUSPENSE. Une lecture à
// froid fait quatre allers-retours vers Supabase Storage (environ 1 s en médiane, 2 s au 9e décile, mesuré le
// 03/11/2026) : la page Autour s'affiche sans l'attendre, et le bloc arrive quand il est prêt. Au-delà de 6 s, le bloc
// dit l'indisponibilité. Composant serveur seulement : la position est celle du dossier, jamais celle du navigateur.

const DELAI_TOTAL_MS = 6_000;

export async function VentesAutourServeur({ lat, lon, insee, type }: { lat: number; lon: number; insee: string; type: TypeDuLogement }) {
  let minuterie: ReturnType<typeof setTimeout> | undefined;
  const delai = new Promise<null>((r) => { minuterie = setTimeout(() => r(null), DELAI_TOTAL_MS); });
  const autour = await Promise.race([lireVentesAutour({ lat, lon }, insee), delai]).finally(() => clearTimeout(minuterie));
  return <VentesAutourBloc autour={autour} type={type} />;
}
