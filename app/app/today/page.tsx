import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar, Zap, Target, Plus, ArrowRight, TrendingUp, CheckCircle2, Dumbbell, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import type { Profile, FitnessProfile, Goal, WorkoutPlan, WorkoutDay, UserStreak, CompletedWorkout } from '@/types/database'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

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
      const workoutDays = workoutDaysData as WorkoutDay[]
      const preferredDays = fitnessProfile?.preferred_training_days || []
      const dayIndex = preferredDays.findIndex((d) => parseInt(d) === today)
      
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

  const firstName = profile?.full_name?.split(' ')[0] || 'there'

  // Determine primary action
  let primaryAction: {
    title: string
    description: string
    subtext?: string
    icon: React.ReactNode
    button: { text: string; href: string }
    variant: 'workout' | 'setup' | 'goal' | 'rest'
  } | null = null

  if (!activePlan) {
    primaryAction = {
      title: 'Set Up Your Training Week',
      description: 'Create your weekly plan so Forge can schedule workouts and guide your progress.',
      icon: <Calendar className="h-8 w-8" />,
      button: { text: 'Create Weekly Plan', href: '/app/workouts/plans/new' },
      variant: 'setup',
    }
  } else if (todayWorkout) {
    primaryAction = {
      title: `${todayWorkout.name}`,
      description: `${todayWorkout.exercises?.length || 0} exercises • ${todayWorkout.estimated_duration || 45} min`,
      subtext: todayWorkout.target_muscles ? `Focus: ${(todayWorkout.target_muscles as string[]).join(', ')}` : undefined,
      icon: <Zap className="h-8 w-8" />,
      button: { text: 'Start Workout', href: `/app/workouts/plans/${activePlan.id}/start?dayId=${todayWorkout.id}` },
      variant: 'workout',
    }
  } else if (goals.length === 0) {
    primaryAction = {
      title: 'Add Your First Goal',
      description: 'Track what matters - whether it\'s strength, weight, or consistency.',
      icon: <Target className="h-8 w-8" />,
      button: { text: 'Add Goal', href: '/app/progress' },
      variant: 'goal',
    }
  } else {
    primaryAction = {
      title: 'Rest Day',
      description: 'Recovery is when your muscles grow. Take it easy today.',
      icon: <CheckCircle2 className="h-8 w-8" />,
      button: { text: 'Generate Workout', href: '/app/workouts' },
      variant: 'rest',
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          {format(new Date(), 'EEEE')}
        </h1>
        <p className="text-sm text-muted-foreground">
          {format(new Date(), 'MMMM d, yyyy')}
        </p>
      </div>

      {/* Primary Action Hero Card */}
      {primaryAction && (
        <Card className={`border-2 overflow-hidden ${
          primaryAction.variant === 'workout' 
            ? 'border-primary bg-gradient-to-br from-primary/10 via-primary/5 to-transparent' 
            : primaryAction.variant === 'setup'
            ? 'border-blue-500/30 bg-gradient-to-br from-blue-500/5 to-transparent'
            : primaryAction.variant === 'goal'
            ? 'border-purple-500/30 bg-gradient-to-br from-purple-500/5 to-transparent'
            : 'border-muted bg-gradient-to-br from-muted/30 to-transparent'
        }`}>
          <CardContent className="p-6 md:p-8">
            <div className="flex items-center justify-between gap-6">
              <div className="flex gap-4 items-start flex-1">
                <div className={`rounded-xl p-4 shrink-0 ${
                  primaryAction.variant === 'workout'
                    ? 'bg-primary text-primary-foreground'
                    : primaryAction.variant === 'setup'
                    ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400'
                    : primaryAction.variant === 'goal'
                    ? 'bg-purple-500/20 text-purple-600 dark:text-purple-400'
                    : 'bg-muted text-muted-foreground'
                }`}>
                  {primaryAction.icon}
                </div>
                <div className="flex-1">
                  <h2 className="text-xl md:text-2xl font-bold text-foreground">
                    {primaryAction.title}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {primaryAction.description}
                  </p>
                  {primaryAction.subtext && (
                    <p className="mt-2 text-xs text-muted-foreground/80 font-medium">
                      {primaryAction.subtext}
                    </p>
                  )}
                </div>
              </div>
              <Button asChild size="lg" className="shrink-0">
                <Link href={primaryAction.button.href}>
                  {primaryAction.button.text}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Today's Focus Card - Main content area */}
      {todayWorkout ? (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Today's Focus</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Duration</p>
                  <p className="text-lg font-semibold">{todayWorkout.estimated_duration || '--'} min</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Exercises</p>
                  <p className="text-lg font-semibold">{todayWorkout.exercises?.length || 0}</p>
                </div>
              </div>
            </div>
            {todayWorkout.target_muscles && todayWorkout.target_muscles.length > 0 && (
              <div className="pt-2 border-t">
                <p className="text-xs text-muted-foreground font-medium mb-2">Target Muscles</p>
                <div className="flex flex-wrap gap-1">
                  {(todayWorkout.target_muscles as string[]).map((muscle) => (
                    <Badge key={muscle} variant="secondary" className="text-xs">
                      {muscle}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ) : !activePlan ? (
        <Card className="border-dashed">
          <CardContent className="py-8">
            <div className="text-center">
              <div className="rounded-full bg-primary/10 p-3 w-fit mx-auto mb-3">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-sm">No workout scheduled</h3>
              <p className="text-xs text-muted-foreground mt-1">Create a plan to schedule workouts</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-dashed">
          <CardContent className="py-8">
            <div className="text-center">
              <div className="rounded-full bg-green-100 dark:bg-green-900/30 p-3 w-fit mx-auto mb-3">
                <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="font-semibold text-sm">Rest Day</h3>
              <p className="text-xs text-muted-foreground mt-1">Muscles grow during recovery</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Weekly Schedule - Compact inline */}
      {activePlan && (
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-3">This Week</p>
          <div className="grid grid-cols-7 gap-1.5">
            {DAYS.map((day, index) => {
              const isToday = new Date().getDay() === index
              const isTrainingDay = fitnessProfile?.preferred_training_days?.includes(String(index))
              return (
                <div
                  key={day}
                  className={`flex flex-col items-center justify-center rounded-lg border p-2 text-center text-xs font-medium transition-colors ${
                    isToday
                      ? 'border-primary bg-primary/10'
                      : isTrainingDay
                      ? 'border-border bg-muted/50'
                      : 'border-border bg-muted/20'
                  }`}
                >
                  <span className="text-xs text-muted-foreground">{day}</span>
                  <span className={`text-xs font-semibold mt-1 ${isTrainingDay ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {isTrainingDay ? 'Train' : 'Rest'}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Goals and Stats Snapshot Row */}
      <div className="grid gap-3 md:grid-cols-2">
        {/* Active Goals */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Target className="h-4 w-4" />
              Active Goals
            </CardTitle>
          </CardHeader>
          <CardContent>
            {goals.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-xs text-muted-foreground">No goals yet</p>
                <Button variant="ghost" size="sm" asChild className="mt-2 h-7">
                  <Link href="/app/progress">
                    <Plus className="mr-1 h-3 w-3" />
                    Add Goal
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {goals.slice(0, 2).map((goal) => {
                  const progress = goal.target_value > 0 ? (goal.current_value / goal.target_value) * 100 : 0
                  return (
                    <div key={goal.id} className="text-xs">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium">{goal.title}</span>
                        <span className="text-muted-foreground">{Math.round(progress)}%</span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all"
                          style={{ width: `${Math.min(progress, 100)}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
                {goals.length > 2 && (
                  <Button variant="ghost" size="sm" asChild className="w-full h-7">
                    <Link href="/app/progress">
                      View all
                      <ArrowRight className="ml-1 h-3 w-3" />
                    </Link>
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Streak and Stats */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Your Stats
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              {streak && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Current Streak</span>
                  <span className="font-bold text-lg">{streak.current_streak}</span>
                </div>
              )}
              {topMuscles.length > 0 && (
                <div className="pt-2 border-t">
                  <p className="text-xs text-muted-foreground font-medium mb-2">Top Muscle Groups</p>
                  <div className="space-y-1">
                    {topMuscles.slice(0, 2).map((muscle: any) => (
                      <div key={muscle.id} className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground capitalize">
                          {muscle.muscle_group?.name || muscle.muscle_group}
                        </span>
                        <Badge variant="outline" className="text-xs">
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

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {!activePlan && (
          <Button variant="outline" size="sm" asChild className="h-10">
            <Link href="/app/workouts/plans/new">
              <Calendar className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Create Plan</span>
              <span className="sm:hidden">Plan</span>
            </Link>
          </Button>
        )}
        {activePlan && !todayWorkout && (
          <Button variant="outline" size="sm" asChild className="h-10">
            <Link href="/app/workouts">
              <Sparkles className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Generate</span>
              <span className="sm:hidden">Gen</span>
            </Link>
          </Button>
        )}
        {activePlan && (
          <Button variant="outline" size="sm" asChild className="h-10">
            <Link href="/app/workouts">
              <Dumbbell className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Workouts</span>
              <span className="sm:hidden">Work</span>
            </Link>
          </Button>
        )}
        <Button variant="outline" size="sm" asChild className="h-10">
          <Link href="/app/progress">
            <Target className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Goals</span>
            <span className="sm:hidden">Goal</span>
          </Link>
        </Button>
        <Button variant="outline" size="sm" asChild className="h-10">
          <Link href="/app/activity">
            <TrendingUp className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Activity</span>
            <span className="sm:hidden">Act</span>
          </Link>
        </Button>
      </div>
    </div>
  )
}
