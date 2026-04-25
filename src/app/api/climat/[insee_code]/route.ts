import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request: Request, { params }: { params: Promise<{ insee_code: string }> }) {
  // On ajoute "await" pour déballer la promesse des params
  const { insee_code } = await params;

  try {
    const filePath = path.join(process.cwd(), 'public', 'data_climat.json');
    const fileData = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(fileData);
    
    const result = data.find((d: any) => 
      String(d.insee_code).trim() === String(insee_code).trim()
    );
    
    return NextResponse.json(result || { error: "Commune non trouvée" });
  } catch (error) {
    return NextResponse.json({ error: "Erreur lecture fichier" }, { status: 500 });
  }
}