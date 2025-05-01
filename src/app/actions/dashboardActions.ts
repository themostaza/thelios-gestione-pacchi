'use server'

import { cookies } from 'next/headers'

import { createClient } from '@/lib/supabase/server'

export async function getDashboardMetrics(timePeriod = '30', customStartDate?: Date, customEndDate?: Date, year?: number) {
  try {
    const supabase = createClient(cookies())

    // Calculate the date range based on time period or custom dates
    let startDate: Date
    let endDate: Date

    // If year is specified and it's not the current year, set date range to that year
    const currentYear = new Date().getFullYear()
    const isSpecificYear = year !== undefined && year !== currentYear

    if (isSpecificYear) {
      // For previous years, use the entire year range
      startDate = new Date(year, 0, 1) // January 1st of specified year
      endDate = new Date(year, 11, 31, 23, 59, 59) // December 31st of specified year
    } else if (timePeriod === 'custom' && customStartDate && customEndDate) {
      startDate = new Date(customStartDate)
      endDate = new Date(customEndDate)
      // Add 1 day to include the full end date
      endDate.setDate(endDate.getDate() + 1)
    } else if (timePeriod !== 'all') {
      endDate = new Date()
      startDate = new Date()
      startDate.setDate(startDate.getDate() - parseInt(timePeriod))
    } else {
      // For "all time", set a very old date for current year or the specified year
      endDate = new Date()
      if (year) {
        // If year is specified but it's the current year, limit "all" to just this year
        startDate = new Date(year, 0, 1) // January 1st of specified year
      } else {
        startDate = new Date()
        startDate.setFullYear(2000)
      }
    }

    // Get packages for selected period
    const periodQuery = supabase.from('delivery').select('*', { count: 'exact', head: true }).gte('created_at', startDate.toISOString()).lte('created_at', endDate.toISOString()) // Always apply end date filter

    const { count: totalPackagesPeriod, error: packagesPeriodError } = await periodQuery

    if (packagesPeriodError) throw packagesPeriodError

    // Calculate average processing time (in days) for selected period
    const processingQuery = supabase.from('delivery').select('created_at, completed_at').not('completed_at', 'is', null).gte('created_at', startDate.toISOString())

    const { data: deliveries, error: deliveriesError } = await processingQuery

    if (deliveriesError) throw deliveriesError

    let avgProcessingTime = 0
    if (deliveries.length > 0) {
      const totalDays = deliveries.reduce((sum, delivery) => {
        const created = new Date(delivery.created_at)
        const completed = new Date(delivery.completed_at)
        const diffDays = (completed.getTime() - created.getTime()) / (1000 * 3600 * 24)
        return sum + diffDays
      }, 0)
      avgProcessingTime = parseFloat((totalDays / deliveries.length).toFixed(1))
    }

    // Count unique users served
    const usersQuery = supabase.from('delivery').select('recipient_email').not('recipient_email', 'is', null).gte('created_at', startDate.toISOString())

    const { data: uniqueUsers, error: usersError } = await usersQuery

    if (usersError) throw usersError

    const uniqueEmails = new Set(uniqueUsers.map((u) => u.recipient_email))
    const usersServed = uniqueEmails.size

    // Centralizzare la logica di filtro temporale in una funzione helper
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    function applyTimeFilter(query: any, startDate: Date, endDate: Date | null, timePeriod: string) {
      // Sempre applicare il filtro di data iniziale
      query.gte('created_at', startDate.toISOString())

      // Applicare il filtro di data finale se necessario
      if (timePeriod === 'custom' && endDate) {
        query.lte('created_at', endDate.toISOString())
      } else if (timePeriod !== 'all') {
        // Per periodi non "all", limita alla data corrente
        query.lte('created_at', new Date().toISOString())
      }

      return query
    }

    // Get status distribution - usa la query esattamente come per il conteggio pacchi totale
    // per garantire che i dati siano filtrati nello stesso modo
    const statusQuery = supabase.from('delivery').select('status')

    // Applica lo stesso filtro temporale utilizzato per i pacchi totali
    applyTimeFilter(statusQuery, startDate, timePeriod === 'custom' ? endDate : null, timePeriod)

    const { data: statusData, error: statusError } = await statusQuery

    if (statusError) throw statusError

    // Conteggio preciso degli stati usando gli oggetti direttamente
    let pendingCount = 0
    let cancelledCount = 0
    let completedCount = 0

    statusData.forEach((item) => {
      if (item.status === 'pending') pendingCount++
      else if (item.status === 'cancelled') cancelledCount++
      else if (item.status === 'completed') completedCount++
    })

    const totalStatusCount = pendingCount + cancelledCount + completedCount || 1 // Evita divisione per zero

    // Calcolo percentuali con arrotondamento
    const statusDistribution = {
      pending: Math.round((pendingCount / totalStatusCount) * 100),
      cancelled: Math.round((cancelledCount / totalStatusCount) * 100),
      completed: Math.round((completedCount / totalStatusCount) * 100),
    }

    // Aggiusta le percentuali in caso non sommino a 100 a causa di arrotondamenti
    const totalPercentage = statusDistribution.pending + statusDistribution.cancelled + statusDistribution.completed
    if (totalPercentage !== 100 && totalStatusCount > 0) {
      // Aggiungi la differenza alla categoria maggiore
      if (pendingCount >= completedCount && pendingCount >= cancelledCount) {
        statusDistribution.pending += 100 - totalPercentage
      } else if (completedCount >= pendingCount && completedCount >= cancelledCount) {
        statusDistribution.completed += 100 - totalPercentage
      } else {
        statusDistribution.cancelled += 100 - totalPercentage
      }
    }

    // Get packages received by day
    const packagesTimeQuery = supabase.from('delivery').select('created_at').gte('created_at', startDate.toISOString()).order('created_at', { ascending: true })

    // Add end date filter for custom ranges
    if (timePeriod === 'custom') {
      packagesTimeQuery.lte('created_at', endDate.toISOString())
    }

    const { data: packagesTimeData, error: packagesTimeError } = await packagesTimeQuery

    if (packagesTimeError) throw packagesTimeError

    // Get completed packages
    const completedTimeQuery = supabase.from('delivery').select('completed_at').gte('completed_at', startDate.toISOString()).not('completed_at', 'is', null).order('completed_at', { ascending: true })

    // Add end date filter for custom ranges
    if (timePeriod === 'custom') {
      completedTimeQuery.lte('completed_at', endDate.toISOString())
    }

    const { data: completedTimeData, error: completedTimeError } = await completedTimeQuery

    if (completedTimeError) throw completedTimeError

    // Process the data to get counts per day for created packages
    const packagesPerDay: { [key: string]: number } = {}
    packagesTimeData.forEach((item) => {
      const date = new Date(item.created_at)
      const dateStr = `${date.getDate()}/${date.getMonth() + 1}`

      if (packagesPerDay[dateStr]) {
        packagesPerDay[dateStr]++
      } else {
        packagesPerDay[dateStr] = 1
      }
    })

    // Process the data to get counts per day for completed packages
    const completedPerDay: { [key: string]: number } = {}
    completedTimeData.forEach((item) => {
      const date = new Date(item.completed_at)
      const dateStr = `${date.getDate()}/${date.getMonth() + 1}`

      if (completedPerDay[dateStr]) {
        completedPerDay[dateStr]++
      } else {
        completedPerDay[dateStr] = 1
      }
    })

    const packageDates = Object.keys(packagesPerDay)
    const packageCounts = Object.values(packagesPerDay)
    const completedDates = Object.keys(completedPerDay)
    const completedCounts = Object.values(completedPerDay)

    // Get status-specific packages by day
    const cancelledQuery = supabase.from('delivery').select('created_at').eq('status', 'cancelled').gte('created_at', startDate.toISOString())

    // Add end date filter for custom ranges
    if (timePeriod === 'custom') {
      cancelledQuery.lte('created_at', endDate.toISOString())
    }

    const { data: cancelledPackages, error: cancelledError } = await cancelledQuery

    if (cancelledError) throw cancelledError

    // Process cancelled packages by day
    const cancelledPerDay: { [key: string]: number } = {}
    cancelledPackages.forEach((item) => {
      const date = new Date(item.created_at)
      const dateStr = `${date.getDate()}/${date.getMonth() + 1}`

      if (cancelledPerDay[dateStr]) {
        cancelledPerDay[dateStr]++
      } else {
        cancelledPerDay[dateStr] = 1
      }
    })

    const cancelledDates = Object.keys(cancelledPerDay)
    const cancelledCounts = Object.values(cancelledPerDay)

    // Add new query to calculate average processing time by month
    const monthlyAvgQuery = supabase.from('delivery').select('created_at, completed_at').not('completed_at', 'is', null)

    // For monthly averages, we don't filter by time period to get all data

    const { data: monthlyDeliveries, error: monthlyError } = await monthlyAvgQuery

    if (monthlyError) throw monthlyError

    // Calculate average storage days by month
    const storageByMonth: { [key: string]: { total: number; count: number } } = {}
    const monthNames = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic']

    // Initialize all months with zero
    monthNames.forEach((_, index) => {
      storageByMonth[index] = { total: 0, count: 0 }
    })

    monthlyDeliveries.forEach((delivery) => {
      const created = new Date(delivery.created_at)
      const completed = new Date(delivery.completed_at)
      const diffDays = (completed.getTime() - created.getTime()) / (1000 * 3600 * 24)

      const month = created.getMonth() // 0-indexed month

      storageByMonth[month].total += diffDays
      storageByMonth[month].count++
    })

    // Calculate averages
    const monthlyAverages = monthNames.map((name, index) => {
      const data = storageByMonth[index]
      const average = data.count > 0 ? parseFloat((data.total / data.count).toFixed(1)) : 0
      return {
        month: name,
        average: average,
      }
    })

    return {
      totalPackages: totalPackagesPeriod || 0,
      avgProcessingTime: avgProcessingTime || 0,
      usersServed: usersServed || 0,
      statusDistribution: statusDistribution,
      packageData: {
        labels: packageDates,
        values: packageCounts,
        completedLabels: completedDates,
        completedValues: completedCounts,
        cancelledLabels: cancelledDates,
        cancelledValues: cancelledCounts,
      },
      monthlyStorageAverages: monthlyAverages,
    }
  } catch (error) {
    console.error('Error fetching dashboard metrics:', error)
    return {
      totalPackages: 0,
      avgProcessingTime: 0,
      usersServed: 0,
      statusDistribution: {
        pending: 15,
        cancelled: 15,
        completed: 70,
      },
      packageData: {
        labels: [],
        values: [],
        completedLabels: [],
        completedValues: [],
        cancelledLabels: [],
        cancelledValues: [],
      },
      monthlyStorageAverages: [],
    }
  }
}

// Add a new function to get available years
export async function getAvailableYears() {
  try {
    const supabase = createClient(cookies())

    // Query distinct years from created_at dates
    const { data, error } = await supabase.from('delivery').select('created_at').order('created_at', { ascending: false })

    if (error) throw error

    // Extract unique years from data
    const years = new Set<number>()
    data.forEach((item) => {
      const year = new Date(item.created_at).getFullYear()
      years.add(year)
    })

    // Convert to array and sort in descending order
    return Array.from(years).sort((a, b) => b - a)
  } catch (error) {
    console.error('Error fetching available years:', error)
    return [new Date().getFullYear()]
  }
}
