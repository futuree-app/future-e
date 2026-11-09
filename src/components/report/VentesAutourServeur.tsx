import { lireVentesAutour } from "@/lib/server/prix-autour-tuiles";
import type { TypeDuLogement } from "@/lib/prix-autour-texte";
import { VentesAutourBloc } from "@/components/report/VentesAutourBloc";

// FUT-138 · LA LECTURE DES VENTES À PROXIMITÉ, côté serveur, ISOLÉE DANS SA PROPRE FRONTIÈRE DE SUSPENSE. Une lecture à
// froid fait quatre allers-retours vers Supabase Storage (environ 1 s en médiane, 2 s au 9e décile, mesuré le
// 03/11/2026) : la page Autour s'affiche sans l'attendre, et le bloc arrive quand il est prêt. Au-delà de 6 s, le bloc
// dit l'indisponibilité. Composant serveur seulement : la position est celle du dossier, jamais celle du navigateur.

const DELAI_TOTAL_MS = 6_000;

// La course contre le délai vit hors du composant (FUT-121) : la minuterie y est une variable
// ordinaire d'une fonction asynchrone, et non une variable du rendu réaffectée par une fermeture.
// Même contrat qu'avant : `null` au-delà du délai, l'erreur de lecture propagée telle quelle, la
// minuterie toujours libérée.
async function avantDelai<T>(lecture: Promise<T>, delaiMs: number): Promise<T | null> {
  let minuterie: ReturnType<typeof setTimeout> | undefined;
  const delai = new Promise<null>((r) => { minuterie = setTimeout(() => r(null), delaiMs); });
  return Promise.race([lecture, delai]).finally(() => clearTimeout(minuterie));
}

export async function VentesAutourServeur({ lat, lon, insee, type }: { lat: number; lon: number; insee: string; type: TypeDuLogement }) {
  const autour = await avantDelai(lireVentesAutour({ lat, lon }, insee), DELAI_TOTAL_MS);
  return <VentesAutourBloc autour={autour} type={type} />;
}
