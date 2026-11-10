import { NextResponse } from "next/server";
import { getCommuneEntry, deriveCategoriesFromEntry } from "@/lib/comparateur-vie";
import { deriveCategories } from "@/lib/commune-categories";

// Catégories éditoriales de l'accueil, tirées de la VRAIE donnée commune (index A)
// au lieu du préfixe département. Pilote à la fois les cartes « profondeur » et le
// choix des questions en tension. Voir deriveCategoriesFromEntry pour la doctrine.
//
// FUT-185 : la réponse porte aussi la part voiture des trajets domicile-travail (RP 2022, MOBPRO), seule base
// de la carte Mobilité de l'aperçu. `null` : commune hors index ou sans mesure, et la carte n'existe pas.
//
// Repli département (deriveCategories) pour les communes absentes de l'index :
// Paris/Lyon/Marseille interrogées par leur code commune (75056/69123/13055), que
// l'index ne connaît que par arrondissement.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const insee = searchParams.get("insee");

  if (!insee) {
    return NextResponse.json({ error: "Missing insee" }, { status: 400 });
  }

  const code = insee.trim();

  try {
    const entry = await getCommuneEntry(code);
    const categories = entry
      ? deriveCategoriesFromEntry(entry)
      : deriveCategories(code);
    const source = entry ? "index" : "dept_fallback";
    const partVoiture = entry?.mobilite?.part_voiture;
    const mobilite = typeof partVoiture === "number" && Number.isFinite(partVoiture)
      ? { partVoitureDomicileTravail: partVoiture }
      : null;

    return NextResponse.json(
      { insee: code, categories, source, mobilite },
      { headers: { "Cache-Control": "public, s-maxage=86400" } },
    );
  } catch {
    // Dernier filet : ne jamais casser le premier écran, retomber sur le département.
    return NextResponse.json(
      { insee: code, categories: deriveCategories(code), source: "error_fallback", mobilite: null },
      { status: 200 },
    );
  }
}
