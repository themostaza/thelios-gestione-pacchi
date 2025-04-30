'use client'

import { useEffect, useState } from 'react'
import GenericCardView from './GenericCardView'
import { getDashboardMetrics } from '@/app/actions/dashboardActions'
import { Package, Clock, CheckCircle, Users } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Pie } from 'react-chartjs-2'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'
import { useTranslation } from '@/i18n/I18nProvider'

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend)

// Stat card component
function StatCard({ 
  title, 
  value, 
  change, 
  icon 
}: { 
  title: string; 
  value: string | number; 
  change: number; 
  icon: React.ReactNode 
}) {
  const isPositive = change >= 0
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="text-gray-500 text-sm font-medium mb-1">{title}</div>
        <div className="flex justify-between items-center">
          <div>
            <div className="text-3xl font-bold">{value}</div>
            <div className={`text-sm font-medium flex items-center ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
              {isPositive ? '+' : ''}{change}%
            </div>
          </div>
          <div className="text-2xl opacity-80">{icon}</div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function Dashboard() {
  const { t } = useTranslation()
  
  const [metrics, setMetrics] = useState({
    totalPackages: 0,
    packagesGrowth: 0,
    avgProcessingTime: 0,
    processingTimeGrowth: 0,
    completionRate: 0,
    completionRateGrowth: 0,
    usersServed: 0,
    usersServedGrowth: 0,
    statusDistribution: {
      pending: 15,
      cancelled: 15,
      completed: 70
    }
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadMetrics() {
      try {
        const data = await getDashboardMetrics()
        setMetrics(data)
      } catch (error) {
        console.error('Failed to load metrics:', error)
      } finally {
        setLoading(false)
      }
    }
    
    loadMetrics()
  }, [])

  // Prepare chart data
  const chartData = {
    labels: [t('deliveries.status.pending'), t('deliveries.status.cancelled'), t('deliveries.status.completed')],
    datasets: [
      {
        data: [
          metrics.statusDistribution.pending,
          metrics.statusDistribution.cancelled,
          metrics.statusDistribution.completed
        ],
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

  return (
    <GenericCardView
      title={t('dashboard.title')}
      description={t('dashboard.description')}
      useScrollArea={true}
    >
      {loading ? (
        <div className="flex justify-center my-8">{t('common.loading')}</div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 p-4">
            <StatCard 
              title={t('dashboard.totalPackages')} 
              value={metrics.totalPackages} 
              change={metrics.packagesGrowth} 
              icon={<Package className="h-6 w-6 text-blue-500" />} 
            />
            <StatCard 
              title={t('dashboard.averageStorageTime')} 
              value={`${metrics.avgProcessingTime} ${t('dashboard.days')}`} 
              change={metrics.processingTimeGrowth} 
              icon={<Clock className="h-6 w-6 text-orange-500" />} 
            />
            <StatCard 
              title={t('dashboard.completionRate')} 
              value={`${metrics.completionRate}%`} 
              change={metrics.completionRateGrowth} 
              icon={<CheckCircle className="h-6 w-6 text-green-500" />} 
            />
            <StatCard 
              title={t('dashboard.employeesServed')} 
              value={metrics.usersServed} 
              change={metrics.usersServedGrowth} 
              icon={<Users className="h-6 w-6 text-purple-500" />} 
            />
          </div>

          <div className="mt-8 p-4">
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-medium mb-4">{t('dashboard.statusDistribution')}</h3>
                <div className="w-full max-w-md mx-auto h-80">
                  <Pie data={chartData} options={chartOptions} />
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </GenericCardView>
  )
}
