'use client'

import { Loader2, Mail, Clock, CheckCircle, XCircle } from 'lucide-react'
import { useState } from 'react'

import { sendAutomaticReminders } from '@/app/actions/deliveryActions'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/context/authContext'

interface ReminderResult {
  deliveryId: number
  recipientEmail: string
  success: boolean
  message: string
}

interface CronResult {
  sent: number
  total: number
  results: ReminderResult[]
}

export default function CronTestPage() {
  const { isAdmin } = useAuth()
  const [isRunning, setIsRunning] = useState(false)
  const [result, setResult] = useState<CronResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleRunCron = async () => {
    setIsRunning(true)
    setError(null)
    setResult(null)

    try {
      const response = await sendAutomaticReminders()

      if (response.success && response.data) {
        setResult(response.data as CronResult)
      } else {
        setError(response.message || 'Failed to run automatic reminders')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
    } finally {
      setIsRunning(false)
    }
  }

  if (!isAdmin) {
    return (
      <div className='container mx-auto p-6'>
        <Card>
          <CardHeader>
            <CardTitle className='text-red-600'>Accesso Negato</CardTitle>
            <CardDescription>Solo gli amministratori possono accedere a questa pagina.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className='container mx-auto p-6 space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold'>Test Cron - Promemoria Automatici</h1>
          <p className='text-muted-foreground mt-2'>Simula l&apos;invio automatico di promemoria per le consegne in attesa</p>
        </div>
        <Button
          onClick={handleRunCron}
          disabled={isRunning}
          size='lg'
        >
          {isRunning ? (
            <>
              <Loader2 className='h-4 w-4 mr-2 animate-spin' />
              Esecuzione in corso...
            </>
          ) : (
            <>
              <Mail className='h-4 w-4 mr-2' />
              Esegui Cron
            </>
          )}
        </Button>
      </div>

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Clock className='h-5 w-5' />
            Informazioni Cron
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            <div className='p-4 bg-blue-50 rounded-lg'>
              <h3 className='font-semibold text-blue-900'>Consegne Target</h3>
              <p className='text-blue-700'>Solo consegne con status &quot;pending&quot;</p>
            </div>
            <div className='p-4 bg-green-50 rounded-lg'>
              <h3 className='font-semibold text-green-900'>Frequenza</h3>
              <p className='text-green-700'>Ogni 3 giorni (se non inviato recentemente)</p>
            </div>
            <div className='p-4 bg-purple-50 rounded-lg'>
              <h3 className='font-semibold text-purple-900'>Tipo Email</h3>
              <p className='text-purple-700'>Promemoria iniziale (template &quot;initial&quot;)</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {result && (
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <CheckCircle className='h-5 w-5 text-green-600' />
              Risultati Esecuzione
            </CardTitle>
            <CardDescription>
              {result.sent} promemoria inviati su {result.total} consegne processate
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className='space-y-4'>
              {/* Summary */}
              <div className='flex items-center gap-4'>
                <Badge
                  variant='outline'
                  className='text-green-600'
                >
                  Inviati: {result.sent}
                </Badge>
                <Badge
                  variant='outline'
                  className='text-blue-600'
                >
                  Totali: {result.total}
                </Badge>
                <Badge
                  variant='outline'
                  className='text-gray-600'
                >
                  Falliti: {result.total - result.sent}
                </Badge>
              </div>

              {/* Detailed Results */}
              {result.results.length > 0 && (
                <div className='space-y-2'>
                  <h4 className='font-semibold'>Dettagli:</h4>
                  <div className='max-h-96 overflow-y-auto space-y-2'>
                    {result.results.map((item, index) => (
                      <div
                        key={index}
                        className={`p-3 rounded-lg border ${item.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}
                      >
                        <div className='flex items-center justify-between'>
                          <div className='flex items-center gap-2'>
                            {item.success ? <CheckCircle className='h-4 w-4 text-green-600' /> : <XCircle className='h-4 w-4 text-red-600' />}
                            <span className='font-medium'>
                              ID: {item.deliveryId} - {item.recipientEmail}
                            </span>
                          </div>
                          <Badge variant={item.success ? 'default' : 'destructive'}>{item.success ? 'Successo' : 'Fallito'}</Badge>
                        </div>
                        <p className={`text-sm mt-1 ${item.success ? 'text-green-700' : 'text-red-700'}`}>{item.message}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error */}
      {error && (
        <Card className='border-red-200'>
          <CardHeader>
            <CardTitle className='flex items-center gap-2 text-red-600'>
              <XCircle className='h-5 w-5' />
              Errore
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className='text-red-700'>{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Come Funziona</CardTitle>
        </CardHeader>
        <CardContent className='space-y-3'>
          <div className='space-y-2'>
            <h4 className='font-semibold'>1. Selezione Consegne</h4>
            <p className='text-sm text-muted-foreground'>Il sistema cerca tutte le consegne con status &quot;pending&quot; (in attesa).</p>
          </div>
          <div className='space-y-2'>
            <h4 className='font-semibold'>2. Controllo Frequenza</h4>
            <p className='text-sm text-muted-foreground'>Per ogni consegna, verifica se è stato inviato un promemoria negli ultimi 3 giorni.</p>
          </div>
          <div className='space-y-2'>
            <h4 className='font-semibold'>3. Invio Promemoria</h4>
            <p className='text-sm text-muted-foreground'>Se non è stato inviato un promemoria recente, invia automaticamente un email di promemoria.</p>
          </div>
          <div className='space-y-2'>
            <h4 className='font-semibold'>4. Logging</h4>
            <p className='text-sm text-muted-foreground'>Tutti gli invii vengono registrati nella tabella &quot;reminder&quot; per il controllo della frequenza.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
