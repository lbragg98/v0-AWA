'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { PlanAdjustmentsPanel } from '@/components/workouts/plan-adjustments-panel'
import { analyzeWorkoutPlan, type PlanAnalysis } from '@/lib/adaptive-planning'
import type {
  WorkoutPlan,
  WorkoutDay,
  WorkoutExercise,
  ExerciseLibrary,
  MuscleProgress,
  CompletedWorkout,
  FitnessProfile,
  Goal,
} from '@/types/database'

export default function PlanDetailPage({ params }: { params: { planId: string } }) {
  const router = useRouter()
  const supabase = createClient()
  const [plan, setPlan] = useState<WorkoutPlan | null>(null)
  const [workoutDays, setWorkoutDays] = useState<WorkoutDay[]>([])
  const [analysis, setAnalysis] = useState<PlanAnalysis | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showAnalysis, setShowAnalysis] = useState(false)

  useEffect(() => {
    const fetchPlan = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      try {
        // Fetch plan
        const { data: planData } = await supabase
          .from('workout_plans')
          .select('*')
          .eq('id', params.planId)
          .eq('user_id', user.id)
          .single()

        if (!planData) {
          router.push('/app/workouts')
          return
        }

        setPlan(planData as WorkoutPlan)

        // Fetch workout days
        const { data: daysData } = await supabase
          .from('workout_days')
          .select('*')
          .eq('workout_plan_id', params.planId)
          .order('day_number')

        setWorkoutDays((daysData || []) as WorkoutDay[])

        // Fetch data for analysis
        const [exercisesRes, muscleRes, workoutsRes, fitnessRes, goalsRes] = await Promise.all([
          supabase.from('exercise_library').select('*'),
          supabase.from('muscle_progress').select('*, muscle_group:muscle_groups(*)').eq('user_id', user.id),
          supabase
            .from('completed_workouts')
            .select('*')
            .eq('user_id', user.id)
            .order('started_at', { ascending: false })
            .limit(20),
          supabase.from('fitness_profiles').select('*').eq('user_id', user.id).single(),
          supabase.from('goals').select('*').eq('user_id', user.id),
        ])

        // Build workout exercises map
        const exercisesMap = new Map<string, WorkoutExercise[]>()
        if (daysData && daysData.length > 0) {
          const { data: allExercises } = await supabase
            .from('workout_exercises')
            .select('*')
            .in(
              'workout_day_id',
              daysData.map((d) => d.id)
            )

          if (allExercises) {
            allExercises.forEach((ex) => {
              if (!exercisesMap.has(ex.workout_day_id)) {
                exercisesMap.set(ex.workout_day_id, [])
              }
              exercisesMap.get(ex.workout_day_id)!.push(ex as WorkoutExercise)
            })
          }
        }

        // Run analysis
        const planAnalysis = analyzeWorkoutPlan(
          planData as WorkoutPlan,
          (daysData || []) as WorkoutDay[],
          exercisesMap,
          (exercisesRes.data || []) as ExerciseLibrary[],
          (muscleRes.data || []) as MuscleProgress[],
          (workoutsRes.data || []) as CompletedWorkout[],
          (fitnessRes.data || null) as FitnessProfile | null,
          (goalsRes.data || []) as Goal[]
        )

        setAnalysis(planAnalysis)
      } catch (error) {
        console.error('[v0] Error loading plan:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchPlan()
  }, [params.planId])

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" asChild>
          <Link href="/app/workouts">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">Loading plan...</p>
        </Card>
      </div>
    )
  }

  if (!plan) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" asChild>
          <Link href="/app/workouts">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">Plan not found</p>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" asChild size="sm">
            <Link href="/app/workouts">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{plan.name}</h1>
            <p className="text-muted-foreground mt-1">
              {workoutDays.length} days/week • {plan.experience_level} • {plan.goal}
            </p>
          </div>
        </div>
        <Button
          onClick={() => setShowAnalysis(!showAnalysis)}
          variant={showAnalysis ? 'default' : 'outline'}
        >
          <Sparkles className="mr-2 h-4 w-4" />
          {showAnalysis ? 'Hide' : 'Show'} Analysis
        </Button>
      </div>

      {/* Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-4">
          {showAnalysis && analysis ? (
            <PlanAdjustmentsPanel analysis={analysis} />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Workout Days</CardTitle>
                <CardDescription>{workoutDays.length} training sessions per week</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {workoutDays.map((day) => (
                  <Link
                    key={day.id}
                    href={`/app/workouts/plans/${params.planId}/days/${day.id}`}
                    className="block"
                  >
                    <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 hover:border-foreground/30 transition-colors cursor-pointer">
                      <div className="flex-1">
                        <p className="font-medium">{day.name}</p>
                        {day.target_muscles && day.target_muscles.length > 0 && (
                          <p className="text-sm text-muted-foreground">
                            Focus: {(day.target_muscles as string[]).join(', ')}
                          </p>
                        )}
                      </div>
                      <Badge variant="outline">{day.estimated_duration || '—'} min</Badge>
                    </div>
                  </Link>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Plan Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Goal</span>
                <span className="font-medium capitalize">{plan.goal?.replace('_', ' ')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Experience</span>
                <span className="font-medium capitalize">{plan.experience_level}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Days/Week</span>
                <span className="font-medium">{plan.days_per_week}</span>
              </div>
              <div className="flex justify-between pt-2 border-t">
                <span className="text-muted-foreground">Status</span>
                <Badge variant={plan.is_active ? 'default' : 'secondary'}>
                  {plan.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Button asChild className="w-full" variant="outline">
            <Link href={`/app/workouts/plans/new?edit=${plan.id}`}>Edit Plan</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
