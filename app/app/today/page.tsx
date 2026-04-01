import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import { Calendar, Zap, Target, Plus, ArrowRight, TrendingUp, CheckCircle2, AlertCircle, Dumbbell } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import type { Profile, FitnessProfile, Goal, WorkoutPlan, WorkoutDay, UserStreak, CompletedWorkout } from '@/types/database'

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export default async function TodayPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Fetch all necessary data in parallel
  const [
    profileResult,
    fitnessProfileResult,
    goalsResult,
    plansResult,
    streakResult,
    completedWorkoutsResult,
    muscleProgressResult,
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
      .from('goals')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false }),
    supabase
      .from('workout_plans')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single(),
    supabase
      .from('user_streaks')
      .select('*')
      .eq('user_id', user.id)
      .single(),
    supabase
      .from('completed_workouts')
      .select('*')
      .eq('user_id', user.id)
      .order('completed_at', { ascending: false })
      .limit(1),
    supabase
      .from('muscle_progress')
      .select('*, muscle_group:muscle_groups(*)')
      .eq('user_id', user.id)
      .order('level', { ascending: false })
      .limit(5),
  ])

  const profile = profileResult.data as Profile | null
  const fitnessProfile = fitnessProfileResult.data as FitnessProfile | null
  const goals = (goalsResult.data || []) as Goal[]
  const activePlan = plansResult.data as WorkoutPlan | null
  const streak = streakResult.data as UserStreak | null
  const lastWorkout = (completedWorkoutsResult.data || [])[0] as CompletedWorkout | null
  const topMuscles = (muscleProgressResult.data || [])

  // Get today's workout day if plan exists
  let todayWorkout: (WorkoutDay & { exercises?: any[] }) | null = null
  if (activePlan) {
    const today = new Date().getDay()
    const { data: workoutDaysData } = await supabase
      .from('workout_days')
      .select('*')
      .eq('workout_plan_id', activePlan.id)
      .order('day_number')

    if (workoutDaysData && workoutDaysData.length > 0) {
      // Get today's workout from the week schedule
      const workoutDays = workoutDaysData as WorkoutDay[]
      const preferredDays = fitnessProfile?.preferred_training_days || []
      const dayIndex = preferredDays.findIndex((d) => parseInt(d) === today)
      
      if (dayIndex >= 0 && workoutDays[dayIndex]) {
        todayWorkout = workoutDays[dayIndex]
        // Fetch exercises for today's workout
        const { data: exercisesData } = await supabase
          .from('workout_exercises')
          .select('*')
          .eq('workout_day_id', todayWorkout.id)
          .order('order_index')
        todayWorkout.exercises = exercisesData || []
      }
    }
  }

  const firstName = profile?.full_name?.split(' ')[0] || 'there'

  // Determine setup progress (for first-time users)
  const setupSteps = {
    hasPlan: !!activePlan,
    hasGoals: goals.length > 0,
    hasCompletedWorkout: !!lastWorkout,
  }
  const setupProgress = Object.values(setupSteps).filter(Boolean).length
  const isNewUser = setupProgress < 2

  // Determine primary action with clear priority
  let primaryAction: {
    title: string
    description: string
    subtext?: string
    icon: React.ReactNode
    button: { text: string; href: string }
    variant: 'workout' | 'setup' | 'goal'
    stepNumber?: number
  } | null = null

  if (!activePlan) {
    primaryAction = {
      title: 'Create Your First Workout Plan',
      description: 'This is where it all starts. A plan helps Forge recommend the right workouts for your goals and schedule.',
      subtext: 'Takes about 2 minutes',
      icon: <Calendar className="h-8 w-8" />,
      button: { text: 'Create My Plan', href: '/app/workouts/plans/new' },
      variant: 'setup',
      stepNumber: 1,
    }
  } else if (todayWorkout) {
    primaryAction = {
      title: `Ready for ${todayWorkout.name}?`,
      description: `${todayWorkout.exercises?.length || 0} exercises • ${todayWorkout.estimated_duration || 45} minutes`,
      subtext: todayWorkout.target_muscles ? `Focus: ${(todayWorkout.target_muscles as string[]).join(', ')}` : undefined,
      icon: <Zap className="h-8 w-8" />,
      button: { text: 'Start Workout Now', href: `/app/workouts/plans/${activePlan.id}/start?dayId=${todayWorkout.id}` },
      variant: 'workout',
    }
  } else if (goals.length === 0) {
    primaryAction = {
      title: 'Set a Fitness Goal',
      description: 'Goals keep you focused. Whether it\'s strength, weight, or consistency - track what matters to you.',
      subtext: 'You can always add more later',
      icon: <Target className="h-8 w-8" />,
      button: { text: 'Add My First Goal', href: '/app/progress' },
      variant: 'goal',
      stepNumber: 2,
    }
  } else {
    // Has plan, no workout today, has goals - rest day with options
    primaryAction = null
  }

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          Welcome back, {firstName}
        </h1>
        <p className="mt-1 text-muted-foreground">
          {format(new Date(), 'EEEE, MMMM d, yyyy')}
        </p>
      </div>

      {/* Primary Action Card - Large and Unmissable */}
      {primaryAction && (
        <Card className={`border-2 overflow-hidden ${
          primaryAction.variant === 'workout' 
            ? 'border-primary bg-gradient-to-br from-primary/10 via-primary/5 to-transparent' 
            : 'border-primary/30 bg-gradient-to-br from-primary/5 to-transparent'
        }`}>
          <CardContent className="p-6 md:p-8">
            {primaryAction.stepNumber && (
              <Badge variant="outline" className="mb-4 text-primary border-primary/30">
                Step {primaryAction.stepNumber} of 3
              </Badge>
            )}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex gap-4 items-start">
                <div className={`rounded-xl p-4 ${
                  primaryAction.variant === 'workout'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-primary/10 text-primary'
                }`}>
                  {primaryAction.icon}
                </div>
                <div className="flex-1">
                  <h2 className="text-xl md:text-2xl font-bold text-foreground">
                    {primaryAction.title}
                  </h2>
                  <p className="mt-2 text-muted-foreground max-w-md">
                    {primaryAction.description}
                  </p>
                  {primaryAction.subtext && (
                    <p className="mt-1 text-sm text-muted-foreground/80">
                      {primaryAction.subtext}
                    </p>
                  )}
                </div>
              </div>
              <Button asChild size="lg" className={`h-12 px-8 text-base font-semibold shrink-0 ${
                primaryAction.variant === 'workout' ? '' : ''
              }`}>
                <Link href={primaryAction.button.href}>
                  {primaryAction.button.text}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Rest Day Card - when user has plan but no workout today */}
      {!primaryAction && activePlan && !todayWorkout && (
        <Card className="border-2 border-muted bg-gradient-to-br from-muted/30 to-transparent">
          <CardContent className="p-6 md:p-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex gap-4 items-start">
                <div className="rounded-xl bg-muted p-4">
                  <CheckCircle2 className="h-8 w-8 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl md:text-2xl font-bold text-foreground">
                    Rest Day - You&apos;ve Earned It
                  </h2>
                  <p className="mt-2 text-muted-foreground max-w-md">
                    Recovery is when your muscles grow. Take it easy today, or do some light stretching.
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" asChild>
                  <Link href="/app/activity">
                    View Progress
                  </Link>
                </Button>
                <Button variant="ghost" asChild>
                  <Link href="/app/workouts">
                    Browse Workouts
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Today's Workout */}
          {todayWorkout ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Dumbbell className="h-5 w-5" />
                  Today&apos;s Workout
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold">{todayWorkout.name}</h3>
                  {todayWorkout.target_muscles && todayWorkout.target_muscles.length > 0 && (
                    <p className="text-sm text-muted-foreground">
                      Focus: {(todayWorkout.target_muscles as string[]).join(', ')}
                    </p>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Duration</p>
                    <p className="font-semibold">{todayWorkout.estimated_duration || '--'} min</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Exercises</p>
                    <p className="font-semibold">{todayWorkout.exercises?.length || 0}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Status</p>
                    <p className="font-semibold text-amber-600">Not Started</p>
                  </div>
                </div>
                <Button asChild className="w-full">
                  <Link href={`/app/workouts/plans/${activePlan?.id}/start?dayId=${todayWorkout.id}`}>
                    <Zap className="mr-2 h-4 w-4" />
                    Start Workout
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : !activePlan ? (
            <Card className="border-dashed">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Dumbbell className="h-5 w-5" />
                  Today&apos;s Workout
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                <div className="rounded-full bg-primary/10 p-4">
                  <Calendar className="h-8 w-8 text-primary" />
                </div>
                <h3 className="mt-4 font-semibold">No Plan Yet</h3>
                <p className="mt-2 text-sm text-muted-foreground max-w-xs">
                  Create a workout plan to see your daily workouts here. Forge will schedule workouts based on your availability.
                </p>
                <Button variant="outline" size="sm" asChild className="mt-4">
                  <Link href="/app/workouts/plans/new">
                    <Plus className="mr-2 h-4 w-4" />
                    Create Plan
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Dumbbell className="h-5 w-5" />
                  Today&apos;s Workout
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                <div className="rounded-full bg-green-100 dark:bg-green-900/30 p-4">
                  <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="mt-4 font-semibold">Rest Day</h3>
                <p className="mt-2 text-sm text-muted-foreground max-w-xs">
                  No workout scheduled today. Your muscles grow during rest - enjoy the recovery!
                </p>
              </CardContent>
            </Card>
          )}

          {/* Goals */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Active Goals
              </CardTitle>
            </CardHeader>
            <CardContent>
              {goals.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="rounded-full bg-primary/10 p-4">
                    <Target className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="mt-4 font-semibold">Track What Matters</h3>
                  <p className="mt-2 text-sm text-muted-foreground max-w-xs">
                    Set goals like &quot;Bench 200 lbs&quot; or &quot;Workout 4x per week&quot; to stay focused and see your progress over time.
                  </p>
                  <Button variant="outline" size="sm" asChild className="mt-4">
                    <Link href="/app/progress">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Your First Goal
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {goals.slice(0, 3).map((goal) => {
                    const progress = goal.target_value > 0 ? (goal.current_value / goal.target_value) * 100 : 0
                    return (
                      <div key={goal.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{goal.title}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {goal.current_value} / {goal.target_value} {goal.unit || ''}
                          </p>
                        </div>
                        <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary transition-all"
                            style={{ width: `${Math.min(progress, 100)}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                  {goals.length > 3 && (
                    <Button variant="ghost" size="sm" asChild className="w-full">
                      <Link href="/app/progress">
                        View all {goals.length} goals
                        <ArrowRight className="ml-2 h-3 w-3" />
                      </Link>
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Weekly Schedule */}
          {activePlan ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  This Week
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-7 gap-2">
                  {DAYS.map((day, index) => {
                    const isToday = new Date().getDay() === index
                    const isTrainingDay = fitnessProfile?.preferred_training_days?.includes(String(index))
                    return (
                      <div
                        key={day}
                        className={`flex flex-col items-center gap-2 rounded-lg border p-3 text-center text-xs font-medium transition-colors ${
                          isToday
                            ? 'border-primary bg-primary/5'
                            : isTrainingDay
                            ? 'border-border bg-muted/50'
                            : 'border-border bg-muted/20'
                        }`}
                      >
                        <span className="text-xs text-muted-foreground">{day.slice(0, 1)}</span>
                        <span className={isTrainingDay ? 'text-foreground' : 'text-muted-foreground'}>
                          {isTrainingDay ? 'Train' : 'Rest'}
                        </span>
                      </div>
                    )
                  })}
                </div>
                <Button variant="ghost" size="sm" asChild className="w-full mt-4">
                  <Link href="/app/workouts">
                    View Full Plan
                    <ArrowRight className="ml-2 h-3 w-3" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-dashed">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  This Week
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center py-6 text-center">
                <p className="text-sm text-muted-foreground">
                  Your weekly schedule will appear here once you create a plan.
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Stats */}
          <div className="grid gap-3">
            {streak && (
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-amber-100 dark:bg-amber-900/30 p-3 text-amber-600 dark:text-amber-400">
                      <TrendingUp className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Current Streak</p>
                      <p className="text-2xl font-bold">{streak.current_streak}</p>
                      <p className="text-xs text-muted-foreground">days</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-green-100 dark:bg-green-900/30 p-3 text-green-600 dark:text-green-400">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Active Goals</p>
                    <p className="text-2xl font-bold">{goals.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" size="sm" className="w-full justify-start" asChild>
                <Link href="/app/workouts/plans/new">
                  <Plus className="mr-2 h-4 w-4" />
                  New Plan
                </Link>
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start" asChild>
                <Link href="/app/workouts">
                  <Dumbbell className="mr-2 h-4 w-4" />
                  Workouts
                </Link>
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start" asChild>
                <Link href="/app/progress">
                  <Target className="mr-2 h-4 w-4" />
                  Goals
                </Link>
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start" asChild>
                <Link href="/app/activity">
                  <TrendingUp className="mr-2 h-4 w-4" />
                  Activity
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Top Muscles */}
          {topMuscles.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Top Muscle Groups</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {topMuscles.map((muscle) => (
                  <div key={muscle.id} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {muscle.muscle_group?.display_name || muscle.muscle_group?.name || 'Unknown'}
                    </span>
                    <Badge variant="secondary">Lvl {muscle.level}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
