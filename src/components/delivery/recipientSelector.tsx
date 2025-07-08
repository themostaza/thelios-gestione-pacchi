'use client'

import { format } from 'date-fns'
import { RefreshCw, Search, X, Edit3 } from 'lucide-react'
import { useState, useEffect } from 'react'

import { searchRecipients, forceRefreshRecipients } from '@/app/actions/recipientActions'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { useTranslation } from '@/i18n/I18nProvider'
import { Recipient } from '@/lib/types/delivery'

interface RecipientSelectProps {
  value: string
  onChange: (value: string) => void
  id?: string
  name?: string
  disabled?: boolean
}

const RecipientSkeleton = () => (
  <div className='flex items-center gap-3 p-3'>
    <Skeleton className='h-10 w-10 rounded-full' />
    <div className='space-y-2 flex-1'>
      <Skeleton className='h-4 w-3/4' />
      <Skeleton className='h-3 w-1/2' />
    </div>
  </div>
)

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

export default function RecipientSelect({ value, onChange, id = 'recipient', name = 'recipient', disabled = false }: RecipientSelectProps) {
  const { t } = useTranslation()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedRecipientInfo, setSelectedRecipientInfo] = useState<Recipient | null>(null)
  const [showResults, setShowResults] = useState(false)
  const [searchResults, setSearchResults] = useState<Recipient[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [lastFetchDate, setLastFetchDate] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [showRefreshDialog, setShowRefreshDialog] = useState(false)
  const [isManualMode, setIsManualMode] = useState(false)
  const [manualEmail, setManualEmail] = useState('')

  const debouncedQuery = useDebounce(searchQuery, 500)

  useEffect(() => {
    if (value) {
      if (isManualMode) {
        setManualEmail(value)
      } else {
        setSearchQuery(value)
        // When value is set programmatically (e.g. from scan), show results and trigger search
        if (value.length > 0 && !selectedRecipientInfo) {
          setShowResults(true)
          setIsLoading(true)
        }
      }
    } else {
      setSearchQuery('')
      setManualEmail('')
      setSelectedRecipientInfo(null)
    }
  }, [value, selectedRecipientInfo, isManualMode])

  useEffect(() => {
    if (debouncedQuery && !isManualMode) {
      handleRecipientSearch(debouncedQuery)
    } else if (!isManualMode) {
      setSearchResults([])
      setIsLoading(false)
    }
  }, [debouncedQuery, isManualMode])

  // Fetch the last updated date on component mount
  useEffect(() => {
    const fetchLastUpdate = async () => {
      try {
        const { created_at } = await searchRecipients('')
        if (created_at) {
          setLastFetchDate(created_at)
        }
      } catch (error) {
        console.error('Error fetching last update date:', error)
      }
    }

    fetchLastUpdate()
  }, [])

  const handleRecipientSearch = async (query: string) => {
    if (!query) {
      setSearchResults([])
      return
    }

    setIsLoading(true)
    try {
      const data = await searchRecipients(query)
      setSearchResults(data.recipients)
      
      // Auto-select if there's exactly one result
      if (data.recipients.length === 1) {
        const singleRecipient = data.recipients[0]
        selectRecipient(singleRecipient)
      } else if (data.recipients.length > 0) {
        // When search results come back and we have multiple results, keep dropdown open
        setShowResults(true)
      }
    } catch (error) {
      console.error('Error fetching recipients:', error)
      setSearchResults([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleRefresh = async () => {
    setShowRefreshDialog(false)
    setIsRefreshing(true)
    try {
      const { created_at } = await forceRefreshRecipients()
      setLastFetchDate(created_at)
      // If search is active, refresh results
      if (searchQuery && !isManualMode) {
        handleRecipientSearch(searchQuery)
      }
    } catch (error) {
      console.error('Error refreshing recipients:', error)
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value
    setSearchQuery(query)

    setShowResults(query.length > 0)

    if (query.length > 0) {
      setIsLoading(true)
    }

    if (query === '') {
      setSelectedRecipientInfo(null)
      onChange('')
      setSearchResults([])
      setIsLoading(false)
    }
  }

  const handleManualEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const email = e.target.value
    setManualEmail(email)
    onChange(email)
  }

  const toggleMode = () => {
    setIsManualMode(!isManualMode)
    if (isManualMode) {
      // Switching from manual to search mode
      setManualEmail('')
      setSearchQuery('')
      setSelectedRecipientInfo(null)
      onChange('')
    } else {
      // Switching from search to manual mode
      setSearchQuery('')
      setSelectedRecipientInfo(null)
      setSearchResults([])
      setShowResults(false)
      setManualEmail(value || '')
    }
  }

  const selectRecipient = (recipient: Recipient) => {
    setSearchQuery(`${recipient.name} ${recipient.surname}`)
    setSelectedRecipientInfo(recipient)
    setShowResults(false)

    onChange(recipient.email)
  }

  const clearRecipient = () => {
    setSelectedRecipientInfo(null)
    setSearchQuery('')
    setManualEmail('')
    onChange('')
  }

  return (
    <div className='space-y-2'>
      <div className='flex items-center justify-between mb-1'>
        {lastFetchDate && !isManualMode && (
          <div className='text-xs text-muted-foreground'>
            {t('deliveries.lastUpdate')}: {format(new Date(lastFetchDate), 'dd/MM/yyyy HH:mm')}
          </div>
        )}
        <div className='flex items-center gap-2 ml-auto'>
          <Button
            variant='outline'
            size='sm'
            onClick={toggleMode}
            disabled={disabled}
            type='button'
          >
            <Edit3 className='h-4 w-4 mr-1' />
            {isManualMode ? t('deliveries.searchMode') || 'Modalità Ricerca' : t('deliveries.manualMode') || 'Inserimento Manuale'}
          </Button>
          {!isManualMode && (
            <Button
              variant='outline'
              size='sm'
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setShowRefreshDialog(true)
              }}
              disabled={isRefreshing || disabled}
              type='button'
            >
              <RefreshCw className={`h-4 w-4 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
              {t('deliveries.refreshList')}
            </Button>
          )}
        </div>
      </div>

      {isManualMode ? (
        // Manual email input mode
        <div className='space-y-2'>
          <Input
            id={`${id}-manual`}
            type='email'
            placeholder={t('deliveries.enterEmailManually') || 'Inserisci email manualmente'}
            value={manualEmail}
            onChange={handleManualEmailChange}
            className='w-full'
            disabled={disabled}
            autoComplete='off'
          />
          <div className='text-xs text-muted-foreground'>
            {t('deliveries.manualEmailDescription') || 'Inserisci direttamente l\'indirizzo email del destinatario'}
          </div>
        </div>
      ) : (
        // Search mode (existing functionality)
        <>
          <div className={`relative ${selectedRecipientInfo ? 'hidden' : ''}`}>
            <div className='absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none'>
              <Search className='h-4 w-4 text-muted-foreground' />
            </div>
            <Input
              id={`${id}-search`}
              type='text'
              placeholder={t('deliveries.searchRecipient')}
              value={searchQuery}
              onChange={handleSearch}
              className='pl-10'
              disabled={disabled}
              autoComplete='off'
              onKeyDown={(e) => {
                if (e.key === 'Enter' && searchResults.length > 0) {
                  e.preventDefault()
                  selectRecipient(searchResults[0])
                }
              }}
              onBlur={() => {
                setTimeout(() => {
                  setShowResults(false)

                  if (!selectedRecipientInfo && searchQuery) {
                    setSearchQuery('')
                  }
                }, 200)
              }}
            />
            {showResults && (
              <div className='absolute z-10 mt-1 w-full bg-background rounded-md shadow-lg border max-h-60 overflow-y-auto'>
                {isLoading ? (
                  <div className='p-4'>
                    <RecipientSkeleton />
                    <RecipientSkeleton />
                    <RecipientSkeleton />
                  </div>
                ) : searchResults.length > 0 ? (
                  searchResults.map((recipient, index) => (
                    <div
                      key={index}
                      className={`flex items-center gap-3 p-3 ${recipient.email ? 'hover:bg-primary/10 cursor-pointer' : 'opacity-70 cursor-not-allowed'}`}
                      onClick={() => (recipient.email ? selectRecipient(recipient) : null)}
                    >
                      <Avatar>
                        <AvatarFallback className='bg-primary text-primary-foreground'>{recipient.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className='font-medium'>
                          {recipient.name} {recipient.surname}
                        </div>
                        {recipient.email ? <div className='text-sm text-muted-foreground'>{recipient.email}</div> : <div className='text-sm text-destructive'>{t('deliveries.noEmailFound')}</div>}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className='p-4 text-center text-muted-foreground'>{t('deliveries.noResultsFoundForRecipient')}</div>
                )}
              </div>
            )}
          </div>

          <div className={`flex items-center justify-between gap-3 p-2 border rounded-md h-9 ${!selectedRecipientInfo ? 'hidden' : ''} ${disabled ? 'opacity-70' : ''}`}>
            <div className='flex items-center gap-3'>
              <div className='flex items-baseline gap-2'>
                {selectedRecipientInfo?.name ? (
                  <>
                    <div className='font-medium'>
                      {selectedRecipientInfo.name} {selectedRecipientInfo.surname}
                    </div>
                    <div className='text-sm text-muted-foreground'>{selectedRecipientInfo.email}</div>
                  </>
                ) : (
                  <div className='font-medium'>{value}</div>
                )}
              </div>
            </div>
            <button
              type='button'
              onClick={clearRecipient}
              className={`text-muted-foreground ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:text-foreground'}`}
              aria-label={t('deliveries.removeRecipient')}
              disabled={disabled}
            >
              <X className='h-4 w-4' />
            </button>
          </div>
        </>
      )}

      <Input
        type='hidden'
        id={id}
        name={name}
        value={value}
        readOnly
        disabled={disabled}
        autoComplete='off'
      />

      {/* Confirmation Dialog */}
      <Dialog
        open={showRefreshDialog}
        onOpenChange={setShowRefreshDialog}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('deliveries.confirmRefresh')}</DialogTitle>
            <DialogDescription>{t('deliveries.confirmRefreshDescription')}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant='outline'
              onClick={(e) => {
                e.preventDefault()
                setShowRefreshDialog(false)
              }}
              type='button'
            >
              {t('common.cancel')}
            </Button>
            <Button
              onClick={(e) => {
                e.preventDefault()
                handleRefresh()
              }}
              disabled={isRefreshing}
              type='button'
            >
              {isRefreshing ? t('common.refreshing') : t('common.refresh')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
