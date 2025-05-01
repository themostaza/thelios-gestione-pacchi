'use client'

import { useEffect, useState } from 'react'
import GenericCardView from './GenericCardView'
import { getDashboardMetrics, getAvailableYears } from '@/app/actions/dashboardActions'
import { Package, Clock, CheckCircle, Users, X } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Pie, Bar } from 'react-chartjs-2'
import { 
  Chart as ChartJS, 
  ArcElement, 
  Tooltip, 
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement
} from 'chart.js'
import { useTranslation } from '@/i18n/I18nProvider'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

// Register Chart.js components
ChartJS.register(
  ArcElement, 
  Tooltip, 
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement
)

// Stat card component - removed percentage change display
function StatCard({ 
  title, 
  value, 
  icon 
}: { 
  title: string; 
  value: string | number; 
  icon: React.ReactNode 
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="text-gray-500 text-sm font-medium mb-1">{title}</div>
        <div className="flex justify-between items-center">
          <div>
            <div className="text-3xl font-bold">{value}</div>
          </div>
          <div className="text-2xl opacity-80">{icon}</div>
        </div>
      </CardContent>
    </Card>
  )
}

// Funzione per calcolare i valori reali del grafico a torta dai dati a barre
// Mettila come funzione normale nel componente Dashboard
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
      pending += (100 - totalPercent)
    } else if (totalCompleted >= totalPending && totalCompleted >= totalCancelled) {
      completed += (100 - totalPercent)
    } else {
      cancelled += (100 - totalPercent)
    }
  }
  
  return {
    pending,
    completed,
    cancelled
  }
}

// Aggiungi una funzione di aggregazione dei dati
function aggregateChartData(labels: string[], values: number[], completedValues: number[], cancelledValues: number[], timePeriod: string) {
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
    // Aggrega per settimana
    let currentWeek = ''
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
    const monthData: {[key: string]: {total: number, completed: number, cancelled: number}} = {}
    
    labels.forEach((date, index) => {
      // Estrai mese dalla data (formato: "DD/MM")
      const parts = date.split('/')
      const month = parts[1]
      
      // Inizializza il mese se non esiste
      if (!monthData[month]) {
        monthData[month] = {total: 0, completed: 0, cancelled: 0}
      }
      
      // Aggiungi i valori
      monthData[month].total += values[index]
      monthData[month].completed += completedValues[index]
      monthData[month].cancelled += cancelledValues[index]
    })
    
    // Converti in formato array, ordinando per mese
    const months = Object.keys(monthData).sort((a, b) => parseInt(a) - parseInt(b))
    const monthNames = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic']
    
    months.forEach(month => {
      // Converti numero mese in nome mese (1-based)
      const monthName = monthNames[parseInt(month) - 1] || month
      aggregatedLabels.push(monthName)
      aggregatedValues.push(monthData[month].total)
      aggregatedCompletedValues.push(monthData[month].completed)
      aggregatedCancelledValues.push(monthData[month].cancelled)
    })
  }
  
  return {
    labels: aggregatedLabels,
    values: aggregatedValues,
    completedValues: aggregatedCompletedValues,
    cancelledValues: aggregatedCancelledValues
  }
}

export default function Dashboard() {
  const { t } = useTranslation()
  const [timePeriod, setTimePeriod] = useState('30') // Default to 30 days
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear()) // Default to current year
  const [availableYears, setAvailableYears] = useState<number[]>([])
  const [dateRange, setDateRange] = useState<{from: Date | undefined, to?: Date | undefined}>({from: undefined, to: undefined})
  const [isCustomRange, setIsCustomRange] = useState(false)
  
  const [metrics, setMetrics] = useState<{
    totalPackages: number;
    avgProcessingTime: number;
    usersServed: number;
    statusDistribution: {
      pending: number;
      cancelled: number;
      completed: number;
    };
    monthlyStorageAverages: Array<{month: string; average: number}>;
  }>({
    totalPackages: 0,
    avgProcessingTime: 0,
    usersServed: 0,
    statusDistribution: {
      pending: 15,
      cancelled: 15,
      completed: 70
    },
    monthlyStorageAverages: [] // Now properly typed as Array<{month: string; average: number}>
  })
  const [loading, setLoading] = useState(true)

  const [packagesData, setPackagesData] = useState<{
    labels: string[];
    values: number[];
    completedLabels: string[];
    completedValues: number[];
    cancelledValues: number[];
  }>({
    labels: [],
    values: [],
    completedLabels: [],
    completedValues: [],
    cancelledValues: []
  })

  // Check if selected year is current year
  const currentYear = new Date().getFullYear()
  const isCurrentYear = selectedYear === currentYear

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
  }, [])

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
        
        // Log dei dati ricevuti per debug
        console.log("Dashboard metrics received:", data)
        
        // Verifica che la distribuzione degli stati sia presente e corretta
        if (!data.statusDistribution || 
            (data.statusDistribution.pending === 0 && 
             data.statusDistribution.cancelled === 0 && 
             data.statusDistribution.completed === 0 && 
             data.totalPackages > 0)) {
          console.warn("Status distribution data appears incorrect, recalculating locally...")
          
          // Se abbiamo pacchi ma nessuna distribuzione di stati, calcola localmente
          // basandoci sui dati dei grafici
          const localPending = data.packageData.values.reduce((sum: number, val: number) => sum + val, 0) - 
                              data.packageData.completedValues.reduce((sum: number, val: number) => sum + val, 0) - 
                              data.packageData.cancelledValues.reduce((sum: number, val: number) => sum + val, 0)
          
          const localCompleted = data.packageData.completedValues.reduce((sum: number, val: number) => sum + val, 0)
          const localCancelled = data.packageData.cancelledValues.reduce((sum: number, val: number) => sum + val, 0)
          
          const total = Math.max(localPending + localCompleted + localCancelled, 1)
          
          data.statusDistribution = {
            pending: Math.round((localPending / total) * 100),
            completed: Math.round((localCompleted / total) * 100),
            cancelled: Math.round((localCancelled / total) * 100)
          }
          
          // Assicurati che il totale sia 100%
          const totalPercent = data.statusDistribution.pending + data.statusDistribution.completed + data.statusDistribution.cancelled
          if (totalPercent !== 100) {
            // Aggiungi la differenza alla categoria più grande
            if (localPending >= localCompleted && localPending >= localCancelled) {
              data.statusDistribution.pending += (100 - totalPercent)
            } else if (localCompleted >= localPending && localCompleted >= localCancelled) {
              data.statusDistribution.completed += (100 - totalPercent)
            } else {
              data.statusDistribution.cancelled += (100 - totalPercent)
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
          cancelledValues: cancelledValues
        }
        
        // Applica l'aggregazione ai dati
        const aggregated = aggregateChartData(
          allDates, 
          receivedValues, 
          completedValues, 
          cancelledValues,
          isCustomRange ? 'custom' : timePeriod
        )
        
        // Aggiorna con i dati aggregati
        setPackagesData({
          labels: aggregated.labels,
          values: aggregated.values,
          completedLabels: aggregated.labels,
          completedValues: aggregated.completedValues,
          cancelledValues: aggregated.cancelledValues
        })
        
        // Calcola i valori corretti per la torta dai dati non aggregati
        // (i dati della torta dovrebbero essere basati sui totali, non sui dati aggregati)
        const correctDistribution = calculatePieChartData(rawData)
        
        // Aggiorna i dati delle metriche con la distribuzione corretta
        setMetrics(prevMetrics => ({
          ...prevMetrics,
          statusDistribution: correctDistribution
        }))
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
  }, [timePeriod, dateRange, isCustomRange, selectedYear, isCurrentYear])

  // Prepariamo i dati per il grafico a torta in modo che sia vuoto quando non ci sono dati
  const hasData = packagesData.values.some(val => val > 0) || 
                  packagesData.completedValues.some(val => val > 0) || 
                  packagesData.cancelledValues.some(val => val > 0)

  // Prepare chart data with empty data if no data is available
  const chartData = {
    labels: [t('deliveries.status.pending'), t('deliveries.status.cancelled'), t('deliveries.status.completed')],
    datasets: [
      {
        data: hasData ? [
          metrics.statusDistribution.pending,
          metrics.statusDistribution.cancelled,
          metrics.statusDistribution.completed
        ] : [], // Array vuoto quando non ci sono dati
        backgroundColor: [
          '#F59E0B', // giallo per pending
          '#F87171', // rosso per cancelled
          '#10B981', // verde per completed
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
            size: 12
          }
        }
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            return `${context.label}: ${context.raw}%`;
          }
        }
      }
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
      }
    ],
  }

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0
        }
      },
      x: {
        ticks: {
          maxRotation: 45,
          minRotation: 45
        }
      }
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
    labels: metrics.monthlyStorageAverages?.map(item => item.month) || [],
    datasets: [
      {
        label: t('dashboard.averageStorageDays'),
        data: metrics.monthlyStorageAverages?.map(item => item.average) || [],
        backgroundColor: 'rgba(245, 158, 11, 0.8)', // amber color
        borderColor: 'rgb(245, 158, 11)',
        borderWidth: 1,
      }
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
          minRotation: 0
        }
      }
    },
    plugins: {
      legend: {
        display: false, // Hide legend for cleaner look
      },
      title: {
        display: true,
        text: t('dashboard.averageStorageDays'),
        font: {
          size: 14
        }
      }
    },
  }

  return (
    <GenericCardView
      title={t('dashboard.title')}
      description={t('dashboard.description')}
      useScrollArea={true}
    >
      <div className="p-4 flex flex-wrap gap-4 items-center">
        {/* Year selector with dynamic years */}
        <Select 
          value={selectedYear?.toString() || ''} 
          onValueChange={(value) => setSelectedYear(parseInt(value))}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder={t('dashboard.selectYear')} />
          </SelectTrigger>
          <SelectContent>
            {availableYears.map(year => (
              <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
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
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder={`${t('dashboard.period')}: ${isCurrentYear ? t('dashboard.last30Days') : t('dashboard.allTime')}`} />
          </SelectTrigger>
          <SelectContent>
            {isCurrentYear ? (
              <>
                <SelectItem value="1">{t('dashboard.lastDay')}</SelectItem>
                <SelectItem value="7">{t('dashboard.last7Days')}</SelectItem>
                <SelectItem value="30">{t('dashboard.last30Days')}</SelectItem>
                <SelectItem value="90">{t('dashboard.last90Days')}</SelectItem>
                <SelectItem value="365">{t('dashboard.last12Months')}</SelectItem>
                <SelectItem value="custom">{t('dashboard.customDateRange')}</SelectItem>
              </>
            ) : (
              <SelectItem value="all">{t('dashboard.allTime')}</SelectItem>
            )}
            <SelectItem value="all">{t('dashboard.allTime')}</SelectItem>
          </SelectContent>
        </Select>

        {/* Date range picker - only for current year */}
        {isCurrentYear && isCustomRange && (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-[300px] justify-start text-left font-normal"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formatDateRange()}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="range"
                selected={dateRange}
                onSelect={(range) => {
                  setDateRange(range || {from: undefined, to: undefined})
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        )}
      </div>
      
      {loading ? (
        <div className="flex justify-center my-8">{t('common.loading')}</div>
      ) : (
        <>
          {/* First row: Total packages, average storage time, and employees served */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-4">
            <StatCard 
              title={t('dashboard.totalPackages')} 
              value={metrics.totalPackages} 
              icon={<Package className="h-6 w-6 text-blue-500" />} 
            />
            <StatCard 
              title={t('dashboard.averageStorageTime')} 
              value={`${metrics.avgProcessingTime} ${t('dashboard.days')}`} 
              icon={<Clock className="h-6 w-6 text-blue-500" />} 
            />
            <StatCard 
              title={t('dashboard.employeesServed')} 
              value={metrics.usersServed} 
              icon={<Users className="h-6 w-6 text-purple-500" />} 
            />
          </div>

          {/* Second row: Status cards (pending, completed, cancelled) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-4">
            <StatCard 
              title={t('dashboard.pendingRate')} 
              value={`${metrics.statusDistribution.pending}%`} 
              icon={<Clock className="h-6 w-6 text-orange-500" />} 
            />
            <StatCard 
              title={t('dashboard.completionRate')} 
              value={`${metrics.statusDistribution.completed}%`} 
              icon={<CheckCircle className="h-6 w-6 text-green-500" />} 
            />
            <StatCard 
              title={t('dashboard.cancellationRate')} 
              value={`${metrics.statusDistribution.cancelled}%`} 
              icon={<X className="h-6 w-6 text-red-500" />} 
            />
          </div>

          {/* Charts section - side by side on desktop, stacked on mobile */}
          <div className="mt-4 p-4 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Bar chart for packages received */}
            <Card className="w-full">
              <CardContent className="pt-6 p-2">
                <h3 className="text-lg font-medium mb-4 px-2">{t('dashboard.packagesReceived')}</h3>
                <div className="w-full h-[350px] flex items-center justify-center">
                  <Bar
                    data={barChartData} 
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      layout: {
                        padding: 0
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          ticks: {
                            precision: 0
                          }
                        },
                        x: {
                          ticks: {
                            maxRotation: 45,
                            minRotation: 45
                          }
                        }
                      },
                      plugins: {
                        legend: {
                          position: 'bottom' as const,
                        },
                      },
                    }} 
                  />
                </div>
              </CardContent>
            </Card>

            {/* Pie chart for status distribution */}
            <Card className="w-full">
              <CardContent className="pt-6">
                <h3 className="text-lg font-medium mb-4">{t('dashboard.statusDistribution')}</h3>
                <div className="w-full h-[350px] flex items-center justify-center">
                  <div className="w-full h-full p-4">
                    <Pie data={chartData} options={{
                      ...chartOptions,
                      maintainAspectRatio: false,
                      layout: {
                        padding: 20
                      },
                      plugins: {
                        ...chartOptions.plugins,
                        legend: {
                          ...chartOptions.plugins.legend,
                          position: 'bottom',
                          align: 'center',
                          labels: {
                            boxWidth: 12,
                            padding: 15,
                            font: {
                              size: 12
                            }
                          }
                        }
                      }
                    }} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Add the new monthly storage chart after the existing charts */}
          <div className="mt-4 p-4">
            <Card className="w-full">
              <CardContent className="pt-6 p-2">
                <h3 className="text-lg font-medium mb-4 px-2">{t('dashboard.monthlyStorageAverage')}</h3>
                <div className="w-full h-[350px] flex items-center justify-center">
                  <Bar
                    data={monthlyStorageData} 
                    options={{
                      ...monthlyStorageOptions,
                      maintainAspectRatio: false
                    }} 
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </GenericCardView>
  )
}
