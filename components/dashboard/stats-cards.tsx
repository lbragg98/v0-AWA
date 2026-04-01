import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dumbbell, Flame, Target, TrendingUp } from 'lucide-react'
import type { DashboardStats, FitnessProfile } from '@/types/database'

interface StatsCardsProps {
  stats: DashboardStats
  fitnessProfile: FitnessProfile | null
}

export function StatsCards({ stats, fitnessProfile }: StatsCardsProps) {
  const workoutTarget = fitnessProfile?.workout_frequency || 3

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Workouts This Week</CardTitle>
          <Dumbbell className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.workoutsThisWeek}</div>
          <p className="text-xs text-muted-foreground">
            {stats.workoutsThisWeek >= workoutTarget 
              ? 'Goal reached!' 
              : `${workoutTarget - stats.workoutsThisWeek} more to hit your goal`}
          </p>
          <div className="mt-2 h-1.5 w-full rounded-full bg-muted">
            <div 
              className="h-1.5 rounded-full bg-foreground transition-all"
              style={{ width: `${Math.min((stats.workoutsThisWeek / workoutTarget) * 100, 100)}%` }}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
          <Flame className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {stats.currentStreak} {stats.currentStreak === 1 ? 'day' : 'days'}
          </div>
          <p className="text-xs text-muted-foreground">
            {stats.currentStreak > 0 
              ? `Best: ${stats.longestStreak} days` 
              : 'Start your streak today'}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Workouts</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalWorkouts}</div>
          <p className="text-xs text-muted-foreground">
            {stats.totalWorkouts > 0 
              ? `${stats.totalVolume.toLocaleString()} lbs lifted total`
              : 'Complete your first workout'}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Goals</CardTitle>
          <Target className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.activeGoals}</div>
          <p className="text-xs text-muted-foreground">
            {stats.activeGoals > 0 
              ? 'Goals in progress' 
              : 'Set your first goal'}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
