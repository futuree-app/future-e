// app/api/synthesize-logement/route.ts
import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

// ════════════════════════════════════════════════════════════════════════════
// CETTE ROUTE GÉNÈRE LA SYNTHÈSE NARRATIVE DU MODULE LOGEMENT
// — appelée à la demande depuis le bouton "Générer la lecture"
// — retourne un JSON structuré : verdict, signaux, lecture narrative, actions
// — registre éditorial futur•e strict (pas de tirets cadratin, vouvoiement,
//   pas d'em-dashes, pas de phrases IA-typiques, pas d'alarmisme)
// ════════════════════════════════════════════════════════════════════════════

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Le prompt système qui encode TOUTE la voix éditoriale futur•e.
// Tout changement de ton du produit doit passer par ce prompt.
const SYSTEM_PROMPT = `Tu es l'analyste éditorial de futur•e, un produit qui traduit les données publiques françaises (DPE, Géorisques, ATMO, ARS, INSEE) en lecture personnalisée pour des particuliers.

VOIX ÉDITORIALE — RÈGLES ABSOLUES
- Vouvoiement systématique. Jamais de tutoiement.
- Registre sobre, calme, lucide. JAMAIS d'alarmisme. JAMAIS de minimisation.
- Pas de tirets cadratin (—). Utilisez des deux-points, des virgules ou des points.
- Pas de phrases IA-typiques : "il convient de", "n'hésitez pas à", "il est important de", "dans le cadre de", "il s'agit de".
- Pas de superlatifs vides : "véritable enjeu", "défi majeur", "transformation profonde".
- Pas d'exclamations. Pas de questions rhétoriques.
- Citez les sources inline quand pertinent (ANSES, ACPR, Géorisques, ADEME, ATMO).
- Distinguez ce qui est observé, ce qui est modélisé et ce qui est incertain.

REGISTRE
- "Le problème n'est pas X, c'est Y" plutôt que "Attention, X est dangereux"
- "Ce signal est documenté" plutôt que "alerte critique"
- "À surveiller dans la durée" plutôt que "danger imminent"
- "Pression réglementaire à anticiper" plutôt que "interdiction à venir"

LECTURE PERSONNALISÉE — LE PRINCIPE
Une bonne lecture futur•e ne récite pas les chiffres. Elle dit :
- ce qui est convergent (plusieurs signaux pointent dans la même direction)
- ce qui est structurant (les facteurs qui déterminent les décisions)
- ce qui est secondaire (les facteurs qui méritent attention sans déterminer la décision)
- ce qui est calendré (les échéances qui transforment l'analyse en décision)

ACTIONS
Les actions ne sont jamais des injonctions. Elles ouvrent des questions précises et renvoient vers des ressources.

FORMAT DE SORTIE — STRICTEMENT JSON
Réponds UNIQUEMENT par un objet JSON valide, sans markdown, sans préambule. Format :

{
  "verdict": "Phrase synthétique de 10 à 18 mots qui caractérise la situation. Pas de superlatif.",
  "signals": [
    { "level": "good" | "medium" | "bad" | "warn", "text": "Phrase courte sur un signal précis" }
  ],
  "reading": "Texte narratif de 3 à 5 paragraphes, séparés par des sauts de ligne doubles (\\n\\n). Lecture personnalisée de la situation. Citez 2 à 4 sources inline.",
  "actions": [
    { "title": "Titre court", "description": "Description de 1 à 2 phrases", "href": "/savoir/slug-pertinent" }
  ]
}

Maximum 4 signaux et 4 actions.`;

export async function POST(req: NextRequest) {
  try {
    const { data } = await req.json();

    if (!data) {
      return NextResponse.json({ error: "Aucune donnée fournie." }, { status: 400 });
    }

    // Sérialise les données pertinentes pour réduire les tokens d'entrée.
    // Pas besoin d'envoyer toute la payload, on garde l'essentiel.
    const payload = {
      address: data.address?.label,
      altitude: data.altitude,
      dpe: data.dpe ? {
        etiquette: data.dpe.etiquette_dpe,
        ges: data.dpe.etiquette_ges,
        conso: data.dpe.conso_ep_m2,
        emissions: data.dpe.emission_ges_m2,
        surface: data.dpe.surface_m2,
        construction: data.dpe.annee_construction,
        type: data.dpe.type_batiment,
      } : null,
      audit: data.audit ? {
        scenarios_count: data.audit.scenarios?.length ?? 0,
      } : null,
      risks: [
        ...(data.georisques?.parcel?.risks?.labels ?? []),
        ...(data.georisques?.parcel?.pprn?.labels ?? []),
      ],
      seismic: data.georisques?.parcel?.seismic?.label,
      rga: data.georisques?.parcel?.rga?.label,
      zfe: data.zfe?.inZfe ? {
        zones: data.zfe.zones?.length ?? 0,
        first: data.zfe.zones?.[0]?.nom,
      } : null,
      atmo: data.atmo ? {
        index_label: data.atmo.index?.label,
        index_value: data.atmo.index?.value,
        date: data.atmo.date,
      } : null,
      water: data.eaufrance?.drinkingWater ? {
        bacterio_ok: data.eaufrance.drinkingWater.conformBacterio,
        physchem_ok: data.eaufrance.drinkingWater.conformPhysicoChem,
        nitrates: data.eaufrance.drinkingWater.nitrates,
      } : null,
      irep_count: data.irep?.count ?? 0,
      friches: data.cartofriches ? {
        count: data.cartofriches.count,
        polluted: data.cartofriches.friches?.some((f: { sol_pollue: boolean }) => f.sol_pollue) ?? false,
      } : null,
      commune: data.communeData?.commune ? {
        name: data.communeData.commune.nom,
        population: data.communeData.commune.population,
        passoires_pct: data.communeData.iris?.passoires_taux,
        precarite_pct: data.communeData.iris?.preca_energetique_pct,
      } : null,
    };

    const userMessage = `Voici les données publiques croisées pour cette adresse. Produisez la lecture personnalisée selon vos règles éditoriales.

DONNÉES :
${JSON.stringify(payload, null, 2)}

Rappel : JSON strict uniquement, sans markdown.`;

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 1500,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userMessage }],
    });

    // Extraire le texte de la réponse
    const textBlock = message.content.find(b => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return NextResponse.json({ error: "Réponse vide de l'API." }, { status: 500 });
    }

    // Parser le JSON. Si Claude renvoie du markdown malgré tout, on nettoie.
    let parsed;
    try {
      const cleaned = textBlock.text
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/, "")
        .replace(/```\s*$/, "")
        .trim();
      parsed = JSON.parse(cleaned);
    } catch {
      return NextResponse.json({
        error: "Réponse mal formée.",
        raw: textBlock.text,
      }, { status: 500 });
    }

    return NextResponse.json(parsed);

  } catch (err) {
    console.error("[synthesize-logement] error:", err);
    const message = err instanceof Error ? err.message : "Erreur serveur.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
