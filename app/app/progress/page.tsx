import { createClient } from '@/lib/supabase/server'
import { MuscleSummaryCards } from '@/components/progress/muscle-summary-cards'
import { StrengthTrends } from '@/components/progress/strength-trends'
import { VolumeTrends } from '@/components/progress/volume-trends'
import { GoalProgressSection } from '@/components/progress/goal-progress-section'
import { InsightsCards } from '@/components/progress/insights-cards'
import { PRProgress } from '@/components/progress/pr-progress'
import type { MuscleProgress, CompletedWorkout, Goal, PersonalRecord } from '@/types/database'

export default async function ProgressPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  // Fetch all progress data in parallel
  const [
    muscleProgressResult,
    workoutsResult,
    goalsResult,
    personalRecordsResult,
  ] = await Promise.all([
    supabase
      .from('muscle_progress')
      .select('*, muscle_group:muscle_groups(*)')
      .eq('user_id', user.id),
    supabase
      .from('completed_workouts')
      .select('*')
      .eq('user_id', user.id)
      .order('started_at', { ascending: false }),
    supabase
      .from('goals')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('personal_records')
      .select('*')
      .eq('user_id', user.id)
      .order('achieved_at', { ascending: false }),
  ])

  const muscleProgress = (muscleProgressResult.data || []) as MuscleProgress[]
  const workouts = (workoutsResult.data || []) as CompletedWorkout[]
  const goals = (goalsResult.data || []) as Goal[]
  const personalRecords = (personalRecordsResult.data || []) as PersonalRecord[]

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Progress</h1>
        <p className="mt-1 text-muted-foreground">
          Track your fitness progress, muscle development, and personal records
        </p>
      </div>

      {/* Muscle Summary Cards */}
      <MuscleSummaryCards muscleProgress={muscleProgress} />

      {/* Insights Cards */}
      <InsightsCards muscleProgress={muscleProgress} workouts={workouts} />

      {/* Charts Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        <StrengthTrends muscleProgress={muscleProgress} />
        <VolumeTrends workouts={workouts} />
      </div>

      {/* Personal Records */}
      <PRProgress personalRecords={personalRecords} />

      {/* Goals Section */}
      <GoalProgressSection goals={goals} />
    </div>
  )
}
