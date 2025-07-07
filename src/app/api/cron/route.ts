import { NextRequest, NextResponse } from 'next/server'

import { sendAutomaticReminders } from '@/app/actions/deliveryActions'

export async function GET(request: NextRequest) {
  try {
    // Verify the request is from Vercel Cron
    const authHeader = request.headers.get('authorization')
    const expectedToken = process.env.CRON_SECRET_TOKEN

    if (!expectedToken) {
      console.error('CRON_SECRET_TOKEN not configured')
      return NextResponse.json({ error: 'Cron secret token not configured' }, { status: 500 })
    }

    if (authHeader !== `Bearer ${expectedToken}`) {
      console.error('Invalid authorization header for cron job')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const result = await sendAutomaticReminders()

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: result.message,
        data: result.data,
      })
    } else {
      console.error('Cron job failed:', result.message)
      return NextResponse.json(
        {
          success: false,
          error: result.message,
        },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Cron job error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    )
  }
}

// Optional: Add POST method for manual testing
export async function POST(request: NextRequest) {
  try {
    const result = await sendAutomaticReminders()

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: result.message,
        data: result.data,
      })
    } else {
      console.error('Manual cron job failed:', result.message)
      return NextResponse.json(
        {
          success: false,
          error: result.message,
        },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Manual cron job error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    )
  }
}
