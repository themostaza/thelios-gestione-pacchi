'use client'

import { Package, Clock, TrendingUp, Users, CheckCircle, AlertCircle, RefreshCw, ChevronDown, Filter } from 'lucide-react'
import React, { useState, useEffect } from 'react'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

// Definizione dei tipi
type TimeFrame = '7d' | '30d' | '90d' | '12m' | 'all'
type ChartType = 'bar' | 'line' | 'pie'

interface KpiCardProps {
  title: string
  value: string | number
  change: number
  icon: React.ReactNode
  positive?: boolean
}

interface PackageStatusCount {
  status: string
  count: number
}

interface TimeSeriesData {
  date: string
  count: number
}

interface AverageTimeData {
  month: string
  days: number
}

interface DepartmentData {
  name: string
  value: number
  color: string
}

interface FilterOption {
  id: string
  name: string
}

// Colori per i grafici
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d']
const STATUS_COLORS = {
  arrivato: '#0088FE',
  'in consegna': '#FFBB28',
  completato: '#00C49F',
  cancellato: '#FF8042',
}

// Dati di esempio - resi deterministici per evitare errori di hydration
const generateMockData = () => {
  // Usiamo valori fissi invece di random per evitare differenze tra server e client
  // Dati di conteggio stato
  const statusData: PackageStatusCount[] = [
    { status: 'arrivato', count: 45 },
    { status: 'in consegna', count: 28 },
    { status: 'completato', count: 189 },
    { status: 'cancellato', count: 12 },
  ]

  // Date fisse per evitare problemi di hydration
  const baseDate = new Date('2025-02-01')
  const thirtyDaysData: TimeSeriesData[] = Array.from({ length: 30 }, (_, i) => {
    const date = new Date(baseDate)
    date.setDate(date.getDate() + i)
    // Usiamo valori fissi basati sull'indice invece di Math.random()
    const countValues = [7, 12, 9, 15, 8, 11, 14, 10, 6, 13, 8, 9, 12, 14, 7, 11, 13, 10, 8, 12, 9, 15, 7, 14, 9, 11, 8, 12, 10, 13]
    return {
      date: date.toISOString().slice(0, 10),
      count: countValues[i] || 10,
    }
  })

  // Dati per il tempo medio di giacenza
  const averageTimeData: AverageTimeData[] = [
    { month: 'Gen', days: 2.8 },
    { month: 'Feb', days: 3.2 },
    { month: 'Mar', days: 2.5 },
    { month: 'Apr', days: 2.9 },
    { month: 'Mag', days: 3.1 },
    { month: 'Giu', days: 2.3 },
    { month: 'Lug', days: 2.7 },
    { month: 'Ago', days: 3.4 },
    { month: 'Set', days: 2.6 },
    { month: 'Ott', days: 2.4 },
    { month: 'Nov', days: 2.9 },
    { month: 'Dic', days: 3.3 },
  ]

  // Dati per dipartimenti
  const departmentData: DepartmentData[] = [
    { name: 'IT', value: 78, color: '#0088FE' },
    { name: 'HR', value: 45, color: '#00C49F' },
    { name: 'Marketing', value: 63, color: '#FFBB28' },
    { name: 'Sales', value: 91, color: '#FF8042' },
    { name: 'R&D', value: 38, color: '#8884d8' },
    { name: 'Administration', value: 52, color: '#82ca9d' },
  ]

  return {
    statusData,
    thirtyDaysData,
    averageTimeData,
    departmentData,
    totalPackages: 274,
    avgTimeToCompletion: 2.8,
    completionRate: 87,
    employeesServed: 156,
  }
}

// Componente KPI Card
const KpiCard: React.FC<KpiCardProps> = ({ title, value, change, icon, positive = true }) => {
  return (
    <div className='bg-white rounded-lg shadow p-6'>
      <div className='flex items-center justify-between mb-4'>
        <h3 className='text-sm font-medium text-gray-500'>{title}</h3>
        <div className='p-2 rounded-full bg-blue-50'>{icon}</div>
      </div>
      <div className='flex flex-col'>
        <span className='text-2xl font-bold text-gray-900 mb-1'>{value}</span>
        <div className={`flex items-center text-sm ${positive ? 'text-green-600' : 'text-red-600'}`}>
          <span className='mr-1'>
            {positive ? '+' : ''}
            {change}%
          </span>
          <TrendingUp
            size={16}
            className={`${!positive && 'transform rotate-180'}`}
          />
        </div>
      </div>
    </div>
  )
}

// Componente Menu a tendina
const DropdownMenu: React.FC<{
  options: FilterOption[]
  value: string
  onChange: (value: string) => void
  label: string
}> = ({ options, value, onChange, label }) => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className='relative'>
      <button
        type='button'
        className='flex items-center justify-between w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{label}:</span>
        <span className='flex items-center'>
          {options.find((option) => option.id === value)?.name || 'Seleziona...'}
          <ChevronDown
            size={16}
            className='ml-2'
          />
        </span>
      </button>

      {isOpen && (
        <div className='absolute right-0 z-10 mt-1 w-full bg-white rounded-md shadow-lg'>
          <ul className='py-1 max-h-60 overflow-auto'>
            {options.map((option) => (
              <li key={option.id}>
                <button
                  type='button'
                  className={`block w-full text-left px-4 py-2 text-sm ${option.id === value ? 'bg-blue-100 text-blue-900' : 'text-gray-700 hover:bg-gray-100'}`}
                  onClick={() => {
                    onChange(option.id)
                    setIsOpen(false)
                  }}
                >
                  {option.name}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

const PackageKpiDashboard: React.FC = () => {
  // Stati
  const [timeFrame, setTimeFrame] = useState<TimeFrame>('30d')
  const [data, setData] = useState<ReturnType<typeof generateMockData> | null>(null)
  const [isClient, setIsClient] = useState(false)
  const [chartTypes, setChartTypes] = useState({
    status: 'pie' as ChartType,
    timeline: 'line' as ChartType,
    avgTime: 'bar' as ChartType,
  })

  // Opzioni per i filtri
  const timeFrameOptions: FilterOption[] = [
    { id: '7d', name: 'Last 7 days' },
    { id: '30d', name: 'Last 30 days' },
    { id: '90d', name: 'Last 90 days' },
    { id: '12m', name: 'Last 12 months' },
    { id: 'all', name: 'All time' },
  ]

  const chartTypeOptions: FilterOption[] = [
    { id: 'bar', name: 'Bar' },
    { id: 'line', name: 'Line' },
    { id: 'pie', name: 'Pie' },
  ]

  // Effect per marcare quando il componente è montato lato client
  useEffect(() => {
    setIsClient(true)
    const mockData = generateMockData()
    setData(mockData)
  }, [])

  // Formatta numero con separatori di migliaia
  const formatNumber = (num: number): string => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  }

  // Simulazione di caricamento dei dati quando cambia il timeframe
  useEffect(() => {
    // In un'app reale, qui faremo una chiamata API
    // Utilizziamo useEffect per assicurarci che questo codice venga eseguito solo lato client
    if (typeof window !== 'undefined') {
      const mockData = generateMockData()
      setData(mockData)
    }
  }, [timeFrame])

  // Evita il rendering dei grafici fino a quando non siamo sul client
  if (!isClient || !data) {
    return (
      <div className='container mx-auto px-4 py-8 bg-white'>
        <h1 className='text-2xl font-bold mb-6 text-gray-800'>KPI Dashboard</h1>
        <div className='flex justify-center items-center h-96'>
          <div className='animate-pulse flex flex-col items-center'>
            <div className='h-12 w-12 rounded-full border-4 border-t-blue-500 border-b-blue-700 border-l-blue-500 border-r-blue-700 animate-spin'></div>
            <p className='mt-4 text-gray-600'>Loading dashboard...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className='container mx-auto px-4 py-8 bg-white'>
      <h1 className='text-2xl font-bold mb-6 text-gray-800'>KPI Dashboard</h1>

      {/* Filtri */}
      <div className='flex flex-wrap gap-4 mb-8 justify-between items-center'>
        <div className='flex items-center gap-2'>
          <Filter
            size={20}
            className='text-gray-500'
          />
          <span className='text-gray-700 font-medium'>Filters:</span>
        </div>

        <div className='flex flex-wrap gap-4'>
          <DropdownMenu
            options={timeFrameOptions}
            value={timeFrame}
            onChange={(value) => setTimeFrame(value as TimeFrame)}
            label='Period'
          />
        </div>
      </div>

      {/* KPI Cards */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8'>
        <KpiCard
          title='Total Packages'
          value={formatNumber(data.totalPackages)}
          change={12.5}
          icon={
            <Package
              size={20}
              className='text-blue-600'
            />
          }
        />
        <KpiCard
          title='Average Storage Time'
          value={`${data.avgTimeToCompletion.toFixed(1)} days`}
          change={-8.3}
          icon={
            <Clock
              size={20}
              className='text-amber-600'
            />
          }
          positive={false}
        />
        <KpiCard
          title='Completion Rate'
          value={`${data.completionRate}%`}
          change={3.7}
          icon={
            <CheckCircle
              size={20}
              className='text-green-600'
            />
          }
        />
        <KpiCard
          title='Employees Served'
          value={formatNumber(data.employeesServed)}
          change={5.2}
          icon={
            <Users
              size={20}
              className='text-purple-600'
            />
          }
        />
      </div>

      {/* Grafici principali */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8'>
        {/* Stato dei Pacchi */}
        <div className='bg-white rounded-lg shadow p-6'>
          <div className='flex justify-between items-center mb-6'>
            <h3 className='text-lg font-medium text-gray-800'>Status Distribution</h3>
            <DropdownMenu
              options={chartTypeOptions}
              value={chartTypes.status}
              onChange={(value) => setChartTypes((prev) => ({ ...prev, status: value as ChartType }))}
              label='Chart'
            />
          </div>

          <div className='h-80'>
            <ResponsiveContainer
              width='100%'
              height='100%'
            >
              {chartTypes.status === 'pie' ? (
                <PieChart>
                  <Pie
                    data={data.statusData}
                    cx='50%'
                    cy='50%'
                    labelLine={true}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill='#8884d8'
                    dataKey='count'
                    nameKey='status'
                  >
                    {data.statusData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={STATUS_COLORS[entry.status as keyof typeof STATUS_COLORS] || COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} packages`, 'Quantity']} />
                  <Legend formatter={(value) => value.charAt(0).toUpperCase() + value.slice(1)} />
                </PieChart>
              ) : chartTypes.status === 'bar' ? (
                <BarChart data={data.statusData}>
                  <CartesianGrid strokeDasharray='3 3' />
                  <XAxis dataKey='status' />
                  <YAxis />
                  <Tooltip formatter={(value) => [`${value} packages`, 'Quantity']} />
                  <Legend />
                  <Bar
                    dataKey='count'
                    name='Packages'
                    fill='#0088FE'
                  />
                </BarChart>
              ) : (
                <LineChart data={data.statusData}>
                  <CartesianGrid strokeDasharray='3 3' />
                  <XAxis dataKey='status' />
                  <YAxis />
                  <Tooltip formatter={(value) => [`${value} packages`, 'Quantity']} />
                  <Legend />
                  <Line
                    type='monotone'
                    dataKey='count'
                    name='Packages'
                    stroke='#0088FE'
                  />
                </LineChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        {/* Timeline Pacchi */}
        <div className='bg-white rounded-lg shadow p-6'>
          <div className='flex justify-between items-center mb-6'>
            <h3 className='text-lg font-medium text-gray-800'>Packages Timeline</h3>
            <DropdownMenu
              options={chartTypeOptions.filter((option) => option.id !== 'pie')}
              value={chartTypes.timeline}
              onChange={(value) => setChartTypes((prev) => ({ ...prev, timeline: value as ChartType }))}
              label='Chart'
            />
          </div>

          <div className='h-80'>
            <ResponsiveContainer
              width='100%'
              height='100%'
            >
              {chartTypes.timeline === 'bar' ? (
                <BarChart data={data.thirtyDaysData}>
                  <CartesianGrid strokeDasharray='3 3' />
                  <XAxis
                    dataKey='date'
                    tickFormatter={(value) => {
                      const date = new Date(value)
                      return `${date.getDate()}/${date.getMonth() + 1}`
                    }}
                  />
                  <YAxis />
                  <Tooltip
                    labelFormatter={(value) => {
                      const date = new Date(value)
                      return `Date: ${date.toLocaleDateString('en-US')}`
                    }}
                    formatter={(value) => [`${value} packages`, 'Quantity']}
                  />
                  <Legend />
                  <Bar
                    dataKey='count'
                    name='Packages Received'
                    fill='#0088FE'
                  />
                </BarChart>
              ) : (
                <LineChart data={data.thirtyDaysData}>
                  <CartesianGrid strokeDasharray='3 3' />
                  <XAxis
                    dataKey='date'
                    tickFormatter={(value) => {
                      const date = new Date(value)
                      return `${date.getDate()}/${date.getMonth() + 1}`
                    }}
                  />
                  <YAxis />
                  <Tooltip
                    labelFormatter={(value) => {
                      const date = new Date(value)
                      return `Date: ${date.toLocaleDateString('en-US')}`
                    }}
                    formatter={(value) => [`${value} packages`, 'Quantity']}
                  />
                  <Legend />
                  <Line
                    type='monotone'
                    dataKey='count'
                    name='Packages Received'
                    stroke='#0088FE'
                    strokeWidth={2}
                  />
                </LineChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Grafici secondari */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
        {/* Tempo Medio di Giacenza */}
        <div className='bg-white rounded-lg shadow p-6'>
          <div className='flex justify-between items-center mb-6'>
            <h3 className='text-lg font-medium text-gray-800'>Average Storage Time</h3>
            <DropdownMenu
              options={chartTypeOptions.filter((option) => option.id !== 'pie')}
              value={chartTypes.avgTime}
              onChange={(value) => setChartTypes((prev) => ({ ...prev, avgTime: value as ChartType }))}
              label='Chart'
            />
          </div>

          <div className='h-80'>
            <ResponsiveContainer
              width='100%'
              height='100%'
            >
              {chartTypes.avgTime === 'bar' ? (
                <BarChart data={data.averageTimeData}>
                  <CartesianGrid strokeDasharray='3 3' />
                  <XAxis dataKey='month' />
                  <YAxis />
                  <Tooltip formatter={(value) => [`${value} days`, 'Average storage days']} />
                  <Legend />
                  <Bar
                    dataKey='days'
                    name='Average storage days'
                    fill='#FFBB28'
                  />
                </BarChart>
              ) : (
                <LineChart data={data.averageTimeData}>
                  <CartesianGrid strokeDasharray='3 3' />
                  <XAxis dataKey='month' />
                  <YAxis />
                  <Tooltip formatter={(value) => [`${value} days`, 'Average storage days']} />
                  <Legend />
                  <Line
                    type='monotone'
                    dataKey='days'
                    name='Average storage days'
                    stroke='#FFBB28'
                    strokeWidth={2}
                  />
                </LineChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        {/* Distribuzione per Dipartimento */}
        <div className='bg-white rounded-lg shadow p-6'>
          <div className='flex justify-between items-center mb-6'>
            <h3 className='text-lg font-medium text-gray-800'>Department Distribution</h3>
          </div>

          <div className='h-80'>
            <ResponsiveContainer
              width='100%'
              height='100%'
            >
              <PieChart>
                <Pie
                  data={data.departmentData}
                  cx='50%'
                  cy='50%'
                  labelLine={true}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill='#8884d8'
                  dataKey='value'
                  nameKey='name'
                >
                  {data.departmentData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.color}
                    />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value} packages`, 'Quantity']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Sezione statistiche dettagliate */}
      <div className='mt-12'>
        <h2 className='text-xl font-bold mb-6 text-gray-800'>Advanced Metrics</h2>

        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
          <div className='bg-white rounded-lg shadow p-6'>
            <div className='flex items-center justify-between mb-4'>
              <h3 className='text-sm font-medium text-gray-500'>Same Day Pickup Rate</h3>
              <div className='p-2 rounded-full bg-green-50'>
                <Clock
                  size={20}
                  className='text-green-600'
                />
              </div>
            </div>
            <div className='flex items-center'>
              <div className='w-full bg-gray-200 rounded-full h-4 mr-2'>
                <div
                  className='bg-green-600 h-4 rounded-full'
                  style={{ width: '42%' }}
                ></div>
              </div>
              <span className='text-sm font-medium text-gray-700'>42%</span>
            </div>
          </div>

          <div className='bg-white rounded-lg shadow p-6'>
            <div className='flex items-center justify-between mb-4'>
              <h3 className='text-sm font-medium text-gray-500'>Reminder Efficiency</h3>
              <div className='p-2 rounded-full bg-blue-50'>
                <RefreshCw
                  size={20}
                  className='text-blue-600'
                />
              </div>
            </div>
            <div className='flex items-center'>
              <div className='w-full bg-gray-200 rounded-full h-4 mr-2'>
                <div
                  className='bg-blue-600 h-4 rounded-full'
                  style={{ width: '68%' }}
                ></div>
              </div>
              <span className='text-sm font-medium text-gray-700'>68%</span>
            </div>
          </div>

          <div className='bg-white rounded-lg shadow p-6'>
            <div className='flex items-center justify-between mb-4'>
              <h3 className='text-sm font-medium text-gray-500'>Cancellation Rate</h3>
              <div className='p-2 rounded-full bg-red-50'>
                <AlertCircle
                  size={20}
                  className='text-red-600'
                />
              </div>
            </div>
            <div className='flex items-center'>
              <div className='w-full bg-gray-200 rounded-full h-4 mr-2'>
                <div
                  className='bg-red-600 h-4 rounded-full'
                  style={{ width: '4.3%' }}
                ></div>
              </div>
              <span className='text-sm font-medium text-gray-700'>4.3%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Sezione statistiche mensili */}
      <div className='mt-12'>
        <h2 className='text-xl font-bold mb-6 text-gray-800'>Monthly Summary</h2>

        <div className='bg-white rounded-lg shadow overflow-hidden'>
          <table className='min-w-full divide-y divide-gray-200'>
            <thead className='bg-gray-50'>
              <tr>
                <th
                  scope='col'
                  className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
                >
                  Month
                </th>
                <th
                  scope='col'
                  className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
                >
                  Packages Received
                </th>
                <th
                  scope='col'
                  className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
                >
                  Packages Delivered
                </th>
                <th
                  scope='col'
                  className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
                >
                  Average Time (days)
                </th>
                <th
                  scope='col'
                  className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
                >
                  Completion Rate
                </th>
              </tr>
            </thead>
            <tbody className='bg-white divide-y divide-gray-200'>
              {data.averageTimeData.slice(0, 6).map((item, index) => {
                // Valori fissi invece che casuali
                const receivedValues = [78, 92, 65, 84, 71, 88]
                const deliveredValues = [72, 85, 59, 76, 64, 81]
                const completionRates = [92.3, 89.5, 90.8, 87.6, 93.2, 91.4]

                return (
                  <tr
                    key={item.month}
                    className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                  >
                    <td className='px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900'>{item.month} 2025</td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>{receivedValues[index]}</td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>{deliveredValues[index]}</td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>{item.days.toFixed(1)}</td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>{completionRates[index]}%</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default PackageKpiDashboard
