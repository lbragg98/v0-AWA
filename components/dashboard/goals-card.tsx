'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Target, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Goal } from '@/types/database'

interface GoalsCardProps {
  goals: Goal[]
}

export function GoalsCard({ goals }: GoalsCardProps) {
  const activeGoals = goals.filter(g => g.status === 'active')

  if (activeGoals.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Goals
          </CardTitle>
          <CardDescription>Track your fitness objectives</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="rounded-full bg-muted p-3">
              <Target className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="mt-4 text-sm font-medium">No active goals</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Set goals to track your progress and stay motivated
            </p>
            <Button variant="outline" size="sm" className="mt-4" disabled>
              <Plus className="mr-2 h-4 w-4" />
              Add Goal
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Goals
        </CardTitle>
        <CardDescription>
          {activeGoals.length} active {activeGoals.length === 1 ? 'goal' : 'goals'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {activeGoals.slice(0, 3).map((goal) => {
          const progress = goal.target_value > 0 
            ? Math.min((goal.current_value / goal.target_value) * 100, 100)
            : 0

          return (
            <div key={goal.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{goal.title}</span>
                <span className="text-xs text-muted-foreground">
                  {goal.current_value}/{goal.target_value} {goal.unit}
                </span>
              </div>
              <Progress value={progress} className="h-2" />
              {goal.deadline && (
                <p className="text-xs text-muted-foreground">
                  Due: {new Date(goal.deadline).toLocaleDateString()}
                </p>
              )}
            </div>
          )
        })}
        {activeGoals.length > 3 && (
          <p className="text-xs text-muted-foreground text-center pt-2">
            +{activeGoals.length - 3} more goals
          </p>
        )}
      </CardContent>
    </Card>
  )
}
