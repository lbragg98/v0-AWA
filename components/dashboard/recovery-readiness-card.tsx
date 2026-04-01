'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Activity, Info } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface RecoveryReadinessCardProps {
  recoveryScore?: number
}

export function RecoveryReadinessCard({ recoveryScore = 85 }: RecoveryReadinessCardProps) {
  const getRecoveryLevel = (score: number) => {
    if (score >= 80) return { label: 'Ready', color: 'bg-green-500/20 text-green-700 dark:text-green-400' }
    if (score >= 60) return { label: 'Moderate', color: 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-400' }
    return { label: 'Recovering', color: 'bg-orange-500/20 text-orange-700 dark:text-orange-400' }
  }

  const level = getRecoveryLevel(recoveryScore)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Recovery & Readiness
        </CardTitle>
        <CardDescription>How ready are you to train?</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Readiness Score</span>
            <Badge className={`${level.color} border-0`}>
              {level.label}
            </Badge>
          </div>
          
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div 
              className="h-full bg-foreground transition-all"
              style={{ width: `${recoveryScore}%` }}
            />
          </div>
          <p className="text-right text-xs text-muted-foreground">{recoveryScore}/100</p>
        </div>

        <div className="rounded-lg bg-muted p-3 flex gap-2">
          <Info className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground">
            Recovery scores coming soon. Track your rest days and sleep to optimize recovery.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
