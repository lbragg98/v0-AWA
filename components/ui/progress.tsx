'use client'

import * as React from 'react'
import * as ProgressPrimitive from '@radix-ui/react-progress'

import { cn } from '@/lib/utils'

function Progress({
  className,
  value,
  ...props
}: React.ComponentProps<typeof ProgressPrimitive.Root>) {
  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      className={cn(
        'relative h-2.5 w-full overflow-hidden rounded-full border border-white/8 bg-white/[0.06] shadow-[inset_0_1px_2px_rgba(2,6,23,0.45)]',
        className,
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className="relative h-full w-full flex-1 rounded-full bg-[linear-gradient(90deg,rgba(83,193,255,0.72),rgba(111,229,255,0.98))] transition-all duration-700 after:absolute after:right-0 after:top-1/2 after:h-3 after:w-5 after:-translate-y-1/2 after:rounded-full after:bg-white/70 after:blur-[7px]"
        style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
      />
    </ProgressPrimitive.Root>
  )
}

export { Progress }
