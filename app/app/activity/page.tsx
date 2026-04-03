import { createClient } from '@/lib/supabase/server'
import { CompletedWorkoutsFeed } from '@/components/activity/completed-workouts-feed'
import { StreakCards } from '@/components/activity/streak-cards'
import { RecentPRsCard } from '@/components/activity/recent-prs-card'
import { AchievementsGrid } from '@/components/activity/achievements-grid'
import { WeeklySummary } from '@/components/activity/weekly-summary'
import type { CompletedWorkout, UserStreak, PersonalRecord, UserAchievement, FitnessProfile } from '@/types/database'

export default async function ActivityPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  const [
    workoutsResult,
    streakResult,
    prsResult,
    achievementsResult,
    fitnessProfileResult,
    weeklyWorkoutsResult,
  ] = await Promise.all([
    supabase.from('completed_workouts').select('*').eq('user_id', user.id).order('started_at', { ascending: false }).limit(20),
    supabase.from('user_streaks').select('*').eq('user_id', user.id).single(),
    supabase.from('personal_records').select('*').eq('user_id', user.id).order('achieved_at', { ascending: false }).limit(10),
    supabase.from('user_achievements').select('*, achievement:achievements(*)').eq('user_id', user.id).order('achieved_at', { ascending: false }),
    supabase.from('fitness_profiles').select('*').eq('user_id', user.id).single(),
    supabase.from('completed_workouts').select('id').eq('user_id', user.id).gte('started_at', getStartOfWeek().toISOString()),
  ])

  const workouts = (workoutsResult.data || []) as CompletedWorkout[]
  const streak = streakResult.data as UserStreak | null
  const prs = (prsResult.data || []) as PersonalRecord[]
  const achievements = (achievementsResult.data || []) as UserAchievement[]
  const fitnessProfile = fitnessProfileResult.data as FitnessProfile | null
  const weeklyWorkouts = weeklyWorkoutsResult.data || []

  return (
    <div className="app-shell space-y-8">
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary/75">Combat Log</p>
        <h1 className="text-3xl font-bold text-foreground md:text-4xl">Activity</h1>
        <p className="mt-1 text-muted-foreground">
          Track your progress, review your sessions, and celebrate milestones.
        </p>
      </div>

      <StreakCards streak={streak} />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div>
            <h2 className="mb-4 text-xl font-semibold text-foreground">Workout Timeline</h2>
            <CompletedWorkoutsFeed workouts={workouts} />
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <h2 className="mb-4 text-xl font-semibold text-foreground">Mission Stats</h2>
            <WeeklySummary
              workoutsThisWeek={weeklyWorkouts.length}
              expectedWorkouts={fitnessProfile?.workout_frequency || 3}
            />
          </div>

          <div>
            <h2 className="mb-4 text-xl font-semibold text-foreground">Milestones</h2>
            <RecentPRsCard personalRecords={prs} />
          </div>
        </div>
      </div>

      <div>
        <h2 className="mb-4 text-xl font-semibold text-foreground">Achievements</h2>
        <AchievementsGrid achievements={achievements} />
      </div>
    </div>
  )
}

function getStartOfWeek(): Date {
  const now = new Date()
  const dayOfWeek = now.getDay()
  const startOfWeek = new Date(now)
  startOfWeek.setDate(now.getDate() - dayOfWeek)
  startOfWeek.setHours(0, 0, 0, 0)
  return startOfWeek
}
