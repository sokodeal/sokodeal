import { NextRequest, NextResponse } from 'next/server'
import Tesseract from 'tesseract.js'

function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // enleve les accents
    .replace(/[^a-z\s]/g, '') // garde seulement lettres et espaces
    .trim()
}

function namesMatch(docText: string, userName: string): boolean {
  const normalizedDoc = normalizeName(docText)
  const normalizedUser = normalizeName(userName)

  // Diviser le nom utilisateur en mots
  const userWords = normalizedUser.split(/\s+/).filter(w => w.length > 2)

  // Verifier que chaque mot du nom utilisateur apparait dans le texte du document
  const matchCount = userWords.filter(word => normalizedDoc.includes(word)).length

  // Au moins 60% des mots doivent correspondre
  return matchCount >= Math.ceil(userWords.length * 0.6)
}

export async function POST(req: NextRequest) {
  try {
    const { imageBase64, mediaType, userName } = await req.json()

    if (!imageBase64 || !userName) {
      return NextResponse.json({ verified: false, reason: 'Donnees manquantes' })
    }

    if (normalizeName(userName).split(/\s+/).filter(w => w.length > 2).length === 0) {
      return NextResponse.json({ verified: false, reason: 'Nom de profil trop court ou invalide' })
    }

    // Convertir base64 en Buffer
    const imageBuffer = Buffer.from(imageBase64, 'base64')

    // OCR avec Tesseract
    const { data: { text } } = await Tesseract.recognize(
      imageBuffer,
      'fra+eng', // français + anglais
      {
        logger: () => {}, // silence les logs
      }
    )

    if (!text || text.trim().length < 10) {
      return NextResponse.json({
        verified: false,
        reason: 'Impossible de lire le document. Assurez-vous que la photo est nette et bien eclairee.'
      })
    }

    const verified = namesMatch(text, userName)

    return NextResponse.json({
      verified,
      name_on_document: text.substring(0, 200),
      reason: verified
        ? 'Nom trouve sur le document'
        : 'Le nom sur le document ne correspond pas au nom de votre profil. Verifiez que votre nom complet est correctement saisi.'
    })

  } catch (err) {
    console.error('Verify identity error:', err)
    return NextResponse.json({
      verified: false,
      reason: 'Erreur lors de la lecture du document. Reessayez avec une image plus nette.'
    })
  }
}