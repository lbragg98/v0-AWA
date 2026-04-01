import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import type { Goal } from '@/types/database'

interface GoalProgressSectionProps {
  goals: Goal[]
}

export function GoalProgressSection({ goals }: GoalProgressSectionProps) {
  if (!goals || goals.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Goal Progress</CardTitle>
          <CardDescription>Track your fitness goals</CardDescription>
        </CardHeader>
        <CardContent className="text-center text-sm text-muted-foreground py-8">
          No active goals yet. Set some goals to track your progress.
        </CardContent>
      </Card>
    )
  }

  const activeGoals = goals.filter((g) => g.status === 'active')
  const completedGoals = goals.filter((g) => g.status === 'completed')
  const failedGoals = goals.filter((g) => g.status === 'failed')

  return (
    <Card>
      <CardHeader>
        <CardTitle>Goal Progress</CardTitle>
        <CardDescription>
          {activeGoals.length} active • {completedGoals.length} completed
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {activeGoals.length === 0 && completedGoals.length === 0 && failedGoals.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground">No goals found</p>
        ) : (
          <>
            {/* Active Goals */}
            {activeGoals.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-foreground">Active Goals</h3>
                {activeGoals.map((goal) => {
                  const progress = goal.target_value > 0 ? (goal.current_value / goal.target_value) * 100 : 0
                  return (
                    <div key={goal.id} className="space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-medium text-foreground">{goal.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {goal.current_value} / {goal.target_value} {goal.unit || ''}
                          </p>
                        </div>
                        <Badge variant="secondary">{Math.round(progress)}%</Badge>
                      </div>
                      <Progress value={Math.min(progress, 100)} className="h-2" />
                    </div>
                  )
                })}
              </div>
            )}

            {/* Completed Goals */}
            {completedGoals.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-foreground">Completed Goals</h3>
                {completedGoals.slice(0, 3).map((goal) => (
                  <div key={goal.id} className="flex items-center justify-between rounded-lg bg-accent/20 p-3">
                    <p className="text-sm font-medium text-foreground">{goal.title}</p>
                    <Badge className="bg-green-600 hover:bg-green-700">Completed</Badge>
                  </div>
                ))}
                {completedGoals.length > 3 && (
                  <p className="text-xs text-muted-foreground">+{completedGoals.length - 3} more completed</p>
                )}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
