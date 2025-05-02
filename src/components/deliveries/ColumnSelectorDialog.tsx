import { useState, useEffect } from 'react'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogTrigger, DialogContent, DialogTitle, DialogDescription, DialogClose } from '@/components/ui/dialog'
import { useDeliveries } from '@/context/deliveriesContext'
import { useTranslation } from '@/i18n/I18nProvider'

export default function ColumnSelectorDialog() {
  const { t } = useTranslation()
  const { columnVisibility, setColumnVisibility } = useDeliveries()
  const [tempColumnVisibility, setTempColumnVisibility] = useState(columnVisibility)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const toggleTempColumnVisibility = (column: keyof typeof tempColumnVisibility) => {
    setTempColumnVisibility((prevVisibility) => ({
      ...prevVisibility,
      [column]: !prevVisibility[column],
    }))
  }

  const applyColumnVisibilityChanges = () => {
    setColumnVisibility(tempColumnVisibility)
    setIsDialogOpen(false)
  }

  useEffect(() => {
    if (isDialogOpen) {
      setTempColumnVisibility(columnVisibility)
    }
  }, [isDialogOpen, columnVisibility])

  return (
    <Dialog
      open={isDialogOpen}
      onOpenChange={setIsDialogOpen}
    >
      <DialogTrigger asChild>
        <Button variant='outline' size='sm'>{t('deliveries.configureColumns')}</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>{t('deliveries.columnVisibility')}</DialogTitle>
        <DialogDescription>{t('deliveries.selectColumns')}</DialogDescription>
        <div className='flex flex-col space-y-2'>
          {Object.keys(tempColumnVisibility).map((column) => (
            <div
              key={column}
              className='flex items-center'
            >
              <Checkbox
                checked={tempColumnVisibility[column as keyof typeof tempColumnVisibility]}
                onCheckedChange={() => toggleTempColumnVisibility(column as keyof typeof tempColumnVisibility)}
                aria-label={t(`deliveries.${column}`)}
              />
              <label className='ml-2' htmlFor={`column-checkbox-${column}`}>
                {t(`deliveries.${column}`)}
              </label>
            </div>
          ))}
        </div>
        <div className='flex justify-end space-x-2 mt-4'>
          <DialogClose asChild>
            <Button
              variant='outline'
              onClick={() => setIsDialogOpen(false)}
            >
              {t('common.close')}
            </Button>
          </DialogClose>
          <Button
            variant='default'
            onClick={applyColumnVisibilityChanges}
          >
            {t('common.apply')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
