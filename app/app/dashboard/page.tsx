import { createClient } from '@/lib/supabase/server'
import { StatsCards } from '@/components/dashboard/stats-cards'
import { GoalsCard } from '@/components/dashboard/goals-card'
import { RecentWorkoutsCard } from '@/components/dashboard/recent-workouts-card'
import { ProfileSummaryCard } from '@/components/dashboard/profile-summary-card'
import { QuickStartCard } from '@/components/dashboard/quick-start-card'
import type { Profile, FitnessProfile, UserStreak, Goal, CompletedWorkout, DashboardStats } from '@/types/database'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  // Fetch all dashboard data in parallel
  const [
    profileResult,
    fitnessProfileResult,
    streakResult,
    goalsResult,
    workoutsResult,
    weeklyWorkoutsResult,
  ] = await Promise.all([
    supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single(),
    supabase
      .from('fitness_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single(),
    supabase
      .from('user_streaks')
      .select('*')
      .eq('user_id', user.id)
      .single(),
    supabase
      .from('goals')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('completed_workouts')
      .select('*')
      .eq('user_id', user.id)
      .order('started_at', { ascending: false })
      .limit(10),
    // Get workouts from this week
    supabase
      .from('completed_workouts')
      .select('id, total_volume')
      .eq('user_id', user.id)
      .gte('started_at', getStartOfWeek().toISOString()),
  ])

  const profile = profileResult.data as Profile | null
  const fitnessProfile = fitnessProfileResult.data as FitnessProfile | null
  const streak = streakResult.data as UserStreak | null
  const goals = (goalsResult.data || []) as Goal[]
  const workouts = (workoutsResult.data || []) as CompletedWorkout[]
  const weeklyWorkouts = weeklyWorkoutsResult.data || []

  // Calculate stats
  const stats: DashboardStats = {
    workoutsThisWeek: weeklyWorkouts.length,
    totalWorkouts: workouts.length,
    currentStreak: streak?.current_streak || 0,
    longestStreak: streak?.longest_streak || 0,
    activeGoals: goals.filter(g => g.status === 'active').length,
    totalVolume: workouts.reduce((sum, w) => sum + (w.total_volume || 0), 0),
  }

  const firstName = profile?.full_name?.split(' ')[0] || 'there'

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          Welcome back, {firstName}
        </h1>
        <p className="mt-1 text-muted-foreground">
          {getGreetingMessage(stats)}
        </p>
      </div>

      {/* Stats Overview */}
      <StatsCards stats={stats} fitnessProfile={fitnessProfile} />

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Workouts */}
        <div className="lg:col-span-2 space-y-6">
          <RecentWorkoutsCard workouts={workouts} />
          <GoalsCard goals={goals} />
        </div>

        {/* Right Column - Profile & Quick Start */}
        <div className="space-y-6">
          <QuickStartCard />
          <ProfileSummaryCard profile={profile} fitnessProfile={fitnessProfile} />
        </div>
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

function getGreetingMessage(stats: DashboardStats): string {
  if (stats.totalWorkouts === 0) {
    return 'Ready to start your fitness journey?'
  }
  if (stats.currentStreak >= 7) {
    return `Amazing! You're on a ${stats.currentStreak}-day streak. Keep it up!`
  }
  if (stats.workoutsThisWeek > 0) {
    return `You've completed ${stats.workoutsThisWeek} workout${stats.workoutsThisWeek > 1 ? 's' : ''} this week. Let's keep going!`
  }
  return 'Ready to forge your strength today?'
}
