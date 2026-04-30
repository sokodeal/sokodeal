import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import Tesseract from 'tesseract.js';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const imageFile = formData.get('idCard') as File;
    const userId = formData.get('userId') as string;

    if (!imageFile || !userId) {
      return NextResponse.json({ error: "Données manquantes" }, { status: 400 });
    }

    const arrayBuffer = await imageFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Analyse de l'image
    const { data: { text } } = await Tesseract.recognize(buffer, 'eng+fra');
    const textOnCard = text.toUpperCase();

    // Recherche dans la table users
    const { data: profile, error } = await supabase
      .from('users')
      .select('full_name')
      .eq('id', userId)
      .single();

    if (error || !profile?.full_name) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    const nameToFind = profile.full_name.toUpperCase();

    // Comparaison
    if (textOnCard.includes(nameToFind)) {
      await supabase
        .from('users')
        .update({ 
          is_verified: true,
          id_verification_status: 'verified' 
        })
        .eq('id', userId);

      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ 
        success: false, 
        message: `Le nom '${nameToFind}' n'a pas été détecté.` 
      }, { status: 400 });
    }

  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erreur technique" }, { status: 500 });
  }
}