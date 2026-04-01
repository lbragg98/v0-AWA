import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Zap, Flame, TrendingUp, BarChart3 } from 'lucide-react'
import type { MuscleProgress, CompletedWorkout } from '@/types/database'

interface InsightsCardsProps {
  muscleProgress: MuscleProgress[]
  workouts: CompletedWorkout[]
}

export function InsightsCards({ muscleProgress, workouts }: InsightsCardsProps) {
  // Calculate insights
  const leastTrainedMuscle = muscleProgress
    .filter((mp) => mp.last_trained_at)
    .sort((a, b) => {
      const dateA = a.last_trained_at ? new Date(a.last_trained_at).getTime() : 0
      const dateB = b.last_trained_at ? new Date(b.last_trained_at).getTime() : 0
      return dateA - dateB
    })[0]

  const mostImprovedMuscle = muscleProgress
    .sort((a, b) => b.xp - a.xp)[0]

  const weakestMuscle = muscleProgress
    .sort((a, b) => a.level - b.level)[0]

  // Calculate momentum (workouts this week)
  const thisWeek = new Date()
  thisWeek.setDate(thisWeek.getDate() - 7)
  const recentWorkouts = workouts.filter((w) => new Date(w.started_at) > thisWeek).length

  // Calculate consistency (workouts with last 30 days)
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const monthWorkouts = workouts.filter((w) => new Date(w.started_at) > thirtyDaysAgo).length

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Current Momentum */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <Zap className="h-4 w-4" />
            Momentum
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-2xl font-bold text-foreground">{recentWorkouts}</p>
          <p className="text-xs text-muted-foreground">Workouts this week</p>
        </CardContent>
      </Card>

      {/* Consistency Summary */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <Flame className="h-4 w-4" />
            Consistency
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-2xl font-bold text-foreground">{monthWorkouts}</p>
          <p className="text-xs text-muted-foreground">Workouts last 30 days</p>
        </CardContent>
      </Card>

      {/* Most Improved */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <TrendingUp className="h-4 w-4" />
            Most Improved
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-lg font-bold text-foreground truncate">
            {mostImprovedMuscle?.muscle_group?.display_name || '—'}
          </p>
          <p className="text-xs text-muted-foreground">
            +{mostImprovedMuscle?.xp || 0} XP
          </p>
        </CardContent>
      </Card>

      {/* Needs Attention */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <BarChart3 className="h-4 w-4" />
            Needs Work
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-lg font-bold text-foreground truncate">
            {weakestMuscle?.muscle_group?.display_name || '—'}
          </p>
          <p className="text-xs text-muted-foreground">
            Level {weakestMuscle?.level || 0}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
