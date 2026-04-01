'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, BarChart3, TrendingDown } from 'lucide-react'
import type { TrainingBalance } from '@/lib/training-balance'

interface TrainingBalanceCardProps {
  balance: TrainingBalance
}

export function TrainingBalanceCard({ balance }: TrainingBalanceCardProps) {
  const deloadStyle = balance.deloadRecommendation.shouldDeload
    ? balance.deloadRecommendation.severity === 'strong'
      ? 'bg-red-500/10 border-red-500/30'
      : 'bg-yellow-500/10 border-yellow-500/30'
    : 'bg-green-500/10 border-green-500/30'

  return (
    <div className="space-y-4">
      {/* Deload Recommendation */}
      {balance.deloadRecommendation.shouldDeload && (
        <Card className={`border ${deloadStyle}`}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <TrendingDown className="h-4 w-4" />
              Deload Week Recommended
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">{balance.deloadRecommendation.reason}</p>
            <p className="text-sm font-medium">{balance.deloadRecommendation.suggestion}</p>
          </CardContent>
        </Card>
      )}

      {/* Training Balance Status */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Training Balance
          </CardTitle>
          <CardDescription>Overall muscle group distribution</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Health Badge */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Overall Status</span>
            <Badge
              className={
                balance.overallHealth === 'balanced'
                  ? 'bg-green-500/20 text-green-700 dark:text-green-400 border-0'
                  : balance.overallHealth === 'slightly_imbalanced'
                    ? 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border-0'
                    : 'bg-orange-500/20 text-orange-700 dark:text-orange-400 border-0'
              }
            >
              {balance.overallHealth === 'balanced'
                ? 'Well Balanced'
                : balance.overallHealth === 'slightly_imbalanced'
                  ? 'Slightly Imbalanced'
                  : 'Highly Imbalanced'}
            </Badge>
          </div>

          {/* Least Trained */}
          {balance.leastTrained.length > 0 && (
            <div className="space-y-2 pt-2 border-t">
              <p className="text-xs font-semibold text-muted-foreground uppercase">Undertrained</p>
              {balance.leastTrained.slice(0, 2).map((muscle) => (
                <div key={muscle.muscleId} className="text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">{muscle.muscleName}</span>
                    <span className="text-xs text-muted-foreground">{muscle.daysAgo}d ago</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Imbalances */}
          {balance.imbalances.length > 0 && (
            <div className="space-y-2 pt-2 border-t">
              <p className="text-xs font-semibold text-muted-foreground uppercase">Imbalances</p>
              {balance.imbalances.map((imbalance, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <AlertCircle className="h-3 w-3 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-muted-foreground">{imbalance.message}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
