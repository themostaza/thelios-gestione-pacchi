'use client'

import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, BarElement } from 'chart.js'
import { format } from 'date-fns'
import { Package, Clock, CheckCircle, Users, X } from 'lucide-react'
import { CalendarIcon } from 'lucide-react'
import { useEffect, useState, useCallback } from 'react'
import { Pie, Bar } from 'react-chartjs-2'

import { getDashboardMetrics, getAvailableYears } from '@/app/actions/dashboardActions'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Card, CardContent } from '@/components/ui/card'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { useTranslation } from '@/i18n/I18nProvider'

import GenericCardView from './GenericCardView'

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, BarElement)

// Stat card component with support for empty state
function StatCard({ title, value, icon, hasData = true }: { title: string; value: string | number; icon: React.ReactNode; hasData?: boolean }) {
  const { t } = useTranslation()

  return (
    <Card>
      <CardContent className='pt-6'>
        <div className='text-gray-500 text-sm font-medium mb-1'>{title}</div>
        <div className='flex justify-between items-center'>
          <div>{hasData ? <div className='text-3xl font-bold'>{value}</div> : <div className='text-3xl font-medium text-gray-400'>{t('dashboard.noData')}</div>}</div>
          <div className='text-2xl opacity-80'>{icon}</div>
        </div>
      </CardContent>
    </Card>
  )
}

// Funzione per calcolare i valori reali del grafico a torta dai dati a barre
// Mettila come funzione normale nel componente Dashboard
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function calculatePieChartData(packagesData: any) {
  // Calcola i totali per ciascun tipo di pacchetto
  const totalReceived = packagesData.values.reduce((sum: number, val: number) => sum + val, 0)
  const totalCompleted = packagesData.completedValues.reduce((sum: number, val: number) => sum + val, 0)
  const totalCancelled = packagesData.cancelledValues.reduce((sum: number, val: number) => sum + val, 0)

  // I pacchi in attesa sono i ricevuti meno quelli completati e cancellati
  const totalPending = Math.max(0, totalReceived - totalCompleted - totalCancelled)

  // Calcola il totale complessivo (usa 1 se zero per evitare divisione per zero)
  const total = Math.max(totalPending + totalCompleted + totalCancelled, 1)

  // Calcola le percentuali
  let pending = Math.round((totalPending / total) * 100)
  let completed = Math.round((totalCompleted / total) * 100)
  let cancelled = Math.round((totalCancelled / total) * 100)

  // Assicurati che il totale sia 100%
  const totalPercent = pending + completed + cancelled
  if (totalPercent !== 100) {
    // Aggiungi la differenza alla categoria più grande
    if (totalPending >= totalCompleted && totalPending >= totalCancelled) {
      pending += 100 - totalPercent
    } else if (totalCompleted >= totalPending && totalCompleted >= totalCancelled) {
      completed += 100 - totalPercent
    } else {
      cancelled += 100 - totalPercent
    }
  }

  return {
    pending,
    completed,
    cancelled,
  }
}

// Update this function to ensure we get full month names
function aggregateChartData(
  labels: string[],
  values: number[],
  completedValues: number[],
  cancelledValues: number[],
  timePeriod: string,
  t: (key: string) => string // Translation function parameter
) {
  // Non aggregare per periodi brevi o personalizzati
  if (timePeriod === 'custom' || timePeriod === '1' || timePeriod === '7') {
    return { labels, values, completedValues, cancelledValues }
  }

  // Determina il tipo di aggregazione in base al periodo
  let aggregationType = 'week' // default per 30 giorni
  if (timePeriod === '90') aggregationType = 'month'
  if (timePeriod === '365' || timePeriod === 'all') aggregationType = 'month'

  // Inizializza array per i dati aggregati
  const aggregatedLabels: string[] = []
  const aggregatedValues: number[] = []
  const aggregatedCompletedValues: number[] = []
  const aggregatedCancelledValues: number[] = []

  if (aggregationType === 'week') {
    let weekTotal = 0
    let weekCompleted = 0
    let weekCancelled = 0
    let weekStartDate = ''
    let weekCount = 0

    labels.forEach((date, index) => {
      // Determina la settimana (assumendo che le date siano ordinate)
      if (weekCount === 0) {
        weekStartDate = date
      }

      weekTotal += values[index]
      weekCompleted += completedValues[index]
      weekCancelled += cancelledValues[index]
      weekCount++

      // Ogni 7 giorni o alla fine dell'array, crea un'aggregazione
      if (weekCount === 7 || index === labels.length - 1) {
        const weekLabel = `${weekStartDate} - ${date}`
        aggregatedLabels.push(weekLabel)
        aggregatedValues.push(weekTotal)
        aggregatedCompletedValues.push(weekCompleted)
        aggregatedCancelledValues.push(weekCancelled)

        // Reset per la prossima settimana
        weekTotal = 0
        weekCompleted = 0
        weekCancelled = 0
        weekCount = 0
      }
    })
  } else if (aggregationType === 'month') {
    // Aggrega per mese
    const monthData: { [key: string]: { total: number; completed: number; cancelled: number } } = {}

    labels.forEach((date, index) => {
      // Estrai mese dalla data (formato: "DD/MM")
      const parts = date.split('/')
      const month = parts[1]

      // Inizializza il mese se non esiste
      if (!monthData[month]) {
        monthData[month] = { total: 0, completed: 0, cancelled: 0 }
      }

      // Aggiungi i valori
      monthData[month].total += values[index]
      monthData[month].completed += completedValues[index]
      monthData[month].cancelled += cancelledValues[index]
    })

    // Converti in formato array, ordinando per mese
    const months = Object.keys(monthData).sort((a, b) => parseInt(a) - parseInt(b))

    // Map of month numbers to full translation keys
    const monthToKey: { [key: string]: string } = {
      '1': 'jan',
      '2': 'feb',
      '3': 'mar',
      '4': 'apr',
      '5': 'may',
      '6': 'jun',
      '7': 'jul',
      '8': 'aug',
      '9': 'sep',
      '10': 'oct',
      '11': 'nov',
      '12': 'dec',
    }

    months.forEach((month) => {
      // Get the proper translation key for this month
      const monthKey = monthToKey[month]

      // Get full month name from translation file
      let fullMonthName = month
      if (monthKey) {
        fullMonthName = t(`dashboard.months.${monthKey}`)
        // Debug to see what we're getting
        console.log(`Month ${month} maps to key ${monthKey}, translated as: ${fullMonthName}`)
      }

      aggregatedLabels.push(fullMonthName)
      aggregatedValues.push(monthData[month].total)
      aggregatedCompletedValues.push(monthData[month].completed)
      aggregatedCancelledValues.push(monthData[month].cancelled)
    })
  }

  return {
    labels: aggregatedLabels,
    values: aggregatedValues,
    completedValues: aggregatedCompletedValues,
    cancelledValues: aggregatedCancelledValues,
  }
}

// Improve this helper function to be more comprehensive
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function hasPackageData(data: any): boolean {
  if (!data) return false

  // Check if any of the key metrics indicate data exists
  const hasPackages = data.totalPackages > 0
  const hasUsers = data.usersServed > 0
  const hasChartData = data.packageData.values.some((v: number) => v > 0) || data.packageData.completedValues.some((v: number) => v > 0) || data.packageData.cancelledValues.some((v: number) => v > 0)

  // For time periods with no packages, both packages and users should be 0
  if (!hasChartData && (hasPackages || hasUsers)) {
    console.warn('Inconsistency detected: Chart shows no data but metrics show values')
    return false
  }

  return hasChartData || hasPackages
}

// Add this function to create a stat card skeleton
function StatCardSkeleton() {
  return (
    <Card>
      <CardContent className='pt-6'>
        <Skeleton className='h-4 w-24 mb-3' />
        <div className='flex justify-between items-center'>
          <Skeleton className='h-8 w-16' />
          <Skeleton className='h-6 w-6 rounded-full' />
        </div>
      </CardContent>
    </Card>
  )
}

// Add this function to create a chart skeleton
function ChartSkeleton() {
  return (
    <Card className='w-full'>
      <CardContent className='pt-6 p-2'>
        <Skeleton className='h-6 w-32 mb-6' />
        <div className='w-full h-[350px] flex items-center justify-center'>
          <Skeleton className='h-[300px] w-full' />
        </div>
      </CardContent>
    </Card>
  )
}

export default function Dashboard() {
  const { t } = useTranslation()
  const [timePeriod, setTimePeriod] = useState('30') // Default to 30 days
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear()) // Default to current year
  const [availableYears, setAvailableYears] = useState<number[]>([])
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to?: Date | undefined }>({ from: undefined, to: undefined })
  const [isCustomRange, setIsCustomRange] = useState(false)

  const [metrics, setMetrics] = useState<{
    totalPackages: number
    avgProcessingTime: number
    usersServed: number
    statusDistribution: {
      pending: number
      cancelled: number
      completed: number
    }
    monthlyStorageAverages: Array<{ month: string; average: number }>
  }>({
    totalPackages: 0,
    avgProcessingTime: 0,
    usersServed: 0,
    statusDistribution: {
      pending: 15,
      cancelled: 15,
      completed: 70,
    },
    monthlyStorageAverages: [], // Now properly typed as Array<{month: string; average: number}>
  })
  const [loading, setLoading] = useState(true)

  const [packagesData, setPackagesData] = useState<{
    labels: string[]
    values: number[]
    completedLabels: string[]
    completedValues: number[]
    cancelledValues: number[]
  }>({
    labels: [],
    values: [],
    completedLabels: [],
    completedValues: [],
    cancelledValues: [],
  })

  // Check if selected year is current year
  const currentYear = new Date().getFullYear()
  const isCurrentYear = selectedYear === currentYear

  // Memoize the aggregateChartData function call to avoid dependency issues
  const processChartData = useCallback(
    (allDates: string[], receivedValues: number[], completedValues: number[], cancelledValues: number[]) => {
      return aggregateChartData(allDates, receivedValues, completedValues, cancelledValues, isCustomRange ? 'custom' : timePeriod, t)
    },
    [isCustomRange, timePeriod, t]
  )

  // Fetch available years on initial load
  useEffect(() => {
    async function fetchAvailableYears() {
      const years = await getAvailableYears()
      setAvailableYears(years)

      // If no year is selected yet, set to most recent
      if (years.length > 0 && !selectedYear) {
        setSelectedYear(years[0])
      }
    }

    fetchAvailableYears()
  }, [selectedYear])

  useEffect(() => {
    async function loadMetrics() {
      try {
        setLoading(true)

        // Make sure we're using the correct year parameter
        // This ensures data filtering is specifically for the selected year
        let data
        if (isCustomRange && dateRange.from && dateRange.to) {
          data = await getDashboardMetrics('custom', dateRange.from, dateRange.to, selectedYear)
        } else {
          const effectiveTimePeriod = !isCurrentYear ? 'all' : timePeriod
          data = await getDashboardMetrics(effectiveTimePeriod, undefined, undefined, selectedYear)
        }

        console.log(`Loading data for year: ${selectedYear}, period: ${isCurrentYear ? timePeriod : 'all'}`)

        // Log the data received for debugging
        console.log('Dashboard metrics received:', data)

        // Check if we have actual data for the period
        const hasData = hasPackageData(data)

        // If no data, set consistent zero values for ALL metrics
        if (!hasData) {
          console.log('No data detected for this period, showing empty state')
          setMetrics({
            totalPackages: 0,
            avgProcessingTime: 0,
            usersServed: 0,
            statusDistribution: {
              pending: 0,
              cancelled: 0,
              completed: 0,
            },
            monthlyStorageAverages: [],
          })

          // Set empty chart data
          setPackagesData({
            labels: [],
            values: [],
            completedLabels: [],
            completedValues: [],
            cancelledValues: [],
          })
        } else {
          // Verifica che la distribuzione degli stati sia presente e corretta
          if (!data.statusDistribution || (data.statusDistribution.pending === 0 && data.statusDistribution.cancelled === 0 && data.statusDistribution.completed === 0 && data.totalPackages > 0)) {
            console.warn('Status distribution data appears incorrect, recalculating locally...')

            // Se abbiamo pacchi ma nessuna distribuzione di stati, calcola localmente
            // basandoci sui dati dei grafici
            const localPending =
              data.packageData.values.reduce((sum: number, val: number) => sum + val, 0) -
              data.packageData.completedValues.reduce((sum: number, val: number) => sum + val, 0) -
              data.packageData.cancelledValues.reduce((sum: number, val: number) => sum + val, 0)

            const localCompleted = data.packageData.completedValues.reduce((sum: number, val: number) => sum + val, 0)
            const localCancelled = data.packageData.cancelledValues.reduce((sum: number, val: number) => sum + val, 0)

            const total = Math.max(localPending + localCompleted + localCancelled, 1)

            data.statusDistribution = {
              pending: Math.round((localPending / total) * 100),
              completed: Math.round((localCompleted / total) * 100),
              cancelled: Math.round((localCancelled / total) * 100),
            }

            // Assicurati che il totale sia 100%
            const totalPercent = data.statusDistribution.pending + data.statusDistribution.completed + data.statusDistribution.cancelled
            if (totalPercent !== 100) {
              // Aggiungi la differenza alla categoria più grande
              if (localPending >= localCompleted && localPending >= localCancelled) {
                data.statusDistribution.pending += 100 - totalPercent
              } else if (localCompleted >= localPending && localCompleted >= localCancelled) {
                data.statusDistribution.completed += 100 - totalPercent
              } else {
                data.statusDistribution.cancelled += 100 - totalPercent
              }
            }
          }

          setMetrics(data)

          // Generate all dates in the selected period
          let allDates: string[] = []

          // Calculate start and end dates based on selected period
          const endDate = new Date()
          let startDate: Date

          if (isCustomRange && dateRange.from && dateRange.to) {
            startDate = new Date(dateRange.from)
            const customEndDate = new Date(dateRange.to)
            // Non aggiungere il giorno extra, includi solo fino alla data finale
            endDate.setTime(customEndDate.getTime())
          } else if (timePeriod !== 'all') {
            startDate = new Date()
            startDate.setDate(startDate.getDate() - parseInt(timePeriod) + 1) // +1 per includere oggi ma non il giorno extra
          } else {
            // For "all time", use the dates we have in the data
            startDate = endDate
            allDates = [...data.packageData.labels].sort((a, b) => {
              const [dayA, monthA] = a.split('/').map(Number)
              const [dayB, monthB] = b.split('/').map(Number)
              if (monthA !== monthB) return monthA - monthB
              return dayA - dayB
            })
          }

          // Generate all dates in the range if not "all time"
          if (timePeriod !== 'all' || (isCustomRange && dateRange.from && dateRange.to)) {
            // Clone the start date to avoid modifying it
            const currentDate = new Date(startDate.getTime())

            // Include solo i giorni nel range effettivo, non andare oltre la fine
            while (currentDate <= endDate) {
              const dateStr = `${currentDate.getDate()}/${currentDate.getMonth() + 1}`
              allDates.push(dateStr)
              currentDate.setDate(currentDate.getDate() + 1)
            }
          }

          // Initialize values arrays with zeros for all dates
          const receivedValues = Array(allDates.length).fill(0)
          const completedValues = Array(allDates.length).fill(0)
          const cancelledValues = Array(allDates.length).fill(0)

          // Fill in actual values where we have data
          data.packageData.labels.forEach((date: string, index: number) => {
            const dateIndex = allDates.indexOf(date)
            if (dateIndex !== -1) {
              receivedValues[dateIndex] = data.packageData.values[index]
            }
          })

          data.packageData.completedLabels.forEach((date: string, index: number) => {
            const dateIndex = allDates.indexOf(date)
            if (dateIndex !== -1) {
              completedValues[dateIndex] = data.packageData.completedValues[index]
            }
          })

          if (data.packageData.cancelledLabels) {
            data.packageData.cancelledLabels.forEach((date: string, index: number) => {
              const dateIndex = allDates.indexOf(date)
              if (dateIndex !== -1) {
                cancelledValues[dateIndex] = data.packageData.cancelledValues[index]
              }
            })
          }

          // Prima dell'aggregazione, salva i dati non aggregati
          const rawData = {
            labels: allDates,
            values: receivedValues,
            completedLabels: allDates,
            completedValues: completedValues,
            cancelledValues: cancelledValues,
          }

          // Use the memoized function
          const aggregated = processChartData(allDates, receivedValues, completedValues, cancelledValues)

          console.log('Month labels after aggregation:', aggregated.labels)

          // Aggiorna con i dati aggregati
          setPackagesData({
            labels: aggregated.labels,
            values: aggregated.values,
            completedLabels: aggregated.labels,
            completedValues: aggregated.completedValues,
            cancelledValues: aggregated.cancelledValues,
          })

          // Calcola i valori corretti per la torta dai dati non aggregati
          // (i dati della torta dovrebbero essere basati sui totali, non sui dati aggregati)
          const correctDistribution = calculatePieChartData(rawData)

          // Aggiorna i dati delle metriche con la distribuzione corretta
          setMetrics((prevMetrics) => ({
            ...prevMetrics,
            statusDistribution: correctDistribution,
          }))
        }
      } catch (error) {
        console.error('Failed to load metrics:', error)
      } finally {
        setLoading(false)
      }
    }

    // Only load metrics if we have a selected year
    if (selectedYear) {
      loadMetrics()
    }

    // If year changes and it's not the current year, force time period to "all"
    if (!isCurrentYear && timePeriod !== 'all') {
      setTimePeriod('all')
      setIsCustomRange(false)
    }
  }, [timePeriod, dateRange, isCustomRange, selectedYear, isCurrentYear, processChartData])

  // Define hasData checks for each metric independently
  const hasPackages = metrics.totalPackages > 0
  const hasProcessingTimeData = metrics.avgProcessingTime > 0
  const hasUsersData = metrics.usersServed > 0
  const hasStatusData = Object.values(metrics.statusDistribution).some((value) => value > 0)
  const hasChartData = packagesData.values.some((v) => v > 0) || packagesData.completedValues.some((v) => v > 0) || packagesData.cancelledValues.some((v) => v > 0)
  const hasStorageData = metrics.monthlyStorageAverages?.some((item) => item.average > 0)

  // Prepare chart data with empty data if no data is available
  const chartData = {
    labels: [
      t('deliveries.statusText.pending'),
      t('deliveries.statusText.cancelled'),
      t('deliveries.statusText.completed')
    ],
    datasets: [
      {
        data: hasStatusData ? [metrics.statusDistribution.pending, metrics.statusDistribution.cancelled, metrics.statusDistribution.completed] : [],
        backgroundColor: [
          '#F59E0B', // yellow for pending
          '#F87171', // red for cancelled
          '#10B981', // green for completed
        ],
        borderWidth: 0,
      },
    ],
  }

  const chartOptions = {
    plugins: {
      legend: {
        display: true,
        position: 'bottom' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12,
          },
        },
      },
      tooltip: {
        callbacks: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          label: function (context: any) {
            return `${context.label}: ${context.raw}%`
          },
        },
      },
    },
    maintainAspectRatio: true,
  }

  // Line chart data for packages received
  const barChartData = {
    labels: packagesData.labels,
    datasets: [
      {
        label: t('dashboard.packagesReceived'),
        data: packagesData.values,
        backgroundColor: 'rgba(59, 130, 246, 0.7)', // blue-500 con opacità
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 1,
      },
      {
        label: t('dashboard.packagesCompleted'),
        data: packagesData.completedValues,
        backgroundColor: 'rgba(16, 185, 129, 0.7)', // green-500 con opacità
        borderColor: 'rgb(16, 185, 129)',
        borderWidth: 1,
      },
      {
        label: t('dashboard.packagesCancelled'),
        data: packagesData.cancelledValues,
        backgroundColor: 'rgba(239, 68, 68, 0.7)', // red-500 con opacità
        borderColor: 'rgb(239, 68, 68)',
        borderWidth: 1,
      },
    ],
  }

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0,
        },
      },
      x: {
        ticks: {
          maxRotation: 45,
          minRotation: 45,
        },
      },
    },
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
    },
  }

  // Helper for date picker display
  const formatDateRange = () => {
    if (dateRange.from && dateRange.to) {
      return `${format(dateRange.from, 'PP')} - ${format(dateRange.to, 'PP')}`
    }
    return t('dashboard.selectDateRange')
  }

  // Add data preparation for monthly storage averages chart
  const monthlyStorageData = {
    labels: metrics.monthlyStorageAverages?.map((item) => item.month) || [],
    datasets: [
      {
        label: t('dashboard.averageStorageDays'),
        data: metrics.monthlyStorageAverages?.map((item) => item.average) || [],
        backgroundColor: 'rgba(245, 158, 11, 0.8)', // amber color
        borderColor: 'rgb(245, 158, 11)',
        borderWidth: 1,
      },
    ],
  }

  const monthlyStorageOptions = {
    responsive: true,
    maintainAspectRatio: true,
    scales: {
      y: {
        beginAtZero: true,
        suggestedMax: 4, // Set max based on your data
      },
      x: {
        ticks: {
          maxRotation: 0,
          minRotation: 0,
        },
      },
    },
    plugins: {
      legend: {
        display: false, // Hide legend for cleaner look
      },
      title: {
        display: true,
        text: t('dashboard.averageStorageDays'),
        font: {
          size: 14,
        },
      },
    },
  }

  return (
    <GenericCardView
      title={t('dashboard.title')}
      description={t('dashboard.description')}
      useScrollArea={true}
    >
      <div className='p-4 flex flex-wrap gap-6 items-center'>
        {/* Year selector with dynamic years */}
        <Select
          value={selectedYear?.toString() || ''}
          onValueChange={(value) => setSelectedYear(parseInt(value))}
        >
          <SelectTrigger className='w-[150px]'>
            <SelectValue placeholder={t('dashboard.selectYear')} />
          </SelectTrigger>
          <SelectContent>
            {availableYears.map((year) => (
              <SelectItem
                key={year}
                value={year.toString()}
              >
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Period selector - disabled for previous years */}
        <Select
          value={isCustomRange ? 'custom' : timePeriod}
          onValueChange={(value) => {
            if (value === 'custom') {
              setIsCustomRange(true)
            } else {
              setIsCustomRange(false)
              setTimePeriod(value)
            }
          }}
          disabled={!isCurrentYear}
        >
          <SelectTrigger className='w-[200px]'>
            <SelectValue placeholder={`${t('dashboard.period')}: ${isCurrentYear ? t('dashboard.last30Days') : t('dashboard.allTime')}`} />
          </SelectTrigger>
          <SelectContent>
            {isCurrentYear ? (
              <>
                <SelectItem value='1'>{t('dashboard.lastDay')}</SelectItem>
                <SelectItem value='7'>{t('dashboard.last7Days')}</SelectItem>
                <SelectItem value='30'>{t('dashboard.last30Days')}</SelectItem>
                <SelectItem value='90'>{t('dashboard.last90Days')}</SelectItem>
                <SelectItem value='365'>{t('dashboard.last12Months')}</SelectItem>
                <SelectItem value='custom'>{t('dashboard.customDateRange')}</SelectItem>
              </>
            ) : (
              <SelectItem value='all'>{t('dashboard.allTime')}</SelectItem>
            )}
            <SelectItem value='all'>{t('dashboard.allTime')}</SelectItem>
          </SelectContent>
        </Select>

        {/* Date range picker - only for current year */}
        {isCurrentYear && isCustomRange && (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant='outline'
                className='w-[300px] justify-start text-left font-normal'
              >
                <CalendarIcon className='mr-2 h-4 w-4' />
                {formatDateRange()}
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className='w-auto p-0'
              align='start'
            >
              <Calendar
                mode='range'
                selected={dateRange}
                onSelect={(range) => {
                  setDateRange(range || { from: undefined, to: undefined })
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        )}
      </div>

      {loading ? (
        <div className='p-4 flex flex-col gap-6'>
          {/* First row skeleton */}
          <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </div>

          {/* Second row skeleton */}
          <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </div>

          {/* Charts section skeleton */}
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <ChartSkeleton />
            <ChartSkeleton />
          </div>

          {/* Monthly storage chart skeleton */}
          <div>
            <ChartSkeleton />
          </div>
        </div>
      ) : (
        <div className='p-4 flex flex-col gap-6'>
          {/* First row: Total packages, average storage time, and employees served */}
          <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
            <StatCard
              title={t('dashboard.totalPackages')}
              value={metrics.totalPackages}
              icon={<Package className='h-6 w-6 text-blue-500' />}
              hasData={hasPackages}
            />
            <StatCard
              title={t('dashboard.averageStorageTime')}
              value={`${metrics.avgProcessingTime} ${t('dashboard.days')}`}
              icon={<Clock className='h-6 w-6 text-blue-500' />}
              hasData={hasProcessingTimeData}
            />
            <StatCard
              title={t('dashboard.employeesServed')}
              value={metrics.usersServed}
              icon={<Users className='h-6 w-6 text-purple-500' />}
              hasData={hasUsersData}
            />
          </div>

          {/* Second row: Status cards with conditional rendering */}
          <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
            <StatCard
              title={t('dashboard.pendingRate')}
              value={`${metrics.statusDistribution.pending}%`}
              icon={<Clock className='h-6 w-6 text-orange-500' />}
              hasData={hasStatusData}
            />
            <StatCard
              title={t('dashboard.completionRate')}
              value={`${metrics.statusDistribution.completed}%`}
              icon={<CheckCircle className='h-6 w-6 text-green-500' />}
              hasData={hasStatusData}
            />
            <StatCard
              title={t('dashboard.cancellationRate')}
              value={`${metrics.statusDistribution.cancelled}%`}
              icon={<X className='h-6 w-6 text-red-500' />}
              hasData={hasStatusData}
            />
          </div>

          {/* Charts section with conditional rendering */}
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            {/* Bar chart for packages received */}
            <Card className='w-full'>
              <CardContent className='pt-6 p-2'>
                <h3 className='text-lg font-medium mb-4 px-2'>{t('dashboard.packagesReceived')}</h3>
                <div className='w-full h-[350px] flex items-center justify-center'>
                  {hasChartData ? (
                    <Bar
                      data={barChartData}
                      options={barChartOptions}
                    />
                  ) : (
                    <div className='flex flex-col items-center justify-center text-gray-400'>
                      <div className='text-lg'>{t('dashboard.noChartData')}</div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Pie chart for status distribution */}
            <Card className='w-full'>
              <CardContent className='pt-6'>
                <h3 className='text-lg font-medium mb-4'>{t('dashboard.statusDistribution')}</h3>
                <div className='w-full h-[350px] flex items-center justify-center'>
                  {hasStatusData ? (
                    <div className='w-full h-full p-4'>
                      <Pie
                        data={chartData}
                        options={chartOptions}
                      />
                    </div>
                  ) : (
                    <div className='flex flex-col items-center justify-center text-gray-400'>
                      <div className='text-lg'>{t('dashboard.noChartData')}</div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Monthly storage chart with conditional rendering */}
          <div>
            <Card className='w-full'>
              <CardContent className='pt-6 p-2'>
                <h3 className='text-lg font-medium mb-4 px-2'>{t('dashboard.monthlyStorageAverage')}</h3>
                <div className='w-full h-[350px] flex items-center justify-center'>
                  {hasStorageData ? (
                    <Bar
                      data={monthlyStorageData}
                      options={{
                        ...monthlyStorageOptions,
                        maintainAspectRatio: false,
                      }}
                    />
                  ) : (
                    <div className='flex flex-col items-center justify-center text-gray-400'>
                      <div className='text-lg'>{t('dashboard.noChartData')}</div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </GenericCardView>
  )
}
