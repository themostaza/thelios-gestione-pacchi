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
  const normalizedQuery = query.toLowerCase().trim()
  const queryWords = normalizedQuery.split(/\s+/).filter((word) => word.length > 0)

  console.log(' Search Debug:', {
    originalQuery: query,
    normalizedQuery,
    queryWords,
    totalRecipients: recipients.length,
  })

  const filteredRecipients = !normalizedQuery
    ? []
    : recipients.filter((recipient) => {
        const fullName = `${recipient.name} ${recipient.surname}`.toLowerCase()

        // Se la query ha più parole, tutte devono essere trovate
        if (queryWords.length > 1) {
          const allWordsFound = queryWords.every(
            (word) =>
              recipient.name.toLowerCase().includes(word) ||
              recipient.surname.toLowerCase().includes(word) ||
              fullName.includes(word) ||
              (recipient.email ? recipient.email.toLowerCase().includes(word) : false)
          )

          console.log('🔍 Multi-word search:', {
            recipient: `${recipient.name} ${recipient.surname}`,
            queryWords,
            allWordsFound,
            nameMatch: queryWords.some((word) => recipient.name.toLowerCase().includes(word)),
            surnameMatch: queryWords.some((word) => recipient.surname.toLowerCase().includes(word)),
            fullNameMatch: queryWords.some((word) => fullName.includes(word)),
          })

          return allWordsFound
        }

        // Se la query è una singola parola, cerca normalmente
        const singleWordMatch =
          recipient.name.toLowerCase().includes(normalizedQuery) ||
          recipient.surname.toLowerCase().includes(normalizedQuery) ||
          fullName.includes(normalizedQuery) ||
          (recipient.email ? recipient.email.toLowerCase().includes(normalizedQuery) : false)

        console.log(' Single-word search:', {
          recipient: `${recipient.name} ${recipient.surname}`,
          query: normalizedQuery,
          match: singleWordMatch,
        })

        return singleWordMatch
      })

  console.log('🔍 Final results:', {
    query,
    foundCount: filteredRecipients.length,
    results: filteredRecipients.map((r) => `${r.name} ${r.surname}`),
  })

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
      const response = await fetch(process.env.THELIOS_API_MAIL_LIST_URL || '', {
        headers: {
          Authorization: process.env.THELIOS_API_KEY || '',
        },
      })

      if (!response.ok) {
        console.error('API response error:', await response.text())
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
  return await getRecipients(true)
}
