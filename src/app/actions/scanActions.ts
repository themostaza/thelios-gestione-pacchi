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
                  media_type: 'image/jpeg',
                  data: base64Image,
                },
              },
              {
                type: 'text',
                text: 'READ AND TRANSCRIBE ALL TEXT FROM THIS IMAGE EXACTLY AS WRITTEN. DO NOT ADD ANY ADDITIONAL TEXT, COMMENTARY, DESCRIPTIONS, EXPLANATIONS, OR FORMATTING. RETURN ONLY THE RAW TEXT CONTENT FOUND IN THE IMAGE, NOTHING ELSE.',
              },
            ],
          },
        ],
        system:
          'You are a pure text extraction tool. Your ONLY function is to output the exact text visible in images. Never add explanations, descriptions, commentary, or formatting instructions. Never preface or conclude with any remarks. Output ONLY the text visible in the image, exactly as it appears, nothing more and nothing less.',
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
      text: extractedText,
    }
  } catch (error) {
    console.error('Error processing image:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : 'An unexpected error occurred',
    }
  }
}
