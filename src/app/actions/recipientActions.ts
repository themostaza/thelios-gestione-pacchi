'use server'

import { XMLParser } from 'fast-xml-parser' // You may need to install this package
import { cookies } from 'next/headers'

import { createClient } from '@/lib/supabase/server'

type Recipient = {
  name: string
  surname: string
  email: string
}

export async function searchRecipients(query: string) {
  // First get the recipients data
  const { recipients, created_at } = await getRecipients()

  // Then filter them
  const normalizedQuery = query.toLowerCase()
  const filteredRecipients = !normalizedQuery
    ? []
    : recipients.filter(
        (recipient) =>
          recipient.name.toLowerCase().includes(normalizedQuery) ||
          recipient.surname.toLowerCase().includes(normalizedQuery) ||
          (recipient.email ? recipient.email.toLowerCase().includes(normalizedQuery) : false)
      )

  return {
    recipients: filteredRecipients,
    created_at,
  }
}

export async function getRecipients(forceRefresh = false): Promise<{ recipients: Recipient[]; created_at: string | null }> {
  try {
    const supabase = createClient(cookies())

    // Check for most recent record in the recipient table
    const { data: latestRecord } = await supabase.from('recipient').select('*').order('created_at', { ascending: false }).limit(1).single()

    // Determine if we need to fetch new data
    const oneMonthAgo = new Date()
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)

    const needsFetch = forceRefresh || !latestRecord || new Date(latestRecord.created_at) < oneMonthAgo

    let recipientData
    let created_at = latestRecord?.created_at

    if (needsFetch) {
      // Fetch new data from the API
      const response = await fetch('https://theliosdev.it-cpi026-rt.cfapps.eu10-002.hana.ondemand.com/http/api_mail_list', {
        headers: {
          Authorization: process.env.THELIOS_API_KEY || '',
        },
      })

      if (!response.ok) {
        throw new Error(`API response error: ${response.status}`)
      }

      const xmlData = await response.text()

      // Parse XML to JSON
      const parser = new XMLParser()
      const parsedData = parser.parse(xmlData)

      // Extract just the items array before saving
      const items = parsedData?.['n0:Z_GET_EMPLOYEES_MAILSResponse']?.ET_MAIL_ADDRESS?.item || []
      const itemsArray = Array.isArray(items) ? items : [items]

      // Save to database
      const { data: savedRecord, error: saveError } = await supabase
        .from('recipient')
        .insert({
          data: itemsArray, // Save only the items array
          created_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (saveError) {
        console.error('Error saving recipient data:', saveError)
        throw saveError
      }

      recipientData = savedRecord.data
      created_at = savedRecord.created_at
    } else {
      // Use existing data
      recipientData = latestRecord.data
    }

    // Map to required format and filter out entries with empty email addresses
    return {
      recipients: recipientData.map((item: { NAME1: string; NAME2: string; SMTP_ADDR: string }) => ({
        name: item.NAME1,
        surname: item.NAME2,
        email: item.SMTP_ADDR || '',
      })),
      created_at,
    }
  } catch (error) {
    console.error('Error fetching recipients:', error)
    // Return empty array in case of error
    return {
      recipients: [],
      created_at: null,
    }
  }
}

export async function forceRefreshRecipients() {
  return getRecipients(true)
}
