'use server'

import { cookies } from 'next/headers'

import { createClient } from '@/lib/supabase/server'

type ScanResult = {
  success: boolean
  text?: string
  message?: string
}

export async function extractTextFromImage(formData: FormData): Promise<ScanResult> {
  try {
    const image = formData.get('image') as File

    if (!image) {
      return {
        success: false,
        message: 'No image provided',
      }
    }

    // Ensure user is authenticated
    const supabase = createClient(cookies())
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return {
        success: false,
        message: 'Authentication required to process images',
      }
    }

    // Read the image file
    const bytes = await image.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Convert to base64 for API requests
    const base64Image = buffer.toString('base64')

    // Determine the correct media type
    const mediaType = image.type || 'image/jpeg'

    // Call Anthropic API to process the image
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY || '',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-opus-20240229',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: mediaType,
                  data: base64Image,
                },
              },
              {
                type: 'text',
                text: `Analizza questa immagine e cerca:
1. Un indirizzo email (completo o parziale - se trovi una mail parziale considerala valida a meno che non ci siano altre mail complete)
2. Un nome e cognome (il cognome sarà probabilmente vicino al nome)

Se trovi un'email (completa o parziale), restituisci SOLO l'email.
Se non trovi un'email ma trovi un nome e cognome, restituisci "nome cognome".
Se trovi solo un nome (senza cognome), restituisci solo il nome.

Restituisci SOLO la stringa richiesta, senza spiegazioni, commenti o formattazione aggiuntiva.`,
              },
            ],
          },
        ],
        system:
          'Sei un tool di estrazione di informazioni specifiche. La tua unica funzione è restituire l\'email se presente, altrimenti "nome cognome" o solo il nome. Non aggiungere mai spiegazioni, descrizioni, commenti o formattazione. Restituisci SOLO la stringa richiesta.',
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(`API error: ${errorData.error?.message || response.statusText}`)
    }

    const result = await response.json()
    const extractedText = result.content[0]?.text

    if (!extractedText) {
      return {
        success: false,
        message: 'Failed to extract text from the image',
      }
    }

    // Log the extraction for audit purposes
    await supabase.from('scan_logs').insert({
      user_id: user.id,
      image_size: image.size,
      filename: image.name,
      extracted_text: extractedText,
      created_at: new Date().toISOString(),
    })

    return {
      success: true,
      text: extractedText.trim(),
    }
  } catch (error) {
    console.error('Error processing image:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : 'An unexpected error occurred',
    }
  }
}
