'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AlertCircle, TrendingUp, Zap, Scale, Lightbulb, ChevronDown } from 'lucide-react'
import { useState } from 'react'
import type { AdjustmentSuggestion, PlanAnalysis } from '@/lib/adaptive-planning'

interface PlanAdjustmentsPanelProps {
  analysis: PlanAnalysis
  onApplySuggestion?: (suggestion: AdjustmentSuggestion) => Promise<void>
  isLoading?: boolean
}

export function PlanAdjustmentsPanel({
  analysis,
  onApplySuggestion,
  isLoading = false,
}: PlanAdjustmentsPanelProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set())

  const handleApply = async (suggestion: AdjustmentSuggestion) => {
    if (onApplySuggestion && !isLoading) {
      try {
        await onApplySuggestion(suggestion)
        setAppliedIds((prev) => new Set([...prev, suggestion.id]))
      } catch (error) {
        console.error('[v0] Error applying suggestion:', error)
      }
    }
  }

  const getIcon = (type: AdjustmentSuggestion['type']) => {
    switch (type) {
      case 'exercise_swap':
        return <TrendingUp className="h-4 w-4" />
      case 'volume_reduction':
        return <Scale className="h-4 w-4" />
      case 'volume_increase':
        return <Zap className="h-4 w-4" />
      case 'weak_muscle_support':
        return <Lightbulb className="h-4 w-4" />
      case 'recovery_modification':
        return <AlertCircle className="h-4 w-4" />
      default:
        return <Lightbulb className="h-4 w-4" />
    }
  }

  const getCategoryColor = (category: AdjustmentSuggestion['category']) => {
    switch (category) {
      case 'recovery':
        return 'bg-orange-500/20 text-orange-700 dark:text-orange-400'
      case 'balance':
        return 'bg-blue-500/20 text-blue-700 dark:text-blue-400'
      case 'strength':
        return 'bg-green-500/20 text-green-700 dark:text-green-400'
      case 'efficiency':
        return 'bg-purple-500/20 text-purple-700 dark:text-purple-400'
      default:
        return 'bg-gray-500/20 text-gray-700 dark:text-gray-400'
    }
  }

  return (
    <div className="space-y-4">
      {/* Summary Header */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5" />
                Plan Analysis
              </CardTitle>
              <CardDescription>AI-powered suggestions to optimize your workout plan</CardDescription>
            </div>
            <Badge variant="outline">{analysis.suggestions.length} suggestions</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-3 gap-3 text-sm">
            <div className="space-y-1">
              <p className="text-muted-foreground">Balance</p>
              <p className="font-semibold text-foreground capitalize">{analysis.overallBalance.replace('_', ' ')}</p>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground">Recovery Fit</p>
              <p className="font-semibold text-foreground capitalize">{analysis.recoveryFit}</p>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground">Weekly Volume</p>
              <p className="font-semibold text-foreground">{Math.round(analysis.averageWeeklyVolume)} reps</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Muscle Imbalances */}
      {analysis.muscleImbalances.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Detected Imbalances</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {analysis.muscleImbalances.map((imbalance, idx) => (
              <div key={idx} className="flex items-start gap-2 text-sm">
                <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">{imbalance.muscle}</p>
                  <p className="text-muted-foreground text-xs">{imbalance.issue}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Suggestions List */}
      <div className="space-y-2">
        {analysis.suggestions.map((suggestion) => {
          const isApplied = appliedIds.has(suggestion.id)
          const isExpanded = expandedId === suggestion.id

          return (
            <Card key={suggestion.id} className={isApplied ? 'opacity-60' : ''}>
              <button
                className="w-full text-left"
                onClick={() => setExpandedId(isExpanded ? null : suggestion.id)}
                disabled={isApplied}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="mt-1 flex-shrink-0">{getIcon(suggestion.type)}</div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap gap-y-1">
                          <CardTitle className="text-sm">{suggestion.title}</CardTitle>
                          <Badge className={`${getCategoryColor(suggestion.category)} border-0 text-xs`}>
                            {suggestion.category}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {suggestion.confidence}% confidence
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{suggestion.reason}</p>
                      </div>
                    </div>
                    <ChevronDown
                      className={`h-5 w-5 text-muted-foreground flex-shrink-0 transition-transform ${
                        isExpanded ? 'rotate-180' : ''
                      }`}
                    />
                  </div>
                </CardHeader>
              </button>

              {isExpanded && (
                <CardContent className="space-y-3 border-t pt-3">
                  <div className="text-xs space-y-2">
                    <div>
                      <p className="font-semibold text-muted-foreground">Current</p>
                      <p className="text-foreground">{JSON.stringify(suggestion.currentState, null, 2)}</p>
                    </div>
                    <div>
                      <p className="font-semibold text-muted-foreground">Suggested</p>
                      <p className="text-foreground">{JSON.stringify(suggestion.suggestedState, null, 2)}</p>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setExpandedId(null)}
                    >
                      Dismiss
                    </Button>
                    {onApplySuggestion && (
                      <Button
                        size="sm"
                        onClick={() => handleApply(suggestion)}
                        disabled={isLoading || isApplied}
                      >
                        {isApplied ? 'Applied' : 'Apply Change'}
                      </Button>
                    )}
                  </div>
                </CardContent>
              )}
            </Card>
          )
        })}

        {analysis.suggestions.length === 0 && (
          <Card className="text-center py-8">
            <p className="text-muted-foreground">No adjustments needed. Your plan looks great!</p>
          </Card>
        )}
      </div>
    </div>
  )
}
