import { NextResponse } from 'next/server'

import { forceRefreshRecipients, getRecipients } from '@/app/actions/recipientActions'

export async function GET() {
  try {
    console.log('🧪 Test Recipients API - Starting...')
    
    // Test the regular getRecipients function
    const result = await getRecipients()
    
    console.log('🧪 Test Recipients API - Results:', {
      recipientsCount: result.recipients.length,
      created_at: result.created_at,
      sampleRecipients: result.recipients.slice(0, 3).map(r => ({
        name: r.name,
        surname: r.surname,
        email: r.email ? `${r.email.substring(0, 5)}...` : 'N/A'
      }))
    })

    return NextResponse.json({
      success: true,
      message: 'Recipients fetched successfully',
      data: {
        count: result.recipients.length,
        created_at: result.created_at,
        sample: result.recipients.slice(0, 5).map(r => ({
          name: r.name,
          surname: r.surname,
          email: r.email ? `${r.email.substring(0, 5)}...@${r.email.split('@')[1]}` : 'N/A'
        }))
      }
    })
  } catch (error) {
    console.error('🧪 Test Recipients API - Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    )
  }
}

// POST method to force refresh the recipients data
export async function POST() {
  try {
    console.log('🧪 Test Recipients API - Force refresh starting...')
    
    const result = await forceRefreshRecipients()
    
    console.log('🧪 Test Recipients API - Force refresh results:', {
      recipientsCount: result.recipients.length,
      created_at: result.created_at,
      sampleRecipients: result.recipients.slice(0, 3).map(r => ({
        name: r.name,
        surname: r.surname,
        email: r.email ? `${r.email.substring(0, 5)}...` : 'N/A'
      }))
    })

    return NextResponse.json({
      success: true,
      message: 'Recipients force refreshed successfully',
      data: {
        count: result.recipients.length,
        created_at: result.created_at,
        sample: result.recipients.slice(0, 5).map(r => ({
          name: r.name,
          surname: r.surname,
          email: r.email ? `${r.email.substring(0, 5)}...@${r.email.split('@')[1]}` : 'N/A'
        }))
      }
    })
  } catch (error) {
    console.error('🧪 Test Recipients API - Force refresh error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    )
  }
}