'use client'

import { Search, X } from 'lucide-react'
import { useState, useEffect } from 'react'

import { searchRecipients } from '@/app/actions/recipientActions'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
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

  const debouncedQuery = useDebounce(searchQuery, 500)

  useEffect(() => {
    if (value) {
      setSearchQuery(value)
      // When value is set programmatically (e.g. from scan), show results and trigger search
      if (value.length > 0 && !selectedRecipientInfo) {
        setShowResults(true)
        setIsLoading(true)
      }
    } else {
      setSearchQuery('')
      setSelectedRecipientInfo(null)
    }
  }, [value])

  useEffect(() => {
    if (debouncedQuery) {
      handleRecipientSearch(debouncedQuery)
    } else {
      setSearchResults([])
      setIsLoading(false)
    }
  }, [debouncedQuery])

  const handleRecipientSearch = async (query: string) => {
    if (!query) {
      setSearchResults([])
      return
    }

    setIsLoading(true)
    try {
      const data = await searchRecipients(query)
      setSearchResults(data)
      // When search results come back and we have results, keep dropdown open
      if (data.length > 0) {
        setShowResults(true)
      }
    } catch (error) {
      console.error('Error fetching recipients:', error)
      setSearchResults([])
    } finally {
      setIsLoading(false)
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

  const selectRecipient = (recipient: Recipient) => {
    setSearchQuery(`${recipient.name} ${recipient.surname}`)
    setSelectedRecipientInfo(recipient)
    setShowResults(false)

    onChange(recipient.email)
  }

  const clearRecipient = () => {
    setSelectedRecipientInfo(null)
    setSearchQuery('')
    onChange('')
  }

  return (
    <div className='space-y-2'>
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
                  className={`flex items-center gap-3 p-3 ${
                    recipient.email 
                      ? 'hover:bg-primary/10 cursor-pointer' 
                      : 'opacity-70 cursor-not-allowed'
                  }`}
                  onClick={() => recipient.email ? selectRecipient(recipient) : null}
                >
                  <Avatar>
                    <AvatarFallback className='bg-primary text-primary-foreground'>{recipient.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className='font-medium'>
                      {recipient.name} {recipient.surname}
                    </div>
                    {recipient.email
                    ? <div className='text-sm text-muted-foreground'>{recipient.email}</div>
                    : <div className='text-sm text-destructive'>{t('deliveries.noEmailFound')}</div>}
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

      <Input
        type='hidden'
        id={id}
        name={name}
        value={value}
        readOnly
        disabled={disabled}
        autoComplete='off'
      />
    </div>
  )
}
