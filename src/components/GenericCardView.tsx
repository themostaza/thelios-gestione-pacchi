'use client'

import { ReactNode } from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button, ButtonProps } from '@/components/ui/button'

interface GenericCardViewProps {
  title: string
  description?: string
  children: ReactNode
  footer?: ReactNode
  useScrollArea?: boolean
  headerRight?: ReactNode
  className?: string
  contentClassName?: string
  footerClassName?: string
}

export default function GenericCardView({
  title,
  description,
  children,
  footer,
  useScrollArea = true,
  headerRight,
  className = 'w-full',
  contentClassName = '',
  footerClassName = ''
}: GenericCardViewProps) {
  const content = useScrollArea ? (
    <ScrollArea className="h-full flex-1 overflow-auto">
      {children}
    </ScrollArea>
  ) : children

  return (
    <Card className={`flex flex-col ${className}`}>
      <CardHeader>
        <div className='flex justify-between items-center'>
          <div>
            <CardTitle className='text-2xl font-bold'>{title}</CardTitle>
            {description && <CardDescription className='mt-2'>{description}</CardDescription>}
          </div>
          {headerRight && <div>{headerRight}</div>}
        </div>
        <Separator className='mt-4' />
      </CardHeader>

      <div className='flex-1 overflow-hidden flex flex-col'>
        <CardContent className={`flex-1 overflow-hidden ${contentClassName}`}>
          <div className='flex flex-col md:flex-row gap-4 h-full'>
            <div className='w-full flex flex-col h-full overflow-hidden'>
              {content}
            </div>
          </div>
        </CardContent>
      </div>

      {footer && (
        <CardFooter className={`pt-4 ${footerClassName}`}>
          {footer}
        </CardFooter>
      )}
    </Card>
  )
} 