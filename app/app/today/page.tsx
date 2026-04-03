import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar, Zap, Target, Plus, ArrowRight, TrendingUp, CheckCircle2, Dumbbell, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import type { Profile, FitnessProfile, Goal, WorkoutPlan, WorkoutDay, UserStreak } from '@/types/database'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const normalizeTrainingDays = (days: Array<number | string> | null | undefined): number[] =>
  (days || [])
    .map((day) => Number(day))
    .filter((day) => Number.isInteger(day) && day >= 0 && day <= 6)
    .sort((a, b) => a - b)

export default async function TodayPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const [
    profileResult,
    fitnessProfileResult,
    goalsResult,
    plansResult,
    streakResult,
    muscleProgressResult,
  ] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('fitness_profiles').select('*').eq('user_id', user.id).single(),
    supabase.from('goals').select('*').eq('user_id', user.id).eq('status', 'active').order('created_at', { ascending: false }),
    supabase.from('workout_plans').select('*').eq('user_id', user.id).eq('is_active', true).single(),
    supabase.from('user_streaks').select('*').eq('user_id', user.id).single(),
    supabase.from('muscle_progress').select('*, muscle_group:muscle_groups(*)').eq('user_id', user.id).order('level', { ascending: false }).limit(5),
  ])

  const profile = profileResult.data as Profile | null
  const fitnessProfile = fitnessProfileResult.data as FitnessProfile | null
  const goals = (goalsResult.data || []) as Goal[]
  const activePlan = plansResult.data as WorkoutPlan | null
  const streak = streakResult.data as UserStreak | null
  const topMuscles = muscleProgressResult.data || []

  let todayWorkout: (WorkoutDay & { exercises?: any[] }) | null = null
  if (activePlan) {
    const today = new Date().getDay()
    const { data: workoutDaysData } = await supabase
      .from('workout_days')
      .select('*')
      .eq('workout_plan_id', activePlan.id)
      .order('day_number')

    if (workoutDaysData && workoutDaysData.length > 0) {
      const workoutDays = workoutDaysData as WorkoutDay[]
      const preferredDays = normalizeTrainingDays(
        fitnessProfile?.preferred_training_days as Array<number | string> | undefined
      )
      const dayIndex = preferredDays.findIndex((d) => d === today)

      if (dayIndex >= 0 && workoutDays[dayIndex]) {
        todayWorkout = workoutDays[dayIndex]
        const { data: exercisesData } = await supabase
          .from('workout_exercises')
          .select('*')
          .eq('workout_day_id', todayWorkout.id)
          .order('order_index')
        todayWorkout.exercises = exercisesData || []
      }
    }
  }

  type PrimaryActionType = 'workout' | 'setup' | 'goal' | 'generate' | 'rest'

  let primaryAction: {
    title: string
    description: string
    subtext?: string
    icon: React.ReactNode
    buttons: Array<{ text: string; href: string; variant?: 'default' | 'outline' }>
    type: PrimaryActionType
  } | null = null

  if (!activePlan) {
    primaryAction = {
      title: 'Set Up Your Training Week',
      description: 'Create your weekly plan so Forge can schedule workouts and guide your progress.',
      icon: <Calendar className="h-8 w-8" />,
      buttons: [
        { text: 'Create Weekly Plan', href: '/app/workouts/plans/new', variant: 'default' },
        { text: 'Add First Goal', href: '/app/progress', variant: 'outline' },
      ],
      type: 'setup',
    }
  } else if (todayWorkout) {
    primaryAction = {
      title: `Ready for ${todayWorkout.name}?`,
      description: `${todayWorkout.exercises?.length || 0} exercises • ${todayWorkout.estimated_duration || 45} min`,
      subtext: todayWorkout.target_muscles ? `Focus: ${(todayWorkout.target_muscles as string[]).join(', ')}` : undefined,
      icon: <Zap className="h-8 w-8" />,
      buttons: [
        { text: 'Start Today\'s Workout', href: `/app/workouts/plans/${activePlan.id}/start?dayId=${todayWorkout.id}`, variant: 'default' },
      ],
      type: 'workout',
    }
  } else if (goals.length === 0) {
    primaryAction = {
      title: 'Generate Today\'s Workout',
      description: 'Let Forge create a personalized workout based on your plan and recovery.',
      icon: <Sparkles className="h-8 w-8" />,
      buttons: [
        { text: 'Generate Workout', href: '/app/workouts', variant: 'default' },
        { text: 'Add First Goal', href: '/app/progress', variant: 'outline' },
      ],
      type: 'generate',
    }
  } else {
    primaryAction = {
      title: 'Generate Today\'s Workout',
      description: 'Or take a rest day. Recovery is part of the mission.',
      icon: <Sparkles className="h-8 w-8" />,
      buttons: [
        { text: 'Generate Workout', href: '/app/workouts', variant: 'default' },
        { text: 'View Weekly Plan', href: `/app/workouts/plans/${activePlan.id}`, variant: 'outline' },
      ],
      type: 'generate',
    }
  }

  const normalizedTrainingDays = normalizeTrainingDays(
    fitnessProfile?.preferred_training_days as Array<number | string> | undefined
  )

  return (
    <div className="app-shell space-y-6">
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary/75">Forge Command</p>
        <h1 className="text-3xl font-bold text-foreground md:text-4xl">
          {format(new Date(), 'EEEE')}
        </h1>
        <p className="text-sm text-muted-foreground">
          {format(new Date(), 'MMMM d, yyyy')}
          {profile?.full_name ? ` • ${profile.full_name}` : ''}
        </p>
      </div>

      {primaryAction && (
        <Card className={`overflow-hidden rounded-[2rem] border px-0 py-0 ${
          primaryAction.type === 'workout'
            ? 'surface-glow-active border-primary/35 bg-[linear-gradient(145deg,rgba(21,42,69,0.98),rgba(11,18,28,0.98))]'
            : 'border-white/8 bg-[linear-gradient(145deg,rgba(17,24,39,0.98),rgba(11,15,20,0.98))]'
        }`}>
          <CardContent className="relative p-6 md:p-7">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(83,193,255,0.18),transparent_34%)]" />
            <div className="relative flex flex-col gap-5 md:flex-row md:items-center">
              <div className="flex flex-1 gap-4 items-start">
                <div className={`rounded-2xl border p-4 shrink-0 ${
                  primaryAction.type === 'workout'
                    ? 'border-primary/20 bg-primary/16 text-primary shadow-[0_0_24px_rgba(83,193,255,0.18)]'
                    : 'border-white/8 bg-white/6 text-primary'
                }`}>
                  {primaryAction.icon}
                </div>
                <div className="flex-1">
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-primary/75">
                    {primaryAction.type === 'workout' ? 'Today\'s Mission' : 'Mission Control'}
                  </p>
                  <h2 className="text-2xl font-bold text-foreground md:text-3xl">
                    {primaryAction.title}
                  </h2>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                    {primaryAction.description}
                  </p>
                  {primaryAction.subtext && (
                    <p className="mt-3 inline-flex rounded-full border border-primary/15 bg-primary/10 px-3 py-1 text-xs font-medium text-primary/90">
                      {primaryAction.subtext}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex shrink-0 flex-col gap-2 md:min-w-[240px]">
                {primaryAction.buttons.map((button, i) => (
                  <Button
                    key={i}
                    asChild
                    size={i === 0 ? 'lg' : 'sm'}
                    variant={button.variant as any || 'default'}
                    className={i === 0 ? 'w-full justify-between' : 'hidden md:flex md:w-full'}
                  >
                    <Link href={button.href}>
                      {button.text}
                      {i === 0 && <ArrowRight className="ml-2 h-4 w-4" />}
                    </Link>
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {todayWorkout ? (
        <Card className="overflow-hidden border-primary/20 bg-[linear-gradient(160deg,rgba(19,30,49,0.98),rgba(12,18,28,0.98))]">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Dumbbell className="h-4 w-4 text-primary" />
              Today&apos;s Workout
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div className="rounded-2xl border border-white/8 bg-white/[0.04] p-3">
                <p className="text-xs font-medium text-muted-foreground">Duration</p>
                <p className="mt-1 text-lg font-semibold">{todayWorkout.estimated_duration || '--'} min</p>
              </div>
              <div className="rounded-2xl border border-white/8 bg-white/[0.04] p-3">
                <p className="text-xs font-medium text-muted-foreground">Exercises</p>
                <p className="mt-1 text-lg font-semibold">{todayWorkout.exercises?.length || 0}</p>
              </div>
              <div className="rounded-2xl border border-primary/18 bg-primary/10 p-3">
                <p className="text-xs font-medium text-muted-foreground">Status</p>
                <p className="mt-1 text-lg font-semibold text-primary">Active</p>
              </div>
            </div>

            {todayWorkout.target_muscles && todayWorkout.target_muscles.length > 0 && (
              <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                <p className="mb-3 text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground">Target Muscles</p>
                <div className="flex flex-wrap gap-2">
                  {(todayWorkout.target_muscles as string[]).map((muscle) => (
                    <Badge key={muscle} variant="secondary">
                      {muscle}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <Button asChild size="lg" className="w-full justify-between">
              <Link href={`/app/workouts/plans/${activePlan?.id}/start?dayId=${todayWorkout.id}`}>
                <span className="inline-flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  Start Workout
                </span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : !activePlan ? (
        <Card className="border-dashed border-white/8 bg-card/80">
          <CardContent className="py-6">
            <div className="text-center">
              <div className="mx-auto mb-3 flex w-fit rounded-2xl border border-primary/15 bg-primary/10 p-3">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-sm">No Plan Yet</h3>
              <p className="mt-1 text-xs text-muted-foreground">Create a weekly plan to schedule your workouts</p>
              <Button variant="outline" size="sm" asChild className="mt-3">
                <Link href="/app/workouts/plans/new">
                  <Plus className="mr-1 h-3 w-3" />
                  Create Plan
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-dashed border-white/8 bg-card/80">
          <CardContent className="py-6">
            <div className="text-center">
              <div className="mx-auto mb-3 flex w-fit rounded-2xl border border-white/8 bg-white/[0.05] p-3">
                <CheckCircle2 className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-sm">No Workout Today</h3>
              <p className="mt-1 text-xs text-muted-foreground">You&apos;re scheduled to rest. Recovery is part of the progression loop.</p>
              <div className="mt-3 flex justify-center gap-2">
                <Button variant="outline" size="sm" asChild>
                  <Link href="/app/workouts">
                    <Sparkles className="mr-1 h-3 w-3" />
                    Generate
                  </Link>
                </Button>
                <Button variant="ghost" size="sm" asChild>
                  <Link href={`/app/workouts/plans/${activePlan?.id}`}>
                    View Plan
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {activePlan ? (
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">This Week&apos;s Schedule</p>
          <div className="grid grid-cols-7 gap-2">
            {DAYS.map((day, index) => {
              const isToday = new Date().getDay() === index
              const isTrainingDay = normalizedTrainingDays.includes(index)
              return (
                <div
                  key={day}
                  className={`flex min-h-20 flex-col items-center justify-center rounded-2xl border px-2 py-3 text-center transition-all ${
                    isToday
                      ? 'surface-glow-active border-primary/35 bg-primary/16'
                      : isTrainingDay
                      ? 'border-primary/16 bg-white/[0.06] hover:border-primary/24 hover:bg-primary/8'
                      : 'border-white/6 bg-white/[0.03]'
                  }`}
                >
                  <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{day}</span>
                  <span className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                    isToday
                      ? 'bg-primary text-primary-foreground'
                      : isTrainingDay
                      ? 'bg-primary/12 text-primary'
                      : 'bg-white/[0.05] text-muted-foreground'
                  }`}>
                    {isTrainingDay ? 'Train' : 'Rest'}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Target className="h-4 w-4 text-primary" />
              Active Goals
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            {goals.length === 0 ? (
              <div className="py-3 text-center">
                <p className="text-xs text-muted-foreground">No goals yet</p>
                <Button variant="ghost" size="sm" asChild className="mt-2 h-7 w-full">
                  <Link href="/app/progress">
                    <Plus className="mr-1 h-3 w-3" />
                    Add Goal
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {goals.slice(0, 2).map((goal) => {
                  const progress = goal.target_value > 0 ? Math.min((goal.current_value / goal.target_value) * 100, 100) : 0
                  return (
                    <div key={goal.id} className="rounded-2xl border border-white/8 bg-white/[0.04] p-3">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="font-medium text-xs">{goal.title}</span>
                        <span className="text-xs font-semibold text-primary">{Math.round(progress)}%</span>
                      </div>
                      <div className="h-2.5 overflow-hidden rounded-full border border-white/8 bg-white/[0.05]">
                        <div
                          className="h-full rounded-full bg-[linear-gradient(90deg,rgba(83,193,255,0.72),rgba(111,229,255,0.98))] transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
                {goals.length > 2 && (
                  <Button variant="ghost" size="sm" asChild className="mt-1 h-7 w-full text-xs">
                    <Link href="/app/progress">
                      View all ({goals.length})
                    </Link>
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <TrendingUp className="h-4 w-4 text-primary" />
              Your Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <div className="space-y-3">
              {streak && (
                <div className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/[0.04] p-3">
                  <span className="text-xs text-muted-foreground">Current Streak</span>
                  <span className="font-bold text-base text-primary">{streak.current_streak} days</span>
                </div>
              )}
              {topMuscles.length > 0 && (
                <div className="rounded-2xl border border-white/8 bg-white/[0.04] p-3">
                  <p className="mb-2 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">Top Muscle Groups</p>
                  <div className="space-y-2">
                    {topMuscles.slice(0, 2).map((muscle: any) => (
                      <div key={muscle.id} className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground capitalize">
                          {muscle.muscle_group?.name || 'Unknown'}
                        </span>
                        <Badge variant="secondary" className="font-semibold">
                          Lvl {Math.round(muscle.level || 0)}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap gap-2">
        {!activePlan && (
          <Button variant="outline" size="sm" asChild>
            <Link href="/app/workouts/plans/new">
              <Calendar className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Create Plan</span>
              <span className="sm:hidden">Plan</span>
            </Link>
          </Button>
        )}
        {activePlan && !todayWorkout && (
          <Button variant="outline" size="sm" asChild>
            <Link href="/app/workouts">
              <Sparkles className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Generate Workout</span>
              <span className="sm:hidden">Generate</span>
            </Link>
          </Button>
        )}
        {activePlan && (
          <Button variant="outline" size="sm" asChild>
            <Link href={`/app/workouts/plans/${activePlan.id}`}>
              <Dumbbell className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">View Plan</span>
              <span className="sm:hidden">Plan</span>
            </Link>
          </Button>
        )}
        <Button variant="outline" size="sm" asChild>
          <Link href="/app/progress">
            <Target className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Goals</span>
            <span className="sm:hidden">Goal</span>
          </Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link href="/app/activity">
            <TrendingUp className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Activity</span>
            <span className="sm:hidden">Log</span>
          </Link>
        </Button>
      </div>
    </div>
  )
}
