import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { estCodeOutremer } from '@/lib/outremer/code-outremer';

export async function GET(request: Request, { params }: { params: Promise<{ insee_code: string }> }) {
  // On ajoute "await" pour déballer la promesse des params
  const { insee_code } = await params;

  // Hotfix FUT-104 : les lignes ultramarines du fichier sont des points de grille métropolitains (cf. drias-json.ts).
  // Refusées AVANT la lecture du fichier, sans valeur de substitution.
  if (estCodeOutremer(insee_code)) {
    return NextResponse.json(
      { error: "Commune d'outre-mer : les projections DRIAS-TRACC ne couvrent pas ce territoire." },
      { status: 404 },
    );
  }

  try {
    const filePath = path.join(process.cwd(), 'public', 'data_climat.json');
    const fileData = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(fileData);
    
    const result = (data as { insee_code: unknown }[]).find((d) => 
      String(d.insee_code).trim() === String(insee_code).trim()
    );
    
    return NextResponse.json(result || { error: "Commune non trouvée" });
  } catch {
    return NextResponse.json({ error: "Erreur lecture fichier" }, { status: 500 });
  }
}