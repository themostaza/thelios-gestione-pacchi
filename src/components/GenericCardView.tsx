'use client'

import { ReactNode } from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button, ButtonProps } from '@/components/ui/button'

export interface FooterButton extends ButtonProps {
  label: string
  icon?: ReactNode
}

interface GenericCardViewProps {
  title: string
  description?: string
  children: ReactNode
  footerButtons?: FooterButton[]
  secondaryFooterButtons?: FooterButton[]
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
  footerButtons = [],
  secondaryFooterButtons = [],
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

      {(footerButtons.length > 0 || secondaryFooterButtons.length > 0) && (
        <CardFooter className={`flex flex-col space-y-4 pt-4 ${footerClassName}`}>
          {footerButtons.map((button, index) => {
            const { label, icon, ...buttonProps } = button
            return (
              <Button
                key={index}
                className="w-full"
                {...buttonProps}
              >
                {icon && <span className="mr-2">{icon}</span>}
                {label}
              </Button>
            )
          })}
          
          {secondaryFooterButtons.map((button, index) => {
            const { label, icon, ...buttonProps } = button
            return (
              <Button
                key={index}
                className="w-full"
                variant="outline"
                {...buttonProps}
              >
                {icon && <span className="mr-2">{icon}</span>}
                {label}
              </Button>
            )
          })}
        </CardFooter>
      )}
    </Card>
  )
} 