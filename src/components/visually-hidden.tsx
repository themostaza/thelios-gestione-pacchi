import * as React from 'react'

import { cn } from '@/lib/utils'

const VisuallyHidden = React.forwardRef<HTMLSpanElement, React.HTMLAttributes<HTMLSpanElement>>(({ className, ...props }, ref) => {
  return (
    <span
      ref={ref}
      className={cn('absolute h-[1px] w-[1px] overflow-hidden whitespace-nowrap p-0 -m-[1px] border-0', className)}
      {...props}
    />
  )
})
VisuallyHidden.displayName = 'VisuallyHidden'

export { VisuallyHidden }
