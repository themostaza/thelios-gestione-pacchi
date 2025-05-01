'use server'

import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'

export async function getDashboardMetrics(
  timePeriod = '30', 
  customStartDate?: Date, 
  customEndDate?: Date
) {
  try {
    const supabase = createClient(cookies())
    
    // Calculate the date range based on time period or custom dates
    let startDate: Date
    
    if (timePeriod === 'custom' && customStartDate && customEndDate) {
      startDate = new Date(customStartDate)
    } else if (timePeriod !== 'all') {
      startDate = new Date()
      startDate.setDate(startDate.getDate() - parseInt(timePeriod))
    } else {
      // For "all time", set a very old date
      startDate = new Date()
      startDate.setFullYear(2000)
    }
    
    // For custom range, we also need to use the end date in queries
    const endDate = timePeriod === 'custom' && customEndDate 
      ? new Date(customEndDate) 
      : new Date()
    
    // Add 1 day to include the full end date
    if (timePeriod === 'custom') {
      endDate.setDate(endDate.getDate() + 1)
    }
    
    // Get packages for selected period
    const periodQuery = supabase
      .from('delivery')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startDate.toISOString())
    
    // Add end date filter for custom ranges
    if (timePeriod === 'custom') {
      periodQuery.lte('created_at', endDate.toISOString())
    }
    
    const { count: totalPackagesPeriod, error: packagesPeriodError } = await periodQuery
    
    if (packagesPeriodError) throw packagesPeriodError
    
    // Calculate average processing time (in days) for selected period
    const processingQuery = supabase
      .from('delivery')
      .select('created_at, completed_at')
      .not('completed_at', 'is', null)
      .gte('created_at', startDate.toISOString())
    
    // Add end date filter for custom ranges
    if (timePeriod === 'custom') {
      processingQuery.lte('created_at', endDate.toISOString())
    }
    
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
    const usersQuery = supabase
      .from('delivery')
      .select('recipient_email')
      .not('recipient_email', 'is', null)
      .gte('created_at', startDate.toISOString())
    
    // Add end date filter for custom ranges
    if (timePeriod === 'custom') {
      usersQuery.lte('created_at', endDate.toISOString())
    }
    
    const { data: uniqueUsers, error: usersError } = await usersQuery
    
    if (usersError) throw usersError
    
    const uniqueEmails = new Set(uniqueUsers.map(u => u.recipient_email))
    const usersServed = uniqueEmails.size
    
    // Centralizzare la logica di filtro temporale in una funzione helper
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
    const statusQuery = supabase
      .from('delivery')
      .select('status')

    // Applica lo stesso filtro temporale utilizzato per i pacchi totali
    applyTimeFilter(statusQuery, startDate, timePeriod === 'custom' ? endDate : null, timePeriod)

    const { data: statusData, error: statusError } = await statusQuery

    if (statusError) throw statusError

    // Conteggio preciso degli stati usando gli oggetti direttamente
    let pendingCount = 0
    let cancelledCount = 0
    let completedCount = 0

    statusData.forEach(item => {
      if (item.status === 'pending') pendingCount++
      else if (item.status === 'cancelled') cancelledCount++
      else if (item.status === 'completed') completedCount++
    })

    const totalStatusCount = pendingCount + cancelledCount + completedCount || 1 // Evita divisione per zero

    // Calcolo percentuali con arrotondamento
    const statusDistribution = {
      pending: Math.round((pendingCount / totalStatusCount) * 100),
      cancelled: Math.round((cancelledCount / totalStatusCount) * 100),
      completed: Math.round((completedCount / totalStatusCount) * 100)
    }

    // Aggiusta le percentuali in caso non sommino a 100 a causa di arrotondamenti
    const totalPercentage = statusDistribution.pending + statusDistribution.cancelled + statusDistribution.completed
    if (totalPercentage !== 100 && totalStatusCount > 0) {
      // Aggiungi la differenza alla categoria maggiore
      if (pendingCount >= completedCount && pendingCount >= cancelledCount) {
        statusDistribution.pending += (100 - totalPercentage)
      } else if (completedCount >= pendingCount && completedCount >= cancelledCount) {
        statusDistribution.completed += (100 - totalPercentage)
      } else {
        statusDistribution.cancelled += (100 - totalPercentage)
      }
    }
    
    // Get packages received by day
    const packagesTimeQuery = supabase
      .from('delivery')
      .select('created_at')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true })
    
    // Add end date filter for custom ranges
    if (timePeriod === 'custom') {
      packagesTimeQuery.lte('created_at', endDate.toISOString())
    }
    
    const { data: packagesTimeData, error: packagesTimeError } = await packagesTimeQuery
    
    if (packagesTimeError) throw packagesTimeError
    
    // Get completed packages
    const completedTimeQuery = supabase
      .from('delivery')
      .select('completed_at')
      .gte('completed_at', startDate.toISOString())
      .not('completed_at', 'is', null)
      .order('completed_at', { ascending: true })
    
    // Add end date filter for custom ranges
    if (timePeriod === 'custom') {
      completedTimeQuery.lte('completed_at', endDate.toISOString())
    }
    
    const { data: completedTimeData, error: completedTimeError } = await completedTimeQuery
    
    if (completedTimeError) throw completedTimeError
    
    // Process the data to get counts per day for created packages
    const packagesPerDay: { [key: string]: number } = {}
    packagesTimeData.forEach(item => {
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
    completedTimeData.forEach(item => {
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
    const cancelledQuery = supabase
      .from('delivery')
      .select('created_at')
      .eq('status', 'cancelled')
      .gte('created_at', startDate.toISOString())

    // Add end date filter for custom ranges
    if (timePeriod === 'custom') {
      cancelledQuery.lte('created_at', endDate.toISOString())
    }

    const { data: cancelledPackages, error: cancelledError } = await cancelledQuery

    if (cancelledError) throw cancelledError

    // Process cancelled packages by day
    const cancelledPerDay: { [key: string]: number } = {}
    cancelledPackages.forEach(item => {
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
        cancelledValues: cancelledCounts
      }
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
        completed: 70
      },
      packageData: {
        labels: [],
        values: [],
        completedLabels: [],
        completedValues: [],
        cancelledLabels: [],
        cancelledValues: []
      }
    }
  }
} 