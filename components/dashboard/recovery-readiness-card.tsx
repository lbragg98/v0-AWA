'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Activity, AlertCircle, TrendingUp, Zap } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import type { UserReadiness } from '@/lib/recovery-readiness'
import { getReadinessLabel, getReadinessStyle } from '@/lib/recovery-readiness'

interface RecoveryReadinessCardProps {
  readiness: UserReadiness
}

export function RecoveryReadinessCard({ readiness }: RecoveryReadinessCardProps) {
  const style = getReadinessStyle(readiness.state)
  const label = getReadinessLabel(readiness.state)
  
  // Sort factors by impact
  const positiveFactors = readiness.factors.filter((f) => f.impact === 'positive')
  const negativeFactors = readiness.factors.filter((f) => f.impact === 'negative')

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Recovery & Readiness
        </CardTitle>
        <CardDescription>How ready are you to train?</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main Score */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Readiness Score</span>
            <Badge className={`${style.bgColor} ${style.color} border-0`}>
              {label}
            </Badge>
          </div>
          
          <div className="h-3 rounded-full bg-muted overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-primary to-primary/70 transition-all"
              style={{ width: `${readiness.score}%` }}
            />
          </div>
          <p className="text-right text-sm font-semibold">{readiness.score}/100</p>
        </div>

        {/* Message */}
        <div className={`rounded-lg ${style.bgColor} p-3 space-y-1`}>
          <p className={`text-sm font-semibold ${style.color}`}>{readiness.message}</p>
          <p className="text-xs text-muted-foreground">{readiness.recommendation}</p>
        </div>

        {/* Key Factors */}
        {readiness.factors.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase">Contributing Factors</p>
            
            {positiveFactors.length > 0 && (
              <div className="space-y-1">
                {positiveFactors.map((factor) => (
                  <div key={factor.name} className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                      <TrendingUp className="w-3 h-3" />
                      {factor.name}
                    </span>
                    <span className="font-medium text-green-600 dark:text-green-400">+{Math.round((factor.value - 50) / 2)}</span>
                  </div>
                ))}
              </div>
            )}

            {negativeFactors.length > 0 && (
              <div className="space-y-1">
                {negativeFactors.map((factor) => (
                  <div key={factor.name} className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1 text-red-600 dark:text-red-400">
                      <AlertCircle className="w-3 h-3" />
                      {factor.name}
                    </span>
                    <span className="font-medium text-red-600 dark:text-red-400">{Math.round((factor.value - 50) / 2)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
