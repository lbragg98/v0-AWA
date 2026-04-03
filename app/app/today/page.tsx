import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar, Zap, Target, Plus, ArrowRight, TrendingUp, CheckCircle2, Dumbbell, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import type { Profile, FitnessProfile, Goal, WorkoutPlan, WorkoutDay, UserStreak } from '@/types/database'

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

  // Determine primary action with correct priority
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
    // New user: no plan yet
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
    // User has a workout scheduled for today
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
    // Has plan but no workout today, and no goals
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
    // Has plan and goals, no workout today (rest day)
    primaryAction = {
      title: 'Generate Today\'s Workout',
      description: 'Or take a rest day - recovery is essential for progress.',
      icon: <Sparkles className="h-8 w-8" />,
      buttons: [
        { text: 'Generate Workout', href: '/app/workouts', variant: 'default' },
        { text: 'View Weekly Plan', href: `/app/workouts/plans/${activePlan.id}`, variant: 'outline' },
      ],
      type: 'generate',
    }
  }

  return (
    <div className="space-y-5">
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
          primaryAction.type === 'workout' 
            ? 'border-primary bg-gradient-to-br from-primary/10 via-primary/5 to-transparent' 
            : primaryAction.type === 'setup'
            ? 'border-blue-500/30 bg-gradient-to-br from-blue-500/5 to-transparent'
            : primaryAction.type === 'generate'
            ? 'border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-transparent'
            : 'border-muted bg-gradient-to-br from-muted/30 to-transparent'
        }`}>
          <CardContent className="p-6 md:p-8">
            <div className="flex flex-col md:flex-row md:items-center gap-6">
              <div className="flex gap-4 items-start flex-1">
                <div className={`rounded-xl p-4 shrink-0 ${
                  primaryAction.type === 'workout'
                    ? 'bg-primary text-primary-foreground'
                    : primaryAction.type === 'setup'
                    ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400'
                    : primaryAction.type === 'generate'
                    ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
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
              <div className="flex gap-2 shrink-0 flex-col-reverse md:flex-col">
                {primaryAction.buttons.map((button, i) => (
                  <Button 
                    key={i}
                    asChild 
                    size={i === 0 ? 'lg' : 'sm'}
                    variant={button.variant as any || 'default'}
                    className={i > 0 ? 'hidden md:flex' : ''}
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

      {/* Today's Focus Card */}
      {todayWorkout ? (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Dumbbell className="h-4 w-4" />
              Today's Focus
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Duration</p>
                <p className="font-semibold">{todayWorkout.estimated_duration || '--'} min</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Exercises</p>
                <p className="font-semibold">{todayWorkout.exercises?.length || 0}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Intensity</p>
                <p className="font-semibold text-amber-600 dark:text-amber-400">Moderate</p>
              </div>
            </div>
            {todayWorkout.target_muscles && todayWorkout.target_muscles.length > 0 && (
              <div className="pt-3 border-t">
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
            <Button asChild className="w-full mt-4">
              <Link href={`/app/workouts/plans/${activePlan?.id}/start?dayId=${todayWorkout.id}`}>
                <Zap className="mr-2 h-4 w-4" />
                Start Workout
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : !activePlan ? (
        <Card className="border-dashed">
          <CardContent className="py-6">
            <div className="text-center">
              <div className="rounded-full bg-blue-500/10 p-3 w-fit mx-auto mb-3">
                <Calendar className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="font-semibold text-sm">No Plan Yet</h3>
              <p className="text-xs text-muted-foreground mt-1">Create a weekly plan to schedule your workouts</p>
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
        <Card className="border-dashed">
          <CardContent className="py-6">
            <div className="text-center">
              <div className="rounded-full bg-green-100 dark:bg-green-900/30 p-3 w-fit mx-auto mb-3">
                <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="font-semibold text-sm">No Workout Today</h3>
              <p className="text-xs text-muted-foreground mt-1">You&apos;re scheduled to rest. Recovery is when muscles grow!</p>
              <div className="flex gap-2 justify-center mt-3">
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

      {/* Weekly Schedule */}
      {activePlan ? (
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">This Week's Schedule</p>
          <div className="grid grid-cols-7 gap-1.5">
            {DAYS.map((day, index) => {
              const isToday = new Date().getDay() === index
              const isTrainingDay = fitnessProfile?.preferred_training_days?.includes(String(index))
              return (
                <div
                  key={day}
                  className={`flex flex-col items-center justify-center rounded-lg border p-2.5 text-center transition-all ${
                    isToday
                      ? 'border-primary bg-primary/15 ring-2 ring-primary/30'
                      : isTrainingDay
                      ? 'border-border bg-muted/50 hover:bg-muted/70'
                      : 'border-border/50 bg-muted/20 hover:bg-muted/30'
                  }`}
                >
                  <span className="text-xs font-medium text-muted-foreground">{day}</span>
                  <span className={`text-xs font-bold mt-1 ${isTrainingDay ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {isTrainingDay ? '💪' : '😴'}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      ) : null}

      {/* Goals and Stats */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Active Goals */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Target className="h-4 w-4" />
              Active Goals
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            {goals.length === 0 ? (
              <div className="text-center py-3">
                <p className="text-xs text-muted-foreground">No goals yet</p>
                <Button variant="ghost" size="sm" asChild className="mt-2 h-7 w-full">
                  <Link href="/app/progress">
                    <Plus className="mr-1 h-3 w-3" />
                    Add Goal
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {goals.slice(0, 2).map((goal) => {
                  const progress = goal.target_value > 0 ? Math.min((goal.current_value / goal.target_value) * 100, 100) : 0
                  return (
                    <div key={goal.id}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-xs">{goal.title}</span>
                        <span className="text-xs font-semibold text-primary">{Math.round(progress)}%</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
                {goals.length > 2 && (
                  <Button variant="ghost" size="sm" asChild className="w-full h-7 text-xs mt-1">
                    <Link href="/app/progress">
                      View all ({goals.length})
                    </Link>
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stats Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Your Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <div className="space-y-2">
              {streak && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Current Streak</span>
                  <span className="font-bold text-base text-primary">{streak.current_streak} days</span>
                </div>
              )}
              {topMuscles.length > 0 && (
                <div className="pt-2 border-t space-y-1">
                  <p className="text-xs text-muted-foreground font-medium">Top Muscle Groups</p>
                  {topMuscles.slice(0, 2).map((muscle: any) => (
                    <div key={muscle.id} className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground capitalize">
                        {muscle.muscle_group?.name || 'Unknown'}
                      </span>
                      <Badge variant="secondary" className="text-xs font-semibold">
                        Lvl {Math.round(muscle.level || 0)}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
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
