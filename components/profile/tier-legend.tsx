'use client'

import { TIER_CONFIG, TIER_ORDER } from '@/lib/muscle-colors'

export function TierLegend() {
  return (
    <div className="flex flex-wrap gap-3 justify-center">
      {TIER_ORDER.map((tier) => {
        const config = TIER_CONFIG[tier]
        return (
          <div key={tier} className="flex items-center gap-1.5">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: config.color }}
            />
            <span className="text-xs text-muted-foreground">{config.label}</span>
          </div>
        )
      })}
    </div>
  )
}
